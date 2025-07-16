import { Router } from 'express';
import { z } from 'zod';
import { getFirestoreClient, getServerTimestamp } from '../services/database.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest, requireOrganization } from '../middleware/auth.js';
import { Post } from '../types/database.js';
import { schedulePost, cancelScheduledPost } from '../services/queue.js';
import { validatePostForPlatforms, publishToSocialPlatforms } from '../services/socialMedia.js';
import { io } from '../server.js';

const router = Router();

// Apply organization requirement to all routes (temporarily disabled for testing)
// router.use(requireOrganization);

// Validation schemas
const createPostSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  platforms: z.array(z.enum(['twitter', 'linkedin', 'facebook', 'instagram'])).min(1, 'At least one platform is required'),
  scheduled_at: z.string().datetime().optional(),
  media_urls: z.array(z.string().url()).default([])
});

const updatePostSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1).optional(),
  platforms: z.array(z.enum(['twitter', 'linkedin', 'facebook', 'instagram'])).optional(),
  scheduled_at: z.string().datetime().optional(),
  media_urls: z.array(z.string().url()).optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'failed']).optional()
});

// GET /api/v1/posts
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const firestore = getFirestoreClient();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const platform = req.query.platform as string;
  const search = req.query.search as string;

  // Build Firestore query
  let query = firestore
    .collection('posts')
    .where(req.user!.organization_id ? 'organization_id' : 'user_id', '==', req.user!.organization_id || req.user!.id)
    .orderBy('created_at', 'desc');

  // Apply status filter
  if (status) {
    query = query.where('status', '==', status);
  }

  // Get all matching documents first (for search and platform filtering)
  const snapshot = await query.get();
  let posts = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Post[];

  // Apply platform filter in memory (Firestore doesn't support array-contains with multiple conditions)
  if (platform) {
    posts = posts.filter(post => post.platforms?.includes(platform));
  }

  // Apply search filter in memory
  if (search) {
    const searchLower = search.toLowerCase();
    posts = posts.filter(post =>
      post.title?.toLowerCase().includes(searchLower) ||
      post.content?.toLowerCase().includes(searchLower)
    );
  }

  // Get user data for each post
  const postsWithUsers = await Promise.all(
    posts.map(async (post) => {
      if (post.user_id) {
        const userDoc = await firestore.collection('users').doc(post.user_id).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          return {
            ...post,
            users: {
              id: userDoc.id,
              name: userData?.name,
              email: userData?.email
            }
          };
        }
      }
      return post;
    })
  );

  // Calculate pagination
  const total = postsWithUsers.length;
  const offset = (page - 1) * limit;
  const paginatedPosts = postsWithUsers.slice(offset, offset + limit);

  res.json({
    posts: paginatedPosts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// GET /api/v1/posts/:id
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const firestore = getFirestoreClient();

  // Get post document
  const postDoc = await firestore.collection('posts').doc(req.params.id).get();

  if (!postDoc.exists) {
    throw new NotFoundError('Post not found');
  }

  const post = { id: postDoc.id, ...postDoc.data() } as Post;

  // Verify post belongs to same organization
  if (post.organization_id !== req.user!.organization_id) {
    throw new NotFoundError('Post not found');
  }

  // Get user data
  let userData = null;
  if (post.user_id) {
    const userDoc = await firestore.collection('users').doc(post.user_id).get();
    if (userDoc.exists) {
      const user = userDoc.data();
      userData = {
        id: userDoc.id,
        name: user?.name,
        email: user?.email
      };
    }
  }

  res.json({
    post: {
      ...post,
      users: userData
    }
  });
}));

// POST /api/v1/posts
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const validation = createPostSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError('Validation failed', validation.error.errors);
  }

  const firestore = getFirestoreClient();
  const postData = validation.data;

  // Validate post content for platforms
  const validationResult = validatePostForPlatforms({
    content: postData.content,
    platforms: postData.platforms,
    media_urls: postData.media_urls || []
  } as Post);

  if (!validationResult.valid) {
    throw new ValidationError('Post validation failed', validationResult.errors.map(error => ({ message: error })));
  }

  // Determine status based on scheduled_at
  const status = postData.scheduled_at ? 'scheduled' : 'draft';

  // Create post document
  const postRef = firestore.collection('posts').doc();
  const newPost: any = {
    user_id: req.user!.id,
    content: postData.content,
    platforms: postData.platforms,
    status,
    media_urls: postData.media_urls || [],
    platform_post_ids: {},
    analytics: {},
    created_at: getServerTimestamp(),
    updated_at: getServerTimestamp()
  };

  // Only add optional fields if they exist
  if (postData.title) {
    newPost.title = postData.title;
  }
  if (postData.scheduled_at) {
    newPost.scheduled_at = postData.scheduled_at;
  }
  if (req.user!.organization_id) {
    newPost.organization_id = req.user!.organization_id;
  }

  await postRef.set(newPost);

  // Schedule post if it has a scheduled time
  if (postData.scheduled_at && status === 'scheduled') {
    try {
      await schedulePost(postRef.id, req.user!.organization_id!, new Date(postData.scheduled_at));
      console.log(`📅 Post ${postRef.id} scheduled for ${postData.scheduled_at}`);
    } catch (error) {
      console.error('❌ Failed to schedule post:', error);
      // Update post status to draft if scheduling fails
      await postRef.update({
        status: 'draft',
        updated_at: getServerTimestamp()
      });
      throw new ValidationError('Failed to schedule post. Post saved as draft.');
    }
  }

  // Get the created post
  const createdPostDoc = await postRef.get();
  const createdPost = { id: createdPostDoc.id, ...createdPostDoc.data() } as Post;

  // Emit real-time update
  if (io) {
    io.to(`org-${req.user!.organization_id}`).emit('post-created', {
      post: {
        id: createdPost.id,
        title: createdPost.title,
        content: createdPost.content,
        platforms: createdPost.platforms,
        status: createdPost.status,
        scheduled_at: createdPost.scheduled_at,
        created_at: createdPost.created_at
      },
      timestamp: new Date().toISOString()
    });
  }

  res.status(201).json({
    message: 'Post created successfully',
    post: {
      id: createdPost.id,
      title: createdPost.title,
      content: createdPost.content,
      platforms: createdPost.platforms,
      status: createdPost.status,
      scheduled_at: createdPost.scheduled_at,
      media_urls: createdPost.media_urls,
      created_at: createdPost.created_at
    }
  });
}));

// PUT /api/v1/posts/:id
router.put('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const validation = updatePostSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError('Validation failed', validation.error.errors);
  }

  const firestore = getFirestoreClient();

  // Check if post exists and belongs to organization
  const postDoc = await firestore.collection('posts').doc(req.params.id).get();

  if (!postDoc.exists) {
    throw new NotFoundError('Post not found');
  }

  const existingPost = { id: postDoc.id, ...postDoc.data() } as Post;

  // Verify post belongs to same organization
  if (existingPost.organization_id !== req.user!.organization_id) {
    throw new NotFoundError('Post not found');
  }

  // Check if user can edit this post (owner or admin)
  if (existingPost.user_id !== req.user!.id && req.user!.role !== 'admin') {
    throw new ValidationError('You can only edit your own posts');
  }

  // Prevent editing published posts
  if (existingPost.status === 'published') {
    throw new ValidationError('Cannot edit published posts');
  }

  const updateData = {
    ...validation.data,
    updated_at: getServerTimestamp()
  };

  // Update post document
  await firestore
    .collection('posts')
    .doc(req.params.id)
    .update(updateData);

  // Get updated post data
  const updatedPostDoc = await firestore.collection('posts').doc(req.params.id).get();
  const updatedPost = { id: updatedPostDoc.id, ...updatedPostDoc.data() } as Post;

  res.json({
    message: 'Post updated successfully',
    post: {
      id: updatedPost.id,
      title: updatedPost.title,
      content: updatedPost.content,
      platforms: updatedPost.platforms,
      status: updatedPost.status,
      scheduled_at: updatedPost.scheduled_at,
      media_urls: updatedPost.media_urls,
      updated_at: updatedPost.updated_at
    }
  });
}));

// DELETE /api/v1/posts/:id
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const firestore = getFirestoreClient();

  // Check if post exists and belongs to organization
  const postDoc = await firestore.collection('posts').doc(req.params.id).get();

  if (!postDoc.exists) {
    throw new NotFoundError('Post not found');
  }

  const existingPost = { id: postDoc.id, ...postDoc.data() } as Post;

  // Verify post belongs to same organization
  if (existingPost.organization_id !== req.user!.organization_id) {
    throw new NotFoundError('Post not found');
  }

  // Check if user can delete this post (owner or admin)
  if (existingPost.user_id !== req.user!.id && req.user!.role !== 'admin') {
    throw new ValidationError('You can only delete your own posts');
  }

  // Prevent deleting published posts
  if (existingPost.status === 'published') {
    throw new ValidationError('Cannot delete published posts');
  }

  // Delete post document
  await firestore.collection('posts').doc(req.params.id).delete();

  res.json({
    message: 'Post deleted successfully'
  });
}));

// POST /api/v1/posts/:id/publish
router.post('/:id/publish', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const firestore = getFirestoreClient();

  // Check if post exists and belongs to organization
  const postDoc = await firestore.collection('posts').doc(req.params.id).get();

  if (!postDoc.exists) {
    throw new NotFoundError('Post not found');
  }

  const post = { id: postDoc.id, ...postDoc.data() } as Post;

  // Verify post belongs to same organization or user (for users without organization)
  if (req.user!.organization_id) {
    if (post.organization_id !== req.user!.organization_id) {
      throw new NotFoundError('Post not found');
    }
  } else {
    // For users without organization, check if they own the post
    if (post.user_id !== req.user!.id) {
      throw new NotFoundError('Post not found');
    }
  }

  // Check if user can publish this post
  if (post.user_id !== req.user!.id && req.user!.role !== 'admin') {
    throw new ValidationError('You can only publish your own posts');
  }

  if (post.status === 'published') {
    throw new ValidationError('Post is already published');
  }

  // Validate post content for platforms
  const validationResult = validatePostForPlatforms(post);
  if (!validationResult.valid) {
    throw new ValidationError('Post validation failed', validationResult.errors.map(error => ({ message: error })));
  }

  // Cancel scheduled job if post was scheduled
  if (post.status === 'scheduled') {
    try {
      await cancelScheduledPost(post.id);
      console.log(`🚫 Cancelled scheduled job for post ${post.id}`);
    } catch (error) {
      console.warn('⚠️ Failed to cancel scheduled job:', error);
    }
  }

  try {
    // Update post status to publishing
    await firestore.collection('posts').doc(req.params.id).update({
      status: 'publishing',
      updated_at: getServerTimestamp()
    });

    // Emit real-time update
    if (io && req.user!.organization_id) {
      io.to(`org-${req.user!.organization_id}`).emit('post-status-update', {
        postId: post.id,
        status: 'publishing',
        timestamp: new Date().toISOString()
      });
    }

    // Publish to social media platforms
    const publishResult = await publishToSocialPlatforms(post);

    if (publishResult.success) {
      // Update post status to published
      const updateData = {
        status: 'published',
        published_at: getServerTimestamp(),
        platform_post_ids: publishResult.platformPostIds || {},
        updated_at: getServerTimestamp()
      };

      await firestore.collection('posts').doc(req.params.id).update(updateData);

      // Emit success update
      if (io && req.user!.organization_id) {
        io.to(`org-${req.user!.organization_id}`).emit('post-status-update', {
          postId: post.id,
          status: 'published',
          platformPostIds: publishResult.platformPostIds,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        message: 'Post published successfully',
        post: {
          id: post.id,
          status: 'published',
          published_at: new Date().toISOString(),
          platform_post_ids: publishResult.platformPostIds
        }
      });

    } else {
      // Update post status to failed
      await firestore.collection('posts').doc(req.params.id).update({
        status: 'failed',
        error_message: publishResult.error,
        updated_at: getServerTimestamp()
      });

      // Emit failure update
      if (io && req.user!.organization_id) {
        io.to(`org-${req.user!.organization_id}`).emit('post-status-update', {
          postId: post.id,
          status: 'failed',
          error: publishResult.error,
          timestamp: new Date().toISOString()
        });
      }

      throw new ValidationError(`Failed to publish post: ${publishResult.error}`);
    }

  } catch (error) {
    console.error('❌ Publishing error:', error);

    // Update post status to failed if not already handled
    await firestore.collection('posts').doc(req.params.id).update({
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      updated_at: getServerTimestamp()
    });

    // Emit failure update
    if (io && req.user!.organization_id) {
      io.to(`org-${req.user!.organization_id}`).emit('post-status-update', {
        postId: post.id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }

    throw error;
  }
}));

// GET /api/v1/posts/drafts
router.get('/drafts', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const firestore = getFirestoreClient();

  // Get draft posts for the organization
  const snapshot = await firestore
    .collection('posts')
    .where('organization_id', '==', req.user!.organization_id!)
    .where('status', '==', 'draft')
    .orderBy('updated_at', 'desc')
    .get();

  const drafts = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Post[];

  // Get user data for each draft
  const draftsWithUsers = await Promise.all(
    drafts.map(async (draft) => {
      if (draft.user_id) {
        const userDoc = await firestore.collection('users').doc(draft.user_id).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          return {
            id: draft.id,
            title: draft.title,
            content: draft.content,
            platforms: draft.platforms,
            created_at: draft.created_at,
            updated_at: draft.updated_at,
            users: {
              id: userDoc.id,
              name: userData?.name
            }
          };
        }
      }
      return {
        id: draft.id,
        title: draft.title,
        content: draft.content,
        platforms: draft.platforms,
        created_at: draft.created_at,
        updated_at: draft.updated_at,
        users: null
      };
    })
  );

  res.json({
    drafts: draftsWithUsers
  });
}));

export default router;
