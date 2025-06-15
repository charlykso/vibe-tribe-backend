import Bull from 'bull';
import Redis from 'ioredis';
import { getFirestoreClient, getServerTimestamp } from './database.js';
import { publishToSocialPlatforms } from './socialMedia.js';
// Redis configuration
const redisConfig = process.env.REDIS_URL
    ? process.env.REDIS_URL // Use URL format for Render deployment
    : {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
    };
// Create Redis connection
export const redis = typeof redisConfig === 'string'
    ? new Redis(redisConfig)
    : new Redis(redisConfig);
// Create Bull queues
export const postQueue = new Bull('post publishing', {
    redis: redisConfig,
    defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
    },
});
export const analyticsQueue = new Bull('analytics sync', {
    redis: redisConfig,
    defaultJobOptions: {
        removeOnComplete: 5,
        removeOnFail: 3,
        attempts: 2,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
    },
});
// Post publishing job processor
postQueue.process('publish', async (job) => {
    const { postId, organizationId } = job.data;
    try {
        console.log(`📤 Processing post publication: ${postId}`);
        const firestore = getFirestoreClient();
        const postDoc = await firestore.collection('posts').doc(postId).get();
        if (!postDoc.exists) {
            throw new Error(`Post ${postId} not found`);
        }
        const post = { id: postDoc.id, ...postDoc.data() };
        // Verify post belongs to the organization
        if (post.organization_id !== organizationId) {
            throw new Error(`Post ${postId} does not belong to organization ${organizationId}`);
        }
        // Check if post is still scheduled
        if (post.status !== 'scheduled') {
            console.log(`⚠️ Post ${postId} is no longer scheduled (status: ${post.status})`);
            return { success: false, reason: 'Post is no longer scheduled' };
        }
        // Update post status to publishing
        await firestore.collection('posts').doc(postId).update({
            status: 'publishing',
            updated_at: getServerTimestamp()
        });
        // TODO: Emit real-time update via WebSocket
        // This would be handled by a separate WebSocket service
        // Publish to social media platforms
        const publishResult = await publishToSocialPlatforms(post);
        if (publishResult.success) {
            // Update post status to published
            await firestore.collection('posts').doc(postId).update({
                status: 'published',
                published_at: getServerTimestamp(),
                platform_post_ids: publishResult.platformPostIds,
                updated_at: getServerTimestamp()
            });
            // TODO: Emit success update via WebSocket
            console.log(`✅ Post ${postId} published successfully`);
            return { success: true, platformPostIds: publishResult.platformPostIds };
        }
        else {
            // Update post status to failed
            await firestore.collection('posts').doc(postId).update({
                status: 'failed',
                error_message: publishResult.error,
                updated_at: getServerTimestamp()
            });
            // TODO: Emit failure update via WebSocket
            throw new Error(`Failed to publish post: ${publishResult.error}`);
        }
    }
    catch (error) {
        console.error(`❌ Failed to publish post ${postId}:`, error);
        // Update post status to failed
        const firestore = getFirestoreClient();
        await firestore.collection('posts').doc(postId).update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            updated_at: getServerTimestamp()
        });
        // TODO: Emit failure update via WebSocket
        throw error;
    }
});
// Analytics sync job processor
analyticsQueue.process('sync', async (job) => {
    const { accountId, organizationId } = job.data;
    try {
        console.log(`📊 Processing analytics sync for account: ${accountId}`);
        // Import the analytics sync service
        const { AnalyticsSyncService } = await import('./analyticsSync.js');
        const analyticsService = new AnalyticsSyncService();
        if (accountId) {
            // Sync specific account
            const firestore = (await import('./database.js')).getFirestoreClient();
            const accountDoc = await firestore.collection('social_accounts').doc(accountId).get();
            if (accountDoc.exists) {
                const account = { id: accountDoc.id, ...accountDoc.data() };
                await analyticsService.syncAccountAnalytics(account);
            }
            else {
                throw new Error(`Account ${accountId} not found`);
            }
        }
        else if (organizationId) {
            // Sync all accounts in organization
            await analyticsService.syncOrganizationAnalytics(organizationId);
        }
        else {
            throw new Error('Either accountId or organizationId must be provided');
        }
        console.log(`✅ Analytics sync completed for account ${accountId}`);
        return { success: true };
    }
    catch (error) {
        console.error(`❌ Failed to sync analytics for account ${accountId}:`, error);
        throw error;
    }
});
// Schedule a post for publishing
export const schedulePost = async (postId, organizationId, scheduledTime) => {
    const delay = scheduledTime.getTime() - Date.now();
    if (delay <= 0) {
        throw new Error('Scheduled time must be in the future');
    }
    await postQueue.add('publish', { postId, organizationId }, {
        delay,
        jobId: `post-${postId}`, // Use consistent job ID for easy removal
    });
    console.log(`📅 Post ${postId} scheduled for ${scheduledTime.toISOString()}`);
};
// Cancel a scheduled post
export const cancelScheduledPost = async (postId) => {
    const jobId = `post-${postId}`;
    const job = await postQueue.getJob(jobId);
    if (job) {
        await job.remove();
        console.log(`🚫 Cancelled scheduled post ${postId}`);
    }
};
// Schedule analytics sync
export const scheduleAnalyticsSync = async (accountId, organizationId) => {
    await analyticsQueue.add('sync', { accountId, organizationId });
    console.log(`📊 Analytics sync scheduled for account ${accountId}`);
};
// Get queue statistics
export const getQueueStats = async () => {
    const [postStats, analyticsStats] = await Promise.all([
        {
            waiting: await postQueue.getWaiting(),
            active: await postQueue.getActive(),
            completed: await postQueue.getCompleted(),
            failed: await postQueue.getFailed(),
            delayed: await postQueue.getDelayed(),
        },
        {
            waiting: await analyticsQueue.getWaiting(),
            active: await analyticsQueue.getActive(),
            completed: await analyticsQueue.getCompleted(),
            failed: await analyticsQueue.getFailed(),
        }
    ]);
    return {
        posts: {
            waiting: postStats.waiting.length,
            active: postStats.active.length,
            completed: postStats.completed.length,
            failed: postStats.failed.length,
            delayed: postStats.delayed.length,
        },
        analytics: {
            waiting: analyticsStats.waiting.length,
            active: analyticsStats.active.length,
            completed: analyticsStats.completed.length,
            failed: analyticsStats.failed.length,
        }
    };
};
// Initialize queue monitoring
export const initializeQueues = () => {
    // Post queue event listeners
    postQueue.on('completed', (job, result) => {
        console.log(`✅ Post job ${job.id} completed:`, result);
    });
    postQueue.on('failed', (job, err) => {
        console.error(`❌ Post job ${job.id} failed:`, err.message);
    });
    postQueue.on('stalled', (job) => {
        console.warn(`⚠️ Post job ${job.id} stalled`);
    });
    // Analytics queue event listeners
    analyticsQueue.on('completed', (job, result) => {
        console.log(`✅ Analytics job ${job.id} completed:`, result);
    });
    analyticsQueue.on('failed', (job, err) => {
        console.error(`❌ Analytics job ${job.id} failed:`, err.message);
    });
    console.log('🔄 Queue monitoring initialized');
};
// Graceful shutdown
export const shutdownQueues = async () => {
    console.log('🔄 Shutting down queues...');
    await Promise.all([
        postQueue.close(),
        analyticsQueue.close(),
        redis.disconnect()
    ]);
    console.log('✅ Queues shut down successfully');
};
//# sourceMappingURL=queue.js.map