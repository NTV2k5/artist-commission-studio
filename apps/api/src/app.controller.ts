import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  getHealth() {
    return {
      status: 'ok',
      service: '@studio/api',
      timestamp: new Date().toISOString(),
    };
  }
}
