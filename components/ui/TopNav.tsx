import Link from 'next/link';

const navItems = [
  { href: '/home', label: 'Home' },
  { href: '/vault', label: 'Vault' },
  { href: '/drops', label: 'Drops' },
  { href: '/marketplace', label: 'Market' },
];

export default function TopNav() {
  return (
    <nav className="flex items-center justify-between w-full mb-8">
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
          <span className="text-black text-xs font-bold">XM</span>
        </div>
        <div className="hidden md:flex flex-col">
          <span className="text-sm font-medium text-white">XM Passport</span>
          <span className="text-[11px] text-[#8E8E93]">Collector</span>
        </div>
      </div>

      {/* Center: Pill nav */}
      <div
        className="hidden lg:flex items-center rounded-full px-1.5 py-1.5"
        style={{
          background: 'linear-gradient(rgba(255,255,255,0.02), rgba(255,255,255,0.02)) padding-box, linear-gradient(180deg, rgba(255,255,255,0.2), rgba(255,255,255,0.02)) border-box',
          border: '1px solid transparent',
        }}
      >
        <div className="flex items-center px-3 gap-5 text-xs font-normal text-[#8E8E93]">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <div className="w-px h-4 bg-white/[0.1] mx-1" />
          <Link href="/marketplace" className="hover:text-white transition-colors">
            Trade
          </Link>
        </div>
      </div>

      {/* Right: icons */}
      <div className="flex items-center gap-3">
        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05] hover:bg-white/[0.1] transition-colors border border-white/[0.05]">
          <svg className="w-4 h-4 text-[#8E8E93]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-400 border border-white/20" />
      </div>
    </nav>
  );
}
