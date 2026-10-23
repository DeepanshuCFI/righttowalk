# Phase 1 set-up: the record behind righttowalk.life

**Status 23 Oct 2026, 23:00 IST:** steps 1 to 3 are done. Project `righttowalk` (ref `qeiqfkzugpipcvolvhjw`) exists, both SQL files ran, `src/config.js` carries the URL and anon key, `main` is deployed with the Phase 1 pages, the daily snapshot Action has run once, and the 23 probes pass against the live project. Still open: Deep's first moderator sign-in (the confirmation email from Supabase is in his inbox) and the first moderation pass, which also deletes the probes' test rows from the Test tab.

Everything in the code is built and tested against a local stand-in. Three things need Deep's hands, because they happen inside the Supabase dashboard and I never sign in there. About twenty minutes.

## 1. Create the project (Deep, dashboard)

1. Open https://supabase.com/dashboard, organisation **DeepanshuCFI's Org** (the Pro one that holds Infra Defect and cfi-people).
2. **New project**: name `righttowalk`, region **Mumbai (ap-south-1)**, generate a strong database password and keep it in the password manager. Nothing in this repo ever needs that password.
3. Cost: a second active project in the Pro org bills roughly $10 a month on top of the plan. The alternative, a schema inside the Infra Defect project, saves that but puts a public-write table next to production data; I recommend the separate project.

## 2. Run the schema (Deep, dashboard)

1. In the new project: **SQL Editor → New query**. Paste the whole of `sql/001_phase1.sql` and **Run**. It is idempotent; running it twice is harmless.
2. It creates: table `checks` (public may only insert pending rows, with consent), table `moderators` (seeded with deepanshu@crashfreeindia.org), views `public_checks`, `public_sector_stats`, `public_owner_stats` and function `public_stats()` (the only things the public can read), and the private bucket `photos` with the policies that let anonymous visitors upload into `pending/<id>/` only, let anyone read `published/<id>/` only, and let moderators move and delete.
3. **Authentication → URL configuration**: Site URL `https://righttowalk.life`; add redirect URLs `https://righttowalk.life/moderate.html` and `http://localhost:8815/moderate.html`.
4. **Authentication → Sign in / providers → Email**: keep it on, keep *Allow new users to sign up* on (a moderator's first magic link creates their user; access is decided by the `moderators` table, so a stranger who signs in sees nothing). Leave *Confirm email* on.
5. To add a moderator later: `insert into public.moderators (email) values ('name@crashfreeindia.org');` in the SQL editor. Lower-case addresses only.

## 3. Connect the site (Deep copies two values; I do the rest)

1. **Project settings → API**: copy the **Project URL** (`https://<ref>.supabase.co`) and the **anon public** key. Both are public by design; they go into the page that every visitor downloads. Never copy the `service_role` key anywhere.
2. Paste them into `src/config.js` (`url` and `anon`), or send them to me and I will.
3. Then I run `python3 build.py`, `python3 tools/probe.py` (23 outside-in checks: anonymous visitors cannot read, change or delete anything they should not), commit, and push to `main`. The site deploys itself in about a minute. The Content-Security-Policy on every page is rebuilt to allow exactly that one Supabase host and nothing else.
4. First moderation pass: open https://righttowalk.life/moderate.html, type your address, open the link from the email. The probe's test row (status `test`) can be deleted from the Test tab.
5. **GitHub → Actions**: enable workflows for the repo and run *Daily data snapshot* once by hand. From then on it writes `data/checks.csv`, `data/checks.json` and `data/stats.json` every night at about 03:00 IST, only when something changed. Gotcha: those commits land on `main`, so pull before pushing from a laptop.

## What the public can and cannot do after this

- Can: add a check (one insert, pending), upload its photos into its own pending folder, read published rows without names, read published photos, read the counts.
- Cannot: read pending or rejected rows, read anyone's name, read or list pending photos, publish, verify, edit or delete anything, see who the moderators are.
- Moderators (by email, after a magic link): read everything, publish / reject / mark test / verify, move photos from pending to published, delete test and rejected rows and their photos. Nothing else; column grants limit updates to status, verified, moderated_at, moderated_by and mod_note.

## Known limits, decided for now

- No rate limit on anonymous inserts or uploads beyond Supabase's own and the 3 MB / image-only bucket rules. If spam appears, the next step is Cloudflare Turnstile in front of the submit button (one afternoon). Moderation is the gate until then.
- Photos are resized to 1600 px and re-encoded on the phone before upload, which also strips camera metadata including any GPS tag.
- Map tiles come from the OpenStreetMap community servers (CARTO's free tiles now need an API key). Fine at this traffic; if the map gets popular, move to a paid tile plan or self-hosted tiles.
