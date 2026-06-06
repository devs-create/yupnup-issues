import { Ticket } from '@/types';
import { PRIORITY_CONFIG, STATUS_CONFIG } from './utils';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const SLACK_NOTIFY_ALL = process.env.SLACK_NOTIFY_ALL === 'true';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function sendSlackNotification(ticket: Ticket, eventType: 'created' | 'status_changed' | 'comment_added', extra?: Record<string, string>) {
  if (!SLACK_WEBHOOK_URL) return;

  const isHighPriority = ticket.priority === 'high' || ticket.priority === 'critical';
  if (!SLACK_NOTIFY_ALL && !isHighPriority) return;

  const priorityEmoji: Record<string, string> = {
    critical: '🚨', high: '⚠️', medium: '📋', low: '📌'
  };

  const eventLabel: Record<string, string> = {
    created: 'New Issue Created',
    status_changed: 'Status Updated',
    comment_added: 'New Comment',
  };

  const color: Record<string, string> = {
    critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#64748b'
  };

  const ticketUrl = `${APP_URL}/tickets/${ticket.id}`;

  const blocks: Record<string, unknown>[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${priorityEmoji[ticket.priority]} ${eventLabel[eventType]}: ${ticket.ticket_id}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${ticket.title}*`,
      },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Priority:*\n${PRIORITY_CONFIG[ticket.priority].label}` },
        { type: 'mrkdwn', text: `*Status:*\n${STATUS_CONFIG[ticket.status].label}` },
        { type: 'mrkdwn', text: `*Platform:*\n${ticket.platform.toUpperCase()}` },
        { type: 'mrkdwn', text: `*Reporter:*\n${ticket.reporter_name}` },
      ],
    },
  ];

  if (extra?.comment) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Comment:*\n${extra.comment}` },
    });
  }

  if (extra?.old_status && extra?.new_status) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Status Change:*\n~${extra.old_status}~ → *${extra.new_status}*` },
    });
  }

  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: 'View Ticket →', emoji: true },
        url: ticketUrl,
        style: 'primary',
      },
    ],
  });

  const payload = {
    attachments: [
      {
        color: color[ticket.priority],
        blocks,
      },
    ],
  };

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('Slack notification error:', err);
  }
}
