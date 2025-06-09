import { getFirestoreClient } from './database.js';
import { aiService } from './ai.js';
export class ModerationService {
    // ============================================================================
    // MODERATION QUEUE MANAGEMENT
    // ============================================================================
    async addToModerationQueue(queueData) {
        try {
            const db = getFirestoreClient();
            const docRef = await db.collection('moderation_queue').add({
                ...queueData,
                status: 'pending',
                priority: queueData.priority || 1,
                metadata: queueData.metadata || {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            const doc = await docRef.get();
            return { id: doc.id, ...doc.data() };
        }
        catch (error) {
            console.error('Error adding to moderation queue:', error);
            throw new Error('Failed to add to moderation queue');
        }
    }
    async getModerationQueue(organizationId, status, limit = 50, offset = 0) {
        try {
            const db = getFirestoreClient();
            let query = db
                .collection('moderation_queue')
                .where('organization_id', '==', organizationId);
            if (status) {
                query = query.where('status', '==', status);
            }
            const snapshot = await query
                .orderBy('priority', 'desc')
                .orderBy('created_at', 'desc')
                .limit(limit)
                .offset(offset)
                .get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            console.error('Error fetching moderation queue:', error);
            throw new Error('Failed to fetch moderation queue');
        }
    }
    async moderateContent(queueItemId, action, moderatorId, notes) {
        try {
            const queueItem = await this.getModerationQueueItem(queueItemId);
            if (!queueItem) {
                throw new Error('Moderation queue item not found');
            }
            // Update queue item status
            const db = getFirestoreClient();
            const status = action === 'escalate' ? 'escalated' : action === 'approve' ? 'approved' : 'rejected';
            await db.collection('moderation_queue').doc(queueItemId).update({
                status,
                moderated_by: moderatorId,
                moderated_at: new Date().toISOString(),
                moderator_notes: notes,
                updated_at: new Date().toISOString()
            });
            // Log moderation action
            const moderationAction = {
                organization_id: queueItem.organization_id,
                community_id: queueItem.community_id,
                queue_item_id: queueItemId,
                action_type: action,
                target_type: queueItem.content_type,
                target_id: queueItem.content_id,
                performed_by: moderatorId,
                reason: notes,
                metadata: {},
                created_at: new Date().toISOString()
            };
            const actionRef = await db.collection('moderation_actions').add(moderationAction);
            const actionDoc = await actionRef.get();
            // Execute action if approved/rejected
            if (action !== 'escalate') {
                await this.executeContentAction(queueItem, action);
            }
            return { id: actionDoc.id, ...actionDoc.data() };
        }
        catch (error) {
            console.error('Error moderating content:', error);
            throw new Error('Failed to moderate content');
        }
    }
    async getModerationQueueItem(queueItemId) {
        const db = getFirestoreClient();
        const doc = await db.collection('moderation_queue').doc(queueItemId).get();
        if (!doc.exists)
            return null;
        return { id: doc.id, ...doc.data() };
    }
    // ============================================================================
    // MODERATION RULES MANAGEMENT
    // ============================================================================
    async createModerationRule(ruleData) {
        try {
            const db = getFirestoreClient();
            const docRef = await db.collection('moderation_rules').add({
                ...ruleData,
                severity: ruleData.severity || 1,
                is_active: ruleData.is_active !== undefined ? ruleData.is_active : true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            const doc = await docRef.get();
            return { id: doc.id, ...doc.data() };
        }
        catch (error) {
            console.error('Error creating moderation rule:', error);
            throw new Error('Failed to create moderation rule');
        }
    }
    async getModerationRules(organizationId, communityId) {
        try {
            const db = getFirestoreClient();
            let query = db
                .collection('moderation_rules')
                .where('organization_id', '==', organizationId)
                .where('is_active', '==', true);
            if (communityId) {
                query = query.where('community_id', '==', communityId);
            }
            const snapshot = await query.orderBy('severity', 'desc').get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            console.error('Error fetching moderation rules:', error);
            throw new Error('Failed to fetch moderation rules');
        }
    }
    // ============================================================================
    // AUTOMATED CONTENT FILTERING
    // ============================================================================
    async processMessage(message) {
        try {
            // Get applicable moderation rules
            const rules = await this.getModerationRules(message.community_id // Note: This should be organization_id, but we need to get it from community
            );
            // Check each rule
            for (const rule of rules) {
                const violation = await this.checkRule(message, rule);
                if (violation) {
                    await this.handleRuleViolation(message, rule, violation);
                }
            }
            // Run AI analysis
            await this.runAIAnalysis(message);
        }
        catch (error) {
            console.error('Error processing message:', error);
        }
    }
    async checkRule(message, rule) {
        try {
            switch (rule.rule_type) {
                case 'keyword':
                    return this.checkKeywordRule(message.content, rule.conditions);
                case 'regex':
                    return this.checkRegexRule(message.content, rule.conditions);
                case 'ai_sentiment':
                    return await this.checkSentimentRule(message, rule.conditions);
                case 'ai_toxicity':
                    return await this.checkToxicityRule(message, rule.conditions);
                case 'spam_detection':
                    return await this.checkSpamRule(message, rule.conditions);
                default:
                    return null;
            }
        }
        catch (error) {
            console.error('Error checking rule:', error);
            return null;
        }
    }
    checkKeywordRule(content, conditions) {
        const keywords = conditions.keywords || [];
        const caseSensitive = conditions.case_sensitive || false;
        const searchContent = caseSensitive ? content : content.toLowerCase();
        for (const keyword of keywords) {
            const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();
            if (searchContent.includes(searchKeyword)) {
                return { matched_keyword: keyword, confidence: 1.0 };
            }
        }
        return null;
    }
    checkRegexRule(content, conditions) {
        const patterns = conditions.patterns || [];
        for (const pattern of patterns) {
            try {
                const regex = new RegExp(pattern, conditions.flags || 'i');
                const match = content.match(regex);
                if (match) {
                    return { matched_pattern: pattern, match: match[0], confidence: 1.0 };
                }
            }
            catch (error) {
                console.error('Invalid regex pattern:', pattern);
            }
        }
        return null;
    }
    async checkSentimentRule(message, conditions) {
        if (message.sentiment_score === undefined)
            return null;
        const threshold = conditions.threshold || -0.5;
        if (message.sentiment_score < threshold) {
            return { sentiment_score: message.sentiment_score, threshold, confidence: 0.8 };
        }
        return null;
    }
    async checkToxicityRule(message, conditions) {
        if (message.toxicity_score === undefined)
            return null;
        const threshold = conditions.threshold || 0.7;
        if (message.toxicity_score > threshold) {
            return { toxicity_score: message.toxicity_score, threshold, confidence: 0.9 };
        }
        return null;
    }
    async checkSpamRule(message, conditions) {
        if (message.spam_score === undefined)
            return null;
        const threshold = conditions.threshold || 0.6;
        if (message.spam_score > threshold) {
            return { spam_score: message.spam_score, threshold, confidence: 0.85 };
        }
        return null;
    }
    async handleRuleViolation(message, rule, violation) {
        try {
            // Add to moderation queue
            await this.addToModerationQueue({
                organization_id: '', // Should get from community
                community_id: message.community_id,
                content_type: 'message',
                content_id: message.id,
                content_text: message.content,
                author_id: message.member_id || '',
                reason: `Rule violation: ${rule.name}`,
                ai_confidence: violation.confidence,
                priority: rule.severity,
                auto_action: rule.actions.auto_action,
                metadata: {
                    rule_id: rule.id,
                    violation_details: violation
                }
            });
            // Execute automatic actions if configured
            if (rule.actions.auto_action && rule.actions.auto_action !== 'none') {
                await this.executeAutoAction(message, rule.actions.auto_action);
            }
        }
        catch (error) {
            console.error('Error handling rule violation:', error);
        }
    }
    async runAIAnalysis(message) {
        try {
            // Run sentiment analysis
            const sentimentAnalysis = await aiService.analyzeSentiment(message.content, '', // Should get organization_id from community
            message.id);
            // Run toxicity analysis
            const toxicityAnalysis = await aiService.analyzeToxicity(message.content, '', // Should get organization_id from community
            message.id);
            // Run spam detection
            const spamAnalysis = await aiService.detectSpam(message.content, '', // Should get organization_id from community
            message.id);
            // Update message with AI scores
            const db = getFirestoreClient();
            await db.collection('community_messages').doc(message.id).update({
                sentiment_score: sentimentAnalysis.result.score,
                toxicity_score: toxicityAnalysis.result.score,
                spam_score: spamAnalysis.result.spam_probability,
                updated_at: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Error running AI analysis:', error);
        }
    }
    async executeContentAction(queueItem, action) {
        try {
            if (action === 'reject' && queueItem.content_type === 'message') {
                // Hide or delete the message
                const db = getFirestoreClient();
                await db.collection('community_messages').doc(queueItem.content_id).update({
                    is_deleted: true,
                    updated_at: new Date().toISOString()
                });
            }
        }
        catch (error) {
            console.error('Error executing content action:', error);
        }
    }
    async executeAutoAction(message, action) {
        try {
            const db = getFirestoreClient();
            switch (action) {
                case 'delete':
                    await db.collection('community_messages').doc(message.id).update({
                        is_deleted: true,
                        updated_at: new Date().toISOString()
                    });
                    break;
                case 'hide':
                    // Implement hiding logic
                    break;
                case 'warn':
                    // Implement warning logic
                    break;
            }
        }
        catch (error) {
            console.error('Error executing auto action:', error);
        }
    }
    // ============================================================================
    // MODERATION ANALYTICS
    // ============================================================================
    async getModerationStats(organizationId, days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const startDateString = startDate.toISOString();
            const db = getFirestoreClient();
            const queueSnapshot = await db
                .collection('moderation_queue')
                .where('organization_id', '==', organizationId)
                .where('created_at', '>=', startDateString)
                .get();
            const actionsSnapshot = await db
                .collection('moderation_actions')
                .where('organization_id', '==', organizationId)
                .where('created_at', '>=', startDateString)
                .get();
            const queueItems = queueSnapshot.docs.map(doc => doc.data());
            const actions = actionsSnapshot.docs.map(doc => doc.data());
            return {
                total_flagged: queueItems.length,
                pending: queueItems.filter(item => item.status === 'pending').length,
                approved: queueItems.filter(item => item.status === 'approved').length,
                rejected: queueItems.filter(item => item.status === 'rejected').length,
                escalated: queueItems.filter(item => item.status === 'escalated').length,
                auto_actions: actions.filter(action => action.performed_by === 'system').length,
                manual_actions: actions.filter(action => action.performed_by !== 'system').length,
                top_reasons: this.getTopReasons(queueItems),
                daily_stats: this.getDailyStats(queueItems, days)
            };
        }
        catch (error) {
            console.error('Error getting moderation stats:', error);
            throw new Error('Failed to get moderation stats');
        }
    }
    getTopReasons(queueItems) {
        const reasonCounts = {};
        queueItems.forEach(item => {
            reasonCounts[item.reason] = (reasonCounts[item.reason] || 0) + 1;
        });
        return Object.entries(reasonCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([reason, count]) => ({ reason, count }));
    }
    getDailyStats(queueItems, days) {
        const dailyStats = {};
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dailyStats[dateStr] = 0;
        }
        queueItems.forEach(item => {
            const dateStr = new Date(item.created_at).toISOString().split('T')[0];
            if (dailyStats[dateStr] !== undefined) {
                dailyStats[dateStr]++;
            }
        });
        return Object.entries(dailyStats)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, count]) => ({ date, count }));
    }
}
export const moderationService = new ModerationService();
//# sourceMappingURL=moderation.js.map