#!/usr/bin/env node

// Test Twitter OAuth Configuration
import { TwitterApi } from 'twitter-api-v2'
import dotenv from 'dotenv'

// Load backend environment variables
dotenv.config({ path: './backend/.env' })

console.log('🔍 Testing Twitter OAuth Configuration...\n')

// Check environment variables
console.log('📋 Environment Variables:')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('FRONTEND_URL:', process.env.FRONTEND_URL)
console.log(
  'TWITTER_CLIENT_ID:',
  process.env.TWITTER_CLIENT_ID
    ? `${process.env.TWITTER_CLIENT_ID.substring(0, 10)}...`
    : 'missing'
)
console.log(
  'TWITTER_CLIENT_SECRET:',
  process.env.TWITTER_CLIENT_SECRET ? 'present' : 'missing'
)
console.log('TWITTER_REDIRECT_URI:', process.env.TWITTER_REDIRECT_URI)

console.log('\n🐦 Twitter API Configuration:')

try {
  // Initialize Twitter client
  const client = new TwitterApi({
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
  })

  console.log('✅ Twitter API client initialized successfully')

  // Generate OAuth URL
  const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
    process.env.TWITTER_REDIRECT_URI,
    {
      scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      state: 'test-state-12345',
    }
  )

  console.log('\n🔗 Generated OAuth URL:')
  console.log('URL:', url)
  console.log('Code Verifier:', codeVerifier ? 'generated' : 'missing')
  console.log('State:', state)

  // Check if URL contains correct redirect URI
  const urlObj = new URL(url)
  const redirectParam = urlObj.searchParams.get('redirect_uri')

  console.log('\n🔍 URL Analysis:')
  console.log('Redirect URI in URL:', redirectParam)
  console.log('Expected Redirect URI:', process.env.TWITTER_REDIRECT_URI)
  console.log(
    'Redirect URI Match:',
    redirectParam === process.env.TWITTER_REDIRECT_URI ? '✅ Yes' : '❌ No'
  )

  // Check for localhost in URLs
  const hasLocalhost =
    url.includes('localhost') || redirectParam?.includes('localhost')
  console.log(
    'Contains localhost:',
    hasLocalhost ? '❌ Yes (PROBLEM!)' : '✅ No'
  )

  if (hasLocalhost) {
    console.log('\n🚨 ISSUE FOUND: OAuth URL contains localhost!')
    console.log(
      'This will cause "Invalid OAuth callback URL configuration" errors.'
    )
    console.log(
      'Make sure your backend environment is fully set to production.'
    )
  }

  console.log('\n📱 Twitter Developer Portal Check:')
  console.log(
    '1. Go to: https://developer.twitter.com/en/portal/projects-and-apps'
  )
  console.log('2. Select your app')
  console.log('3. Go to "App settings" > "Authentication settings"')
  console.log('4. Ensure "Callback URLs" contains EXACTLY:')
  console.log('   ' + process.env.TWITTER_REDIRECT_URI)
  console.log('5. Ensure "Website URL" is set to:')
  console.log('   https://vibe-tribe-manager.netlify.app')
} catch (error) {
  console.error('❌ Error testing Twitter OAuth configuration:', error.message)

  if (error.message.includes('credentials')) {
    console.log('\n💡 Possible fixes:')
    console.log('1. Check TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET')
    console.log(
      '2. Ensure credentials are not Base64 encoded (should be plain text)'
    )
    console.log('3. Verify credentials match your Twitter Developer Portal app')
  }
}

console.log('\n🏁 Configuration test complete')
