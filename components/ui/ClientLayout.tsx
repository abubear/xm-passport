'use client';

import { LanguageProvider } from '@/components/ui/LanguageProvider';
import BottomNav from '@/components/ui/BottomNav';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <main className="page-content safe-top">
        {children}
      </main>
      <BottomNav />
    </LanguageProvider>
  );
}
