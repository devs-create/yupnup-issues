import { createServerClient } from '@/lib/supabase';
import TicketForm from '@/components/tickets/TicketForm';

export default async function NewTicketPage() {
  const supabase = await createServerClient();
  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name');

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Create New Ticket</h1>
        <p className="text-slate-400 text-sm mt-0.5">Report a bug, issue, or feature request</p>
      </div>
      <TicketForm members={members || []} />
    </div>
  );
}
