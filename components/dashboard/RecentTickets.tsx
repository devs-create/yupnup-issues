import Link from 'next/link';
import { Ticket } from '@/types';
import { STATUS_CONFIG, PRIORITY_CONFIG, timeAgo } from '@/lib/utils';

export default function RecentTickets({ tickets }: { tickets: Ticket[] }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between p-4 border-b border-[#2d3142]">
        <h3 className="text-sm font-semibold text-slate-300">Recent Tickets</h3>
        <Link href="/dashboard/tickets" className="text-xs text-sky-400 hover:text-sky-300 transition-colors">
          View all →
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-slate-400 text-sm">No tickets yet. Create your first one!</p>
          <Link href="/dashboard/tickets/new" className="btn-primary mt-4 text-xs">
            Create Ticket
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-[#2d3142]">
          {tickets.map((ticket) => {
            const status = STATUS_CONFIG[ticket.status];
            const priority = PRIORITY_CONFIG[ticket.priority];
            return (
              <Link
                key={ticket.id}
                href={`/dashboard/tickets/${ticket.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#1e2130] transition-colors group"
              >
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.dot}`} />

                <span className="text-xs font-mono text-slate-500 flex-shrink-0 w-16">{ticket.ticket_id}</span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 group-hover:text-white transition-colors truncate">{ticket.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{ticket.reporter_name} · {ticket.platform}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge ${priority.bg} ${priority.color} text-[10px]`}>
                    {priority.icon} {priority.label}
                  </span>
                  <span className={`badge ${status.bg} ${status.color} text-[10px]`}>
                    {status.label}
                  </span>
                  <span className="text-xs text-slate-600 hidden md:block">{timeAgo(ticket.created_at)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
