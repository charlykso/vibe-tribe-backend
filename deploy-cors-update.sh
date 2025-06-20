#!/bin/bash

echo "🚀 Deploying VibeTribe Backend with Enhanced CORS to Render..."

# Check if we're in the right directory
if [ ! -f "render-deploy/server.js" ]; then
    echo "❌ Error: render-deploy/server.js not found. Please run from project root."
    exit 1
fi

echo "📦 Current directory: $(pwd)"
echo "📂 Files in render-deploy:"
ls -la render-deploy/

echo ""
echo "✅ Updated CORS configuration in render-deploy/server.js"
echo ""
echo "🔧 CORS now supports these origins:"
echo "   - http://localhost:8080, 8081, 8082, 3000, 5173"
echo "   - https://vibe-tribe-manager.netlify.app"
echo "   - https://*.netlify.app (any Netlify subdomain)"
echo "   - https://*.onrender.com (any Render subdomain)"
echo "   - Any localhost port (http://localhost:*)"
echo "   - Environment variable CORS_ORIGIN"
echo ""

# Instructions for manual deployment
echo "🚀 MANUAL DEPLOYMENT STEPS:"
echo ""
echo "1. Zip the render-deploy folder:"
echo "   cd render-deploy && zip -r ../vibe-tribe-backend-cors-update.zip . && cd .."
echo ""
echo "2. Go to your Render dashboard:"
echo "   https://dashboard.render.com/web/srv-your-service-id"
echo ""
echo "3. Click 'Manual Deploy' or set up auto-deploy from GitHub"
echo ""
echo "4. Upload the zip file or push changes to connected repository"
echo ""
echo "5. Monitor deployment logs for any errors"
echo ""

# Create the zip file automatically
cd render-deploy
zip -r ../vibe-tribe-backend-cors-update.zip .
cd ..

echo "📦 Created deployment package: vibe-tribe-backend-cors-update.zip"
echo ""
echo "🔍 To test after deployment:"
echo "   curl -H 'Origin: http://localhost:8082' https://vibe-tribe-backend-8yvp.onrender.com/health"
echo ""
echo "✅ Ready for deployment!"
