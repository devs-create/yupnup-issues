import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { notifyStatusChange } from '@/lib/notifications';
import { sendSlackNotification } from '@/lib/slack';
import { STATUS_CONFIG } from '@/lib/utils';
import { TicketStatus } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { status } = await request.json() as { status: TicketStatus };

  const { data: currentTicket } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single();

  if (!currentTicket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

  const { data: ticket, error } = await supabase
    .from('tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: actor } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', session.user.id)
    .single();

  const actorName = actor?.full_name || actor?.email || 'Someone';
  const oldLabel = STATUS_CONFIG[currentTicket.status as TicketStatus]?.label || currentTicket.status;
  const newLabel = STATUS_CONFIG[status]?.label || status;

  await supabase.from('activity_logs').insert({
    ticket_id: id,
    action: 'changed status',
    old_value: oldLabel,
    new_value: newLabel,
    actor_id: session.user.id,
  });

  try {
    await notifyStatusChange(ticket, oldLabel, newLabel, actorName);
    await sendSlackNotification(ticket, 'status_changed', {
      old_status: oldLabel,
      new_status: newLabel,
    });
  } catch (err) {
    console.error('Notification error:', err);
  }

  return NextResponse.json({ ticket });
}
