import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    let updateData: Record<string, unknown> = {};
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const tags = (formData.get('tags') as string || '')
        .split(',').map(t => t.trim()).filter(Boolean);
      updateData = {
        title: formData.get('title'),
        description: formData.get('description'),
        priority: formData.get('priority'),
        platform: formData.get('platform'),
        status: formData.get('status'),
        reporter_name: formData.get('reporter_name'),
        reporter_email: formData.get('reporter_email'),
        assigned_to: (formData.get('assigned_to') as string) || null,
        trading_market: (formData.get('trading_market') as string) || null,
        tags,
        updated_at: new Date().toISOString(),
      };

      const screenshots = formData.getAll('screenshots') as File[];
      for (const file of screenshots) {
        if (file.size === 0) continue;
        const ext = file.name.split('.').pop();
        const path = `tickets/${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { data: upload, error: uploadError } = await supabase.storage
          .from('screenshots').upload(path, file, { contentType: file.type });
        if (!uploadError && upload) {
          const { data: { publicUrl } } = supabase.storage.from('screenshots').getPublicUrl(path);
          await supabase.from('screenshots').insert({
            ticket_id: id, url: publicUrl, filename: file.name,
            size: file.size, uploaded_by: user.id,
          });
        }
      }
    } else {
      const body = await request.json();
      updateData = { ...body, updated_at: new Date().toISOString() };
    }

    const { data: ticket, error } = await supabase
      .from('tickets').update(updateData).eq('id', id).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await supabase.from('activity_logs').insert({
      ticket_id: id, action: 'updated this ticket', actor_id: user.id,
    });

    return NextResponse.json({ ticket });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can delete tickets' }, { status: 403 });
  }

  const { error } = await supabase.from('tickets').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
