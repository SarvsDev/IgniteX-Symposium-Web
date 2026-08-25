# IgniteX 2026 — Supabase + Gmail SMTP Backend Rework

This version keeps the existing IgniteX frontend and moves all registration/admin persistence to the Express + Supabase backend.

## Architecture

Browser → Express `/api/*` → Supabase PostgreSQL / Storage

Admin approval → secure verification code + QR token → Gmail SMTP email → QR/code check-in

## Setup

1. Copy `.env.example` to `.env`.
2. Add your Supabase URL and **service-role key** to the server environment.
3. Add your Gmail SMTP API key and verified sender.
4. Run the single clean database schema `supabase/schema.sql` once in a fresh Supabase project.
5. Run `npm install`.
6. Run `npm run dev`.
7. Open `http://localhost:3000/api/health`.

Expected health response when configured:

```json
{
  "status": "ok",
  "database": "supabase",
  "gmail smtp": true
}
```

## Environment variables

Server-only:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GMAIL_SMTP_USER / GMAIL_SMTP_APP_PASSWORD`
- `GMAIL_SMTP_FROM_NAME`
- `ADMIN_SECRET_KEY`
- `APP_URL`

Public frontend values, optional:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Never expose `SUPABASE_SERVICE_ROLE_KEY` or `GMAIL_SMTP_USER / GMAIL_SMTP_APP_PASSWORD` with a `VITE_` prefix.

## What was reworked

- Removed the active SQLite registration path from the server.
- Registration now writes to `participants`, `registrations`, `registration_events`, `teams`, and `team_members` in Supabase.
- Multi-event registration is one registration with normalized event links.
- Team friends are stored as individual `team_members` rows.
- Payment proof is uploaded to private Supabase Storage.
- Admin routes are protected by the configured admin passkey.
- Admin login no longer hardcodes the secret in the React component.
- Approval creates a secure verification code and opaque QR token.
- Approval emails are sent through Gmail SMTP and logged in `email_logs`.
- Verification changes an approved registration to `CHECKED_IN` and prevents duplicate check-in.
- Both single-event and multi-event registration UIs now submit to `/api/register` instead of localStorage.

See `SUPABASE_RESEND_SETUP.md` for the exact database and environment setup.
