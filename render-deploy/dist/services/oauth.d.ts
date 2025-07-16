import { SocialAccount } from '../types/database.js';
interface OAuthResult {
    success: boolean;
    account?: Partial<SocialAccount>;
    error?: string;
}
export declare class TwitterOAuthService {
    private config;
    private client;
    private db;
    constructor();
    private isBase64;
    private validateState;
    private encryptTokens;
    private decryptTokens;
    private storeOAuthState;
    private getOAuthState;
    private deleteOAuthState;
    private storeTokens;
    private getStoredTokens;
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
    refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken?: string;
    } | null>;
}
export declare class FacebookOAuthService {
    private config;
    constructor();
    generateAuthUrl(state: string): string;
    handleCallback(code: string): Promise<OAuthResult>;
    refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken?: string;
    } | null>;
}
export declare class InstagramOAuthService {
    private config;
    constructor();
    generateAuthUrl(state: string): string;
    handleCallback(code: string): Promise<OAuthResult>;
    refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken?: string;
    } | null>;
}
export declare class OAuthServiceFactory {
    static getService(platform: string): TwitterOAuthService | LinkedInOAuthService | FacebookOAuthService | InstagramOAuthService;
    static getLinkedInService(): LinkedInOAuthService;
    static getTwitterService(): TwitterOAuthService;
    static getFacebookService(): FacebookOAuthService;
    static getInstagramService(): InstagramOAuthService;
}
export declare class TokenRefreshScheduler {
    private static instance;
    private refreshIntervals;
    private db;
    private constructor();
    static getInstance(): TokenRefreshScheduler;
    scheduleTokenRefresh(accountId: string, platform: string, expiresAt: number): Promise<void>;
    private clearRefreshInterval;
    private refreshToken;
    stopAllRefreshes(): void;
}
export {};
//# sourceMappingURL=oauth.d.ts.map