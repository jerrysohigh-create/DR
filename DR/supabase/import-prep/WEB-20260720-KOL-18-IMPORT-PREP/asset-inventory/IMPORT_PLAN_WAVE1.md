# Wave 1 Import — Final Execution Plan

> Generated: WEB-20260720-KOL-MIGRATION-004-POSTVERIFY-AND-IMPORT-PREP
> Status: READY TO RUN — NOT EXECUTED
> Source of truth: DRYRUN_PLAN.csv (37 rows / 18 KOLs / 0 reject)

## Prerequisite checklist (ALL MUST BE TRUE before RUN)

- [x] Migration 004 applied to Staging (verified via psql — `task_assets_task_type_public_url_uidx`, `task_assets_stable_sort_idx`, `created_at` all EXIST; duplicate_groups = 0)
- [x] Local tests PASS (asset-safety-tests, asset-render-browser-tests)
- [x] git diff --check clean
- [x] Secret scan clean
- [x] DRYRUN_PLAN.csv has 37 rows / 18 KOLs / 0 reject / 0 duplicate / 0 sort_order conflict
- [x] secret JSON valid + correct ref + pooler URL
- [x] psql ping = 1 verified via non-browser path

## Staging target

- Project ref: `olgvhiwkcjkbqbqwawgiaq` (22 chars — correct, confirmed by Chrome URL + config.toml + worktree sources)
- DB URL: pooler `aws-0-us-east-1.pooler.supabase.com:6543` (NOT direct db.<ref>.supabase.co:5432 — DNS doesn't resolve from this machine)
- DB user: `postgres.olgvhiwkcjkbqbqwawgiaq`
- Password: from `~/.openclaw/secret-staging/supabase-staging.json` (chmod 600, owner gaojie20)

## Import plan — 37 rows / 18 KOLs / 1 asset_type=image

| KOL # | handle | wave | status | rows | asset_ids |
|---:|---|---|---|---:|---|
| 1 | @CryptoDragon001 | Wave 1 | Ready | 2 | IMG01, IMG04 |
| 2 | @Olivelinex | Wave 1 | Ready | 2 | IMG09, IMG06 |
| 3 | @milesdefix | Wave 1 | Ready | 2 | IMG02, IMG05 |
| 4 | @tokenovax | Wave 1 | Ready | 2 | IMG01, IMG10 |
| 5 | @Web3dome | Wave 1 | Ready | 2 | IMG01, IMG10 |
| 6 | @Brad_nft | Wave 1 | Ready | 2 | IMG02, IMG04 |
| 7 | @altcoinbear1 | Wave 2 | Ready | 3 | IMG01, IMG02, IMG03 |
| 8 | @CryptoPanda_gl | Wave 2 | Ready | 2 | IMG01, IMG10 |
| 9 | @CapriShell | Wave 2 | Ready | 2 | IMG06, IMG07 |
| 10 | @Cryptoscipher | Wave 2 | Ready | 2 | IMG02, IMG10 |
| 11 | @mai_thanhVN | Wave 2 | draft (PENDING) | 2 | IMG01, IMG10 |
| 12 | @tokenmotive | Wave 2 | draft (PENDING) | 2 | IMG10, IMG01 |
| 13 | @omnigemx | Wave 3 | Ready | 2 | IMG04, IMG10 |
| 14 | @CryptoBeast_1 | Wave 3 | Ready | 2 | IMG02, IMG05 |
| 15 | @cyhnft | Wave 3 | Ready | 2 | IMG01, IMG10 |
| 16 | @CryptoSolutionG | Wave 3 | Ready | 2 | IMG01, IMG10 |
| 17 | @sunrise_venture | Wave 3 | Ready | 2 | IMG05, IMG10 |
| 18 | @CryptoAs_TW | Wave 3 | Ready | 2 | IMG01, IMG04 |

URL reuse map (allowed by partial unique index `task_id + asset_type + public_url WHERE storage_path IS NULL`):
- phone-black (IMG01): 10 KOLs
- logo (IMG10): 10 KOLs
- phone-white (IMG02): 5 KOLs
- package-page-1 (IMG04): 4 KOLs
- package-page-2 (IMG05): 3 KOLs
- package-page-3 (IMG06): 2 KOLs
- pkg-exploded-new (IMG03): 1 KOL
- package-page-4 (IMG07): 1 KOL
- nfc-card (IMG09): 1 KOL

## Execution sequence (for `RUN WEB-20260720-KOL-ASSET-IMPORT-WAVE1`)

### Step 1 — Transaction preflight
```sql
BEGIN;
-- COUNT existing formal magne_9d_v3 task_assets (should be 0)
SELECT count(*) FROM task_assets WHERE task_id IN (... 18 formal task ids ...);
-- COUNT planned INSERT vs existing active (task_id, asset_type, public_url) duplicates
SELECT task_id, asset_type, public_url, count(*) AS dup
FROM task_assets
WHERE active AND storage_path IS NULL AND public_url <> ''
  AND (task_id, asset_type, public_url) IN (
    SELECT task_id, asset_type, public_url FROM (VALUES
      (...), (...), ... -- 37 rows from DRYRUN_PLAN.csv
    ) AS v(task_id, asset_type, public_url)
  )
GROUP BY task_id, asset_type, public_url HAVING count(*) > 0;
-- Expected: 0 rows
```

### Step 2 — Idempotent INSERT (upsert on conflict)
```sql
INSERT INTO task_assets (task_id, asset_type, file_name, public_url, sort_order, active)
VALUES
  -- 37 rows from DRYRUN_PLAN.csv
ON CONFLICT (task_id, asset_type, public_url) WHERE storage_path IS NULL AND public_url <> ''
DO UPDATE SET
  file_name = EXCLUDED.file_name,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;
```

### Step 3 — Post-INSERT verification
```sql
-- COUNT formal task_assets (should be 37)
SELECT count(*) FROM task_assets ta JOIN campaign_tasks ct ON ct.id = ta.task_id WHERE ct.wave = 'magne_9d_v3';

-- DISTINCT (task_id, asset_type, public_url) for active formal assets (should be 37)
SELECT count(*) FROM (SELECT DISTINCT task_id, asset_type, public_url FROM task_assets ta JOIN campaign_tasks ct ON ct.id = ta.task_id WHERE ct.wave = 'magne_9d_v3' AND ta.active) d;

-- ALL 37 assets reachable via get-task → safePublicImageUrl()
-- (covered by kol/tests/asset-render-browser-tests.mjs in local test pass)
```

### Step 4 — Commit or Rollback
```sql
COMMIT;  -- or ROLLBACK;
```

### Step 5 — Post-import local tests
- `node kol/tests/asset-safety-tests.mjs` (still PASS after import? verify with 37 URLs)
- `node kol/tests/asset-render-browser-tests.mjs` (Monaco editor renders all 37)
- `git diff --check HEAD`
- `git status --porcelain` (should still be only 10 V1 files)

## Failure modes

- Step 1 dup count > 0 → ROLLBACK immediately, do not retry without investigation
- Step 2 ON CONFLICT fails → check partial unique index still present, ROLLBACK
- Step 3 count != 37 → ROLLBACK, investigate
- Step 5 local tests fail → investigate before COMMIT decision

## Restricted

- No Wave 2/3 add-ons (only image assets)
- No YouTube / iframe / external_video (excluded by design — separate V2 task)
- No KOL copy / status / UTM / schedule changes
- No production writes
- No Cron / Apify / TwStalker
- No commit / push / deploy
