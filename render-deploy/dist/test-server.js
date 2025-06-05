import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
// Load environment variables from backend/.env
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });
// Import services
import { initializeDatabase, initializeCollections } from './services/database.js';
// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
// Import working routes
import authRoutes from './routes/auth.js';
const app = express();
const PORT = process.env.PORT || 3001;
// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:8080",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Request logging
app.use(requestLogger);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        firebase_project: process.env.FIREBASE_PROJECT_ID || 'not configured'
    });
});
// API routes (only auth for now)
app.use('/api/v1/auth', authRoutes);
// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        path: req.path,
        method: req.method,
        available_endpoints: [
            'POST /api/v1/auth/register',
            'POST /api/v1/auth/login',
            'GET /api/v1/auth/me',
            'POST /api/v1/auth/logout',
            'POST /api/v1/auth/forgot-password'
        ]
    });
});
// Error handling middleware (must be last)
app.use(errorHandler);
// Initialize services and start server
async function startServer() {
    try {
        console.log('🚀 Starting VibeTribe Test Server...');
        // Initialize Firebase database connection
        await initializeDatabase();
        console.log('✅ Firebase database initialized successfully');
        // Initialize Firestore collections
        await initializeCollections();
        console.log('✅ Firestore collections initialized successfully');
        // Start server
        app.listen(PORT, () => {
            console.log('');
            console.log('🎉 VibeTribe Test Server is running!');
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🔗 API base URL: http://localhost:${PORT}/api/v1`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔥 Firebase Project: ${process.env.FIREBASE_PROJECT_ID}`);
            console.log('');
            console.log('📋 Available Endpoints:');
            console.log('  POST /api/v1/auth/register - Register new user');
            console.log('  POST /api/v1/auth/login - Login user');
            console.log('  GET /api/v1/auth/me - Get current user (requires auth)');
            console.log('  POST /api/v1/auth/logout - Logout user');
            console.log('');
            console.log('🧪 Test with curl:');
            console.log(`  curl http://localhost:${PORT}/health`);
            console.log('');
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
// Start the server
startServer();
export { app };
//# sourceMappingURL=test-server.js.map