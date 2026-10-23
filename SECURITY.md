# Security notes for righttowalk.life

Reviewed 23 October 2026 with Crashfree India's app-security-review method, tier T1 (public, read-only, no login, no server).

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

## Re-run this review when

A backend, map tiles, accounts, uploads to a server, analytics, or any third-party script is added. Each of those moves the site to tier T2.
