'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type AuthMethod = 'email' | 'phone';

export default function LoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState<AuthMethod>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body: any = { auth_provider: method };
      if (method === 'email') {
        body.email = email;
        body.password = password;
      } else {
        body.phone = phone;
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      router.push('/home');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    setLoading(true);
    const mockId = `${provider}_${Date.now()}`;

    // Try login first
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth_provider: provider, provider_id: mockId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          router.push('/home');
          router.refresh();
        } else {
          // Auto-register if not found
          fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              display_name: `${provider} User`,
              auth_provider: provider,
              provider_id: mockId,
            }),
          })
            .then((r) => r.json())
            .then((d) => {
              if (d.user) {
                router.push('/home');
                router.refresh();
              } else {
                setError(d.error || `${provider} login failed`);
              }
            });
        }
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen flex flex-col justify-center p-6 safe-top safe-bottom">
      <div className="mb-8">
        <a href="/" className="text-xm-gold text-sm flex items-center gap-2">← Back</a>
      </div>

      <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
      <p className="text-gray-500 mb-6">Sign in to your XM Passport</p>

      {/* Auth method toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMethod('email')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            method === 'email' ? 'bg-xm-gold text-xm-black' : 'bg-xm-card text-gray-400'
          }`}
        >
          Email
        </button>
        <button
          onClick={() => setMethod('phone')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            method === 'phone' ? 'bg-xm-gold text-xm-black' : 'bg-xm-card text-gray-400'
          }`}
        >
          Phone
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3 text-red-400 text-sm">{error}</div>
        )}

        {method === 'email' ? (
          <>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email</label>
              <input
                type="email"
                className="xm-input"
                placeholder="collector@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Password</label>
              <input
                type="password"
                className="xm-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </>
        ) : (
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Phone Number</label>
            <input
              type="tel"
              className="xm-input"
              placeholder="+65 9123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="xm-btn-primary w-full text-base disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gray-800" />
        <span className="text-xs text-gray-600">or continue with</span>
        <div className="flex-1 h-px bg-gray-800" />
      </div>

      {/* Social login buttons */}
      <div className="space-y-3">
        <button
          onClick={() => handleSocialLogin('apple')}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-white text-black text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <AppleIcon /> Sign in with Apple
        </button>

        <button
          onClick={() => handleSocialLogin('google')}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-white text-black text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <GoogleIcon /> Sign in with Google
        </button>

        <button
          onClick={() => handleSocialLogin('wechat')}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[#07C160] text-black text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <WechatIcon /> Sign in with WeChat
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have a Passport?{' '}
        <a href="/register" className="text-xm-gold">Create one</a>
      </p>
    </div>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function WechatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm3.55 2.954c-3.154 0-5.811 2.15-5.811 4.877 0 1.049.394 2.026 1.113 2.765.27.278.34.68.186 1.027l-.273.662a.24.24 0 0 0-.005.1c0 .08.065.146.145.146a.17.17 0 0 0 .083-.027l1.309-.765a.97.97 0 0 1 .677-.13 6.6 6.6 0 0 0 2.576.048c1.727-.29 3.227-1.143 4.18-2.343.924-1.163 1.304-2.573 1.037-3.957-.517-2.694-2.95-4.403-5.638-4.403zm-2.692 2.568c.425 0 .77.35.77.78a.775.775 0 0 1-.77.78.776.776 0 0 1-.77-.78c0-.43.345-.78.77-.78zm4.278 0c.425 0 .77.35.77.78a.775.775 0 0 1-.77.78.776.776 0 0 1-.77-.78c0-.43.345-.78.77-.78z" />
    </svg>
  );
}
