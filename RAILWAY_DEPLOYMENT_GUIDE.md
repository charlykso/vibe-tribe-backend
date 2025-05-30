# Railway Backend Deployment Guide

## 🚀 Deploy VibeTribe Backend to Railway

### Step 1: Create Railway Account
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub (recommended for easy deployment)
3. Verify your account

### Step 2: Deploy from GitHub
1. **Push your code to GitHub** (if not already done)
2. **In Railway Dashboard:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `vibe-tribe-manager` repository
   - Select the `backend` folder as the root directory

### Step 3: Configure Environment Variables
In Railway dashboard, go to your project > Variables tab and add:

```
NODE_ENV=production
PORT=$PORT

# Firebase Configuration
FIREBASE_PROJECT_ID=socialmm-c0c2d
FIREBASE_PRIVATE_KEY_ID=ea1eb647d18062afabf8937cea3b336e14c0c63e
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCbTTuyEC5ZYP0W\nduUd+AQA4fsVcHLEP52ybI9+QIptIefE4JOsMIkwYwdosNnGQHWJGw+y8ucPm0E8\nbEcpW6wX+0VnMJTeWdFQbP4q5Ts0b2Vl7Wi4mgMl/oRETMENdgMteetrhG798FWx\nMCRy92unRJEyDgm6+PKuFHeUeRno1rMN6Qx/A6Yk//7PI8zCtQTCDpdXhKV+zubA\ndpeVpA6pl0UF99IxBUdxZJAtLZASdSo2lWqTi5Akhz5dR1ChKZPwDg/5jb953oPL\nMOUIrSGVfRxYRbshc4Ze4xx4VJHbs/Y/M6r/P94Ll2NJ4oNAIJH78k4ajdYisGAB\n3Oy9tSpvAgMBAAECggEAAXL1iSJMhGn6wpBmb+KmCuoQ4TDU6U7cplML/bYVdJI5\n6uTbi+JCDXEHGyt3RLnKPvbBLT7F+CfPMoSiH1krIGgoTB+wa+izosf5kSXlaQZX\nEF3oOby6JcsbqdV7gaglvHFkSHMKZBUvf4E+/dGgMAXcQvbNkXCMNyKawQhmPP1s\nImbAmO0nQrKg4MSpOj5jdLFjhcoNSDTHBUIR4S9fk3OgGMfJ0TVoXrEa7HdUdVVK\nu9Cy44nz2bX1xqpQPV7tTleq/t/3U6F0Cqocqi0CxqM5Cf8J/QzEZBOvhJ2YyJIU\noRN85PfiGHasNjp/1Yw5/WFhoIqjLqYs9Ed6woFd4QKBgQDMkqrdf7yj7umKJ7A7\nNM7wPDtb4IRboKoycQZGbKQz10zddWmDzD87jQIu08Qe7j5kmxKsiL3UA5mYXg+y\nnEOsgCrsY3hVVoVy0iTk8ZAeGiOaM7l4ZTnGbi5Ytkv6oQu6nW1VOXV2aX4COP1W\nSngjCnBlgQo/XqM5zuPvqa1n4QKBgQDCV7So9OppDOXchVDSsW9PugLeCHLB6QDQ\nw11royMe7JSxfpoyWInwOFUlCO0i/w8upFSbMgNeEzFDxdNkYO3+WYAyo7Sfrw6v\nYTl+m/V42VXgPuPDbkBDdZfWrhmWh/QiB3S2ScGWKqx1aVmINDg4rzTgDL1El4aD\nKB2afoWcTwKBgHPBDdO1gq0T86uL14k40VtYCZJsURhzqbpO/+j7clIvIjwxQpok\nCSeOG00Z4GBMGJver0tXOGpt+wwfNSywhQ5nm2IUyrMm+O3GgL/W++A8lCad2/WG\n+ZERKUJjLEzNsZBPodzWXWO6P2XMj3SzQJU7Q+v7fyvqRdvg+FLVJNyhAoGAChyq\nJ8hmkgS7yReetvfIhOt2zrq9zd0jz7j6mWkpoKhKrFmcCFaXBsrHk1+9hv6ieZjP\nVivqBPEWtSIL98MbXwqlIv1lnpFrQDDc3vuacClO0JY1H6wS5++scN0qM6zrRQIC\nTqHT0s5xnsJWiEG/UyO6qpW/G1yPATALKki/Bv0CgYEAhgOhbZa9rH12Gn5Kw5xf\nqz8a5TrkONMJW+xAfOJF/qDwQnFaCX2GCjxEgzP54OEHBSsWD9LrEFISQZcpd8oo\nPK1KX9erXPYcZ4SToO5zsV5cJjcUMJUxcbuAQPXaT7op7tX2YACGcWYozKsm0G2m\n41J6fSNlF4bxj1OoOP3NFHI=\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@socialmm-c0c2d.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=102259138690885537971
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40socialmm-c0c2d.iam.gserviceaccount.com

# JWT Configuration
JWT_SECRET=production-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration (UPDATE THIS)
CORS_ORIGIN=https://vibe-tribe-manager.netlify.app

# Social Media API Keys (Your real OAuth credentials)
TWITTER_CLIENT_ID=VTd3a0xMX1AwREJJcUJFeDdNblE6MTpjaQ
TWITTER_CLIENT_SECRET=Iug_DbC0pAoN4ndE5iqRpkG0wFbybo6fwJDpQ7B0qtszbx8mBu
TWITTER_REDIRECT_URI=https://your-railway-app.railway.app/api/v1/auth/twitter/callback

LINKEDIN_CLIENT_ID=77ywvkxytfm9rm
LINKEDIN_CLIENT_SECRET=WPL_AP1.2iQLcdLSjn7nfvEq.lm43CA==
LINKEDIN_REDIRECT_URI=https://your-railway-app.railway.app/api/v1/auth/linkedin/callback

FACEBOOK_APP_ID=1277151637295494
FACEBOOK_APP_SECRET=1100a5334e9b2622901f3355a2a795b6
FACEBOOK_REDIRECT_URI=https://your-railway-app.railway.app/api/v1/auth/facebook/callback

INSTAGRAM_CLIENT_ID=1277151637295494
INSTAGRAM_CLIENT_SECRET=1100a5334e9b2622901f3355a2a795b6
INSTAGRAM_REDIRECT_URI=https://your-railway-app.railway.app/api/v1/auth/instagram/callback

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=12

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dtx7br2gz
CLOUDINARY_API_KEY=573938113434329
CLOUDINARY_API_SECRET=RL6vTcu25rQw5LuE3cfneRfpzRM
```

### Step 4: Deploy
1. Railway will automatically build and deploy your backend
2. Wait for deployment to complete
3. Note your Railway app URL (e.g., `https://your-app-name.railway.app`)

### Step 5: Update Frontend Environment Variables
Update your Netlify environment variables:
- `VITE_API_URL=https://your-railway-app.railway.app/api/v1`
- `VITE_WS_URL=wss://your-railway-app.railway.app`

### Step 6: Test Deployment
1. Visit `https://your-railway-app.railway.app/health`
2. Should return: `{"status":"OK","timestamp":"...","uptime":...}`

## 🔧 Alternative: Manual Railway CLI Deployment

If you prefer CLI deployment:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

## 📝 Important Notes

1. **Update OAuth Redirect URIs**: Replace `your-railway-app.railway.app` with your actual Railway domain
2. **Update CORS_ORIGIN**: Set to your Netlify frontend URL
3. **Security**: Change JWT_SECRET to a strong, unique value
4. **Monitoring**: Railway provides logs and metrics in the dashboard

## 🚨 After Deployment

1. **Test all API endpoints**
2. **Update Netlify environment variables**
3. **Redeploy Netlify frontend**
4. **Test full application flow**
