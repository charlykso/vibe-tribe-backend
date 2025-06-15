import { ModerationQueue, ModerationRule, ModerationAction, CommunityMessage } from '../types/database.js';
export declare class ModerationService {
    addToModerationQueue(queueData: Partial<ModerationQueue> & {
        organization_id: string;
        content_type: string;
        content_id: string;
        reason: string;
    }): Promise<ModerationQueue>;
    getModerationQueue(organizationId: string, status?: string, limit?: number, offset?: number): Promise<ModerationQueue[]>;
    moderateContent(queueItemId: string, action: 'approve' | 'reject' | 'escalate', moderatorId: string, notes?: string): Promise<ModerationAction>;
    private getModerationQueueItem;
    createModerationRule(ruleData: Partial<ModerationRule> & {
        organization_id: string;
        name: string;
        rule_type: string;
        conditions: Record<string, any>;
        actions: Record<string, any>;
    }): Promise<ModerationRule>;
    getModerationRules(organizationId: string, communityId?: string): Promise<ModerationRule[]>;
    processMessage(message: CommunityMessage): Promise<void>;
    private checkRule;
    private checkKeywordRule;
    private checkRegexRule;
    private checkSentimentRule;
    private checkToxicityRule;
    private checkSpamRule;
    private handleRuleViolation;
    private runAIAnalysis;
    private executeContentAction;
    private executeAutoAction;
    getModerationStats(organizationId: string, days?: number): Promise<any>;
    private getTopReasons;
    private getDailyStats;
}
export declare const moderationService: ModerationService;
//# sourceMappingURL=moderation.d.ts.map