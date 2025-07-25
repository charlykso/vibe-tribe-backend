import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'

// Mock user data
export const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
}

// Mock organization data
export const mockOrganization = {
  id: 'test-org-id',
  name: 'Test Organization',
  plan: 'pro',
  members: [mockUser.uid],
}

// Mock social accounts - for testing only
export const mockSocialAccounts = [
  {
    id: 'twitter-1',
    platform: 'twitter',
    username: 'testuser',
    isConnected: true,
    profilePicture: 'https://example.com/avatar.jpg',
    followerCount: 0, // Real data will be fetched from API
  },
  {
    id: 'linkedin-1',
    platform: 'linkedin',
    username: 'Test User',
    isConnected: true,
    profilePicture: 'https://example.com/avatar.jpg',
    followerCount: 0, // Real data will be fetched from API
  },
]

// Mock posts
export const mockPosts = [
  {
    id: 'post-1',
    content: 'Test post content',
    platforms: ['twitter', 'linkedin'],
    status: 'published',
    scheduledFor: new Date('2024-01-15T10:00:00Z'),
    createdAt: new Date('2024-01-14T10:00:00Z'),
    authorId: mockUser.uid,
  },
  {
    id: 'post-2',
    content: 'Another test post',
    platforms: ['twitter'],
    status: 'scheduled',
    scheduledFor: new Date('2024-01-16T14:00:00Z'),
    createdAt: new Date('2024-01-14T11:00:00Z'),
    authorId: mockUser.uid,
  },
]

// Mock analytics data - for testing only
export const mockAnalytics = {
  totalPosts: 0, // Real data will be fetched from API
  totalEngagement: 0, // Real data will be fetched from API
  followerGrowth: 0, // Real data will be fetched from API
  topPerformingPost: mockPosts[0],
  platformStats: {
    twitter: { posts: 0, engagement: 0, followers: 0 }, // Real data will be fetched from API
    linkedin: { posts: 0, engagement: 0, followers: 0 }, // Real data will be fetched from API
  },
}

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Mock API responses
export const mockApiResponses = {
  auth: {
    login: { user: mockUser, token: 'mock-jwt-token' },
    register: { user: mockUser, token: 'mock-jwt-token' },
    me: { user: mockUser, organization: mockOrganization },
  },
  posts: {
    list: { posts: mockPosts, total: mockPosts.length },
    create: mockPosts[0],
    update: { ...mockPosts[0], content: 'Updated content' },
  },
  socialAccounts: {
    list: mockSocialAccounts,
    connect: mockSocialAccounts[0],
  },
  analytics: mockAnalytics,
}

// Mock fetch function
export const mockFetch = (response: any, status = 200) => {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
  })
}

// Mock WebSocket
export const mockWebSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
}

// Mock auth context
export const mockAuthContext = {
  user: mockUser,
  organization: mockOrganization,
  loading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  updateProfile: vi.fn(),
}

// Mock services
export const mockPostsService = {
  createPost: vi.fn(),
  publishPost: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
  getPosts: vi.fn(),
}

export const mockMediaService = {
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
}

// Export everything
export * from '@testing-library/react'
export { customRender as render }
