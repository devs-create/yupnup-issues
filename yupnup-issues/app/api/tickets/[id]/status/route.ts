import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notifyStatusChange } from '@/lib/notifications';
import { sendSlackNotification } from '@/lib/slack';
import { STATUS_CONFIG } from '@/lib/utils';
import { TicketStatus } from '@/types';

function makeSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(list) { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
      },
    }
  );
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);

  // Any logged-in user can change status
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { status } = await request.json() as { status: TicketStatus };

  const { data: currentTicket } = await supabase.from('tickets').select('*').eq('id', id).single();
  if (!currentTicket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

  const { data: ticket, error } = await supabase
    .from('tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: actor } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single();
  const actorName = actor?.full_name || actor?.email || 'Someone';
  const oldLabel  = STATUS_CONFIG[currentTicket.status as TicketStatus]?.label || currentTicket.status;
  const newLabel  = STATUS_CONFIG[status]?.label || status;

  await supabase.from('activity_logs').insert({
    ticket_id: id, action: 'changed status',
    old_value: oldLabel, new_value: newLabel, actor_id: user.id,
  });

  try {
    await notifyStatusChange(ticket, oldLabel, newLabel, actorName);
    await sendSlackNotification(ticket, 'status_changed', { old_status: oldLabel, new_status: newLabel });
  } catch (e) { console.error('Notification error:', e); }

  return NextResponse.json({ ticket });
}
