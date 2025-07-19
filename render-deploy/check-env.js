#!/usr/bin/env node

/**
 * Environment Variable Checker for Production Deployment
 * Validates all required environment variables are set correctly
 */

console.log('🔍 Environment Variable Check for Production');
console.log('===========================================');

const requiredVars = {
  // Core Application
  'NODE_ENV': 'Should be "production"',
  'PORT': 'Server port (usually 10000 for Render)',
  'FRONTEND_URL': 'Frontend URL for redirects',
  
  // Database
  'FIREBASE_PROJECT_ID': 'Firebase project ID',
  'FIREBASE_PRIVATE_KEY': 'Firebase private key (base64 encoded)',
  'FIREBASE_CLIENT_EMAIL': 'Firebase client email',
  
  // Redis
  'REDIS_URL': 'Redis connection URL',
  
  // OAuth - Twitter
  'TWITTER_CLIENT_ID': 'Twitter OAuth client ID',
  'TWITTER_CLIENT_SECRET': 'Twitter OAuth client secret',
  'TWITTER_REDIRECT_URI': 'Twitter OAuth redirect URI',
  
  // OAuth - LinkedIn
  'LINKEDIN_CLIENT_ID': 'LinkedIn OAuth client ID',
  'LINKEDIN_CLIENT_SECRET': 'LinkedIn OAuth client secret',
  'LINKEDIN_REDIRECT_URI': 'LinkedIn OAuth redirect URI',
  
  // Security
  'JWT_SECRET': 'JWT signing secret',
  'ENCRYPTION_KEY': 'Data encryption key',
  
  // Email
  'SENDGRID_API_KEY': 'SendGrid API key for emails',
  'FROM_EMAIL': 'From email address',
  
  // AI
  'OPENAI_API_KEY': 'OpenAI API key for content generation'
};

const optionalVars = {
  'CLOUDINARY_CLOUD_NAME': 'Cloudinary cloud name for image uploads',
  'CLOUDINARY_API_KEY': 'Cloudinary API key',
  'CLOUDINARY_API_SECRET': 'Cloudinary API secret',
  'RATE_LIMIT_REDIS_URL': 'Separate Redis URL for rate limiting',
  'AUTH_RATE_LIMIT_MAX': 'Max auth attempts per window'
};

let hasErrors = false;
let hasWarnings = false;

console.log('\n📋 Required Environment Variables:');
console.log('==================================');

for (const [varName, description] of Object.entries(requiredVars)) {
  const value = process.env[varName];
  
  if (!value) {
    console.log(`❌ ${varName}: MISSING - ${description}`);
    hasErrors = true;
  } else {
    // Mask sensitive values
    const displayValue = ['SECRET', 'KEY', 'PASSWORD'].some(sensitive => 
      varName.includes(sensitive)
    ) ? '***HIDDEN***' : value.substring(0, 50) + (value.length > 50 ? '...' : '');
    
    console.log(`✅ ${varName}: ${displayValue}`);
    
    // Specific validations
    if (varName === 'NODE_ENV' && value !== 'production') {
      console.log(`   ⚠️  Warning: NODE_ENV is "${value}", should be "production"`);
      hasWarnings = true;
    }
    
    if (varName === 'FRONTEND_URL' && !value.startsWith('http')) {
      console.log(`   ⚠️  Warning: FRONTEND_URL should start with http/https`);
      hasWarnings = true;
    }
    
    if (varName === 'REDIS_URL' && !value.startsWith('redis://')) {
      console.log(`   ⚠️  Warning: REDIS_URL should start with redis://`);
      hasWarnings = true;
    }
  }
}

console.log('\n📋 Optional Environment Variables:');
console.log('==================================');

for (const [varName, description] of Object.entries(optionalVars)) {
  const value = process.env[varName];
  
  if (!value) {
    console.log(`⚪ ${varName}: Not set - ${description}`);
  } else {
    const displayValue = ['SECRET', 'KEY', 'PASSWORD'].some(sensitive => 
      varName.includes(sensitive)
    ) ? '***HIDDEN***' : value.substring(0, 50) + (value.length > 50 ? '...' : '');
    
    console.log(`✅ ${varName}: ${displayValue}`);
  }
}

console.log('\n🔍 OAuth Configuration Check:');
console.log('=============================');

// Check Twitter OAuth
const twitterComplete = process.env.TWITTER_CLIENT_ID && 
                       process.env.TWITTER_CLIENT_SECRET && 
                       process.env.TWITTER_REDIRECT_URI;

if (twitterComplete) {
  console.log('✅ Twitter OAuth: Complete');
  
  // Validate redirect URI
  const twitterRedirect = process.env.TWITTER_REDIRECT_URI;
  if (!twitterRedirect.includes('/api/v1/oauth/twitter/callback')) {
    console.log('   ⚠️  Warning: Twitter redirect URI should end with /api/v1/oauth/twitter/callback');
    hasWarnings = true;
  }
} else {
  console.log('❌ Twitter OAuth: Incomplete');
  hasErrors = true;
}

// Check LinkedIn OAuth
const linkedinComplete = process.env.LINKEDIN_CLIENT_ID && 
                         process.env.LINKEDIN_CLIENT_SECRET && 
                         process.env.LINKEDIN_REDIRECT_URI;

if (linkedinComplete) {
  console.log('✅ LinkedIn OAuth: Complete');
} else {
  console.log('⚪ LinkedIn OAuth: Incomplete (optional)');
}

console.log('\n📊 Summary:');
console.log('===========');

if (hasErrors) {
  console.log('❌ ERRORS FOUND: Some required environment variables are missing');
  console.log('   Please set all required variables before deploying to production');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  WARNINGS: Configuration issues detected');
  console.log('   The application may work but some features might not function correctly');
  process.exit(0);
} else {
  console.log('✅ ALL CHECKS PASSED: Environment is properly configured');
  process.exit(0);
}
