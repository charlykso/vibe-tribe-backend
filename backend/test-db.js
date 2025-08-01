import dotenv from 'dotenv';
import { initializeDatabase, initializeCollections } from './dist/services/database.js';

// Load environment variables
dotenv.config();

async function testDatabase() {
  try {
    console.log('🚀 Testing database initialization...');
    
    // Initialize Firebase database connection
    await initializeDatabase();
    console.log('✅ Firebase database initialized successfully');

    // Initialize Firestore collections
    await initializeCollections();
    console.log('✅ Firestore collections initialized successfully');
    
    console.log('🎉 Database test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

testDatabase();
