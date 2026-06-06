import { createServerClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import TicketDetail from '@/components/tickets/TicketDetail';

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: ticket } = await supabase
    .from('tickets')
    .select(`
      *,
      assignee:profiles!tickets_assigned_to_fkey(id, full_name, email, avatar_url),
      screenshots(*),
      comments(*, author:profiles(id, full_name, email, avatar_url)),
      activity_logs(*, actor:profiles(id, full_name, email))
    `)
    .eq('id', id)
    .order('created_at', { referencedTable: 'comments', ascending: true })
    .order('created_at', { referencedTable: 'activity_logs', ascending: true })
    .single();

  if (!ticket) notFound();

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name');

  const { data: sessionData } = await supabase.auth.getSession();
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', sessionData.session?.user.id || '')
    .single();

  return <TicketDetail ticket={ticket} members={members || []} currentProfile={currentProfile} />;
}
