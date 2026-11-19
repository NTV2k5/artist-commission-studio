import { PrismaClient, Role, ServiceType, Complexity } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed or Upsert Artist Admin User
  const artistEmail = process.env.ARTIST_ADMIN_EMAIL || 'artist@studio.vn';
  const artistUser = await prisma.user.upsert({
    where: { email: artistEmail },
    update: {
      role: Role.ARTIST,
      name: 'Họa sĩ Quốc Tuấn',
      phone: '0987654321',
    },
    create: {
      email: artistEmail,
      name: 'Họa sĩ Quốc Tuấn',
      phone: '0987654321',
      role: Role.ARTIST,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
  });
  console.log(`✅ Upserted artist user: ${artistUser.email}`);

  // 2. Seed or Upsert ArtistStudioConfig
  const studioConfig = await prisma.artistStudioConfig.upsert({
    where: { id: 'default-config' },
    update: {},
    create: {
      id: 'default-config',
      artistName: 'Họa sĩ Quốc Tuấn',
      bio: 'Tốt nghiệp Đại học Mỹ thuật Việt Nam với hơn 8 năm kinh nghiệm sáng tác tranh sơn dầu, acrylic và tranh tường nghệ thuật khổ lớn. Các tác phẩm hướng tới sự tĩnh lặng, hài hòa và chiều sâu cảm xúc cho không gian sống hiện đại.',
      experienceYears: 8,
      studioAddress: 'Số 18, Ngõ 45 Phố Tràng Tiền, Hoàn Kiếm, Hà Nội',
      studioLat: 21.0258,
      studioLng: 105.8562,
      zaloUrl: 'https://zalo.me/0987654321',
      messengerUrl: 'https://m.me/artistcommissionstudio',
      hotline: '0987654321',
      depositThreshold: 1500000,
      depositPercent: 40,
      minFramedAreaM2: 0.2,
      minMuralAreaM2: 1.0,
      freeSketchRevisions: 2,
      freeKmRadius: 10,
      feePerKm: 15000,
      simpleMultiplier: 1.0,
      mediumMultiplier: 1.35,
      complexMultiplier: 1.8,
    },
  });
  console.log(`✅ Upserted studio config: ${studioConfig.artistName}`);

  // 3. Seed 4 Materials
  const materialsData = [
    {
      name: 'Sơn dầu cao cấp',
      slug: 'son-dau-cao-cap',
      serviceType: ServiceType.FRAMED_ART,
      basePricePerM2: 3200000,
      description: 'Màu sơn dầu cao cấp nhập khẩu châu Âu vẽ trên toan vải lanh (linen canvas). Lớp màu dày dặn, độ chuyển sắc tinh tế, tạo chiều sâu và độ bền màu trường tồn theo thời gian.',
      durabilityNote: 'Độ bền trên 50 năm trong điều kiện trong nhà tiêu chuẩn, có phủ vec-ni bảo vệ chống tia UV và ẩm mốc.',
      sampleImageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
      isActive: true,
    },
    {
      name: 'Màu Acrylic toan vải lanh',
      slug: 'mau-acrylic-toan-vai',
      serviceType: ServiceType.FRAMED_ART,
      basePricePerM2: 2400000,
      description: 'Màu acrylic chuyên nghiệp khô nhanh, màu sắc tươi sáng, khả năng phủ bề mặt và tạo vân nổi sống động, không mùi hóa chất độc hại.',
      durabilityNote: 'Độ bền 30 - 40 năm, kháng nước và chống ẩm mốc tốt, thích hợp mọi không gian căn hộ hiện đại.',
      sampleImageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80',
      isActive: true,
    },
    {
      name: 'Màu nước Arches Pháp',
      slug: 'mau-nuoc-arches',
      serviceType: ServiceType.FRAMED_ART,
      basePricePerM2: 1800000,
      description: 'Màu nước nghệ thuật trong trẻo vẽ trên giấy 100% cotton Arches 300gsm của Pháp. Tác phẩm mang nét thanh thoát, thơ mộng và nhẹ nhàng.',
      durabilityNote: 'Độ bền trên 25 năm khi đóng khung kính chống UV và giữ nơi khô ráo, tránh ánh nắng trực tiếp.',
      sampleImageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80',
      isActive: true,
    },
    {
      name: 'Sơn tường nghệ thuật chuyên dụng',
      slug: 'son-tuong-chuyen-dung',
      serviceType: ServiceType.WALL_MURAL,
      basePricePerM2: 1200000,
      description: 'Dòng sơn tường nghệ thuật cao cấp phủ nano bảo vệ chuyên dụng cho bề mặt tường trong nhà và ngoài trời. Kháng kiềm, chống bong tróc và bền bỉ trước thời tiết.',
      durabilityNote: 'Độ bền 7 - 10 năm ngoài trời, 15 - 20 năm trong nhà. Lau chùi bụi bẩn dễ dàng bằng khăn ẩm.',
      sampleImageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80',
      isActive: true,
    },
  ];

  const materialMap = new Map<string, string>();

  for (const mat of materialsData) {
    const record = await prisma.material.upsert({
      where: { slug: mat.slug },
      update: {
        name: mat.name,
        serviceType: mat.serviceType,
        basePricePerM2: mat.basePricePerM2,
        description: mat.description,
        durabilityNote: mat.durabilityNote,
        sampleImageUrl: mat.sampleImageUrl,
        isActive: mat.isActive,
      },
      create: mat,
    });
    materialMap.set(mat.slug, record.id);
    console.log(`✅ Upserted material: ${record.name} (${record.slug})`);
  }

  // 4. Seed 6 Portfolio Artwork Templates
  const portfolioData = [
    {
      title: 'Mùa Thu Phố Cổ',
      slug: 'mua-thu-pho-co',
      description: 'Khung cảnh phố cổ Hà Nội trong ánh nắng vàng mật của mùa thu, những mái ngói rêu phong và tán bàng lá đỏ đặc trưng.',
      images: ['https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80'],
      serviceType: ServiceType.FRAMED_ART,
      materialId: materialMap.get('son-dau-cao-cap')!,
      defaultComplexity: Complexity.COMPLEX,
      dimensionsNote: 'Khuyên dùng kích thước từ 80x120cm hoặc 100x150cm để diễn tả trọn vẹn chiều sâu không gian phố cổ.',
      isFeatured: true,
      isAvailable: true,
    },
    {
      title: 'Nhịp Điệu Trầm Tĩnh',
      slug: 'nhip-dieu-tram-tinh',
      description: 'Tranh trừu tượng tối giản với các mảng màu khoáng chất tự nhiên, kết cấu đắp nổi tinh tế mang lại cảm giác thiền định, an yên.',
      images: ['https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80'],
      serviceType: ServiceType.FRAMED_ART,
      materialId: materialMap.get('mau-acrylic-toan-vai')!,
      defaultComplexity: Complexity.MEDIUM,
      dimensionsNote: 'Kích thước vuông 80x80cm hoặc 100x100cm phù hợp phòng khách căn hộ phong cách Wabi-sabi.',
      isFeatured: true,
      isAvailable: true,
    },
    {
      title: 'Sớm Mai Sương Mù Sa Pa',
      slug: 'som-mai-suong-mu-sa-pa',
      description: 'Bức tranh màu nước trong trẻo vẽ những thửa ruộng bậc thang bảng lảng trong sương sớm vùng cao Tây Bắc.',
      images: ['https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80'],
      serviceType: ServiceType.FRAMED_ART,
      materialId: materialMap.get('mau-nuoc-arches')!,
      defaultComplexity: Complexity.SIMPLE,
      dimensionsNote: 'Kích thước 40x60cm hoặc 50x70cm kèm khung bo giấy mỹ thuật.',
      isFeatured: false,
      isAvailable: true,
    },
    {
      title: 'Sen Trắng Tịnh Tâm',
      slug: 'sen-trang-tinh-tam',
      description: 'Tác phẩm khắc họa đóa sen trắng bung nở thanh khiết trên nền bùn tối, từng giọt sương mai đọng trên cánh hoa được diễn tả sống động.',
      images: ['https://images.unsplash.com/photo-1582561424760-0321d75e81fa?auto=format&fit=crop&w=1200&q=80'],
      serviceType: ServiceType.FRAMED_ART,
      materialId: materialMap.get('son-dau-cao-cap')!,
      defaultComplexity: Complexity.MEDIUM,
      dimensionsNote: 'Kích thước 60x90cm hoặc 70x100cm cho phòng trà, phòng thờ hoặc phòng thiền.',
      isFeatured: true,
      isAvailable: true,
    },
    {
      title: 'Khu Rừng Nhiệt Đới Đương Đại',
      slug: 'khu-rung-nhiet-doi-duong-dai',
      description: 'Tranh tường khổ lớn nghệ thuật vẽ các loài thực vật nhiệt đới cách điệu với tone màu xanh olive và đất nung trầm ấm, mở rộng không gian quán cafe & sảnh khách sạn.',
      images: ['https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80'],
      serviceType: ServiceType.WALL_MURAL,
      materialId: materialMap.get('son-tuong-chuyen-dung')!,
      defaultComplexity: Complexity.MEDIUM,
      dimensionsNote: 'Diện tích thi công khuyến nghị từ 8m² trở lên, khảo sát bề mặt trước khi vẽ.',
      isFeatured: true,
      isAvailable: true,
    },
    {
      title: 'Hùng Vĩ Non Nước Ninh Bình',
      slug: 'hung-vi-non-nuoc-ninh-binh',
      description: 'Tranh tường panorama sống động tái hiện núi non trùng điệp và dòng sông uốn lượn tại Tràng An, Ninh Bình.',
      images: ['https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80'],
      serviceType: ServiceType.WALL_MURAL,
      materialId: materialMap.get('son-tuong-chuyen-dung')!,
      defaultComplexity: Complexity.COMPLEX,
      dimensionsNote: 'Thích hợp cho vách tường phòng khách biệt thự, giếng trời hoặc nhà hàng cao cấp từ 12m².',
      isFeatured: false,
      isAvailable: true,
    },
  ];

  for (const artwork of portfolioData) {
    const record = await prisma.artworkTemplate.upsert({
      where: { slug: artwork.slug },
      update: {
        title: artwork.title,
        description: artwork.description,
        images: artwork.images,
        serviceType: artwork.serviceType,
        materialId: artwork.materialId,
        defaultComplexity: artwork.defaultComplexity,
        dimensionsNote: artwork.dimensionsNote,
        isFeatured: artwork.isFeatured,
        isAvailable: artwork.isAvailable,
      },
      create: artwork,
    });
    console.log(`✅ Upserted artwork: ${record.title} (${record.slug})`);
  }

  console.log('🎉 Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
