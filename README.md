# Footpath Check (Phase 0 prototype)

Crashfree India's citizen "right to walk" street check. One stretch of road, eleven plain questions, the stretch drawn live as you answer, a result in the Supreme Court's own audit vocabulary, and a notice to the owning agency.

Design direction "kerb and chalk": the street's own materials (concrete pavers, black-and-yellow kerb paint, tactile yellow, chalk marks, the pedestrian signal). Khand + Mukta, both Latin and Devanagari. Deliberately not the Crashfree India design system (Deep, 23 Oct 2026: citizen and crowdsourcing products match their audience).

## Files
- `src/head.html` metas, title, font link
- `src/style.css` tokens (light and dark) and components
- `src/body.html` markup for the learn, check and saved views
- `src/data.js` strings (EN/HI), the eleven items with Court heading, IRC standard and ask text, the Gurugram owner list
- `src/obs.js` the footpath problem types and their SVG glyphs, reconciled on 23 Oct 2026 against `research_notes/Right to walk auditor India/footpath_problem_taxonomy.md` (21-row taxonomy, 91 sources): twelve first-screen types (parked vehicles; vendor cart, kiosk or tin shed; shop or house spilling onto it; private ramp or fence; electric pole, box or transformer; tree or bushes; open manhole or drain; broken or missing tiles; dug up and left; malba or garbage; signboard, bus stop or furniture; waterlogged) plus three behind "More kinds" (two-wheelers riding on it, stray cattle or dogs, shrine or statue). Absence, discontinuity, height and darkness are audit items, not tiles. Hindi names follow MCG's own posts and Gurugram press; each type carries the clause (IRC:103-2012 numbering, Rules of the Road, Street Vendors Act, HMC Act s.408, IS 1726/12592, SC 2009 shrines order) and the usual Gurugram agency. Old ids from earlier saved checks are migrated on load.
- `src/app.js` state, scoring, the street-strip and signal drawings, notice builder, routing
- `build.py` assembles the five into `index.html`, which is what gets published. Always rebuild before republishing.

## Interaction
Two modes, chosen first: **Quick check** (2 min: location, which footpath, tap what is at the spot, one photo, one yes/no; produces a spot report and a short notice) and **Full stretch** (15 min: location, which footpath, four road-type taps, land use; the eleven items; "End here" marks the end of the stretch and computes its length; score, strip, full notice). Location is taken with `navigator.geolocation` (rounded to 4 decimals, about 10 m; nothing is recorded until the button is tapped). Inside the claude.ai artifact viewer the location prompt is refused (no location capability exists for this account), so the page falls back to pasting coordinates from Google Maps or naming the road; on a deployed site it is the normal browser prompt. Start and end fixes give the stretch length and a compass heading, which the notice prints with an OpenStreetMap link. Clause numbers sit behind a "Why it matters" tap on each item, and weights behind "How is this scored?" on the result.
Item 2 is a tap palette: each tap adds one problem to `st.obs` and drops its glyph onto the live strip; a minus removes one. Items 2 and 7 get a suggested answer from what was tapped (flagged `st.auto`, shown as a note) which the user can override. The result and the notice list the recorded problems with counts and the agencies concerned, and compose the item 2 and 7 asks from the types present. Motion: drop-in on new glyphs, striding walker while answers land, reveal wipe on strips, lamps and the signal animate on, score counts up, chalk marks write on; all guarded by prefers-reduced-motion.

## Deploy
Live at https://righttowalk.life (GitHub Pages from `main`, root; the `CNAME` file holds the domain; DNS at GoDaddy: four A records to GitHub Pages plus `www` CNAME to `deepanshucfi.github.io`). Deploy = `python3 build.py`, commit, push to main; Pages rebuilds in about a minute. Never edit `index.html` by hand; it is generated.

Local preview: the `footpath-check` entry in `~/Documents/Claude/.claude/launch.json` (python http.server on 8815).

## Method v1.0 (record tag v1.2 once obstruction types are included)
Weights: footpath 20, clear 15, crossing 15, speed 12, width 8, ramps 8, surface 7, lighting 7, kerb and continuity 4, buffer 4. Score scaled over judgeable items; "partly" is half weight on clear, crossing and surface; lighting may be "can't tell". Gate = 100 m without stepping onto the road; a failed gate is "not walkable" regardless of score. If there is no footpath, the footpath-dependent items fail automatically. Answer tiles carry no red or green; semantic colour appears only on the result.

Legal text is quoted verbatim from Maniyar Iliyaz v. P. Ayyappan (2026 INSC 647) and the Rajaseekaran orders of 14 May 2025 and 7 Oct 2025. IRC:103-2022 numbers come from the NITI-hosted IRC draft; the 2012 edition was read in full. Research: `~/Documents/Claude/reports/Right to walk auditor India.md`.

## Not in Phase 0
Map and 500 m drawing, owner layer from GMDA's master-road list, photos attached to the notice, sent/acknowledged/fixed loop with re-audit, Hindi learn page, costed asks from the Haryana PWD schedule of rates, aggregation.
