# IgniteX 2026 — Clean Supabase Database Setup

This version uses **one clean database schema**. There are no patch migrations.

## 1. Start with a fresh Supabase project/database

Run the complete file below once in the Supabase SQL Editor:

`supabase/schema.sql`

The root copy `supabase_schema.sql` contains the same schema.

## 2. What the schema creates

- events and event combo tables
- participants
- registrations
- registration_events
- teams and team_members
- admin profiles/audit/email logs
- `participant_event_registrations` — plaintext participant/event reporting
- `event_registration_counts` — registered / approved / checked-in counts per event
- `payment_proofs` — payment screenshot metadata linked to Supabase Storage
- `campus_checkins` — one check-in per registration
- private `payment-proofs` Storage bucket
- `IGX-XXXX` registration number generator
- idempotent QR check-in RPC
- reporting/count synchronization triggers

## 3. Registration ID

Every registration gets a four-character uppercase alphanumeric ID:

`IGX-XXXX`

The same ID is used as the pass identifier and QR lookup value. There is no second long verification code.

## 4. Payment proof

Payment screenshots are stored as original uploaded files in the private `payment-proofs` bucket. PostgreSQL stores the storage path and file metadata in `payment_proofs`.

## 5. Check-in

QR scan only verifies the registration. The admin must press **CHECK-IN PARTICIPANT**.

The database function `check_in_registration()` locks the registration row and makes check-in idempotent. Repeated scans return `ALREADY_CHECKED_IN` and do not create another campus check-in.

## 6. Important

Do not run the old migration files from previous versions. This project intentionally contains one clean schema instead of incremental patches.
