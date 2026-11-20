'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Eye, Sparkles } from 'lucide-react';
import { ArtworkTemplateDto, ServiceType } from '@studio/shared';
import { WallPreviewMockup } from './WallPreviewMockup';

interface ArtworkCardProps {
  artwork: ArtworkTemplateDto;
}

export function ArtworkCard({ artwork }: ArtworkCardProps) {
  const [showWallPreviewModal, setShowWallPreviewModal] = useState(false);

  const isMural = artwork.serviceType === ServiceType.WALL_MURAL;

  return (
    <>
      <div className="group relative break-inside-avoid mb-8 bg-canvas border border-hairline overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col h-full">
        {/* Artwork Image Container */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900 shrink-0">
          <Image
            src={artwork.images[0] || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80'}
            alt={artwork.title}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Service Badge */}
          <div className="absolute top-3 left-3 z-10">
            <span
              className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-medium border ${isMural
                ? 'bg-artisan/90 text-white border-artisan'
                : 'bg-canvas/90 backdrop-blur-sm text-charcoal border-hairline'
                }`}
            >
              {isMural ? 'Bích Họa Tường' : 'Tranh Đóng Khung'}
            </span>
          </div>

          {/* Quick Action Overlay on Hover */}
          <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 p-4">
            {!isMural && (
              <button
                onClick={() => setShowWallPreviewModal(true)}
                className="px-3.5 py-2 bg-canvas/90 hover:bg-canvas text-charcoal text-xs uppercase tracking-wider font-medium transition-colors border border-hairline flex items-center gap-1.5 shadow-sm"
              >
                <Eye className="w-3.5 h-3.5 text-brand" />
                <span>Treo Thử</span>
              </button>
            )}
            <Link
              href={`/portfolio/${artwork.slug}`}
              className="px-3.5 py-2 bg-brand hover:bg-brand-hover text-white text-xs uppercase tracking-wider font-medium transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Chi Tiết</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Content Body & Footer */}
        <div className="p-5 space-y-3 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link href={`/portfolio/${artwork.slug}`}>
                <h3 className="font-serif text-xl text-charcoal hover:text-brand transition-colors font-medium">
                  {artwork.title}
                </h3>
              </Link>
              <p className="text-xs text-charcoal-muted pt-0.5">
                {artwork.material?.name || 'Sơn dầu / Acrylic cao cấp'}
              </p>
            </div>
            {artwork.isFeatured && (
              <span className="shrink-0 flex items-center gap-1 text-[10px] text-artisan uppercase tracking-wider font-medium">
                <Sparkles className="w-3 h-3" />
                <span>Tiêu Biểu</span>
              </span>
            )}
          </div>

          <p className="text-xs text-charcoal-muted font-light line-clamp-2 leading-relaxed flex-1">
            {artwork.description}
          </p>

          <div className="pt-3 mt-auto border-t border-hairline flex items-center justify-between gap-2">
            <span className="text-[11px] text-charcoal-muted italic truncate max-w-[65%]">
              {artwork.dimensionsNote || 'Khổ tranh theo yêu cầu'}
            </span>

            <Link
              href={`/commission?template=${artwork.slug}`}
              className="text-xs uppercase tracking-wider text-brand hover:text-brand-hover font-medium inline-flex items-center gap-1 whitespace-nowrap shrink-0 group/btn"
            >
              <span>Đặt Vẽ</span>
              <ArrowUpRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Wall Preview Modal */}
      {showWallPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-canvas border border-hairline max-w-3xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div>
                <h3 className="font-serif text-2xl text-charcoal">{artwork.title}</h3>
                <p className="text-xs text-charcoal-muted">Mô phỏng phối cảnh thực tế trên tường phòng khách</p>
              </div>
              <button
                onClick={() => setShowWallPreviewModal(false)}
                className="text-charcoal-muted hover:text-charcoal text-xs uppercase tracking-wider p-2"
              >
                Đóng [✕]
              </button>
            </div>

            <WallPreviewMockup
              imageSrc={artwork.images[0]}
              title={artwork.title}
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowWallPreviewModal(false)}
                className="px-4 py-2 border border-hairline text-xs uppercase tracking-wider text-charcoal hover:bg-canvas-surface"
              >
                Trở Lại
              </button>
              <Link
                href={`/commission?template=${artwork.slug}`}
                className="px-5 py-2 bg-brand hover:bg-brand-hover text-white text-xs uppercase tracking-wider font-medium"
              >
                Đặt Vẽ Mẫu Này
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
