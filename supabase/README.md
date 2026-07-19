# MAGNE.AI KOL Portal — Supabase

This directory contains deployable database and Edge Function source. It contains no secrets.

1. Run `migrations/001_kol_portal.sql` in a new Supabase project.
2. Optionally run `seed-demo.sql` only in a non-production project. It creates profiles/tasks only and contains no raw token or fixed token hash.
3. Create an Auth user, then insert its UUID/email/role (`admin` or `editor`) into `admin_users` using the SQL editor.
4. `config.toml` explicitly sets `verify_jwt=false` for token/cron-protected `get-task`, `submit-post`, and `collect-metrics`; `admin-export` remains `verify_jwt=true`. Deploy from the repository root so `supabase/config.toml` applies: `supabase functions deploy get-task && supabase functions deploy submit-post && supabase functions deploy collect-metrics && supabase functions deploy admin-export`.
5. For test mode configure only `CRON_SECRET` and `METRICS_MODE=mock`. `SUPABASE_SERVICE_ROLE_KEY` is supplied to functions by Supabase and must never enter `/kol/`.
6. Mock collection accepts only `24h` and `7d`, saves deterministic payloads marked `mock:true`, and never contacts Apify. Call it with `{ "submissionId":"<uuid>", "snapshotType":"24h" }` and header `x-cron-secret`; repeat for `7d`.
7. Future live mode requires an explicit `METRICS_MODE=live`. It calls Apify, then optional TwStalker; both failures create a `manual_review` snapshot. External calls abort after 10 seconds and null metrics remain null.
8. Schedule snapshots externally at `initial`, `24h`, `48h_retry`, `7d`, or `8d_retry`, passing `x-cron-secret`.

RLS is enabled on every table. There are no anonymous table policies: KOL task reads and submissions pass through token-validating Edge Functions. Staff access requires Supabase Auth plus an active `admin_users` role.

All database REST calls made by the functions have an 8-second default deadline (`DB_TIMEOUT_MS` may override it). Responses include a random `requestId`; logs contain only that ID, an error code and HTTP status, never task tokens, URLs, credentials or request bodies. A platform 546 from older deployments can result from an unbounded nested database query waiting until the Edge Runtime wall-clock limit. The hardened four-function deployment is active in the test project and the bounded `get-task` smoke test now returns HTTP 200 with a valid token.

Run non-secret source checks from the repository root with `node kol/tests/p2-integration-tests.mjs`. Real integration tests must read credentials and raw task tokens only from local environment variables; never add them to test fixtures or reports.

## Test token provisioning

`seed-demo.sql` deliberately does not create access tokens. Run `node supabase/scripts/generate-test-tokens.mjs` locally with `KOL_SUPABASE_URL`, `KOL_TEST_SECRET_KEY`, and an absolute `KOL_TOKEN_OUTPUT` path outside the repository. The script generates cryptographically random tokens, inserts SHA-256 hashes only, adds separate expired/revoked test hashes, writes raw tokens to a new mode-0600 file, and prints counts only. Never use a path inside this repository and never paste its output file into chat.

## Optional live behavior tests

`node kol/tests/p2-live-tests.mjs` safely reports `SKIP` only when live testing is not enabled. Once `KOL_LIVE_TESTS=1`, every required local variable must exist and both `KOL_LIVE_MUTATION_TESTS=1` and `KOL_LIVE_METRICS_TESTS=1` are mandatory; missing release coverage exits non-zero. Provide a unique matching X URL, test submission UUID, `CRON_SECRET`, and a test-project Secret Key locally. The suite prints only check names and HTTP statuses, never tokens, URLs, credentials, or response bodies.

## Pages release gate

All four functions were deployed to the temporary Supabase test project and live behavior checks passed: token access 200/403, submission 400/403/201/409, unauthenticated Admin 401, and Mock 24h/7d collection HTTP 200. Stored Mock data preserved 24h `bookmarks` and 7d `quotes` as `NULL`; Apify was not called. `kol/js/config.runtime.js` is therefore set to `USE_DEMO_DATA:false` for this test project. The Admin invitation is waiting for email verification before authenticated Admin testing can complete.

Raw task tokens and the cron secret remain outside the repository and are intentionally omitted from all reports.
