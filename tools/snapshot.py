#!/usr/bin/env python3
"""Snapshot the public record. checked_at moves on every successful run;
data_changed_at moves only when the published rows change. Uses the public anon API.
"""
import csv
import datetime
import hashlib
import io
import json
import os
import pathlib
import re
import ssl
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
OBS_IDS = ["parked", "vendor", "shop", "ramp", "electric", "green", "manhole", "slab", "dug", "waste", "furniture", "water", "riding", "cattle", "shrine"]
ITEM_IDS = [f"i{i}" for i in range(1, 11)]
COLS = ["id", "created_at", "mode", "method", "lat", "lon", "length_m", "side", "road", "sector", "land", "road_class", "owner", "gate", "spot_passable", "score", "band", "anchor", "photo_count", "verified", "verified_at", "verification_check_id", "legacy_verified"] + ITEM_IDS + [f"obs_{o}" for o in OBS_IDS]


def csv_safe(value):
    """Preserve raw values in JSON; make the CSV safe to open in spreadsheets."""
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, str) and (value.lstrip().startswith(("=", "+", "-", "@")) or value.startswith(("\t", "\r", "\n"))):
        return "'" + value
    return value


def csv_text(rows):
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=COLS, extrasaction="ignore", lineterminator="\n")
    writer.writeheader()
    for row in rows:
        answers = row.get("answers") or {}
        obs = row.get("obs") or {}
        flat = {key: row.get(key) for key in COLS}
        for item in ITEM_IDS:
            value = answers.get(item)
            if answers.get("i1") == "no" and item in ("i2", "i5", "i6", "i7", "i9", "i10"):
                value = "no"
            flat[item] = value
        for obstruction in OBS_IDS:
            flat[f"obs_{obstruction}"] = obs.get(obstruction, 0)
        writer.writerow({key: csv_safe(value) for key, value in flat.items()})
    return buf.getvalue()


def load_config():
    cfg = (ROOT / "src" / "config.js").read_text(encoding="utf-8")
    url = os.environ.get("RTW_URL") or re.search(r"url:'([^']*)'", cfg).group(1)
    anon = os.environ.get("RTW_ANON") or re.search(r"anon:'([^']*)'", cfg).group(1)
    return url, anon


def context():
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl.create_default_context()


def fetch_json(url, anon, path, headers=None):
    request = urllib.request.Request(url + path, headers={"apikey": anon, "Authorization": "Bearer " + anon, **(headers or {})})
    with urllib.request.urlopen(request, timeout=60, context=context()) as response:
        return json.loads(response.read().decode("utf-8"))


def now_iso():
    return datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def main():
    url, anon = load_config()
    if not url or not anon:
        print("record not configured (src/config.js); nothing to snapshot")
        return 0
    out = pathlib.Path(os.environ.get("RTW_OUT") or (ROOT / "data"))
    rows, start = [], 0
    while True:
        page = fetch_json(url, anon, "/rest/v1/public_checks?select=*&order=created_at.asc", {"Range": f"{start}-{start+999}", "Range-Unit": "items"})
        rows += page
        if len(page) < 1000:
            break
        start += 1000
    stats = fetch_json(url, anon, "/rest/v1/rpc/public_stats")
    sectors = fetch_json(url, anon, "/rest/v1/public_sector_stats?select=*&order=checks.desc")
    owners = fetch_json(url, anon, "/rest/v1/public_owner_stats?select=*&order=checks.desc")
    out.mkdir(parents=True, exist_ok=True)
    now = now_iso()
    digest = hashlib.sha256(json.dumps(rows, sort_keys=True).encode("utf-8")).hexdigest()
    stamp = out / ".rows.sha256"
    rows_changed = not stamp.exists() or stamp.read_text().strip() != digest or not (out / "checks.csv").exists()
    previous = out / "checks.json"
    try:
        previous_json = json.loads(previous.read_text(encoding="utf-8"))
        previous_changed = previous_json.get("data_changed_at") or previous_json.get("generated")
    except (OSError, ValueError):
        previous_changed = None
    changed_at = now if rows_changed else (previous_changed or now)
    meta = {"generated": changed_at, "data_changed_at": changed_at, "licence": "CC BY 4.0", "source": "https://righttowalk.life", "citation": "Crashfree India, Right to Walk: Gurugram footpath record, righttowalk.life", "method": "footpath-check-v1.3", "field_guide": "https://righttowalk.life/dataset.html"}
    if rows_changed:
        (out / "checks.json").write_text(json.dumps({**meta, "count": len(rows), "checks": rows}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        (out / "checks.csv").write_text(csv_text(rows), encoding="utf-8")
        stamp.write_text(digest + "\n")
    (out / "stats.json").write_text(json.dumps({**meta, "checked_at": now, "stats": stats, "by_sector": sectors, "by_owner": owners}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"checked {len(rows)} published checks at {now}; {'data changed' if rows_changed else 'rows unchanged'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
