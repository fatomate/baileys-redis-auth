# Improve session handling for lid format
_Exported on 30/09/2025 at 9:18:11 GMT+8 from Cursor (1.7.17)_

---

**User**

Referring to the /baileys-redis-auth and the latest commit in the /feat/lid-format-support branch; I am still having issues when incoming messages remoteJid is a number ending with @lid.

Refer to the docs/lid-format-support.md, the latest log in docs/session_decryption_issue.log, together with the associated /baileys-wabot and identify how we can improve session handling and decryption for lid.

---

**Cursor**

I'll help you investigate the LID session handling and decryption issues. Let me first examine the relevant documentation and logs to understand the problem.

Let me check the current branch and implementation files:

Now let me search for how Baileys handles session decryption and where the @lid format is used:

Now I need to understand how session keys are stored and retrieved:

Now I understand the issue! Let me examine the jidDecode function to see exactly how the user part is extracted:

Now I see the complete picture! Let me analyze the core issue:

## Problem Analysis

Looking at the logs and code:

1. **Message arrives with LID format**: `remoteJid: "17141248049225@lid"`
2. **WhatsApp provides both formats** in the message:
   - `senderLid: "17141248049225@lid"`  
   - `senderPn: "60132914923@s.whatsapp.net"`

3. **Baileys decryption flow**:
   - `jidDecode("17141248049225@lid")` → `{ user: "17141248049225", server: "lid" }`
   - Session lookup: `session-17141248049225`

4. **But the session was stored as**: `session-60132914923` (using phone number)

5. **The LID user ID (`17141248049225`) ≠ Phone user ID (`60132914923`)**

The current LID handler only stores mappings but doesn't intercept session lookups. The decryption happens in Baileys' libsignal layer, which doesn't know about the alternate format.

## Solution

I'll create an improved version that:
1. **Intercepts session key lookups** to check both LID and phone number formats
2. **Stores sessions under both IDs** when both formats are available
3. **Uses intelligent fallback** when sessions aren't found

Let me create the improved implementation:

Now I'll create an improved implementation. The key insight is that we need to enhance the session key lookup to check both LID and phone number user IDs:

Now let me create a comprehensive solution document with the improved implementation:

Based on my analysis, here's the comprehensive solution for your LID session handling issue:

## **Root Cause Analysis**

The problem occurs because:

1. **WhatsApp sends messages with LID format**: `17141248049225@lid`
2. **Baileys extracts the user ID**: `jidDecode("17141248049225@lid")` → `user: "17141248049225"`
3. **Session lookup fails**: Looks for `session-17141248049225`
4. **But session was stored as**: `session-60132914923` (phone number format)
5. **The LID user ID ≠ Phone user ID**: `17141248049225` ≠ `60132914923`

The current LID handler only stores mappings but doesn't intercept the actual session lookups that happen during decryption.

## **Solution: Enhanced Session Key Interception**

Here's the improved `redis-auth-state.ts` with intelligent session lookup:

```typescript:/Users/firdausazizi/Github Projects/baileys-redis-auth/src/redis-auth-state.ts
// ... existing imports ...
import { 
  cleanupLidCache,
  cleanupLidMappings,
  getLidMapping,
  getReverseLidMapping,
  storeLidMapping,
  isLidFormat,
  isPhoneFormat,
  extractNumericId
} from './lid-handler'

// ... existing code ...

// Add helper function to reconstruct JID from user ID
const reconstructJid = (userId: string): { lid: string | null; phone: string | null } => {
  // Check if it looks like a LID (longer numeric ID)
  if (userId.length > 12) {
    return {
      lid: `${userId}@lid`,
      phone: null
    }
  }
  // Assume phone number format
  return {
    lid: null,
    phone: `${userId}@s.whatsapp.net`
  }
}

export const useRedisAuthState = async (
  options: RedisAuthStateOptions
): Promise<{ state: any; saveCreds: () => Promise<void> }> => {
  // ... existing setup code ...

  return {
    state: {
      creds,
      keys: {
        get: async (type: string, ids: string[]) => {
          // Enhanced session lookup with LID support
          if (type === 'session' && enableLidSupport) {
            const result: { [id: string]: any } = {}
            
            for (const id of ids) {
              let sessionData = null
              
              // Try direct lookup first
              const directKey = `${type}-${id}`
              const directData = await bulkRead([directKey])
              sessionData = directData[directKey]
              
              if (!sessionData) {
                // Reconstruct possible JID formats
                const jids = reconstructJid(id)
                
                // Try LID mapping lookup
                if (jids.lid) {
                  const phoneJid = await getLidMapping(redis, sessionId, jids.lid, keyPrefix)
                  if (phoneJid) {
                    const phoneUser = extractNumericId(phoneJid)
                    if (phoneUser && phoneUser !== id) {
                      console.log(`[Redis Auth] Trying alternate format for ${id}: ${phoneUser}`)
                      const altKey = `${type}-${phoneUser}`
                      const altData = await bulkRead([altKey])
                      sessionData = altData[altKey]
                      
                      if (sessionData) {
                        console.log(`[Redis Auth] Found session under phone format: ${id} -> ${phoneUser}`)
                        // Store under both formats for future use
                        await writeData(sessionData, `${type}-${id}`)
                      }
                    }
                  }
                }
                
                // Try reverse LID mapping lookup
                if (!sessionData && jids.phone) {
                  const lidJid = await getReverseLidMapping(redis, sessionId, jids.phone, keyPrefix)
                  if (lidJid) {
                    const lidUser = extractNumericId(lidJid)
                    if (lidUser && lidUser !== id) {
                      console.log(`[Redis Auth] Trying alternate format for ${id}: ${lidUser}`)
                      const altKey = `${type}-${lidUser}`
                      const altData = await bulkRead([altKey])
                      sessionData = altData[altKey]
                      
                      if (sessionData) {
                        console.log(`[Redis Auth] Found session under LID format: ${id} -> ${lidUser}`)
                        // Store under both formats for future use
                        await writeData(sessionData, `${type}-${id}`)
                      }
                    }
                  }
                }
              }
              
              result[id] = sessionData || null
            }
            
            return result
          }
          
          // Original implementation for non-session keys
          const keyedIds = ids.map(id => `${type}-${id}`)
          const data = await bulkRead(keyedIds)
          
          const result: { [id: string]: any } = {}
          for (const id of ids) {
            const key = `${type}-${id}`
            const value = data[key]
            
            if (value === undefined || value === null) {
              result[id] = null
            } else {
              if (type === 'app-state-sync-key' && value) {
                try {
                  const { proto } = eval('require')('baileys/WAProto')
                  result[id] = proto.Message.AppStateSyncKeyData.fromObject(value)
                } catch (error: any) {
                  result[id] = value
                }
              } else {
                result[id] = value
              }
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
              
              // Enhanced dual-storage for sessions with LID support
              if (category === 'session' && value && enableLidSupport) {
                const jids = reconstructJid(id)
                
                // Check for existing mappings and store under both formats
                if (jids.lid) {
                  const phoneJid = await getLidMapping(redis, sessionId, jids.lid, keyPrefix)
                  if (phoneJid) {
                    const phoneUser = extractNumericId(phoneJid)
                    if (phoneUser && phoneUser !== id) {
                      const altKey = `${category}-${phoneUser}`
                      writeOperations[altKey] = value
                      console.log(`[Redis Auth] Dual storing session: ${id} and ${phoneUser}`)
                    }
                  }
                } else if (jids.phone) {
                  const lidJid = await getReverseLidMapping(redis, sessionId, jids.phone, keyPrefix)
                  if (lidJid) {
                    const lidUser = extractNumericId(lidJid)
                    if (lidUser && lidUser !== id) {
                      const altKey = `${category}-${lidUser}`
                      writeOperations[altKey] = value
                      console.log(`[Redis Auth] Dual storing session: ${id} and ${lidUser}`)
                    }
                  }
                }
              }
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
```

## **Additional Enhancement: Capture LID Mappings from Messages**

You also need to capture the LID-to-phone mappings when messages arrive. In your application code (not in redis-auth-state, but in your bot application):

```typescript
// In your message handler
sock.ev.on('messages.upsert', async ({ messages }) => {
  for (const msg of messages) {
    const key = msg.key
    
    // Capture LID mapping from message metadata
    if (key.senderLid && key.senderPn && key.senderLid !== key.senderPn) {
      await storeLidMapping(
        redisClient,
        sessionId,
        key.senderLid,
        key.senderPn,
        'baileys:session:',
        604800 // 7 days TTL
      )
      console.log(`[LID Mapping] Stored: ${key.senderLid} <-> ${key.senderPn}`)
    }
    
    // Also capture participant mappings in groups
    if (key.participantLid && key.participantPn && key.participantLid !== key.participantPn) {
      await storeLidMapping(
        redisClient,
        sessionId,
        key.participantLid,
        key.participantPn,
        'baileys:session:',
        604800
      )
      console.log(`[LID Mapping] Stored participant: ${key.participantLid} <-> ${key.participantPn}`)
    }
  }
})
```

## **Enhanced LID Handler Helper**

Add this helper function to `lid-handler.ts`:

```typescript:/Users/firdausazizi/Github Projects/baileys-redis-auth/src/lid-handler.ts
// ... existing code ...

/**
 * Extract numeric user ID from full JID
 * Works for both @lid and @s.whatsapp.net formats
 */
export const extractNumericId = (jid: string): string | null => {
  if (!jid || typeof jid !== 'string') return null
  
  const match = jid.match(/^(\d+)(@|:)/)
  return match ? match[1] : null
}
```

## **Testing Strategy**

1. **Clear existing sessions** to force new session establishment
2. **Monitor logs** for LID mapping captures
3. **Send test messages** from WhatsApp mobile (which uses LID format)
4. **Verify dual storage** in Redis

Would you like me to:
1. Create a complete updated `redis-auth-state.ts` file with these changes?
2. Add more detailed logging for debugging?
3. Create a migration script to handle existing sessions?

```typescript
// ... existing imports ...
import { 
  cleanupLidCache,
  cleanupLidMappings,
  getLidMapping,
  getReverseLidMapping,
  storeLidMapping,
  isLidFormat,
  isPhoneFormat,
  extractNumericId
} from './lid-handler'

// ... existing code ...

// Add helper function to reconstruct JID from user ID
const reconstructJid = (userId: string): { lid: string | null; phone: string | null } => {
  // Check if it looks like a LID (longer numeric ID)
  if (userId.length > 12) {
    return {
      lid: `${userId}@lid`,
      phone: null
    }
  }
  // Assume phone number format
  return {
    lid: null,
    phone: `${userId}@s.whatsapp.net`
  }
}

export const useRedisAuthState = async (
  options: RedisAuthStateOptions
): Promise<{ state: any; saveCreds: () => Promise<void> }> => {
  // ... existing setup code ...

  return {
    state: {
      creds,
      keys: {
        get: async (type: string, ids: string[]) => {
          // Enhanced session lookup with LID support
          if (type === 'session' && enableLidSupport) {
            const result: { [id: string]: any } = {}
            
            for (const id of ids) {
              let sessionData = null
              
              // Try direct lookup first
              const directKey = `${type}-${id}`
              const directData = await bulkRead([directKey])
              sessionData = directData[directKey]
              
              if (!sessionData) {
                // Reconstruct possible JID formats
                const jids = reconstructJid(id)
                
                // Try LID mapping lookup
                if (jids.lid) {
                  const phoneJid = await getLidMapping(redis, sessionId, jids.lid, keyPrefix)
                  if (phoneJid) {
                    const phoneUser = extractNumericId(phoneJid)
                    if (phoneUser && phoneUser !== id) {
                      console.log(`[Redis Auth] Trying alternate format for ${id}: ${phoneUser}`)
                      const altKey = `${type}-${phoneUser}`
                      const altData = await bulkRead([altKey])
                      sessionData = altData[altKey]
                      
                      if (sessionData) {
                        console.log(`[Redis Auth] Found session under phone format: ${id} -> ${phoneUser}`)
                        // Store under both formats for future use
                        await writeData(sessionData, `${type}-${id}`)
                      }
                    }
                  }
                }
                
                // Try reverse LID mapping lookup
                if (!sessionData && jids.phone) {
                  const lidJid = await getReverseLidMapping(redis, sessionId, jids.phone, keyPrefix)
                  if (lidJid) {
                    const lidUser = extractNumericId(lidJid)
                    if (lidUser && lidUser !== id) {
                      console.log(`[Redis Auth] Trying alternate format for ${id}: ${lidUser}`)
                      const altKey = `${type}-${lidUser}`
                      const altData = await bulkRead([altKey])
                      sessionData = altData[altKey]
                      
                      if (sessionData) {
                        console.log(`[Redis Auth] Found session under LID format: ${id} -> ${lidUser}`)
                        // Store under both formats for future use
                        await writeData(sessionData, `${type}-${id}`)
                      }
                    }
                  }
                }
              }
              
              result[id] = sessionData || null
            }
            
            return result
          }
          
          // Original implementation for non-session keys
          const keyedIds = ids.map(id => `${type}-${id}`)
          const data = await bulkRead(keyedIds)
          
          const result: { [id: string]: any } = {}
          for (const id of ids) {
            const key = `${type}-${id}`
            const value = data[key]
            
            if (value === undefined || value === null) {
              result[id] = null
            } else {
              if (type === 'app-state-sync-key' && value) {
                try {
                  const { proto } = eval('require')('baileys/WAProto')
                  result[id] = proto.Message.AppStateSyncKeyData.fromObject(value)
                } catch (error: any) {
                  result[id] = value
                }
              } else {
                result[id] = value
              }
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
              
              // Enhanced dual-storage for sessions with LID support
              if (category === 'session' && value && enableLidSupport) {
                const jids = reconstructJid(id)
                
                // Check for existing mappings and store under both formats
                if (jids.lid) {
                  const phoneJid = await getLidMapping(redis, sessionId, jids.lid, keyPrefix)
                  if (phoneJid) {
                    const phoneUser = extractNumericId(phoneJid)
                    if (phoneUser && phoneUser !== id) {
                      const altKey = `${category}-${phoneUser}`
                      writeOperations[altKey] = value
                      console.log(`[Redis Auth] Dual storing session: ${id} and ${phoneUser}`)
                    }
                  }
                } else if (jids.phone) {
                  const lidJid = await getReverseLidMapping(redis, sessionId, jids.phone, keyPrefix)
                  if (lidJid) {
                    const lidUser = extractNumericId(lidJid)
                    if (lidUser && lidUser !== id) {
                      const altKey = `${category}-${lidUser}`
                      writeOperations[altKey] = value
                      console.log(`[Redis Auth] Dual storing session: ${id} and ${lidUser}`)
                    }
                  }
                }
              }
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
```

```typescript
// In your message handler
sock.ev.on('messages.upsert', async ({ messages }) => {
  for (const msg of messages) {
    const key = msg.key
    
    // Capture LID mapping from message metadata
    if (key.senderLid && key.senderPn && key.senderLid !== key.senderPn) {
      await storeLidMapping(
        redisClient,
        sessionId,
        key.senderLid,
        key.senderPn,
        'baileys:session:',
        604800 // 7 days TTL
      )
      console.log(`[LID Mapping] Stored: ${key.senderLid} <-> ${key.senderPn}`)
    }
    
    // Also capture participant mappings in groups
    if (key.participantLid && key.participantPn && key.participantLid !== key.participantPn) {
      await storeLidMapping(
        redisClient,
        sessionId,
        key.participantLid,
        key.participantPn,
        'baileys:session:',
        604800
      )
      console.log(`[LID Mapping] Stored participant: ${key.participantLid} <-> ${key.participantPn}`)
    }
  }
})
```

```typescript
// ... existing code ...

/**
 * Extract numeric user ID from full JID
 * Works for both @lid and @s.whatsapp.net formats
 */
export const extractNumericId = (jid: string): string | null => {
  if (!jid || typeof jid !== 'string') return null
  
  const match = jid.match(/^(\d+)(@|:)/)
  return match ? match[1] : null
}
```

