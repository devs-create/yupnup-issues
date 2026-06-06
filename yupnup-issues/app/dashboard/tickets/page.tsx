import { createServerClient } from '@/lib/supabase';
import TicketsList from '@/components/tickets/TicketsList';

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const supabase = await createServerClient();

  let query = supabase
    .from('tickets')
    .select('*, assignee:profiles!tickets_assigned_to_fkey(id, full_name, email)', { count: 'exact' });

  if (sp.status) query = query.eq('status', sp.status as string);
  if (sp.priority) query = query.eq('priority', sp.priority as string);
  if (sp.platform) query = query.eq('platform', sp.platform as string);
  if (sp.assigned_to) query = query.eq('assigned_to', sp.assigned_to as string);
  if (sp.search) {
    const s = sp.search as string;
    query = query.or(`title.ilike.%${s}%,description.ilike.%${s}%,ticket_id.ilike.%${s}%,reporter_name.ilike.%${s}%`);
  }
  if (sp.date_from) query = query.gte('created_at', sp.date_from as string);
  if (sp.date_to) query = query.lte('created_at', `${sp.date_to}T23:59:59`);

  const sortBy = (sp.sort_by as string) || 'created_at';
  const ascending = sp.sort_order === 'asc';
  query = query.order(sortBy, { ascending });

  const page = parseInt((sp.page as string) || '1');
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
