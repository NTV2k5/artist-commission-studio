'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { StudioSidebar } from '@/components/studio/StudioSidebar';
import { Menu, ShieldAlert, LogIn, ArrowLeft, Loader2 } from 'lucide-react';

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  // 1. Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#18181B] flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-[#3E5C6E] border-t-amber-400 rounded-full animate-spin mx-auto" />
          <p className="font-serif text-lg tracking-wide text-zinc-300">
            Đang xác thực quyền Họa sĩ quản trị xưởng...
          </p>
        </div>
      </div>
    );
  }

  // 2. Permission check: Strictly allow only ARTIST role
  const isArtist = session?.user && (session.user as any).role === 'ARTIST';

  if (!session || !isArtist) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-zinc-200 shadow-xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-zinc-900">
              Khu Vực Quản Trị Khép Kín
            </h2>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              Phân hệ <strong>/studio</strong> được bảo mật tuyệt đối, chỉ dành riêng cho tài khoản
              Họa sĩ quản trị xưởng tranh.
            </p>
          </div>

          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-[11px] text-zinc-600">
            Tài khoản hiện tại:{' '}
            <strong>{session?.user?.email || 'Chưa đăng nhập'}</strong>
            <span className="block text-[10px] text-zinc-400 mt-0.5">
              (Role: {(session?.user as any)?.role || 'GUEST'})
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về Trang Chủ</span>
            </Link>

            <Link
              href="/login?callbackUrl=/studio"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#18181B] text-white text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập Họa Sĩ</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Render Studio Dashboard Layout
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#18181B] flex">
      {/* Sidebar Component */}
      <StudioSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-zinc-200 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#B45309] font-bold block">
                Bảng Điều Hành Họa Sĩ
              </span>
              <h1 className="font-serif text-lg sm:text-xl font-semibold text-zinc-900 leading-tight">
                Quoc Tuan Art Atelier Studio
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Hệ thống trực tuyến 24/7
            </span>
          </div>
        </header>

        {/* Child Pages Content Container */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
