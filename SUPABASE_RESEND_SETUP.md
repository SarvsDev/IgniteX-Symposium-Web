# IgniteX 2026 — Supabase + Resend setup

## 1. Supabase

Open Supabase → SQL Editor and run these files in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_seed_events.sql`
3. `supabase/migrations/003_storage_and_backend.sql`

The third migration creates the private `payment-proofs` Storage bucket.

## 2. Server environment

Copy `.env.example` to `.env` and set:

```env
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=IgniteX 2026 <onboarding@resend.dev>
ADMIN_SECRET_KEY=8f497bab15055497e0e870561ab2706b
APP_URL=http://localhost:3000
PORT=3000
```

Never commit `.env` and never put `SUPABASE_SERVICE_ROLE_KEY` or `RESEND_API_KEY` behind a `VITE_` variable.

## 3. Frontend environment

The browser does not need the service-role key. Optional public variables:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_ADMIN_ACCESS_KEY=8f497bab15055497e0e870561ab2706b
```

All privileged registration/admin/email operations go through the Express server.

## 4. Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000/api/health`.

Expected when configured:

```json
{
  "status": "ok",
  "database": "supabase",
  "resend": true
}
```

## 5. Registration flow

The form submits to `/api/register`.

The backend:

- validates participant data
- loads event prices from Supabase
- prevents duplicate event registrations
- validates team sizes
- creates one registration record
- creates `registration_events`
- creates `teams` and `team_members`
- uploads payment proof to Supabase Storage
- leaves the registration `PENDING`

## 6. Admin approval

Admin calls `/api/admin/approve-registration`.

The backend:

- checks admin key
- generates a secure verification code
- generates an opaque QR token
- changes status to `APPROVED`
- changes payment status to `VERIFIED`
- sends the approval email with Resend
- records the email in `email_logs`

## 7. Check-in

Staff/admin calls `/api/attendance/verify` with either the human verification code or QR token.

A valid approved registration becomes `CHECKED_IN`. A second scan returns `ALREADY_CHECKED_IN`.
