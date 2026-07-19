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

Limitations: no live Supabase project, X post, Apify account, TwStalker endpoint, or production assets were provided. Therefore network integration and scheduled metric collection are deployable scaffolds, not live end-to-end tests. Production Admin Auth/session/JWT wiring and authenticated export are implemented and statically tested; Demo mode remains available for local review.
