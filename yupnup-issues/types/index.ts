export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Platform = 'web' | 'android' | 'ios';
export type TicketStatus =
  | 'open'
  | 'pending'
  | 'investigating'
  | 'in_progress'
  | 'fixed'
  | 'qa_testing'
  | 'closed';
export type UserRole = 'admin' | 'team_member' | 'viewer';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  ticket_id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  platform: Platform;
  reporter_name: string;
  reporter_email: string;
  assigned_to: string | null;
  trading_market: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  assignee?: Profile;
  screenshots?: Screenshot[];
  comments?: Comment[];
  _count?: { comments: number; screenshots: number };
}

export interface Screenshot {
  id: string;
  ticket_id: string;
  url: string;
  filename: string;
  size: number;
  created_at: string;
  uploaded_by: string;
}

export interface Comment {
  id: string;
  ticket_id: string;
  content: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface ActivityLog {
  id: string;
  ticket_id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  actor_id: string;
  created_at: string;
  actor?: Profile;
}

export interface DashboardStats {
  total: number;
  open: number;
  pending: number;
  investigating: number;
  in_progress: number;
  fixed: number;
  qa_testing: number;
  closed: number;
  critical: number;
  avg_resolution_hours: number;
  created_this_week: number;
}

export interface TicketFilters {
  status?: TicketStatus | '';
  priority?: Priority | '';
  platform?: Platform | '';
  assigned_to?: string;
  date_from?: string;
  date_to?: string;
  tags?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}
