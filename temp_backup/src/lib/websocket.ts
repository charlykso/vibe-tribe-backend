// Mock WebSocket service - no external dependencies
// import { io, Socket } from 'socket.io-client';
// import { AuthService } from './auth';

export interface NotificationData {
  id: string;
  type: 'post_published' | 'comment_received' | 'mention' | 'system' | 'team_invite';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
  user_id: string;
}

export interface WebSocketEvents {
  notification: (data: NotificationData) => void;
  post_status_update: (data: { postId: string; status: string; platform: string }) => void;
  analytics_update: (data: any) => void;
  team_member_joined: (data: { userId: string; name: string }) => void;
  connection_status: (data: { connected: boolean }) => void;
}

class MockWebSocketService {
  private connected = false;
  private listeners: Map<string, Function[]> = new Map();

  connect(token: string): void {
    // Mock connection
    this.connected = true;
    console.log('Mock WebSocket connected');

    // Simulate connection event
    setTimeout(() => {
      this.emit('connection_status', { connected: true });
    }, 100);

    // Start mock data stream
    this.startMockDataStream();
  }

  disconnect(): void {
    this.connected = false;
    this.listeners.clear();
    console.log('Mock WebSocket disconnected');
  }

  private startMockDataStream(): void {
    // Send mock notifications every 30 seconds
    setInterval(() => {
      if (this.connected) {
        const mockNotification: NotificationData = {
          id: `notif-${Date.now()}`,
          type: 'post_published',
          title: 'New Activity',
          message: 'Someone liked your post!',
          read: false,
          created_at: new Date().toISOString(),
          user_id: '1',
        };
        this.emit('notification', mockNotification);
      }
    }, 30000);

    // Send mock team activity every 15 seconds
    setInterval(() => {
      if (this.connected) {
        const mockActivity = {
          userId: '2',
          name: 'John Doe',
        };
        this.emit('team_member_joined', mockActivity);
      }
    }, 15000);
  }

  on<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off<K extends keyof WebSocketEvents>(event: K, callback?: WebSocketEvents[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners && callback) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit<K extends keyof WebSocketEvents>(event: K, data: Parameters<WebSocketEvents[K]>[0]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  // Notification-specific methods
  markNotificationAsRead(notificationId: string): void {
    console.log('Mock: Mark notification as read:', notificationId);
  }

  markAllNotificationsAsRead(): void {
    console.log('Mock: Mark all notifications as read');
  }

  // Real-time data subscription methods
  subscribeToPostUpdates(postIds: string[]): void {
    console.log('Mock: Subscribe to post updates:', postIds);
  }

  unsubscribeFromPostUpdates(postIds: string[]): void {
    console.log('Mock: Unsubscribe from post updates:', postIds);
  }

  subscribeToAnalytics(): void {
    console.log('Mock: Subscribe to analytics');
  }

  unsubscribeFromAnalytics(): void {
    console.log('Mock: Unsubscribe from analytics');
  }

  // Team collaboration methods
  joinTeamRoom(organizationId: string): void {
    console.log('Mock: Join team room:', organizationId);
  }

  leaveTeamRoom(organizationId: string): void {
    console.log('Mock: Leave team room:', organizationId);
  }

  sendTeamMessage(organizationId: string, message: string): void {
    console.log('Mock: Send team message:', { organizationId, message });
  }

  isConnected(): boolean {
    return this.connected;
  }

  getConnectionState(): 'connected' | 'disconnected' | 'connecting' | 'reconnecting' {
    return this.connected ? 'connected' : 'disconnected';
  }
}

// Export singleton instance
export const websocketService = new MockWebSocketService();

// Export class for testing
export { MockWebSocketService as WebSocketService };
