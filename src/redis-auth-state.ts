import type { RedisAuthStateOptions } from './types.js'
import { initAuthCreds, proto } from 'baileys'
import type { AuthenticationState } from 'baileys'
import { cleanupLidCache, cleanupLidMappings } from './lid-handler.js'

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

const parseScanResponse = (response: any): { cursor: string; keys: string[] } => {
  if (Array.isArray(response)) {
    return {
      cursor: String(response[0] ?? '0'),
      keys: Array.isArray(response[1]) ? response[1] : []
    }
  }

  if (response && typeof response === 'object') {
    return {
      cursor: String(response.cursor ?? '0'),
      keys: Array.isArray(response.keys) ? response.keys : []
    }
  }

  return { cursor: '0', keys: [] }
}

const chunkArray = <T>(items: T[], size: number): T[][] => {
  const normalizedSize = Math.max(1, size)
  const chunks: T[][] = []

  for (let i = 0; i < items.length; i += normalizedSize) {
    chunks.push(items.slice(i, i + normalizedSize))
  }

  return chunks
}

/**
 * Create Redis client based on options and type
 */
const createRedisClient = async (redisOptions: any): Promise<any> => {
  try {
    // Try ioredis first (optional dependency)
    const ioredisModuleName = 'ioredis'
    const ioredisModule = await import(ioredisModuleName)
    const Redis = ioredisModule.default ?? ioredisModule
    const client = new Redis(redisOptions)
    return client
  } catch (error: any) {
    // Fallback to redis
    try {
      const { createClient } = await import('redis')
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
      } else if (typeof redis.scanIterator === 'function') {
        // node-redis v4+ iterator API
        for await (const keys of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
          if (Array.isArray(keys)) {
            keysToDelete.push(...keys)
          } else {
            keysToDelete.push(keys)
          }
        }
      } else {
        // Fallback SCAN handling for generic clients
        let cursor = '0'
        do {
          const scanResponse = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
          const { cursor: nextCursor, keys } = parseScanResponse(scanResponse)
          cursor = nextCursor
          keysToDelete.push(...keys)
        } while (cursor !== '0')
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
 * Thrown when the auth store cannot prove what Redis holds: a failed or unparsable read,
 * a failed or partially failed write, or stored credentials that are not valid creds.
 * Callers must treat it as "store unavailable", never as "no auth".
 */
export class AuthStoreUnavailableError extends Error {
  readonly code = 'AUTH_STORE_UNAVAILABLE'

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'AuthStoreUnavailableError'
    if (cause !== undefined) {
      ;(this as any).cause = cause
    }
  }
}

/**
 * Binary values (Buffer and any other Uint8Array) are stored as {type:'Buffer', data:[...bytes]}.
 * The array form is what earlier versions wrote and read, so data stays readable after a rollback.
 */
const fastSerialize = (data: any): string => {
  return JSON.stringify(data, function (this: any, key: string, value: any) {
    // JSON.stringify applies Buffer#toJSON before the replacer; this[key] is the original value.
    const original = this[key]
    if (original instanceof Uint8Array) {
      return { type: 'Buffer', data: Array.from(original) }
    }
    return value
  })
}

const fastDeserialize = (data: string): any => {
  return JSON.parse(data, (_key, value) => {
    if (value !== null && typeof value === 'object' && value.type === 'Buffer') {
      if (Array.isArray(value.data)) return Buffer.from(value.data)
      if (typeof value.data === 'string') return Buffer.from(value.data, 'base64')
    }
    return value
  })
}

const LEGACY_IDENTITY_KEY_LENGTH = 33

/**
 * Before 3.1.0, Uint8Array identity keys were stored as {"0":5,"1":...,"32":n}.
 * Decode exactly that shape (keys 0..32, integer bytes) and leave anything else untouched.
 */
const decodeLegacyIdentityKey = (value: any): any => {
  if (value === null || typeof value !== 'object' || Array.isArray(value) || value instanceof Uint8Array) {
    return value
  }
  if (Object.keys(value).length !== LEGACY_IDENTITY_KEY_LENGTH) return value
  const bytes: number[] = []
  for (let i = 0; i < LEGACY_IDENTITY_KEY_LENGTH; i++) {
    const byte = value[String(i)]
    if (!Number.isInteger(byte) || byte < 0 || byte > 255) return value
    bytes.push(byte)
  }
  return Buffer.from(bytes)
}

// Baileys key pairs are raw Curve25519 keys (32 bytes); registration ids are unsigned.
const CURVE_KEY_LENGTH = 32
const isCurveKey = (value: any): boolean => value instanceof Uint8Array && value.length === CURVE_KEY_LENGTH
const isKeyPair = (pair: any): boolean => isCurveKey(pair?.public) && isCurveKey(pair?.private)

const isValidCreds = (creds: any): boolean =>
  creds !== null &&
  typeof creds === 'object' &&
  isKeyPair(creds.noiseKey) &&
  isKeyPair(creds.signedIdentityKey) &&
  Number.isInteger(creds.registrationId) &&
  creds.registrationId >= 0 &&
  creds.registrationId <= 0xffffffff

/**
 * Run a batch and return its replies, throwing unless every command succeeded.
 * Handles ioredis ([err, reply] tuples) and node-redis (plain replies) result shapes.
 */
const execChecked = async (batch: any, expected: number, operation: string): Promise<any[]> => {
  let results: any
  try {
    results = await batch.exec()
  } catch (error) {
    throw new AuthStoreUnavailableError(`Redis auth ${operation} failed`, error)
  }
  if (!Array.isArray(results) || results.length !== expected) {
    throw new AuthStoreUnavailableError(`Redis auth ${operation} returned no result`)
  }
  return results.map((entry: any) => {
    if (Array.isArray(entry)) {
      if (entry[0]) throw new AuthStoreUnavailableError(`Redis auth ${operation} command failed`, entry[0])
      return entry[1]
    }
    if (entry instanceof Error) throw new AuthStoreUnavailableError(`Redis auth ${operation} command failed`, entry)
    return entry
  })
}

/**
 * Wrap a cached Signal key store (for example Baileys' makeCacheableSignalKeyStore) so a failed
 * write can never be served from its cache. Baileys fills that cache before the underlying write
 * resolves; on failure this flushes it before any queued read runs. get/set/clear are serialized,
 * which matches the single mutex the Baileys cache already holds for both.
 */
export const withCacheRollback = <T extends { get: (...args: any[]) => any; set: (data: any) => any; clear?: () => any }>(
  keys: T
): T => {
  let tail: Promise<unknown> = Promise.resolve()
  const serial = <R>(work: () => Promise<R>): Promise<R> => {
    const run = tail.then(work, work)
    tail = run.catch(() => undefined)
    return run
  }

  return {
    ...keys,
    get: (...args: any[]) => serial(async () => keys.get(...args)),
    set: (data: any) =>
      serial(async () => {
        try {
          return await keys.set(data)
        } catch (error) {
          await keys.clear?.()
          throw error
        }
      }),
    clear: () => serial(async () => keys.clear?.())
  }
}

/**
 * Redis-backed Baileys authentication state.
 *
 * Every Signal key is stored under exactly the id Baileys passes in; Baileys owns PN/LID
 * mapping and session migration. Reads and writes fail closed with AuthStoreUnavailableError.
 */
export const useRedisAuthState = async (
  options: RedisAuthStateOptions
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> => {
  const {
    redis: redisOptions,
    keyPrefix = 'baileys:session:',
    sessionId = 'default',
    ttl,
    batchSize = 100,
    poolSize = 10,
    enableCache = true,
    cacheTTL = 30000,
    enableLog = false
  } = options

  const sessionCache = getSessionCache(sessionId)

  const log = (...args: any[]): void => {
    if (enableLog) {
      console.log('[RedisAuth]', ...args)
    }
  }

  let redis: any
  if (redisOptions && (typeof redisOptions.connect === 'function' || redisOptions.constructor?.name === 'Redis' || redisOptions.constructor?.name === 'Cluster')) {
    redis = redisOptions
  } else {
    const pool = await getSessionPool(sessionId, redisOptions, poolSize)
    redis = await pool.getConnection()
  }

  const clientType = detectRedisClient(redis).type
  const sessionKey = `${keyPrefix}${sessionId}`
  const getRedisKey = (key: string): string => `${sessionKey}:${key}`
  const newBatch = (): any => (redis.pipeline ? redis.pipeline() : redis.multi())

  const getCachedData = (key: string): any => {
    if (!enableCache) return undefined
    const cached = sessionCache.get(key)
    if (!cached) return undefined
    if (Date.now() - cached.timestamp > cacheTTL) {
      sessionCache.delete(key)
      return undefined
    }
    return cached.data
  }

  const setCachedData = (key: string, data: any): void => {
    if (!enableCache) return
    sessionCache.set(key, { data, timestamp: Date.now() })
  }

  const parse = (raw: string, key: string): any => {
    try {
      return fastDeserialize(raw)
    } catch (error) {
      throw new AuthStoreUnavailableError(`Redis auth value for ${key.split(':').pop()?.split('-')[0]} is unparsable`, error)
    }
  }

  // Exact-key bulk read. Missing keys are absent from the result; any failure throws.
  const bulkRead = async (keys: string[]): Promise<{ [key: string]: any }> => {
    const result: { [key: string]: any } = {}
    const missing: string[] = []
    for (const key of keys) {
      const cached = getCachedData(getRedisKey(key))
      if (cached !== undefined) result[key] = cached
      else missing.push(key)
    }

    for (const chunk of chunkArray(missing, batchSize)) {
      const batch = newBatch()
      chunk.forEach(key => batch.get(getRedisKey(key)))
      const replies = await execChecked(batch, chunk.length, 'read')
      chunk.forEach((key, i) => {
        const raw = replies[i]
        if (raw === null) return
        if (raw === undefined) throw new AuthStoreUnavailableError(`Redis returned no reply for ${key}`)
        const value = parse(raw, key)
        result[key] = value
        setCachedData(getRedisKey(key), value)
      })
    }

    return result
  }

  // One MULTI per call; the cache changes only after every command succeeded.
  const bulkWrite = async (data: { [key: string]: any }): Promise<void> => {
    const entries = Object.entries(data)
    if (entries.length === 0) return

    const batch = redis.multi()
    const serialized: Array<[string, any, string | null]> = entries.map(([key, value]) => {
      const redisKey = getRedisKey(key)
      if (value === null || value === undefined) {
        batch.del(redisKey)
        return [redisKey, value, null]
      }
      const payload = fastSerialize(value)
      if (ttl && ttl > 0) {
        if (clientType === 'ioredis') batch.set(redisKey, payload, 'EX', ttl)
        else batch.set(redisKey, payload, { EX: ttl })
      } else {
        batch.set(redisKey, payload)
      }
      return [redisKey, value, payload]
    })

    await execChecked(batch, entries.length, 'write')

    for (const [redisKey, value, payload] of serialized) {
      if (payload === null) sessionCache.delete(redisKey)
      else setCachedData(redisKey, value)
    }
    log('Committed auth keys', { count: entries.length })
  }

  const credsKey = getRedisKey('creds')
  let rawCreds: any
  try {
    rawCreds = await redis.get(credsKey)
  } catch (error) {
    throw new AuthStoreUnavailableError('Redis auth creds read failed', error)
  }

  let creds: any
  if (rawCreds === null) {
    console.warn('[redis-auth] creds missing, new pairing', { sessionId })
    creds = initAuthCreds()
  } else {
    creds = parse(rawCreds, 'creds')
    if (!isValidCreds(creds)) {
      throw new AuthStoreUnavailableError('Redis auth creds are not valid credentials')
    }
  }

  const toStoredValue = (type: string, value: any): any => {
    if (type === 'identity-key') return decodeLegacyIdentityKey(value)
    if (type === 'app-state-sync-key') {
      try {
        return proto.Message.AppStateSyncKeyData.fromObject(value)
      } catch {
        return value
      }
    }
    return value
  }

  return {
    state: {
      creds,
      keys: {
        get: async (type: string, ids: string[]) => {
          const data = await bulkRead(ids.map(id => `${type}-${id}`))
          const result: { [id: string]: any } = {}
          for (const id of ids) {
            const value = data[`${type}-${id}`]
            result[id] = value === undefined || value === null ? null : toStoredValue(type, value)
          }
          return result
        },

        set: async (data: any) => {
          const writes: { [key: string]: any } = {}
          for (const category in data) {
            for (const id in data[category]) {
              writes[`${category}-${id}`] = data[category][id]
            }
          }
          await bulkWrite(writes)
        }
      }
    } as AuthenticationState,

    saveCreds: async () => {
      const batch = redis.multi()
      batch.set(credsKey, fastSerialize(creds))
      await execChecked(batch, 1, 'creds write')
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
