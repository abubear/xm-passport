import Link from 'next/link';

export default function TopNav() {
  return (
    <div className="flex items-center justify-between w-full mb-6 px-6 pt-6">
      {/* Left: Logo + Title */}
      <Link href="/home" className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
          <span className="text-black text-xs font-bold">XM</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">XM Passport</span>
          <span className="text-[11px] text-[#A1A1AA]">Collector</span>
        </div>
      </Link>

      {/* Right: icons */}
      <div className="flex items-center gap-3">
        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05] hover:bg-white/[0.1] transition-colors border border-white/[0.05]">
          <svg className="w-4 h-4 text-[#A1A1AA]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
        </button>
        <Link href="/profile" className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-400 border border-white/20 block" />
      </div>
    </div>
  );
}
