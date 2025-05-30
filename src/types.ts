export interface RedisAuthStateOptions {
  /**
   * Redis client options or existing Redis client instance
   */
  redis: any
  
  /**
   * Key prefix for storing session data in Redis
   * @default 'baileys:session:'
   */
  keyPrefix?: string
  
  /**
   * Session identifier - used to separate different WhatsApp sessions
   * @default 'default'
   */
  sessionId?: string
  
  /**
   * TTL (Time to Live) for session data in seconds
   * Set to 0 or undefined for no expiration
   * @default undefined (no expiration)
   */
  ttl?: number
  
  /**
   * Compression level for stored data
   * 0 = no compression, 1-9 = gzip levels, 'lz4' = LZ4 compression
   * @default 'lz4'
   */
  compression?: number | 'lz4' | false
  
  /**
   * Enable batch operations for better performance
   * @default true
   */
  enableBatching?: boolean
  
  /**
   * Batch size for bulk operations
   * @default 100
   */
  batchSize?: number
  
  /**
   * Connection pool size for Redis
   * @default 10
   */
  poolSize?: number
  
  /**
   * Enable memory-efficient mode
   * @default true
   */
  memoryEfficient?: boolean
  
  /**
   * Cache frequently accessed data in memory
   * @default true
   */
  enableCache?: boolean
  
  /**
   * Memory cache TTL in milliseconds
   * @default 30000 (30 seconds)
   */
  cacheTTL?: number
} 