console.log('DEBUG: Script started');
import { TwitterOAuthService } from '../services/oauth.js';
import { redis } from '../services/redis.js';
import { getFirestoreClient } from '../services/database.js';

async function testTwitterOAuth() {
  console.log('🧪 Starting Twitter OAuth test...');

  try {
    // 1. Test Redis connection
    console.log('\n1️⃣ Testing Redis connection...');
    await redis.ping();
    console.log('✅ Redis connection successful');

    // 2. Test Twitter OAuth service initialization
    console.log('\n2️⃣ Testing Twitter OAuth service initialization...');
    const twitterService = new TwitterOAuthService();
    console.log('✅ Twitter OAuth service initialized');

    // 3. Test state generation and storage
    console.log('\n3️⃣ Testing OAuth state management...');
    const testState = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const testData = {
      userId: 'test_user',
      organizationId: 'test_org',
      platform: 'twitter',
      timestamp: Date.now()
    };

    // Store state
    await redis.setex(
      `oauth:state:${testState}`,
      600, // 10 minutes
      JSON.stringify({ ...testData, expiresAt: Date.now() + 600000 })
    );
    console.log('✅ State stored in Redis');

    // Retrieve state
    const storedState = await redis.get(`oauth:state:${testState}`);
    if (!storedState) {
      throw new Error('Failed to retrieve state from Redis');
    }
    console.log('✅ State retrieved from Redis');

    // 4. Test token encryption/decryption
    console.log('\n4️⃣ Testing token encryption/decryption...');
    const testTokens = {
      accessToken: 'test_access_token',
      refreshToken: 'test_refresh_token',
      expiresAt: Date.now() + 3600000
    };

    // Store encrypted tokens
    await redis.setex(
      `oauth:tokens:test_user`,
      3600,
      JSON.stringify(testTokens)
    );
    console.log('✅ Tokens stored in Redis');

    // Retrieve tokens
    const storedTokens = await redis.get(`oauth:tokens:test_user`);
    if (!storedTokens) {
      throw new Error('Failed to retrieve tokens from Redis');
    }
    console.log('✅ Tokens retrieved from Redis');

    // 5. Test Firestore integration
    console.log('\n5️⃣ Testing Firestore integration...');
    const db = getFirestoreClient();
    await db.collection('test_oauth').doc('test_doc').set({
      test: true,
      timestamp: new Date()
    });
    console.log('✅ Firestore write successful');

    // 6. Clean up test data
    console.log('\n6️⃣ Cleaning up test data...');
    await redis.del(`oauth:state:${testState}`);
    await redis.del(`oauth:tokens:test_user`);
    await db.collection('test_oauth').doc('test_doc').delete();
    console.log('✅ Test data cleaned up');

    console.log('\n✨ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Close Redis connection
    await redis.quit();
  }
}

// Run the tests
testTwitterOAuth(); 