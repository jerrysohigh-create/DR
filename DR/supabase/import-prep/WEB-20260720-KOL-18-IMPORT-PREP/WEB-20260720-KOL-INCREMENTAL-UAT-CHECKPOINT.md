# WEB-20260720-KOL-INCREMENTAL-UAT-CHECKPOINT

Status: **STAGING UAT CHECKPOINT — PASS**
Scope: MAGNE.AI 18-KOL `magne_9d_v3` campaign
Environment: Staging only

## Staging project identification

- Supabase project name: `magne-kol-portal-test`
- Project Ref: `olgvhiwkcjkbqwawgiaq`
- Project URL: `https://olgvhiwkcjkbqwawgiaq.supabase.co`
- Public Portal: `https://jerrysohigh-create.github.io/DR/kol/`
- No password, API key, service key, raw task Token or secret is recorded in this checkpoint.

## Current campaign state

- Formal KOL profiles: 18 unique profiles.
- Formal campaign tasks: 18 unique `magne_9d_v3` tasks.
- Ready to Publish: 16.
- Draft / publication blocked: 2.
- Profile languages: 17 `en`, 1 `zh-TW` (`@CryptoAs_TW`).
- `x_handle`: all 18 retain the leading `@`.
- `display_name`: all 18 equal the complete Handle without the leading `@`.
- `utm_campaign`: 18/18 `magne_9d_v3`.
- `utm_content`: 18/18 unique.
- `campaign_link_enabled`: 18/18 `true`.

## Completed database work

- `001_kol_portal.sql`: base Portal schema and RLS are present in Staging.
- `002_kol_content_manager.sql`: content-management and private asset-storage support are present in Staging.
- `003_kol_hardening_proposal.sql`: hardening migration applied in Staging after duplicate preflight; RLS remained enabled.
- 18-KOL staging import completed after backup and zero-duplicate preflight.
- Campaign Link correction completed with exactly 18 affected rows.
- Campaign Link rollback dry-run completed with target count 18, affected rows 18 and final `ROLLBACK`.
- Full-import rollback is disabled and reserved for separately approved manual emergency use.

## Metrics and scheduling safety

- `METRICS_MODE=mock`.
- Cron is not enabled.
- Apify is not configured or called.
- TwStalker is not configured or called.
- Mock metrics must not be included in formal Total Views.
- Missing or failed metrics must remain `null` and display `Unable to Verify`, never zero.

## Staging Token checkpoint

- Current `task_access_tokens` row count: 11.
- Five Staging-only temporary Token hashes were added for controlled UAT.
- Raw Tokens are stored only in protected files outside the Repo; they are not included here.
- Staging Tokens must not be reused in a production environment.

## Import package location

`/home/gaojie20/.openclaw/workspace-orchestrator/DR/supabase/import-prep/WEB-20260720-KOL-18-IMPORT-PREP`

Primary files:

- `kol_18_import.csv`
- `004_kol_18_staging_import.sql`
- `004_kol_18_campaign_link_rollback_dry_run.sql`
- `004_kol_18_full_import_rollback.sql.disabled`
- `APPROVED_COPY_REVIEW.md`
- `VALIDATION_REPORT.md`
- `README.md`

## Latest PASS row counts

| Object | Count |
|---|---:|
| `kol_profiles` | 18 |
| `campaign_tasks` | 21 |
| Formal `magne_9d_v3` tasks | 18 |
| `task_assets` | 1 |
| Formal `magne_9d_v3` task assets | 0 |
| `task_access_tokens` | 11 |
| Campaign links enabled | 18 |
| Campaign links disabled | 0 |

The three non-formal tasks are the existing Demo tasks. They were not deleted or replaced by the formal import.

## Incremental update workflow

1. Create a new task ID and feature branch; do not work directly on `main`.
2. Identify the exact KOL Handle and formal `magne_9d_v3` task.
3. Back up only the rows and fields affected by the requested update.
4. Record pre-update row counts and run duplicate/ownership checks.
5. Validate the proposed source against the approved content pack and SGT schedule.
6. Use a transaction with an exact task/Handle predicate and affected-row assertion.
7. Never update unrelated profiles, tasks, Tokens, submissions, metrics or assets.
8. Revalidate Handle, display name, language, status, publish time, approved copy, UTM and asset visibility.
9. Run Portal E2E with an existing Staging Token; do not place the Token in a URL, log, Git or chat.
10. Create a narrowly scoped rollback dry-run ending in `ROLLBACK`.
11. Obtain independent review before COMMIT, PUSH, merge or any production operation.

## Per-KOL verification checklist

`Profile`, `Copy`, `SGT`, and `UTM` are PASS for all rows below. `Assets` describes the formal task, not a legacy Demo task.

| KOL | Language | Status | Profile | Copy | SGT | UTM | Assets / hold |
|---|---|---|---|---|---|---|---|
| @CryptoDragon001 | en | Ready to Publish | PASS | PASS | PASS | PASS | Formal asset not imported |
| @Olivelinex | en | Ready to Publish | PASS | PASS | PASS | PASS | Formal asset not imported |
| @milesdefix | en | Ready to Publish | PASS | PASS | PASS | PASS | Formal asset not imported; Gemini wording PASS |
| @tokenovax | en | Ready to Publish | PASS | PASS | PASS | PASS | Formal asset not imported |
| @Web3dome | en | Ready to Publish | PASS | PASS | PASS | PASS | Formal asset not imported |
| @Brad_nft | en | Ready to Publish | PASS | PASS | PASS | PASS | Formal asset not imported |
| @altcoinbear1 | en | Ready to Publish | PASS | PASS | PASS | PASS | Formal asset not imported |
| @CryptoPanda_gl | en | Ready to Publish | PASS | PASS | PASS | PASS | Formal asset not imported; CE wording PASS |
| @CapriShell | en | Ready to Publish | PASS | PASS | PASS | PASS | Manufacturing asset unconfirmed; asset area hidden |
| @Cryptoscipher | en | Ready to Publish | PASS | PASS | PASS | PASS | Formal asset not imported |
| @mai_thanhVN | en | draft | PASS | PASS with PENDING | PASS | PASS | Blocked: verified Task Receipt TX URL missing |
| @tokenmotive | en | draft | PASS | PASS with PENDING | PASS | PASS | Blocked: official financing announcement URLs missing |
| @omnigemx | en | Ready to Publish | PASS | PASS | PASS | PASS | Formal asset not imported |
| @CryptoBeast_1 | en | Ready to Publish | PASS | PASS | PASS | PASS | Formal asset not imported |
| @cyhnft | en | Ready to Publish | PASS | PASS | PASS | PASS | Formal asset not imported |
| @CryptoSolutionG | en | Ready to Publish | PASS | PASS | PASS | PASS | Formal asset not imported |
| @sunrise_venture | en | Ready to Publish | PASS | PASS | PASS | PASS | Formal asset not imported |
| @CryptoAs_TW | zh-TW | Ready to Publish | PASS | PASS | PASS | PASS | Formal asset not imported; `CE已通过` retained |

## Prohibited operations at this checkpoint

- Do not execute the `.sql.disabled` full-import rollback without a separate explicit approval.
- Do not merge, deploy or write to a production Supabase project.
- Do not enable Cron or change `METRICS_MODE` to live.
- Do not configure or call Apify, TwStalker, X OAuth or X API.
- Do not generate, expose, log or commit raw task Tokens.
- Do not place task Tokens in query-string URLs for normal delivery.
- Do not rewrite approved copy, remove PENDING qualifiers or invent missing URLs/evidence.
- Do not guess, fabricate or publish unapproved product media.
- Do not delete profiles, tasks, submissions, Tokens, assets or metric snapshots without a separate scoped approval and verified rollback plan.

## Outstanding data and materials

- `@mai_thanhVN`: verified real Task Receipt transaction URL.
- `@tokenmotive`: official MAGNE/GAEA/Titans financing announcement URLs.
- `@CapriShell`: approved FIH/EVT/DVT/PVT manufacturing material package.
- All 18 formal tasks: final approved Portal-compatible image/video files and confirmation of external-use rights.
- Submission UAT remains skipped because no safe automatic cleanup interface currently exists.
- Live metrics providers, cost controls, schedules and alerts remain out of scope and disabled.

## Git checkpoint

- Branch: `prep/kol-18-import`
- HEAD SHA: `771bbeb43ca44cc82bcac4ee78768c0f85de3643`
- Import package state: untracked working-tree files under `supabase/import-prep/`.
- This checkpoint and the import package are not committed or pushed.
- No database operation, commit or push was performed while creating this checkpoint.
