# Base64 Credential System - Quick Reference

## 🎯 Quick Start

### Development (Individual Variables)
```bash
# 1. Set up .env file with individual variables
cp .env.example backend/.env
# Edit backend/.env with your credentials

# 2. Start development
npm run dev:full
```

### Production (Base64 Credentials)
```bash
# 1. Generate Base64 credentials
npm run generate-base64

# 2. Copy Base64 values to Render environment
# OAUTH_CREDENTIALS_BASE64=...
# FIREBASE_SERVICE_ACCOUNT_BASE64=...

# 3. Deploy
git push  # Auto-deploys to Render
```

## 🔄 How It Works

### Priority System
1. **Individual Variables** (Development) ✅
2. **Base64 Fallback** (Production) 🔄
3. **Error** (Nothing available) ❌

### Credential Types

#### OAuth Credentials
```env
# Individual (Development)
TWITTER_CLIENT_ID=your-id
TWITTER_CLIENT_SECRET=your-secret
LINKEDIN_CLIENT_ID=your-id
# ... etc

# Base64 (Production)
OAUTH_CREDENTIALS_BASE64=ewogICJUV0lUVEVSX0NM...
```

#### Firebase Credentials
```env
# Individual (Development)
FIREBASE_PROJECT_ID=your-project
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
FIREBASE_CLIENT_EMAIL=your-email@project.iam.gserviceaccount.com

# Base64 (Production)
FIREBASE_SERVICE_ACCOUNT_BASE64=ewogICJ0eXBlIjogInNlcn...
```

## 🛠️ Commands

| Command | Purpose |
|---------|---------|
| `npm run generate-base64` | Generate Base64 credentials |
| `npm run dev:full` | Start development with individual vars |
| `npm run deploy:netlify` | Deploy frontend to Netlify |

## 🔍 Verification

### Environment Check Tool
Open `test-render-env.html` in browser:
- ✅ **Backend Health**: Check if backend is running
- 🔧 **Environment Variables**: See which credentials are loaded
- 🔐 **OAuth Endpoints**: Test OAuth callback accessibility

### API Endpoints
```bash
# Health check
curl https://vibe-tribe-backend-8yvp.onrender.com/health

# Environment check
curl -H "X-Debug-Token: check-env-vars-2024" \
     https://vibe-tribe-backend-8yvp.onrender.com/env-check
```

## 🔐 OAuth Callback URLs

**All platforms must use backend URLs:**

```
Twitter:    https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/twitter/callback
LinkedIn:   https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/linkedin/callback
Facebook:   https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/facebook/callback
Instagram:  https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/instagram/callback
```

## 📁 Files

| File | Purpose |
|------|---------|
| `backend/.env` | Individual environment variables (development) |
| `deployment-credentials.env` | Generated Base64 credentials (production) |
| `test-render-env.html` | Environment verification tool |
| `scripts/generate-base64-credentials.js` | Base64 generator script |

## ⚠️ Important Notes

### Security
- **Never commit** `deployment-credentials.env` to git
- **Keep Base64 values secure** - treat like passwords
- **Use individual vars for development** - easier to manage

### OAuth Setup
- **Update callback URLs** in all platform developer consoles
- **Use backend URLs only** - never frontend URLs
- **Test each platform** after updating URLs

### Deployment
- **Individual vars take priority** over Base64
- **Base64 is fallback** when individual vars are missing
- **Both methods can coexist** safely

## 🚨 Troubleshooting

### Common Errors

#### "redirect_uri does not match"
- Update OAuth callback URLs in platform developer consoles
- Use backend URLs, not frontend URLs

#### "Missing Firebase configuration"
- Check if credentials are set in Render environment
- Regenerate Base64 with `npm run generate-base64`

#### "Failed to parse Base64 credentials"
- Regenerate credentials with the script
- Check for copy/paste errors in Render environment

### Debug Steps
1. Run `npm run generate-base64` to verify credentials
2. Check environment with the verification tool
3. Review Render deployment logs
4. Test OAuth endpoints individually

## 📞 Quick Help

**Need to deploy quickly?**
1. `npm run generate-base64`
2. Copy the two Base64 values to Render
3. `git push`
4. Done! ✅

**OAuth not working?**
1. Check callback URLs in platform consoles
2. Ensure they point to backend, not frontend
3. Test with environment verification tool

**Environment issues?**
1. Open `test-render-env.html`
2. Click "Check Environment Variables"
3. Look for ❌ missing credentials
4. Add missing variables to Render

---

For detailed instructions, see [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)
