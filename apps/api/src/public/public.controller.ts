import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PublicService } from './public.service';
import { ArtworkQueryDto } from './dto/artwork-query.dto';
import { PricingEstimateDto } from './dto/pricing-estimate.dto';

@ApiTags('Public Gallery & Pricing')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('studio-config')
  @ApiOperation({ summary: 'Get artist studio configuration and business parameters' })
  getStudioConfig() {
    return this.publicService.getStudioConfig();
  }

  @Get('materials')
  @ApiOperation({ summary: 'Get list of active art materials and square-meter pricing' })
  getMaterials() {
    return this.publicService.getMaterials();
  }

  @Get('artworks')
  @ApiOperation({ summary: 'List portfolio artworks with filters and pagination' })
  getArtworks(@Query() query: ArtworkQueryDto) {
    return this.publicService.getArtworks(query);
  }

  @Get('artworks/:slug')
  @ApiOperation({ summary: 'Get detail of an artwork template by slug' })
  @ApiParam({ name: 'slug', description: 'Artwork URL slug' })
  getArtworkBySlug(@Param('slug') slug: string) {
    return this.publicService.getArtworkBySlug(slug);
  }

  @Post('pricing/estimate')
  @ApiOperation({ summary: 'Calculate detailed dynamic commission price estimate' })
  estimatePricing(@Body() dto: PricingEstimateDto) {
    return this.publicService.estimatePricing(dto);
  }
}
