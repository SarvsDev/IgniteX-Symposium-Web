# IgniteX 2026 Final Fix

## Important
The frontend never uses SUPABASE_SERVICE_ROLE_KEY or RESEND_API_KEY.
All privileged operations go through the Express server.

## Environment
Copy `.env.example` to `.env` and fill in:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- RESEND_API_KEY
- RESEND_FROM_EMAIL
- ADMIN_SECRET_KEY
- APP_URL
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

Restart `npm run dev` after changing `.env`.

## Supabase
Run these migrations in order:
1. supabase/migrations/001_initial_schema.sql
2. supabase/migrations/002_seed_events.sql
3. supabase/migrations/003_storage_and_backend.sql

## Verify
Open `/api/config-status` and `/api/health`.
`/api/config-status` must show Supabase URL + service role + Resend configured.

## Registration
RegistrationModal and MultiEventRegisterPage now submit only to `/api/register`.
They do not require the service-role key in the browser.

## Admin
Log in with the same value configured in `ADMIN_SECRET_KEY`. The dashboard sends it as `x-admin-key` to protected admin endpoints.
