import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, Palette, ShieldCheck, Compass, ArrowUpRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BeforeAfterSlider } from '@/components/home/BeforeAfterSlider';
import { ArtworkCard } from '@/components/portfolio/ArtworkCard';
import { fetchArtworks, fetchStudioConfig, fetchMaterials } from '@/lib/api';

export default async function HomePage() {
  const [artworksRes, studioConfig, materials] = await Promise.all([
    fetchArtworks({ isFeatured: true }),
    fetchStudioConfig(),
    fetchMaterials(),
  ]);

  const featuredArtworks = artworksRes.items.slice(0, 4);

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ==============================================================================
            1. FULL-BLEED HERO SHOWCASE (INSPIRED BY TUHAAN.COM, MODERNIZED)
           ============================================================================== */}
        <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden border-b border-hairline">
          {/* Full-bleed Edge-to-Edge Hero Painting Background */}
          <div className="absolute inset-0 z-0">
            <Image
              src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=2000&q=85"
              alt="Họa phẩm chủ đạo - Xưởng tranh Quốc Tuấn"
              fill
              sizes="100vw"
              className="object-cover object-center brightness-[0.85] scale-105"
              priority
            />
            {/* Museum gallery atmospheric overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/35 to-[#FAF9F6]" />
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/20 to-black/60 pointer-events-none" />
          </div>

          {/* Centered Editorial Hero Content */}
          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-8 pt-28 pb-20">
            {/* Subtle Slate-Teal Subtitle Bar / Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-brand/90 backdrop-blur-md text-white border border-brand-light/30 shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-artisan-light" />
              <span className="text-xs font-sans tracking-editorial uppercase font-medium">
                Xưởng Sáng Tác Tranh Sơn Dầu & Tranh Tường Độc Bản
              </span>
            </div>

            {/* High-Contrast Editorial Display Serif */}
            <h1 className="font-serif text-5xl sm:text-6xl md:text-8xl font-normal text-white tracking-tight leading-[1.08] drop-shadow-md">
              Nghệ thuật nguyên bản, <br />
              <span className="italic font-light text-zinc-100">định hình không gian sống.</span>
            </h1>

            {/* Editorial Lead Paragraph */}
            <p className="max-w-2xl mx-auto text-zinc-200 text-base md:text-lg font-light leading-relaxed drop-shadow-sm">
              Mỗi tác phẩm là sự giao hòa giữa cảm xúc tĩnh tại, chất liệu tự nhiên nhập khẩu châu Âu và kỹ thuật hàn lâm. Tinh tế, bền vững và kiến tạo duy nhất theo phong cách của bạn.
            </p>

            {/* Crisp Rectangular CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/commission"
                className="w-full sm:w-auto px-8 py-4 bg-brand hover:bg-brand-hover text-white text-xs uppercase tracking-editorial font-medium transition-all shadow-lg flex items-center justify-center gap-2.5"
              >
                <span>Khám Phá Bảng Giá & Đặt Vẽ</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/portfolio"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs uppercase tracking-editorial font-medium transition-all border border-white/25 flex items-center justify-center"
              >
                <span>Xem Bộ Sưu Tập Tác Phẩm</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ==============================================================================
            2. ARTISAN PILLARS (VALUE PROPOSITIONS)
           ============================================================================== */}
        <section className="border-b border-hairline bg-canvas-surface py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 border border-hairline bg-canvas space-y-4">
                <Palette className="w-6 h-6 text-brand" />
                <h3 className="font-serif text-2xl font-normal text-charcoal">
                  Chất Liệu Thượng Hạng
                </h3>
                <p className="text-xs text-charcoal-muted leading-relaxed font-light">
                  100% sơn dầu, acrylic nhập khẩu Pháp/Hà Lan vẽ trên toan vải lanh (Linen Canvas) và giấy Arches 300gsm. Độ bền màu trên 50 năm.
                </p>
              </div>

              <div className="p-8 border border-hairline bg-canvas space-y-4">
                <ShieldCheck className="w-6 h-6 text-artisan" />
                <h3 className="font-serif text-2xl font-normal text-charcoal">
                  Minh Bạch & Cam Kết
                </h3>
                <p className="text-xs text-charcoal-muted leading-relaxed font-light">
                  Khách hàng duyệt phác thảo {studioConfig.freeSketchRevisions} vòng miễn phí trước khi lên màu. Thanh toán minh bạch qua SePay VietQR có hóa đơn.
                </p>
              </div>

              <div className="p-8 border border-hairline bg-canvas space-y-4">
                <Compass className="w-6 h-6 text-brand" />
                <h3 className="font-serif text-2xl font-normal text-charcoal">
                  Bích Họa Khổ Lớn
                </h3>
                <p className="text-xs text-charcoal-muted leading-relaxed font-light">
                  Khảo sát tận nơi, miễn phí {studioConfig.freeKmRadius}km đầu tiên. Sơn tường chuyên dụng phủ nano kháng kiềm bảo hành bề mặt 15 năm.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==============================================================================
            3. CURATED FEATURED ARTWORKS (PORTFOLIO HIGHLIGHTS)
           ============================================================================== */}
        <section className="py-24 border-b border-hairline">
          <div className="max-w-7xl mx-auto px-6 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-hairline pb-8">
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-editorial text-artisan font-medium block">
                  Curated Collection
                </span>
                <h2 className="font-serif text-4xl md:text-5xl font-normal text-charcoal">
                  Tác Phẩm Tiêu Biểu
                </h2>
              </div>
              <Link
                href="/portfolio"
                className="text-xs uppercase tracking-editorial text-brand hover:text-brand-hover font-medium inline-flex items-center gap-2 group"
              >
                <span>Xem Toàn Bộ {artworksRes.total} Tác Phẩm</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Grid of Featured Artworks */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredArtworks.map((artwork) => (
                <ArtworkCard key={artwork.id} artwork={artwork} />
              ))}
            </div>
          </div>
        </section>

        {/* ==============================================================================
            4. INTERACTIVE BEFORE/AFTER SLIDER (WALL MURAL TRANSFORMATION)
           ============================================================================== */}
        <section className="py-24 border-b border-hairline bg-canvas-surface">
          <div className="max-w-6xl mx-auto px-6 space-y-10">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <span className="text-xs uppercase tracking-editorial text-artisan font-medium block">
                On-Site Transformation
              </span>
              <h2 className="font-serif text-4xl md:text-5xl font-normal text-charcoal">
                Từ Mảng Tường Thô Đến Bích Họa Nghệ Thuật
              </h2>
              <p className="text-xs md:text-sm text-charcoal-muted font-light leading-relaxed">
                Khám phá sự chuyển biến sống động khi không gian được bao phủ bởi các lớp sơn tường nghệ thuật thủ công. Tối ưu theo ánh sáng và phong cách nội thất kiến trúc.
              </p>
            </div>

            {/* The Interactive Slider */}
            <BeforeAfterSlider
              beforeImage="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80"
              afterImage="https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80"
              beforeLabel="Hiện trạng tường thô căn hộ"
              afterLabel="Bích họa Tropical hoàn thiện"
              title="Dự án Bích Họa Tropical Contemporary"
              location="Penthouse Ciputra, Tây Hồ, Hà Nội"
            />
          </div>
        </section>

        {/* ==============================================================================
            5. MATERIALS GUIDE TEASER
           ============================================================================== */}
        <section className="py-24 border-b border-hairline">
          <div className="max-w-7xl mx-auto px-6 space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs uppercase tracking-editorial text-brand font-medium block">
                Premium Mediums
              </span>
              <h2 className="font-serif text-4xl font-normal text-charcoal">
                Chất Liệu & Độ Bền Trường Tồn
              </h2>
              <p className="text-xs text-charcoal-muted font-light">
                Mỗi chất liệu mang một ngôn ngữ biểu cảm và tuổi thọ riêng biệt
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {materials.map((mat) => (
                <div
                  key={mat.id}
                  className="p-6 border border-hairline bg-canvas space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-canvas-surface border border-hairline text-charcoal-muted inline-block">
                      {mat.serviceType === 'FRAMED_ART' ? 'Tranh Đóng Khung' : 'Tranh Tường'}
                    </span>
                    <h3 className="font-serif text-xl text-charcoal">{mat.name}</h3>
                    <p className="text-xs text-charcoal-muted leading-relaxed font-light line-clamp-3">
                      {mat.description}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-hairline flex items-center justify-between text-xs">
                    <span className="text-charcoal-muted font-light">Đơn giá tham khảo:</span>
                    <span className="font-sans font-bold tabular-nums text-brand tracking-tight">
                      {mat.basePricePerM2.toLocaleString('vi-VN')} đ/m²
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center pt-4">
              <Link
                href="/about#materials"
                className="text-xs uppercase tracking-editorial text-charcoal hover:text-brand font-medium inline-flex items-center gap-2 underline underline-offset-4"
              >
                <span>Xem Hướng Dẫn Chi Tiết Về Bảo Quản & Bề Mặt</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ==============================================================================
            6. ARTIST STORY QUOTE & CALL TO ACTION
           ============================================================================== */}
        <section className="py-24 bg-charcoal text-white relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
            <span className="font-serif text-5xl md:text-6xl text-artisan block opacity-60">
              “
            </span>
            <blockquote className="font-serif text-2xl sm:text-3xl md:text-4xl font-light italic leading-snug tracking-wide text-zinc-200">
              Một bức tranh không chỉ là màu sắc trên toan, mà là khoảng lặng tinh tế đánh thức sự kết nối và năng lượng tĩnh tại trong tâm hồn gia chủ.
            </blockquote>
            <div className="pt-2">
              <p className="text-xs uppercase tracking-editorial text-zinc-400 font-medium">
                — {studioConfig.artistName}
              </p>
              <p className="text-[11px] text-zinc-500 font-light pt-1">
                Tốt nghiệp Đại học Mỹ thuật Việt Nam • {studioConfig.experienceYears} Năm Sáng Tác Chuyên Nghiệp
              </p>
            </div>

            <div className="pt-8">
              <Link
                href="/commission"
                className="inline-flex items-center gap-2 px-8 py-4 bg-brand hover:bg-brand-hover text-white text-xs uppercase tracking-editorial font-medium transition-colors shadow-lg"
              >
                <span>Khởi Tạo Yêu Cầu Đặt Vẽ Của Bạn</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
