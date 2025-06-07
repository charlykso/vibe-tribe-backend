// Simple test to verify OAuth credentials are loaded correctly
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

console.log('🔍 Testing OAuth Credentials Configuration...\n');

// Test Twitter credentials
console.log('📱 Twitter OAuth:');
console.log('  Client ID:', process.env.TWITTER_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('  Client Secret:', process.env.TWITTER_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
console.log('  Redirect URI:', process.env.TWITTER_REDIRECT_URI || '❌ Missing');

// Test LinkedIn credentials
console.log('\n💼 LinkedIn OAuth:');
console.log('  Client ID:', process.env.LINKEDIN_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('  Client Secret:', process.env.LINKEDIN_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
console.log('  Redirect URI:', process.env.LINKEDIN_REDIRECT_URI || '❌ Missing');

// Test Facebook credentials
console.log('\n👥 Facebook OAuth:');
console.log('  App ID:', process.env.FACEBOOK_APP_ID ? '✅ Set' : '❌ Missing');
console.log('  App Secret:', process.env.FACEBOOK_APP_SECRET ? '✅ Set' : '❌ Missing');
console.log('  Redirect URI:', process.env.FACEBOOK_REDIRECT_URI || '❌ Missing');

// Test Instagram credentials
console.log('\n📸 Instagram OAuth:');
console.log('  Client ID:', process.env.INSTAGRAM_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('  Client Secret:', process.env.INSTAGRAM_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
console.log('  Redirect URI:', process.env.INSTAGRAM_REDIRECT_URI || '❌ Missing');

// Test Firebase credentials
console.log('\n🔥 Firebase Configuration:');
console.log('  Project ID:', process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');
console.log('  Private Key:', process.env.FIREBASE_PRIVATE_KEY ? '✅ Set' : '❌ Missing');
console.log('  Client Email:', process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing');

// Test other important configs
console.log('\n⚙️ Other Configuration:');
console.log('  JWT Secret:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('  Port:', process.env.PORT || '3001 (default)');
console.log('  CORS Origin:', process.env.CORS_ORIGIN || 'http://localhost:8080 (default)');
console.log('  Frontend URL:', process.env.FRONTEND_URL || '❌ Missing');

console.log('\n🎯 Summary:');
const twitterReady = process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET;
const linkedinReady = process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET;
const facebookReady = process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET;
const firebaseReady = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY;

console.log('  Twitter OAuth:', twitterReady ? '✅ Ready' : '❌ Not Ready');
console.log('  LinkedIn OAuth:', linkedinReady ? '✅ Ready' : '❌ Not Ready');
console.log('  Facebook OAuth:', facebookReady ? '✅ Ready' : '❌ Not Ready');
console.log('  Firebase:', firebaseReady ? '✅ Ready' : '❌ Not Ready');

if (twitterReady && linkedinReady) {
  console.log('\n🎉 Twitter and LinkedIn OAuth credentials are properly configured!');
  console.log('   You should be able to connect these platforms in your app.');
} else {
  console.log('\n⚠️  Some OAuth credentials are missing or incomplete.');
}
