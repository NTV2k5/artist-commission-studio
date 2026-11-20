import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create new artwork commission order' })
  async createOrder(@Body() dto: CreateOrderDto, @Req() req: any) {
    let authUserId: string | undefined = req.user?.id;
    if (!authUserId && req.headers?.authorization?.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const payload: any = this.jwtService.decode(token);
        if (payload?.sub) {
          authUserId = payload.sub;
        }
      } catch {
        // ignore decoding errors
      }
    }
    return this.ordersService.createOrder(dto, authUserId);
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of orders placed by authenticated user' })
  async getMyOrders(@CurrentUser() user: User) {
    return this.ordersService.getCustomerOrders(user.id);
  }

  @Get(':orderCode')
  @ApiOperation({ summary: 'Get order details by orderCode' })
  async getOrderByCode(@Param('orderCode') orderCode: string) {
    return this.ordersService.getOrderByCode(orderCode);
  }

  @Patch(':orderCode/cancel')
  @ApiOperation({ summary: 'Self-cancel order if eligible' })
  async cancelOrder(
    @Param('orderCode') orderCode: string,
    @Body() dto: CancelOrderDto,
    @Req() req: any,
  ) {
    const authUserId = req.user?.id;
    return this.ordersService.cancelOrder(orderCode, dto.reason, authUserId);
  }
}
