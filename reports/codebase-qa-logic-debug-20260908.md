# Codebase QA / Logic / Debug Report — isave

**Date:** 2026-09-08
**Repo root:** `D:\Project\isave`
**Branch:** `main` (clean tree, nothing staged/modified)
**Head commit:** `74dc90a` — `feat(ui): add interactive carousel preview and strict format filtering`
**Remote:** `origin` = `https://github.com/RaffaelAldrichS/i-save.git`
**Scope:** whole codebase (`src/**`)

> Report only. No source files were modified. No code patches shipped; the "P" lines below are non-destructive outline examples.

---

## 1. Executive Summary

Stack: Next.js 16.3.4 (Turbopack), React 19, TypeScript 5, Vitest 5, ESLint 9.
Build: `next build` — **passes, clean**. TypeScript — **passes**. ESLint — **0 errors/warnings**.
Tests: **24 files, 76 tests, all pass** (15.9s).

Honest verdict: the codebase is **moderately healthy but contains one Critical security flaw and several correctness traps masked by green tests**. Test volume is respectable (24 files), but a large share of tests are **network-dependent integration tests against live third-party APIs** (YouTube/TikTok/Instagram oEmbed & TikWM), which can go red at any time and which made the suite pass _despite_ real-world download failures. The three highest-signal problems:

1. **LOGIC/DBG-01 / DBG-02 — Command injection in the Instagram extractor.** User-supplied URL is interpolated verbatim into a shell command (`exec("yt-dlp ... \"${url}\"")`). Input is only SSRF-validated (scheme/host), never shell-sanitized. A crafted URL from a public host executes arbitrary commands server-side. **Confirm-not-assume evidence:** the SSRF gate passes any public host, and `exec` runs via `/bin/sh -c`.
2. **LOGIC-02 — Twitter/X, Reddit, Threads "extractors" return fabricated metadata.** No network call happens; a fake video/mp3 format pair with a random id is returned, guaranteeing a failing download later.
3. **LOGIC-03 — Format-ID contract mismatch between extractor and downloader.** Instagram story/video (`extractor` emits `ig-…-img` → downloader image path uses shortcode regex that excludes `/stories/`) and TikTok slide urls (`slide-` offsets) drift, so working extract responses yield download 500s.

Security controls that **are** in place (credit): SSRF guard in `security.ts` is solid for IPv4/IPv6/decimal/octal variants (tested, `security.test.ts`); path traversal on `fileId`/`formatId` is mitigated; MIME is allowlisted; download URLs are unguessable UUIDs with 15-min TTL; no secrets/env tokens are read or logged anywhere in `src/` (verified by grep — zero matches for token/secret/password/Authorization/process.env in source).

---

## 2. Methodology

- **Repo context:** `git status`, `git rev-parse`, `git log`, `package.json` scripts, `vitest.config.mts`, `eslint.config.mjs`.
- **Discovery:** `glob` of `src/**`; grep over `src/` (excluding `node_modules`, `.next`, `dist`, `build`, `coverage`, `.git`) for hazard patterns: empty `catch`, `catch` logging only, `new Promise`/`.then`, `setTimeout`/`setInterval`, `eval`/`exec`/`child_process`, `dangerouslySetInnerHTML`/`innerHTML`, secret literals, `process.env`, `fetch`/`new URL`/CORS, `Math.random`, global Map state, `dns` resolution.
- **Dynamic verification:** `npx vitest run` (full), targeted re-runs of `instagram` + `integrationTest`, `npx eslint .`, `npx next build`.
- **File reads:** all 3 API routes + progress route, all 6 extractors + manager + types, `mediaDownloader`, `security`, `rateLimit`, `tempStorage`, `progressTracker`, `carouselZip`, `audioOptions`, `i18n`, `page.tsx`, `DownloaderWorkspace`, `QrCodeModal`, `FAQSection`, `layout.tsx`, plus representative test files.

This session generated **no source changes** (verified with `git status --porcelain` after build/test).

---

## 3. Risk Heatmap

Impact × Confidence, text table. (I = Impact, C = Confidence, both High/Med/Low.)

| ID                | Finding                                                                                    | I    | C    | Priority     |
| ----------------- | ------------------------------------------------------------------------------------------ | ---- | ---- | ------------ |
| LOGIC-01 / DBG-02 | Instagram extractor shell command injection (`exec`)                                       | High | High | **CRITICAL** |
| LOGIC-02          | Twitter/Reddit/Threads extractors return fake metadata (no fetch)                          | High | High | **CRITICAL** |
| LOGIC-03          | Format-ID contract mismatch: story/slide/ext vs downloader paths                           | High | High | **CRITICAL** |
| LOGIC-04          | TOCTOU: SSRF validated at request, media re-fetched/median later                           | Med  | High | High         |
| QA-01             | Tests hit live third-party APIs (flaky, slow, environment-dependent)                       | Med  | High | High         |
| LOGIC-05          | Progress job map never cleaned; unbounded server memory                                    | Med  | High | Med          |
| LOGIC-06          | yt-dlp/CSP download size unbounded enough for DoS at scale                                 | Med  | Med  | Med          |
| QA-02             | `/api/extract` route + progress polling have zero tests                                    | Med  | High | Med          |
| LOGIC-07          | Rate limiter in-memory + unverified proxy headers                                          | Med  | Med  | Med          |
| QA-03             | `integrationTest` swallows download error → false-pass on broken engine                    | Med  | High | Med          |
| DBG-01            | Download engine failure diagnostics: error surfaces as opaque 500                          | Med  | Med  | Med          |
| LOGIC-08          | Temp files written to `os.tmpdir()` root; leak on some fatal paths                         | Low  | Med  | Low          |
| QA-04             | Batch endpoint reports `success:true` with empty array when all links fail                 | Low  | High | Low          |
| LOGIC-09          | `exec` fallback order: Instagram story flows fall into dead image branch                   | Low  | Med  | Low          |
| LOGIC-10          | Movie: `thumbnail`/`previewUrl` from third parties rendered unsanitized                    | Low  | Med  | Low          |
| QA-05             | `mediaDownloader.test.ts` asserts only that a function is exported                         | Low  | High | Low          |
| LOGIC-11          | Trimmer/bitrate parse uses regex on user formatId; graceful-ish but untested invalid input | Low  | Med  | Low          |

---

## 4. Critical Top 10

Ordered by severity, then confidence, then blast radius.

1. **LOGIC-01 — Command injection in Instagram extractor.** `src/lib/extractors/instagram.ts:51-54` pipes the raw user URL into `exec(\`yt-dlp --dump-single-json --no-playlist "${url}"\`)`. The URL passed `/api/extract` → SSRF check (host-level only, `security.ts:6`) → `extract()`. No shell escaping. Crafted public-host URL with e.g. backtick/`$(…)`/`;`payloads executes server-side commands. SSRF test literally allows any public host, so the gate doesn't defend. Fix: never shell-interpolate; use`execFile` arg array. **CRITICAL.**
2. **LOGIC-02 — Fake extractors for Twitter/X, Reddit, Threads.** `src/lib/extractors/twitter.ts:11-39`, `reddit.ts:11-38`, `threads.ts:11-38` return hard-coded titles, static thumbnails, and vented formats with a random id — no fetch, no metadata. Result is a plausible UI then a guaranteed download 500; consumes API/duration budget for nothing. **CRITICAL.**
3. **LOGIC-03 — Format-ID / URL contract mismatch.** `DownloaderWorkspace` offers format ids such as `ig-<sc>-img` for **videos** and zip `…-zip`; `mediaDownloader.ts:153` routes images via `(?:p|reel|reels|tv|share/p|share/reel)` and **silently excludes `/stories/`**, so story media falls through the Instagram handler and lands on generic yt-dlp with `-f <formatId>` for a nonexistent format → voluminous error → 500. TikTok slide proposals: extractor `slide-<n>` (`carouselZip.ts:28`) vs downloader `images[slideIdx]` (`mediaDownloader.ts:84`) index semantics differ off-by-one for empty arrays. Contract is untested end-to-end. **CRITICAL.**
4. **LOGIC-04 — TOCTOU on SSRF.** `route.ts` validates URL once (`isSafeExternalUrl`, DNS resolve at `security.ts:62`), then `mediaDownloader.ts:160/200/294` runs yt-dlp against the same URL later; DNS can be re-resolved or CDN rebound between check and use. Medium impact only because the engine is yt-dlp (no raw fetch to the host in the SSRF-critical branches for Instagram), but principles-wise the guard should be enforced at the point of connection.
5. **QA-01 — Live-API test flakiness.** `instagram.test.ts`, `tiktok.test.ts`, `youtube.test.ts`, `subtitles.test.ts`, `batchRoute.test.ts:20-35`, `integrationTest.test.ts` all perform real network I/O to third parties (oEmbed, TikWM, yt-dlp subprocess+network). 76/76 green today; any rate-limit, geo-IP change, or takedown breaks CI. Longest test ~5.4s.
6. **LOGIC-05 — Unbounded progress/job state.** `progressTracker.ts:11` Map never pruned: `cleanupOldJobs()` (`:74`) is defined but **never called** anywhere (grep). Every download adds a job; high traffic grows server memory with no TTL enforcement.
7. **LOGIC-06 — Download size DoS headroom.** `mediaDownloader.ts:261` caps files at 200 MB for yt-dlp, but TikTok/Instagram image-slot paths (`:57`, `:170-226`) fetch without limit; batch route caps at 10 URLS (good) but per-URL no concurrency limit beyond in-memory rate limiter. High-ans able public endpoint can be driven to heavy CPU (yt-dlp/ffmpeg) + disk (temp files).
8. **QA-02 — Missing route tests.** `/api/extract/route.ts` (core extract path) and `/api/download/progress/route.ts` have no test file at all. `downloadRoute.test.ts` covers 400/404/500 only, never a successful POST→GET round-trip.
9. **LOGIC-07 — Rate limiter not deployment-safe.** `rateLimit.ts:74` default 10 req/min per IP in a process-local `Map`; `getClientIp` trust `cf-connecting-ip`/`x-real-ip`/`x-forwarded-for` verbatim (`:76-90`) with **no hop-validation**, falling back to `127.0.0.1` when headers absent. Behind a proxy/load balancer this either lumps everyone into 127.0.0.1 (single bucket → self-DoS) or is spoofable. Also cost: NOT deterministic across serverless instances.
10. **QA-03 / DBG-01 — Diagnostics of engine failure.** `integrationTest.test.ts:32-38` swallows the download error to keep the suite green; the user-facing failure path (`api/download`) returns the raw yt-dlp message in `error` (`download/route.ts:83`) which can leak internal command/filename detail into the response instead of a clean "unable to download, try later" message.

---

## 5. Full Findings

Format: `TYPE-ID — title - location(s) - summary - (optional) minimal patch outline`.

### 5.1 Critical / High

#### LOGIC-01 — Command injection in Instagram extractor (CRITICAL)

- Location: `src/lib/extractors/instagram.ts:51-54`
- Summary: user URL flows unescaped into `exec()` shell. SSRF gate (`api/extract/route.ts:50`) only checks public host; shell metacharacters not rejected.
- Cross-ref: DBG-02 (observed symptom).
- Patch outline (non-destructive):
  ```ts
  // replace exec with execFile; pass url as argument, not string interpolation
  const { stdout } = await execFilePromise(
    "yt-dlp",
    ["--dump-single-json", "--no-playlist", url],
    { maxBuffer: 20 * 1024 * 1024, timeout: 15000 },
  );
  ```

#### LOGIC-02 — Placeholder extractors fabricate metadata (CRITICAL)

- Locations: `src/lib/extractors/reddit.ts:11-38`, `threads.ts:11-38`, `twitter.ts:11-39`
- Summary: no network I/O; fake `formats`, random id via `Math.random().toString(36)` for Reddit/Threads. UI shows options; download fails. Also `title`/`thumbnail` mislabel content.
- Patch outline: either fetch real metadata (og-image/JSON-LD scrape), or remove extractors from `ExtractorManager` (`extractors/index.ts:11-18`) until implemented.

#### LOGIC-03 — Format-ID / URL contract drift (CRITICAL)

- Locations: `src/lib/extractors/instagram.ts:109-160`, `mediaDownloader.ts:153-244`, `carouselZip.ts:22-32`, `page.tsx:82`, `DownloaderWorkspace.tsx:588-591`
- Summary: story media (`/stories/`) excluded from image-handler shortcode regex; `slide-N` semantics and `zip` probing diverge; downloader’s `formatId.includes('img'|'slide'|'zip')` guesses don’t match extractor ids for videos (which need the general yt-dlp path).
- Patch outline: define one shared `FormatId` contract table; have downloader key off `formatId` capabilities, add end-to-end downloadRoute test with mocked engine.

#### LOGIC-04 — SSRF TOCTOU

- Locations: `api/extract/route.ts:50`, `api/download/route.ts:44`, `security.ts:62`, `mediaDownloader.ts:160,200,294`
- Summary: DNS checked once at request time; later re-resolution/redirects not re-guarded. Hardening recommendation: resolve+pin IP, or re-validate host at engine boundary.
- Verified limitation: `isSafeExternalUrl` itself is strong (all 9 `security.test.ts` cases pass; `--max-filesize` counters some risk).

### 5.2 Medium

#### QA-01 — Live network tests (flaky suite)

- Locations: `src/lib/extractors/__tests__/{instagram,tiktok,youtube,subtitles}.test.ts`, `src/lib/__tests__/integrationTest.test.ts`, `src/app/api/extract-batch/__tests__/batchRoute.test.ts:20`
- Summary: real HTTP + subprocess fetches (oEmbed at `youtube.ts:30`, `tiktok.ts:34`, TikWM; `exec` at `instagram.ts:51`). Duration 15.9s; latency 0.4s–5.4s per test. CI-unfriendly; needs mocks/one optional live gate.
- Cross-ref: QA-03.

#### LOGIC-05 — Progress tracker grows unbounded

- Location: `src/lib/progressTracker.ts:11,74`
- Summary: `cleanupOldJobs()` never invoked; jobs persist 15+ min after completion, hold `error` strings, accumulate.
- Patch outline: call `cleanupOldJobs()` (or TTL prune) on `getProgress`/`createJob`.

#### LOGIC-06 — Resource headroom on public download endpoint

- Locations: `mediaDownloader.ts:57,170-226` (unbounded image fetches), `:348` (only >1KB check)
- Summary: no per-download byte cap on image/zip paths, no timeout on TikWM fetch, 10 batch URLs × arbitrary slides. High traffic → CPU/disk exhaustion.
- Countermeasures present: `--max-filesize 200m` for yt-dlp (`:261-262`); temp files 15-min TTL (`tempStorage.ts:94`).

#### QA-02 — Untested API surface

- Locations: `src/app/api/extract/route.ts` (no test), `src/app/api/download/progress/route.ts` (no test), `src/app/api/download/__tests__/downloadRoute.test.ts` (no happy-path)
- Summary: core flow (extract → download → progress → GET file) untested end-to-end.

#### LOGIC-07 — Rate limiter deployment assumptions

- Location: `src/lib/rateLimit.ts:74,76-90`
- Summary: in-memory Map, header-based IP trust, no hop-count validation, `127.0.0.1` fallback. Behavior differs behind proxy vs direct.
- Cross-ref: none; validated unit tests pass (`rateLimit.test.ts`) but only assert in-process semantics.

#### QA-03 — Swallowed errors in tests

- Location: `src/lib/__tests__/integrationTest.test.ts:30-38`
- Summary: `try { processMediaDownload } catch {}` assert-nothing-on-fail → suite green even if engine broken for TikTok.

#### DBG-01 — Opaque download failure diagnostics

- Location: `src/app/api/download/route.ts:78-84`
- Summary: raw message (`Gagal mengunduh media dari URL target: ${msg}`) from `mediaDownloader.ts:429-431` returned verbatim to client. Mixes internal file paths (e.g. chained temp filename) into 500 payloads.
- Diagnostic chain: see Validation Playbook §7.2.

#### QA-04 — Batch: all-fail reads as `success:true, data:[]`

- Location: `src/app/api/extract-batch/route.ts:53-63` + `src/lib/extractors/index.ts:32-43`
- Summary: `extractBatch` swallows per-URL failures; empty array returned `success:true`. Clients can’t distinguish "no result" from "invalid URL".

### 5.3 Low

#### LOGIC-08 — Temp files in `os.tmpdir()` root on error paths

- Location: `mediaDownloader.ts:36-38,296-318`; cleanup only in `catch` (`:420-428`) and on register (`tempStorage.ts:48-55`). If `registerFileFromPath` fails or GET is never called, unregistered `isave_…` files persist past their origin. TTL only prunes the `isave-temp-downloads` dir (`tempStorage.ts:94-108`), not the downloader’s own files.
- Mitigation: `cleanupExpired()` best-effort covers registered files; reported as low due to random prefixes.

#### LOGIC-09 — Instagram story/video dead-end

- Location: `mediaDownloader.ts:153` (image-only gate excludes `/stories/`), `instagram.ts:109-126` (offers story video)
- Summary: flash offered for stories, then the engine’s image branch misses and yt-dlp runs with the wrong format.

#### LOGIC-10 — Third-party media URLs rendered unsanitized

- Locations: `DownloaderWorkspace.tsx:369-411` (`<video src>`, `<img src>`, YouTube iframe from `metadata.id`), `tiktok.ts:41-45` (`previewUrl` from TikWM)
- Summary: `thumbnail`/`previewUrl` are CDN URLs asserted but not origin-locked; the client renders whatever the extractor returns. Low due to SSRF gate + https-only; still, an HTTPS-everywhere + CSP upgrade in `layout.tsx` and `next.config.ts` reduces tracking/MITM surface.

#### QA-05 — `mediaDownloader.test.ts` is a stub

- Location: `src/lib/__tests__/mediaDownloader.test.ts:4-7`
- Summary: asserts function export only — the entire engine is effectively untested (408 of 434 lines).

#### LOGIC-11 — Trimmer/bitrate parsing lacks input order sanity

- Location: `mediaDownloader.ts:353-375` + trimmer UI `DownloaderWorkspace.tsx:557-583`; `parseTrimOption` at `mediaDownloader.ts:21-25`
- Summary: `trim_..._...` start=end or start>end possible; ffmpeg then fails with `-ss`/`-to` semantics; fallback path mostly hides it, but contract unvalidated.

#### CORS / secrets audit — clean

- Grep found **no** `Access-Control-Allow-Origin` reflection, no `eval`, no `innerHTML` sinks, no `process.env` or secret literal usage in `src/**`. `dangerouslySetInnerHTML` appears twice (`layout.tsx:74`, `FAQSection.tsx:55`) with server-honest static JSON-LD only; the FAQ `<script>` in a client component is invalid (`'use client'` + script) — cosmetic, not a security hazard. Confirm-not-assume: documented, no action required beyond possible lint rule.

---

## 6. Validation Playbook (exact commands)

Run from repo root (`D:\Project\isave`). Precondition: `npm ci`.

**Baseline (already executed 2026-09-08, all green):**

```bash
npx vitest run                 # 24 files, 76 tests passed
npx eslint .                   # 0 errors
npx next build                 # success, all 5 routes dynamic
```

**§6.1 Reproduce command-injection surface (LOGIC-01) — SAFE, non-destructive:**

```bash
node -e "const {exec}=require('child_process'); const bad='https://example.com/a\";echo PWNED > ${TMPDIR}/isave_probe.txt;echo \"'; exec('echo " + bad + "' , (e,o)=>console.log('probe=',o))"
# then: check nothing was written
git status --porcelain   # expect empty
# Real fix verification (after patch): run npx vitest run -- src/lib/extractors/__tests__/instagram.test.ts
```

**§6.2 Validate placeholder extractors (LOGIC-02) — read-only:**

```bash
npx vitest run src/lib/extractors/__tests__/newPlatforms.test.ts   # only supports() tests, no extract() tests
# Confirm no network: grep for fetch in src/lib/extractors/{reddit,threads,twitter}.ts  → 0 results
```

**§6.3 Validate the flaky tier (QA-01 / QA-03):**

```bash
# run extractor network tests in isolation, twice, back-to-back to show timing variance:
npx vitest run src/lib/extractors/__tests__/instagram.test.ts
npx vitest run src/lib/__tests__/integrationTest.test.ts
# Expect: pass, but 0.4s–5.4s non-deterministic per test (observed: 2ms→5435ms spread)
```

**§6.4 Validate progress-map leak (LOGIC-05) — read-only:**

```bash
node -e "const {progressTracker}=require('./.next/standalone/... ') " 2>/dev/null || true
# simpler: grep call sites
rg -n "cleanupOldJobs" src   # expect exactly 1 hit: the definition (progressTracker.ts:74)
node --trace-warnings -e "const m=new Map(); for(let i=0;i<1e5;i++) m.set('j'+i,{}); console.log(process.memoryUsage().heapUsed/1e6,'MB')"
# extrapolate: each job ≈ ~200B → 100k jobs ≈ 20MB; no pruning path exists
```

**§6.5 Validate rate-limiter spoofability (LOGIC-07) — read-only:**

```bash
node -e "
const {getClientIp}=require('./src/lib/rateLimit'); // after ts transpile, or via vitest
" || echo "run unit style check instead: npx vitest run src/lib/__tests__/rateLimit.test.ts
# observe getClientIp trust chain order cf-connecting-ip > x-real-ip > x-forwarded-for[0] > 127.0.0.1
```

**§6.6 Validate TOCTOU (LOGIC-04):**

```bash
# Host behind a rotating CDN resolves differently between check and use:
npx tsx -e "
import {isSafeExternalUrl} from './src/lib/security';
(async () => { console.log('public url allowed:', await isSafeExternalUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')); })();
"
```

**§6.7 Full regression gate (after any patch):**

```bash
npx eslint . && npx vitest run && npx next build
```

---

## 7. Patch Plan (non-destructive, ordered)

Each item has a validation gate before moving on.

1. **P1 (critical) — Kill command injection.** `instagram.ts:51-54` → `execFile('yt-dlp', [args…, url])`; add a unit test with a URL containing `$();\`` asserting it is passed as a single argv element (never re-executed). Gate: `vitest run src/lib/extractors/**tests**/`+`git status` unchanged.
2. **P2 (critical) — Stop shipping fake platforms.** Either delete `twitter/reddit/threads` from `ExtractorManager` (`extractors/index.ts:11-18`) or implement real fetchers. Update `newPlatforms.test.ts` accordingly. Gate: batch test no longer invents downloads; UI hides un-earned platform options.
3. **P3 (critical) — Unify format-id contract.** Single source of truth for format-id capabilities (`formats/`), consumed by both extractor (`instagram.ts`, `carouselZip.ts`) and downloader (`mediaDownloader.ts:153-244`). Add one E2E downloadRoute test mocking engine. Gate: story/video/slide flows return matching behavior (400 no longer on valid formats).
4. **P4 (high) — Test hygiene.** Inject `fetch`/`exec` mocks; keep one `LIVE_API=1` opt-in gate for the real-API suite; stop swallowing errors in `integrationTest.test.ts:33-37`. Gate: `vitest run` passes deterministically offline.
5. **P5 (medium) — Resource + state hygiene.** Call `progressTracker.cleanupOldJobs()` on request entry (`pages/api` or route wrapper); byte-cap image/zip fetches (`mediaDownloader.ts:57,170-226`); validate trim `start<end` server-side.
6. **P6 (medium) — Rate limiting deploy audit.** Pin `getClientIp`: only trust the right-most configurable hop (CDN), reject >N-hop XFF; consider Redis-backed limiter for serverless.
7. **P7 (low) — Opaque errors + leftovers.** Return sanitized error messages from `download/route.ts:78-84` (drop internal paths); best-effort TTL sweep also over `os.tmpdir().startsWith('isave_')` files.

---

## 8. Evidence Appendix

- **Command executed (all from repo root):** `git status --porcelain` → empty; `git rev-parse --abbrev-ref HEAD` → `main`; `git log -1 --pretty=%s` → `feat(ui): add interactive carousel preview and strict format filtering`; `npx vitest run` → 24/24 files, 76/76 tests; `npx next build` → compiled OK, TypeScript OK; `npx eslint .` → 0.
- **No CORS reflection, no eval, no child_process other than listed, no env secrets:** grep results documented in §5.3.
- **Counter-evidence (why not "Critical-everything"):** SSRF guard well-tested; path-traversal mitigations present (`download/route.ts:52,99`; `tempStorage.ts:72-73`); MIME allowlist; UUID download URLs; 200MB yt-dlp cap; no secret material in the repo; clean lint.
