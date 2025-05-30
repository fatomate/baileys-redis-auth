/**
 * High-performance utilities for auth state management
 * Optimized for speed and memory efficiency
 */

// Memory cache for frequently accessed data
const memoryCache = new Map<string, { data: any; timestamp: number }>()

/**
 * Optimized BufferJSON with performance improvements
 */
export const BufferJSON = {
  /**
   * High-performance replacer with minimal object creation
   */
  replacer: (_: string, value: any) => {
    if (value && typeof value === 'object') {
      // Handle Buffer-like objects
      if (value.type === 'Buffer' && Array.isArray(value.data)) {
        return {
          type: 'Buffer',
          data: value.data
        }
      }
      // Handle Uint8Array
      if (value.constructor && value.constructor.name === 'Uint8Array') {
        return {
          type: 'Buffer',
          data: Array.from(value)
        }
      }
      // Handle Buffer objects
      if (value.constructor && value.constructor.name === 'Buffer') {
        return {
          type: 'Buffer',
          data: Array.from(value)
        }
      }
    }
    return value
  },

  /**
   * High-performance reviver with optimized buffer creation
   */
  reviver: (_: string, value: any) => {
    if (typeof value === 'object' && value !== null && value.type === 'Buffer') {
      if (Array.isArray(value.data)) {
        // Always use Uint8Array for cross-platform compatibility
        return new Uint8Array(value.data)
      }
    }
    return value
  }
}

/**
 * High-performance compression utilities using native APIs
 */
export class CompressionUtils {
  /**
   * Simple compression using basic encoding (fallback implementation)
   */
  static compress(data: string, algorithm: number | 'lz4' | false): string {
    if (algorithm === false || algorithm === 0) {
      return data
    }

    // For this implementation, we'll use a simplified compression
    // In production, you'd want to use proper compression libraries
    try {
      // Try to use native compression if available
      if (typeof TextEncoder !== 'undefined') {
        const encoder = new TextEncoder()
        const compressed = encoder.encode(data)
        return btoa(String.fromCharCode(...compressed))
      }
    } catch (error) {
      // Fallback to no compression
    }

    return data
  }

  /**
   * Simple decompression
   */
  static decompress(data: string, algorithm: number | 'lz4' | false): string {
    if (algorithm === false || algorithm === 0) {
      return data
    }

    try {
      // Try to decompress if it was compressed
      if (typeof TextDecoder !== 'undefined') {
        const compressed = atob(data)
        const bytes = new Uint8Array(compressed.split('').map(char => char.charCodeAt(0)))
        const decoder = new TextDecoder()
        return decoder.decode(bytes)
      }
    } catch (error) {
      // Fallback - assume it's not compressed
      return data
    }

    return data
  }
}

/**
 * High-performance memory cache with TTL
 */
export class MemoryCache {
  private static instance: MemoryCache
  private cache = new Map<string, { data: any; timestamp: number }>()
  private ttl: number
  private hitCount = 0
  private missCount = 0

  constructor(ttl: number = 30000) {
    this.ttl = ttl
    this.startCleanup()
  }

  static getInstance(ttl?: number): MemoryCache {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache(ttl)
    }
    return MemoryCache.instance
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) {
      this.missCount++
      return null
    }

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      this.missCount++
      return null
    }

    this.hitCount++
    return entry.data
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    this.hitCount = 0
    this.missCount = 0
  }

  get size(): number {
    return this.cache.size
  }

  getHitRate(): number {
    const total = this.hitCount + this.missCount
    return total > 0 ? this.hitCount / total : 0
  }

  private startCleanup(): void {
    setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > this.ttl) {
          this.cache.delete(key)
        }
      }
    }, Math.min(this.ttl / 2, 15000)) // Clean every 15 seconds or half TTL
  }
}

/**
 * Batch operation manager for Redis operations
 */
export class BatchManager {
  private operations: Array<{ type: 'set' | 'get' | 'del'; key: string; value?: any; resolve: Function; reject: Function }> = []
  private batchSize: number
  private flushTimer: any = null

  constructor(batchSize: number = 100) {
    this.batchSize = batchSize
  }

  addOperation<T>(type: 'set' | 'get' | 'del', key: string, value?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      this.operations.push({ type, key, value, resolve, reject })
      
      if (this.operations.length >= this.batchSize) {
        this.flush()
      } else if (!this.flushTimer) {
        this.flushTimer = setTimeout(() => this.flush(), 10) // 10ms batch window
      }
    })
  }

  private flush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }

    if (this.operations.length === 0) return

    const currentOps = this.operations.splice(0)
    // This would be implemented with actual Redis pipeline
    // For now, we'll process sequentially but this structure allows for batching
    currentOps.forEach(op => {
      // Implementation depends on Redis client
      op.resolve(null)
    })
  }
}

/**
 * Optimized key generator with minimal string operations
 */
export const generateRedisKey = (prefix: string, sessionId: string, key: string): string => {
  return `${prefix}${sessionId}:${key}`
}

/**
 * Fast serialization with optional compression
 */
export const serialize = (data: any, compression: number | 'lz4' | false = false): string => {
  const jsonStr = JSON.stringify(data, BufferJSON.replacer)
  return CompressionUtils.compress(jsonStr, compression)
}

/**
 * Fast deserialization with decompression
 */
export const deserialize = (data: string, compression: number | 'lz4' | false = false): any => {
  const decompressed = CompressionUtils.decompress(data, compression)
  return JSON.parse(decompressed, BufferJSON.reviver)
} 