#!/usr/bin/env python3
"""Daily snapshot of the public record into data/ (run by .github/workflows/snapshot.yml, or by hand).

Needs nothing secret: it reads the project URL and the public anon key from src/config.js and calls the same
read-only views the map and the report use. Writes data/checks.json, data/checks.csv and data/stats.json, and
leaves the files untouched when the rows have not changed (so the Action does not commit every day for nothing).
"""
import csv, datetime, hashlib, io, json, os, pathlib, re, ssl, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]

def _ctx():
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl.create_default_context()
_CTX = _ctx()

cfg = (ROOT / "src" / "config.js").read_text(encoding="utf-8")
URL = os.environ.get("RTW_URL") or re.search(r"url:'([^']*)'", cfg).group(1)
ANON = os.environ.get("RTW_ANON") or re.search(r"anon:'([^']*)'", cfg).group(1)
OUT = pathlib.Path(os.environ.get("RTW_OUT") or (ROOT / "data"))   # RTW_OUT: write elsewhere when testing against the mock
if not URL or not ANON:
    print("record not configured (src/config.js); nothing to snapshot")
    sys.exit(0)

OBS_IDS = ["parked", "vendor", "shop", "ramp", "electric", "green", "manhole", "slab", "dug", "waste", "furniture", "water", "riding", "cattle", "shrine"]
ITEM_IDS = [f"i{i}" for i in range(1, 11)]

def get(path, headers=None):
    req = urllib.request.Request(URL + path, headers={"apikey": ANON, "Authorization": "Bearer " + ANON, **(headers or {})})
    with urllib.request.urlopen(req, timeout=60, context=_CTX) as r:
        return json.loads(r.read().decode("utf-8"))

rows, start = [], 0
while True:
    page = get("/rest/v1/public_checks?select=*&order=created_at.asc", {"Range": f"{start}-{start+999}", "Range-Unit": "items"})
    rows += page
    if len(page) < 1000:
        break
    start += 1000
stats = get("/rest/v1/rpc/public_stats")
sectors = get("/rest/v1/public_sector_stats?select=*&order=checks.desc")
owners = get("/rest/v1/public_owner_stats?select=*&order=checks.desc")

out = OUT
out.mkdir(parents=True, exist_ok=True)
digest = hashlib.sha256(json.dumps(rows, sort_keys=True).encode("utf-8")).hexdigest()
stamp = out / ".rows.sha256"
if stamp.exists() and stamp.read_text().strip() == digest and (out / "checks.csv").exists():
    print(f"unchanged: {len(rows)} published checks; files left as they are")
    sys.exit(0)

now = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
meta = {"generated": now, "licence": "CC BY 4.0", "source": "https://righttowalk.life", "citation": "Crashfree India, Right to Walk: Gurugram footpath record, righttowalk.life",
        "method": "footpath-check-v1.2", "field_guide": "https://righttowalk.life/dataset.html"}
(out / "checks.json").write_text(json.dumps({**meta, "count": len(rows), "checks": rows}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
(out / "stats.json").write_text(json.dumps({**meta, "stats": stats, "by_sector": sectors, "by_owner": owners}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

cols = ["id", "created_at", "mode", "method", "lat", "lon", "length_m", "side", "road", "sector", "land", "road_class", "owner", "gate", "score", "band", "anchor", "photo_count", "verified"] + ITEM_IDS + [f"obs_{o}" for o in OBS_IDS]
buf = io.StringIO()
w = csv.DictWriter(buf, fieldnames=cols, extrasaction="ignore", lineterminator="\n")
w.writeheader()
for r in rows:
    a = r.get("answers") or {}
    o = r.get("obs") or {}
    flat = {k: r.get(k) for k in cols}
    for i in ITEM_IDS:
        v = a.get(i)
        if a.get("i1") == "no" and i in ("i2", "i5", "i6", "i7", "i9", "i10"):
            v = "no"
        flat[i] = v if v is not None else ""
    for ob in OBS_IDS:
        flat[f"obs_{ob}"] = o.get(ob, 0)
    for k, v in flat.items():
        if v is None:
            flat[k] = ""
        elif isinstance(v, bool):
            flat[k] = "true" if v else "false"
    w.writerow(flat)
(out / "checks.csv").write_text(buf.getvalue(), encoding="utf-8")
stamp.write_text(digest + "\n")
print(f"wrote {len(rows)} published checks to data/ at {now}")
