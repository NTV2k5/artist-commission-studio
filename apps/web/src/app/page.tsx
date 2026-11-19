import Link from 'next/link';
import { ArrowRight, Sparkles, Palette, ShieldCheck, Compass } from 'lucide-react';
import { DEFAULT_PRICING_CONFIG } from '@studio/shared';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-canvas">
      {/* Editorial Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-canvas/80 border-b border-hairline transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif text-2xl font-semibold tracking-wide text-charcoal">
              Quốc Tuấn
            </span>
            <span className="text-xs font-sans tracking-[0.2em] text-charcoal-muted uppercase pl-2 border-l border-hairline">
              Art Atelier
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-sans uppercase tracking-editorial text-charcoal-muted">
            <Link href="#portfolio" className="hover:text-charcoal transition-colors">
              Bộ Sưu Tập
            </Link>
            <Link href="#materials" className="hover:text-charcoal transition-colors">
              Chất Liệu
            </Link>
            <Link href="#about" className="hover:text-charcoal transition-colors">
              Họa Sĩ
            </Link>
            <Link href="/commission" className="hover:text-charcoal transition-colors">
              Đặt Vẽ
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/commission"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-medium uppercase tracking-wider transition-colors shadow-sm"
            >
              Đặt Vẽ Tranh
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-28 md:pt-32 md:pb-40 border-b border-hairline overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-hairline bg-canvas-surface text-charcoal text-xs tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-artisan" />
            <span>Xưởng Sáng Tác Tranh Sơn Dầu & Tranh Tường Độc Bản</span>
          </div>

          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-normal text-charcoal tracking-tight leading-[1.1]">
            Nghệ thuật nguyên bản, <br />
            <span className="italic font-light">định hình không gian sống.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-charcoal-muted text-base md:text-lg font-light leading-relaxed">
            Mỗi tác phẩm là sự giao hòa giữa cảm xúc tĩnh tại, chất liệu tự nhiên thượng hạng và kỹ thuật hội họa hàn lâm. Tinh tế, bền vững và duy nhất dành riêng cho không gian của bạn.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/commission"
              className="w-full sm:w-auto px-8 py-3.5 bg-brand hover:bg-brand-hover text-white text-xs uppercase tracking-editorial font-medium transition-colors shadow-sm"
            >
              Khám Phá Bảng Giá & Đặt Vẽ
            </Link>
            <Link
              href="#portfolio"
              className="w-full sm:w-auto px-8 py-3.5 border border-hairline hover:bg-canvas-surface text-charcoal text-xs uppercase tracking-editorial font-medium transition-colors"
            >
              Xem Tác Phẩm Đã Thực Hiện
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 border border-hairline bg-canvas-surface space-y-4">
            <Palette className="w-6 h-6 text-brand" />
            <h3 className="font-serif text-2xl font-normal text-charcoal">
              Chất Liệu Thượng Hạng
            </h3>
            <p className="text-sm text-charcoal-muted leading-relaxed font-light">
              100% sơn dầu, acrylic nhập khẩu châu Âu vẽ trên toan vải lanh (Linen Canvas) và giấy Arches Pháp tiêu chuẩn bảo tàng.
            </p>
          </div>

          <div className="p-8 border border-hairline bg-canvas-surface space-y-4">
            <ShieldCheck className="w-6 h-6 text-artisan" />
            <h3 className="font-serif text-2xl font-normal text-charcoal">
              Minh Bạch & Cam Kết
            </h3>
            <p className="text-sm text-charcoal-muted leading-relaxed font-light">
              Duyệt phác thảo {DEFAULT_PRICING_CONFIG.freeSketchRevisions} vòng miễn phí trước khi lên màu. Thanh toán minh bạch qua SePay VietQR tự động.
            </p>
          </div>

          <div className="p-8 border border-hairline bg-canvas-surface space-y-4">
            <Compass className="w-6 h-6 text-brand" />
            <h3 className="font-serif text-2xl font-normal text-charcoal">
              Tranh Tường & Khổ Lớn
            </h3>
            <p className="text-sm text-charcoal-muted leading-relaxed font-light">
              Khảo sát và sáng tác trực tiếp tại công trình, miễn phí {DEFAULT_PRICING_CONFIG.freeKmRadius}km đầu tiên, bảo hành độ bền bề mặt đến 15 năm.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-hairline bg-charcoal text-zinc-400 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-light">
          <p>© {new Date().getFullYear()} Artist Commission Studio. All rights reserved.</p>
          <p className="tracking-editorial uppercase text-zinc-500">
            Design inspired by restrained gallery canvas architecture
          </p>
        </div>
      </footer>
    </main>
  );
}
