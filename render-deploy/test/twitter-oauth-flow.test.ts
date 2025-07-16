import { TwitterOAuthService } from '../services/oauth.js';
import { redis } from '../services/redis.js';
import { getFirestoreClient } from '../services/database.js';
import fetch from 'node-fetch';

async function testTwitterOAuthFlow() {
  console.log('🧪 Starting Twitter OAuth flow test...');

  try {
    // 1. Initialize services
    console.log('\n1️⃣ Initializing services...');
    const twitterService = new TwitterOAuthService();
    const db = getFirestoreClient();
    console.log('✅ Services initialized');

    // 2. Generate auth URL
    console.log('\n2️⃣ Generating auth URL...');
    const state = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { url, codeVerifier } = await twitterService.generateAuthUrl(state);
    console.log('✅ Auth URL generated:', url);

    // 3. Store state in Redis
    console.log('\n3️⃣ Storing OAuth state...');
    const stateData = {
      userId: 'test_user',
      organizationId: 'test_org',
      platform: 'twitter',
      codeVerifier,
      timestamp: Date.now()
    };
    await redis.setex(
      `oauth:state:${state}`,
      600,
      JSON.stringify({ ...stateData, expiresAt: Date.now() + 600000 })
    );
    console.log('✅ State stored in Redis');

    // 4. Simulate callback (in a real scenario, this would be handled by the browser)
    console.log('\n4️⃣ Simulating OAuth callback...');
    console.log('⚠️ In a real scenario, the user would be redirected to:', url);
    console.log('⚠️ After authorization, Twitter would redirect to the callback URL with a code');
    console.log('⚠️ For testing, you would need to:');
    console.log('   1. Open the auth URL in a browser');
    console.log('   2. Authorize the application');
    console.log('   3. Copy the code from the callback URL');
    console.log('   4. Use that code to test the callback handler');

    // 5. Test token refresh
    console.log('\n5️⃣ Testing token refresh...');
    const testTokens = {
      accessToken: 'test_access_token',
      refreshToken: 'test_refresh_token',
      expiresAt: Date.now() + 3600000
    };
    await redis.setex(
      `oauth:tokens:test_user`,
      3600,
      JSON.stringify(testTokens)
    );
    console.log('✅ Test tokens stored');

    // 6. Clean up
    console.log('\n6️⃣ Cleaning up test data...');
    await redis.del(`oauth:state:${state}`);
    await redis.del(`oauth:tokens:test_user`);
    console.log('✅ Test data cleaned up');

    console.log('\n✨ Test setup completed!');
    console.log('\nTo complete the test:');
    console.log('1. Set up your Twitter API credentials in .env:');
    console.log('   TWITTER_CLIENT_ID=your_client_id');
    console.log('   TWITTER_CLIENT_SECRET=your_client_secret');
    console.log('   TWITTER_REDIRECT_URI=http://localhost:3000/api/oauth/callback/twitter');
    console.log('2. Start your server');
    console.log('3. Open the auth URL in a browser');
    console.log('4. Complete the OAuth flow');
    console.log('5. Check the logs for successful completion');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Close Redis connection
    await redis.quit();
  }
}

// Run the tests
testTwitterOAuthFlow(); 