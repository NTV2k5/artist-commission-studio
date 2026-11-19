import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Sparkles, CheckCircle2, MessageCircle, Ruler, ShieldCheck } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CanvasLoupe } from '@/components/portfolio/CanvasLoupe';
import { WallPreviewMockup } from '@/components/portfolio/WallPreviewMockup';
import { fetchArtworkBySlug, fetchStudioConfig } from '@/lib/api';

interface ArtworkDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArtworkDetailPageProps) {
  const { slug } = await params;
  const artwork = await fetchArtworkBySlug(slug);
  if (!artwork) return { title: 'Tác Phẩm | Artist Studio' };

  return {
    title: `${artwork.title} | Họa sĩ Quốc Tuấn`,
    description: artwork.description,
  };
}

export default async function ArtworkDetailPage({ params }: ArtworkDetailPageProps) {
  const { slug } = await params;
  const [artwork, studioConfig] = await Promise.all([
    fetchArtworkBySlug(slug),
    fetchStudioConfig(),
  ]);

  if (!artwork) {
    notFound();
  }

  const isMural = artwork.serviceType === 'WALL_MURAL';

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          {/* Breadcrumb Back Link */}
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-charcoal-muted hover:text-charcoal transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Quay lại Bộ sưu tập</span>
          </Link>

          {/* Main Showcase Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column: High-Res Inspection & Wall Preview */}
            <div className="lg:col-span-7 space-y-8">
              {/* Canvas Loupe Zoom Component */}
              <div className="space-y-3">
                <CanvasLoupe
                  src={artwork.images[0]}
                  alt={artwork.title}
                />
              </div>

              {/* Wall Preview Mockup Stage (for framed art or murals) */}
              <div className="pt-6 border-t border-hairline space-y-4">
                <h3 className="font-serif text-2xl text-charcoal font-normal">
                  Phối Cảnh Không Gian Thực Tế
                </h3>
                <p className="text-xs text-charcoal-muted font-light">
                  Xem trước tranh khi được đóng khung và treo trên các tông màu tường nội thất khác nhau.
                </p>
                <WallPreviewMockup
                  imageSrc={artwork.images[0]}
                  title={artwork.title}
                />
              </div>
            </div>

            {/* Right Column: Narrative, Specifications & Commission Trigger */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-4 border-b border-hairline pb-8">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-brand/10 text-brand text-[10px] uppercase tracking-wider font-medium border border-brand/20">
                    {isMural ? 'Bích Họa Tường Nghệ Thuật' : 'Tranh Đóng Khung Treo Tường'}
                  </span>
                  {artwork.isFeatured && (
                    <span className="flex items-center gap-1 text-[10px] text-artisan uppercase tracking-wider font-medium">
                      <Sparkles className="w-3 h-3" />
                      <span>Tác Phẩm Tiêu Biểu</span>
                    </span>
                  )}
                </div>

                <h1 className="font-serif text-4xl sm:text-5xl text-charcoal font-normal leading-tight">
                  {artwork.title}
                </h1>

                <p className="text-xs uppercase tracking-editorial text-charcoal-muted">
                  Họa Sĩ Sáng Tác: {studioConfig.artistName}
                </p>

                <p className="text-sm text-charcoal font-light leading-relaxed whitespace-pre-line pt-2">
                  {artwork.description}
                </p>
              </div>

              {/* Specifications Matrix */}
              <div className="p-6 border border-hairline bg-canvas-surface space-y-4">
                <h3 className="text-xs uppercase tracking-editorial text-charcoal font-medium">
                  Thông Số Kỹ Thuật Tác Phẩm
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs font-light">
                  <div className="space-y-1">
                    <span className="text-charcoal-muted block">Chất liệu chính:</span>
                    <span className="font-medium text-charcoal block">
                      {artwork.material?.name || 'Sơn cao cấp'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-charcoal-muted block">Độ bền màu:</span>
                    <span className="font-medium text-artisan block">
                      {artwork.material?.durabilityNote?.slice(0, 24) || 'Trên 30-50 năm'}
                    </span>
                  </div>
                  <div className="space-y-1 col-span-2 border-t border-hairline pt-3">
                    <span className="text-charcoal-muted block flex items-center gap-1">
                      <Ruler className="w-3.5 h-3.5 text-brand" />
                      <span>Kích thước khuyến nghị:</span>
                    </span>
                    <span className="font-medium text-charcoal block">
                      {artwork.dimensionsNote || 'Tùy chỉnh theo diện tích tường của gia chủ'}
                    </span>
                  </div>
                  <div className="space-y-1 col-span-2 border-t border-hairline pt-3">
                    <span className="text-charcoal-muted block flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-brand" />
                      <span>Chính sách duyệt phác thảo:</span>
                    </span>
                    <span className="font-medium text-charcoal block">
                      {studioConfig.freeSketchRevisions} vòng phác thảo chì/kỹ thuật số miễn phí trước khi họa sĩ lên màu thực tế.
                    </span>
                  </div>
                </div>
              </div>

              {/* Commission Action Card */}
              <div className="p-6 border border-brand/20 bg-brand/5 space-y-4">
                <div className="space-y-1">
                  <h4 className="font-serif text-2xl text-charcoal font-medium">
                    Đặt Vẽ Tác Phẩm Theo Mẫu Này
                  </h4>
                  <p className="text-xs text-charcoal-muted font-light">
                    Họa sĩ sẽ vẽ mới hoàn toàn tác phẩm này theo kích thước chuẩn xác với diện tích tường của bạn.
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <Link
                    href={`/commission?template=${artwork.slug}&materialId=${artwork.materialId}&serviceType=${artwork.serviceType}`}
                    className="w-full py-3.5 bg-brand hover:bg-brand-hover text-white text-xs uppercase tracking-editorial font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <span>Cấu Hình Kích Thước & Xem Báo Giá</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <a
                    href={`https://zalo.me/${studioConfig.hotline}?text=${encodeURIComponent(`Xin chào Họa sĩ Quốc Tuấn, tôi muốn tư vấn vẽ bức tranh: ${artwork.title}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 bg-canvas border border-hairline hover:bg-canvas-surface text-charcoal text-xs uppercase tracking-wider font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    <span>Hỏi Nhanh Họa Sĩ Qua Zalo</span>
                  </a>
                </div>

                <div className="pt-2 space-y-1.5 text-[11px] text-charcoal-muted font-light">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-artisan shrink-0" />
                    <span>Bảo hành bề mặt màu và lớp vec-ni chống ẩm mốc</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-artisan shrink-0" />
                    <span>Đóng gói hòm gỗ chuyên dụng chống sốc khi vận chuyển toàn quốc</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
