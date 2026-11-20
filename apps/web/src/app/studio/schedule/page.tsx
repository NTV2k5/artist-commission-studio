'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  CalendarDays,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  Layers,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { fetchStudioOrders } from '@/lib/api';

export default function StudioSchedulePage() {
  const { data: session, status } = useSession();
  const token =
    (session?.user as any)?.backendToken ||
    (session?.user as any)?.accessToken ||
    (session as any)?.accessToken;

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMuralOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchStudioOrders(
        {
          serviceType: 'WALL_MURAL',
          limit: 100,
        },
        token,
      );
      setOrders(res.items || []);
    } catch (err: any) {
      console.warn('Failed to load mural schedule:', err);
      setError(err.message || 'Không thể tải lịch thi công bích họa');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadMuralOrders();
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setError('Vui lòng đăng nhập với tài khoản Họa sĩ để xem lịch thi công.');
    }
  }, [status, loadMuralOrders]);

  // Identify all scheduled wall murals
  const scheduledOrders = orders.filter(
    (o) =>
      o.scheduledStartDate &&
      o.status !== 'CANCELLED' &&
      o.status !== 'COMPLETED',
  );

  // Detect overlapping date ranges
  const conflictMap = new Map<string, string[]>();

  for (let i = 0; i < scheduledOrders.length; i++) {
    for (let j = i + 1; j < scheduledOrders.length; j++) {
      const a = scheduledOrders[i];
      const b = scheduledOrders[j];

      const aStart = new Date(a.scheduledStartDate).getTime();
      const aEnd = new Date(a.scheduledEndDate || a.scheduledStartDate).getTime();
      const bStart = new Date(b.scheduledStartDate).getTime();
      const bEnd = new Date(b.scheduledEndDate || b.scheduledStartDate).getTime();

      if (aStart <= bEnd && aEnd >= bStart) {
        if (!conflictMap.has(a.id)) conflictMap.set(a.id, []);
        if (!conflictMap.has(b.id)) conflictMap.set(b.id, []);
        conflictMap.get(a.id)!.push(b.orderCode);
        conflictMap.get(b.id)!.push(a.orderCode);
      }
    }
  }

  const hasConflicts = conflictMap.size > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
          Lịch Thi Công Bích Họa Tường
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          Theo dõi lịch trình di chuyển, thi công thực tế tại công trình và kiểm soát trùng lịch
        </p>
      </div>

      {/* Red Alert Banner if conflicts detected */}
      {hasConflicts && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-sm space-y-2 text-rose-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <h3 className="text-sm font-bold uppercase tracking-wide">
              Cảnh Báo: Phát Hiện Trùng Lịch Thi Công Thực Tế
            </h3>
          </div>
          <p className="text-xs text-rose-700 leading-relaxed font-light">
            Có <strong>{conflictMap.size} dự án bích họa tường</strong> bị trùng lặp khoảng thời gian thi công.
            Họa sĩ cần liên hệ thỏa thuận lại ngày với khách hàng hoặc bố trí thêm thợ phụ tại công trình để bảo đảm chất lượng tác phẩm.
          </p>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#3E5C6E]" />
          <p className="text-xs text-zinc-500 font-sans">Đang kiểm tra lịch công trình...</p>
        </div>
      ) : error ? (
        <div className="bg-white p-8 rounded-2xl border border-zinc-200 text-center space-y-4 max-w-lg mx-auto">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs text-zinc-600 font-sans">{error}</p>
          <button
            type="button"
            onClick={loadMuralOrders}
            className="px-4 py-2 bg-[#18181B] text-white text-xs font-semibold rounded-xl"
          >
            Thử Lại
          </button>
        </div>
      ) : scheduledOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-zinc-200 text-center space-y-3">
          <CalendarDays className="w-12 h-12 text-zinc-300 mx-auto" />
          <h3 className="font-serif text-lg font-semibold text-zinc-800">
            Chưa có công trình bích họa nào được đặt lịch
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Khi có đơn đặt vẽ bích họa tường, họa sĩ có thể mở đơn trong mục <strong>Điều Phối Đơn Hàng</strong> để ấn định ngày thi công.
          </p>
          <Link
            href="/studio/orders?serviceType=WALL_MURAL"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3E5C6E] text-white rounded-xl text-xs font-semibold hover:bg-[#2F4858] transition-colors"
          >
            <span>Xem Các Đơn Bích Họa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scheduledOrders.map((ord) => {
            const conflicts = conflictMap.get(ord.id);
            const isConflicted = Boolean(conflicts && conflicts.length > 0);

            const startStr = new Date(ord.scheduledStartDate).toLocaleDateString('vi-VN');
            const endStr = ord.scheduledEndDate
              ? new Date(ord.scheduledEndDate).toLocaleDateString('vi-VN')
              : 'Chưa chốt';

            return (
              <div
                key={ord.id}
                className={`bg-white rounded-2xl border p-5 space-y-4 shadow-sm transition-all hover:shadow-md ${
                  isConflicted
                    ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-300'
                    : 'border-zinc-200/90'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <span className="font-mono font-bold text-sm text-zinc-900 block">
                      {ord.orderCode}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Khách: <strong>{ord.customer?.name}</strong>
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isConflicted
                        ? 'bg-rose-100 text-rose-800 animate-pulse'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isConflicted ? 'Trùng Lịch' : ord.status}
                  </span>
                </div>

                {/* Conflict Notice */}
                {isConflicted && (
                  <div className="p-2.5 bg-rose-100/80 rounded-xl text-[11px] text-rose-800 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                    <span>
                      Trùng ngày thi công với đơn: <strong>{conflicts?.join(', ')}</strong>
                    </span>
                  </div>
                )}

                {/* Date Range Badge */}
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-zinc-500 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-[#3E5C6E]" />
                    <span>Khoảng thời gian thi công:</span>
                  </div>
                  <span className="font-mono font-bold text-zinc-900 block text-xs">
                    {startStr} &rarr; {endStr}
                  </span>
                </div>

                {/* Specs */}
                <div className="space-y-1.5 text-xs text-zinc-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{ord.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>
                      Diện tích: <strong>{ord.widthCm} × {ord.heightCm} cm</strong> ({((ord.widthCm * ord.heightCm) / 10000).toFixed(1)} m²)
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2 border-t border-zinc-100 flex justify-end">
                  <Link
                    href={`/studio/orders?orderCode=${ord.orderCode}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#18181B] text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-colors"
                  >
                    <span>Mở Điều Chỉnh</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
