import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notifyNewTicket, notifyCriticalIssue } from '@/lib/notifications';
import { sendSlackNotification } from '@/lib/slack';

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

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await request.formData();
    const tags = (formData.get('tags') as string || '')
      .split(',').map(t => t.trim()).filter(Boolean);

    const { count } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true });

    const ticketNum = String((count || 0) + 1).padStart(3, '0');
    const ticketId = `YUP-${ticketNum}`;

    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        ticket_id: ticketId,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        priority: formData.get('priority') as string,
        platform: formData.get('platform') as string,
        reporter_name: formData.get('reporter_name') as string,
        reporter_email: formData.get('reporter_email') as string,
        assigned_to: (formData.get('assigned_to') as string) || null,
        trading_market: (formData.get('trading_market') as string) || null,
        tags,
        status: 'open',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Upload screenshots
    const screenshots = formData.getAll('screenshots') as File[];
    for (const file of screenshots) {
      if (file.size === 0) continue;
      const ext = file.name.split('.').pop();
      const path = `tickets/${ticket.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data: upload, error: uploadError } = await supabase.storage
        .from('screenshots')
        .upload(path, file, { contentType: file.type });
      if (!uploadError && upload) {
        const { data: { publicUrl } } = supabase.storage.from('screenshots').getPublicUrl(path);
        await supabase.from('screenshots').insert({
          ticket_id: ticket.id, url: publicUrl, filename: file.name,
          size: file.size, uploaded_by: user.id,
        });
      }
    }

    await supabase.from('activity_logs').insert({
      ticket_id: ticket.id, action: 'created this ticket', actor_id: user.id,
    });

    try {
      await notifyNewTicket(ticket);
      if (ticket.priority === 'critical') await notifyCriticalIssue(ticket);
      await sendSlackNotification(ticket, 'created');
    } catch (e) { console.error('Notification error:', e); }

    return NextResponse.json({ ticket });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
