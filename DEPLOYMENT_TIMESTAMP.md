# Deployment Timestamp for OAuth Fix

This file triggers a redeploy to apply the Twitter OAuth environment fixes.

**Last deployment fix**: June 27, 2025

## Required Environment Variables on Render

```
NODE_ENV=production
FRONTEND_URL=https://vibe-tribe-manager.netlify.app
CORS_ORIGIN=https://vibe-tribe-manager.netlify.app,http://localhost:8080,http://localhost:3000,http://localhost:5173,http://localhost:8081

TWITTER_REDIRECT_URI=https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/twitter/callback
LINKEDIN_REDIRECT_URI=https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/linkedin/callback
FACEBOOK_REDIRECT_URI=https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/facebook/callback
INSTAGRAM_REDIRECT_URI=https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/instagram/callback
```

## Manual Steps Required

1. Go to https://render.com
2. Find service: vibe-tribe-backend-8yvp
3. Update Environment variables above
4. Deploy latest commit
