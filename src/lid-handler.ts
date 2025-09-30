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

/**
 * Store a bidirectional LID to phone number mapping
 */
export const storeLidMapping = async (
  redis: any,
  sessionId: string,
  lid: string,
  phoneNumber: string,
  keyPrefix: string = 'baileys:session:',
  ttl?: number
): Promise<void> => {
  try {
    const effectiveTtl = getMappingTtl(sessionId, ttl)
    const cacheLimit = getCacheLimit(sessionId)

    // Store in Redis
    const lidKey = `${keyPrefix}lid:${sessionId}:${lid}`
    const phoneKey = `${keyPrefix}lid:reverse:${sessionId}:${phoneNumber}`
    
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
    
    sessionLidCache.set(lid, phoneNumber)
    sessionPhoneCache.set(phoneNumber, lid)

  } catch (error) {
    console.error(`[LID Handler] Error storing LID mapping:`, error)
  }
}

/**
 * Get phone number for a given LID
 */
export const getLidMapping = async (
  redis: any,
  sessionId: string,
  lid: string,
  keyPrefix: string = 'baileys:session:'
): Promise<string | null> => {
  try {
    const cacheLimit = getCacheLimit(sessionId)

    // Check memory cache first
    const sessionCache = lidCache.get(sessionId)
    if (sessionCache?.has(lid)) {
      return sessionCache.get(lid)!
    }
    
    // Check Redis
    const key = `${keyPrefix}lid:${sessionId}:${lid}`
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
      sessionLidCache.set(lid, phoneNumber)
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
export const getReverseLidMapping = async (
  redis: any,
  sessionId: string,
  phoneNumber: string,
  keyPrefix: string = 'baileys:session:'
): Promise<string | null> => {
  try {
    // Check memory cache first
    const cacheLimit = getCacheLimit(sessionId)

    const sessionCache = phoneCache.get(sessionId)
    if (sessionCache?.has(phoneNumber)) {
      return sessionCache.get(phoneNumber)!
    }
    
    // Check Redis
    const key = `${keyPrefix}lid:reverse:${sessionId}:${phoneNumber}`
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
      sessionPhoneCache.set(phoneNumber, lid)
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
  const uncachedLids: string[] = []
  const cacheLimit = getCacheLimit(sessionId)
  
  // Check cache first
  for (const lid of lids) {
    if (sessionCache?.has(lid)) {
      mappings.set(lid, sessionCache.get(lid)!)
    } else {
      uncachedLids.push(lid)
      mappings.set(lid, null)
    }
  }
  
  // Batch fetch from Redis
  if (uncachedLids.length > 0) {
    try {
      const pipeline = redis.multi ? redis.multi() : redis.pipeline ? redis.pipeline() : redis.multi()
      const keys = uncachedLids.map(lid => `${keyPrefix}lid:${sessionId}:${lid}`)
      
      keys.forEach(key => pipeline.get(key))
      const results = await pipeline.exec()
      
      for (let i = 0; i < uncachedLids.length; i++) {
        const phoneNumber = results[i][1]
        if (phoneNumber) {
          mappings.set(uncachedLids[i], phoneNumber)
          // Update cache
          if (!lidCache.has(sessionId)) {
            lidCache.set(sessionId, new Map())
          }
          const sessionLidCache = lidCache.get(sessionId)!
          if (sessionLidCache.size >= cacheLimit) {
            trimCacheToLimit(sessionLidCache, cacheLimit - 1)
          }
          sessionLidCache.set(uncachedLids[i], phoneNumber)
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
    
    // Store the bidirectional mapping
    await storeLidMapping(redis, sessionId, lid, phoneNumber, keyPrefix, ttl)
    
    console.log(`[registerLidMapping] Successfully registered mapping: ${lid} <-> ${phoneNumber} for session ${sessionId}`)
    return true
    
  } catch (error) {
    console.error('[registerLidMapping] Error registering LID mapping:', error)
    return false
  }
}
