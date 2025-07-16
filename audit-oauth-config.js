#!/usr/bin/env node

// Complete OAuth Configuration Audit
// This script checks all OAuth configurations and URLs for production readiness

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 COMPREHENSIVE OAUTH CONFIGURATION AUDIT');
console.log('==========================================\n');

// Read environment files
function readEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    });
    return env;
  } catch (error) {
    return null;
  }
}

// Check backend environment
const backendEnvPath = path.join(__dirname, 'backend', '.env');
const backendEnv = readEnvFile(backendEnvPath);

console.log('📂 BACKEND ENVIRONMENT CHECK');
console.log('----------------------------');

if (backendEnv) {
  console.log('✅ Backend .env file found');
  
  // Check critical environment variables
  const criticalVars = [
    'NODE_ENV',
    'FRONTEND_URL',
    'TWITTER_CLIENT_ID',
    'TWITTER_CLIENT_SECRET', 
    'TWITTER_REDIRECT_URI',
    'LINKEDIN_CLIENT_ID',
    'LINKEDIN_CLIENT_SECRET',
    'LINKEDIN_REDIRECT_URI',
    'FACEBOOK_APP_ID',
    'FACEBOOK_APP_SECRET',
    'FACEBOOK_REDIRECT_URI',
    'INSTAGRAM_CLIENT_ID',
    'INSTAGRAM_CLIENT_SECRET',
    'INSTAGRAM_REDIRECT_URI'
  ];

  const missingVars = [];
  const localhostVars = [];
  const productionIssues = [];

  criticalVars.forEach(varName => {
    const value = backendEnv[varName];
    if (!value) {
      missingVars.push(varName);
    } else {
      console.log(`  ${varName}: ${varName.includes('SECRET') ? '***HIDDEN***' : value}`);
      
      // Check for localhost URLs
      if (value.includes('localhost') || value.includes('127.0.0.1')) {
        localhostVars.push(varName);
      }
      
      // Check for production readiness
      if (varName === 'NODE_ENV' && value !== 'production') {
        productionIssues.push(`NODE_ENV should be 'production', found: '${value}'`);
      }
      
      if (varName === 'FRONTEND_URL' && !value.includes('netlify.app')) {
        productionIssues.push(`FRONTEND_URL should be production URL, found: '${value}'`);
      }
      
      if (varName.includes('REDIRECT_URI') && !value.includes('onrender.com')) {
        productionIssues.push(`${varName} should be production URL, found: '${value}'`);
      }
    }
  });

  console.log('\n🚨 ISSUES FOUND:');
  if (missingVars.length > 0) {
    console.log('❌ Missing Variables:', missingVars.join(', '));
  }
  if (localhostVars.length > 0) {
    console.log('❌ Localhost URLs Found:', localhostVars.join(', '));
  }
  if (productionIssues.length > 0) {
    console.log('❌ Production Issues:');
    productionIssues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  if (missingVars.length === 0 && localhostVars.length === 0 && productionIssues.length === 0) {
    console.log('✅ No issues found in backend environment!');
  }

} else {
  console.log('❌ Backend .env file not found');
}

console.log('\n📂 OAUTH SERVICE CODE AUDIT');
console.log('----------------------------');

// Check OAuth service file for demo/static code
const oauthServicePath = path.join(__dirname, 'backend', 'src', 'services', 'oauth.ts');
try {
  const oauthContent = fs.readFileSync(oauthServicePath, 'utf8');
  
  // Look for problematic patterns
  const problematicPatterns = [
    /demo_code/gi,
    /localhost:808[0-9]/gi,
    /demo_.*_token/gi,
    /\/oauth\/demo/gi,
    /demo_.*_client_id/gi,
    /\/api\/placeholder/gi
  ];
  
  let issuesFound = 0;
  problematicPatterns.forEach((pattern, index) => {
    const matches = oauthContent.match(pattern);
    if (matches && matches.length > 0) {
      console.log(`❌ Found problematic pattern ${index + 1}:`, matches);
      issuesFound++;
    }
  });
  
  if (issuesFound === 0) {
    console.log('✅ No demo/static code found in OAuth service');
  }
  
} catch (error) {
  console.log('❌ Could not read OAuth service file:', error.message);
}

console.log('\n🌐 EXPECTED PRODUCTION URLS');
console.log('----------------------------');
console.log('Frontend URL: https://vibe-tribe-manager.netlify.app');
console.log('Backend URL: https://vibe-tribe-backend-8yvp.onrender.com');
console.log('Twitter Redirect: https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/twitter/callback');
console.log('LinkedIn Redirect: https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/linkedin/callback');
console.log('Facebook Redirect: https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/facebook/callback');
console.log('Instagram Redirect: https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/instagram/callback');

console.log('\n🚀 DEPLOYMENT CHECKLIST');
console.log('------------------------');
console.log('□ All environment variables set to production values');
console.log('□ No demo/mock code in OAuth services');
console.log('□ All redirect URIs use production backend URL');
console.log('□ NODE_ENV=production');
console.log('□ FRONTEND_URL points to Netlify app');
console.log('□ Backend deployed to Render with updated environment');

console.log('\n🏁 AUDIT COMPLETE');
