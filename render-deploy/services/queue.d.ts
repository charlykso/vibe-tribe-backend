import Bull from 'bull';
import Redis from 'ioredis';
export declare const redis: Redis;
export declare const postQueue: Bull.Queue<any>;
export declare const analyticsQueue: Bull.Queue<any>;
export declare const schedulePost: (postId: string, organizationId: string, scheduledTime: Date) => Promise<void>;
export declare const cancelScheduledPost: (postId: string) => Promise<void>;
export declare const scheduleAnalyticsSync: (accountId: string, organizationId: string) => Promise<void>;
export declare const getQueueStats: () => Promise<{
    posts: {
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
    };
    analytics: {
        waiting: number;
        active: number;
        completed: number;
        failed: number;
    };
}>;
export declare const initializeQueues: () => void;
export declare const shutdownQueues: () => Promise<void>;
//# sourceMappingURL=queue.d.ts.map