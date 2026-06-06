'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Ticket, Profile, TicketStatus, Priority, Platform } from '@/types';
import { STATUS_CONFIG, PRIORITY_CONFIG, PLATFORM_CONFIG, timeAgo, cn } from '@/lib/utils';

interface Props {
  tickets: Ticket[];
  totalCount: number;
  page: number;
  perPage: number;
  members: Pick<Profile, 'id' | 'full_name' | 'email'>[];
}

export default function TicketsList({ tickets, totalCount, page, perPage, members }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    router.push(`/dashboard/tickets?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParam('search', search);
  }

  const totalPages = Math.ceil(totalCount / perPage);
  const activeFilters = ['status', 'priority', 'platform', 'assigned_to', 'search', 'date_from', 'date_to']
    .filter(k => searchParams.get(k)).length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">All Tickets</h1>
          <p className="text-slate-400 text-sm mt-0.5">{totalCount} tickets total</p>
        </div>
        <Link href="/dashboard/tickets/new" className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Ticket
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, ID, reporter..."
              className="input pl-9"
            />
          </div>
          <button type="submit" className="btn-secondary">Search</button>
        </form>

        <div className="flex flex-wrap gap-2">
          <select className="select text-sm py-1.5 w-auto" value={searchParams.get('status') || ''} onChange={e => updateParam('status', e.target.value)}>
            <option value="">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>

          <select className="select text-sm py-1.5 w-auto" value={searchParams.get('priority') || ''} onChange={e => updateParam('priority', e.target.value)}>
            <option value="">All Priority</option>
            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>

          <select className="select text-sm py-1.5 w-auto" value={searchParams.get('platform') || ''} onChange={e => updateParam('platform', e.target.value)}>
            <option value="">All Platforms</option>
            {Object.entries(PLATFORM_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>

          <select className="select text-sm py-1.5 w-auto" value={searchParams.get('assigned_to') || ''} onChange={e => updateParam('assigned_to', e.target.value)}>
            <option value="">All Assignees</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.full_name || m.email}</option>)}
          </select>

          <input type="date" className="select text-sm py-1.5 w-auto" value={searchParams.get('date_from') || ''} onChange={e => updateParam('date_from', e.target.value)} />
          <input type="date" className="select text-sm py-1.5 w-auto" value={searchParams.get('date_to') || ''} onChange={e => updateParam('date_to', e.target.value)} />

          {activeFilters > 0 && (
            <button onClick={() => router.push('/dashboard/tickets')} className="btn-danger py-1.5 text-xs">
              Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {tickets.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-slate-400">No tickets found matching your filters.</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[1fr_5fr_1.5fr_1.5fr_1.5fr_2fr_1fr] gap-3 px-4 py-2.5 border-b border-[#2d3142] text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              <span>ID</span>
              <span>Title</span>
              <span>Status</span>
              <span>Priority</span>
              <span>Platform</span>
              <span>Assignee</span>
              <span>Created</span>
            </div>

            <div className="divide-y divide-[#2d3142]">
              {tickets.map((ticket) => {
                const status = STATUS_CONFIG[ticket.status];
                const priority = PRIORITY_CONFIG[ticket.priority];
                const platform = PLATFORM_CONFIG[ticket.platform];
                return (
                  <Link
                    key={ticket.id}
                    href={`/dashboard/tickets/${ticket.id}`}
                    className="flex md:grid md:grid-cols-[1fr_5fr_1.5fr_1.5fr_1.5fr_2fr_1fr] gap-3 items-center px-4 py-3 hover:bg-[#1e2130] transition-colors group"
                  >
                    <span className="text-xs font-mono text-slate-500">{ticket.ticket_id}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 group-hover:text-white transition-colors truncate font-medium">{ticket.title}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5 md:hidden">
                        {priority.label} · {status.label} · {timeAgo(ticket.created_at)}
                      </p>
                    </div>
                    <span className={cn('badge hidden md:inline-flex', status.bg, status.color)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
                      {status.label}
                    </span>
                    <span className={cn('badge hidden md:inline-flex', priority.bg, priority.color)}>
                      {priority.icon} {priority.label}
                    </span>
                    <span className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
                      <span>{platform.icon}</span> {platform.label}
                    </span>
                    <span className="text-xs text-slate-500 hidden md:block truncate">
                      {(ticket as any).assignee?.full_name || (ticket as any).assignee?.email || '—'}
                    </span>
                    <span className="text-xs text-slate-600 hidden md:block">{timeAgo(ticket.created_at)}</span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalCount)} of {totalCount}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <button onClick={() => updateParam('page', String(page - 1))} className="btn-secondary text-xs py-1.5 px-3">
                ← Previous
              </button>
            )}
            {page < totalPages && (
              <button onClick={() => updateParam('page', String(page + 1))} className="btn-secondary text-xs py-1.5 px-3">
                Next →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
