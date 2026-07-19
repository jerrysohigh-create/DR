# MAGNE.AI KOL Task Portal

Static, mobile-first task portal intended for `https://jerrysohigh-create.github.io/DR/kol/`. It does not alter the DR homepage. Demo records and placeholder visuals are visibly marked **DEMO**.

## Local preview

From the repository root run `python3 -m http.server 8000`, then open:

`http://localhost:8000/kol/?task=crypto-panda&token=TEST_TOKEN`

Other demo links use `crypto-dragon / TEST_DRAGON` and `kryptomonach / TEST_KRYPTO`. Demo admin is `/kol/admin.html`; password: `demo-admin`. This local password is not a production credential.

## Production setup

Copy `js/config.example.js` to a local/deployment-only `js/config.js` and set only `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `USE_DEMO_DATA:false`. The committed loader automatically uses `config.js` when present and otherwise falls back to the Demo example; `kol/.gitignore` prevents accidental commit. Never commit service-role keys, Apify tokens, admin passwords or `.env` files. Run the migration and deploy functions as described in `../supabase/README.md`.

Create an administrator through Supabase Auth, then insert the user UUID, email and role into `admin_users`. Production Admin exchanges email/password through Supabase Auth, restores its session on refresh, checks authorization through `admin-export`, and calls it with the user JWT. Demo mode retains a local guard for review without a Supabase project.

## Operations

- Add a KOL to `kol_profiles`, then add `campaign_tasks`, assets and a random access token. Store only `encode(digest(token,'sha256'),'hex')` in `task_access_tokens`.
- Add or replace assets in `task_assets`. Use approved public asset URLs and preserve `source_url`.
- Revoke a link by setting `task_access_tokens.revoked_at`; rotate by revoking it and inserting a new token hash.
- Export through the Admin button in Demo, or authenticated `admin-export` in production.
- Add Apify only through Supabase Secrets; integration code is in `collect-metrics/index.ts`.
- Switch Demo to production by supplying deployment-only config, setting `USE_DEMO_DATA:false`, and deploying all functions. Admin then switches to Supabase Auth automatically.

The token is removed from the address bar on load and held in session storage for refresh. Do not add analytics that capture the initial URL; if analytics are introduced, initialize them only after token removal and strip query parameters.

## Localization

Schema fields `language` and `timezone` reserve per-KOL locale support. V1 UI is English; Chinese, Vietnamese, Thai and Indonesian dictionaries can be added without changing the data model.
