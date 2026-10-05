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
   * @deprecated Not implemented; accepted and ignored. Values are stored as JSON.
   */
  compression?: number | 'lz4' | false
  
  /**
   * @deprecated Ignored since 3.1.0: reads are always pipelined and each keys.set is one MULTI.
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
   * @deprecated Ignored.
   */
  memoryEfficient?: boolean
  
  /**
   * Cache values in process memory after a confirmed read or write.
   * Disable it when the keys are already wrapped in Baileys' makeCacheableSignalKeyStore.
   * @default true
   */
  enableCache?: boolean
  
  /**
   * Memory cache TTL in milliseconds
   * @default 30000 (30 seconds)
   */
  cacheTTL?: number
  
  /**
   * @deprecated Ignored since 3.1.0. Keys are stored under the exact ids Baileys uses;
   * Baileys itself owns PN/LID mapping and session migration.
   */
  enableLidSupport?: boolean

  /**
   * @deprecated Ignored since 3.1.0 (it copied sessions between devices).
   */
  enableLazyDualStorage?: boolean

  /**
   * @deprecated Ignored since 3.1.0 (it copied sessions between devices).
   */
  enableOpportunisticDualStorage?: boolean

  /**
   * Enable verbose RedisAuth logging for troubleshooting
   * @default false
   */
  enableLog?: boolean
  
  /**
   * @deprecated Ignored since 3.1.0.
   */
  lidMappingTTL?: number
  
  /**
   * @deprecated Ignored since 3.1.0.
   */
  lidCacheSize?: number
}
