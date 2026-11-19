import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PortfolioFilterableGallery } from '@/components/portfolio/PortfolioFilterableGallery';
import { fetchArtworks, fetchMaterials } from '@/lib/api';

export const metadata = {
  title: 'Bộ Sưu Tập Tác Phẩm | Họa sĩ Quốc Tuấn Art Atelier',
  description: 'Khám phá các tác phẩm tranh sơn dầu, acrylic toan lanh và bích họa tường khổ lớn tiêu biểu đã sáng tác.',
};

export default async function PortfolioPage() {
  const [artworksRes, materials] = await Promise.all([
    fetchArtworks(),
    fetchMaterials(),
  ]);

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          {/* Header Title Section */}
          <div className="max-w-3xl space-y-4">
            <span className="text-xs uppercase tracking-editorial text-artisan font-medium block">
              Portfolio & Archive
            </span>
            <h1 className="font-serif text-5xl md:text-6xl text-charcoal font-normal tracking-tight">
              Bộ Sưu Tập Tác Phẩm
            </h1>
            <p className="text-sm text-charcoal-muted font-light leading-relaxed">
              Tổng hợp những bức tranh sơn dầu, acrylic độc bản và dự án bích họa tường thực tế. Mỗi tác phẩm được giám sát tỉ mỉ từ khâu chọn toan vải lanh đến lớp phủ bảo vệ tiêu chuẩn bảo tàng.
            </p>
          </div>

          {/* Filterable Gallery */}
          <PortfolioFilterableGallery
            initialArtworks={artworksRes.items}
            materials={materials}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
