'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import {
  ArtworkTemplateDto,
  CalculatePriceResult,
  Complexity,
  FrameOption,
  MaterialDto,
  ServiceType,
  calculateCommissionPrice,
} from '@studio/shared';
import {
  Ruler,
  Palette,
  Truck,
  CheckCircle2,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  UploadCloud,
  Sparkles,
  Loader2,
  Trash2,
  X,
  CreditCard,
  Phone,
  Mail,
  User,
  MapPin,
  FileText,
} from 'lucide-react';
import { createOrderApi, uploadFileToStorage } from '@/lib/api';

interface CommissionConfiguratorProps {
  materials: MaterialDto[];
  artworks: ArtworkTemplateDto[];
  studioConfig: {
    depositThreshold: number;
    depositPercent: number;
    minFramedAreaM2: number;
    minMuralAreaM2: number;
    freeSketchRevisions: number;
    freeKmRadius: number;
    feePerKm: number;
    simpleMultiplier: number;
    mediumMultiplier: number;
    complexMultiplier: number;
    hotline: string;
  };
}

export function CommissionConfigurator({
  materials,
  artworks,
  studioConfig,
}: CommissionConfiguratorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial params
  const initialTemplateSlug = searchParams.get('template');
  const initialServiceType = (searchParams.get('serviceType') as ServiceType) || ServiceType.FRAMED_ART;
  const initialMaterialId = searchParams.get('materialId');
  const initialCustom = searchParams.get('custom') === 'true';

  // Configurator state
  const [serviceType, setServiceType] = useState<ServiceType>(initialServiceType);
  const [isCustomReference, setIsCustomReference] = useState<boolean>(
    initialCustom || !initialTemplateSlug
  );
  const [selectedTemplateSlug, setSelectedTemplateSlug] = useState<string>(
    initialTemplateSlug || ''
  );
  
  // Custom uploaded images
  const [customReferenceUrls, setCustomReferenceUrls] = useState<string[]>([]);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');

  // Dimensions
  const [widthCm, setWidthCm] = useState<number>(initialServiceType === ServiceType.WALL_MURAL ? 300 : 80);
  const [heightCm, setHeightCm] = useState<number>(initialServiceType === ServiceType.WALL_MURAL ? 240 : 120);

  // Material
  const availableMaterials = useMemo(() => {
    return materials.filter((m) => m.serviceType === serviceType);
  }, [materials, serviceType]);

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(() => {
    if (initialMaterialId && availableMaterials.some((m) => m.id === initialMaterialId)) {
      return initialMaterialId;
    }
    return availableMaterials[0]?.id || '';
  });

  // Complexity & Frame & Logistics
  const [complexity, setComplexity] = useState<Complexity>(Complexity.MEDIUM);
  const [frameOption, setFrameOption] = useState<FrameOption>(FrameOption.WOOD_MINIMAL);
  const [distanceKm, setDistanceKm] = useState<number>(10);

  // Order Placement Modal state
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');

  // Whenever serviceType changes, update default material and dimensions
  useEffect(() => {
    if (availableMaterials.length > 0) {
      if (!availableMaterials.some((m) => m.id === selectedMaterialId)) {
        setSelectedMaterialId(availableMaterials[0].id);
      }
    }
    if (serviceType === ServiceType.WALL_MURAL) {
      setWidthCm((prev) => (prev < 150 ? 300 : prev));
      setHeightCm((prev) => (prev < 150 ? 240 : prev));
    } else {
      setWidthCm((prev) => (prev > 300 ? 80 : prev));
      setHeightCm((prev) => (prev > 300 ? 120 : prev));
    }
  }, [serviceType, availableMaterials, selectedMaterialId]);

  // If a template is picked, match its material and complexity
  useEffect(() => {
    if (selectedTemplateSlug) {
      const found = artworks.find((a) => a.slug === selectedTemplateSlug);
      if (found) {
        setServiceType(found.serviceType);
        setSelectedMaterialId(found.materialId);
        setComplexity(found.defaultComplexity);
        setIsCustomReference(false);
      }
    }
  }, [selectedTemplateSlug, artworks]);

  // Prefill user details from auth session if available
  useEffect(() => {
    if (session?.user) {
      if (session.user.name && !customerName) setCustomerName(session.user.name);
      if (session.user.email && !customerEmail) setCustomerEmail(session.user.email);
    }
  }, [session, customerName, customerEmail]);

  // Save draft configuration to sessionStorage so user never loses options across login/register
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const draft = {
          serviceType,
          isCustomReference,
          selectedTemplateSlug,
          customReferenceUrls,
          widthCm,
          heightCm,
          selectedMaterialId,
          complexity,
          frameOption,
          distanceKm,
        };
        sessionStorage.setItem('commission_draft', JSON.stringify(draft));
      } catch {
        // ignore storage errors
      }
    }
  }, [
    serviceType,
    isCustomReference,
    selectedTemplateSlug,
    customReferenceUrls,
    widthCm,
    heightCm,
    selectedMaterialId,
    complexity,
    frameOption,
    distanceKm,
  ]);

  // Restore draft configuration on mount if no explicit url params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasUrlParams =
        searchParams.get('template') || searchParams.get('serviceType') || searchParams.get('materialId');
      if (!hasUrlParams) {
        try {
          const raw = sessionStorage.getItem('commission_draft');
          if (raw) {
            const draft = JSON.parse(raw);
            if (draft.serviceType) setServiceType(draft.serviceType);
            if (typeof draft.isCustomReference === 'boolean') setIsCustomReference(draft.isCustomReference);
            if (draft.selectedTemplateSlug) setSelectedTemplateSlug(draft.selectedTemplateSlug);
            if (Array.isArray(draft.customReferenceUrls) && draft.customReferenceUrls.length > 0) {
              setCustomReferenceUrls(draft.customReferenceUrls);
            }
            if (draft.widthCm) setWidthCm(draft.widthCm);
            if (draft.heightCm) setHeightCm(draft.heightCm);
            if (draft.selectedMaterialId) setSelectedMaterialId(draft.selectedMaterialId);
            if (draft.complexity) setComplexity(draft.complexity);
            if (draft.frameOption) setFrameOption(draft.frameOption);
            if (typeof draft.distanceKm === 'number') setDistanceKm(draft.distanceKm);
          }
        } catch {
          // ignore parsing errors
        }
      }
    }
  }, [searchParams]);

  // Selected material object
  const currentMaterial = useMemo(() => {
    return materials.find((m) => m.id === selectedMaterialId) || availableMaterials[0];
  }, [materials, selectedMaterialId, availableMaterials]);

  // Real-time Pricing calculation
  const pricing: CalculatePriceResult = useMemo(() => {
    if (!currentMaterial) {
      return {
        billableAreaM2: 0,
        rawAreaM2: 0,
        materialRate: 0,
        complexityMultiplier: 1,
        artworkBasePrice: 0,
        framePrice: 0,
        shippingOrTravelFee: 0,
        siteSurcharge: 0,
        totalAmount: 0,
        requireDeposit: false,
        depositAmount: 0,
        remainingAmount: 0,
      };
    }

    return calculateCommissionPrice({
      serviceType,
      widthCm: Number(widthCm) || 10,
      heightCm: Number(heightCm) || 10,
      materialBasePricePerM2: currentMaterial.basePricePerM2,
      complexity,
      frameOption: serviceType === ServiceType.FRAMED_ART ? frameOption : FrameOption.NONE,
      distanceKm: Number(distanceKm) || 0,
      isCustomReference: isCustomReference || customReferenceUrls.length > 0,
      config: {
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
      },
    });
  }, [
    serviceType,
    widthCm,
    heightCm,
    currentMaterial,
    complexity,
    frameOption,
    distanceKm,
    isCustomReference,
    customReferenceUrls,
    studioConfig,
  ]);

  // Direct File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Dung lượng tệp vượt quá giới hạn 15MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Định dạng không hợp lệ. Vui lòng tải ảnh JPG, PNG hoặc WEBP.');
      return;
    }

    setUploadError('');
    setIsUploading(true);

    try {
      const uploadedUrl = await uploadFileToStorage(file);
      setCustomReferenceUrls((prev) => [...prev, uploadedUrl]);
      setIsCustomReference(true);
    } catch (err: any) {
      setUploadError(err.message || 'Tải ảnh lên thất bại. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddUrl = () => {
    if (!customUrlInput.trim()) return;
    setCustomReferenceUrls((prev) => [...prev, customUrlInput.trim()]);
    setCustomUrlInput('');
    setIsCustomReference(true);
  };

  const handleRemoveImage = (index: number) => {
    setCustomReferenceUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Order Creation
  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !customerAddress) {
      setSubmitError('Vui lòng điền đầy đủ Họ tên, Email và Địa chỉ.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const selectedTemplate = !isCustomReference && selectedTemplateSlug
        ? artworks.find((a) => a.slug === selectedTemplateSlug)
        : null;

      const order = await createOrderApi(
        {
          customerName,
          customerEmail,
          customerPhone: customerPhone || undefined,
          serviceType,
          templateId: selectedTemplate?.id,
          customReferenceUrls: customReferenceUrls.length > 0 ? customReferenceUrls : undefined,
          widthCm,
          heightCm,
          materialId: currentMaterial.id,
          complexity,
          frameOption: serviceType === ServiceType.FRAMED_ART ? frameOption : undefined,
          address: customerAddress,
          distanceKm,
          notes: orderNotes || undefined,
        },
        session?.user?.backendToken
      );

      // Clear draft on successful order placement
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('commission_draft');
        } catch {
          // ignore
        }
      }

      // Redirect to Order Detail Room with dynamic VietQR
      router.push(`/orders/${order.orderCode}`);
    } catch (err: any) {
      setSubmitError(err.message || 'Lỗi khi tạo đơn hàng. Vui lòng thử lại.');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Interactive Form Controls */}
        <div className="lg:col-span-7 space-y-8">
          {/* Step 1: Service Type Selection */}
          <div className="p-6 border border-hairline bg-canvas space-y-4">
            <span className="text-[10px] uppercase tracking-editorial text-artisan font-medium block">
              Bước 1: Chọn Loại Hình Dịch Vụ
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setServiceType(ServiceType.FRAMED_ART)}
                className={`p-5 text-left border transition-all ${
                  serviceType === ServiceType.FRAMED_ART
                    ? 'border-brand bg-brand/5 ring-1 ring-brand'
                    : 'border-hairline bg-canvas-surface hover:bg-zinc-200/50'
                }`}
              >
                <div className="font-serif text-lg text-charcoal font-medium">
                  Tranh Đóng Khung Treo Tường
                </div>
                <p className="text-xs text-charcoal-muted pt-1 font-light leading-relaxed">
                  Vẽ toan lanh (canvas) hoặc giấy Arches, lồng khung kính cao cấp và giao tận nơi toàn quốc.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setServiceType(ServiceType.WALL_MURAL)}
                className={`p-5 text-left border transition-all ${
                  serviceType === ServiceType.WALL_MURAL
                    ? 'border-brand bg-brand/5 ring-1 ring-brand'
                    : 'border-hairline bg-canvas-surface hover:bg-zinc-200/50'
                }`}
              >
                <div className="font-serif text-lg text-charcoal font-medium">
                  Vẽ Bích Họa Tường Khổ Lớn
                </div>
                <p className="text-xs text-charcoal-muted pt-1 font-light leading-relaxed">
                  Họa sĩ đến tận công trình khảo sát, xử lý bề mặt và vẽ trực tiếp với sơn tường chuyên dụng.
                </p>
              </button>
            </div>
          </div>

          {/* Step 2: Artwork Source (Catalog vs Direct Upload / Custom Reference) */}
          <div className="p-6 border border-hairline bg-canvas space-y-4">
            <span className="text-[10px] uppercase tracking-editorial text-artisan font-medium block">
              Bước 2: Chọn Mẫu Hoặc Tải Ảnh Mẫu Riêng Lên Cloud
            </span>
            <div className="flex gap-4 border-b border-hairline pb-4">
              <button
                type="button"
                onClick={() => setIsCustomReference(false)}
                className={`text-xs uppercase tracking-wider pb-2 border-b-2 font-medium transition-all ${
                  !isCustomReference
                    ? 'border-brand text-charcoal'
                    : 'border-transparent text-charcoal-muted hover:text-charcoal'
                }`}
              >
                Chọn từ Bộ Sưu Tập Có Sẵn
              </button>
              <button
                type="button"
                onClick={() => setIsCustomReference(true)}
                className={`text-xs uppercase tracking-wider pb-2 border-b-2 font-medium transition-all ${
                  isCustomReference
                    ? 'border-brand text-charcoal'
                    : 'border-transparent text-charcoal-muted hover:text-charcoal'
                }`}
              >
                Tải Ảnh Riêng (Presigned Cloud)
              </button>
            </div>

            {!isCustomReference ? (
              <div className="space-y-3">
                <label className="text-xs text-charcoal-muted block">
                  Chọn tác phẩm muốn đặt vẽ phỏng theo:
                </label>
                <select
                  value={selectedTemplateSlug}
                  onChange={(e) => setSelectedTemplateSlug(e.target.value)}
                  className="w-full text-xs bg-canvas-surface border border-hairline px-3 py-2.5 text-charcoal focus:outline-none focus:border-brand"
                >
                  <option value="">-- Chọn bức tranh trong bộ sưu tập --</option>
                  {artworks
                    .filter((a) => a.serviceType === serviceType)
                    .map((art) => (
                      <option key={art.id} value={art.slug}>
                        {art.title} ({art.material?.name || 'Sơn cao cấp'})
                      </option>
                    ))}
                </select>

                {selectedTemplateSlug && (
                  <div className="flex items-center gap-3 p-3 bg-canvas-surface border border-hairline">
                    {artworks.find((a) => a.slug === selectedTemplateSlug)?.images[0] && (
                      <div className="relative w-12 h-12 shrink-0 overflow-hidden border border-hairline">
                        <Image
                          src={artworks.find((a) => a.slug === selectedTemplateSlug)!.images[0]}
                          alt="Selected template preview"
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="text-xs">
                      <span className="font-serif font-medium text-charcoal block">
                        {artworks.find((a) => a.slug === selectedTemplateSlug)?.title}
                      </span>
                      <span className="text-[11px] text-charcoal-muted block">
                        Khuyên dùng: {artworks.find((a) => a.slug === selectedTemplateSlug)?.dimensionsNote || 'Theo diện tích tường'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 p-5 bg-canvas-surface border border-hairline">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-charcoal flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-brand" />
                    <span>Tải ảnh mẫu hoặc ảnh chụp mảng tường thực tế (Tối đa 15MB):</span>
                  </span>
                </div>

                {/* Direct File Picker */}
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="cloud-file-upload"
                  />
                  <label
                    htmlFor="cloud-file-upload"
                    className={`cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-dashed border-zinc-300 hover:border-brand rounded text-xs font-medium text-zinc-700 transition-colors w-full sm:w-auto shadow-sm ${
                      isUploading ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-brand" />
                        <span>Đang tải lên lưu trữ đám mây...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4 text-brand" />
                        <span>Chọn ảnh từ thiết bị (JPG, PNG, WEBP)</span>
                      </>
                    )}
                  </label>

                  <span className="text-xs text-zinc-400">hoặc</span>

                  {/* Fallback URL Input */}
                  <div className="flex gap-2 w-full sm:w-auto flex-1">
                    <input
                      type="url"
                      placeholder="Dán link ảnh online (Google Drive, Pinterest...)"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      className="w-full text-xs bg-white border border-hairline px-3 py-2 text-charcoal focus:outline-none focus:border-brand"
                    />
                    <button
                      type="button"
                      onClick={handleAddUrl}
                      className="px-3 py-2 bg-zinc-800 text-white text-xs hover:bg-zinc-700 transition-colors shrink-0"
                    >
                      Thêm
                    </button>
                  </div>
                </div>

                {uploadError && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
                    {uploadError}
                  </p>
                )}

                {/* Uploaded Images Preview List */}
                {customReferenceUrls.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider block mb-2">
                      Ảnh mẫu đã tải lên ({customReferenceUrls.length}):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {customReferenceUrls.map((url, idx) => (
                        <div key={idx} className="relative group rounded border border-zinc-200 overflow-hidden bg-white shadow-sm aspect-video">
                          <Image
                            src={url}
                            alt={`Reference upload ${idx + 1}`}
                            fill
                            sizes="120px"
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded transition-colors"
                            title="Xóa ảnh này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-charcoal-muted font-light leading-relaxed">
                  * Với ảnh mẫu riêng, hệ thống tự động đưa đơn vào trạng thái <strong>Chờ báo giá (PENDING_QUOTE)</strong>. Họa sĩ sẽ thẩm định độ khó nét cọ và liên hệ xác nhận phác thảo trước khi mở cổng đặt cọc.
                </p>
              </div>
            )}
          </div>

          {/* Step 3: Dimensions in Centimeters */}
          <div className="p-6 border border-hairline bg-canvas space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-editorial text-artisan font-medium">
                Bước 3: Nhập Kích Thước Tường / Khung Tranh (cm)
              </span>
              <span className="text-xs text-charcoal-muted">
                Quy đổi: <strong>{pricing.billableAreaM2} m²</strong> (Diện tích tính phí)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-charcoal-muted flex items-center justify-between">
                  <span>Chiều rộng (cm):</span>
                  <span className="font-medium text-charcoal">{widthCm} cm</span>
                </label>
                <input
                  type="number"
                  min={10}
                  max={3000}
                  value={widthCm}
                  onChange={(e) => setWidthCm(Math.max(10, parseInt(e.target.value) || 10))}
                  className="w-full text-sm bg-canvas-surface border border-hairline px-3 py-2 text-charcoal focus:outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-charcoal-muted flex items-center justify-between">
                  <span>Chiều cao (cm):</span>
                  <span className="font-medium text-charcoal">{heightCm} cm</span>
                </label>
                <input
                  type="number"
                  min={10}
                  max={3000}
                  value={heightCm}
                  onChange={(e) => setHeightCm(Math.max(10, parseInt(e.target.value) || 10))}
                  className="w-full text-sm bg-canvas-surface border border-hairline px-3 py-2 text-charcoal focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            {/* Area comparison note */}
            <div className="p-3 bg-canvas-surface border border-hairline text-[11px] text-charcoal-muted flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-artisan mt-0.5 shrink-0" />
              <span>
                Diện tích thực tế: {pricing.rawAreaM2} m². Diện tích tính phí tối thiểu:{' '}
                {serviceType === ServiceType.FRAMED_ART
                  ? `${studioConfig.minFramedAreaM2} m² (cho tranh đóng khung)`
                  : `${studioConfig.minMuralAreaM2} m² (cho tranh tường)`}.
              </span>
            </div>
          </div>

          {/* Step 4: Material Selection */}
          <div className="p-6 border border-hairline bg-canvas space-y-4">
            <span className="text-[10px] uppercase tracking-editorial text-artisan font-medium block">
              Bước 4: Chọn Chất Liệu Sơn & Bề Mặt
            </span>

            <div className="grid grid-cols-1 gap-3">
              {availableMaterials.map((mat) => {
                const isSelected = mat.id === selectedMaterialId;
                return (
                  <div
                    key={mat.id}
                    onClick={() => setSelectedMaterialId(mat.id)}
                    className={`p-4 border cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-brand bg-brand/5 ring-1 ring-brand'
                        : 'border-hairline bg-canvas-surface hover:bg-zinc-200/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-base text-charcoal font-medium">
                          {mat.name}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] uppercase tracking-wider bg-brand text-white px-2 py-0.5 font-sans">
                            Đang Chọn
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-charcoal-muted font-light max-w-xl">
                        {mat.description}
                      </p>
                      {mat.durabilityNote && (
                        <p className="text-[11px] text-artisan font-light italic">
                          * {mat.durabilityNote}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-charcoal-muted block">Đơn giá cơ sở:</span>
                      <span className="font-mono text-sm font-medium text-charcoal">
                        {mat.basePricePerM2.toLocaleString('vi-VN')} đ/m²
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 5: Complexity Selection */}
          <div className="p-6 border border-hairline bg-canvas space-y-4">
            <span className="text-[10px] uppercase tracking-editorial text-artisan font-medium block">
              Bước 5: Chọn Độ Khó & Chi Tiết Nét Vẽ
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: Complexity.SIMPLE,
                  name: 'Đơn giản (Simple)',
                  mult: studioConfig.simpleMultiplier,
                  desc: 'Mảng màu tối giản, phong cảnh tĩnh, ít chi tiết nhân vật.',
                },
                {
                  id: Complexity.MEDIUM,
                  name: 'Tiêu chuẩn (Medium)',
                  mult: studioConfig.mediumMultiplier,
                  desc: 'Phố cổ, tĩnh vật, chân dung tả thực vừa, chuyển sắc tự nhiên.',
                },
                {
                  id: Complexity.COMPLEX,
                  name: 'Tinh xảo (Complex)',
                  mult: studioConfig.complexMultiplier,
                  desc: 'Nhiều lớp tả thực chi tiết cao, chân dung phục cổ, vân nổi cầu kỳ.',
                },
              ].map((c) => {
                const isSelected = complexity === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setComplexity(c.id)}
                    className={`p-4 text-left border transition-all ${
                      isSelected
                        ? 'border-brand bg-brand/5 ring-1 ring-brand'
                        : 'border-hairline bg-canvas-surface hover:bg-zinc-200/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-sm font-medium text-charcoal">
                        {c.name}
                      </span>
                      <span className="font-mono text-xs font-semibold text-artisan">
                        ×{c.mult}
                      </span>
                    </div>
                    <p className="text-[11px] text-charcoal-muted pt-2 font-light leading-relaxed">
                      {c.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 6: Frame Option (Framed Art only) */}
          {serviceType === ServiceType.FRAMED_ART && (
            <div className="p-6 border border-hairline bg-canvas space-y-4">
              <span className="text-[10px] uppercase tracking-editorial text-artisan font-medium block">
                Bước 6: Chọn Khung Tranh Hoàn Thiện
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: FrameOption.NONE, name: 'Không khung (Chỉ căng toan)', desc: 'Để mộc toan lanh hiện đại' },
                  { id: FrameOption.WOOD_MINIMAL, name: 'Khung gỗ sồi tự nhiên', desc: 'Viền 2cm phong cách Bắc Âu tối giản' },
                  { id: FrameOption.WOOD_ORNATE, name: 'Khung gỗ hoa văn cổ điển', desc: 'Mạ thếp vàng/nâu trầm sang trọng' },
                  { id: FrameOption.ALUMINUM_BLACK, name: 'Khung nhôm Anode đen', desc: 'Hiện đại, sắc nét, bền bỉ' },
                  { id: FrameOption.ALUMINUM_GOLD, name: 'Khung nhôm Anode vàng kim', desc: 'Ánh kim tinh tế, chống oxy hóa' },
                ].map((f) => {
                  const isSelected = frameOption === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFrameOption(f.id)}
                      className={`p-4 text-left border transition-all ${
                        isSelected
                          ? 'border-brand bg-brand/5 ring-1 ring-brand'
                          : 'border-hairline bg-canvas-surface hover:bg-zinc-200/50'
                      }`}
                    >
                      <div className="font-serif text-sm font-medium text-charcoal">
                        {f.name}
                      </div>
                      <p className="text-[11px] text-charcoal-muted pt-1 font-light">
                        {f.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 7: Distance / Location */}
          <div className="p-6 border border-hairline bg-canvas space-y-4">
            <span className="text-[10px] uppercase tracking-editorial text-artisan font-medium block">
              {serviceType === ServiceType.FRAMED_ART
                ? 'Bước 7: Khoảng Cách Giao Tranh Từ Studio'
                : 'Bước 6: Khoảng Cách Thi Công Từ Studio'}
            </span>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-charcoal-muted">
                <span>Khoảng cách ước tính từ Studio (Hà Nội):</span>
                <span className="font-medium font-mono text-charcoal">{distanceKm} km</span>
              </div>
              <input
                type="range"
                min={0}
                max={300}
                step={5}
                value={distanceKm}
                onChange={(e) => setDistanceKm(parseInt(e.target.value) || 0)}
                className="w-full accent-brand"
              />
              <div className="flex justify-between text-[11px] text-charcoal-muted">
                <span>Nội thành (&le; 10km: Miễn phí)</span>
                <span>Ngoại thành / Tỉnh xa (15.000 đ/km)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Breakdown & Checkout Trigger */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
          <div className="p-8 border border-hairline bg-charcoal text-white space-y-6 shadow-xl">
            <div className="border-b border-zinc-700 pb-4 space-y-1">
              <span className="text-[10px] uppercase tracking-editorial text-artisan font-medium block">
                Bảng Bóc Tách Dự Toán Minh Bạch
              </span>
              <h3 className="font-serif text-3xl font-normal text-white">
                Báo Giá Chi Tiết
              </h3>
            </div>

            {/* Breakdown Items */}
            <div className="space-y-3.5 text-xs font-light text-zinc-300">
              <div className="flex justify-between">
                <span>Diện tích tính phí:</span>
                <span className="font-sans font-semibold tabular-nums text-white">
                  {pricing.billableAreaM2} m² ({widthCm} × {heightCm} cm)
                </span>
              </div>

              <div className="flex justify-between">
                <span>Chất liệu & Độ khó:</span>
                <span className="font-sans text-white">
                  {currentMaterial?.name || 'Sơn dầu'} (×{pricing.complexityMultiplier})
                </span>
              </div>

              <div className="flex justify-between">
                <span>Tiền vẽ tranh gốc:</span>
                <span className="font-sans font-bold tabular-nums text-white">
                  {pricing.artworkBasePrice.toLocaleString('vi-VN')} đ
                </span>
              </div>

              {serviceType === ServiceType.FRAMED_ART ? (
                <div className="flex justify-between">
                  <span>Tiền đóng khung hoàn thiện:</span>
                  <span className="font-sans font-bold tabular-nums text-white">
                    {pricing.framePrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              ) : (
                pricing.siteSurcharge > 0 && (
                  <div className="flex justify-between text-amber-300">
                    <span>Phụ phí giàn giáo ({heightCm}cm):</span>
                    <span className="font-sans font-bold tabular-nums">
                      {pricing.siteSurcharge.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )
              )}

              <div className="flex justify-between">
                <span>
                  {serviceType === ServiceType.FRAMED_ART ? 'Phí giao hàng & đóng hòm gỗ:' : 'Phí di chuyển thi công:'}
                </span>
                <span className="font-sans font-bold tabular-nums text-white">
                  {pricing.shippingOrTravelFee.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            {/* Total Highlight */}
            <div className="border-t border-zinc-700 pt-5 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-wider text-zinc-400">
                  Tổng Chi Phí Dự Kiến:
                </span>
                <span className="font-sans text-3xl sm:text-4xl text-white font-bold tabular-nums tracking-tight">
                  {pricing.totalAmount.toLocaleString('vi-VN')} <span className="text-sm font-sans font-normal">VNĐ</span>
                </span>
              </div>

              {/* Mandatory Deposit Section */}
              {pricing.requireDeposit ? (
                <div className="p-4 bg-brand/30 border border-brand/50 space-y-1.5 mt-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-brand-light font-medium flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-artisan" />
                      <span>Khoản Cọc Bắt Buộc ({studioConfig.depositPercent}%):</span>
                    </span>
                    <span className="font-sans font-bold text-white text-sm tabular-nums tracking-tight">
                      {pricing.depositAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-zinc-400 pt-1">
                    <span>Số tiền thanh toán khi nhận tranh/nghiệm thu:</span>
                    <span className="font-sans font-semibold tabular-nums text-zinc-300">
                      {pricing.remainingAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-zinc-400 italic pt-1">
                  * Đơn hàng dưới {studioConfig.depositThreshold.toLocaleString('vi-VN')} đ: Bạn có thể chọn thanh toán 100% khi nhận tranh.
                </p>
              )}
            </div>

            {/* Action Trigger Buttons */}
            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={() => setShowOrderModal(true)}
                className="w-full py-4 bg-[#B45309] hover:bg-[#92400e] text-white text-xs uppercase tracking-editorial font-semibold flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <span>Xác Nhận & Đặt Vẽ Tranh</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={`https://zalo.me/${studioConfig.hotline}?text=${encodeURIComponent(
                  `Xin chào Họa sĩ Quốc Tuấn, tôi vừa cấu hình đơn đặt vẽ trên website:\n- Dịch vụ: ${serviceType === 'FRAMED_ART' ? 'Tranh đóng khung' : 'Tranh tường'}\n- Kích thước: ${widthCm}x${heightCm}cm (${pricing.billableAreaM2}m2)\n- Chất liệu: ${currentMaterial?.name}\n- Độ khó: ${complexity}\n- Dự toán: ${pricing.totalAmount.toLocaleString('vi-VN')} VNĐ\nNhờ anh xem xét và tư vấn thêm phác thảo giúp tôi.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-brand hover:bg-brand-hover text-white text-xs uppercase tracking-editorial font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <span>Tư Vấn Qua Zalo Họa Sĩ</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <p className="text-[11px] text-center text-zinc-400 font-light">
                Hotline trực tiếp: <strong className="text-white">{studioConfig.hotline}</strong>
              </p>
            </div>

            {/* Guarantee Badges */}
            <div className="border-t border-zinc-800 pt-4 space-y-2 text-[11px] text-zinc-400 font-light">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-artisan shrink-0" />
                <span>Duyệt phác thảo {studioConfig.freeSketchRevisions} vòng miễn phí trước khi vẽ</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-artisan shrink-0" />
                <span>Thanh toán VietQR SePay minh bạch, tự động khớp lệnh</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-artisan shrink-0" />
                <span>Tiền cọc không hoàn lại khi đã bắt đầu mua toan/lên màu</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Placement Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FAF9F6] text-[#18181B] max-w-xl w-full rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-white">
              <div>
                <h3 className="font-serif text-xl font-medium text-zinc-900">
                  Thông Tin Đặt Vẽ Tranh
                </h3>
                <p className="text-[11px] text-zinc-500 font-sans uppercase tracking-wider">
                  Mã đơn hàng & mã VietQR SePay sẽ được khởi tạo tự động
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Form */}
            <form onSubmit={handleConfirmOrder} className="p-6 overflow-y-auto space-y-5 text-xs">
              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                  {submitError}
                </div>
              )}

              {/* Order Summary Recap Card */}
              <div className="p-4 bg-[#F4F4F5] rounded-xl border border-zinc-200/80 space-y-2">
                <div className="flex justify-between font-semibold text-zinc-800">
                  <span>{serviceType === ServiceType.FRAMED_ART ? 'Tranh đóng khung' : 'Bích họa tường'} ({widthCm}x{heightCm}cm)</span>
                  <span className="font-sans font-bold tabular-nums text-zinc-900">{pricing.totalAmount.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="text-[11px] text-zinc-500">
                  Chất liệu: {currentMaterial?.name} &bull; Độ khó: {complexity}
                </div>
                {pricing.requireDeposit && (
                  <div className="pt-1 border-t border-zinc-200 flex justify-between text-amber-700 font-semibold text-xs">
                    <span>Khoản cọc kích hoạt đơn ({studioConfig.depositPercent}%):</span>
                    <span className="font-sans font-bold tabular-nums">{pricing.depositAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
              </div>

              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Họ và tên của bạn <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E5C6E]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Email nhận thông báo <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="email@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E5C6E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Số điện thoại / Zalo</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="0987654321"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E5C6E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Địa chỉ nhận tranh / Địa chỉ công trình <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E5C6E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Ghi chú thêm cho họa sĩ (Yêu cầu phong cách, bố cục...)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ví dụ: Mong muốn tông màu ấm hơn một chút để hợp màu rèm cửa phòng khách..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E5C6E]"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2 border-t border-zinc-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2.5 text-xs text-zinc-600 hover:text-zinc-900 font-medium"
                >
                  Quay lại
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#3E5C6E] hover:bg-[#2F4858] text-white rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tạo đơn...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Tạo Đơn Hàng & Nhận Mã VietQR</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
