import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeProvider';

export default function TopNav() {
  return (
    <div className="flex items-center justify-between w-full mb-6 px-6 pt-6">
      {/* Left: Logo + Title */}
      <Link href="/home" className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[var(--xm-primary)] flex items-center justify-center">
          <span className="text-white text-xs font-bold">XM</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium" style={{ color: 'var(--xm-ink)' }}>XM Passport</span>
          <span className="text-[11px]" style={{ color: 'var(--xm-body-muted)' }}>Collector</span>
        </div>
      </Link>

      {/* Right: icons */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link href="/profile" className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-400 to-gray-300 dark:from-gray-700 dark:to-gray-400 border border-[var(--xm-border-soft)] block" />
      </div>
    </div>
  );
}
