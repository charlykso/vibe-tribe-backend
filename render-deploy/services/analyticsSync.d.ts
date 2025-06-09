import { SocialAccount } from '../types/database.js';
export declare class AnalyticsSyncService {
    private firestore;
    /**
     * Sync analytics for all accounts in an organization
     */
    syncOrganizationAnalytics(organizationId: string): Promise<void>;
    /**
     * Sync analytics for a specific social account
     */
    syncAccountAnalytics(account: SocialAccount): Promise<void>;
    /**
     * Sync Twitter analytics
     */
    private syncTwitterAnalytics;
    /**
     * Sync LinkedIn analytics
     */
    private syncLinkedInAnalytics;
    /**
     * Sync Facebook analytics
     */
    private syncFacebookAnalytics;
    /**
     * Sync Instagram analytics
     */
    private syncInstagramAnalytics;
    /**
     * Store analytics data in Firestore
     */
    private storeAnalytics;
    /**
     * Store post-specific analytics
     */
    private storePostAnalytics;
}
//# sourceMappingURL=analyticsSync.d.ts.map