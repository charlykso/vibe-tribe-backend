#!/usr/bin/env node

/**
 * Test Firebase private key format and Base64 decoding
 * This script helps debug Firebase credential issues
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'backend/.env') })

console.log('🔍 Firebase Private Key Debugging Tool')
console.log('=====================================\n')

// Test 1: Check the original private key from .env
console.log('📋 Test 1: Original Private Key from .env')
const originalKey = process.env.FIREBASE_PRIVATE_KEY
if (originalKey) {
  console.log('✅ Private key found in .env')
  console.log('📏 Length:', originalKey.length)
  console.log('🔤 First 50 chars:', originalKey.substring(0, 50))
  console.log('🔤 Last 50 chars:', originalKey.substring(originalKey.length - 50))
  console.log('🔍 Contains \\n literals:', originalKey.includes('\\n'))
  console.log('🔍 Contains actual newlines:', originalKey.includes('\n'))
  
  // Test if it starts and ends correctly
  const startsCorrectly = originalKey.includes('-----BEGIN PRIVATE KEY-----')
  const endsCorrectly = originalKey.includes('-----END PRIVATE KEY-----')
  console.log('✅ Starts with BEGIN:', startsCorrectly)
  console.log('✅ Ends with END:', endsCorrectly)
} else {
  console.log('❌ No private key found in .env')
}

console.log('\n' + '='.repeat(50) + '\n')

// Test 2: Test Base64 encoding/decoding
console.log('📋 Test 2: Base64 Encoding/Decoding Test')

if (originalKey) {
  // Create service account object
  const serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID || '',
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || '',
    private_key: originalKey.replace(/\\n/g, '\n'), // Convert literal \n to actual newlines
    client_email: process.env.FIREBASE_CLIENT_EMAIL || '',
    client_id: process.env.FIREBASE_CLIENT_ID || '',
    auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
    token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL || '',
  }

  // Encode to Base64
  const serviceAccountJson = JSON.stringify(serviceAccount, null, 2)
  const base64Encoded = Buffer.from(serviceAccountJson).toString('base64')
  
  console.log('✅ Base64 encoded successfully')
  console.log('📏 Base64 length:', base64Encoded.length)
  console.log('🔤 First 100 chars:', base64Encoded.substring(0, 100))
  
  // Test decoding
  try {
    const decoded = Buffer.from(base64Encoded, 'base64').toString('utf8')
    const parsedServiceAccount = JSON.parse(decoded)
    
    console.log('✅ Base64 decoded successfully')
    console.log('✅ JSON parsed successfully')
    console.log('🔍 Decoded private key length:', parsedServiceAccount.private_key.length)
    console.log('🔍 Decoded key starts correctly:', parsedServiceAccount.private_key.startsWith('-----BEGIN PRIVATE KEY-----'))
    console.log('🔍 Decoded key ends correctly:', parsedServiceAccount.private_key.endsWith('-----END PRIVATE KEY-----\n'))
    
    // Check for proper newlines in decoded key
    const decodedKey = parsedServiceAccount.private_key
    const lines = decodedKey.split('\n')
    console.log('🔍 Number of lines in private key:', lines.length)
    console.log('🔍 First line:', lines[0])
    console.log('🔍 Last line:', lines[lines.length - 2]) // -2 because last line is empty due to trailing \n
    
    // Test if the key looks valid (should have multiple lines)
    if (lines.length > 10) {
      console.log('✅ Private key appears to have correct line structure')
    } else {
      console.log('❌ Private key may not have correct line structure')
    }
    
    // Output the corrected Base64 for use in Render
    console.log('\n🎯 CORRECTED BASE64 FOR RENDER:')
    console.log('FIREBASE_SERVICE_ACCOUNT_BASE64=' + base64Encoded)
    
  } catch (error) {
    console.log('❌ Failed to decode/parse Base64:', error.message)
  }
} else {
  console.log('❌ Cannot test Base64 encoding without private key')
}

console.log('\n' + '='.repeat(50) + '\n')

// Test 3: Validate the private key format more thoroughly
console.log('📋 Test 3: Private Key Format Validation')

if (originalKey) {
  const processedKey = originalKey.replace(/\\n/g, '\n')
  
  // Check if it's a valid PEM format
  const pemRegex = /^-----BEGIN PRIVATE KEY-----\n[\s\S]+\n-----END PRIVATE KEY-----\n?$/
  const isValidPEM = pemRegex.test(processedKey)
  
  console.log('✅ Valid PEM format:', isValidPEM)
  
  if (!isValidPEM) {
    console.log('❌ Private key is not in valid PEM format')
    console.log('🔧 Attempting to fix format...')
    
    // Try to fix common issues
    let fixedKey = processedKey
    
    // Ensure it starts with the header
    if (!fixedKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
      console.log('❌ Missing BEGIN header')
    }
    
    // Ensure it ends with the footer
    if (!fixedKey.endsWith('-----END PRIVATE KEY-----\n')) {
      if (fixedKey.endsWith('-----END PRIVATE KEY-----')) {
        fixedKey += '\n'
        console.log('🔧 Added missing trailing newline')
      } else {
        console.log('❌ Missing END footer')
      }
    }
    
    // Check if the fix worked
    const isFixedValid = pemRegex.test(fixedKey)
    console.log('✅ Fixed key is valid:', isFixedValid)
    
    if (isFixedValid) {
      console.log('🎯 Use this corrected private key:')
      console.log(fixedKey)
    }
  }
}

console.log('\n🏁 Debugging complete!')
