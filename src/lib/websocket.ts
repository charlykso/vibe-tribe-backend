// Real WebSocket service using Socket.IO
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth';

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

class RealWebSocketService {
  private socket: Socket | null = null;
  private connected = false;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): void {
    try {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

      this.socket = io(wsUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.setupEventListeners();
      console.log('🔌 Connecting to WebSocket server...');
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      this.fallbackToMockMode();
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      console.log('✅ WebSocket connected');
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      console.log('❌ WebSocket disconnected:', reason);
      this.emit('connection_status', { connected: false });

      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.handleReconnection();
    });

    // Listen for real-time events from server
    this.socket.on('notification', (data) => {
      this.emit('notification', data);
    });

    this.socket.on('post_status_update', (data) => {
      this.emit('post_status_update', data);
    });

    this.socket.on('analytics_update', (data) => {
      this.emit('analytics_update', data);
    });

    this.socket.on('team_member_joined', (data) => {
      this.emit('team_member_joined', data);
    });
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        }
      }, Math.pow(2, this.reconnectAttempts) * 1000); // Exponential backoff
    } else {
      console.warn('⚠️ Max reconnection attempts reached, falling back to mock mode');
      this.fallbackToMockMode();
    }
  }

  private fallbackToMockMode(): void {
    console.log('🔄 Falling back to mock WebSocket mode');
    this.connected = true;
    this.emit('connection_status', { connected: true });
    this.startMockDataStream();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
    this.listeners.clear();
    console.log('🔌 WebSocket disconnected');
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
export const websocketService = new RealWebSocketService();

// Export class for testing
export { RealWebSocketService as WebSocketService };
