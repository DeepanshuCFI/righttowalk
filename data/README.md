# Gurugram footpath record (open data, CC BY 4.0)

Daily snapshot of every check a citizen walked and a moderator published on https://righttowalk.life. Written by `tools/snapshot.py` through the GitHub Action in `.github/workflows/snapshot.yml` (about 03:00 IST; only when the rows changed).

- `checks.csv`: one row per published check, flat columns.
- `checks.json`: the same rows with `answers` and `obs` as nested objects, plus the snapshot time.
- `stats.json`: headline counts, by-sector and by-owner tables.

Field guide, licence and citation: https://righttowalk.life/dataset.html. Names, contact details, device identifiers and exact coordinates are never in these files; locations are rounded to about 10 m.
