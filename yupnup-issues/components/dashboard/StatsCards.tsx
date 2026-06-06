import { DashboardStats } from '@/types';
import { cn } from '@/lib/utils';

interface Props { stats: DashboardStats; }

const statCards = (stats: DashboardStats) => [
  { label: 'Total Issues', value: stats.total, icon: '📋', color: 'text-slate-300', sub: 'All time' },
  { label: 'Open', value: stats.open, icon: '🔵', color: 'text-blue-400', sub: 'Needs attention' },
  { label: 'Pending', value: stats.pending, icon: '🟡', color: 'text-yellow-400', sub: 'Awaiting action' },
  { label: 'Investigating', value: stats.investigating, icon: '🟠', color: 'text-orange-400', sub: 'Being reviewed' },
  { label: 'In Progress', value: stats.in_progress, icon: '🟣', color: 'text-purple-400', sub: 'Active work' },
  { label: 'Fixed', value: stats.fixed, icon: '🟢', color: 'text-emerald-400', sub: 'Resolved' },
  { label: 'QA Testing', value: stats.qa_testing, icon: '🩵', color: 'text-cyan-400', sub: 'Verifying fix' },
  { label: 'Closed', value: stats.closed, icon: '⚪', color: 'text-slate-400', sub: 'Completed' },
];

export default function StatsCards({ stats }: Props) {
  return (
    <div className="space-y-3">
      {/* Key metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 col-span-1">
          <p className="text-xs text-slate-500 mb-1">Total Issues</p>
          <p className="text-3xl font-black text-white">{stats.total}</p>
          <p className="text-xs text-slate-500 mt-1">All time</p>
        </div>
        <div className="card p-4 border-red-500/20 bg-red-500/5 col-span-1">
          <p className="text-xs text-red-400 mb-1">⚡ Critical Bugs</p>
          <p className="text-3xl font-black text-red-400">{stats.critical}</p>
          <p className="text-xs text-red-400/60 mt-1">Need immediate action</p>
        </div>
        <div className="card p-4 col-span-1">
          <p className="text-xs text-slate-500 mb-1">Avg Resolution</p>
          <p className="text-3xl font-black text-white">
            {stats.avg_resolution_hours > 0 ? `${stats.avg_resolution_hours}h` : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">For closed tickets</p>
        </div>
        <div className="card p-4 border-sky-500/20 bg-sky-500/5 col-span-1">
          <p className="text-xs text-sky-400 mb-1">Created This Week</p>
          <p className="text-3xl font-black text-sky-400">{stats.created_this_week}</p>
          <p className="text-xs text-sky-400/60 mt-1">Last 7 days</p>
        </div>
      </div>

      {/* Status row */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {statCards(stats).map((card) => (
          <div key={card.label} className="card p-3 text-center hover:border-slate-600 transition-colors">
            <p className="text-lg">{card.icon}</p>
            <p className={cn('text-xl font-bold mt-1', card.color)}>{card.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
