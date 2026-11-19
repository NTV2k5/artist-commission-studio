'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Sparkles, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { ArtworkTemplateDto, MaterialDto, ServiceType } from '@studio/shared';
import { ArtworkCard } from './ArtworkCard';

interface PortfolioFilterableGalleryProps {
  initialArtworks: ArtworkTemplateDto[];
  materials: MaterialDto[];
}

export function PortfolioFilterableGallery({
  initialArtworks,
  materials,
}: PortfolioFilterableGalleryProps) {
  const [selectedService, setSelectedService] = useState<string>('ALL');
  const [selectedMaterialSlug, setSelectedMaterialSlug] = useState<string>('ALL');

  const filteredArtworks = useMemo(() => {
    return initialArtworks.filter((artwork) => {
      // Filter by service
      if (selectedService !== 'ALL' && artwork.serviceType !== selectedService) {
        return false;
      }
      // Filter by material slug
      if (selectedMaterialSlug !== 'ALL') {
        const materialSlug = artwork.material?.slug;
        if (materialSlug !== selectedMaterialSlug) {
          return false;
        }
      }
      return true;
    });
  }, [initialArtworks, selectedService, selectedMaterialSlug]);

  return (
    <div className="space-y-10">
      {/* Filters Toolbar */}
      <div className="bg-canvas-surface p-6 border border-hairline flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Service Type Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedService('ALL')}
            className={`px-4 py-2 text-xs uppercase tracking-wider font-medium transition-all ${
              selectedService === 'ALL'
                ? 'bg-charcoal text-white shadow-sm'
                : 'bg-canvas text-charcoal hover:bg-zinc-200 border border-hairline'
            }`}
          >
            Tất Cả Thể Loại ({initialArtworks.length})
          </button>
          <button
            onClick={() => setSelectedService(ServiceType.FRAMED_ART)}
            className={`px-4 py-2 text-xs uppercase tracking-wider font-medium transition-all ${
              selectedService === ServiceType.FRAMED_ART
                ? 'bg-charcoal text-white shadow-sm'
                : 'bg-canvas text-charcoal hover:bg-zinc-200 border border-hairline'
            }`}
          >
            Tranh Đóng Khung
          </button>
          <button
            onClick={() => setSelectedService(ServiceType.WALL_MURAL)}
            className={`px-4 py-2 text-xs uppercase tracking-wider font-medium transition-all ${
              selectedService === ServiceType.WALL_MURAL
                ? 'bg-charcoal text-white shadow-sm'
                : 'bg-canvas text-charcoal hover:bg-zinc-200 border border-hairline'
            }`}
          >
            Bích Họa Tường
          </button>
        </div>

        {/* Material Filter Dropdown / Pills */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <SlidersHorizontal className="w-4 h-4 text-charcoal-muted shrink-0" />
          <span className="text-xs uppercase tracking-wider text-charcoal-muted whitespace-nowrap">
            Chất liệu:
          </span>
          <select
            value={selectedMaterialSlug}
            onChange={(e) => setSelectedMaterialSlug(e.target.value)}
            className="text-xs bg-canvas border border-hairline px-3 py-2 text-charcoal focus:outline-none focus:border-brand w-full md:w-56"
          >
            <option value="ALL">Tất cả chất liệu ({materials.length})</option>
            {materials.map((mat) => (
              <option key={mat.id} value={mat.slug}>
                {mat.name} ({mat.serviceType === 'FRAMED_ART' ? 'Tranh khung' : 'Tranh tường'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Header Counter */}
      <div className="flex items-center justify-between text-xs text-charcoal-muted px-1">
        <span>
          Đang hiển thị <strong>{filteredArtworks.length}</strong> tác phẩm nghệ thuật
        </span>
        {(selectedService !== 'ALL' || selectedMaterialSlug !== 'ALL') && (
          <button
            onClick={() => {
              setSelectedService('ALL');
              setSelectedMaterialSlug('ALL');
            }}
            className="text-brand hover:underline"
          >
            Đặt lại bộ lọc
          </button>
        )}
      </div>

      {/* Masonry / Grid Display */}
      {filteredArtworks.length > 0 ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-8">
          {filteredArtworks.map((artwork) => (
            <ArtworkCard key={artwork.id} artwork={artwork} />
          ))}
        </div>
      ) : (
        <div className="p-16 text-center border border-hairline bg-canvas-surface space-y-4">
          <p className="font-serif text-2xl text-charcoal">
            Không tìm thấy tác phẩm phù hợp với bộ lọc đã chọn
          </p>
          <p className="text-xs text-charcoal-muted max-w-md mx-auto">
            Họa sĩ có thể sáng tác theo yêu cầu riêng biệt của bạn với mọi chất liệu và kích thước mong muốn.
          </p>
          <Link
            href="/commission"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs uppercase tracking-wider font-medium"
          >
            <span>Gửi Yêu Cầu Đặt Vẽ Riêng</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Custom Commission Prompt Box */}
      <div className="p-8 md:p-12 border border-brand/20 bg-brand/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 text-artisan text-xs uppercase tracking-wider font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sáng Tác Theo Ảnh Mẫu & Không Gian Riêng</span>
          </div>
          <h3 className="font-serif text-2xl md:text-3xl text-charcoal font-normal">
            Bạn có ý tưởng hoặc ảnh chụp mẫu muốn hiện thực hóa?
          </h3>
          <p className="text-xs text-charcoal-muted max-w-2xl font-light">
            Gửi ảnh chụp tường nhà hoặc ý tưởng tranh của bạn. Họa sĩ Quốc Tuấn sẽ tư vấn tỷ lệ, chất liệu và lên phác thảo phù hợp nhất.
          </p>
        </div>
        <Link
          href="/commission?custom=true"
          className="shrink-0 px-8 py-3.5 bg-brand hover:bg-brand-hover text-white text-xs uppercase tracking-editorial font-medium shadow-sm transition-colors"
        >
          Tải Ảnh Lên & Nhận Báo Giá
        </Link>
      </div>
    </div>
  );
}
