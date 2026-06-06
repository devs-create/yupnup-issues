
'use client';
import { useState } from 'react';
import Link from 'next/link';
import InviteModal from './InviteModal';

export default function DashboardHeader() {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Overview of all issues and activity</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all"
          >
            👥 Add Member
          </button>
          <Link href="/dashboard/tickets/new" className="btn-primary py-2 px-4 text-sm">
            + New Ticket
          </Link>
        </div>
      </div>
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
}
