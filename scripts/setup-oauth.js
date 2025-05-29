#!/usr/bin/env node

/**
 * OAuth Setup Script for VibeTribe
 * 
 * This script helps you configure OAuth credentials for social media platforms.
 * It can switch between demo mode and production mode.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(__dirname, '..', '.env');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🚀 VibeTribe OAuth Setup');
  console.log('========================\n');

  const mode = await question('Choose mode:\n1. Demo mode (for testing)\n2. Production mode (real OAuth apps)\nEnter choice (1 or 2): ');

  if (mode === '1') {
    await setupDemoMode();
  } else if (mode === '2') {
    await setupProductionMode();
  } else {
    console.log('❌ Invalid choice. Exiting.');
    process.exit(1);
  }

  rl.close();
}

async function setupDemoMode() {
  console.log('\n🎭 Setting up Demo Mode...');
  
  const demoCredentials = {
    TWITTER_CLIENT_ID: 'demo_twitter_client_id',
    TWITTER_CLIENT_SECRET: 'demo_twitter_client_secret',
    LINKEDIN_CLIENT_ID: 'demo_linkedin_client_id',
    LINKEDIN_CLIENT_SECRET: 'demo_linkedin_client_secret',
    FACEBOOK_APP_ID: 'demo_facebook_app_id',
    FACEBOOK_APP_SECRET: 'demo_facebook_app_secret',
    INSTAGRAM_CLIENT_ID: 'demo_instagram_client_id',
    INSTAGRAM_CLIENT_SECRET: 'demo_instagram_client_secret'
  };

  updateEnvFile(demoCredentials);
  
  console.log('✅ Demo mode configured!');
  console.log('\nIn demo mode:');
  console.log('- OAuth connections will show demo authorization pages');
  console.log('- Demo social media accounts will be created');
  console.log('- No real API calls will be made');
  console.log('\n📖 See OAUTH_SETUP_GUIDE.md for setting up real OAuth apps');
}

async function setupProductionMode() {
  console.log('\n🏭 Setting up Production Mode...');
  console.log('\n⚠️  You need to create OAuth apps first!');
  console.log('📖 See OAUTH_SETUP_GUIDE.md for detailed instructions\n');

  const credentials = {};

  // Twitter
  console.log('🐦 Twitter OAuth Setup:');
  credentials.TWITTER_CLIENT_ID = await question('Enter Twitter Client ID: ');
  credentials.TWITTER_CLIENT_SECRET = await question('Enter Twitter Client Secret: ');

  // LinkedIn
  console.log('\n💼 LinkedIn OAuth Setup:');
  credentials.LINKEDIN_CLIENT_ID = await question('Enter LinkedIn Client ID: ');
  credentials.LINKEDIN_CLIENT_SECRET = await question('Enter LinkedIn Client Secret: ');

  // Facebook
  console.log('\n👥 Facebook OAuth Setup:');
  credentials.FACEBOOK_APP_ID = await question('Enter Facebook App ID: ');
  credentials.FACEBOOK_APP_SECRET = await question('Enter Facebook App Secret: ');

  // Instagram (uses Facebook credentials)
  console.log('\n📸 Instagram OAuth Setup:');
  const usesameFacebook = await question('Use same Facebook credentials for Instagram? (y/n): ');
  
  if (usesameFacebook.toLowerCase() === 'y') {
    credentials.INSTAGRAM_CLIENT_ID = credentials.FACEBOOK_APP_ID;
    credentials.INSTAGRAM_CLIENT_SECRET = credentials.FACEBOOK_APP_SECRET;
  } else {
    credentials.INSTAGRAM_CLIENT_ID = await question('Enter Instagram Client ID: ');
    credentials.INSTAGRAM_CLIENT_SECRET = await question('Enter Instagram Client Secret: ');
  }

  updateEnvFile(credentials);
  
  console.log('\n✅ Production mode configured!');
  console.log('\nNext steps:');
  console.log('1. Restart your development servers');
  console.log('2. Test OAuth connections in the Platforms tab');
  console.log('3. Verify that real social media accounts can be connected');
}

function updateEnvFile(credentials) {
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Update each credential
    Object.entries(credentials).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    });

    fs.writeFileSync(envPath, envContent);
    console.log('📝 Updated .env file');
  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
    process.exit(1);
  }
}

function validateCredentials(credentials) {
  const required = [
    'TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET',
    'LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET',
    'FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET',
    'INSTAGRAM_CLIENT_ID', 'INSTAGRAM_CLIENT_SECRET'
  ];

  const missing = required.filter(key => !credentials[key] || credentials[key].trim() === '');
  
  if (missing.length > 0) {
    console.log('❌ Missing required credentials:', missing.join(', '));
    return false;
  }

  return true;
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Setup cancelled');
  rl.close();
  process.exit(0);
});

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { setupDemoMode, setupProductionMode, updateEnvFile };
