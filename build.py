#!/usr/bin/env python3
"""Assemble index.html from src/: head.html + <style>style.css</style> + body.html + <script>data.js + app.js</script>."""
import pathlib
root = pathlib.Path(__file__).parent / "src"
read = lambda n: (root / n).read_text(encoding="utf-8")
out = (
    read("head.html")
    + "<style>\n" + read("style.css") + "\n</style>\n"
    + read("body.html")
    + "\n<script>\n(function(){\n'use strict';\n" + read("data.js") + "\n" + read("obs.js") + "\n" + read("app.js") + "\n})();\n</script>\n"
)
(pathlib.Path(__file__).parent / "index.html").write_text(out, encoding="utf-8")
print("built index.html", len(out.encode("utf-8")), "bytes")
