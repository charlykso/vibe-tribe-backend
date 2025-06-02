# 🚀 Render Deployment Guide - VibeTribe Backend

## 📋 **Deployment Overview**

**Repository**: `charlykso/vibe-tribe-backend`
**Platform**: Render
**Status**: ✅ Ready for deployment

---

## ⚠️ **IMPORTANT: Secure Deployment**

### **Environment Variables for Render Dashboard**

**Add these in Render Dashboard (NOT in code):**

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=socialmm-c0c2d
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC9eXf6kGMilZ1X\n1qYUh1rfZI7R++aTck+rkYankFWCQSu567BLkClf3W2SaVtZToc1uIVVBCZjyWdK\nVyz3/sK774pXk7JmQhjjx1VKsmYpKsjCneSq2GBjmTvOs5t3x4KyS3uFH/hKApZC\nVJ08ZJi8X3L9ARBVbjfqHo9pN6Xsf64dbbFaAqepscpFLOQjCSk+Dq6qlMwGuJqH\nfXSt5ak6WiKxVs1pnOgUztu6z2/DCfM5qtJoqfeQodEWc4j61nwHS0zVXjZ4k1sO\nKZ32FE0OkxCOT9neZPcB+/AMkWRtmWXeCD4uhlxWmQJ5/o01sQ87BiqK3GquGUVB\nldec120dAgMBAAECggEABEt9h3ztFL91wVdQs1YgUaa2uql+P/kSar+h+oIVGh6B\nj/v42bTWTafxuaTXPAAOcXTx2sWjdbwYcgqY7s2QzimsH5Et9Rwjv2TV+PTWlLGb\n7haeDhK/ccqE3OOpdY6pcDXk6Lva72Yj6bPmAe4y0x3jxKEY5NYNtB1TH8d+sWY0\nHhoNjbSAWAtNCLmlfVJ42PXebSUW82sDKcUgYkvsjFI0BazqjSlwT1U/Vkd+jXdQ\noZ+b9fnIpZjlfQkxVioz0kgiY8c6B2Ya5/rSPHldYNMRj9sfgbVui6Md6eRrGtpQ\nx+ZFJBsozlF8jVU8e+LpglYJybbhP7M+gTA9VuOBOQKBgQDpoKjGGa2ylMz5737B\n34L8PBY86KRdlAkQyhB+ba6iNfb9KNXRYxY7IlBCag2hvtfv7fBZ4XDD8fMWvA1e\n4/Q30INUQvFdGkdwCtDGdFviax33RCiN9R3K+fIyOYjLc3imZbxvUPAjeiXDwWVC\nDtGbqvbW7sPeCBfBiqc6WxcEiQKBgQDPnmdjP+iopZjzYabTHGMAIwdPUNI29Rvi\nE+I8+nbd5Gc5KjeezyIi6xvrz/IuFADZNzKB+Wzg6AI7ONvis6SMzP0fF+yEIZJF\nATSZR8RH5jekCv1eBG4ZkmoQOrv7SSuxiOHlzm47S3bgqWs4Fq71njeLJD+JOzC9\nZTUFrpXm9QKBgHRXaTSdfP49U4XzWfA52gS592kFgTSIj6sotOYAwMJOlVykhTXs\nXhm8kLNCFN/DJc15dAOOXJV3W1Kq+w2R/v/8einv3Do85+5HtIffUhKCvT1xV7C5\nq8h0h8OzGwgVzLMwXpIggDVqknvVRxOKRZ97l8iYxjk/VnUvEu/ghKnhAoGBAKRU\nHEDSNLRHXehFQmWV8kYJc5+zuK8HEiq+0jKxi6PVRF5aq+tmxv4cWN0smeMesg07\nQx7c7PCWsi1ts5yb04IePbp+lRV//OXhLmCkDRdbgG62xBPGLd7PpGN0GZWrNIow\nbZwW5+jGsjDf551dVt3RfOUEq8VStCE0GeOFa+CBAoGBAOKhxynWHF2ehcXIFhSt\ngVF0t4JOmlEOjG1cniO+CvEMTZ21evdhcAEZa1B4NbkfGICrQUoktnbGiWsr/YTT\nVOc9/UKbSkcJpV0OoQ8oaDqDixzSsMUhSYMnqbIc9claUaOkxW4UfIf2jEO+/66D\n0MMqz/A2xx3c59Mnu0ajg/Gb\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@socialmm-c0c2d.iam.gserviceaccount.com

# Redis Configuration
REDIS_URL=redis://red-d0ul4iidbo4c73bdp700:6379

# SendGrid Email Service
SENDGRID_API_KEY=your_sendgrid_api_key_here
FROM_EMAIL=nexsolve0charles@gmail.com

# Security Configuration
JWT_SECRET=vibe-tribe-production-jwt-secret-2024-secure
NODE_ENV=production
PORT=10000

# CORS Configuration
CORS_ORIGIN=https://vibe-tribe-manager.netlify.app
```

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`
- **Plan**: `Free` (for testing) or `Starter` (for production)

### Step 4: Configure Environment Variables

In Render dashboard, add these environment variables:

```
NODE_ENV=production

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
TWITTER_REDIRECT_URI=https://your-render-app.onrender.com/api/v1/auth/twitter/callback

LINKEDIN_CLIENT_ID=77ywvkxytfm9rm
LINKEDIN_CLIENT_SECRET=WPL_AP1.2iQLcdLSjn7nfvEq.lm43CA==
LINKEDIN_REDIRECT_URI=https://your-render-app.onrender.com/api/v1/auth/linkedin/callback

FACEBOOK_APP_ID=1277151637295494
FACEBOOK_APP_SECRET=1100a5334e9b2622901f3355a2a795b6
FACEBOOK_REDIRECT_URI=https://your-render-app.onrender.com/api/v1/auth/facebook/callback

INSTAGRAM_CLIENT_ID=1277151637295494
INSTAGRAM_CLIENT_SECRET=1100a5334e9b2622901f3355a2a795b6
INSTAGRAM_REDIRECT_URI=https://your-render-app.onrender.com/api/v1/auth/instagram/callback

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

### Step 5: Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy your backend
3. Wait for deployment to complete (usually 5-10 minutes)
4. Note your Render app URL (e.g., `https://your-app-name.onrender.com`)

### Step 6: Update Frontend Environment Variables

Go to Netlify dashboard and update:

- `VITE_API_URL=https://your-render-app.onrender.com/api/v1`
- `VITE_WS_URL=wss://your-render-app.onrender.com`

### Step 7: Test Deployment

1. Visit `https://your-render-app.onrender.com/health`
2. Should return: `{"status":"OK","timestamp":"...","uptime":...}`

## 📝 Important Notes

1. **Free Tier Limitations**:

   - Service spins down after 15 minutes of inactivity
   - Takes ~30 seconds to spin back up (cold start)
   - 750 hours/month limit

2. **Update OAuth Redirect URIs**: Replace `your-render-app.onrender.com` with your actual Render domain

3. **Security**: Change JWT_SECRET to a strong, unique value

## 🚨 After Deployment

1. **Test all API endpoints**
2. **Update Netlify environment variables**
3. **Redeploy Netlify frontend**
4. **Test full application flow**

## 🔧 Render CLI (Alternative)

```bash
# Install Render CLI
npm install -g @render/cli

# Login
render auth login

# Deploy
render deploy
```
