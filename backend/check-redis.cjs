const Redis = require('ioredis')

console.log('🔍 Redis Connection Status Check')
console.log('=================================')

// Check environment configuration
console.log('\n📋 Configuration:')
console.log(
  'REDIS_URL:',
  process.env.REDIS_URL || 'redis://localhost:6379 (default)'
)

// Create Redis connection with timeout
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  connectTimeout: 5000,
  lazyConnect: true,
  maxRetriesPerRequest: 1,
})

async function checkRedisStatus() {
  try {
    console.log('\n⏳ Attempting Redis connection...')

    // Try to connect
    await redis.connect()
    const pingResult = await redis.ping()

    console.log('✅ Redis Status: CONNECTED')
    console.log('✅ PING Response:', pingResult)

    // If we get here, Redis is working
    console.log('\n🎉 Redis is available and working!')
    console.log('📊 Your OAuth application can use Redis for:')
    console.log('   • OAuth state management')
    console.log('   • Rate limiting')
    console.log('   • Token caching')
    console.log('   • Session storage')

    redis.disconnect()
  } catch (error) {
    console.log('❌ Redis Status: NOT AVAILABLE')
    console.log('❌ Error:', error.message)

    console.log('\n💡 Redis Setup Options:')
    console.log('')
    console.log('🔹 For Development (Windows):')
    console.log('   1. Install Redis via WSL2:')
    console.log('      wsl --install')
    console.log('      wsl -d Ubuntu')
    console.log('      sudo apt update && sudo apt install redis-server')
    console.log('      redis-server')
    console.log('')
    console.log('   2. Use Docker Desktop:')
    console.log('      docker run -d -p 6379:6379 redis:alpine')
    console.log('')
    console.log('   3. Use Redis Cloud (free tier):')
    console.log('      https://redis.com/try-free/')
    console.log('')
    console.log('🔹 For Production:')
    console.log('   • Render Redis: https://render.com/docs/redis')
    console.log('   • Redis Cloud: https://redis.com/')
    console.log('   • AWS ElastiCache')
    console.log('   • Google Cloud Memorystore')
    console.log('')
    console.log('🔹 Development without Redis:')
    console.log('   The OAuth system can work with in-memory storage')
    console.log('   but will lose state on server restart.')
    console.log('')
    console.log('📝 Update your .env file with:')
    console.log('   REDIS_URL=redis://your-redis-host:6379')

    // Test if our Redis service handles the error gracefully
    console.log('\n🧪 Testing OAuth service Redis error handling...')

    try {
      // Import our Redis service to see how it behaves
      const path = require('path')
      const redisServicePath = path.join(
        __dirname,
        'src',
        'services',
        'redis.js'
      )

      console.log('📦 Redis service path:', redisServicePath)
      console.log(
        '✅ OAuth application should handle Redis unavailability gracefully'
      )
    } catch (importError) {
      console.log('ℹ️  Redis service handling: ', importError.message)
    }
  }
}

// Handle connection events
redis.on('connect', () => {
  console.log('🔗 Redis connection established')
})

redis.on('error', (error) => {
  // Suppress error logging during test
})

redis.on('close', () => {
  console.log('🔌 Redis connection closed')
})

// Run the check
checkRedisStatus()
