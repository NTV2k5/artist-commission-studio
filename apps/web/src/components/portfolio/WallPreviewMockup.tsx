'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Eye, Layers } from 'lucide-react';

interface WallPreviewMockupProps {
  imageSrc: string;
  title: string;
  defaultFrameStyle?: 'wood' | 'black' | 'gold';
}

export function WallPreviewMockup({
  imageSrc,
  title,
  defaultFrameStyle = 'wood',
}: WallPreviewMockupProps) {
  const [wallStyle, setWallStyle] = useState<'alabaster' | 'charcoal' | 'terracotta' | 'sage'>('alabaster');
  const [frameStyle, setFrameStyle] = useState<'wood' | 'black' | 'gold'>(defaultFrameStyle);

  const wallColors = {
    alabaster: 'bg-[#F2EFE9]',
    charcoal: 'bg-[#27272A]',
    terracotta: 'bg-[#D4A373]/20',
    sage: 'bg-[#E3E7D3]',
  };

  const frameStyles = {
    wood: 'border-[#7C5A38] bg-[#FAF9F6] shadow-2xl',
    black: 'border-[#18181B] bg-[#FAF9F6] shadow-2xl',
    gold: 'border-[#D4AF37] bg-[#FAF9F6] shadow-2xl',
  };

  return (
    <div className="space-y-4">
      {/* Control Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-brand" />
          <span className="font-medium text-charcoal uppercase tracking-wider text-[11px]">
            Màu tường nội thất:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setWallStyle('alabaster')}
              className={`w-5 h-5 rounded-full border ${wallStyle === 'alabaster' ? 'ring-2 ring-brand ring-offset-1' : ''} bg-[#F2EFE9]`}
              title="Tường Be Sáng (Alabaster)"
            />
            <button
              onClick={() => setWallStyle('charcoal')}
              className={`w-5 h-5 rounded-full border ${wallStyle === 'charcoal' ? 'ring-2 ring-brand ring-offset-1' : ''} bg-[#27272A]`}
              title="Tường Xám Đậm (Charcoal)"
            />
            <button
              onClick={() => setWallStyle('sage')}
              className={`w-5 h-5 rounded-full border ${wallStyle === 'sage' ? 'ring-2 ring-brand ring-offset-1' : ''} bg-[#E3E7D3]`}
              title="Tường Xanh Sage Tĩnh Lặng"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium text-charcoal uppercase tracking-wider text-[11px]">
            Chất liệu khung:
          </span>
          <div className="flex items-center gap-1 bg-canvas-surface p-1 border border-hairline">
            <button
              onClick={() => setFrameStyle('wood')}
              className={`px-2 py-0.5 text-[10px] uppercase tracking-wider ${frameStyle === 'wood' ? 'bg-brand text-white' : 'text-charcoal-muted'}`}
            >
              Gỗ Sồi
            </button>
            <button
              onClick={() => setFrameStyle('black')}
              className={`px-2 py-0.5 text-[10px] uppercase tracking-wider ${frameStyle === 'black' ? 'bg-brand text-white' : 'text-charcoal-muted'}`}
            >
              Nhôm Đen
            </button>
            <button
              onClick={() => setFrameStyle('gold')}
              className={`px-2 py-0.5 text-[10px] uppercase tracking-wider ${frameStyle === 'gold' ? 'bg-brand text-white' : 'text-charcoal-muted'}`}
            >
              Vàng Kim
            </button>
          </div>
        </div>
      </div>

      {/* Realistic Mockup Room Stage */}
      <div
        className={`relative aspect-[16/10] w-full overflow-hidden border border-hairline transition-colors duration-500 flex flex-col items-center justify-center p-8 md:p-12 ${wallColors[wallStyle]}`}
      >
        {/* Subtle Ceiling Downlight Ambience */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-48 bg-gradient-to-b from-white/30 to-transparent pointer-events-none blur-xl" />

        {/* Framed Artwork on Wall with Natural Shadow */}
        <div
          className={`relative z-10 transition-all duration-300 max-w-[65%] max-h-[70%] border-[8px] md:border-[12px] p-2 md:p-3 ${frameStyles[frameStyle]}`}
          style={{
            boxShadow:
              wallStyle === 'charcoal'
                ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
                : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div className="relative aspect-[4/3] w-48 sm:w-64 md:w-80 overflow-hidden">
            <Image
              src={imageSrc}
              alt={title}
              fill
              className="object-cover"
              sizes="320px"
            />
          </div>
        </div>

        {/* Interior Decor Elements (Console Table Line & Floor) */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/10 to-transparent border-t border-black/5 flex items-center justify-center">
          <div className="w-4/5 h-2 bg-amber-900/20 rounded-full blur-[1px]" />
        </div>

        {/* Mode Tag */}
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/80 backdrop-blur-sm text-charcoal text-[10px] uppercase tracking-wider font-medium border border-hairline flex items-center gap-1">
          <Eye className="w-3 h-3 text-brand" />
          <span>Mô Phỏng Treo Tường (Wall Preview)</span>
        </div>
      </div>
    </div>
  );
}
