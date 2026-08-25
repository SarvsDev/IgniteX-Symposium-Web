# Final Clean Build Notes

This is the clean replacement build.

There is no `004`, `005`, or `006` patch migration.

Use only:

`supabase/schema.sql`

The admin registration table displays only the short `IGX-XXXX` registration ID. The internal UUID is not displayed.

Approval emails also display only the short registration ID and QR; the old long verification code is removed.
