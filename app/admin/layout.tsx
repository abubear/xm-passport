import { getAuthToken, verifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = getAuthToken();
  if (!token) redirect('/login');

  const payload = verifyToken(token);
  if (!payload || !payload.is_admin) redirect('/home');

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-xm-dark border-r border-gray-800 p-4 hidden lg:block">
        <div className="mb-8">
          <h1 className="text-sm font-bold text-xm-gold">XM Passport</h1>
          <p className="text-[10px] text-gray-500">Admin Dashboard</p>
        </div>
        <nav className="space-y-1">
          {[
            { href: '/admin', label: 'Overview' },
            { href: '/admin/users', label: 'Users' },
            { href: '/admin/products', label: 'Products' },
            { href: '/admin/cards', label: 'Cards' },
            { href: '/admin/etickets', label: 'E-Tickets' },
            { href: '/admin/marketplace', label: 'Marketplace' },
            { href: '/admin/analytics', label: 'Analytics' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-lg text-xs text-gray-400 hover:bg-xm-card hover:text-gray-200 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4">
          <a href="/home" className="text-xs text-gray-500 hover:text-xm-gold">← Back to App</a>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-xm-dark border-b border-gray-800 px-4 py-3 flex items-center gap-4 overflow-x-auto z-40">
        <span className="text-xs font-bold text-xm-gold whitespace-nowrap">Admin</span>
        {['Overview', 'Users', 'Products', 'Cards', 'E-Tickets', 'Market', 'Analytics'].map((label) => (
          <Link
            key={label}
            href={`/admin/${label === 'Overview' ? '' : label === 'Market' ? 'marketplace' : label === 'E-Tickets' ? 'etickets' : label.toLowerCase()}`}
            className="text-xs text-gray-400 whitespace-nowrap"
          >
            {label}
          </Link>
        ))}
        <a href="/home" className="text-xs text-xm-gold whitespace-nowrap ml-auto">← App</a>
      </div>

      {/* Content */}
      <main className="flex-1 p-6 lg:p-8 mt-10 lg:mt-0">
        {children}
      </main>
    </div>
  );
}
