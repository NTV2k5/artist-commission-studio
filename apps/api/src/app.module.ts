import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { PublicModule } from './public/public.module';
import { AuthModule } from './auth/auth.module';
import { UploadsModule } from './uploads/uploads.module';
import { OrdersModule } from './orders/orders.module';

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
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
