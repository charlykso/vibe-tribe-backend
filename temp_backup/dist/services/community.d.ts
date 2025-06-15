import { Community, CreateCommunity, CommunityMember, CommunityMessage } from '../types/database.js';
export declare class CommunityService {
    createCommunity(communityData: CreateCommunity): Promise<Community>;
    getCommunities(organizationId: string): Promise<Community[]>;
    getCommunityById(communityId: string): Promise<Community | null>;
    updateCommunity(communityId: string, updates: Partial<Community>): Promise<Community>;
    deleteCommunity(communityId: string): Promise<void>;
    addCommunityMember(memberData: Partial<CommunityMember> & {
        community_id: string;
        platform_user_id: string;
    }): Promise<CommunityMember>;
    getCommunityMembers(communityId: string, limit?: number, offset?: number): Promise<CommunityMember[]>;
    updateMemberEngagement(memberId: string, engagementData: {
        engagement_score?: number;
        sentiment_score?: number;
        message_count?: number;
        last_active_at?: Date;
        last_message_at?: Date;
    }): Promise<void>;
    ingestMessage(messageData: Partial<CommunityMessage> & {
        community_id: string;
        platform_message_id: string;
        content: string;
    }): Promise<CommunityMessage>;
    getCommunityMessages(communityId: string, limit?: number, offset?: number, threadId?: string): Promise<CommunityMessage[]>;
    calculateHealthScore(communityId: string): Promise<number>;
    updateCommunityStats(communityId: string): Promise<void>;
}
export declare const communityService: CommunityService;
//# sourceMappingURL=community.d.ts.map