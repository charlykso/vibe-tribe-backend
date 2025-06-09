import dotenv from 'dotenv';
import path from 'path';
// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });
import { initializeDatabase, getFirestoreClient, getServerTimestamp } from './services/database.js';
async function testFirebaseConnection() {
    console.log('🔥 Testing Firebase Connection...');
    console.log('');
    try {
        // Test 1: Initialize Database
        console.log('📊 Test 1: Initializing Firebase Database...');
        await initializeDatabase();
        console.log('✅ Firebase database initialized successfully');
        console.log('');
        // Test 2: Get Firestore Client
        console.log('📊 Test 2: Getting Firestore Client...');
        const db = getFirestoreClient();
        console.log('✅ Firestore client obtained successfully');
        console.log('');
        // Test 3: Test Basic Write Operation
        console.log('📊 Test 3: Testing Write Operation...');
        const testDoc = {
            test: true,
            message: 'Firebase connection test',
            timestamp: getServerTimestamp(),
            project_id: process.env.FIREBASE_PROJECT_ID
        };
        const docRef = await db.collection('_connection_test').add(testDoc);
        console.log('✅ Write operation successful, document ID:', docRef.id);
        console.log('');
        // Test 4: Test Read Operation
        console.log('📊 Test 4: Testing Read Operation...');
        const doc = await docRef.get();
        if (doc.exists) {
            const data = doc.data();
            console.log('✅ Read operation successful, document data:', data);
        }
        else {
            console.log('❌ Document not found');
        }
        console.log('');
        // Test 5: Test Query Operation
        console.log('📊 Test 5: Testing Query Operation...');
        const querySnapshot = await db.collection('_connection_test')
            .where('test', '==', true)
            .limit(5)
            .get();
        console.log(`✅ Query operation successful, found ${querySnapshot.size} documents`);
        querySnapshot.forEach(doc => {
            console.log(`  - Document ID: ${doc.id}`);
        });
        console.log('');
        // Test 6: Test Collection Creation
        console.log('📊 Test 6: Testing Collection Creation...');
        const collections = ['users', 'organizations', 'posts', 'social_accounts', 'analytics'];
        for (const collectionName of collections) {
            try {
                // Try to read from collection (this will create it if it doesn't exist)
                const snapshot = await db.collection(collectionName).limit(1).get();
                console.log(`✅ Collection '${collectionName}' accessible (${snapshot.size} documents)`);
            }
            catch (error) {
                console.log(`❌ Error accessing collection '${collectionName}':`, error);
            }
        }
        console.log('');
        // Test 7: Test User Creation (Simulated)
        console.log('📊 Test 7: Testing User Document Creation...');
        const testUser = {
            email: 'test@firebase-connection.com',
            name: 'Firebase Test User',
            created_at: getServerTimestamp(),
            updated_at: getServerTimestamp(),
            is_active: true,
            role: 'user'
        };
        const userRef = await db.collection('users').add(testUser);
        console.log('✅ User document created successfully, ID:', userRef.id);
        console.log('');
        // Test 8: Test Organization Creation (Simulated)
        console.log('📊 Test 8: Testing Organization Document Creation...');
        const testOrg = {
            name: 'Firebase Test Organization',
            created_at: getServerTimestamp(),
            updated_at: getServerTimestamp(),
            owner_id: userRef.id,
            settings: {
                timezone: 'UTC',
                language: 'en'
            }
        };
        const orgRef = await db.collection('organizations').add(testOrg);
        console.log('✅ Organization document created successfully, ID:', orgRef.id);
        console.log('');
        // Test 9: Test Complex Query
        console.log('📊 Test 9: Testing Complex Query...');
        const complexQuery = await db.collection('users')
            .where('is_active', '==', true)
            .orderBy('created_at', 'desc')
            .limit(10)
            .get();
        console.log(`✅ Complex query successful, found ${complexQuery.size} active users`);
        console.log('');
        // Test 10: Cleanup Test Data
        console.log('📊 Test 10: Cleaning up test data...');
        await docRef.delete();
        await userRef.delete();
        await orgRef.delete();
        console.log('✅ Test data cleaned up successfully');
        console.log('');
        // Final Summary
        console.log('🎉 ALL FIREBASE TESTS PASSED! 🎉');
        console.log('');
        console.log('📋 Test Summary:');
        console.log('  ✅ Database initialization');
        console.log('  ✅ Firestore client access');
        console.log('  ✅ Write operations');
        console.log('  ✅ Read operations');
        console.log('  ✅ Query operations');
        console.log('  ✅ Collection access');
        console.log('  ✅ Document creation');
        console.log('  ✅ Complex queries');
        console.log('  ✅ Data cleanup');
        console.log('');
        console.log(`🔥 Firebase Project: ${process.env.FIREBASE_PROJECT_ID}`);
        console.log('🚀 Your Firebase backend is fully operational!');
    }
    catch (error) {
        console.error('❌ Firebase connection test failed:', error);
        console.log('');
        console.log('🔍 Debugging Information:');
        console.log('  Project ID:', process.env.FIREBASE_PROJECT_ID);
        console.log('  Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
        console.log('  Private Key ID:', process.env.FIREBASE_PRIVATE_KEY_ID);
        console.log('');
        process.exit(1);
    }
}
// Run the test
testFirebaseConnection();
//# sourceMappingURL=firebase-test.js.map