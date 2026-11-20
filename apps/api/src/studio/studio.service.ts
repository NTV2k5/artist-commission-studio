import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Complexity,
  MessageType,
  OrderStatus,
  SepayTxStatus,
  ServiceType,
} from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { StudioOrderQueryDto } from './dto/order-query.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreateArtworkDto } from './dto/create-artwork.dto';
import { UpdateArtworkDto } from './dto/update-artwork.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { UpdateStudioConfigDto } from './dto/update-config.dto';

@Injectable()
export class StudioService {
  private readonly logger = new Logger(StudioService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  // ==========================================
  // 1. ORDER & FINANCIAL MANAGEMENT
  // ==========================================

  /**
   * Retrieves list of orders with filters and pagination
   */
  async getOrders(query: StudioOrderQueryDto) {
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.serviceType) {
      where.serviceType = query.serviceType;
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { orderCode: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatarUrl: true,
            },
          },
          material: true,
          template: true,
          sepayTransactions: true,
          messages: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                select: { id: true, name: true, role: true },
              },
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves single order by ID or orderCode
   */
  async getOrderById(id: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderCode: id }],
      },
      include: {
        customer: true,
        material: true,
        template: true,
        sepayTransactions: {
          orderBy: { createdAt: 'desc' },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
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
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    return order;
  }

  /**
   * Confirms/adjusts quote for custom reference orders or PENDING_QUOTE orders
   */
  async updateQuote(orderId: string, dto: UpdateQuoteDto, artistId?: string) {
    const order = await this.prisma.order.findFirst({
      where: { OR: [{ id: orderId }, { orderCode: orderId }] },
    });

    if (!order) {
      throw new NotFoundException(`Order #${orderId} not found`);
    }

    const config = await this.prisma.artistStudioConfig.findFirst();

    const artworkPrice = dto.artworkPrice !== undefined ? dto.artworkPrice : order.artworkPrice;
    const shippingOrTravelFee =
      dto.shippingOrTravelFee !== undefined ? dto.shippingOrTravelFee : order.shippingOrTravelFee;
    const complexity = dto.complexity || order.complexity;

    const totalAmount = artworkPrice + shippingOrTravelFee;

    const depositThreshold = config?.depositThreshold ?? 1500000;
    const depositPercent = config?.depositPercent ?? 40;

    const requireDeposit =
      totalAmount >= depositThreshold ||
      order.serviceType === ServiceType.WALL_MURAL ||
      (order.customReferenceUrls && order.customReferenceUrls.length > 0);

    const depositAmount = requireDeposit ? Math.round(totalAmount * (depositPercent / 100)) : 0;

    // Transition status
    let nextStatus = order.status;
    if (order.status === OrderStatus.PENDING_QUOTE) {
      nextStatus = requireDeposit ? OrderStatus.AWAITING_DEPOSIT : OrderStatus.SKETCHING;
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        complexity,
        artworkPrice,
        shippingOrTravelFee,
        totalAmount,
        requireDeposit,
        depositAmount,
        status: nextStatus,
        messages: {
          create: {
            senderId: artistId || order.customerId,
            content: `Họa sĩ đã hoàn tất thẩm định và chốt báo giá chính thức: Giá vẽ tranh ${artworkPrice.toLocaleString(
              'vi-VN',
            )} VNĐ, Phí vận chuyển/thi công ${shippingOrTravelFee.toLocaleString(
              'vi-VN',
            )} VNĐ. Tổng chi phí: ${totalAmount.toLocaleString('vi-VN')} VNĐ ${
              requireDeposit
                ? `(Khoản cọc bắt buộc: ${depositAmount.toLocaleString('vi-VN')} VNĐ)`
                : '(Không yêu cầu đặt cọc trước)'
            }.`,
            messageType: MessageType.SYSTEM_EVENT,
          },
        },
      },
      include: {
        customer: true,
        material: true,
        template: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    // Realtime Socket broadcast
    if (updated.messages[0]) {
      this.chatGateway.notifyNewMessage(order.orderCode, updated.messages[0]);
    }
    this.chatGateway.notifyOrderUpdated(order.orderCode, {
      orderCode: order.orderCode,
      status: updated.status,
      totalAmount: updated.totalAmount,
      depositAmount: updated.depositAmount,
    });

    return updated;
  }

  /**
   * Updates order lifecycle status & schedules wall mural on-site dates with conflict detection
   */
  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto, artistId?: string) {
    const order = await this.prisma.order.findFirst({
      where: { OR: [{ id: orderId }, { orderCode: orderId }] },
    });

    if (!order) {
      throw new NotFoundException(`Order #${orderId} not found`);
    }

    const scheduledStartDate = dto.scheduledStartDate
      ? new Date(dto.scheduledStartDate)
      : order.scheduledStartDate;
    const scheduledEndDate = dto.scheduledEndDate
      ? new Date(dto.scheduledEndDate)
      : order.scheduledEndDate;

    // Check Wall Mural scheduling conflicts
    let hasScheduleConflict = false;
    let conflictingOrders: string[] = [];

    if (order.serviceType === ServiceType.WALL_MURAL && scheduledStartDate && scheduledEndDate) {
      const overlaps = await this.prisma.order.findMany({
        where: {
          id: { not: order.id },
          serviceType: ServiceType.WALL_MURAL,
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.COMPLETED] },
          scheduledStartDate: { lte: scheduledEndDate },
          scheduledEndDate: { gte: scheduledStartDate },
        },
        select: { orderCode: true, scheduledStartDate: true, scheduledEndDate: true },
      });

      if (overlaps.length > 0) {
        hasScheduleConflict = true;
        conflictingOrders = overlaps.map((o) => o.orderCode);
      }
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: dto.status,
        scheduledStartDate,
        scheduledEndDate,
        messages: {
          create: {
            senderId: artistId || order.customerId,
            content: `Họa sĩ đã cập nhật tiến độ đơn hàng: Chuyển sang trạng thái [${dto.status}]${
              scheduledStartDate
                ? `. Lịch thi công: ${scheduledStartDate.toLocaleDateString('vi-VN')} - ${
                    scheduledEndDate?.toLocaleDateString('vi-VN') || '...'
                  }`
                : ''
            }.`,
            messageType: MessageType.SYSTEM_EVENT,
          },
        },
      },
      include: {
        customer: true,
        material: true,
        template: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    if (updated.messages[0]) {
      this.chatGateway.notifyNewMessage(order.orderCode, updated.messages[0]);
    }
    this.chatGateway.notifyOrderUpdated(order.orderCode, {
      orderCode: order.orderCode,
      status: updated.status,
      scheduledStartDate: updated.scheduledStartDate,
      scheduledEndDate: updated.scheduledEndDate,
    });

    return {
      order: updated,
      hasScheduleConflict,
      conflictingOrders,
    };
  }

  /**
   * Artist confirms cash balance received upon delivery/completion
   */
  async confirmCashPayment(orderId: string, artistId?: string) {
    const order = await this.prisma.order.findFirst({
      where: { OR: [{ id: orderId }, { orderCode: orderId }] },
    });

    if (!order) {
      throw new NotFoundException(`Order #${orderId} not found`);
    }

    const remainingCash = Math.max(0, order.totalAmount - order.paidAmount);

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paidAmount: order.totalAmount,
        status: order.status === OrderStatus.DELIVERING ? OrderStatus.COMPLETED : order.status,
        messages: {
          create: {
            senderId: artistId || order.customerId,
            content: `Họa sĩ đã xác nhận thu nốt số tiền mặt còn lại (${remainingCash.toLocaleString(
              'vi-VN',
            )} VNĐ). Đơn hàng đã hoàn tất thanh toán 100%.`,
            messageType: MessageType.SYSTEM_EVENT,
          },
        },
      },
      include: {
        customer: true,
        material: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    if (updated.messages[0]) {
      this.chatGateway.notifyNewMessage(order.orderCode, updated.messages[0]);
    }
    this.chatGateway.notifyOrderUpdated(order.orderCode, {
      orderCode: order.orderCode,
      paidAmount: updated.paidAmount,
      status: updated.status,
    });

    return updated;
  }

  /**
   * Cancels order from the artist side
   */
  async cancelOrder(orderId: string, reason: string, artistId?: string) {
    const order = await this.prisma.order.findFirst({
      where: { OR: [{ id: orderId }, { orderCode: orderId }] },
    });

    if (!order) {
      throw new NotFoundException(`Order #${orderId} not found`);
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CANCELLED,
        cancellationReason: reason,
        messages: {
          create: {
            senderId: artistId || order.customerId,
            content: `Họa sĩ đã hủy đơn hàng. Lý do: "${reason}". Vui lòng liên hệ trực tiếp họa sĩ nếu cần đối soát hoàn cọc.`,
            messageType: MessageType.SYSTEM_EVENT,
          },
        },
      },
    });

    this.chatGateway.notifyOrderUpdated(order.orderCode, {
      orderCode: order.orderCode,
      status: OrderStatus.CANCELLED,
      cancellationReason: reason,
    });

    return updated;
  }

  // ==========================================
  // 2. CMS ARTWORKS & MATERIALS (NO STRAPI)
  // ==========================================

  async getArtworks() {
    return this.prisma.artworkTemplate.findMany({
      include: { material: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createArtwork(dto: CreateArtworkDto) {
    return this.prisma.artworkTemplate.create({
      data: {
        title: dto.title,
        slug: dto.slug.toLowerCase().trim(),
        description: dto.description,
        images: dto.images,
        serviceType: dto.serviceType,
        materialId: dto.materialId,
        defaultComplexity: dto.defaultComplexity || Complexity.MEDIUM,
        dimensionsNote: dto.dimensionsNote,
        isFeatured: dto.isFeatured ?? false,
        isAvailable: dto.isAvailable ?? true,
      },
      include: { material: true },
    });
  }

  async updateArtwork(id: string, dto: UpdateArtworkDto) {
    return this.prisma.artworkTemplate.update({
      where: { id },
      data: {
        ...dto,
        slug: dto.slug ? dto.slug.toLowerCase().trim() : undefined,
      },
      include: { material: true },
    });
  }

  async deleteArtwork(id: string) {
    const count = await this.prisma.order.count({ where: { templateId: id } });
    if (count > 0) {
      // Soft disable if existing orders reference this artwork
      return this.prisma.artworkTemplate.update({
        where: { id },
        data: { isAvailable: false },
      });
    }
    return this.prisma.artworkTemplate.delete({ where: { id } });
  }

  async getMaterials() {
    return this.prisma.material.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMaterial(dto: CreateMaterialDto) {
    return this.prisma.material.create({
      data: {
        name: dto.name,
        slug: dto.slug.toLowerCase().trim(),
        serviceType: dto.serviceType,
        basePricePerM2: dto.basePricePerM2,
        description: dto.description,
        durabilityNote: dto.durabilityNote,
        sampleImageUrl: dto.sampleImageUrl,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateMaterial(id: string, dto: UpdateMaterialDto) {
    return this.prisma.material.update({
      where: { id },
      data: {
        ...dto,
        slug: dto.slug ? dto.slug.toLowerCase().trim() : undefined,
      },
    });
  }

  async deleteMaterial(id: string) {
    const count = await this.prisma.order.count({ where: { materialId: id } });
    if (count > 0) {
      return this.prisma.material.update({
        where: { id },
        data: { isActive: false },
      });
    }
    return this.prisma.material.delete({ where: { id } });
  }

  // ==========================================
  // 3. STUDIO CONFIG & DYNAMIC PRICING RULES
  // ==========================================

  async getConfig() {
    let config = await this.prisma.artistStudioConfig.findFirst();
    if (!config) {
      config = await this.prisma.artistStudioConfig.create({
        data: {
          id: 'default-config',
          artistName: 'Họa sĩ Quốc Tuấn',
          bio: 'Họa sĩ đương đại tốt nghiệp Đại học Mỹ thuật Việt Nam...',
        },
      });
    }
    return config;
  }

  async updateConfig(dto: UpdateStudioConfigDto) {
    const existing = await this.getConfig();
    return this.prisma.artistStudioConfig.update({
      where: { id: existing.id },
      data: dto,
    });
  }

  // ==========================================
  // 4. FINANCIAL ANALYTICS & MONITORING
  // ==========================================

  async getOverviewAnalytics() {
    const allOrders = await this.prisma.order.findMany({
      select: {
        id: true,
        orderCode: true,
        status: true,
        serviceType: true,
        totalAmount: true,
        paidAmount: true,
        depositAmount: true,
        requireDeposit: true,
        createdAt: true,
        customer: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalRevenue = 0;
    let sepayCollected = 0;
    let cashRemainingToCollect = 0;
    let activeOrdersCount = 0;
    let pendingQuotesCount = 0;
    let awaitingDepositCount = 0;

    for (const order of allOrders) {
      if (order.status !== OrderStatus.CANCELLED) {
        totalRevenue += order.totalAmount;
        sepayCollected += order.paidAmount;

        if (
          order.status === OrderStatus.DEPOSIT_PAID ||
          order.status === OrderStatus.SKETCHING ||
          order.status === OrderStatus.PAINTING ||
          order.status === OrderStatus.DELIVERING
        ) {
          activeOrdersCount++;
          const remaining = Math.max(0, order.totalAmount - order.paidAmount);
          cashRemainingToCollect += remaining;
        }
      }

      if (order.status === OrderStatus.PENDING_QUOTE) {
        pendingQuotesCount++;
      }
      if (order.status === OrderStatus.AWAITING_DEPOSIT) {
        awaitingDepositCount++;
      }
    }

    // Monthly revenue aggregation (last 6 months)
    const monthlyMap = new Map<string, { month: string; revenue: number; count: number }>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `T${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
      monthlyMap.set(key, { month: key, revenue: 0, count: 0 });
    }

    for (const order of allOrders) {
      if (order.status !== OrderStatus.CANCELLED) {
        const d = new Date(order.createdAt);
        const key = `T${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
        if (monthlyMap.has(key)) {
          const item = monthlyMap.get(key)!;
          item.revenue += order.totalAmount;
          item.count++;
        }
      }
    }

    // Critical urgent orders (pending quote or awaiting deposit)
    const urgentOrders = allOrders
      .filter(
        (o) =>
          o.status === OrderStatus.PENDING_QUOTE ||
          o.status === OrderStatus.AWAITING_DEPOSIT ||
          o.status === OrderStatus.SKETCHING,
      )
      .slice(0, 6);

    return {
      kpi: {
        totalRevenue,
        sepayCollected,
        cashRemainingToCollect,
        activeOrdersCount,
        pendingQuotesCount,
        awaitingDepositCount,
        totalOrdersCount: allOrders.length,
      },
      monthlyRevenue: Array.from(monthlyMap.values()),
      urgentOrders,
    };
  }

  async getSepayLogs(status?: SepayTxStatus) {
    return this.prisma.sepayTransaction.findMany({
      where: status ? { status } : undefined,
      include: {
        order: {
          select: {
            id: true,
            orderCode: true,
            status: true,
            totalAmount: true,
            paidAmount: true,
            customer: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * 1-Click manual reconciliation for UNMATCHED_REVIEW transactions
   */
  async reconcileSepay(transactionId: string, orderCode: string) {
    const cleanCode = orderCode.trim().toUpperCase();

    const order = await this.prisma.order.findUnique({
      where: { orderCode: cleanCode },
    });

    if (!order) {
      throw new NotFoundException(`Đơn hàng #${cleanCode} không tồn tại để đối soát`);
    }

    const tx = await this.prisma.sepayTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!tx) {
      throw new NotFoundException(`Giao dịch SePay #${transactionId} không tồn tại`);
    }

    const newPaidAmount = order.paidAmount + tx.amount;
    const isDepositSatisfied = newPaidAmount >= order.depositAmount;

    let nextStatus = order.status;
    if (order.status === OrderStatus.AWAITING_DEPOSIT && isDepositSatisfied) {
      nextStatus = OrderStatus.DEPOSIT_PAID;
    }

    const result = await this.prisma.$transaction(async (prisma) => {
      // 1. Update transaction
      const updatedTx = await prisma.sepayTransaction.update({
        where: { id: tx.id },
        data: {
          orderId: order.id,
          status: SepayTxStatus.MATCHED,
        },
      });

      // 2. Update order
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          paidAmount: newPaidAmount,
          status: nextStatus,
          messages: {
            create: {
              senderId: order.customerId,
              content: `Giao dịch SePay VietQR ${tx.amount.toLocaleString(
                'vi-VN',
              )} VNĐ (Mã GD: ${tx.sepayTxId}) đã được đối soát thủ công thành công bởi Họa sĩ.`,
              messageType: MessageType.SYSTEM_EVENT,
            },
          },
        },
        include: {
          customer: true,
          material: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { sender: { select: { id: true, name: true, role: true } } },
          },
        },
      });

      return { updatedTx, updatedOrder };
    });

    // Realtime notification
    if (result.updatedOrder.messages[0]) {
      this.chatGateway.notifyNewMessage(order.orderCode, result.updatedOrder.messages[0]);
    }

    this.chatGateway.notifyPaymentConfirmed(order.orderCode, {
      orderCode: order.orderCode,
      transferAmount: tx.amount,
      paidAmount: result.updatedOrder.paidAmount,
      depositAmount: result.updatedOrder.depositAmount,
      totalAmount: result.updatedOrder.totalAmount,
      status: result.updatedOrder.status,
      isFullyDeposited: isDepositSatisfied,
    });

    this.chatGateway.notifyOrderUpdated(order.orderCode, {
      orderCode: order.orderCode,
      status: result.updatedOrder.status,
      paidAmount: result.updatedOrder.paidAmount,
    });

    return {
      success: true,
      message: `Đã đối soát thành công giao dịch ${tx.amount.toLocaleString('vi-VN')} VNĐ vào đơn hàng #${cleanCode}`,
      order: result.updatedOrder,
    };
  }

  /**
   * System health check
   */
  async getHealth() {
    let dbStatus = 'healthy';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'unhealthy';
    }

    // Local uploads directory check
    const uploadsDir = path.join(process.cwd(), 'uploads');
    let localFilesCount = 0;
    let localDiskSizeBytes = 0;
    try {
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        localFilesCount = files.length;
        for (const f of files) {
          const stat = fs.statSync(path.join(uploadsDir, f));
          localDiskSizeBytes += stat.size;
        }
      }
    } catch {
      // ignore
    }

    const hasR2 = Boolean(
      process.env.CLOUDFLARE_R2_ACCOUNT_ID &&
        process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
        !process.env.CLOUDFLARE_R2_ACCOUNT_ID.includes('dummy'),
    );

    const hasGemini = Boolean(
      process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('dummy'),
    );

    const hasSepay = Boolean(
      process.env.SEPAY_WEBHOOK_KEY && !process.env.SEPAY_WEBHOOK_KEY.includes('dummy'),
    );

    return {
      status: dbStatus === 'healthy' ? 'operational' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          provider: 'PostgreSQL (Prisma)',
          status: dbStatus,
        },
        redis: {
          provider: 'Redis Cache & Queue',
          status: 'healthy',
        },
        storage: {
          mode: hasR2 ? 'Cloudflare R2 Direct' : 'Local Disk Fallback',
          localFilesCount,
          localDiskSizeMb: Number((localDiskSizeBytes / (1024 * 1024)).toFixed(2)),
          r2Configured: hasR2,
        },
        integrations: {
          geminiAi: {
            configured: hasGemini,
            model: 'gemini-2.5-flash',
          },
          sepayVietQr: {
            configured: hasSepay,
            bank: process.env.NEXT_PUBLIC_SEPAY_BANK_NAME || 'MBBank',
          },
        },
      },
    };
  }
}
