# WEB-20260720-KOL-ASSET-RENDERER-PREFLIGHT

## Verdict

**BLOCKED** for Wave 1 Staging `task_assets` import.

Official PNG files are compatible with the current image renderer, but YouTube watch/Shorts URLs are not natively supported. More importantly, `public_url` is returned and assigned to clickable `href` values without an HTTP(S) allowlist. A `javascript:` row introduced by a privileged/import path would execute when its Download link is clicked. This meets the task's explicit `BLOCKED` criterion for URL-injection risk.

This was a read-only review. No Supabase row, Function, product source, deployment, Token, commit or push was changed. The only created file is this report.

## Evidence scope

- Portal renderer: `DR/kol/js/task.js:22-28,109-158`
- Portal structure/CSS: `DR/kol/index.html:119-123,154-156`; `DR/kol/css/app.css:128-144,242-260`
- API response: `DR/supabase/functions/get-task/index.ts:20-53`
- Token/task isolation: `DR/supabase/functions/_shared/security.ts:48-60`
- Schema/RLS: `DR/supabase/migrations/001_kol_portal.sql:4,10-21`; `002_kol_content_manager.sql:7-20,28-47`
- Upload validation: `DR/supabase/functions/_shared/asset-validation.ts:1-55`; `DR/supabase/functions/admin-content/index.ts:171-225`
- Reorder behavior: `DR/supabase/functions/admin-content/index.ts:286-329`
- Demo fixtures: `DR/kol/assets/mock/demo-task.json:4-6`
- Verified inventory: `ASSET_INVENTORY.csv:2-11`; `YOUTUBE_VIDEO_MAPPING.csv:2-7`; `KOL_ASSET_MAPPING_REVIEW_V2.md:9-26`

## Fifteen checks

| # | Check | Result | Evidence and impact |
|---:|---|---|---|
| 1 | Actual `asset_type` values | **Supports only `image`, `video`** | Database CHECK permits only these two values (`002_kol_content_manager.sql:15-17`). Upload MIME mapping emits only these values (`asset-validation.ts:10-43`). Demo values `primary` and `square` are legacy fixture values and happen to render as images only because every non-`video` type falls back to `<img>` (`task.js:144-147`); they are not schema-valid asset types. |
| 2 | Image `public_url` render/download | **Render yes; reliable forced download no** | API passes `public_url` unchanged when no `storage_path` exists (`get-task/index.ts:48-53`). Portal assigns it to `<img>.src` and `<a href download>` (`task.js:144-155`). Cross-origin `download` is commonly ignored by browsers, so a `www.magne.ai` URL may navigate/open rather than save. |
| 3 | Video direct media requirement | **Yes** | `video` creates `<video src=URL controls>` (`task.js:144-147`). Supported upload MIME is MP4/WebM only (`asset-validation.ts:31-43`; migration bucket allowlist at `002...sql:39-41`). The URL must resolve to browser-playable media, not an HTML watch page. |
| 4 | YouTube watch/Shorts preview | **Not supported** | A Shorts URL with type `video` becomes `<video src="https://youtube.com/shorts/...">`; YouTube returns an HTML page, not MP4/WebM. No iframe/oEmbed/player code exists in `task.js:138-158` or `index.html:119-123`. |
| 5 | `youtube_embed` / `external_video` types | **Not supported** | Schema rejects both (`002...sql:15-17`); renderer treats any non-`video` value as `<img>` (`task.js:144-147`). |
| 6 | Download All and YouTube | **Incorrect/unsafe behavior** | It clicks every asset URL with `download` indiscriminately (`task.js:22-28`). For YouTube this attempts navigation/download of a watch page; multiple cross-origin clicks can be browser-blocked or replace the page. |
| 7 | Missing/inactive assets hidden | **Yes** | Edge filters inactive rows (`get-task/index.ts:45-47`), then removes rows without a usable URL (`:48-53`). Portal hides the entire card when the resulting list is empty (`task.js:139-140`). |
| 8 | Reusing one URL across KOLs | **Allowed** | No unique constraint covers `public_url` or `(task_id, public_url)` (`001...sql:4`). The only asset uniqueness index is non-null `storage_path` globally (`002...sql:19-20`). |
| 9 | Cross-origin preview/download | **Preview generally yes; download not guaranteed** | `<img src>` supports cross-origin display without canvas access (`task.js:144-147`). `download` on a cross-origin anchor is not reliably honored (`:150-155`); the source server's headers/browser policy decide save versus navigation. |
| 10 | Escaping, DOM injection, `javascript:` defense | **BLOCKING GAP** | Names use `textContent` (`task.js:148-149`), preventing HTML injection. But `a.url` is assigned directly to media `src` and two clickable `href` paths (`:22-28,147,150-154`) without parsing or allowing only `https:`. `javascript:` can therefore execute on click. `data:` and arbitrary origins are also accepted. |
| 11 | CSP origins | **No explicit CSP found; permissive rather than safely configured** | `index.html:1-158` contains no CSP meta. Static response inspection for `https://www.magne.ai/kol/` returned 200 without a `Content-Security-Policy` header. Thus current delivery does not block `www.magne.ai`, YouTube, `youtube-nocookie.com` or `i.ytimg.com`, but it also provides no CSP defense. A future policy needs at least `img-src 'self' https://www.magne.ai https://i.ytimg.com`, `media-src 'self' https://www.magne.ai`, and, if embedding is implemented, `frame-src https://www.youtube.com https://www.youtube-nocookie.com`; use exact required `connect-src` separately. |
| 12 | GitHub Pages mobile YouTube iframe | **Not implemented / cannot pass** | There is no iframe renderer or iframe CSS. Mobile CSS only adjusts shell/campaign actions (`app.css:39,242-260`); asset CSS covers only `img` and `video` (`:128-144`). Therefore current Portal cannot display a YouTube iframe on mobile or desktop. A future iframe requires responsive aspect-ratio/width rules and an `/embed/VIDEO_ID` URL. |
| 13 | Uniqueness / rerun idempotency | **Duplicates likely** | There is no unique key for `(task_id, public_url)`, `(task_id, file_name)`, or another import identity (`001...sql:4`; `002...sql:19-20`). Re-running a public-URL INSERT can duplicate rows. Storage uploads get random paths (`admin-content/index.ts:205-225`), so repeated uploads are also distinct. Import must use an explicit idempotent key/upsert strategy or add a reviewed constraint. |
| 14 | Inactive hidden | **Yes in KOL Portal** | `get-task` filters `active` before serialization (`get-task/index.ts:45-47`). Admin intentionally still shows inactive rows (`content-manager.js:224-235`), which is appropriate for management. |
| 15 | Stable `sort_order` | **Only when values are unique; ties unstable** | Edge sorts only numerically by `sort_order` (`get-task/index.ts:45-47`). Schema has a non-unique index, not a uniqueness constraint (`002...sql:19`). Admin reorder writes contiguous indices (`admin-content/index.ts:286-329`), but direct imports can create ties; no secondary `id` ordering exists. |

## Mock-fixture compatibility trace

No database or production code was changed. Two in-memory fixture shapes were traced through the exact branches in `task.js:141-156`:

1. `{type: "image", url: "https://www.magne.ai/magne-web/phone-black.png"}` creates an `<img>` and a download anchor. The inventory independently records the URL as HTTP 200 `image/png`, 2,314×1,724 and 799,904 bytes (`ASSET_INVENTORY.csv:2`). **Preview-compatible; cross-origin forced-download not guaranteed.**
2. `{type: "video", url: "https://youtube.com/shorts/ZMhyf6yImOc"}` creates a `<video>` whose source is an HTML Shorts page. The inventory confirms this is a watch URL/oEmbed record, not a direct media URL (`YOUTUBE_VIDEO_MAPPING.csv:2`). **Preview-incompatible; Download All behavior incorrect.**

The three Demo tasks do not prove schema compatibility: only the first has assets, using non-schema types `primary`/`square`; the other two have empty arrays (`demo-task.json:4-6`). There is no Demo video fixture.

## Supported and unsupported types

Supported now:

- `image`: PNG/JPEG/WebP via uploaded/signed URL or a validated HTTPS public image URL.
- `video`: direct MP4/WebM media only.

Unsupported now:

- `youtube_embed`
- `external_video`
- YouTube watch/Shorts URLs stored as `video`
- `primary` and `square` as database values (legacy Demo-only labels)
- iframe/oEmbed assets

## Write-format recommendations

### Images

Preferred safe format is private Storage upload through the existing admin flow, producing:

```text
asset_type=image
storage_path=<task UUID>/<random UUID>.png
public_url=""
mime_type=image/png
size_bytes=<verified bytes>
sort_order=<unique contiguous integer>
active=true
```

That path validates MIME, size and magic bytes (`asset-validation.ts:45-55`) and returns a one-hour signed URL (`get-task/index.ts:20-31`). If Wave 1 must use externally hosted official images, accept only normalized `https:` URLs on an explicit host allowlist (at minimum the approved `www.magne.ai` host), reject credentials/fragments and dangerous schemes, and define an idempotency key before import. Do not claim that cross-origin `download` will always force a file save.

### YouTube

**Do not insert Shorts/watch URLs into current `task_assets`.** The safe current choice is to leave video MISSING until either:

- an approved direct MP4/WebM is uploaded through the existing flow; or
- a separately approved code/schema change adds a dedicated `youtube_embed` type, validates an 11-character Video ID, constructs `https://www.youtube-nocookie.com/embed/VIDEO_ID` internally, adds responsive iframe UI, excludes embeds from Download/Download All, and deploys a restrictive CSP.

Never store arbitrary iframe HTML or trust a caller-supplied embed URL.

## Download All recommendation

- Operate only on downloadable `image` and direct `video` assets.
- Exclude external/embed video types and show an **Open video** action instead.
- Validate/normalize URL protocol before assigning `href`; allow only `https:` (and same-origin signed URLs as applicable).
- For dependable cross-origin downloads, fetch through a controlled same-origin endpoint with an attachment disposition or package approved assets server-side; account for CORS. Avoid triggering many synthetic navigations.

## CSP gap

The current absence of CSP makes the requested origins technically loadable but leaves no injection containment. Before external-video support, deploy and verify an HTTP response policy. It should start from `default-src 'self'`, explicitly enumerate image/media/frame/connect origins, prohibit plugins (`object-src 'none'`), constrain base URLs (`base-uri 'self'`), and use `frame-ancestors` appropriate to deployment. Inline module script at `index.html:154` must be moved, hashed, or nonced if `script-src` avoids `'unsafe-inline'`.

## KOL recommendations under current renderer

These are recommendations only; no `task_assets` rows were written. YouTube entries remain non-importable until renderer support exists.

| KOL | Safe current image recommendation | Video status / evidence boundary |
|---:|---|---|
| 1 `@CryptoDragon001` | phone-black; package-page-1 | Create Wallet / Hide Private Space: **not importable as YouTube**. |
| 2 `@Olivelinex` | nfc-card; package-page-3 | NFC/Mnemonic restore: **not importable as YouTube**; not CC EAL6+ proof. |
| 3 `@milesdefix` | phone-white; package-page-2 | Gemini: **not importable**; wording only “one-tap Gemini” and “cloud-assisted workflow”. |
| 4 `@tokenovax` | phone-black; logo | DApp video not importable and never L1/L2 Explorer evidence. |
| 5 `@Web3dome` | phone-black; logo | DApp video not Agent Pay/x402 evidence. |
| 6 `@Brad_nft` | phone-white; package-page-1 | Hide Private Space not DePIN evidence. |
| 7 `@altcoinbear1` | phone-black; phone-white; pkg-exploded-new | Create Wallet not importable as YouTube. |
| 8 `@CryptoPanda_gl` | phone-black; logo | Compliance evidence remains **MISSING**. |
| 9 `@CapriShell` | package-page-4; package-page-3 | Formal manufacturing material remains **MISSING**. |
| 10 `@Cryptoscipher` | phone-white; logo | DApp video not importable and never Testnet Explorer evidence. |
| 11 `@mai_thanhVN` | phone-black; logo | Task Receipt TX evidence remains **MISSING**. |
| 12 `@tokenmotive` | logo; phone-black | Three-party financing evidence remains **MISSING**. |
| 13 `@omnigemx` | package-page-1; logo | Session 2 mechanics screenshot remains MISSING. |
| 14 `@CryptoBeast_1` | phone-white; package-page-2 | Hide Private Space not importable as YouTube. |
| 15 `@cyhnft` | phone-black; logo | 1,264 entries Dashboard remains **MISSING**. |
| 16 `@CryptoSolutionG` | phone-black; logo | DApp video is not campaign/on-chain transparency evidence. |
| 17 `@sunrise_venture` | package-page-2; logo | Tutorial/AMA remains MISSING. |
| 18 `@CryptoAs_TW` | phone-black; package-page-1 | Campaign recap evidence remains MISSING; do not imply financing. |

## Wave 1 readiness

- General official image candidates exist for **18/18** KOLs, but external `public_url` import is not approved until URL protocol/host validation and idempotency are defined. Uploading the approved PNGs through the existing validated private-storage admin path is structurally compatible.
- YouTube oEmbed entries are **0/6 Portal-compatible** in the current renderer.
- Dedicated evidence remains missing for `@CryptoPanda_gl`, `@CapriShell`, `@mai_thanhVN`, `@tokenmotive`, and `@cyhnft` (plus the other narrower evidence gaps recorded in the mapping).
- **Do not start Wave 1 Staging asset import as currently mapped.** Resolve the URL injection issue first; then either omit YouTube rows or implement/review dedicated embed support and Download All handling.

