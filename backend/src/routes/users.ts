import { Router } from 'express';
import { z } from 'zod';
import { getFirestoreClient, getServerTimestamp } from '../services/database.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { User } from '../types/database.js';

const router = Router();

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  avatar_url: z.string().url('Invalid avatar URL').optional()
});

const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  role: z.enum(['admin', 'moderator', 'member']).optional(),
  is_active: z.boolean().optional()
});

// GET /api/v1/users/profile
router.get('/profile', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const firestore = getFirestoreClient();

  // Get user document
  const userDoc = await firestore.collection('users').doc(req.user!.id).get();

  if (!userDoc.exists) {
    throw new NotFoundError('User profile not found');
  }

  const user = { id: userDoc.id, ...userDoc.data() } as User;

  // Get organization if user belongs to one
  let organization = null;
  if (user.organization_id) {
    const orgDoc = await firestore.collection('organizations').doc(user.organization_id).get();
    if (orgDoc.exists) {
      organization = { id: orgDoc.id, ...orgDoc.data() };
    }
  }

  res.json({
    user: {
      ...user,
      organization
    }
  });
}));

// PUT /api/v1/users/profile
router.put('/profile', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const validation = updateProfileSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError('Validation failed', validation.error.errors);
  }

  const firestore = getFirestoreClient();
  const updateData = {
    ...validation.data,
    updated_at: getServerTimestamp()
  };

  // Update user document
  await firestore
    .collection('users')
    .doc(req.user!.id)
    .update(updateData);

  // Get updated user data
  const userDoc = await firestore.collection('users').doc(req.user!.id).get();
  const user = { id: userDoc.id, ...userDoc.data() } as User;

  res.json({
    message: 'Profile updated successfully',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      role: user.role,
      organization_id: user.organization_id
    }
  });
}));

// GET /api/v1/users (Admin only)
router.get('/', requireRole(['admin']), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const firestore = getFirestoreClient();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const role = req.query.role as string;

  // Build Firestore query
  let query = firestore
    .collection('users')
    .where('organization_id', '==', req.user!.organization_id!)
    .orderBy('created_at', 'desc');

  // Apply role filter
  if (role) {
    query = query.where('role', '==', role);
  }

  // Get all matching documents first (for search and count)
  const snapshot = await query.get();
  let users = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as User[];

  // Apply search filter in memory (Firestore doesn't support text search)
  if (search) {
    const searchLower = search.toLowerCase();
    users = users.filter(user =>
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  }

  // Calculate pagination
  const total = users.length;
  const offset = (page - 1) * limit;
  const paginatedUsers = users.slice(offset, offset + limit);

  // Return only necessary fields
  const sanitizedUsers = paginatedUsers.map(user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar_url,
    role: user.role,
    email_verified: user.email_verified,
    created_at: user.created_at,
    last_login: user.last_login,
    is_active: user.is_active
  }));

  res.json({
    users: sanitizedUsers,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// GET /api/v1/users/:id (Admin/Moderator only)
router.get('/:id', requireRole(['admin', 'moderator']), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const firestore = getFirestoreClient();

  // Get user document
  const userDoc = await firestore.collection('users').doc(req.params.id).get();

  if (!userDoc.exists) {
    throw new NotFoundError('User not found');
  }

  const user = { id: userDoc.id, ...userDoc.data() } as User;

  // Verify user belongs to same organization
  if (user.organization_id !== req.user!.organization_id) {
    throw new NotFoundError('User not found');
  }

  // Return sanitized user data
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      role: user.role,
      organization_id: user.organization_id,
      email_verified: user.email_verified,
      created_at: user.created_at,
      last_login: user.last_login,
      is_active: user.is_active
    }
  });
}));

// PUT /api/v1/users/:id (Admin only)
router.put('/:id', requireRole(['admin']), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const validation = updateUserSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError('Validation failed', validation.error.errors);
  }

  const firestore = getFirestoreClient();

  // Check if user exists and belongs to same organization
  const userDoc = await firestore.collection('users').doc(req.params.id).get();

  if (!userDoc.exists) {
    throw new NotFoundError('User not found');
  }

  const existingUser = { id: userDoc.id, ...userDoc.data() } as User;

  // Verify user belongs to same organization
  if (existingUser.organization_id !== req.user!.organization_id) {
    throw new NotFoundError('User not found');
  }

  // Prevent admin from demoting themselves
  if (req.params.id === req.user!.id && validation.data.role && validation.data.role !== 'admin') {
    throw new ValidationError('Cannot change your own admin role');
  }

  const updateData = {
    ...validation.data,
    updated_at: getServerTimestamp()
  };

  // Update user document
  await firestore
    .collection('users')
    .doc(req.params.id)
    .update(updateData);

  // Get updated user data
  const updatedUserDoc = await firestore.collection('users').doc(req.params.id).get();
  const updatedUser = { id: updatedUserDoc.id, ...updatedUserDoc.data() } as User;

  res.json({
    message: 'User updated successfully',
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      avatar_url: updatedUser.avatar_url,
      role: updatedUser.role,
      is_active: updatedUser.is_active
    }
  });
}));

// DELETE /api/v1/users/:id (Admin only)
router.delete('/:id', requireRole(['admin']), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const firestore = getFirestoreClient();

  // Prevent admin from deleting themselves
  if (req.params.id === req.user!.id) {
    throw new ValidationError('Cannot delete your own account');
  }

  // Check if user exists and belongs to same organization
  const userDoc = await firestore.collection('users').doc(req.params.id).get();

  if (!userDoc.exists) {
    throw new NotFoundError('User not found');
  }

  const existingUser = { id: userDoc.id, ...userDoc.data() } as User;

  // Verify user belongs to same organization
  if (existingUser.organization_id !== req.user!.organization_id) {
    throw new NotFoundError('User not found');
  }

  // Soft delete by deactivating the user
  await firestore
    .collection('users')
    .doc(req.params.id)
    .update({
      is_active: false,
      updated_at: getServerTimestamp()
    });

  res.json({
    message: 'User deleted successfully'
  });
}));

export default router;
