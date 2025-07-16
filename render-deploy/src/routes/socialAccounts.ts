import { Router } from 'express';
import { z } from 'zod';
import { getFirestoreClient, getServerTimestamp } from '../services/database.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest, requireOrganization } from '../middleware/auth.js';
import { SocialAccount } from '../types/database.js';

const router = Router();

// Apply organization requirement to all routes
router.use(requireOrganization);

// Validation schemas
const connectAccountSchema = z.object({
  platform: z.enum(['twitter', 'linkedin', 'facebook', 'instagram']),
  access_token: z.string().min(1, 'Access token is required'),
  refresh_token: z.string().optional(),
  platform_user_id: z.string().min(1, 'Platform user ID is required'),
  username: z.string().min(1, 'Username is required'),
  display_name: z.string().min(1, 'Display name is required'),
  avatar_url: z.string().url().optional(),
  permissions: z.array(z.string()).default([])
});

// GET /api/v1/social-accounts
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  console.log('📋 GET /api/v1/social-accounts called');
  console.log('👤 User:', req.user?.id, 'Org:', req.user?.organization_id);

  try {
    // Simple test first - just return success
    console.log('✅ Endpoint reached successfully');

    const firestore = getFirestoreClient();
    console.log('✅ Firestore client obtained');

    // Get social accounts for the organization
    console.log('🔍 Querying social accounts for org:', req.user!.organization_id);
    const snapshot = await firestore
      .collection('social_accounts')
      .where('organization_id', '==', req.user!.organization_id!)
      .get();

    console.log('📊 Found', snapshot.size, 'social accounts');

    const accounts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('✅ Successfully processed accounts');

    res.json({
      success: true,
      accounts,
      count: accounts.length
    });

  } catch (firestoreError) {
    console.error('❌ Firestore error:', firestoreError);
    res.status(500).json({
      error: 'Database error',
      message: firestoreError.message,
      details: firestoreError
    });
  }
}));

// GET /api/v1/social-accounts/:id
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const firestore = getFirestoreClient();

  // Get social account document
  const accountDoc = await firestore.collection('social_accounts').doc(req.params.id).get();

  if (!accountDoc.exists) {
    throw new NotFoundError('Social account not found');
  }

  const account = { id: accountDoc.id, ...accountDoc.data() } as SocialAccount;

  // Verify account belongs to same organization
  if (account.organization_id !== req.user!.organization_id) {
    throw new NotFoundError('Social account not found');
  }

  // Return sanitized account data (without sensitive tokens)
  res.json({
    account: {
      id: account.id,
      platform: account.platform,
      platform_user_id: account.platform_user_id,
      username: account.username,
      display_name: account.display_name,
      avatar_url: account.avatar_url,
      permissions: account.permissions,
      is_active: account.is_active,
      last_sync_at: account.last_sync_at,
      created_at: account.created_at
    }
  });
}));

// POST /api/v1/social-accounts
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const validation = connectAccountSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError('Validation failed', validation.error.errors);
  }

  const firestore = getFirestoreClient();
  const accountData = validation.data;

  // Check if account already exists for this platform and user
  const existingAccountQuery = await firestore
    .collection('social_accounts')
    .where('platform', '==', accountData.platform)
    .where('platform_user_id', '==', accountData.platform_user_id)
    .where('organization_id', '==', req.user!.organization_id!)
    .limit(1)
    .get();

  if (!existingAccountQuery.empty) {
    throw new ValidationError(`${accountData.platform} account is already connected`);
  }

  // Create new social account document
  const accountRef = firestore.collection('social_accounts').doc();
  const newAccount = {
    user_id: req.user!.id,
    organization_id: req.user!.organization_id!,
    platform: accountData.platform,
    platform_user_id: accountData.platform_user_id,
    username: accountData.username,
    display_name: accountData.display_name,
    avatar_url: accountData.avatar_url,
    access_token: accountData.access_token, // In production, encrypt this
    refresh_token: accountData.refresh_token, // In production, encrypt this
    permissions: accountData.permissions,
    is_active: true,
    created_at: getServerTimestamp(),
    updated_at: getServerTimestamp()
  };

  await accountRef.set(newAccount);

  // Get the created account
  const createdAccountDoc = await accountRef.get();
  const createdAccount = { id: createdAccountDoc.id, ...createdAccountDoc.data() } as SocialAccount;

  res.status(201).json({
    message: 'Social account connected successfully',
    account: {
      id: createdAccount.id,
      platform: createdAccount.platform,
      platform_user_id: createdAccount.platform_user_id,
      username: createdAccount.username,
      display_name: createdAccount.display_name,
      avatar_url: createdAccount.avatar_url,
      permissions: createdAccount.permissions,
      is_active: createdAccount.is_active,
      created_at: createdAccount.created_at
    }
  });
}));

// PUT /api/v1/social-accounts/:id
router.put('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const updateSchema = z.object({
    access_token: z.string().optional(),
    refresh_token: z.string().optional(),
    username: z.string().optional(),
    display_name: z.string().optional(),
    avatar_url: z.string().url().optional(),
    permissions: z.array(z.string()).optional(),
    is_active: z.boolean().optional()
  });

  const validation = updateSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError('Validation failed', validation.error.errors);
  }

  const firestore = getFirestoreClient();

  // Check if account exists and belongs to organization
  const accountDoc = await firestore.collection('social_accounts').doc(req.params.id).get();

  if (!accountDoc.exists) {
    throw new NotFoundError('Social account not found');
  }

  const existingAccount = { id: accountDoc.id, ...accountDoc.data() } as SocialAccount;

  // Verify account belongs to same organization
  if (existingAccount.organization_id !== req.user!.organization_id) {
    throw new NotFoundError('Social account not found');
  }

  const updateData = {
    ...validation.data,
    updated_at: getServerTimestamp()
  };

  // Update the account
  await accountDoc.ref.update(updateData);

  // Get the updated account
  const updatedAccountDoc = await accountDoc.ref.get();
  const updatedAccount = { id: updatedAccountDoc.id, ...updatedAccountDoc.data() } as SocialAccount;

  res.json({
    message: 'Social account updated successfully',
    account: {
      id: updatedAccount.id,
      platform: updatedAccount.platform,
      platform_user_id: updatedAccount.platform_user_id,
      username: updatedAccount.username,
      display_name: updatedAccount.display_name,
      avatar_url: updatedAccount.avatar_url,
      permissions: updatedAccount.permissions,
      is_active: updatedAccount.is_active,
      updated_at: updatedAccount.updated_at
    }
  });
}));

// DELETE /api/v1/social-accounts/:id
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const firestore = getFirestoreClient();

  // Check if account exists and belongs to organization
  const accountDoc = await firestore.collection('social_accounts').doc(req.params.id).get();

  if (!accountDoc.exists) {
    throw new NotFoundError('Social account not found');
  }

  const existingAccount = { id: accountDoc.id, ...accountDoc.data() } as SocialAccount;

  // Verify account belongs to same organization
  if (existingAccount.organization_id !== req.user!.organization_id) {
    throw new NotFoundError('Social account not found');
  }

  // Delete the account
  await accountDoc.ref.delete();

  res.json({
    message: `${existingAccount.platform} account disconnected successfully`
  });
}));

// POST /api/v1/social-accounts/:id/sync
router.post('/:id/sync', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const firestore = getFirestoreClient();

  // Check if account exists and belongs to organization
  const accountDoc = await firestore.collection('social_accounts').doc(req.params.id).get();

  if (!accountDoc.exists) {
    throw new NotFoundError('Social account not found');
  }

  const account = { id: accountDoc.id, ...accountDoc.data() } as SocialAccount;

  // Verify account belongs to same organization and is active
  if (account.organization_id !== req.user!.organization_id || !account.is_active) {
    throw new NotFoundError('Social account not found or inactive');
  }

  // Update last sync time
  await accountDoc.ref.update({
    last_sync_at: getServerTimestamp(),
    updated_at: getServerTimestamp()
  });

  // TODO: Implement actual platform sync logic here
  // This would involve calling the respective platform APIs to sync data

  res.json({
    message: `${account.platform} account synced successfully`,
    synced_at: new Date().toISOString()
  });
}));

// GET /api/v1/social-accounts/platforms
router.get('/platforms/supported', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const platforms = [
    {
      id: 'twitter',
      name: 'Twitter',
      icon: '🐦',
      color: '#1DA1F2',
      features: ['posts', 'threads', 'analytics', 'mentions']
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      color: '#0077B5',
      features: ['posts', 'articles', 'analytics', 'company_pages']
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '👥',
      color: '#1877F2',
      features: ['posts', 'pages', 'analytics', 'groups']
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📸',
      color: '#E4405F',
      features: ['posts', 'stories', 'analytics', 'reels']
    }
  ];

  res.json({
    platforms
  });
}));

export default router;
