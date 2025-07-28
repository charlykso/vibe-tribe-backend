import dotenv from 'dotenv';
import { initializeDatabase, getFirestoreClient } from '../services/database.js';

// Load environment variables
dotenv.config();

const fixTestUserOrganization = async (): Promise<void> => {
  try {
    console.log('🔧 Fixing test user organization...');

    // Initialize Firebase connection
    await initializeDatabase();
    console.log('✅ Firebase connection established');

    const firestore = getFirestoreClient();

    // Test user email
    const testEmail = 'test@example.com';

    // Find the test user
    const userQuery = await firestore
      .collection('users')
      .where('email', '==', testEmail)
      .limit(1)
      .get();

    if (userQuery.empty) {
      console.log('❌ Test user not found');
      process.exit(1);
    }

    const userDoc = userQuery.docs[0];
    console.log('✅ Found test user:', userDoc.id);

    // Find an organization that has communities
    const communitiesSnapshot = await firestore
      .collection('communities')
      .where('is_active', '==', true)
      .limit(1)
      .get();

    if (communitiesSnapshot.empty) {
      console.log('❌ No communities found');
      process.exit(1);
    }

    const firstCommunity = communitiesSnapshot.docs[0].data();
    const targetOrgId = firstCommunity.organization_id;
    console.log('✅ Found organization with communities:', targetOrgId);

    // Update the test user's organization
    await firestore.collection('users').doc(userDoc.id).update({
      organization_id: targetOrgId,
      updated_at: new Date()
    });

    console.log('✅ Test user organization updated successfully!');
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log('📧 Email:', testEmail);
    console.log('🔑 Password: password123');
    console.log('🏢 Organization ID:', targetOrgId);
    console.log('');
    console.log('🌐 You can now log in at: http://localhost:8080/login');
    console.log('📋 The user should now see communities and their members!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to fix test user organization:', error);
    process.exit(1);
  }
};

fixTestUserOrganization();
