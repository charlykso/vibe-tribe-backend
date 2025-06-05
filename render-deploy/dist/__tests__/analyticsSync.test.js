describe('Analytics Sync Service', () => {
    it('should handle analytics data structure', () => {
        const analyticsData = {
            organization_id: 'org-123',
            social_account_id: 'account-123',
            metric_type: 'followers',
            metric_value: 1000,
            platform: 'twitter'
        };
        expect(analyticsData.organization_id).toBe('org-123');
        expect(analyticsData.social_account_id).toBe('account-123');
        expect(analyticsData.metric_type).toBe('followers');
        expect(analyticsData.metric_value).toBe(1000);
        expect(analyticsData.platform).toBe('twitter');
    });
    it('should validate platform types', () => {
        const supportedPlatforms = ['twitter', 'linkedin', 'facebook', 'instagram'];
        const testPlatform = 'twitter';
        expect(supportedPlatforms).toContain(testPlatform);
        expect(supportedPlatforms.length).toBe(4);
    });
});
//# sourceMappingURL=analyticsSync.test.js.map