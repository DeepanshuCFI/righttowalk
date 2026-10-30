# Gurugram footpath record (open data, CC BY 4.0)

Daily snapshot of published citizen observations on https://righttowalk.life. A quick check describes one spot; a full check answers Right to Walk's 100 m continuity question and ten scored items. Neither mode establishes a whole-road verdict. Written by `tools/snapshot.py` through the GitHub Action in `.github/workflows/snapshot.yml` (about 03:00 IST).

- `checks.csv`: one row per published check, flat columns; formula-leading text is escaped for spreadsheet use.
- `checks.json`: the same rows with `answers` and `obs` as nested objects.
- `stats.json`: counts and by-sector/by-owner tables. `checked_at` is the last successful fetch; `data_changed_at` is the last change to the published rows.

`spot_passable` applies only to quick checks. `gate` applies only to full checks and answers the project's 100 m question. A legacy quick record's former `gate` answer is moved to `spot_passable` by `sql/003_evidence_integrity.sql`; it must never enter the 100 m denominator. `length_m`, when present, is straight-line separation between supplied start/end coordinates, not distance walked. `verified` now requires a later linked published re-walk; `legacy_verified` preserves an older unlinked moderation mark without claiming a verified re-walk.

Field guide, licence and citation: https://righttowalk.life/dataset.html. Names, contact details, device identifiers and exact coordinates are never in these files; public locations are rounded to about 10 m.
