# IgniteX Vercel Deployment

## Vercel project settings
- Framework: Vite (or Other)
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Node.js: 20.x or newer

## Required Production Environment Variables
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GMAIL_SMTP_USER / GMAIL_SMTP_APP_PASSWORD`
- `GMAIL_SMTP_FROM_NAME`
- `ADMIN_SECRET_KEY`
- `APP_URL` (use `https://event-ignitex.vercel.app` after the domain is confirmed)

Optional public frontend variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Do NOT create `VITE_ADMIN_SECRET_KEY`.

## Important
The previous catch-all Vercel API functions were removed. APIs are now explicit routes so Vercel can detect them reliably.

Admin authentication uses only `ADMIN_SECRET_KEY`; no legacy or hard-coded admin password is included.


## Registration payload safety
Payment screenshots are compressed client-side before /api/register. Keep uploaded proofs below ~1.8 MB.
