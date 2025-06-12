#!/usr/bin/env node

/**
 * Generate Base64 encoded credentials for deployment
 * This script helps create Base64 encoded versions of your credentials
 * for secure deployment to platforms like Render.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../backend/.env') })

console.log('🔧 Base64 Credentials Generator for SocialTribe')
console.log('================================================\n')

/**
 * Generate Base64 encoded OAuth credentials
 */
function generateOAuthBase64() {
  console.log('📱 Generating OAuth Credentials Base64...\n')

  const oauthCredentials = {
    TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID || '',
    TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET || '',
    TWITTER_REDIRECT_URI: process.env.TWITTER_REDIRECT_URI || '',
    LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID || '',
    LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET || '',
    LINKEDIN_REDIRECT_URI: process.env.LINKEDIN_REDIRECT_URI || '',
    FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || '',
    FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || '',
    FACEBOOK_REDIRECT_URI: process.env.FACEBOOK_REDIRECT_URI || '',
    INSTAGRAM_CLIENT_ID: process.env.INSTAGRAM_CLIENT_ID || '',
    INSTAGRAM_CLIENT_SECRET: process.env.INSTAGRAM_CLIENT_SECRET || '',
    INSTAGRAM_REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI || '',
  }

  // Check for missing credentials
  const missingKeys = Object.keys(oauthCredentials).filter(
    (key) => !oauthCredentials[key]
  )

  if (missingKeys.length > 0) {
    console.log('⚠️  Missing OAuth credentials:')
    missingKeys.forEach((key) => console.log(`   - ${key}`))
    console.log('\n   Please set these in your .env file first.\n')
  }

  // Generate Base64
  const oauthJson = JSON.stringify(oauthCredentials, null, 2)
  const oauthBase64 = Buffer.from(oauthJson).toString('base64')

  console.log('✅ OAuth Credentials JSON:')
  console.log('```json')
  console.log(oauthJson)
  console.log('```\n')

  console.log('🔐 OAuth Credentials Base64:')
  console.log('```')
  console.log(`OAUTH_CREDENTIALS_BASE64=${oauthBase64}`)
  console.log('```\n')

  return oauthBase64
}

/**
 * Generate Base64 encoded Firebase service account
 */
function generateFirebaseBase64() {
  console.log('🔥 Generating Firebase Service Account Base64...\n')

  const serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID || '',
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || '',
    private_key: process.env.FIREBASE_PRIVATE_KEY || '',
    client_email: process.env.FIREBASE_CLIENT_EMAIL || '',
    client_id: process.env.FIREBASE_CLIENT_ID || '',
    auth_uri:
      process.env.FIREBASE_AUTH_URI ||
      'https://accounts.google.com/o/oauth2/auth',
    token_uri:
      process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url:
      process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL ||
      'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL || '',
  }

  // Check for missing required fields
  const requiredFields = ['project_id', 'private_key', 'client_email']
  const missingFields = requiredFields.filter((field) => !serviceAccount[field])

  if (missingFields.length > 0) {
    console.log('⚠️  Missing Firebase credentials:')
    missingFields.forEach((field) =>
      console.log(`   - FIREBASE_${field.toUpperCase()}`)
    )
    console.log('\n   Please set these in your .env file first.\n')
    return null
  }

  // Generate Base64
  const serviceAccountJson = JSON.stringify(serviceAccount, null, 2)
  const serviceAccountBase64 =
    Buffer.from(serviceAccountJson).toString('base64')

  console.log('✅ Firebase Service Account JSON:')
  console.log('```json')
  console.log(serviceAccountJson)
  console.log('```\n')

  console.log('🔐 Firebase Service Account Base64:')
  console.log('```')
  console.log(`FIREBASE_SERVICE_ACCOUNT_BASE64=${serviceAccountBase64}`)
  console.log('```\n')

  return serviceAccountBase64
}

/**
 * Save Base64 credentials to a file
 */
function saveToFile(oauthBase64, firebaseBase64) {
  const outputPath = path.join(__dirname, '../deployment-credentials.env')

  let content = '# Base64 Encoded Credentials for Deployment\n'
  content += '# Generated on: ' + new Date().toISOString() + '\n\n'

  if (oauthBase64) {
    content += '# OAuth Credentials (Base64)\n'
    content += `OAUTH_CREDENTIALS_BASE64=${oauthBase64}\n\n`
  }

  if (firebaseBase64) {
    content += '# Firebase Service Account (Base64)\n'
    content += `FIREBASE_SERVICE_ACCOUNT_BASE64=${firebaseBase64}\n\n`
  }

  content += '# Copy these variables to your Render environment settings\n'
  content += '# or use them in your deployment configuration\n'

  fs.writeFileSync(outputPath, content)
  console.log(`💾 Credentials saved to: ${outputPath}\n`)
}

/**
 * Main function
 */
function main() {
  try {
    const oauthBase64 = generateOAuthBase64()
    const firebaseBase64 = generateFirebaseBase64()

    if (oauthBase64 || firebaseBase64) {
      saveToFile(oauthBase64, firebaseBase64)
    }

    console.log('🎯 Usage Instructions:')
    console.log('1. Copy the Base64 values above')
    console.log('2. Add them to your Render environment variables')
    console.log(
      '3. The app will automatically use Base64 if individual vars are missing'
    )
    console.log(
      '4. Individual variables take priority over Base64 when both are present\n'
    )

    console.log('🔒 Security Note:')
    console.log('- Keep these Base64 values secure')
    console.log('- Do not commit deployment-credentials.env to version control')
    console.log('- Use them only for deployment configuration\n')
  } catch (error) {
    console.error('❌ Error generating credentials:', error.message)
    process.exit(1)
  }
}

// Run the script
if (
  import.meta.url.endsWith(process.argv[1]) ||
  process.argv[1].includes('generate-base64-credentials.js')
) {
  main()
}

export { generateOAuthBase64, generateFirebaseBase64, saveToFile }
