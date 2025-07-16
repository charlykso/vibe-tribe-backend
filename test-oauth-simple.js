// Test Twitter OAuth URL generation

async function testTwitterOAuth() {
  try {
    console.log('🐦 Testing Twitter OAuth URL generation...\n')

    const response = await fetch(
      'http://localhost:3001/api/v1/oauth/initiate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dummy-token-for-test',
        },
        body: JSON.stringify({
          platform: 'twitter',
        }),
      }
    )

    const data = await response.json()

    console.log('Response Status:', response.status)
    console.log('Response Data:', JSON.stringify(data, null, 2))

    if (data.authUrl) {
      console.log('\n🔍 OAuth URL Analysis:')
      const url = new URL(data.authUrl)
      const redirectUri = url.searchParams.get('redirect_uri')

      console.log('Generated Auth URL:', data.authUrl)
      console.log('Redirect URI in URL:', redirectUri)
      console.log(
        'Contains localhost?',
        redirectUri?.includes('localhost') ? '❌ YES (PROBLEM!)' : '✅ NO'
      )
      console.log(
        'Uses production URL?',
        redirectUri?.includes('vibe-tribe-backend-8yvp.onrender.com')
          ? '✅ YES'
          : '❌ NO'
      )
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testTwitterOAuth()
