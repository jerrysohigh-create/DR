# SAFE IMAGE V1 Staging Asset Import — Dry-Run Report

Task: `WEB-20260720-KOL-ASSET-SAFE-IMAGE-V1-STAGING-DRYRUN`
Scope: image `asset_type` only. YouTube / iframe / external video excluded by design.
Source-of-truth: 10/10 PASS images from `ASSET_INVENTORY.csv` (static verification).
KOL mapping: `KOL_ASSET_MAPPING_REVIEW_V2.md` (V2 mapping).

Staging project: `magne-kol-portal-test` (`olgvhiwkcjkbqwawgiaq`) — checkpoint only, **no DB writes performed**.
Existing formal `magne_9d_v3` task_assets in Staging: **0** (per UAT checkpoint). Dry-run duplication risk is therefore zero against existing formal rows.

## 1. Coverage

- Total KOLs planned: **18/18**
- Total candidate image rows: **37**
- KOLs with ≥1 candidate: **18/18**
- KOLs rejected (no candidate passes safety): **0/18**
- Rejected rows (any URL failed safety): **0**

## 2. Per-KOL plan

| KOL | Handle | Status | Wave | Candidates | Asset IDs | Rejected |
|---:|---|---|---|---:|---|---|
| 1 | @CryptoDragon001 | Ready to Publish | Wave 1 | 2 | IMG01, IMG04 | — |
| 2 | @Olivelinex | Ready to Publish | Wave 1 | 2 | IMG09, IMG06 | — |
| 3 | @milesdefix | Ready to Publish | Wave 1 | 2 | IMG02, IMG05 | — |
| 4 | @tokenovax | Ready to Publish | Wave 1 | 2 | IMG01, IMG10 | — |
| 5 | @Web3dome | Ready to Publish | Wave 1 | 2 | IMG01, IMG10 | — |
| 6 | @Brad_nft | Ready to Publish | Wave 1 | 2 | IMG02, IMG04 | — |
| 7 | @altcoinbear1 | Ready to Publish | Wave 2 | 3 | IMG01, IMG02, IMG03 | — |
| 8 | @CryptoPanda_gl | Ready to Publish | Wave 2 | 2 | IMG01, IMG10 | — |
| 9 | @CapriShell | Ready to Publish | Wave 2 | 2 | IMG07, IMG06 | — |
| 10 | @Cryptoscipher | Ready to Publish | Wave 2 | 2 | IMG02, IMG10 | — |
| 11 | @mai_thanhVN | draft | Wave 2 | 2 | IMG01, IMG10 | — |
| 12 | @tokenmotive | draft | Wave 2 | 2 | IMG10, IMG01 | — |
| 13 | @omnigemx | Ready to Publish | Wave 3 | 2 | IMG04, IMG10 | — |
| 14 | @CryptoBeast_1 | Ready to Publish | Wave 3 | 2 | IMG02, IMG05 | — |
| 15 | @cyhnft | Ready to Publish | Wave 3 | 2 | IMG01, IMG10 | — |
| 16 | @CryptoSolutionG | Ready to Publish | Wave 3 | 2 | IMG01, IMG10 | — |
| 17 | @sunrise_venture | Ready to Publish | Wave 3 | 2 | IMG05, IMG10 | — |
| 18 | @CryptoAs_TW | Ready to Publish | Wave 3 | 2 | IMG01, IMG04 | — |

## 3. URL safety validation

Validator: mirror of `kol/js/asset-url.js#safeImageUrl` + `supabase/functions/_shared/public-asset-url.ts#safePublicImageUrl` (allowlist, control chars, protocol, username/password/port, image extension).

Result: **0 rows rejected by safety** out of 37 planned.

All 10 inventory URLs (`www.magne.ai/magne-web/...`) satisfy: https scheme, host in allowlist, `.png` extension, no control chars, no userinfo, no non-standard port, not YouTube/nocookie/i.ytimg.

## 4. Sort order

Within-KOL sort_orders: **all unique**
- No sort_order collisions inside any KOL.
- Each KOL uses 1-based sort_order (1, 2, [3]); get-task comparator falls back to `created_at ASC, id ASC` for tie-break.

## 5. Dedup (within KOL)

Dedup key: `(task_id, asset_type, public_url)` — checked locally for this dry-run.

Within-KOL duplicates: **0** (expected 0).

Cross-KOL reuse of the same URL is **intentionally allowed** by the partial unique index `(task_id, asset_type, public_url) WHERE storage_path IS NULL AND public_url <> ''` (migration 004 PROPOSAL).

Reuse map:

- `https://www.magne.ai/magne-web/phone-black.png` → 10 KOLs: @CryptoDragon001 (sort 1), @tokenovax (sort 1), @Web3dome (sort 1), @altcoinbear1 (sort 1), @CryptoPanda_gl (sort 1), @mai_thanhVN (sort 1), @tokenmotive (sort 2), @cyhnft (sort 1), @CryptoSolutionG (sort 1), @CryptoAs_TW (sort 1)
- `https://www.magne.ai/magne-web/media-kit/package-page-1.png` → 4 KOLs: @CryptoDragon001 (sort 2), @Brad_nft (sort 2), @omnigemx (sort 1), @CryptoAs_TW (sort 2)
- `https://www.magne.ai/magne-web/media-kit/package-page-3.png` → 2 KOLs: @Olivelinex (sort 2), @CapriShell (sort 2)
- `https://www.magne.ai/magne-web/phone-white.png` → 5 KOLs: @milesdefix (sort 1), @Brad_nft (sort 1), @altcoinbear1 (sort 2), @Cryptoscipher (sort 1), @CryptoBeast_1 (sort 1)
- `https://www.magne.ai/magne-web/media-kit/package-page-2.png` → 3 KOLs: @milesdefix (sort 2), @CryptoBeast_1 (sort 2), @sunrise_venture (sort 1)
- `https://www.magne.ai/magne-web/assets/brand/magne-logo-white-horizontal.png` → 10 KOLs: @tokenovax (sort 2), @Web3dome (sort 2), @CryptoPanda_gl (sort 2), @Cryptoscipher (sort 2), @mai_thanhVN (sort 2), @tokenmotive (sort 1), @omnigemx (sort 2), @cyhnft (sort 2), @CryptoSolutionG (sort 2), @sunrise_venture (sort 2)

## 6. Still MISSING (dedicated evidence — preserved)

- @CapriShell — approved FIH/EVT/DVT/PVT manufacturing material: **MISSING** (dry-run uses generic `package-page-3` / `package-page-4` only; no FIH/line fake imagery)
- @mai_thanhVN — verified Task Receipt TX URL: **MISSING** (draft status preserved; dry-run adds only `phone-black` + `logo`)
- @tokenmotive — MAGNE/GAEA/Titans financing announcement URLs: **MISSING** (draft status preserved; dry-run adds only `logo` + `phone-black`)
- @CryptoPanda_gl — compliance evidence image (GMS/TAC/FCC/CE): **MISSING** (dry-run adds only `phone-black` + `logo`)
- @cyhnft — 1,264 Session 1 valid entries Dashboard screenshot: **MISSING** (dry-run adds only `phone-black` + `logo`)
- Angle-specific evidence for KOL 4 (L1/L2 Explorer), 5 (Agent Pay/x402), 6 (DePIN network), 10 (testnet Explorer), 13/16/17/18 (campaign/dashboard/tutorial/recap): **MISSING** (no candidate proposed for those claims; only general official images)

## 7. KOL status vs candidate set

- 16 KOLs are `Ready to Publish` with ≥1 candidate (1–8, 10, 13–18).
- 2 KOLs are `draft` with candidates proposed but blocked by missing dedicated evidence (11, 12).
- @CapriShell (9) is `Ready to Publish` with `package-page-3` + `package-page-4` candidates; Portal currently hides asset area because formal assets = 0 — after a real import the asset area would render.

## 8. Assumptions and caveats

- Staging DB was NOT queried (no Token, no network from isolated worktree). Existing formal `task_assets` count is taken from UAT CHECKPOINT (0). A separate scoped read-only query should re-confirm before the real import RUN.
- `file_name` is set from inventory filename; for actual import the operator may rename to a slug-prefixed internal filename (out of scope here).
- All 10 inventory URLs were independently re-verified by SHA-256 in `STATIC_VERIFICATION_EVIDENCE.md`; CSV here only re-asserts static verification status (PASS).
- YouTube asset_type is intentionally absent — YouTube V2 is a separate task.

## 9. Verdict

- Coverage: **18/18 KOLs** have ≥1 candidate, **0 URL rejected** by safety, **0 within-KOL sort_order collision**, **0 within-KOL duplicate**.
- Ready to plan a real `RUN WEB-20260720-KOL-ASSET-IMPORT-WAVE1` against Staging (still gated by explicit COMMIT-style approval).
- Verdict: **DRY-RUN PASS**
