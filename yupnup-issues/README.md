# YupNup Issue Tracker

Internal issue tracking system for YupNup — built with Next.js 15, Supabase, and Tailwind CSS.

## Features

- 🎫 **Full ticket management** — Create, edit, delete, search, filter tickets
- 🏷️ **Auto ticket IDs** — YUP-001, YUP-002, etc.
- 📊 **Analytics dashboard** — Charts, stats, trends
- 📸 **Screenshot uploads** — Supabase Storage
- 💬 **Comments & collaboration** — Threaded discussion per ticket
- 📧 **Email notifications** — Resend or Gmail SMTP
- 🔔 **Slack integration** — Webhook notifications
- 🔐 **Role-based access** — Admin, Team Member, Viewer
- 🌓 **Dark mode UI** — Built-in dark theme
- 📱 **Responsive** — Works on desktop and mobile

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TailwindCSS, TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth (Magic Link / OTP)
- **Email**: Resend or Gmail SMTP
- **Deployment**: Vercel

## Quick Start

See **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for complete step-by-step instructions.

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values.

```bash
cp .env.local.example .env.local
```

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)
