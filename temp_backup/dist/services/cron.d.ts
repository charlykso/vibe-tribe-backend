export declare const initializeCronJobs: () => void;
export declare const stopCronJobs: () => void;
export declare const getCronJobStatus: () => {
    analyticsSync: {
        pattern: string;
        description: string;
    };
    cleanupJobs: {
        pattern: string;
        description: string;
    };
    stalledPostsCheck: {
        pattern: string;
        description: string;
    };
    healthCheck: {
        pattern: string;
        description: string;
    };
};
export declare const triggerAnalyticsSync: () => Promise<void>;
export declare const triggerStalledPostsCheck: () => Promise<void>;
export declare const triggerHealthCheck: () => Promise<void>;
//# sourceMappingURL=cron.d.ts.map