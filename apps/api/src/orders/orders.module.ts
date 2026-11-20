import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { WebhooksController } from './webhooks.controller';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [AuthModule, ChatModule],
  controllers: [OrdersController, WebhooksController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
