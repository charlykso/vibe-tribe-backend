import dotenv from 'dotenv';
import { initializeDatabase, getFirestoreClient } from '../services/database.js';

// Load environment variables
dotenv.config();

const seedData = async (): Promise<void> => {
  try {
    console.log('🌱 Starting data seeding...');

    // Initialize Firebase connection
    await initializeDatabase();
    console.log('✅ Firebase connection established');

    const firestore = getFirestoreClient();

    // Use the existing user's organization ID
    const existingOrgId = '51eehsR75718t2svEqhh'; // From the user logs
    console.log('✅ Using existing organization ID:', existingOrgId);

    // Skip creating user since we're using existing user
    console.log('✅ Using existing user with organization');

    // Create sample communities
    const communities = [
      {
        name: 'Discord Community',
        platform: 'discord',
        platform_community_id: 'discord_123',
        description: 'Main Discord community for discussions',
        organization_id: existingOrgId,
        health_score: 85,
        member_count: 1542,
        active_member_count: 892,
        message_count: 15420,
        engagement_rate: 74.8,
        sentiment_score: 0.82,
        settings: {
          auto_moderation: true,
          welcome_message: 'Welcome to our community!'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      },
      {
        name: 'Telegram Group',
        platform: 'telegram',
        platform_community_id: 'telegram_456',
        description: 'Telegram group for quick updates',
        organization_id: existingOrgId,
        health_score: 92,
        member_count: 847,
        active_member_count: 623,
        message_count: 8947,
        engagement_rate: 68.2,
        sentiment_score: 0.89,
        settings: {
          auto_moderation: false,
          welcome_message: 'Welcome to our Telegram group!'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      },
      {
        name: 'Slack Workspace',
        platform: 'slack',
        platform_community_id: 'slack_789',
        description: 'Internal team workspace',
        organization_id: existingOrgId,
        health_score: 78,
        member_count: 234,
        active_member_count: 187,
        message_count: 2340,
        engagement_rate: 82.1,
        sentiment_score: 0.76,
        settings: {
          auto_moderation: true,
          welcome_message: 'Welcome to our workspace!'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      }
    ];

    const communityRefs = [];
    for (const community of communities) {
      const ref = await firestore.collection('communities').add(community);
      communityRefs.push(ref);
      console.log(`✅ Community created: ${community.name} (${ref.id})`);
    }

    // Create sample community members
    const sampleMembers = [
      { name: 'John Smith', username: 'johnsmith', platform_user_id: 'user_001' },
      { name: 'Sarah Johnson', username: 'sarahj', platform_user_id: 'user_002' },
      { name: 'Mike Wilson', username: 'mikew', platform_user_id: 'user_003' },
      { name: 'Emily Davis', username: 'emilyd', platform_user_id: 'user_004' },
      { name: 'Alex Brown', username: 'alexb', platform_user_id: 'user_005' }
    ];

    for (const communityRef of communityRefs) {
      for (const member of sampleMembers) {
        await firestore.collection('community_members').add({
          community_id: communityRef.id,
          platform_user_id: member.platform_user_id,
          username: member.username,
          display_name: member.name,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`,
          roles: ['member'],
          tags: [],
          join_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          last_activity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          message_count: Math.floor(Math.random() * 100),
          engagement_score: Math.floor(Math.random() * 100),
          sentiment_score: Math.random(),
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        });
      }
      console.log(`✅ Added ${sampleMembers.length} members to community ${communityRef.id}`);
    }

    console.log('🎉 Data seeding completed successfully!');
    console.log('');
    console.log('📋 Sample data created:');
    console.log(`   Organization ID: ${existingOrgId}`);
    console.log(`   Communities: ${communityRefs.length}`);
    console.log(`   Total Members: ${communityRefs.length * sampleMembers.length}`);
    console.log('');
    console.log('🔑 Communities created for existing user organization');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Data seeding failed:', error);
    process.exit(1);
  }
};

seedData();
