import multer from 'multer';
export declare const upload: multer.Multer;
export declare const uploadToCloudinary: (file: any, organizationId: string, userId: string) => Promise<{
    url: string;
    publicId: string;
    resourceType: "image" | "video";
    format: string;
    width?: number;
    height?: number;
    duration?: number;
    bytes: number;
}>;
export declare const uploadMultipleToCloudinary: (files: any[], organizationId: string, userId: string) => Promise<Array<{
    url: string;
    publicId: string;
    resourceType: "image" | "video";
    format: string;
    width?: number;
    height?: number;
    duration?: number;
    bytes: number;
    originalName: string;
}>>;
export declare const deleteFromCloudinary: (publicId: string, resourceType?: "image" | "video") => Promise<void>;
export declare const getFileInfo: (publicId: string, resourceType?: "image" | "video") => Promise<{
    url: any;
    publicId: any;
    format: any;
    width: any;
    height: any;
    duration: any;
    bytes: any;
    createdAt: any;
}>;
export declare const generateOptimizedUrl: (publicId: string, options?: {
    width?: number;
    height?: number;
    crop?: "fill" | "fit" | "scale" | "crop" | "limit";
    quality?: "auto" | number;
    format?: "auto" | "jpg" | "png" | "webp";
}) => string;
export declare const validateCloudinaryConfig: () => boolean;
export declare const getUploadStats: (organizationId: string) => Promise<{
    totalStorage: any;
    totalTransformations: any;
    totalRequests: any;
    plan: any;
    lastUpdated: any;
}>;
//# sourceMappingURL=media.d.ts.map