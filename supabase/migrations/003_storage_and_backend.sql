-- Payment proof bucket. The server uses the service-role key for uploads.
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

-- The backend service-role client bypasses RLS. No public policy is created for payment proofs.
