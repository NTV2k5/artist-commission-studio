import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ArtworkQueryDto } from './dto/artwork-query.dto';
import { PricingEstimateDto } from './dto/pricing-estimate.dto';
import { calculateCommissionPrice } from '@studio/shared';

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves artist studio configuration and business parameters
   */
  async getStudioConfig() {
    const config = await this.prisma.artistStudioConfig.findUnique({
      where: { id: 'default-config' },
    });

    if (!config) {
      // Fallback in case seed was not executed yet
      return {
        id: 'default-config',
        artistName: 'Họa sĩ Quốc Tuấn',
        bio: 'Tốt nghiệp Đại học Mỹ thuật Việt Nam với hơn 8 năm kinh nghiệm sáng tác tranh sơn dầu, acrylic và tranh tường nghệ thuật khổ lớn.',
        experienceYears: 8,
        studioAddress: 'Số 18, Ngõ 45 Phố Tràng Tiền, Hoàn Kiếm, Hà Nội',
        studioLat: 21.0258,
        studioLng: 105.8562,
        zaloUrl: 'https://zalo.me/0987654321',
        messengerUrl: 'https://m.me/artistcommissionstudio',
        hotline: '0987654321',
        depositThreshold: 1500000,
        depositPercent: 40,
        minFramedAreaM2: 0.2,
        minMuralAreaM2: 1.0,
        freeSketchRevisions: 2,
        freeKmRadius: 10,
        feePerKm: 15000,
        simpleMultiplier: 1.0,
        mediumMultiplier: 1.35,
        complexMultiplier: 1.8,
      };
    }

    return config;
  }

  /**
   * Retrieves all active materials with pricing and durability notes
   */
  async getMaterials() {
    return this.prisma.material.findMany({
      where: { isActive: true },
      orderBy: [{ serviceType: 'asc' }, { basePricePerM2: 'asc' }],
    });
  }

  /**
   * Queries artwork templates with flexible filtering and pagination
   */
  async getArtworks(query: ArtworkQueryDto) {
    const where: {
      isAvailable: boolean;
      serviceType?: ArtworkQueryDto['serviceType'];
      isFeatured?: boolean;
      material?: { slug: string };
    } = {
      isAvailable: true,
    };

    if (query.serviceType) {
      where.serviceType = query.serviceType;
    }

    if (typeof query.isFeatured === 'boolean') {
      where.isFeatured = query.isFeatured;
    }

    if (query.materialSlug) {
      where.material = { slug: query.materialSlug };
    }

    const [items, total] = await Promise.all([
      this.prisma.artworkTemplate.findMany({
        where,
        include: {
          material: true,
        },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        take: query.limit,
        skip: query.offset,
      }),
      this.prisma.artworkTemplate.count({ where }),
    ]);

    return {
      items,
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  /**
   * Retrieves single artwork by unique slug
   */
  async getArtworkBySlug(slug: string) {
    const artwork = await this.prisma.artworkTemplate.findUnique({
      where: { slug },
      include: {
        material: true,
      },
    });

    if (!artwork || !artwork.isAvailable) {
      throw new NotFoundException(`Artwork with slug "${slug}" not found`);
    }

    return artwork;
  }

  /**
   * Estimates commission price adhering to Zero Client-Side Price Trust
   * Reads actual material rate and studio config directly from the database
   */
  async estimatePricing(dto: PricingEstimateDto) {
    const [studioConfig, material] = await Promise.all([
      this.getStudioConfig(),
      this.prisma.material.findUnique({
        where: { id: dto.materialId },
      }),
    ]);

    if (!material || !material.isActive) {
      throw new NotFoundException(`Material with ID "${dto.materialId}" is invalid or inactive`);
    }

    const calculationResult = calculateCommissionPrice({
      serviceType: dto.serviceType,
      widthCm: dto.widthCm,
      heightCm: dto.heightCm,
      materialBasePricePerM2: material.basePricePerM2,
      complexity: dto.complexity,
      frameOption: dto.frameOption,
      distanceKm: dto.distanceKm,
      isCustomReference: dto.isCustomReference,
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

    return {
      ...calculationResult,
      material: {
        id: material.id,
        name: material.name,
        slug: material.slug,
        serviceType: material.serviceType,
        basePricePerM2: material.basePricePerM2,
      },
      studioConfig: {
        depositThreshold: studioConfig.depositThreshold,
        depositPercent: studioConfig.depositPercent,
        freeSketchRevisions: studioConfig.freeSketchRevisions,
        freeKmRadius: studioConfig.freeKmRadius,
      },
    };
  }
}
