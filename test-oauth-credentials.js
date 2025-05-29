#!/usr/bin/env node

/**
 * OAuth Credentials Test Script
 * Tests if the OAuth credentials in .env are properly configured
 */

import dotenv from 'dotenv'

// Load environment variables from backend directory
dotenv.config({ path: './backend/.env' })

console.log('🔍 Testing OAuth Credentials Configuration...\n')

// Test configuration
const tests = [
  {
    name: 'Twitter OAuth',
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    redirectUri: process.env.TWITTER_REDIRECT_URI,
    platform: 'twitter',
  },
  {
    name: 'LinkedIn OAuth',
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    redirectUri: process.env.LINKEDIN_REDIRECT_URI,
    platform: 'linkedin',
  },
  {
    name: 'Facebook OAuth',
    clientId: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    redirectUri: process.env.FACEBOOK_REDIRECT_URI,
    platform: 'facebook',
  },
  {
    name: 'Instagram OAuth',
    clientId: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    redirectUri: process.env.INSTAGRAM_REDIRECT_URI,
    platform: 'instagram',
  },
]

function checkCredentials(test) {
  console.log(`📋 ${test.name}:`)

  const issues = []

  if (!test.clientId || test.clientId.includes('demo')) {
    issues.push('❌ Client ID missing or using demo value')
  } else {
    console.log(`  ✅ Client ID: ${test.clientId.substring(0, 10)}...`)
  }

  if (!test.clientSecret || test.clientSecret.includes('demo')) {
    issues.push('❌ Client Secret missing or using demo value')
  } else {
    console.log(`  ✅ Client Secret: ${test.clientSecret.substring(0, 10)}...`)
  }

  if (!test.redirectUri) {
    issues.push('❌ Redirect URI missing')
  } else {
    console.log(`  ✅ Redirect URI: ${test.redirectUri}`)
  }

  if (issues.length === 0) {
    console.log(`  🎉 ${test.name} credentials look good!\n`)
    return true
  } else {
    issues.forEach((issue) => console.log(`  ${issue}`))
    console.log('')
    return false
  }
}

// Test Firebase credentials
function checkFirebaseCredentials() {
  console.log('📋 Firebase Configuration:')

  const firebaseIssues = []

  if (!process.env.FIREBASE_PROJECT_ID) {
    firebaseIssues.push('❌ FIREBASE_PROJECT_ID missing')
  } else {
    console.log(`  ✅ Project ID: ${process.env.FIREBASE_PROJECT_ID}`)
  }

  if (!process.env.FIREBASE_PRIVATE_KEY) {
    firebaseIssues.push('❌ FIREBASE_PRIVATE_KEY missing')
  } else {
    console.log(`  ✅ Private Key: [CONFIGURED]`)
  }

  if (!process.env.FIREBASE_CLIENT_EMAIL) {
    firebaseIssues.push('❌ FIREBASE_CLIENT_EMAIL missing')
  } else {
    console.log(`  ✅ Client Email: ${process.env.FIREBASE_CLIENT_EMAIL}`)
  }

  if (firebaseIssues.length === 0) {
    console.log('  🎉 Firebase credentials look good!\n')
    return true
  } else {
    firebaseIssues.forEach((issue) => console.log(`  ${issue}`))
    console.log('')
    return false
  }
}

// Test Cloudinary credentials
function checkCloudinaryCredentials() {
  console.log('📋 Cloudinary Configuration:')

  const cloudinaryIssues = []

  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinaryIssues.push('❌ CLOUDINARY_CLOUD_NAME missing')
  } else {
    console.log(`  ✅ Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`)
  }

  if (!process.env.CLOUDINARY_API_KEY) {
    cloudinaryIssues.push('❌ CLOUDINARY_API_KEY missing')
  } else {
    console.log(`  ✅ API Key: ${process.env.CLOUDINARY_API_KEY}`)
  }

  if (!process.env.CLOUDINARY_API_SECRET) {
    cloudinaryIssues.push('❌ CLOUDINARY_API_SECRET missing')
  } else {
    console.log(
      `  ✅ API Secret: ${process.env.CLOUDINARY_API_SECRET.substring(
        0,
        10
      )}...`
    )
  }

  if (cloudinaryIssues.length === 0) {
    console.log('  🎉 Cloudinary credentials look good!\n')
    return true
  } else {
    cloudinaryIssues.forEach((issue) => console.log(`  ${issue}`))
    console.log('')
    return false
  }
}

// Run tests
async function runTests() {
  let allPassed = true

  // Test OAuth credentials
  for (const test of tests) {
    const passed = checkCredentials(test)
    if (!passed) allPassed = false
  }

  // Test Firebase credentials
  const firebasePassed = checkFirebaseCredentials()
  if (!firebasePassed) allPassed = false

  // Test Cloudinary credentials
  const cloudinaryPassed = checkCloudinaryCredentials()
  if (!cloudinaryPassed) allPassed = false

  // Summary
  console.log('📊 Summary:')
  if (allPassed) {
    console.log('🎉 All credentials are properly configured!')
    console.log('✅ Ready to test OAuth flows')
  } else {
    console.log('⚠️  Some credentials need attention')
    console.log('❌ Fix the issues above before testing OAuth flows')
  }

  return allPassed
}

// Run the tests
runTests().catch(console.error)
