import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getFirestoreClient, getServerTimestamp } from '../services/database.js';
import { asyncHandler, ValidationError, UnauthorizedError, NotFoundError } from '../middleware/errorHandler.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const createTemplateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  content: z.string().min(1),
  platforms: z.array(z.enum(['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube'])),
  category: z.string().min(1).max(50),
  tags: z.array(z.string()).optional(),
  is_public: z.boolean().optional().default(false)
});

const updateTemplateSchema = createTemplateSchema.partial();

// GET /api/v1/content-templates - Get content templates
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { organization_id } = (req as AuthenticatedRequest).user!;
    const { category, platform, search, limit = 50, offset = 0 } = req.query;

    const db = getFirestoreClient();
    let query = db
      .collection('content_templates')
      .where('organization_id', '==', organization_id);

    if (category && category !== 'all') {
      query = query.where('category', '==', category);
    }

    if (platform) {
      query = query.where('platforms', 'array-contains', platform);
    }

    const snapshot = await query
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string))
      .get();

    let templates = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    // Filter by search term if provided
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      templates = templates.filter(template =>
        template.title?.toLowerCase().includes(searchTerm) ||
        template.description?.toLowerCase().includes(searchTerm) ||
        template.content?.toLowerCase().includes(searchTerm) ||
        template.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm))
      );
    }

    res.json({
      success: true,
      data: {
        templates,
        total: templates.length
      }
    });
  } catch (error) {
    console.error('Error fetching content templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content templates'
    });
  }
});

// POST /api/v1/content-templates - Create content template
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { organization_id, id: user_id } = (req as AuthenticatedRequest).user!;
    const validatedData = createTemplateSchema.parse(req.body);

    const db = getFirestoreClient();
    const templateData = {
      ...validatedData,
      organization_id,
      created_by: user_id,
      uses: 0,
      rating: 0,
      rating_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const docRef = await db.collection('content_templates').add(templateData);

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...templateData
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
      return;
    }

    console.error('Error creating content template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create content template'
    });
  }
});

// GET /api/v1/content-templates/:id - Get specific template
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { organization_id } = (req as AuthenticatedRequest).user!;
    const { id } = req.params;

    const db = getFirestoreClient();
    const doc = await db.collection('content_templates').doc(id).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        error: 'Template not found'
      });
      return;
    }

    const templateData = doc.data()!;

    // Check if user has access to this template
    if (templateData.organization_id !== organization_id && !templateData.is_public) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: doc.id,
        ...templateData
      }
    });
  } catch (error) {
    console.error('Error fetching content template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content template'
    });
  }
});

// PUT /api/v1/content-templates/:id - Update template
router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { organization_id, id: user_id } = (req as AuthenticatedRequest).user!;
    const { id } = req.params;
    const validatedData = updateTemplateSchema.parse(req.body);

    const db = getFirestoreClient();
    const doc = await db.collection('content_templates').doc(id).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        error: 'Template not found'
      });
      return;
    }

    const templateData = doc.data()!;

    // Check if user has permission to update
    if (templateData.organization_id !== organization_id || templateData.created_by !== user_id) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    }

    const updateData = {
      ...validatedData,
      updated_at: new Date().toISOString()
    };

    await db.collection('content_templates').doc(id).update(updateData);

    res.json({
      success: true,
      data: {
        id,
        ...templateData,
        ...updateData
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
      return;
    }

    console.error('Error updating content template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update content template'
    });
  }
});

// DELETE /api/v1/content-templates/:id - Delete template
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { organization_id, id: user_id } = (req as AuthenticatedRequest).user!;
    const { id } = req.params;

    const db = getFirestoreClient();
    const doc = await db.collection('content_templates').doc(id).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        error: 'Template not found'
      });
      return;
    }

    const templateData = doc.data()!;

    // Check if user has permission to delete
    if (templateData.organization_id !== organization_id || templateData.created_by !== user_id) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    }

    await db.collection('content_templates').doc(id).delete();

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting content template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete content template'
    });
  }
});

// POST /api/v1/content-templates/:id/use - Track template usage
router.post('/:id/use', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { organization_id } = (req as AuthenticatedRequest).user!;
    const { id } = req.params;

    const db = getFirestoreClient();
    const doc = await db.collection('content_templates').doc(id).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        error: 'Template not found'
      });
      return;
    }

    const templateData = doc.data()!;

    // Check if user has access to this template
    if (templateData.organization_id !== organization_id && !templateData.is_public) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    }

    // Increment usage count
    await db.collection('content_templates').doc(id).update({
      uses: (templateData.uses || 0) + 1,
      updated_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Template usage tracked'
    });
  } catch (error) {
    console.error('Error tracking template usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track template usage'
    });
  }
});

export default router;
