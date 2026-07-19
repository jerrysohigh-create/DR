# MAGNE.AI KOL Task Portal

Static, mobile-first task portal intended for `https://jerrysohigh-create.github.io/DR/kol/`. It does not alter the DR homepage. Demo records and placeholder visuals are visibly marked **DEMO**.

## Local preview

From the repository root run `python3 -m http.server 8000`, then open:

`http://localhost:8000/kol/?task=crypto-panda&token=TEST_TOKEN`

Other demo links use `crypto-dragon / TEST_DRAGON` and `kryptomonach / TEST_KRYPTO`. Demo admin is `/kol/admin.html`; password: `demo-admin`. This local password is not a production credential.

## Production setup

The loader checks ignored `js/config.js` first, then committed `js/config.runtime.js`, then the Demo example. The committed runtime contains only the Project URL and browser-safe Publishable Key. Live smoke tests passed and `USE_DEMO_DATA:false` now connects Pages to the Supabase **test** project; it does not indicate production KOL data. RLS and Edge Functions remain the security boundary. Use `js/config.js` for local overrides. `kol/.gitignore` prevents accidental commit. Never place service-role/secret keys, Personal Access Tokens, database passwords, admin passwords or `.env` files in `/kol/`. Run the migration and deploy functions as described in `../supabase/README.md`.

Create an administrator through Supabase Auth, then insert the user UUID, email and role into `admin_users`. Production Admin exchanges email/password through Supabase Auth, restores its session on refresh, checks authorization through `admin-export`, and calls it with the user JWT. Demo mode retains a local guard for review without a Supabase project.

## Operations

- Add a KOL to `kol_profiles`, then add `campaign_tasks`, assets and a random access token. Store only `encode(digest(token,'sha256'),'hex')` in `task_access_tokens`.
- Add or replace assets in `task_assets`. Use approved public asset URLs and preserve `source_url`.
- Revoke a link by setting `task_access_tokens.revoked_at`; rotate by revoking it and inserting a new token hash.
- Export through the Admin button in Demo, or authenticated `admin-export` in production.
- Test metrics with `METRICS_MODE=mock` (default). It writes clearly marked deterministic 24h/7d fixtures and never calls Apify. Enable live providers only by explicitly setting `METRICS_MODE=live` plus server-only provider secrets.
- Switch Demo to production by supplying deployment-only config, setting `USE_DEMO_DATA:false`, and deploying all functions. Admin then switches to Supabase Auth automatically.

## Supabase test status

All four Edge Functions are deployed to the temporary test project. Live checks passed for active/wrong/expired/revoked task access (200/403), invalid/mismatched/accepted/duplicate submission (400/403/201/409), and unauthenticated Admin export (401). Mock-only 24h and 7d collection returned HTTP 200 and preserved missing values as database `NULL` (`bookmarks` at 24h, `quotes` at 7d). Apify was not called. The test Admin invitation is waiting for email verification before authenticated Admin testing can finish.

The token is removed from the address bar on load and held in session storage for refresh. Do not add analytics that capture the initial URL; if analytics are introduced, initialize them only after token removal and strip query parameters.

## Localization

Schema fields `language` and `timezone` reserve per-KOL locale support. V1 UI is English; Chinese, Vietnamese, Thai and Indonesian dictionaries can be added without changing the data model.
