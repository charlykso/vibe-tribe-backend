#!/usr/bin/env node

/**
 * Quick Environment Setup Script
 *
 * Usage:
 *   npm run env:dev     - Set up development environment
 *   npm run env:prod    - Set up production environment
 *   npm run env:staging - Set up staging environment
 *   npm run env:auto    - Auto-detect environment
 */

const EnvironmentManager = require('./env-manager.cjs')

async function quickSetup() {
  const command = process.argv[2] || 'auto'

  // Map commands to environments
  const commandMap = {
    dev: 'development',
    development: 'development',
    prod: 'production',
    production: 'production',
    staging: 'staging',
    auto: 'auto',
  }

  const environment = commandMap[command] || 'auto'

  console.log('🚀 Quick Environment Setup')
  console.log('==========================')

  if (command === 'help' || command === '--help' || command === '-h') {
    console.log('Usage:')
    console.log('  node setup-env.js [environment]')
    console.log('')
    console.log('Environments:')
    console.log('  dev, development  - Development environment')
    console.log('  prod, production  - Production environment')
    console.log('  staging          - Staging environment')
    console.log('  auto             - Auto-detect (default)')
    console.log('')
    console.log('Examples:')
    console.log('  node setup-env.js dev')
    console.log('  node setup-env.js production')
    console.log('  npm run env:dev')
    return
  }

  try {
    const manager = new EnvironmentManager()
    const config = await manager.run(environment)

    console.log('\n🎉 Environment setup completed successfully!')

    // Show environment-specific tips
    if (config.NODE_ENV === 'development') {
      console.log('\n💡 Development Tips:')
      console.log('• Redis is optional for development')
      console.log('• OAuth redirects are set to localhost:3001')
      console.log('• Security keys are generated automatically')
      console.log('• Rate limiting is more lenient')
    } else if (config.NODE_ENV === 'production') {
      console.log('\n🔒 Production Checklist:')
      console.log('• ✅ Security keys generated')
      console.log('• ⚠️  Verify Redis URL is configured')
      console.log('• ⚠️  Verify OAuth redirect URIs in platforms')
      console.log('• ⚠️  Test all OAuth flows after deployment')
    }
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message)
    console.log('\n💡 Try:')
    console.log('1. Check your .env file permissions')
    console.log('2. Ensure you have write access to the directory')
    console.log('3. Run with --help for usage information')
    process.exit(1)
  }
}

quickSetup()
