# Deployment checklist

- [ ] Run all Supabase migrations.
- [ ] Confirm `events` contains the seeded event rows.
- [ ] Confirm Storage bucket `payment-proofs` exists and is private.
- [ ] Set server `SUPABASE_URL`.
- [ ] Set server `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Set `RESEND_API_KEY`.
- [ ] Set a verified `RESEND_FROM_EMAIL`.
- [ ] Set a strong `ADMIN_SECRET_KEY`.
- [ ] Set `APP_URL` to the deployed public URL.
- [ ] Restart/redeploy after changing environment variables.
- [ ] Test `/api/health`.
- [ ] Submit an individual registration.
- [ ] Submit a team registration.
- [ ] Submit a multi-event registration.
- [ ] Approve a registration from Admin.
- [ ] Confirm the approval email arrives.
- [ ] Verify the code/QR once.
- [ ] Verify the same code again and confirm `ALREADY_CHECKED_IN`.
