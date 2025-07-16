import dotenv from 'dotenv';
import path from 'path';
import { initializeDatabase, getFirestoreClient, getServerTimestamp } from '../services/database.js';

// Load environment variables from backend/.env
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

const testFirebaseConnection = async (): Promise<void> => {
  try {
    console.log('🔥 Testing Firebase connection...');
    console.log('');

    // Test 1: Initialize Firebase
    console.log('1️⃣ Testing Firebase initialization...');
    await initializeDatabase();
    console.log('✅ Firebase initialized successfully');
    console.log('');

    // Test 2: Test Firestore connection
    console.log('2️⃣ Testing Firestore connection...');
    const firestore = getFirestoreClient();

    // Try to read from a collection (this will create it if it doesn't exist)
    const testCollection = firestore.collection('_test');
    await testCollection.limit(1).get();
    console.log('✅ Firestore connection successful');
    console.log('');

    // Test 3: Test write operation
    console.log('3️⃣ Testing Firestore write operation...');
    const testDoc = {
      message: 'Hello Firebase!',
      timestamp: getServerTimestamp(),
      test: true
    };

    const docRef = await testCollection.add(testDoc);
    console.log(`✅ Document written successfully with ID: ${docRef.id}`);
    console.log('');

    // Test 4: Test read operation
    console.log('4️⃣ Testing Firestore read operation...');
    const doc = await testCollection.doc(docRef.id).get();

    if (doc.exists) {
      const data = doc.data();
      console.log('✅ Document read successfully:');
      console.log('   Data:', JSON.stringify(data, null, 2));
    } else {
      throw new Error('Document not found');
    }
    console.log('');

    // Test 5: Test query operation
    console.log('5️⃣ Testing Firestore query operation...');
    const querySnapshot = await testCollection
      .where('test', '==', true)
      .limit(5)
      .get();

    console.log(`✅ Query successful, found ${querySnapshot.size} document(s)`);
    console.log('');

    // Test 6: Test update operation
    console.log('6️⃣ Testing Firestore update operation...');
    await testCollection.doc(docRef.id).update({
      updated: true,
      updated_at: getServerTimestamp()
    });
    console.log('✅ Document updated successfully');
    console.log('');

    // Test 7: Clean up test document
    console.log('7️⃣ Cleaning up test document...');
    await testCollection.doc(docRef.id).delete();
    console.log('✅ Test document deleted successfully');
    console.log('');

    // Test 8: Test collections initialization
    console.log('8️⃣ Testing collections initialization...');
    const collections = ['users', 'organizations', 'posts', 'social_accounts', 'analytics'];

    for (const collectionName of collections) {
      const collection = firestore.collection(collectionName);
      const snapshot = await collection.limit(1).get();
      console.log(`   ✅ Collection '${collectionName}' accessible (${snapshot.size} documents)`);
    }
    console.log('');

    // Success summary
    console.log('🎉 ALL TESTS PASSED! 🎉');
    console.log('');
    console.log('✅ Firebase is properly configured and working');
    console.log('✅ Firestore database is accessible');
    console.log('✅ Read/Write operations are working');
    console.log('✅ All required collections are accessible');
    console.log('');
    console.log('🚀 Your Firebase setup is ready for the VibeTribe backend!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start the development server: npm run server:dev');
    console.log('2. Test the auth endpoints with a tool like Postman');
    console.log('3. Register a new user and test the login flow');

  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    console.log('');
    console.log('🔧 Troubleshooting steps:');
    console.log('');
    console.log('1. Check your .env file has all required Firebase variables:');
    console.log('   - FIREBASE_PROJECT_ID');
    console.log('   - FIREBASE_PRIVATE_KEY');
    console.log('   - FIREBASE_CLIENT_EMAIL');
    console.log('   - etc.');
    console.log('');
    console.log('2. Verify your Firebase project has Firestore enabled');
    console.log('');
    console.log('3. Check your service account has the correct permissions');
    console.log('');
    console.log('4. Make sure your private key is properly formatted with \\n for line breaks');
    console.log('');

    if (error instanceof Error) {
      console.log('Error details:', error.message);
      if (error.message.includes('private_key')) {
        console.log('');
        console.log('💡 Private key formatting tip:');
        console.log('Make sure your FIREBASE_PRIVATE_KEY is wrapped in quotes and has \\n for line breaks:');
        console.log('FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nyour_key_here\\n-----END PRIVATE KEY-----\\n"');
      }
    }

    process.exit(1);
  }
};

// Run test if this script is executed directly
testFirebaseConnection();

export default testFirebaseConnection;
