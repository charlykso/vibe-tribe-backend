#!/usr/bin/env node

/**
 * Media Upload Test Script
 * Tests Cloudinary configuration and media upload functionality
 */

import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Load environment variables from backend directory
dotenv.config({ path: './backend/.env' });

console.log('🔍 Testing Media Upload Configuration...\n');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test Cloudinary configuration
function testCloudinaryConfig() {
  console.log('📋 Cloudinary Configuration Test:');
  
  const requiredEnvVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log(`❌ Missing Cloudinary environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  console.log(`  ✅ Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`  ✅ API Key: ${process.env.CLOUDINARY_API_KEY}`);
  console.log(`  ✅ API Secret: ${process.env.CLOUDINARY_API_SECRET.substring(0, 10)}...`);
  console.log('  🎉 Cloudinary configuration looks good!\n');
  
  return true;
}

// Test Cloudinary connection
async function testCloudinaryConnection() {
  console.log('📋 Cloudinary Connection Test:');
  
  try {
    // Test connection by getting account usage
    const result = await cloudinary.api.usage();
    console.log('  ✅ Successfully connected to Cloudinary');
    console.log(`  📊 Storage used: ${(result.storage.usage / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`  📊 Transformations used: ${result.transformations.usage}`);
    console.log(`  📊 Plan: ${result.plan}`);
    console.log('  🎉 Cloudinary connection test passed!\n');
    return true;
  } catch (error) {
    console.log('  ❌ Failed to connect to Cloudinary');
    console.log(`  Error: ${error.message}`);
    console.log('');
    return false;
  }
}

// Test image upload (using a simple base64 test image)
async function testImageUpload() {
  console.log('📋 Image Upload Test:');
  
  try {
    // Create a simple test image (1x1 pixel PNG in base64)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const uploadOptions = {
      resource_type: 'image',
      folder: 'vibetribe/test',
      public_id: `test_upload_${Date.now()}`,
      overwrite: true,
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    };
    
    const result = await cloudinary.uploader.upload(testImageBase64, uploadOptions);
    
    console.log('  ✅ Test image uploaded successfully');
    console.log(`  📷 URL: ${result.secure_url}`);
    console.log(`  🆔 Public ID: ${result.public_id}`);
    console.log(`  📏 Dimensions: ${result.width}x${result.height}`);
    console.log(`  📦 Size: ${result.bytes} bytes`);
    
    // Clean up - delete the test image
    await cloudinary.uploader.destroy(result.public_id);
    console.log('  🗑️ Test image cleaned up');
    console.log('  🎉 Image upload test passed!\n');
    
    return true;
  } catch (error) {
    console.log('  ❌ Image upload test failed');
    console.log(`  Error: ${error.message}`);
    console.log('');
    return false;
  }
}

// Test URL generation
function testUrlGeneration() {
  console.log('📋 URL Generation Test:');
  
  try {
    const testPublicId = 'vibetribe/test/sample_image';
    
    // Generate different optimized URLs
    const originalUrl = cloudinary.url(testPublicId, { secure: true });
    const thumbnailUrl = cloudinary.url(testPublicId, {
      transformation: [{ width: 150, height: 150, crop: 'fill' }],
      secure: true
    });
    const optimizedUrl = cloudinary.url(testPublicId, {
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      secure: true
    });
    
    console.log('  ✅ URL generation working');
    console.log(`  🔗 Original: ${originalUrl}`);
    console.log(`  🔗 Thumbnail: ${thumbnailUrl}`);
    console.log(`  🔗 Optimized: ${optimizedUrl}`);
    console.log('  🎉 URL generation test passed!\n');
    
    return true;
  } catch (error) {
    console.log('  ❌ URL generation test failed');
    console.log(`  Error: ${error.message}`);
    console.log('');
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Media Upload Tests...\n');
  
  let allPassed = true;
  
  // Test 1: Configuration
  const configPassed = testCloudinaryConfig();
  if (!configPassed) allPassed = false;
  
  // Test 2: Connection
  const connectionPassed = await testCloudinaryConnection();
  if (!connectionPassed) allPassed = false;
  
  // Test 3: Image Upload
  const uploadPassed = await testImageUpload();
  if (!uploadPassed) allPassed = false;
  
  // Test 4: URL Generation
  const urlPassed = testUrlGeneration();
  if (!urlPassed) allPassed = false;
  
  // Summary
  console.log('📊 Test Summary:');
  if (allPassed) {
    console.log('🎉 All media upload tests passed!');
    console.log('✅ Cloudinary is properly configured and working');
    console.log('✅ Media upload functionality is ready to use');
  } else {
    console.log('⚠️  Some tests failed');
    console.log('❌ Fix the issues above before using media upload');
  }
  
  return allPassed;
}

// Run the tests
runTests().catch(console.error);
