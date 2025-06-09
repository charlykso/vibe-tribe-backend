export interface User {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
    role: 'admin' | 'moderator' | 'member';
    organization_id?: string;
    email_verified: boolean;
    verification_token?: string;
    verification_token_expires?: FirebaseFirestore.Timestamp;
    created_at: FirebaseFirestore.Timestamp | string;
    updated_at: FirebaseFirestore.Timestamp | string;
    last_login?: FirebaseFirestore.Timestamp | string;
    is_active: boolean;
}
export interface CreateUser {
    email: string;
    name: string;
    avatar_url?: string;
    role?: 'admin' | 'moderator' | 'member';
    organization_id?: string;
    email_verified?: boolean;
    is_active?: boolean;
}
export interface UpdateUser {
    email?: string;
    name?: string;
    avatar_url?: string;
    role?: 'admin' | 'moderator' | 'member';
    organization_id?: string;
    email_verified?: boolean;
    last_login?: FirebaseFirestore.Timestamp;
    is_active?: boolean;
}
export interface Organization {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
    plan: 'free' | 'pro' | 'enterprise';
    settings: Record<string, any>;
    created_at: FirebaseFirestore.Timestamp | string;
    updated_at: FirebaseFirestore.Timestamp | string;
    is_active: boolean;
}
export interface CreateOrganization {
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
    plan?: 'free' | 'pro' | 'enterprise';
    settings?: Record<string, any>;
    is_active?: boolean;
}
export interface UpdateOrganization {
    name?: string;
    slug?: string;
    description?: string;
    logo_url?: string;
    plan?: 'free' | 'pro' | 'enterprise';
    settings?: Record<string, any>;
    is_active?: boolean;
}
export interface SocialAccount {
    id: string;
    user_id: string;
    organization_id: string;
    platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
    platform_user_id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    access_token: string;
    refresh_token?: string;
    token_expires_at?: FirebaseFirestore.Timestamp | string;
    permissions: string[];
    is_active: boolean;
    last_sync_at?: FirebaseFirestore.Timestamp | string;
    metadata?: Record<string, any>;
    created_at: FirebaseFirestore.Timestamp | string;
    updated_at: FirebaseFirestore.Timestamp | string;
}
export interface CreateSocialAccount {
    user_id: string;
    organization_id: string;
    platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
    platform_user_id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    access_token: string;
    refresh_token?: string;
    token_expires_at?: FirebaseFirestore.Timestamp | string;
    permissions?: string[];
    is_active?: boolean;
    last_sync_at?: FirebaseFirestore.Timestamp | string;
}
export interface UpdateSocialAccount {
    username?: string;
    display_name?: string;
    avatar_url?: string;
    access_token?: string;
    refresh_token?: string;
    token_expires_at?: FirebaseFirestore.Timestamp | string;
    permissions?: string[];
    is_active?: boolean;
    last_sync_at?: FirebaseFirestore.Timestamp | string;
    metadata?: Record<string, any>;
}
export interface Post {
    id: string;
    user_id: string;
    organization_id: string;
    title?: string;
    content: string;
    platforms: string[];
    status: 'draft' | 'scheduled' | 'published' | 'failed';
    scheduled_at?: FirebaseFirestore.Timestamp | string;
    published_at?: FirebaseFirestore.Timestamp | string;
    media_urls: string[];
    platform_post_ids: Record<string, string>;
    analytics: Record<string, any>;
    created_at: FirebaseFirestore.Timestamp | string;
    updated_at: FirebaseFirestore.Timestamp | string;
}
export interface CreatePost {
    user_id: string;
    organization_id: string;
    title?: string;
    content: string;
    platforms?: string[];
    status?: 'draft' | 'scheduled' | 'published' | 'failed';
    scheduled_at?: FirebaseFirestore.Timestamp | string;
    published_at?: FirebaseFirestore.Timestamp | string;
    media_urls?: string[];
    platform_post_ids?: Record<string, string>;
    analytics?: Record<string, any>;
}
export interface UpdatePost {
    title?: string;
    content?: string;
    platforms?: string[];
    status?: 'draft' | 'scheduled' | 'published' | 'failed';
    scheduled_at?: FirebaseFirestore.Timestamp | string;
    published_at?: FirebaseFirestore.Timestamp | string;
    media_urls?: string[];
    platform_post_ids?: Record<string, string>;
    analytics?: Record<string, any>;
}
export interface Analytics {
    id: string;
    organization_id: string;
    social_account_id: string;
    post_id?: string;
    metric_type: string;
    metric_value: number;
    metadata: Record<string, any>;
    recorded_at: FirebaseFirestore.Timestamp | string;
    created_at: FirebaseFirestore.Timestamp | string;
}
export interface Community {
    id: string;
    organization_id: string;
    name: string;
    description?: string;
    platform: string;
    platform_community_id: string;
    settings: Record<string, any>;
    health_score: number;
    member_count: number;
    active_member_count: number;
    message_count: number;
    engagement_rate: number;
    sentiment_score: number;
    last_activity_at?: FirebaseFirestore.Timestamp | string;
    created_at: FirebaseFirestore.Timestamp | string;
    updated_at: FirebaseFirestore.Timestamp | string;
    is_active: boolean;
}
export interface CreateCommunity {
    organization_id: string;
    name: string;
    description?: string;
    platform: string;
    platform_community_id: string;
    settings?: Record<string, any>;
}
export interface CommunityMember {
    id: string;
    community_id: string;
    platform_user_id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
    roles: string[];
    tags: string[];
    engagement_score: number;
    sentiment_score: number;
    message_count: number;
    join_date?: FirebaseFirestore.Timestamp | string;
    last_active_at?: FirebaseFirestore.Timestamp | string;
    last_message_at?: FirebaseFirestore.Timestamp | string;
    metadata: Record<string, any>;
    created_at: FirebaseFirestore.Timestamp | string;
    updated_at: FirebaseFirestore.Timestamp | string;
    is_active: boolean;
}
export interface CommunityMessage {
    id: string;
    community_id: string;
    member_id?: string;
    platform_message_id: string;
    thread_id?: string;
    parent_message_id?: string;
    content: string;
    message_type: string;
    attachments: any[];
    reactions: Record<string, number>;
    mentions: string[];
    hashtags: string[];
    sentiment_score?: number;
    toxicity_score?: number;
    spam_score?: number;
    engagement_score: number;
    platform_created_at?: FirebaseFirestore.Timestamp | string;
    created_at: FirebaseFirestore.Timestamp | string;
    updated_at: FirebaseFirestore.Timestamp | string;
    is_deleted: boolean;
}
export interface ConversationThread {
    id: string;
    community_id: string;
    thread_id: string;
    title?: string;
    starter_message_id?: string;
    message_count: number;
    participant_count: number;
    last_activity_at?: FirebaseFirestore.Timestamp | string;
    sentiment_score: number;
    engagement_score: number;
    tags: string[];
    created_at: FirebaseFirestore.Timestamp | string;
    updated_at: FirebaseFirestore.Timestamp | string;
    is_active: boolean;
}
export interface ModerationQueue {
    id: string;
    organization_id: string;
    community_id?: string;
    content_type: string;
    content_id: string;
    content_text?: string;
    author_id?: string;
    author_name?: string;
    reason: string;
    ai_confidence?: number;
    priority: number;
    status: string;
    moderated_by?: string;
    moderated_at?: FirebaseFirestore.Timestamp | string;
    moderator_notes?: string;
    auto_action?: string;
    metadata: Record<string, any>;
    created_at: FirebaseFirestore.Timestamp | string;
    updated_at: FirebaseFirestore.Timestamp | string;
}
export interface ModerationRule {
    id: string;
    organization_id: string;
    community_id?: string;
    name: string;
    description?: string;
    rule_type: string;
    conditions: Record<string, any>;
    actions: Record<string, any>;
    severity: number;
    is_active: boolean;
    created_by?: string;
    created_at: FirebaseFirestore.Timestamp | string;
    updated_at: FirebaseFirestore.Timestamp | string;
}
export interface ModerationAction {
    id: string;
    organization_id: string;
    community_id?: string;
    queue_item_id?: string;
    rule_id?: string;
    action_type: string;
    target_type: string;
    target_id: string;
    performed_by?: string;
    reason?: string;
    metadata: Record<string, any>;
    created_at: FirebaseFirestore.Timestamp | string;
}
export interface AIAnalysis {
    id: string;
    organization_id: string;
    content_type: string;
    content_id: string;
    analysis_type: string;
    result: Record<string, any>;
    confidence?: number;
    model_version?: string;
    processing_time_ms?: number;
    created_at: FirebaseFirestore.Timestamp | string;
}
export interface AutomationRule {
    id: string;
    organization_id: string;
    community_id?: string;
    name: string;
    description?: string;
    trigger_type: string;
    trigger_conditions: Record<string, any>;
    actions: Record<string, any>;
    is_active: boolean;
    execution_count: number;
    last_executed_at?: FirebaseFirestore.Timestamp | string;
    created_by?: string;
    created_at: FirebaseFirestore.Timestamp | string;
    updated_at: FirebaseFirestore.Timestamp | string;
}
export interface AutomationExecution {
    id: string;
    rule_id: string;
    trigger_data: Record<string, any>;
    actions_executed: Record<string, any>;
    success: boolean;
    error_message?: string;
    execution_time_ms?: number;
    created_at: FirebaseFirestore.Timestamp | string;
}
export interface CreateAnalytics {
    organization_id: string;
    social_account_id: string;
    post_id?: string;
    metric_type: string;
    metric_value: number;
    metadata?: Record<string, any>;
    recorded_at?: FirebaseFirestore.Timestamp | string;
}
export interface UpdateAnalytics {
    metric_type?: string;
    metric_value?: number;
    metadata?: Record<string, any>;
    recorded_at?: FirebaseFirestore.Timestamp | string;
}
export interface Invitation {
    id: string;
    email: string;
    role: 'admin' | 'moderator' | 'member';
    organization_id: string;
    invited_by: string;
    invitation_token: string;
    expires_at: FirebaseFirestore.Timestamp | string;
    status: 'pending' | 'accepted' | 'cancelled' | 'expired';
    message?: string;
    created_at: FirebaseFirestore.Timestamp | string;
    updated_at: FirebaseFirestore.Timestamp | string;
    accepted_at?: FirebaseFirestore.Timestamp | string;
    cancelled_at?: FirebaseFirestore.Timestamp | string;
    last_sent_at?: FirebaseFirestore.Timestamp | string;
}
export interface CreateInvitation {
    email: string;
    role: 'admin' | 'moderator' | 'member';
    organization_id: string;
    invited_by: string;
    invitation_token: string;
    expires_at: FirebaseFirestore.Timestamp | string;
    status?: 'pending' | 'accepted' | 'cancelled' | 'expired';
    message?: string;
}
export interface UpdateInvitation {
    status?: 'pending' | 'accepted' | 'cancelled' | 'expired';
    accepted_at?: FirebaseFirestore.Timestamp | string;
    cancelled_at?: FirebaseFirestore.Timestamp | string;
    last_sent_at?: FirebaseFirestore.Timestamp | string;
}
//# sourceMappingURL=database.d.ts.map