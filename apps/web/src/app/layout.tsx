import type { Metadata } from 'next';
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { FloatingContactDock } from '@/components/floating/FloatingContactDock';

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Artist Commission Studio | Họa sĩ Quốc Tuấn',
  description: 'Xưởng nghệ thuật & Không gian đặt vẽ tranh sơn dầu, acrylic và tranh tường nghệ thuật độc bản theo yêu cầu.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${cormorant.variable} ${jakarta.variable}`}>
      <body className="font-sans min-h-screen bg-canvas text-charcoal selection:bg-brand selection:text-white">
        <AuthProvider>
          {children}
          <FloatingContactDock />
        </AuthProvider>
      </body>
    </html>
  );
}
