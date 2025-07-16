import dotenv from 'dotenv';
import { initializeDatabase, initializeCollections } from '../services/database.js';

// Load environment variables
dotenv.config();

const setupFirebase = async (): Promise<void> => {
  try {
    console.log('🚀 Starting Firebase setup...');

    // Initialize Firebase connection
    await initializeDatabase();
    console.log('✅ Firebase connection established');

    // Initialize collections
    await initializeCollections();
    console.log('✅ Collections initialized');

    console.log('🎉 Firebase setup completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Update your .env file with your Firebase credentials');
    console.log('2. Start the development server: npm run server:dev');
    console.log('3. Test the API endpoints');

  } catch (error) {
    console.error('❌ Firebase setup failed:', error);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Check your Firebase project configuration');
    console.log('2. Verify your service account credentials');
    console.log('3. Ensure your Firebase project has Firestore enabled');
    process.exit(1);
  }
};

// Run setup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupFirebase();
}

export default setupFirebase;
