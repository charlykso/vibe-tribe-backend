import dotenv from 'dotenv';
import { initializeDatabase, getFirestoreClient } from '../services/database.js';

// Load environment variables
dotenv.config();

const seedModerationData = async (): Promise<void> => {
  try {
    console.log('🛡️ Starting moderation data seeding...');

    // Initialize Firebase connection
    await initializeDatabase();
    console.log('✅ Firebase connection established');

    const firestore = getFirestoreClient();

    // Use the existing organization ID
    const existingOrgId = '51eehsR75718t2svEqhh';
    console.log('✅ Using existing organization ID:', existingOrgId);

    // Get existing communities
    const communitiesSnapshot = await firestore
      .collection('communities')
      .where('organization_id', '==', existingOrgId)
      .get();

    if (communitiesSnapshot.empty) {
      console.log('❌ No communities found. Please run seed-data.ts first.');
      process.exit(1);
    }

    console.log(`✅ Found ${communitiesSnapshot.docs.length} communities`);

    // Sample moderation queue items
    const moderationItems = [
      {
        type: 'message',
        content: 'This is a spam message with suspicious links',
        reason: 'Potential spam detected',
        priority: 'high',
        status: 'pending',
        reported_by: 'auto_moderation',
        platform_content_id: 'msg_001'
      },
      {
        type: 'user',
        content: 'User posting inappropriate content repeatedly',
        reason: 'Multiple violations',
        priority: 'medium',
        status: 'pending',
        reported_by: 'user_report',
        platform_content_id: 'user_002'
      },
      {
        type: 'message',
        content: 'Message contains hate speech',
        reason: 'Hate speech detection',
        priority: 'high',
        status: 'escalated',
        reported_by: 'auto_moderation',
        platform_content_id: 'msg_003'
      },
      {
        type: 'message',
        content: 'Suspicious promotional content',
        reason: 'Promotional content',
        priority: 'low',
        status: 'pending',
        reported_by: 'community_report',
        platform_content_id: 'msg_004'
      }
    ];

    let totalItemsCreated = 0;

    // Add moderation items for each community
    for (const communityDoc of communitiesSnapshot.docs) {
      const communityData = communityDoc.data();
      console.log(`🔍 Adding moderation items for community: ${communityData.name}`);

      for (const item of moderationItems) {
        const moderationData = {
          ...item,
          community_id: communityDoc.id,
          organization_id: existingOrgId,
          platform: communityData.platform,
          metadata: {
            community_name: communityData.name,
            auto_generated: true
          },
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        };

        await firestore.collection('moderation_queue').add(moderationData);
        totalItemsCreated++;
      }

      console.log(`✅ Added ${moderationItems.length} moderation items to ${communityData.name}`);
    }

    console.log('🎉 Moderation data seeding completed successfully!');
    console.log('');
    console.log('📋 Moderation data created:');
    console.log(`   Organization ID: ${existingOrgId}`);
    console.log(`   Communities: ${communitiesSnapshot.docs.length}`);
    console.log(`   Total Moderation Items: ${totalItemsCreated}`);
    console.log('');
    console.log('🛡️ Moderation queue populated with sample data');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Moderation data seeding failed:', error);
    process.exit(1);
  }
};

seedModerationData();
