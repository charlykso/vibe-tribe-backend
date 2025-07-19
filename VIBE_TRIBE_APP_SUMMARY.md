# Vibe Tribe - Social Media Management Platform

## 📋 Application Overview

**Vibe Tribe** is a comprehensive social media management platform that enables users to connect multiple social media accounts, create and schedule content, and manage their online presence from a unified dashboard.

### 🎯 Core Features

- **Multi-Platform Social Media Integration** (Twitter, LinkedIn, Instagram, Facebook)
- **Content Creation & Scheduling** with AI-powered assistance
- **Real-time Analytics & Performance Tracking**
- **Team Collaboration** with organization-based access control
- **Automated Content Publishing** with queue management
- **OAuth-based Social Account Connection**

## 🏗️ Technical Architecture

### Frontend (Vue.js)
- **Framework**: Vue 3 with Composition API
- **UI Library**: Tailwind CSS with custom components
- **State Management**: Pinia stores
- **Routing**: Vue Router with authentication guards
- **Build Tool**: Vite
- **Port**: 8080 (development), served via localhost

### Backend (Node.js/Express)
- **Framework**: Express.js with TypeScript
- **Database**: Firebase Firestore
- **Cache/Queue**: Redis for session management and job queues
- **Authentication**: JWT-based with Firebase Auth integration
- **File Storage**: Cloudinary for media uploads
- **Port**: 3001 (development), 10000 (production)

### Deployment
- **Production Backend**: Deployed on Render at `https://vibe-tribe-backend-8yvp.onrender.com`
- **Frontend**: Runs locally on `localhost:8080`
- **Database**: Firebase Firestore (cloud-hosted)
- **Cache**: Redis (cloud-hosted via Render)

## 🔐 Authentication & Security

### OAuth Integration
- **Twitter OAuth 2.0** with PKCE flow
- **LinkedIn OAuth 2.0**
- **Instagram Basic Display API**
- **Facebook Graph API**

### Security Features
- JWT token-based authentication
- Rate limiting on API endpoints
- CORS protection
- Helmet.js security headers
- OAuth state validation with Redis storage
- Input validation with Joi/Zod schemas

## 📊 Database Schema

### Core Collections (Firestore)
- **users**: User profiles and authentication data
- **organizations**: Team/company data
- **social_accounts**: Connected social media accounts
- **posts**: Content posts and scheduling data
- **analytics**: Performance metrics and insights
- **audit_logs**: Security and activity logging

## 🚀 Key Workflows

### 1. User Registration & Setup
1. User signs up via email/password
2. Creates or joins an organization
3. Completes profile setup
4. Accesses dashboard

### 2. Social Account Connection
1. User clicks "Connect" for a platform
2. OAuth flow initiates with secure state generation
3. User authorizes on social platform
4. Callback processes tokens and saves account
5. Account appears in connected platforms list

### 3. Content Creation & Publishing
1. User creates post content (text, images, videos)
2. Selects target platforms and accounts
3. Schedules publication time (optional)
4. Content queued for processing
5. Background job publishes to platforms
6. Analytics tracking begins

## 🔧 Environment Configuration

### Required Environment Variables
```bash
# Core Application
NODE_ENV=production
PORT=10000
FRONTEND_URL=http://localhost:8080

# Database
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=base64-encoded-key
FIREBASE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com

# Redis
REDIS_URL=redis://localhost:6379

# OAuth - Twitter
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
TWITTER_REDIRECT_URI=https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/twitter/callback

# OAuth - LinkedIn
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_REDIRECT_URI=https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/linkedin/callback

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# Email
SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=noreply@yourdomain.com

# AI
OPENAI_API_KEY=your-openai-key
```

## 🐛 Current Issues & Solutions

### OAuth Connection Failures
**Problem**: Users unable to connect social media accounts in production

**Root Causes Identified**:
1. **Redis Connection Issues**: OAuth state storage failing
2. **Rate Limiting**: Aggressive rate limits blocking OAuth requests
3. **Error Handling**: Poor error responses causing confusion
4. **Environment Variables**: Missing or incorrect configuration

**Solutions Implemented**:
1. Added Redis fallback handling for production
2. Enhanced error logging and debugging
3. Improved OAuth callback error handling
4. Created environment variable validation script
5. Better error messages and user feedback

### Rate Limiting Issues
**Problem**: API requests being blocked by rate limiting

**Solutions**:
- Adjusted rate limits for production environment
- Added environment-specific rate limit configuration
- Implemented proper rate limit headers
- Added bypass mechanisms for OAuth flows

## 📁 Project Structure

```
vibe-tribe/
├── src/                          # Frontend Vue.js application
│   ├── components/              # Reusable UI components
│   ├── views/                   # Page components
│   ├── stores/                  # Pinia state management
│   ├── lib/                     # Utilities and services
│   └── assets/                  # Static assets
├── backend/                     # Backend Node.js application
│   ├── src/
│   │   ├── routes/             # API route handlers
│   │   ├── services/           # Business logic services
│   │   ├── middleware/         # Express middleware
│   │   ├── types/              # TypeScript type definitions
│   │   └── utils/              # Utility functions
│   └── dist/                   # Compiled JavaScript
├── render-deploy/              # Production deployment files
└── docs/                       # Documentation
```

## 🔄 Development Workflow

### Local Development
1. **Frontend**: `npm run dev` (port 8080)
2. **Backend**: `npm run dev` (port 3001)
3. **Database**: Firebase Firestore (cloud)
4. **Cache**: Local Redis instance

### Production Deployment
1. **Backend**: Auto-deployed to Render on push
2. **Frontend**: Served locally (connects to production backend)
3. **Environment**: All secrets configured in Render dashboard

## 📈 Monitoring & Analytics

### Application Monitoring
- Console logging with structured format
- Error tracking and audit logs
- Performance metrics collection
- OAuth flow debugging

### Social Media Analytics
- Post performance tracking
- Engagement metrics
- Audience insights
- Platform-specific analytics

## 🛠️ Troubleshooting

### Common Issues
1. **OAuth Failures**: Check environment variables and Redis connection
2. **Rate Limiting**: Verify rate limit configuration
3. **Database Errors**: Confirm Firebase credentials
4. **CORS Issues**: Check frontend/backend URL configuration

### Debug Tools
- Environment variable checker: `node check-env.js`
- Redis connection test: `node check-redis.cjs`
- OAuth flow debugging endpoints available
- Comprehensive logging throughout application

## 🚀 Future Enhancements

### Planned Features
- Instagram and Facebook integration completion
- Advanced scheduling with timezone support
- Team collaboration features
- Advanced analytics dashboard
- Mobile application
- API rate limit optimization
- Enhanced content creation tools

### Technical Improvements
- Microservices architecture migration
- Enhanced caching strategies
- Real-time notifications
- Advanced security features
- Performance optimizations

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Production Ready with ongoing improvements
