'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { Ticket, Profile, TicketStatus } from '@/types';
import { STATUS_CONFIG, PRIORITY_CONFIG, PLATFORM_CONFIG, STATUS_FLOW, formatDateTime, timeAgo, cn, getInitials } from '@/lib/utils';

interface Props {
  ticket: Ticket & { activity_logs?: any[] };
  members: Pick<Profile, 'id' | 'full_name' | 'email'>[];
  currentProfile: Profile | null;
}

export default function TicketDetail({ ticket, members, currentProfile }: Props) {
  const router = useRouter();
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const status = STATUS_CONFIG[ticket.status];
  const priority = PRIORITY_CONFIG[ticket.priority];
  const platform = PLATFORM_CONFIG[ticket.platform];
  const isAdmin = currentProfile?.role === 'admin';
  const isTeamMember = currentProfile?.role === 'team_member' || isAdmin;

  async function handleStatusChange(newStatus: TicketStatus) {
    setChangingStatus(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast.success(`Status updated to ${STATUS_CONFIG[newStatus].label}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setChangingStatus(false);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: comment }),
      });
      if (!res.ok) throw new Error('Failed to add comment');
      setComment('');
      toast.success('Comment added');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this ticket? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Ticket deleted');
      router.push('/dashboard/tickets');
    } catch (err: any) {
      toast.error(err.message);
      setDeleting(false);
    }
  }

  async function handleAssign(assigneeId: string) {
    const res = await fetch(`/api/tickets/${ticket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_to: assigneeId || null }),
    });
    if (res.ok) { toast.success('Assignee updated'); router.refresh(); }
    else toast.error('Failed to update assignee');
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard/tickets" className="hover:text-slate-300 transition-colors">Tickets</Link>
        <span>/</span>
        <span className="text-slate-400 font-mono">{ticket.ticket_id}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title + status */}
          <div className="card p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-slate-500 bg-[#252836] px-2 py-0.5 rounded">{ticket.ticket_id}</span>
                  <span className={cn('badge', status.bg, status.color)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse-dot', status.dot)} />
                    {status.label}
                  </span>
                  <span className={cn('badge', priority.bg, priority.color)}>
                    {priority.icon} {priority.label}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-white">{ticket.title}</h1>
              </div>
              {isTeamMember && (
                <div className="flex gap-2 flex-shrink-0">
                  <Link href={`/dashboard/tickets/${ticket.id}/edit`} className="btn-secondary text-xs py-1.5 px-3">Edit</Link>
                  {isAdmin && (
                    <button onClick={handleDelete} disabled={deleting} className="btn-danger text-xs py-1.5 px-3">
                      {deleting ? '...' : 'Delete'}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="prose prose-sm prose-invert max-w-none">
              <p className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">{ticket.description}</p>
            </div>
          </div>

          {/* Screenshots */}
          {ticket.screenshots && ticket.screenshots.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Screenshots ({ticket.screenshots.length})</h3>
              <div className="flex flex-wrap gap-3">
                {ticket.screenshots.map((ss: any) => (
                  <button key={ss.id} onClick={() => setSelectedImage(ss.url)} className="group relative">
                    <Image
                      src={ss.url}
                      alt={ss.filename}
                      width={120}
                      height={90}
                      className="rounded-lg object-cover border border-[#2d3142] group-hover:border-sky-500/50 transition-colors"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center">
                      <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status change */}
          {isTeamMember && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Update Status</h3>
              <div className="flex flex-wrap gap-2">
                {STATUS_FLOW.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={s === ticket.status || changingStatus}
                    className={cn(
                      'badge cursor-pointer hover:opacity-80 transition-opacity disabled:cursor-default',
                      s === ticket.status
                        ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color} ring-1 ring-current`
                        : 'bg-[#252836] border-[#2d3142] text-slate-400 hover:text-slate-200'
                    )}
                  >
                    {STATUS_CONFIG[s].label}
                    {s === ticket.status && ' ✓'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">
              Discussion {ticket.comments && ticket.comments.length > 0 && `(${ticket.comments.length})`}
            </h3>

            <div className="space-y-4 mb-4">
              {(!ticket.comments || ticket.comments.length === 0) && (
                <p className="text-sm text-slate-500 text-center py-4">No comments yet. Be the first to add one.</p>
              )}
              {ticket.comments?.map((c: any) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">
                    {c.author?.full_name ? getInitials(c.author.full_name) : c.author?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-200">{c.author?.full_name || c.author?.email || 'Unknown'}</span>
                      <span className="text-xs text-slate-500">{timeAgo(c.created_at)}</span>
                    </div>
                    <div className="bg-[#252836] border border-[#2d3142] rounded-lg p-3">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{c.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-1">
                {currentProfile?.full_name ? getInitials(currentProfile.full_name) : currentProfile?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 space-y-2">
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  className="textarea"
                  rows={3}
                  placeholder="Add a comment..."
                />
                <button type="submit" disabled={submittingComment || !comment.trim()} className="btn-primary text-xs py-1.5">
                  {submittingComment ? 'Adding...' : 'Add Comment'}
                </button>
              </div>
            </form>
          </div>

          {/* Activity */}
          {(ticket as any).activity_logs?.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Activity Timeline</h3>
              <div className="space-y-3">
                {(ticket as any).activity_logs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500/50 mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">
                        <span className="text-slate-300 font-medium">{log.actor?.full_name || log.actor?.email || 'System'}</span>
                        {' '}{log.action}
                        {log.old_value && log.new_value && (
                          <span> from <span className="text-slate-300">{log.old_value}</span> to <span className="text-sky-400">{log.new_value}</span></span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5">{formatDateTime(log.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-4 space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Details</h3>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Platform</p>
                <p className="text-sm text-slate-300 flex items-center gap-1.5">{platform.icon} {platform.label}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">Reporter</p>
                <p className="text-sm text-slate-300 font-medium">{ticket.reporter_name}</p>
                <p className="text-xs text-slate-500">{ticket.reporter_email}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">Assignee</p>
                {isTeamMember ? (
                  <select
                    value={ticket.assigned_to || ''}
                    onChange={e => handleAssign(e.target.value)}
                    className="select text-xs py-1.5"
                  >
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-slate-300">
                    {(ticket as any).assignee?.full_name || (ticket as any).assignee?.email || 'Unassigned'}
                  </p>
                )}
              </div>

              {ticket.trading_market && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Trading Market</p>
                  <p className="text-sm text-slate-300">{ticket.trading_market}</p>
                </div>
              )}

              {ticket.tags && ticket.tags.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {ticket.tags.map((tag: string) => (
                      <span key={tag} className="badge bg-[#252836] border-[#2d3142] text-slate-400 text-[10px]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-[#2d3142] space-y-2">
                <div>
                  <p className="text-xs text-slate-500">Created</p>
                  <p className="text-xs text-slate-400">{formatDateTime(ticket.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Updated</p>
                  <p className="text-xs text-slate-400">{formatDateTime(ticket.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img src={selectedImage} alt="Screenshot" className="max-w-full max-h-full object-contain rounded-lg" />
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            onClick={() => setSelectedImage(null)}
          >✕</button>
        </div>
      )}
    </div>
  );
}
