# Session Decryption Issue Report: @lid vs Phone Number JID Mismatch

## Executive Summary

Session decryption failures occur when WhatsApp messages sent manually from the phone use `@lid` format in the `remoteJid` field while the session keys are stored under phone number format (`@s.whatsapp.net`). This causes "Bad MAC", "No matching sessions", and "Invalid PreKey ID" errors.

## Problem Description

### Error Symptoms
```
Error: Bad MAC Error: Bad MAC
    at Object.verifyMAC (/node_modules/libsignal/src/crypto.js:87:15)

SessionError: No matching sessions found for message
    at SessionCipher.decryptWithSessions (/node_modules/libsignal/src/session_cipher.js:161:15)

PreKeyError: Invalid PreKey ID
    at SessionBuilder.initIncoming (/node_modules/libsignal/src/session_builder.js:66:19)
```

### Root Cause

When a user sends a message manually from their WhatsApp phone (not through the bot):
- **Message Format**: `fromMe: true`, `remoteJid: "114194640801953@lid"`
- **Session Key Storage**: Stored as `session-60196953307@s.whatsapp.net`
- **Lookup Attempt**: Tries to find `session-114194640801953@lid`
- **Result**: Session key not found → Decryption fails

### Example Log Entry
```json
{
  "level": 50,
  "time": "2025-08-31T06:24:20.501Z",
  "key": {
    "remoteJid": "114194640801953@lid",
    "fromMe": true,
    "id": "83C6BE702A0068152EBA4525D669DFC3"
  },
  "err": {
    "type": "SessionError",
    "message": "No matching sessions found for message"
  }
}
```

## Technical Analysis

### Current Flow

1. **Session Establishment**
   - Bot sends message to `60196953307@s.whatsapp.net`
   - Session key stored in Redis: `baileys:auth:{instance_id}:session-60196953307@s.whatsapp.net`

2. **Manual Message from Phone**
   - User sends message manually
   - WhatsApp uses LID format: `114194640801953@lid`
   - Baileys attempts to decrypt using session key: `baileys:auth:{instance_id}:session-114194640801953@lid`
   - Key doesn't exist → Decryption fails

3. **LID Format**
   - LID (Linked ID) is WhatsApp's new addressing format
   - Same contact can be referenced as:
     - Phone: `60196953307@s.whatsapp.net`
     - LID: `114194640801953@lid`
   - Both refer to the same WhatsApp account

### Code Analysis

#### Redis Auth State Key Storage (`@baileys/redis-auth-state/lib/redis-auth-state.js`)
```javascript
// Current implementation - Line 551
get: async (type, ids) => {
    const keyedIds = ids.map(id => `${type}-${id}`);
    const data = await bulkRead(keyedIds);
    // ...
}

// Current implementation - Line 573
set: async (data) => {
    const writeOperations = {};
    for (const category in data) {
        for (const id in data[category]) {
            const value = data[category][id];
            const key = `${category}-${id}`;
            writeOperations[key] = value;
        }
    }
    await bulkWrite(writeOperations);
}
```

The current implementation stores and retrieves keys using the exact JID format without any normalization or aliasing.

## Proposed Solution

### Approach 1: Dual Key Storage (Recommended)

Store session keys under both formats to ensure they can be found regardless of which JID format is used.

#### Implementation for `redis-auth-state.js`

**1. Add LID mapping helper functions:**
```javascript
// Add at the top of redis-auth-state.js after imports

// Cache for LID to phone mappings
const lidMappingCache = new Map();

/**
 * Get phone number for a LID address
 * @param {string} sessionId - The session/instance ID
 * @param {string} lidAddress - The @lid address
 * @returns {Promise<string|null>} The phone number or null
 */
async function getLidPhoneMapping(redis, sessionId, lidAddress) {
    // Check cache first
    const cacheKey = `${sessionId}:${lidAddress}`;
    if (lidMappingCache.has(cacheKey)) {
        return lidMappingCache.get(cacheKey);
    }
    
    // Try to get from Redis
    const mappingKey = `baileys:lid:${sessionId}:${lidAddress}`;
    const phoneNumber = await redis.get(mappingKey);
    
    if (phoneNumber) {
        lidMappingCache.set(cacheKey, phoneNumber);
    }
    
    return phoneNumber;
}

/**
 * Get LID address for a phone number
 * @param {string} sessionId - The session/instance ID
 * @param {string} phoneNumber - The phone number
 * @returns {Promise<string|null>} The LID address or null
 */
async function getPhoneLidMapping(redis, sessionId, phoneNumber) {
    // Check cache first
    const reverseCacheKey = `${sessionId}:reverse:${phoneNumber}`;
    if (lidMappingCache.has(reverseCacheKey)) {
        return lidMappingCache.get(reverseCacheKey);
    }
    
    // Try to get from Redis
    const mappingKey = `baileys:lid:reverse:${sessionId}:${phoneNumber}`;
    const lidAddress = await redis.get(mappingKey);
    
    if (lidAddress) {
        lidMappingCache.set(reverseCacheKey, lidAddress);
    }
    
    return lidAddress;
}

/**
 * Store LID to phone mapping bidirectionally
 * @param {string} sessionId - The session/instance ID
 * @param {string} lidAddress - The @lid address
 * @param {string} phoneNumber - The phone number
 */
async function storeLidMapping(redis, sessionId, lidAddress, phoneNumber) {
    const pipeline = redis.multi();
    
    // Store both directions
    pipeline.set(`baileys:lid:${sessionId}:${lidAddress}`, phoneNumber, 'EX', 86400 * 7); // 7 days TTL
    pipeline.set(`baileys:lid:reverse:${sessionId}:${phoneNumber}`, lidAddress, 'EX', 86400 * 7);
    
    await pipeline.exec();
    
    // Update cache
    const cacheKey = `${sessionId}:${lidAddress}`;
    const reverseCacheKey = `${sessionId}:reverse:${phoneNumber}`;
    lidMappingCache.set(cacheKey, phoneNumber);
    lidMappingCache.set(reverseCacheKey, lidAddress);
}
```

**2. Modify the `get` function to check both formats (around line 550):**
```javascript
get: async (type, ids) => {
    let expandedIds = [...ids];
    
    // Special handling for session keys with @lid
    if (type === 'session') {
        const additionalIds = [];
        
        for (const id of ids) {
            // If it's a @lid, also check for phone number version
            if (id.includes('@lid')) {
                const phoneMapping = await getLidPhoneMapping(redis, sessionId, id);
                if (phoneMapping) {
                    additionalIds.push(phoneMapping);
                    console.log(`[Redis Auth] Expanding session lookup: ${id} -> ${phoneMapping}`);
                }
            }
            // If it's a phone number, also check for @lid version
            else if (id.includes('@s.whatsapp.net')) {
                const lidMapping = await getPhoneLidMapping(redis, sessionId, id);
                if (lidMapping) {
                    additionalIds.push(lidMapping);
                    console.log(`[Redis Auth] Expanding session lookup: ${id} -> ${lidMapping}`);
                }
            }
        }
        
        // Add additional IDs to the list
        expandedIds = [...expandedIds, ...additionalIds];
    }
    
    const keyedIds = expandedIds.map(id => `${type}-${id}`);
    const data = await bulkRead(keyedIds);
    const result = {};
    
    // Map results back to original requested IDs
    for (const id of ids) {
        const key = `${type}-${id}`;
        if (data[key] !== undefined) {
            result[id] = data[key];
        } else {
            // Check if we found it under an alternate format
            if (type === 'session') {
                let found = false;
                
                if (id.includes('@lid')) {
                    const phoneMapping = await getLidPhoneMapping(redis, sessionId, id);
                    if (phoneMapping) {
                        const altKey = `${type}-${phoneMapping}`;
                        if (data[altKey] !== undefined) {
                            result[id] = data[altKey];
                            found = true;
                        }
                    }
                } else if (id.includes('@s.whatsapp.net')) {
                    const lidMapping = await getPhoneLidMapping(redis, sessionId, id);
                    if (lidMapping) {
                        const altKey = `${type}-${lidMapping}`;
                        if (data[altKey] !== undefined) {
                            result[id] = data[altKey];
                            found = true;
                        }
                    }
                }
                
                if (found) {
                    console.log(`[Redis Auth] Found session under alternate format for ${id}`);
                }
            }
        }
    }
    
    return result;
}
```

**3. Modify the `set` function to store under both formats (around line 573):**
```javascript
set: async (data) => {
    const writeOperations = {};
    
    for (const category in data) {
        for (const id in data[category]) {
            const value = data[category][id];
            const key = `${category}-${id}`;
            writeOperations[key] = value;
            
            // For session keys, also store under alternate format if mapping exists
            if (category === 'session' && value !== null) {
                if (id.includes('@s.whatsapp.net')) {
                    const lidMapping = await getPhoneLidMapping(redis, sessionId, id);
                    if (lidMapping) {
                        const lidKey = `${category}-${lidMapping}`;
                        writeOperations[lidKey] = value;
                        console.log(`[Redis Auth] Dual storing session: ${id} and ${lidMapping}`);
                    }
                } else if (id.includes('@lid')) {
                    const phoneMapping = await getLidPhoneMapping(redis, sessionId, id);
                    if (phoneMapping) {
                        const phoneKey = `${category}-${phoneMapping}`;
                        writeOperations[phoneKey] = value;
                        console.log(`[Redis Auth] Dual storing session: ${id} and ${phoneMapping}`);
                    }
                }
            }
        }
    }
    
    await bulkWrite(writeOperations);
}
```

### Approach 2: JID Normalization (Alternative)

Normalize all JIDs to a single format before storage/retrieval.

```javascript
/**
 * Normalize JID to always use phone format when possible
 */
async function normalizeJid(redis, sessionId, jid) {
    if (jid.includes('@lid')) {
        const phoneMapping = await getLidPhoneMapping(redis, sessionId, jid);
        return phoneMapping || jid;
    }
    return jid;
}

// In get function
get: async (type, ids) => {
    // Normalize all IDs first
    const normalizedIds = await Promise.all(
        ids.map(id => type === 'session' ? normalizeJid(redis, sessionId, id) : id)
    );
    
    const keyedIds = normalizedIds.map(id => `${type}-${id}`);
    // ... rest of the function
}

// In set function
set: async (data) => {
    const writeOperations = {};
    
    for (const category in data) {
        for (const id in data[category]) {
            // Normalize ID before storage
            const normalizedId = category === 'session' ? 
                await normalizeJid(redis, sessionId, id) : id;
            
            const value = data[category][id];
            const key = `${category}-${normalizedId}`;
            writeOperations[key] = value;
        }
    }
    
    await bulkWrite(writeOperations);
}
```

## Integration with Application Code

### Required Changes in waziper.js

Add LID mapping storage when processing messages:

```javascript
// In handleMessagesUpsert function around line 673
for (const message of messages) {
    try {
        // ... existing code ...
        
        // Store LID mapping when detected
        if (message.key.fromMe && message.key.remoteJid.includes('@lid')) {
            // Check if we have the phone number from message metadata
            if (message.userReceipt && message.userReceipt.length > 0) {
                for (const receipt of message.userReceipt) {
                    if (receipt.userJid && receipt.userJid.includes('@s.whatsapp.net')) {
                        // Store the mapping in Redis
                        await storeLidMapping(
                            redisAuthClient,
                            instance_id,
                            message.key.remoteJid,
                            receipt.userJid
                        );
                        console.log(`[LID Mapping] Stored: ${message.key.remoteJid} -> ${receipt.userJid}`);
                        break;
                    }
                }
            }
        }
        
        // ... rest of message processing ...
    } catch (error) {
        console.error(`Error processing message ${message.key?.id}:`, error);
    }
}
```

## Testing Plan

### Test Scenarios

1. **Normal Bot Message Flow**
   - Bot sends message to phone number
   - Verify session established correctly
   - Verify response can be decrypted

2. **Manual Message from Phone**
   - User sends message manually from WhatsApp
   - Verify @lid format is handled
   - Verify no decryption errors

3. **Mixed Conversation**
   - Bot sends message
   - User replies manually
   - Bot sends another message
   - Verify all messages decrypt correctly

4. **Session Recovery**
   - Simulate session corruption
   - Verify recovery mechanism works
   - Verify both formats work after recovery

### Validation Steps

1. Deploy the fix to development environment
2. Monitor logs for decryption errors
3. Test with multiple WhatsApp accounts
4. Verify no performance degradation
5. Check Redis memory usage

## Performance Considerations

### Memory Impact
- Additional Redis keys: ~2x for session keys (one for each format)
- LID mapping cache: ~1KB per mapping
- Estimated increase: <5% for typical usage

### Latency Impact
- Additional Redis lookup: ~1-2ms per session operation
- Cache hit ratio expected: >90% after warm-up
- Overall impact: Negligible

## Rollback Plan

If issues arise after deployment:

1. **Immediate Rollback**
   ```javascript
   // Disable dual key storage by setting feature flag
   const ENABLE_LID_SESSION_FIX = false;
   ```

2. **Clear Duplicate Keys**
   ```bash
   # Remove @lid format session keys
   redis-cli --scan --pattern "baileys:auth:*:session-*@lid" | xargs redis-cli del
   ```

3. **Monitor and Assess**
   - Check error rates return to baseline
   - Investigate root cause of new issues
   - Plan revised approach

## Recommendations

1. **Immediate Action**: Implement Approach 1 (Dual Key Storage) as it's less invasive and provides backward compatibility.

2. **Long-term**: Consider migrating to Approach 2 (JID Normalization) for cleaner architecture.

3. **Monitoring**: Add metrics for:
   - Session key hit/miss rates
   - LID vs Phone format usage
   - Decryption error rates

4. **Documentation**: Update Redis auth state documentation to explain LID handling.

## References

- [WhatsApp LID Format Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components#messages-object)
- [Baileys Issue #1697 - Mutex and LRU Cache](https://github.com/WhiskeySockets/Baileys/pull/1697)
- [Signal Protocol Session Management](https://signal.org/docs/specifications/doubleratchet/)

## Contact

For questions or issues regarding this fix:
- Repository: [@baileys/redis-auth-state](https://github.com/fatomate/baileys-redis-auth)
- Issue Tracker: Create issue with tag `session-decryption`

---

*Report Generated: 2025-08-31*
*Author: Wabot Development Team*