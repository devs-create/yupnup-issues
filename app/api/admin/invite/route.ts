import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@yupnup.com';
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'resend';

async function sendInviteEmail(to: string, inviteUrl: string, role: string) {
  const roleLabel = role === 'admin' ? 'Admin' : role === 'team_member' ? 'Team Member' : 'Viewer';
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#1a1d27;border:1px solid #2d3142;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#0ea5e9,#6366f1);padding:24px 32px;">
      <span style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-1px;">YUP<span style="color:#bae6fd;">NUP</span></span>
      <p style="margin:4px 0 0;color:#bae6fd;font-size:13px;opacity:0.9;">Issue Tracker · Team Invite</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:20px;font-weight:700;">You've been invited</h2>
      <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;line-height:1.6;">
        You've been added to the <strong style="color:#e2e8f0;">YupNup Issue Tracker</strong> as a
        <strong style="color:#38bdf8;"> ${roleLabel}</strong>.
        Click the button below to sign in — no password needed.
      </p>
      <a href="${inviteUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.01em;">
        Accept Invite &amp; Sign In →
      </a>
      <p style="margin:24px 0 0;color:#475569;font-size:12px;line-height:1.6;">
        This link expires in 24 hours. If you didn't expect this invite, you can safely ignore this email.
      </p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #2d3142;background:#161820;">
      <p style="margin:0;color:#475569;font-size:12px;">YupNup Internal Issue Tracker · Sent by your team admin</p>
    </div>
  </div>
</body>
</html>`;

  if (EMAIL_PROVIDER === 'resend') {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: EMAIL_FROM, to: [to], subject: `You're invited to YupNup Issue Tracker`, html });
  } else {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    await transporter.sendMail({
      from: `YupNup Issues <${process.env.GMAIL_USER}>`,
      to,
      subject: `You're invited to YupNup Issue Tracker`,
      html,
    });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (callerProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can invite users' }, { status: 403 });
  }

  const { email, role = 'viewer' } = await request.json();
  if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Generate the sign-in link ourselves — no Supabase email sent, no rate limit
  let inviteUrl: string;
  let userId: string | undefined;

  // Try invite link first (new user)
  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.generateLink({
    type: 'invite',
    email: email.trim(),
    options: { redirectTo: `${APP_URL}/auth/callback` },
  });

  if (inviteError) {
    // User already exists — generate a magic link instead
    const { data: mlData, error: mlError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: email.trim(),
      options: { redirectTo: `${APP_URL}/auth/callback` },
    });
    if (mlError) return NextResponse.json({ error: mlError.message }, { status: 400 });
    inviteUrl = mlData.properties.action_link;
    userId = mlData.user.id;
  } else {
    inviteUrl = inviteData.properties.action_link;
    userId = inviteData.user.id;
  }

  // Set the invited role
  if (userId) {
    await adminClient
      .from('profiles')
      .upsert({ id: userId, email: email.trim(), role }, { onConflict: 'id' });
  }

  // Send the invite email via our own provider (bypasses Supabase rate limits)
  try {
    await sendInviteEmail(email.trim(), inviteUrl, role);
  } catch (emailErr) {
    console.error('Email send error:', emailErr);
    // Return the link so the admin can share it manually as a fallback
    return NextResponse.json({
      message: `Email failed — share this link manually with ${email}`,
      inviteUrl,
    }, { status: 207 });
  }

  return NextResponse.json({ message: `Invite sent to ${email}` });
}
