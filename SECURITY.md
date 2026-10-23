# Security notes for righttowalk.life

Reviewed 23 October 2026 with Crashfree India's app-security-review method. Phase 0 (the check itself) is tier T1: public, read-only, no login, no server. Phase 1 (the record: submissions, photos, map, report, moderation) moves the site to tier T2; its controls are in the second half of this file. Phase 1 is inert until `src/config.js` carries a project URL; until then every page behaves as in Phase 0.

## What this is and what an attacker could gain

A static site on GitHub Pages. There is no backend, no database, no account, no cookie and no analytics. Everything a visitor types, taps or photographs stays in their own browser (`localStorage` for drafts and saved checks; photos are object URLs that vanish on reload) until they copy the notice or the record out themselves. The realistic adversaries are: someone who serves a tampered copy of the page (mitigated by HTTPS and a strict content security policy), someone who tries to inject script through a field that is rendered back into the page (every user string passes through `esc()` before `innerHTML`; the notice is set as a textarea value), and someone who embeds the site in a frame to mislead (a frame-buster unloads the page). Blast radius if all of that failed: one visitor's own draft on their own device.

## Controls in the code

- `Content-Security-Policy` meta: `default-src 'none'`; scripts and styles only from this origin (inline allowed, since the page is one file); fonts self-hosted (`font-src 'self'`); images from this origin, `data:` and `blob:` only; `connect-src 'none'` so the page cannot call out anywhere; `base-uri 'none'`, `form-action 'none'`, `object-src 'none'`.
- No third-party requests at all: fonts (Khand, Mukta) are served from `/fonts/`, downloaded once from Google Fonts. Visitors' IP addresses are not shared with Google or anyone else.
- `referrer` policy `strict-origin-when-cross-origin`; outbound links carry `rel="noopener"`.
- Geolocation is requested only when the visitor taps the button, read once, rounded to four decimals (about 10 m) and never transmitted.
- Hash routing accepts only three fixed tokens; nothing from the URL is rendered.
- No secrets exist in the repository or its history (scanned 23 Oct 2026). The repo holds only the page source and build script.

## Settings that live outside the code

- GitHub Pages: custom domain `righttowalk.life` (CNAME file), **Enforce HTTPS on** (certificate issued 23 Oct 2026). GitHub sends HSTS on enforced custom domains.
- GitHub Pages cannot set `X-Frame-Options` or `X-Content-Type-Options`; the frame-buster covers the first, the second is accepted as low risk for a site that serves only its own HTML, SVG, PNG, JSON and WOFF2.
- DNS at GoDaddy (account: Deepanshu): four A records to GitHub Pages, `www` CNAME to `deepanshucfi.github.io`. Optional hardening not yet done: a CAA record limiting certificate issuance to Let's Encrypt (`0 issue "letsencrypt.org"`).
- GitHub account `DeepanshuCFI` owns the repo; every push to `main` deploys with no review gate. Keep 2FA on that account.

## Risks knowingly accepted

- Inline scripts and styles are allowed by the CSP because the site is a single generated file; the compensating control is that no external origin can load or receive anything.
- Saved checks live only in the visitor's browser and are lost if the browser clears site data. This is deliberate for the prototype (no server, no personal data held by us).
- The page is public source; nothing in it is confidential.

## Phase 1: the record (tier T2)

### What is added
A Supabase project (DeepanshuCFI's Org) holds one table of citizen checks, one table of moderator emails, three public views, one stats function and one private storage bucket. The pages call it directly from the browser with the public anon key; there is no server of ours in between. Moderators sign in with a Supabase Auth magic link (implicit flow; the session lives in `sessionStorage` for the tab and renews with the refresh token). Map tiles are loaded from the OpenStreetMap community servers.

### Threats and controls
- **Reading what should not be public.** Row-level security is on for both tables; the anon role has no `select` grant on `checks` at all. The public reads only the views `public_checks`, `public_sector_stats`, `public_owner_stats` (owner-rights views that filter `status = 'published'` and omit `first_name`, `client_id`, `ua`, status and moderation columns) and the function `public_stats()`. Pending and rejected rows and their photos are invisible without a moderator JWT. Verified by `tools/probe.py` (23 outside-in checks) against the mock and, on 23 Oct 2026 at 22:55 IST, against the live project `qeiqfkzugpipcvolvhjw`: 23 of 23 pass. Supabase's default privileges had handed anon `select`/`update`/`delete` on new tables and `execute` on new functions (RLS still returned nothing); `sql/002_tighten_grants.sql` revokes them and changes the default privileges so later tables start closed.
- **Writing what should not be written.** Anon may insert only rows with `status in ('pending','test')`, `consent = true`, `verified = false`, `moderated_at is null`; check constraints bound every column (India bounding box, lengths, enumerations, JSON sizes). Anon has no `update` or `delete` grant. Moderators (emails in `moderators`, checked by `is_moderator()` on the JWT email) may update only five columns and delete only test and rejected rows. Updates are sent with `Prefer: return=representation` and an empty result is treated as failure, so a non-moderator cannot be fooled into thinking an action worked.
- **Photos.** Private bucket, 3 MB, image MIME types only. Anon may upload only under `pending/`; anyone may read only under `published/`; moderators move a check's photos from `pending/<id>/` to `published/<id>/` when they publish, and delete on reject. Paths are UUID-based. Photos are resized and re-encoded on the phone (`rtwShrink`) before upload, which strips EXIF including GPS.
- **Injection.** Every string from the record passes through `rtwEsc()` before `innerHTML` on the map, the report and the moderation page; the notice stays a textarea value.
- **CSP.** `connect-src 'self' https://<project>.supabase.co` is generated at build time from `src/config.js`; `img-src` adds the OSM tile host; nothing else changed. Leaflet is vendored (`vendor/leaflet`, 1.9.4) so no third-party script host is allowed.
- **Secrets.** The anon key is public by design and lives in `src/config.js`. The `service_role` key, the database password and the Supabase access token are never used by this site, its tools or its GitHub Action (the snapshot uses the anon key only). Nothing secret is in the repository.
- **Abuse.** No CAPTCHA yet; moderation is the gate, and nothing is public until a moderator acts. If spam appears: Cloudflare Turnstile in front of the submit button, and a Postgres rate-limit trigger on `client_id`.
- **Account hygiene.** Supabase project in DeepanshuCFI's Org with 2FA; moderators are whitelisted by email; magic links expire in an hour; sessions are per tab.

### Re-run this review when
A CAPTCHA, a server-side function, payments, exports of personal data, more than one Supabase project, or any third-party script is added; or before Phase 2 (owner layer, re-audit loop).
