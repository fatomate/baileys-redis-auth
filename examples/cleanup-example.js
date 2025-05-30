const { useRedisAuthState, cleanupSession, cleanupSessionWithOptions } = require('@baileys/redis-auth-state')

async function demonstrateCleanup() {
  const authOptions = {
    redis: {
      host: 'localhost',
      port: 6379
    },
    sessionId: 'demo-session',
    keyPrefix: 'baileys:session:'
  }

  console.log('Creating auth state...')
  const { state, saveCreds } = await useRedisAuthState(authOptions)
  
  // Simulate some session data
  console.log('Session created with credentials')

  // Example 1: Basic cleanup (keeps Redis data)
  console.log('\n--- Basic Cleanup (Memory Only) ---')
  await cleanupSession('demo-session')
  console.log('✅ Memory cache and connection pools cleared')
  console.log('✅ Session data still exists in Redis')

  // Example 2: Complete cleanup (deletes everything)
  console.log('\n--- Complete Cleanup (Memory + Redis) ---')
  
  // Method 1: Using cleanupSession with Redis options
  await cleanupSession('demo-session', {
    host: 'localhost',
    port: 6379
  }, 'baileys:session:')
  
  // Method 2: Using cleanupSessionWithOptions (recommended)
  // await cleanupSessionWithOptions(authOptions)
  
  console.log('✅ Memory cache and connection pools cleared')
  console.log('✅ All session data deleted from Redis')
  console.log('⚠️  Session will need to re-authenticate')
}

// Usage in production apps
async function productionExample() {
  const authOptions = {
    redis: { host: 'localhost', port: 6379 },
    sessionId: 'production-session'
  }

  try {
    const { state, saveCreds } = await useRedisAuthState(authOptions)
    
    // Your WhatsApp bot logic here...
    
    // Clean shutdown - preserve session for restart
    process.on('SIGTERM', async () => {
      console.log('Graceful shutdown - preserving session...')
      await cleanupSession('production-session') // Basic cleanup only
      process.exit(0)
    })
    
    // Force reset - delete everything
    process.on('SIGUSR1', async () => {
      console.log('Force reset - deleting session...')
      await cleanupSessionWithOptions(authOptions) // Complete cleanup
      process.exit(0)
    })
    
  } catch (error) {
    console.error('Error:', error)
    // Cleanup on error
    await cleanupSessionWithOptions(authOptions)
  }
}

// Run the demo
if (require.main === module) {
  demonstrateCleanup().catch(console.error)
} 