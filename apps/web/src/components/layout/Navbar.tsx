'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, ArrowRight, LayoutDashboard, ShoppingBag, LogOut } from 'lucide-react';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDarkHero = pathname === '/' && !isScrolled;

  const navLinks = [
    { href: '/', label: 'Trang Chủ' },
    { href: '/portfolio', label: 'Bộ Sưu Tập' },
    { href: '/about#materials', label: 'Chất Liệu' },
    { href: '/about', label: 'Họa Sĩ' },
    { href: '/commission', label: 'Báo Giá & Đặt Vẽ' },
  ];

  const isArtist = session?.user?.role === 'ARTIST';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? 'bg-canvas/90 backdrop-blur-md border-b border-hairline py-3 shadow-sm'
        : isDarkHero
          ? 'bg-transparent py-5'
          : 'bg-canvas/85 backdrop-blur-md border-b border-hairline py-4'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Brand Handwritten Signature & Mark */}
        <Link href="/" className="flex items-center gap-3 group">
          <svg
            className={`w-8 h-8 transition-colors ${isDarkHero
              ? 'text-[#FAF9F6] group-hover:text-brand-light'
              : 'text-charcoal group-hover:text-brand'
              }`}
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Artistic Signature Monogram QT */}
            <path d="M20,65 C35,25 65,20 75,45 C82,60 60,80 40,75 C25,70 20,45 35,35 C50,25 70,30 80,50" />
            <path d="M48,30 L48,85" />
            <path d="M38,40 L60,38" />
            <circle cx="82" cy="72" r="2.5" fill="currentColor" />
          </svg>
          <div className="flex flex-col">
            <span
              className={`font-serif text-xl md:text-2xl font-normal tracking-wide transition-colors ${isDarkHero
                ? 'text-[#FAF9F6] group-hover:text-brand-light'
                : 'text-charcoal group-hover:text-brand'
                }`}
            >
              Quốc Tuấn
            </span>
            <span
              className={`text-[10px] font-sans tracking-[0.25em] uppercase transition-colors ${isDarkHero ? 'text-[#FAF9F6]/80' : 'text-charcoal-muted'
                }`}
            >
              Art Atelier
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 text-xs font-sans uppercase tracking-editorial">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors py-1 relative ${isActive
                  ? isDarkHero
                    ? 'text-[#FAF9F6] font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-white'
                    : 'text-charcoal font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-brand'
                  : isDarkHero
                    ? 'text-[#FAF9F6]/80 hover:text-white'
                    : 'text-charcoal-muted hover:text-charcoal'
                  }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Button & User Profile */}
        <div className="hidden sm:flex items-center gap-4">
          {session?.user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-medium ${isDarkHero
                  ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                  : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 shadow-sm'
                  }`}
              >
                <div className="w-6 h-6 rounded-full bg-[#3E5C6E] text-white flex items-center justify-center text-[10px] font-semibold">
                  {session.user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="max-w-[100px] truncate">{session.user.name || session.user.email}</span>
                {isArtist && (
                  <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-semibold uppercase tracking-wider">
                    Artist
                  </span>
                )}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-zinc-200 py-2 text-xs text-zinc-700 animate-in fade-in-50 zoom-in-95 duration-150 z-50">
                  <div className="px-4 py-2 border-b border-zinc-100">
                    <p className="font-semibold text-zinc-900 truncate">{session.user.name}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{session.user.email}</p>
                  </div>

                  {isArtist && (
                    <Link
                      href="/studio"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-50 text-[#3E5C6E] font-medium transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#3E5C6E]" />
                      <span>Studio Quản Trị</span>
                    </Link>
                  )}

                  <Link
                    href="/my-orders"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-50 text-zinc-700 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 text-zinc-400" />
                    <span>Đơn Hàng Của Tôi</span>
                  </Link>

                  <div className="border-t border-zinc-100 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-rose-50 text-rose-600 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Đăng Xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className={`text-xs uppercase tracking-wider font-medium px-3 py-1.5 transition-colors ${isDarkHero ? 'text-[#FAF9F6]/90 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
                }`}
            >
              Đăng Nhập
            </Link>
          )}

          <Link
            href="/commission"
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium uppercase tracking-wider transition-all shadow-sm ${isDarkHero
              ? 'bg-brand hover:bg-brand-hover text-white border border-brand-light/30'
              : 'bg-brand hover:bg-brand-hover text-white'
              }`}
          >
            <span>Đặt Vẽ Tranh</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`lg:hidden p-2 transition-colors ${isDarkHero ? 'text-[#FAF9F6] hover:text-white' : 'text-charcoal hover:text-brand'
            }`}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-canvas border-b border-hairline px-6 py-6 space-y-4 shadow-lg animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-3 text-xs uppercase tracking-editorial">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-charcoal hover:text-brand border-b border-hairline/50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {session?.user ? (
              <>
                {isArtist && (
                  <Link
                    href="/studio"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2 text-[#3E5C6E] font-medium border-b border-hairline/50 flex items-center justify-between"
                  >
                    <span>Studio Quản Trị</span>
                    <LayoutDashboard className="w-4 h-4" />
                  </Link>
                )}
                <Link
                  href="/my-orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-charcoal hover:text-brand border-b border-hairline/50 flex items-center justify-between"
                >
                  <span>Đơn Hàng Của Tôi</span>
                  <ShoppingBag className="w-4 h-4 text-zinc-400" />
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="py-2 text-rose-600 text-left flex items-center justify-between"
                >
                  <span>Đăng Xuất ({session.user.name})</span>
                  <LogOut className="w-4 h-4 text-rose-500" />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-brand font-medium border-b border-hairline/50"
              >
                Đăng Nhập Khách Hàng / Họa Sĩ
              </Link>
            )}
          </nav>
          <div className="pt-2">
            <Link
              href="/commission"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand hover:bg-brand-hover text-white text-xs uppercase tracking-wider font-medium"
            >
              <span>Đặt Vẽ Tranh Theo Yêu Cầu</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
