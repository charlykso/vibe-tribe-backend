import { SocialAccount } from '../types/database.js';
interface OAuthResult {
    success: boolean;
    account?: Partial<SocialAccount>;
    error?: string;
}
export declare class TwitterOAuthService {
    private config;
    private client;
    constructor();
    generateAuthUrl(state: string): Promise<{
        url: string;
        codeVerifier: string;
    }>;
    handleCallback(code: string, codeVerifier: string): Promise<OAuthResult>;
    refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken?: string;
    } | null>;
}
export declare class LinkedInOAuthService {
    private config;
    constructor();
    generateAuthUrl(state: string): string;
    handleCallback(code: string): Promise<OAuthResult>;
    exchangeCodeForToken(code: string): Promise<any>;
    getUserProfile(accessToken: string): Promise<any>;
}
export declare class FacebookOAuthService {
    private config;
    constructor();
    generateAuthUrl(state: string): string;
    handleCallback(code: string): Promise<OAuthResult>;
}
export declare class InstagramOAuthService {
    private config;
    constructor();
    generateAuthUrl(state: string): string;
    handleCallback(code: string): Promise<OAuthResult>;
}
export declare class OAuthServiceFactory {
    static getService(platform: string): TwitterOAuthService | LinkedInOAuthService | FacebookOAuthService | InstagramOAuthService;
    static getLinkedInService(): LinkedInOAuthService;
    static getTwitterService(): TwitterOAuthService;
    static getFacebookService(): FacebookOAuthService;
    static getInstagramService(): InstagramOAuthService;
}
export {};
//# sourceMappingURL=oauth.d.ts.map