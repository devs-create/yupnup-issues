import { Ticket } from '@/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@yupnup.com';
const EMAIL_RECIPIENTS = (process.env.EMAIL_RECIPIENTS || '').split(',').map(e => e.trim()).filter(Boolean);
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'resend';

interface EmailPayload {
  to: string[];
  subject: string;
  html: string;
}

async function sendEmail(payload: EmailPayload) {
  if (payload.to.length === 0) return;

  if (EMAIL_PROVIDER === 'resend') {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: EMAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
  } else {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    await transporter.sendMail({
      from: `YupNup Issues <${process.env.GMAIL_USER}>`,
      to: payload.to.join(', '),
      subject: payload.subject,
      html: payload.html,
    });
  }
}

function emailTemplate(title: string, content: string, ticketId?: string, ticketUrl?: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#1a1d27;border:1px solid #2d3142;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#0ea5e9,#6366f1);padding:24px 32px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-1px;">YUP<span style="color:#7dd3fc">NUP</span></span>
        <span style="color:#bae6fd;font-size:13px;opacity:0.8;">Issue Tracker</span>
      </div>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:20px;font-weight:700;">${title}</h2>
      ${ticketId ? `<p style="margin:0 0 20px;color:#64748b;font-size:13px;font-family:monospace;">${ticketId}</p>` : ''}
      <div style="color:#94a3b8;font-size:14px;line-height:1.7;">
        ${content}
      </div>
      ${ticketUrl ? `
      <div style="margin-top:28px;">
        <a href="${ticketUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
          View Ticket →
        </a>
      </div>` : ''}
    </div>
    <div style="padding:20px 32px;border-top:1px solid #2d3142;background:#161820;">
      <p style="margin:0;color:#475569;font-size:12px;">YupNup Internal Issue Tracker · This email was sent automatically.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function notifyNewTicket(ticket: Ticket) {
  const ticketUrl = `${APP_URL}/tickets/${ticket.id}`;
  const priorityColors: Record<string, string> = {
    critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#64748b'
  };
  const color = priorityColors[ticket.priority] || '#64748b';

  const content = `
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr><td style="padding:8px 0;border-bottom:1px solid #2d3142;color:#64748b;width:140px;">Reporter</td><td style="padding:8px 0;border-bottom:1px solid #2d3142;color:#e2e8f0;">${ticket.reporter_name} &lt;${ticket.reporter_email}&gt;</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #2d3142;color:#64748b;">Priority</td><td style="padding:8px 0;border-bottom:1px solid #2d3142;"><span style="color:${color};font-weight:600;text-transform:capitalize;">${ticket.priority}</span></td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #2d3142;color:#64748b;">Platform</td><td style="padding:8px 0;border-bottom:1px solid #2d3142;color:#e2e8f0;text-transform:capitalize;">${ticket.platform}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">Description</td><td style="padding:8px 0;color:#e2e8f0;">${ticket.description.slice(0, 300)}${ticket.description.length > 300 ? '...' : ''}</td></tr>
    </table>
  `;

  await sendEmail({
    to: EMAIL_RECIPIENTS,
    subject: `[${ticket.ticket_id}] New ${ticket.priority.toUpperCase()} Issue: ${ticket.title}`,
    html: emailTemplate(`New Ticket: ${ticket.title}`, content, ticket.ticket_id, ticketUrl),
  });
}

export async function notifyStatusChange(ticket: Ticket, oldStatus: string, newStatus: string, actorName: string) {
  const ticketUrl = `${APP_URL}/tickets/${ticket.id}`;
  const content = `
    <p><strong style="color:#e2e8f0;">${actorName}</strong> updated the status of this ticket.</p>
    <div style="display:flex;align-items:center;gap:12px;margin:20px 0;padding:16px;background:#161820;border-radius:8px;border:1px solid #2d3142;">
      <span style="color:#64748b;text-transform:capitalize;">${oldStatus.replace('_', ' ')}</span>
      <span style="color:#0ea5e9;">→</span>
      <span style="color:#0ea5e9;font-weight:600;text-transform:capitalize;">${newStatus.replace('_', ' ')}</span>
    </div>
  `;

  await sendEmail({
    to: EMAIL_RECIPIENTS,
    subject: `[${ticket.ticket_id}] Status Updated: ${ticket.title}`,
    html: emailTemplate(`Status Update: ${ticket.title}`, content, ticket.ticket_id, ticketUrl),
  });
}

export async function notifyNewComment(ticket: Ticket, commentContent: string, authorName: string) {
  const ticketUrl = `${APP_URL}/tickets/${ticket.id}`;
  const content = `
    <p><strong style="color:#e2e8f0;">${authorName}</strong> added a comment:</p>
    <div style="margin:16px 0;padding:16px;background:#161820;border-left:3px solid #0ea5e9;border-radius:0 8px 8px 0;">
      <p style="margin:0;color:#cbd5e1;">${commentContent}</p>
    </div>
  `;

  await sendEmail({
    to: EMAIL_RECIPIENTS,
    subject: `[${ticket.ticket_id}] New Comment: ${ticket.title}`,
    html: emailTemplate(`New Comment on: ${ticket.title}`, content, ticket.ticket_id, ticketUrl),
  });
}

export async function notifyCriticalIssue(ticket: Ticket) {
  const ticketUrl = `${APP_URL}/tickets/${ticket.id}`;
  const content = `
    <div style="padding:16px;background:#ef444420;border:1px solid #ef4444;border-radius:8px;margin-bottom:20px;">
      <p style="margin:0;color:#fca5a5;font-weight:700;">⚡ CRITICAL ISSUE REQUIRES IMMEDIATE ATTENTION</p>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;border-bottom:1px solid #2d3142;color:#64748b;width:140px;">Reporter</td><td style="padding:8px 0;border-bottom:1px solid #2d3142;color:#e2e8f0;">${ticket.reporter_name}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #2d3142;color:#64748b;">Platform</td><td style="padding:8px 0;border-bottom:1px solid #2d3142;color:#e2e8f0;text-transform:capitalize;">${ticket.platform}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">Description</td><td style="padding:8px 0;color:#e2e8f0;">${ticket.description.slice(0, 400)}</td></tr>
    </table>
  `;

  await sendEmail({
    to: EMAIL_RECIPIENTS,
    subject: `🚨 CRITICAL: [${ticket.ticket_id}] ${ticket.title}`,
    html: emailTemplate(`🚨 Critical Issue: ${ticket.title}`, content, ticket.ticket_id, ticketUrl),
  });
}

export async function sendWelcomeInviteEmail({
  to,
  inviteeName,
  inviterName,
  email,
  password,
  role,
  appUrl,
}: {
  to: string;
  inviteeName: string;
  inviterName: string;
  email: string;
  password: string;
  role: string;
  appUrl: string;
}) {
  const roleLabel = role === 'admin' ? 'Admin' : role === 'team_member' ? 'Team Member' : 'Viewer';

  const html = emailTemplate(
    `You've been invited to YupNup Issue Tracker`,
    `
    <p style="margin:0 0 20px;color:#94a3b8;">
      Hi ${inviteeName || 'there'},<br/><br/>
      <strong style="color:#e2e8f0;">${inviterName}</strong> has added you to the <strong style="color:#e2e8f0;">YupNup Issue Tracker</strong> as a <strong style="color:#0ea5e9;">${roleLabel}</strong>.
    </p>

    <div style="background:#0f1117;border:1px solid #2d3142;border-radius:12px;padding:24px;margin:24px 0;">
      <p style="margin:0 0 16px;color:#64748b;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">Your Login Credentials</p>

      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #2d3142;color:#64748b;font-size:13px;width:100px;">Login URL</td>
          <td style="padding:10px 0;border-bottom:1px solid #2d3142;">
            <a href="${appUrl}/auth/login" style="color:#0ea5e9;font-size:13px;text-decoration:none;">${appUrl}/auth/login</a>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #2d3142;color:#64748b;font-size:13px;">Email</td>
          <td style="padding:10px 0;border-bottom:1px solid #2d3142;color:#e2e8f0;font-family:monospace;font-size:13px;">${email}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#64748b;font-size:13px;">Password</td>
          <td style="padding:10px 0;color:#e2e8f0;font-family:monospace;font-size:15px;font-weight:700;letter-spacing:0.05em;">${password}</td>
        </tr>
      </table>
    </div>

    <p style="margin:0 0 8px;color:#64748b;font-size:12px;">
      💡 You can change your password after logging in from the Settings page.
    </p>
    <p style="margin:0;color:#475569;font-size:12px;">
      If you did not expect this invitation, please ignore this email.
    </p>
    `,
    undefined,
    `${appUrl}/auth/login`
  );

  await sendEmail({
    to: [to],
    subject: `You've been invited to YupNup Issue Tracker`,
    html,
  });
}
