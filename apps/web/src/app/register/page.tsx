'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ArrowLeft, CheckCircle2, ShieldAlert, UserPlus, Lock, Mail, User, Phone } from 'lucide-react';
import { registerApi } from '@/lib/api';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setErrorMsg('Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có độ dài tối thiểu 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Call backend registration endpoint
      await registerApi({
        email,
        password,
        name,
        phone: phone || undefined,
      });

      // 2. Automatically log in through NextAuth credentials
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        // In case signIn has an issue, redirect to login
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}&registered=true`);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng ký tài khoản không thành công. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl });
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
            Tạo Tài Khoản Mới
          </h2>
          <p className="mt-2 text-xs tracking-wider uppercase text-zinc-500 font-sans">
            Artist Commission Studio &bull; Lưu tiến trình đặt vẽ & bảo chứng
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

          {/* Form manual registration */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reg-name" className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span>Họ và tên của bạn <span className="text-rose-500">*</span></span>
              </label>
              <input
                id="reg-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#3E5C6E] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                <span>Địa chỉ Email <span className="text-rose-500">*</span></span>
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#3E5C6E] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="reg-phone" className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                <span>Số điện thoại / Zalo</span>
              </label>
              <input
                id="reg-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0987654321"
                className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#3E5C6E] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Mật khẩu bảo mật <span className="text-rose-500">*</span></span>
              </label>
              <input
                id="reg-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#3E5C6E] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="reg-confirm-password" className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Xác nhận mật khẩu <span className="text-rose-500">*</span></span>
              </label>
              <input
                id="reg-confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#3E5C6E] focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-[#3E5C6E] hover:bg-[#2F4858] text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Đang tạo tài khoản...' : 'Đăng Ký Tài Khoản'}</span>
            </button>
          </form>

          {/* Social Google Login Button */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-300" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#F4F4F5] px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Hoặc kết nối qua Google
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white text-zinc-700 border border-zinc-300 rounded-xl hover:bg-zinc-50 transition-all font-sans text-xs font-medium shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Đăng ký nhanh với tài khoản Google</span>
          </button>

          {/* Switch to Login */}
          <div className="pt-2 border-t border-zinc-200/60 text-center space-y-2">
            <p className="text-xs text-zinc-600">
              Đã có tài khoản trên Studio?{' '}
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                className="font-semibold text-[#3E5C6E] hover:underline"
              >
                Đăng nhập ngay
              </Link>
            </p>
            <p className="text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Bảo mật danh tính & mã QR giao dịch theo chuẩn SePay.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#3E5C6E] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
