'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { MoveHorizontal } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  title: string;
  location: string;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Hiện trạng tường thô',
  afterLabel = 'Bích họa hoàn thiện',
  title,
  location,
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden select-none cursor-ew-resize border border-hairline bg-zinc-900 group shadow-md"
      >
        {/* After Image (Full Background) */}
        <div className="absolute inset-0">
          <Image
            src={afterImage}
            alt={afterLabel}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-charcoal/80 backdrop-blur-sm text-white text-[11px] font-sans tracking-wider uppercase border border-white/10">
            {afterLabel}
          </div>
        </div>

        {/* Before Image (Clipped Left Layer) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <div className="absolute inset-0 w-[100vw] max-w-[1280px]">
            <Image
              src={beforeImage}
              alt={beforeLabel}
              fill
              className="object-cover brightness-90 grayscale-[30%]"
              priority
            />
          </div>
          <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-charcoal/80 backdrop-blur-sm text-white text-[11px] font-sans tracking-wider uppercase border border-white/10">
            {beforeLabel}
          </div>
        </div>

        {/* Divider Handle Line */}
        <div
          className="absolute top-0 bottom-0 z-30 w-1 bg-white shadow-2xl cursor-ew-resize"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-charcoal border-2 border-white shadow-lg flex items-center justify-center text-white transition-transform group-hover:scale-110">
            <MoveHorizontal className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* Project Meta Information */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-charcoal-muted px-1">
        <div>
          <span className="font-serif text-base text-charcoal font-medium">{title}</span>
          <span className="mx-2">•</span>
          <span>{location}</span>
        </div>
        <p className="italic text-[11px] pt-1 sm:pt-0">
          * Kéo thanh trượt để so sánh bề mặt tường trước và sau khi họa sĩ thi công
        </p>
      </div>
    </div>
  );
}
