# Team Limits Sync

The frontend (`src/data/eventsData.ts`) and registration API already validate team sizes.
The database seed data was out of sync for several events.

## Final limits

| Event | Min | Max | Type |
|---|---:|---:|---|
| Crack The Code | 2 | 2 | Team |
| Neural Rush (Gen AI Clash) | 2 | 2 | Team |
| PosterXpo | 2 | 3 | Team |
| Profile Architect | 1 | 1 | Individual |
| Zero: The Final Key | 2 | 4 | Team |
| Operation Bermuda Survive | 4 | 4 | Team |
| Memergency | 1 | 1 | Individual |
| Prompt Perfect | 1 | 1 | Individual |
| Pitch Desk | 4 | 4 | Team |

`supabase/migrations/009_sync_team_limits.sql` synchronizes an existing database.
`SUPABASE_PATCH.sql` provides a one-shot manual SQL option.

No admin authentication files were changed.
