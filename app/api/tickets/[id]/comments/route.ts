import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { notifyNewComment } from '@/lib/notifications';
import { sendSlackNotification } from '@/lib/slack';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { content } = await request.json();
  if (!content?.trim()) return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      ticket_id: id,
      content: content.trim(),
      author_id: session.user.id,
    })
    .select('*, author:profiles(id, full_name, email)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: ticket } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single();

  if (ticket) {
    const authorName = (comment as Record<string, unknown> & { author?: { full_name?: string; email?: string } })
      .author?.full_name || (comment as Record<string, unknown> & { author?: { email?: string } }).author?.email || 'Someone';

    await supabase.from('activity_logs').insert({
      ticket_id: id,
      action: 'added a comment',
      actor_id: session.user.id,
    });

    try {
      await notifyNewComment(ticket, content, authorName);
      await sendSlackNotification(ticket, 'comment_added', { comment: content });
    } catch (err) {
      console.error('Notification error:', err);
    }
  }

  return NextResponse.json({ comment });
}
