# Security notes for righttowalk.life

Phase 1 was reviewed on 23 October 2026 with Crashfree India's app-security-review method. The live record accepts public submissions and photos, so it is tier T2. The v1.3 changes in `sql/003_evidence_integrity.sql` and this branch are **proposed only** until the migration is applied, the site is deployed and the live probes are repeated.

## What this is and what an attacker could gain

A static site on GitHub Pages sends consented submissions to a Supabase project. It stores location and answers, optional photos and first name, a browser-generated persistent client ID, and moderator decisions. Drafts remain in the visitor's browser until submission. A realistic adversary can submit false evidence, attempt to upload unwanted images, or bypass the UI to call the public API directly. A boundary failure could expose unpublished locations/photos or allow false records to appear public. The anon key is public; RLS, constrained database writes and private Storage policies are the real boundaries.

## Controls in the code

- `Content-Security-Policy` meta: `default-src 'none'`; scripts and styles only from this origin (inline allowed, since the page is generated); fonts self-hosted (`font-src 'self'`); `connect-src` permits the one configured Supabase host, and the map permits its tile host; `base-uri 'none'`, `form-action 'none'`, `object-src 'none'`.
- Fonts are self-hosted. Map tiles load from OpenStreetMap community servers, and submissions go to Supabase. Those providers can see a request's IP address and standard HTTP metadata; the application does not store IP addresses in the `checks` table.
- `referrer` policy `strict-origin-when-cross-origin`; outbound links carry `rel="noopener"`.
- Geolocation is requested only after a visitor taps the button. If the visitor submits with consent, the coordinates and reported GPS accuracy go to the private `checks` table; public coordinates are rounded to four decimals (about 10 m).
- Hash routing accepts only three fixed tokens; nothing from the URL is rendered.
- The public Supabase anon key is in the repository by design. No service-role key or database password is used by the site. The historical scan was on 23 October; it was not re-run for this branch.

## Settings that live outside the code

- GitHub Pages: custom domain `righttowalk.life` (CNAME file), **Enforce HTTPS on** (certificate issued 23 Oct 2026). GitHub sends HSTS on enforced custom domains.
- GitHub Pages cannot set `X-Frame-Options` or `X-Content-Type-Options`; the frame-buster covers the first, the second is accepted as low risk for a site that serves only its own HTML, SVG, PNG, JSON and WOFF2.
- DNS at GoDaddy (account: Deepanshu): four A records to GitHub Pages, `www` CNAME to `deepanshucfi.github.io`. Optional hardening not yet done: a CAA record limiting certificate issuance to Let's Encrypt (`0 issue "letsencrypt.org"`).
- GitHub account `DeepanshuCFI` owns the repo; every push to `main` deploys with no review gate. Keep 2FA on that account.

## Risks knowingly accepted

- Inline scripts and styles are allowed by the CSP because the site is a single generated file; the compensating control is that no external origin can load or receive anything.
- Drafts and saved checks remain in the visitor's browser until the visitor explicitly submits a record. They can be lost if the browser clears site data. Submitted records and photos live in Supabase under the consent and moderation flow.
- The page is public source; nothing in it is confidential.

## Phase 1: the record (tier T2)

### What is added
A Supabase project (DeepanshuCFI's Org) holds one table of citizen checks, one table of moderator emails, three public views, one stats function and one private storage bucket. The pages call it directly from the browser with the public anon key; there is no server of ours in between. Moderators sign in with a Supabase Auth magic link (implicit flow; the session lives in `sessionStorage` for the tab and renews with the refresh token). Map tiles are loaded from the OpenStreetMap community servers.

### Threats and controls
- **Reading what should not be public.** Row-level security is on for both tables; the anon role has no `select` grant on `checks` at all. The public reads only the views `public_checks`, `public_sector_stats`, `public_owner_stats` (owner-rights views that filter `status = 'published'` and omit `first_name`, `client_id`, `ua`, status and moderation columns) and the function `public_stats()`. Pending and rejected rows and their photos are invisible without a moderator JWT. Verified by `tools/probe.py` (23 outside-in checks) against the mock and, on 23 Oct 2026 at 22:55 IST, against the live project `qeiqfkzugpipcvolvhjw`: 23 of 23 pass. Supabase's default privileges had handed anon `select`/`update`/`delete` on new tables and `execute` on new functions (RLS still returned nothing); `sql/002_tighten_grants.sql` revokes them and changes the default privileges so later tables start closed.
- **Writing what should not be written.** Anon may insert only rows with `status in ('pending','test')`, `consent = true`, `verified = false`, `moderated_at is null`; check constraints bound locations, lengths, enumerations and JSON sizes. Under the proposed migration, a trigger clears client-supplied moderator fields and user agent, sets the initial photo count to zero, and re-derives score and band. Anon has no `update` or `delete` grant. Moderators (emails in `moderators`, checked by `is_moderator()` on the JWT email) may update status, verification link/time, actual photo count and moderator notes, and delete only test and rejected rows. Updates use `Prefer: return=representation`; an empty result is treated as failure.
- **Photos.** Private bucket, 3 MB per image. Under the proposed v1.3 policy, anon can upload only a re-encoded JPEG under a recent pending check UUID, with a 12-file count check. The client no longer falls back to the original image if re-encoding fails, avoiding a path that could retain EXIF/GPS. Moderators review and move photos, then set the public count to the number actually present. A failed move leaves an action that can be retried. The storage move and row update are not atomic.
- **Injection.** Every string from the record passes through `rtwEsc()` before `innerHTML` on the map, the report and the moderation page; the notice stays a textarea value.
- **CSP.** `connect-src 'self' https://<project>.supabase.co` is generated at build time from `src/config.js`; `img-src` adds the OSM tile host; nothing else changed. Leaflet is vendored (`vendor/leaflet`, 1.9.4) so no third-party script host is allowed.
- **Secrets.** The anon key is public by design and lives in `src/config.js`. The `service_role` key, the database password and the Supabase access token are never used by this site, its tools or its GitHub Action (the snapshot uses the anon key only). Nothing secret is in the repository.
- **Abuse.** Moderation is the publication gate. The proposed upload policy reduces orphan objects, but anonymous uploads cannot be tied cryptographically to a particular visitor, and concurrent uploads can race the count. There is no server-side per-IP rate limit or CAPTCHA. A signed upload service or edge function would be needed to enforce stronger limits. Do not treat a client-side Turnstile button alone as a boundary.
- **Derived evidence and verification.** The proposed insert trigger re-derives score and band, and separates quick spot passability from full 100 m continuity. A linked re-walk requires a later published check on the same side with a nearby start point. This proves a second record exists, not that the auditor was trained or that the item-level answers agree; moderators must still inspect and record disagreements.
- **Account hygiene.** Supabase project in DeepanshuCFI's Org with 2FA; moderators are whitelisted by email; magic links expire in an hour; sessions are per tab.

### Re-run this review when
A CAPTCHA, a server-side function, payments, exports of personal data, more than one Supabase project, or any third-party script is added; or before Phase 2 (owner layer, re-audit loop).

### v1.3 deployment checks still required

- Apply `sql/003_evidence_integrity.sql` in the reviewed Supabase project before shipping v1.3 pages. Inspect affected legacy quick and unlinked verified row counts first, then sample rows after migration. The migration is not applied by this branch.
- Re-run the read-only/denial probes in a throwaway Supabase project first. Check anon cannot read `checks`, set score/band/verified, upload to an absent or old check, upload non-JPEG files, or publish. Check a moderator can publish, retry an interrupted photo move, and link a later re-walk.
- Inspect the actual live policies and Storage object inventory in the dashboard. The local SQL file is not proof that the live project has those policies.
- Define and operate a retention/deletion schedule for rejected rows, pending rows and orphaned photos. The branch does not automate deletion of existing production data.
