# WhatsApp @lid Format Support Documentation

## Overview

Starting with version 1.1.0, `@baileys/redis-auth-state` includes full support for WhatsApp's @lid (Linked ID) format. This feature automatically handles the mapping between @lid format and phone number format, ensuring seamless session key management and preventing decryption errors.

## Background

### What is @lid Format?

WhatsApp uses two different formats to identify users:
- **Phone Number Format**: `60196953307@s.whatsapp.net` (traditional format)
- **LID Format**: `114194640801953@lid` (newer format used by WhatsApp Web)

Both formats refer to the same WhatsApp account, but session keys stored under one format cannot decrypt messages using the other format, leading to errors like:
- "Bad MAC Error"
- "No matching sessions found"
- "Invalid PreKey ID"

### When Does This Issue Occur?

The @lid format issue typically occurs when:
1. Messages are sent manually from WhatsApp phone (uses @lid format)
2. Bot receives messages after WhatsApp Web reconnection
3. Session keys were established using phone number format
4. Multi-device synchronization occurs

## How LID Support Works

### Automatic Detection and Mapping

The library automatically:
1. **Detects** when a JID uses @lid format
2. **Maps** @lid to phone number and vice versa
3. **Stores** session keys under both formats
4. **Retrieves** session keys by checking both formats
5. **Caches** mappings for high performance

### Dual-Key Storage

When a session key is stored:
```
Original: session-60196953307@s.whatsapp.net
Also stored as: session-114194640801953@lid (if mapping exists)
```

When a session key is retrieved:
```
Request for: session-114194640801953@lid
Checks: session-114194640801953@lid AND session-60196953307@s.whatsapp.net
```

## Configuration

### Enable/Disable LID Support

```typescript
const { state, saveCreds } = await useRedisAuthState({
  redis: redisClient,
  sessionId: 'my-session',
  enableLidSupport: true,    // Enable @lid support (default: true)
  lidMappingTTL: 604800,     // Mapping TTL in seconds (default: 7 days)
  lidCacheSize: 10000        // Max cached mappings (default: 10000)
})
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableLidSupport` | `boolean` | `true` | Enable/disable @lid format support |
| `lidMappingTTL` | `number` | `604800` | TTL for LID mappings in seconds (7 days) |
| `lidCacheSize` | `number` | `10000` | Maximum LID mappings to cache in memory |

## Manual LID Management

While the library handles LID mapping automatically, you can also manage mappings manually:

### Store a Mapping

```typescript
import { storeLidMapping } from '@baileys/redis-auth-state'

await storeLidMapping(
  redisClient,
  'my-session',
  '114194640801953@lid',
  '60196953307@s.whatsapp.net',
  'baileys:session:',
  604800 // TTL in seconds
)
```

### Get Phone Number from @lid

```typescript
import { getLidMapping } from '@baileys/redis-auth-state'

const phoneNumber = await getLidMapping(
  redisClient,
  'my-session',
  '114194640801953@lid'
)
// Returns: '60196953307@s.whatsapp.net' or null
```

### Get @lid from Phone Number

```typescript
import { getReverseLidMapping } from '@baileys/redis-auth-state'

const lid = await getReverseLidMapping(
  redisClient,
  'my-session',
  '60196953307@s.whatsapp.net'
)
// Returns: '114194640801953@lid' or null
```

### Check Format Type

```typescript
import { isLidFormat, isPhoneFormat } from '@baileys/redis-auth-state'

isLidFormat('114194640801953@lid')           // true
isPhoneFormat('60196953307@s.whatsapp.net')  // true
```

### Batch Operations

```typescript
import { batchGetLidMappings } from '@baileys/redis-auth-state'

const jids = [
  '114194640801953@lid',
  '60196953307@s.whatsapp.net',
  '123456789@lid'
]

const mappings = await batchGetLidMappings(
  redisClient,
  'my-session',
  jids
)
// Returns Map with found mappings
```

## Performance Considerations

### Memory Usage

- **Redis Storage**: ~2x for session keys (stored under both formats)
- **Memory Cache**: ~10-50MB for 1500 sessions
- **Per Mapping**: ~1KB in Redis, ~200 bytes in memory

### Latency Impact

- **Cache Hit**: No additional latency
- **Cache Miss**: +1-2ms for Redis lookup
- **First Message**: One-time mapping creation overhead
- **Subsequent Messages**: Cached, no overhead

### High Concurrency

The implementation is designed for high-concurrency environments:
- **Session Isolation**: Each session has its own cache
- **Lock-Free**: No distributed locks needed
- **Parallel Operations**: Batch operations for efficiency
- **Connection Pooling**: Dedicated connections for LID operations

## Migration Guide

### Upgrading from Version 1.0.x

1. **No Code Changes Required**: LID support is enabled by default
2. **Existing Sessions**: Continue working without modification
3. **Gradual Migration**: Mappings created on first @lid encounter
4. **Opt-Out Available**: Set `enableLidSupport: false` if needed

### Disabling LID Support

If you need to disable LID support:

```typescript
const { state, saveCreds } = await useRedisAuthState({
  redis: redisClient,
  sessionId: 'my-session',
  enableLidSupport: false  // Disable LID support
})
```

## Monitoring and Debugging

### Get LID Statistics

```typescript
import { getLidStats } from '@baileys/redis-auth-state'

const stats = getLidStats('my-session')
console.log(`Cache size: ${stats.cacheSize}`)
```

### Debug Logging

The library logs LID operations with the prefix `[LID Handler]` and `[Redis Auth]`:

```
[LID Handler] Stored mapping: 114194640801953@lid <-> 60196953307@s.whatsapp.net
[Redis Auth] Found session under alternate format: 114194640801953@lid -> 60196953307@s.whatsapp.net
[Redis Auth] Dual storing session: 60196953307@s.whatsapp.net and 114194640801953@lid
```

### Common Issues and Solutions

#### Issue: Sessions still not found

**Solution**: Ensure both sender and receiver have established sessions. The mapping is created only when both JID formats are encountered.

#### Issue: High memory usage

**Solution**: Reduce `lidCacheSize` or decrease `lidMappingTTL`:

```typescript
const { state, saveCreds } = await useRedisAuthState({
  redis: redisClient,
  sessionId: 'my-session',
  lidCacheSize: 5000,      // Reduce cache size
  lidMappingTTL: 86400     // 1 day instead of 7
})
```

#### Issue: Mappings not persisting

**Solution**: Check Redis connection and TTL settings. Mappings expire after `lidMappingTTL` seconds.

## Cleanup

### Clean Session with LID Data

```typescript
import { cleanupSessionWithOptions } from '@baileys/redis-auth-state'

// This will clean up everything including LID mappings
await cleanupSessionWithOptions({
  redis: redisClient,
  sessionId: 'my-session',
  keyPrefix: 'baileys:session:'
})
```

### Clean Only LID Mappings

```typescript
import { cleanupLidMappings } from '@baileys/redis-auth-state'

await cleanupLidMappings(
  redisClient,
  'my-session',
  'baileys:session:'
)
```

### Clean LID Cache

```typescript
import { cleanupLidCache } from '@baileys/redis-auth-state'

// Clear memory cache only
cleanupLidCache('my-session')
```

## Redis Key Structure

LID mappings are stored in Redis with the following structure:

```
# LID to Phone mapping
baileys:session:lid:{sessionId}:{lid} -> {phoneNumber}

# Phone to LID mapping (reverse)
baileys:session:lid:reverse:{sessionId}:{phoneNumber} -> {lid}

# Example
baileys:session:lid:my-session:114194640801953@lid -> 60196953307@s.whatsapp.net
baileys:session:lid:reverse:my-session:60196953307@s.whatsapp.net -> 114194640801953@lid
```

## Best Practices

1. **Keep LID Support Enabled**: Unless you have a specific reason, keep it enabled for maximum compatibility
2. **Monitor Cache Size**: Use `getLidStats()` to monitor cache usage
3. **Adjust TTL Based on Usage**: Longer TTL for stable production, shorter for development
4. **Use Batch Operations**: When checking multiple JIDs, use `batchGetLidMappings()`
5. **Clean Up Properly**: Use `cleanupSessionWithOptions()` when removing sessions

## Compatibility

- **Backward Compatible**: No breaking changes from version 1.0.x
- **Redis Clients**: Works with both `redis` and `ioredis`
- **Baileys Version**: Compatible with Baileys 6.0+
- **Node.js**: Requires Node.js 16+

## Support

For issues related to LID format support:
1. Check debug logs for `[LID Handler]` messages
2. Verify Redis connectivity and permissions
3. Ensure correct configuration options
4. Create an issue on GitHub with debug logs