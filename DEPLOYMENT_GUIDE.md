# VibeTribe Deployment Guide

## 🎯 Overview

This guide covers the complete deployment process for the VibeTribe social media management platform, including frontend deployment to Netlify and backend deployment to Render.

## 🏗 Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Netlify)     │◄──►│   (Render)      │◄──►│  (Firebase)     │
│   React/Vite    │    │   Node.js/      │    │   Firestore     │
│                 │    │   Express       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN/Assets    │    │   Redis Cache   │    │   Cloudinary    │
│   (Netlify)     │    │   (Render)      │    │   (Media CDN)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Prerequisites

### Required Accounts

- **GitHub**: Source code repository
- **Netlify**: Frontend hosting
- **Render**: Backend hosting and Redis
- **Firebase**: Database and authentication
- **Cloudinary**: Media storage and optimization

### Required Tools

- Node.js 18+ and npm
- Git
- Firebase CLI (optional)
- Netlify CLI (optional)

## 🚀 Frontend Deployment (Netlify)

### Step 1: Prepare Frontend Build

1. **Environment Variables Setup**

```bash
# Create production environment file
cp .env.example .env.production

# Configure production variables
VITE_FIREBASE_API_KEY=your_production_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_production_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=https://your-backend-domain.onrender.com
VITE_WEBSOCKET_URL=https://your-backend-domain.onrender.com
```

2. **Build Configuration**

```bash
# Install dependencies
npm install

# Run production build
npm run build

# Verify build output
ls -la dist/
```

### Step 2: Netlify Configuration

1. **Create `netlify.toml`**

```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

2. **Deploy to Netlify**

**Option A: Automatic Deployment (Recommended)**

```bash
# Connect GitHub repository to Netlify
# 1. Login to Netlify dashboard
# 2. Click "New site from Git"
# 3. Choose GitHub and select repository
# 4. Configure build settings:
#    - Build command: npm run build
#    - Publish directory: dist
#    - Production branch: main
# 5. Add environment variables in Netlify dashboard
# 6. Deploys automatically when pushing to main branch
```

**Option B: Manual Deployment**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy site
netlify deploy --prod --dir=dist
```

### Step 3: Configure Environment Variables in Netlify

1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add all VITE\_ prefixed variables from your .env.production file
3. Redeploy the site to apply changes

### Step 4: Custom Domain Setup (Optional)

1. **Add Custom Domain**

   - Go to Domain Settings in Netlify
   - Add your custom domain
   - Configure DNS records as instructed

2. **SSL Certificate**
   - Netlify automatically provisions SSL certificates
   - Verify HTTPS is working

## 🖥 Backend Deployment (Render)

### Step 1: Prepare Backend for Deployment

1. **Environment Variables**

```bash
# Navigate to backend directory
cd backend

# Create production environment file
cp .env.example .env.production
```

2. **Configure Production Environment**

```env
# Server Configuration
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-netlify-domain.netlify.app

# Firebase Admin (Base64 encoded service account)
FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64_encoded_service_account

# JWT Configuration
JWT_SECRET=your_super_secure_production_jwt_secret
JWT_EXPIRES_IN=7d

# Redis Configuration (will be provided by Render)
REDIS_URL=redis://red-xxxxx:6379

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Social Media OAuth (Base64 encoded)
TWITTER_OAUTH_BASE64=your_base64_encoded_credentials
LINKEDIN_OAUTH_BASE64=your_base64_encoded_credentials
FACEBOOK_OAUTH_BASE64=your_base64_encoded_credentials
INSTAGRAM_OAUTH_BASE64=your_base64_encoded_credentials

# External Services
OPENAI_API_KEY=your_openai_api_key
SENDGRID_API_KEY=your_sendgrid_api_key
```

### Step 2: Create Render Configuration

1. **Create `render.yaml`**

```yaml
services:
  - type: web
    name: vibe-tribe-backend
    env: node
    region: oregon
    plan: starter
    buildCommand: npm run build
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
    scaling:
      minInstances: 1
      maxInstances: 3

  - type: redis
    name: vibe-tribe-redis
    region: oregon
    plan: starter
    maxmemoryPolicy: allkeys-lru
```

### Step 3: Deploy to Render

**Option A: GitHub Integration (Recommended)**

1. Connect GitHub repository to Render
2. Create new Web Service
3. Configure build and start commands
4. Set production branch to `main`
5. Add environment variables
6. Deploy automatically on git push to main branch

**Option B: Manual Deployment**

```bash
# Create deployment package
npm run build

# Create zip file for upload
zip -r vibe-tribe-backend.zip dist/ package.json package-lock.json

# Upload to Render dashboard
```

### Step 4: Redis Setup on Render

1. **Create Redis Instance**

   - Go to Render Dashboard
   - Create new Redis service
   - Choose appropriate plan
   - Note the Redis URL

2. **Update Backend Environment**
   - Add REDIS_URL to backend environment variables
   - Redeploy backend service

## 🔥 Firebase Configuration

### Step 1: Firebase Project Setup

1. **Create Firebase Project**

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Create new project or use existing
firebase projects:list
```

2. **Configure Firestore**

```bash
# Initialize Firestore
firebase firestore:rules

# Deploy security rules
firebase deploy --only firestore:rules
```

3. **Firestore Security Rules**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Organization-scoped access
    match /organizations/{orgId} {
      allow read, write: if request.auth != null &&
        resource.data.members[request.auth.uid] != null;
    }

    // Posts scoped to organization
    match /posts/{postId} {
      allow read, write: if request.auth != null &&
        exists(/databases/$(database)/documents/organizations/$(resource.data.organization_id)/members/$(request.auth.uid));
    }

    // Similar rules for other collections
    match /{document=**} {
      allow read, write: if false; // Deny by default
    }
  }
}
```

### Step 2: Service Account Setup

1. **Create Service Account**

   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Download JSON file

2. **Encode for Environment Variable**

```bash
# Convert service account to base64
base64 -i path/to/service-account.json | tr -d '\n'

# Add to environment variables as FIREBASE_SERVICE_ACCOUNT_BASE64
```

## ☁️ Cloudinary Configuration

### Step 1: Account Setup

1. **Create Cloudinary Account**

   - Sign up at cloudinary.com
   - Note your cloud name, API key, and API secret

2. **Configure Upload Presets**

```javascript
// Create upload preset for social media images
{
  "name": "social_media_posts",
  "unsigned": false,
  "folder": "social_posts",
  "transformation": [
    {"quality": "auto", "fetch_format": "auto"},
    {"width": 1200, "height": 630, "crop": "fill"}
  ]
}
```

### Step 2: Environment Configuration

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 🔐 OAuth Configuration

### Step 1: Social Media App Setup

**Twitter/X Developer Account**

1. Create developer account at developer.twitter.com
2. Create new app with OAuth 2.0 settings
3. Configure callback URLs
4. Note Client ID and Client Secret

**LinkedIn Developer**

1. Create app at developer.linkedin.com
2. Configure OAuth redirect URLs
3. Request necessary permissions
4. Note Client ID and Client Secret

**Facebook/Meta Developer**

1. Create app at developers.facebook.com
2. Configure Facebook Login product
3. Add Instagram Basic Display (for Instagram)
4. Note App ID and App Secret

### Step 2: Encode OAuth Credentials

```bash
# Create JSON object for each platform
echo '{"client_id":"your_id","client_secret":"your_secret","redirect_uri":"your_callback"}' | base64

# Add to environment variables
TWITTER_OAUTH_BASE64=encoded_credentials
LINKEDIN_OAUTH_BASE64=encoded_credentials
FACEBOOK_OAUTH_BASE64=encoded_credentials
INSTAGRAM_OAUTH_BASE64=encoded_credentials
```

## 🔍 Health Checks & Monitoring

### Step 1: Health Check Endpoints

```typescript
// Backend health check
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkFirestoreHealth(),
      redis: await checkRedisHealth(),
      queue: await checkQueueHealth(),
    },
  }

  res.json(health)
})
```

### Step 2: Monitoring Setup

1. **Render Monitoring**

   - Built-in metrics and logs
   - Custom health check configuration
   - Alert notifications

2. **Netlify Monitoring**
   - Build and deploy notifications
   - Form submissions monitoring
   - Analytics integration

## 🚨 Troubleshooting

### Common Deployment Issues

1. **Build Failures**

```bash
# Check Node.js version compatibility
node --version

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run build
```

2. **Environment Variable Issues**

```bash
# Verify environment variables are set
echo $VITE_API_URL

# Check for typos in variable names
# Ensure VITE_ prefix for frontend variables
```

3. **CORS Issues**

```bash
# Verify CORS_ORIGIN matches frontend domain
# Check for trailing slashes in URLs
# Ensure protocol (https/http) matches
```

4. **Database Connection Issues**

```bash
# Verify Firebase service account is valid
# Check Firestore security rules
# Ensure project ID matches
```

### Debug Commands

```bash
# Check backend logs
render logs --service=vibe-tribe-backend

# Check frontend build logs
netlify logs

# Test API endpoints
curl https://your-backend.onrender.com/health

# Test frontend
curl https://your-frontend.netlify.app
```

## 📊 Performance Optimization

### Frontend Optimization

1. **Build Optimization**

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
})
```

2. **Caching Strategy**

```toml
# netlify.toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=86400"
```

### Backend Optimization

1. **Redis Caching**

```typescript
// Cache frequently accessed data
const cacheKey = `user:${userId}`
const cached = await redis.get(cacheKey)
if (cached) return JSON.parse(cached)

const user = await getUserFromDatabase(userId)
await redis.setex(cacheKey, 3600, JSON.stringify(user))
```

2. **Database Optimization**

```typescript
// Use Firestore compound indexes
// Implement pagination for large datasets
// Cache query results in Redis
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main] # Deploys automatically when pushing to main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        run: |
          # Render auto-deploys on git push to main branch
          echo "Backend deployment triggered automatically"
```

## 📋 Post-Deployment Checklist

### Verification Steps

- [ ] Frontend loads correctly at production URL
- [ ] Backend health check returns 200 status
- [ ] User registration and login work
- [ ] Social media connections can be established
- [ ] Posts can be created and scheduled
- [ ] Media upload functionality works
- [ ] Real-time features (WebSocket) are functional
- [ ] Analytics data is being collected
- [ ] Email notifications are sent
- [ ] All environment variables are configured
- [ ] SSL certificates are active
- [ ] Custom domains are working (if configured)

### Performance Verification

- [ ] Frontend loads in under 3 seconds
- [ ] API responses are under 500ms
- [ ] Images load quickly via Cloudinary CDN
- [ ] Database queries are optimized
- [ ] Redis caching is working
- [ ] Background jobs are processing

### Security Verification

- [ ] HTTPS is enforced
- [ ] Security headers are present
- [ ] CORS is properly configured
- [ ] Rate limiting is active
- [ ] Input validation is working
- [ ] Authentication tokens are secure

## 🆘 Support & Maintenance

### Regular Maintenance Tasks

1. **Weekly**

   - Monitor application logs
   - Check error rates and performance
   - Review security alerts

2. **Monthly**

   - Update dependencies
   - Review and rotate API keys
   - Backup critical data

3. **Quarterly**
   - Security audit
   - Performance optimization review
   - Disaster recovery testing

### Emergency Procedures

1. **Service Outage**

   - Check service status pages
   - Review recent deployments
   - Rollback if necessary

2. **Security Incident**

   - Rotate compromised credentials
   - Review access logs
   - Notify affected users

3. **Data Issues**
   - Stop write operations if necessary
   - Restore from backups
   - Investigate root cause

For additional support, refer to the troubleshooting sections in the Frontend and Backend documentation files.
