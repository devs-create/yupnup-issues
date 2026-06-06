import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { sendWelcomeInviteEmail } from '@/lib/notifications';

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

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: callerProfile } = await supabase
    .from('profiles').select('role, full_name, email').eq('id', user.id).single();
  if (callerProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can add team members' }, { status: 403 });
  }

  const { email, password, full_name, role, send_email } = await request.json();

  if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  if (!password || password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

  const cleanEmail = email.toLowerCase().trim();
  const adminClient = makeAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const inviterName = callerProfile?.full_name || callerProfile?.email || 'Your Admin';

  // Case 1: Already in profiles
  const { data: existingProfile } = await adminClient
    .from('profiles').select('id, email, role').eq('email', cleanEmail).single();

  if (existingProfile) {
    await adminClient.auth.admin.updateUserById(existingProfile.id, { password, email_confirm: true });
    await adminClient.from('profiles').update({
      role: role || existingProfile.role,
      ...(full_name ? { full_name } : {}),
    }).eq('id', existingProfile.id);

    if (send_email) {
      try {
        await sendWelcomeInviteEmail({ to: cleanEmail, inviteeName: full_name || '', inviterName, email: cleanEmail, password, role: role || existingProfile.role, appUrl });
      } catch (e) { console.error('Email send error:', e); }
    }

    return NextResponse.json({
      success: true,
      message: `${cleanEmail} already exists — password and role updated.`,
      action: 'updated',
      credentials: { email: cleanEmail, password },
      email_sent: send_email,
    });
  }

  // Case 2: In auth but no profile
  const { data: authList } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  const existingAuthUser = authList?.users?.find(u => u.email?.toLowerCase() === cleanEmail);

  if (existingAuthUser) {
    await adminClient.auth.admin.updateUserById(existingAuthUser.id, { password, email_confirm: true });
    await adminClient.from('profiles').insert({
      id: existingAuthUser.id,
      email: existingAuthUser.email!,
      full_name: full_name || null,
      role: role || 'team_member',
    });

    if (send_email) {
      try {
        await sendWelcomeInviteEmail({ to: cleanEmail, inviteeName: full_name || '', inviterName, email: cleanEmail, password, role: role || 'team_member', appUrl });
      } catch (e) { console.error('Email send error:', e); }
    }

    return NextResponse.json({
      success: true,
      message: `${cleanEmail} added to the team.`,
      action: 'updated',
      credentials: { email: cleanEmail, password },
      email_sent: send_email,
    });
  }

  // Case 3: Brand new user
  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name || '' },
  });

  if (createError) return NextResponse.json({ error: createError.message }, { status: 400 });

  if (newUser?.user) {
    const { error: profileError } = await adminClient.from('profiles').insert({
      id: newUser.user.id,
      email: newUser.user.email!,
      full_name: full_name || null,
      role: role || 'team_member',
    });
    if (profileError) {
      await adminClient.auth.admin.deleteUser(newUser.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }
  }

  if (send_email) {
    try {
      await sendWelcomeInviteEmail({ to: cleanEmail, inviteeName: full_name || '', inviterName, email: cleanEmail, password, role: role || 'team_member', appUrl });
    } catch (e) { console.error('Email send error:', e); }
  }

  return NextResponse.json({
    success: true,
    message: `Account created for ${cleanEmail}.`,
    action: 'created',
    credentials: { email: cleanEmail, password },
    email_sent: send_email,
  });
}
