import {
  ArtistStudioConfigDto,
  ArtworkTemplateDto,
  MaterialDto,
  PricingEstimateRequest,
  CalculatePriceResult,
  ServiceType,
  Complexity,
  FrameOption,
} from '@studio/shared';

const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').trim().replace(/\/+$/, '');
const API_BASE_URL = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;

// Seeded Fallbacks for SSR or when API is building statically
export const FALLBACK_STUDIO_CONFIG: ArtistStudioConfigDto = {
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
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const FALLBACK_MATERIALS: MaterialDto[] = [
  {
    id: 'mat-oil',
    name: 'Sơn dầu cao cấp',
    slug: 'son-dau-cao-cap',
    serviceType: ServiceType.FRAMED_ART,
    basePricePerM2: 3200000,
    description: 'Màu sơn dầu cao cấp nhập khẩu châu Âu vẽ trên toan vải lanh (linen canvas). Lớp màu dày dặn, độ chuyển sắc tinh tế, tạo chiều sâu và độ bền màu trường tồn theo thời gian.',
    durabilityNote: 'Độ bền trên 50 năm trong điều kiện trong nhà tiêu chuẩn, có phủ vec-ni bảo vệ chống tia UV và ẩm mốc.',
    sampleImageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mat-acrylic',
    name: 'Màu Acrylic toan vải lanh',
    slug: 'mau-acrylic-toan-vai',
    serviceType: ServiceType.FRAMED_ART,
    basePricePerM2: 2400000,
    description: 'Màu acrylic chuyên nghiệp khô nhanh, màu sắc tươi sáng, khả năng phủ bề mặt và tạo vân nổi sống động, không mùi hóa chất độc hại.',
    durabilityNote: 'Độ bền 30 - 40 năm, kháng nước và chống ẩm mốc tốt, thích hợp mọi không gian căn hộ hiện đại.',
    sampleImageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mat-watercolor',
    name: 'Màu nước Arches Pháp',
    slug: 'mau-nuoc-arches',
    serviceType: ServiceType.FRAMED_ART,
    basePricePerM2: 1800000,
    description: 'Màu nước nghệ thuật trong trẻo vẽ trên giấy 100% cotton Arches 300gsm của Pháp. Tác phẩm mang nét thanh thoát, thơ mộng và nhẹ nhàng.',
    durabilityNote: 'Độ bền trên 25 năm khi đóng khung kính chống UV và giữ nơi khô ráo, tránh ánh nắng trực tiếp.',
    sampleImageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mat-mural',
    name: 'Sơn tường nghệ thuật chuyên dụng',
    slug: 'son-tuong-chuyen-dung',
    serviceType: ServiceType.WALL_MURAL,
    basePricePerM2: 1200000,
    description: 'Dòng sơn tường nghệ thuật cao cấp phủ nano bảo vệ chuyên dụng cho bề mặt tường trong nhà và ngoài trời. Kháng kiềm, chống bong tróc và bền bỉ trước thời tiết.',
    durabilityNote: 'Độ bền 7 - 10 năm ngoài trời, 15 - 20 năm trong nhà. Lau chùi bụi bẩn dễ dàng bằng khăn ẩm.',
    sampleImageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const FALLBACK_ARTWORKS: ArtworkTemplateDto[] = [
  {
    id: 'art-1',
    title: 'Mùa Thu Phố Cổ',
    slug: 'mua-thu-pho-co',
    description: 'Khung cảnh phố cổ Hà Nội trong ánh nắng vàng mật của mùa thu, những mái ngói rêu phong và tán bàng lá đỏ đặc trưng.',
    images: ['https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80'],
    serviceType: ServiceType.FRAMED_ART,
    materialId: 'mat-oil',
    material: FALLBACK_MATERIALS[0],
    defaultComplexity: Complexity.COMPLEX,
    dimensionsNote: 'Khuyên dùng kích thước từ 80x120cm hoặc 100x150cm để diễn tả trọn vẹn chiều sâu không gian phố cổ.',
    isFeatured: true,
    isAvailable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'art-2',
    title: 'Nhịp Điệu Trầm Tĩnh',
    slug: 'nhip-dieu-tram-tinh',
    description: 'Tranh trừu tượng tối giản với các mảng màu khoáng chất tự nhiên, kết cấu đắp nổi tinh tế mang lại cảm giác thiền định, an yên.',
    images: ['https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80'],
    serviceType: ServiceType.FRAMED_ART,
    materialId: 'mat-acrylic',
    material: FALLBACK_MATERIALS[1],
    defaultComplexity: Complexity.MEDIUM,
    dimensionsNote: 'Kích thước vuông 80x80cm hoặc 100x100cm phù hợp phòng khách căn hộ phong cách Wabi-sabi.',
    isFeatured: true,
    isAvailable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'art-3',
    title: 'Sớm Mai Sương Mù Sa Pa',
    slug: 'som-mai-suong-mu-sa-pa',
    description: 'Bức tranh màu nước trong trẻo vẽ những thửa ruộng bậc thang bảng lảng trong sương sớm vùng cao Tây Bắc.',
    images: ['https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80'],
    serviceType: ServiceType.FRAMED_ART,
    materialId: 'mat-watercolor',
    material: FALLBACK_MATERIALS[2],
    defaultComplexity: Complexity.SIMPLE,
    dimensionsNote: 'Kích thước 40x60cm hoặc 50x70cm kèm khung bo giấy mỹ thuật.',
    isFeatured: false,
    isAvailable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'art-4',
    title: 'Sen Trắng Tịnh Tâm',
    slug: 'sen-trang-tinh-tam',
    description: 'Tác phẩm khắc họa đóa sen trắng bung nở thanh khiết trên nền bùn tối, từng giọt sương mai đọng trên cánh hoa được diễn tả sống động.',
    images: ['https://images.unsplash.com/photo-1582561424760-0321d75e81fa?auto=format&fit=crop&w=1200&q=80'],
    serviceType: ServiceType.FRAMED_ART,
    materialId: 'mat-oil',
    material: FALLBACK_MATERIALS[0],
    defaultComplexity: Complexity.MEDIUM,
    dimensionsNote: 'Kích thước 60x90cm hoặc 70x100cm cho phòng trà, phòng thờ hoặc phòng thiền.',
    isFeatured: true,
    isAvailable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'art-5',
    title: 'Khu Rừng Nhiệt Đới Đương Đại',
    slug: 'khu-rung-nhiet-doi-duong-dai',
    description: 'Tranh tường khổ lớn nghệ thuật vẽ các loài thực vật nhiệt đới cách điệu với tone màu xanh olive và đất nung trầm ấm, mở rộng không gian quán cafe & sảnh khách sạn.',
    images: ['https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80'],
    serviceType: ServiceType.WALL_MURAL,
    materialId: 'mat-mural',
    material: FALLBACK_MATERIALS[3],
    defaultComplexity: Complexity.MEDIUM,
    dimensionsNote: 'Diện tích thi công khuyến nghị từ 8m² trở lên, khảo sát bề mặt trước khi vẽ.',
    isFeatured: true,
    isAvailable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'art-6',
    title: 'Hùng Vĩ Non Nước Ninh Bình',
    slug: 'hung-vi-non-nuoc-ninh-binh',
    description: 'Tranh tường panorama sống động tái hiện núi non trùng điệp và dòng sông uốn lượn tại Tràng An, Ninh Bình.',
    images: ['https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80'],
    serviceType: ServiceType.WALL_MURAL,
    materialId: 'mat-mural',
    material: FALLBACK_MATERIALS[3],
    defaultComplexity: Complexity.COMPLEX,
    dimensionsNote: 'Thích hợp cho vách tường phòng khách biệt thự, giếng trời hoặc nhà hàng cao cấp từ 12m².',
    isFeatured: false,
    isAvailable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export async function fetchStudioConfig(): Promise<ArtistStudioConfigDto> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/studio-config`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Failed to fetch studio config');
    return await res.json();
  } catch {
    return FALLBACK_STUDIO_CONFIG;
  }
}

export async function fetchMaterials(): Promise<MaterialDto[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/materials`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Failed to fetch materials');
    return await res.json();
  } catch {
    return FALLBACK_MATERIALS;
  }
}

export async function fetchArtworks(params?: {
  serviceType?: ServiceType;
  materialSlug?: string;
  isFeatured?: boolean;
}): Promise<{ items: ArtworkTemplateDto[]; total: number }> {
  try {
    const query = new URLSearchParams();
    if (params?.serviceType) query.append('serviceType', params.serviceType);
    if (params?.materialSlug) query.append('materialSlug', params.materialSlug);
    if (typeof params?.isFeatured === 'boolean') query.append('isFeatured', String(params.isFeatured));

    const res = await fetch(`${API_BASE_URL}/public/artworks?${query.toString()}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('Failed to fetch artworks');
    return await res.json();
  } catch {
    let filtered = [...FALLBACK_ARTWORKS];
    if (params?.serviceType) {
      filtered = filtered.filter((a) => a.serviceType === params.serviceType);
    }
    if (params?.materialSlug) {
      filtered = filtered.filter((a) => a.material?.slug === params.materialSlug);
    }
    if (typeof params?.isFeatured === 'boolean') {
      filtered = filtered.filter((a) => a.isFeatured === params.isFeatured);
    }
    return { items: filtered, total: filtered.length };
  }
}

export async function fetchArtworkBySlug(slug: string): Promise<ArtworkTemplateDto | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/artworks/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('Failed to fetch artwork');
    return await res.json();
  } catch {
    const found = FALLBACK_ARTWORKS.find((a) => a.slug === slug);
    return found || null;
  }
}

export async function estimatePricingApi(input: PricingEstimateRequest): Promise<CalculatePriceResult & {
  material: { id: string; name: string; slug: string; serviceType: ServiceType; basePricePerM2: number };
}> {
  const res = await fetch(`${API_BASE_URL}/public/pricing/estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error('Failed to calculate price estimate from server');
  }

  return await res.json();
}

export interface CreateOrderPayload {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceType: ServiceType;
  templateId?: string;
  customReferenceUrls?: string[];
  widthCm: number;
  heightCm: number;
  materialId: string;
  complexity: Complexity;
  frameOption?: FrameOption;
  address: string;
  distanceKm?: number;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  notes?: string;
}

export async function createOrderApi(payload: CreateOrderPayload, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
  }

  return await res.json();
}

export async function fetchOrderByCode(orderCode: string) {
  const res = await fetch(`${API_BASE_URL}/orders/${orderCode}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Không tìm thấy đơn hàng mã ${orderCode}`);
  }

  return await res.json();
}

export async function cancelOrderApi(orderCode: string, reason?: string, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/orders/${orderCode}/cancel`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ reason }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Không thể hủy đơn hàng');
  }

  return await res.json();
}

export async function fetchMyOrdersApi(token: string) {
  const res = await fetch(`${API_BASE_URL}/orders/my-orders`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Không thể tải danh sách đơn hàng của bạn');
  }

  return await res.json();
}

export async function getPresignedUrlApi(filename: string, contentType: string, fileSize: number) {
  const res = await fetch(`${API_BASE_URL}/uploads/presigned-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType, fileSize }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Không thể tạo liên kết upload ảnh');
  }

  return await res.json();
}

export async function uploadFileToStorage(file: File): Promise<string> {
  // 1. Request presigned URL or local storage directive
  const presigned = await getPresignedUrlApi(file.name, file.type, file.size);

  // If local disk storage mode is active
  if (presigned.isLocal || presigned.uploadUrl?.includes('/uploads/local')) {
    const formData = new FormData();
    formData.append('file', file);
    const localUploadUrl = presigned.uploadUrl.startsWith('http')
      ? presigned.uploadUrl
      : `${API_BASE_URL}/uploads/local`;

    const uploadRes = await fetch(localUploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      throw new Error(err.message || 'Không thể tải ảnh lên máy chủ cục bộ');
    }

    const data = await uploadRes.json();
    return data.fileUrl;
  }

  // 2. Direct upload to Cloudflare R2 / S3
  const uploadRes = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error('Upload ảnh lên máy chủ lưu trữ thất bại');
  }

  return presigned.fileUrl;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export async function registerApi(payload: RegisterPayload) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Đăng ký tài khoản thất bại. Vui lòng thử lại.');
  }

  return await res.json();
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function loginApi(payload: LoginPayload) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
  }

  return await res.json();
}

