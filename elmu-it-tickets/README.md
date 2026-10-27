# ELMU IT Ticketing System

A small IT help-desk app for ELMU. Staff and students submit tickets; IT admins triage, assign and resolve them.

**Stack:** Next.js 15 (App Router, TypeScript) · Tailwind CSS 3 · Supabase (PostgreSQL + Auth) · Vercel

## What it does

| Role | Can do |
| --- | --- |
| Requester | Sign up, submit tickets, see **only their own** tickets and their status |
| IT Admin | See **all** tickets, search and filter, assign a technician, change status, add internal notes |

Pages: `/login`, `/` (dashboard), `/tickets` (table with search and filters), `/tickets/new`, `/tickets/[id]`.

Not included on purpose: asset management, AI, SLA automation, vendor and change management, email notifications, file attachments.

## How security works (read this once)

- **Roles are not editable by users.** They live in a separate `user_roles` table. Users can read their own row but have no INSERT/UPDATE/DELETE permission or policy on it, so nobody can promote themselves. The profile table has no role column, and users can only edit `full_name`.
- **Row Level Security (RLS) is on for every table.** Requesters can only read tickets where `requester_id` is their own ID. Only IT admins can update tickets. Internal notes are in a separate table that only IT admins can read, so requesters can never see them even through a direct API call.
- **Server-side checks too.** Every page and server action calls `requireUser()`, which verifies the session with Supabase and loads the role from the database. The update and note actions refuse non-admins before even reaching the database.
- **Tamper-proof ticket fields.** `requester_id` and `requester_email` come from the verified session, not the form. A database trigger locks the ticket number, requester and creation date, and only allows assigning tickets to IT admins.
- **No service-role key anywhere.** The app uses only the public anon key. RLS is what keeps data safe, so the anon key is fine to expose in the browser.

## Setup

### 1. Create the Supabase project
1. Go to [supabase.com](https://supabase.com), sign in and click **New project**.
2. Name it (for example `elmu-it`), choose a strong database password and the region closest to your users, then wait for it to finish creating.
3. Open **Project Settings → API**. Copy the **Project URL** and the **anon public** key. You will need both below.

### 2. Apply the database schema and security policies
1. In Supabase open **SQL Editor → New query**.
2. Paste the entire contents of `supabase/schema.sql` and click **Run**. It creates the tables, the signup trigger, the helper functions and all RLS policies.
3. Run it **once**. To start over, delete the tables or create a fresh project.

### 3. Configure authentication
In **Authentication → Providers**, make sure **Email** is enabled.
In **Authentication → URL Configuration** (revisit this after you have your Vercel URL, step 6):
- **Site URL:** `http://localhost:3000` for now, later your Vercel URL.
- **Redirect URLs:** add `http://localhost:3000/**` and `https://YOUR-APP.vercel.app/**`.

Email confirmation is on by default and works with the included `/auth/callback` route. For quick local testing you can switch it off under **Providers → Email → Confirm email**. Supabase's built-in email sender is rate-limited, so for real use set up custom SMTP.

### 4. Run locally
Requires Node.js 22 or newer.

```bash
npm install
cp .env.example .env.local     # then paste your Project URL and anon key into .env.local
npm run dev
```
Open http://localhost:3000, click **Create account**, and sign in.

### 5. Make your first IT Admin
New sign-ups are always Requesters. Promote someone **in the Supabase SQL Editor** (which runs as the database owner, bypassing RLS):

```sql
update public.user_roles
set role = 'it_admin'
where user_id = (select id from auth.users where email = 'you@elmu.example');
```
Sign out and back in. You will see the **IT Admin** badge and all tickets. Repeat for each technician. Admins appear in the "Assigned technician" dropdown.

To demote someone, set `role = 'requester'`.

### 6. Deploy to Vercel
1. Create a GitHub repository and push this project:
   ```bash
   git init && git add . && git commit -m "ELMU IT ticketing"
   git branch -M main
   git remote add origin https://github.com/YOUR-USER/elmu-it-tickets.git
   git push -u origin main
   ```
   `.env.local` is git-ignored, so your keys are not uploaded.
2. Go to [vercel.com](https://vercel.com), sign in with GitHub, click **Add New → Project** and import the repository. Vercel detects Next.js automatically.
3. Before clicking Deploy, open **Environment Variables** and add:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon public key |

   Do **not** add a service-role key. If you change these later, redeploy, because `NEXT_PUBLIC_` values are baked in at build time.
4. Click **Deploy**. When it finishes, copy your URL (for example `https://elmu-it-tickets.vercel.app`).
5. Return to Supabase **Authentication → URL Configuration**, set **Site URL** to that URL and add `https://YOUR-APP.vercel.app/**` to **Redirect URLs**. Without this, confirmation emails will point to the wrong address.

Every `git push` to `main` now redeploys automatically. The app keeps no files or state on the server, so it runs fine on Vercel's serverless functions.

## Tests

```bash
npm test          # input validation + schema consistency checks (no database needed)
npm run typecheck # TypeScript
```
`tests/schema.test.ts` also fails if the category, priority or status lists in the code drift from the SQL constraints.

### Manual security check (5 minutes, recommended before go-live)
1. Create two requester accounts (A and B) in different browsers. Have A submit a ticket.
2. As B: the dashboard and **My tickets** are empty, and opening A's ticket URL shows a 404.
3. As B, try to update a ticket from the browser console with the Supabase client. It should change 0 rows.
4. As an IT admin: you see A's ticket, can assign it, change status and add a note. As A, the note is never visible.

## Project layout

```
app/login            sign in / sign up page + server actions
app/auth/callback    email confirmation landing route
app/(app)            signed-in pages: dashboard, tickets, new ticket, ticket detail
lib/auth.ts          requireUser(): verified user + role from the database
lib/validation.ts    form validation (unit tested)
middleware.ts        refreshes the session, redirects signed-out visitors to /login
supabase/schema.sql  tables, trigger, RLS policies
```

## Known limitations
- Anyone can create a Requester account. To limit sign-ups to ELMU email addresses, add a domain check in `signUp` (`app/login/actions.ts`) and/or in the `handle_new_user` trigger.
- The ticket list shows the newest 100 matches (no pagination yet).
- No email notifications or attachments.
- Times display in `Asia/Kuala_Lumpur`. Change `TIME_ZONE` in `lib/constants.ts` if needed.
