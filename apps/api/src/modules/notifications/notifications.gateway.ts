import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: process.env['ALLOWED_ORIGINS']?.split(',') ?? ['http://localhost:3000'] },
})
export class NotificationsGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    void client.join(`user:${data.userId}`);
    return { subscribed: true };
  }

  sendToUser(userId: string, event: string, payload: Record<string, unknown>) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  broadcastToTenant(tenantId: string, event: string, payload: Record<string, unknown>) {
    this.server.to(`tenant:${tenantId}`).emit(event, payload);
  }
}
