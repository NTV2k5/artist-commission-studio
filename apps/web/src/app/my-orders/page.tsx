'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowRight, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { fetchMyOrdersApi } from '@/lib/api';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function MyOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/my-orders');
      return;
    }

    if (status === 'authenticated' && session?.user?.backendToken) {
      fetchMyOrdersApi(session.user.backendToken)
        .then((data) => setOrders(data))
        .catch((err) => setError(err.message || 'Không thể tải danh sách đơn hàng'))
        .finally(() => setLoading(false));
    } else if (status === 'authenticated') {
      setLoading(false);
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#18181B] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 w-full">
        <div className="border-b border-zinc-200 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-medium text-zinc-900">
              Đơn Hàng Của Tôi
            </h1>
            <p className="text-xs text-zinc-500 font-sans tracking-wide uppercase mt-1">
              Quản lý tiến độ sáng tác & lịch sử thanh toán đặt cọc
            </p>
          </div>

          <Link
            href="/commission"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3E5C6E] hover:bg-[#2F4858] text-white text-xs uppercase tracking-wider font-semibold rounded-xl transition-all shadow-sm self-start sm:self-auto"
          >
            <span>Đặt Vẽ Tranh Mới</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-[#3E5C6E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="font-serif text-base text-zinc-600">Đang tải danh sách đơn hàng...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-xs text-rose-800">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-zinc-200 p-8 space-y-4">
            <ShoppingBag className="w-12 h-12 text-zinc-300 mx-auto" />
            <h3 className="font-serif text-xl text-zinc-800">Bạn Chưa Có Đơn Hàng Nào</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
              Hãy cấu hình kích thước và chất liệu mong muốn để nhận báo giá minh bạch và đặt cọc qua SePay VietQR.
            </p>
            <Link
              href="/commission"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#18181B] text-white text-xs uppercase tracking-wider font-medium rounded-xl hover:bg-zinc-800 transition-colors"
            >
              Khám Phá Công Cụ Định Giá & Đặt Vẽ
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.orderCode}`}
                className="block p-5 bg-white rounded-2xl border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-zinc-900 group-hover:text-[#3E5C6E] transition-colors">
                        #{order.orderCode}
                      </span>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          order.status === 'DEPOSIT_PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'AWAITING_DEPOSIT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600">
                      {order.serviceType === 'FRAMED_ART' ? 'Tranh đóng khung' : 'Bích họa tường'} &bull;{' '}
                      {order.widthCm}×{order.heightCm} cm &bull; {order.material?.name}
                    </p>

                    <span className="text-[11px] text-zinc-400 block">
                      Khởi tạo ngày: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <div className="text-left sm:text-right shrink-0 flex items-center sm:block justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100">
                    <div>
                      <span className="text-[11px] text-zinc-400 block sm:inline">Tổng đơn: </span>
                      <span className="font-serif text-base font-medium text-zinc-900">
                        {order.totalAmount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    {order.paidAmount > 0 && (
                      <span className="text-[10px] text-emerald-700 font-medium block">
                        Đã thanh toán: {order.paidAmount.toLocaleString('vi-VN')} đ
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
