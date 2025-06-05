import cron from 'node-cron';
import { analyticsQueue } from '../services/queue.js';
import { getFirestoreClient } from '../services/database.js';
/**
 * Schedule analytics sync jobs for all organizations
 * This script sets up periodic analytics syncing
 */
async function scheduleAnalyticsSync() {
    console.log('🚀 Starting analytics sync scheduler...');
    // Schedule analytics sync every 4 hours
    cron.schedule('0 */4 * * *', async () => {
        console.log('📊 Running scheduled analytics sync...');
        try {
            const firestore = getFirestoreClient();
            // Get all organizations
            const orgsSnapshot = await firestore.collection('organizations').get();
            for (const orgDoc of orgsSnapshot.docs) {
                const organizationId = orgDoc.id;
                console.log(`📊 Scheduling analytics sync for organization: ${organizationId}`);
                // Add analytics sync job to queue
                await analyticsQueue.add('sync', {
                    organizationId,
                    timestamp: new Date().toISOString()
                }, {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000
                    }
                });
            }
            console.log('✅ Analytics sync jobs scheduled successfully');
        }
        catch (error) {
            console.error('❌ Failed to schedule analytics sync:', error);
        }
    });
    // Schedule daily analytics sync for active accounts
    cron.schedule('0 2 * * *', async () => {
        console.log('📊 Running daily analytics sync for active accounts...');
        try {
            const firestore = getFirestoreClient();
            // Get all active social accounts
            const accountsSnapshot = await firestore
                .collection('social_accounts')
                .where('is_active', '==', true)
                .get();
            for (const accountDoc of accountsSnapshot.docs) {
                const accountData = accountDoc.data();
                const account = { id: accountDoc.id, ...accountData };
                console.log(`📊 Scheduling analytics sync for account: ${account.platform || 'unknown'}/${account.username || 'unknown'}`);
                // Add account-specific analytics sync job
                await analyticsQueue.add('sync', {
                    accountId: account.id,
                    organizationId: account.organization_id || '',
                    timestamp: new Date().toISOString()
                }, {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000
                    }
                });
            }
            console.log('✅ Daily analytics sync jobs scheduled successfully');
        }
        catch (error) {
            console.error('❌ Failed to schedule daily analytics sync:', error);
        }
    });
    console.log('✅ Analytics sync scheduler started');
    console.log('📅 Analytics sync will run every 4 hours');
    console.log('📅 Daily deep sync will run at 2 AM');
}
// Manual sync function for testing
export async function triggerManualSync(organizationId, accountId) {
    console.log('🔧 Triggering manual analytics sync...');
    try {
        if (accountId) {
            // Sync specific account
            await analyticsQueue.add('sync', {
                accountId,
                timestamp: new Date().toISOString()
            });
            console.log(`✅ Manual sync triggered for account: ${accountId}`);
        }
        else if (organizationId) {
            // Sync all accounts in organization
            await analyticsQueue.add('sync', {
                organizationId,
                timestamp: new Date().toISOString()
            });
            console.log(`✅ Manual sync triggered for organization: ${organizationId}`);
        }
        else {
            // Sync all organizations
            const firestore = getFirestoreClient();
            const orgsSnapshot = await firestore.collection('organizations').get();
            for (const orgDoc of orgsSnapshot.docs) {
                await analyticsQueue.add('sync', {
                    organizationId: orgDoc.id,
                    timestamp: new Date().toISOString()
                });
            }
            console.log('✅ Manual sync triggered for all organizations');
        }
    }
    catch (error) {
        console.error('❌ Failed to trigger manual sync:', error);
        throw error;
    }
}
// Start the scheduler if this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    scheduleAnalyticsSync().catch(console.error);
}
export default scheduleAnalyticsSync;
//# sourceMappingURL=schedule-analytics-sync.js.map