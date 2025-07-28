import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { initializeDatabase, getFirestoreClient, getServerTimestamp } from '../services/database.js';

// Load environment variables
dotenv.config();

const createTestUser = async (): Promise<void> => {
  try {
    console.log('👤 Creating test user for login...');

    // Initialize Firebase connection
    await initializeDatabase();
    console.log('✅ Firebase connection established');

    const firestore = getFirestoreClient();

    // Test user credentials
    const testEmail = 'test@example.com';
    const testPassword = 'password123';
    const testName = 'Test User';

    // Check if user already exists
    const existingUserQuery = await firestore
      .collection('users')
      .where('email', '==', testEmail)
      .limit(1)
      .get();

    if (!existingUserQuery.empty) {
      console.log('⚠️ Test user already exists');
      const existingUser = existingUserQuery.docs[0];
      console.log('📧 Email:', testEmail);
      console.log('🔑 Password:', testPassword);
      console.log('🆔 User ID:', existingUser.id);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(testPassword, 12);

    // Use existing organization ID
    const existingOrgId = '51eehsR75718t2svEqhh';

    // Create test user
    const userData = {
      email: testEmail,
      password_hash: hashedPassword,
      name: testName,
      role: 'admin',
      organization_id: existingOrgId,
      email_verified: true,
      is_active: true,
      created_at: getServerTimestamp(),
      updated_at: getServerTimestamp()
    };

    const userRef = await firestore.collection('users').add(userData);
    console.log('✅ Test user created successfully!');
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log('📧 Email:', testEmail);
    console.log('🔑 Password:', testPassword);
    console.log('🆔 User ID:', userRef.id);
    console.log('🏢 Organization ID:', existingOrgId);
    console.log('');
    console.log('🌐 You can now log in at: http://localhost:8080/login');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create test user:', error);
    process.exit(1);
  }
};

createTestUser();
