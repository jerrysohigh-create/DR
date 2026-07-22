# WEB-20260720-KOL-18-IMPORT-FINALIZE Validation Report

## Verdict

**PASS — CORRECTED STAGING IMPORT PACKAGE READY FOR REVIEW, NOT EXECUTED.** A separate IMPORT approval remains mandatory.

## Confirmed fields

- `display_name`: all 18 use the complete X Handle without the leading `@`; `x_handle` retains the leading `@`.
- profile language: `@CryptoAs_TW`=`zh-TW`; remaining 17=`en`.
- approved copy: 17 matched to the English V2 content pack; `@CryptoAs_TW` uses the human-approved Traditional Chinese copy from `WEB-20260720-KOL18-COPY-FIX`, with the English pack's KOL 18 paragraph synchronized to the same facts.
- Publish time: original SGT schedule retained as ISO `+08:00`.
- UTM: all use `utm_campaign=magne_9d_v3`; 18 unique `utm_content` values.
- Campaign links: 18/18 source rows explicitly set `campaign_link_enabled=true`; the staging INSERT writes this value and does not rely on the database default.
- CE: English `CE Approved/approval`; KOL 18 Traditional Chinese `CE 已通過`.

## KOL 18 approved-copy correction

- `@CryptoAs_TW` remains `zh-TW`; handle, slug, schedule, UTM, requirements, prohibited claims, status and assets are unchanged.
- `1,264` means Phone Gen1 Session 1 valid entries only.
- Session 2 is stated as currently open.
- All funding-amount and investor wording has been removed from both language packs and import sources.
- Official URLs remain `https://www.magne.ai/` and `https://payment.magne.ai/`.

## Content safety checks

- KOL 3: PASS — no `On-device Gemini` or `Offline Gemini`; Gemini is described as cloud intelligence.
- KOL 8: PASS — CE wording is `approval`.
- KOL 11: PASS WITH PUBLICATION HOLD — verified Task Receipt placeholder remains.
- KOL 12: PASS WITH PUBLICATION HOLD — official financing-announcement placeholders remain.

## Task status

- 16 tasks are `Ready to Publish` and can be tested.
- `@mai_thanhVN` is `draft` and cannot be exposed by the Portal until a verified real Task Receipt transaction URL replaces the retained PENDING placeholder.
- `@tokenmotive` is `draft` and cannot be exposed by the Portal until official MAGNE/GAEA/Titans announcement URLs replace the retained PENDING placeholder.
- `@CapriShell` is `Ready to Publish`; its unconfirmed asset remains absent, so the Portal hides the asset area.
- Portal display validation: `display_name` contains no leading `@`, preventing `@@Handle` when a UI prefixes the display value.

## 18-row corrected comparison

| x_handle | display_name | language | status | publish_at (SGT) |
|---|---|---|---|---|
| @CryptoDragon001 | CryptoDragon001 | en | Ready to Publish | 2026-07-21T12:30:00+08:00 |
| @Olivelinex | Olivelinex | en | Ready to Publish | 2026-07-21T17:30:00+08:00 |
| @milesdefix | milesdefix | en | Ready to Publish | 2026-07-21T21:30:00+08:00 |
| @tokenovax | tokenovax | en | Ready to Publish | 2026-07-22T12:30:00+08:00 |
| @Web3dome | Web3dome | en | Ready to Publish | 2026-07-22T17:30:00+08:00 |
| @Brad_nft | Brad_nft | en | Ready to Publish | 2026-07-22T21:30:00+08:00 |
| @altcoinbear1 | altcoinbear1 | en | Ready to Publish | 2026-07-24T12:30:00+08:00 |
| @CryptoPanda_gl | CryptoPanda_gl | en | Ready to Publish | 2026-07-24T17:30:00+08:00 |
| @CapriShell | CapriShell | en | Ready to Publish | 2026-07-24T21:30:00+08:00 |
| @Cryptoscipher | Cryptoscipher | en | Ready to Publish | 2026-07-25T12:30:00+08:00 |
| @mai_thanhVN | mai_thanhVN | en | draft | 2026-07-25T17:30:00+08:00 |
| @tokenmotive | tokenmotive | en | draft | 2026-07-25T21:30:00+08:00 |
| @omnigemx | omnigemx | en | Ready to Publish | 2026-07-27T12:30:00+08:00 |
| @CryptoBeast_1 | CryptoBeast_1 | en | Ready to Publish | 2026-07-27T17:30:00+08:00 |
| @cyhnft | cyhnft | en | Ready to Publish | 2026-07-27T21:30:00+08:00 |
| @CryptoSolutionG | CryptoSolutionG | en | Ready to Publish | 2026-07-28T12:30:00+08:00 |
| @sunrise_venture | sunrise_venture | en | Ready to Publish | 2026-07-28T17:30:00+08:00 |
| @CryptoAs_TW | CryptoAs_TW | zh-TW | Ready to Publish | 2026-07-28T21:30:00+08:00 |

## Assets

- No new `task_assets` row is proposed because the supplied sources provide YouTube/page/evidence index URLs, not uploaded Portal-compatible image/video file URLs.
- Existing assets are not changed or deleted.
- Empty asset lists remain supported and the Portal hides the download area.
- Admin may upload approved images/videos later.

## Remaining unresolved items

- `@mai_thanhVN`: verified real Task Receipt transaction URL.
- `@tokenmotive`: MAGNE/GAEA/Titans official announcement URLs.
- `@CapriShell`: approved FIH/EVT/DVT/PVT manufacturing files.
- External-use approval and actual upload for all final images/videos.

## Safety

- SQL defaults to approval=`no` and aborts without a separate IMPORT gate.
- No raw Token, Token hash, secret or credential is present.
- No `task_access_tokens` insert exists.
- Existing profiles are backed up to `audit_logs` before confirmed display/language updates.
- Rollback restores prior existing-profile values and refuses automatic cleanup after operational dependencies exist.
- No SQL, migration, Function deployment, commit or push occurred.

## Source manifest

| Source | Stored filename | Bytes | SHA-256 |
|---|---|---:|---|
| en_xlsx | `MAGNE_AI_18KOL_9_Day_Accelerated_Execution_Plan_V3_EN_202607---d26a7a9d-5de4-458b-9060-93590f6cd956.xlsx` | 17500 | `1b997794cc2a25a67b7efac22f631d1affb0ae4f087b42175d338d16737432dc` |
| zh_xlsx | `MAGNE_AI_18KOL_9天加速落地执行方案_V3_202607---4836f273-2587-408c-b9e4-948c6b236ee2.xlsx` | 27989 | `f6937cc49183e42d11969f427325d6a8b15ac3701a962fcf622269cc74f31356` |
| en_docx | `MAGNE_AI_18KOL_English_Content_Execution_Pack_V2_9_Day_20260---c9c1bf6c-3133-4cd1-a0ce-af8cdcc0eba6.docx` | 46696 | `3c91750ade4e88e52c29e7bf12a7c39c825cda7f4144209bab688a68d57beb89` |
| zh_docx | `MAGNE_AI_18KOL_中文内容执行包_V2_9天版_202607---15c22a40-0e1a-4541-9586-e778a3a626cc.docx` | 47435 | `a1157fdd89f7ff77979fbc3ba49a7a84491a4151cef0fde2d0f0791ab1654624` |

## Safety confirmation

- No raw Token was generated or written.
- No secret was read or written.
- No existing Supabase row was modified or deleted.
- No migration or Function deployment occurred.
- No commit, push or database import occurred.
