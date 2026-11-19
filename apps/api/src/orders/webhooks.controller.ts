import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { SepayWebhookDto } from './dto/sepay-webhook.dto';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('sepay')
  @ApiOperation({ summary: 'SePay VietQR payment webhook handler' })
  async handleSepayWebhook(
    @Headers('authorization') authHeader: string | undefined,
    @Body() payload: SepayWebhookDto,
  ) {
    return this.ordersService.handleSepayWebhook(authHeader, payload);
  }
}
