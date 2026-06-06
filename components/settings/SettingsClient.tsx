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

const ROLE_CONFIG: Record<UserRole, { label: string; desc: string; color: string }> = {
  admin: { label: 'Admin', desc: 'Full access, can delete tickets', color: 'text-red-400' },
  team_member: { label: 'Team Member', desc: 'Can create, edit, comment, change status', color: 'text-sky-400' },
  viewer: { label: 'Viewer', desc: 'Read-only access', color: 'text-slate-400' },
};

export default function SettingsClient({ profile, allProfiles }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const isAdmin = profile?.role === 'admin';

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);

  // Single invite
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('team_member');
  const [inviting, setInviting] = useState(false);
  const [fallbackLink, setFallbackLink] = useState<string | null>(null);

  // Bulk invite
  const [bulkEmails, setBulkEmails] = useState('');
  const [bulkRole, setBulkRole] = useState<UserRole>('team_member');
  const [bulkInviting, setBulkInviting] = useState(false);
  const [showBulk, setShowBulk] = useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', profile?.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success('Profile updated!'); router.refresh(); }
  }

  async function handleRoleChange(userId: string, role: UserRole) {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);
    if (error) toast.error(error.message);
    else { toast.success('Role updated'); router.refresh(); }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setFallbackLink(null);
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (res.status === 207 && data.inviteUrl) {
        // Email failed — show the link so admin can share it manually
        setFallbackLink(data.inviteUrl);
        toast.error('Email could not be sent — copy the link below to share manually');
      } else if (!res.ok) {
        throw new Error(data.error);
      } else {
        toast.success(data.message);
        setInviteEmail('');
        router.refresh();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  }

  async function handleBulkInvite(e: React.FormEvent) {
    e.preventDefault();
    const emails = bulkEmails
      .split(/[\n,]+/)
      .map(e => e.trim())
      .filter(e => e.includes('@'));
    if (emails.length === 0) { toast.error('No valid emails found'); return; }

    setBulkInviting(true);
    let sent = 0;
    let failed = 0;
    for (const email of emails) {
      try {
        const res = await fetch('/api/admin/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, role: bulkRole }),
        });
        if (res.ok) sent++;
        else failed++;
      } catch {
        failed++;
      }
    }
    setBulkInviting(false);
    if (sent > 0) toast.success(`${sent} invite${sent > 1 ? 's' : ''} sent!`);
    if (failed > 0) toast.error(`${failed} failed`);
    setBulkEmails('');
    setShowBulk(false);
    router.refresh();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage your account and team</p>
      </div>

      {/* Profile */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-300 border-b border-[#2d3142] pb-3 mb-4">Your Profile</h2>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white">
            {profile?.full_name ? getInitials(profile.full_name) : profile?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-medium text-white">{profile?.full_name || 'Set your name below'}</p>
            <p className="text-sm text-slate-400">{profile?.email}</p>
            <span className={cn('text-xs font-medium', ROLE_CONFIG[profile?.role || 'viewer'].color)}>
              {ROLE_CONFIG[profile?.role || 'viewer'].label}
            </span>
          </div>
        </div>
        <form onSubmit={handleSaveProfile} className="flex gap-3">
          <div className="flex-1">
            <label className="label">Full Name</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="input"
              placeholder="Your full name"
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary self-end">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>

      {/* Invite — Admin only */}
      {isAdmin && (
        <div className="card p-5">
          <div className="flex items-center justify-between border-b border-[#2d3142] pb-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-300">Invite Team Members</h2>
              <p className="text-xs text-slate-500 mt-0.5">They'll receive a sign-in link directly in their inbox</p>
            </div>
            <button
              onClick={() => setShowBulk(b => !b)}
              className="text-xs text-sky-400 hover:text-sky-300 transition-colors flex-shrink-0"
            >
              {showBulk ? '← Single invite' : 'Bulk invite →'}
            </button>
          </div>

          {!showBulk ? (
            /* Single invite */
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="input"
                    placeholder="teammate@gmail.com"
                    required
                  />
                </div>
                <div className="w-40 flex-shrink-0">
                  <label className="label">Role</label>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as UserRole)}
                    className="select"
                  >
                    {Object.entries(ROLE_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Role descriptions */}
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(ROLE_CONFIG).map(([k, v]) => (
                  <div
                    key={k}
                    onClick={() => setInviteRole(k as UserRole)}
                    className={cn(
                      'p-2.5 rounded-lg border cursor-pointer transition-all text-xs',
                      inviteRole === k
                        ? 'border-sky-500/40 bg-sky-500/10'
                        : 'border-[#2d3142] hover:border-slate-500 bg-[#252836]'
                    )}
                  >
                    <p className={cn('font-medium mb-0.5', v.color)}>{v.label}</p>
                    <p className="text-slate-500 leading-tight">{v.desc}</p>
                  </div>
                ))}
              </div>

              <button type="submit" disabled={inviting || !inviteEmail.trim()} className="btn-primary">
                {inviting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Sending invite...
                  </span>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Invite Link
                  </>
                )}
              </button>

              {/* Fallback: email failed, show copyable link */}
              {fallbackLink && (
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-2">
                  <p className="text-xs text-amber-400 font-medium">Email provider not configured — share this link directly:</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={fallbackLink}
                      className="input text-xs font-mono flex-1"
                      onFocus={e => e.target.select()}
                    />
                    <button
                      type="button"
                      onClick={() => { navigator.clipboard.writeText(fallbackLink); toast.success('Copied!'); }}
                      className="btn-secondary text-xs px-3 flex-shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">Send this link to the user via WhatsApp, Slack, or any message. It expires in 24 hours.</p>
                </div>
              )}
            </form>
          ) : (
            /* Bulk invite */
            <form onSubmit={handleBulkInvite} className="space-y-4">
              <p className="text-xs text-slate-400">
                Paste multiple emails — one per line or comma-separated. Each person gets their own invite link sent directly to their inbox.
              </p>
              <div>
                <label className="label">Email Addresses</label>
                <textarea
                  value={bulkEmails}
                  onChange={e => setBulkEmails(e.target.value)}
                  className="textarea font-mono text-xs"
                  rows={6}
                  placeholder={"alice@gmail.com\nbob@company.com\ncharlie@gmail.com"}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {bulkEmails.split(/[\n,]+/).filter(e => e.trim().includes('@')).length} valid email(s) detected
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-44 flex-shrink-0">
                  <label className="label">Role for all</label>
                  <select value={bulkRole} onChange={e => setBulkRole(e.target.value as UserRole)} className="select">
                    {Object.entries(ROLE_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" disabled={bulkInviting || !bulkEmails.trim()} className="btn-primary self-end">
                  {bulkInviting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Send All Invites
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Team Members — Admin only */}
      {isAdmin && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-300 border-b border-[#2d3142] pb-3 mb-4">
            Team Members ({allProfiles.length})
          </h2>
          <div className="divide-y divide-[#2d3142]">
            {allProfiles.map(member => (
              <div key={member.id} className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {member.full_name ? getInitials(member.full_name) : member.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{member.full_name || 'No name set'}</p>
                  <p className="text-xs text-slate-500 truncate">{member.email}</p>
                </div>
                <select
                  value={member.role}
                  onChange={e => handleRoleChange(member.id, e.target.value as UserRole)}
                  disabled={member.id === profile?.id}
                  className="select text-xs py-1 w-36"
                >
                  {Object.entries(ROLE_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integrations */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-300 border-b border-[#2d3142] pb-3 mb-4">Integrations</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-[#252836] rounded-lg">
            <div>
              <p className="text-sm text-slate-300 font-medium">Email Notifications</p>
              <p className="text-xs text-slate-500 mt-0.5">Configured via EMAIL_RECIPIENTS env var</p>
            </div>
            <span className="badge bg-emerald-400/10 border-emerald-400/20 text-emerald-400 text-[11px]">Active</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#252836] rounded-lg">
            <div>
              <p className="text-sm text-slate-300 font-medium">Slack Webhook</p>
              <p className="text-xs text-slate-500 mt-0.5">Configured via SLACK_WEBHOOK_URL env var</p>
            </div>
            <span className="badge bg-[#2d3142] border-[#363a4f] text-slate-400 text-[11px]">Configure in .env</span>
          </div>
        </div>
      </div>
    </div>
  );
}
