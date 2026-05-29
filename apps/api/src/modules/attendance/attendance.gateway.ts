import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/attendance',
  cors: { origin: process.env['ALLOWED_ORIGINS']?.split(',') ?? ['http://localhost:3000'] },
})
export class AttendanceGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('join-tenant')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { tenantId: string }) {
    void client.join(`tenant:${data.tenantId}`);
    return { joined: `tenant:${data.tenantId}` };
  }

  broadcastAttendanceUpdate(tenantId: string, summary: Record<string, unknown>) {
    this.server.to(`tenant:${tenantId}`).emit('attendance-update', summary);
  }
}
