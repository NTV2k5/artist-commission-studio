'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ZoomIn } from 'lucide-react';

interface CanvasLoupeProps {
  src: string;
  alt: string;
  zoomLevel?: number;
}

export function CanvasLoupe({ src, alt, zoomLevel = 2.5 }: CanvasLoupeProps) {
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const magnifierSize = 160;
  const lensRadius = magnifierSize / 2;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();

    const x = e.clientX - left;
    const y = e.clientY - top;

    // Check bounds
    if (x < 0 || y < 0 || x > width || y > height) {
      setShowMagnifier(false);
      return;
    }

    setCursorPos({ x, y });
    setContainerSize({ width, height });
  };

  // Background math for accurate 2.5x magnification without inverted scaling
  const bgWidth = containerSize.width * zoomLevel;
  const bgHeight = containerSize.height * zoomLevel;
  const bgX = -(cursorPos.x * zoomLevel - lensRadius);
  const bgY = -(cursorPos.y * zoomLevel - lensRadius);

  return (
    <div className="relative space-y-2">
      <div
        ref={containerRef}
        onMouseEnter={() => setShowMagnifier(true)}
        onMouseLeave={() => setShowMagnifier(false)}
        onMouseMove={handleMouseMove}
        className="relative aspect-[4/3] w-full overflow-hidden border border-hairline bg-zinc-950 cursor-crosshair group shadow-md"
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 60vw"
          priority
        />

        {/* Magnifier Lens */}
        {showMagnifier && containerSize.width > 0 && (
          <div
            className="absolute pointer-events-none rounded-full border-2 border-white/90 shadow-2xl z-30 overflow-hidden"
            style={{
              width: `${magnifierSize}px`,
              height: `${magnifierSize}px`,
              top: `${cursorPos.y - lensRadius}px`,
              left: `${cursorPos.x - lensRadius}px`,
              backgroundImage: `url(${src})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: `${bgWidth}px ${bgHeight}px`,
              backgroundPosition: `${bgX}px ${bgY}px`,
              boxShadow: '0 0 25px rgba(0,0,0,0.5)',
            }}
          />
        )}

        {/* Floating Hint Pill */}
        <div className="absolute bottom-3 right-3 px-3 py-1 bg-charcoal/80 backdrop-blur-md text-white text-[11px] font-sans tracking-wider uppercase border border-white/10 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="w-3.5 h-3.5 text-brand-light" />
          <span>Kính Lúp Soi Nét Vẽ (Canvas Loupe)</span>
        </div>
      </div>
      <p className="text-[11px] text-charcoal-muted italic">
        * Rê chuột lên bề mặt tranh để kích hoạt kính lúp soi chi tiết vân toan và kỹ thuật đắp màu.
      </p>
    </div>
  );
}
