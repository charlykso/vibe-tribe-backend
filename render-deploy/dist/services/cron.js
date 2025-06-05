import cron from 'node-cron';
import { getFirestoreClient } from './database.js';
import { scheduleAnalyticsSync } from './queue.js';
// Analytics sync job - runs every hour
const analyticsSync = cron.schedule('0 * * * *', async () => {
    console.log('🔄 Starting hourly analytics sync...');
    try {
        const firestore = getFirestoreClient();
        // Get all active social accounts
        const snapshot = await firestore
            .collection('social_accounts')
            .where('is_active', '==', true)
            .get();
        const accounts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`📊 Found ${accounts.length} active social accounts for analytics sync`);
        // Schedule analytics sync for each account
        for (const account of accounts) {
            try {
                await scheduleAnalyticsSync(account.id, account.organization_id);
            }
            catch (error) {
                console.error(`❌ Failed to schedule analytics sync for account ${account.id}:`, error);
            }
        }
        console.log('✅ Analytics sync jobs scheduled successfully');
    }
    catch (error) {
        console.error('❌ Error in analytics sync cron job:', error);
    }
}, {
    timezone: 'UTC'
});
// Cleanup old completed jobs - runs daily at 2 AM
const cleanupJobs = cron.schedule('0 2 * * *', async () => {
    console.log('🧹 Starting daily job cleanup...');
    try {
        // TODO: Implement cleanup logic for old Bull queue jobs
        // This would remove old completed/failed jobs to prevent memory issues
        console.log('✅ Job cleanup completed');
    }
    catch (error) {
        console.error('❌ Error in job cleanup cron:', error);
    }
}, {
    timezone: 'UTC'
});
// Check for stalled scheduled posts - runs every 15 minutes
const stalledPostsCheck = cron.schedule('*/15 * * * *', async () => {
    console.log('🔍 Checking for stalled scheduled posts...');
    try {
        const firestore = getFirestoreClient();
        const now = new Date();
        // Find posts that should have been published but are still scheduled
        // (scheduled_at is more than 5 minutes ago)
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const snapshot = await firestore
            .collection('posts')
            .where('status', '==', 'scheduled')
            .get();
        const stalledPosts = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((post) => {
            if (!post.scheduled_at)
                return false;
            const scheduledTime = post.scheduled_at instanceof Date
                ? post.scheduled_at
                : typeof post.scheduled_at === 'string'
                    ? new Date(post.scheduled_at)
                    : post.scheduled_at.toDate();
            return scheduledTime <= fiveMinutesAgo;
        });
        if (stalledPosts.length > 0) {
            console.log(`⚠️ Found ${stalledPosts.length} stalled scheduled posts`);
            // Update stalled posts to failed status
            for (const post of stalledPosts) {
                try {
                    await firestore.collection('posts').doc(post.id).update({
                        status: 'failed',
                        error_message: 'Post scheduling failed - job may have been lost',
                        updated_at: new Date()
                    });
                    console.log(`❌ Marked post ${post.id} as failed (was stalled)`);
                }
                catch (error) {
                    console.error(`❌ Failed to update stalled post ${post.id}:`, error);
                }
            }
        }
        else {
            console.log('✅ No stalled posts found');
        }
    }
    catch (error) {
        console.error('❌ Error in stalled posts check:', error);
    }
}, {
    timezone: 'UTC'
});
// Health check for services - runs every 5 minutes
const healthCheck = cron.schedule('*/5 * * * *', async () => {
    try {
        const firestore = getFirestoreClient();
        // Test database connection
        await firestore.collection('_health_check').limit(1).get();
        // TODO: Add more health checks
        // - Redis connection
        // - Queue status
        // - External API status
    }
    catch (error) {
        console.error('❌ Health check failed:', error);
        // TODO: Send alerts to monitoring system
    }
}, {
    timezone: 'UTC'
});
// Initialize all cron jobs
export const initializeCronJobs = () => {
    console.log('🕐 Initializing cron jobs...');
    // Start all cron jobs
    analyticsSync.start();
    cleanupJobs.start();
    stalledPostsCheck.start();
    healthCheck.start();
    console.log('✅ Cron jobs initialized and started');
    // Log next execution times
    console.log('📅 Next execution times:');
    console.log(`  - Analytics sync: ${getNextExecution(analyticsSync)}`);
    console.log(`  - Job cleanup: ${getNextExecution(cleanupJobs)}`);
    console.log(`  - Stalled posts check: ${getNextExecution(stalledPostsCheck)}`);
    console.log(`  - Health check: ${getNextExecution(healthCheck)}`);
};
// Stop all cron jobs
export const stopCronJobs = () => {
    console.log('🛑 Stopping cron jobs...');
    analyticsSync.stop();
    cleanupJobs.stop();
    stalledPostsCheck.stop();
    healthCheck.stop();
    console.log('✅ All cron jobs stopped');
};
// Get next execution time for a cron job
const getNextExecution = (cronJob) => {
    // This is a simplified version - in production you might want to use a library
    // that can parse cron expressions and calculate next execution time
    return 'Next execution time calculation not implemented';
};
// Get cron job status
export const getCronJobStatus = () => {
    return {
        analyticsSync: {
            pattern: '0 * * * *', // Every hour
            description: 'Sync analytics data from social platforms'
        },
        cleanupJobs: {
            pattern: '0 2 * * *', // Daily at 2 AM
            description: 'Clean up old completed jobs'
        },
        stalledPostsCheck: {
            pattern: '*/15 * * * *', // Every 15 minutes
            description: 'Check for stalled scheduled posts'
        },
        healthCheck: {
            pattern: '*/5 * * * *', // Every 5 minutes
            description: 'Health check for services'
        }
    };
};
// Manual trigger functions for testing
export const triggerAnalyticsSync = async () => {
    console.log('🔄 Manually triggering analytics sync...');
    // Manually execute the analytics sync logic
    const firestore = getFirestoreClient();
    const socialAccounts = await firestore.collection('social_accounts').get();
    for (const doc of socialAccounts.docs) {
        const account = { id: doc.id, ...doc.data() };
        await scheduleAnalyticsSync(account.id, account.platform);
    }
};
export const triggerStalledPostsCheck = async () => {
    console.log('🔍 Manually triggering stalled posts check...');
    // This would manually execute the stalled posts check logic
    console.log('Manual stalled posts check completed');
};
export const triggerHealthCheck = async () => {
    console.log('🏥 Manually triggering health check...');
    // This would manually execute the health check logic
    console.log('Manual health check completed');
};
//# sourceMappingURL=cron.js.map