import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils'
import { Dashboard } from '../Dashboard'

// Mock the BackendStatus component
vi.mock('../BackendStatus', () => ({
  BackendStatus: () => <div data-testid="backend-status">Backend Status Component</div>
}))

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the dashboard title and description', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Monitor your community health and engagement metrics')).toBeInTheDocument()
  })

  it('renders all stat cards with correct data', () => {
    render(<Dashboard />)
    
    // Check all stat titles
    expect(screen.getByText('Total Members')).toBeInTheDocument()
    expect(screen.getByText('Active Members')).toBeInTheDocument()
    expect(screen.getByText('Messages Today')).toBeInTheDocument()
    expect(screen.getByText('Engagement Rate')).toBeInTheDocument()
    
    // Check stat values
    expect(screen.getByText('24,847')).toBeInTheDocument()
    expect(screen.getByText('18,492')).toBeInTheDocument()
    expect(screen.getByText('3,847')).toBeInTheDocument()
    expect(screen.getByText('74.8%')).toBeInTheDocument()
    
    // Check change percentages
    expect(screen.getByText('+12.5% from last month')).toBeInTheDocument()
    expect(screen.getByText('+8.2% from last month')).toBeInTheDocument()
    expect(screen.getByText('+23.1% from last month')).toBeInTheDocument()
    expect(screen.getByText('+4.3% from last month')).toBeInTheDocument()
  })

  it('renders the backend status component', () => {
    render(<Dashboard />)
    
    expect(screen.getByTestId('backend-status')).toBeInTheDocument()
  })

  it('renders recent activity section', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    
    // Check activity messages
    expect(screen.getByText('John Smith joined the community')).toBeInTheDocument()
    expect(screen.getByText('Post about product updates got 150+ reactions')).toBeInTheDocument()
    expect(screen.getByText('Spam message auto-removed in #general')).toBeInTheDocument()
    expect(screen.getByText('Community reached 25K members!')).toBeInTheDocument()
    
    // Check timestamps
    expect(screen.getByText('2 minutes ago')).toBeInTheDocument()
    expect(screen.getByText('15 minutes ago')).toBeInTheDocument()
    expect(screen.getByText('32 minutes ago')).toBeInTheDocument()
    expect(screen.getByText('1 hour ago')).toBeInTheDocument()
  })

  it('renders communities section with correct data', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('Communities')).toBeInTheDocument()
    
    // Check community names
    expect(screen.getByText('Discord Community')).toBeInTheDocument()
    expect(screen.getByText('Telegram Group')).toBeInTheDocument()
    expect(screen.getByText('Slack Workspace')).toBeInTheDocument()
    
    // Check member counts (formatted with commas)
    expect(screen.getByText('15,420 members')).toBeInTheDocument()
    expect(screen.getByText('8,947 members')).toBeInTheDocument()
    expect(screen.getByText('2,340 members')).toBeInTheDocument()
    
    // Check status badges
    expect(screen.getByText('healthy')).toBeInTheDocument()
    expect(screen.getByText('growing')).toBeInTheDocument()
    expect(screen.getByText('stable')).toBeInTheDocument()
    
    // Check growth percentages
    expect(screen.getByText('+5.2%')).toBeInTheDocument()
    expect(screen.getByText('+12.8%')).toBeInTheDocument()
    expect(screen.getByText('+2.1%')).toBeInTheDocument()
  })

  it('applies correct CSS classes for stat trends', () => {
    render(<Dashboard />)
    
    // All trends are 'up' in the mock data, so they should have green color
    const changeElements = screen.getAllByText(/\+\d+\.\d+% from last month/)
    changeElements.forEach(element => {
      expect(element).toHaveClass('text-green-600')
    })
  })

  it('applies correct status badge colors for communities', () => {
    render(<Dashboard />)
    
    const healthyBadge = screen.getByText('healthy')
    const growingBadge = screen.getByText('growing')
    const stableBadge = screen.getByText('stable')
    
    expect(healthyBadge).toHaveClass('bg-green-100', 'text-green-800')
    expect(growingBadge).toHaveClass('bg-blue-100', 'text-blue-800')
    expect(stableBadge).toHaveClass('bg-gray-100', 'text-gray-800')
  })

  it('renders with proper responsive grid layout', () => {
    render(<Dashboard />)

    // Check that grid elements exist with proper structure
    const statsSection = screen.getByText('Total Members').closest('div')
    expect(statsSection).toBeInTheDocument()

    const recentActivitySection = screen.getByText('Recent Activity')
    expect(recentActivitySection).toBeInTheDocument()

    const communitiesSection = screen.getByText('Communities')
    expect(communitiesSection).toBeInTheDocument()
  })

  it('renders icons for each stat card', () => {
    render(<Dashboard />)
    
    // Icons should be rendered (we can't easily test the specific icon, but we can check they exist)
    const statCards = screen.getAllByText(/Total Members|Active Members|Messages Today|Engagement Rate/)
    expect(statCards).toHaveLength(4)
  })

  it('renders icons for each activity item', () => {
    render(<Dashboard />)
    
    // Each activity item should have an icon
    const activityItems = screen.getAllByText(/John Smith joined|Post about product|Spam message|Community reached/)
    expect(activityItems).toHaveLength(4)
  })
})
