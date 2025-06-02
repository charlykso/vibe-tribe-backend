# VibeTribe - Social Media Management Platform

VibeTribe is a comprehensive social media management platform that enables teams to create, schedule, and manage content across multiple social media platforms from a unified dashboard.

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
cp .env.example .env

# Configure your environment variables
# See Environment Configuration section below
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

### Frontend Environment Variables

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# API Configuration
VITE_API_URL=http://localhost:3001
VITE_WEBSOCKET_URL=http://localhost:3001
```

### Backend Environment Variables

```env
# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080

# Firebase Admin
FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64_encoded_service_account

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Social Media OAuth (Base64 encoded)
TWITTER_OAUTH_BASE64=your_base64_encoded_credentials
LINKEDIN_OAUTH_BASE64=your_base64_encoded_credentials
FACEBOOK_OAUTH_BASE64=your_base64_encoded_credentials
INSTAGRAM_OAUTH_BASE64=your_base64_encoded_credentials
```

## 📚 Documentation

- [Frontend Documentation](./FRONTEND_DOCUMENTATION.md)
- [Backend Documentation](./BACKEND_DOCUMENTATION.md)
- [API Reference](./backend/README.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
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

### Frontend (Netlify)

```bash
npm run build
# Deploy dist/ folder to Netlify
```

### Backend (Render)

```bash
cd backend
npm run build
# Deploy to Render with environment variables
```

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
