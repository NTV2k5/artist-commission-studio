'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  AlertCircle,
  ShieldCheck,
  Phone,
  Sparkles,
  ExternalLink,
  Ban,
  MessageSquare,
  Truck,
  Palette,
  FileCheck2,
  Layers,
} from 'lucide-react';
import { fetchOrderByCode, cancelOrderApi } from '@/lib/api';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { OrderWorkspaceChat } from '@/components/chat/OrderWorkspaceChat';

interface OrderPageProps {
  params: Promise<{
    orderCode: string;
  }>;
}

export default function OrderDetailPage({ params }: OrderPageProps) {
  const resolvedParams = use(params);
  const orderCode = resolvedParams.orderCode;
  const { data: session } = useSession();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Copy buttons state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Cancellation state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  // Socket connection
  useEffect(() => {
    let socket: Socket | null = null;

    const loadOrder = async () => {
      try {
        setLoading(true);
        const data = await fetchOrderByCode(orderCode);
        setOrder(data);
      } catch (err: any) {
        setError(err.message || 'Không thể tải thông tin đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();

    // Connect to WebSockets
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';
    try {
      socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        socket?.emit('join_order', { orderCode });
      });

      socket.on('payment_confirmed', (payload: any) => {
        // Confetti burst
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });

        // Update local order state
        setOrder((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            paidAmount: payload.paidAmount,
            status: payload.status,
          };
        });
      });

      socket.on('order_updated', (payload: any) => {
        setOrder((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: payload.status,
            paidAmount: payload.paidAmount ?? prev.paidAmount,
            cancellationReason: payload.cancellationReason ?? prev.cancellationReason,
          };
        });
      });
    } catch (e) {
      console.warn('Socket connection error:', e);
    }

    return () => {
      if (socket) {
        socket.emit('leave_order', { orderCode });
        socket.disconnect();
      }
    };
  }, [orderCode]);

  // Copy helper
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Self cancellation handler
  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setCancelling(true);
    setCancelError('');

    try {
      const updated = await cancelOrderApi(orderCode, cancelReason);
      setOrder(updated);
      setShowCancelModal(false);
    } catch (err: any) {
      setCancelError(err.message || 'Không thể hủy đơn hàng');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#3E5C6E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-lg text-zinc-700">Đang tải phòng làm việc đơn hàng #{orderCode}...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-center items-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="font-serif text-2xl text-zinc-900">Không Tìm Thấy Đơn Hàng</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Mã đơn hàng <strong>{orderCode}</strong> không tồn tại hoặc đã bị xóa khỏi hệ thống.
          </p>
          <Link
            href="/commission"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3E5C6E] text-white text-xs uppercase tracking-wider font-semibold rounded-xl"
          >
            Tạo Đơn Hàng Mới
          </Link>
        </div>
      </div>
    );
  }

  // Bank transfer info
  const bankConfig = {
    bankName: process.env.NEXT_PUBLIC_SEPAY_BANK_NAME || 'MBBank',
    accountNumber: process.env.NEXT_PUBLIC_SEPAY_ACCOUNT_NO || '0326163413',
    accountName: process.env.NEXT_PUBLIC_SEPAY_ACCOUNT_NAME || 'NGUYEN TAN VIET',
  };

  const isAwaitingDeposit =
    order.status === 'AWAITING_DEPOSIT' ||
    (order.status === 'PENDING_QUOTE' && order.requireDeposit);
  const isDepositPaid =
    order.status === 'DEPOSIT_PAID' ||
    order.status === 'SKETCHING' ||
    order.status === 'PAINTING' ||
    order.status === 'DELIVERING' ||
    order.status === 'COMPLETED';

  // Amount to show in VietQR
  const qrAmount = order.requireDeposit
    ? Math.max(0, order.depositAmount - order.paidAmount)
    : Math.max(0, order.totalAmount - order.paidAmount);

  const transferContent = `DH${order.orderCode.replace(/^DH/i, '')}`;
  const vietQrUrl = `https://qr.sepay.vn/img?acc=${bankConfig.accountNumber}&bank=${bankConfig.bankName}&amount=${qrAmount}&des=${transferContent}`;

  const canSelfCancel =
    (order.status === 'PENDING_QUOTE' || order.status === 'AWAITING_DEPOSIT') &&
    order.paidAmount === 0;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#18181B] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 w-full">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pb-6 border-b border-zinc-200">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Về Bộ Sưu Tập
          </Link>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 block">
              Mã Đơn Hàng Duy Nhất
            </span>
            <span className="font-mono font-bold text-lg text-zinc-900">{order.orderCode}</span>
          </div>
        </div>

        {/* Order Status Banner */}
        <div className="mt-8 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-xs uppercase tracking-wider font-semibold text-zinc-500">
                Trạng thái đơn:
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  order.status === 'DEPOSIT_PAID'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : order.status === 'AWAITING_DEPOSIT'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                    : order.status === 'PENDING_QUOTE'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : order.status === 'SKETCHING' || order.status === 'PAINTING'
                    ? 'bg-purple-100 text-purple-800 border border-purple-300'
                    : order.status === 'CANCELLED'
                    ? 'bg-zinc-100 text-zinc-600 border border-zinc-300'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {order.status === 'AWAITING_DEPOSIT' && 'Chờ thanh toán tiền cọc'}
                {order.status === 'DEPOSIT_PAID' && 'Đã nhận cọc - Chuẩn bị phác thảo'}
                {order.status === 'PENDING_QUOTE' && 'Chờ duyệt ảnh mẫu & báo giá'}
                {order.status === 'SKETCHING' && 'Đang lên phác thảo ý tưởng'}
                {order.status === 'PAINTING' && 'Đang vẽ tác phẩm chính thức'}
                {order.status === 'DELIVERING' && 'Đang vận chuyển / thi công'}
                {order.status === 'COMPLETED' && 'Đã hoàn thành & nghiệm thu'}
                {order.status === 'CANCELLED' && 'Đã hủy'}
              </span>
            </div>
            <p className="text-xs text-zinc-600 font-light">
              Khách hàng: <strong>{order.customer?.name}</strong> &bull; Email: {order.customer?.email}
            </p>
          </div>

          {/* Self-Cancel or Action */}
          <div>
            {canSelfCancel ? (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Hủy Đơn Hàng Này</span>
              </button>
            ) : order.status === 'CANCELLED' ? (
              <span className="text-xs text-zinc-400 italic">
                Lý do hủy: {order.cancellationReason || 'Không có'}
              </span>
            ) : (
              <span className="text-[11px] text-zinc-400 italic">
                Đơn đã vào chu trình sáng tác (không thể tự hủy).
              </span>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: VietQR Payment Box or Confirmed Banner */}
          <div className="lg:col-span-7 space-y-6">
            {isAwaitingDeposit && qrAmount > 0 && order.status !== 'CANCELLED' ? (
              <div className="bg-[#18181B] text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-zinc-800 space-y-6">
                <div className="border-b border-zinc-800 pb-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#B45309] font-bold block">
                      Thanh Toán Trực Tiếp VietQR (SePay)
                    </span>
                    <h3 className="font-sans text-2xl font-semibold text-white tracking-tight">
                      Quét Mã Chuyển Khoản Tiền Cọc
                    </h3>
                  </div>
                  <span className="text-xs font-mono bg-white/10 px-3 py-1 rounded-full text-zinc-300">
                    Auto-Match 24/7
                  </span>
                </div>

                {/* QR Code and Instructions */}
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  {/* VietQR Dynamic Image */}
                  <div className="bg-white p-3 rounded-xl border border-zinc-300 shrink-0 shadow-lg text-center">
                    <Image
                      src={vietQrUrl}
                      alt="VietQR SePay Transfer"
                      width={224}
                      height={224}
                      unoptimized
                      className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                    />
                    <span className="text-[10px] text-zinc-500 font-sans tracking-wide block mt-1">
                      Mở App ngân hàng quét mã
                    </span>
                  </div>

                  {/* Transfer Details with One-click Copy */}
                  <div className="space-y-3.5 w-full text-xs">
                    {/* Bank */}
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Ngân hàng</span>
                        <span className="font-semibold text-white">{bankConfig.bankName}</span>
                      </div>
                      <span className="text-[11px] text-zinc-400">{bankConfig.accountName}</span>
                    </div>

                    {/* Account Number */}
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Số tài khoản</span>
                        <span className="font-mono text-sm font-bold text-white tracking-wider">
                          {bankConfig.accountNumber}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(bankConfig.accountNumber, 'account')}
                        className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                        title="Sao chép số tài khoản"
                      >
                        {copiedField === 'account' ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Amount */}
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Số tiền cọc chính xác</span>
                        <span className="font-sans text-lg font-bold tabular-nums text-amber-400 tracking-tight">
                          {qrAmount.toLocaleString('vi-VN')} VNĐ
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(qrAmount.toString(), 'amount')}
                        className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                        title="Sao chép số tiền"
                      >
                        {copiedField === 'amount' ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Transfer Note (Mandatory) */}
                    <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/30 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-amber-300 uppercase tracking-wider font-semibold block">
                          Nội dung chuyển khoản (Bắt buộc giữ nguyên)
                        </span>
                        <span className="font-mono text-sm font-bold text-amber-400 tracking-wider">
                          {transferContent}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(transferContent, 'note')}
                        className="p-1.5 hover:bg-amber-500/20 rounded text-amber-300 transition-colors"
                        title="Sao chép nội dung chuyển khoản"
                      >
                        {copiedField === 'note' ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Real-time Listening Alert */}
                <div className="pt-2 border-t border-zinc-800 flex items-center gap-3 text-xs text-zinc-400">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span>
                    Hệ thống đang tự động lắng nghe giao dịch SePay VietQR. Màn hình sẽ tự động cập nhật ngay khi bạn hoàn tất chuyển khoản.
                  </span>
                </div>
              </div>
            ) : isDepositPaid ? (
              <div className="bg-emerald-50 border border-emerald-200 p-6 sm:p-8 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center gap-3 text-emerald-800">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-serif text-2xl font-normal">Đã Ghi Nhận Thanh Toán Cọc</h3>
                    <p className="text-xs text-emerald-700">
                      Khoản cọc <strong className="font-sans font-bold tabular-nums">{order.depositAmount.toLocaleString('vi-VN')} đ</strong> đã được xác nhận thành công qua SePay VietQR.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-emerald-100 text-xs text-zinc-700 space-y-2">
                  <div className="flex justify-between">
                    <span>Tổng chi phí đơn hàng:</span>
                    <span className="font-sans font-bold tabular-nums">{order.totalAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tổng đã thanh toán:</span>
                    <span className="font-sans font-bold tabular-nums text-emerald-700">
                      {order.paidAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-100 pt-2 font-medium">
                    <span>Số tiền còn lại khi bàn giao:</span>
                    <span className="font-sans font-bold tabular-nums text-zinc-900">
                      {Math.max(0, order.totalAmount - order.paidAmount).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                <p className="text-xs text-emerald-800 leading-relaxed">
                  Họa sĩ Quốc Tuấn đang tiến hành các bước chuẩn bị chất liệu và phác thảo sơ bộ. Bạn có thể theo dõi tiến độ hoặc trao đổi trực tiếp trong phòng làm việc này.
                </p>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-3">
                <h3 className="font-serif text-xl font-medium text-zinc-900">Trạng Thái Đơn Hàng</h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Đơn hàng đang ở trạng thái <strong>{order.status}</strong>. Mọi biến động thanh toán hoặc thay đổi phác thảo sẽ được thông báo ngay tại đây.
                </p>
              </div>
            )}

            {/* Realtime Order Workspace Chat */}
            <OrderWorkspaceChat
              orderCode={order.orderCode}
              orderId={order.id}
              customerId={order.customerId}
              currentUser={
                session?.user
                  ? {
                      id: (session.user as any).id,
                      name: session.user.name || undefined,
                      email: session.user.email || undefined,
                      role: (session.user as any).role || 'CUSTOMER',
                      avatarUrl: session.user.image,
                      backendToken: (session.user as any).backendToken,
                    }
                  : null
              }
              orderStatus={order.status}
              revisionCount={order.revisionCount || 0}
              sketchApprovedAt={order.sketchApprovedAt}
              onOrderUpdated={(updated) => {
                setOrder((prev: any) => ({
                  ...prev,
                  ...updated,
                }));
              }}
            />
          </div>

          {/* Right Column: Order Summary & Specifications */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-5 text-xs">
              <div className="border-b border-zinc-200 pb-3">
                <h4 className="font-serif text-xl font-medium text-zinc-900">
                  Thông Số Tác Phẩm
                </h4>
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider">
                  Cấu hình chi tiết đã lưu trên hệ thống
                </span>
              </div>

              {/* Template or Custom Images Preview */}
              {order.template && (
                <div className="flex items-center gap-3 p-3 bg-[#F4F4F5] rounded-xl border border-zinc-200">
                  {order.template.images?.[0] && (
                    <div className="relative w-14 h-14 rounded overflow-hidden shrink-0 border border-zinc-300">
                      <Image
                        src={order.template.images[0]}
                        alt={order.template.title}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <span className="font-serif text-sm font-semibold text-zinc-900 block">
                      {order.template.title}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Loại hình: {order.serviceType === 'FRAMED_ART' ? 'Tranh đóng khung' : 'Bích họa tường'}
                    </span>
                  </div>
                </div>
              )}

              {order.customReferenceUrls && order.customReferenceUrls.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-zinc-700 block">
                    Ảnh mẫu khách hàng cung cấp:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {order.customReferenceUrls.map((url: string, i: number) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="relative block aspect-video rounded overflow-hidden border border-zinc-200 hover:opacity-90 transition-opacity"
                      >
                        <Image src={url} alt={`Ref ${i + 1}`} fill sizes="100px" className="object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Specifications List */}
              <div className="space-y-2.5 text-zinc-600 font-light divide-y divide-zinc-100">
                <div className="flex justify-between pt-1">
                  <span>Kích thước đặt vẽ:</span>
                  <span className="font-semibold text-zinc-900 font-mono">
                    {order.widthCm} × {order.heightCm} cm
                  </span>
                </div>

                <div className="flex justify-between pt-2">
                  <span>Chất liệu hội họa:</span>
                  <span className="font-semibold text-zinc-900">{order.material?.name}</span>
                </div>

                <div className="flex justify-between pt-2">
                  <span>Độ phức tạp nét cọ:</span>
                  <span className="font-semibold text-zinc-900">{order.complexity}</span>
                </div>

                {order.frameOption && (
                  <div className="flex justify-between pt-2">
                    <span>Khung tranh:</span>
                    <span className="font-semibold text-zinc-900">{order.frameOption}</span>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <span>Địa chỉ giao tranh / thi công:</span>
                  <span className="font-semibold text-zinc-900 text-right max-w-[200px] truncate">
                    {order.address}
                  </span>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="border-t border-zinc-200 pt-4 space-y-2">
                <div className="flex justify-between text-zinc-600">
                  <span>Tiền vẽ & hoàn thiện tranh:</span>
                  <span className="font-mono">{order.artworkPrice.toLocaleString('vi-VN')} đ</span>
                </div>

                <div className="flex justify-between text-zinc-600">
                  <span>Phí giao hàng / đi lại ({order.distanceKm}km):</span>
                  <span className="font-mono">{order.shippingOrTravelFee.toLocaleString('vi-VN')} đ</span>
                </div>

                <div className="flex justify-between font-bold text-sm text-zinc-900 pt-2 border-t border-zinc-100">
                  <span>Tổng giá trị đơn hàng:</span>
                  <span className="font-sans font-bold tabular-nums text-lg text-[#3E5C6E] tracking-tight">
                    {order.totalAmount.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>

                {order.requireDeposit && (
                  <div className="flex justify-between font-medium text-amber-700 pt-1">
                    <span>Khoản cọc bắt buộc:</span>
                    <span className="font-mono">{order.depositAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
              </div>
            </div>

            {/* Support Hotline Widget */}
            <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-zinc-200/80 text-xs space-y-3">
              <span className="font-semibold text-zinc-800 block">Cần hỗ trợ trực tiếp từ Họa sĩ?</span>
              <p className="text-zinc-500 font-light leading-relaxed">
                Nếu bạn đã chuyển khoản nhưng chưa thấy màn hình cập nhật hoặc muốn trao đổi về ý tưởng tranh, vui lòng liên hệ ngay:
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="tel:0987654321"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#18181B] text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>0987 654 321</span>
                </a>
                <a
                  href={`https://zalo.me/0987654321?text=${encodeURIComponent(`Xin chào Họa sĩ Quốc Tuấn, tôi muốn hỏi về đơn hàng ${order.orderCode}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3E5C6E] text-white rounded-xl font-medium hover:bg-[#2F4858] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Chat Zalo</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Self Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-zinc-200 space-y-4">
            <h3 className="font-serif text-xl font-medium text-zinc-900">
              Xác Nhận Hủy Đơn Hàng
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Bạn chỉ có thể tự hủy đơn hàng trước khi thanh toán cọc. Sau khi hủy, đơn hàng sẽ không thể mở lại.
            </p>

            {cancelError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                {cancelError}
              </p>
            )}

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Lý do hủy đơn hàng:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tôi muốn đổi kích thước hoặc kế hoạch thay đổi..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full text-xs p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E5C6E]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 text-xs text-zinc-600 hover:text-zinc-900 font-medium"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={cancelling || !cancelReason}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {cancelling ? 'Đang hủy...' : 'Xác Nhận Hủy Đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
