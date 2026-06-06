'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Props { open: boolean; onClose: () => void; }

export default function InviteModal({ open, onClose }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const DEFAULT_PASSWORD = '12345';
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  function reset() { setEmail(''); setName(''); setDone(false); }
  function handleClose() { onClose(); setTimeout(reset, 250); }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/team/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: DEFAULT_PASSWORD, full_name: name.trim(), role: 'team_member', send_email: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setDone(true);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md bg-[#1a1d27] border border-[#2d3142] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d3142]">
          <div>
            <h2 className="text-base font-bold text-white">👥 Add Team Member</h2>
            <p className="text-xs text-slate-500 mt-0.5">They will get an email with login details</p>
          </div>
          <button onClick={handleClose} className="text-slate-500 hover:text-white text-xl px-2">✕</button>
        </div>
        {!done ? (
          <form onSubmit={handleAdd} className="p-6 space-y-4">
            <div>
              <label className="label">Their Name (optional)</label>
              <input value={name} onChange={e => setName(e.target.value)} className="input" placeholder="Ranjit Kumar" autoFocus />
            </div>
            <div>
              <label className="label">Their Email Address *</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="ranjit@yupnup.com" />
            </div>
            <div className="p-4 bg-sky-500/5 border border-sky-500/20 rounded-xl text-sm text-slate-400 space-y-1">
              <p className="text-slate-200 font-semibold mb-2">📧 They will receive an email with:</p>
              <p>🌐 Your site link to login</p>
              <p>📧 Their email address</p>
              <p>🔑 Password: <strong className="text-sky-300 text-base">12345</strong></p>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={handleClose} className="btn-secondary flex-1 justify-center py-3">Cancel</button>
              <button type="submit" disabled={loading || !email.trim()} className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-lg transition-all">
                {loading ? 'Sending…' : '✉️ Send Invite Email'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 text-center space-y-5">
            <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Invite Sent! 🎉</h3>
              <p className="text-slate-400 text-sm">Email sent to <span className="text-sky-400 font-semibold">{email}</span></p>
            </div>
            <div className="bg-[#0f1117] border border-[#2d3142] rounded-xl p-5 text-left space-y-3">
              <p className="text-sm text-slate-300">🌐 Site: <span className="text-sky-400 font-mono text-xs">{appUrl}</span></p>
              <p className="text-sm text-slate-300">📧 Email: <span className="font-mono">{email}</span></p>
              <p className="text-sm text-slate-300">🔑 Password: <strong className="text-sky-300 text-lg">12345</strong></p>
            </div>
            <div className="flex gap-3">
              <button onClick={reset} className="btn-secondary flex-1 justify-center py-2.5">+ Invite Another</button>
              <button onClick={handleClose} className="btn-primary flex-1 justify-center py-2.5">Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
