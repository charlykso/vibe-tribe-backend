import { AIAnalysis, AutomationRule, AutomationExecution } from '../types/database.js';
export declare class AIService {
    private apiKey;
    private baseUrl;
    constructor();
    analyzeSentiment(content: string, organizationId: string, contentId: string): Promise<AIAnalysis>;
    analyzeToxicity(content: string, organizationId: string, contentId: string): Promise<AIAnalysis>;
    detectSpam(content: string, organizationId: string, contentId: string): Promise<AIAnalysis>;
    generateContent(prompt: string, organizationId: string): Promise<string>;
    createAutomationRule(ruleData: Partial<AutomationRule> & {
        organization_id: string;
        name: string;
        trigger_type: string;
        trigger_conditions: Record<string, any>;
        actions: Record<string, any>;
    }): Promise<AutomationRule>;
    executeAutomationRule(ruleId: string, triggerData: Record<string, any>): Promise<AutomationExecution>;
    private getAutomationRule;
    private executeActions;
    private mockSentimentAnalysis;
    private mockToxicityAnalysis;
    private mockSpamDetection;
    private mockContentGeneration;
    private extractKeywords;
    private detectToxicityCategories;
    private getSpamIndicators;
    private sendNotification;
    private flagContent;
    private autoModerate;
}
export declare const aiService: AIService;
//# sourceMappingURL=ai.d.ts.map