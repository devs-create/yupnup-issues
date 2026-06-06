import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notifyNewComment } from '@/lib/notifications';
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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);

  // Any logged-in user can comment
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { content } = await request.json();
  if (!content?.trim()) return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({ ticket_id: id, content: content.trim(), author_id: user.id })
    .select('*, author:profiles(id, full_name, email)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: ticket } = await supabase.from('tickets').select('*').eq('id', id).single();
  if (ticket) {
    const authorName = (comment as any).author?.full_name || (comment as any).author?.email || 'Someone';
    await supabase.from('activity_logs').insert({
      ticket_id: id, action: 'added a comment', actor_id: user.id,
    });
    try {
      await notifyNewComment(ticket, content, authorName);
      await sendSlackNotification(ticket, 'comment_added', { comment: content });
    } catch (e) { console.error('Notification error:', e); }
  }

  return NextResponse.json({ comment });
}
