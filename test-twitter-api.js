import { TwitterApi } from 'twitter-api-v2';onst { TwitterApi } = require('twitter-api-v2')

// Test Twitter API client initialization
const clientId = 'VTd3a0xMX1AwREJJcUJFeDdNblE6MTpjaQ'
const clientSecret = 'XXAhvHZzPRZwQRLTlIZP9DEjHngQCyF7qhuqx9KVs3ttFoSo6E'
const redirectUri =
  'https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/twitter/callback'

console.log('🐦 Testing Twitter API client initialization...')
console.log('Client ID:', clientId)
console.log('Client Secret:', clientSecret ? 'present' : 'missing')
console.log('Redirect URI:', redirectUri)

try {
  const client = new TwitterApi({
    clientId: clientId,
    clientSecret: clientSecret,
  })

  console.log('✅ Twitter API client created successfully')

  // Test generating OAuth URL
  console.log('🔗 Testing OAuth URL generation...')
  const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
    redirectUri,
    {
      scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      state: 'test-state-123',
    }
  )

  console.log('✅ OAuth URL generated successfully:')
  console.log('URL:', url)
  console.log('Code Verifier:', codeVerifier ? 'generated' : 'missing')
  console.log('State:', state)
} catch (error) {
  console.error('❌ Error:', error)
  console.error('❌ Error details:', {
    message: error.message,
    stack: error.stack,
  })
}
