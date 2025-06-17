#!/usr/bin/env node

/**
 * Environment Configuration Manager
 *
 * This script automatically detects the environment (development/production)
 * and sets appropriate environment variables for the VibeTribe application.
 *
 * Usage:
 *   node env-manager.js [environment]
 *
 * Arguments:
 *   environment: 'development', 'production', 'staging', or 'auto' (default)
 */

const fs = require('fs')
const path = require('path')
const os = require('os')

class EnvironmentManager {
  constructor() {
    this.workspaceRoot = path.resolve(__dirname, '..')
    this.backendRoot = __dirname
    this.environments = {
      development: {
        NODE_ENV: 'development',
        PORT: '3001',
        FRONTEND_URL: 'http://localhost:5173',
        CORS_ORIGIN: 'http://localhost:5173',
        JWT_SECRET:
          'demo-super-secret-jwt-key-for-development-only-change-in-production',
        REDIS_URL: 'redis://localhost:6379',
        RATE_LIMIT_WINDOW_MS: '900000', // 15 minutes
        RATE_LIMIT_MAX_REQUESTS: '1000', // More lenient for development
        BCRYPT_ROUNDS: '10', // Faster for development
        // OAuth redirect URIs for development
        TWITTER_REDIRECT_URI:
          'http://localhost:3001/api/v1/oauth/twitter/callback',
        LINKEDIN_REDIRECT_URI:
          'http://localhost:3001/api/v1/oauth/linkedin/callback',
        FACEBOOK_REDIRECT_URI:
          'http://localhost:3001/api/v1/oauth/facebook/callback',
        INSTAGRAM_REDIRECT_URI:
          'http://localhost:3001/api/v1/oauth/instagram/callback',
        // Security settings for development
        TOKEN_ENCRYPTION_KEY: 'dev-32-char-encryption-key-here!',
        // API URLs for frontend
        VITE_API_URL: 'http://localhost:3001/api/v1',
        VITE_WS_URL: 'ws://localhost:3001',
        VITE_NODE_ENV: 'development',
      },
      production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || '3001',
        FRONTEND_URL: 'https://vibe-tribe-manager.netlify.app',
        CORS_ORIGIN: 'https://vibe-tribe-manager.netlify.app',
        JWT_SECRET: null, // Must be provided securely
        REDIS_URL: null, // Must be provided (e.g., Redis Cloud, Render Redis)
        RATE_LIMIT_WINDOW_MS: '900000', // 15 minutes
        RATE_LIMIT_MAX_REQUESTS: '100', // Strict for production
        BCRYPT_ROUNDS: '12', // More secure for production
        // OAuth redirect URIs for production
        TWITTER_REDIRECT_URI:
          'https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/twitter/callback',
        LINKEDIN_REDIRECT_URI:
          'https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/linkedin/callback',
        FACEBOOK_REDIRECT_URI:
          'https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/facebook/callback',
        INSTAGRAM_REDIRECT_URI:
          'https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/instagram/callback',
        // Security settings for production
        TOKEN_ENCRYPTION_KEY: null, // Must be provided securely
        // API URLs for frontend
        VITE_API_URL: 'https://vibe-tribe-backend-8yvp.onrender.com/api/v1',
        VITE_WS_URL: 'wss://vibe-tribe-backend-8yvp.onrender.com',
        VITE_NODE_ENV: 'production',
      },
      staging: {
        NODE_ENV: 'staging',
        PORT: process.env.PORT || '3001',
        FRONTEND_URL: 'https://staging-vibe-tribe-manager.netlify.app',
        CORS_ORIGIN: 'https://staging-vibe-tribe-manager.netlify.app',
        JWT_SECRET: null, // Must be provided securely
        REDIS_URL: null, // Must be provided
        RATE_LIMIT_WINDOW_MS: '900000',
        RATE_LIMIT_MAX_REQUESTS: '200', // Between dev and prod
        BCRYPT_ROUNDS: '12',
        // OAuth redirect URIs for staging
        TWITTER_REDIRECT_URI:
          'https://staging-vibe-tribe-backend.onrender.com/api/v1/oauth/twitter/callback',
        LINKEDIN_REDIRECT_URI:
          'https://staging-vibe-tribe-backend.onrender.com/api/v1/oauth/linkedin/callback',
        FACEBOOK_REDIRECT_URI:
          'https://staging-vibe-tribe-backend.onrender.com/api/v1/oauth/facebook/callback',
        INSTAGRAM_REDIRECT_URI:
          'https://staging-vibe-tribe-backend.onrender.com/api/v1/oauth/instagram/callback',
        // Security settings for staging
        TOKEN_ENCRYPTION_KEY: null, // Must be provided securely
        // API URLs for frontend
        VITE_API_URL: 'https://staging-vibe-tribe-backend.onrender.com/api/v1',
        VITE_WS_URL: 'wss://staging-vibe-tribe-backend.onrender.com',
        VITE_NODE_ENV: 'staging',
      },
    }
  }

  /**
   * Detect the current environment based on various indicators
   */
  detectEnvironment() {
    // Check explicit NODE_ENV
    if (process.env.NODE_ENV) {
      const env = process.env.NODE_ENV.toLowerCase()
      if (this.environments[env]) {
        return env
      }
    }

    // Check for production indicators
    if (
      process.env.RENDER || // Render.com
      process.env.HEROKU_APP_NAME || // Heroku
      process.env.VERCEL || // Vercel
      process.env.NETLIFY || // Netlify
      process.env.AWS_REGION || // AWS
      process.env.GOOGLE_CLOUD_PROJECT // GCP
    ) {
      return 'production'
    }

    // Check for staging indicators
    if (
      process.env.STAGING ||
      (process.env.BRANCH && process.env.BRANCH.includes('staging')) ||
      (process.env.VERCEL_ENV && process.env.VERCEL_ENV === 'preview')
    ) {
      return 'staging'
    }

    // Check for development indicators
    if (
      process.env.DEV ||
      process.env.DEVELOPMENT ||
      os.hostname().includes('dev') ||
      fs.existsSync(path.join(this.workspaceRoot, 'node_modules'))
    ) {
      return 'development'
    }

    // Default to development for local environments
    return 'development'
  }

  /**
   * Load existing environment variables from .env file
   */
  loadExistingEnv() {
    const envPath = path.join(this.backendRoot, '.env')
    const existing = {}

    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      const lines = content.split('\n')

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=')
          if (key && valueParts.length > 0) {
            existing[key.trim()] = valueParts
              .join('=')
              .trim()
              .replace(/^["']|["']$/g, '')
          }
        }
      }
    }

    return existing
  }

  /**
   * Merge environment configuration with existing values
   */
  mergeEnvironments(targetEnv, existing) {
    const merged = { ...existing }
    const envConfig = this.environments[targetEnv]

    for (const [key, value] of Object.entries(envConfig)) {
      if (value === null) {
        // Keep existing value for null entries (sensitive data)
        if (!merged[key]) {
          console.warn(
            `⚠️  Warning: ${key} is not set and is required for ${targetEnv}`
          )
        }
      } else {
        // Override with environment-specific value
        merged[key] = value
      }
    }

    return merged
  }

  /**
   * Generate security keys if missing
   */
  generateSecurityKeys(config) {
    const crypto = require('crypto')

    // Generate JWT secret if missing
    if (!config.JWT_SECRET || config.JWT_SECRET.includes('demo')) {
      config.JWT_SECRET = crypto.randomBytes(64).toString('hex')
      console.log('🔑 Generated new JWT_SECRET')
    }

    // Generate encryption key if missing
    if (
      !config.TOKEN_ENCRYPTION_KEY ||
      config.TOKEN_ENCRYPTION_KEY.includes('dev')
    ) {
      config.TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex')
      console.log('🔑 Generated new TOKEN_ENCRYPTION_KEY')
    }

    return config
  }

  /**
   * Validate environment configuration
   */
  validateEnvironment(config, targetEnv) {
    const errors = []
    const warnings = []

    // Required fields for all environments
    const required = [
      'NODE_ENV',
      'PORT',
      'JWT_SECRET',
      'TOKEN_ENCRYPTION_KEY',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
    ]

    // Additional required fields for production
    if (targetEnv === 'production') {
      required.push('REDIS_URL')
    }

    // Check required fields
    for (const field of required) {
      if (!config[field]) {
        errors.push(`Missing required field: ${field}`)
      }
    }

    // Check for demo/placeholder values in production
    if (targetEnv === 'production') {
      const sensitiveFields = ['JWT_SECRET', 'TOKEN_ENCRYPTION_KEY']
      for (const field of sensitiveFields) {
        if (
          config[field] &&
          (config[field].includes('demo') || config[field].includes('dev'))
        ) {
          errors.push(`${field} contains demo/development value in production`)
        }
      }
    }

    // Check OAuth credentials
    const oauthPlatforms = ['TWITTER', 'LINKEDIN', 'FACEBOOK', 'INSTAGRAM']
    for (const platform of oauthPlatforms) {
      const clientId = config[`${platform}_CLIENT_ID`]
      const clientSecret =
        config[`${platform}_CLIENT_SECRET`] || config[`${platform}_APP_SECRET`]

      if (!clientId || !clientSecret) {
        warnings.push(`OAuth credentials missing for ${platform}`)
      }
    }

    return { errors, warnings }
  }

  /**
   * Write environment configuration to .env file
   */
  writeEnvFile(config) {
    const envPath = path.join(this.backendRoot, '.env')
    const lines = []

    // Add header
    lines.push('# VibeTribe Environment Configuration')
    lines.push(`# Generated on: ${new Date().toISOString()}`)
    lines.push(`# Environment: ${config.NODE_ENV}`)
    lines.push('')

    // Group related configurations
    const groups = {
      'Server Configuration': [
        'NODE_ENV',
        'PORT',
        'FRONTEND_URL',
        'CORS_ORIGIN',
      ],
      'Security Configuration': [
        'JWT_SECRET',
        'JWT_EXPIRES_IN',
        'TOKEN_ENCRYPTION_KEY',
        'BCRYPT_ROUNDS',
      ],
      'Firebase Configuration': [
        'FIREBASE_PROJECT_ID',
        'FIREBASE_PRIVATE_KEY_ID',
        'FIREBASE_PRIVATE_KEY',
        'FIREBASE_CLIENT_EMAIL',
        'FIREBASE_CLIENT_ID',
        'FIREBASE_AUTH_URI',
        'FIREBASE_TOKEN_URI',
        'FIREBASE_AUTH_PROVIDER_X509_CERT_URL',
        'FIREBASE_CLIENT_X509_CERT_URL',
      ],
      'Redis Configuration': ['REDIS_URL'],
      'Rate Limiting': ['RATE_LIMIT_WINDOW_MS', 'RATE_LIMIT_MAX_REQUESTS'],
      'Twitter OAuth': [
        'TWITTER_CLIENT_ID',
        'TWITTER_CLIENT_SECRET',
        'TWITTER_REDIRECT_URI',
      ],
      'LinkedIn OAuth': [
        'LINKEDIN_CLIENT_ID',
        'LINKEDIN_CLIENT_SECRET',
        'LINKEDIN_REDIRECT_URI',
      ],
      'Facebook OAuth': [
        'FACEBOOK_APP_ID',
        'FACEBOOK_APP_SECRET',
        'FACEBOOK_REDIRECT_URI',
      ],
      'Instagram OAuth': [
        'INSTAGRAM_CLIENT_ID',
        'INSTAGRAM_CLIENT_SECRET',
        'INSTAGRAM_REDIRECT_URI',
      ],
      'External Services': [
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET',
        'OPENAI_API_KEY',
      ],
      'Email Configuration': ['SENDGRID_API_KEY', 'FROM_EMAIL', 'FROM_NAME'],
      'Frontend URLs': ['VITE_API_URL', 'VITE_WS_URL', 'VITE_NODE_ENV'],
    }

    // Write grouped configurations
    for (const [groupName, keys] of Object.entries(groups)) {
      lines.push(`# ${groupName}`)

      for (const key of keys) {
        if (config[key] !== undefined) {
          const value = config[key]
          // Quote values that contain special characters
          const quotedValue =
            value && (value.includes(' ') || value.includes('\n'))
              ? `"${value}"`
              : value
          lines.push(`${key}=${quotedValue}`)
        }
      }
      lines.push('')
    }

    // Write remaining configurations
    const usedKeys = new Set(Object.values(groups).flat())
    const remainingKeys = Object.keys(config).filter(
      (key) => !usedKeys.has(key)
    )

    if (remainingKeys.length > 0) {
      lines.push('# Other Configuration')
      for (const key of remainingKeys) {
        const value = config[key]
        const quotedValue =
          value && (value.includes(' ') || value.includes('\n'))
            ? `"${value}"`
            : value
        lines.push(`${key}=${quotedValue}`)
      }
    }

    fs.writeFileSync(envPath, lines.join('\n'))
    return envPath
  }

  /**
   * Create frontend environment file
   */
  createFrontendEnv(config) {
    const frontendEnvPath = path.join(this.workspaceRoot, '.env')
    const frontendVars = {}

    // Extract VITE_ variables
    for (const [key, value] of Object.entries(config)) {
      if (key.startsWith('VITE_')) {
        frontendVars[key] = value
      }
    }

    // Add Firebase frontend configuration
    if (config.FIREBASE_PROJECT_ID) {
      frontendVars.VITE_FIREBASE_PROJECT_ID = config.FIREBASE_PROJECT_ID
      frontendVars.VITE_FIREBASE_AUTH_DOMAIN = `${config.FIREBASE_PROJECT_ID}.firebaseapp.com`
      frontendVars.VITE_FIREBASE_STORAGE_BUCKET = `${config.FIREBASE_PROJECT_ID}.appspot.com`
    }

    const lines = [
      '# VibeTribe Frontend Environment Configuration',
      `# Generated on: ${new Date().toISOString()}`,
      `# Environment: ${config.NODE_ENV}`,
      '',
    ]

    for (const [key, value] of Object.entries(frontendVars)) {
      lines.push(`${key}=${value}`)
    }

    fs.writeFileSync(frontendEnvPath, lines.join('\n'))
    return frontendEnvPath
  }

  /**
   * Main execution function
   */
  async run(targetEnv = 'auto') {
    console.log('🔧 VibeTribe Environment Manager')
    console.log('================================')

    // Detect or use specified environment
    const environment =
      targetEnv === 'auto' ? this.detectEnvironment() : targetEnv

    if (!this.environments[environment]) {
      console.error(`❌ Unknown environment: ${environment}`)
      console.log(
        'Available environments:',
        Object.keys(this.environments).join(', ')
      )
      process.exit(1)
    }

    console.log(`🔍 Target Environment: ${environment.toUpperCase()}`)

    // Load existing configuration
    console.log('📂 Loading existing configuration...')
    const existing = this.loadExistingEnv()

    // Merge with environment-specific settings
    console.log('🔄 Merging environment configuration...')
    let config = this.mergeEnvironments(environment, existing)

    // Generate security keys if needed
    if (
      environment === 'development' ||
      !config.JWT_SECRET ||
      !config.TOKEN_ENCRYPTION_KEY
    ) {
      console.log('🔐 Generating security keys...')
      config = this.generateSecurityKeys(config)
    }

    // Validate configuration
    console.log('✅ Validating configuration...')
    const { errors, warnings } = this.validateEnvironment(config, environment)

    if (warnings.length > 0) {
      console.log('⚠️  Warnings:')
      warnings.forEach((warning) => console.log(`   ${warning}`))
    }

    if (errors.length > 0) {
      console.log('❌ Errors:')
      errors.forEach((error) => console.log(`   ${error}`))

      if (environment === 'production') {
        console.log(
          '\n💡 For production deployment, ensure all required fields are properly configured.'
        )
        process.exit(1)
      }
    }

    // Write configuration files
    console.log('💾 Writing configuration files...')
    const backendEnvPath = this.writeEnvFile(config)
    const frontendEnvPath = this.createFrontendEnv(config)

    console.log('✅ Environment configuration completed!')
    console.log(`📄 Backend config: ${backendEnvPath}`)
    console.log(`📄 Frontend config: ${frontendEnvPath}`)
    console.log(`🌍 Environment: ${environment.toUpperCase()}`)

    // Show next steps
    console.log('\n🚀 Next Steps:')
    if (environment === 'development') {
      console.log('1. Install Redis for full functionality (optional)')
      console.log('2. Start backend: npm start')
      console.log('3. Start frontend: npm run dev (in root directory)')
    } else if (environment === 'production') {
      console.log('1. Verify all OAuth redirect URIs in respective platforms')
      console.log('2. Ensure Redis URL is configured')
      console.log('3. Deploy backend and frontend')
      console.log('4. Test OAuth flows in production')
    }

    return config
  }
}

// CLI execution
if (require.main === module) {
  const targetEnv = process.argv[2] || 'auto'
  const manager = new EnvironmentManager()

  manager.run(targetEnv).catch((error) => {
    console.error('❌ Environment setup failed:', error.message)
    process.exit(1)
  })
}

module.exports = EnvironmentManager
