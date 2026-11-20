import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Connected to PostgreSQL database successfully.');
    } catch (err: any) {
      this.logger.error(
        '⚠️ Could not connect to PostgreSQL on startup. Please ensure Docker PostgreSQL (port 5432) is running: ' +
          (err?.message || err),
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
