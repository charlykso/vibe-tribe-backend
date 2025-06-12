# SocialTribe Deployment Guide

## 🚀 Base64 Credential System & Deployment Instructions

This guide explains how to deploy SocialTribe with the flexible Base64 credential system that supports both development and production environments.

## 📋 Table of Contents

- [Overview](#overview)
- [Credential Loading Priority](#credential-loading-priority)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Base64 Credential Generator](#base64-credential-generator)
- [Environment Verification](#environment-verification)
- [OAuth Configuration](#oauth-configuration)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

SocialTribe uses a smart credential loading system that prioritizes individual environment variables for development and falls back to Base64 encoded credentials for secure production deployment.

### Supported Platforms
- **Frontend**: Netlify
- **Backend**: Render
- **Database**: Firebase Firestore
- **OAuth**: Twitter, LinkedIn, Facebook, Instagram

## 🔄 Credential Loading Priority

The system follows this priority order:

1. **Individual Environment Variables** (Preferred for development)
2. **Base64 Encoded Credentials** (Preferred for production)
3. **Error** (If neither is available)

### How It Works

| Scenario | Individual Vars | Base64 Available | Result |
|----------|----------------|------------------|---------|
| **Development** | ✅ Complete | ❌ Not set | ✅ Uses individual vars |
| **Production** | ❌ Missing | ✅ Available | 🔄 Uses Base64 fallback |
| **Hybrid** | ⚠️ Partial | ✅ Available | 🔄 Uses Base64 + individual |
| **Error** | ❌ Missing | ❌ Not available | ❌ Configuration error |

## 🛠️ Development Setup

### 1. Individual Environment Variables

Create `backend/.env` with individual variables:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com

# OAuth Credentials
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
TWITTER_REDIRECT_URI=https://your-backend.onrender.com/api/v1/oauth/twitter/callback

LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_REDIRECT_URI=https://your-backend.onrender.com/api/v1/oauth/linkedin/callback

FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_REDIRECT_URI=https://your-backend.onrender.com/api/v1/oauth/facebook/callback

INSTAGRAM_CLIENT_ID=your-instagram-client-id
INSTAGRAM_CLIENT_SECRET=your-instagram-client-secret
INSTAGRAM_REDIRECT_URI=https://your-backend.onrender.com/api/v1/oauth/instagram/callback

# Other Configuration
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=https://your-frontend.netlify.app
FRONTEND_URL=https://your-frontend.netlify.app
```

### 2. Start Development

```bash
npm run dev:full  # Starts both frontend and backend
```

## 🚀 Production Deployment

### Step 1: Generate Base64 Credentials

```bash
npm run generate-base64
```

This creates `deployment-credentials.env` with Base64 encoded credentials:

```env
# OAuth Credentials (Base64)
OAUTH_CREDENTIALS_BASE64=ewogICJUV0lUVEVSX0NM...

# Firebase Service Account (Base64)
FIREBASE_SERVICE_ACCOUNT_BASE64=ewogICJ0eXBlIjogInNlcn...
```

### Step 2: Deploy Backend to Render

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy with Base64 credentials"
   git push
   ```

2. **Configure Render Environment**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Find your backend service
   - Go to "Environment" tab
   - Add the Base64 variables:
     ```
     OAUTH_CREDENTIALS_BASE64=ewogICJUV0lUVEVSX0NM...
     FIREBASE_SERVICE_ACCOUNT_BASE64=ewogICJ0eXBlIjogInNlcn...
     ```

3. **Add Other Required Variables**:
   ```
   NODE_ENV=production
   JWT_SECRET=your-production-jwt-secret
   CORS_ORIGIN=https://your-frontend.netlify.app
   FRONTEND_URL=https://your-frontend.netlify.app
   PORT=3001
   ```

### Step 3: Deploy Frontend to Netlify

```bash
npm run build
npm run deploy:netlify
```

Or use the deployment script:
```bash
node deploy-netlify.cjs
```

## 🔧 Base64 Credential Generator

### Usage

```bash
npm run generate-base64
```

### What It Does

1. **Reads** your current `.env` file
2. **Generates** Base64 encoded versions of:
   - OAuth credentials (all platforms)
   - Firebase service account
3. **Creates** `deployment-credentials.env` file
4. **Displays** the Base64 strings for copying

### Output Example

```
🔐 OAuth Credentials Base64:
OAUTH_CREDENTIALS_BASE64=ewogICJUV0lUVEVSX0NM...

🔐 Firebase Service Account Base64:
FIREBASE_SERVICE_ACCOUNT_BASE64=ewogICJ0eXBlIjogInNlcn...
```

## 🔍 Environment Verification

### Environment Check Tool

Open `test-render-env.html` in your browser or visit the deployed version to check:

1. **Backend Health**: Verify the backend is running
2. **Environment Variables**: Check which credentials are loaded
3. **OAuth Endpoints**: Test OAuth callback accessibility

### API Endpoints

```bash
# Health check
curl https://your-backend.onrender.com/health

# Environment check (with debug token)
curl -H "X-Debug-Token: check-env-vars-2024" \
     https://your-backend.onrender.com/env-check
```

### Expected Output

```json
{
  "firebase": {
    "status": "✅ Using individual variables"
  },
  "oauth": {
    "status": "✅ Using individual variables"
  }
}
```

## 🔐 OAuth Configuration

### Required Callback URLs

Update these in each platform's developer console:

| Platform | Callback URL |
|----------|-------------|
| **Twitter** | `https://your-backend.onrender.com/api/v1/oauth/twitter/callback` |
| **LinkedIn** | `https://your-backend.onrender.com/api/v1/oauth/linkedin/callback` |
| **Facebook** | `https://your-backend.onrender.com/api/v1/oauth/facebook/callback` |
| **Instagram** | `https://your-backend.onrender.com/api/v1/oauth/instagram/callback` |

### Platform-Specific Instructions

#### Twitter
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. App Settings → Authentication Settings
3. Update "Callback URLs"

#### LinkedIn
1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Your App → Auth tab
3. Update "Authorized redirect URLs"

#### Facebook
1. Go to [Facebook Developer Portal](https://developers.facebook.com/apps)
2. Facebook Login → Settings
3. Update "Valid OAuth Redirect URIs"

#### Instagram
1. Go to [Facebook Developer Portal](https://developers.facebook.com/apps)
2. Instagram Basic Display → Basic Display
3. Update "Valid OAuth Redirect URIs"

## 🔧 Troubleshooting

### Common Issues

#### 1. OAuth Redirect URI Mismatch
**Error**: "The redirect_uri does not match the registered value"
**Solution**: Update callback URLs in platform developer consoles

#### 2. Missing Environment Variables
**Error**: "Missing Firebase configuration"
**Solution**: Check environment variables are set correctly

#### 3. Base64 Decoding Errors
**Error**: "Failed to parse Base64 credentials"
**Solution**: Regenerate Base64 credentials with `npm run generate-base64`

### Debug Commands

```bash
# Check environment variables
npm run generate-base64

# Test backend health
curl https://your-backend.onrender.com/health

# Check OAuth endpoints
curl https://your-backend.onrender.com/api/v1/oauth/twitter/callback?test=true
```

### Log Analysis

Check Render logs for credential loading messages:
- `✅ Using individual Firebase environment variables`
- `✅ Using Base64 encoded OAuth credentials`
- `🔄 Attempting to load Base64 encoded OAuth credentials...`

## 🔒 Security Notes

1. **Keep Base64 values secure** - treat them like passwords
2. **Don't commit** `deployment-credentials.env` to version control
3. **Use Base64 only for deployment** - individual vars are fine for development
4. **Rotate credentials regularly** in production
5. **Use environment-specific secrets** for JWT and other sensitive data

## 📞 Support

If you encounter issues:
1. Check the environment verification tool
2. Review Render deployment logs
3. Verify OAuth callback URLs are updated
4. Regenerate Base64 credentials if needed

---

**Happy Deploying! 🚀**
