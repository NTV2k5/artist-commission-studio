import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MapPin, Phone, Mail, Award, Clock, Palette, Sparkles, Check } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { fetchMaterials, fetchStudioConfig } from '@/lib/api';

export const metadata = {
  title: 'Họa Sĩ Quốc Tuấn & Cẩm Nang Chất Liệu | Art Atelier',
  description: 'Tiểu sử, triết lý sáng tác của Họa sĩ Quốc Tuấn và hướng dẫn chuyên sâu về độ bền, chất liệu tranh sơn dầu, acrylic, màu nước và bích họa tường.',
};

export default async function AboutPage() {
  const [studioConfig, materials] = await Promise.all([
    fetchStudioConfig(),
    fetchMaterials(),
  ]);

  const timelineMilestones = [
    {
      year: '2016',
      title: 'Tốt Nghiệp Thủ Khoa Hội Họa',
      description: 'Tốt nghiệp Đại học Mỹ thuật Việt Nam (Yết Kiêu) chuyên ngành Tranh Sơn Dầu & Nghệ thuật tạo hình hàn lâm.',
    },
    {
      year: '2018',
      title: 'Triển Lãm Cá Nhân: "Sắc Màu & Khoảng Lặng"',
      description: 'Trưng bày 24 tác phẩm sơn dầu khổ lớn tại Trung tâm Giao lưu Văn hóa Phố Cổ Hà Nội, được giới chuyên môn đánh giá cao về bút pháp đắp màu.',
    },
    {
      year: '2021',
      title: 'Dự Án Bích Họa Quần Thể Resort Tràng An',
      description: 'Chủ trì thiết kế và thi công 500m² bích họa phong cảnh non nước Ninh Bình với sơn chuyên dụng kháng kiềm và thời tiết.',
    },
    {
      year: '2024 - Nay',
      title: 'Thành Lập Quốc Tuấn Art Atelier',
      description: 'Xây dựng xưởng sáng tác độc lập tại Tràng Tiền, hoàn thiện hơn 350+ bức tranh đóng khung và dự án tranh tường cho các căn hộ, biệt thự cao cấp.',
    },
  ];

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-24">
        {/* ==============================================================================
            1. ARTIST BIOGRAPHY & PHILOSOPHY
           ============================================================================== */}
        <section className="max-w-7xl mx-auto px-6 pb-20 border-b border-hairline">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Artist Portrait */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[4/5] w-full overflow-hidden border border-hairline bg-zinc-900 shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80"
                  alt={studioConfig.artistName}
                  fill
                  className="object-cover grayscale-[15%]"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                  <span className="font-serif text-2xl font-medium block">
                    {studioConfig.artistName}
                  </span>
                  <span className="text-xs uppercase tracking-editorial text-zinc-300 block">
                    Visual Artist & Founder of Studio
                  </span>
                </div>
              </div>
            </div>

            {/* Narrative & Storytelling */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-editorial text-artisan font-medium block">
                  Artist Biography & Philosophy
                </span>
                <h1 className="font-serif text-4xl sm:text-5xl text-charcoal font-normal tracking-tight leading-tight">
                  Nghệ thuật là hành trình tìm kiếm sự tĩnh tại trong tâm hồn.
                </h1>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-charcoal font-light leading-relaxed">
                <p>
                  Sinh ra và lớn lên trong lòng phố cổ Hà Nội, tuổi thơ của họa sĩ Quốc Tuấn gắn liền với những mảng tường rêu phong, tán bàng lá đỏ và ánh nắng thu vàng mật trên mái ngói ngàn năm. Những ký ức thị giác mộc mạc ấy đã nuôi dưỡng ngọn lửa đam mê và định hình nên phong cách nghệ thuật đằm thắm, giàu chất thơ của anh.
                </p>
                <p>
                  {studioConfig.bio}
                </p>
                <p>
                  Với triết lý <em>&ldquo;Restrained Gallery Canvas&rdquo;</em>, anh quan niệm mỗi bức tranh đặt vẽ theo yêu cầu không chỉ đơn thuần là đồ vật trang trí nội thất, mà là một thực thể nghệ thuật sống động. Tranh phải hòa nhập tự nhiên vào không gian sống của gia chủ, mang lại cảm giác bình yên sau những bộn bề đời thường.
                </p>
              </div>

              {/* Quick Credentials */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4 border-t border-hairline">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-brand">
                    <Award className="w-4 h-4" />
                    <span className="font-serif text-2xl font-normal text-charcoal">
                      {studioConfig.experienceYears}+ Năm
                    </span>
                  </div>
                  <span className="text-xs text-charcoal-muted font-light block">
                    Kinh nghiệm sáng tác
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-artisan">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-serif text-2xl font-normal text-charcoal">
                      350+
                    </span>
                  </div>
                  <span className="text-xs text-charcoal-muted font-light block">
                    Tác phẩm độc bản đã hoàn thành
                  </span>
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-2 text-brand">
                    <Clock className="w-4 h-4" />
                    <span className="font-serif text-2xl font-normal text-charcoal">
                      100%
                    </span>
                  </div>
                  <span className="text-xs text-charcoal-muted font-light block">
                    Cam kết chuẩn chất liệu châu Âu
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==============================================================================
            2. CAREER TIMELINE MILESTONES
           ============================================================================== */}
        <section className="py-20 border-b border-hairline bg-canvas-surface">
          <div className="max-w-5xl mx-auto px-6 space-y-12">
            <div className="text-center space-y-3">
              <span className="text-xs uppercase tracking-editorial text-artisan font-medium block">
                Career Journey
              </span>
              <h2 className="font-serif text-4xl text-charcoal font-normal">
                Hành Trình Nghệ Thuật
              </h2>
            </div>

            <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 md:before:left-1/2 before:w-0.5 before:bg-hairline">
              {timelineMilestones.map((item, index) => {
                const isEven = index % 2 === 0;
                return (
                  <div
                    key={item.year}
                    className={`relative flex flex-col md:flex-row items-start md:items-center gap-6 ${
                      isEven ? 'md:flex-row-reverse' : ''
                    }`}
                  >
                    {/* Node Dot */}
                    <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-brand border-4 border-canvas shadow-sm z-10" />

                    {/* Content Card */}
                    <div className="w-full md:w-1/2 pl-12 md:pl-0 md:px-8">
                      <div className="p-6 border border-hairline bg-canvas space-y-2 shadow-sm">
                        <span className="text-xs font-serif text-artisan font-medium tracking-wider">
                          Năm {item.year}
                        </span>
                        <h3 className="font-serif text-xl text-charcoal font-normal">
                          {item.title}
                        </h3>
                        <p className="text-xs text-charcoal-muted font-light leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==============================================================================
            3. MATERIALS, COLORS & DURABILITY GUIDE (#materials)
           ============================================================================== */}
        <section id="materials" className="py-24 border-b border-hairline scroll-mt-24">
          <div className="max-w-7xl mx-auto px-6 space-y-12">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <span className="text-xs uppercase tracking-editorial text-brand font-medium block">
                Materials & Preservation Guide
              </span>
              <h2 className="font-serif text-4xl sm:text-5xl text-charcoal font-normal">
                Cẩm Nang Chất Liệu & Độ Bền Trường Tồn
              </h2>
              <p className="text-xs sm:text-sm text-charcoal-muted font-light leading-relaxed">
                Để mỗi tác phẩm tồn tại qua nhiều thế hệ, việc thấu hiểu đặc tính hóa lý của từng chất liệu và cách bảo quản bề mặt là vô cùng quan trọng.
              </p>
            </div>

            {/* Detailed Cards for 4 Materials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {materials.map((mat) => (
                <div
                  key={mat.id}
                  className="p-8 border border-hairline bg-canvas space-y-6 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4 border-b border-hairline pb-4">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-brand font-medium">
                          {mat.serviceType === 'FRAMED_ART' ? 'Tranh Đóng Khung Treo Tường' : 'Thi Công Bích Họa Tường'}
                        </span>
                        <h3 className="font-serif text-2xl text-charcoal font-normal pt-1">
                          {mat.name}
                        </h3>
                      </div>
                      <span className="text-xs font-medium text-charcoal bg-canvas-surface px-3 py-1.5 border border-hairline shrink-0">
                        {mat.basePricePerM2.toLocaleString('vi-VN')} đ/m²
                      </span>
                    </div>

                    <p className="text-xs text-charcoal font-light leading-relaxed">
                      {mat.description}
                    </p>

                    <div className="p-4 bg-canvas-surface border border-hairline space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-charcoal">
                        <Palette className="w-3.5 h-3.5 text-artisan" />
                        <span>Độ bền màu & Bảo quản:</span>
                      </div>
                      <p className="text-xs text-charcoal-muted font-light leading-relaxed">
                        {mat.durabilityNote || 'Bảo quản nơi khô ráo, tránh ánh nắng gắt chiếu trực diện.'}
                      </p>
                    </div>

                    {/* Quality Badges */}
                    <ul className="space-y-2 text-xs text-charcoal-muted font-light">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-brand shrink-0" />
                        <span>Nguyên liệu nhập khẩu chính hãng, không chứa dung môi độc hại</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-brand shrink-0" />
                        <span>Phủ lớp bảo vệ chống ẩm mốc và tia cực tím (UV)</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-hairline">
                    <Link
                      href={`/commission?materialId=${mat.id}&serviceType=${mat.serviceType}`}
                      className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white text-xs uppercase tracking-wider font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>Chọn Vẽ Với Chất Liệu Này</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==============================================================================
            4. STUDIO LOCATION & VISITING INFO
           ============================================================================== */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="p-8 md:p-12 border border-hairline bg-charcoal text-white grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7 space-y-4">
                <span className="text-xs uppercase tracking-editorial text-artisan font-medium block">
                  Studio Atelier & Consultation
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-normal text-white">
                  Ghé Thăm Studio Của Họa Sĩ
                </h2>
                <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
                  Chúng tôi nồng nhiệt chào đón quý khách tới thăm không gian sáng tác tại Hoàn Kiếm, ngắm nhìn trực tiếp các bức tranh đang vẽ dở và cùng họa sĩ trò chuyện về tác phẩm tương lai của bạn.
                </p>

                <div className="space-y-2 pt-2 text-xs text-zinc-300 font-light">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-brand-light shrink-0" />
                    <span>{studioConfig.studioAddress}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-brand-light shrink-0" />
                    <span>{studioConfig.hotline} (Vui lòng đặt lịch hẹn trước khi qua)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-brand-light shrink-0" />
                    <span>artist@studio.vn</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-5 flex flex-col gap-3">
                <Link
                  href="/commission"
                  className="w-full py-4 bg-brand hover:bg-brand-hover text-white text-xs uppercase tracking-editorial font-medium text-center transition-colors shadow-md"
                >
                  Cấu Hình Đặt Vẽ Tranh Online
                </Link>
                <a
                  href={`https://zalo.me/${studioConfig.hotline}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs uppercase tracking-wider font-medium text-center transition-colors border border-zinc-700"
                >
                  Nhắn Tin Hẹn Giờ Thăm Studio Qua Zalo
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
