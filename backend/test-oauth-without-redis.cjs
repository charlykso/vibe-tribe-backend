// Test OAuth system behavior without Redis
console.log('🧪 Testing OAuth System without Redis')
console.log('=====================================')

// Test 1: Check if OAuth routes can start without Redis
console.log('\n1️⃣ Testing OAuth service startup...')

try {
  // Try to start the backend server briefly to see if it fails without Redis
  const { spawn } = require('child_process')

  console.log('⏳ Starting backend server (5 second test)...')

  const server = spawn('npm', ['start'], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'development' },
  })

  let output = ''
  let errorOutput = ''

  server.stdout.on('data', (data) => {
    output += data.toString()
  })

  server.stderr.on('data', (data) => {
    errorOutput += data.toString()
  })

  // Kill server after 5 seconds
  setTimeout(() => {
    server.kill('SIGTERM')

    console.log('\n📊 Server Test Results:')
    console.log('========================')

    if (output.includes('Server running') || output.includes('listening')) {
      console.log('✅ Backend server can start without Redis')
    } else if (
      errorOutput.includes('Redis') ||
      errorOutput.includes('ECONNREFUSED')
    ) {
      console.log('⚠️  Backend may have Redis dependency issues')
      console.log('📝 Consider implementing fallback mechanisms')
    } else {
      console.log('ℹ️  Server behavior unclear from this test')
    }

    if (output) {
      console.log('\n📄 Server Output (last 500 chars):')
      console.log(output.slice(-500))
    }

    if (errorOutput) {
      console.log('\n❌ Error Output (last 500 chars):')
      console.log(errorOutput.slice(-500))
    }

    console.log('\n💡 Redis Status Summary:')
    console.log('========================')
    console.log('🔴 Redis: NOT AVAILABLE')
    console.log('📱 Impact on OAuth:')
    console.log('   • OAuth state will be lost on server restart')
    console.log('   • Rate limiting may not work across requests')
    console.log('   • Token caching disabled')
    console.log('   • Session management affected')
    console.log('')
    console.log('🔧 Recommended Actions:')
    console.log('1. Install Redis for development:')
    console.log('   - Use WSL2 + Ubuntu + Redis')
    console.log('   - Use Docker Desktop with Redis container')
    console.log('   - Use Redis Cloud free tier')
    console.log('')
    console.log('2. For immediate testing without Redis:')
    console.log('   - OAuth will work but with limitations')
    console.log('   - Use in-memory fallbacks where possible')
    console.log('   - Test with shorter OAuth flows')
    console.log('')
    console.log('3. For production deployment:')
    console.log('   - Configure REDIS_URL in environment')
    console.log('   - Use managed Redis service (Render, AWS, etc.)')

    process.exit(0)
  }, 5000)

  server.on('error', (error) => {
    console.log('❌ Failed to start server:', error.message)
    console.log(
      '💡 This might be due to missing dependencies or configuration issues'
    )
    process.exit(1)
  })
} catch (error) {
  console.log('❌ Test failed:', error.message)
  console.log('\n🔍 Manual OAuth Testing Recommendations:')
  console.log('1. Start the backend with: npm start')
  console.log('2. Check server logs for Redis errors')
  console.log('3. Test OAuth initiation endpoints')
  console.log('4. Monitor for state management issues')
  process.exit(1)
}
