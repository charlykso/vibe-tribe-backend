# OAuth Setup Guide for Tribe

This guide will help you set up real OAuth credentials for all social media platforms.

## 🔵 Facebook OAuth Setup

### Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App" → "Business" → "Next"
3. Enter app details:
   - **App Name**: Tribe Manager
   - **App Contact Email**: your-email@example.com
4. Click "Create App"

### Step 2: Configure Facebook Login

1. In your app dashboard, click "Add Product"
2. Find "Facebook Login" and click "Set Up"
3. Choose "Web" platform
4. Enter Site URL: `http://localhost:8081`
5. Go to Facebook Login → Settings
6. Add Valid OAuth Redirect URIs:
   ```
   http://localhost:8081/oauth/callback
   https://yourdomain.com/oauth/callback
   ```

### Step 3: Get Credentials

1. Go to Settings → Basic
2. Copy your **App ID** (this is your CLIENT_ID)
3. Copy your **App Secret** (this is your CLIENT_SECRET)
4. Add these to your .env file

### Step 4: Request Permissions

1. Go to App Review → Permissions and Features
2. Request these permissions:
   - `pages_show_list` - To access user's pages
   - `pages_read_engagement` - To read page insights
   - `pages_manage_posts` - To create posts on pages
   - `publish_to_groups` - To post in groups

---

## 🔵 Instagram OAuth Setup

### Step 1: Use Facebook App

Instagram uses Facebook's OAuth system, so you'll use the same app.

### Step 2: Add Instagram Basic Display

1. In your Facebook app, click "Add Product"
2. Find "Instagram Basic Display" and click "Set Up"
3. Go to Instagram Basic Display → Basic Display
4. Add Valid OAuth Redirect URIs:
   ```
   http://localhost:8081/oauth/callback
   https://yourdomain.com/oauth/callback
   ```

### Step 3: Get Credentials

- **CLIENT_ID**: Same as Facebook App ID
- **CLIENT_SECRET**: Same as Facebook App Secret

### Step 4: Test Users (Development)

1. Go to Instagram Basic Display → Basic Display
2. Add Instagram Test Users
3. Accept the invitation on Instagram

---

## 💼 LinkedIn OAuth Setup

### Step 1: Create LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Click "Create App"
3. Fill in details:
   - **App Name**: Tribe Manager
   - **LinkedIn Page**: Your company page (or create one)
   - **Privacy Policy URL**: Your privacy policy
   - **App Logo**: Upload a logo

### Step 2: Configure OAuth

1. Go to Auth tab
2. Add Authorized Redirect URLs:
   ```
   http://localhost:8081/oauth/callback
   https://yourdomain.com/oauth/callback
   ```

### Step 3: Get Credentials

1. In the Auth tab, find:
   - **Client ID**
   - **Client Secret**

### Step 4: Request Permissions

1. Go to Products tab
2. Request access to:
   - **Sign In with LinkedIn** (for basic profile)
   - **Share on LinkedIn** (for posting)
   - **Marketing Developer Platform** (for analytics)

---

## 🐦 Twitter OAuth Setup

### Step 1: Create Twitter App

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Apply for a developer account if needed
3. Create a new project/app:
   - **App Name**: Tribe Manager
   - **Use Case**: Social media management tool

### Step 2: Configure OAuth 2.0

1. Go to your app settings
2. Enable OAuth 2.0
3. Set Callback URLs:
   ```
   http://localhost:8081/oauth/callback
   https://yourdomain.com/oauth/callback
   ```
4. Set Website URL: `http://localhost:8081`

### Step 3: Get Credentials

1. Go to Keys and Tokens tab
2. Copy:
   - **Client ID** (OAuth 2.0)
   - **Client Secret** (OAuth 2.0)

### Step 4: Set Permissions

1. Go to App Settings → User authentication settings
2. Enable:
   - Read and write permissions
   - Request email from users

---

## 🔧 Environment Configuration

After creating all OAuth apps, update your `.env` file:

```env
# Twitter OAuth 2.0
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
TWITTER_REDIRECT_URI=http://localhost:8081/oauth/callback

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:8081/oauth/callback

# Facebook OAuth
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:8081/oauth/callback

# Instagram OAuth (uses Facebook credentials)
INSTAGRAM_CLIENT_ID=your_facebook_app_id
INSTAGRAM_CLIENT_SECRET=your_facebook_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:8081/oauth/callback
```

## 🚀 Quick Setup

### Option 1: Interactive Setup Script

```bash
npm run setup:oauth
```

### Option 2: Manual Setup

1. Follow the platform-specific instructions above
2. Update your `.env` file with the credentials
3. Restart your development servers

### Option 3: Stay in Demo Mode

```bash
npm run setup:demo
```

## 🧪 Testing

### Demo Mode Testing

- All platforms will show demo OAuth pages
- Demo accounts will be created automatically
- No real API calls are made
- Perfect for development and testing

### Production Mode Testing

1. Update your `.env` file with real credentials
2. Restart your development servers: `npm run dev:full`
3. Navigate to the Platforms tab
4. Test OAuth connections with real accounts
5. Verify that real social media accounts can be connected

## 🔄 Switching Between Modes

### Switch to Demo Mode

```bash
npm run setup:demo
```

### Switch to Production Mode

```bash
npm run setup:production
```

### Check Current Mode

Look at your `.env` file:

- Demo mode: credentials start with `demo_`
- Production mode: real OAuth app credentials

## 🛠️ Troubleshooting

### Common Issues

1. **"OAuth authentication was cancelled"**

   - Check that redirect URIs match exactly
   - Ensure OAuth app is properly configured
   - Verify credentials are correct

2. **"Invalid client_id"**

   - Double-check your client ID in the .env file
   - Ensure the OAuth app exists and is active

3. **"Redirect URI mismatch"**

   - Verify redirect URIs in OAuth app settings
   - Should be: `http://localhost:8081/oauth/callback`

4. **Demo mode not working**
   - Ensure credentials start with `demo_`
   - Restart development servers after changes

### Getting Help

1. Check the browser console for errors
2. Check the backend logs for OAuth errors
3. Verify your OAuth app settings match the guide
4. Test with demo mode first to isolate issues

## 📝 Notes

- **Development vs Production**: Use different OAuth apps for development and production
- **HTTPS Required**: Most platforms require HTTPS for production redirect URIs
- **Rate Limits**: Be aware of API rate limits during development
- **Permissions**: Some permissions require app review by the platforms
- **Security**: Never commit real OAuth credentials to version control

## 🔐 Security Best Practices

1. **Environment Variables**: Always use environment variables for credentials
2. **Different Apps**: Use separate OAuth apps for development and production
3. **Rotate Credentials**: Regularly rotate your OAuth app secrets
4. **Minimal Permissions**: Only request the permissions you actually need
5. **Monitor Usage**: Keep track of API usage and rate limits
