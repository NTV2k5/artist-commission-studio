'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ArrowLeft, CheckCircle2, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (loginEmail: string, loginName?: string) => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await signIn('credentials', {
        email: loginEmail,
        name: loginName || loginEmail.split('@')[0],
        redirect: false,
      });

      if (res?.error) {
        setErrorMsg('Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
        setLoading(false);
        return;
      }

      // Check role or callback redirect
      if (loginEmail.toLowerCase().includes('artist')) {
        router.push(callbackUrl === '/' ? '/studio' : callbackUrl);
      } else {
        router.push(callbackUrl);
      }
      router.refresh();
    } catch {
      setErrorMsg('Đã xảy ra lỗi kết nối xác thực.');
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    handleLogin(email, name);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#18181B] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-zinc-500 hover:text-zinc-900 transition-colors mb-6 ml-2"
        >
          <ArrowLeft className="w-4 h-4" /> Về trang chủ
        </Link>

        {/* Brand Mark & Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#18181B] text-[#FAF9F6] font-serif text-2xl font-bold mb-3 shadow-md">
            QT
          </div>
          <h2 className="font-serif text-3xl font-normal tracking-tight text-zinc-900">
            Xác Thực Danh Tính
          </h2>
          <p className="mt-2 text-xs tracking-wider uppercase text-zinc-500 font-sans">
            Artist Commission Studio &bull; Không gian lưu trữ đơn & tác phẩm
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#F4F4F5] py-8 px-6 sm:px-10 rounded-2xl border border-zinc-200/80 shadow-sm space-y-6">
          {errorMsg && (
            <div className="flex items-center gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Demo Access Buttons */}
          <div className="space-y-3">
            <label className="block text-[11px] font-bold tracking-widest uppercase text-zinc-500">
              Đăng nhập nhanh thử nghiệm
            </label>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleLogin('artist@studio.vn', 'Họa sĩ Quốc Tuấn')}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#18181B] text-[#FAF9F6] rounded-xl hover:bg-zinc-800 transition-all font-sans text-xs font-medium group shadow-sm disabled:opacity-60"
            >
              <div className="flex items-center gap-3 text-left">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-semibold text-white">Họa sĩ Quản trị (Admin)</div>
                  <div className="text-[10px] text-zinc-400">artist@studio.vn (Quyền truy cập /studio)</div>
                </div>
              </div>
              <span className="text-[10px] tracking-wider uppercase bg-white/10 px-2 py-0.5 rounded text-zinc-300">
                Studio
              </span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleLogin('khachhang@gmail.com', 'Khách hàng Demo')}
              className="w-full flex items-center justify-between px-4 py-3 bg-white text-zinc-800 border border-zinc-300 rounded-xl hover:border-zinc-400 hover:bg-zinc-50 transition-all font-sans text-xs font-medium group disabled:opacity-60"
            >
              <div className="flex items-center gap-3 text-left">
                <UserCheck className="w-4 h-4 text-[#3E5C6E]" />
                <div>
                  <div className="font-semibold text-zinc-900">Khách hàng Đặt vẽ</div>
                  <div className="text-[10px] text-zinc-500">khachhang@gmail.com (Theo dõi & thanh toán cọc)</div>
                </div>
              </div>
              <span className="text-[10px] tracking-wider uppercase bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">
                Customer
              </span>
            </button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-300" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#F4F4F5] px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Hoặc nhập thông tin của bạn
              </span>
            </div>
          </div>

          {/* Form manual email input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-zinc-700 mb-1">
                Họ và tên của bạn
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#3E5C6E] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-zinc-700 mb-1">
                Địa chỉ Email <span className="text-rose-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#3E5C6E] focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full mt-2 py-3 bg-[#3E5C6E] hover:bg-[#2F4858] text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Đang xác thực...' : 'Tiếp tục vào Studio'}
            </button>
          </form>

          <div className="pt-2 border-t border-zinc-200/60 text-center">
            <p className="text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Tài khoản khách hàng được bảo mật và tự động đồng bộ hóa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#3E5C6E] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
