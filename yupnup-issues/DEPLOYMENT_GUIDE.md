# YupNup Issue Tracker — Complete Deployment Guide
### For Non-Developers · Step-by-Step

---

## What You're Building

A private internal website at a URL like `https://issues.yupnup.com` (or Vercel gives you a free URL like `yupnup-issues.vercel.app`) where your team can log, track, and resolve bugs and issues — like a lightweight Jira.

**Total time: ~45–60 minutes**
**Cost: FREE** (Supabase free tier + Vercel free tier)

---

## PART 1: SET UP SUPABASE (Your Database)

**Supabase = the database where all your tickets are stored**

### Step 1.1 — Create Supabase Account

1. Go to **https://supabase.com**
2. Click **"Start your project"**
3. Sign up with GitHub or Google (recommended)

### Step 1.2 — Create a New Project

1. Click **"New project"**
2. Fill in:
   - **Name**: `yupnup-issues`
   - **Database Password**: Create a strong password and **SAVE IT** somewhere safe
   - **Region**: Choose the region closest to your team (e.g. Singapore for India)
3. Click **"Create new project"**
4. Wait ~2 minutes for setup to complete

### Step 1.3 — Run the Database Schema

This creates all the tables your app needs.

1. In your Supabase project, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Open the file `supabase/migrations/001_initial_schema.sql` from this project
4. Copy the ENTIRE contents and paste into the SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)
6. You should see "Success. No rows returned" — that's correct!

### Step 1.4 — Create Storage Bucket

This is where screenshots will be stored.

1. In left sidebar, click **"Storage"**
2. Click **"New bucket"**
3. Fill in:
   - **Bucket name**: `screenshots` (must be exactly this)
   - **Public bucket**: ✅ CHECK THIS BOX (important!)
4. Click **"Save"**

### Step 1.5 — Get Your API Keys

1. In left sidebar, click **"Project Settings"** (gear icon at bottom)
2. Click **"API"**
3. Find and copy these 3 values — you'll need them later:
   - **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
   - **service_role** key (different long string — keep this SECRET)

### Step 1.6 — Configure Authentication

1. In left sidebar, click **"Authentication"**
2. Click **"Providers"**
3. Make sure **"Email"** is enabled (it should be by default)
4. Under Email settings, set:
   - **Confirm email**: You can turn this OFF for internal use
   - **Enable email OTP**: ON (this enables magic links)
5. Click **"URL Configuration"** tab
6. Add your future Vercel URL to **"Redirect URLs"**:
   - Add: `https://your-app-name.vercel.app/auth/callback`
   - Also add: `http://localhost:3000/auth/callback` (for testing)
   - You can update this after deployment

---

## PART 2: SET UP EMAIL (Choose ONE Option)

### Option A: Resend (RECOMMENDED — Easiest)

Resend is a modern email service. Free tier = 3,000 emails/month.

1. Go to **https://resend.com**
2. Sign up for a free account
3. After signup, go to **"API Keys"**
4. Click **"Create API Key"**
5. Give it a name like `yupnup-issues`
6. Copy the API key (starts with `re_`)
7. **Save it** — you can only see it once!

**Note**: On the free tier you can only send TO verified email addresses OR use `@resend.dev` test emails. To send to any email, you need to verify a domain. For internal use, you can verify your company domain (e.g. `yupnup.com`) in Resend → Domains.

### Option B: Gmail SMTP

Use your Gmail account to send emails.

1. Go to your Google Account → **Security**
2. Enable **"2-Step Verification"** if not already on
3. Go to **"App passwords"** (search for it in your Google account)
4. Select app: **"Mail"**, device: **"Other"** → type "YupNup Issues"
5. Click **"Generate"** — copy the 16-character password shown
6. **Save it** — you'll need it later

---

## PART 3: SET UP SLACK NOTIFICATIONS (Optional)

Skip this section if you don't use Slack.

1. Go to **https://api.slack.com/apps**
2. Click **"Create New App"** → **"From scratch"**
3. Name: `YupNup Issues` · Select your workspace
4. Click **"Incoming Webhooks"** → toggle ON
5. Click **"Add New Webhook to Workspace"**
6. Choose the channel (e.g. `#bugs` or `#dev-alerts`)
7. Copy the Webhook URL (looks like `https://hooks.slack.com/services/...`)

---

## PART 4: SET UP YOUR VERCEL DEPLOYMENT

**Vercel = the service that hosts your website**

### Step 4.1 — Prepare Your Code

1. Download/unzip the project folder if you haven't already
2. You should have a folder called `yupnup-issues`

### Step 4.2 — Push to GitHub

You need to put the code on GitHub first (Vercel reads from GitHub).

1. Go to **https://github.com** and sign up / log in
2. Click **"New repository"**
3. Name it `yupnup-issues`
4. Make it **Private** (important — internal use only!)
5. Click **"Create repository"**

Then upload your code. The easiest way for non-developers:

**Option A — GitHub Desktop (Easiest)**:
1. Download GitHub Desktop from **https://desktop.github.com**
2. Sign in with your GitHub account
3. File → Add Local Repository → Select your `yupnup-issues` folder
4. Click **"Publish repository"** → choose the repo you just created
5. Click **"Push origin"**

**Option B — Command Line**:
```bash
cd yupnup-issues
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/yupnup-issues.git
git push -u origin main
```

### Step 4.3 — Deploy to Vercel

1. Go to **https://vercel.com** and sign up with GitHub
2. Click **"Add New Project"**
3. Find your `yupnup-issues` repository and click **"Import"**
4. Framework will be detected as **Next.js** automatically
5. **DO NOT click Deploy yet** — first add environment variables!

### Step 4.4 — Add Environment Variables

In the Vercel deployment screen, scroll to **"Environment Variables"** and add each one:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL from Step 1.5 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon public key from Step 1.5 |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service_role key from Step 1.5 |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (e.g. `https://yupnup-issues.vercel.app`) — set AFTER first deploy |
| `EMAIL_PROVIDER` | `resend` (or `gmail`) |
| `EMAIL_FROM` | `noreply@yupnup.com` (or your email) |
| `EMAIL_RECIPIENTS` | `support@yupnup.com,dev@yupnup.com` (comma-separated) |
| `RESEND_API_KEY` | Your Resend key (if using Resend) |
| `GMAIL_USER` | Your Gmail address (if using Gmail) |
| `GMAIL_APP_PASSWORD` | Your Gmail app password (if using Gmail) |
| `SLACK_WEBHOOK_URL` | Your Slack webhook URL (optional) |
| `SLACK_NOTIFY_ALL` | `false` (or `true` to send all tickets) |

**How to add each variable**:
1. Click the **"+"** button
2. Type the Name exactly as shown
3. Paste the Value
4. Click **"Add"**

Repeat for all variables.

### Step 4.5 — Deploy!

1. Click **"Deploy"**
2. Wait ~3-4 minutes for build to complete
3. You'll get a URL like `https://yupnup-issues.vercel.app` 🎉

### Step 4.6 — Update App URL

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Update `NEXT_PUBLIC_APP_URL` to your actual Vercel URL
3. Go to **Deployments** → click **"Redeploy"** to apply the change

### Step 4.7 — Update Supabase Auth URL

1. Go back to your Supabase project
2. **Authentication** → **URL Configuration**
3. Update **"Site URL"** to your Vercel URL
4. Add your Vercel URL to **"Redirect URLs**: `https://yupnup-issues.vercel.app/auth/callback`

---

## PART 5: FIRST LOGIN & SETUP

### Step 5.1 — Sign In

1. Go to your new website URL
2. Enter your work email
3. Check your email for the magic link
4. Click the link — you're in!

**The FIRST person to sign in automatically becomes ADMIN.**

### Step 5.2 — Add Team Members

To invite team members:
1. Send them your website URL
2. They sign in with their work email via magic link
3. They'll start as **Viewer** role by default
4. Go to **Settings** and change their role to **Team Member** or **Admin**

### Step 5.3 — Create Your First Ticket

1. Click **"New Ticket"**
2. Fill in the details
3. Click **"Create Ticket"**
4. Your team and email recipients will be notified!

---

## PART 6: TESTING EVERYTHING

### Test Email Notifications
1. Create a test ticket with **Critical** priority
2. Check all EMAIL_RECIPIENTS inboxes
3. You should receive the email within 1-2 minutes

### Test Slack
1. Create a **High** or **Critical** ticket
2. Check your Slack channel — a message should appear

### Test Screenshot Upload
1. Create a ticket and drag/drop an image in the screenshot area
2. Open the ticket — the screenshot should appear

---

## COMMON ISSUES & FIXES

**"Invalid login" or can't access site**
→ Make sure your email is not restricted. Check Supabase Auth settings.

**Email not sending**
→ Double-check EMAIL_PROVIDER value matches your setup (resend or gmail).
→ For Gmail: make sure 2FA is ON and you're using an App Password, not your real password.
→ For Resend: verify your domain or use the resend.dev test email.

**"Storage error" when uploading screenshots**
→ Make sure you created a bucket named exactly `screenshots` and it's set to **Public**.

**500 error on ticket creation**
→ Check Vercel logs: Vercel Dashboard → Your Project → Functions → View logs

**Can't log in with magic link**
→ Make sure Supabase Auth → URL Configuration has your Vercel URL in Redirect URLs.
→ Check your spam folder.

---

## MAINTENANCE

**Updating the app**: Make changes to code, push to GitHub. Vercel auto-deploys within minutes.

**Viewing database**: Go to Supabase → Table Editor to view/edit data directly.

**Backups**: Supabase automatically backs up on the free tier daily.

**User management**: Supabase → Authentication → Users shows all signed-up users.

---

## SECURITY REMINDERS

✅ The site requires login — it's not public  
✅ SUPABASE_SERVICE_ROLE_KEY should NEVER be shared  
✅ Keep your GitHub repo PRIVATE  
✅ Regularly review who has Admin role  
✅ Use strong passwords for your Supabase project  

---

*Built for YupNup · Internal Use Only*
