# IgniteX 2026 — Implementation Notes

This build is intentionally based on a clean schema rather than patch migrations.

## Registration IDs

`registrations.registration_number` is the human-facing ID and is generated as `IGX-XXXX`, where each character is uppercase alphanumeric.

## Plaintext database

Participant names, event names, registration IDs, payment metadata, verification values, and reporting rows are stored as ordinary PostgreSQL text values. No verification-code hash or database encryption layer is used.

## Payment proofs

The uploaded payment proof is saved in Supabase Storage using:

`payment-proofs/<IGX-XXXX>/payment-proof.<extension>`

The `payment_proofs` table stores the storage path, filename, MIME type, size, transaction ID, and status.

## QR check-in

The QR contains a URL whose `token` is the participant's `IGX-XXXX` registration ID. The backend resolves that ID, verifies the registration is approved, and only performs the actual campus check-in after the admin explicitly confirms.

The database RPC `check_in_registration()` locks the registration row and prevents duplicate attendance records.

## Discord

No Discord webhook behavior is included in this build.
