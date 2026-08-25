# Vercel registration timeout fix

The registration endpoint performs multiple sequential Supabase operations and a storage upload. On Vercel this can exceed the default function duration even when the same flow works locally.

`api/register.ts` now exports `maxDuration = 60` so Vercel allows the complete registration transaction to finish.

No frontend or database schema changes are required for this fix.
