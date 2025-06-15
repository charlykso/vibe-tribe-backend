import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { upload, uploadToCloudinary, uploadMultipleToCloudinary, deleteFromCloudinary, generateOptimizedUrl, getUploadStats, validateCloudinaryConfig } from '../services/media.js';
import { asyncHandler, ValidationError, BadRequestError } from '../middleware/errorHandler.js';
import { requireOrganization } from '../middleware/auth.js';
const router = Router();
// Apply organization requirement to all routes
router.use(requireOrganization);
// Validation schemas
const deleteMediaSchema = z.object({
    publicId: z.string().min(1, 'Public ID is required'),
    resourceType: z.enum(['image', 'video']).default('image')
});
const optimizeUrlSchema = z.object({
    publicId: z.string().min(1, 'Public ID is required'),
    width: z.number().min(1).max(4096).optional(),
    height: z.number().min(1).max(4096).optional(),
    crop: z.enum(['fill', 'fit', 'scale', 'crop', 'limit']).default('limit'),
    quality: z.union([z.literal('auto'), z.number().min(1).max(100)]).default('auto'),
    format: z.enum(['auto', 'jpg', 'png', 'webp']).default('auto')
});
// Check Cloudinary configuration
if (!validateCloudinaryConfig()) {
    console.error('❌ Cloudinary is not properly configured. Media upload will not work.');
}
// POST /api/v1/media/upload - Single file upload
router.post('/upload', upload.single('file'), asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new BadRequestError('No file provided');
    }
    try {
        const result = await uploadToCloudinary(req.file, req.user.organization_id, req.user.id);
        res.status(201).json({
            message: 'File uploaded successfully',
            file: {
                url: result.url,
                publicId: result.publicId,
                resourceType: result.resourceType,
                format: result.format,
                width: result.width,
                height: result.height,
                duration: result.duration,
                size: result.bytes,
                originalName: req.file.originalname
            }
        });
    }
    catch (error) {
        console.error('❌ Upload error:', error);
        throw new BadRequestError(error instanceof Error ? error.message : 'Failed to upload file');
    }
}));
// POST /api/v1/media/upload-multiple - Multiple file upload
router.post('/upload-multiple', upload.array('files', 10), asyncHandler(async (req, res) => {
    const files = req.files;
    if (!files || files.length === 0) {
        throw new BadRequestError('No files provided');
    }
    try {
        const results = await uploadMultipleToCloudinary(files, req.user.organization_id, req.user.id);
        res.status(201).json({
            message: `${results.length} files uploaded successfully`,
            files: results.map(result => ({
                url: result.url,
                publicId: result.publicId,
                resourceType: result.resourceType,
                format: result.format,
                width: result.width,
                height: result.height,
                duration: result.duration,
                size: result.bytes,
                originalName: result.originalName
            }))
        });
    }
    catch (error) {
        console.error('❌ Multiple upload error:', error);
        throw new BadRequestError(error instanceof Error ? error.message : 'Failed to upload files');
    }
}));
// DELETE /api/v1/media/:publicId - Delete file
router.delete('/:publicId', asyncHandler(async (req, res) => {
    const validation = deleteMediaSchema.safeParse({
        publicId: req.params.publicId,
        resourceType: req.query.resourceType
    });
    if (!validation.success) {
        throw new ValidationError('Validation failed', validation.error.errors);
    }
    const { publicId, resourceType } = validation.data;
    try {
        await deleteFromCloudinary(publicId, resourceType);
        res.json({
            message: 'File deleted successfully',
            publicId
        });
    }
    catch (error) {
        console.error('❌ Delete error:', error);
        throw new BadRequestError(error instanceof Error ? error.message : 'Failed to delete file');
    }
}));
// POST /api/v1/media/optimize-url - Generate optimized URL
router.post('/optimize-url', asyncHandler(async (req, res) => {
    const validation = optimizeUrlSchema.safeParse(req.body);
    if (!validation.success) {
        throw new ValidationError('Validation failed', validation.error.errors);
    }
    const { publicId, width, height, crop, quality, format } = validation.data;
    try {
        const optimizedUrl = generateOptimizedUrl(publicId, {
            width,
            height,
            crop,
            quality,
            format
        });
        res.json({
            originalPublicId: publicId,
            optimizedUrl,
            transformations: {
                width,
                height,
                crop,
                quality,
                format
            }
        });
    }
    catch (error) {
        console.error('❌ URL optimization error:', error);
        throw new BadRequestError(error instanceof Error ? error.message : 'Failed to generate optimized URL');
    }
}));
// GET /api/v1/media/stats - Get upload statistics
router.get('/stats', asyncHandler(async (req, res) => {
    try {
        const stats = await getUploadStats(req.user.organization_id);
        res.json({
            stats: {
                storage: {
                    used: stats.totalStorage,
                    unit: 'bytes'
                },
                transformations: {
                    used: stats.totalTransformations,
                    unit: 'count'
                },
                requests: {
                    used: stats.totalRequests,
                    unit: 'count'
                },
                plan: stats.plan,
                lastUpdated: stats.lastUpdated
            }
        });
    }
    catch (error) {
        console.error('❌ Stats error:', error);
        throw new BadRequestError(error instanceof Error ? error.message : 'Failed to get upload statistics');
    }
}));
// GET /api/v1/media/config - Get upload configuration
router.get('/config', asyncHandler(async (req, res) => {
    res.json({
        config: {
            maxFileSize: {
                image: 10 * 1024 * 1024, // 10MB
                video: 100 * 1024 * 1024, // 100MB
            },
            allowedTypes: {
                image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
                video: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm']
            },
            maxFiles: 10,
            cloudinaryConfigured: validateCloudinaryConfig()
        }
    });
}));
// Error handling for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large',
                message: 'File size exceeds the maximum allowed limit'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                error: 'Too many files',
                message: 'Maximum 10 files allowed per upload'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                error: 'Unexpected file field',
                message: 'File field name is not allowed'
            });
        }
    }
    if (error.message && error.message.includes('File type')) {
        return res.status(400).json({
            error: 'Invalid file type',
            message: error.message
        });
    }
    next(error);
});
export default router;
//# sourceMappingURL=media.js.map