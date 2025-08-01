import dotenv from 'dotenv';
import { initializeDatabase, getFirestoreClient, getServerTimestamp } from '../services/database.js';

// Load environment variables
dotenv.config();

const seedPostsData = async (): Promise<void> => {
  try {
    console.log('📝 Starting posts data seeding...');

    // Initialize Firebase connection
    await initializeDatabase();
    console.log('✅ Firebase connection established');

    const firestore = getFirestoreClient();

    // Use the existing organization ID
    const existingOrgId = '51eehsR75718t2svEqhh';
    console.log('✅ Using existing organization ID:', existingOrgId);

    // Get existing user
    const usersSnapshot = await firestore
      .collection('users')
      .where('organization_id', '==', existingOrgId)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.log('❌ No users found. Please ensure users exist first.');
      process.exit(1);
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    console.log(`✅ Found user: ${userId}`);

    // Sample posts data
    const samplePosts = [
      {
        title: 'Welcome to Vibe Tribe!',
        content: '🎉 Welcome to Vibe Tribe - your ultimate social media management platform! We\'re excited to help you grow your online presence. #VibeTribe #SocialMedia #Welcome',
        platforms: ['twitter', 'linkedin'],
        status: 'published',
        media_urls: [],
        platform_post_ids: {
          twitter: 'tw_123456789',
          linkedin: 'li_987654321'
        },
        analytics: {
          views: 1250,
          likes: 89,
          shares: 23,
          comments: 12
        }
      },
      {
        title: 'Tips for Better Engagement',
        content: '💡 Pro tip: The best time to post on social media is when your audience is most active. Use our analytics to find your optimal posting times! #SocialMediaTips #Engagement #Analytics',
        platforms: ['twitter', 'facebook', 'linkedin'],
        status: 'published',
        media_urls: [],
        platform_post_ids: {
          twitter: 'tw_234567890',
          facebook: 'fb_345678901',
          linkedin: 'li_456789012'
        },
        analytics: {
          views: 2100,
          likes: 156,
          shares: 45,
          comments: 28
        }
      },
      {
        title: 'Scheduled Post Example',
        content: '⏰ This is a scheduled post! Planning your content in advance helps maintain consistency and saves time. #ContentPlanning #Scheduling #Productivity',
        platforms: ['twitter', 'linkedin'],
        status: 'scheduled',
        scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        media_urls: [],
        platform_post_ids: {},
        analytics: {}
      },
      {
        title: 'Draft Post - Product Launch',
        content: '🚀 Get ready for something amazing! We\'re working on exciting new features that will revolutionize your social media strategy. Stay tuned for the big announcement! #ComingSoon #ProductLaunch #Innovation',
        platforms: ['twitter', 'facebook', 'linkedin', 'instagram'],
        status: 'draft',
        media_urls: [],
        platform_post_ids: {},
        analytics: {}
      },
      {
        title: 'Community Engagement',
        content: '👥 Building a strong community is key to social media success. Engage with your audience, respond to comments, and create meaningful connections. #Community #Engagement #SocialMediaStrategy',
        platforms: ['facebook', 'linkedin'],
        status: 'published',
        media_urls: [],
        platform_post_ids: {
          facebook: 'fb_567890123',
          linkedin: 'li_678901234'
        },
        analytics: {
          views: 1800,
          likes: 134,
          shares: 67,
          comments: 45
        }
      },
      {
        title: 'Weekend Motivation',
        content: '🌟 Weekend vibes! Remember, consistency beats perfection. Keep creating, keep sharing, and keep growing your brand one post at a time. #WeekendMotivation #Consistency #Growth',
        platforms: ['instagram', 'twitter'],
        status: 'draft',
        media_urls: [],
        platform_post_ids: {},
        analytics: {}
      }
    ];

    let totalPostsCreated = 0;

    // Create sample posts
    for (const postData of samplePosts) {
      const postDoc = {
        ...postData,
        user_id: userId,
        organization_id: existingOrgId,
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      };

      await firestore.collection('posts').add(postDoc);
      totalPostsCreated++;
      console.log(`✅ Created post: ${postData.title} (${postData.status})`);
    }

    console.log('🎉 Posts data seeding completed successfully!');
    console.log('');
    console.log('📋 Posts data created:');
    console.log(`   Organization ID: ${existingOrgId}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Total Posts: ${totalPostsCreated}`);
    console.log(`   Published Posts: ${samplePosts.filter(p => p.status === 'published').length}`);
    console.log(`   Draft Posts: ${samplePosts.filter(p => p.status === 'draft').length}`);
    console.log(`   Scheduled Posts: ${samplePosts.filter(p => p.status === 'scheduled').length}`);
    console.log('');
    console.log('📝 Sample posts created for testing content management features');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Posts data seeding failed:', error);
    process.exit(1);
  }
};

seedPostsData();
