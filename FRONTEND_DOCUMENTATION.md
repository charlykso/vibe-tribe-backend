# VibeTribe Frontend Documentation

## 🎯 Overview

The VibeTribe frontend is a modern React application built with TypeScript, providing a comprehensive social media management interface. It features a responsive design with dark mode support, real-time updates, and an intuitive user experience.

## 🛠 Technology Stack

### Core Technologies
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Type-safe development with strict type checking
- **Vite**: Fast build tool with hot module replacement
- **React Router DOM**: Client-side routing and navigation

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **shadcn/ui**: High-quality, accessible component library built on Radix UI
- **Lucide React**: Consistent icon library with 1000+ icons
- **CSS Variables**: Dynamic theming support for light/dark modes

### State Management & Data
- **React Query (@tanstack/react-query)**: Server state management with caching
- **React Hook Form**: Performant form handling with validation
- **Zod**: Runtime type validation and schema validation
- **Local Storage**: Client-side persistence for drafts and preferences

### Specialized Libraries
- **FullCalendar**: Professional calendar component for scheduling
- **Recharts**: Responsive chart library for analytics
- **React Dropzone**: Drag-and-drop file upload functionality
- **Emoji Picker React**: Emoji selection component
- **React Image Crop**: Image cropping and editing
- **Socket.io Client**: Real-time WebSocket communication

## 📁 Project Structure

```
src/
├── components/                   # React components
│   ├── ui/                      # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── auth/                    # Authentication components
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── mobile/                  # Mobile-specific components
│   │   ├── MobileNav.tsx
│   │   └── MobileMenu.tsx
│   ├── team/                    # Team management components
│   │   ├── TeamInvitations.tsx
│   │   └── MemberManagement.tsx
│   ├── Dashboard.tsx            # Main dashboard overview
│   ├── PostComposer.tsx         # Multi-platform post creation
│   ├── PostScheduler.tsx        # Calendar-based scheduling
│   ├── DraftManager.tsx         # Draft management system
│   ├── MediaUpload.tsx          # File upload and management
│   ├── UnifiedInbox.tsx         # Multi-platform messaging
│   ├── Analytics.tsx            # Analytics dashboard
│   ├── PlatformConnections.tsx  # Social media account management
│   ├── CommunityManagement.tsx  # Community moderation
│   ├── Settings.tsx             # Application settings
│   ├── Sidebar.tsx              # Navigation sidebar
│   └── TopNav.tsx               # Top navigation bar
├── pages/                       # Page components
│   ├── Landing.tsx              # Landing page
│   ├── Login.tsx                # Login page
│   ├── Register.tsx             # Registration page
│   ├── Index.tsx                # Main dashboard container
│   ├── ForgotPassword.tsx       # Password reset
│   ├── OAuthCallback.tsx        # OAuth callback handler
│   └── NotFound.tsx             # 404 error page
├── hooks/                       # Custom React hooks
│   ├── useAuth.ts               # Authentication hook
│   ├── useNotifications.ts      # Notification management
│   ├── use-toast.ts             # Toast notification hook
│   └── use-mobile.tsx           # Mobile detection hook
├── lib/                         # Utility libraries
│   ├── api.ts                   # API client configuration
│   ├── auth.ts                  # Authentication utilities
│   ├── utils.ts                 # General utility functions
│   ├── websocket.ts             # WebSocket client
│   └── services/                # Service layer
│       ├── authService.ts
│       ├── postService.ts
│       └── analyticsService.ts
├── utils/                       # Helper functions
│   └── security.ts              # Security utilities
├── test/                        # Test utilities
│   ├── setup.ts                 # Test setup configuration
│   └── utils.tsx                # Test helper functions
├── App.tsx                      # Root application component
├── main.tsx                     # Application entry point
├── index.css                    # Global styles
└── vite-env.d.ts               # Vite type definitions
```

## 🎨 Design System

### Color Palette
```css
/* Light Mode */
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;
--primary: 222.2 47.4% 11.2%;
--secondary: 210 40% 96%;

/* Dark Mode */
--background: 222.2 84% 4.9%;
--foreground: 210 40% 98%;
--primary: 210 40% 98%;
--secondary: 217.2 32.6% 17.5%;
```

### Typography
- **Font Family**: Inter (system font fallback)
- **Font Sizes**: Tailwind's type scale (text-xs to text-9xl)
- **Font Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Spacing & Layout
- **Grid System**: CSS Grid and Flexbox
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Container**: Max-width with responsive padding

## 🧩 Key Components

### PostComposer
**Location**: `src/components/PostComposer.tsx`

Multi-platform post creation with advanced features:
- Platform selection (Twitter, LinkedIn, Instagram, Facebook)
- Character counters with platform-specific limits
- Emoji picker integration
- Hashtag suggestions
- Auto-save functionality (every 30 seconds)
- Draft recovery
- Media attachment support
- Thread composer for Twitter

```typescript
interface PostComposerProps {
  initialContent?: string;
  platforms?: Platform[];
  onSave?: (post: PostData) => void;
  onPublish?: (post: PostData) => void;
}
```

### PostScheduler
**Location**: `src/components/PostScheduler.tsx`

Calendar-based scheduling interface:
- FullCalendar integration with multiple views
- Timezone support
- Drag-and-drop scheduling
- Bulk operations
- Visual status indicators
- Platform-specific scheduling

### DraftManager
**Location**: `src/components/DraftManager.tsx`

Comprehensive draft management:
- Auto-save every 30 seconds
- Template system with variables
- Advanced search and filtering
- Word count tracking
- Duplicate and edit functionality
- Export capabilities

### MediaUpload
**Location**: `src/components/MediaUpload.tsx`

Advanced file upload system:
- Drag-and-drop interface
- File type validation
- Image preview and cropping
- Progress tracking
- Alt text support
- Cloudinary integration
- Multiple file support

### UnifiedInbox
**Location**: `src/components/UnifiedInbox.tsx`

Centralized messaging system:
- Multi-platform message aggregation
- Real-time updates via WebSocket
- Message filtering and search
- Reply functionality
- Infinite scroll
- Unread indicators

### Analytics
**Location**: `src/components/Analytics.tsx`

Comprehensive analytics dashboard:
- Interactive charts with Recharts
- Date range selection
- Platform filtering
- Export functionality
- Real-time data updates
- Performance metrics

## 🔧 Configuration

### Environment Variables
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# API Configuration
VITE_API_URL=http://localhost:3001
VITE_WEBSOCKET_URL=http://localhost:3001

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_AI_FEATURES=true
```

### Build Configuration
**File**: `vite.config.ts`
- TypeScript support
- React SWC plugin for fast refresh
- Path aliases for clean imports
- Environment variable handling
- Build optimization

### Tailwind Configuration
**File**: `tailwind.config.ts`
- Custom color palette
- Typography plugin
- Animation utilities
- Responsive breakpoints
- Dark mode support

## 🎯 State Management

### React Query Configuration
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Authentication State
Managed through `useAuth` hook with context provider:
- User authentication status
- JWT token management
- Automatic token refresh
- Protected route handling

### Local State Patterns
- Component state with `useState`
- Form state with React Hook Form
- UI state with custom hooks
- Persistent state with localStorage

## 🔄 Real-time Features

### WebSocket Integration
```typescript
// WebSocket connection with authentication
const socket = io(WEBSOCKET_URL, {
  auth: {
    token: authToken,
  },
  transports: ['websocket'],
});

// Organization-based rooms
socket.emit('join-organization', organizationId);
```

### Real-time Updates
- Live post status updates
- New message notifications
- Analytics data refresh
- Team activity feed
- System notifications

## 📱 Responsive Design

### Mobile-First Approach
- Progressive enhancement from mobile to desktop
- Touch-friendly interface elements
- Optimized navigation for small screens
- Responsive typography and spacing

### Breakpoint Strategy
- **Mobile**: < 768px - Single column layout
- **Tablet**: 768px - 1024px - Adaptive layout
- **Desktop**: > 1024px - Full sidebar navigation

### Mobile Components
- Collapsible sidebar
- Bottom navigation
- Swipe gestures
- Touch-optimized controls

## 🧪 Testing Strategy

### Test Setup
**File**: `src/test/setup.ts`
- Vitest configuration
- React Testing Library setup
- Mock providers
- Global test utilities

### Testing Patterns
- Component unit tests
- Integration tests for user flows
- Mock API responses
- Accessibility testing
- Visual regression testing

### Test Utilities
```typescript
// Custom render with providers
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: RenderOptions
) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={testQueryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    ),
    ...options,
  });
};
```

## 🚀 Performance Optimization

### Code Splitting
- Route-based code splitting
- Component lazy loading
- Dynamic imports for heavy libraries

### Bundle Optimization
- Tree shaking for unused code
- Asset optimization
- Compression and minification

### Runtime Performance
- React.memo for expensive components
- useMemo and useCallback for optimization
- Virtual scrolling for large lists
- Image lazy loading

## 🔒 Security Considerations

### Input Sanitization
- XSS prevention with DOMPurify
- Input validation with Zod schemas
- CSRF protection

### Authentication Security
- JWT token storage in httpOnly cookies
- Automatic token refresh
- Protected route guards
- Role-based access control

### Data Protection
- Sensitive data encryption
- Secure API communication
- Content Security Policy headers

## 📦 Build & Deployment

### Development Build
```bash
npm run dev          # Start development server
npm run build:dev    # Development build
npm run preview      # Preview production build
```

### Production Build
```bash
npm run build        # Production build
npm run lint         # Code linting
npm run test         # Run tests
```

### Deployment to Netlify
- Automatic builds from Git
- Environment variable configuration
- Custom headers and redirects
- Performance monitoring

## 🔧 Troubleshooting

### Common Issues
1. **Build Errors**: Check TypeScript types and imports
2. **Styling Issues**: Verify Tailwind class names
3. **API Errors**: Check network requests and CORS
4. **Authentication**: Verify Firebase configuration

### Debug Tools
- React Developer Tools
- Redux DevTools (if using Redux)
- Network tab for API debugging
- Console logging with proper levels

## 📈 Future Enhancements

### Planned Features
- Progressive Web App (PWA) support
- Offline functionality
- Advanced analytics
- AI-powered content suggestions
- Multi-language support
- Advanced accessibility features

### Technical Improvements
- Micro-frontend architecture
- Enhanced caching strategies
- Performance monitoring
- Error boundary improvements
- Advanced testing coverage
