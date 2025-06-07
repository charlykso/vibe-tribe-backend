// Test script to verify SendGrid email functionality
import dotenv from 'dotenv'
dotenv.config()

// Import the email service
import { emailService } from './dist/services/email.js'

async function testEmail() {
  console.log('🧪 Testing SendGrid Email Service...')
  console.log(
    '📧 SendGrid API Key:',
    process.env.SENDGRID_API_KEY ? 'Present' : 'Missing'
  )
  console.log('📧 From Email:', process.env.FROM_EMAIL)

  try {
    // Test sending a verification email
    const result = await emailService.sendVerificationEmail(
      'test@example.com', // Test email
      'test-verification-token-123',
      'Test User'
    )

    console.log('✅ Email test result:', result)

    if (result.success) {
      console.log('🎉 SendGrid email service is working correctly!')
    } else {
      console.log('❌ Email sending failed:', result.error)
    }
  } catch (error) {
    console.error('❌ Email test error:', error)
  }
}

// Run the test
testEmail()
