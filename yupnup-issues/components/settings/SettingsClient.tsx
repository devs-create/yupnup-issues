'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Profile, UserRole } from '@/types';
import { getInitials, cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase';

interface Props {
  profile: Profile | null;
  allProfiles: Profile[];
}

const ROLE_CONFIG: Record<UserRole, { label: string; desc: string; color: string; bg: string }> = {
  admin:       { label: 'Admin',       desc: 'Full access · can delete tickets',        color: 'text-red-400',   bg: 'bg-red-400/10 border-red-400/20' },
  team_member: { label: 'Team Member', desc: 'Create · edit · comment · change status', color: 'text-sky-400',   bg: 'bg-sky-400/10 border-sky-400/20' },
  viewer:      { label: 'Viewer',      desc: 'Read-only access',                        color: 'text-slate-400', bg: 'bg-slate-400/10 border-slate-400/20' },
};

interface Credentials { email: string; password: string; }

function generatePassword(len = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="text-slate-500 hover:text-sky-400 transition-colors flex-shrink-0" title="Copy">
      {copied
        ? <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
      }
    </button>
  );
}

export default function SettingsClient({ profile, allProfiles }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const isAdmin = profile?.role === 'admin';

  // Profile form
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving]     = useState(false);

  // Add member form
  const [showAdd, setShowAdd]     = useState(false);
  const [addEmail, setAddEmail]   = useState('');
  const [addName, setAddName]     = useState('');
  const [addRole, setAddRole]     = useState<UserRole>('team_member');
  const [addPassword, setAddPassword] = useState(generatePassword());
  const [showPassword, setShowPassword] = useState(false);
  const [addLoading, setAddLoading]   = useState(false);
  const [result, setResult] = useState<{ message: string; action: string; credentials: Credentials } | null>(null);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', profile?.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success('Profile updated!'); router.refresh(); }
  }

  async function handleRoleChange(userId: string, role: UserRole) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
    if (error) toast.error(error.message);
    else { toast.success('Role updated'); router.refresh(); }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!addEmail.trim() || !addPassword.trim()) return;
    setAddLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/team/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: addEmail.trim(),
          password: addPassword,
          full_name: addName.trim(),
          role: addRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setResult(data);
      toast.success(data.action === 'created' ? 'Account created!' : 'Account updated!');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAddLoading(false);
    }
  }

  function resetAddForm() {
    setAddEmail('');
    setAddName('');
    setAddRole('team_member');
    setAddPassword(generatePassword());
    setResult(null);
    setShowAdd(false);
  }

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage your account and team</p>
      </div>

      {/* ── Your Profile ── */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-300 border-b border-[#2d3142] pb-3 mb-4">Your Profile</h2>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white">
            {profile?.full_name ? getInitials(profile.full_name) : profile?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-medium text-white">{profile?.full_name || 'Set your name below'}</p>
            <p className="text-sm text-slate-400">{profile?.email}</p>
            <span className={cn('badge mt-1', ROLE_CONFIG[profile?.role || 'viewer'].bg, ROLE_CONFIG[profile?.role || 'viewer'].color)}>
              {ROLE_CONFIG[profile?.role || 'viewer'].label}
            </span>
          </div>
        </div>
        <form onSubmit={handleSaveProfile} className="flex gap-3">
          <div className="flex-1">
            <label className="label">Full Name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} className="input" placeholder="Your full name" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary self-end">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>

      {/* ── Team Members (Admin only) ── */}
      {isAdmin && (
        <div className="card p-5">
          <div className="flex items-center justify-between border-b border-[#2d3142] pb-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-300">Team Members</h2>
              <p className="text-xs text-slate-500 mt-0.5">{allProfiles.length} member{allProfiles.length !== 1 ? 's' : ''}</p>
            </div>
            {!showAdd && (
              <button onClick={() => setShowAdd(true)} className="btn-primary text-xs py-1.5 px-3">
                + Add Member
              </button>
            )}
          </div>

          {/* ── Add Member Panel ── */}
          {showAdd && (
            <div className="mb-6">

              {/* Success / credentials card */}
              {result ? (
                <div className="space-y-4">
                  <div className={cn(
                    'p-4 rounded-xl border',
                    result.action === 'updated'
                      ? 'bg-yellow-400/5 border-yellow-400/20'
                      : 'bg-emerald-400/5 border-emerald-400/20'
                  )}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{result.action === 'created' ? '✅' : '🔄'}</span>
                      <p className={cn('text-sm font-semibold', result.action === 'updated' ? 'text-yellow-300' : 'text-emerald-300')}>
                        {result.action === 'created' ? 'Account Created!' : 'Account Updated!'}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">{result.message}</p>

                    {/* Credentials to share */}
                    <div className="bg-[#0f1117] border border-[#2d3142] rounded-lg p-4 space-y-3">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                        📋 Share these login credentials
                      </p>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-slate-500 mb-0.5">Login URL</p>
                          <p className="text-xs text-sky-400 font-mono truncate">{appUrl}/auth/login</p>
                        </div>
                        <CopyButton text={`${appUrl}/auth/login`} />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-slate-500 mb-0.5">Email</p>
                          <p className="text-xs text-slate-200 font-mono">{result.credentials.email}</p>
                        </div>
                        <CopyButton text={result.credentials.email} />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-slate-500 mb-0.5">Password</p>
                          <p className="text-xs text-slate-200 font-mono tracking-wider">{result.credentials.password}</p>
                        </div>
                        <CopyButton text={result.credentials.password} />
                      </div>

                      {/* Copy all button */}
                      <button
                        onClick={() => {
                          const text = `YupNup Issue Tracker Login\nURL: ${appUrl}/auth/login\nEmail: ${result.credentials.email}\nPassword: ${result.credentials.password}`;
                          navigator.clipboard.writeText(text);
                          toast.success('All credentials copied!');
                        }}
                        className="w-full mt-2 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-lg text-xs text-sky-400 font-medium transition-colors"
                      >
                        Copy All Credentials
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setResult(null); setAddEmail(''); setAddName(''); setAddPassword(generatePassword()); }}
                      className="btn-primary text-xs flex-1 justify-center"
                    >
                      + Add Another Member
                    </button>
                    <button onClick={resetAddForm} className="btn-secondary text-xs px-4">
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* Add form */
                <form onSubmit={handleAddMember} className="space-y-4 p-4 bg-[#1a1d27] border border-sky-500/20 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <h3 className="text-sm font-semibold text-sky-400">Add Team Member</h3>
                      <p className="text-xs text-slate-500 mt-0.5">You set their email & password — share it with them directly</p>
                    </div>
                    <button type="button" onClick={resetAddForm} className="text-slate-500 hover:text-slate-300 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Email Address *</label>
                      <input
                        type="email" required
                        value={addEmail} onChange={e => setAddEmail(e.target.value)}
                        className="input" placeholder="colleague@yupnup.com"
                      />
                    </div>
                    <div>
                      <label className="label">Full Name (optional)</label>
                      <input
                        value={addName} onChange={e => setAddName(e.target.value)}
                        className="input" placeholder="Jane Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="label mb-0">Password *</label>
                      <button
                        type="button"
                        onClick={() => setAddPassword(generatePassword())}
                        className="text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
                      >
                        ↻ Generate new
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={addPassword}
                        onChange={e => setAddPassword(e.target.value)}
                        className="input pr-20 font-mono tracking-wider"
                        required
                        minLength={6}
                        placeholder="Min. 6 characters"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button type="button" onClick={() => setShowPassword(v => !v)} className="text-slate-500 hover:text-slate-300 transition-colors p-1">
                          {showPassword
                            ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
                            : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          }
                        </button>
                        <CopyButton text={addPassword} />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Minimum 6 characters. You'll see the final credentials after creating.</p>
                  </div>

                  <div>
                    <label className="label">Role</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][]).map(([k, v]) => (
                        <button
                          key={k} type="button" onClick={() => setAddRole(k)}
                          className={cn(
                            'p-3 rounded-lg border text-left transition-all',
                            addRole === k
                              ? `${v.bg} ${v.color} ring-1 ring-current`
                              : 'bg-[#252836] border-[#2d3142] text-slate-400 hover:border-slate-500'
                          )}
                        >
                          <p className="text-xs font-semibold">{v.label}</p>
                          <p className="text-[10px] mt-0.5 opacity-70 leading-snug">{v.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button type="submit" disabled={addLoading || !addEmail.trim()} className="btn-primary w-full justify-center py-2.5">
                    {addLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Creating Account…
                      </span>
                    ) : 'Create Account & Get Credentials'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Members list */}
          <div className="divide-y divide-[#2d3142]">
            {allProfiles.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500">No team members yet.</p>
            )}
            {allProfiles.map(member => (
              <div key={member.id} className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {member.full_name ? getInitials(member.full_name) : member.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">
                    {member.full_name || <span className="text-slate-500 italic text-xs">No name set</span>}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{member.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {member.id === profile?.id ? (
                    <span className="text-xs text-slate-500 italic px-2">You</span>
                  ) : (
                    <select
                      value={member.role}
                      onChange={e => handleRoleChange(member.id, e.target.value as UserRole)}
                      className="select text-xs py-1 w-36"
                    >
                      {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][]).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  )}
                  <span className={cn('badge text-[10px] hidden sm:inline-flex', ROLE_CONFIG[member.role]?.bg, ROLE_CONFIG[member.role]?.color)}>
                    {ROLE_CONFIG[member.role]?.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Integrations ── */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-300 border-b border-[#2d3142] pb-3 mb-4">Integrations</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-[#252836] rounded-lg">
            <div>
              <p className="text-sm text-slate-300 font-medium">Email Notifications</p>
              <p className="text-xs text-slate-500 mt-0.5">Recipients set via <code className="text-sky-400 text-[11px]">EMAIL_RECIPIENTS</code> env var</p>
            </div>
            <span className="badge bg-emerald-400/10 border-emerald-400/20 text-emerald-400 text-[11px]">Active</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#252836] rounded-lg">
            <div>
              <p className="text-sm text-slate-300 font-medium">Slack Webhook</p>
              <p className="text-xs text-slate-500 mt-0.5">Configure via <code className="text-sky-400 text-[11px]">SLACK_WEBHOOK_URL</code> env var</p>
            </div>
            <span className="badge bg-[#2d3142] border-[#363a4f] text-slate-400 text-[11px]">Via .env</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChangePasswordSection() {
  const supabase = createClient();
  const [current, setCurrent]   = useState('');
  const [newPwd, setNewPwd]     = useState('');
  const [confirm, setConfirm]   = useState('');
  const [show, setShow]         = useState(false);
  const [saving, setSaving]     = useState(false);

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (newPwd !== confirm)  { toast.error('Passwords do not match'); return; }
    setSaving(true);
    // Re-authenticate first with current password
    const { data: { user } } = await supabase.auth.getUser();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user?.email || '', password: current,
    });
    if (signInErr) { toast.error('Current password is incorrect'); setSaving(false); return; }
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success('Password updated!'); setCurrent(''); setNewPwd(''); setConfirm(''); }
  }

  return (
    <div className="card p-5">
      <button
        onClick={() => setShow(v => !v)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-200">Change Password</p>
            <p className="text-xs text-slate-500">Update your login password</p>
          </div>
        </div>
        <svg className={`w-4 h-4 text-slate-500 transition-transform ${show ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {show && (
        <form onSubmit={handleChange} className="mt-4 pt-4 border-t border-[#2d3142] space-y-3">
          <div>
            <label className="label">Current Password</label>
            <input type="password" required value={current} onChange={e => setCurrent(e.target.value)} className="input" placeholder="Your current password" autoFocus />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" required minLength={6} value={newPwd} onChange={e => setNewPwd(e.target.value)} className="input" placeholder="Min. 6 characters" />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password" required
              value={confirm} onChange={e => setConfirm(e.target.value)}
              className={`input ${confirm && confirm !== newPwd ? 'border-red-500/50' : ''}`}
              placeholder="Repeat new password"
            />
            {confirm && confirm !== newPwd && <p className="text-xs text-red-400 mt-1">Passwords do not match</p>}
          </div>
          <button type="submit" disabled={saving} className="btn-primary text-sm">
            {saving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      )}
    </div>
  );
}
