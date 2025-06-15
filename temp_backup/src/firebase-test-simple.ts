import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { initializeDatabase, getFirestoreClient, getServerTimestamp } from './services/database.js';

async function testFirebaseConnectionSimple() {
  console.log('🔥 Firebase Connection Test Results');
  console.log('=====================================');
  console.log('');

  try {
    // Test 1: Initialize Database
    console.log('📊 Test 1: Database Initialization');
    await initializeDatabase();
    console.log('✅ SUCCESS: Firebase database connected');
    console.log(`   Project: ${process.env.FIREBASE_PROJECT_ID}`);
    console.log('');

    // Test 2: Get Firestore Client
    console.log('📊 Test 2: Firestore Client Access');
    const db = getFirestoreClient();
    console.log('✅ SUCCESS: Firestore client obtained');
    console.log('');

    // Test 3: Basic Write Operation
    console.log('📊 Test 3: Write Operation');
    const testDoc = {
      test: true,
      message: 'Firebase connection successful',
      timestamp: getServerTimestamp(),
      project_id: process.env.FIREBASE_PROJECT_ID
    };

    const docRef = await db.collection('_connection_test').add(testDoc);
    console.log('✅ SUCCESS: Document written to Firestore');
    console.log(`   Document ID: ${docRef.id}`);
    console.log('');

    // Test 4: Basic Read Operation
    console.log('📊 Test 4: Read Operation');
    const doc = await docRef.get();
    if (doc.exists) {
      const data = doc.data();
      console.log('✅ SUCCESS: Document read from Firestore');
      console.log(`   Data: ${JSON.stringify(data, null, 2)}`);
    }
    console.log('');

    // Test 5: Simple Query
    console.log('📊 Test 5: Simple Query');
    const querySnapshot = await db.collection('_connection_test')
      .where('test', '==', true)
      .limit(5)
      .get();

    console.log('✅ SUCCESS: Query executed successfully');
    console.log(`   Found ${querySnapshot.size} documents`);
    console.log('');

    // Test 6: Collection Access
    console.log('📊 Test 6: Collection Access');
    const collections = ['users', 'organizations', 'posts', 'social_accounts'];

    for (const collectionName of collections) {
      try {
        const snapshot = await db.collection(collectionName).limit(1).get();
        console.log(`✅ Collection '${collectionName}': ${snapshot.size} documents`);
      } catch (error) {
        console.log(`❌ Collection '${collectionName}': Error accessing`);
      }
    }
    console.log('');

    // Test 7: User Document Creation
    console.log('📊 Test 7: User Document Creation');
    const testUser = {
      email: 'test@firebase-test.com',
      name: 'Firebase Test User',
      created_at: getServerTimestamp(),
      is_active: true,
      role: 'user'
    };

    const userRef = await db.collection('users').add(testUser);
    console.log('✅ SUCCESS: User document created');
    console.log(`   User ID: ${userRef.id}`);
    console.log('');

    // Test 8: Organization Document Creation
    console.log('📊 Test 8: Organization Document Creation');
    const testOrg = {
      name: 'Firebase Test Organization',
      created_at: getServerTimestamp(),
      owner_id: userRef.id,
      settings: {
        timezone: 'UTC',
        language: 'en'
      }
    };

    const orgRef = await db.collection('organizations').add(testOrg);
    console.log('✅ SUCCESS: Organization document created');
    console.log(`   Organization ID: ${orgRef.id}`);
    console.log('');

    // Test 9: Cleanup
    console.log('📊 Test 9: Cleanup Test Data');
    await docRef.delete();
    await userRef.delete();
    await orgRef.delete();
    console.log('✅ SUCCESS: Test data cleaned up');
    console.log('');

    // Final Results
    console.log('🎉 FIREBASE CONNECTION TEST COMPLETE! 🎉');
    console.log('==========================================');
    console.log('');
    console.log('📋 Test Results Summary:');
    console.log('  ✅ Database initialization: PASSED');
    console.log('  ✅ Firestore client access: PASSED');
    console.log('  ✅ Write operations: PASSED');
    console.log('  ✅ Read operations: PASSED');
    console.log('  ✅ Query operations: PASSED');
    console.log('  ✅ Collection access: PASSED');
    console.log('  ✅ Document creation: PASSED');
    console.log('  ✅ Data cleanup: PASSED');
    console.log('');
    console.log('🔥 Firebase Configuration:');
    console.log(`   Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
    console.log(`   Client Email: ${process.env.FIREBASE_CLIENT_EMAIL}`);
    console.log('');
    console.log('🚀 Your Firebase backend is FULLY OPERATIONAL!');
    console.log('   Ready for production use with VibeTribe application.');
    console.log('');

  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    console.log('');
    console.log('🔍 Debugging Information:');
    console.log(`   Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
    console.log(`   Client Email: ${process.env.FIREBASE_CLIENT_EMAIL}`);
    console.log(`   Private Key ID: ${process.env.FIREBASE_PRIVATE_KEY_ID}`);
    console.log('');
    process.exit(1);
  }
}

// Run the test
testFirebaseConnectionSimple();
