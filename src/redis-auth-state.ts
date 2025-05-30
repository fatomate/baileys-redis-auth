import { RedisAuthStateOptions } from './types'

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
    const Redis = require('ioredis')
    const client = new Redis(redisOptions)
    return client
  } catch (error) {
    // Fallback to redis
    try {
      const { createClient } = require('redis')
      const client = createClient(redisOptions)
      await client.connect()
      return client
    } catch (redisError) {
      throw new Error(`Failed to create Redis client. Install either 'redis' or 'ioredis': ${error.message}`)
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
export const cleanupSession = async (sessionId: string): Promise<void> => {
  // Clean up memory cache
  sessionCaches.delete(sessionId)
  
  // Clean up connection pool
  const pool = sessionPools.get(sessionId)
  if (pool) {
    await pool.destroy()
    sessionPools.delete(sessionId)
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
      const pipeline = this.redis.multi()
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
      return typeof Buffer !== 'undefined' ? Buffer.from(value.data) : new Uint8Array(value.data)
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
      await redis.set(key, value)
      console.warn(`Failed to set TTL for key ${key}, falling back to basic set`)
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
    compression = 'lz4',
    enableBatching = true,
    batchSize = 100,
    poolSize = 10,
    memoryEfficient = true,
    enableCache = true,
    cacheTTL = 30000
  } = options

  // Get session-specific cache for better isolation
  const sessionCache = getSessionCache(sessionId)

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
        const pipeline = redis.multi()
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
    const pipeline = redis.multi()
    
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
        const { initAuthCreds } = require('baileys')
        creds = initAuthCreds()
      } catch (error) {
        // Baileys not available, use empty object
        creds = {}
      }
    }
  } catch (error) {
    console.error('Error loading credentials:', error)
    creds = {}
  }

  return {
    state: {
      creds,
      keys: {
        get: async (type: string, ids: string[]) => {
          const keyedIds = ids.map(id => `${type}-${id}`)
          const data = await bulkRead(keyedIds)
          
          const result: { [id: string]: any } = {}
          for (const id of ids) {
            const key = `${type}-${id}`
            if (data[key] !== undefined) {
              let value = data[key]
              
              // Special handling for app-state-sync-key
              if (type === 'app-state-sync-key' && value) {
                try {
                  const { proto } = require('baileys/WAProto')
                  value = proto.Message.AppStateSyncKeyData.fromObject(value)
                } catch (error) {
                  // Baileys not available, keep original value
                }
              }
              
              result[id] = value
            }
          }
          
          return result
        },
        
        set: async (data: any) => {
          const writeOperations: { [key: string]: any } = {}
          
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id]
              const key = `${category}-${id}`
              writeOperations[key] = value
            }
          }

          await bulkWrite(writeOperations)
        }
      }
    },
    
    saveCreds: async () => {
      return writeData(creds, 'creds')
    }
  }
} 