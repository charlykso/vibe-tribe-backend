import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });
// Import services and middleware
import { initializeDatabase, initializeCollections } from './services/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
// Create a minimal Express app for testing auth
const app = express();
const PORT = process.env.PORT || 3001;
// Basic middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        firebase_project: process.env.FIREBASE_PROJECT_ID || 'not configured',
        environment: process.env.NODE_ENV || 'development'
    });
});
// Simple auth endpoints for testing
app.post('/api/v1/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        // Basic validation
        if (!email || !password || !name) {
            return res.status(400).json({
                error: 'Missing required fields: email, password, name'
            });
        }
        // Simulate user registration (without actual auth logic for testing)
        const userData = {
            email,
            name,
            created_at: new Date(),
            is_active: true,
            role: 'user'
        };
        res.status(201).json({
            success: true,
            message: 'User registration endpoint working',
            user: userData
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Registration failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.post('/api/v1/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                error: 'Missing required fields: email, password'
            });
        }
        // Simulate login response
        res.status(200).json({
            success: true,
            message: 'Login endpoint working',
            token: 'test-jwt-token',
            user: {
                email,
                name: 'Test User',
                role: 'user'
            }
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Login failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// 404 handler
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        path: req.path,
        method: req.method
    });
});
// Error handling middleware
app.use(errorHandler);
// Start server function
async function startTestServer() {
    try {
        console.log('🚀 Starting Firebase Auth Test Server...');
        console.log('');
        // Initialize Firebase
        await initializeDatabase();
        console.log('✅ Firebase database initialized');
        await initializeCollections();
        console.log('✅ Firestore collections initialized');
        console.log('');
        // Start server
        const server = app.listen(PORT, () => {
            console.log('🎉 Firebase Auth Test Server is running!');
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🔗 API base URL: http://localhost:${PORT}/api/v1`);
            console.log(`🔥 Firebase Project: ${process.env.FIREBASE_PROJECT_ID}`);
            console.log('');
            console.log('📋 Test Endpoints:');
            console.log('  POST /api/v1/auth/register - Test user registration');
            console.log('  POST /api/v1/auth/login - Test user login');
            console.log('');
            console.log('🧪 Test Commands:');
            console.log('  # Health check');
            console.log(`  curl http://localhost:${PORT}/health`);
            console.log('');
            console.log('  # Test registration');
            console.log(`  curl -X POST http://localhost:${PORT}/api/v1/auth/register \\`);
            console.log('    -H "Content-Type: application/json" \\');
            console.log('    -d \'{"email":"test@example.com","password":"password123","name":"Test User"}\'');
            console.log('');
            console.log('  # Test login');
            console.log(`  curl -X POST http://localhost:${PORT}/api/v1/auth/login \\`);
            console.log('    -H "Content-Type: application/json" \\');
            console.log('    -d \'{"email":"test@example.com","password":"password123"}\'');
            console.log('');
            console.log('Press Ctrl+C to stop the server');
        });
        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received, shutting down gracefully');
            server.close(() => {
                process.exit(0);
            });
        });
        process.on('SIGINT', () => {
            console.log('SIGINT received, shutting down gracefully');
            server.close(() => {
                process.exit(0);
            });
        });
    }
    catch (error) {
        console.error('❌ Failed to start test server:', error);
        process.exit(1);
    }
}
// Start the server
startTestServer();
export { app };
//# sourceMappingURL=auth-test.js.map