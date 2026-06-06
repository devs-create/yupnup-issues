import { createServerClient } from '@/lib/supabase';
import TicketsList from '@/components/tickets/TicketsList';

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const supabase = await createServerClient();

  let query = supabase
    .from('tickets')
    .select('*, assignee:profiles!tickets_assigned_to_fkey(id, full_name, email)', { count: 'exact' });

  if (params.status) query = query.eq('status', params.status as string);
  if (params.priority) query = query.eq('priority', params.priority as string);
  if (params.platform) query = query.eq('platform', params.platform as string);
  if (params.assigned_to) query = query.eq('assigned_to', params.assigned_to as string);
  if (params.search) {
    const s = params.search as string;
    query = query.or(`title.ilike.%${s}%,description.ilike.%${s}%,ticket_id.ilike.%${s}%,reporter_name.ilike.%${s}%`);
  }
  if (params.date_from) query = query.gte('created_at', params.date_from as string);
  if (params.date_to) query = query.lte('created_at', `${params.date_to}T23:59:59`);

  const sortBy = (params.sort_by as string) || 'created_at';
  const sortAsc = params.sort_order === 'asc';
  query = query.order(sortBy, { ascending: sortAsc });

  const page = parseInt((params.page as string) || '1');
  const perPage = 20;
  query = query.range((page - 1) * perPage, page * perPage - 1);

  const { data: tickets, count } = await query;

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name');

  return (
    <TicketsList
      tickets={tickets || []}
      totalCount={count || 0}
      page={page}
      perPage={perPage}
      members={members || []}
    />
  );
}
