#!/usr/bin/env python3
"""Assemble the site from src/:

  index.html     the Footpath Check (full HTML document, self-hosted fonts, CSP, social meta)
  map.html       the public map of published checks (Leaflet from vendor/, CARTO tiles)
  report.html    the Gurugram report, rendered live from the public views
  dataset.html   the open-data field guide
  roads.html     the assignment sheet for Haryana's own road list (src/roads.json, built by tools/roads_geocode.py)
  moderate.html  the moderation page (noindex; Supabase Auth magic link)
  privacy.html   what is stored, what is public, how to have a record removed
  sitemap.xml    every indexable page above, lastmod from git
  artifact.html  index as claude.ai artifact content (no document wrapper, Google Fonts, record switched off)

Edit src/, never the outputs. Phase 1 connection values live in src/config.js (public anon key by design).
A local build against the mock backend: RTW_URL=http://127.0.0.1:8816 RTW_ANON=anon python3 build.py  (never commit that output).
"""
import datetime, json, os, pathlib, re, subprocess
ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
read = lambda p: (SRC / p).read_text(encoding="utf-8")

SITE = "https://righttowalk.life/"
TITLE = "Right to Walk"
HOME_TITLE = "Right to Walk: check a footpath in Gurugram"
DESC = ("Record a footpath observation in Gurugram, learn what the Supreme Court has said about walking, "
        "and add your check to a moderated public record. By Crashfree India.")

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

SITEMAP = []  # (url, source files) for every indexable page, in build order

def lastmod(files):
    """Date of the last commit touching these sources, or today when they have uncommitted edits."""
    paths = [str(SRC / f) for f in files]
    if subprocess.run(["git", "diff", "--quiet", "HEAD", "--", *paths], cwd=ROOT).returncode:
        return datetime.date.today().isoformat()
    out = subprocess.run(["git", "log", "-1", "--format=%cs", "--", *paths], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    return out or datetime.date.today().isoformat()

def ld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/") + "</script>\n"

def document(fname, title, desc, body, scripts, extra_head="", extra_css="", pre_script="", noindex=False, config=None, jsonld=None, src=None):
    url = SITE + ("" if fname == "index.html" else fname)
    robots = '<meta name="robots" content="noindex, nofollow">\n' if noindex else ""
    if not noindex:
        SITEMAP.append((url, [src or fname] + [f for f in scripts if f != "config.js"]))
    if jsonld:
        extra_head = "".join(ld(o) for o in jsonld) + extra_head
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
<meta property="og:locale" content="en_IN">
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

# ---- structured data (schema.org JSON-LD) and the law page's questions ----
ORG = {"@type": "NGO", "@id": "https://crashfreeindia.org/#org", "name": "Crashfree India", "url": "https://crashfreeindia.org/"}
LD_SITE = {"@context": "https://schema.org", "@graph": [
    ORG,
    {"@type": "WebSite", "@id": SITE + "#site", "url": SITE, "name": TITLE, "alternateName": "राइट टू वॉक",
     "description": DESC, "inLanguage": ["en", "hi"], "publisher": {"@id": ORG["@id"]}},
    {"@type": "WebApplication", "name": "Footpath Check", "url": SITE + "#check", "applicationCategory": "UtilitiesApplication",
     "operatingSystem": "Any (web browser)", "isAccessibleForFree": True, "offers": {"@type": "Offer", "price": "0", "priceCurrency": "INR"},
     "description": "A two-minute check of a footpath in Gurugram: record one spot, or walk 100 m and answer eleven questions.",
     "publisher": {"@id": ORG["@id"]}}]}

# Every answer below restates a line already on the law page with its source; keep them in step when the page changes.
FAQ = [
    ("Is walking a fundamental right in India?",
     "Yes. On 19 June 2026, in Maniyar Iliyaz v. P. Ayyappan (2026 INSC 647), the Supreme Court held that the right to walk is a fundamental right "
     "under Article 19(1)(d), read with Articles 19(1)(a) to (c) and 21. It includes the right to demarcated footpaths, and these rights "
     "\"are primary and shall have priority over movement by motorised vehicles\". Earlier, in S. Rajaseekaran v. Union of India (14 May 2025), "
     "the Court held that footpaths in good condition are part of Article 21."),
    ("Is there a Right to Walk Act?",
     "No Act titled \"Right to Walk\" has been identified. The right comes from the Constitution as interpreted by the Supreme Court. "
     "Sections 138(1A) and 210D of the Motor Vehicles Act let States make rules on pedestrian access and on the design, construction and "
     "maintenance of roads; whether Haryana has notified such rules needs a current Gazette check."),
    ("Who must build and maintain footpaths?",
     "The Supreme Court named the duty bearers as \"the urban development authorities, municipal corporations, municipalities and even panchayats\" "
     "(Maniyar Iliyaz, para 20(b)). In practice it is the agency that owns the road. In Gurugram that is GMDA for master sector roads, MCG for "
     "transferred HSVP sectors and taken-over colonies, HSVP for sectors not yet transferred, DTCP and the coloniser inside licensed colonies "
     "until transfer, NHAI on NH-48 and NH-248A, and PWD (B&R) on state roads. No public map says which road is whose."),
    ("How wide should a footpath be in India?",
     "Paragraph 19 of the Supreme Court's 7 October 2025 Rajaseekaran order reproduces 2022 Indian Roads Congress guidance: a walking zone of "
     "2.0 m in residential areas, 2.5 m in neighbourhood commercial areas and 4.0 m on city commercial streets, with a 150 mm kerb. "
     "The Court said IRC:103-2022 binds national highways; its application to State roads needs closer examination."),
    ("Can vehicles be driven or parked on a footpath?",
     "No. Under the Rules of the Road Regulations 1989 (regulations 8, 11 and 15), no vehicle may be driven or parked on a footpath, drivers "
     "must slow down at pedestrian crossings, and pedestrians have right of way at uncontrolled crossings."),
    ("Did the Supreme Court order every city to build footpaths by a deadline?",
     "No such order exists. The 7 October 2025 Rajaseekaran order directs footpath audits and online footpath grievance systems for fifty "
     "specified cities and the national highways, and asked States to make rules within six months. Gurugram is not on that list of cities."),
    ("How can I record a footpath problem in Gurugram?",
     "Use the Footpath Check on righttowalk.life. A quick check records one spot; the full check asks eleven questions, including a 100 m "
     "continuity check. If you add it to the record and give consent, a moderator reads it before it appears on the public map and in the "
     "open data (CC BY 4.0). The score is Right to Walk's method, not a legal compliance finding."),
]
esc_html = lambda t: t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
FAQ_HTML = ('<div class="block" id="questions">\n      <h2>Questions people ask</h2>\n'
            + "".join(f'      <h3>{esc_html(q)}</h3>\n      <p>{esc_html(a)}</p>\n' for q, a in FAQ) + "    </div>\n")
LD_FAQ = {"@context": "https://schema.org", "@type": "FAQPage", "inLanguage": "en", "publisher": ORG,
          "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]}
LD_LAW = {"@context": "https://schema.org", "@type": "Article", "headline": "The law behind the right to walk", "inLanguage": "en",
          "url": SITE + "law.html", "publisher": ORG, "author": ORG,
          "about": [{"@type": "Thing", "name": "Maniyar Iliyaz v. P. Ayyappan, 2026 INSC 647 (Supreme Court of India, 19 June 2026)"},
                    {"@type": "Thing", "name": "S. Rajaseekaran v. Union of India (Supreme Court of India, orders of 14 May 2025 and 7 October 2025)"}]}
LD_DATASET = {"@context": "https://schema.org", "@type": "Dataset",
              "name": "Right to Walk: Gurugram footpath record",
              "description": ("Citizen observations of footpaths in Gurugram, Haryana, India: every published spot report and 100 m continuity "
                              "check, read by a moderator before publication. Locations are rounded to about 10 m and names are never included. "
                              "Updated nightly as CSV and JSON, with a field guide to every column."),
              "url": SITE + "dataset.html", "license": "https://creativecommons.org/licenses/by/4.0/", "isAccessibleForFree": True,
              "creator": ORG, "publisher": ORG, "inLanguage": "en",
              "keywords": ["footpath", "pedestrian", "walkability", "Gurugram", "road safety", "right to walk", "India"],
              "spatialCoverage": {"@type": "Place", "name": "Gurugram, Haryana, India"}, "temporalCoverage": "2026-10-23/..",
              "distribution": [{"@type": "DataDownload", "encodingFormat": "text/csv", "contentUrl": SITE + "data/checks.csv"},
                               {"@type": "DataDownload", "encodingFormat": "application/json", "contentUrl": SITE + "data/checks.json"},
                               {"@type": "DataDownload", "encodingFormat": "application/json", "contentUrl": SITE + "data/deaths.json"}]}

body = read("body.html")
document("index.html", HOME_TITLE, DESC, body, ["data.js", "obs.js", "learn.js", "config.js", "rtw.js", "deaths.js", "share.js", "cards.js", "app.js"], config=cfg_index,
         jsonld=[LD_SITE], src="body.html")
document("map.html", "Gurugram footpath map · Right to Walk",
         "Published spot observations and full 100 m continuity checks in Gurugram, with the limits of each check shown.",
         read("map.html"), ["data.js", "obs.js", "config.js", "rtw.js", "frame.js", "deaths.js", "map.js"],
         extra_head='<link rel="stylesheet" href="vendor/leaflet/leaflet.css">\n', extra_css=pages_css,
         pre_script='<script src="vendor/leaflet/leaflet.js"></script>\n', config=cfg_roads)
document("report.html", "Gurugram report · Right to Walk",
         "A report of submitted footpath observations in Gurugram, separating spot reports from Right to Walk's 100 m continuity checks.",
         read("report.html"), ["data.js", "obs.js", "config.js", "rtw.js", "frame.js", "deaths.js", "report.js"], extra_css=pages_css, config=cfg_roads)
document("roads.html", "Roads to walk · Right to Walk",
         "A Gurugram road assignment sheet showing where citizen observations exist and where coverage is still unknown.",
         read("roads.html"), ["data.js", "obs.js", "config.js", "rtw.js", "frame.js", "roads.js"], extra_css=pages_css + "\n" + roads_css, config=cfg_roads)
document("law.html", "The law · Right to Walk",
         "The law behind the right to walk: what the Supreme Court has said, who can make the law and who has, what a footpath should be, who must provide it in Gurugram.",
         read("law.html").replace("<!--FAQ-->", FAQ_HTML), ["data.js", "obs.js", "learn.js", "config.js", "rtw.js", "lawpage.js"], extra_css=pages_css,
         jsonld=[LD_LAW, LD_FAQ])
document("game.html", "The footpath game · Right to Walk",
         "Walk 500 m of a Gurugram road as a working adult, a schoolchild, an older person or a wheelchair user: by day, after dark and in the rain. The footpath blocks you; the only way past is the road, where the traffic is. A small game about what walking here is like.",
         read("game.html"), ["game.js"], extra_css=pages_css)
document("dataset.html", "Open data · Right to Walk",
         "The Gurugram footpath record as open data (CC BY 4.0): every published check as CSV and JSON, with a field guide.",
         read("dataset.html"), ["data.js", "obs.js", "config.js", "rtw.js", "dataset.js"], extra_css=pages_css,
         jsonld=[LD_DATASET])
document("privacy.html", "Privacy · Right to Walk",
         "What Right to Walk stores when you check a footpath, what becomes public, who can see the rest, and how to have your record removed.",
         read("privacy.html"), [], extra_css=pages_css)
document("moderate.html", "Moderation · Right to Walk", "Moderation of citizen footpath checks before publication.",
         read("moderate.html"), ["data.js", "obs.js", "config.js", "rtw.js", "moderate.js"], extra_css=pages_css, noindex=True)

# ---- sitemap: one entry per indexable page, dated by its sources' last change ----
sm = "".join(f"<url><loc>{u}</loc><lastmod>{lastmod(files)}</lastmod></url>" for u, files in SITEMAP)
(ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
                                  + sm + "</urlset>\n", encoding="utf-8")
print(f"built {'sitemap.xml':14s} {len(SITEMAP)} pages")

# ---- artifact: head.html as written (title, metas, Google Fonts link); record switched off; site links made absolute ----
art_body = re.sub(r'\s*<a href="map\.html" id="nav-map"[^>]*>Map</a>', "", body)
for f in ("map.html", "report.html", "dataset.html", "law.html", "game.html", "privacy.html"):
    art_body = art_body.replace(f'href="{f}"', f'href="{SITE}{f}"')
artifact = read("head.html") + "<style>\n" + style + "\n</style>\n" + art_body + wrap_script(["data.js", "obs.js", "learn.js", "config.js", "rtw.js", "share.js", "cards.js", "app.js"], cfg_off)
for f in ("map.html", "report.html", "dataset.html", "law.html", "game.html", "privacy.html"):  # the Hindi strings link to these pages too
    artifact = artifact.replace(f'href="{f}"', f'href="{SITE}{f}"')
(ROOT / "artifact.html").write_text(artifact, encoding="utf-8")
print(f"built {'artifact.html':14s} {len(artifact.encode('utf-8')):7d} bytes (record off)")
if local:
    (ROOT / ".local-build").write_text(local)
elif (ROOT / ".local-build").exists():
    (ROOT / ".local-build").unlink()
