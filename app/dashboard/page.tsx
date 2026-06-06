import { createServerClient } from '@/lib/supabase';
import StatsCards from '@/components/dashboard/StatsCards';
import ChartsSection from '@/components/dashboard/ChartsSection';
import RecentTickets from '@/components/dashboard/RecentTickets';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { DashboardStats } from '@/types';

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, status, priority, platform, created_at, updated_at')
    .order('created_at', { ascending: false });

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const stats: DashboardStats = {
    total: tickets?.length || 0,
    open: tickets?.filter(t => t.status === 'open').length || 0,
    pending: tickets?.filter(t => t.status === 'pending').length || 0,
    investigating: tickets?.filter(t => t.status === 'investigating').length || 0,
    in_progress: tickets?.filter(t => t.status === 'in_progress').length || 0,
    fixed: tickets?.filter(t => t.status === 'fixed').length || 0,
    qa_testing: tickets?.filter(t => t.status === 'qa_testing').length || 0,
    closed: tickets?.filter(t => t.status === 'closed').length || 0,
    critical: tickets?.filter(t => t.priority === 'critical').length || 0,
    avg_resolution_hours: 0,
    created_this_week: tickets?.filter(t => new Date(t.created_at) > oneWeekAgo).length || 0,
  };

  const closedTickets = tickets?.filter(t => t.status === 'closed') || [];
  if (closedTickets.length > 0) {
    const totalHours = closedTickets.reduce((sum, t) => {
      return sum + (new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()) / 3600000;
    }, 0);
    stats.avg_resolution_hours = Math.round(totalHours / closedTickets.length);
  }

  const { data: recentTickets } = await supabase
    .from('tickets')
    .select('*, assignee:profiles!tickets_assigned_to_fkey(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(8);

  const trendData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      count: tickets?.filter(t => t.created_at.startsWith(dateStr)).length || 0,
    };
  });

  const statusData = [
    { name: 'Open', value: stats.open, color: '#38bdf8' },
    { name: 'Pending', value: stats.pending, color: '#fbbf24' },
    { name: 'Investigating', value: stats.investigating, color: '#fb923c' },
    { name: 'In Progress', value: stats.in_progress, color: '#a78bfa' },
    { name: 'Fixed', value: stats.fixed, color: '#34d399' },
    { name: 'QA Testing', value: stats.qa_testing, color: '#22d3ee' },
    { name: 'Closed', value: stats.closed, color: '#64748b' },
  ].filter(d => d.value > 0);

  const priorityData = [
    { name: 'Critical', value: tickets?.filter(t => t.priority === 'critical').length || 0, color: '#ef4444' },
    { name: 'High', value: tickets?.filter(t => t.priority === 'high').length || 0, color: '#f97316' },
    { name: 'Medium', value: tickets?.filter(t => t.priority === 'medium').length || 0, color: '#eab308' },
    { name: 'Low', value: tickets?.filter(t => t.priority === 'low').length || 0, color: '#64748b' },
  ].filter(d => d.value > 0);

  const platformData = [
    { name: 'Web', value: tickets?.filter(t => t.platform === 'web').length || 0, color: '#38bdf8' },
    { name: 'Android', value: tickets?.filter(t => t.platform === 'android').length || 0, color: '#34d399' },
    { name: 'iOS', value: tickets?.filter(t => t.platform === 'ios').length || 0, color: '#a78bfa' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardHeader />
      <StatsCards stats={stats} />
      <ChartsSection statusData={statusData} priorityData={priorityData} platformData={platformData} trendData={trendData} />
      <RecentTickets tickets={recentTickets || []} />
    </div>
  );
}
