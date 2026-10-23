#!/usr/bin/env python3
"""One-off, build-time geometry for src/roads.json: the Gurugram roads on Haryana's "30-day challenge" list.

    python3 tools/roads_geocode.py            # writes src/roads.json (uses tools/.roads-cache/ so re-runs make no calls)
    python3 tools/roads_geocode.py --refresh  # ignore the cache

The pages never call any of these hosts; the coordinates are baked into src/roads.json and inlined at build time.
Sources used once, politely (one request a second, a descriptive User-Agent):
  Nominatim (sector boundaries and landmarks), Overpass (named ways), OSRM demo router (routes between two landmarks).
Every geometry is approximate (OpenStreetMap, 4-decimal rounding, about 10 m) and is flagged with how it was made:
  boundary  the shared edge of two sector polygons in OSM (sector-dividing roads run along it)
  facing    one polygon only: its edge that faces the other sector's centre
  route     an OSRM driving route between two named landmarks
  way       OSM ways carrying the road's name, stitched
  none      not resolved; the road stays on the list without a line
The road list itself (names, agency, kind) comes from the press record cited in ROADS below; see src/roads.json "frame".
"""
import argparse, hashlib, json, math, pathlib, subprocess, sys, time, urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = ROOT / "tools" / ".roads-cache"
UA = "righttowalk-build/0.1 (deepanshu@crashfreeindia.org; one-off build-time lookup, cached)"
VIEWBOX = "76.85,28.35,77.25,28.65"
LAT0 = 28.45
MLAT, MLON = 111132.0, 111132.0 * math.cos(math.radians(LAT0))

HT = "Hindustan Times, 12 Oct 2026, 'GMDA identifies 27 roads for repair under 30-day challenge' (Abhishek Behl; quoting Amit Godara, Executive Engineer, GMDA), https://www.hindustantimes.com/cities/gurugram-news/gmda-identifies-27-roads-for-repair-under-30-day-challenge-101791746544459.html"
LAUNCH = "Directions of Rajesh Khullar, Chief Principal Secretary to the Chief Minister, meeting with GMDA, MCG and HSVP at the PWD Rest House, Gurugram, 8 Oct 2026 (DIPRO Gurugram press note; reported by HT, ToI, Tribune, Jagran, Bhaskar on 8 and 9 Oct 2026)"

# geometry recipes: ("boundary", A, B) | ("facing", polygonSector, otherSector) | ("route", fromLandmark, toLandmark) | ("way", nameRegex) | ("none",)
ROADS = [
 # 20 master roads (HT, 12 Oct 2026)
 dict(id="gmda-m01", name="Golf Course Road to Ghata", agency="gmda", kind="master", geo=("route", "Sector 55-56 Metro", "Ghata"), note="Read as the master road east from the end of Golf Course Road (Sector 55-56 metro station) to Ghata on the Gurugram-Faridabad road; the exact ends were not stated."),
 dict(id="gmda-m02", name="Medicity Road", agency="gmda", kind="master", geo=("way", "^Chowdhury Baktawar Singh Road$"), note="OSM names the road past Medanta The Medicity 'Chowdhury Baktawar Singh Road'; taken as the whole named road."),
 dict(id="gmda-m03", name="Sector 75/76 dividing road", agency="gmda", kind="master", geo=("equidistant", "75", "76"), note="Sectors 75 and 76 have no boundary in OpenStreetMap and no road between them could be picked out with confidence, so no line is drawn; walk it as signed on the ground."),
 dict(id="gmda-m04", name="Ardee City to Ambedkar Road", agency="gmda", kind="master", geo=("route", "Ardee City", "Ambedkar Chowk"), note="Routed from Ardee City (Sector 52) to Dr Ambedkar Chowk on Vikas Marg."),
 dict(id="gmda-m05", name="Ambedkar Road to Mayfield Garden", agency="gmda", kind="master", geo=("route", "Ambedkar Chowk", "Mayfield Garden"), note="Routed from Dr Ambedkar Chowk to Mayfield Garden (Sector 51)."),
 dict(id="gmda-m06", name="Sector 50/51 dividing road", agency="gmda", kind="master", geo=("boundary", "50", "51")),
 dict(id="gmda-m07", name="Sector 65/66 dividing road", agency="gmda", kind="master", geo=("boundary", "65", "66"), tender="GMDA tenders 'along dividing road of Sec 65/66 and 66/67' (2026_HRY_554050_1, DNIT 13 Oct 2026)"),
 dict(id="gmda-m08", name="Sector 51/57 dividing road", agency="gmda", kind="master", geo=("boundary", "51", "57"), tender="GMDA tender 'Special repair of service road along the sector 51/57 dividing master road' (2026_HRY_513741_1, DNIT 8 Apr 2026)"),
 dict(id="gmda-m09", name="Rezang La Chowk to the Delhi border", agency="gmda", kind="master", geo=("route", "Rezang La Chowk", "Delhi border (Dwarka road)"), clip="delhi", note="The road north from Rezang La Chowk (Sector 23 / Palam Vihar) to the Delhi border towards Dwarka, cut at the state boundary."),
 dict(id="gmda-m10", name="Sector 30/31 dividing road", agency="gmda", kind="master", geo=("boundary", "30", "31")),
 dict(id="gmda-m11", name="Sector 32/39 dividing road", agency="gmda", kind="master", geo=("boundary", "32", "39"), tender="GMDA tender 'Special repair of master road dividing sector 32/39' (2026_HRY_555082_1, DNIT 17 Oct 2026)"),
 dict(id="gmda-m12", name="Sector 39/40 dividing road", agency="gmda", kind="master", geo=("boundary", "39", "40")),
 dict(id="gmda-m13", name="Sector 30/41 dividing road", agency="gmda", kind="master", geo=("boundary", "30", "41")),
 dict(id="gmda-m14", name="Sector 45/46 dividing road", agency="gmda", kind="master", geo=("boundary", "45", "46")),
 dict(id="gmda-m15", name="Sector 46/47 dividing road", agency="gmda", kind="master", geo=("boundary", "46", "47")),
 dict(id="gmda-m16", name="Sector 21/22 road", agency="gmda", kind="master", geo=("boundary", "21", "22")),
 dict(id="gmda-m17", name="Signature Tower Chowk to Atul Kataria Chowk, first half", agency="gmda", kind="master", geo=("route", "Signature Tower Chowk", "Atul Kataria Chowk"), half=1, note="HT lists 'Signature Chowk to Atul Kataria Chowk (in two parts)'; the parts were not described, so the routed road is split at half its length."),
 dict(id="gmda-m18", name="Signature Tower Chowk to Atul Kataria Chowk, second half", agency="gmda", kind="master", geo=("route", "Signature Tower Chowk", "Atul Kataria Chowk"), half=2, note="Second part of 'Signature Chowk to Atul Kataria Chowk', split at half its length."),
 dict(id="gmda-m19", name="Rampura Road (Sectors 85 and 86)", agency="gmda", kind="master", geo=("boundary", "85", "86"), note="Taken as the Sector 85/86 dividing road, which leads to Rampura village."),
 dict(id="gmda-m20", name="Sector 75/75A dividing road", agency="gmda", kind="master", geo=("facing", "75A", "75"), note="Sector 75 has no boundary in OSM; the line is the edge of Sector 75A that faces Sector 75. HT's list ends with 'dividing roads in Sectors 75/75A and 75/76'; 75/76 is counted once."),
 # 7 iconic roads (HT, 12 Oct 2026)
 dict(id="gmda-i01", name="MG Road, IFFCO Chowk to Sikanderpur Metro", agency="gmda", kind="iconic", geo=("route", "IFFCO Chowk", "Sikanderpur Metro Station")),
 dict(id="gmda-i02", name="Sector 27/28 dividing road", agency="gmda", kind="iconic", geo=("facing", "28", "27"), note="Sector 27 has no boundary in OSM; the line is the edge of Sector 28 that faces Sector 27."),
 dict(id="gmda-i03", name="Sector 27/43 dividing road", agency="gmda", kind="iconic", geo=("facing", "43", "27"), note="Sector 27 has no boundary in OSM; the line is the edge of Sector 43 that faces Sector 27.", tender="GMDA tender 'along master road between Sector 27/43' (2026_HRY_553815_1, DNIT 12 Oct 2026)"),
 dict(id="gmda-i04", name="Signature Tower to Millennium City Centre", agency="gmda", kind="iconic", geo=("route", "Signature Tower Chowk", "Millennium City Centre Metro")),
 dict(id="gmda-i05", name="Sanath Road", agency="gmda", kind="iconic", geo=("none",), note="No road of this name could be found in OpenStreetMap or Nominatim (also tried 'Sanat'). Ask GMDA which road this is before assigning it."),
 dict(id="gmda-i06", name="AIT Chowk to Sikanderpur Metro (Golf Course Road)", agency="gmda", kind="iconic", geo=("route", "AIT Chowk", "Sikanderpur Metro Station")),
 dict(id="gmda-i07", name="Sikanderpur Metro to Cyber Hub", agency="gmda", kind="iconic", geo=("route", "Sikanderpur Metro Station", "Cyber Hub"), note="Runs along DLF Phase 2/3 frontage; part of the carriageway may be the coloniser's. Agency per HT is GMDA."),
]

# landmarks: Nominatim query, or fixed coordinates where Nominatim has nothing (from OSM, read by hand on 23 Oct 2026)
LANDMARKS = {
 "AIT Chowk": "AIT Chowk, Gurugram",
 "Sector 55-56 Metro": "Sector 55 56 Metro Station, Gurugram",
 "Ghata": ("Ghata", None),                       # filled from Overpass place node below, else fixed
 "Ardee City": "Ardee City, Gurugram",
 "Ambedkar Chowk": "Ambedkar Chowk, Gurugram",
 "Mayfield Garden": "Mayfield Garden, Gurugram",
 "Rezang La Chowk": "Rezang La Chowk, Gurugram",
 "Delhi border (Dwarka road)": ("fixed", None),  # northern end of the OSM way named 'Rezang La Chowk', see resolve()
 "Signature Tower Chowk": "Signature Tower Chowk",
 "Atul Kataria Chowk": ("overpass", "Atul Kataria"),
 "IFFCO Chowk": "IFFCO Chowk, Gurugram",
 "Sikanderpur Metro Station": "Sikanderpur Metro Station",
 "Millennium City Centre Metro": "HUDA City Centre",
 "Cyber Hub": "Cyber Hub, Gurugram",
}
SECTORS = ["21", "22", "28", "30", "31", "32", "39", "40", "41", "43", "45", "46", "47", "50", "51", "57", "65", "66", "75A", "85", "86"]
CENTROIDS_ONLY = {"27": "Sector 27, Gurugram", "75": "Sector 75, Gurugram", "76": "Sector 76, Gurugram"}

# ---------------- fetching with a cache ----------------
def cached(key, fn, refresh=False):
    CACHE.mkdir(exist_ok=True)
    p = CACHE / (hashlib.sha1(key.encode()).hexdigest() + ".json")
    if p.exists() and not refresh:
        return json.loads(p.read_text())
    data = fn()
    p.write_text(json.dumps(data))
    time.sleep(1.1)
    return data

def curl(url, data=None):
    cmd = ["curl", "-sS", "-A", UA, "--max-time", "180", url]
    if data is not None:
        cmd += ["--data-urlencode", "data=" + data]
    for attempt in range(4):
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode:
            raise RuntimeError(r.stderr.strip())
        try:
            return json.loads(r.stdout)
        except ValueError:
            print("   (non-JSON reply, waiting before retry)", r.stdout[:120].replace("\n", " "), flush=True)
            time.sleep(15 * (attempt + 1))
    raise RuntimeError("no JSON reply from " + url)

def nominatim(q, polygon=False, refresh=False):
    params = {"q": q, "format": "jsonv2", "limit": 5, "viewbox": VIEWBOX, "bounded": 1}
    if polygon:
        params["polygon_geojson"] = 1
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(params)
    return cached("nominatim:" + url, lambda: curl(url), refresh)

def overpass(q, refresh=False):
    return cached("overpass:" + q, lambda: curl("https://overpass-api.de/api/interpreter", q), refresh)

def osrm(a, b, refresh=False):
    url = f"https://router.project-osrm.org/route/v1/driving/{a[1]},{a[0]};{b[1]},{b[0]}?overview=full&geometries=geojson&steps=false"
    return cached("osrm:" + url, lambda: curl(url), refresh)

# ---------------- geometry helpers (lat, lon) ----------------
def xy(p): return ((p[1] - 77.0) * MLON, (p[0] - LAT0) * MLAT)
def dist(a, b):
    ax, ay = xy(a); bx, by = xy(b); return math.hypot(ax - bx, ay - by)
def seg_dist(p, a, b):
    px, py = xy(p); ax, ay = xy(a); bx, by = xy(b)
    dx, dy = bx - ax, by - ay
    if dx == dy == 0: return math.hypot(px - ax, py - ay)
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))
def length(pts): return sum(dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1))
def simplify(pts, tol=6.0):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]; imax, dmax = 0, 0
    for i in range(1, len(pts) - 1):
        d = seg_dist(pts[i], a, b)
        if d > dmax: imax, dmax = i, d
    if dmax > tol:
        return simplify(pts[:imax + 1], tol)[:-1] + simplify(pts[imax:], tol)
    return [a, b]
def rnd(pts): return [[round(p[0], 4), round(p[1], 4)] for p in pts]
def ring_of(gj):
    if gj["type"] == "Polygon": ring = gj["coordinates"][0]
    else: ring = max((poly[0] for poly in gj["coordinates"]), key=len)
    return [(c[1], c[0]) for c in ring]
def centroid(ring):
    return (sum(p[0] for p in ring) / len(ring), sum(p[1] for p in ring) / len(ring))
def longest_run(flags):
    """longest cyclic run of True (gaps of one allowed); returns the index list in order"""
    n = len(flags); best = []
    if not any(flags): return best
    start = next(i for i in range(n) if not flags[i]) if not all(flags) else 0
    run, gap = [], 0
    for k in range(n + 1):
        i = (start + k) % n
        if flags[i]: run.append(i); gap = 0
        elif run and gap == 0 and k < n: gap = 1; run.append(i)
        else:
            if run and gap == 1: run.pop()
            if len(run) > len(best): best = run
            run, gap = [], 0
    if run and gap == 1: run.pop()
    if len(run) > len(best): best = run
    return best
def shared_boundary(ringA, ringB, tol=30.0):
    flags = [min(seg_dist(v, ringB[j], ringB[j + 1]) for j in range(len(ringB) - 1)) < tol for v in ringA]
    idx = longest_run(flags)
    return [ringA[i] for i in idx]
def facing_edge(ring, cA, cB):
    ax, ay = xy(cA); bx, by = xy(cB); L = math.hypot(bx - ax, by - ay); ux, uy = (bx - ax) / L, (by - ay) / L
    flags = []
    for v in ring:
        vx, vy = xy(v); t = ((vx - ax) * ux + (vy - ay) * uy) / L
        flags.append(0.35 <= t <= 0.7)
    idx = longest_run(flags)
    return [ring[i] for i in idx]
def seg_x(p, q, a, b):
    """intersection point of segments p-q and a-b (lat,lon), or None"""
    px, py = xy(p); qx, qy = xy(q); ax, ay = xy(a); bx, by = xy(b)
    d = (qx - px) * (by - ay) - (qy - py) * (bx - ax)
    if abs(d) < 1e-9: return None
    t = ((ax - px) * (by - ay) - (ay - py) * (bx - ax)) / d
    u = ((ax - px) * (qy - py) - (ay - py) * (qx - px)) / d
    if 0 <= t <= 1 and 0 <= u <= 1: return (p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1]))
    return None
def clip_at(pts, lines):
    """cut a route at its first crossing of any of the boundary lines"""
    for i in range(len(pts) - 1):
        for ln in lines:
            for j in range(len(ln) - 1):
                x = seg_x(pts[i], pts[i + 1], ln[j], ln[j + 1])
                if x: return pts[:i + 1] + [x]
    return pts
def unloop(pts):
    """a stitched dual carriageway comes back to its start: keep the first half"""
    if len(pts) > 3 and dist(pts[0], pts[-1]) < 80:
        tot = length(pts); acc = 0
        for i in range(len(pts) - 1):
            acc += dist(pts[i], pts[i + 1])
            if acc >= tot / 2: return pts[:i + 2]
    return pts
def trim_detours(pts):
    """drop a leading U-turn (points farther from the end than the start is) and a trailing overshoot"""
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]; d0 = dist(a, b)
    i = 0
    while i < len(pts) - 2 and dist(pts[i + 1], b) > d0 + 40: i += 1
    pts = [a] + pts[i + 1:] if i else pts
    j = len(pts) - 1
    while j > 1 and dist(pts[j - 1], a) > dist(pts[-1], a) + 40: j -= 1
    pts = pts[:j] + [pts[-1]] if j < len(pts) - 1 else pts
    return pts
def trim_corners(pts):
    """a facing edge picks up the corner bits of the adjacent edges: drop a short first/last leg that turns sharply"""
    def ang(a, b, c):
        ax, ay = xy(a); bx, by = xy(b); cx, cy = xy(c)
        v1, v2 = (bx - ax, by - ay), (cx - bx, cy - by)
        n = math.hypot(*v1) * math.hypot(*v2)
        return math.degrees(math.acos(max(-1, min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / n)))) if n else 0
    for _ in range(2):
        if len(pts) > 2 and dist(pts[0], pts[1]) < 320 and ang(pts[0], pts[1], pts[2]) > 55: pts = pts[1:]
        if len(pts) > 2 and dist(pts[-2], pts[-1]) < 320 and ang(pts[-3], pts[-2], pts[-1]) > 55: pts = pts[:-1]
    return pts
def stitch(ways):
    """join OSM ways (lists of points) end to end into the longest chain"""
    ways = [list(w) for w in ways if len(w) > 1]
    if not ways: return []
    chain = ways.pop(0); changed = True
    while changed and ways:
        changed = False
        for w in list(ways):
            if dist(chain[-1], w[0]) < 15: chain += w[1:]
            elif dist(chain[-1], w[-1]) < 15: chain += w[::-1][1:]
            elif dist(chain[0], w[-1]) < 15: chain = w[:-1] + chain
            elif dist(chain[0], w[0]) < 15: chain = w[::-1][:-1] + chain
            else: continue
            ways.remove(w); changed = True
    return chain

# ---------------- resolve ----------------
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--refresh", action="store_true"); args = ap.parse_args()
    R = args.refresh
    rings, centres = {}, {}
    for s in SECTORS:
        res = nominatim(f"Sector {s}, Gurugram", polygon=True, refresh=R)
        hit = next((r for r in res if r.get("geojson", {}).get("type") in ("Polygon", "MultiPolygon")), None)
        if not hit: print("!! no polygon for sector", s); continue
        rings[s] = ring_of(hit["geojson"]); centres[s] = centroid(rings[s])
    for s, q in CENTROIDS_ONLY.items():
        res = nominatim(q, refresh=R)
        if res: centres[s] = (float(res[0]["lat"]), float(res[0]["lon"]))
        else: print("!! no centre for sector", s)
    # landmarks
    L = {}
    ov = overpass('[out:json][timeout:120];(node["name"~"Atul Kataria|MDI Chowk|Ghata",i](28.40,76.95,28.55,77.16);way["name"~"Ghata",i](28.40,77.08,28.46,77.16);node["place"]["name"~"^Ghata",i](28.40,77.08,28.46,77.16););out tags geom;', refresh=R)
    nodes = [e for e in ov.get("elements", []) if e["type"] == "node"]
    for key, q in LANDMARKS.items():
        if isinstance(q, str):
            res = nominatim(q, refresh=R)
            if res: L[key] = (float(res[0]["lat"]), float(res[0]["lon"]))
        elif q[0] == "overpass":
            hit = next((n for n in nodes if q[1].lower() in n["tags"].get("name", "").lower()), None)
            if hit: L[key] = (hit["lat"], hit["lon"])
    # Ghata: a place node if OSM has one; else the Gurugram-Faridabad road junction at Ghata, read from OSM by hand
    gh = next((n for n in nodes if n["tags"].get("name", "").lower().startswith("ghata")), None)
    L["Ghata"] = (gh["lat"], gh["lon"]) if gh else (28.4252, 77.1222)
    # Delhi border on the Dwarka road: route towards the Dwarka Sector 21 underpass, clipped at the Delhi state boundary (below)
    dw = overpass('[out:json][timeout:60];way["name"~"Dwarka Sector 21 Underpass"](28.50,77.02,28.56,77.08);out geom;', refresh=R)
    pts = [(g["lat"], g["lon"]) for w in dw.get("elements", []) for g in w.get("geometry", [])]
    L["Delhi border (Dwarka road)"] = max(pts, key=lambda p: p[0]) if pts else (28.5400, 77.0500)
    db = overpass('[out:json][timeout:120];rel["boundary"="administrative"]["admin_level"="4"]["name"="Delhi"];way(r)(28.49,77.00,28.56,77.10);out geom;', refresh=R)
    BORDER = [[(g["lat"], g["lon"]) for g in w.get("geometry", [])] for w in db.get("elements", []) if w["type"] == "way"]
    print("Delhi border ways in the Dwarka-road window:", len(BORDER))
    # fixed fallbacks for landmarks Nominatim/Overpass lack (read from OSM by hand, 23 Oct 2026)
    L.setdefault("Atul Kataria Chowk", (28.4783, 77.0337))
    for k, v in L.items(): print(f"landmark {k:32s} {v[0]:.4f}, {v[1]:.4f}")
    # equidistant road for 75/76 from Overpass highways
    hw = overpass('[out:json][timeout:120];way["highway"~"primary|secondary|tertiary|unclassified"](28.380,76.975,28.410,77.020);out tags geom;', refresh=R)
    print("highways near Sectors 75/76:", sorted({(w["tags"].get("name"), w["tags"].get("highway")) for w in hw.get("elements", [])}, key=str))

    out = []
    for rd in ROADS:
        g = rd["geo"]; pts = []; how = "none"
        try:
            if g[0] == "boundary" and g[1] in rings and g[2] in rings:
                pts = shared_boundary(rings[g[1]], rings[g[2]]); how = "boundary"
                if len(pts) < 2: pts = trim_corners(facing_edge(rings[g[1]], centres[g[1]], centres[g[2]])); how = "facing"
            elif g[0] == "facing" and g[1] in rings and g[2] in centres:
                pts = trim_corners(facing_edge(rings[g[1]], centres[g[1]], centres[g[2]])); how = "facing"
            elif g[0] == "route" and g[1] in L and g[2] in L:
                j = osrm(L[g[1]], L[g[2]], refresh=R)
                pts = [(c[1], c[0]) for c in j["routes"][0]["geometry"]["coordinates"]]; how = "route"
                if rd.get("clip") == "delhi": pts = clip_at(pts, BORDER)
                pts = trim_detours(pts)
                if rd.get("half"):  # first or second half of the route by length
                    tot = length(pts); acc = 0; cut = len(pts) - 1
                    for i in range(len(pts) - 1):
                        acc += dist(pts[i], pts[i + 1])
                        if acc >= tot / 2: cut = i + 1; break
                    pts = pts[:cut + 1] if rd["half"] == 1 else pts[cut:]
            elif g[0] == "way":
                ov2 = overpass(f'[out:json][timeout:120];way["highway"]["name"~"{g[1]}"](28.36,76.90,28.56,77.16);out geom;', refresh=R)
                ways = [[(p["lat"], p["lon"]) for p in w.get("geometry", [])] for w in ov2.get("elements", [])]
                pts = trim_detours(unloop(stitch(ways))); how = "way"
            elif g[0] == "equidistant" and g[1] in centres and g[2] in centres:
                cA, cB = centres[g[1]], centres[g[2]]
                ax, ay = xy(cA); bx, by = xy(cB); Ld = math.hypot(bx - ax, by - ay); ux, uy = (bx - ax) / Ld, (by - ay) / Ld
                cand = []
                for w in hw.get("elements", []):
                    wp = [(p["lat"], p["lon"]) for p in w.get("geometry", [])]
                    if len(wp) < 2: continue
                    mid = ((cA[0] + cB[0]) / 2, (cA[1] + cB[1]) / 2)
                    ok = sum(1 for p in wp if abs(dist(p, cA) - dist(p, cB)) < 0.15 * (dist(p, cA) + dist(p, cB)) and dist(p, mid) < 0.6 * Ld)
                    if ok / len(wp) > 0.8:
                        cand.append(wp); print("   75/76 candidate", w["tags"].get("highway"), w["tags"].get("name"), rnd(wp)[:1], rnd(wp)[-1:], int(length(wp)), "m")
                pts = stitch(cand); how = "equidistant"
        except Exception as e:
            print("!! geometry failed for", rd["id"], e)
        pts = rnd(simplify(pts, 6.0)) if pts else []
        if len(pts) > 60: pts = rnd(simplify([tuple(p) for p in pts], 12.0))
        if how == "facing" and pts: pts = rnd(trim_corners([tuple(p) for p in pts]))
        row = {"id": rd["id"], "name": rd["name"], "agency": rd["agency"], "kind": rd["kind"],
               "source": HT + (("; " + rd["tender"]) if rd.get("tender") else ""), "geo": how if pts else "none",
               "length_m": int(round(length([tuple(p) for p in pts]))) if len(pts) > 1 else None, "pts": pts}
        if rd.get("note"): row["note"] = rd["note"]
        out.append(row)
        print(f"{rd['id']}  {how:11s} {len(pts):3d} pts  {row['length_m'] or 0:6d} m  {rd['name']}")
    doc = {
        "frame": {
            "title": "Haryana's 30-day challenge: 100 Gurugram roads by 7 November 2026",
            "total": 100, "listed": len(out), "deadline": "2026-11-07",
            "what": "On 8 October 2026 Rajesh Khullar, Chief Principal Secretary to the Chief Minister, directed GMDA, MCG and HSVP to identify 100 roads of at least 500 m each in poor condition and upgrade them by 7 November 2026 (recarpeting, end-to-end paving, streetlights, lane marking, footpaths, signage, encroachment removal), with a QR-coded board on each road naming the department, the officer and the dates, and a signed weekly scorecard in the newspapers every Saturday. Ten of the roads are to be 'iconic'.",
            "status": "As of 23 October 2026 only GMDA's share is public: 27 stretches (20 master roads, 7 iconic roads) reported by the Hindustan Times on 12 October. The MCG and HSVP shares, the QR boards and the weekly scorecards could not be found in any public source.",
            "sources": [LAUNCH, HT,
                        "GMDA tenders page (gmda.gov.in/tenders.html), read 23 Oct 2026: special-repair tenders for several listed roads, e.g. 'Special repair of master road dividing sector 32/39' (2026_HRY_555082_1, DNIT 17 Oct 2026)"],
            "geometry": "OpenStreetMap (ODbL) via Nominatim, Overpass and the OSRM demo router, looked up once at build time on 23 Oct 2026 by tools/roads_geocode.py; lines are approximate (about 10 m) and the ends of several stretches were not stated by the source. Each road carries a 'geo' field saying how its line was made.",
            "built": time.strftime("%Y-%m-%d"),
        },
        "roads": out,
    }
    (ROOT / "src" / "roads.json").write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("wrote src/roads.json:", len(out), "roads,", sum(1 for r in out if r["pts"]), "with a line")

if __name__ == "__main__":
    main()
