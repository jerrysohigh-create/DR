# MAGNE.AI KOL Portal — Supabase

This directory contains deployable database and Edge Function source. It contains no secrets.

1. Run `migrations/001_kol_portal.sql` in a new Supabase project.
2. Optionally run `seed-demo.sql` only in a non-production project.
3. Create an Auth user, then insert its UUID/email/role (`admin` or `editor`) into `admin_users` using the SQL editor.
4. Deploy: `supabase functions deploy get-task submit-post collect-metrics admin-export`.
5. Configure server-only secrets with `supabase secrets set APIFY_TOKEN=... APIFY_ACTOR_ID=... CRON_SECRET=...`. `SUPABASE_SERVICE_ROLE_KEY` is supplied to functions by Supabase and must never enter `/kol/`.
6. `collect-metrics` first calls Apify, then the optional `TWSTALKER_ENDPOINT`; both failures create a `manual_review` snapshot. Null metrics remain null.
7. Schedule snapshots externally at `initial`, `24h`, `48h_retry`, `7d`, or `8d_retry`, passing `x-cron-secret`.

RLS is enabled on every table. There are no anonymous table policies: KOL task reads and submissions pass through token-validating Edge Functions. Staff access requires Supabase Auth plus an active `admin_users` role.
