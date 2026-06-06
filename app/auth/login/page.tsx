'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] bg-grid-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <span className="text-white font-black text-sm">Y</span>
            </div>
            <span className="text-2xl font-black tracking-tight">
              YUP<span className="text-sky-400">NUP</span>
            </span>
          </div>
          <p className="text-slate-400 text-sm">Internal Issue Tracker</p>
        </div>

        {/* Card */}
        <div className="card p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {!sent ? (
            <>
              <h1 className="text-xl font-bold text-white mb-1">Welcome back</h1>
              <p className="text-slate-400 text-sm mb-6">Enter your work email to receive a magic link</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Work Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="you@yupnup.com"
                    required
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Sending...
                    </span>
                  ) : 'Send Magic Link'}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-slate-500">
                Access is restricted to invited team members only.
              </p>
            </>
          ) : (
            <div className="text-center">
              <div className="w-14 h-14 bg-sky-500/10 border border-sky-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-slate-400 text-sm mb-2">We sent a magic link to</p>
              <p className="text-sky-400 font-medium text-sm mb-6">{email}</p>
              <p className="text-slate-500 text-xs">Click the link in the email to sign in. The link expires in 1 hour.</p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 text-xs text-slate-400 hover:text-slate-300 transition-colors"
              >
                ← Try a different email
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          © {new Date().getFullYear()} YupNup · Internal Use Only
        </p>
      </div>
    </div>
  );
}
