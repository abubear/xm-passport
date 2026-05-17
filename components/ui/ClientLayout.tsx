'use client';

import { LanguageProvider } from '@/components/ui/LanguageProvider';
import TopNav from '@/components/ui/TopNav';
import BottomNav from '@/components/ui/BottomNav';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="flex flex-col min-h-screen">
        <TopNav />
        <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col gap-6 px-6 page-content">
          {children}
        </main>
      </div>
      <BottomNav />
    </LanguageProvider>
  );
}
