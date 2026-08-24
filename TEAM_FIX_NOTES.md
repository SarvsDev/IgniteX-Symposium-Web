# Team Registration Fixes

- Fixed missing `handleTeamNameChange` and `handleTeamMemberChange` handlers in `MultiEventRegisterPage.tsx`.
- Team/squad name and teammate inputs are now fully controlled and editable.
- Memergency is now explicitly an individual-only event (`maxTeamSize: 1`) in the frontend event catalogue.
- The registration backend already treats `nontech-memergency` as a solo event, so no team payload is generated for it.
- The clean Supabase schema remains the single database schema to deploy; legacy patch migrations were removed from this build.
