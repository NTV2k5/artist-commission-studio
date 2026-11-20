'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Activity,
  Database,
  HardDrive,
  Cpu,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { fetchStudioHealth, fetchStudioSepayLogs, reconcileStudioSepay } from '@/lib/api';

export default function StudioMonitoringPage() {
  const { data: session, status } = useSession();
  const token =
    (session?.user as any)?.backendToken ||
    (session?.user as any)?.accessToken ||
    (session as any)?.accessToken;

  const [health, setHealth] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Reconciliation state: transactionId -> orderCode input
  const [reconcileInputs, setReconcileInputs] = useState<Record<string, string>>({});
  const [reconcileLoading, setReconcileLoading] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [healthRes, logsRes] = await Promise.all([
        fetchStudioHealth(token),
        fetchStudioSepayLogs(filterStatus !== 'ALL' ? filterStatus : undefined, token),
      ]);
      setHealth(healthRes);
      setLogs(logsRes);
    } catch (err: any) {
      console.warn('Failed to load monitoring data:', err);
      setError(err.message || 'Không thể tải dữ liệu giám sát hệ thống');
    } finally {
      setLoading(false);
    }
  }, [token, filterStatus]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setError('Vui lòng đăng nhập với tài khoản Họa sĩ để xem trạng thái hệ thống.');
    }
  }, [status, loadData]);

  const handleReconcile = async (txId: string) => {
    const orderCode = reconcileInputs[txId]?.trim();
    if (!orderCode) {
      alert('Vui lòng nhập mã đơn hàng (ví dụ: DH123456) để đối soát');
      return;
    }

    try {
      setReconcileLoading((prev) => ({ ...prev, [txId]: true }));
      const res = await reconcileStudioSepay(txId, orderCode, token);
      alert(res.message || 'Đối soát giao dịch thành công!');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi đối soát giao dịch');
    } finally {
      setReconcileLoading((prev) => ({ ...prev, [txId]: false }));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            Giám Sát Hệ Thống & Giao Dịch SePay
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Theo dõi trạng thái hạ tầng (Database, Redis, Storage) và quản lý đối soát dòng tiền VietQR tự động
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
          <span>Làm mới trạng thái</span>
        </button>
      </div>

      {/* 4 Health Service Cards */}
      {health && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Service 1: PostgreSQL */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                Cơ sở dữ liệu
              </span>
              <Database className="w-4 h-4 text-[#3E5C6E]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-zinc-900 text-sm">PostgreSQL</span>
            </div>
            <span className="text-[11px] text-zinc-500 block">
              Trạng thái: <strong>{health.services.database.status}</strong> (Prisma ORM)
            </span>
          </div>

          {/* Service 2: Redis & WebSockets */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                Cache & WebSockets
              </span>
              <Activity className="w-4 h-4 text-[#B45309]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-zinc-900 text-sm">Redis & Socket.io</span>
            </div>
            <span className="text-[11px] text-zinc-500 block">
              Realtime chat & Gateway: <strong>Hoạt động</strong>
            </span>
          </div>

          {/* Service 3: File Storage */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                Lưu trữ ảnh
              </span>
              <HardDrive className="w-4 h-4 text-zinc-700" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-zinc-900 text-sm">
                {health.services.storage.mode}
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 block">
              {health.services.storage.localFilesCount} file tĩnh ({health.services.storage.localDiskSizeMb} MB)
            </span>
          </div>

          {/* Service 4: Gemini AI & SePay */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                Cổng thanh toán & AI
              </span>
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  health.services.integrations.sepayVietQr.configured
                    ? 'bg-emerald-500'
                    : 'bg-amber-400'
                }`}
              />
              <span className="font-semibold text-zinc-900 text-sm">
                SePay ({health.services.integrations.sepayVietQr.bank})
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 block">
              Gemini AI: <strong>{health.services.integrations.geminiAi.configured ? 'Active' : 'Simulation'}</strong>
            </span>
          </div>
        </div>
      )}

      {/* SEPAY WEBHOOK LOGS & 1-CLICK RECONCILIATION */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm overflow-hidden text-xs">
        {/* Table Filter Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-base font-semibold text-zinc-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#3E5C6E]" />
              <span>Nhật Ký Giao Dịch SePay VietQR</span>
            </h3>
            <span className="text-[11px] text-zinc-400">
              Đối soát thủ công 1-click cho các giao dịch khách hàng gõ nhầm mã đơn hàng
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500 font-medium">Lọc trạng thái:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 bg-zinc-100 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-700"
            >
              <option value="ALL">Tất cả giao dịch ({logs.length})</option>
              <option value="UNMATCHED_REVIEW">Cần đối soát (UNMATCHED)</option>
              <option value="MATCHED">Đã khớp lệnh (MATCHED)</option>
            </select>
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#3E5C6E]" />
            <p className="text-zinc-400 text-xs font-sans">Đang tải lịch sử giao dịch SePay...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertTriangle className="w-6 h-6 text-rose-500 mx-auto" />
            <p className="text-xs text-zinc-600 font-sans">{error}</p>
            <button
              type="button"
              onClick={loadData}
              className="px-4 py-1.5 bg-[#18181B] text-white text-xs font-semibold rounded-xl"
            >
              Thử Lại
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 italic">
            Chưa có giao dịch SePay nào được ghi nhận.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#FAF9F6] border-b border-zinc-200 text-zinc-500 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Mã Giao Dịch</th>
                  <th className="py-3 px-4 text-right">Số Tiền</th>
                  <th className="py-3 px-4">Nội Dung Chuyển Khoản</th>
                  <th className="py-3 px-4">Thời Gian</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4">Đơn Hàng Khớp</th>
                  <th className="py-3 px-4 text-right">Thao Tác Đối Soát</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {logs.map((tx) => {
                  const isMatched = tx.status === 'MATCHED';

                  return (
                    <tr key={tx.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-zinc-900">
                        {tx.sepayTxId}
                      </td>

                      <td className="py-3 px-4 text-right font-sans font-bold tabular-nums text-emerald-700 text-sm">
                        +{tx.amount.toLocaleString('vi-VN')} đ
                      </td>

                      <td className="py-3 px-4 font-mono text-zinc-800 font-medium">
                        {tx.transferContent}
                      </td>

                      <td className="py-3 px-4 text-zinc-500 text-[11px]">
                        {new Date(tx.createdAt).toLocaleString('vi-VN')}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isMatched
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800 animate-pulse'
                          }`}
                        >
                          {isMatched ? 'Khớp lệnh 24/7' : 'Chờ đối soát'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {tx.order ? (
                          <div className="text-[11px]">
                            <span className="font-mono font-bold text-zinc-900 block">
                              #{tx.order.orderCode}
                            </span>
                            <span className="text-zinc-500">{tx.order.customer?.name}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic text-[11px]">Chưa gán</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isMatched ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đã cộng tiền</span>
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <input
                              type="text"
                              placeholder="Mã đơn DH..."
                              value={reconcileInputs[tx.id] || ''}
                              onChange={(e) =>
                                setReconcileInputs({
                                  ...reconcileInputs,
                                  [tx.id]: e.target.value.toUpperCase(),
                                })
                              }
                              className="w-28 p-1.5 bg-zinc-100 border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900"
                            />
                            <button
                              type="button"
                              onClick={() => handleReconcile(tx.id)}
                              disabled={reconcileLoading[tx.id]}
                              className="px-3 py-1.5 bg-[#B45309] hover:bg-amber-800 text-white rounded-lg font-semibold text-[11px] transition-colors disabled:opacity-50"
                            >
                              {reconcileLoading[tx.id] ? 'Đang gán...' : 'Đối Soát'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
