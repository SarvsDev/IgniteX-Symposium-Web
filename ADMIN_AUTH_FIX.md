# Admin Authentication Fix

The deployed Vercel function is `/api/admin/[...path].ts`. The frontend posts the passkey to `/api/admin/auth`.

The fixed API accepts `ADMIN_SECRET_KEY` and, for compatibility with older deployments, `ADMIN_PASSWORD`, `ADMIN_PASSKEY`, or `ADMIN_KEY`. It also trims accidental surrounding quotes/spaces.

## Vercel
Set this environment variable in the Production environment:

`ADMIN_SECRET_KEY=<your actual admin password>`

Then redeploy. If you already had the variable, edit/save it and redeploy so the new function receives the value.

Do not put the admin password in any `VITE_*` variable because those are exposed to the browser.
