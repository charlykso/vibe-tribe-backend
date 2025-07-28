import { getFirestoreClient } from './database.js';
import {
  Community,
  CreateCommunity,
  CommunityMember,
  CommunityMessage,
  ConversationThread
} from '../types/database.js';

export class CommunityService {
  // ============================================================================
  // COMMUNITY MANAGEMENT
  // ============================================================================

  async createCommunity(communityData: CreateCommunity): Promise<Community> {
    try {
      const db = getFirestoreClient();
      const docRef = await db.collection('communities').add({
        ...communityData,
        health_score: 0,
        member_count: 0,
        active_member_count: 0,
        message_count: 0,
        engagement_rate: 0.00,
        sentiment_score: 0.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      });

      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() } as Community;
    } catch (error) {
      console.error('Error creating community:', error);
      throw new Error('Failed to create community');
    }
  }

  async getCommunities(organizationId: string): Promise<Community[]> {
    try {
      console.log('🔍 CommunityService.getCommunities called with organizationId:', organizationId);
      const db = getFirestoreClient();

      // Simple query with just organization_id to avoid index issues
      console.log('🔍 Querying communities collection...');
      const snapshot = await db
        .collection('communities')
        .where('organization_id', '==', organizationId)
        .get();

      console.log('🔍 Raw query result - docs found:', snapshot.docs.length);

      // Filter active communities and sort in memory
      const communities = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(community => community.is_active !== false) // Include if is_active is true or undefined
        .sort((a, b) => {
          // Sort by created_at descending
          const aDate = new Date(a.created_at || 0);
          const bDate = new Date(b.created_at || 0);
          return bDate.getTime() - aDate.getTime();
        }) as Community[];

      console.log('✅ Filtered and sorted communities:', communities.length);
      console.log('🔍 Communities data:', communities.map(c => ({ id: c.id, name: c.name, platform: c.platform })));

      return communities;
    } catch (error) {
      console.error('❌ Error in getCommunities:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error; // Re-throw the original error for better debugging
    }
  }

  async getCommunityById(communityId: string): Promise<Community | null> {
    try {
      const db = getFirestoreClient();
      const doc = await db.collection('communities').doc(communityId).get();
      if (!doc.exists) return null;

      return { id: doc.id, ...doc.data() } as Community;
    } catch (error) {
      console.error('Error fetching community:', error);
      throw new Error('Failed to fetch community');
    }
  }

  async updateCommunity(communityId: string, updates: Partial<Community>): Promise<Community> {
    try {
      const db = getFirestoreClient();
      await db.collection('communities').doc(communityId).update({
        ...updates,
        updated_at: new Date().toISOString()
      });

      const doc = await db.collection('communities').doc(communityId).get();
      return { id: doc.id, ...doc.data() } as Community;
    } catch (error) {
      console.error('Error updating community:', error);
      throw new Error('Failed to update community');
    }
  }

  async deleteCommunity(communityId: string): Promise<void> {
    try {
      const db = getFirestoreClient();
      await db.collection('communities').doc(communityId).update({
        is_active: false,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deleting community:', error);
      throw new Error('Failed to delete community');
    }
  }

  // ============================================================================
  // MEMBER MANAGEMENT
  // ============================================================================

  async addCommunityMember(memberData: Partial<CommunityMember> & { community_id: string; platform_user_id: string }): Promise<CommunityMember> {
    try {
      const db = getFirestoreClient();
      const docRef = await db.collection('community_members').add({
        ...memberData,
        engagement_score: memberData.engagement_score || 0,
        sentiment_score: memberData.sentiment_score || 0.00,
        message_count: memberData.message_count || 0,
        roles: memberData.roles || [],
        tags: memberData.tags || [],
        metadata: memberData.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      });

      // Update community member count
      await this.updateCommunityStats(memberData.community_id);

      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() } as CommunityMember;
    } catch (error) {
      console.error('Error adding community member:', error);
      throw new Error('Failed to add community member');
    }
  }

  async getCommunityMembers(communityId: string, limit = 50, offset = 0): Promise<CommunityMember[]> {
    try {
      console.log('🔍 CommunityService.getCommunityMembers called with communityId:', communityId);
      const db = getFirestoreClient();

      // Simplified query to avoid index issues
      console.log('🔍 Querying community_members collection...');
      const snapshot = await db
        .collection('community_members')
        .where('community_id', '==', communityId)
        .get();

      console.log('🔍 Raw members query result - docs found:', snapshot.docs.length);

      // Filter, sort, and paginate in memory
      const allMembers = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(member => member.is_active !== false); // Include if is_active is true or undefined

      // Sort by engagement_score descending
      allMembers.sort((a, b) => {
        const aScore = a.engagement_score || 0;
        const bScore = b.engagement_score || 0;
        return bScore - aScore;
      });

      // Apply pagination
      const paginatedMembers = allMembers.slice(offset, offset + limit) as CommunityMember[];

      console.log('✅ Filtered, sorted, and paginated members:', paginatedMembers.length);
      console.log('🔍 Members data:', paginatedMembers.map(m => ({ id: m.id, username: m.username, engagement_score: m.engagement_score })));

      return paginatedMembers;
    } catch (error) {
      console.error('❌ Error in getCommunityMembers:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error; // Re-throw the original error for better debugging
    }
  }

  async updateMemberEngagement(memberId: string, engagementData: {
    engagement_score?: number;
    sentiment_score?: number;
    message_count?: number;
    last_active_at?: Date;
    last_message_at?: Date;
  }): Promise<void> {
    try {
      const db = getFirestoreClient();
      await db.collection('community_members').doc(memberId).update({
        ...engagementData,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating member engagement:', error);
      throw new Error('Failed to update member engagement');
    }
  }

  // ============================================================================
  // MESSAGE MANAGEMENT
  // ============================================================================

  async ingestMessage(messageData: Partial<CommunityMessage> & { community_id: string; platform_message_id: string; content: string }): Promise<CommunityMessage> {
    try {
      const db = getFirestoreClient();
      const docRef = await db.collection('community_messages').add({
        ...messageData,
        engagement_score: messageData.engagement_score || 0,
        message_type: messageData.message_type || 'text',
        attachments: messageData.attachments || [],
        reactions: messageData.reactions || {},
        mentions: messageData.mentions || [],
        hashtags: messageData.hashtags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false
      });

      // Update community and member stats
      await this.updateCommunityStats(messageData.community_id);
      if (messageData.member_id) {
        await this.updateMemberEngagement(messageData.member_id, {
          message_count: 1, // This should be incremented
          last_message_at: new Date(),
          last_active_at: new Date()
        });
      }

      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() } as CommunityMessage;
    } catch (error) {
      console.error('Error ingesting message:', error);
      throw new Error('Failed to ingest message');
    }
  }

  async getCommunityMessages(
    communityId: string,
    limit = 50,
    offset = 0,
    threadId?: string
  ): Promise<CommunityMessage[]> {
    try {
      const db = getFirestoreClient();
      let query = db
        .collection('community_messages')
        .where('community_id', '==', communityId)
        .where('is_deleted', '==', false);

      if (threadId) {
        query = query.where('thread_id', '==', threadId);
      }

      const snapshot = await query
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommunityMessage[];
    } catch (error) {
      console.error('Error fetching community messages:', error);
      throw new Error('Failed to fetch community messages');
    }
  }

  // ============================================================================
  // COMMUNITY HEALTH & ANALYTICS
  // ============================================================================

  async calculateHealthScore(communityId: string): Promise<number> {
    try {
      const community = await this.getCommunityById(communityId);
      if (!community) throw new Error('Community not found');

      // Simple health score calculation based on:
      // - Member activity (40%)
      // - Message frequency (30%)
      // - Sentiment score (20%)
      // - Engagement rate (10%)

      const activityScore = Math.min(community.active_member_count / Math.max(community.member_count, 1) * 100, 100);
      const messageScore = Math.min(community.message_count / 100 * 100, 100); // Normalize to 100 messages
      const sentimentScore = (community.sentiment_score + 1) * 50; // Convert -1,1 to 0,100
      const engagementScore = Math.min(community.engagement_rate * 10, 100);

      const healthScore = Math.round(
        activityScore * 0.4 +
        messageScore * 0.3 +
        sentimentScore * 0.2 +
        engagementScore * 0.1
      );

      await this.updateCommunity(communityId, { health_score: healthScore });
      return healthScore;
    } catch (error) {
      console.error('Error calculating health score:', error);
      throw new Error('Failed to calculate health score');
    }
  }

  async updateCommunityStats(communityId: string): Promise<void> {
    try {
      const db = getFirestoreClient();
      // Get member count
      const membersSnapshot = await db
        .collection('community_members')
        .where('community_id', '==', communityId)
        .where('is_active', '==', true)
        .get();

      // Get active members (active in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoString = sevenDaysAgo.toISOString();

      const activeMembersSnapshot = await db
        .collection('community_members')
        .where('community_id', '==', communityId)
        .where('is_active', '==', true)
        .where('last_active_at', '>=', sevenDaysAgoString)
        .get();

      // Get message count
      const messagesSnapshot = await db
        .collection('community_messages')
        .where('community_id', '==', communityId)
        .where('is_deleted', '==', false)
        .get();

      await this.updateCommunity(communityId, {
        member_count: membersSnapshot.size,
        active_member_count: activeMembersSnapshot.size,
        message_count: messagesSnapshot.size,
        last_activity_at: new Date().toISOString() as any
      });
    } catch (error) {
      console.error('Error updating community stats:', error);
      throw new Error('Failed to update community stats');
    }
  }
}

export const communityService = new CommunityService();
