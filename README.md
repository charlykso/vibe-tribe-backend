# Tribe - Social Media Management Platform

Tribe is a comprehensive social media management platform that enables teams to create, schedule, and manage content across multiple social media platforms from a unified dashboard.

## 📖 Quick Links

- **[🚀 Deployment Guide](./DEPLOYMENT-GUIDE.md)** - Complete deployment instructions with Base64 credential system
- **[🔐 Base64 Credentials](./BASE64-CREDENTIALS.md)** - Quick reference for credential management
- **[🛠️ Environment Check Tool](./test-render-env.html)** - Verify your deployment configuration

## 🚀 Features

### Core Functionality

- **Multi-Platform Publishing**: Support for Twitter, LinkedIn, Instagram, and Facebook
- **Content Scheduling**: Advanced calendar-based scheduling with timezone support
- **Draft Management**: Auto-save drafts with template system
- **Media Management**: Drag-and-drop upload with Cloudinary integration
- **Unified Inbox**: Centralized messaging across all platforms
- **Analytics Dashboard**: Comprehensive engagement and performance tracking
- **Team Collaboration**: Role-based access control and team management
- **Real-time Updates**: WebSocket-powered live notifications

### Advanced Features

- **AI-Powered Content**: OpenAI integration for content suggestions
- **Approval Workflows**: Content review and approval system
- **Community Management**: Member management and moderation tools
- **Bulk Operations**: Efficient management of multiple posts and accounts
- **Custom Templates**: Reusable content templates with variables
- **Performance Analytics**: Detailed insights and reporting

## 🛠 Technology Stack

### Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui components with Radix UI
- **Styling**: Tailwind CSS with dark mode support
- **State Management**: React Query for server state, React hooks for local state
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for analytics visualization
- **Calendar**: FullCalendar for scheduling interface

### Backend

- **Runtime**: Node.js with Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth with JWT
- **Queue System**: Bull Queue with Redis
- **Media Storage**: Cloudinary
- **Real-time**: Socket.io
- **Scheduling**: Node-cron
- **Language**: TypeScript

### Infrastructure

- **Frontend Deployment**: Netlify
- **Backend Deployment**: Render
- **Database**: Firebase Firestore
- **Cache/Queue**: Redis on Render
- **Media CDN**: Cloudinary
- **Monitoring**: Health checks and error handling

## 📁 Project Structure

```
vibe-tribe-manager/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── auth/                # Authentication components
│   │   ├── mobile/              # Mobile-specific components
│   │   └── team/                # Team management components
│   ├── pages/                   # Page components
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility libraries
│   └── utils/                   # Helper functions
├── backend/                     # Backend source code
│   ├── src/
│   │   ├── routes/              # API route handlers
│   │   ├── middleware/          # Express middleware
│   │   ├── services/            # Business logic services
│   │   ├── types/               # TypeScript type definitions
│   │   └── scripts/             # Utility scripts
│   └── dist/                    # Compiled JavaScript
├── public/                      # Static assets
└── docs/                        # Documentation files
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase account and project
- Cloudinary account (for media storage)
- Redis instance (for production)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd vibe-tribe-manager
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment Setup**

```bash
# Copy environment template
cp .env.example backend/.env

# Configure your environment variables
# See Environment Configuration section below

# For production deployment, generate Base64 credentials
npm run generate-base64
```

4. **Start development servers**

```bash
# Start both frontend and backend
npm run dev:full

# Or start individually
npm run dev          # Frontend only
npm run server:dev   # Backend only
```

5. **Access the application**

- Frontend: http://localhost:8080
- Backend API: http://localhost:3001

## ⚙️ Environment Configuration

Tribe uses a flexible credential system that supports both individual environment variables (development) and Base64 encoded credentials (production).

### 🛠️ Development Setup (Individual Variables)

Create `backend/.env` with individual variables:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com

# OAuth Credentials
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
TWITTER_REDIRECT_URI=https://your-backend.onrender.com/api/v1/oauth/twitter/callback

LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_REDIRECT_URI=https://your-backend.onrender.com/api/v1/oauth/linkedin/callback

# Server Configuration
PORT=3001
NODE_ENV=development
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=https://your-frontend.netlify.app
FRONTEND_URL=https://your-frontend.netlify.app
```

### 🚀 Production Setup (Base64 Credentials)

Generate Base64 credentials for secure deployment:

```bash
npm run generate-base64
```

Add to your production environment (Render):

```env
# Base64 Encoded Credentials (Production)
OAUTH_CREDENTIALS_BASE64=ewogICJUV0lUVEVSX0NM...
FIREBASE_SERVICE_ACCOUNT_BASE64=ewogICJ0eXBlIjogInNlcn...

# Other Production Variables
NODE_ENV=production
JWT_SECRET=your-production-jwt-secret
CORS_ORIGIN=https://your-frontend.netlify.app
FRONTEND_URL=https://your-frontend.netlify.app
```

### 🔄 How It Works

The system automatically chooses the best available credentials:

1. **Individual Variables** (preferred for development)
2. **Base64 Credentials** (fallback for production)
3. **Error** if neither is available

**See [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) for detailed instructions.**

## 📚 Documentation

### Deployment & Configuration

- **[🚀 Deployment Guide](./DEPLOYMENT-GUIDE.md)** - Complete deployment instructions
- **[🔐 Base64 Credentials](./BASE64-CREDENTIALS.md)** - Quick credential reference
- **[🛠️ Environment Check Tool](./test-render-env.html)** - Verify deployment configuration

### Development

- [Frontend Documentation](./FRONTEND_DOCUMENTATION.md)
- [Backend Documentation](./BACKEND_DOCUMENTATION.md)
- [API Reference](./backend/README.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

## 🧪 Testing

```bash
# Run frontend tests
npm run test

# Run backend tests
cd backend && npm run test

# Run tests with coverage
npm run test:coverage
```

## 📦 Deployment

### Quick Deployment

```bash
# 1. Generate Base64 credentials for production
npm run generate-base64

# 2. Deploy backend (auto-deploys on git push)
git add .
git commit -m "Deploy with Base64 credentials"
git push

# 3. Deploy frontend to Netlify
npm run build
npm run deploy:netlify
```

### Detailed Instructions

- **[🚀 Complete Deployment Guide](./DEPLOYMENT-GUIDE.md)** - Step-by-step deployment instructions
- **[🔐 Base64 Credential System](./BASE64-CREDENTIALS.md)** - Credential management reference

### Platform-Specific

- **Frontend**: Netlify (auto-deploy from git)
- **Backend**: Render (auto-deploy from git)
- **Database**: Firebase Firestore
- **Media**: Cloudinary CDN

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the troubleshooting guides
