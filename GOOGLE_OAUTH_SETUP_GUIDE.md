# 🔧 Google OAuth Setup Guide for Vibe Tribe

This guide will walk you through setting up Google OAuth credentials for the Vibe Tribe application to enable Google Sign-In functionality.

## Prerequisites

- Access to Google Cloud Console
- Access to Render dashboard (for backend deployment)
- Backend code deployed to Render

## Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** (or select existing one):
   - Click the project dropdown at the top
   - Click "New Project"
   - Name: `Vibe Tribe` or similar
   - Click "Create"

## Step 2: Enable Required APIs

1. **Go to APIs & Services** → **Library**
2. **Search and enable these APIs**:
   - **Google+ API** (for user profile access)
   - **People API** (alternative for user info)

## Step 3: Configure OAuth Consent Screen

1. **Go to APIs & Services** → **OAuth consent screen**
2. **Choose "External"** (unless you have Google Workspace)
3. **Fill out the required fields**:
   ```
   App name: Vibe Tribe
   User support email: your-email@domain.com
   Developer contact: your-email@domain.com
   ```
4. **Add scopes** (click "Add or Remove Scopes"):
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`
5. **Add test users** (your email and any test accounts)
6. **Save and Continue** through all steps

## Step 4: Create OAuth 2.0 Credentials

1. **Go to APIs & Services** → **Credentials**
2. **Click "Create Credentials"** → **OAuth 2.0 Client ID**
3. **Choose "Web application"**
4. **Configure the settings**:
   ```
   Name: Vibe Tribe Web Client
   
   Authorized JavaScript origins:
   - https://vibe-tribe-manager.netlify.app
   - http://localhost:8080 (for development)
   
   Authorized redirect URIs:
   - https://vibe-tribe-backend-8yvp.onrender.com/api/v1/auth/google/callback
   - http://localhost:3001/api/v1/auth/google/callback (for development)
   ```
5. **Click "Create"**

## Step 5: Copy Your Credentials

You'll get a popup with:
- **Client ID**: Something like `123456789-abcdef.apps.googleusercontent.com`
- **Client Secret**: Something like `GOCSPX-abcdef123456`

**⚠️ Keep these safe and never commit them to git!**

## Step 6: Add Credentials to Render

1. **Go to your Render dashboard**: https://dashboard.render.com
2. **Find your backend service** (vibe-tribe-backend-8yvp)
3. **Go to "Environment"** tab
4. **Add these environment variables**:

```bash
GOOGLE_CLIENT_ID=your-client-id-from-step-5
GOOGLE_CLIENT_SECRET=your-client-secret-from-step-5
GOOGLE_REDIRECT_URI=https://vibe-tribe-backend-8yvp.onrender.com/api/v1/auth/google/callback
```

## Step 7: Redeploy Backend

1. **In Render dashboard** → **Manual Deploy** → **Deploy latest commit**
2. **Wait for deployment** to complete (2-5 minutes)

## Step 8: Test the Setup

Once deployed, test these endpoints:

### Health Check
```
GET https://vibe-tribe-backend-8yvp.onrender.com/api/v1/health
```
Should return:
```json
{
  "status": "healthy",
  "googleAuthEnabled": true
}
```

### Google Debug
```
GET https://vibe-tribe-backend-8yvp.onrender.com/api/v1/auth/google/debug
```
Should show your configuration status.

### Google Initiate
```
GET https://vibe-tribe-backend-8yvp.onrender.com/api/v1/auth/google/initiate
```
Should return an auth URL.

## Step 9: Test Google Sign-In

1. **Go to**: https://vibe-tribe-manager.netlify.app/login
2. **Click "Sign in with Google"**
3. **You should be redirected** to Google's OAuth page
4. **After authorization**, you should be redirected back and logged in

## 🚨 Security Best Practices

- **Never commit** your Client Secret to git
- **Use environment variables** only
- **Keep your credentials secure**
- **Regularly rotate** your Client Secret if needed
- **Use HTTPS** for all redirect URIs in production

## 🔍 Troubleshooting

### Google Sign-In Button Not Working
- Check browser console for errors
- Verify frontend is pointing to correct backend URL
- Ensure backend is deployed with latest code

### OAuth Redirect Errors
- **Error: redirect_uri_mismatch**
  - Verify redirect URIs in Google Console match exactly
  - Check for trailing slashes or http vs https
  
- **Error: invalid_client**
  - Verify Client ID and Secret are correct
  - Check environment variables are set in Render

### Backend Errors
- Check Render deployment logs
- Verify all environment variables are set
- Ensure Google APIs are enabled

## 📋 Quick Reference

### Important URLs
- **Frontend**: https://vibe-tribe-manager.netlify.app
- **Backend**: https://vibe-tribe-backend-8yvp.onrender.com
- **OAuth Callback**: https://vibe-tribe-backend-8yvp.onrender.com/api/v1/auth/google/callback

### Required Environment Variables
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://vibe-tribe-backend-8yvp.onrender.com/api/v1/auth/google/callback
```

### OAuth Scopes Used
- `openid` - OpenID Connect
- `email` - User's email address
- `profile` - User's basic profile info

## 🎯 Expected User Flow

1. User clicks "Sign in with Google" on login/register page
2. Frontend calls `/api/v1/auth/google/initiate`
3. User redirects to Google OAuth page
4. User authorizes the application
5. Google redirects to `/api/v1/auth/google/callback`
6. Backend processes OAuth, creates/finds user, generates JWT
7. User redirects to frontend `/auth/callback` with token
8. Frontend stores token and redirects to dashboard

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all steps were completed correctly
3. Check Render deployment logs for errors
4. Ensure Google Cloud Console configuration matches this guide

---

**Once completed, users will be able to sign in and register using their Google accounts seamlessly!** 🚀
