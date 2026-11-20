import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  Complexity,
  MessageType,
  OrderStatus,
  PaymentMethod,
  Role,
  SepayTxStatus,
  ServiceType,
} from '@prisma/client';
import { FrameOption, calculateCommissionPrice } from '@studio/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { SepayWebhookDto } from './dto/sepay-webhook.dto';
import { OrdersGateway } from './orders.gateway';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersGateway: OrdersGateway,
  ) {}

  /**
   * Generates a unique 6-character order code prefixed with DH (e.g. DH123456)
   */
  private async generateUniqueOrderCode(): Promise<string> {
    for (let attempts = 0; attempts < 10; attempts++) {
      const randomPart = Math.floor(100000 + Math.random() * 900000).toString();
      const code = `DH${randomPart}`;
      const existing = await this.prisma.order.findUnique({
        where: { orderCode: code },
      });
      if (!existing) {
        return code;
      }
    }
    return `DH${Date.now().toString().slice(-6)}`;
  }

  /**
   * Creates an order with strict Zero Client-Side Price Trust
   */
  async createOrder(dto: CreateOrderDto, authUserId?: string) {
    // 1. Fetch Material by ID, slug, or serviceType fallback
    let material = await this.prisma.material.findFirst({
      where: {
        OR: [
          { id: dto.materialId },
          { slug: dto.materialId },
        ],
      },
    });

    if (!material) {
      material = await this.prisma.material.findFirst({
        where: { serviceType: dto.serviceType },
      });
    }

    if (!material) {
      throw new NotFoundException(`Chất liệu vẽ không tồn tại trên hệ thống`);
    }

    // 2. Fetch Studio Configuration for dynamic pricing params
    const studioConfig = await this.prisma.artistStudioConfig.findFirst();
    if (!studioConfig) {
      throw new NotFoundException('Studio configuration not initialized in database');
    }

    // 3. Strict Server-Side Price Calculation
    const isCustom = Boolean(
      dto.customReferenceUrls &&
      dto.customReferenceUrls.length > 0 &&
      !dto.templateId,
    );

    const pricing = calculateCommissionPrice({
      serviceType: dto.serviceType as any,
      widthCm: dto.widthCm,
      heightCm: dto.heightCm,
      materialBasePricePerM2: material.basePricePerM2,
      complexity: dto.complexity as any,
      frameOption: dto.frameOption as any,
      distanceKm: dto.distanceKm ?? 0,
      isCustomReference: isCustom,
      config: {
        depositThreshold: studioConfig.depositThreshold,
        depositPercent: studioConfig.depositPercent,
        minFramedAreaM2: studioConfig.minFramedAreaM2,
        minMuralAreaM2: studioConfig.minMuralAreaM2,
        freeSketchRevisions: studioConfig.freeSketchRevisions,
        freeKmRadius: studioConfig.freeKmRadius,
        feePerKm: studioConfig.feePerKm,
        simpleMultiplier: studioConfig.simpleMultiplier,
        mediumMultiplier: studioConfig.mediumMultiplier,
        complexMultiplier: studioConfig.complexMultiplier,
      },
    });

    // 4. Identify or Create Customer User
    const normalizedEmail = dto.customerEmail.toLowerCase().trim();
    const artistAdminEmail = (process.env.ARTIST_ADMIN_EMAIL || 'artist@studio.vn').toLowerCase().trim();
    const role = normalizedEmail === artistAdminEmail ? Role.ARTIST : Role.CUSTOMER;

    let customer = authUserId
      ? await this.prisma.user.findUnique({ where: { id: authUserId } })
      : await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!customer) {
      customer = await this.prisma.user.upsert({
        where: { email: normalizedEmail },
        update: {
          name: dto.customerName || undefined,
          phone: dto.customerPhone || undefined,
        },
        create: {
          email: normalizedEmail,
          name: dto.customerName,
          phone: dto.customerPhone,
          role,
        },
      });
    }

    // 5. Resolve valid ArtworkTemplate if requested
    let resolvedTemplateId: string | null = null;
    if (dto.templateId) {
      const template = await this.prisma.artworkTemplate.findFirst({
        where: {
          OR: [
            { id: dto.templateId },
            { slug: dto.templateId },
          ],
        },
      });
      if (template) {
        resolvedTemplateId = template.id;
      }
    }

    // 6. Generate Order Code & Initial Status
    const orderCode = await this.generateUniqueOrderCode();
    // If customer uploaded custom image and no template selected, requires artist review quote first
    const initialStatus = isCustom
      ? OrderStatus.PENDING_QUOTE
      : OrderStatus.AWAITING_DEPOSIT;

    const order = await this.prisma.order.create({
      data: {
        orderCode,
        customerId: customer.id,
        serviceType: dto.serviceType,
        templateId: resolvedTemplateId,
        customReferenceUrls: dto.customReferenceUrls || [],
        widthCm: dto.widthCm,
        heightCm: dto.heightCm,
        materialId: material.id,
        complexity: dto.complexity,
        frameOption: dto.frameOption || null,
        address: dto.address,
        distanceKm: dto.distanceKm ?? 0,
        shippingOrTravelFee: pricing.shippingOrTravelFee,
        artworkPrice: pricing.artworkBasePrice + pricing.framePrice + pricing.siteSurcharge,
        totalAmount: pricing.totalAmount,
        requireDeposit: pricing.requireDeposit,
        depositAmount: pricing.depositAmount,
        paidAmount: 0,
        paymentMethod: PaymentMethod.SEPAY_VIETQR,
        status: initialStatus,
        scheduledStartDate: dto.scheduledStartDate ? new Date(dto.scheduledStartDate) : null,
        scheduledEndDate: dto.scheduledEndDate ? new Date(dto.scheduledEndDate) : null,
        messages: {
          create: [
            {
              senderId: customer.id,
              content: `Khách hàng ${dto.customerName} đã khởi tạo yêu cầu đặt tranh ${dto.serviceType === ServiceType.FRAMED_ART ? 'đóng khung' : 'bích họa tường'}. Mã đơn: ${orderCode}.`,
              messageType: MessageType.SYSTEM_EVENT,
            },
            ...(dto.notes
              ? [
                  {
                    senderId: customer.id,
                    content: dto.notes,
                    messageType: MessageType.TEXT,
                  },
                ]
              : []),
          ],
        },
      },
      include: {
        customer: true,
        material: true,
        template: true,
        messages: true,
      },
    });

    this.logger.log(`Created order ${orderCode} for customer ${customer.email} (Total: ${order.totalAmount} VNĐ)`);
    return order;
  }

  /**
   * Retrieves order by unique code with full relations
   */
  async getOrderByCode(orderCode: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderCode },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true, avatarUrl: true },
        },
        material: true,
        template: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, name: true, email: true, avatarUrl: true, role: true },
            },
          },
        },
        sepayTransactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with code "${orderCode}" not found`);
    }

    return order;
  }

  /**
   * Retrieves list of orders for a customer
   */
  async getCustomerOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        material: true,
        template: true,
      },
    });
  }

  /**
   * Self-cancellation by customer adhering to strict business rules
   */
  async cancelOrder(orderCode: string, reason?: string, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderCode },
    });

    if (!order) {
      throw new NotFoundException(`Order with code "${orderCode}" not found`);
    }

    // Cancellation constraint: ONLY while PENDING_QUOTE or AWAITING_DEPOSIT with paidAmount === 0
    const cancellableStatuses: OrderStatus[] = [
      OrderStatus.PENDING_QUOTE,
      OrderStatus.AWAITING_DEPOSIT,
    ];

    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException(
        'Đơn hàng đã qua giai đoạn đặt cọc hoặc đang trong quá trình thực hiện, không thể tự hủy trực tuyến. Vui lòng liên hệ trực tiếp họa sĩ.',
      );
    }

    if (order.paidAmount > 0) {
      throw new BadRequestException(
        'Đơn hàng đã phát sinh khoản thanh toán được ghi nhận, không thể tự hủy. Vui lòng liên hệ họa sĩ để đối soát hoàn tiền.',
      );
    }

    const cancellationReason = reason || 'Khách hàng yêu cầu hủy đơn hàng';

    const updated = await this.prisma.order.update({
      where: { orderCode },
      data: {
        status: OrderStatus.CANCELLED,
        cancellationReason,
        messages: {
          create: {
            senderId: userId || order.customerId,
            content: `Đơn hàng đã được hủy. Lý do: ${cancellationReason}`,
            messageType: MessageType.SYSTEM_EVENT,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    this.ordersGateway.notifyOrderUpdated(orderCode, {
      orderCode,
      status: OrderStatus.CANCELLED,
      cancellationReason,
    });

    return updated;
  }

  /**
   * Handles incoming SePay VietQR Webhooks with authentication and idempotency
   */
  async handleSepayWebhook(authHeader: string | undefined, payload: SepayWebhookDto) {
    // 1. Validate SePay API Key
    const expectedKey = process.env.SEPAY_API_KEY || 'sepay_secret_api_key_test_12345';
    const authValid =
      authHeader === `Apikey ${expectedKey}` ||
      authHeader === expectedKey ||
      authHeader === `Bearer ${expectedKey}`;

    if (!authValid) {
      this.logger.warn(`Unauthorized SePay webhook attempt: received header "${authHeader}"`);
      throw new UnauthorizedException('Invalid or missing SePay API Key in Authorization header');
    }

    const txIdStr = String(payload.id);
    const transferAmount = Number(payload.transferAmount);

    // 2. Parse Order Code from transferContent / description (DHxxxxxx)
    const combinedContent = `${payload.content} ${payload.description || ''}`;
    const match = combinedContent.match(/(DH[0-9A-Z]{4,10})/i);
    const matchedOrderCode = match ? match[1].toUpperCase() : null;

    this.logger.log(
      `Processing SePay Webhook [TX: ${txIdStr}]: Amount ${transferAmount} VNĐ | Content: "${payload.content}" | Extracted Code: ${matchedOrderCode || 'NONE'}`,
    );

    // 3. Process inside Prisma Transaction for Idempotency
    const result = await this.prisma.$transaction(async (tx) => {
      // Check for duplicate transaction
      const existingTx = await tx.sepayTransaction.findUnique({
        where: { sepayTxId: txIdStr },
      });

      if (existingTx) {
        return {
          duplicate: true,
          orderCode: matchedOrderCode,
          txId: txIdStr,
        };
      }

      if (!matchedOrderCode) {
        // Record unmatched transaction for manual artist review
        const unmatched = await tx.sepayTransaction.create({
          data: {
            sepayTxId: txIdStr,
            amount: transferAmount,
            transferContent: payload.content,
            gateway: payload.gateway,
            rawPayload: payload as any,
            status: SepayTxStatus.UNMATCHED_REVIEW,
          },
        });
        return { duplicate: false, unmatched: true, txRecord: unmatched };
      }

      const targetOrder = await tx.order.findUnique({
        where: { orderCode: matchedOrderCode },
      });

      if (!targetOrder) {
        // Order code not found in DB
        const unmatched = await tx.sepayTransaction.create({
          data: {
            sepayTxId: txIdStr,
            amount: transferAmount,
            transferContent: payload.content,
            gateway: payload.gateway,
            rawPayload: payload as any,
            status: SepayTxStatus.UNMATCHED_REVIEW,
          },
        });
        return { duplicate: false, unmatched: true, txRecord: unmatched };
      }

      // Compute new paid amount
      const newPaidAmount = targetOrder.paidAmount + transferAmount;

      // Status transition & Underpayment rule:
      let newStatus = targetOrder.status;
      let statusNote = '';

      if (targetOrder.requireDeposit) {
        if (newPaidAmount < targetOrder.depositAmount) {
          // Underpayment: remains AWAITING_DEPOSIT
          newStatus = OrderStatus.AWAITING_DEPOSIT;
          const shortfall = targetOrder.depositAmount - newPaidAmount;
          statusNote = ` (Chưa đủ tiền cọc, còn thiếu ${shortfall.toLocaleString('vi-VN')} đ)`;
        } else {
          // Deposit reached or exceeded
          if (
            targetOrder.status === OrderStatus.AWAITING_DEPOSIT ||
            targetOrder.status === OrderStatus.PENDING_QUOTE
          ) {
            newStatus = OrderStatus.DEPOSIT_PAID;
            statusNote = ' (Đã thanh toán đủ tiền cọc thành công)';
          }
        }
      } else {
        // No deposit required: full amount triggers deposit_paid / paid
        if (newPaidAmount >= targetOrder.totalAmount) {
          newStatus = OrderStatus.DEPOSIT_PAID;
        }
      }

      const updatedOrder = await tx.order.update({
        where: { id: targetOrder.id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
          messages: {
            create: {
              senderId: targetOrder.customerId,
              content: `Thanh toán VietQR ${transferAmount.toLocaleString('vi-VN')} đ được ghi nhận qua SePay (GD #${txIdStr}). Tổng đã thanh toán: ${newPaidAmount.toLocaleString('vi-VN')} đ${statusNote}.`,
              messageType: MessageType.SYSTEM_EVENT,
            },
          },
        },
      });

      const txRecord = await tx.sepayTransaction.create({
        data: {
          sepayTxId: txIdStr,
          orderId: targetOrder.id,
          amount: transferAmount,
          transferContent: payload.content,
          gateway: payload.gateway,
          rawPayload: payload as any,
          status: SepayTxStatus.MATCHED,
        },
      });

      return {
        duplicate: false,
        unmatched: false,
        updatedOrder,
        txRecord,
      };
    });

    if (result.duplicate) {
      return { success: true, message: 'Transaction already processed previously', txId: txIdStr };
    }

    if (result.unmatched) {
      return {
        success: true,
        message: 'Unmatched transaction recorded for manual reconciliation in Studio',
      };
    }

    // 4. Emit Real-time Socket.io Notification
    if (result.updatedOrder) {
      const order = result.updatedOrder;
      const isFullyDeposited = order.paidAmount >= order.depositAmount;

      this.ordersGateway.notifyPaymentConfirmed(order.orderCode, {
        orderCode: order.orderCode,
        transferAmount,
        paidAmount: order.paidAmount,
        depositAmount: order.depositAmount,
        totalAmount: order.totalAmount,
        status: order.status,
        isFullyDeposited,
      });

      this.ordersGateway.notifyOrderUpdated(order.orderCode, {
        orderCode: order.orderCode,
        status: order.status,
        paidAmount: order.paidAmount,
      });
    }

    return {
      success: true,
      message: 'Payment processed and matched successfully',
      orderCode: result.updatedOrder?.orderCode,
      paidAmount: result.updatedOrder?.paidAmount,
      status: result.updatedOrder?.status,
    };
  }
}
