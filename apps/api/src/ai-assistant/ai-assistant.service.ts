import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiChatDto, ActionSuggestion } from './dto/ai-chat.dto';
import { calculateCommissionPrice, Complexity, FrameOption, ServiceType } from '@studio/shared';

const SYSTEM_PROMPT = `
Bạn là "Trợ lý Nghệ thuật Độc quyền của Họa sĩ Quốc Tuấn" (Quoc Tuan Art Atelier).
Phong cách giao tiếp của bạn:
- Tinh tế, lịch thiệp, am hiểu sâu sắc về nghệ thuật tạo hình, phong thủy không gian sống và kỹ thuật chất liệu (sơn dầu truyền thống, acrylic hiện đại, màu nước Arches Pháp, tranh đắp nổi thạch cao, và bích họa tường khổ lớn).
- Tôn trọng phong cách "Restrained Gallery Canvas" của xưởng vẽ: nhã nhặn, tôn vinh nghệ thuật và chiều sâu cảm xúc.
- Xưng hô: "Tôi" hoặc "Trợ lý nghệ thuật", gọi khách hàng là "Quý khách" hoặc "Bạn".

QUY TẮC CỐT LÕI VỀ GIÁ VÀ DANH MỤC TRANH:
1. TUYỆT ĐỐI KHÔNG tự bịa đặt giá tiền hay kích thước billable! Khi khách hỏi về giá, chi phí vẽ, diện tích hoặc báo giá, BẮT BUỘC gọi hàm tool \`calculateEstimatePrice\`.
2. Khi khách hỏi tìm tranh, gợi ý tranh cho phòng khách/phòng ngủ/quán cafe, BẮT BUỘC gọi hàm tool \`searchPortfolio\`.
3. Khi khách hỏi về năng lực của họa sĩ, chất liệu xưởng sử dụng, địa chỉ xưởng hoặc chính sách cọc & phác thảo, gọi tool \`getArtistCapabilities\`.
4. Sau khi có kết quả tính giá từ tool, hãy giải thích rõ ràng cho khách: Tiền vẽ tranh, diện tích tính phí tối thiểu, khoản cọc bảo đảm theo quy định và mời khách bấm vào nút để vào thẳng trang cấu hình chi tiết.
`.trim();

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private readonly rateLimits = new Map<string, { count: number; resetTime: number }>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Main chat endpoint handler with rate limiting, tool execution and action suggestions
   */
  async chat(dto: AiChatDto, clientIp: string = 'global'): Promise<{ reply: string; actionSuggestion?: ActionSuggestion }> {
    // 1. Rate Limiting Check (Max 20 requests per minute)
    this.checkRateLimit(clientIp);

    const apiKey = process.env.GEMINI_API_KEY;
    const hasValidKey = apiKey && !apiKey.includes('dummy') && apiKey.length > 10;

    const latestUserMessage = [...dto.messages].reverse().find((m) => m.role === 'user')?.content || '';

    // 2. Fallback Mode if GEMINI_API_KEY is not configured
    if (!hasValidKey) {
      this.logger.warn('GEMINI_API_KEY is missing or dummy. Executing intelligent local fallback.');
      return this.handleFallback(latestUserMessage);
    }

    // 3. Live Google Gemini API via @google/genai SDK
    try {
      const { GoogleGenAI, Type } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      // Tools definition
      const tools: any[] = [
        {
          functionDeclarations: [
            {
              name: 'calculateEstimatePrice',
              description: 'Tính toán ước tính chi phí đặt vẽ tranh nghệ thuật (sơn dầu, acrylic, màu nước) hoặc tranh tường dựa trên kích thước, chất liệu, độ phức tạp.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  serviceType: {
                    type: Type.STRING,
                    description: 'Loại hình: FRAMED_ART (tranh đóng khung treo tường) hoặc WALL_MURAL (tranh bích họa vẽ trực tiếp lên tường)',
                  },
                  widthCm: {
                    type: Type.NUMBER,
                    description: 'Chiều rộng tranh hoặc tường (cm, ví dụ: 100 cho 1m)',
                  },
                  heightCm: {
                    type: Type.NUMBER,
                    description: 'Chiều cao tranh hoặc tường (cm, ví dụ: 80 cho 80cm)',
                  },
                  materialSlug: {
                    type: Type.STRING,
                    description: 'Slug chất liệu: mat-oil, mat-acrylic, mat-watercolor, mat-mural',
                  },
                  complexity: {
                    type: Type.STRING,
                    description: 'Mức độ phức tạp nét cọ: SIMPLE, MEDIUM, COMPLEX',
                  },
                  distanceKm: {
                    type: Type.NUMBER,
                    description: 'Khoảng cách giao hàng hoặc di chuyển thi công (km, mặc định 0)',
                  },
                },
                required: ['serviceType', 'widthCm', 'heightCm', 'materialSlug', 'complexity'],
              },
            },
            {
              name: 'searchPortfolio',
              description: 'Tìm kiếm các tác phẩm mẫu tiêu biểu trong bộ sưu tập của xưởng vẽ theo phong cách, chất liệu, loại hình hoặc từ khóa.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  serviceType: {
                    type: Type.STRING,
                    description: 'Lọc theo loại hình: FRAMED_ART hoặc WALL_MURAL',
                  },
                  materialSlug: {
                    type: Type.STRING,
                    description: 'Lọc theo chất liệu: mat-oil, mat-acrylic, mat-watercolor, mat-mural',
                  },
                  keyword: {
                    type: Type.STRING,
                    description: 'Từ khóa tìm kiếm (ví dụ: phong cảnh, biển, tropical, hoa, trừu tượng, chân dung)',
                  },
                },
              },
            },
            {
              name: 'getArtistCapabilities',
              description: 'Lấy thông tin năng lực sáng tác, tiểu sử họa sĩ, xưởng vẽ, danh sách các chất liệu hỗ trợ, chính sách phác thảo và bảo hành.',
              parameters: {
                type: Type.OBJECT,
                properties: {},
              },
            },
          ],
        },
      ];

      // Format history contents
      const contents: any[] = dto.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.content }],
      }));

      // Call Gemini 2.5 Flash
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools,
        },
      });

      let actionSuggestion: ActionSuggestion | undefined;
      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        const fc = functionCalls[0];
        this.logger.log(`Gemini invoked tool: ${fc.name} with args: ${JSON.stringify(fc.args)}`);

        let toolResult: any;

        if (fc.name === 'calculateEstimatePrice') {
          const res = await this.executeCalculateEstimatePrice(fc.args as any);
          toolResult = res.pricing;
          actionSuggestion = res.actionSuggestion;
        } else if (fc.name === 'searchPortfolio') {
          const res = await this.executeSearchPortfolio(fc.args as any);
          toolResult = res.artworks;
          actionSuggestion = res.actionSuggestion;
        } else if (fc.name === 'getArtistCapabilities') {
          toolResult = await this.executeGetArtistCapabilities();
          actionSuggestion = {
            type: 'CONTACT',
            title: 'Liên hệ trực tiếp Xưởng họa sĩ',
            url: '/about',
            subtitle: 'Xem hồ sơ năng lực & kinh nghiệm triển lãm',
          };
        }

        // Return tool execution back to model for final natural answer
        const followUpResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            ...contents,
            { role: 'model', parts: (response as any).candidates?.[0]?.content?.parts || [] },
            {
              role: 'user',
              parts: [
                {
                  functionResponse: {
                    name: fc.name,
                    response: { result: toolResult },
                  },
                },
              ],
            },
          ],
          config: {
            systemInstruction: SYSTEM_PROMPT,
          },
        });

        const reply = followUpResponse.text || 'Tôi đã tra cứu thông tin theo yêu cầu của Quý khách.';
        return { reply, actionSuggestion };
      }

      return {
        reply: response.text || 'Cảm ơn bạn đã nhắn tin. Tôi có thể hỗ trợ gì thêm về các tác phẩm của Họa sĩ Quốc Tuấn?',
      };
    } catch (err: any) {
      this.logger.error(`Gemini API call failed: ${err.message}`, err.stack);
      // Fallback gracefully instead of crashing
      return this.handleFallback(latestUserMessage, true);
    }
  }

  /**
   * Tool: calculateEstimatePrice
   */
  private async executeCalculateEstimatePrice(args: {
    serviceType: string;
    widthCm: number;
    heightCm: number;
    materialSlug: string;
    complexity: string;
    distanceKm?: number;
  }) {
    const serviceType =
      args.serviceType === 'WALL_MURAL' ? ServiceType.WALL_MURAL : ServiceType.FRAMED_ART;

    // Resolve material
    let material = await this.prisma.material.findFirst({
      where: { slug: args.materialSlug },
    });
    if (!material) {
      material = await this.prisma.material.findFirst({
        where: { serviceType, isActive: true },
      });
    }

    const config = await this.prisma.artistStudioConfig.findFirst();

    const pricing = calculateCommissionPrice({
      serviceType,
      widthCm: Number(args.widthCm) || 80,
      heightCm: Number(args.heightCm) || 120,
      materialBasePricePerM2: material?.basePricePerM2 || 1500000,
      complexity: (args.complexity as Complexity) || Complexity.MEDIUM,
      distanceKm: Number(args.distanceKm) || 0,
      frameOption: serviceType === ServiceType.FRAMED_ART ? FrameOption.WOOD_MINIMAL : undefined,
      config: config
        ? {
            depositThreshold: config.depositThreshold,
            depositPercent: config.depositPercent,
            minFramedAreaM2: config.minFramedAreaM2,
            minMuralAreaM2: config.minMuralAreaM2,
            freeSketchRevisions: config.freeSketchRevisions,
            freeKmRadius: config.freeKmRadius,
            feePerKm: config.feePerKm,
            simpleMultiplier: config.simpleMultiplier,
            mediumMultiplier: config.mediumMultiplier,
            complexMultiplier: config.complexMultiplier,
          }
        : undefined,
    });

    const actionSuggestion: ActionSuggestion = {
      type: 'COMMISSION',
      title: `Cấu hình & Đặt vẽ ${serviceType === ServiceType.FRAMED_ART ? 'Tranh đóng khung' : 'Tranh tường'} (${args.widthCm}x${args.heightCm}cm)`,
      subtitle: `Ước tính: ${pricing.totalAmount.toLocaleString('vi-VN')} VNĐ ${pricing.requireDeposit ? `(Tiền cọc: ${pricing.depositAmount.toLocaleString('vi-VN')} đ)` : ''}`,
      url: `/commission?serviceType=${serviceType}&material=${material?.slug || 'mat-oil'}&width=${args.widthCm}&height=${args.heightCm}&complexity=${args.complexity}`,
      details: {
        totalAmount: pricing.totalAmount,
        depositAmount: pricing.depositAmount,
        requireDeposit: pricing.requireDeposit,
        artworkBasePrice: pricing.artworkBasePrice,
        dimensions: `${args.widthCm} × ${args.heightCm} cm`,
      },
    };

    return { pricing, actionSuggestion };
  }

  /**
   * Tool: searchPortfolio
   */
  private async executeSearchPortfolio(args: {
    serviceType?: string;
    materialSlug?: string;
    keyword?: string;
  }) {
    const where: any = { isAvailable: true };

    if (args.serviceType) {
      where.serviceType = args.serviceType;
    }
    if (args.materialSlug) {
      where.material = { slug: args.materialSlug };
    }
    if (args.keyword) {
      where.OR = [
        { title: { contains: args.keyword, mode: 'insensitive' } },
        { description: { contains: args.keyword, mode: 'insensitive' } },
      ];
    }

    const artworks = await this.prisma.artworkTemplate.findMany({
      where,
      take: 3,
      include: { material: true },
      orderBy: { isFeatured: 'desc' },
    });

    let actionSuggestion: ActionSuggestion | undefined;

    if (artworks.length > 0) {
      const top = artworks[0];
      actionSuggestion = {
        type: 'PORTFOLIO',
        title: `Chiêm ngưỡng tác phẩm "${top.title}"`,
        subtitle: `${top.material?.name || 'Tranh nghệ thuật'} — Độc bản sáng tác`,
        url: `/portfolio/${top.slug}`,
        details: {
          artworkSlug: top.slug,
          artworkTitle: top.title,
          imageUrl: top.images?.[0],
        },
      };
    }

    return { artworks, actionSuggestion };
  }

  /**
   * Tool: getArtistCapabilities
   */
  private async executeGetArtistCapabilities() {
    const [config, materials] = await Promise.all([
      this.prisma.artistStudioConfig.findFirst(),
      this.prisma.material.findMany({ where: { isActive: true } }),
    ]);

    return {
      artistName: config?.artistName || 'Họa sĩ Quốc Tuấn',
      experienceYears: config?.experienceYears || 8,
      studioAddress: config?.studioAddress,
      freeSketchRevisions: config?.freeSketchRevisions || 2,
      depositPercent: config?.depositPercent || 40,
      materials: materials.map((m) => ({
        name: m.name,
        slug: m.slug,
        basePricePerM2: m.basePricePerM2,
        durabilityNote: m.durabilityNote,
      })),
    };
  }

  /**
   * Fallback logic when GEMINI_API_KEY is not configured or in case of upstream error
   */
  private async handleFallback(
    message: string,
    isError: boolean = false,
  ): Promise<{ reply: string; actionSuggestion?: ActionSuggestion }> {
    const lower = message.toLowerCase();

    // Check if user is asking for price or dimensions
    if (
      lower.includes('giá') ||
      lower.includes('chi phí') ||
      lower.includes('bao nhiêu') ||
      lower.includes('cm') ||
      lower.includes('m2') ||
      lower.includes('mét') ||
      lower.includes('kích thước')
    ) {
      const isMural = lower.includes('tường') || lower.includes('bích họa');
      const serviceType = isMural ? 'WALL_MURAL' : 'FRAMED_ART';
      const width = isMural ? 300 : 80;
      const height = isMural ? 250 : 120;
      const materialSlug = isMural ? 'mat-mural' : 'mat-oil';

      const { pricing, actionSuggestion } = await this.executeCalculateEstimatePrice({
        serviceType,
        widthCm: width,
        heightCm: height,
        materialSlug,
        complexity: 'MEDIUM',
      });

      const reply = `
Chào bạn! Tôi là Trợ lý Nghệ thuật của Họa sĩ Quốc Tuấn.
${isError ? '*(Đang kết nối lại API thông minh)*' : '*(Hệ thống đang hoạt động ở chế độ mô phỏng an toàn - chưa cài đặt GEMINI_API_KEY trong file .env)*'}

Dựa trên thông số tiêu chuẩn bạn quan tâm:
- **Loại hình:** ${isMural ? 'Bích họa tường nghệ thuật' : 'Tranh sơn dầu đóng khung'}
- **Kích thước mẫu:** ${width} × ${height} cm
- **Chi phí dự kiến:** **${pricing.totalAmount.toLocaleString('vi-VN')} VNĐ**
- **Khoản cọc khởi động:** ${pricing.requireDeposit ? `${pricing.depositAmount.toLocaleString('vi-VN')} đ (${pricing.depositAmount / pricing.totalAmount * 100}%)` : 'Không yêu cầu cọc'}
- **Chính sách:** Miễn phí 02 lượt chỉnh sửa phác thảo số/chì chi tiết trước khi lên màu thực tế.

Bạn có thể bấm vào thẻ gợi ý bên dưới để tùy chỉnh chính xác kích thước và chất liệu mong muốn!
`.trim();

      return { reply, actionSuggestion };
    }

    // Check if user asks for portfolio / samples
    if (
      lower.includes('mẫu') ||
      lower.includes('bộ sưu tập') ||
      lower.includes('portfolio') ||
      lower.includes('xem tranh') ||
      lower.includes('phòng khách') ||
      lower.includes('phong cảnh')
    ) {
      const { artworks, actionSuggestion } = await this.executeSearchPortfolio({
        keyword: lower.includes('phòng') ? 'phòng' : undefined,
      });

      const listStr = artworks
        .map((a) => `• **${a.title}** (${a.material?.name || 'Tranh nghệ thuật'})`)
        .join('\n');

      const reply = `
Xưởng họa sĩ Quốc Tuấn hiện có các tác phẩm tiêu biểu sẵn sàng chế tác hoặc lấy cảm hứng cho không gian của bạn:

${listStr}

Mỗi tác phẩm đều được bảo đảm tính độc bản, phối màu hòa hợp với nội thất và có hỗ trợ mô phỏng treo tường (Wall Preview Mockup) trực quan trước khi vẽ.
`.trim();

      return { reply, actionSuggestion };
    }

    // Default polite artist consultation guide
    const reply = `
Kính chào Quý khách! Tôi là Trợ lý Nghệ thuật của **Họa sĩ Quốc Tuấn (Art Atelier)**.
${!isError ? '*(Ghi chú: Để kích hoạt đầy đủ trí tuệ nhân tạo Gemini 2.5 Flash, vui lòng thêm `GEMINI_API_KEY` từ Google AI Studio vào file `.env`)*\n' : ''}
Tôi có thể đồng hành cùng Quý khách trong các nội dung:
1. **Tư vấn chất liệu:** Sơn dầu truyền thống (độ sâu màu cao), Acrylic (hiện đại, nhanh khô), Màu nước Arches Pháp hoặc Sơn bích họa tường chuyên dụng.
2. **Báo giá & Dự toán ngân sách:** Tính toán chính xác theo diện tích m², độ phức tạp nét cọ và khoảng cách vận chuyển/thi công.
3. **Quy trình sáng tác:** Trải qua 2 vòng duyệt phác thảo số/chì miễn phí đến khi Quý khách ưng ý 100%.

Quý khách có thể chọn nhanh các câu hỏi gợi ý bên dưới hoặc nhập kích thước không gian để tôi hỗ trợ ngay!
`.trim();

    return {
      reply,
      actionSuggestion: {
        type: 'COMMISSION',
        title: 'Trải nghiệm Báo giá & Cấu hình Đặt vẽ',
        subtitle: 'Tùy biến kích thước, chất liệu và khung tranh độc bản',
        url: '/commission',
      },
    };
  }

  /**
   * Sliding window in-memory rate limiter per IP (20 calls / min)
   */
  private checkRateLimit(ip: string) {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 20;

    const record = this.rateLimits.get(ip);
    if (!record || now > record.resetTime) {
      this.rateLimits.set(ip, { count: 1, resetTime: now + windowMs });
      return;
    }

    if (record.count >= maxRequests) {
      throw new HttpException(
        'Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng chờ 1 phút trước khi tiếp tục trò chuyện với Trợ lý AI.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.count++;
  }
}
