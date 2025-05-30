import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// File type validation
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

// Multer configuration for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: any, cb: multer.FileFilterCallback) => {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}`));
    return;
  }

  // Check file size
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype);

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    cb(new Error(`Image file size must be less than ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`));
    return;
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    cb(new Error(`Video file size must be less than ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`));
    return;
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_VIDEO_SIZE, // Use the larger limit
    files: 10, // Maximum 10 files per upload
  },
});

// Upload file to Cloudinary
export const uploadToCloudinary = async (
  file: any,
  organizationId: string,
  userId: string
): Promise<{
  url: string;
  publicId: string;
  resourceType: 'image' | 'video';
  format: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
}> => {
  try {
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype);
    const resourceType = isVideo ? 'video' : 'image';

    // Generate folder structure: vibetribe/{organizationId}/{userId}/{year}/{month}
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const folder = `vibetribe/${organizationId}/${userId}/${year}/${month}`;

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.originalname);
    const filename = `${timestamp}_${randomString}${extension}`;

    const uploadOptions: any = {
      resource_type: resourceType,
      folder,
      public_id: filename,
      overwrite: false,
      unique_filename: true,
    };

    // Image-specific optimizations
    if (resourceType === 'image') {
      uploadOptions.transformation = [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
        { width: 2048, height: 2048, crop: 'limit' }, // Limit max dimensions
      ];
    }

    // Video-specific optimizations
    if (resourceType === 'video') {
      uploadOptions.transformation = [
        { quality: 'auto:good' },
        { width: 1920, height: 1080, crop: 'limit' }, // Limit max dimensions
      ];
    }

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(file.buffer);
    });

    console.log(`✅ File uploaded to Cloudinary: ${result.secure_url}`);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType,
      format: result.format,
      width: result.width,
      height: result.height,
      duration: result.duration,
      bytes: result.bytes,
    };

  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Upload multiple files
export const uploadMultipleToCloudinary = async (
  files: any[],
  organizationId: string,
  userId: string
): Promise<Array<{
  url: string;
  publicId: string;
  resourceType: 'image' | 'video';
  format: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
  originalName: string;
}>> => {
  const uploadPromises = files.map(async (file) => {
    const result = await uploadToCloudinary(file, organizationId, userId);
    return {
      ...result,
      originalName: file.originalname,
    };
  });

  return Promise.all(uploadPromises);
};

// Delete file from Cloudinary
export const deleteFromCloudinary = async (publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<void> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

    if (result.result === 'ok') {
      console.log(`✅ File deleted from Cloudinary: ${publicId}`);
    } else {
      console.warn(`⚠️ File deletion result: ${result.result} for ${publicId}`);
    }
  } catch (error) {
    console.error('❌ Cloudinary deletion error:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get file info from Cloudinary
export const getFileInfo = async (publicId: string, resourceType: 'image' | 'video' = 'image') => {
  try {
    const result = await cloudinary.api.resource(publicId, { resource_type: resourceType });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      duration: result.duration,
      bytes: result.bytes,
      createdAt: result.created_at,
    };
  } catch (error) {
    console.error('❌ Error getting file info:', error);
    throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Generate optimized URLs for different use cases
export const generateOptimizedUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'limit';
    quality?: 'auto' | number;
    format?: 'auto' | 'jpg' | 'png' | 'webp';
  } = {}
): string => {
  const {
    width,
    height,
    crop = 'limit',
    quality = 'auto',
    format = 'auto',
  } = options;

  const transformations: string[] = [];

  if (width || height) {
    const dimensions = [
      width && `w_${width}`,
      height && `h_${height}`,
      `c_${crop}`,
    ].filter(Boolean).join(',');
    transformations.push(dimensions);
  }

  transformations.push(`q_${quality}`);
  transformations.push(`f_${format}`);

  const transformationString = transformations.join('/');

  return cloudinary.url(publicId, {
    transformation: transformationString,
    secure: true,
  });
};

// Validate Cloudinary configuration
export const validateCloudinaryConfig = (): boolean => {
  const requiredEnvVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error(`❌ Missing Cloudinary environment variables: ${missingVars.join(', ')}`);
    return false;
  }

  return true;
};

// Get upload statistics
export const getUploadStats = async (organizationId: string) => {
  try {
    // Get usage statistics from Cloudinary
    const result = await cloudinary.api.usage();

    return {
      totalStorage: result.storage.usage,
      totalTransformations: result.transformations.usage,
      totalRequests: result.requests.usage,
      plan: result.plan,
      lastUpdated: result.last_updated,
    };
  } catch (error) {
    console.error('❌ Error getting upload stats:', error);
    throw new Error(`Failed to get upload stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
