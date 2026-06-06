'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

type View = 'login' | 'reset-sent';

export default function LoginPage() {
  const [view, setView]         = useState<View>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showReset, setShowReset]   = useState(false);
  const supabase = createClient();
  const router   = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message === 'Invalid login credentials'
        ? 'Wrong email or password. Please try again.'
        : error.message);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setLoading(true);
    const appUrl = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${appUrl}/auth/update-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setView('reset-sent');
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

        <div className="card p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>

          {/* ── LOGIN ── */}
          {!showReset && view === 'login' && (
            <>
              <h1 className="text-xl font-bold text-white mb-1">Sign in</h1>
              <p className="text-slate-400 text-sm mb-6">Enter your credentials to continue</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="label">Email Address</label>
                  <input
                    type="email" required autoFocus
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="input" placeholder="you@yupnup.com"
                  />
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'} required
                      value={password} onChange={e => setPassword(e.target.value)}
                      className="input pr-10" placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showPass
                        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"/></svg>
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      }
                    </button>
                  </div>
                </div>

                {/* Forgot password link */}
                <div className="flex justify-end">
                  <button type="button" onClick={() => { setShowReset(true); setResetEmail(email); }}
                    className="text-xs text-sky-400 hover:text-sky-300 transition-colors">
                    Forgot password?
                  </button>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
                  {loading
                    ? <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Signing in…</span>
                    : 'Sign In'
                  }
                </button>
              </form>

              <p className="mt-5 text-center text-xs text-slate-500">
                Don't have access? Contact your admin.
              </p>
            </>
          )}

          {/* ── FORGOT PASSWORD FORM ── */}
          {showReset && view === 'login' && (
            <>
              <button onClick={() => setShowReset(false)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                Back to login
              </button>

              <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white mb-1">Reset Password</h1>
              <p className="text-slate-400 text-sm mb-6">
                Enter your email and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="label">Your Email Address</label>
                  <input
                    type="email" required autoFocus
                    value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                    className="input" placeholder="you@yupnup.com"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
                  {loading
                    ? <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Sending…</span>
                    : 'Send Reset Link'
                  }
                </button>
              </form>
            </>
          )}

          {/* ── EMAIL SENT CONFIRMATION ── */}
          {view === 'reset-sent' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-slate-400 text-sm mb-1">We sent a password reset link to</p>
              <p className="text-sky-400 font-medium text-sm mb-6">{resetEmail}</p>
              <p className="text-slate-500 text-xs mb-6">
                Click the link in the email to set a new password.<br/>
                Check your spam folder if you don't see it.
              </p>
              <button onClick={() => { setView('login'); setShowReset(false); }}
                className="text-xs text-slate-400 hover:text-slate-300 transition-colors">
                ← Back to login
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
