# VibeTribe - Quick Reference Guide

## 🚀 Live Application URLs

- **Frontend**: https://vibe-tribe-manager.netlify.app
- **Backend**: https://vibe-tribe-backend-8yvp.onrender.com
- **Health Check**: https://vibe-tribe-backend-8yvp.onrender.com/health

## 🔑 Key Credentials

### SendGrid Email
- **API Key**: `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`
- **From Email**: `nexsolve0charles@gmail.com`

### Netlify Account
- **Email**: `nexsolve0charles@gmail.com`
- **Password**: `NEXsolve869#$`

## ⚡ Quick Commands

### Development
```bash
# Start frontend
npm run dev

# Start backend
cd backend && npm run dev

# Build frontend
npm run build

# Build backend
cd backend && npm run build
```

### Deployment
```bash
# Deploy frontend to Netlify
npx netlify deploy --prod --dir=dist

# Deploy backend to Render (auto-deploy on git push)
cd render-deploy
git add . && git commit -m "update" && git push origin main
```

### Testing
```bash
# Test frontend
npm test

# Test backend
cd backend && npm test

# Test email functionality
cd backend && node test-email.js
```

## 🔧 Environment Variables

### Frontend (.env)
```env
VITE_API_URL=https://vibe-tribe-backend-8yvp.onrender.com/api/v1
VITE_WS_URL=wss://vibe-tribe-backend-8yvp.onrender.com
VITE_FIREBASE_PROJECT_ID=socialmm-c0c2d
```

### Backend (Render Environment)
```env
CORS_ORIGIN=https://vibe-tribe-manager.netlify.app
SENDGRID_API_KEY=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
FROM_EMAIL=nexsolve0charles@gmail.com
FRONTEND_URL=https://vibe-tribe-manager.netlify.app
```

## 🐛 Common Issues & Solutions

### CORS Error
**Problem**: Frontend can't connect to backend
**Solution**: Add `CORS_ORIGIN=https://vibe-tribe-manager.netlify.app` to Render environment

### 400 Error on Registration
**Problem**: Validation error during user registration
**Solution**: Ensure frontend sends only required fields: `email`, `password`, `name`, `organizationName`

### Email Not Sending
**Problem**: Verification emails not being sent
**Solution**: Verify SendGrid API key is set correctly in Render environment

### Authentication Issues
**Problem**: Users can't stay logged in
**Solution**: Check JWT token validation and localStorage persistence

## 📊 Key Features Status

- ✅ **User Registration & Login** - Working with email verification
- ✅ **Email System** - SendGrid integration functional
- ✅ **Authentication** - JWT-based with persistent sessions
- ✅ **Database** - Firebase Firestore connected
- ✅ **File Upload** - Cloudinary integration ready
- ✅ **Social OAuth** - Twitter, LinkedIn, Facebook, Instagram ready
- ✅ **Real-time Updates** - WebSocket integration
- ✅ **Responsive UI** - Dark/light themes, mobile-friendly

## 🔗 Important API Endpoints

```
POST /api/v1/auth/register     # User registration
POST /api/v1/auth/login        # User login
GET  /api/v1/auth/me           # Get current user
POST /api/v1/posts             # Create post
GET  /api/v1/posts             # Get posts
POST /api/v1/media/upload      # Upload media
GET  /api/v1/social-accounts   # Get connected accounts
```

## 📱 Social Media Integration

### OAuth Redirect URIs
- **Twitter**: `https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/twitter/callback`
- **LinkedIn**: `https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/linkedin/callback`
- **Facebook**: `https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/facebook/callback`

## 🛠️ Tech Stack Summary

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: Firebase Firestore
- **Authentication**: JWT + Firebase Auth
- **Email**: SendGrid
- **File Storage**: Cloudinary
- **Hosting**: Netlify (Frontend) + Render (Backend)

## 📚 Documentation Files

- `COMPLETE_DOCUMENTATION.md` - Full application documentation
- `README.md` - Project overview and setup
- `RENDER_DEPLOYMENT_GUIDE.md` - Backend deployment guide
- `frontend_todo.md` - Frontend development tasks
- `backend_todo.md` - Backend development tasks

## 🔄 Development Workflow

1. **Make changes** to code
2. **Test locally** with `npm run dev`
3. **Build** with `npm run build`
4. **Deploy frontend** with `npx netlify deploy --prod --dir=dist`
5. **Deploy backend** by pushing to `render-deploy` git repository

## 📞 Support

- **Documentation**: See `COMPLETE_DOCUMENTATION.md`
- **Issues**: Check troubleshooting section in main documentation
- **Email**: nexsolve0charles@gmail.com

---

**Last Updated**: December 2024  
**Quick Reference Version**: 1.0.0
