'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';

export default function ChangePassword() {
  const supabase = createClient();
  const [current, setCurrent] = useState('');
  const [newPwd, setNewPwd]   = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow]       = useState(false);
  const [saving, setSaving]   = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd.length < 6)   { toast.error('New password must be at least 6 characters'); return; }
    if (newPwd !== confirm)  { toast.error('Passwords do not match'); return; }

    setSaving(true);
    // Verify current password first
    const { data: { user } } = await supabase.auth.getUser();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user?.email || '', password: current,
    });
    if (signInErr) {
      toast.error('Current password is incorrect');
      setSaving(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated successfully!');
      setCurrent(''); setNewPwd(''); setConfirm(''); setShow(false);
    }
  }

  return (
    <div className="card p-5">
      <button type="button" onClick={() => setShow(v => !v)} className="w-full flex items-center justify-between group">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">Change Password</p>
            <p className="text-xs text-slate-500">Update your login password anytime</p>
          </div>
        </div>
        <svg className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${show ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {show && (
        <form onSubmit={handleChange} className="mt-5 pt-5 border-t border-[#2d3142] space-y-4 animate-fade-in">
          <div>
            <label className="label">Current Password</label>
            <input
              type={showPwd ? 'text' : 'password'} required
              value={current} onChange={e => setCurrent(e.target.value)}
              className="input" placeholder="Your current password" autoFocus
            />
          </div>
          <div>
            <label className="label">New Password</label>
            <input
              type={showPwd ? 'text' : 'password'} required minLength={6}
              value={newPwd} onChange={e => setNewPwd(e.target.value)}
              className="input" placeholder="Min. 6 characters"
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type={showPwd ? 'text' : 'password'} required
              value={confirm} onChange={e => setConfirm(e.target.value)}
              className={`input ${confirm && confirm !== newPwd ? 'border-red-500/50 focus:border-red-500' : ''}`}
              placeholder="Repeat new password"
            />
            {confirm && confirm !== newPwd && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Passwords do not match
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showPwd} onChange={e => setShowPwd(e.target.checked)} className="w-3.5 h-3.5 accent-sky-500" />
            <span className="text-xs text-slate-400">Show passwords</span>
          </label>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving || !current || !newPwd || !confirm} className="btn-primary">
              {saving
                ? <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Updating…</span>
                : 'Update Password'
              }
            </button>
            <button type="button" onClick={() => { setShow(false); setCurrent(''); setNewPwd(''); setConfirm(''); }} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
