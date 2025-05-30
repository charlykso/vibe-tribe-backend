# Netlify Environment Variables Setup Guide

## How to Configure Environment Variables in Netlify

### Step 1: Access Environment Variables Settings
1. Go to: https://app.netlify.com/projects/vibe-tribe-manager
2. Click on **"Site settings"**
3. In the left sidebar, click on **"Environment variables"**
4. Click **"Add a variable"** or **"Add environment variables"**

### Step 2: Add These Variables (Frontend Only - VITE_ prefixed)

**IMPORTANT**: Only add variables with `VITE_` prefix for frontend deployment.

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `VITE_FIREBASE_API_KEY` | `demo-api-key` | Replace with real Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `socialmm-c0c2d.firebaseapp.com` | Your Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | `socialmm-c0c2d` | Your Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `socialmm-c0c2d.appspot.com` | Your Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789` | Replace with real sender ID |
| `VITE_FIREBASE_APP_ID` | `1:123456789:web:abcdef123456` | Replace with real app ID |
| `VITE_API_URL` | `https://your-backend-url.com/api/v1` | **CHANGE THIS** to your backend URL |
| `VITE_WS_URL` | `wss://your-backend-url.com` | **CHANGE THIS** to your WebSocket URL |
| `VITE_NODE_ENV` | `production` | Set to production |

### Step 3: For Production Firebase (Replace Demo Values)

If you want to use real Firebase instead of demo values:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `socialmm-c0c2d`
3. Go to Project Settings > General
4. In "Your apps" section, find your web app
5. Copy the config values and replace the demo values above

### Step 4: Backend Deployment Required

**Important**: The current deployment only includes the frontend. For full functionality:

1. **Deploy the backend** separately (Heroku, Railway, Vercel, etc.)
2. **Update `VITE_API_URL`** to point to your deployed backend
3. **Update `VITE_WS_URL`** to point to your WebSocket server

### Step 5: After Adding Variables

1. Click **"Save"** in Netlify
2. Go to **"Deploys"** tab
3. Click **"Trigger deploy"** > **"Deploy site"**
4. Wait for the new build to complete

### Current Limitations (Until Backend is Deployed)

- ❌ User authentication (Firebase Auth works, but API calls will fail)
- ❌ Social media connections
- ❌ Post scheduling
- ❌ Media uploads
- ❌ Real-time features
- ✅ UI/UX navigation and components work

### Quick Copy-Paste for Netlify

```
VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_AUTH_DOMAIN=socialmm-c0c2d.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=socialmm-c0c2d
VITE_FIREBASE_STORAGE_BUCKET=socialmm-c0c2d.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_API_URL=https://your-backend-url.com/api/v1
VITE_WS_URL=wss://your-backend-url.com
VITE_NODE_ENV=production
```

**Remember**: Replace `your-backend-url.com` with your actual backend URL once deployed!
