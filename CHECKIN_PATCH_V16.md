# IgniteX v16 — Mobile QR Staff Check-In Patch

Base: Symposium Gmail SMTP v15 (Combo ₹400)

## Changes

- `/verify?token=...` remains publicly accessible for ticket verification.
- If a staff member is not authenticated on the phone, the verification page now shows `ENABLE STAFF CHECK-IN`.
- Staff can enter the `ADMIN_SECRET_KEY` passkey directly on the phone.
- Successful authentication stores the admin key only in `sessionStorage` for the current browser tab.
- After authentication, the page shows `CHECK-IN PARTICIPANT`.
- Check-in calls the existing protected `/api/attendance/verify` endpoint with `x-admin-key`.
- Duplicate check-ins are handled by the existing database RPC and show `CAMPUS ENTRY RECORDED` / `ALREADY_CHECKED_IN`.
- AdminDashboard also restores the admin key from sessionStorage so the same browser session remains authenticated after navigation/reload.
- No Supabase schema changes.
- No Gmail SMTP changes.
- No Resend changes.
- Combo price remains ₹400.

## Deploy

1. Replace the project with this v16 archive.
2. Commit and push to the same `main` branch.
3. Deploy on Vercel.
4. Open `/admin` on the staff phone and authenticate once, OR scan a QR and use `ENABLE STAFF CHECK-IN` on `/verify`.
5. Scan an approved participant QR.
6. Press `CHECK-IN PARTICIPANT`.

The admin key is never placed in the QR URL.
