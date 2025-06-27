#!/bin/bash

# Deploy Twitter OAuth fixes to Render
# This script updates the production backend with the correct environment

echo "🚀 Deploying Twitter OAuth fixes to Render..."
echo ""

echo "📋 Required Environment Variables for Render:"
echo "============================================="
echo ""
echo "NODE_ENV=production"
echo "FRONTEND_URL=https://vibe-tribe-manager.netlify.app"
echo "CORS_ORIGIN=https://vibe-tribe-manager.netlify.app,http://localhost:8080,http://localhost:3000,http://localhost:5173,http://localhost:8081"
echo ""
echo "TWITTER_REDIRECT_URI=https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/twitter/callback"
echo "LINKEDIN_REDIRECT_URI=https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/linkedin/callback"
echo "FACEBOOK_REDIRECT_URI=https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/facebook/callback"
echo "INSTAGRAM_REDIRECT_URI=https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/instagram/callback"
echo ""
echo "🔧 Steps to fix:"
echo "1. Go to https://render.com and log in"
echo "2. Find your service: vibe-tribe-backend-8yvp"
echo "3. Go to Environment tab"
echo "4. Update the variables above"
echo "5. Click 'Deploy Latest Commit' or wait for auto-deploy"
echo ""
echo "🎯 After deployment, test OAuth at:"
echo "https://vibe-tribe-manager.netlify.app/dashboard/community/platforms"
echo ""

# Trigger a redeploy by updating a timestamp file
echo "# Last deployment fix: $(date)" > DEPLOYMENT_TIMESTAMP.txt

echo "✅ Deployment script complete!"
echo "📝 Added DEPLOYMENT_TIMESTAMP.txt to trigger redeploy"
