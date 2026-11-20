'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Layers,
  CalendarDays,
  Palette,
  Activity,
  ArrowUpRight,
  LogOut,
  ShieldCheck,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    href: '/studio',
    label: 'Tổng Quan Doanh Thu',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/studio/orders',
    label: 'Điều Phối Đơn Hàng',
    icon: Layers,
  },
  {
    href: '/studio/schedule',
    label: 'Lịch Thi Công Tường',
    icon: CalendarDays,
  },
  {
    href: '/studio/catalog',
    label: 'CMS Tranh & Bảng Giá',
    icon: Palette,
  },
  {
    href: '/studio/monitoring',
    label: 'Giám Sát & SePay Logs',
    icon: Activity,
  },
];

export function StudioSidebar({
  mobileOpen,
  onCloseMobile,
}: {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user;

  const content = (
    <div className="flex flex-col h-full bg-[#18181B] text-zinc-300 border-r border-zinc-800 w-64 select-none">
      {/* Studio Header Brand */}
      <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
        <Link href="/studio" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3E5C6E] to-[#B45309] text-white flex items-center justify-center font-serif font-bold text-lg shadow-inner">
            QT
          </div>
          <div>
            <span className="font-serif text-lg font-semibold tracking-wide text-white block leading-snug group-hover:text-amber-300 transition-colors">
              Quốc Tuấn
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#B45309] font-bold block">
              Artist Studio CMS
            </span>
          </div>
        </Link>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <span className="px-3 text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-2">
          Quản trị xưởng vẽ
        </span>

        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#3E5C6E] text-white shadow-md font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-amber-300' : 'text-zinc-400'
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Public Gallery Link & User Footer */}
      <div className="p-4 border-t border-zinc-800/80 space-y-3 bg-zinc-950/40">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs transition-colors border border-zinc-800"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Xem Web Gallery</span>
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
        </Link>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-amber-400 shrink-0">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="truncate">
              <span className="text-xs font-semibold text-white block truncate">
                {user?.name || 'Họa sĩ Quốc Tuấn'}
              </span>
              <span className="text-[10px] text-zinc-500 block truncate">
                {user?.email || 'artist@studio.vn'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors"
            title="Đăng xuất khỏi Studio"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
