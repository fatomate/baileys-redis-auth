# Baileys Redis Auth State

A **Redis-based authentication state manager** for the [Baileys](https://github.com/WhiskeySockets/Baileys) WhatsApp library. This package provides a drop-in replacement for `useMultiFileAuthState` that stores session data in Redis, making it ideal for production deployments and multi-instance setups.

## ✨ Features

- **🔄 Redis Storage** - Store session data in Redis for persistence and scalability
- **📦 Batch Operations** - Optimized bulk read/write operations
- **🔄 Connection Pooling** - Efficient Redis connection management
- **💾 Memory Caching** - In-memory cache for frequently accessed data
- **🗜️ Data Serialization** - Efficient JSON serialization with Buffer support
- **🔒 Session Isolation** - Separate cache and connection pools per session
- **⚡ Performance Optimized** - Designed for high-throughput applications

## Installation

```bash
npm install https://github.com/fatomate/baileys-redis-auth.git
# or
yarn add https://github.com/fatomate/baileys-redis-auth.git
```

## Prerequisites

You need Redis 4.0+ running:

```bash
# Start Redis server
redis-server

# Or with Docker
docker run -d -p 6379:6379 redis:latest
```

## 🚀 Quick Start

### Basic Usage

```typescript
import makeWASocket from 'baileys'
import { useRedisAuthState } from '@baileys/redis-auth-state'

async function connectToWhatsApp() {
  const { state, saveCreds } = await useRedisAuthState({
    redis: {
      host: 'localhost',
      port: 6379,
    },
    sessionId: 'my-session-1'
  })

  const sock = makeWASocket({
    auth: state,
    // ... other options
  })

  sock.ev.on('creds.update', saveCreds)
  return sock
}
```

### Advanced Configuration

```typescript
import { createClient } from 'redis'
import { useRedisAuthState } from '@baileys/redis-auth-state'

async function advancedSetup() {
  // Pre-configured Redis client
  const redisClient = createClient({
    url: 'redis://localhost:6379',
    socket: {
      connectTimeout: 5000,
      commandTimeout: 3000,
      keepAlive: true
    }
  })
  
  await redisClient.connect()

  const { state, saveCreds } = await useRedisAuthState({
    redis: redisClient, // Pass existing client
    sessionId: 'advanced-session',
    keyPrefix: 'myapp:whatsapp:',
    ttl: 7 * 24 * 60 * 60, // 7 days
    enableBatching: true,
    batchSize: 100,
    enableCache: true,
    cacheTTL: 30000, // 30 seconds
    poolSize: 10
  })

  return { state, saveCreds }
}
```

## 📊 Configuration Options

### RedisAuthStateOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `redis` | `RedisClientOptions \| RedisClient` | **Required** | Redis client config or existing client |
| `sessionId` | `string` | `'default'` | Unique session identifier |
| `keyPrefix` | `string` | `'baileys:session:'` | Redis key prefix |
| `ttl` | `number` | `undefined` | Data expiration in seconds |
| `enableBatching` | `boolean` | `true` | Enable bulk operations |
| `batchSize` | `number` | `100` | Batch operation size |
| `poolSize` | `number` | `10` | Connection pool size |
| `enableCache` | `boolean` | `true` | Enable memory cache |
| `cacheTTL` | `number` | `30000` | Cache TTL in milliseconds |
| `memoryEfficient` | `boolean` | `true` | Memory optimization mode |

## 🔧 Redis Client Compatibility

This library is compatible with **both** `redis` and `ioredis` clients and will automatically detect the client type:

### Using with `redis` (node-redis v4+)

```typescript
import { createClient } from 'redis'
import { useRedisAuthState } from '@baileys/redis-auth-state'

// Option 1: Pass connection options
const { state, saveCreds } = await useRedisAuthState({
  redis: {
    host: 'localhost', 
    port: 6379,
    password: 'your-password'
  },
  sessionId: 'session-1'
})

// Option 2: Pass existing client
const redisClient = createClient({
  host: 'localhost',
  port: 6379
})
await redisClient.connect()

const { state, saveCreds } = await useRedisAuthState({
  redis: redisClient,
  sessionId: 'session-1'
})
```

### Using with `ioredis`

```typescript
import Redis from 'ioredis'
import { useRedisAuthState } from '@baileys/redis-auth-state'

// Option 1: Pass connection options (will auto-detect and use ioredis if available)
const { state, saveCreds } = await useRedisAuthState({
  redis: {
    host: 'localhost',
    port: 6379,
    password: 'your-password'
  },
  sessionId: 'session-1'
})

// Option 2: Pass existing ioredis client
const redisClient = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'your-password'
})

const { state, saveCreds } = await useRedisAuthState({
  redis: redisClient,
  sessionId: 'session-1'
})

// Option 3: Using Redis Cluster with ioredis
const cluster = new Redis.Cluster([
  { host: 'localhost', port: 7000 },
  { host: 'localhost', port: 7001 }
])

const { state, saveCreds } = await useRedisAuthState({
  redis: cluster,
  sessionId: 'session-1'
})
```

### Auto-Detection Priority

The library will automatically detect and use Redis clients in this order:

1. **ioredis** - If `ioredis` is installed, it will be preferred
2. **redis** - Fallback to `redis` package if ioredis is not available
3. **Error** - If neither is available, an error will be thrown

### Installation

```bash
# For redis (node-redis)
npm install redis

# For ioredis  
npm install ioredis

# For both (library will auto-detect)
npm install redis ioredis
```

## 🏗️ Multiple Sessions

Easily manage multiple WhatsApp sessions:

```typescript
async function createMultipleSessions() {
  const sessions = []
  
  for (let i = 1; i <= 5; i++) {
    const { state, saveCreds } = await useRedisAuthState({
      redis: { host: 'localhost', port: 6379 },
      sessionId: `session-${i}`,
      enableCache: true,
      poolSize: 5 // Smaller pool per session
    })
    
    const sock = makeWASocket({ auth: state })
    sock.ev.on('creds.update', saveCreds)
    
    sessions.push(sock)
  }
  
  return sessions
}
```

## 🧹 Cleanup

Clean up session resources when done. The library provides two cleanup functions:

### Basic Cleanup (Memory Only)
```typescript
import { cleanupSession } from '@baileys/redis-auth-state'

// Clean up local resources only (memory cache and connection pools)
await cleanupSession('session-1')
```

### Complete Cleanup (Memory + Redis Data)
```typescript
import { cleanupSession, cleanupSessionWithOptions } from '@baileys/redis-auth-state'

// Option 1: Clean up everything including Redis data
await cleanupSession('session-1', {
  host: 'localhost',
  port: 6379
}, 'baileys:session:') // Optional custom key prefix

// Option 2: Clean up using the same options as useRedisAuthState
const authOptions = {
  redis: { host: 'localhost', port: 6379 },
  sessionId: 'session-1',
  keyPrefix: 'baileys:session:'
}

// Use this option when you want to delete everything
await cleanupSessionWithOptions(authOptions)

// Cleanup in your app shutdown
process.on('SIGTERM', async () => {
  await cleanupSessionWithOptions(authOptions)
  process.exit(0)
})
```

### What gets cleaned up?

**Basic cleanup (`cleanupSession` with only sessionId):**
- ✅ Memory cache for the session
- ✅ Redis connection pools
- ❌ **Does NOT delete actual session data from Redis**

**Complete cleanup (`cleanupSession` with Redis options or `cleanupSessionWithOptions`):**
- ✅ Memory cache for the session  
- ✅ Redis connection pools
- ✅ **All session data from Redis** (credentials, keys, etc.)
- ✅ Uses efficient SCAN operations to find all related keys

### Important Notes

⚠️ **Complete cleanup permanently deletes the session** - the WhatsApp instance will need to re-authenticate (scan QR code again)

🔒 **Basic cleanup preserves the session** - useful for restarting your app without losing authentication

## 🔍 Error Handling

The library includes robust error handling and fallback mechanisms:

```typescript
try {
  const { state, saveCreds } = await useRedisAuthState({
    redis: { host: 'localhost', port: 6379 },
    sessionId: 'my-session'
  })
  
  // ... your code
} catch (error) {
  console.error('Failed to initialize Redis auth state:', error)
  // Fallback to file-based auth state
  const { useMultiFileAuthState } = require('baileys')
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
}
```

## 📈 Performance Tips

1. **Use Connection Pooling**: Set `poolSize` >= 5 for concurrent operations
2. **Enable Batching**: Keep `enableBatching: true` for bulk operations
3. **Optimize Cache**: Adjust `cacheTTL` based on your access patterns
4. **Redis Tuning**: Configure Redis memory policy for your use case
5. **Session Isolation**: Use unique `sessionId` for each WhatsApp instance

## 🔧 Troubleshooting

### Common Issues

**Redis Connection Failed**
```typescript
// Ensure Redis is running and accessible
const redis = createClient({ host: 'localhost', port: 6379 })
redis.on('error', (err) => console.error('Redis error:', err))
await redis.connect()
```

**Session Data Not Persisting**
```typescript
// Ensure you're calling saveCreds on updates
sock.ev.on('creds.update', saveCreds)
```

**Memory Usage High**
```typescript
// Enable memory efficient mode
const { state, saveCreds } = await useRedisAuthState({
  // ... other options
  memoryEfficient: true,
  cacheTTL: 15000 // Shorter cache TTL
})
```

## API Reference

### useRedisAuthState(options)

Returns a Promise that resolves to:
- `state`: Auth state object for Baileys
- `saveCreds`: Function to save credentials

### cleanupSession(sessionId, redisOptions?, keyPrefix?)

Cleans up resources for a specific session:

**Parameters:**
- `sessionId` (string): The session ID to clean up
- `redisOptions` (optional): Redis connection options or client instance
- `keyPrefix` (optional, default: 'baileys:session:'): Key prefix used for Redis keys

**Behavior:**
- If only `sessionId` provided: Cleans memory cache and connection pools only
- If `redisOptions` provided: Also deletes all session data from Redis

### cleanupSessionWithOptions(options)

Convenience function that cleans up session using the same options as `useRedisAuthState`:

**Parameters:**
- `options` (RedisAuthStateOptions): Same options object used with `useRedisAuthState`

**Behavior:**
- Always performs complete cleanup (memory + Redis data)
- Uses the same `sessionId`, `keyPrefix`, and Redis connection from options

## Disclaimer

This project is not affiliated, associated, authorized, endorsed by, or in any way officially connected with WhatsApp or any of its subsidiaries or its affiliates. The official WhatsApp website can be found at whatsapp.com. "WhatsApp" as well as related names, marks, emblems and images are registered trademarks of their respective owners.

The maintainers of Baileys do not in any way condone the use of this application in practices that violate the Terms of Service of WhatsApp. The maintainers of this application call upon the personal responsibility of its users to use this application in a fair way, as it is intended to be used. Use at your own discretion. Do not spam people with this. We discourage any stalkerware, bulk or automated messaging usage.

## License

Licensed under the MIT License: Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Thus, the maintainers of the project can't be held liable for any potential misuse of this project.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Add tests if applicable  
5. Submit a pull request

Issues and feature requests are welcome! 
