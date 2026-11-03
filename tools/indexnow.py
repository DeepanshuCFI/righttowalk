#!/usr/bin/env python3
"""Tell IndexNow search engines (Bing, Yandex, Seznam, Naver) which pages changed.

  python3 tools/indexnow.py --base HEAD^ --head HEAD   pages whose built HTML changed between two commits
  python3 tools/indexnow.py --all                      every page in sitemap.xml
  add --dry-run to print the list without sending it

Run by .github/workflows/indexnow.yml after each GitHub Pages build. The key is public by design:
IndexNow checks it against https://righttowalk.life/<key>.txt, which only proves we control the site.
"""
import argparse, json, pathlib, re, subprocess, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://righttowalk.life/"
KEY = "f90b02a2f8e16ca0ae4c4cdcd4b25894"
ENDPOINT = "https://api.indexnow.org/indexnow"
SKIP = {"404.html", "moderate.html", "artifact.html"}  # not for search: error page, noindex page, claude.ai copy


def sitemap_urls():
    return re.findall(r"<loc>([^<]+)</loc>", (ROOT / "sitemap.xml").read_text(encoding="utf-8"))


def changed_urls(base, head):
    out = subprocess.run(["git", "diff", "--name-only", base, head], cwd=ROOT, capture_output=True, text=True, check=True).stdout.split()
    pages = [f for f in out if "/" not in f and f.endswith(".html") and f not in SKIP]
    return [SITE if f == "index.html" else SITE + f for f in pages]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base"); ap.add_argument("--head", default="HEAD")
    ap.add_argument("--all", action="store_true"); ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    urls = sitemap_urls() if a.all else changed_urls(a.base or a.head + "^", a.head)
    if not urls:
        print("no page changed; nothing to send"); return 0
    print("\n".join(urls))
    if a.dry_run:
        return 0
    body = json.dumps({"host": "righttowalk.life", "key": KEY, "keyLocation": f"{SITE}{KEY}.txt", "urlList": urls}).encode()
    req = urllib.request.Request(ENDPOINT, data=body, headers={"Content-Type": "application/json; charset=utf-8"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print("IndexNow:", r.status)  # 200 accepted, 202 accepted while the key is being checked
            return 0
    except urllib.error.HTTPError as e:
        print("IndexNow refused:", e.code, e.read()[:300].decode(errors="replace"), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
