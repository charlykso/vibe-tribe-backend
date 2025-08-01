import dotenv from 'dotenv';
import { initializeDatabase, getFirestoreClient } from '../services/database.js';

// Load environment variables
dotenv.config();

const fixCommunities = async (): Promise<void> => {
  try {
    console.log('🔧 Fixing communities...');

    // Initialize Firebase connection
    await initializeDatabase();
    console.log('✅ Firebase connection established');

    const firestore = getFirestoreClient();

    // Get all communities
    const communitiesQuery = await firestore
      .collection('communities')
      .get();

    console.log(`Found ${communitiesQuery.docs.length} communities`);

    // Group communities by name and platform to find duplicates
    const communityGroups = new Map();
    
    for (const doc of communitiesQuery.docs) {
      const data = doc.data();
      const key = `${data.name}-${data.platform}`;
      
      if (!communityGroups.has(key)) {
        communityGroups.set(key, []);
      }
      communityGroups.get(key).push({ id: doc.id, data });
    }

    console.log(`Found ${communityGroups.size} unique community types`);

    // Process each group
    for (const [key, communities] of communityGroups.entries()) {
      console.log(`\n📍 Processing ${key}:`);
      console.log(`   Found ${communities.length} instances`);

      if (communities.length > 1) {
        // Keep the first one, merge members from others, then delete duplicates
        const keepCommunity = communities[0];
        const duplicates = communities.slice(1);

        console.log(`   ✅ Keeping: ${keepCommunity.id}`);
        console.log(`   🗑️ Will delete: ${duplicates.map(d => d.id).join(', ')}`);

        // Move all members from duplicates to the kept community
        for (const duplicate of duplicates) {
          const membersQuery = await firestore
            .collection('community_members')
            .where('community_id', '==', duplicate.id)
            .get();

          console.log(`   📦 Moving ${membersQuery.docs.length} members from ${duplicate.id}`);

          for (const memberDoc of membersQuery.docs) {
            const memberData = memberDoc.data();
            
            // Check if this member already exists in the kept community
            const existingMemberQuery = await firestore
              .collection('community_members')
              .where('community_id', '==', keepCommunity.id)
              .where('platform_user_id', '==', memberData.platform_user_id)
              .limit(1)
              .get();

            if (existingMemberQuery.empty) {
              // Move member to kept community
              await firestore.collection('community_members').add({
                ...memberData,
                community_id: keepCommunity.id
              });
              console.log(`     ✅ Moved member: ${memberData.display_name || memberData.username}`);
            } else {
              console.log(`     ⚠️ Member already exists: ${memberData.display_name || memberData.username}`);
            }

            // Delete original member record
            await memberDoc.ref.delete();
          }

          // Delete duplicate community
          await firestore.collection('communities').doc(duplicate.id).delete();
          console.log(`   🗑️ Deleted duplicate community: ${duplicate.id}`);
        }
      }

      // Update member count for the kept community
      const keptCommunity = communities[0];
      const finalMembersQuery = await firestore
        .collection('community_members')
        .where('community_id', '==', keptCommunity.id)
        .get();

      const actualMemberCount = finalMembersQuery.docs.length;
      const activeMemberCount = finalMembersQuery.docs.filter(doc => 
        doc.data().is_active !== false
      ).length;

      await firestore.collection('communities').doc(keptCommunity.id).update({
        member_count: actualMemberCount,
        active_member_count: activeMemberCount,
        updated_at: new Date().toISOString()
      });

      console.log(`   📊 Updated member count: ${actualMemberCount} total, ${activeMemberCount} active`);
    }

    console.log('\n🎉 Community cleanup completed!');
    
    // Final summary
    const finalCommunitiesQuery = await firestore.collection('communities').get();
    console.log(`📋 Final summary:`);
    console.log(`   Communities remaining: ${finalCommunitiesQuery.docs.length}`);
    
    for (const doc of finalCommunitiesQuery.docs) {
      const data = doc.data();
      console.log(`   - ${data.name} (${data.platform}): ${data.member_count || 0} members`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Community fix failed:', error);
    process.exit(1);
  }
};

fixCommunities();
