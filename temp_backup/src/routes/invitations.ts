import { Router } from 'express';
import { z } from 'zod';
import { getFirestoreClient, getServerTimestamp } from '../services/database.js';
import { asyncHandler, ValidationError, UnauthorizedError, NotFoundError } from '../middleware/errorHandler.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { emailService } from '../services/email.js';
import { User, Organization } from '../types/database.js';

const router = Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Validation schemas
const inviteUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['admin', 'moderator', 'member']).default('member'),
  message: z.string().optional()
});

const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

// Helper function to generate invitation token
const generateInvitationToken = (): string => {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15) +
         Date.now().toString(36);
};

// POST /api/v1/invitations/invite
// Send invitation to join organization
router.post('/invite', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const validation = inviteUserSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError('Validation failed', validation.error.errors);
  }

  const { email, role, message } = validation.data;
  const user = req.user!;

  if (!user.organization_id) {
    throw new UnauthorizedError('User must belong to an organization to send invitations');
  }

  // Only admins can send invitations
  if (user.role !== 'admin') {
    throw new UnauthorizedError('Only organization admins can send invitations');
  }

  const firestore = getFirestoreClient();

  // Get organization details
  const orgDoc = await firestore.collection('organizations').doc(user.organization_id).get();
  if (!orgDoc.exists) {
    throw new NotFoundError('Organization not found');
  }

  const organization = { id: orgDoc.id, ...orgDoc.data() } as Organization;

  // Check if user is already a member
  const existingUserQuery = await firestore
    .collection('users')
    .where('email', '==', email)
    .where('organization_id', '==', user.organization_id)
    .limit(1)
    .get();

  if (!existingUserQuery.empty) {
    throw new ValidationError('User is already a member of this organization');
  }

  // Check if there's already a pending invitation
  const existingInvitationQuery = await firestore
    .collection('invitations')
    .where('email', '==', email)
    .where('organization_id', '==', user.organization_id)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (!existingInvitationQuery.empty) {
    throw new ValidationError('An invitation has already been sent to this email');
  }

  // Generate invitation token
  const invitationToken = generateInvitationToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Create invitation record
  const invitationData = {
    email,
    role,
    organization_id: user.organization_id,
    invited_by: user.id,
    invitation_token: invitationToken,
    expires_at: expiresAt,
    status: 'pending',
    message: message || '',
    created_at: getServerTimestamp(),
    updated_at: getServerTimestamp()
  };

  const invitationRef = await firestore.collection('invitations').add(invitationData);

  // Send invitation email
  try {
    await emailService.sendInvitationEmail(
      email,
      user.name,
      organization.name,
      invitationToken
    );
    console.log(`✅ Invitation email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send invitation email:', error);
    // Don't fail the invitation if email fails, but log it
  }

  res.status(201).json({
    message: 'Invitation sent successfully',
    invitation: {
      id: invitationRef.id,
      email,
      role,
      status: 'pending',
      expires_at: expiresAt.toISOString()
    }
  });
}));

// GET /api/v1/invitations
// Get all invitations for the organization
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;

  if (!user.organization_id) {
    throw new UnauthorizedError('User must belong to an organization');
  }

  // Only admins can view invitations
  if (user.role !== 'admin') {
    throw new UnauthorizedError('Only organization admins can view invitations');
  }

  const firestore = getFirestoreClient();

  // Get all invitations for the organization
  const invitationsQuery = await firestore
    .collection('invitations')
    .where('organization_id', '==', user.organization_id)
    .orderBy('created_at', 'desc')
    .get();

  const invitations = await Promise.all(
    invitationsQuery.docs.map(async (doc) => {
      const invitationData = doc.data();

      // Get inviter details
      let inviterName = 'Unknown';
      if (invitationData.invited_by) {
        const inviterDoc = await firestore.collection('users').doc(invitationData.invited_by).get();
        if (inviterDoc.exists) {
          inviterName = inviterDoc.data()?.name || 'Unknown';
        }
      }

      return {
        id: doc.id,
        email: invitationData.email,
        role: invitationData.role,
        status: invitationData.status,
        invited_by: inviterName,
        expires_at: invitationData.expires_at?.toDate?.()?.toISOString() || null,
        created_at: invitationData.created_at?.toDate?.()?.toISOString() || null
      };
    })
  );

  res.json({
    invitations
  });
}));

// POST /api/v1/invitations/accept
// Accept an invitation (public endpoint)
router.post('/accept', asyncHandler(async (req, res) => {
  const validation = acceptInvitationSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError('Validation failed', validation.error.errors);
  }

  const { token, name, password } = validation.data;
  const firestore = getFirestoreClient();

  // Find invitation by token
  const invitationQuery = await firestore
    .collection('invitations')
    .where('invitation_token', '==', token)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (invitationQuery.empty) {
    throw new ValidationError('Invalid or expired invitation token');
  }

  const invitationDoc = invitationQuery.docs[0];
  const invitation = invitationDoc.data();

  // Check if invitation is expired
  if (invitation.expires_at && new Date() > invitation.expires_at.toDate()) {
    throw new ValidationError('Invitation has expired');
  }

  // Check if user already exists
  const existingUserQuery = await firestore
    .collection('users')
    .where('email', '==', invitation.email)
    .limit(1)
    .get();

  if (!existingUserQuery.empty) {
    throw new ValidationError('User with this email already exists');
  }

  // Create user account
  const userData = {
    email: invitation.email,
    name,
    role: invitation.role,
    organization_id: invitation.organization_id,
    email_verified: true, // Auto-verify since they accepted invitation
    is_active: true,
    created_at: getServerTimestamp(),
    updated_at: getServerTimestamp()
  };

  const userRef = await firestore.collection('users').add(userData);

  // Update invitation status
  await firestore.collection('invitations').doc(invitationDoc.id).update({
    status: 'accepted',
    accepted_at: getServerTimestamp(),
    updated_at: getServerTimestamp()
  });

  res.status(201).json({
    message: 'Invitation accepted successfully',
    user: {
      id: userRef.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      organization_id: userData.organization_id
    }
  });
}));

// DELETE /api/v1/invitations/:invitationId
// Cancel/revoke an invitation
router.delete('/:invitationId', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { invitationId } = req.params;
  const user = req.user!;

  if (!user.organization_id) {
    throw new UnauthorizedError('User must belong to an organization');
  }

  // Only admins can cancel invitations
  if (user.role !== 'admin') {
    throw new UnauthorizedError('Only organization admins can cancel invitations');
  }

  const firestore = getFirestoreClient();

  // Get invitation
  const invitationDoc = await firestore.collection('invitations').doc(invitationId).get();

  if (!invitationDoc.exists) {
    throw new NotFoundError('Invitation not found');
  }

  const invitation = invitationDoc.data();

  // Verify invitation belongs to user's organization
  if (invitation?.organization_id !== user.organization_id) {
    throw new UnauthorizedError('Invitation does not belong to your organization');
  }

  // Update invitation status
  await firestore.collection('invitations').doc(invitationId).update({
    status: 'cancelled',
    cancelled_at: getServerTimestamp(),
    updated_at: getServerTimestamp()
  });

  res.json({
    message: 'Invitation cancelled successfully'
  });
}));

// POST /api/v1/invitations/:invitationId/resend
// Resend an invitation email
router.post('/:invitationId/resend', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { invitationId } = req.params;
  const user = req.user!;

  if (!user.organization_id) {
    throw new UnauthorizedError('User must belong to an organization');
  }

  // Only admins can resend invitations
  if (user.role !== 'admin') {
    throw new UnauthorizedError('Only organization admins can resend invitations');
  }

  const firestore = getFirestoreClient();

  // Get invitation
  const invitationDoc = await firestore.collection('invitations').doc(invitationId).get();

  if (!invitationDoc.exists) {
    throw new NotFoundError('Invitation not found');
  }

  const invitation = invitationDoc.data();

  // Verify invitation belongs to user's organization
  if (invitation?.organization_id !== user.organization_id) {
    throw new UnauthorizedError('Invitation does not belong to your organization');
  }

  // Check if invitation is still pending
  if (invitation?.status !== 'pending') {
    throw new ValidationError('Can only resend pending invitations');
  }

  // Get organization details
  const orgDoc = await firestore.collection('organizations').doc(user.organization_id).get();
  if (!orgDoc.exists) {
    throw new NotFoundError('Organization not found');
  }

  const organization = { id: orgDoc.id, ...orgDoc.data() } as Organization;

  // Resend invitation email
  try {
    await emailService.sendInvitationEmail(
      invitation.email,
      user.name,
      organization.name,
      invitation.invitation_token
    );
    console.log(`✅ Invitation email resent to ${invitation.email}`);

    // Update last sent timestamp
    await firestore.collection('invitations').doc(invitationId).update({
      last_sent_at: getServerTimestamp(),
      updated_at: getServerTimestamp()
    });

    res.json({
      message: 'Invitation resent successfully'
    });
  } catch (error) {
    console.error('❌ Failed to resend invitation email:', error);
    throw new ValidationError('Failed to resend invitation email');
  }
}));

export default router;
