/**
 * Multi-Session WhatsApp Bot Example
 * Demonstrates safe handling of multiple sessions without auth state mixing
 */

import makeWASocket from 'baileys'
import { useRedisAuthState, cleanupSession } from '../src/index'

interface SessionManager {
  sessionId: string
  socket: any
  state: any
  saveCreds: () => Promise<void>
}

class MultiSessionBot {
  private sessions = new Map<string, SessionManager>()
  private redisConfig: any

  constructor(redisConfig: any) {
    this.redisConfig = redisConfig
  }

  /**
   * Create a new WhatsApp session with isolated auth state
   */
  async createSession(sessionId: string): Promise<void> {
    console.log(`Creating session: ${sessionId}`)

    try {
      // Each session gets its own isolated auth state
      const { state, saveCreds } = await useRedisAuthState({
        redis: this.redisConfig,
        sessionId,                    // Unique session identifier
        keyPrefix: 'whatsapp:multi:', // Custom prefix for multi-session setup
        
        // Performance optimizations per session
        compression: 'lz4',
        enableBatching: true,
        batchSize: 100,
        enableCache: true,
        cacheTTL: 45000,             // 45 second cache
        memoryEfficient: true,
        poolSize: 5,                 // Smaller pool per session
        ttl: 7 * 24 * 60 * 60       // 7 days session TTL
      })

      // Create WhatsApp socket for this session
      const socket = makeWASocket({
        auth: state,
        browser: [`Multi Bot ${sessionId}`, 'Chrome', '1.0.0'],
        printQRInTerminal: true,
        // Session-specific options
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        markOnlineOnConnect: false
      })

      // Handle credential updates for this specific session
      socket.ev.on('creds.update', async () => {
        try {
          await saveCreds()
          console.log(`✅ Credentials saved for session: ${sessionId}`)
        } catch (error) {
          console.error(`❌ Error saving credentials for session ${sessionId}:`, error)
        }
      })

      // Handle connection updates
      socket.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        
        if (connection === 'close') {
          console.log(`🔌 Session ${sessionId} disconnected`)
          // Handle reconnection logic here
        } else if (connection === 'open') {
          console.log(`🟢 Session ${sessionId} connected successfully`)
        }
      })

      // Handle incoming messages for this session
      socket.ev.on('messages.new', (messages) => {
        for (const message of messages) {
          console.log(`📨 [${sessionId}] New message:`, message.key.remoteJid)
          // Process message for this specific session
        }
      })

      // Store session manager
      this.sessions.set(sessionId, {
        sessionId,
        socket,
        state,
        saveCreds
      })

      console.log(`✅ Session ${sessionId} created successfully`)

    } catch (error) {
      console.error(`❌ Failed to create session ${sessionId}:`, error)
      throw error
    }
  }

  /**
   * Send message from a specific session
   */
  async sendMessage(sessionId: string, jid: string, message: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    try {
      await session.socket.sendMessage(jid, { text: message })
      console.log(`📤 [${sessionId}] Message sent to ${jid}`)
    } catch (error) {
      console.error(`❌ [${sessionId}] Failed to send message:`, error)
      throw error
    }
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId: string): string {
    const session = this.sessions.get(sessionId)
    
    if (!session) {
      return 'NOT_FOUND'
    }

    return session.socket.ws?.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'
  }

  /**
   * List all active sessions
   */
  listSessions(): string[] {
    return Array.from(this.sessions.keys())
  }

  /**
   * Remove a session and clean up its resources
   */
  async removeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    
    if (!session) {
      console.log(`Session ${sessionId} not found`)
      return
    }

    try {
      // Close the WhatsApp socket
      await session.socket.logout()
      
      // Clean up Redis auth state and memory cache
      await cleanupSession(sessionId)
      
      // Remove from local storage
      this.sessions.delete(sessionId)
      
      console.log(`🗑️ Session ${sessionId} removed successfully`)
    } catch (error) {
      console.error(`❌ Error removing session ${sessionId}:`, error)
    }
  }

  /**
   * Gracefully shutdown all sessions
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down all sessions...')
    
    const shutdownPromises = Array.from(this.sessions.keys()).map(sessionId => 
      this.removeSession(sessionId)
    )
    
    await Promise.all(shutdownPromises)
    console.log('✅ All sessions shut down successfully')
  }
}

// Example usage
async function main() {
  const redisConfig = {
    host: 'localhost',
    port: 6379,
    // password: 'your-redis-password',
    socket: {
      connectTimeout: 5000,
      commandTimeout: 3000,
      keepAlive: true
    }
  }

  const botManager = new MultiSessionBot(redisConfig)

  try {
    // Create multiple sessions
    await botManager.createSession('user1')
    await botManager.createSession('user2') 
    await botManager.createSession('user3')

    console.log('Active sessions:', botManager.listSessions())

    // Simulate sending messages from different sessions
    setTimeout(async () => {
      try {
        // Each session operates independently
        // await botManager.sendMessage('user1', '1234567890@s.whatsapp.net', 'Hello from user1!')
        // await botManager.sendMessage('user2', '0987654321@s.whatsapp.net', 'Hello from user2!')
        
        console.log('Session statuses:')
        botManager.listSessions().forEach(sessionId => {
          console.log(`${sessionId}: ${botManager.getSessionStatus(sessionId)}`)
        })
      } catch (error) {
        console.error('Error sending messages:', error)
      }
    }, 10000)

    // Graceful shutdown on process termination
    process.on('SIGINT', async () => {
      console.log('\n⏹️ Received SIGINT, shutting down gracefully...')
      await botManager.shutdown()
      process.exit(0)
    })

    // Keep process alive
    console.log('🤖 Multi-session bot is running...')
    console.log('Press Ctrl+C to shutdown gracefully')

  } catch (error) {
    console.error('❌ Error starting multi-session bot:', error)
    process.exit(1)
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error)
}

export { MultiSessionBot } 