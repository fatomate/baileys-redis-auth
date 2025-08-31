/**
 * LID (Linked ID) Handler Module for WhatsApp @lid Format Support
 * 
 * This module handles the mapping between WhatsApp's @lid format and phone numbers,
 * providing seamless session key management for both formats.
 */

// LRU Cache implementation for high-performance memory caching
class LRUCache<K, V> {
  private maxSize: number
  private cache: Map<K, { value: V; timestamp: number }>
  private accessOrder: Map<K, number>
  private counter: number = 0
  private ttl: number // TTL in milliseconds

  constructor(maxSize: number = 10000, ttl: number = 900000) { // 15 minutes default TTL
    this.maxSize = maxSize
    this.ttl = ttl
    this.cache = new Map()
    this.accessOrder = new Map()
  }

  get(key: K): V | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      this.accessOrder.delete(key)
      return null
    }

    // Update access order
    this.accessOrder.set(key, ++this.counter)
    return entry.value
  }

  set(key: K, value: V): void {
    // If at capacity, remove least recently used
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      let lruKey: K | undefined
      let lruCount = Infinity

      for (const [k, count] of this.accessOrder.entries()) {
        if (count < lruCount) {
          lruCount = count
          lruKey = k
        }
      }

      if (lruKey !== undefined) {
        this.cache.delete(lruKey)
        this.accessOrder.delete(lruKey)
      }
    }

    this.cache.set(key, { value, timestamp: Date.now() })
    this.accessOrder.set(key, ++this.counter)
  }

  clear(): void {
    this.cache.clear()
    this.accessOrder.clear()
    this.counter = 0
  }

  size(): number {
    return this.cache.size
  }
}

// Per-session LID mapping caches for better isolation
const sessionLidCaches = new Map<string, LRUCache<string, string>>()

// Constants
const LID_MAPPING_TTL = 604800 // 7 days in seconds
const LID_CACHE_TTL = 900000 // 15 minutes in milliseconds
const LID_CACHE_SIZE = 10000 // Max entries per session

/**
 * Get or create a LID cache for a specific session
 */
const getSessionLidCache = (sessionId: string, cacheSize: number = LID_CACHE_SIZE): LRUCache<string, string> => {
  let cache = sessionLidCaches.get(sessionId)
  if (!cache) {
    cache = new LRUCache(cacheSize, LID_CACHE_TTL)
    sessionLidCaches.set(sessionId, cache)
  }
  return cache
}

/**
 * Clean up LID cache for a specific session
 */
export const cleanupLidCache = (sessionId: string): void => {
  const cache = sessionLidCaches.get(sessionId)
  if (cache) {
    cache.clear()
    sessionLidCaches.delete(sessionId)
  }
}

/**
 * Check if a JID is in @lid format
 */
export const isLidFormat = (jid: string): boolean => {
  return !!jid && typeof jid === 'string' && jid.includes('@lid')
}

/**
 * Check if a JID is in phone number format
 */
export const isPhoneFormat = (jid: string): boolean => {
  return !!jid && typeof jid === 'string' && jid.includes('@s.whatsapp.net')
}

/**
 * Extract the numeric part from a JID (works for both @lid and phone formats)
 */
export const extractNumericId = (jid: string): string | null => {
  if (!jid) return null
  const match = jid.match(/^(\d+)@/)
  return match ? match[1] : null
}

/**
 * Store @lid to phone number mapping in Redis with caching
 */
export const storeLidMapping = async (
  redis: any,
  sessionId: string,
  lid: string,
  phoneNumber: string,
  keyPrefix: string = 'baileys:session:',
  ttl: number = LID_MAPPING_TTL
): Promise<void> => {
  if (!isLidFormat(lid) || !isPhoneFormat(phoneNumber)) {
    console.warn(`Invalid format for LID mapping: lid=${lid}, phone=${phoneNumber}`)
    return
  }

  try {
    const cache = getSessionLidCache(sessionId)
    
    // Store in Redis with TTL
    const lidKey = `${keyPrefix}lid:${sessionId}:${lid}`
    const reverseKey = `${keyPrefix}lid:reverse:${sessionId}:${phoneNumber}`
    
    // Use pipeline for atomic operation
    const pipeline = redis.multi ? redis.multi() : redis.pipeline()
    
    // Store both directions
    if (typeof redis.setex === 'function' || typeof redis.setEx === 'function') {
      // ioredis or redis v4
      const setMethod = redis.setex ? 'setex' : 'setEx'
      pipeline[setMethod](lidKey, ttl, phoneNumber)
      pipeline[setMethod](reverseKey, ttl, lid)
    } else {
      // Fallback to SET with EX
      pipeline.set(lidKey, phoneNumber, 'EX', ttl)
      pipeline.set(reverseKey, lid, 'EX', ttl)
    }
    
    await pipeline.exec()
    
    // Update cache
    cache.set(lid, phoneNumber)
    cache.set(`reverse:${phoneNumber}`, lid)
    
    console.log(`[LID Handler] Stored mapping: ${lid} <-> ${phoneNumber} for session ${sessionId}`)
  } catch (error) {
    console.error(`[LID Handler] Error storing mapping for session ${sessionId}:`, error)
  }
}

/**
 * Get phone number from @lid with caching
 */
export const getLidMapping = async (
  redis: any,
  sessionId: string,
  lid: string,
  keyPrefix: string = 'baileys:session:'
): Promise<string | null> => {
  if (!isLidFormat(lid)) return null

  try {
    const cache = getSessionLidCache(sessionId)
    
    // Check cache first
    const cached = cache.get(lid)
    if (cached) return cached

    // Fetch from Redis
    const lidKey = `${keyPrefix}lid:${sessionId}:${lid}`
    const phoneNumber = await redis.get(lidKey)
    
    if (phoneNumber) {
      // Update cache
      cache.set(lid, phoneNumber)
      
      // Refresh TTL in Redis
      await redis.expire(lidKey, LID_MAPPING_TTL)
      
      return phoneNumber
    }
    
    return null
  } catch (error) {
    console.error(`[LID Handler] Error getting mapping for ${lid}:`, error)
    return null
  }
}

/**
 * Get @lid from phone number (reverse lookup) with caching
 */
export const getReverseLidMapping = async (
  redis: any,
  sessionId: string,
  phoneNumber: string,
  keyPrefix: string = 'baileys:session:'
): Promise<string | null> => {
  if (!isPhoneFormat(phoneNumber)) return null

  try {
    const cache = getSessionLidCache(sessionId)
    
    // Check cache first
    const cacheKey = `reverse:${phoneNumber}`
    const cached = cache.get(cacheKey)
    if (cached) return cached

    // Fetch from Redis
    const reverseKey = `${keyPrefix}lid:reverse:${sessionId}:${phoneNumber}`
    const lid = await redis.get(reverseKey)
    
    if (lid) {
      // Update cache
      cache.set(cacheKey, lid)
      
      // Refresh TTL in Redis
      await redis.expire(reverseKey, LID_MAPPING_TTL)
      
      return lid
    }
    
    return null
  } catch (error) {
    console.error(`[LID Handler] Error getting reverse mapping for ${phoneNumber}:`, error)
    return null
  }
}

/**
 * Expand session keys to include both @lid and phone number formats
 * This is used when fetching session keys to check both formats
 */
export const expandSessionKeys = async (
  redis: any,
  sessionId: string,
  keys: string[],
  keyPrefix: string = 'baileys:session:'
): Promise<Map<string, string[]>> => {
  const expansionMap = new Map<string, string[]>()
  const lookupPromises: Promise<void>[] = []

  for (const key of keys) {
    // Initialize with original key
    expansionMap.set(key, [key])

    // Check if it's a session key (format: session-<jid>)
    if (key.startsWith('session-')) {
      const jid = key.substring(8) // Remove 'session-' prefix
      
      if (isLidFormat(jid)) {
        // It's a @lid, try to find phone number
        lookupPromises.push(
          getLidMapping(redis, sessionId, jid, keyPrefix).then(phoneNumber => {
            if (phoneNumber) {
              expansionMap.get(key)!.push(`session-${phoneNumber}`)
            }
          })
        )
      } else if (isPhoneFormat(jid)) {
        // It's a phone number, try to find @lid
        lookupPromises.push(
          getReverseLidMapping(redis, sessionId, jid, keyPrefix).then(lid => {
            if (lid) {
              expansionMap.get(key)!.push(`session-${lid}`)
            }
          })
        )
      }
    }
  }

  // Wait for all lookups to complete
  await Promise.all(lookupPromises)
  
  return expansionMap
}

/**
 * Batch get LID mappings for multiple JIDs
 * Optimized for bulk operations
 */
export const batchGetLidMappings = async (
  redis: any,
  sessionId: string,
  jids: string[],
  keyPrefix: string = 'baileys:session:'
): Promise<Map<string, string>> => {
  const mappings = new Map<string, string>()
  const cache = getSessionLidCache(sessionId)
  const missingLids: string[] = []
  const missingPhones: string[] = []

  // Check cache first
  for (const jid of jids) {
    if (isLidFormat(jid)) {
      const cached = cache.get(jid)
      if (cached) {
        mappings.set(jid, cached)
      } else {
        missingLids.push(jid)
      }
    } else if (isPhoneFormat(jid)) {
      const cacheKey = `reverse:${jid}`
      const cached = cache.get(cacheKey)
      if (cached) {
        mappings.set(jid, cached)
      } else {
        missingPhones.push(jid)
      }
    }
  }

  // Batch fetch missing mappings from Redis
  if (missingLids.length > 0 || missingPhones.length > 0) {
    const pipeline = redis.multi ? redis.multi() : redis.pipeline()
    
    // Add LID lookups to pipeline
    for (const lid of missingLids) {
      const lidKey = `${keyPrefix}lid:${sessionId}:${lid}`
      pipeline.get(lidKey)
    }
    
    // Add phone lookups to pipeline
    for (const phone of missingPhones) {
      const reverseKey = `${keyPrefix}lid:reverse:${sessionId}:${phone}`
      pipeline.get(reverseKey)
    }
    
    const results = await pipeline.exec()
    
    // Process LID results
    for (let i = 0; i < missingLids.length; i++) {
      const lid = missingLids[i]
      const result = results[i]
      const phoneNumber = result[1] || result // Handle different Redis client response formats
      
      if (phoneNumber && typeof phoneNumber === 'string') {
        mappings.set(lid, phoneNumber)
        cache.set(lid, phoneNumber)
      }
    }
    
    // Process phone results
    for (let i = 0; i < missingPhones.length; i++) {
      const phone = missingPhones[i]
      const resultIndex = missingLids.length + i
      const result = results[resultIndex]
      const lid = result[1] || result // Handle different Redis client response formats
      
      if (lid && typeof lid === 'string') {
        mappings.set(phone, lid)
        cache.set(`reverse:${phone}`, lid)
      }
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
        const pipeline = redis.multi ? redis.multi() : redis.pipeline()
        batch.forEach(key => pipeline.del(key))
        await pipeline.exec()
      }
      
      console.log(`[LID Handler] Cleaned up ${keysToDelete.length} LID mappings for session ${sessionId}`)
    }
  } catch (error) {
    console.error(`[LID Handler] Error cleaning up mappings for session ${sessionId}:`, error)
  }
}

/**
 * Get statistics about LID mappings for monitoring
 */
export const getLidStats = (sessionId: string): { cacheSize: number; cacheHits?: number } => {
  const cache = sessionLidCaches.get(sessionId)
  return {
    cacheSize: cache ? cache.size() : 0
  }
}

/**
 * Ensure session keys exist for both phone and LID formats
 * This function specifically handles the case where session keys need to be available
 * for outgoing messages to either format
 * 
 * @param redis - Redis client instance
 * @param sessionId - Session identifier
 * @param phoneNumber - Phone number in format: 60196953307@s.whatsapp.net
 * @param lid - LID in format: 114194640801953@lid
 * @param keyPrefix - Redis key prefix (default: 'baileys:session:')
 * @returns Promise<{ phoneKeyExists: boolean, lidKeyExists: boolean, duplicated: boolean }>
 * 
 * @example
 * ```typescript
 * // Before sending a message to a LID format
 * const result = await ensureSessionKeyForBothFormats(
 *   redisClient,
 *   'my-session',
 *   '60196953307@s.whatsapp.net',
 *   '114194640801953@lid',
 *   'baileys:auth:'
 * )
 * ```
 */
export const ensureSessionKeyForBothFormats = async (
  redis: any,
  sessionId: string,
  phoneNumber: string,
  lid: string,
  keyPrefix: string = 'baileys:session:'
): Promise<{ phoneKeyExists: boolean; lidKeyExists: boolean; duplicated: boolean }> => {
  const result = {
    phoneKeyExists: false,
    lidKeyExists: false,
    duplicated: false
  }
  
  try {
    // Validate inputs
    if (!sessionId || !phoneNumber || !lid) {
      console.error('[ensureSessionKeyForBothFormats] Missing required parameters')
      return result
    }
    
    // Validate formats
    if (!isPhoneFormat(phoneNumber)) {
      console.error(`[ensureSessionKeyForBothFormats] Invalid phone format: ${phoneNumber}`)
      return result
    }
    
    if (!isLidFormat(lid)) {
      console.error(`[ensureSessionKeyForBothFormats] Invalid LID format: ${lid}`)
      return result
    }
    
    const sessionKey = `${keyPrefix}${sessionId}`
    const phoneSessionKey = `${sessionKey}:session-${phoneNumber}`
    const lidSessionKey = `${sessionKey}:session-${lid}`
    
    console.log(`[ensureSessionKeyForBothFormats] Checking keys:`)
    console.log(`  Phone: ${phoneSessionKey}`)
    console.log(`  LID: ${lidSessionKey}`)
    
    // Check both keys
    const [phoneData, lidData] = await Promise.all([
      redis.get(phoneSessionKey),
      redis.get(lidSessionKey)
    ])
    
    result.phoneKeyExists = !!phoneData
    result.lidKeyExists = !!lidData
    
    console.log(`[ensureSessionKeyForBothFormats] Key status:`)
    console.log(`  Phone exists: ${result.phoneKeyExists} (${phoneData ? phoneData.length + ' bytes' : 'not found'})`)
    console.log(`  LID exists: ${result.lidKeyExists} (${lidData ? lidData.length + ' bytes' : 'not found'})`)
    
    // If one exists but not the other, duplicate
    if (phoneData && !lidData) {
      console.log(`[ensureSessionKeyForBothFormats] Duplicating phone → LID`)
      
      // Get TTL of phone key
      const ttl = await redis.ttl(phoneSessionKey)
      
      if (ttl > 0) {
        if (typeof redis.setex === 'function' || typeof redis.setEx === 'function') {
          const setMethod = redis.setex ? 'setex' : 'setEx'
          await redis[setMethod](lidSessionKey, ttl, phoneData)
        } else {
          await redis.set(lidSessionKey, phoneData, 'EX', ttl)
        }
      } else {
        await redis.set(lidSessionKey, phoneData)
      }
      
      result.duplicated = true
      result.lidKeyExists = true
      console.log(`[ensureSessionKeyForBothFormats] ✅ Created LID session key`)
      
    } else if (lidData && !phoneData) {
      console.log(`[ensureSessionKeyForBothFormats] Duplicating LID → phone`)
      
      // Get TTL of LID key
      const ttl = await redis.ttl(lidSessionKey)
      
      if (ttl > 0) {
        if (typeof redis.setex === 'function' || typeof redis.setEx === 'function') {
          const setMethod = redis.setex ? 'setex' : 'setEx'
          await redis[setMethod](phoneSessionKey, ttl, lidData)
        } else {
          await redis.set(phoneSessionKey, lidData, 'EX', ttl)
        }
      } else {
        await redis.set(phoneSessionKey, lidData)
      }
      
      result.duplicated = true
      result.phoneKeyExists = true
      console.log(`[ensureSessionKeyForBothFormats] ✅ Created phone session key`)
      
    } else if (!phoneData && !lidData) {
      console.warn(`[ensureSessionKeyForBothFormats] ⚠️ No session keys found for either format!`)
      console.warn(`  This may indicate the session was never established with this contact.`)
    } else {
      console.log(`[ensureSessionKeyForBothFormats] Both keys already exist, no duplication needed`)
    }
    
    // Also ensure the LID mapping exists
    if (result.phoneKeyExists || result.lidKeyExists) {
      await storeLidMapping(redis, sessionId, lid, phoneNumber, keyPrefix, LID_MAPPING_TTL)
    }
    
  } catch (error) {
    console.error('[ensureSessionKeyForBothFormats] Error:', error)
  }
  
  return result
}

/**
 * Register a LID to phone number mapping and optionally duplicate session keys
 * This is the main integration point for applications to manually register mappings
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
 *   '114194640801953@lid',
 *   { duplicateSessionKeys: true }
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
    duplicateSessionKeys?: boolean
    cacheSize?: number
  }
): Promise<boolean> => {
  try {
    // Set defaults
    const keyPrefix = options?.keyPrefix || 'baileys:session:'
    const ttl = options?.ttl || LID_MAPPING_TTL
    const duplicateSessionKeys = options?.duplicateSessionKeys ?? false
    
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
    
    // If requested, duplicate existing session keys
    if (duplicateSessionKeys) {
      try {
        const sessionKey = `${keyPrefix}${sessionId}`
        console.log(`[registerLidMapping] Checking session keys with base: ${sessionKey}`)
        
        // Check if session key exists for phone number
        const phoneSessionKey = `${sessionKey}:session-${phoneNumber}`
        console.log(`[registerLidMapping] Checking for phone session key: ${phoneSessionKey}`)
        const phoneSessionData = await redis.get(phoneSessionKey)
        
        if (phoneSessionData) {
          console.log(`[registerLidMapping] Found phone session key, data length: ${phoneSessionData.length}`)
          // Duplicate to LID format
          const lidSessionKey = `${sessionKey}:session-${lid}`
          const existingLidData = await redis.get(lidSessionKey)
          
          if (!existingLidData) {
            console.log(`[registerLidMapping] No existing LID session key, creating: ${lidSessionKey}`)
            // Get TTL of original key
            const phoneTTL = await redis.ttl(phoneSessionKey)
            console.log(`[registerLidMapping] Phone session key TTL: ${phoneTTL}`)
            
            if (phoneTTL > 0) {
              // Set with same TTL
              if (typeof redis.setex === 'function' || typeof redis.setEx === 'function') {
                const setMethod = redis.setex ? 'setex' : 'setEx'
                await redis[setMethod](lidSessionKey, phoneTTL, phoneSessionData)
              } else {
                await redis.set(lidSessionKey, phoneSessionData, 'EX', phoneTTL)
              }
            } else {
              // No TTL or permanent key
              await redis.set(lidSessionKey, phoneSessionData)
            }
            
            console.log(`[registerLidMapping] ✅ Duplicated session key from ${phoneNumber} to ${lid}`)
          } else {
            console.log(`[registerLidMapping] LID session key already exists: ${lidSessionKey}`)
          }
        } else {
          console.log(`[registerLidMapping] No phone session key found: ${phoneSessionKey}`)
        }
        
        // Check if session key exists for LID
        const lidSessionKey = `${sessionKey}:session-${lid}`
        console.log(`[registerLidMapping] Checking for LID session key: ${lidSessionKey}`)
        const lidSessionData = await redis.get(lidSessionKey)
        
        if (lidSessionData && !phoneSessionData) {
          console.log(`[registerLidMapping] Found LID session key, data length: ${lidSessionData.length}`)
          // Duplicate to phone format
          const phoneSessionKey = `${sessionKey}:session-${phoneNumber}`
          console.log(`[registerLidMapping] Creating phone session key: ${phoneSessionKey}`)
          
          // Get TTL of original key
          const lidTTL = await redis.ttl(lidSessionKey)
          console.log(`[registerLidMapping] LID session key TTL: ${lidTTL}`)
          
          if (lidTTL > 0) {
            // Set with same TTL
            if (typeof redis.setex === 'function' || typeof redis.setEx === 'function') {
              const setMethod = redis.setex ? 'setex' : 'setEx'
              await redis[setMethod](phoneSessionKey, lidTTL, lidSessionData)
            } else {
              await redis.set(phoneSessionKey, lidSessionData, 'EX', lidTTL)
            }
          } else {
            // No TTL or permanent key
            await redis.set(phoneSessionKey, lidSessionData)
          }
          
          console.log(`[registerLidMapping] ✅ Duplicated session key from ${lid} to ${phoneNumber}`)
        } else if (lidSessionData && phoneSessionData) {
          console.log(`[registerLidMapping] Both session keys already exist`)
        } else if (!lidSessionData) {
          console.log(`[registerLidMapping] No LID session key found: ${lidSessionKey}`)
        }
      } catch (error) {
        console.error('[registerLidMapping] Error duplicating session keys:', error)
        // Don't fail the whole operation if key duplication fails
      }
    }
    
    console.log(`[registerLidMapping] Successfully registered mapping: ${lid} <-> ${phoneNumber} for session ${sessionId}`)
    return true
    
  } catch (error) {
    console.error('[registerLidMapping] Error registering LID mapping:', error)
    return false
  }
}