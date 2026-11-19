import { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CommissionConfigurator } from '@/components/commission/CommissionConfigurator';
import { fetchArtworks, fetchMaterials, fetchStudioConfig } from '@/lib/api';

export const metadata = {
  title: 'Báo Giá & Cấu Hình Đặt Vẽ Tranh | Họa Sĩ Quốc Tuấn',
  description: 'Công cụ tính giá tranh sơn dầu, acrylic và bích họa tường theo kích thước thực tế, chất liệu và độ phức tạp. Minh bạch, cập nhật thời gian thực.',
};

export default async function CommissionPage() {
  const [materials, artworksRes, studioConfig] = await Promise.all([
    fetchMaterials(),
    fetchArtworks(),
    fetchStudioConfig(),
  ]);

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          {/* Header Description */}
          <div className="max-w-3xl space-y-4">
            <span className="text-xs uppercase tracking-editorial text-artisan font-medium block">
              Dynamic Pricing Engine
            </span>
            <h1 className="font-serif text-5xl md:text-6xl text-charcoal font-normal tracking-tight">
              Báo Giá & Cấu Hình Đặt Vẽ
            </h1>
            <p className="text-sm text-charcoal-muted font-light leading-relaxed">
              Tùy chỉnh chính xác kích thước tường, loại chất liệu nghệ thuật và độ chi tiết của bức tranh để xem ngay bảng bóc tách chi phí và tiền cọc theo thời gian thực.
            </p>
          </div>

          {/* Suspense-wrapped Configurator */}
          <Suspense
            fallback={
              <div className="p-16 text-center border border-hairline bg-canvas-surface text-charcoal-muted text-xs uppercase tracking-wider">
                Đang tải công cụ cấu hình tranh...
              </div>
            }
          >
            <CommissionConfigurator
              materials={materials}
              artworks={artworksRes.items}
              studioConfig={{
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
                hotline: studioConfig.hotline,
              }}
            />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
