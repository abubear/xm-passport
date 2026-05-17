'use client';

import { LanguageProvider } from '@/components/ui/LanguageProvider';
import TopNav from '@/components/ui/TopNav';
import BottomNav from '@/components/ui/BottomNav';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <TopNav />
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pb-24 safe-top">
        {children}
      </main>
      <BottomNav />
    </LanguageProvider>
  );
}
