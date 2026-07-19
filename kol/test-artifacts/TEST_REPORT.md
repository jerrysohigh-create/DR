# WEB-20260719-007 Test Report

Date: 2026-07-19 · Branch: `feat/kol-portal`

Twenty-six automated browser/static integration checks at 375 px and 1440 px passed:

- task loading, token removal, and refresh using session-held token
- approved copy rendering through `textContent` and Copy action
- missing asset section automatically hidden
- invalid X domain/path rejected
- mismatched X username rejected
- duplicate submission rejected
- expired and revoked/invalid tokens rejected in Demo; server access helper separately checks both `expires_at` and `revoked_at`
- unauthenticated Admin guard and Demo sign-in
- CSV export handler
- 48 px minimum action height
- `/kol/` relative paths and root homepage both return HTTP 200
- every referenced Demo asset returns HTTP 200; the missing video reference was removed
- Production Supabase Auth session/sign-in/sign-out and user-JWT function wiring
- production nested submission/metric query and missing-submission collector guard
- exact Demo seed claims for compliance and Gemini limitations
- ignored runtime config override with safe Demo fallback

Screenshots: `task-375.png`, `task-1440.png`, `admin-1440.png`.

Static security review passed: no service-role key, Apify token, `.env`, real password, or private KOL data; all database tables have RLS; no anon table policies; task access requires SHA-256 token verification in an Edge Function; submission repeats server validation and relies on unique constraints; HTML values use `textContent`; token is removed before application rendering; metrics preserve null values.

Limitations: testing uses a temporary Supabase test project, synthetic X post URLs and Demo records only. No production KOL/private data, production assets, Apify account, paid provider call, or TwStalker integration was used. The test Admin invitation is waiting for email verification, so authenticated Admin export remains pending that human step.

## Phase 2 hardening

- Replaced the runtime-fetched `esm.sh` client import with Supabase Edge Runtime's `npm:` import, then added an 8-second AbortSignal deadline to every Supabase REST/Auth call and a 10-second deadline to metrics providers.
- Added non-sensitive structured errors containing only random `requestId`, stable error code and status. Tokens, URLs and request bodies are never logged.
- Added explicit `METRICS_MODE=mock` (default). Only authenticated cron calls can store deterministic, visibly marked 24h/7d fixtures; this path never calls Apify or TwStalker.
- Added committed browser-safe runtime config for the test Project. It contains a Publishable Key only and no privileged credential.
- Added `kol/tests/p2-integration-tests.mjs`; all source/security assertions pass without secrets or raw task tokens.
- Added explicit per-function JWT deployment settings, secret-free Demo seed data, an out-of-repo random-token provisioning script, and optional live behavior tests that safely skip without local credentials.
- Passed the live smoke release gate against the Supabase test project and switched the committed Pages runtime to `USE_DEMO_DATA:false`; the target remains a test environment rather than production data.

Phase 2 static/security suite: 21/21 PASS. All four hardened Edge Functions were deployed. Live HTTP/database checks passed without printing tokens, secrets, URLs or response bodies:

- task access: active token HTTP 200; wrong, expired and revoked tokens HTTP 403
- submission: invalid URL HTTP 400; mismatched account HTTP 403; accepted matching post HTTP 201; duplicate HTTP 409
- unauthenticated Admin export: HTTP 401
- mock metrics: 24h and 7d HTTP 200; stored 24h `bookmarks` remains `NULL` and stored 7d `quotes` remains `NULL`

The Admin invitation was created and is waiting for email verification. Apify was not called; metric checks ran only with the deterministic Mock provider.

The earlier `get-task` Edge Runtime status 546 was resolved by splitting token and task loading into two bounded queries and redeploying the hardened function. Runtime verification used locally held raw tokens only; none are recorded in this report or repository.
