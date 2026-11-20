'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  TrendingUp,
  CreditCard,
  Banknote,
  PackageCheck,
  AlertTriangle,
  ArrowRight,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { fetchStudioAnalytics } from '@/lib/api';

export default function StudioOverviewPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.backendToken;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchStudioAnalytics(token);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, loadData]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#3E5C6E]" />
        <p className="text-xs text-zinc-500 font-serif">
          Đang tính toán doanh thu và chỉ số tài chính xưởng vẽ...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-zinc-200 text-center space-y-4 max-w-lg mx-auto">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-xs text-zinc-600">{error || 'Có lỗi xảy ra'}</p>
        <button
          type="button"
          onClick={loadData}
          className="px-4 py-2 bg-[#18181B] text-white text-xs font-semibold rounded-xl"
        >
          Thử Lại
        </button>
      </div>
    );
  }

  const { kpi, monthlyRevenue, urgentOrders } = data;

  const maxMonthlyRevenue = Math.max(
    ...monthlyRevenue.map((m: any) => m.revenue),
    10000000,
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Title & Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            Tổng Quan Doanh Thu & Chỉ Số Xưởng
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Số liệu tài chính thực tế cập nhật tự động từ cổng SePay VietQR và đơn hàng
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
          <span>Làm mới số liệu</span>
        </button>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tổng Doanh Thu */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-400">
              Tổng Doanh Thu Đơn Hàng
            </span>
            <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
              <TrendingUp className="w-4 h-4 text-[#3E5C6E]" />
            </div>
          </div>
          <div>
            <span className="font-sans font-bold text-2xl text-zinc-900 tabular-nums tracking-tight block">
              {kpi.totalRevenue.toLocaleString('vi-VN')} đ
            </span>
            <span className="text-[10px] text-zinc-400 mt-0.5 block">
              {kpi.totalOrdersCount} đơn hàng đã khởi tạo
            </span>
          </div>
        </div>

        {/* KPI 2: Đã Thu Qua SePay QR */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-700">
              Đã Thu Qua SePay QR
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="font-sans font-bold text-2xl text-emerald-700 tabular-nums tracking-tight block">
              {kpi.sepayCollected.toLocaleString('vi-VN')} đ
            </span>
            <span className="text-[10px] text-emerald-600/80 mt-0.5 block flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Tự động khớp lệnh 24/7
            </span>
          </div>
        </div>

        {/* KPI 3: Công Nợ Tiền Mặt Còn Phải Thu */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-amber-700">
              Tiền Mặt Còn Phải Thu
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="font-sans font-bold text-2xl text-amber-800 tabular-nums tracking-tight block">
              {kpi.cashRemainingToCollect.toLocaleString('vi-VN')} đ
            </span>
            <span className="text-[10px] text-amber-700/80 mt-0.5 block">
              Thu khi giao tranh / thi công xong
            </span>
          </div>
        </div>

        {/* KPI 4: Đơn Đang Thực Hiện */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-[#3E5C6E]">
              Đơn Đang Thực Hiện
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#3E5C6E]/10 flex items-center justify-center text-[#3E5C6E]">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="font-sans font-bold text-2xl text-zinc-900 tabular-nums tracking-tight block">
              {kpi.activeOrdersCount}
            </span>
            <span className="text-[10px] text-zinc-400 mt-0.5 block">
              Cần {kpi.pendingQuotesCount} báo giá &bull; {kpi.awaitingDepositCount} chờ cọc
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Monthly Chart & Urgent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Monthly Revenue Bar Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-zinc-200/90 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <h3 className="font-serif text-lg font-semibold text-zinc-900">
                Biểu Đồ Doanh Thu Theo Tháng
              </h3>
              <span className="text-[11px] text-zinc-400">
                Lịch sử doanh thu 6 tháng gần nhất của xưởng
              </span>
            </div>
            <span className="text-xs font-mono text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-lg">
              Đơn vị: VNĐ
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="space-y-4 pt-2">
            {monthlyRevenue.map((item: any) => {
              const percentage = Math.max(
                4,
                Math.round((item.revenue / maxMonthlyRevenue) * 100),
              );

              return (
                <div key={item.month} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-zinc-700">{item.month}</span>
                    <span className="font-sans font-bold tabular-nums text-zinc-900">
                      {item.revenue.toLocaleString('vi-VN')} đ{' '}
                      <span className="text-zinc-400 font-normal text-[11px]">
                        ({item.count} đơn)
                      </span>
                    </span>
                  </div>
                  <div className="h-4 bg-zinc-100 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[#3E5C6E] to-[#B45309] rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Urgent Attention Orders (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-zinc-200/90 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="font-serif text-lg font-semibold text-zinc-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Đơn Cần Xử Lý Gấp</span>
              </h3>
              <span className="text-[11px] text-zinc-400">
                Chờ chốt báo giá hoặc gửi phác thảo
              </span>
            </div>
            <Link
              href="/studio/orders"
              className="text-xs font-semibold text-[#3E5C6E] hover:underline"
            >
              Xem tất cả
            </Link>
          </div>

          <div className="space-y-3">
            {urgentOrders.length === 0 ? (
              <p className="text-xs text-zinc-400 italic text-center py-6">
                Không có đơn hàng nào cần xử lý gấp lúc này.
              </p>
            ) : (
              urgentOrders.map((ord: any) => (
                <Link
                  key={ord.id}
                  href={`/studio/orders?orderCode=${ord.orderCode}`}
                  className="group block p-3.5 bg-zinc-50 hover:bg-zinc-100/80 rounded-xl border border-zinc-200/70 transition-all text-xs"
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="font-mono font-bold text-zinc-900 group-hover:text-[#3E5C6E] transition-colors">
                      {ord.orderCode}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        ord.status === 'PENDING_QUOTE'
                          ? 'bg-rose-100 text-rose-800'
                          : ord.status === 'AWAITING_DEPOSIT'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {ord.status === 'PENDING_QUOTE' && 'Chờ báo giá'}
                      {ord.status === 'AWAITING_DEPOSIT' && 'Chờ khách cọc'}
                      {ord.status === 'SKETCHING' && 'Cần lên phác thảo'}
                    </span>
                  </div>

                  <div className="flex justify-between text-zinc-600">
                    <span>Khách: {ord.customer?.name}</span>
                    <span className="font-sans font-bold tabular-nums text-zinc-900">
                      {ord.totalAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
