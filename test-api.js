#!/usr/bin/env node

// Simple API testing script for Tribe backend
import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3001'
const API_BASE = `${BASE_URL}/api/v1`

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  name: 'Test User',
}

let authToken = null

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (authToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${authToken}`
  }

  try {
    console.log(`🔗 ${options.method || 'GET'} ${endpoint}`)
    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (response.ok) {
      console.log(
        `✅ Success (${response.status}):`,
        JSON.stringify(data, null, 2)
      )
      return { success: true, data, status: response.status }
    } else {
      console.log(
        `❌ Error (${response.status}):`,
        JSON.stringify(data, null, 2)
      )
      return { success: false, data, status: response.status }
    }
  } catch (error) {
    console.log(`💥 Request failed:`, error.message)
    return { success: false, error: error.message }
  }
}

// Test functions
async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...')
  try {
    const response = await fetch(`${BASE_URL}/health`)
    const data = await response.json()

    if (response.ok) {
      console.log('✅ Health check passed:', JSON.stringify(data, null, 2))
      return true
    } else {
      console.log('❌ Health check failed:', data)
      return false
    }
  } catch (error) {
    console.log('💥 Health check error:', error.message)
    return false
  }
}

async function testUserRegistration() {
  console.log('\n👤 Testing User Registration...')
  return await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser),
  })
}

async function testUserLogin() {
  console.log('\n🔐 Testing User Login...')
  const result = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password,
    }),
  })

  if (result.success && result.data.token) {
    authToken = result.data.token
    console.log('🎫 Auth token saved for subsequent requests')
  }

  return result
}

async function testGetCurrentUser() {
  console.log('\n👤 Testing Get Current User...')
  return await apiRequest('/auth/me')
}

async function testSocialAccountsEndpoints() {
  console.log('\n📱 Testing Social Accounts Endpoints...')

  // Test GET /social-accounts
  console.log('\n📋 Testing GET /social-accounts...')
  const getResult = await apiRequest('/social-accounts')

  // Test GET /social-accounts/platforms/supported
  console.log('\n🌐 Testing GET /social-accounts/platforms/supported...')
  const platformsResult = await apiRequest(
    '/social-accounts/platforms/supported'
  )

  return { getResult, platformsResult }
}

async function testInvalidEndpoint() {
  console.log('\n❓ Testing Invalid Endpoint...')
  return await apiRequest('/invalid-endpoint')
}

// Main test runner
async function runTests() {
  console.log('🧪 Tribe API Testing Suite')
  console.log('================================')

  const results = {
    healthCheck: false,
    registration: false,
    login: false,
    getCurrentUser: false,
    socialAccounts: false,
    invalidEndpoint: false,
  }

  try {
    // Test 1: Health Check
    results.healthCheck = await testHealthCheck()

    if (!results.healthCheck) {
      console.log('\n❌ Server is not running or health check failed')
      console.log('💡 Make sure to start the server first:')
      console.log('   cd vibe-tribe-manager && npm run server:dev')
      return
    }

    // Test 2: User Registration
    const regResult = await testUserRegistration()
    results.registration = regResult.success

    // Test 3: User Login
    const loginResult = await testUserLogin()
    results.login = loginResult.success

    // Test 4: Get Current User (requires auth)
    if (authToken) {
      const userResult = await testGetCurrentUser()
      results.getCurrentUser = userResult.success
    }

    // Test 5: Social Accounts Endpoints (requires auth)
    if (authToken) {
      const socialResult = await testSocialAccountsEndpoints()
      results.socialAccounts =
        socialResult.getResult.success || socialResult.platformsResult.success
    }

    // Test 6: Invalid Endpoint
    const invalidResult = await testInvalidEndpoint()
    results.invalidEndpoint = invalidResult.status === 404
  } catch (error) {
    console.log('\n💥 Test suite error:', error.message)
  }

  // Print summary
  console.log('\n📊 Test Results Summary')
  console.log('========================')
  Object.entries(results).forEach(([test, passed]) => {
    console.log(
      `${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`
    )
  })

  const passedCount = Object.values(results).filter(Boolean).length
  const totalCount = Object.keys(results).length

  console.log(`\n🎯 Overall: ${passedCount}/${totalCount} tests passed`)

  if (passedCount === totalCount) {
    console.log('🎉 All tests passed! API is working correctly.')
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.')
  }
}

// Run the tests
runTests().catch(console.error)
