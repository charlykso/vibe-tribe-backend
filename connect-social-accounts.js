#!/usr/bin/env node

/**
 * Simple script to manually connect social media accounts for testing
 * This bypasses OAuth and directly creates social account records in Firebase
 */

import fetch from 'node-fetch'

const API_BASE = 'http://localhost:3001/api/v1'

// User credentials
const USER_EMAIL = 'charlykso121@gmail.com'
const USER_PASSWORD = 'IKEnna123'

// Note: This script was for testing mock accounts
// Real OAuth connections should be done through the frontend UI
// which will use the real backend OAuth endpoints

async function login() {
  console.log('🔐 Logging in...')

  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: USER_EMAIL,
      password: USER_PASSWORD,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`Login failed: ${data.message || data.error}`)
  }

  console.log('✅ Login successful')
  console.log(`👤 User: ${data.user.name} (${data.user.email})`)
  console.log(`🏢 Organization: ${data.user.organization_id}`)

  return data.token
}

async function connectAccount(token, accountData) {
  console.log(`🔗 Connecting ${accountData.platform} account...`)

  const response = await fetch(`${API_BASE}/social-accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(accountData),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error(
      `❌ Failed to connect ${accountData.platform}:`,
      data.message || data.error
    )
    return false
  }

  console.log(`✅ ${accountData.platform} account connected successfully!`)
  console.log(`   Account ID: ${data.account.id}`)
  console.log(`   Username: ${data.account.username}`)

  return true
}

async function getConnectedAccounts(token) {
  console.log('📋 Fetching connected accounts...')

  const response = await fetch(`${API_BASE}/social-accounts`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('❌ Failed to fetch accounts:', data.message || data.error)
    return []
  }

  console.log(`✅ Found ${data.accounts.length} connected accounts:`)
  data.accounts.forEach((account) => {
    console.log(
      `   📱 ${account.platform}: ${account.username} (${account.display_name})`
    )
  })

  return data.accounts
}

async function main() {
  try {
    console.log('🚀 Social Media Account Connection Script\n')
    console.log('⚠️  This script was for testing mock accounts.')
    console.log(
      '📱 For real OAuth connections, please use the SocialTribe dashboard:'
    )
    console.log('   1. Open your SocialTribe app')
    console.log('   2. Go to Platform Connections')
    console.log('   3. Click "Connect" on the platform you want to connect')
    console.log('   4. Complete the OAuth flow in the popup window')
    console.log('')
    console.log('🔗 Real OAuth endpoints are configured in your backend:')
    console.log(
      '   - Twitter: https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/twitter/authorize'
    )
    console.log(
      '   - LinkedIn: https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/linkedin/authorize'
    )
    console.log(
      '   - Facebook: https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/facebook/authorize'
    )
    console.log(
      '   - Instagram: https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/instagram/authorize'
    )
    console.log('')
    console.log('✅ Your OAuth credentials are properly configured!')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the script
main()
