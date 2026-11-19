import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(OrdersGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_order')
  handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderCode: string },
  ) {
    if (!data?.orderCode) return;
    const room = `order_${data.orderCode}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    return { status: 'joined', room };
  }

  @SubscribeMessage('leave_order')
  handleLeaveOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderCode: string },
  ) {
    if (!data?.orderCode) return;
    const room = `order_${data.orderCode}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
    return { status: 'left', room };
  }

  notifyPaymentConfirmed(orderCode: string, payload: any) {
    const room = `order_${orderCode}`;
    this.logger.log(`Emitting payment_confirmed to ${room}`);
    if (this.server) {
      this.server.to(room).emit('payment_confirmed', payload);
    }
  }

  notifyOrderUpdated(orderCode: string, payload: any) {
    const room = `order_${orderCode}`;
    this.logger.log(`Emitting order_updated to ${room}`);
    if (this.server) {
      this.server.to(room).emit('order_updated', payload);
    }
  }
}
