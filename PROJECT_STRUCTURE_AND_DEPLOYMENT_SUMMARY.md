# 📋 Tribe Project Structure & Deployment Summary

## 🎯 **Project Overview**

**Tribe** (formerly SocialTribe) is a full-stack social media management platform with separate frontend and backend components that are deployed to different hosting services.

---

## 🏗️ **Repository Structure**

### **Primary Repository: `vibe-tribe-manager`**

- **URL**: `https://github.com/nexsolve0/vibe-tribe-manager.git`
- **Contains**: Full-stack application with both frontend and backend code
- **Structure**:
  ```
  vibe-tribe-manager/
  ├── src/                    # Frontend React/TypeScript code
  ├── backend/                # Backend Node.js/Express code
  ├── public/                 # Static assets (includes Tribe SVG logos)
  ├── DEPLOYMENT_GUIDE.md     # Complete deployment instructions
  ├── REPOSITORY_CONTENTS.md  # Project overview
  └── ...                     # Configuration and documentation files
  ```

### **Secondary Repository: `vibe-tribe-backend`**

- **URL**: `https://github.com/charlykso/vibe-tribe-backend`
- **Contains**: Backend-only code for Render deployment
- **Purpose**: Separate backend repository for easier deployment to Render
- **Status**: Contains the same backend code as the main repository's `backend/` folder

---

## 🚀 **Deployment Architecture**

### **Frontend Deployment → Netlify**

- **Source**: `vibe-tribe-manager` repository (main branch)
- **Build**: React/Vite application from `src/` folder
- **URL**: https://vibe-tribe-manager.netlify.app
- **Configuration**:
  - Build command: `npm run build`
  - Publish directory: `dist`
  - Automatic deployments on push to main branch

### **Backend Deployment → Render**

- **Source**: `charlykso/vibe-tribe-backend` repository
- **Service**: Node.js/Express API server
- **URL**: https://vibe-tribe-backend-8yvp.onrender.com
- **Health Check**: https://vibe-tribe-backend-8yvp.onrender.com/health
- **Configuration**:
  - Build command: `npm install && npm run build`
  - Start command: `npm start`
  - Auto-deploy from main branch

---

## 📁 **File Organization by Deployment**

### **Frontend Files (Deployed to Netlify)**

```
src/
├── components/
│   ├── auth/               # Login, Register, ForgotPassword pages
│   ├── dashboard/          # Dashboard components
│   ├── layout/             # AppSidebar, navigation
│   └── ui/                 # Reusable UI components
├── pages/
│   ├── Landing.tsx         # Landing page with navigation
│   ├── Login.tsx           # Authentication pages
│   └── ...
├── hooks/                  # React hooks
├── lib/                    # Utilities and configurations
└── utils/                  # Helper functions

public/
├── Tribe-SVG.svg          # Main logo (updated)
├── Tribe-Favicon.svg      # Favicon (updated)
└── ...

Configuration Files:
├── index.html             # Entry point (updated with new branding)
├── vite.config.ts         # Build configuration
├── netlify.toml           # Netlify deployment config
└── package.json           # Frontend dependencies
```

### **Backend Files (Deployed to Render)**

```
backend/
├── src/
│   ├── routes/            # API endpoints
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic
│   ├── models/            # Data models
│   └── utils/             # Backend utilities
├── dist/                  # Compiled JavaScript
└── package.json           # Backend dependencies

Configuration Files:
├── render.yaml            # Render deployment config
├── .env.example           # Environment variables template
└── server.js              # Entry point
```

---

## 🔄 **Deployment Workflow**

### **Development Workflow**

1. **Frontend Changes**: Made in `vibe-tribe-manager/src/`
2. **Backend Changes**: Made in `vibe-tribe-manager/backend/`
3. **Frontend Deployment**: Automatic via Netlify when pushing to main branch
4. **Backend Deployment**: Manual sync to `charlykso/vibe-tribe-backend` repository

### **Repository Synchronization**

- Backend code needs to be manually synced between repositories
- `vibe-tribe-manager/backend/` → `charlykso/vibe-tribe-backend`
- This allows for separate deployment pipelines and configurations

---

## 🌐 **Environment Configuration**

### **Frontend Environment Variables (.env)**

```env
VITE_API_URL=https://vibe-tribe-backend-8yvp.onrender.com/api/v1
VITE_WS_URL=wss://vibe-tribe-backend-8yvp.onrender.com
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=socialmm-c0c2d
# ... other Firebase config
```

### **Backend Environment Variables (Render Dashboard)**

```env
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://vibe-tribe-manager.netlify.app
FIREBASE_PROJECT_ID=socialmm-c0c2d
REDIS_URL=redis://red-d0ul4iidbo4c73bdp700:6379
JWT_SECRET=...
# ... other secure credentials
```

---

## 📋 **Key Documentation Files**

### **Deployment Guides**

- `DEPLOYMENT_GUIDE.md` - Complete deployment instructions for both frontend and backend
- `RENDER_DEPLOYMENT_GUIDE.md` - Specific Render deployment steps
- `NETLIFY_ENV_SETUP.md` - Frontend deployment guide
- `DEPLOY_TO_RENDER.md` - Backend deployment to Render

### **Configuration References**

- `OAUTH_SETUP_GUIDE.md` - Social media OAuth configuration
- `BASE64-CREDENTIALS.md` - Credential management system
- `REDIS_RENDER_SETUP.md` - Redis configuration for Render
- `SECURITY.md` - Security implementation details

### **Project Documentation**

- `COMPLETE_DOCUMENTATION.md` - Full project overview and architecture
- `REPOSITORY_CONTENTS.md` - Complete feature list and project status
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- `TESTING_GUIDE.md` - Testing infrastructure

---

## ✅ **Current Status**

### **✅ Branding Updates Complete**

- Tribe SVG logo integrated throughout the application
- "SocialTribe" references updated to "Tribe"
- Favicon updated to use Tribe-Favicon.svg
- All authentication pages and navigation updated

### **✅ Deployment Ready**

- Frontend: Configured and deployed to Netlify
- Backend: Configured and deployed to Render
- Database: Firebase Firestore configured
- Redis: Queue system configured on Render
- All environment variables documented

### **📦 Repository Structure**

- **Main Development**: `nexsolve0/vibe-tribe-manager` (full-stack)
- **Backend Deployment**: `charlykso/vibe-tribe-backend` (backend-only)
- **Synchronization**: Manual sync required between repositories for backend updates

---

## 🔧 **Next Steps for Maintenance**

1. **For Frontend Changes**: Push directly to `vibe-tribe-manager` main branch
2. **For Backend Changes**:
   - Update code in `vibe-tribe-manager/backend/`
   - Sync changes to `charlykso/vibe-tribe-backend`
   - Deploy to Render
3. **For Full-Stack Features**: Coordinate updates across both deployments
4. **Environment Updates**: Update variables in respective hosting dashboards

This structure allows for independent scaling and deployment of frontend and backend components while maintaining a unified development experience in the main repository.
