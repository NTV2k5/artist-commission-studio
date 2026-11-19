import Link from 'next/link';
import { Phone, Mail, MapPin, Send, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-charcoal text-zinc-400">
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand & Philosophy */}
          <div className="md:col-span-1 space-y-4">
            <span className="font-serif text-2xl text-white tracking-wide block">
              Quốc Tuấn
            </span>
            <span className="text-xs uppercase tracking-editorial text-zinc-500 block">
              Art Atelier & Gallery
            </span>
            <p className="text-xs leading-relaxed text-zinc-400 font-light">
              Xưởng sáng tác nghệ thuật độc bản. Chuyên tranh sơn dầu, acrylic toan lanh và bích họa tường khổ lớn theo không gian kiến trúc.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-editorial text-white font-medium">
              Không Gian Nghệ Thuật
            </h4>
            <ul className="space-y-2.5 text-xs font-light">
              <li>
                <Link href="/portfolio" className="hover:text-white transition-colors">
                  Bộ Sưu Tập Tác Phẩm
                </Link>
              </li>
              <li>
                <Link href="/portfolio?type=FRAMED_ART" className="hover:text-white transition-colors">
                  Tranh Đóng Khung Treo Tường
                </Link>
              </li>
              <li>
                <Link href="/portfolio?type=WALL_MURAL" className="hover:text-white transition-colors">
                  Dự Án Bích Họa Tranh Tường
                </Link>
              </li>
              <li>
                <Link href="/about#materials" className="hover:text-white transition-colors">
                  Cẩm Nang Chất Liệu Vẽ
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  Tiểu Sử & Triết Lý Sáng Tác
                </Link>
              </li>
            </ul>
          </div>

          {/* Studio Contact */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-editorial text-white font-medium">
              Studio & Liên Hệ
            </h4>
            <ul className="space-y-3 text-xs font-light">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-light shrink-0 mt-0.5" />
                <span>Số 18, Ngõ 45 Phố Tràng Tiền, Hoàn Kiếm, Hà Nội</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-light shrink-0" />
                <a href="tel:0987654321" className="hover:text-white transition-colors">
                  0987.654.321 (Hotline / Zalo)
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand-light shrink-0" />
                <span>artist@studio.vn</span>
              </li>
            </ul>
          </div>

          {/* Direct Channels & Commitment */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-editorial text-white font-medium">
              Kênh Trao Đổi Trực Tiếp
            </h4>
            <div className="flex flex-col gap-2.5 text-xs font-light">
              <a
                href="https://zalo.me/0987654321"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 transition-colors border border-zinc-700/60"
              >
                <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>Chat Trực Tiếp Qua Zalo</span>
              </a>
              <a
                href="https://m.me/artistcommissionstudio"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 transition-colors border border-zinc-700/60"
              >
                <Send className="w-3.5 h-3.5 text-cyan-400" />
                <span>Facebook Messenger</span>
              </a>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed pt-2">
              Cam kết duyệt phác thảo 2 vòng miễn phí. Thanh toán minh bạch qua SePay VietQR có biên nhận điện tử.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-zinc-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-light text-zinc-500">
          <p>© {new Date().getFullYear()} Artist Quốc Tuấn Art Atelier. All rights reserved.</p>
          <p className="tracking-editorial uppercase text-[10px]">
            Restrained Gallery Canvas Architecture
          </p>
        </div>
      </div>
    </footer>
  );
}
