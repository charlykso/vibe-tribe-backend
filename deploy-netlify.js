#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Netlify Deployment Process...\n');

// Check if dist folder exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
    console.log('❌ Build folder not found. Running build first...');
    try {
        execSync('npm run build', { stdio: 'inherit' });
        console.log('✅ Build completed successfully!\n');
    } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    }
}

// Check if netlify.toml exists
const netlifyConfigPath = path.join(__dirname, 'netlify.toml');
if (!fs.existsSync(netlifyConfigPath)) {
    console.log('❌ netlify.toml not found!');
    process.exit(1);
}

console.log('📋 Deployment Configuration:');
console.log('   • Build folder: dist/');
console.log('   • Config file: netlify.toml');
console.log('   • Site: VibeTribe Manager');
console.log('');

// Install netlify-cli if not available
console.log('🔧 Checking Netlify CLI...');
try {
    execSync('npx netlify-cli --version', { stdio: 'pipe' });
    console.log('✅ Netlify CLI is available\n');
} catch (error) {
    console.log('📦 Installing Netlify CLI...');
    try {
        execSync('npm install -g netlify-cli', { stdio: 'inherit' });
        console.log('✅ Netlify CLI installed successfully!\n');
    } catch (installError) {
        console.error('❌ Failed to install Netlify CLI:', installError.message);
        process.exit(1);
    }
}

// Deploy to Netlify
console.log('🚀 Deploying to Netlify...');
console.log('   This will open your browser for authentication if needed.\n');

try {
    // First, try to deploy (this will prompt for login if needed)
    execSync('npx netlify-cli deploy --prod --dir=dist --open', { 
        stdio: 'inherit',
        cwd: __dirname 
    });
    
    console.log('\n✅ Deployment completed successfully!');
    console.log('🌐 Your site should now be live on Netlify');
    console.log('📊 Check your Netlify dashboard for deployment details');
    
} catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('   1. Make sure you\'re logged into Netlify CLI');
    console.log('   2. Check your internet connection');
    console.log('   3. Verify your Netlify account permissions');
    console.log('   4. Try running: npx netlify-cli login');
    process.exit(1);
}
