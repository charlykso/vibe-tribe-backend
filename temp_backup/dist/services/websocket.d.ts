import { Server as SocketIOServer } from 'socket.io';
export declare const initializeWebSocket: (io: SocketIOServer) => void;
export declare const emitToUser: (io: SocketIOServer, userId: string, event: string, data: any) => void;
export declare const emitToOrganization: (io: SocketIOServer, organizationId: string, event: string, data: any) => void;
export declare const emitPostUpdate: (io: SocketIOServer, postId: string, data: any) => void;
export declare const emitAnalyticsUpdate: (io: SocketIOServer, organizationId: string, data: any) => void;
export declare const emitSocialAccountUpdate: (io: SocketIOServer, organizationId: string, data: any) => void;
export declare const emitNotification: (io: SocketIOServer, userId: string, notification: any) => void;
declare const _default: {
    initializeWebSocket: (io: SocketIOServer) => void;
    emitToUser: (io: SocketIOServer, userId: string, event: string, data: any) => void;
    emitToOrganization: (io: SocketIOServer, organizationId: string, event: string, data: any) => void;
    emitPostUpdate: (io: SocketIOServer, postId: string, data: any) => void;
    emitAnalyticsUpdate: (io: SocketIOServer, organizationId: string, data: any) => void;
    emitSocialAccountUpdate: (io: SocketIOServer, organizationId: string, data: any) => void;
    emitNotification: (io: SocketIOServer, userId: string, notification: any) => void;
};
export default _default;
//# sourceMappingURL=websocket.d.ts.map