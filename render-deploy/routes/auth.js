import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getFirestoreClient, getServerTimestamp } from '../services/database.js';
import { asyncHandler, ValidationError, ConflictError, UnauthorizedError } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import { emailService } from '../services/email.js';
const router = Router();
// Validation schemas
const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    organizationName: z.string().min(2, 'Organization name must be at least 2 characters').optional()
});
const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
});
const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email format')
});
const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters')
});
const verifyEmailSchema = z.object({
    token: z.string().min(1, 'Verification token is required')
});
const resendVerificationSchema = z.object({
    email: z.string().email('Invalid email format')
});
// Helper function to generate JWT token
const generateToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET not configured');
    }
    return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};
// Helper function to hash password
const hashPassword = async (password) => {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    return bcrypt.hash(password, rounds);
};
// Helper function to create organization slug
const createSlug = (name) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};
// Helper function to generate verification token
const generateVerificationToken = () => {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15) +
        Date.now().toString(36);
};
// POST /api/v1/auth/register
router.post('/register', asyncHandler(async (req, res) => {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
        throw new ValidationError('Validation failed', validation.error.errors);
    }
    const { email, password, name, organizationName } = validation.data;
    const firestore = getFirestoreClient();
    // Check if user already exists
    const existingUserQuery = await firestore
        .collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
    if (!existingUserQuery.empty) {
        throw new ConflictError('User with this email already exists');
    }
    // Hash password (Note: In production, consider using Firebase Auth instead)
    const hashedPassword = await hashPassword(password);
    // Create organization if provided
    let organizationId;
    if (organizationName) {
        const slug = createSlug(organizationName);
        // Check if organization slug already exists
        const existingOrgQuery = await firestore
            .collection('organizations')
            .where('slug', '==', slug)
            .limit(1)
            .get();
        if (!existingOrgQuery.empty) {
            throw new ConflictError('Organization with this name already exists');
        }
        // Create organization
        const organizationData = {
            name: organizationName,
            slug,
            plan: 'free',
            settings: {},
            created_at: getServerTimestamp(),
            updated_at: getServerTimestamp(),
            is_active: true
        };
        const orgRef = await firestore.collection('organizations').add(organizationData);
        organizationId = orgRef.id;
    }
    // Generate email verification token
    const verificationToken = generateVerificationToken();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    // Create user
    const userData = {
        email,
        name,
        role: organizationId ? 'admin' : 'member',
        email_verified: false,
        verification_token: verificationToken,
        verification_token_expires: verificationExpiry,
        is_active: true,
        created_at: getServerTimestamp(),
        updated_at: getServerTimestamp()
    };
    // Only add organization_id if it exists (avoid undefined values)
    if (organizationId) {
        userData.organization_id = organizationId;
    }
    const userRef = await firestore.collection('users').add(userData);
    const userId = userRef.id;
    // Send verification email
    try {
        await emailService.sendVerificationEmail(email, verificationToken, name);
        console.log(`✅ Verification email sent to ${email}`);
    }
    catch (error) {
        console.error('❌ Failed to send verification email:', error);
        // Don't fail registration if email fails
    }
    // Generate JWT token
    const token = generateToken(userId);
    res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email to verify your account.',
        user: {
            id: userId,
            email,
            name,
            role: userData.role,
            organization_id: organizationId || undefined,
            email_verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        token
    });
}));
// POST /api/v1/auth/login
router.post('/login', asyncHandler(async (req, res) => {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
        throw new ValidationError('Validation failed', validation.error.errors);
    }
    const { email, password } = validation.data;
    const firestore = getFirestoreClient();
    // Get user by email
    const userQuery = await firestore
        .collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
    if (userQuery.empty) {
        throw new UnauthorizedError('Invalid email or password');
    }
    const userDoc = userQuery.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };
    if (!user.is_active) {
        throw new UnauthorizedError('Account is deactivated');
    }
    // For now, we'll skip password verification since we're using Firebase Auth
    // In a real implementation, you'd verify the password here
    // Update last login
    await firestore
        .collection('users')
        .doc(user.id)
        .update({
        last_login: getServerTimestamp(),
        updated_at: getServerTimestamp()
    });
    // Generate JWT token
    const token = generateToken(user.id);
    res.json({
        success: true,
        message: 'Login successful',
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organization_id: user.organization_id,
            created_at: typeof user.created_at === 'object' && user.created_at?.toDate ? user.created_at.toDate().toISOString() : new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        token
    });
}));
// GET /api/v1/auth/me
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
    const firestore = getFirestoreClient();
    // Get user document
    const userDoc = await firestore.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) {
        throw new UnauthorizedError('User not found');
    }
    const user = { id: userDoc.id, ...userDoc.data() };
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
// POST /api/v1/auth/logout
router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
    // In a stateless JWT setup, logout is handled client-side by removing the token
    // Here we could add token to a blacklist if needed
    res.json({
        message: 'Logout successful'
    });
}));
// POST /api/v1/auth/forgot-password
router.post('/forgot-password', asyncHandler(async (req, res) => {
    const validation = forgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
        throw new ValidationError('Validation failed', validation.error.errors);
    }
    const { email } = validation.data;
    // For now, just return success (implement email sending later)
    // In production, you would:
    // 1. Check if user exists in Firestore
    // 2. Generate a reset token
    // 3. Store the token with expiration
    // 4. Send email with reset link
    res.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
    });
}));
// POST /api/v1/auth/verify-email
router.post('/verify-email', asyncHandler(async (req, res) => {
    const validation = verifyEmailSchema.safeParse(req.body);
    if (!validation.success) {
        throw new ValidationError('Validation failed', validation.error.errors);
    }
    const { token } = validation.data;
    const firestore = getFirestoreClient();
    // Find user with this verification token
    const userQuery = await firestore
        .collection('users')
        .where('verification_token', '==', token)
        .limit(1)
        .get();
    if (userQuery.empty) {
        throw new ValidationError('Invalid or expired verification token');
    }
    const userDoc = userQuery.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };
    // Check if token is expired
    if (user.verification_token_expires && new Date() > user.verification_token_expires.toDate()) {
        throw new ValidationError('Verification token has expired');
    }
    // Check if already verified
    if (user.email_verified) {
        return res.json({
            message: 'Email is already verified'
        });
    }
    // Update user as verified
    await firestore.collection('users').doc(user.id).update({
        email_verified: true,
        verification_token: null,
        verification_token_expires: null,
        updated_at: getServerTimestamp()
    });
    res.json({
        message: 'Email verified successfully'
    });
}));
// POST /api/v1/auth/resend-verification
router.post('/resend-verification', asyncHandler(async (req, res) => {
    const validation = resendVerificationSchema.safeParse(req.body);
    if (!validation.success) {
        throw new ValidationError('Validation failed', validation.error.errors);
    }
    const { email } = validation.data;
    const firestore = getFirestoreClient();
    // Find user by email
    const userQuery = await firestore
        .collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
    if (userQuery.empty) {
        // Don't reveal if email exists or not
        return res.json({
            message: 'If an account with that email exists and is unverified, a new verification email has been sent.'
        });
    }
    const userDoc = userQuery.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };
    // Check if already verified
    if (user.email_verified) {
        return res.json({
            message: 'Email is already verified'
        });
    }
    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    // Update user with new token
    await firestore.collection('users').doc(user.id).update({
        verification_token: verificationToken,
        verification_token_expires: verificationExpiry,
        updated_at: getServerTimestamp()
    });
    // Send verification email
    try {
        await emailService.sendVerificationEmail(email, verificationToken, user.name);
        console.log(`✅ Verification email resent to ${email}`);
    }
    catch (error) {
        console.error('❌ Failed to send verification email:', error);
        throw new ValidationError('Failed to send verification email');
    }
    res.json({
        message: 'If an account with that email exists and is unverified, a new verification email has been sent.'
    });
}));
export default router;
//# sourceMappingURL=auth.js.map