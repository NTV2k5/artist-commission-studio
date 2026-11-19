'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
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
} from 'lucide-react';

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
  const searchParams = useSearchParams();

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
  const [customReferenceUrl, setCustomReferenceUrl] = useState<string>('');

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

  // Complexity & Frame & Logistics
  const [complexity, setComplexity] = useState<Complexity>(Complexity.MEDIUM);
  const [frameOption, setFrameOption] = useState<FrameOption>(FrameOption.WOOD_MINIMAL);
  const [distanceKm, setDistanceKm] = useState<number>(10);

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
      isCustomReference,
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
    studioConfig,
  ]);

  return (
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

        {/* Step 2: Artwork Source (Catalog vs Custom Reference) */}
        <div className="p-6 border border-hairline bg-canvas space-y-4">
          <span className="text-[10px] uppercase tracking-editorial text-artisan font-medium block">
            Bước 2: Chọn Mẫu Hoặc Gửi Ảnh Mẫu Riêng
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
              Gửi Ảnh Mẫu Riêng / Tự Do
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
            <div className="space-y-3 p-4 bg-canvas-surface border border-hairline border-dashed">
              <div className="flex items-center gap-2 text-xs font-medium text-charcoal">
                <UploadCloud className="w-4 h-4 text-brand" />
                <span>Gửi đường dẫn ảnh mẫu (Google Drive / Pinterest / Imgur):</span>
              </div>
              <input
                type="url"
                placeholder="https://example.com/my-reference-art.jpg"
                value={customReferenceUrl}
                onChange={(e) => setCustomReferenceUrl(e.target.value)}
                className="w-full text-xs bg-canvas border border-hairline px-3 py-2 text-charcoal focus:outline-none focus:border-brand"
              />
              <p className="text-[11px] text-charcoal-muted font-light leading-relaxed">
                * Với ảnh mẫu riêng, hệ thống đưa ra mức giá ước tính sơ bộ. Sau khi gửi đơn, họa sĩ sẽ liên hệ trực tiếp để thẩm định độ khó và thống nhất phác thảo trước khi thu cọc.
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

          <div className="text-[11px] text-charcoal-muted flex items-center gap-1.5 pt-1">
            <Info className="w-3.5 h-3.5 text-brand shrink-0" />
            <span>
              {serviceType === ServiceType.FRAMED_ART
                ? `Mức diện tích tính phí tối thiểu cho tranh đóng khung: ${studioConfig.minFramedAreaM2} m² (20x100cm hoặc 40x50cm).`
                : `Mức diện tích tính phí tối thiểu cho tranh tường: ${studioConfig.minMuralAreaM2} m² (100x100cm).`}
            </span>
          </div>
        </div>

        {/* Step 4: Material Selection */}
        <div className="p-6 border border-hairline bg-canvas space-y-4">
          <span className="text-[10px] uppercase tracking-editorial text-artisan font-medium block">
            Bước 4: Chọn Chất Liệu Vẽ
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availableMaterials.map((mat) => (
              <button
                key={mat.id}
                type="button"
                onClick={() => setSelectedMaterialId(mat.id)}
                className={`p-4 text-left border transition-all ${
                  selectedMaterialId === mat.id
                    ? 'border-brand bg-brand/5 ring-1 ring-brand'
                    : 'border-hairline bg-canvas-surface hover:bg-zinc-200/50'
                }`}
              >
                <div className="flex items-center justify-between pb-1">
                  <span className="font-serif text-base text-charcoal font-medium">
                    {mat.name}
                  </span>
                  <span className="text-xs font-semibold text-brand">
                    {mat.basePricePerM2.toLocaleString('vi-VN')} đ/m²
                  </span>
                </div>
                <p className="text-[11px] text-charcoal-muted font-light line-clamp-2">
                  {mat.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Step 5: Complexity Selection */}
        <div className="p-6 border border-hairline bg-canvas space-y-4">
          <span className="text-[10px] uppercase tracking-editorial text-artisan font-medium block">
            Bước 5: Mức Độ Chi Tiết / Độ Phức Tạp Bức Tranh
          </span>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                id: Complexity.SIMPLE,
                label: 'Đơn Giản',
                mult: studioConfig.simpleMultiplier,
                desc: 'Mảng màu lớn, tối giản, tranh trừu tượng ít nét',
              },
              {
                id: Complexity.MEDIUM,
                label: 'Vừa Phải',
                mult: studioConfig.mediumMultiplier,
                desc: 'Phong cảnh, tĩnh vật, đắp nổi vân toan hài hòa',
              },
              {
                id: Complexity.COMPLEX,
                label: 'Chi Tiết Cao',
                mult: studioConfig.complexMultiplier,
                desc: 'Chân dung, phố cổ tỉ mỉ, tranh tường nhiều nhân vật',
              },
            ].map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setComplexity(lvl.id)}
                className={`p-3 text-left border transition-all flex flex-col justify-between ${
                  complexity === lvl.id
                    ? 'border-brand bg-brand/5 ring-1 ring-brand'
                    : 'border-hairline bg-canvas-surface hover:bg-zinc-200/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-sm font-medium text-charcoal">
                      {lvl.label}
                    </span>
                    <span className="text-[10px] font-mono text-brand font-bold">
                      ×{lvl.mult}
                    </span>
                  </div>
                  <p className="text-[10px] text-charcoal-muted font-light pt-1 leading-snug">
                    {lvl.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 6: Frame Option (Framed Art) or Height Surcharge Note (Mural) */}
        {serviceType === ServiceType.FRAMED_ART ? (
          <div className="p-6 border border-hairline bg-canvas space-y-4">
            <span className="text-[10px] uppercase tracking-editorial text-artisan font-medium block">
              Bước 6: Tùy Chọn Khung Tranh Hoàn Thiện
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: FrameOption.NONE, label: 'Không lồng khung (Chỉ căng toan)', price: '0 đ' },
                { id: FrameOption.WOOD_MINIMAL, label: 'Khung Gỗ Sồi Tối Giản', price: '+200k/m²' },
                { id: FrameOption.WOOD_ORNATE, label: 'Khung Gỗ Cổ Điển Chạm Khắc', price: '+450k/m²' },
                { id: FrameOption.ALUMINUM_BLACK, label: 'Hợp Kim Nhôm Đen Mờ', price: '+280k/m²' },
                { id: FrameOption.ALUMINUM_GOLD, label: 'Hợp Kim Nhôm Vàng Kim', price: '+320k/m²' },
              ].map((fr) => (
                <button
                  key={fr.id}
                  type="button"
                  onClick={() => setFrameOption(fr.id)}
                  className={`p-3 text-left border transition-all ${
                    frameOption === fr.id
                      ? 'border-brand bg-brand/5 ring-1 ring-brand'
                      : 'border-hairline bg-canvas-surface hover:bg-zinc-200/50'
                  }`}
                >
                  <span className="font-serif text-xs font-medium text-charcoal block">
                    {fr.label}
                  </span>
                  <span className="text-[10px] text-brand block pt-1">{fr.price}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 border border-hairline bg-canvas space-y-3">
            <span className="text-[10px] uppercase tracking-editorial text-artisan font-medium block">
              Bước 6: An Toàn Thi Công Tường Cao
            </span>
            {heightCm > 300 ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 space-y-1">
                <span className="font-medium block">
                  Phụ phí giàn giáo an toàn: {pricing.siteSurcharge.toLocaleString('vi-VN')} đ
                </span>
                <p className="text-[11px] font-light">
                  Do tường cao trên 3m ({heightCm}cm), xưởng trang bị hệ thống giàn giáo và bảo hộ an toàn đạt chuẩn trong suốt thời gian vẽ.
                </p>
              </div>
            ) : (
              <p className="text-xs text-charcoal-muted font-light">
                Chiều cao tường ≤ 3m ({heightCm}cm) không phát sinh phụ phí giàn giáo kỹ thuật.
              </p>
            )}
          </div>
        )}

        {/* Step 7: Distance / Logistics */}
        <div className="p-6 border border-hairline bg-canvas space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-editorial text-artisan font-medium">
              Bước 7: Khoảng Cách Giao Tranh / Di Chuyển (km)
            </span>
            <span className="text-xs font-medium text-charcoal">
              {distanceKm} km từ Studio Hoàn Kiếm, HN
            </span>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min={0}
              max={150}
              step={5}
              value={distanceKm}
              onChange={(e) => setDistanceKm(parseInt(e.target.value) || 0)}
              className="w-full accent-brand cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-charcoal-muted">
              <span>0 km (Nội thành)</span>
              <span>50 km</span>
              <span>100 km</span>
              <span>150+ km (Toàn quốc)</span>
            </div>
          </div>

          <p className="text-[11px] text-charcoal-muted font-light">
            {serviceType === ServiceType.WALL_MURAL
              ? `Miễn phí di chuyển ${studioConfig.freeKmRadius}km đầu tiên. Từ km thứ ${studioConfig.freeKmRadius + 1}: ${studioConfig.feePerKm.toLocaleString('vi-VN')} đ/km.`
              : 'Giao tranh đóng thùng gỗ chèn xốp chuyên dụng, bảo hiểm 100% rủi ro nứt gãy toan khi vận chuyển.'}
          </p>
        </div>
      </div>

      {/* Right Column: Live Pricing Estimate & Direct Action */}
      <div className="lg:col-span-5 sticky top-28 space-y-6">
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
              <span className="font-mono text-white font-medium">
                {pricing.billableAreaM2} m² ({widthCm} × {heightCm} cm)
              </span>
            </div>

            <div className="flex justify-between">
              <span>Chất liệu & Độ khó:</span>
              <span className="font-mono text-white">
                {currentMaterial?.name || 'Sơn dầu'} (×{pricing.complexityMultiplier})
              </span>
            </div>

            <div className="flex justify-between">
              <span>Tiền vẽ tranh gốc:</span>
              <span className="font-mono text-white font-medium">
                {pricing.artworkBasePrice.toLocaleString('vi-VN')} đ
              </span>
            </div>

            {serviceType === ServiceType.FRAMED_ART ? (
              <div className="flex justify-between">
                <span>Tiền đóng khung hoàn thiện:</span>
                <span className="font-mono text-white font-medium">
                  {pricing.framePrice.toLocaleString('vi-VN')} đ
                </span>
              </div>
            ) : (
              pricing.siteSurcharge > 0 && (
                <div className="flex justify-between text-amber-300">
                  <span>Phụ phí giàn giáo ({heightCm}cm):</span>
                  <span className="font-mono font-medium">
                    {pricing.siteSurcharge.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              )
            )}

            <div className="flex justify-between">
              <span>
                {serviceType === ServiceType.FRAMED_ART ? 'Phí giao hàng & đóng hòm gỗ:' : 'Phí di chuyển thi công:'}
              </span>
              <span className="font-mono text-white font-medium">
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
              <span className="font-serif text-3xl sm:text-4xl text-white font-normal">
                {pricing.totalAmount.toLocaleString('vi-VN')} <span className="text-sm font-sans">VNĐ</span>
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
                  <span className="font-mono font-bold text-white text-sm">
                    {pricing.depositAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-400 pt-1">
                  <span>Số tiền thanh toán khi nhận tranh/nghiệm thu:</span>
                  <span className="font-mono text-zinc-300">
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

          {/* Action Trigger */}
          <div className="pt-2 space-y-3">
            <a
              href={`https://zalo.me/${studioConfig.hotline}?text=${encodeURIComponent(
                `Xin chào Họa sĩ Quốc Tuấn, tôi vừa cấu hình đơn đặt vẽ trên website:\n- Dịch vụ: ${serviceType === 'FRAMED_ART' ? 'Tranh đóng khung' : 'Tranh tường'}\n- Kích thước: ${widthCm}x${heightCm}cm (${pricing.billableAreaM2}m2)\n- Chất liệu: ${currentMaterial?.name}\n- Độ khó: ${complexity}\n- Dự toán: ${pricing.totalAmount.toLocaleString('vi-VN')} VNĐ\nNhờ anh xem xét và tư vấn thêm phác thảo giúp tôi.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-4 bg-brand hover:bg-brand-hover text-white text-xs uppercase tracking-editorial font-medium flex items-center justify-center gap-2 transition-colors shadow-lg"
            >
              <span>Gửi Cấu Hình Qua Zalo Họa Sĩ</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <p className="text-[11px] text-center text-zinc-400 font-light">
              Hoặc gọi Hotline trực tiếp: <strong className="text-white">{studioConfig.hotline}</strong>
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
              <span>Thanh toán VietQR SePay minh bạch, xuất biên nhận điện tử</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-artisan shrink-0" />
              <span>Tiền cọc không hoàn lại khi đã bắt đầu mua toan/lên màu</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
