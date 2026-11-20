'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Layers,
  Kanban,
  Table as TableIcon,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Banknote,
  Send,
  Calendar,
  X,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Loader2,
  RefreshCw,
  Sparkles,
  Phone,
  MapPin,
  Palette,
} from 'lucide-react';
import {
  fetchStudioOrders,
  fetchStudioOrderById,
  updateStudioQuote,
  updateStudioOrderStatus,
  confirmStudioCashPayment,
  cancelStudioOrder,
} from '@/lib/api';
import { OrderWorkspaceChat } from '@/components/chat/OrderWorkspaceChat';

const STATUS_COLUMNS = [
  { id: 'PENDING_QUOTE', label: 'Chờ Báo Giá', color: 'bg-rose-50 border-rose-200 text-rose-800' },
  { id: 'AWAITING_DEPOSIT', label: 'Chờ Đặt Cọc', color: 'bg-amber-50 border-amber-200 text-amber-800' },
  { id: 'DEPOSIT_PAID', label: 'Đã Nhận Cọc', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  { id: 'SKETCHING', label: 'Lên Phác Thảo', color: 'bg-purple-50 border-purple-200 text-purple-800' },
  { id: 'PAINTING', label: 'Đang Vẽ Chính Thức', color: 'bg-blue-50 border-blue-200 text-blue-800' },
  { id: 'DELIVERING', label: 'Giao / Thi Công', color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
  { id: 'COMPLETED', label: 'Đã Hoàn Thành', color: 'bg-zinc-100 border-zinc-200 text-zinc-700' },
];

export default function StudioOrdersPage() {
  const searchParams = useSearchParams();
  const urlOrderCode = searchParams.get('orderCode');

  const { data: session, status } = useSession();
  const token =
    (session?.user as any)?.backendToken ||
    (session?.user as any)?.accessToken ||
    (session as any)?.accessToken;

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Filters
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');

  // Selected Order Drawer
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Quote form state
  const [quoteComplexity, setQuoteComplexity] = useState('MEDIUM');
  const [quotePrice, setQuotePrice] = useState<number>(0);
  const [quoteFee, setQuoteFee] = useState<number>(0);
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);

  // Status & Date form state
  const [statusVal, setStatusVal] = useState('');
  const [startDateVal, setStartDateVal] = useState('');
  const [endDateVal, setEndDateVal] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [scheduleWarning, setScheduleWarning] = useState<string | null>(null);

  // Cash payment state
  const [cashSubmitting, setCashSubmitting] = useState(false);

  // Cancel state
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const openDrawer = useCallback(async (orderId: string) => {
    try {
      setDrawerLoading(true);
      const fullOrder = await fetchStudioOrderById(orderId, token);
      setSelectedOrder(fullOrder);
      setQuoteComplexity(fullOrder.complexity || 'MEDIUM');
      setQuotePrice(fullOrder.artworkPrice || 0);
      setQuoteFee(fullOrder.shippingOrTravelFee || 0);
      setStatusVal(fullOrder.status);
      setStartDateVal(
        fullOrder.scheduledStartDate ? fullOrder.scheduledStartDate.split('T')[0] : '',
      );
      setEndDateVal(
        fullOrder.scheduledEndDate ? fullOrder.scheduledEndDate.split('T')[0] : '',
      );
      setScheduleWarning(null);
    } catch (err: any) {
      alert(err.message || 'Không thể tải chi tiết đơn hàng');
    } finally {
      setDrawerLoading(false);
    }
  }, [token]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchStudioOrders(
        {
          search: search.trim() || undefined,
          serviceType: serviceFilter !== 'ALL' ? serviceFilter : undefined,
          limit: 100,
        },
        token,
      );
      setOrders(res.items || []);

      // If URL contains orderCode, open that order automatically
      if (urlOrderCode && !selectedOrder) {
        const found = (res.items || []).find((o: any) => o.orderCode === urlOrderCode);
        if (found) {
          openDrawer(found.id);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load studio orders:', err);
      setError(err.message || 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [search, serviceFilter, token, urlOrderCode, selectedOrder, openDrawer]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadOrders();
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setError('Vui lòng đăng nhập với tài khoản Họa sĩ để quản lý đơn hàng.');
    }
  }, [status, serviceFilter, loadOrders]);

  // Submit Quote Update
  const handleUpdateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      setQuoteSubmitting(true);
      const updated = await updateStudioQuote(
        selectedOrder.id,
        {
          complexity: quoteComplexity,
          artworkPrice: Number(quotePrice),
          shippingOrTravelFee: Number(quoteFee),
        },
        token,
      );
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      alert('Đã chốt báo giá thành công và gửi thông báo tới khách hàng!');
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật báo giá');
    } finally {
      setQuoteSubmitting(false);
    }
  };

  // Submit Status & Schedule Update
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      setStatusSubmitting(true);
      setScheduleWarning(null);
      const res = await updateStudioOrderStatus(
        selectedOrder.id,
        {
          status: statusVal,
          scheduledStartDate: startDateVal ? new Date(startDateVal).toISOString() : undefined,
          scheduledEndDate: endDateVal ? new Date(endDateVal).toISOString() : undefined,
        },
        token,
      );
      const updated = res.order;
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));

      if (res.hasScheduleConflict) {
        setScheduleWarning(
          `CẢNH BÁO: Lịch thi công bị trùng với các đơn bích họa: ${res.conflictingOrders.join(', ')}!`,
        );
      } else {
        alert('Đã cập nhật tiến độ đơn hàng thành công!');
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật trạng thái');
    } finally {
      setStatusSubmitting(false);
    }
  };

  // Confirm Full Cash Payment
  const handleConfirmCash = async () => {
    if (!selectedOrder) return;
    const confirmMsg = `Xác nhận bạn đã thu đủ số tiền mặt còn lại (${(
      selectedOrder.totalAmount - selectedOrder.paidAmount
    ).toLocaleString('vi-VN')} đ) từ khách hàng?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setCashSubmitting(true);
      const updated = await confirmStudioCashPayment(selectedOrder.id, token);
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      alert('Đã ghi nhận thu đủ 100% tiền mặt!');
    } catch (err: any) {
      alert(err.message || 'Lỗi xác nhận tiền mặt');
    } finally {
      setCashSubmitting(false);
    }
  };

  // Cancel Order
  const handleCancelOrder = async () => {
    if (!selectedOrder || !cancelReason.trim()) return;
    try {
      setCancelSubmitting(true);
      const updated = await cancelStudioOrder(selectedOrder.id, cancelReason.trim(), token);
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setShowCancelPrompt(false);
      setCancelReason('');
      alert('Đã hủy đơn hàng');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi hủy đơn');
    } finally {
      setCancelSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/90 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
              placeholder="Tìm theo mã đơn #DH, tên khách, số điện thoại..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3E5C6E] text-zinc-900"
            />
          </div>

          <button
            type="button"
            onClick={loadOrders}
            className="px-3.5 py-2 bg-[#18181B] text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-colors"
          >
            Tìm
          </button>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Service filter */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-xl font-medium text-zinc-700 focus:outline-none"
          >
            <option value="ALL">Tất cả loại tranh</option>
            <option value="FRAMED_ART">Tranh đóng khung</option>
            <option value="WALL_MURAL">Bích họa tường</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white text-zinc-900 shadow-sm font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
              title="Xem theo cột Kanban"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-zinc-900 shadow-sm font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
              title="Xem theo danh sách bảng"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bảng</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Orders Display */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#3E5C6E]" />
          <p className="text-xs text-zinc-500 font-sans">Đang đồng bộ điều phối đơn hàng...</p>
        </div>
      ) : error ? (
        <div className="bg-white p-8 rounded-2xl border border-zinc-200 text-center space-y-4 max-w-lg mx-auto">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs text-zinc-600 font-sans">{error}</p>
          <button
            type="button"
            onClick={loadOrders}
            className="px-4 py-2 bg-[#18181B] text-white text-xs font-semibold rounded-xl"
          >
            Thử Lại
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW */
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin">
          {STATUS_COLUMNS.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.id);

            return (
              <div
                key={col.id}
                className="w-72 shrink-0 bg-white/70 rounded-2xl border border-zinc-200/80 p-3.5 flex flex-col max-h-[750px] shadow-sm"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-900">{col.label}</span>
                    <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-700 text-[10px] font-bold flex items-center justify-center">
                      {colOrders.length}
                    </span>
                  </div>
                </div>

                {/* Orders in Column */}
                <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                  {colOrders.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400 text-xs italic">
                      Trống
                    </div>
                  ) : (
                    colOrders.map((ord) => (
                      <div
                        key={ord.id}
                        onClick={() => openDrawer(ord.id)}
                        className="bg-white p-3.5 rounded-xl border border-zinc-200/90 shadow-sm hover:shadow-md hover:border-[#3E5C6E] transition-all cursor-pointer space-y-2.5 text-xs group"
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-mono font-bold text-zinc-900 group-hover:text-[#3E5C6E]">
                            {ord.orderCode}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.serviceType === 'WALL_MURAL'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-zinc-100 text-zinc-700'
                            }`}
                          >
                            {ord.serviceType === 'WALL_MURAL' ? 'Bích họa' : 'Tranh khung'}
                          </span>
                        </div>

                        <div>
                          <span className="font-semibold text-zinc-800 block truncate">
                            {ord.customer?.name}
                          </span>
                          <span className="text-[11px] text-zinc-400 block">
                            {ord.widthCm} × {ord.heightCm} cm &bull; {ord.material?.name}
                          </span>
                        </div>

                        {/* Financial Bar */}
                        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
                          <div>
                            <span className="text-zinc-400 block text-[9px] uppercase">Tổng</span>
                            <span className="font-sans font-bold tabular-nums text-zinc-900">
                              {ord.totalAmount.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-zinc-400 block text-[9px] uppercase">Đã thu</span>
                            <span
                              className={`font-sans font-bold tabular-nums ${
                                ord.paidAmount >= ord.totalAmount
                                  ? 'text-emerald-600'
                                  : 'text-amber-600'
                              }`}
                            >
                              {ord.paidAmount.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm overflow-hidden text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#FAF9F6] border-b border-zinc-200 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Mã Đơn</th>
                  <th className="py-3.5 px-4">Khách Hàng</th>
                  <th className="py-3.5 px-4">Loại Tranh & Kích Thước</th>
                  <th className="py-3.5 px-4">Chất Liệu</th>
                  <th className="py-3.5 px-4 text-right">Tổng Chi Phí</th>
                  <th className="py-3.5 px-4 text-right">Đã Thanh Toán</th>
                  <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {orders.map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => openDrawer(ord.id)}
                    className="hover:bg-zinc-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">
                      {ord.orderCode}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-zinc-800">
                      {ord.customer?.name}
                      <span className="block text-[10px] text-zinc-400">{ord.customer?.phone}</span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600">
                      {ord.serviceType === 'WALL_MURAL' ? 'Bích họa tường' : 'Tranh đóng khung'}
                      <span className="block text-[10px] text-zinc-400">
                        {ord.widthCm} × {ord.heightCm} cm
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600">{ord.material?.name}</td>
                    <td className="py-3.5 px-4 text-right font-sans font-bold tabular-nums text-zinc-900">
                      {ord.totalAmount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans font-bold tabular-nums text-emerald-600">
                      {ord.paidAmount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700">
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDrawer(ord.id);
                        }}
                        className="px-3 py-1.5 bg-[#3E5C6E] text-white rounded-lg text-xs font-semibold hover:bg-[#2F4858]"
                      >
                        Chi Tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ORDER DETAIL DRAWER (Slide in from Right) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
            onClick={() => setSelectedOrder(null)}
          />

          <div className="relative z-10 w-full max-w-2xl bg-[#FAF9F6] h-full shadow-2xl border-l border-zinc-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Top Header */}
            <div className="p-4 sm:px-6 bg-[#18181B] text-white flex items-center justify-between border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-mono text-base font-bold text-amber-400">
                  {selectedOrder.orderCode}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/10 text-zinc-200">
                  {selectedOrder.status}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs text-zinc-800">
              {/* Customer & Delivery Specs */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 space-y-3">
                <h4 className="font-serif text-base font-semibold text-zinc-900 border-b border-zinc-100 pb-2">
                  Thông Tin Khách Hàng & Giao Nhận
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase">Họ và tên</span>
                    <span className="font-semibold text-zinc-900">{selectedOrder.customer?.name}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase">Số điện thoại</span>
                    <span className="font-semibold text-zinc-900">
                      {selectedOrder.customer?.phone || 'Chưa cung cấp'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase">Email</span>
                    <span className="font-semibold text-zinc-900 truncate block">
                      {selectedOrder.customer?.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase">Kích thước</span>
                    <span className="font-mono font-semibold text-zinc-900">
                      {selectedOrder.widthCm} × {selectedOrder.heightCm} cm
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-100">
                  <span className="text-zinc-400 block text-[10px] uppercase">Địa chỉ thi công / nhận tranh</span>
                  <span className="font-medium text-zinc-900">{selectedOrder.address}</span>
                </div>
              </div>

              {/* Reference Photos */}
              {selectedOrder.customReferenceUrls && selectedOrder.customReferenceUrls.length > 0 && (
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 space-y-3">
                  <h4 className="font-serif text-base font-semibold text-zinc-900">
                    Ảnh Mẫu / Hiện Trạng Khách Tải Lên
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedOrder.customReferenceUrls.map((url: string, i: number) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="relative aspect-video rounded-xl overflow-hidden border border-zinc-200 hover:opacity-90 transition-opacity"
                      >
                        <Image src={url} alt={`Ref ${i}`} fill sizes="200px" className="object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: FORM CHỐT BÁO GIÁ (NẾU ĐƠN PENDING_QUOTE) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <h4 className="font-serif text-base font-semibold text-zinc-900">
                    Thẩm Định & Chốt Báo Giá
                  </h4>
                  <span className="text-[10px] text-amber-700 uppercase font-bold bg-amber-50 px-2 py-0.5 rounded">
                    Quyền Họa Sĩ
                  </span>
                </div>

                <form onSubmit={handleUpdateQuote} className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                        Độ phức tạp nét cọ:
                      </label>
                      <select
                        value={quoteComplexity}
                        onChange={(e) => setQuoteComplexity(e.target.value)}
                        className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs"
                      >
                        <option value="SIMPLE">SIMPLE (Đơn giản - x1.0)</option>
                        <option value="MEDIUM">MEDIUM (Tiêu chuẩn - x1.35)</option>
                        <option value="COMPLEX">COMPLEX (Phức tạp - x1.8)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                        Tiền vẽ tranh (VNĐ):
                      </label>
                      <input
                        type="number"
                        value={quotePrice}
                        onChange={(e) => setQuotePrice(Number(e.target.value))}
                        className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                        Phí ship/thi công:
                      </label>
                      <input
                        type="number"
                        value={quoteFee}
                        onChange={(e) => setQuoteFee(Number(e.target.value))}
                        className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-zinc-600">
                      Tổng tiền mới:{' '}
                      <strong className="font-sans font-bold tabular-nums text-zinc-900">
                        {(Number(quotePrice) + Number(quoteFee)).toLocaleString('vi-VN')} đ
                      </strong>
                    </span>

                    <button
                      type="submit"
                      disabled={quoteSubmitting}
                      className="px-4 py-2 bg-[#18181B] text-white hover:bg-zinc-800 rounded-xl font-semibold transition-colors disabled:opacity-50"
                    >
                      {quoteSubmitting ? 'Đang lưu...' : 'Chốt Báo Giá Cho Khách'}
                    </button>
                  </div>
                </form>
              </div>

              {/* SECTION: TIẾN ĐỘ & LỊCH THI CÔNG */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 space-y-4">
                <h4 className="font-serif text-base font-semibold text-zinc-900 border-b border-zinc-100 pb-2">
                  Cập Nhật Trạng Thái & Lịch Thi Công
                </h4>

                {scheduleWarning && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{scheduleWarning}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateStatus} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                      Chuyển trạng thái đơn:
                    </label>
                    <select
                      value={statusVal}
                      onChange={(e) => setStatusVal(e.target.value)}
                      className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs"
                    >
                      {STATUS_COLUMNS.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.label} ({col.id})
                        </option>
                      ))}
                      <option value="CANCELLED">Hủy đơn (CANCELLED)</option>
                    </select>
                  </div>

                  {selectedOrder.serviceType === 'WALL_MURAL' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                          Ngày bắt đầu thi công:
                        </label>
                        <input
                          type="date"
                          value={startDateVal}
                          onChange={(e) => setStartDateVal(e.target.value)}
                          className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                          Ngày dự kiến hoàn thành:
                        </label>
                        <input
                          type="date"
                          value={endDateVal}
                          onChange={(e) => setEndDateVal(e.target.value)}
                          className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={statusSubmitting}
                      className="px-4 py-2 bg-[#3E5C6E] text-white hover:bg-[#2F4858] rounded-xl font-semibold transition-colors disabled:opacity-50"
                    >
                      {statusSubmitting ? 'Đang cập nhật...' : 'Cập Nhật Trạng Thái & Lịch'}
                    </button>
                  </div>
                </form>
              </div>

              {/* SECTION: XÁC NHẬN THU TIỀN MẶT CÒN LẠI */}
              {selectedOrder.totalAmount > selectedOrder.paidAmount && (
                <div className="bg-amber-50 p-4 sm:p-5 rounded-2xl border border-amber-200 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                      Công nợ tiền mặt còn lại
                    </span>
                    <span className="font-sans font-bold text-xl text-amber-950 tabular-nums">
                      {(selectedOrder.totalAmount - selectedOrder.paidAmount).toLocaleString('vi-VN')} đ
                    </span>
                    <span className="text-[11px] text-amber-800 block mt-0.5">
                      Khách thanh toán trực tiếp khi giao nhận tranh
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmCash}
                    disabled={cashSubmitting}
                    className="px-4 py-2.5 bg-[#B45309] hover:bg-amber-800 text-white rounded-xl font-semibold text-xs transition-colors shrink-0 shadow-sm"
                  >
                    {cashSubmitting ? 'Đang xử lý...' : 'Xác Nhận Đã Thu Đủ Tiền Mặt'}
                  </button>
                </div>
              )}

              {/* SECTION: REALTIME CHAT WORKSPACE & SKETCH PROPOSAL UPLOAD */}
              <div className="space-y-2">
                <h4 className="font-serif text-base font-semibold text-zinc-900">
                  Phòng Trao Đổi Trực Tiếp Với Khách Hàng
                </h4>
                <OrderWorkspaceChat
                  orderCode={selectedOrder.orderCode}
                  orderId={selectedOrder.id}
                  customerId={selectedOrder.customerId}
                  currentUser={{
                    id: (session?.user as any)?.id,
                    name: session?.user?.name || 'Họa sĩ Quốc Tuấn',
                    email: session?.user?.email || undefined,
                    role: 'ARTIST',
                    backendToken: token,
                  }}
                  orderStatus={selectedOrder.status}
                  revisionCount={selectedOrder.revisionCount || 0}
                  onOrderUpdated={(updated) => {
                    setSelectedOrder((prev: any) => ({ ...prev, ...updated }));
                    setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? { ...o, ...updated } : o)));
                  }}
                />
              </div>

              {/* SECTION: CANCEL ORDER BY ARTIST */}
              <div className="pt-4 border-t border-zinc-200">
                {!showCancelPrompt ? (
                  <button
                    type="button"
                    onClick={() => setShowCancelPrompt(true)}
                    className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                  >
                    Hủy bỏ đơn hàng này (Họa sĩ hủy)
                  </button>
                ) : (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                    <label className="block text-xs font-semibold text-rose-900">
                      Lý do hủy đơn hàng:
                    </label>
                    <textarea
                      rows={2}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Không đủ vật liệu hoặc khách đổi kế hoạch..."
                      className="w-full text-xs p-2 bg-white border border-rose-200 rounded-lg"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowCancelPrompt(false)}
                        className="px-3 py-1.5 text-xs text-zinc-600"
                      >
                        Đóng
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelOrder}
                        disabled={cancelSubmitting || !cancelReason.trim()}
                        className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
                      >
                        {cancelSubmitting ? 'Đang hủy...' : 'Xác Nhận Hủy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
