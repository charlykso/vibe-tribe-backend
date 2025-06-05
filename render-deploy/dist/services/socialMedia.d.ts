import { Post, SocialAccount } from '../types/database.js';
interface PublishResult {
    success: boolean;
    platformPostIds?: Record<string, string>;
    error?: string;
}
export declare const publishToSocialPlatforms: (post: Post) => Promise<PublishResult>;
export declare const getConnectedAccounts: (organizationId: string) => Promise<SocialAccount[]>;
export declare const validatePostForPlatforms: (post: Post) => {
    valid: boolean;
    errors: string[];
};
export {};
//# sourceMappingURL=socialMedia.d.ts.map