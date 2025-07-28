import dotenv from 'dotenv';
import { initializeDatabase, getFirestoreClient } from '../services/database.js';

// Load environment variables
dotenv.config();

const addRealUsersToExistingCommunities = async (): Promise<void> => {
  try {
    console.log('🔍 Adding real users to existing communities...');

    // Initialize Firebase connection
    await initializeDatabase();
    console.log('✅ Firebase connection established');

    const firestore = getFirestoreClient();

    // Get the user's organization ID
    const userOrgId = '51eehsR75718t2svEqhh'; // From the logs

    // Get all communities for this organization
    const communitiesSnapshot = await firestore
      .collection('communities')
      .where('organization_id', '==', userOrgId)
      .get();

    console.log(`🔍 Found ${communitiesSnapshot.docs.length} communities for organization ${userOrgId}`);

    if (communitiesSnapshot.empty) {
      console.log('❌ No communities found for this organization');
      process.exit(1);
    }

    // Get all users in this organization
    const usersSnapshot = await firestore
      .collection('users')
      .where('organization_id', '==', userOrgId)
      .get();

    console.log(`🔍 Found ${usersSnapshot.docs.length} users in organization`);

    // Add each user to each community
    let addedCount = 0;
    for (const communityDoc of communitiesSnapshot.docs) {
      const community = communityDoc.data();
      console.log(`\n🏘️ Processing community: ${community.name} (${community.platform})`);

      for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();
        
        // Check if user is already a member of this community
        const existingMemberSnapshot = await firestore
          .collection('community_members')
          .where('community_id', '==', communityDoc.id)
          .where('user_id', '==', userDoc.id)
          .limit(1)
          .get();

        if (!existingMemberSnapshot.empty) {
          console.log(`   ⚠️ User ${user.name} already a member`);
          continue;
        }

        // Add user as community member
        const communityMemberData = {
          user_id: userDoc.id,
          community_id: communityDoc.id,
          platform_user_id: `user_${userDoc.id}`,
          username: user.email.split('@')[0],
          display_name: user.name,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
          roles: ['member'],
          tags: [],
          join_date: new Date().toISOString(),
          last_activity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          message_count: Math.floor(Math.random() * 50),
          engagement_score: Math.floor(Math.random() * 100),
          sentiment_score: 0.5 + (Math.random() * 0.5), // 0.5 to 1.0
          metadata: {
            added_via: 'script',
            real_user: true
          },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await firestore.collection('community_members').add(communityMemberData);
        console.log(`   ✅ Added ${user.name} to ${community.name}`);
        addedCount++;
      }
    }

    console.log('\n🎉 Successfully added real users to communities!');
    console.log(`📊 Summary:`);
    console.log(`   Communities: ${communitiesSnapshot.docs.length}`);
    console.log(`   Users: ${usersSnapshot.docs.length}`);
    console.log(`   Total memberships added: ${addedCount}`);
    console.log('');
    console.log('🔄 Refresh your browser to see the real users in the communities!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to add real users:', error);
    process.exit(1);
  }
};

addRealUsersToExistingCommunities();
