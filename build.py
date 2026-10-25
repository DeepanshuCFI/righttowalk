#!/usr/bin/env python3
"""Assemble the site from src/:

  index.html     the Footpath Check (full HTML document, self-hosted fonts, CSP, social meta)
  map.html       the public map of published checks (Leaflet from vendor/, CARTO tiles)
  report.html    the Gurugram report, rendered live from the public views
  dataset.html   the open-data field guide
  roads.html     the assignment sheet for Haryana's own road list (src/roads.json, built by tools/roads_geocode.py)
  moderate.html  the moderation page (noindex; Supabase Auth magic link)
  artifact.html  index as claude.ai artifact content (no document wrapper, Google Fonts, record switched off)

Edit src/, never the outputs. Phase 1 connection values live in src/config.js (public anon key by design).
A local build against the mock backend: RTW_URL=http://127.0.0.1:8816 RTW_ANON=anon python3 build.py  (never commit that output).
"""
import json, os, pathlib, re
ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
read = lambda p: (SRC / p).read_text(encoding="utf-8")

SITE = "https://righttowalk.life/"
TITLE = "Right to Walk"
DESC = ("Check the footpath on your street in two minutes, see what the Supreme Court and the road standards say it should be, "
        "and send the notice to whoever owns the road. A Crashfree India prototype for Gurugram.")

# ---- connection (public values) ----
cfg = read("config.js")
local = os.environ.get("RTW_URL")
if local:
    cfg = re.sub(r"url:'[^']*'", f"url:'{local}'", cfg, 1)
    cfg = re.sub(r"anon:'[^']*'", f"anon:'{os.environ.get('RTW_ANON', 'anon')}'", cfg, 1)
    print("!! LOCAL BUILD against", local, "- rebuild without RTW_URL before committing")
SUPA = re.search(r"url:'([^']*)'", cfg).group(1)
cfg += "\nconst SECTORS=" + json.dumps(json.loads(read("sectors.json")), ensure_ascii=False) + ";\n"
cfg_off = re.sub(r"url:'[^']*'", "url:''", cfg, 1)
# the sampling frame (Haryana's own road list with baked-in OSM lines) only goes to the pages that draw it
cfg_roads = cfg + "const ROADS=" + json.dumps(json.loads(read("roads.json")), ensure_ascii=False, separators=(",", ":")) + ";\n"
# deaths on record (src/deaths.json): a small file, inlined for the learn page, the map and the report, and published as open data
deaths = json.loads(read("deaths.json"))
DEATHS_JS = "const DEATHS=" + json.dumps(deaths, ensure_ascii=False, separators=(",", ":")) + ";\n"
cfg_index = cfg + DEATHS_JS
cfg_roads += DEATHS_JS
(ROOT / "data").mkdir(exist_ok=True)
(ROOT / "data" / "deaths.json").write_text(json.dumps(deaths, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

connect = "'self'" + (f" {SUPA}" if SUPA else "")
CSP = ("default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; "
       f"img-src 'self' data: blob: https://tile.openstreetmap.org; connect-src {connect}; manifest-src 'self'; "
       "base-uri 'none'; form-action 'none'; object-src 'none'")

fonts_css = (ROOT / "fonts" / "fonts.css").read_text(encoding="utf-8")
style = read("style.css")
pages_css = read("pages.css")
roads_css = read("roads.css")
FRAME_BUSTER = "<script>if(window.top!==window.self){try{window.top.location.replace(location.href)}catch(e){document.documentElement.hidden=true}}</script>"

def wrap_script(files, config):
    parts = [config if f == "config.js" else read(f) for f in files]
    return "\n<script>\n(function(){\n'use strict';\n" + "\n".join(parts) + "\n})();\n</script>\n"

def document(fname, title, desc, body, scripts, extra_head="", extra_css="", pre_script="", noindex=False, config=None):
    url = SITE + ("" if fname == "index.html" else fname)
    robots = '<meta name="robots" content="noindex, nofollow">\n' if noindex else ""
    head = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta http-equiv="Content-Security-Policy" content="{CSP}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#FFC72C">
{robots}<link rel="canonical" href="{url}">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="manifest" href="manifest.webmanifest">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{TITLE}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{SITE}og.png">
{extra_head}<style>
{fonts_css}
{style}
{extra_css}
</style>
</head>
<body>
<noscript><p style="margin:16px;font:17px/1.5 system-ui">Right to Walk needs JavaScript for this page. Please enable it, or open the page in another browser.</p></noscript>
{FRAME_BUSTER}
"""
    html = head + body + pre_script + wrap_script(scripts, config or cfg) + "</body>\n</html>\n"
    (ROOT / fname).write_text(html, encoding="utf-8")
    print(f"built {fname:14s} {len(html.encode('utf-8')):7d} bytes")

body = read("body.html")
document("index.html", TITLE, DESC, body, ["data.js", "obs.js", "learn.js", "config.js", "rtw.js", "deaths.js", "share.js", "cards.js", "app.js"], config=cfg_index)
document("map.html", "Gurugram footpath map · Right to Walk",
         "Every footpath a citizen has checked in Gurugram, on one map: where a walker could not go 100 m without stepping onto the road.",
         read("map.html"), ["data.js", "obs.js", "config.js", "rtw.js", "frame.js", "deaths.js", "map.js"],
         extra_head='<link rel="stylesheet" href="vendor/leaflet/leaflet.css">\n', extra_css=pages_css,
         pre_script='<script src="vendor/leaflet/leaflet.js"></script>\n', config=cfg_roads)
document("report.html", "Gurugram report · Right to Walk",
         "How far is Gurugram from the Right to Walk? The share of checked footpaths that fail the Supreme Court's 100 m test, by sector and by road owner, live from the public record.",
         read("report.html"), ["data.js", "obs.js", "config.js", "rtw.js", "frame.js", "deaths.js", "report.js"], extra_css=pages_css, config=cfg_roads)
document("roads.html", "Roads to walk · Right to Walk",
         "Haryana's own list of 100 Gurugram roads to be upgraded by 7 November 2026, as an assignment sheet: which have been walked, which fail the Supreme Court's 100 m test, and room to divide the rest between volunteers.",
         read("roads.html"), ["data.js", "obs.js", "config.js", "rtw.js", "frame.js", "roads.js"], extra_css=pages_css + "\n" + roads_css, config=cfg_roads)
document("law.html", "The law · Right to Walk",
         "The law behind the right to walk: what the Supreme Court has said, who can make the law and who has, what a footpath should be, who must provide it in Gurugram.",
         read("law.html"), ["data.js", "obs.js", "learn.js", "config.js", "rtw.js", "lawpage.js"], extra_css=pages_css)
document("dataset.html", "Open data · Right to Walk",
         "The Gurugram footpath record as open data (CC BY 4.0): every published check as CSV and JSON, with a field guide.",
         read("dataset.html"), ["data.js", "obs.js", "config.js", "rtw.js", "dataset.js"], extra_css=pages_css)
document("moderate.html", "Moderation · Right to Walk", "Moderation of citizen footpath checks before publication.",
         read("moderate.html"), ["data.js", "obs.js", "config.js", "rtw.js", "moderate.js"], extra_css=pages_css, noindex=True)

# ---- artifact: head.html as written (title, metas, Google Fonts link); record switched off; site links made absolute ----
art_body = re.sub(r'\s*<a href="map\.html" id="nav-map"[^>]*>Map</a>', "", body)
for f in ("map.html", "report.html", "dataset.html", "law.html"):
    art_body = art_body.replace(f'href="{f}"', f'href="{SITE}{f}"')
artifact = read("head.html") + "<style>\n" + style + "\n</style>\n" + art_body + wrap_script(["data.js", "obs.js", "learn.js", "config.js", "rtw.js", "share.js", "cards.js", "app.js"], cfg_off)
for f in ("map.html", "report.html", "dataset.html", "law.html"):  # the Hindi strings link to these pages too
    artifact = artifact.replace(f'href="{f}"', f'href="{SITE}{f}"')
(ROOT / "artifact.html").write_text(artifact, encoding="utf-8")
print(f"built {'artifact.html':14s} {len(artifact.encode('utf-8')):7d} bytes (record off)")
if local:
    (ROOT / ".local-build").write_text(local)
elif (ROOT / ".local-build").exists():
    (ROOT / ".local-build").unlink()
