#!/bin/bash

echo "🚀 Preparing VibeTribe Backend for Render Deployment"
echo "=================================================="

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Push your code to GitHub"
    echo "2. Go to https://render.com"
    echo "3. Create a new Web Service"
    echo "4. Connect your GitHub repository"
    echo "5. Set Root Directory to 'backend'"
    echo "6. Use Build Command: npm install && npm run build"
    echo "7. Use Start Command: npm run start"
    echo "8. Add environment variables from RENDER_DEPLOYMENT_GUIDE.md"
    echo ""
    echo "📖 Full guide: See RENDER_DEPLOYMENT_GUIDE.md"
else
    echo "❌ Build failed! Please fix the errors and try again."
    exit 1
fi
