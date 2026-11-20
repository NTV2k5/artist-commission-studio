import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role, SepayTxStatus, User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StudioService } from './studio.service';
import { StudioOrderQueryDto } from './dto/order-query.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelStudioOrderDto } from './dto/cancel-studio-order.dto';
import { CreateArtworkDto } from './dto/create-artwork.dto';
import { UpdateArtworkDto } from './dto/update-artwork.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { UpdateStudioConfigDto } from './dto/update-config.dto';
import { ReconcileSepayDto } from './dto/reconcile-sepay.dto';

@ApiTags('Artist Studio Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ARTIST)
@Controller('studio')
export class StudioController {
  constructor(private readonly studioService: StudioService) {}

  // ==========================================
  // 1. ORDERS & WORKFLOW DISPATCH
  // ==========================================

  @Get('orders')
  @ApiOperation({ summary: 'List orders with filters (Kanban & Table view)' })
  async getOrders(@Query() query: StudioOrderQueryDto) {
    return this.studioService.getOrders(query);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get single order details by id or orderCode' })
  async getOrderById(@Param('id') id: string) {
    return this.studioService.getOrderById(id);
  }

  @Patch('orders/:id/quote')
  @ApiOperation({ summary: 'Artist finalizes price & complexity quote for an order' })
  async updateQuote(
    @Param('id') id: string,
    @Body() dto: UpdateQuoteDto,
    @CurrentUser() user: User,
  ) {
    return this.studioService.updateQuote(id, dto, user.id);
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Update order status & scheduled on-site mural dates' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.studioService.updateOrderStatus(id, dto, user.id);
  }

  @Post('orders/:id/confirm-cash-payment')
  @ApiOperation({ summary: 'Artist confirms final cash balance received' })
  async confirmCashPayment(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.studioService.confirmCashPayment(id, user.id);
  }

  @Post('orders/:id/cancel')
  @ApiOperation({ summary: 'Artist cancels an order with reason' })
  async cancelOrder(
    @Param('id') id: string,
    @Body() dto: CancelStudioOrderDto,
    @CurrentUser() user: User,
  ) {
    return this.studioService.cancelOrder(id, dto.reason, user.id);
  }

  // ==========================================
  // 2. CMS ARTWORKS & MATERIALS
  // ==========================================

  @Get('artworks')
  @ApiOperation({ summary: 'List all portfolio artworks for artist management' })
  async getArtworks() {
    return this.studioService.getArtworks();
  }

  @Post('artworks')
  @ApiOperation({ summary: 'Create new artwork template in portfolio' })
  async createArtwork(@Body() dto: CreateArtworkDto) {
    return this.studioService.createArtwork(dto);
  }

  @Patch('artworks/:id')
  @ApiOperation({ summary: 'Update an artwork template' })
  async updateArtwork(@Param('id') id: string, @Body() dto: UpdateArtworkDto) {
    return this.studioService.updateArtwork(id, dto);
  }

  @Delete('artworks/:id')
  @ApiOperation({ summary: 'Delete or archive an artwork template' })
  async deleteArtwork(@Param('id') id: string) {
    return this.studioService.deleteArtwork(id);
  }

  @Get('materials')
  @ApiOperation({ summary: 'List all painting mediums & square-meter rates' })
  async getMaterials() {
    return this.studioService.getMaterials();
  }

  @Post('materials')
  @ApiOperation({ summary: 'Create new painting medium' })
  async createMaterial(@Body() dto: CreateMaterialDto) {
    return this.studioService.createMaterial(dto);
  }

  @Patch('materials/:id')
  @ApiOperation({ summary: 'Update painting medium' })
  async updateMaterial(@Param('id') id: string, @Body() dto: UpdateMaterialDto) {
    return this.studioService.updateMaterial(id, dto);
  }

  @Delete('materials/:id')
  @ApiOperation({ summary: 'Delete or deactivate painting medium' })
  async deleteMaterial(@Param('id') id: string) {
    return this.studioService.deleteMaterial(id);
  }

  // ==========================================
  // 3. STUDIO CONFIG
  // ==========================================

  @Get('config')
  @ApiOperation({ summary: 'Get artist bio, studio location & pricing rules' })
  async getConfig() {
    return this.studioService.getConfig();
  }

  @Patch('config')
  @ApiOperation({ summary: 'Update studio config, deposit threshold & multipliers' })
  async updateConfig(@Body() dto: UpdateStudioConfigDto) {
    return this.studioService.updateConfig(dto);
  }

  // ==========================================
  // 4. ANALYTICS & SYSTEM MONITORING
  // ==========================================

  @Get('analytics/overview')
  @ApiOperation({ summary: 'Get financial KPI overview & monthly revenue' })
  async getOverviewAnalytics() {
    return this.studioService.getOverviewAnalytics();
  }

  @Get('monitoring/sepay-logs')
  @ApiOperation({ summary: 'Get list of SePay VietQR webhook transaction logs' })
  async getSepayLogs(@Query('status') status?: SepayTxStatus) {
    return this.studioService.getSepayLogs(status);
  }

  @Post('monitoring/sepay-logs/:id/reconcile')
  @ApiOperation({ summary: '1-Click manual reconciliation for unmatched transactions' })
  async reconcileSepay(
    @Param('id') id: string,
    @Body() dto: ReconcileSepayDto,
  ) {
    return this.studioService.reconcileSepay(id, dto.orderCode);
  }

  @Get('monitoring/health')
  @ApiOperation({ summary: 'Get system health: DB, Redis, R2/Uploads, AI, Payment' })
  async getHealth() {
    return this.studioService.getHealth();
  }
}
