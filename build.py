#!/usr/bin/env python3
"""Assemble two outputs from src/:

  index.html     the website (full HTML document, self-hosted fonts, CSP and social meta) served at righttowalk.life
  artifact.html  the same page as claude.ai artifact content (no document wrapper; Google Fonts link, which the artifact CSP allows)

Edit src/, never the outputs.
"""
import pathlib
ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
read = lambda p: (SRC / p).read_text(encoding="utf-8")

SITE = "https://righttowalk.life/"
TITLE = "Right to Walk"
DESC = ("Check the footpath on your street in two minutes, see what the Supreme Court and the road standards say it should be, "
        "and send the notice to whoever owns the road. A Crashfree India prototype for Gurugram.")
CSP = ("default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; "
       "img-src 'self' data: blob:; connect-src 'none'; manifest-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'")

body = read("body.html")
script = "\n<script>\n(function(){\n'use strict';\n" + read("data.js") + "\n" + read("obs.js") + "\n" + read("app.js") + "\n})();\n</script>\n"
style = read("style.css")

# --- artifact: head.html as written (title, metas, Google Fonts link) ---
artifact = read("head.html") + "<style>\n" + style + "\n</style>\n" + body + script
(ROOT / "artifact.html").write_text(artifact, encoding="utf-8")

# --- site: full document ---
fonts_css = (ROOT / "fonts" / "fonts.css").read_text(encoding="utf-8")
head = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{TITLE}</title>
<meta name="description" content="{DESC}">
<meta http-equiv="Content-Security-Policy" content="{CSP}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#FFC72C">
<link rel="canonical" href="{SITE}">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="manifest" href="manifest.webmanifest">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{TITLE}">
<meta property="og:title" content="{TITLE}">
<meta property="og:description" content="{DESC}">
<meta property="og:url" content="{SITE}">
<meta property="og:image" content="{SITE}og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{TITLE}">
<meta name="twitter:description" content="{DESC}">
<meta name="twitter:image" content="{SITE}og.png">
<style>
{fonts_css}
{style}
</style>
</head>
<body>
<noscript><p style="margin:16px;font:17px/1.5 system-ui">Right to Walk needs JavaScript to draw your street and write the notice. Please enable it, or open the page in another browser.</p></noscript>
<script>if(window.top!==window.self){{try{{window.top.location.replace(location.href)}}catch(e){{document.documentElement.hidden=true}}}}</script>
"""
site = head + body + script + "</body>\n</html>\n"
(ROOT / "index.html").write_text(site, encoding="utf-8")
print("built index.html", len(site.encode("utf-8")), "bytes and artifact.html", len(artifact.encode("utf-8")), "bytes")
