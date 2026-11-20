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
1. TUYỆT ĐỐI KHÔNG tự bịa đặt giá tiền hay diện tích tính phí! Khi khách hỏi về giá, chi phí vẽ, diện tích hoặc báo giá, BẮT BUỘC gọi hàm tool \`calculateEstimatePrice\`.
2. Khi khách hỏi tìm tranh, gợi ý tranh cho phòng khách/phòng ngủ/quán cafe, BẮT BUỘC gọi hàm tool \`searchPortfolio\`.
3. Khi khách hỏi về năng lực của họa sĩ, chất liệu xưởng sử dụng, địa chỉ xưởng hoặc chính sách cọc & phác thảo, gọi tool \`getArtistCapabilities\`.
4. Sau khi nhận kết quả từ tool, hãy giải thích rõ ràng và tự nhiên cho khách: Chất liệu, diện tích tác phẩm, tổng chi phí dự kiến, khoản đặt cọc bảo đảm và cam kết 02 lượt duyệt phác thảo chì/số miễn phí.
`.trim();

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private readonly rateLimits = new Map<string, { count: number; resetTime: number }>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Main chat endpoint handler with rate limiting, tool execution and action suggestions
   */
  async chat(
    dto: AiChatDto,
    clientIp: string = 'global',
  ): Promise<{ reply: string; actionSuggestion?: ActionSuggestion }> {
    // 1. Rate Limiting Check (Max 20 requests per minute)
    this.checkRateLimit(clientIp);

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    const hasValidKey = apiKey.length > 10 && !apiKey.includes('dummy');

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

      const configuredModel = (process.env.GEMINI_MODEL || 'gemini-2.5-flash')
        .trim()
        .replace(/^["']|["']$/g, '');

      // Robust model candidates: try configuredModel, then fallback candidates if new accounts/temporary spike
      const modelCandidates = [
        configuredModel,
        'gemini-3.1-flash-lite',
        'gemini-3.8-flash',
        'gemini-2.5-flash',
      ].filter((v, i, a) => a.indexOf(v) === i);

      // Tools definition matching @google/genai v3.6.1 standards
      const tools: any[] = [
        {
          functionDeclarations: [
            {
              name: 'calculateEstimatePrice',
              description:
                'Tính toán ước tính chi phí đặt vẽ tranh nghệ thuật (sơn dầu, acrylic, màu nước) hoặc tranh tường dựa trên kích thước, chất liệu, độ phức tạp.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  serviceType: {
                    type: Type.STRING,
                    description:
                      'Loại hình: FRAMED_ART (tranh đóng khung treo tường) hoặc WALL_MURAL (tranh bích họa vẽ trực tiếp lên tường)',
                  },
                  widthCm: {
                    type: Type.NUMBER,
                    description: 'Chiều rộng tranh hoặc tường tính bằng centimet (cm, ví dụ: 100 cho 1m, 150 cho 1.5m)',
                  },
                  heightCm: {
                    type: Type.NUMBER,
                    description: 'Chiều cao tranh hoặc tường tính bằng centimet (cm, ví dụ: 150 cho 1.5m, 80 cho 80cm)',
                  },
                  materialSlug: {
                    type: Type.STRING,
                    description:
                      'Chất liệu: son-dau-cao-cap (sơn dầu), mau-acrylic-toan-vai (acrylic), mau-nuoc-arches (màu nước), son-tuong-chuyen-dung (bích họa tường)',
                  },
                  complexity: {
                    type: Type.STRING,
                    description:
                      'Độ phức tạp nét cọ: SIMPLE (đơn giản, mảng màu phẳng), MEDIUM (chi tiết vừa phải), COMPLEX (chi tiết cao, tả thực tỉ mỉ)',
                  },
                  distanceKm: {
                    type: Type.NUMBER,
                    description: 'Khoảng cách giao tranh hoặc di chuyển thi công (km, ví dụ: 10)',
                  },
                },
                required: ['widthCm', 'heightCm'],
              },
            },
            {
              name: 'searchPortfolio',
              description:
                'Tìm kiếm các tác phẩm mẫu tiêu biểu trong bộ sưu tập của xưởng vẽ theo phong cách, chất liệu, loại hình hoặc từ khóa.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  serviceType: {
                    type: Type.STRING,
                    description: 'Lọc theo loại hình: FRAMED_ART hoặc WALL_MURAL',
                  },
                  materialSlug: {
                    type: Type.STRING,
                    description:
                      'Lọc theo chất liệu: son-dau-cao-cap, mau-acrylic-toan-vai, mau-nuoc-arches, son-tuong-chuyen-dung',
                  },
                  keyword: {
                    type: Type.STRING,
                    description:
                      'Từ khóa tìm kiếm (ví dụ: phong cảnh, biển, tropical, hoa, trừu tượng, chân dung)',
                  },
                },
              },
            },
            {
              name: 'getArtistCapabilities',
              description:
                'Lấy thông tin năng lực sáng tác, tiểu sử họa sĩ, xưởng vẽ, danh sách các chất liệu hỗ trợ, chính sách phác thảo và bảo hành.',
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

      // Generate content with model candidate fallback
      let response: any = null;
      let activeModel = configuredModel;

      for (const m of modelCandidates) {
        try {
          response = await ai.models.generateContent({
            model: m,
            contents,
            config: {
              systemInstruction: SYSTEM_PROMPT,
              tools,
            },
          });
          activeModel = m;
          break;
        } catch (err: any) {
          if (err?.status === 404 || err?.message?.includes('404') || err?.status === 503) {
            this.logger.warn(`Model ${m} returned ${err?.status || 'status'}, trying next candidate...`);
            continue;
          }
          throw err;
        }
      }

      if (!response) {
        throw new Error('Không thể kết nối tới mô hình Gemini');
      }

      let actionSuggestion: ActionSuggestion | undefined;
      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        const fc = functionCalls[0];
        this.logger.log(`Gemini (${activeModel}) invoked tool: ${fc.name} with args: ${JSON.stringify(fc.args)}`);

        let toolResult: any;
        let naturalFallbackReply = '';

        if (fc.name === 'calculateEstimatePrice') {
          const res = await this.executeCalculateEstimatePrice(fc.args as any);
          toolResult = res.pricing;
          actionSuggestion = res.actionSuggestion;

          naturalFallbackReply = `
Kính gửi Quý khách! Trợ lý Nghệ thuật xin gửi dự toán chi phí tác phẩm theo yêu cầu:

- **Loại hình:** ${res.pricing.serviceType === ServiceType.WALL_MURAL ? 'Bích họa tường nghệ thuật' : 'Tranh sơn dầu đóng khung cao cấp'}
- **Chất liệu:** ${res.pricing.materialName}
- **Kích thước:** ${res.pricing.widthCm} × ${res.pricing.heightCm} cm (Diện tích: **${res.pricing.billableAreaM2} m²**)
- **Độ phức tạp nét cọ:** ${res.pricing.complexity === Complexity.COMPLEX ? 'Chi tiết cao (tả thực tỉ mỉ)' : res.pricing.complexity === Complexity.SIMPLE ? 'Đơn giản' : 'Vừa phải'}
- **Tổng chi phí ước tính:** **${res.pricing.totalAmount.toLocaleString('vi-VN')} VNĐ**
${res.pricing.requireDeposit ? `- **Khoản đặt cọc bảo đảm (${res.pricing.depositPercent}%):** **${res.pricing.depositAmount.toLocaleString('vi-VN')} VNĐ**` : '- **Đặt cọc:** Không yêu cầu cọc'}
${res.pricing.shippingOrTravelFee > 0 ? `- **Phí vận chuyển / đi lại (${res.pricing.distanceKm} km):** ${res.pricing.shippingOrTravelFee.toLocaleString('vi-VN')} VNĐ` : ''}

Quy trình sáng tác tại Quoc Tuan Art Atelier luôn bao gồm **02 lượt duyệt phác thảo chi tiết** (chì hoặc số) trước khi họa sĩ chính thức lên màu để bảo đảm tác phẩm đáp ứng 100% mong muốn của Quý khách.

Quý khách có thể bấm vào thẻ gợi ý bên dưới để xem chi tiết cấu hình và đặt vẽ ngay!
`.trim();
        } else if (fc.name === 'searchPortfolio') {
          const res = await this.executeSearchPortfolio(fc.args as any);
          toolResult = res.artworks;
          actionSuggestion = res.actionSuggestion;

          naturalFallbackReply = `
Xưởng họa sĩ Quốc Tuấn xin gửi tới Quý khách các tác phẩm tiêu biểu phù hợp với phong cách tìm kiếm:

${res.artworks.map((a: any) => `• **${a.title}** (${a.material?.name || 'Tranh nghệ thuật'}) — *${a.description || 'Tác phẩm độc bản'}*`).join('\n')}

Mỗi tác phẩm đều được chế tác độc bản, phối màu hài hòa và có tính năng mô phỏng treo tường (Wall Preview Mockup) giúp Quý khách dễ dàng hình dung trong không gian nội thất.
`.trim();
        } else if (fc.name === 'getArtistCapabilities') {
          toolResult = await this.executeGetArtistCapabilities();
          actionSuggestion = {
            type: 'CONTACT',
            title: 'Liên hệ trực tiếp Xưởng họa sĩ',
            url: '/about',
            subtitle: 'Xem hồ sơ năng lực & kinh nghiệm triển lãm',
          };

          naturalFallbackReply = `
Họa sĩ Quốc Tuấn tốt nghiệp Đại học Mỹ thuật Việt Nam với hơn ${toolResult.experienceYears} năm kinh nghiệm sáng tác chuyên sâu về tranh sơn dầu, acrylic và bích họa tường khổ lớn.
Xưởng hiện phục vụ 4 dòng chất liệu cao cấp (Sơn dầu châu Âu trên toan linen, Acrylic không mùi, Màu nước Arches Pháp và Sơn tường phủ nano chuyên dụng).
Địa chỉ Studio: ${toolResult.studioAddress || 'Hà Nội'}.
`.trim();
        }

        // Try returning tool execution back to model for final natural answer
        try {
          const followUpContents = [
            ...contents,
            {
              role: 'model',
              parts: response.candidates?.[0]?.content?.parts || [
                {
                  functionCall: {
                    name: fc.name,
                    args: fc.args,
                  },
                },
              ],
            },
            {
              role: 'user',
              parts: [
                {
                  functionResponse: {
                    name: fc.name,
                    response: { output: toolResult },
                  },
                },
              ],
            },
          ];

          const followUpResponse = await ai.models.generateContent({
            model: activeModel,
            contents: followUpContents,
            config: {
              systemInstruction: SYSTEM_PROMPT,
            },
          });

          if (followUpResponse.text) {
            return { reply: followUpResponse.text, actionSuggestion };
          }
        } catch (followUpErr) {
          this.logger.warn(`Follow-up natural response skipped, returning structured result: ${(followUpErr as any)?.message}`);
        }

        return { reply: naturalFallbackReply, actionSuggestion };
      }

      return {
        reply:
          response.text ||
          'Cảm ơn bạn đã nhắn tin. Tôi có thể hỗ trợ gì thêm về các tác phẩm của Họa sĩ Quốc Tuấn?',
      };
    } catch (error: any) {
      this.logger.error('Gemini API Error:', error?.message || error);
      if (error?.stack) {
        this.logger.error(error.stack);
      }
      return this.handleFallback(latestUserMessage);
    }
  }

  /**
   * Tool: calculateEstimatePrice
   */
  private async executeCalculateEstimatePrice(args: {
    serviceType?: string;
    widthCm: number;
    heightCm: number;
    materialSlug?: string;
    complexity?: string;
    distanceKm?: number;
  }) {
    // 1. Determine service type
    const isMural =
      args.serviceType === 'WALL_MURAL' ||
      args.serviceType?.toLowerCase().includes('mural') ||
      args.serviceType?.toLowerCase().includes('tường');

    const serviceType = isMural ? ServiceType.WALL_MURAL : ServiceType.FRAMED_ART;

    // 2. Resolve material with smart matching
    const query = (args.materialSlug || '').toLowerCase();
    let material: any = null;

    if (query) {
      material = await this.prisma.material.findFirst({
        where: {
          OR: [
            { slug: query },
            { slug: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
          ],
        },
      });
    }

    if (!material) {
      if (query.includes('oil') || query.includes('dầu')) {
        material = await this.prisma.material.findFirst({ where: { slug: 'son-dau-cao-cap' } });
      } else if (query.includes('acrylic')) {
        material = await this.prisma.material.findFirst({ where: { slug: 'mau-acrylic-toan-vai' } });
      } else if (query.includes('water') || query.includes('nước')) {
        material = await this.prisma.material.findFirst({ where: { slug: 'mau-nuoc-arches' } });
      } else if (query.includes('mural') || query.includes('tường')) {
        material = await this.prisma.material.findFirst({ where: { slug: 'son-tuong-chuyen-dung' } });
      }
    }

    if (!material) {
      material = await this.prisma.material.findFirst({
        where: { serviceType, isActive: true },
      });
    }

    // 3. Resolve complexity
    let complexity = Complexity.MEDIUM;
    const compStr = (args.complexity || '').toUpperCase();
    if (
      compStr.includes('COMPLEX') ||
      compStr.includes('HIGH') ||
      compStr.includes('CAO') ||
      compStr.includes('TỈ MỈ')
    ) {
      complexity = Complexity.COMPLEX;
    } else if (
      compStr.includes('SIMPLE') ||
      compStr.includes('LOW') ||
      compStr.includes('ĐƠN GIẢN')
    ) {
      complexity = Complexity.SIMPLE;
    }

    const config = await this.prisma.artistStudioConfig.findFirst();

    const widthCm = Number(args.widthCm) || 80;
    const heightCm = Number(args.heightCm) || 120;
    const distanceKm = Number(args.distanceKm) || 0;

    const pricing = calculateCommissionPrice({
      serviceType,
      widthCm,
      heightCm,
      materialBasePricePerM2:
        material?.basePricePerM2 || (serviceType === ServiceType.WALL_MURAL ? 1200000 : 3200000),
      complexity,
      distanceKm,
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
      title: `Cấu hình & Đặt vẽ ${serviceType === ServiceType.FRAMED_ART ? 'Tranh đóng khung' : 'Tranh bích họa'} (${widthCm} × ${heightCm} cm)`,
      subtitle: `Dự toán: ${pricing.totalAmount.toLocaleString('vi-VN')} VNĐ ${pricing.requireDeposit ? `(Tiền cọc: ${pricing.depositAmount.toLocaleString('vi-VN')} đ)` : ''}`,
      url: `/commission?serviceType=${serviceType}&material=${material?.slug || 'son-dau-cao-cap'}&width=${widthCm}&height=${heightCm}&complexity=${complexity}`,
      details: {
        totalAmount: pricing.totalAmount,
        depositAmount: pricing.depositAmount,
        requireDeposit: pricing.requireDeposit,
        artworkBasePrice: pricing.artworkBasePrice,
        dimensions: `${widthCm} × ${heightCm} cm`,
      },
    };

    return {
      pricing: {
        ...pricing,
        materialName: material?.name || 'Sơn dầu cao cấp',
        complexity,
        serviceType,
        widthCm,
        heightCm,
        distanceKm,
        depositPercent: config?.depositPercent || 40,
      },
      actionSuggestion,
    };
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
   * Fallback logic when GEMINI_API_KEY is not configured
   */
  private async handleFallback(
    message: string,
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
      const materialSlug = isMural ? 'son-tuong-chuyen-dung' : 'son-dau-cao-cap';

      const { pricing, actionSuggestion } = await this.executeCalculateEstimatePrice({
        serviceType,
        widthCm: width,
        heightCm: height,
        materialSlug,
        complexity: 'MEDIUM',
      });

      const reply = `
Chào bạn! Tôi là Trợ lý Nghệ thuật của Họa sĩ Quốc Tuấn.

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
