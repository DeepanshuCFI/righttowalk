#!/usr/bin/env python3
"""Tier-2 security probes for the Phase 1 record, run from outside with only the public anon key.

    python3 tools/probe.py                 # against src/config.js
    python3 tools/probe.py http://127.0.0.1:8816 anon   # against the mock backend

Every probe states what an anonymous visitor must NOT be able to do, and checks it. Writes one row with status='test'
(moderators can delete it from the Test tab) and one tiny photo under pending/<that id>/.
"""
import json, re, sys, urllib.error, urllib.request, uuid, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
if len(sys.argv) >= 3:
    URL, ANON = sys.argv[1], sys.argv[2]
else:
    cfg = (ROOT / "src" / "config.js").read_text(encoding="utf-8")
    URL = re.search(r"url:'([^']*)'", cfg).group(1)
    ANON = re.search(r"anon:'([^']*)'", cfg).group(1)
if not URL:
    print("src/config.js has no url; pass URL and ANON on the command line")
    sys.exit(2)

def call(method, path, body=None, headers=None, raw=None):
    h = {"apikey": ANON, "Authorization": "Bearer " + ANON}
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8"); h["Content-Type"] = "application/json"
    if raw is not None:
        data = raw
    h.update(headers or {})
    req = urllib.request.Request(URL + path, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            txt = r.read().decode("utf-8", "replace")
            try: return r.status, json.loads(txt) if txt else None
            except Exception: return r.status, txt
    except urllib.error.HTTPError as e:
        txt = e.read().decode("utf-8", "replace")
        try: return e.code, json.loads(txt) if txt else None
        except Exception: return e.code, txt

results = []
def check(name, ok, detail=""):
    results.append((name, ok)); print(f"{'PASS' if ok else 'FAIL'}  {name}{('  (' + str(detail)[:120] + ')') if detail else ''}")

# 1 anon cannot read the raw table
s, b = call("GET", "/rest/v1/checks?select=id&limit=1")
check("anon cannot select from checks", s in (401, 403, 404, 406), f"{s} {b}")
# 2 anon cannot read moderators
s, b = call("GET", "/rest/v1/moderators?select=email")
check("anon cannot select from moderators", s in (401, 403, 404), f"{s} {b}")
# 3 anon cannot call is_moderator
s, b = call("POST", "/rest/v1/rpc/is_moderator", {})
check("anon cannot call is_moderator()", s in (401, 403, 404), f"{s} {b}")
# 4 public views and stats work, and carry no personal columns
s, b = call("GET", "/rest/v1/public_checks?select=*&limit=1")
check("anon can read public_checks", s in (200, 206), f"{s}")
if isinstance(b, list) and b:
    check("public_checks carries no personal columns", not ({"first_name", "client_id", "ua", "status", "moderated_by", "mod_note"} & set(b[0].keys())), list(b[0].keys()))
s, b = call("GET", "/rest/v1/public_checks?select=first_name&limit=1")
check("public_checks has no first_name column", s in (400, 404), f"{s}")
s, b = call("GET", "/rest/v1/rpc/public_stats")
check("anon can call public_stats()", s == 200 and isinstance(b, dict) and "published" in b, f"{s} {b}")
# 5 anon cannot insert a published or verified row, nor one without consent
base = {"mode": "quick", "lat": 28.4595, "lon": 77.0266, "road": "probe", "consent": True, "obs": {"parked": 1}, "gate": "no", "client_id": "probe"}
s, b = call("POST", "/rest/v1/checks", {**base, "status": "published"}, {"Prefer": "return=minimal"})
check("anon cannot insert status=published", s in (401, 403), f"{s} {b}")
s, b = call("POST", "/rest/v1/checks", {**base, "status": "pending", "verified": True}, {"Prefer": "return=minimal"})
check("anon cannot insert verified=true", s in (401, 403), f"{s} {b}")
s, b = call("POST", "/rest/v1/checks", {**base, "consent": False, "status": "test"}, {"Prefer": "return=minimal"})
check("insert without consent is refused", s in (400, 401, 403), f"{s} {b}")
s, b = call("POST", "/rest/v1/checks", {**base, "status": "test", "lat": 51.5}, {"Prefer": "return=minimal"})
check("insert outside India is refused", s in (400, 401, 403), f"{s} {b}")
# 6 a valid test insert works, is invisible publicly, and cannot be changed or deleted by anon
tid = str(uuid.uuid4())
s, b = call("POST", "/rest/v1/checks", {**base, "id": tid, "status": "test"}, {"Prefer": "return=minimal"})
check("anon can insert a status=test row", s == 201, f"{s} {b}")
s, b = call("POST", "/rest/v1/checks", {**base, "id": tid, "status": "test"}, {"Prefer": "return=representation"})
check("insert with return=representation gives nothing back", s != 201 or not b, f"{s}")
s, b = call("GET", f"/rest/v1/public_checks?id=eq.{tid}&select=id")
check("the test row is not in public_checks", s in (200, 206) and b == [], f"{s} {b}")
s, b = call("PATCH", f"/rest/v1/checks?id=eq.{tid}", {"status": "published"}, {"Prefer": "return=minimal"})
check("anon cannot update a row", s in (401, 403, 404), f"{s} {b}")
s, b = call("DELETE", f"/rest/v1/checks?id=eq.{tid}", headers={"Prefer": "return=minimal"})
check("anon cannot delete a row", s in (401, 403, 404), f"{s} {b}")
# 7 storage
png = bytes.fromhex("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082")
s, b = call("POST", f"/storage/v1/object/photos/published/{tid}/p.png", raw=png, headers={"Content-Type": "image/png"})
check("anon cannot upload into published/", s in (400, 401, 403), f"{s} {b}")
s, b = call("POST", f"/storage/v1/object/photos/pending/{tid}/p.png", raw=png, headers={"Content-Type": "image/png"})
check("anon can upload into pending/<id>/", s == 200, f"{s} {b}")
s, b = call("POST", f"/storage/v1/object/photos/pending/{tid}/t.txt", raw=b"hello", headers={"Content-Type": "text/plain"})
check("non-image upload is refused", s in (400, 403, 415), f"{s} {b}")
s, b = call("GET", f"/storage/v1/object/authenticated/photos/pending/{tid}/p.png")
check("anon cannot read a pending photo", s in (400, 401, 403, 404), f"{s}")
s, b = call("GET", f"/storage/v1/object/public/photos/pending/{tid}/p.png")
check("bucket is not public", s in (400, 401, 403, 404), f"{s}")
s, b = call("POST", "/storage/v1/object/list/photos", {"prefix": "pending", "limit": 10})
check("anon cannot list pending/", s in (400, 401, 403) or b == [], f"{s} {b}")
s, b = call("POST", "/storage/v1/object/move", {"bucketId": "photos", "sourceKey": f"pending/{tid}/p.png", "destinationKey": f"published/{tid}/p.png"})
check("anon cannot move a photo", s in (400, 401, 403, 404), f"{s} {b}")
s, b = call("DELETE", "/storage/v1/object/photos", {"prefixes": [f"pending/{tid}/p.png"]})
check("anon cannot delete a photo", s in (400, 401, 403, 404) or b == [], f"{s} {b}")

n_fail = sum(1 for _, ok in results if not ok)
print(f"\n{len(results) - n_fail} passed, {n_fail} failed. Test row {tid} (status=test) can be deleted from the moderation page.")
sys.exit(1 if n_fail else 0)
