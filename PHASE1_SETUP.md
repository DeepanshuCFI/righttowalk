# Phase 1 set-up: the record behind righttowalk.life

**Historical status, 23 Oct 2026, 23:00 IST:** steps 1 to 3 were done. Project `righttowalk` existed, both original SQL files had run, and 23 probes passed against the live project that day. The moderator and snapshot status below is a dated record, not a current verification.

## Proposed v1.3 evidence migration (30 October 2026)

This branch is a demo. It does not apply SQL to Supabase or publish the pages. After Deep reviews the demo and authorizes a live rollout:

1. In the live dashboard, record counts of legacy quick checks with `gate` set, rows marked `verified`, and pending/published photos. Export a backup of the tables and Storage inventory through the normal project backup process. Do not copy private rows into the public repository.
2. Apply `sql/003_evidence_integrity.sql` **before** deploying the new pages. It moves legacy quick answers from `gate` to `spot_passable`, removes those rows from the 100 m denominator, and preserves old unlinked `verified` marks in `legacy_verified`. The insert trigger accepts the old quick payload during rollout, so there is no required submission outage.
3. Run the security probes in a throwaway project, then confirm live read-only/denial behavior. Sample migrated rows and compare published headline counts before and after. The headline may change because quick spot reports are correctly excluded.
4. Rebuild with `python3 build.py`, review generated pages, and deploy only after explicit approval. The snapshot Action should then run once. It now refreshes `stats.json` with `checked_at` on every successful run while `data_changed_at` moves only when published rows change; daily metadata commits are expected.
5. In the moderator page, publish a re-walk as a separate check before linking its full UUID to an original. Both records must be published, have coordinates on the same side, and begin within 150 m. A moderator still reviews item-level differences and records them in a private note.

The new Storage policy accepts only JPEGs produced by the client re-encoder, under a recent pending check ID, up to 12 per check. It is a partial abuse limit because anonymous upload requests are not tied to a visitor and concurrent uploads can race the count. Define a retention process for abandoned pending rows and photos before claiming those files are automatically removed.

The site builds and focused local checks pass. SQL 003 and its Storage policies have not been executed against a throwaway Supabase project or the live database. The sections below document the original Phase 1 setup; use the v1.3 migration order above for this branch.

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
5. **GitHub → Actions**: enable workflows for the repo and run *Daily data snapshot* once by hand. Under the proposed v1.3 script, it refreshes `data/stats.json` with a last-checked time every successful night at about 03:00 IST; `checks.csv` and `checks.json` change only when published rows change. Those commits land on `main`, so pull before pushing from a laptop.

## What the public can and cannot do after this

- Can: add a check (one insert, pending), upload re-encoded JPEG photos into a recent pending check folder, read published rows without names, read published photos, read the counts.
- Cannot: read pending or rejected rows, read anyone's name, read or list pending photos, publish, verify, edit or delete anything, see who the moderators are.
- Moderators (by email, after a magic link): read submissions, publish / reject / mark test, link a later re-walk for verification, move photos from pending to published, and delete test and rejected rows and their photos. Column grants also allow the actual photo count and verification link/time to be updated.

## Known limits, decided for now

- No server-side rate limit on anonymous row inserts. The proposed photo policy ties uploads to a recent pending UUID and checks a 12-image cap, but it cannot authenticate anonymous ownership or make concurrent count checks atomic. A signed server upload path is the next control if abuse appears. Moderation remains the publication gate.
- Photos are resized to 1600 px and re-encoded as JPEG on the phone before upload. If re-encoding fails, the photo is not uploaded; the original file is never used as fallback.
- Map tiles come from the OpenStreetMap community servers (CARTO's free tiles now need an API key). Fine at this traffic; if the map gets popular, move to a paid tile plan or self-hosted tiles.
