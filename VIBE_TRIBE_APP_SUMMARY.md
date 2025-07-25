# Tribe - Social Media Management Platform

## 📋 Application Overview

**Tribe** is a comprehensive social media management platform that enables users to connect multiple social media accounts, create and schedule content, and manage their online presence from a unified dashboard.

### 🎯 Core Features

- **Multi-Platform Social Media Integration** (Twitter, LinkedIn, Instagram, Facebook)
- **Content Creation & Scheduling** with AI-powered assistance
- **Real-time Analytics & Performance Tracking**
- **Team Collaboration** with organization-based access control
- **Automated Content Publishing** with queue management
- **OAuth-based Social Account Connection**

## 🏗️ Technical Architecture

### Frontend (React)
- **Framework**: React 18 with TypeScript
- **UI Library**: Tailwind CSS with Radix UI components
- **State Management**: React Context + Custom hooks
- **Routing**: React Router with authentication guards
- **Build Tool**: Vite
- **Port**: 8080 (development), served via localhost
- **Deployment**: Netlify (production)

### Backend (Node.js/Express)
- **Framework**: Express.js with TypeScript
- **Database**: Firebase Firestore
- **Cache/Queue**: Redis for session management and job queues
- **Authentication**: JWT-based with Firebase Auth integration
- **File Storage**: Cloudinary for media uploads
- **Port**: 3001 (development), 10000 (production)

### Deployment
- **Production Backend**: Deployed on Render at `https://vibe-tribe-backend-8yvp.onrender.com`
- **Frontend**: Deployed on Netlify (production) + Local development (`localhost:8080`)
- **Database**: Firebase Firestore (cloud-hosted)
- **Cache**: Redis (cloud-hosted via Render)
- **Environment**: Base64-encoded credentials for secure deployment

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

#### Production (Render) - Base64 Encoded
```bash
# Core Application
NODE_ENV=production
PORT=10000
FRONTEND_URL=http://localhost:8080

# Base64 Encoded Credentials (PREFERRED for production)
FIREBASE_SERVICE_ACCOUNT_BASE64=ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAic29jaWFsbW0tYzBjMmQiLAogICJwcml2YXRlX2tleV9pZCI6ICJlYTFlYjY0N2QxODA2MmFmYWJmODkzN2NlYTNiMzM2ZTE0YzBjNjNlIiwKICAicHJpdmF0ZV9rZXkiOiAiLS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tXG5NSUlFdmdJQkFEQU5CZ2txaGtpRzl3MEJBUUVGQUFTQ0JLZ3dnZ1NrQWdFQUFvSUJBUUM5ZVhmNmtHTWlsWjFYXG4xcVlVaDFyZlpJN1IrK2FUY2srcmtZYW5rRldDUVN1NTY3QkxrQ2xmM1cyU2FWdFpUb2MxdUlWVkJDWmp5V2RLXG5WeXozL3NLNzc0cFhrN0ptUWhqangxVktzbVlwS3NqQ25lU3EyR0JqbVR2T3M1dDN4NEt5UzN1RkgvaEtBcFpDXG5WSjA4WkppOFgzTDlBUkJWYmpmcUhvOXBONlhzZjY0ZGJiRmFBcWVwc2NwRkxPUWpDU2srRHE2cWxNd0d1SnFIXG5mWFN0NWFrNldpS3hWczFwbk9nVXp0dTZ6Mi9EQ2ZNNXF0Sm9xZmVRb2RFV2M0ajYxbndIUzB6VlhqWjRrMXNPXG5LWjMyRkUwT2t4Q09UOW5lWlBjQisvQU1rV1J0bVdYZUNENHVobHhXbVFKNS9vMDFzUTg3QmlxSzNHcXVHVVZCXG5sZGVjMTIwZEFnTUJBQUVDZ2dFQUJFdDloM3p0Rkw5MXdWZFFzMVlnVWFhMnVxbCtQL2tTYXIraCtvSVZHaDZCXG5qL3Y0MmJUV1RhZnh1YVRYUEFBT2NYVHgyc1dqZGJ3WWNncVk3czJRemltc0g1RXQ5UndqdjJUVitQVFdsTEdiXG43aGFlRGhLL2NjcUUzT09wZFk2cGNEWGs2THZhNzJZajZiUG1BZTR5MHgzanhLRVk1TllOdEIxVEg4ZCtzV1kwXG5IaG9OamJTQVdBdE5DTG1sZlZKNDJQWGViU1VXODJzREtjVWdZa3ZzakZJMEJhenFqU2x3VDFVL1ZrZCtqWGRRXG5vWitiOWZuSXBaamxmUWt4VmlvejBrZ2lZOGM2QjJZYTUvclNQSGxkWU5NUmo5c2ZnYlZ1aTZNZDZlUnJHdHBRXG54K1pGSkJzb3psRjhqVlU4ZStMcGdsWUp5YmJoUDdNK2dUQTlWdU9CT1FLQmdRRHBvS2pHR2EyeWxNejU3MzdCXG4zNEw4UEJZODZLUmRsQWtReWhCK2JhNmlOZmI5S05YUll4WTdJbEJDYWcyaHZ0ZnY3ZkJaNFhERDhmTVd2QTFlXG40L1EzMElOVVF2RmRHa2R3Q3RER2RGdmlheDMzUkNpTjlSM0srZkl5T1lqTGMzaW1aYnh2VVBBamVpWER3V1ZDXG5EdEdicXZiVzdzUGVDQmZCaXFjNld4Y0VpUUtCZ1FEUG5tZGpQK2lvcFpqellhYlRIR01BSXdkUFVOSTI5UnZpXG5FK0k4K25iZDVHYzVLamVlenlJaTZ4dnJ6L0l1RkFEWk56S0IrV3pnNkFJN09OdmlzNlNNelAwZkYreUVJWkpGXG5BVFNaUjhSSDVqZWtDdjFlQkc0Wmttb1FPcnY3U1N1eGlPSGx6bTQ3UzNiZ3FXczRGcTcxbmplTEpEK0pPekM5XG5aVFVGcnBYbTlRS0JnSFJYYVRTZGZQNDlVNFh6V2ZBNTJnUzU5MmtGZ1RTSWo2c290T1lBd01KT2xWeWtoVFhzXG5YaG04a0xOQ0ZOL0RKYzE1ZEFPT1hKVjNXMUtxK3cyUi92LzhlaW52M0RvODUrNUh0SWZmVWhLQ3ZUMXhWN0M1XG5xOGgwaDhPekd3Z1Z6TE13WHBJZ2dEVnFrbnZWUnhPS1JaOTdsOGlZeGprL1ZuVXZFdS9naEtuaEFvR0JBS1JVXG5IRURTTkxSSFhlaEZRbVdWOGtZSmM1K3p1SzhIRWlxKzBqS3hpNlBWUkY1YXErdG14djRjV04wc21lTWVzZzA3XG5ReDdjN1BDV3NpMXRzNXliMDRJZVBicCtsUlYvL09YaExtQ2tEUmRiZ0c2MnhCUEdMZDdQcEdOMEdaV3JOSW93XG5iWndXNStqR3NqRGY1NTFkVnQzUmZPVUVxOFZTdENFMEdlT0ZhK0NCQW9HQkFPS2h4eW5XSEYyZWhjWElGaFN0XG5nVkYwdDRKT21sRU9qRzFjbmlPK0N2RU1UWjIxZXZkaGNBRVphMUI0TmJrZkdJQ3JRVW9rdG5iR2lXc3IvWVRUXG5WT2M5L1VLYlNrY0pwVjBPb1E4b2FEcURpeHpTc01VaFNZTW5xYkljOWNsYVVhT2t4VzRVZklmMmpFTysvNjZEXG4wTU1xei9BMnh4M2M1OU1udTBhamcvR2Jcbi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS1cbiIsCiAgImNsaWVudF9lbWFpbCI6ICJmaXJlYmFzZS1hZG1pbnNkay1mYnN2Y0Bzb2NpYWxtbS1jMGMyZC5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgImNsaWVudF9pZCI6ICIxMDIyNTkxMzg2OTA4ODU1Mzc5NzEiLAogICJhdXRoX3VyaSI6ICJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20vby9vYXV0aDIvYXV0aCIsCiAgInRva2VuX3VyaSI6ICJodHRwczovL29hdXRoMi5nb29nbGVhcGlzLmNvbS90b2tlbiIsCiAgImF1dGhfcHJvdmlkZXJfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLAogICJjbGllbnRfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9yb2JvdC92MS9tZXRhZGF0YS94NTA5L2ZpcmViYXNlLWFkbWluc2RrLWZic3ZjJTQwc29jaWFsbW0tYzBjMmQuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iCn0=

OAUTH_CREDENTIALS_BASE64=ewogICJUV0lUVEVSX0NMSUVOVF9JRCI6ICJNWGRrZWs5Q2IwbEJhbTR3YjFjMmIzcGFkbTA2TVRwamFRIiwKICAiVFdJVFRFUl9DTElFTlRfU0VDUkVUIjogIm9lNW1sTndwT0tHMlNkdkFXdEdjc2dBZmRHMFlHN2ZMV1FmSkN3aWxOVTV4UmRETHRpIiwKICAiVFdJVFRFUl9SRURJUkVDVF9VUkkiOiAiaHR0cHM6Ly9hYzNjNTgyZmU4YmIubmdyb2stZnJlZS5hcHAvYXBpL3YxL29hdXRoL3R3aXR0ZXIvY2FsbGJhY2siLAogICJMSU5LRURJTl9DTElFTlRfSUQiOiAiNzhycTkzdHd6bWQxYjkiLAogICJMSU5LRURJTl9DTElFTlRfU0VDUkVUIjogIldQTF9BUDEuZXB2MkdiVElxWFlBT0pOeS5BUm5JY1E9PSIsCiAgIkxJTktFRElOX1JFRElSRUNUX1VSSSI6ICJodHRwczovL2FjM2M1ODJmZThiYi5uZ3Jvay1mcmVlLmFwcC9hcGkvdjEvb2F1dGgvbGlua2VkaW4vY2FsbGJhY2siLAogICJGQUNFQk9PS19BUFBfSUQiOiAiMTA0MTA5Mjc1NDM0OTk4OCIsCiAgIkZBQ0VCT09LX0FQUF9TRUNSRVQiOiAiZWYwYWIwMWI4ZDY0MmRkMTNhMWFiMmE0NmNhNTdmODciLAogICJGQUNFQk9PS19SRURJUkVDVF9VUkkiOiAiaHR0cHM6Ly9hYzNjNTgyZmU4YmIubmdyb2stZnJlZS5hcHAvYXBpL3YxL29hdXRoL2ZhY2Vib29rL2NhbGxiYWNrIiwKICAiSU5TVEFHUkFNX0NMSUVOVF9JRCI6ICIxNzg0MTQ3NTUxMjI1MTg5NiIsCiAgIklOU1RBR1JBTV9DTElFTlRfU0VDUkVUIjogIjExMDBhNTMzNGU5YjI2MjI5MDFmMzM1NWEyYTc5NWI2IiwKICAiSU5TVEFHUkFNX1JFRElSRUNUX1VSSSI6ICJodHRwczovL2FjM2M1ODJmZThiYi5uZ3Jvay1mcmVlLmFwcC9hcGkvdjEvb2F1dGgvaW5zdGFncmFtL2NhbGxiYWNrIgp9

# Redis
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# Debug Mode (temporary)
OAUTH_DEBUG_MODE=true

# Email
SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=noreply@yourdomain.com

# AI
OPENAI_API_KEY=your-openai-key
```

#### Development - Individual Variables
```bash
# Use individual environment variables for local development
FIREBASE_PROJECT_ID=socialmm-c0c2d
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@socialmm-c0c2d.iam.gserviceaccount.com

TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
TWITTER_REDIRECT_URI=http://localhost:3001/api/v1/oauth/twitter/callback
```

## 🐛 Recent Issues & Solutions (July 2025)

### ✅ RESOLVED: OAuth Connection Failures
**Problem**: Users unable to connect social media accounts in production

**Root Causes Identified**:
1. **Rate Limiting**: OAuth initiate endpoint limited to only 5 attempts per 15 minutes
2. **Firebase Private Key**: Base64 encoding corruption causing ASN.1 parsing errors
3. **Environment Variables**: Missing or incorrect configuration

**Solutions Implemented**:
1. **Fixed Rate Limiting**: Increased OAuth initiate limit from 5 to 50 attempts per 15 minutes
2. **Fixed Firebase Private Key**: Enhanced Base64 decoding with proper newline handling and PEM validation
3. **Added Debug Mode**: `OAUTH_DEBUG_MODE=true` bypasses rate limiting for troubleshooting
4. **Enhanced Error Logging**: Better debugging for OAuth and Firebase initialization
5. **Improved Credential Generation**: Enhanced `generate-base64-credentials.js` script

### ✅ RESOLVED: Firebase Initialization Errors
**Problem**: "Too few bytes to read ASN.1 value" error on server startup

**Solutions**:
- Fixed private key formatting in Base64 service account parsing
- Added proper newline character handling (`\n` vs literal newlines)
- Enhanced PEM format validation (BEGIN/END markers)
- Improved error logging for debugging private key issues

### Current Status: 🟢 OPERATIONAL
- OAuth flows working correctly
- Firebase database connected successfully
- Redis cache operational
- All social media platforms ready for connection

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
- **Environment variable checker**: `node check-env.js`
- **Redis connection test**: `node check-redis.cjs`
- **Base64 credentials generator**: `node scripts/generate-base64-credentials.js`
- **OAuth debug endpoints**:
  - `/api/v1/oauth/debug/twitter-config` - Check Twitter configuration
  - `/api/v1/oauth/debug/test-oauth-initiate/twitter` - Test OAuth initiation
- **Comprehensive logging** throughout application with structured format

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

**Last Updated**: July 19, 2025
**Version**: 1.2.0
**Status**: ✅ Production Ready - OAuth & Firebase Issues Resolved
**Recent Fixes**: OAuth rate limiting, Firebase private key parsing, Base64 credential handling
