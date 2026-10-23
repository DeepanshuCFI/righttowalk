#!/usr/bin/env python3
"""Local stand-in for the Supabase endpoints the site uses (development only; never deployed).

    python3 tools/mock_backend.py            # listens on 127.0.0.1:8816, in-memory store
    RTW_URL=http://127.0.0.1:8816 RTW_ANON=anon python3 build.py   # build the pages against it

It applies the same rules as sql/001_phase1.sql: anon may only insert pending/test rows and upload into pending/;
public views show published rows without personal columns; moderators (emails below) read and update everything.
A sign-in link is printed to the console instead of being emailed.
"""
import base64, json, re, sys, time, uuid, urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

MODS = {"deepanshu@crashfreeindia.org"}
ROWS = {}       # id -> row
FILES = {}      # path -> (content_type, bytes)
TOKENS = {}     # access token -> email
PUBLIC_COLS = ["id", "created_at", "mode", "method", "lat", "lon", "length_m", "side", "road", "sector", "land", "road_class", "owner", "gate", "answers", "obs", "score", "band", "anchor", "photo_count", "verified"]

def b64u(b): return base64.urlsafe_b64encode(b).rstrip(b"=").decode()
def jwt(email):
    return b64u(json.dumps({"alg": "none"}).encode()) + "." + b64u(json.dumps({"email": email, "role": "authenticated", "exp": int(time.time()) + 3600}).encode()) + ".sig"
def now(): return time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime())
def public(r): return {k: (round(r[k], 4) if k in ("lat", "lon") and r.get(k) is not None else r.get(k)) for k in PUBLIC_COLS}

def stats():
    pub = [r for r in ROWS.values() if r["status"] == "published"]
    live = [r for r in ROWS.values() if r["status"] in ("pending", "published")]
    return {"submitted": len(live), "published": len(pub), "pending": sum(1 for r in ROWS.values() if r["status"] == "pending"),
            "people": len({r.get("client_id") for r in live if r.get("client_id")}), "gate_tested": sum(1 for r in pub if r.get("gate")),
            "gate_pass": sum(1 for r in pub if r.get("gate") == "yes"), "with_footpath": sum(1 for r in pub if (r.get("answers") or {}).get("i1") == "yes"),
            "full": sum(1 for r in pub if r["mode"] == "full"), "verified": sum(1 for r in pub if r.get("verified")),
            "first": min((r["created_at"] for r in pub), default=None), "last": max((r["created_at"] for r in pub), default=None)}
def group(key):
    pub = [r for r in ROWS.values() if r["status"] == "published"]; out = {}
    for r in pub:
        k = (r.get(key) or ("Unspecified" if key == "sector" else "unknown")); g = out.setdefault(k, {key: k, "checks": 0, "gate_tested": 0, "gate_pass": 0, "with_footpath": 0, "full_checks": 0, "verified": 0})
        g["checks"] += 1; g["gate_tested"] += 1 if r.get("gate") else 0; g["gate_pass"] += 1 if r.get("gate") == "yes" else 0
        g["with_footpath"] += 1 if (r.get("answers") or {}).get("i1") == "yes" else 0; g["full_checks"] += 1 if r["mode"] == "full" else 0; g["verified"] += 1 if r.get("verified") else 0
    return sorted(out.values(), key=lambda g: -g["checks"])

class H(BaseHTTPRequestHandler):
    def log_message(self, f, *a): sys.stderr.write("%s %s\n" % (self.command, self.path))
    def cors(self):
        self.send_header("Access-Control-Allow-Origin", "*"); self.send_header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "apikey,authorization,content-type,prefer,range,range-unit,x-upsert,cache-control"); self.send_header("Access-Control-Expose-Headers", "content-range")
    def send(self, code, body=None, ctype="application/json"):
        data = b"" if body is None else (body if isinstance(body, bytes) else json.dumps(body).encode())
        self.send_response(code); self.cors(); self.send_header("Content-Type", ctype); self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data)
    def email(self):
        t = (self.headers.get("Authorization") or "").replace("Bearer ", ""); return TOKENS.get(t)
    def mod(self): return self.email() in MODS
    def body(self):
        n = int(self.headers.get("Content-Length") or 0); return self.rfile.read(n) if n else b""
    def jbody(self):
        b = self.body(); return json.loads(b) if b else {}
    def do_OPTIONS(self): self.send(204)
    def do_GET(self):
        u = urllib.parse.urlsplit(self.path); q = urllib.parse.parse_qs(u.query); p = u.path
        if p == "/rest/v1/rpc/public_stats": return self.send(200, stats())
        if p == "/rest/v1/public_checks":
            rows = [public(r) for r in ROWS.values() if r["status"] == "published"]
            if "id" in q: rows = [r for r in rows if r["id"] == q["id"][0].replace("eq.", "")]
            sel = q.get("select", ["*"])[0]
            if sel != "*" and any(c not in PUBLIC_COLS for c in sel.split(",")): return self.send(400, {"message": "column does not exist"})
            rows.sort(key=lambda r: r["created_at"], reverse=True); return self.send(200, rows)
        if p == "/rest/v1/public_sector_stats": return self.send(200, group("sector"))
        if p == "/rest/v1/public_owner_stats": return self.send(200, [{k: v for k, v in g.items() if k in ("owner", "checks", "gate_tested", "gate_pass")} for g in group("owner")])
        if p == "/rest/v1/checks":
            if not self.mod(): return self.send(401 if not self.email() else 403, {"message": "permission denied for table checks"})
            rows = list(ROWS.values())
            if "status" in q: rows = [r for r in rows if r["status"] == q["status"][0].replace("eq.", "")]
            rows.sort(key=lambda r: r["created_at"], reverse=True); return self.send(200, rows)
        if p == "/rest/v1/moderators": return self.send(401 if not self.email() else 403, {"message": "permission denied"})
        if p.startswith("/storage/v1/object/authenticated/photos/"):
            key = p[len("/storage/v1/object/authenticated/photos/"):]
            if key not in FILES: return self.send(404, {"message": "Object not found"})
            if not (self.mod() or key.startswith("published/")): return self.send(403, {"message": "new row violates row-level security policy"})
            ct, data = FILES[key]; return self.send(200, data, ct)
        if p.startswith("/storage/v1/object/public/"): return self.send(400, {"message": "Bucket not public"})
        return self.send(404, {"message": "not found"})
    def do_POST(self):
        u = urllib.parse.urlsplit(self.path); q = urllib.parse.parse_qs(u.query); p = u.path
        if p == "/auth/v1/otp":
            em = self.jbody().get("email", "").lower(); tok = jwt(em); TOKENS[tok] = em; rt = "r-" + uuid.uuid4().hex; TOKENS[rt] = em
            print(f"\n*** MAGIC LINK for {em}:\n{q.get('redirect_to', ['http://localhost:8815/moderate.html'])[0]}#access_token={tok}&refresh_token={rt}&expires_in=3600&token_type=bearer&type=magiclink\n", flush=True); return self.send(200, {})
        if p == "/auth/v1/token":
            rt = self.jbody().get("refresh_token"); em = TOKENS.get(rt)
            if not em: return self.send(400, {"error": "invalid_grant"})
            tok = jwt(em); TOKENS[tok] = em; return self.send(200, {"access_token": tok, "refresh_token": rt, "expires_in": 3600, "token_type": "bearer"})
        if p == "/auth/v1/logout": return self.send(204)
        if p == "/rest/v1/rpc/is_moderator":
            if not self.email(): return self.send(401, {"message": "permission denied for function is_moderator"})
            return self.send(200, self.mod())
        if p == "/rest/v1/checks":
            r = self.jbody(); prefer = self.headers.get("Prefer", "")
            if self.email() and not self.mod(): return self.send(403, {"message": "permission denied"})
            if r.get("status", "pending") not in ("pending", "test") or r.get("consent") is not True or r.get("verified") or r.get("moderated_at"):
                return self.send(403, {"message": "new row violates row-level security policy for table \"checks\""})
            if r.get("lat") is not None and not (6 <= r["lat"] <= 38): return self.send(400, {"message": "new row violates check constraint"})
            if r.get("lat") is None and not r.get("road"): return self.send(400, {"message": "new row violates check constraint \"checks_has_place\""})
            row = {"id": r.get("id") or str(uuid.uuid4()), "created_at": now(), "method": "footpath-check-v1.2", "answers": {}, "obs": {}, "photo_count": 0, "verified": False, "status": "pending", "moderated_at": None, "moderated_by": None, "mod_note": None}
            row.update({k: v for k, v in r.items() if k not in ("created_at",)}); ROWS[row["id"]] = row
            if "representation" in prefer: return self.send(401, {"message": "permission denied for table checks"})
            return self.send(201)
        if p.startswith("/storage/v1/object/photos/"):
            key = p[len("/storage/v1/object/photos/"):]; ct = self.headers.get("Content-Type", "")
            if not key.startswith("pending/") and not self.mod(): return self.send(403, {"message": "new row violates row-level security policy"})
            if not re.match(r"image/(jpeg|png|webp|heic|heif)", ct): return self.send(415, {"message": "mime type not supported"})
            data = self.body()
            if len(data) > 3145728: return self.send(413, {"message": "object exceeded maximum size"})
            FILES[key] = (ct, data); return self.send(200, {"Key": "photos/" + key})
        if p == "/storage/v1/object/list/photos":
            pre = self.jbody().get("prefix", "").strip("/")
            names = sorted({k[len(pre) + 1:].split("/")[0] for k in FILES if k.startswith(pre + "/")}) if pre else []
            if not self.mod(): names = [n for n in names if pre.startswith("published/") or pre == "published"]
            return self.send(200, [{"name": n, "id": uuid.uuid4().hex} for n in names])
        if p == "/storage/v1/object/move":
            if not self.mod(): return self.send(403, {"message": "permission denied"})
            b = self.jbody(); src, dst = b["sourceKey"], b["destinationKey"]
            if src not in FILES: return self.send(404, {"message": "Object not found"})
            FILES[dst] = FILES.pop(src); return self.send(200, {"message": "Successfully moved"})
        return self.send(404, {"message": "not found"})
    def do_PATCH(self):
        u = urllib.parse.urlsplit(self.path); q = urllib.parse.parse_qs(u.query)
        if u.path == "/rest/v1/checks":
            if not self.mod(): return self.send(200 if self.email() else 401, [] if self.email() else {"message": "permission denied for table checks"})
            rid = q.get("id", [""])[0].replace("eq.", ""); r = ROWS.get(rid)
            if not r: return self.send(200, [])
            patch = self.jbody(); allowed = {"status", "verified", "moderated_at", "moderated_by", "mod_note"}
            if set(patch) - allowed: return self.send(403, {"message": "permission denied for column"})
            r.update(patch); return self.send(200, [r] if "representation" in self.headers.get("Prefer", "") else None) if "representation" in self.headers.get("Prefer", "") else self.send(204)
        return self.send(404, {"message": "not found"})
    def do_DELETE(self):
        u = urllib.parse.urlsplit(self.path); q = urllib.parse.parse_qs(u.query)
        if u.path == "/rest/v1/checks":
            if not self.mod(): return self.send(401, {"message": "permission denied for table checks"})
            rid = q.get("id", [""])[0].replace("eq.", ""); r = ROWS.get(rid)
            if not r or r["status"] not in ("test", "rejected"): return self.send(200, [])
            del ROWS[rid]; return self.send(200, [r])
        if u.path == "/storage/v1/object/photos":
            if not self.mod(): return self.send(401, {"message": "permission denied"})
            pre = self.jbody().get("prefixes", []); gone = [k for k in pre if FILES.pop(k, None)]; return self.send(200, [{"name": k} for k in gone])
        return self.send(404, {"message": "not found"})

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8816
    print(f"mock record on http://127.0.0.1:{port}  (moderators: {', '.join(sorted(MODS))})", flush=True)
    ThreadingHTTPServer(("127.0.0.1", port), H).serve_forever()
