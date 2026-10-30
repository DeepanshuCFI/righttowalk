# Right to Walk · Footpath Check

Right to Walk is Crashfree India's citizen footpath check for Gurugram. Residents can record one blocked or passable **spot**, or answer a fuller set of questions about one **stretch**. Moderated observations appear on a map, in a report and in open data. The project also explains the Court's right-to-walk decisions and offers a fictional footpath game for awareness.

The visual direction is **kerb and chalk**, using street materials and Khand/Mukta fonts. This citizen product follows its own audience-first design, with a one-line Crashfree India credit.

## Source and build

Edit `src/`, not the generated root HTML. `python3 build.py` produces `index.html`, `map.html`, `report.html`, `roads.html`, `law.html`, `game.html`, `dataset.html`, `moderate.html` and `artifact.html`. The build keeps fonts and Leaflet local and uses the public Supabase URL and anon key in `src/config.js`; that key is public by design. A local mock is available with `python3 tools/mock_backend.py` and `RTW_URL=http://127.0.0.1:8816 RTW_ANON=anon python3 build.py`. Never commit a mock build.

The app uses plain JavaScript and fetch. `src/app.js` runs the citizen check; `src/rtw.js` handles the Supabase request and photo encoding; `src/moderate.js` serves the moderator. `src/frame.js` matches observations approximately to the road list, and `src/map.js`, `src/roads.js`, `src/report.js`, `src/dataset.js` present public evidence. `src/learn.js` holds Hindi home/law copy; the public data pages have shorter Hindi summaries and labels. `src/game.js` is a fictional simulation and does not create evidence.

## Evidence definitions

- A **quick check** answers whether a walker can pass one spot without entering the road. Its field is `spot_passable`. It never counts as a 100 m result.
- A **full check** asks ten scored questions and a separate self-reported question: could the walker stay on the footpath for 100 m on one side? Its field is `gate`. The 100 m rule, weights and score bands are Right to Walk methods, **not Supreme Court thresholds**. The Court's duty and audit categories are separately cited in [the source ledger](docs/source-ledger.md).
- Start/end coordinates are optional. `length_m` is their straight-line separation, not walked distance. A missing or short separation stays unknown. No notice or report should substitute 500 m.
- An observation close to a road line is only an approximate nearby match. It does not establish the state or coverage of the entire road. Unvisited segments and opposite sides remain unobserved.
- A moderator can publish a citizen observation. “Verified re-walk” requires a separate later published check, linked by ID, on the same side and nearby. Historical unlinked verification marks are retained as `legacy_verified`, not counted as verified re-walks.
- The public sample is self-selected. Percentages describe submitted eligible checks, with numerator and denominator shown; they do not estimate Gurugram-wide prevalence.

The open data field guide is `src/dataset.html`; the exported files and timestamps are explained in [data/README.md](data/README.md). [Source ledger](docs/source-ledger.md) records legal/engineering claim boundaries. [Field pilot protocol](docs/field-pilot.md) describes the research needed before wider evidence claims; it has not yet been run.

## Backend and privacy

`sql/001_phase1.sql` defines the original tables, RLS, public views and private photo bucket; `sql/002_tighten_grants.sql` narrows grants. **`sql/003_evidence_integrity.sql` must be reviewed and applied before deploying this client**, because the client sends the new `spot_passable` column. It migrates legacy quick answers out of `gate`, changes public aggregates to full-only 100 m counts, derives full scores at the database boundary and requires linked re-walk provenance for new verification marks. It also restricts anonymous photo uploads to recent pending IDs and re-encoded JPEG paths. Apply it to a throwaway project and probe it before any production migration.

Citizen rows enter as `pending`; moderators publish or reject them. A published row exposes a rounded location and approved answers/photos. Optional name, exact supplied coordinates, GPS accuracy and a persistent browser identifier remain private; new submissions omit user agent. Photos are re-encoded on the device and fail closed if that step fails. See [SECURITY.md](SECURITY.md) and [PHASE1_SETUP.md](PHASE1_SETUP.md) for controls, dashboard dependencies and remaining risks. The site does not send agency notices on a user's behalf.

## Verification and release

Run `python3 build.py`, `python3 -m unittest discover -s tests -p 'test_*.py'`, `node --test tests/*.mjs`, `git diff --check`, and inspect the generated pages at mobile and desktop widths. The repository's `tools/probe.py` covers outside-in permissions; run only against a demo or throwaway backend for write probes. Check the live Supabase policies, data and Action history separately before claiming deployment is verified.

This site is served by GitHub Pages from `main`; pushing `main` deploys. Build on a feature branch, demonstrate the result, and merge or deploy only after Deep's explicit approval. For this release the order is: review and test SQL 003 in a throwaway project, apply it to the live database after approval, then deploy the generated v1.3 site. A new site against the old database will reject `spot_passable`.
