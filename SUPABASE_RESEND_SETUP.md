# Supabase + Resend Setup

## Supabase

1. Create a fresh Supabase project.
2. Run `supabase/schema.sql` once.
3. Copy the project URL to `SUPABASE_URL`.
4. Copy the service-role key to `SUPABASE_SERVICE_ROLE_KEY`.
5. Keep the `payment-proofs` bucket private; the server uses signed URLs for admin viewing.

## Resend

Set:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `APP_URL`

Approval email contains:

- participant name
- `IGX-XXXX` Registration ID
- amount
- registered events
- QR code

No separate long verification code is generated.
