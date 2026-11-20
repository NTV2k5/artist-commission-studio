import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { PublicModule } from './public/public.module';
import { AuthModule } from './auth/auth.module';
import { UploadsModule } from './uploads/uploads.module';
import { OrdersModule } from './orders/orders.module';
import { ChatModule } from './chat/chat.module';
import { AiAssistantModule } from './ai-assistant/ai-assistant.module';
import { StudioModule } from './studio/studio.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    PrismaModule,
    PublicModule,
    AuthModule,
    UploadsModule,
    ChatModule,
    OrdersModule,
    AiAssistantModule,
    StudioModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
