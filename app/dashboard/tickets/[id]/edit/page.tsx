import { createServerClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import TicketForm from '@/components/tickets/TicketForm';

export default async function EditTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: ticket } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single();

  if (!ticket) notFound();

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name');

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Edit Ticket</h1>
        <p className="text-slate-400 text-sm mt-0.5 font-mono">{ticket.ticket_id}</p>
      </div>
      <TicketForm members={members || []} ticket={ticket} />
    </div>
  );
}
