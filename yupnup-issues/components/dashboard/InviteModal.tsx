'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function InviteModal({ open, onClose }: Props) {
  const router = useRouter();
  const [email, setEmail]   = useState('');
  const [name, setName]     = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);

  const DEFAULT_PASSWORD = '12345';
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  function reset() {
    setEmail(''); setName(''); setDone(false);
  }

  function handleClose() {
    onClose();
    setTimeout(reset, 250);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/team/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: DEFAULT_PASSWORD,
          full_name: name.trim(),
          role: 'team_member',
          send_email: true,
        }),
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
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
    >
      <div className="w-full max-w-md bg-[#1a1d27] border border-[#2d3142] rounded-2xl shadow-2xl animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d3142]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
              <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Add Team Member</h2>
              <p className="text-xs text-slate-500">They get an email with login details</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg hover:bg-[#252836] flex items-center justify-center text-slate-500 hover:text-white transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {!done ? (
          /* ── Add form ── */
          <form onSubmit={handleAdd} className="p-6 space-y-4">
            <div>
              <label className="label">Their Name (optional)</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="input"
                placeholder="Ranjit Kumar"
                autoFocus
              />
            </div>

            <div>
              <label className="label">Their Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="ranjit@yupnup.com"
              />
            </div>

            {/* Info box */}
            <div className="flex items-start gap-3 p-3.5 bg-sky-500/5 border border-sky-500/15 rounded-xl">
              <svg className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div className="text-xs text-slate-400 leading-relaxed">
                We'll send them an email with:<br/>
                <span className="text-slate-200">• The site link to log in</span><br/>
                <span className="text-slate-200">• Their email address</span><br/>
                <span className="text-slate-200">• Default password: <span className="font-bold text-sky-300">12345</span></span>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={handleClose} className="btn-secondary flex-1 justify-center py-2.5">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-all"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Sending…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    Send Invite
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* ── Done screen ── */
          <div className="p-6 space-y-5">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Invite Sent! 🎉</h3>
              <p className="text-slate-400 text-sm">
                An email has been sent to <span className="text-sky-400 font-medium">{email}</span>
              </p>
            </div>

            {/* What they received */}
            <div className="bg-[#0f1117] border border-[#2d3142] rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Email sent to them contains:</p>
              {[
                { icon: '🌐', label: 'Site URL', value: `${appUrl}/auth/login` },
                { icon: '📧', label: 'Email',    value: email },
                { icon: '🔑', label: 'Password', value: DEFAULT_PASSWORD },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-base">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-600 uppercase tracking-wide">{label}</p>
                    <p className="text-sm text-slate-200 font-mono truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-500 text-center">
              They just need to open the link, enter their email and password <span className="text-sky-400 font-bold">12345</span>, and they're in.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => { reset(); }}
                className="btn-secondary flex-1 justify-center py-2.5"
              >
                + Add Another
              </button>
              <button onClick={handleClose} className="btn-primary flex-1 justify-center py-2.5">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
