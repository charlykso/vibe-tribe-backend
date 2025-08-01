import dotenv from 'dotenv';
import { initializeDatabase, getFirestoreClient } from '../services/database.js';

// Load environment variables
dotenv.config();

const cleanMockData = async (): Promise<void> => {
  try {
    console.log('🧹 Starting mock data cleanup...');

    // Initialize Firebase connection
    await initializeDatabase();
    console.log('✅ Firebase connection established');

    const firestore = getFirestoreClient();

    // Delete mock community members (those with specific usernames from seed)
    const mockMembersQuery = await firestore
      .collection('community_members')
      .get();
      
    console.log(`Found ${mockMembersQuery.docs.length} community members`);
    
    let deletedCount = 0;
    let realCount = 0;
    
    for (const doc of mockMembersQuery.docs) {
      const data = doc.data();
      // Delete if it's mock data (has specific usernames from seed)
      const mockUsernames = ['johnsmith', 'sarahj', 'mikew', 'emilyd', 'alexb'];
      if (mockUsernames.includes(data.username)) {
        await doc.ref.delete();
        console.log(`🗑️ Deleted mock member: ${data.username}`);
        deletedCount++;
      } else {
        console.log(`✅ Keeping real member: ${data.username || data.display_name} (${data.email || 'no email'})`);
        realCount++;
      }
    }
    
    console.log('🎉 Mock data cleanup completed!');
    console.log(`   Deleted mock members: ${deletedCount}`);
    console.log(`   Kept real members: ${realCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Mock data cleanup failed:', error);
    process.exit(1);
  }
};

cleanMockData();
