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
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { MessageType } from '@prisma/client';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Handles incoming WebSocket connection and extracts/verifies JWT token
   */
  async handleConnection(client: Socket) {
    try {
      let token =
        client.handshake.auth?.token ||
        (client.handshake.headers?.authorization as string | undefined);

      if (token?.startsWith('Bearer ')) {
        token = token.substring(7);
      }

      if (token) {
        const secret =
          process.env.JWT_SECRET || 'super_secret_jwt_key_at_least_32_characters_long';
        const payload: any = this.jwtService.verify(token, { secret });
        client.data.user = payload;
        this.logger.log(
          `Client ${client.id} connected & authenticated: ${payload.email} (${payload.role})`,
        );
      } else {
        this.logger.log(`Client ${client.id} connected anonymously`);
      }
    } catch (err: any) {
      this.logger.warn(`Client ${client.id} auth error: ${err.message}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Join an order workspace room (order_{orderCode}) with permission check
   */
  @SubscribeMessage('join_order')
  async handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderCode: string; token?: string },
  ) {
    if (!data?.orderCode) {
      return { status: 'error', message: 'Mã đơn hàng không hợp lệ' };
    }

    // Lazy auth if token passed in join payload
    if (!client.data.user && data.token) {
      try {
        let token = data.token;
        if (token.startsWith('Bearer ')) token = token.substring(7);
        const secret =
          process.env.JWT_SECRET || 'super_secret_jwt_key_at_least_32_characters_long';
        client.data.user = this.jwtService.verify(token, { secret });
      } catch {
        // invalid token
      }
    }

    const order = await this.prisma.order.findUnique({
      where: { orderCode: data.orderCode },
      select: { id: true, customerId: true, orderCode: true },
    });

    if (!order) {
      client.emit('error', { message: 'Đơn hàng không tồn tại' });
      return { status: 'error', message: 'Đơn hàng không tồn tại' };
    }

    const user = client.data.user;
    if (user) {
      const isArtist = user.role === 'ARTIST';
      const isCustomer = user.sub === order.customerId || user.id === order.customerId;

      if (!isArtist && !isCustomer) {
        client.emit('error', {
          message: 'Bạn không có quyền truy cập vào phòng làm việc của đơn hàng này',
        });
        return {
          status: 'error',
          message: 'Bạn không có quyền truy cập vào phòng làm việc của đơn hàng này',
        };
      }
    }

    const room = `order_${data.orderCode}`;
    client.join(room);
    this.logger.log(
      `Client ${client.id} (${user?.email || 'guest'}) joined room ${room}`,
    );

    client.emit('joined', { status: 'joined', room });
    return { status: 'joined', room };
  }

  /**
   * Leave an order workspace room
   */
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

  /**
   * Send a message to order room (saves to Prisma OrderMessage and emits new_message)
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      orderCode: string;
      content: string;
      attachmentUrls?: string[];
      messageType?: MessageType;
      token?: string;
    },
  ) {
    if (!data?.orderCode || (!data?.content && (!data?.attachmentUrls || data.attachmentUrls.length === 0))) {
      return { status: 'error', message: 'Nội dung tin nhắn không thể để trống' };
    }

    // Lazy token extraction if provided
    if (!client.data.user && data.token) {
      try {
        let token = data.token;
        if (token.startsWith('Bearer ')) token = token.substring(7);
        const secret =
          process.env.JWT_SECRET || 'super_secret_jwt_key_at_least_32_characters_long';
        client.data.user = this.jwtService.verify(token, { secret });
      } catch {
        // invalid token
      }
    }

    const order = await this.prisma.order.findUnique({
      where: { orderCode: data.orderCode },
      select: { id: true, customerId: true, orderCode: true },
    });

    if (!order) {
      return { status: 'error', message: 'Đơn hàng không tồn tại' };
    }

    const user = client.data.user;
    let senderId = user?.sub || user?.id;

    if (!senderId) {
      // Default to order customer if anonymous on order workspace
      senderId = order.customerId;
    } else {
      const isArtist = user.role === 'ARTIST';
      const isCustomer = senderId === order.customerId;
      if (!isArtist && !isCustomer) {
        return { status: 'error', message: 'Bạn không có quyền gửi tin nhắn trong đơn hàng này' };
      }
    }

    const messageType: MessageType = data.messageType || MessageType.TEXT;

    const message = await this.prisma.orderMessage.create({
      data: {
        orderId: order.id,
        senderId,
        content: data.content || '',
        attachmentUrls: data.attachmentUrls || [],
        messageType,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
    });

    const room = `order_${data.orderCode}`;
    this.server.to(room).emit('new_message', message);
    this.logger.log(`New message emitted to room ${room} from sender ${senderId}`);

    return { status: 'success', message };
  }

  /**
   * Helper methods for external services (OrdersService, Webhooks) to broadcast events
   */
  notifyNewMessage(orderCode: string, message: any) {
    const room = `order_${orderCode}`;
    if (this.server) {
      this.server.to(room).emit('new_message', message);
    }
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
