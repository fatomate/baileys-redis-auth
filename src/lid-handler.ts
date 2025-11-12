/**
 * LID Format Handler for WhatsApp Web
 * 
 * WhatsApp uses two JID formats:
 * 1. Phone format: 60196953307@s.whatsapp.net (traditional)
 * 2. LID format: 114194640801953@lid (newer format used by mobile apps)
 * 
 * This module provides utilities to handle LID format correlation
 */

// Constants (configurable per session via configureLidHandler)
let DEFAULT_LID_MAPPING_TTL = 604800 // 7 days in seconds
let DEFAULT_LID_CACHE_SIZE = 10000 // Max number of cached mappings per session

const sessionMappingOverrides = new Map<string, number>()
const sessionCacheLimits = new Map<string, number>()

// Memory cache for LID mappings (per session)
const lidCache = new Map<string, Map<string, string>>()
const phoneCache = new Map<string, Map<string, string>>()

const trimCacheToLimit = (cache: Map<string, string>, limit: number): void => {
  if (!cache) return
  while (cache.size > limit) {
    const firstKey = cache.keys().next().value
    if (!firstKey) break
    cache.delete(firstKey)
  }
}

const getCacheLimit = (sessionId: string): number => {
  return sessionCacheLimits.get(sessionId) ?? DEFAULT_LID_CACHE_SIZE
}

const getMappingTtl = (sessionId: string, ttlOverride?: number): number => {
  if (typeof ttlOverride === 'number') {
    return ttlOverride
  }
  if (sessionMappingOverrides.has(sessionId)) {
    return sessionMappingOverrides.get(sessionId)!
  }
  return DEFAULT_LID_MAPPING_TTL
}

export const configureLidHandler = (
  sessionId: string,
  options: {
    cacheSize?: number
    mappingTTL?: number
  } = {}
): void => {
  if (typeof options.mappingTTL === 'number' && options.mappingTTL >= 0) {
    sessionMappingOverrides.set(sessionId, options.mappingTTL)
  }

  if (typeof options.cacheSize === 'number' && options.cacheSize > 0) {
    const normalized = Math.max(1, Math.floor(options.cacheSize))
    sessionCacheLimits.set(sessionId, normalized)
    const lid = lidCache.get(sessionId)
    if (lid) {
      trimCacheToLimit(lid, normalized)
    }
    const phone = phoneCache.get(sessionId)
    if (phone) {
      trimCacheToLimit(phone, normalized)
    }
  }
}

/**
 * Check if a JID is in LID format
 */
export const isLidFormat = (jid: string): boolean => {
  return !!jid && typeof jid === 'string' && jid.includes('@lid')
}

/**
 * Check if a JID is in phone format
 */
export const isPhoneFormat = (jid: string): boolean => {
  return !!jid && typeof jid === 'string' && jid.includes('@s.whatsapp.net')
}

/**
 * Extract numeric ID from JID (works for both formats)
 */
export const extractNumericId = (jid: string): string | null => {
  if (!jid || typeof jid !== 'string') return null
  
  const match = jid.match(/^(\d+)@/)
  return match ? match[1] : null
}

const normalizeMappingKey = (value: string): string => {
  if (!value || typeof value !== 'string') {
    return ''
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  return trimmed.replace(/([:.]\d+)(?=@|$)/g, '')
}

/**
 * Store a bidirectional LID to phone number mapping
 */
export async function storeLidMapping(
  redis: any,
  sessionId: string,
  lid: string,
  phoneNumber: string,
  keyPrefix: string = 'baileys:session:',
  ttl?: number,
  options?: {
    force?: boolean
  }
): Promise<void> {
  try {
    const normalizedLid = normalizeMappingKey(lid)
    const normalizedPhone = normalizeMappingKey(phoneNumber)

    if (!normalizedLid || !normalizedPhone) {
      console.warn('[LidHandler] Skipping mapping with empty normalized values', {
        lid,
        phoneNumber
      })
      return
    }

    const lidKey = `${keyPrefix}lid:${sessionId}:${normalizedLid}`
    const phoneKey = `${keyPrefix}lid:reverse:${sessionId}:${normalizedPhone}`

    const existingPhone = await getLidMapping(redis, sessionId, normalizedLid, keyPrefix)
    const existingNormalizedPhone = normalizeMappingKey(existingPhone || '')
    const existingLid = await getReverseLidMapping(redis, sessionId, normalizedPhone, keyPrefix)
    const existingNormalizedLid = normalizeMappingKey(existingLid || '')

    const cachedLidMap = lidCache.get(sessionId)
    const cachedPhoneMap = phoneCache.get(sessionId)

    const forceReplace = options?.force ?? false

    if (existingNormalizedPhone && existingNormalizedPhone !== normalizedPhone) {
      if (!forceReplace) {
        console.warn('[LidHandler] Conflict detected, keeping existing phone mapping for LID', {
          sessionId,
          lid: normalizedLid,
          attemptedPhone: normalizedPhone,
          existingPhone: existingNormalizedPhone
        })
        return
      }

      console.warn('[LidHandler] Replacing phone mapping for LID', {
        sessionId,
        lid: normalizedLid,
        newPhone: normalizedPhone,
        previousPhone: existingNormalizedPhone,
        forced: true
      })
      await redis.del(lidKey)
      await redis.del(`${keyPrefix}lid:reverse:${sessionId}:${existingNormalizedPhone}`)
      cachedLidMap?.delete(normalizedLid)
      cachedPhoneMap?.delete(existingNormalizedPhone)
    }

    if (existingNormalizedLid && existingNormalizedLid !== normalizedLid) {
      if (!forceReplace) {
        console.warn('[LidHandler] Conflict detected, keeping existing LID mapping for phone', {
          sessionId,
          phoneNumber: normalizedPhone,
          attemptedLid: normalizedLid,
          existingLid: existingNormalizedLid
        })
        return
      }

      console.warn('[LidHandler] Replacing LID mapping for phone', {
        sessionId,
        phoneNumber: normalizedPhone,
        newLid: normalizedLid,
        previousLid: existingNormalizedLid,
        forced: true
      })
      await redis.del(`${keyPrefix}lid:${sessionId}:${existingNormalizedLid}`)
      await redis.del(phoneKey)
      cachedLidMap?.delete(existingNormalizedLid)
      cachedPhoneMap?.delete(normalizedPhone)
    }

    const effectiveTtl = getMappingTtl(sessionId, ttl)
    const cacheLimit = getCacheLimit(sessionId)

    // Store in Redis
    
    // Use appropriate Redis method for setting with TTL
    if (effectiveTtl > 0) {
      if (typeof redis.setex === 'function' || typeof redis.setEx === 'function') {
        const setMethod = redis.setex ? 'setex' : 'setEx'
        await Promise.all([
          redis[setMethod](lidKey, effectiveTtl, phoneNumber),
          redis[setMethod](phoneKey, effectiveTtl, lid)
        ])
      } else {
        await Promise.all([
          redis.set(lidKey, phoneNumber, 'EX', effectiveTtl),
          redis.set(phoneKey, lid, 'EX', effectiveTtl)
        ])
      }
    } else {
      await Promise.all([
        redis.set(lidKey, phoneNumber),
        redis.set(phoneKey, lid)
      ])
    }
    
    // Update memory cache
    if (!lidCache.has(sessionId)) {
      lidCache.set(sessionId, new Map())
    }
    if (!phoneCache.has(sessionId)) {
      phoneCache.set(sessionId, new Map())
    }

    const sessionLidCache = lidCache.get(sessionId)!
    const sessionPhoneCache = phoneCache.get(sessionId)!

    if (sessionLidCache.size >= cacheLimit) {
      trimCacheToLimit(sessionLidCache, cacheLimit - 1)
    }
    if (sessionPhoneCache.size >= cacheLimit) {
      trimCacheToLimit(sessionPhoneCache, cacheLimit - 1)
    }
    
    sessionLidCache.set(normalizedLid, normalizedPhone)
    sessionPhoneCache.set(normalizedPhone, normalizedLid)

  } catch (error) {
    console.error(`[LID Handler] Error storing LID mapping:`, error)
  }
}

/**
 * Get phone number for a given LID
 */
export async function getLidMapping(
  redis: any,
  sessionId: string,
  lid: string,
  keyPrefix: string = 'baileys:session:'
): Promise<string | null> {
  try {
    const normalizedLid = normalizeMappingKey(lid)
    if (!normalizedLid) {
      return null
    }

    const cacheLimit = getCacheLimit(sessionId)

    // Check memory cache first
    const sessionCache = lidCache.get(sessionId)
    if (sessionCache?.has(normalizedLid)) {
      return sessionCache.get(normalizedLid)!
    }
    
    // Check Redis
    const key = `${keyPrefix}lid:${sessionId}:${normalizedLid}`
    const phoneNumber = await redis.get(key)
    
    if (phoneNumber) {
      // Update cache
      if (!lidCache.has(sessionId)) {
        lidCache.set(sessionId, new Map())
      }
      const sessionLidCache = lidCache.get(sessionId)!
      if (sessionLidCache.size >= cacheLimit) {
        trimCacheToLimit(sessionLidCache, cacheLimit - 1)
      }
      sessionLidCache.set(normalizedLid, normalizeMappingKey(phoneNumber) || phoneNumber)
      return phoneNumber
    }
    
    return null
  } catch (error) {
    console.error(`[LID Handler] Error getting LID mapping:`, error)
    return null
  }
}

/**
 * Get LID for a given phone number (reverse lookup)
 */
export async function getReverseLidMapping(
  redis: any,
  sessionId: string,
  phoneNumber: string,
  keyPrefix: string = 'baileys:session:'
): Promise<string | null> {
  try {
    const normalizedPhone = normalizeMappingKey(phoneNumber)
    if (!normalizedPhone) {
      return null
    }

    // Check memory cache first
    const cacheLimit = getCacheLimit(sessionId)

    const sessionCache = phoneCache.get(sessionId)
    if (sessionCache?.has(normalizedPhone)) {
      return sessionCache.get(normalizedPhone)!
    }
    
    // Check Redis
    const key = `${keyPrefix}lid:reverse:${sessionId}:${normalizedPhone}`
    const lid = await redis.get(key)
    
    if (lid) {
      // Update cache
      if (!phoneCache.has(sessionId)) {
        phoneCache.set(sessionId, new Map())
      }
      const sessionPhoneCache = phoneCache.get(sessionId)!
      if (sessionPhoneCache.size >= cacheLimit) {
        trimCacheToLimit(sessionPhoneCache, cacheLimit - 1)
      }
      sessionPhoneCache.set(normalizedPhone, normalizeMappingKey(lid) || lid)
      return lid
    }
    
    return null
  } catch (error) {
    console.error(`[LID Handler] Error getting reverse LID mapping:`, error)
    return null
  }
}

/**
 * Expand session keys to include both LID and phone formats
 * This function is primarily for debugging and is not used in normal operation
 */
export const expandSessionKeys = async (
  redis: any,
  sessionId: string,
  keys: string[],
  keyPrefix: string = 'baileys:session:'
): Promise<Map<string, string[]>> => {
  const expansionMap = new Map<string, string[]>()
  
  for (const key of keys) {
    const jidMatch = key.match(/session-(.+)$/)
    if (!jidMatch) {
      expansionMap.set(key, [key])
      continue
    }
    
    const jid = jidMatch[1]
    const expanded = [key]
    
    if (isLidFormat(jid)) {
      const phoneNumber = await getLidMapping(redis, sessionId, jid, keyPrefix)
      if (phoneNumber) {
        expanded.push(key.replace(jid, phoneNumber))
      }
    } else if (isPhoneFormat(jid)) {
      const lid = await getReverseLidMapping(redis, sessionId, jid, keyPrefix)
      if (lid) {
        expanded.push(key.replace(jid, lid))
      }
    }
    
    expansionMap.set(key, expanded)
  }
  
  return expansionMap
}

/**
 * Batch get LID mappings for multiple LIDs
 */
export const batchGetLidMappings = async (
  redis: any,
  sessionId: string,
  lids: string[],
  keyPrefix: string = 'baileys:session:'
): Promise<Map<string, string | null>> => {
  const mappings = new Map<string, string | null>()
  const sessionCache = lidCache.get(sessionId)
  const normalizedLookup = new Map<string, string>()
  const uncachedLids: string[] = []
  const cacheLimit = getCacheLimit(sessionId)
  
  // Check cache first
  for (const lid of lids) {
    const normalizedLid = normalizeMappingKey(lid)
    normalizedLookup.set(lid, normalizedLid)

    if (!normalizedLid) {
      mappings.set(lid, null)
      continue
    }

    if (sessionCache?.has(normalizedLid)) {
      mappings.set(lid, sessionCache.get(normalizedLid)!)
    } else {
      uncachedLids.push(normalizedLid)
      mappings.set(lid, null)
    }
  }
  
  // Batch fetch from Redis
  if (uncachedLids.length > 0) {
    try {
      const pipeline = redis.multi ? redis.multi() : redis.pipeline ? redis.pipeline() : redis.multi()
      const uniqueLids = Array.from(new Set(uncachedLids))
      const keys = uniqueLids.map(lid => `${keyPrefix}lid:${sessionId}:${lid}`)
      
      keys.forEach(key => pipeline.get(key))
      const results = await pipeline.exec()
      
      for (let i = 0; i < uniqueLids.length; i++) {
        const phoneNumber = results[i][1]
        if (phoneNumber) {
          const normalizedPhone = normalizeMappingKey(phoneNumber) || phoneNumber
          const originalKeys = Array.from(normalizedLookup.entries()).filter(([, norm]) => norm === uniqueLids[i]).map(([original]) => original)
          for (const original of originalKeys) {
            mappings.set(original, normalizedPhone)
          }
          // Update cache
          if (!lidCache.has(sessionId)) {
            lidCache.set(sessionId, new Map())
          }
          const sessionLidCache = lidCache.get(sessionId)!
          if (sessionLidCache.size >= cacheLimit) {
            trimCacheToLimit(sessionLidCache, cacheLimit - 1)
          }
          sessionLidCache.set(uniqueLids[i], normalizedPhone)
        }
      }
    } catch (error) {
      console.error(`[LID Handler] Error in batch get:`, error)
    }
  }
  
  return mappings
}

/**
 * Migrate session keys from one format to another
 * Used for gradual migration of existing sessions
 */
export const migrateSessionKey = async (
  redis: any,
  sessionId: string,
  fromJid: string,
  toJid: string,
  keyPrefix: string = 'baileys:session:'
): Promise<boolean> => {
  try {
    const sessionKey = `${keyPrefix}${sessionId}`
    const fromKey = `${sessionKey}:session-${fromJid}`
    const toKey = `${sessionKey}:session-${toJid}`
    
    // Check if source key exists
    const exists = await redis.exists(fromKey)
    if (!exists) return false
    
    // Check if destination key already exists
    const destExists = await redis.exists(toKey)
    if (destExists) return true // Already migrated
    
    // Copy the key
    const data = await redis.get(fromKey)
    if (data) {
      // Get TTL of original key
      const ttl = await redis.ttl(fromKey)
      
      if (ttl > 0) {
        // Set with same TTL
        if (typeof redis.setex === 'function' || typeof redis.setEx === 'function') {
          const setMethod = redis.setex ? 'setex' : 'setEx'
          await redis[setMethod](toKey, ttl, data)
        } else {
          await redis.set(toKey, data, 'EX', ttl)
        }
      } else {
        // No TTL or permanent key
        await redis.set(toKey, data)
      }
      
      console.log(`[LID Handler] Migrated session key: ${fromJid} -> ${toJid}`)
      return true
    }
    
    return false
  } catch (error) {
    console.error(`[LID Handler] Error migrating session key:`, error)
    return false
  }
}

/**
 * Clean up all LID mappings for a session
 * Used during session cleanup
 */
export const cleanupLidMappings = async (
  redis: any,
  sessionId: string,
  keyPrefix: string = 'baileys:session:'
): Promise<void> => {
  try {
    // Clean memory cache
    cleanupLidCache(sessionId)
    
    // Clean Redis mappings using SCAN
    const pattern = `${keyPrefix}lid:${sessionId}:*`
    const reversePattern = `${keyPrefix}lid:reverse:${sessionId}:*`
    
    const keysToDelete: string[] = []
    
    // Scan for LID keys
    let cursor = '0'
    do {
      const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
      cursor = result[0]
      keysToDelete.push(...result[1])
    } while (cursor !== '0')
    
    // Scan for reverse keys
    cursor = '0'
    do {
      const result = await redis.scan(cursor, 'MATCH', reversePattern, 'COUNT', 100)
      cursor = result[0]
      keysToDelete.push(...result[1])
    } while (cursor !== '0')
    
    // Delete all found keys in batches
    if (keysToDelete.length > 0) {
      const batchSize = 100
      for (let i = 0; i < keysToDelete.length; i += batchSize) {
        const batch = keysToDelete.slice(i, i + batchSize)
        const pipeline = redis.multi ? redis.multi() : redis.pipeline ? redis.pipeline() : redis.multi()
        batch.forEach(key => pipeline.del(key))
        await pipeline.exec()
      }
      
      console.log(`[LID Handler] Cleaned up ${keysToDelete.length} LID mapping keys`)
    }
  } catch (error) {
    console.error(`[LID Handler] Error cleaning up LID mappings:`, error)
  }
}

/**
 * Clean up memory cache for a specific session
 */
export const cleanupLidCache = (sessionId: string): void => {
  lidCache.delete(sessionId)
  phoneCache.delete(sessionId)
}

/**
 * Migrates legacy LID cache keys (lid:/lid:reverse:) into the Baileys v7 'lid-mapping' dataset.
 * This function scans Redis for the legacy keys and writes canonical entries under
 *   `${keyPrefix}${sessionId}:lid-mapping-<pnUser>` => `<lidUser>` and
 *   `${keyPrefix}${sessionId}:lid-mapping-<lidUser>_reverse` => `<pnUser>`.
 *
 * Options:
 * - dryRun: do not write, only return counts
 * - batchSize: how many entries to write per pipeline batch (default 250)
 * - ttlSeconds: optional TTL for the new keys; if omitted, no expiration is set
 * - enableLog: verbose logging
 */
export const migrateLegacyLidCacheToLidMapping = async (
  redis: any,
  sessionId: string,
  keyPrefix: string = 'baileys:session:',
  options?: {
    dryRun?: boolean
    batchSize?: number
    ttlSeconds?: number
    enableLog?: boolean
  }
): Promise<{ scanned: number; migrated: number; skipped: number }> => {
  const dryRun = !!options?.dryRun
  const batchSize = options?.batchSize && options.batchSize > 0 ? Math.floor(options.batchSize) : 250
  const ttlSeconds = options?.ttlSeconds
  const log = (...args: any[]) => {
    if (options?.enableLog) console.log('[LID Migration]', ...args)
  }

  // Helper: build the final Redis key for the canonical dataset
  const sessionKey = `${keyPrefix}${sessionId}`
  const mkCanonKey = (id: string) => `${sessionKey}:lid-mapping-${id}`

  // Helper: parse numeric user from jid (strip :device and domain)
  const parseUser = (jid: string | null | undefined): string | null => {
    if (!jid) return null
    const normalized = normalizeMappingKey(jid) // remove :device if present
    const match = normalized.match(/^(\d+)/)
    return match ? match[1] : null
  }

  // Collect pairs from forward keys first: lid:{session}:{lidJid} -> phoneJid
  const forwardPattern = `${keyPrefix}lid:${sessionId}:*`
  const reversePattern = `${keyPrefix}lid:reverse:${sessionId}:*`

  const pairs = new Map<string, string>() // pnUser -> lidUser
  let scanned = 0

  // Scan helper
  const scanKeys = async (pattern: string): Promise<string[]> => {
    const keys: string[] = []
    let cursor = '0'
    do {
      // node-redis v4 returns [cursor, keys[]]
      // ioredis returns same shape
      const res = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 500)
      cursor = res[0]
      for (const k of res[1]) keys.push(k)
    } while (cursor !== '0')
    return keys
  }

  const forwardKeys = await scanKeys(forwardPattern)
  const reverseKeys = await scanKeys(reversePattern)
  scanned = forwardKeys.length + reverseKeys.length
  log(`scanned keys: forward=${forwardKeys.length}, reverse=${reverseKeys.length}`)

  // Process forward keys
  if (forwardKeys.length) {
    const pipeline = redis.multi ? redis.multi() : redis.pipeline ? redis.pipeline() : redis.multi()
    forwardKeys.forEach(k => pipeline.get(k))
    const results = await pipeline.exec()
    for (let i = 0; i < forwardKeys.length; i++) {
      const lidJid = forwardKeys[i].split(':').slice(-1)[0] // suffix after last :
      const phoneJid = results[i]?.[1] as string | null
      if (!lidJid || !phoneJid) continue
      const pnUser = parseUser(phoneJid)
      const lidUser = parseUser(lidJid)
      if (pnUser && lidUser) {
        if (!pairs.has(pnUser)) pairs.set(pnUser, lidUser)
      }
    }
  }

  // Process reverse keys (phone -> lid) to fill any gaps
  if (reverseKeys.length) {
    const pipeline = redis.multi ? redis.multi() : redis.pipeline ? redis.pipeline() : redis.multi()
    reverseKeys.forEach(k => pipeline.get(k))
    const results = await pipeline.exec()
    for (let i = 0; i < reverseKeys.length; i++) {
      const phoneJid = reverseKeys[i].split(':').slice(-1)[0]
      const lidJid = results[i]?.[1] as string | null
      if (!lidJid || !phoneJid) continue
      const pnUser = parseUser(phoneJid)
      const lidUser = parseUser(lidJid)
      if (pnUser && lidUser) {
        if (!pairs.has(pnUser)) pairs.set(pnUser, lidUser)
      }
    }
  }

  let migrated = 0
  let skipped = 0

  if (pairs.size === 0) {
    log('no legacy pairs found to migrate')
    return { scanned, migrated: 0, skipped: 0 }
  }

  if (dryRun) {
    log(`dry-run: would migrate ${pairs.size} pairs`)
    return { scanned, migrated: 0, skipped: pairs.size }
  }

  // Write canonical entries in batches
  const entries = Array.from(pairs.entries()) // [pnUser, lidUser]
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize)
    const pipeline = redis.multi ? redis.multi() : redis.pipeline ? redis.pipeline() : redis.multi()
    for (const [pnUser, lidUser] of batch) {
      const fwdKey = mkCanonKey(pnUser)
      const revKey = mkCanonKey(`${lidUser}_reverse`)
      if (typeof ttlSeconds === 'number' && ttlSeconds > 0) {
        // use setex variants depending on client
        if (typeof redis.setEx === 'function') {
          pipeline.setEx(fwdKey, ttlSeconds, lidUser)
          pipeline.setEx(revKey, ttlSeconds, pnUser)
        } else if (typeof redis.setex === 'function') {
          pipeline.setex(fwdKey, ttlSeconds, lidUser)
          pipeline.setex(revKey, ttlSeconds, pnUser)
        } else if (typeof redis.set === 'function') {
          pipeline.set(fwdKey, lidUser, 'EX', ttlSeconds)
          pipeline.set(revKey, pnUser, 'EX', ttlSeconds)
        } else {
          // fallback: no TTL
          pipeline.set(fwdKey, lidUser)
          pipeline.set(revKey, pnUser)
        }
      } else {
        pipeline.set(fwdKey, lidUser)
        pipeline.set(revKey, pnUser)
      }
    }
    await pipeline.exec()
    migrated += batch.length
  }

  log(`migrated pairs: ${migrated}`)
  return { scanned, migrated, skipped }
}

/**
 * Get statistics about LID mappings for a session
 */
export const getLidStats = async (
  redis: any,
  sessionId: string,
  keyPrefix: string = 'baileys:session:'
): Promise<{ mappingsCount: number; cacheSize: number }> => {
  try {
    // Count Redis mappings
    const pattern = `${keyPrefix}lid:${sessionId}:*`
    let mappingsCount = 0
    let cursor = '0'
    
    do {
      const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
      cursor = result[0]
      mappingsCount += result[1].length
    } while (cursor !== '0')
    
    // Get cache size
    const cacheSize = (lidCache.get(sessionId)?.size || 0) + (phoneCache.get(sessionId)?.size || 0)
    
    return { mappingsCount, cacheSize }
  } catch (error) {
    console.error(`[LID Handler] Error getting stats:`, error)
    return { mappingsCount: 0, cacheSize: 0 }
  }
}

/**
 * Register a LID to phone number mapping
 * This allows applications to manually register the correlation between LID and phone formats
 * 
 * @param redis - Redis client instance
 * @param sessionId - Session identifier
 * @param phoneNumber - Phone number in format: 60196953307@s.whatsapp.net
 * @param lid - LID in format: 114194640801953@lid
 * @param options - Optional configuration
 * @returns Promise<boolean> - True if successful, false otherwise
 * 
 * @example
 * ```typescript
 * const success = await registerLidMapping(
 *   redisClient,
 *   'my-session',
 *   '60196953307@s.whatsapp.net',
 *   '114194640801953@lid'
 * )
 * ```
 */
export const registerLidMapping = async (
  redis: any,
  sessionId: string,
  phoneNumber: string,
  lid: string,
  options?: {
    keyPrefix?: string
    ttl?: number
  }
): Promise<boolean> => {
  try {
    // Set defaults
    const keyPrefix = options?.keyPrefix || 'baileys:session:'
    const ttl = getMappingTtl(sessionId, options?.ttl)
    
    // Validate inputs
    if (!sessionId || !phoneNumber || !lid) {
      console.error('[registerLidMapping] Missing required parameters')
      return false
    }
    
    // Validate formats
    if (!isPhoneFormat(phoneNumber)) {
      console.error(`[registerLidMapping] Invalid phone format: ${phoneNumber}`)
      return false
    }
    
    if (!isLidFormat(lid)) {
      console.error(`[registerLidMapping] Invalid LID format: ${lid}`)
      return false
    }
    
    const normalizedPhone = normalizeMappingKey(phoneNumber)
    const normalizedLid = normalizeMappingKey(lid)

    if (!normalizedPhone || !normalizedLid) {
      console.error('[registerLidMapping] Normalized values are empty, refusing to register', {
        lid,
        phoneNumber
      })
      return false
    }

    // Store the bidirectional mapping (refreshes TTL when mapping matches)
    await storeLidMapping(redis, sessionId, normalizedLid, normalizedPhone, keyPrefix, ttl, {
      force: true
    })

    console.log(`[registerLidMapping] Successfully registered mapping: ${normalizedLid} <-> ${normalizedPhone} for session ${sessionId}`)
    return true
    
  } catch (error) {
    console.error('[registerLidMapping] Error registering LID mapping:', error)
    return false
  }
}
