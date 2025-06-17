#!/usr/bin/env node

// Test Redis connection
import { redis } from './src/services/redis.js'

console.log('🔍 Testing Redis connection...')

// Test connection and basic operations
async function testRedis() {
  try {
    console.log('📡 Attempting to connect to Redis...')

    // Test ping
    const pingResult = await redis.ping()
    console.log('✅ Redis PING:', pingResult)

    // Test basic set/get
    console.log('🔧 Testing basic operations...')

    const testKey = 'test:connection:' + Date.now()
    const testValue = 'Hello Redis!'

    // Set a value
    await redis.set(testKey, testValue, 'EX', 60) // Expire in 60 seconds
    console.log('✅ SET operation successful')

    // Get the value
    const retrievedValue = await redis.get(testKey)
    console.log('✅ GET operation successful:', retrievedValue)

    if (retrievedValue === testValue) {
      console.log('✅ Value verification: PASSED')
    } else {
      console.log('❌ Value verification: FAILED')
    }

    // Test hash operations
    const hashKey = 'test:hash:' + Date.now()
    await redis.hset(hashKey, 'field1', 'value1', 'field2', 'value2')
    const hashValue = await redis.hget(hashKey, 'field1')
    console.log(
      '✅ Hash operations:',
      hashValue === 'value1' ? 'PASSED' : 'FAILED'
    )

    // Test list operations
    const listKey = 'test:list:' + Date.now()
    await redis.lpush(listKey, 'item1', 'item2', 'item3')
    const listLength = await redis.llen(listKey)
    console.log('✅ List operations:', listLength === 3 ? 'PASSED' : 'FAILED')

    // Test TTL
    await redis.expire(testKey, 30)
    const ttl = await redis.ttl(testKey)
    console.log(
      '✅ TTL operations:',
      ttl > 0 && ttl <= 30 ? 'PASSED' : 'FAILED'
    )

    // Clean up test keys
    await redis.del(testKey, hashKey, listKey)
    console.log('🧹 Test keys cleaned up')

    // Test OAuth-specific operations
    console.log('🔐 Testing OAuth-specific Redis operations...')

    // Test OAuth state storage (simulating our OAuth flow)
    const stateKey = 'oauth:state:test_state_' + Date.now()
    const stateData = {
      userId: 'test_user_123',
      platform: 'twitter',
      timestamp: Date.now(),
    }

    await redis.setex(stateKey, 600, JSON.stringify(stateData)) // 10 minutes
    const retrievedState = await redis.get(stateKey)
    const parsedState = JSON.parse(retrievedState)

    console.log(
      '✅ OAuth state storage:',
      parsedState.userId === stateData.userId ? 'PASSED' : 'FAILED'
    )

    // Test rate limiting keys
    const rateLimitKey = 'rate:limit:test_ip_' + Date.now()
    await redis.incr(rateLimitKey)
    await redis.expire(rateLimitKey, 3600) // 1 hour
    const rateLimitValue = await redis.get(rateLimitKey)

    console.log(
      '✅ Rate limiting:',
      rateLimitValue === '1' ? 'PASSED' : 'FAILED'
    )

    // Clean up OAuth test keys
    await redis.del(stateKey, rateLimitKey)

    console.log('🎉 All Redis tests completed successfully!')
    console.log('📊 Redis connection is working properly for OAuth operations')
  } catch (error) {
    console.error('❌ Redis test failed:', error.message)
    console.error('🔍 Full error:', error)

    if (error.code === 'ECONNREFUSED') {
      console.log(
        '💡 Suggestion: Make sure Redis server is running on localhost:6379'
      )
      console.log('   You can start Redis with: redis-server')
    }

    process.exit(1)
  } finally {
    // Close Redis connection
    redis.disconnect()
  }
}

// Handle connection events
redis.on('connect', () => {
  console.log('🔗 Redis connection established')
})

redis.on('ready', () => {
  console.log('✅ Redis is ready for operations')
})

redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error.message)
})

redis.on('close', () => {
  console.log('🔌 Redis connection closed')
})

// Start the test
testRedis()
