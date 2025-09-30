# LID Session Handling - Flow Diagrams

## Current Flow (Broken - v1.1.3)

```
┌─────────────────────────────────────────────────────────────────────┐
│ WhatsApp Server                                                     │
│ Sends message with:                                                 │
│   remoteJid: "114194640801953@lid"                                  │
│   senderLid: "114194640801953@lid"                                  │
│   senderPn: "60196953307@s.whatsapp.net"                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Baileys: messages-recv.ts                                           │
│ decryptMessageNode(node, meId, meLid, signalRepository, logger)    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Baileys: decode-wa-message.ts                                       │
│ const user = isJidUser(sender) ? sender : author                    │
│ user = "114194640801953@lid"  ← LID format used for decryption!    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Baileys: libsignal.ts                                               │
│ decryptMessage({ jid: "114194640801953@lid", ... })                │
│   ↓                                                                 │
│ const addr = jidToSignalProtocolAddress("114194640801953@lid")     │
│   user: "114194640801953", device: 0                                │
│   ↓                                                                 │
│ loadSession("114194640801953@lid")  ← libsignal requests session    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Redis Auth State: redis-auth-state.ts                              │
│ keys.get('session', ['114194640801953@lid'])                       │
│   ↓                                                                 │
│ Redis lookup: baileys:auth:session-114194640801953@lid             │
│   ❌ NOT FOUND                                                       │
│   ↓                                                                 │
│ return { '114194640801953@lid': null }                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Baileys: SessionCipher.decrypt()                                    │
│ session = null                                                      │
│ ❌ Error: "No matching sessions found for message"                  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Baileys: Retry Logic                                                │
│ requestPlaceholderResend(messageKey)                                │
│   ↓                                                                 │
│ WhatsApp resends → STILL uses LID format                            │
│   ↓                                                                 │
│ CYCLE REPEATS → Multiple "Bad MAC" errors                           │
└─────────────────────────────────────────────────────────────────────┘


Meanwhile, in Redis...
┌─────────────────────────────────────────────────────────────────────┐
│ Redis Database                                                      │
│                                                                     │
│ ✅ baileys:auth:session-60196953307@s.whatsapp.net = <sessionData> │
│ ✅ baileys:auth:lid:my-session:114194640801953@lid = 60196953307... │
│                                                                     │
│ Session EXISTS but stored under PHONE format!                      │
│ Mapping EXISTS but never consulted during session lookup!          │
└─────────────────────────────────────────────────────────────────────┘
```

## Proposed Flow (Fixed with Translation Layer)

```
┌─────────────────────────────────────────────────────────────────────┐
│ WhatsApp Server                                                     │
│ Sends message with:                                                 │
│   remoteJid: "114194640801953@lid"                                  │
│   senderLid: "114194640801953@lid"                                  │
│   senderPn: "60196953307@s.whatsapp.net"                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Baileys: messages-recv.ts                                           │
│ decryptMessageNode(node, meId, meLid, signalRepository, logger)    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Baileys: libsignal.ts                                               │
│ loadSession("114194640801953@lid")  ← Still requests LID format     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Redis Auth State: redis-auth-state.ts (TRANSLATION LAYER)          │
│                                                                     │
│ keys.get('session', ['114194640801953@lid'])                       │
│   ↓                                                                 │
│ 1️⃣ Check if LID format: YES                                         │
│   ↓                                                                 │
│ 2️⃣ Lookup mapping: getLidMapping('114194640801953@lid')             │
│      Cache: Check lidCache[sessionId]['114194640801953@lid']       │
│      ✅ Found in cache: '60196953307@s.whatsapp.net'                │
│   ↓                                                                 │
│ 3️⃣ Expand search to both formats:                                   │
│      - session-114194640801953@lid                                  │
│      - session-60196953307@s.whatsapp.net  ← Add phone format       │
│   ↓                                                                 │
│ 4️⃣ Bulk fetch from Redis:                                           │
│      baileys:auth:session-114194640801953@lid      ❌ Not found     │
│      baileys:auth:session-60196953307@s.whatsapp.net  ✅ Found!     │
│   ↓                                                                 │
│ 5️⃣ Map back to requested ID:                                        │
│      return {                                                       │
│        '114194640801953@lid': <sessionData>  ← Found via phone key! │
│      }                                                              │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Baileys: SessionCipher.decrypt()                                    │
│ session = <sessionData>  ✅ Session found!                          │
│   ↓                                                                 │
│ Decrypt message successfully                                        │
│ ✅ Message content decrypted                                         │
└─────────────────────────────────────────────────────────────────────┘
```

## Comparison: Session Lookup Logic

### BEFORE (v1.1.3 - Simple lookup)
```typescript
// redis-auth-state.ts: keys.get()
const keyedIds = ids.map(id => `${type}-${id}`)
const data = await bulkRead(keyedIds)

// For session-114194640801953@lid:
// Looks up ONLY: baileys:auth:session-114194640801953@lid
// Result: undefined → returns null
```

### AFTER (With Translation)
```typescript
// redis-auth-state.ts: keys.get()
if (type === 'session' && enableLidSupport) {
  const expandedIds = new Set<string>()
  
  for (const id of ids) {
    expandedIds.add(id)
    
    if (isLidFormat(id)) {
      // Look up phone mapping
      const phone = await getLidMapping(redis, sessionId, id, keyPrefix)
      if (phone) expandedIds.add(phone)
    }
  }
  
  const keyedIds = Array.from(expandedIds).map(id => `${type}-${id}`)
  const data = await bulkRead(keyedIds)
  
  // For session-114194640801953@lid:
  // Looks up BOTH:
  //   1. baileys:auth:session-114194640801953@lid  (not found)
  //   2. baileys:auth:session-60196953307@s.whatsapp.net  (found!)
  // Result: sessionData → returns session
}
```

## Performance Impact Visualization

### Cache Hit Scenario (99% of requests after warm-up)
```
Request: keys.get('session', ['114194640801953@lid'])
  │
  ├─ Check type === 'session': 0ms
  ├─ isLidFormat check: 0ms
  ├─ getLidMapping (CACHE HIT): 0ms  ✅ In-memory lookup
  ├─ Expand IDs: 0ms
  ├─ bulkRead (2 keys): 1-2ms  ← Same as before
  └─ Map results: 0ms
  
Total: ~1-2ms (no additional latency)
```

### Cache Miss Scenario (1% of requests)
```
Request: keys.get('session', ['114194640801953@lid'])
  │
  ├─ Check type === 'session': 0ms
  ├─ isLidFormat check: 0ms
  ├─ getLidMapping (CACHE MISS): 1-2ms  ⚠️ Redis lookup
  │   └─ Redis: GET baileys:auth:lid:session:114194640801953@lid
  ├─ Expand IDs: 0ms
  ├─ bulkRead (2 keys): 1-2ms
  └─ Map results: 0ms
  
Total: ~3-4ms (1-2ms additional latency)
```

### Bulk Request Optimization
```
Request: keys.get('session', [lid1, lid2, lid3, phone1, phone2])
  │
  ├─ Batch mapping lookup: 2-3ms  ← Single Redis pipeline
  │   └─ batchGetLidMappings([lid1, lid2, lid3])
  ├─ Expand all IDs: 0ms
  ├─ bulkRead (8 keys): 2-3ms  ← Single Redis pipeline
  └─ Map results: 0ms
  
Total: ~5-6ms for 5 sessions
Average per session: ~1ms
```

## Data Flow: LID Mapping Creation

### When Does the Mapping Get Created?

```
┌─────────────────────────────────────────────────────────────────────┐
│ Scenario 1: Incoming Message with Both Fields                      │
└─────────────────────────────────────────────────────────────────────┘

Message arrives with:
  senderLid: "114194640801953@lid"
  senderPn: "60196953307@s.whatsapp.net"
  
  ↓
  
Application code (baileys-wabot) calls:
  await registerLidMapping(
    redis,
    sessionId,
    '60196953307@s.whatsapp.net',
    '114194640801953@lid'
  )
  
  ↓
  
Redis stores:
  baileys:auth:lid:sessionId:114194640801953@lid → 60196953307@s.whatsapp.net
  baileys:auth:lid:reverse:sessionId:60196953307@s.whatsapp.net → 114194640801953@lid
  
  ↓
  
Memory cache updated:
  lidCache[sessionId]['114194640801953@lid'] = '60196953307@s.whatsapp.net'
  phoneCache[sessionId]['60196953307@s.whatsapp.net'] = '114194640801953@lid'


┌─────────────────────────────────────────────────────────────────────┐
│ Scenario 2: First Contact (No Existing Mapping)                    │
└─────────────────────────────────────────────────────────────────────┘

Message arrives with ONLY LID:
  remoteJid: "114194640801953@lid"
  senderLid: "114194640801953@lid"
  ❌ senderPn: undefined
  
  ↓
  
keys.get('session', ['114194640801953@lid'])
  ├─ getLidMapping('114194640801953@lid')
  │   └─ Returns null (no mapping exists yet)
  ├─ Lookup: session-114194640801953@lid
  └─ Returns null
  
  ↓
  
Baileys triggers PLACEHOLDER_MESSAGE_RESEND
  
  ↓
  
WhatsApp resends with BOTH fields:
  senderLid: "114194640801953@lid"
  senderPn: "60196953307@s.whatsapp.net"  ✅
  
  ↓
  
Application creates mapping (see Scenario 1)
  
  ↓
  
Next decryption attempt succeeds!
```

## Edge Cases Handling

### Edge Case 1: Session Exists Under LID, Request Comes with Phone

```
Redis: baileys:auth:session-114194640801953@lid = <sessionData>
Request: keys.get('session', ['60196953307@s.whatsapp.net'])

Flow:
  ├─ isPhoneFormat: YES
  ├─ getReverseLidMapping('60196953307@s.whatsapp.net')
  │   └─ Returns: '114194640801953@lid'
  ├─ Expand: ['60196953307@s.whatsapp.net', '114194640801953@lid']
  ├─ Lookup both keys
  │   ├─ session-60196953307@s.whatsapp.net: not found
  │   └─ session-114194640801953@lid: ✅ found
  └─ Return: { '60196953307@s.whatsapp.net': <sessionData> }

✅ Works in both directions!
```

### Edge Case 2: Session Stored Twice (Duplicate Keys)

```
Redis: 
  baileys:auth:session-114194640801953@lid = <sessionData1>
  baileys:auth:session-60196953307@s.whatsapp.net = <sessionData2>

Request: keys.get('session', ['114194640801953@lid'])

Flow:
  ├─ Expand: ['114194640801953@lid', '60196953307@s.whatsapp.net']
  ├─ Lookup both keys
  │   ├─ session-114194640801953@lid: found (sessionData1)
  │   └─ session-60196953307@s.whatsapp.net: found (sessionData2)
  └─ Prefer direct match: return sessionData1

Priority: Direct match > Mapped match
```

### Edge Case 3: Mapping Changes Mid-Session

```
T0: Mapping: lid1 → phone1
    Session: session-phone1
    
T1: User changes number
    New mapping: lid1 → phone2
    Old session: session-phone1 (still exists)
    New session: session-phone2 (created)

Request: keys.get('session', ['lid1'])
  ├─ getLidMapping('lid1') → phone2 (new)
  ├─ Expand: ['lid1', 'phone2']
  ├─ Lookup: session-lid1, session-phone2
  └─ Returns: session-phone2 ✅

Old session (phone1) is orphaned but doesn't cause issues.
Should be cleaned up by TTL expiration.
```

## Summary: Key Improvements

| Aspect | Before (v1.1.3) | After (Translation Layer) |
|--------|-----------------|---------------------------|
| **Session Lookup** | Single format only | Both formats checked |
| **Decryption Success** | ❌ Fails for LID messages | ✅ Works for all messages |
| **WhatsApp Resends** | Multiple retries needed | Single lookup succeeds |
| **Performance** | Fast (1-2ms) | Similar (1-4ms with cache) |
| **Storage** | Single copy | Single copy (no duplication) |
| **Complexity** | Simple but broken | Moderate but correct |
| **Baileys Changes** | None | None (transparent) |

## Implementation Checklist

- [ ] Add translation logic to `keys.get()` in `redis-auth-state.ts`
- [ ] Import `isLidFormat`, `isPhoneFormat` from `lid-handler.ts`
- [ ] Import `getLidMapping`, `getReverseLidMapping` from `lid-handler.ts`
- [ ] Add logging for session lookup hits/misses
- [ ] Add metrics collection for performance monitoring
- [ ] Test with both LID and phone format messages
- [ ] Verify no performance degradation in production
- [ ] Monitor decryption success rate improvement

## Verification Commands

### Check if mapping exists
```bash
redis-cli GET "baileys:auth:lid:my-session:114194640801953@lid"
# Should return: 60196953307@s.whatsapp.net
```

### Check if reverse mapping exists
```bash
redis-cli GET "baileys:auth:lid:reverse:my-session:60196953307@s.whatsapp.net"
# Should return: 114194640801953@lid
```

### Check if session exists (either format)
```bash
redis-cli GET "baileys:auth:my-session:session-60196953307@s.whatsapp.net"
redis-cli GET "baileys:auth:my-session:session-114194640801953@lid"
# At least one should return session data
```

### List all LID mappings for a session
```bash
redis-cli KEYS "baileys:auth:lid:my-session:*"
```

### Count sessions for debugging
```bash
redis-cli KEYS "baileys:auth:my-session:session-*" | wc -l
```