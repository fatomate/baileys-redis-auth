import { RedisAuthStateOptions } from './types'
import { 
  cleanupLidCache,
  cleanupLidMappings,
  configureLidHandler,
  getLidMapping,
  getReverseLidMapping,
  isLidFormat,
  isPhoneFormat,
  storeLidMapping
} from './lid-handler'

// Per-session memory caches for better isolation
const sessionCaches = new Map<string, Map<string, { data: any; timestamp: number }>>()

// Per-session connection pools for better resource management
const sessionPools = new Map<string, RedisConnectionPool>()

/**
 * Detect Redis client type and capabilities
 */
const detectRedisClient = (redis: any): { type: 'redis' | 'ioredis' | 'unknown'; capabilities: any } => {
  // Check for ioredis
  if (redis.constructor?.name === 'Redis' || redis.constructor?.name === 'Cluster') {
    return {
      type: 'ioredis',
      capabilities: {
        setEx: 'setex', // ioredis uses lowercase
        needsConnect: false, // ioredis auto-connects
        hasMulti: true
      }
    }
  }
  
  // Check for node-redis v4+
  if (typeof redis.connect === 'function' || typeof redis.get === 'function') {
    return {
      type: 'redis',
      capabilities: {
        setEx: redis.setEx ? 'setEx' : (redis.setex ? 'setex' : 'set'),
        needsConnect: typeof redis.connect === 'function',
        hasMulti: true
      }
    }
  }
  
  return {
    type: 'unknown',
    capabilities: {
      setEx: 'set',
      needsConnect: false,
      hasMulti: false
    }
  }
}

/**
 * Create Redis client based on options and type
 */
const createRedisClient = async (redisOptions: any): Promise<any> => {
  try {
    // Try ioredis first
    const Redis = eval('require')('ioredis')
    const client = new Redis(redisOptions)
    return client
  } catch (error: any) {
    // Fallback to redis
    try {
      const { createClient } = eval('require')('redis')
      const client = createClient(redisOptions)
      await client.connect()
      return client
    } catch (redisError: any) {
      throw new Error(`Failed to create Redis client. Install either 'redis' or 'ioredis': ${error?.message || 'Unknown error'}`)
    }
  }
}

/**
 * Get or create a memory cache for a specific session
 */
const getSessionCache = (sessionId: string): Map<string, { data: any; timestamp: number }> => {
  let cache = sessionCaches.get(sessionId)
  if (!cache) {
    cache = new Map()
    sessionCaches.set(sessionId, cache)
  }
  return cache
}

/**
 * Get or create a connection pool for a specific session
 */
const getSessionPool = async (sessionId: string, redisOptions: any, poolSize: number): Promise<RedisConnectionPool> => {
  let pool = sessionPools.get(sessionId)
  if (!pool) {
    pool = new RedisConnectionPool(redisOptions, poolSize)
    await pool.initialize()
    sessionPools.set(sessionId, pool)
  }
  return pool
}

/**
 * Clean up session resources when no longer needed
 */
export const cleanupSession = async (
  sessionId: string, 
  redisOptions?: any, 
  keyPrefix: string = 'baileys:session:'
): Promise<void> => {
  // Clean up memory cache
  sessionCaches.delete(sessionId)
  
  // Clean up LID cache
  cleanupLidCache(sessionId)
  
  // Clean up connection pool
  const pool = sessionPools.get(sessionId)
  if (pool) {
    await pool.destroy()
    sessionPools.delete(sessionId)
  }

  // Delete actual session data from Redis
  if (redisOptions) {
    let redis: any = null
    let shouldCloseConnection = false
    
    try {
      // Check if redisOptions is already a Redis client
      if (redisOptions && (typeof redisOptions.connect === 'function' || redisOptions.constructor?.name === 'Redis' || redisOptions.constructor?.name === 'Cluster')) {
        redis = redisOptions
      } else {
        // Create a temporary connection to delete the data
        redis = await createRedisClient(redisOptions)
        shouldCloseConnection = true
      }

      const sessionKey = `${keyPrefix}${sessionId}`
      
      // Find all keys for this session using SCAN for better performance
      const keysToDelete: string[] = []
      const pattern = `${sessionKey}:*`
      
      const clientInfo = detectRedisClient(redis)
      
      if (clientInfo.type === 'ioredis') {
        // ioredis supports scan with match
        const stream = redis.scanStream({
          match: pattern,
          count: 100
        })
        
        for await (const keys of stream) {
          keysToDelete.push(...keys)
        }
      } else {
        // For node-redis, use SCAN manually
        let cursor = 0
        do {
          const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
          cursor = parseInt(result[0])
          keysToDelete.push(...result[1])
        } while (cursor !== 0)
      }
      
      // Delete all found keys in batches
      if (keysToDelete.length > 0) {
        const pipeline = redis.multi ? redis.multi() : redis.pipeline ? redis.pipeline() : redis.multi()
        keysToDelete.forEach(key => pipeline.del(key))
        await pipeline.exec()
        
        console.log(`Deleted ${keysToDelete.length} Redis keys for session: ${sessionId}`)
      } else {
        console.log(`No Redis keys found for session: ${sessionId}`)
      }
      
      // Clean up LID mappings if enabled
      if (redisOptions) {
        await cleanupLidMappings(redis, sessionId, keyPrefix)
      }
      
    } catch (error) {
      console.error(`Error cleaning up Redis data for session ${sessionId}:`, error)
    } finally {
      // Close temporary connection if we created one
      if (redis && shouldCloseConnection) {
        try {
          if (typeof redis.quit === 'function') {
            await redis.quit()
          } else if (typeof redis.disconnect === 'function') {
            await redis.disconnect()
          }
        } catch (error) {
          // Ignore connection cleanup errors
        }
      }
    }
  }
}

// High-performance memory cache
const memoryCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 30000 // 30 seconds

// Connection pool management
const connectionPools = new Map<string, any[]>()

// Batch operation queue
const batchQueue = new Map<string, Array<{ type: 'get' | 'set' | 'del'; key: string; value?: any; resolve: Function; reject: Function }>>()
const batchTimers = new Map<string, any>()

/**
 * High-performance Redis connection pool with multi-client support
 */
class RedisConnectionPool {
  private connections: any[] = []
  private poolSize: number
  private redisOptions: any
  private availableConnections: any[] = []
  private usedConnections: Set<any> = new Set()

  constructor(redisOptions: any, poolSize: number = 10) {
    this.redisOptions = redisOptions
    this.poolSize = poolSize
  }

  async initialize(): Promise<void> {
    for (let i = 0; i < this.poolSize; i++) {
      const client = await createRedisClient(this.redisOptions)
      this.connections.push(client)
      this.availableConnections.push(client)
    }
  }

  async getConnection(): Promise<any> {
    if (this.availableConnections.length > 0) {
      const conn = this.availableConnections.pop()!
      this.usedConnections.add(conn)
      return conn
    }
    
    // If no available connections, create a temporary one
    const client = await createRedisClient(this.redisOptions)
    return client
  }

  releaseConnection(connection: any): void {
    if (this.usedConnections.has(connection)) {
      this.usedConnections.delete(connection)
      this.availableConnections.push(connection)
    }
  }

  async destroy(): Promise<void> {
    for (const conn of this.connections) {
      try {
        if (typeof conn.quit === 'function') {
          await conn.quit()
        } else if (typeof conn.disconnect === 'function') {
          await conn.disconnect()
        }
      } catch (error) {
        // Ignore connection cleanup errors
      }
    }
    this.connections = []
    this.availableConnections = []
    this.usedConnections.clear()
  }
}

/**
 * High-performance batch operation manager
 */
class BatchOperationManager {
  private redis: any
  private batchSize: number
  private flushDelay: number

  constructor(redis: any, batchSize: number = 100, flushDelay: number = 10) {
    this.redis = redis
    this.batchSize = batchSize
    this.flushDelay = flushDelay
  }

  async executeBatch(sessionKey: string, operations: Array<{ type: 'get' | 'set' | 'del'; key: string; value?: any; resolve: Function; reject: Function }>): Promise<void> {
    if (operations.length === 0) return

    try {
      const pipeline = this.redis.multi ? this.redis.multi() : this.redis.pipeline ? this.redis.pipeline() : this.redis.multi()
      const getOperations: Array<{ key: string; resolve: Function; reject: Function }> = []

      for (const op of operations) {
        switch (op.type) {
          case 'get':
            pipeline.get(op.key)
            getOperations.push({ key: op.key, resolve: op.resolve, reject: op.reject })
            break
          case 'set':
            pipeline.set(op.key, op.value)
            break
          case 'del':
            pipeline.del(op.key)
            break
        }
      }

      const results = await pipeline.exec()
      
      // Process GET results
      let getIndex = 0
      for (const op of operations) {
        if (op.type === 'get') {
          const result = results[getIndex]
          if (result[0]) {
            op.reject(result[0])
          } else {
            op.resolve(result[1])
          }
          getIndex++
        } else {
          op.resolve(true)
        }
      }
    } catch (error) {
      operations.forEach(op => op.reject(error))
    }
  }
}

/**
 * Fast serialization without external dependencies
 */
const fastSerialize = (data: any): string => {
  return JSON.stringify(data, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (value.constructor?.name === 'Buffer' || value.type === 'Buffer') {
        return {
          type: 'Buffer',
          data: Array.from(value.data || value)
        }
      }
    }
    return value
  })
}

/**
 * Fast deserialization
 */
const fastDeserialize = (data: string): any => {
  return JSON.parse(data, (key, value) => {
    if (typeof value === 'object' && value !== null && value.type === 'Buffer') {
      // Check if Buffer exists and create buffer safely
      try {
        const BufferGlobal = eval('typeof Buffer !== "undefined" ? Buffer : null')
        return BufferGlobal ? BufferGlobal.from(value.data) : new Uint8Array(value.data)
      } catch {
        return new Uint8Array(value.data)
      }
    }
    return value
  })
}

/**
 * Safely set Redis key with expiration, supporting both redis and ioredis
 */
const setWithExpiration = async (redis: any, key: string, value: string, ttl: number): Promise<void> => {
  const clientInfo = detectRedisClient(redis)
  
  try {
    if (clientInfo.type === 'ioredis') {
      // ioredis uses setex (lowercase)
      await redis.setex(key, ttl, value)
    } else if (clientInfo.type === 'redis') {
      // Try different method names for Redis client compatibility
      if (typeof redis.setEx === 'function') {
        await redis.setEx(key, ttl, value)
      } else if (typeof redis.setex === 'function') {
        await redis.setex(key, ttl, value)
      } else if (typeof redis.setEX === 'function') {
        await redis.setEX(key, ttl, value)
      } else if (typeof redis.set === 'function') {
        // Fallback to set with EX option
        await redis.set(key, value, 'EX', ttl)
      } else {
        throw new Error('Redis client does not support setting expiration')
      }
    } else {
      // Unknown client, try basic set with EX
      await redis.set(key, value, 'EX', ttl)
    }
  } catch (error) {
    // If all methods fail, try the basic set command
    await redis.set(key, value)
    console.warn(`Failed to set TTL for key ${key}, falling back to basic set`)
  }
}

/**
 * High-performance Redis-based authentication state storage for Baileys.
 * Optimized for maximum speed and minimal latency.
 */
export const useRedisAuthState = async (
  options: RedisAuthStateOptions
): Promise<{ state: any; saveCreds: () => Promise<void> }> => {
  const {
    redis: redisOptions,
    keyPrefix = 'baileys:session:',
    sessionId = 'default',
    ttl,
    enableBatching = true,
    batchSize = 100,
    poolSize = 10,
    memoryEfficient = true,
    enableCache = true,
    cacheTTL = 30000,
    enableLidSupport = true,
    enableLazyDualStorage = true,
    enableOpportunisticDualStorage = true,
    lidMappingTTL = 604800,
    lidCacheSize = 10000
  } = options

  // Get session-specific cache for better isolation
  const sessionCache = getSessionCache(sessionId)

  if (enableLidSupport) {
    configureLidHandler(sessionId, {
      cacheSize: lidCacheSize,
      mappingTTL: lidMappingTTL
    })
  }

  // Initialize connection pool or use existing Redis client
  let redis: any
  let pool: RedisConnectionPool | null = null
  
  if (redisOptions && (typeof redisOptions.connect === 'function' || redisOptions.constructor?.name === 'Redis' || redisOptions.constructor?.name === 'Cluster')) {
    // Existing Redis client passed
    redis = redisOptions
  } else {
    // Create new client using session-specific connection pool
    pool = await getSessionPool(sessionId, redisOptions, poolSize)
    redis = await pool.getConnection()
  }

  const sessionKey = `${keyPrefix}${sessionId}`
  let batchManager: BatchOperationManager | null = null
  
  if (enableBatching) {
    batchManager = new BatchOperationManager(redis, batchSize)
  }

  const stripDeviceSuffix = (jid: string): string => jid.replace(/:\d+$/, '')

  const expandKeyVariants = (value: string): Set<string> => {
    const variants = new Set<string>()
    const queue: string[] = [value]

    while (queue.length > 0) {
      const current = queue.pop()!
      if (variants.has(current)) {
        continue
      }
      variants.add(current)

      const deviceMatch = current.match(/^(.*?)(:\d+)$/)
      if (deviceMatch) {
        queue.push(deviceMatch[1])
      } else if (!current.includes(':')) {
        queue.push(`${current}:0`)
      }

      const atIndex = current.indexOf('@')
      if (atIndex !== -1) {
        const withoutDomain = current.slice(0, atIndex)
        if (withoutDomain) {
          queue.push(withoutDomain)
        }
      }
    }

    return variants
  }

  const queueVariantOperations = (
    target: { [key: string]: any },
    category: string,
    idValue: string,
    payload: any
  ): void => {
    for (const variant of expandKeyVariants(idValue)) {
      const opKey = `${category}-${variant}`
      if (!(opKey in target)) {
        target[opKey] = payload
      }
    }
  }

  // Helper function to generate Redis keys
  const getRedisKey = (key: string): string => `${sessionKey}:${key}`

  // Fast cache operations with session isolation
  const getCachedData = (key: string): any | null => {
    if (!enableCache) return null
    
    const cached = sessionCache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > cacheTTL) {
      sessionCache.delete(key)
      return null
    }
    
    return cached.data
  }

  const setCachedData = (key: string, data: any): void => {
    if (!enableCache) return
    
    sessionCache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  // High-performance read operation
  const readData = async (key: string): Promise<any | null> => {
    const cacheKey = getRedisKey(key)
    
    // Try cache first
    const cached = getCachedData(cacheKey)
    if (cached !== null) return cached

    try {
      const data = await redis.get(cacheKey)
      if (!data) return null
      
      const parsed = fastDeserialize(data)
      setCachedData(cacheKey, parsed)
      return parsed
    } catch (error) {
      console.error(`Error reading data for key ${key}:`, error)
      return null
    }
  }

  // High-performance write operation
  const writeData = async (data: any, key: string): Promise<void> => {
    const redisKey = getRedisKey(key)
    const serializedData = fastSerialize(data)
    
    try {
      if (ttl && ttl > 0) {
        await setWithExpiration(redis, redisKey, serializedData, ttl)
      } else {
        await redis.set(redisKey, serializedData)
      }
      
      // Update cache
      setCachedData(redisKey, data)
    } catch (error) {
      console.error(`Error writing data for key ${key}:`, error)
      throw error
    }
  }

  // High-performance bulk read operation
  const bulkRead = async (keys: string[]): Promise<{ [key: string]: any }> => {
    const result: { [key: string]: any } = {}
    const missingKeys: string[] = []
    const redisKeys: string[] = []

    // Check cache first
    for (const key of keys) {
      const redisKey = getRedisKey(key)
      const cached = getCachedData(redisKey)
      if (cached !== null) {
        result[key] = cached
      } else {
        missingKeys.push(key)
        redisKeys.push(redisKey)
      }
    }

    // Batch fetch missing keys
    if (missingKeys.length > 0) {
      try {
        const pipeline = redis.multi ? redis.multi() : redis.pipeline ? redis.pipeline() : redis.multi()
        redisKeys.forEach(key => pipeline.get(key))
        const results = await pipeline.exec()

        for (let i = 0; i < missingKeys.length; i++) {
          const data = results[i][1]
          if (data) {
            const parsed = fastDeserialize(data)
            result[missingKeys[i]] = parsed
            setCachedData(redisKeys[i], parsed)
          }
        }
      } catch (error) {
        console.error('Error in bulk read:', error)
      }
    }

    return result
  }

  // High-performance bulk write operation
  const bulkWrite = async (data: { [key: string]: any }): Promise<void> => {
    const clientInfo = detectRedisClient(redis)
    const pipeline = redis.multi ? redis.multi() : redis.pipeline ? redis.pipeline() : redis.multi()
    
    for (const [key, value] of Object.entries(data)) {
      const redisKey = getRedisKey(key)
      if (value !== null && value !== undefined) {
        const serializedData = fastSerialize(value)
        if (ttl && ttl > 0) {
          // Use client-specific method for setting expiration in pipeline
          if (clientInfo.type === 'ioredis') {
            pipeline.setex(redisKey, ttl, serializedData)
          } else if (clientInfo.type === 'redis') {
            if (typeof redis.setEx === 'function') {
              pipeline.setEx(redisKey, ttl, serializedData)
            } else if (typeof redis.setex === 'function') {
              pipeline.setex(redisKey, ttl, serializedData)
            } else {
              // Fallback to set with EX option
              pipeline.set(redisKey, serializedData, 'EX', ttl)
            }
          } else {
            pipeline.set(redisKey, serializedData, 'EX', ttl)
          }
        } else {
          pipeline.set(redisKey, serializedData)
        }
        setCachedData(redisKey, value)
      } else {
        pipeline.del(redisKey)
        sessionCache.delete(redisKey)
      }
    }

    await pipeline.exec()
  }

  // Load or initialize credentials
  let creds: any
  try {
    creds = (await readData('creds')) || {}
    
    // Try to use Baileys initAuthCreds if available
    if (Object.keys(creds).length === 0) {
      try {
        const { initAuthCreds } = eval('require')('baileys')
        creds = initAuthCreds()
      } catch (error: any) {
        // Baileys not available, use empty object
        creds = {}
      }
    }
  } catch (error: any) {
    console.error('Error loading credentials:', error)
    creds = {}
  }

  return {
    state: {
      creds,
      keys: {
        get: async (type: string, ids: string[]) => {
          const toAppStateSyncValue = (raw: any) => {
            if (type === 'app-state-sync-key' && raw) {
              try {
                const { proto } = eval('require')('baileys/WAProto')
                return proto.Message.AppStateSyncKeyData.fromObject(raw)
              } catch (error: any) {
                return raw
              }
            }
            return raw
          }

          if (!(enableLidSupport && type === 'session')) {
            const keyedIds = ids.map(id => `${type}-${id}`)
            const data = await bulkRead(keyedIds)
            const result: { [id: string]: any } = {}

            for (const id of ids) {
              const key = `${type}-${id}`
              const value = data[key]
              result[id] = value === undefined || value === null ? null : toAppStateSyncValue(value)
            }

            return result
          }

          const uniqueIds = Array.from(new Set(ids))
          const expansionMap = new Map<string, Set<string>>()

          await Promise.all(
            uniqueIds.map(async id => {
              const expanded = new Set<string>()
              for (const variant of expandKeyVariants(id)) {
                expanded.add(variant)
              }

              const strippedId = stripDeviceSuffix(id)

              if (isLidFormat(strippedId)) {
                const phone = await getLidMapping(redis, sessionId, strippedId, keyPrefix)
                if (phone) {
                  for (const variant of expandKeyVariants(phone)) {
                    expanded.add(variant)
                  }
                }
              } else if (isPhoneFormat(strippedId)) {
                const lid = await getReverseLidMapping(redis, sessionId, strippedId, keyPrefix)
                if (lid) {
                  for (const variant of expandKeyVariants(lid)) {
                    expanded.add(variant)
                  }
                }
              }

              expansionMap.set(id, expanded)
            })
          )

          const allLookupIds = new Set<string>()
          for (const expanded of expansionMap.values()) {
            expanded.forEach(value => allLookupIds.add(value))
          }

          const data = await bulkRead(Array.from(allLookupIds).map(value => `${type}-${value}`))

          const result: { [id: string]: any } = {}
          const lazyWriteOperations: { [key: string]: any } = {}

          for (const id of ids) {
            const possibleKeys = expansionMap.get(id) ?? new Set<string>([id])
            const directKey = `${type}-${id}`
            let value = data[directKey]
            let alternateSource: string | null = null

            if (value === undefined || value === null) {
              for (const candidate of possibleKeys) {
                if (candidate === id) continue
                const candidateKey = `${type}-${candidate}`
                const candidateValue = data[candidateKey]
                if (candidateValue !== undefined && candidateValue !== null) {
                  value = candidateValue
                  alternateSource = candidate
                  break
                }
              }
            }

            if (value === undefined || value === null) {
              result[id] = null
              continue
            }

            result[id] = toAppStateSyncValue(value)

            if (enableLazyDualStorage && alternateSource && alternateSource !== id) {
              queueVariantOperations(lazyWriteOperations, type, id, value)

              const cleanedTarget = stripDeviceSuffix(id)
              const cleanedSource = stripDeviceSuffix(alternateSource)

              if (isLidFormat(cleanedTarget) && isPhoneFormat(cleanedSource)) {
                storeLidMapping(redis, sessionId, cleanedTarget, cleanedSource, keyPrefix, lidMappingTTL).catch(error => {
                  console.error('[Redis Auth] Failed to refresh LID mapping during lazy copy:', error)
                })
              } else if (isPhoneFormat(cleanedTarget) && isLidFormat(cleanedSource)) {
                storeLidMapping(redis, sessionId, cleanedSource, cleanedTarget, keyPrefix, lidMappingTTL).catch(error => {
                  console.error('[Redis Auth] Failed to refresh LID mapping during lazy copy:', error)
                })
              }
            }
          }

          if (enableLazyDualStorage && Object.keys(lazyWriteOperations).length > 0) {
            bulkWrite(lazyWriteOperations).catch(error => {
              console.error('[Redis Auth] Lazy dual storage failed:', error)
            })
          }

          return result
        },
        
        set: async (data: any) => {
          const writeOperations: { [key: string]: any } = {}
          const opportunisticWrites: { [key: string]: any } = {}
          const mappingLookups: Promise<void>[] = []
          
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id]
              queueVariantOperations(writeOperations, category, id, value)

              if (!enableLidSupport || category !== 'session' || value === undefined || value === null) {
                continue
              }

              const cleanedId = stripDeviceSuffix(id)

              if (isLidFormat(cleanedId)) {
                mappingLookups.push(
                  (async () => {
                    const phone = await getLidMapping(redis, sessionId, cleanedId, keyPrefix)
                    if (phone) {
                      await storeLidMapping(redis, sessionId, cleanedId, phone, keyPrefix, lidMappingTTL)
                    }
                    if (!phone || !enableOpportunisticDualStorage) {
                      return
                    }
                    queueVariantOperations(opportunisticWrites, category, phone, value)
                  })()
                )
              } else if (isPhoneFormat(cleanedId)) {
                mappingLookups.push(
                  (async () => {
                    const lid = await getReverseLidMapping(redis, sessionId, cleanedId, keyPrefix)
                    if (lid) {
                      await storeLidMapping(redis, sessionId, lid, cleanedId, keyPrefix, lidMappingTTL)
                    }
                    if (!lid || !enableOpportunisticDualStorage) {
                      return
                    }
                    queueVariantOperations(opportunisticWrites, category, lid, value)
                  })()
                )
              }
            }
          }

          if (mappingLookups.length > 0) {
            await Promise.allSettled(mappingLookups)
          }

          const finalOperations = enableOpportunisticDualStorage
            ? { ...writeOperations, ...opportunisticWrites }
            : writeOperations

          await bulkWrite(finalOperations)
        }
      }
    },
    
    saveCreds: async () => {
      return writeData(creds, 'creds')
    }
  }
}

/**
 * Clean up session data using the same options as useRedisAuthState
 */
export const cleanupSessionWithOptions = async (options: RedisAuthStateOptions): Promise<void> => {
  const {
    redis: redisOptions,
    keyPrefix = 'baileys:session:',
    sessionId = 'default'
  } = options

  await cleanupSession(sessionId, redisOptions, keyPrefix)
} 
