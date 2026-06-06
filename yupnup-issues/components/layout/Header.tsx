'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Profile } from '@/types';
import InviteModal from '@/components/dashboard/InviteModal';

export default function Header({ profile }: { profile: Profile | null }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) router.push(`/dashboard/tickets?search=${encodeURIComponent(search.trim())}`);
  }

  return (
    <>
      <header className="h-14 flex items-center gap-3 px-6 bg-[#13151f] border-b border-[#2d3142] flex-shrink-0">
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tickets…"
              className="w-full bg-[#1a1d27] border border-[#2d3142] rounded-lg pl-9 pr-4 py-1.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-colors"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
            Add Member
          </button>
          <Link href="/dashboard/tickets/new" className="btn-primary text-xs px-3 py-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            New Ticket
          </Link>
        </div>
      </header>
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
}
