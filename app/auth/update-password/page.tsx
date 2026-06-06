'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      setDone(true);
      setTimeout(() => { router.push('/dashboard'); router.refresh(); }, 2500);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-2xl font-black">YUP<span className="text-sky-400">NUP</span></span>
        </div>
        <div className="card p-8">
          {done ? (
            <div className="text-center">
              <p className="text-2xl mb-3">✅</p>
              <h2 className="text-xl font-bold text-white mb-2">Password Updated!</h2>
              <p className="text-slate-400 text-sm">Taking you to dashboard…</p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-white mb-1">Set New Password</h1>
              <p className="text-slate-400 text-sm mb-6">Choose a new password for your account</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">New Password</label>
                  <input
                    type={showPass ? 'text' : 'password'} required autoFocus
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="input" placeholder="Min. 6 characters" minLength={6}
                  />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input
                    type={showPass ? 'text' : 'password'} required
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                    className={`input ${confirm && confirm !== password ? 'border-red-500/50' : ''}`}
                    placeholder="Repeat your password"
                  />
                  {confirm && confirm !== password && (
                    <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                  )}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showPass} onChange={e => setShowPass(e.target.checked)} className="accent-sky-500" />
                  <span className="text-xs text-slate-400">Show passwords</span>
                </label>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
                  {loading ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
