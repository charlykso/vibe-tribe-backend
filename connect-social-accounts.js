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

// Mock social accounts to connect
const MOCK_ACCOUNTS = [
  {
    platform: 'twitter',
    access_token: 'mock_twitter_token_123',
    refresh_token: 'mock_twitter_refresh_123',
    platform_user_id: 'charlykso121_twitter',
    username: '@charlykso121',
    display_name: 'Ezeanyaeji Ikenna Remigius',
    avatar_url: 'https://pbs.twimg.com/profile_images/placeholder.jpg',
    permissions: ['read', 'write', 'analytics'],
  },
  {
    platform: 'linkedin',
    access_token: 'mock_linkedin_token_456',
    refresh_token: 'mock_linkedin_refresh_456',
    platform_user_id: 'charlykso121_linkedin',
    username: 'ezeanyaeji-ikenna-remigius',
    display_name: 'Ezeanyaeji Ikenna Remigius',
    avatar_url: 'https://media.licdn.com/dms/image/placeholder.jpg',
    permissions: ['read', 'write', 'company_pages'],
  },
]

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
    console.log('🚀 Starting social media account connection...\n')

    // Step 1: Login
    const token = await login()
    console.log('')

    // Step 2: Connect accounts
    for (const accountData of MOCK_ACCOUNTS) {
      await connectAccount(token, accountData)
    }
    console.log('')

    // Step 3: Verify connections
    await getConnectedAccounts(token)
    console.log('')

    console.log(
      '🎉 All done! You can now publish posts to connected platforms.'
    )
    console.log(
      '💡 Try creating a post in the VibeTribe dashboard and publishing it.'
    )
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the script
main()
