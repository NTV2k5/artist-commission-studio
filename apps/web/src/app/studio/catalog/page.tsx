'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import {
  Palette,
  Layers,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Check,
  X,
  Sparkles,
  Loader2,
  ExternalLink,
  Save,
  CheckCircle2,
} from 'lucide-react';
import {
  fetchStudioArtworks,
  createStudioArtwork,
  updateStudioArtwork,
  deleteStudioArtwork,
  fetchStudioMaterials,
  createStudioMaterial,
  updateStudioMaterial,
  deleteStudioMaterial,
  fetchStudioAdminConfig,
  updateStudioAdminConfig,
  uploadFileToStorage,
} from '@/lib/api';

export default function StudioCatalogPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.backendToken;

  const [activeTab, setActiveTab] = useState<'artworks' | 'materials' | 'config'>('artworks');
  const [loading, setLoading] = useState(true);

  // Tab 1: Artworks State
  const [artworks, setArtworks] = useState<any[]>([]);
  const [showArtworkModal, setShowArtworkModal] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<any | null>(null);
  const [artworkForm, setArtworkForm] = useState({
    title: '',
    slug: '',
    description: '',
    images: [] as string[],
    serviceType: 'FRAMED_ART',
    materialId: '',
    defaultComplexity: 'MEDIUM',
    dimensionsNote: '',
    isFeatured: false,
    isAvailable: true,
  });
  const [artworkUploading, setArtworkUploading] = useState(false);
  const [artworkSubmitting, setArtworkSubmitting] = useState(false);

  // Tab 2: Materials State
  const [materials, setMaterials] = useState<any[]>([]);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
  const [materialForm, setMaterialForm] = useState({
    name: '',
    slug: '',
    serviceType: 'FRAMED_ART',
    basePricePerM2: 1500000,
    description: '',
    durabilityNote: '',
    isActive: true,
  });
  const [materialSubmitting, setMaterialSubmitting] = useState(false);

  // Tab 3: Config State
  const [configForm, setConfigForm] = useState<any>({});
  const [configSaving, setConfigSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [artworksRes, materialsRes, configRes] = await Promise.all([
        fetchStudioArtworks(token),
        fetchStudioMaterials(token),
        fetchStudioAdminConfig(token),
      ]);
      setArtworks(artworksRes);
      setMaterials(materialsRes);
      setConfigForm(configRes);
    } catch (err: any) {
      console.warn('Failed to load catalog data:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadAll();
    }
  }, [token, loadAll]);

  // Handle Image Upload for Artwork
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setArtworkUploading(true);
      const uploadedUrl = await uploadFileToStorage(file);
      setArtworkForm((prev) => ({
        ...prev,
        images: [...prev.images, uploadedUrl],
      }));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tải ảnh');
    } finally {
      setArtworkUploading(false);
    }
  };

  // Submit Artwork
  const handleSaveArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setArtworkSubmitting(true);
      if (editingArtwork) {
        const updated = await updateStudioArtwork(editingArtwork.id, artworkForm, token);
        setArtworks((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      } else {
        const created = await createStudioArtwork(artworkForm, token);
        setArtworks((prev) => [created, ...prev]);
      }
      setShowArtworkModal(false);
      setEditingArtwork(null);
    } catch (err: any) {
      alert(err.message || 'Lỗi lưu tác phẩm');
    } finally {
      setArtworkSubmitting(false);
    }
  };

  // Delete Artwork
  const handleDeleteArtwork = async (id: string) => {
    if (!window.confirm('Xác nhận xóa hoặc tạm ẩn tác phẩm này khỏi bộ sưu tập?')) return;
    try {
      await deleteStudioArtwork(id, token);
      setArtworks((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa tác phẩm');
    }
  };

  // Submit Material
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMaterialSubmitting(true);
      if (editingMaterial) {
        const updated = await updateStudioMaterial(editingMaterial.id, materialForm, token);
        setMaterials((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      } else {
        const created = await createStudioMaterial(materialForm, token);
        setMaterials((prev) => [created, ...prev]);
      }
      setShowMaterialModal(false);
      setEditingMaterial(null);
    } catch (err: any) {
      alert(err.message || 'Lỗi lưu chất liệu');
    } finally {
      setMaterialSubmitting(false);
    }
  };

  // Delete Material
  const handleDeleteMaterial = async (id: string) => {
    if (!window.confirm('Xác nhận vô hiệu hóa chất liệu này?')) return;
    try {
      await deleteStudioMaterial(id, token);
      setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, isActive: false } : m)));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa');
    }
  };

  // Save Config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setConfigSaving(true);
      const updated = await updateStudioAdminConfig(configForm, token);
      setConfigForm(updated);
      alert('Đã cập nhật cấu hình studio & bảng giá thành công!');
    } catch (err: any) {
      alert(err.message || 'Lỗi lưu cấu hình');
    } finally {
      setConfigSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            CMS Quản Trị Kho Tranh & Bảng Giá
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Quản trị độc lập toàn bộ tranh mẫu, đơn giá chất liệu và tham số cọc/vận chuyển (Không phụ thuộc Strapi)
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-zinc-200/80 p-1 rounded-2xl border border-zinc-300 self-start sm:self-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('artworks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'artworks'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Palette className="w-4 h-4 text-[#3E5C6E]" />
            <span>Kho Tranh ({artworks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'materials'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Layers className="w-4 h-4 text-[#B45309]" />
            <span>Chất Liệu ({materials.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'config'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Settings className="w-4 h-4 text-zinc-700" />
            <span>Cấu Hình Studio</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#3E5C6E]" />
          <p className="text-xs text-zinc-500 font-serif">Đang tải dữ liệu CMS...</p>
        </div>
      ) : activeTab === 'artworks' ? (
        /* TAB 1: ARTWORKS PORTFOLIO CMS */
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-500 font-light">
              Hiển thị danh mục các tác phẩm nghệ thuật trên trang Bộ sưu tập và trợ lý AI
            </span>
            <button
              type="button"
              onClick={() => {
                setEditingArtwork(null);
                setArtworkForm({
                  title: '',
                  slug: '',
                  description: '',
                  images: [],
                  serviceType: 'FRAMED_ART',
                  materialId: materials[0]?.id || '',
                  defaultComplexity: 'MEDIUM',
                  dimensionsNote: 'Kích thước tiêu chuẩn 80x120cm',
                  isFeatured: false,
                  isAvailable: true,
                });
                setShowArtworkModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3E5C6E] text-white rounded-xl text-xs font-semibold hover:bg-[#2F4858] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Tác Phẩm Mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {artworks.map((art) => (
              <div
                key={art.id}
                className="bg-white rounded-2xl border border-zinc-200/90 overflow-hidden shadow-sm flex flex-col group hover:shadow-md transition-all"
              >
                <div className="relative aspect-[4/3] bg-zinc-900 overflow-hidden">
                  {art.images?.[0] && (
                    <Image
                      src={art.images[0]}
                      alt={art.title}
                      fill
                      sizes="400px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {art.isFeatured && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500 text-white shadow">
                        Tiêu biểu
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-black/60 text-white backdrop-blur-sm">
                      {art.serviceType === 'WALL_MURAL' ? 'Bích họa' : 'Tranh khung'}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-serif text-base font-semibold text-zinc-900 group-hover:text-[#3E5C6E] transition-colors">
                      {art.title}
                    </h4>
                    <span className="text-[11px] text-zinc-500 block mt-0.5">
                      Chất liệu: <strong>{art.material?.name || 'Tranh'}</strong> &bull; /{art.slug}
                    </span>
                    <p className="text-zinc-600 text-xs mt-2 line-clamp-2 font-light">
                      {art.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <span
                      className={`text-[11px] font-medium ${
                        art.isAvailable ? 'text-emerald-700' : 'text-zinc-400'
                      }`}
                    >
                      {art.isAvailable ? 'Đang mở đặt vẽ' : 'Tạm ẩn'}
                    </span>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingArtwork(art);
                          setArtworkForm({
                            title: art.title,
                            slug: art.slug,
                            description: art.description,
                            images: art.images || [],
                            serviceType: art.serviceType,
                            materialId: art.materialId,
                            defaultComplexity: art.defaultComplexity,
                            dimensionsNote: art.dimensionsNote || '',
                            isFeatured: art.isFeatured,
                            isAvailable: art.isAvailable,
                          });
                          setShowArtworkModal(true);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                        title="Chỉnh sửa tác phẩm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteArtwork(art.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Xóa / Tạm ẩn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'materials' ? (
        /* TAB 2: MATERIALS & SQUARE-METER RATES CMS */
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-500 font-light">
              Bảng đơn giá cơ sở theo m² áp dụng trực tiếp cho công thức tính giá động
            </span>
            <button
              type="button"
              onClick={() => {
                setEditingMaterial(null);
                setMaterialForm({
                  name: '',
                  slug: '',
                  serviceType: 'FRAMED_ART',
                  basePricePerM2: 1500000,
                  description: '',
                  durabilityNote: '',
                  isActive: true,
                });
                setShowMaterialModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#B45309] text-white rounded-xl text-xs font-semibold hover:bg-amber-800 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Chất Liệu Mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {materials.map((mat) => (
              <div
                key={mat.id}
                className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <h4 className="font-serif text-lg font-semibold text-zinc-900">{mat.name}</h4>
                    <span className="text-[11px] font-mono text-zinc-400">slug: {mat.slug}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-100 text-zinc-700">
                    {mat.serviceType === 'WALL_MURAL' ? 'Tranh tường' : 'Tranh đóng khung'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 bg-zinc-50 px-3 rounded-xl">
                    <span className="text-zinc-600">Đơn giá cơ sở / m²:</span>
                    <strong className="font-sans font-bold tabular-nums text-base text-[#3E5C6E]">
                      {mat.basePricePerM2.toLocaleString('vi-VN')} VNĐ
                    </strong>
                  </div>

                  <p className="text-zinc-600 font-light leading-relaxed">{mat.description}</p>
                  {mat.durabilityNote && (
                    <p className="text-amber-800 text-[11px]">
                      <strong>Độ bền màu:</strong> {mat.durabilityNote}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <span
                    className={`font-semibold ${
                      mat.isActive ? 'text-emerald-700' : 'text-zinc-400'
                    }`}
                  >
                    {mat.isActive ? 'Đang áp dụng' : 'Tạm ngừng'}
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMaterial(mat);
                        setMaterialForm({
                          name: mat.name,
                          slug: mat.slug,
                          serviceType: mat.serviceType,
                          basePricePerM2: mat.basePricePerM2,
                          description: mat.description,
                          durabilityNote: mat.durabilityNote || '',
                          isActive: mat.isActive,
                        });
                        setShowMaterialModal(true);
                      }}
                      className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMaterial(mat.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* TAB 3: STUDIO CONFIGURATION & PRICING RULES */
        <form onSubmit={handleSaveConfig} className="bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200/90 shadow-sm space-y-8">
          <div>
            <h3 className="font-serif text-lg font-semibold text-zinc-900">
              Thông Tin Họa Sĩ & Kênh Liên Hệ
            </h3>
            <span className="text-xs text-zinc-400">
              Xuất hiện trên bóng liên hệ nổi, hồ sơ nghệ sĩ và hợp đồng vẽ tranh
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Tên Họa sĩ:</label>
              <input
                type="text"
                value={configForm.artistName || ''}
                onChange={(e) => setConfigForm({ ...configForm, artistName: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Số năm kinh nghiệm:</label>
              <input
                type="number"
                value={configForm.experienceYears || 0}
                onChange={(e) => setConfigForm({ ...configForm, experienceYears: Number(e.target.value) })}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Hotline xưởng vẽ:</label>
              <input
                type="text"
                value={configForm.hotline || ''}
                onChange={(e) => setConfigForm({ ...configForm, hotline: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Link Zalo Họa sĩ:</label>
              <input
                type="text"
                value={configForm.zaloUrl || ''}
                onChange={(e) => setConfigForm({ ...configForm, zaloUrl: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Link Facebook Messenger:</label>
              <input
                type="text"
                value={configForm.messengerUrl || ''}
                onChange={(e) => setConfigForm({ ...configForm, messengerUrl: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-zinc-700 mb-1">Địa chỉ xưởng vẽ:</label>
            <input
              type="text"
              value={configForm.studioAddress || ''}
              onChange={(e) => setConfigForm({ ...configForm, studioAddress: e.target.value })}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl"
            />
          </div>

          <div className="pt-6 border-t border-zinc-200 space-y-4">
            <div>
              <h3 className="font-serif text-lg font-semibold text-zinc-900">
                Quy Tắc Đặt Cọc & Diện Tích Tính Phí Tối Thiểu
              </h3>
              <span className="text-xs text-zinc-400">
                Tuân thủ GEMINI.md Mục 2.3 & 2.4 — Bảo đảm doanh thu và phòng ngừa rủi ro hủy đơn
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Ngưỡng bắt buộc cọc (VNĐ):
                </label>
                <input
                  type="number"
                  value={configForm.depositThreshold || 0}
                  onChange={(e) => setConfigForm({ ...configForm, depositThreshold: Number(e.target.value) })}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Tỷ lệ tiền cọc (%):</label>
                <input
                  type="number"
                  value={configForm.depositPercent || 40}
                  onChange={(e) => setConfigForm({ ...configForm, depositPercent: Number(e.target.value) })}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-mono font-bold text-amber-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Diện tích tối thiểu Tranh khung (m²):</label>
                <input
                  type="number"
                  step="0.05"
                  value={configForm.minFramedAreaM2 || 0.2}
                  onChange={(e) => setConfigForm({ ...configForm, minFramedAreaM2: Number(e.target.value) })}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Diện tích tối thiểu Bích họa (m²):</label>
                <input
                  type="number"
                  step="0.1"
                  value={configForm.minMuralAreaM2 || 1.0}
                  onChange={(e) => setConfigForm({ ...configForm, minMuralAreaM2: Number(e.target.value) })}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-200 space-y-4">
            <div>
              <h3 className="font-serif text-lg font-semibold text-zinc-900">
                Phí Di Chuyển & Hệ Số Độ Phức Tạp Nét Cọ
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Miễn phí bán kính (km):</label>
                <input
                  type="number"
                  value={configForm.freeKmRadius || 10}
                  onChange={(e) => setConfigForm({ ...configForm, freeKmRadius: Number(e.target.value) })}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Phí / km tiếp theo (VNĐ):</label>
                <input
                  type="number"
                  value={configForm.feePerKm || 15000}
                  onChange={(e) => setConfigForm({ ...configForm, feePerKm: Number(e.target.value) })}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Hệ số SIMPLE:</label>
                <input
                  type="number"
                  step="0.05"
                  value={configForm.simpleMultiplier || 1.0}
                  onChange={(e) => setConfigForm({ ...configForm, simpleMultiplier: Number(e.target.value) })}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Hệ số MEDIUM:</label>
                <input
                  type="number"
                  step="0.05"
                  value={configForm.mediumMultiplier || 1.35}
                  onChange={(e) => setConfigForm({ ...configForm, mediumMultiplier: Number(e.target.value) })}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Hệ số COMPLEX:</label>
                <input
                  type="number"
                  step="0.05"
                  value={configForm.complexMultiplier || 1.8}
                  onChange={(e) => setConfigForm({ ...configForm, complexMultiplier: Number(e.target.value) })}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={configSaving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#18181B] text-white hover:bg-zinc-800 rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              {configSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Lưu Cấu Hình Studio & Bảng Giá</span>
            </button>
          </div>
        </form>
      )}

      {/* MODAL: ADD / EDIT ARTWORK */}
      {showArtworkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white max-w-2xl w-full rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-serif text-lg font-semibold text-zinc-900">
                {editingArtwork ? 'Chỉnh Sửa Tác Phẩm' : 'Thêm Tác Phẩm Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setShowArtworkModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArtwork} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Tiêu đề tác phẩm:</label>
                  <input
                    type="text"
                    required
                    value={artworkForm.title}
                    onChange={(e) => setArtworkForm({ ...artworkForm, title: e.target.value })}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">URL Slug:</label>
                  <input
                    type="text"
                    required
                    value={artworkForm.slug}
                    onChange={(e) => setArtworkForm({ ...artworkForm, slug: e.target.value })}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Loại dịch vụ:</label>
                  <select
                    value={artworkForm.serviceType}
                    onChange={(e) => setArtworkForm({ ...artworkForm, serviceType: e.target.value })}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl"
                  >
                    <option value="FRAMED_ART">Tranh đóng khung (FRAMED_ART)</option>
                    <option value="WALL_MURAL">Bích họa tường (WALL_MURAL)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Chất liệu chính:</label>
                  <select
                    value={artworkForm.materialId}
                    onChange={(e) => setArtworkForm({ ...artworkForm, materialId: e.target.value })}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl"
                  >
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.serviceType})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Mô tả câu chuyện tác phẩm:</label>
                <textarea
                  rows={3}
                  required
                  value={artworkForm.description}
                  onChange={(e) => setArtworkForm({ ...artworkForm, description: e.target.value })}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl"
                />
              </div>

              {/* Upload Image Section */}
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Hình ảnh tác phẩm:</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={artworkUploading}
                    className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-xl flex items-center gap-2 font-medium"
                  >
                    {artworkUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>Tải ảnh từ máy</span>
                  </button>
                  <span className="text-[11px] text-zinc-400">Đã có {artworkForm.images.length} ảnh</span>
                </div>

                {artworkForm.images.length > 0 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto py-1">
                    {artworkForm.images.map((url, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 shrink-0 group">
                        <Image src={url} alt="art" fill sizes="64px" className="object-cover" />
                        <button
                          type="button"
                          onClick={() => setArtworkForm((prev) => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                          className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-zinc-700">
                  <input
                    type="checkbox"
                    checked={artworkForm.isFeatured}
                    onChange={(e) => setArtworkForm({ ...artworkForm, isFeatured: e.target.checked })}
                    className="rounded text-[#3E5C6E]"
                  />
                  <span>Tác phẩm tiêu biểu (Featured)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-zinc-700">
                  <input
                    type="checkbox"
                    checked={artworkForm.isAvailable}
                    onChange={(e) => setArtworkForm({ ...artworkForm, isAvailable: e.target.checked })}
                    className="rounded text-[#3E5C6E]"
                  />
                  <span>Mở nhận đặt vẽ</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowArtworkModal(false)}
                  className="px-4 py-2 text-zinc-600 font-medium"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={artworkSubmitting}
                  className="px-5 py-2 bg-[#3E5C6E] text-white rounded-xl font-semibold hover:bg-[#2F4858]"
                >
                  {artworkSubmitting ? 'Đang lưu...' : 'Lưu Tác Phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT MATERIAL */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-serif text-lg font-semibold text-zinc-900">
                {editingMaterial ? 'Sửa Chất Liệu' : 'Thêm Chất Liệu'}
              </h3>
              <button
                type="button"
                onClick={() => setShowMaterialModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-3">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Tên chất liệu:</label>
                <input
                  type="text"
                  required
                  value={materialForm.name}
                  onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Slug định danh:</label>
                <input
                  type="text"
                  required
                  value={materialForm.slug}
                  onChange={(e) => setMaterialForm({ ...materialForm, slug: e.target.value })}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Đơn giá / m² (VNĐ):</label>
                <input
                  type="number"
                  required
                  value={materialForm.basePricePerM2}
                  onChange={(e) => setMaterialForm({ ...materialForm, basePricePerM2: Number(e.target.value) })}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Mô tả nghệ thuật:</label>
                <textarea
                  rows={2}
                  required
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Độ bền màu:</label>
                <input
                  type="text"
                  value={materialForm.durabilityNote}
                  onChange={(e) => setMaterialForm({ ...materialForm, durabilityNote: e.target.value })}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="px-4 py-2 text-zinc-600 font-medium"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={materialSubmitting}
                  className="px-5 py-2 bg-[#B45309] text-white rounded-xl font-semibold hover:bg-amber-800"
                >
                  {materialSubmitting ? 'Đang lưu...' : 'Lưu Chất Liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
