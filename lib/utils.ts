import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Priority, TicketStatus, Platform } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; bg: string; dot: string }> = {
  open: { label: 'Open', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', dot: 'bg-blue-400' },
  pending: { label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', dot: 'bg-yellow-400' },
  investigating: { label: 'Investigating', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20', dot: 'bg-orange-400' },
  in_progress: { label: 'In Progress', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20', dot: 'bg-purple-400' },
  fixed: { label: 'Fixed', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', dot: 'bg-emerald-400' },
  qa_testing: { label: 'QA Testing', color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/20', dot: 'bg-cyan-400' },
  closed: { label: 'Closed', color: 'text-slate-400', bg: 'bg-slate-400/10 border-slate-400/20', dot: 'bg-slate-400' },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; icon: string }> = {
  low: { label: 'Low', color: 'text-slate-400', bg: 'bg-slate-400/10 border-slate-400/20', icon: '▽' },
  medium: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', icon: '◈' },
  high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20', icon: '△' },
  critical: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20', icon: '⚡' },
};

export const PLATFORM_CONFIG: Record<Platform, { label: string; color: string; icon: string }> = {
  web: { label: 'Web', color: 'text-blue-400', icon: '🌐' },
  android: { label: 'Android', color: 'text-green-400', icon: '🤖' },
  ios: { label: 'iOS', color: 'text-slate-300', icon: '🍎' },
};

export const STATUS_FLOW: TicketStatus[] = [
  'open', 'pending', 'investigating', 'in_progress', 'fixed', 'qa_testing', 'closed'
];

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

export function formatDateTime(date: string) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function timeAgo(date: string) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
