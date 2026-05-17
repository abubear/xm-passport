import { redirect } from 'next/navigation';
import { getAuthToken, verifyToken } from '@/lib/auth';

export default function Home() {
  const token = getAuthToken();

  if (token) {
    const user = verifyToken(token);
    if (user) {
      redirect('/home');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 safe-top safe-bottom">
      {/* Logo */}
      <div className="mb-12 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-xm-gold to-amber-700 flex items-center justify-center">
          <span className="text-3xl font-bold text-xm-black">XM</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">
          <span className="text-xm-gold">XM</span> Passport
        </h1>
        <p className="text-gray-500 text-sm">Collect. Reserve. Trade. Redeem.</p>
      </div>

      {/* Cards preview */}
      <div className="w-full max-w-sm mb-10 relative h-48">
        <div className="absolute left-4 top-0 w-32 h-44 rounded-xl bg-gradient-to-br from-purple-900 to-purple-700 border border-purple-500/30 rotate-[-8deg] opacity-80" />
        <div className="absolute left-1/2 -translate-x-1/2 top-2 w-32 h-44 rounded-xl bg-gradient-to-br from-xm-gold to-amber-700 border border-xm-gold/30 z-10" />
        <div className="absolute right-4 top-0 w-32 h-44 rounded-xl bg-gradient-to-br from-blue-900 to-blue-700 border border-blue-500/30 rotate-[8deg] opacity-80" />
      </div>

      {/* CTAs */}
      <div className="w-full max-w-sm space-y-3">
        <a
          href="/register"
          className="xm-btn-primary block text-center text-base"
        >
          Create Passport
        </a>
        <a
          href="/login"
          className="xm-btn-secondary block text-center text-base"
        >
          Sign In
        </a>
      </div>

      <p className="mt-8 text-xs text-gray-600 text-center max-w-xs">
        Your verified XM collector identity. Scan metal cards, build your vault, earn ranks, and trade securely.
      </p>
    </div>
  );
}
