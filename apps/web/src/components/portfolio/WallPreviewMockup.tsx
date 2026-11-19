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
    terracotta: 'bg-[#D4A373]/25',
    sage: 'bg-[#E3E7D3]',
  };

  const frameStyles = {
    wood: 'border-[#5C3A21] bg-[#FAF9F6]',
    black: 'border-[#18181B] bg-[#FAF9F6]',
    gold: 'border-[#C59B27] bg-[#FAF9F6]',
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
              className={`w-5 h-5 rounded-full border transition-all ${wallStyle === 'alabaster' ? 'ring-2 ring-brand ring-offset-1 scale-110' : ''} bg-[#F2EFE9]`}
              title="Tường Be Sáng (Alabaster)"
            />
            <button
              onClick={() => setWallStyle('charcoal')}
              className={`w-5 h-5 rounded-full border transition-all ${wallStyle === 'charcoal' ? 'ring-2 ring-brand ring-offset-1 scale-110' : ''} bg-[#27272A]`}
              title="Tường Xám Đậm (Charcoal)"
            />
            <button
              onClick={() => setWallStyle('sage')}
              className={`w-5 h-5 rounded-full border transition-all ${wallStyle === 'sage' ? 'ring-2 ring-brand ring-offset-1 scale-110' : ''} bg-[#E3E7D3]`}
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
              className={`px-2 py-0.5 text-[10px] uppercase tracking-wider transition-colors ${frameStyle === 'wood' ? 'bg-brand text-white font-medium' : 'text-charcoal-muted hover:text-charcoal'}`}
            >
              Gỗ Sồi
            </button>
            <button
              onClick={() => setFrameStyle('black')}
              className={`px-2 py-0.5 text-[10px] uppercase tracking-wider transition-colors ${frameStyle === 'black' ? 'bg-brand text-white font-medium' : 'text-charcoal-muted hover:text-charcoal'}`}
            >
              Nhôm Đen
            </button>
            <button
              onClick={() => setFrameStyle('gold')}
              className={`px-2 py-0.5 text-[10px] uppercase tracking-wider transition-colors ${frameStyle === 'gold' ? 'bg-brand text-white font-medium' : 'text-charcoal-muted hover:text-charcoal'}`}
            >
              Vàng Kim
            </button>
          </div>
        </div>
      </div>

      {/* Realistic Mockup Room Stage */}
      <div
        className={`relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden border border-hairline transition-colors duration-500 flex items-center justify-center ${wallColors[wallStyle]}`}
      >
        {/* Subtle Ceiling Downlight Ambience */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-48 bg-gradient-to-b from-white/40 via-white/10 to-transparent pointer-events-none blur-2xl" />

        {/* Framed Artwork Perfectly Centered on Wall */}
        <div className="relative z-10 flex items-center justify-center p-4 sm:p-6 w-full h-full pb-8">
          {/* Outer Frame Moulding */}
          <div
            className={`transition-all duration-300 rounded-[2px] border-[8px] sm:border-[12px] md:border-[14px] shadow-2xl flex items-center justify-center ${frameStyles[frameStyle]}`}
            style={{
              boxShadow:
                wallStyle === 'charcoal'
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 10px 20px -5px rgba(0, 0, 0, 0.5)'
                  : '0 25px 45px -12px rgba(0, 0, 0, 0.3), 0 8px 16px -4px rgba(0, 0, 0, 0.15)',
            }}
          >
            {/* White Matboard (Passe-partout) Layer */}
            <div className="bg-[#FAF9F6] p-3 sm:p-4 md:p-5 shadow-inner ring-1 ring-black/10 flex items-center justify-center">
              {/* Inner Artwork Canvas strictly bounded and centered */}
              <div className="relative aspect-[4/3] w-36 sm:w-52 md:w-64 lg:w-72 max-w-[50vw] max-h-[35vh] overflow-hidden shadow-sm border border-black/10">
                <Image
                  src={imageSrc}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 160px, (max-width: 1024px) 240px, 320px"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {/* Interior Decor Elements (Console Table Line & Floor) */}
        <div className="absolute bottom-0 left-0 right-0 h-8 sm:h-10 bg-gradient-to-t from-black/15 to-transparent border-t border-black/10 flex items-center justify-center pointer-events-none">
          <div className="w-3/4 h-1.5 bg-amber-950/25 rounded-full blur-[1px]" />
        </div>

        {/* Mode Tag */}
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/85 backdrop-blur-sm text-charcoal text-[10px] uppercase tracking-wider font-medium border border-hairline flex items-center gap-1 z-20 shadow-xs">
          <Eye className="w-3 h-3 text-brand" />
          <span>Mô Phỏng Treo Tường (Wall Preview)</span>
        </div>
      </div>
    </div>
  );
}
