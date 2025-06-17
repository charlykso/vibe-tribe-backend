# Environment Configuration Manager

## 🎯 **Overview**

The Environment Configuration Manager automatically detects and configures the appropriate environment variables for the VibeTribe application across different deployment scenarios (development, staging, production).

## 🚀 **Quick Start**

### Using npm scripts (recommended):

```bash
# Set up development environment
npm run env:dev

# Set up production environment
npm run env:prod

# Set up staging environment
npm run env:staging

# Auto-detect environment
npm run env:auto
```

### Direct usage:

```bash
# Development
node setup-env.cjs dev

# Production
node setup-env.cjs prod

# Auto-detect
node setup-env.cjs auto
```

## 🔧 **Features**

### ✅ **Automatic Environment Detection**

- Detects production environments (Render, Heroku, Vercel, Netlify, AWS, GCP)
- Identifies staging environments based on branch names and environment variables
- Defaults to development for local environments

### ✅ **Security Key Generation**

- Automatically generates secure JWT secrets
- Creates encryption keys for token security
- Replaces demo/development keys in production

### ✅ **OAuth Configuration**

- Sets appropriate redirect URIs for each environment
- Validates OAuth credentials
- Warns about missing platform configurations

### ✅ **Environment-Specific Settings**

- **Development**: Lenient rate limiting, local URLs, optional Redis
- **Production**: Strict security, production URLs, required Redis
- **Staging**: Balanced settings for testing

### ✅ **Validation & Warnings**

- Validates required fields for each environment
- Warns about demo values in production
- Checks OAuth credential completeness

## 📁 **Generated Files**

### Backend Configuration (`backend/.env`)

- Complete server configuration
- Security keys and tokens
- OAuth credentials and redirects
- Database and Redis settings

### Frontend Configuration (`.env`)

- VITE\_ prefixed variables
- API and WebSocket URLs
- Firebase frontend configuration

## 🌍 **Environment Configurations**

### 🔹 **Development**

```bash
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
REDIS_URL=redis://localhost:6379  # Optional
RATE_LIMIT_MAX_REQUESTS=1000      # Lenient
BCRYPT_ROUNDS=10                  # Faster
# OAuth redirects to localhost:3001
```

### 🔹 **Production**

```bash
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://vibe-tribe-manager.netlify.app
CORS_ORIGIN=https://vibe-tribe-manager.netlify.app
REDIS_URL=redis://your-redis-url  # Required
RATE_LIMIT_MAX_REQUESTS=100       # Strict
BCRYPT_ROUNDS=12                  # Secure
# OAuth redirects to production URLs
```

### 🔹 **Staging**

```bash
NODE_ENV=staging
PORT=3001
FRONTEND_URL=https://staging-vibe-tribe-manager.netlify.app
CORS_ORIGIN=https://staging-vibe-tribe-manager.netlify.app
REDIS_URL=redis://staging-redis-url
RATE_LIMIT_MAX_REQUESTS=200       # Moderate
BCRYPT_ROUNDS=12                  # Secure
# OAuth redirects to staging URLs
```

## 🔒 **Security Features**

### **Generated Keys**

- **JWT_SECRET**: 64-byte random hex string
- **TOKEN_ENCRYPTION_KEY**: 32-byte random hex string

### **Production Validation**

- Ensures no demo/development keys in production
- Validates all required security fields
- Checks OAuth credential completeness

### **Environment Protection**

- Preserves existing sensitive values
- Only overwrites demo/placeholder values
- Maintains backward compatibility

## 📋 **Configuration Groups**

The manager organizes environment variables into logical groups:

1. **Server Configuration**: Basic server settings
2. **Security Configuration**: Keys, tokens, encryption
3. **Firebase Configuration**: Database connection
4. **Redis Configuration**: Caching and sessions
5. **Rate Limiting**: API protection settings
6. **OAuth Configurations**: Platform-specific settings
7. **External Services**: Cloudinary, OpenAI, etc.
8. **Email Configuration**: SendGrid settings
9. **Frontend URLs**: API and WebSocket endpoints

## 🔍 **Environment Detection Logic**

### **Production Indicators**

- `RENDER` (Render.com)
- `HEROKU_APP_NAME` (Heroku)
- `VERCEL` (Vercel)
- `NETLIFY` (Netlify)
- `AWS_REGION` (AWS)
- `GOOGLE_CLOUD_PROJECT` (GCP)

### **Staging Indicators**

- `STAGING` environment variable
- Branch names containing "staging"
- `VERCEL_ENV=preview`

### **Development Indicators**

- `DEV` or `DEVELOPMENT` environment variables
- Hostname containing "dev"
- Presence of `node_modules` directory

## ⚠️ **Important Notes**

### **OAuth Redirect URIs**

After running the environment setup, update your OAuth applications with the correct redirect URIs:

- **Twitter**: Developer Portal → App → Authentication settings
- **LinkedIn**: Developer Portal → App → Auth settings
- **Facebook**: Developers → App → Facebook Login settings
- **Instagram**: Uses Facebook app settings

### **Redis Configuration**

- **Development**: Redis is optional (graceful degradation)
- **Production**: Redis is required for optimal functionality
- **Staging**: Redis recommended for realistic testing

### **Security Best Practices**

- Never commit production `.env` files to version control
- Rotate security keys regularly in production
- Use environment-specific OAuth applications
- Enable HTTPS in production environments

## 🚨 **Troubleshooting**

### **Permission Errors**

```bash
# Ensure write permissions
chmod 755 backend/
chmod 644 backend/.env
```

### **Module Errors**

```bash
# Scripts use CommonJS
node setup-env.cjs  # Correct
node setup-env.js   # Will fail in ES module environment
```

### **Missing Dependencies**

```bash
# Install required packages
npm install
```

### **OAuth Issues**

1. Verify redirect URIs match generated configuration
2. Check OAuth application settings in respective platforms
3. Ensure environment-specific credentials are used

## 📚 **API Reference**

### **EnvironmentManager Class**

```javascript
const manager = new EnvironmentManager()

// Detect current environment
const env = manager.detectEnvironment()

// Load existing configuration
const existing = manager.loadExistingEnv()

// Set up environment
const config = await manager.run('development')
```

### **Environment Methods**

- `detectEnvironment()`: Auto-detect current environment
- `loadExistingEnv()`: Load existing .env file
- `mergeEnvironments(targetEnv, existing)`: Merge configurations
- `generateSecurityKeys(config)`: Generate secure keys
- `validateEnvironment(config, env)`: Validate configuration
- `writeEnvFile(config)`: Write backend .env file
- `createFrontendEnv(config)`: Create frontend .env file

## 🔄 **Workflow Integration**

### **Development Workflow**

```bash
# 1. Set up development environment
npm run env:dev

# 2. Start development servers
npm run dev          # Backend
npm run dev          # Frontend (in root directory)
```

### **Production Deployment**

```bash
# 1. Set up production environment
npm run env:prod

# 2. Validate configuration
npm run build

# 3. Deploy to production
# (Follow platform-specific deployment guides)
```

### **CI/CD Integration**

```yaml
# GitHub Actions example
- name: Setup Environment
  run: npm run env:prod

- name: Build Application
  run: npm run build

- name: Deploy
  run: npm run deploy
```

## 🎉 **Summary**

The Environment Configuration Manager provides:

✅ **Automated Setup**: One command environment configuration  
✅ **Security**: Automatic key generation and validation  
✅ **Flexibility**: Support for multiple environments  
✅ **Safety**: Preserves existing sensitive data  
✅ **Validation**: Comprehensive error checking  
✅ **Documentation**: Clear configuration organization

Perfect for rapid development setup and safe production deployment!
