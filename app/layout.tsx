import type { Metadata, Viewport } from 'next';
import './globals.css';
import BackgroundGrid from '@/components/ui/BackgroundGrid';
import GlassContainer from '@/components/ui/GlassContainer';

export const metadata: Metadata = {
  title: 'XM Passport',
  description: 'Collect. Reserve. Trade. Redeem.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'XM Passport',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#030303',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#030303] text-gray-200 antialiased font-sans">
        <BackgroundGrid />
        <GlassContainer>
          {children}
        </GlassContainer>
      </body>
    </html>
  );
}
