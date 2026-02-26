# DXF Scanner - ezdxf required (pip install ezdxf)
"""
DXF Fittings Scanner
====================
Parses DXF files to detect BLOCK INSERT entities representing electrical
and plumbing fittings. Maps block names to standard fitting types and
spatially assigns each fitting to rooms via point-in-polygon testing.

Usage:
    from server.dxf_scanner import scan_dxf_fittings

    result = scan_dxf_fittings("path/to/file.dxf", rooms)
    # result = {
    #   "room_uid": { "lights": 3, "sockets": 5, ... },
    #   ...
    # }
"""

import os
import re
import json
from typing import Dict, List, Optional, Tuple
from collections import defaultdict

def _safe_str(s):
    """Encode string safely for Windows console output."""
    if isinstance(s, str):
        return s.encode('ascii', errors='replace').decode('ascii')
    return str(s)

try:
    import ezdxf
except ImportError:
    ezdxf = None


# =============================================
# BLOCK NAME → FITTING TYPE DICTIONARY
# =============================================
# Patterns are matched case-insensitively.
# Order matters: first match wins.

BLOCK_PATTERNS = [
    # Electrical — Lights
    (r"LIGHT",           "lights"),
    (r"LAMP",            "lights"),
    (r"LUMINAIRE",       "lights"),
    (r"DOWNLIGHT",       "lights"),
    (r"SPOTLIGHT",       "lights"),
    (r"PENDANT",         "lights"),
    (r"CEILING_ROSE",    "lights"),
    (r"BULKHEAD",        "lights"),

    # Electrical — Sockets
    (r"SOCKET",          "sockets"),
    (r"OUTLET",          "sockets"),
    (r"DB_SOCKET",       "sockets"),
    (r"DOUBLE_SOCKET",   "sockets"),
    (r"SINGLE_SOCKET",   "sockets"),
    (r"USB_SOCKET",      "sockets"),
    (r"FUSED_SPUR",      "sockets"),

    # Electrical — Switches
    (r"SWITCH",          "switches"),
    (r"DIMMER",          "switches"),
    (r"2_GANG",          "switches"),
    (r"1_GANG",          "switches"),

    # Electrical — Extractor Fans
    (r"FAN",             "extractor_fans"),
    (r"EXTRACTOR",       "extractor_fans"),
    (r"EXTRACT",         "extractor_fans"),
    (r"VENT_FAN",        "extractor_fans"),

    # Electrical — Smoke / Fire
    (r"SMOKE",           "smoke_alarms"),
    (r"FIRE_ALARM",      "smoke_alarms"),
    (r"DETECTOR",        "smoke_alarms"),
    (r"CO_ALARM",        "smoke_alarms"),

    # Electrical — Data
    (r"DATA",            "data_points"),
    (r"CAT[56]",         "data_points"),
    (r"ETHERNET",        "data_points"),
    (r"RJ45",            "data_points"),

    # Electrical — TV
    (r"TV",              "tv_points"),
    (r"AERIAL",          "tv_points"),
    (r"COAX",            "tv_points"),
    (r"SATELLITE",       "tv_points"),

    # Plumbing — Radiators
    (r"RAD",             "radiators"),
    (r"RADIATOR",        "radiators"),
    (r"TOWEL_RAIL",      "radiators"),

    # Plumbing — Sanitaryware (mapped to waste_points for counting)
    (r"WC",              "waste_points"),
    (r"TOILET",          "waste_points"),
    (r"BASIN",           "waste_points"),
    (r"SINK",            "waste_points"),
    (r"BATH",            "waste_points"),
    (r"SHOWER",          "waste_points"),
    (r"SHWR",            "waste_points"),
    (r"BIDET",           "waste_points"),

    # Plumbing — Hot water points
    (r"HOT_WATER",       "hot_points"),
    (r"HWS",             "hot_points"),
    (r"BOILER",          "hot_points"),

    # Plumbing — Cold water points
    (r"CWS",             "cold_points"),
    (r"STOPCOCK",        "cold_points"),
]

# Layers Fallback
LAYER_PATTERNS = [
    (r"LIGHT",           "lights"),
    (r"SOCKET",          "sockets"),
    (r"POWER",           "sockets"),
    (r"ELECTRICAL",      "electrical_unknown"), # Generic — NOT sockets
    (r"DATA",            "data_points"),
    (r"FIRE",            "smoke_alarms"),
    (r"ALARM",           "smoke_alarms"),
    (r"RADIATOR",        "radiators"),
    (r"HEATING",         "radiators"),
    (r"PLUMBING",        "waste_points"),
    (r"SANITARY",        "waste_points"),
]

# Pre-compile all patterns
_COMPILED_PATTERNS = [(re.compile(p, re.IGNORECASE), fitting) for p, fitting in BLOCK_PATTERNS]
_COMPILED_LAYERS = [(re.compile(p, re.IGNORECASE), fitting) for p, fitting in LAYER_PATTERNS]


# =============================================
# FITTING TYPE KEYS (blank template)
# =============================================
FITTING_KEYS = [
    "lights", "sockets", "switches", "extractor_fans",
    "smoke_alarms", "data_points", "tv_points",
    "hot_points", "cold_points", "waste_points", "radiators",
    "electrical_unknown"
]


def _empty_fittings() -> dict:
    """Return a zeroed fittings dict."""
    return {k: 0 for k in FITTING_KEYS}


# =============================================
# BLOCK NAME MATCHING
# =============================================

def classify_block(block_name: str, layer_name: str = "") -> Optional[str]:
    """
    Match a DXF block name against the pattern dictionary.
    If no match, try matching the layer name.
    Returns the fitting type string, or None if no match.
    """
    upper_name = block_name.upper().strip()
    
    # 1. Check Block Name
    for pattern, fitting_type in _COMPILED_PATTERNS:
        if pattern.search(upper_name):
            return fitting_type
            
    # 2. Check Layer Name
    if layer_name:
        upper_layer = layer_name.upper().strip()
        for pattern, fitting_type in _COMPILED_LAYERS:
            if pattern.search(upper_layer):
                return fitting_type
                
    return None


# =============================================
# POINT-IN-POLYGON (ray casting)
# =============================================

def _point_in_polygon(x: float, y: float, polygon: list) -> bool:
    """Ray-casting point-in-polygon test."""
    inside = False
    n = len(polygon)
    j = n - 1
    for i in range(n):
        xi, yi = polygon[i]
        xj, yj = polygon[j]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside


# =============================================
# POLYGON INWARD SHRINK (negative buffer)
# =============================================

WALL_BUFFER_M = 0.1  # Half wall thickness — shrink polygons inward by this much

def _polygon_area(polygon: list) -> float:
    """Shoelace formula. Positive = CCW, negative = CW."""
    n = len(polygon)
    if n < 3:
        return 0.0
    area = 0.0
    for i in range(n):
        j = (i + 1) % n
        area += polygon[i][0] * polygon[j][1] - polygon[j][0] * polygon[i][1]
    return area / 2.0  # Signed: positive=CCW, negative=CW


def _shrink_polygon(polygon: list, buffer_m: float = WALL_BUFFER_M) -> list:
    """
    Shrink a polygon inward by buffer_m using edge-normal offsetting.
    
    Steps:
      1. Simplify polygon (remove near-duplicate vertices).
      2. Ensure polygon is CCW (so inward normals point inward).
      3. Offset each edge inward by buffer_m.
      4. Intersect consecutive offset edges to get new vertices.
      5. Validate result (positive area, >= 3 vertices).
    
    Returns shrunk polygon, or original polygon if shrinking fails.
    """
    import math
    
    n = len(polygon)
    if n < 3 or buffer_m <= 0:
        return polygon
    
    # Step 1: Simplify — remove duplicate/near-duplicate vertices
    raw_pts = [(p[0], p[1]) for p in polygon]
    
    # Remove duplicate closing vertex if present
    if len(raw_pts) > 1 and abs(raw_pts[0][0] - raw_pts[-1][0]) < 1e-6 and abs(raw_pts[0][1] - raw_pts[-1][1]) < 1e-6:
        raw_pts = raw_pts[:-1]
    
    # Remove near-duplicate consecutive vertices (< 5cm apart)
    MIN_EDGE_LEN = 0.05
    pts = [raw_pts[0]]
    for i in range(1, len(raw_pts)):
        dx = raw_pts[i][0] - pts[-1][0]
        dy = raw_pts[i][1] - pts[-1][1]
        if math.sqrt(dx*dx + dy*dy) >= MIN_EDGE_LEN:
            pts.append(raw_pts[i])
    # Also check last -> first
    if len(pts) > 1:
        dx = pts[0][0] - pts[-1][0]
        dy = pts[0][1] - pts[-1][1]
        if math.sqrt(dx*dx + dy*dy) < MIN_EDGE_LEN:
            pts = pts[:-1]
    
    # Remove spike vertices: where consecutive edges are near-antiparallel (180° turn)
    # and merge near-collinear edges (< 5° angle change).
    # Iterate until stable.
    def _edge_angle(p1, p2):
        return math.atan2(p2[1] - p1[1], p2[0] - p1[0])
    
    changed = True
    while changed and len(pts) >= 3:
        changed = False
        new_pts = []
        nn = len(pts)
        skip = set()
        for i in range(nn):
            if i in skip:
                continue
            prev_i = (i - 1) % nn
            next_i = (i + 1) % nn
            if prev_i in skip or next_i in skip:
                new_pts.append(pts[i])
                continue
            # Edge angles
            a1 = _edge_angle(pts[prev_i], pts[i])
            a2 = _edge_angle(pts[i], pts[next_i])
            angle_diff = abs(((a2 - a1 + math.pi) % (2*math.pi)) - math.pi)
            # Near-antiparallel (spike): angle change ≈ 180° → diff ≈ 0 after mod
            # Actually: 180° turn means angle_diff ≈ π
            if abs(angle_diff - math.pi) < math.radians(10):
                # This is a spike vertex — skip it
                skip.add(i)
                changed = True
                continue
            # Near-collinear: angle change ≈ 0°
            if angle_diff < math.radians(3):
                # Redundant vertex on a straight edge — skip it
                skip.add(i)
                changed = True
                continue
            new_pts.append(pts[i])
        pts = new_pts
    
    n = len(pts)
    if n < 3:
        return polygon
    
    # Step 2: Ensure CCW winding (signed area > 0 = CCW)
    signed_area = sum(
        pts[i][0] * pts[(i+1) % n][1] - pts[(i+1) % n][0] * pts[i][1]
        for i in range(n)
    ) / 2.0
    if signed_area < 0:
        pts = pts[::-1]  # Reverse to make CCW
    
    # Step 3: For each edge, compute the inward-offset line
    # Edge i: pts[i] → pts[(i+1)%n], direction = (dx, dy)
    # For CCW polygon, inward normal = left normal = (-dy, dx) / len
    offset_lines = []
    for i in range(n):
        j = (i + 1) % n
        dx = pts[j][0] - pts[i][0]
        dy = pts[j][1] - pts[i][1]
        edge_len = math.sqrt(dx*dx + dy*dy)
        if edge_len < 1e-10:
            continue
        # Inward normal (for CCW): left normal = (-dy, dx) / len
        nx = -dy / edge_len
        ny = dx / edge_len
        # Offset both endpoints inward
        ox = nx * buffer_m
        oy = ny * buffer_m
        p1 = (pts[i][0] + ox, pts[i][1] + oy)
        p2 = (pts[j][0] + ox, pts[j][1] + oy)
        offset_lines.append((p1, p2))
    
    if len(offset_lines) < 3:
        return polygon
    
    # Step 4: Intersect consecutive offset lines to get new vertices
    def _line_intersect(p1, p2, p3, p4):
        """Intersect line(p1→p2) with line(p3→p4). Returns (x,y) or None."""
        x1, y1 = p1
        x2, y2 = p2
        x3, y3 = p3
        x4, y4 = p4
        denom = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4)
        if abs(denom) < 1e-12:
            return None  # Parallel
        t = ((x1-x3)*(y3-y4) - (y1-y3)*(x3-x4)) / denom
        ix = x1 + t*(x2-x1)
        iy = y1 + t*(y2-y1)
        return (ix, iy)
    
    new_pts = []
    m = len(offset_lines)
    for i in range(m):
        j = (i + 1) % m
        p = _line_intersect(
            offset_lines[i][0], offset_lines[i][1],
            offset_lines[j][0], offset_lines[j][1]
        )
        if p is not None:
            new_pts.append(p)
    
    if len(new_pts) < 3:
        print(f"[DXF_SHRINK] Shrink produced < 3 vertices, keeping original polygon")
        return polygon
    
    # Step 5: Validate — shrunk polygon should have positive area and be smaller
    new_area = abs(sum(
        new_pts[i][0] * new_pts[(i+1) % len(new_pts)][1] - 
        new_pts[(i+1) % len(new_pts)][0] * new_pts[i][1]
        for i in range(len(new_pts))
    ) / 2.0)
    orig_area = abs(signed_area)
    
    if new_area <= 0 or new_area > orig_area:
        print(f"[DXF_SHRINK] Shrunk area ({new_area:.2f}) invalid vs original ({orig_area:.2f}), keeping original")
        return polygon
    
    ratio = orig_area / new_area if new_area > 0 else 999
    print(f"[DXF_SHRINK] Polygon shrunk: {orig_area:.2f}m2 -> {new_area:.2f}m2 (ratio={ratio:.3f}, buffer={buffer_m}m)")
    
    # Convert back to list format matching input
    return [list(p) for p in new_pts]


# Cache for shrunk polygons (keyed by room_uid)
_shrunk_cache: Dict[str, list] = {}


def _get_shrunk_polygon(room: dict) -> list:
    """Get the shrunk polygon for a room, caching results."""
    uid = room.get("room_uid", "")
    if uid in _shrunk_cache:
        return _shrunk_cache[uid]
    
    poly = room.get("polygon", [])
    if len(poly) < 3:
        return poly
    
    shrunk = _shrink_polygon(poly, WALL_BUFFER_M)
    _shrunk_cache[uid] = shrunk
    return shrunk


def _assign_point_to_room(x: float, y: float, rooms: list) -> Optional[dict]:
    """
    Find which room polygon contains the point (x, y).
    Uses shrunk (inward-buffered) polygons to avoid wall-thickness artifacts.
    Returns the room dict or None.
    """
    for room in rooms:
        shrunk_poly = _get_shrunk_polygon(room)
        if len(shrunk_poly) < 3:
            continue
        if _point_in_polygon(x, y, shrunk_poly):
            return room
    return None


# =============================================
# CORE SCANNER
# =============================================

def extract_inserts_from_dxf(dxf_path: str) -> List[dict]:
    """
    Parse a DXF file and extract all INSERT (block reference) entities.
    
    Returns a list of dicts:
        {
            "block_name": str,
            "x": float,
            "y": float,
            "layer": str,
            "fitting_type": str or None
        }
    """
    if ezdxf is None:
        raise ImportError("ezdxf is not installed. Run: pip install ezdxf")
    
    try:
        doc = ezdxf.readfile(dxf_path, encoding='utf-8')
    except (UnicodeDecodeError, UnicodeEncodeError):
        # Fallback: latin-1 accepts any byte sequence
        doc = ezdxf.readfile(dxf_path, encoding='latin-1')
    msp = doc.modelspace()
    
    inserts = []
    for entity in msp:
        if entity.dxftype() == "INSERT":
            block_name = entity.dxf.name
            insert_point = entity.dxf.insert
            layer = entity.dxf.layer
            
            fitting_type = classify_block(block_name, layer)
            
            inserts.append({
                "block_name": block_name,
                "x": round(float(insert_point.x), 4),
                "y": round(float(insert_point.y), 4),
                "layer": layer,
                "fitting_type": fitting_type
            })
    
    return inserts


def _auto_align_transform(matched: List[dict], rooms: List[dict]) -> Optional[dict]:
    """
    Auto-align DXF fittings to room polygons by searching candidate transforms.
    
    Tries (scale × rotation) combinations, translating fittings centroid to
    rooms centroid, and picks the transform that maximises point-in-polygon hits.
    
    Returns transform dict or None if no alignment found (< 50%).
    """
    import math

    rooms_with_poly = [r for r in rooms if len(r.get("polygon", [])) >= 3]
    if not rooms_with_poly or not matched:
        return None

    # Room bounding box
    all_rpts = [(pt[0], pt[1]) for r in rooms_with_poly for pt in r["polygon"]]
    r_minx, r_maxx = min(p[0] for p in all_rpts), max(p[0] for p in all_rpts)
    r_miny, r_maxy = min(p[1] for p in all_rpts), max(p[1] for p in all_rpts)
    rcx, rcy = (r_minx + r_maxx) / 2, (r_miny + r_maxy) / 2
    rw, rh = r_maxx - r_minx, r_maxy - r_miny

    # Fittings bounding box
    fx = [f["x"] for f in matched]
    fy = [f["y"] for f in matched]
    f_minx, f_maxx = min(fx), max(fx)
    f_miny, f_maxy = min(fy), max(fy)
    fcx, fcy = (f_minx + f_maxx) / 2, (f_miny + f_maxy) / 2
    fw, fh = f_maxx - f_minx, f_maxy - f_miny

    print(f"[DXF_ALIGN] Rooms  bbox: ({r_minx:.2f},{r_miny:.2f})-({r_maxx:.2f},{r_maxy:.2f}) size={rw:.2f}x{rh:.2f} c=({rcx:.2f},{rcy:.2f})")
    print(f"[DXF_ALIGN] Fittings bbox: ({f_minx:.2f},{f_miny:.2f})-({f_maxx:.2f},{f_maxy:.2f}) size={fw:.2f}x{fh:.2f} c=({fcx:.2f},{fcy:.2f})")

    # Build candidate scales
    scales = [0.0001, 0.0002, 0.0003, 0.0004, 0.0005, 0.001, 0.01, 0.1, 1.0, 10.0, 100.0, 1000.0]
    if fw > 0:
        naive_sx = rw / fw
        scales.extend([naive_sx * f for f in [0.5, 0.75, 1.0, 1.25, 1.5]])
    if fh > 0:
        naive_sy = rh / fh
        scales.extend([naive_sy * f for f in [0.5, 0.75, 1.0, 1.25, 1.5]])
    scales = sorted(set(round(s, 7) for s in scales if s > 0))

    rotations = [0, 90, 180, 270]

    def _test(scale, rotation):
        hits = 0
        room_hits = defaultdict(int)
        for f in matched:
            x, y = f["x"], f["y"]
            # Scale around fittings centroid
            x = (x - fcx) * scale + fcx
            y = (y - fcy) * scale + fcy
            # Rotate
            if rotation != 0:
                rad = math.radians(rotation)
                dx, dy = x - fcx, y - fcy
                x = dx * math.cos(rad) - dy * math.sin(rad) + fcx
                y = dx * math.sin(rad) + dy * math.cos(rad) + fcy
            # Translate
            x += rcx - fcx
            y += rcy - fcy
            # PIP test
            for room in rooms_with_poly:
                if _point_in_polygon(x, y, room["polygon"]):
                    hits += 1
                    room_hits[room.get("room_uid", "")] += 1
                    break
        rooms_used = sum(1 for v in room_hits.values() if v > 0)
        return hits, rooms_used

    # Coarse search — score = (hits, rooms_used) so multi-room spread wins
    best_score, best_s, best_r = (0, 0), 1.0, 0
    for s in scales:
        for r in rotations:
            hits, rooms_used = _test(s, r)
            score = (hits, rooms_used)
            if score > best_score:
                best_score, best_s, best_r = score, s, r

    # Fine search around best scale
    if best_score[0] > 0:
        fine_center = int(best_s * 1000000)
        for delta in range(-100, 101, 5):
            s = (fine_center + delta) / 1000000.0
            if s <= 0:
                continue
            for r in [best_r, (best_r + 180) % 360]:
                hits, rooms_used = _test(s, r)
                score = (hits, rooms_used)
                if score > best_score:
                    best_score, best_s, best_r = score, s, r

    best_hits, best_rooms = best_score
    pct = best_hits / len(matched) * 100 if matched else 0
    print(f"[DXF_ALIGN] Best: scale={best_s:.6f} rot={best_r} deg => {best_hits}/{len(matched)} ({pct:.0f}%) across {best_rooms} rooms")

    if pct < 50 or best_rooms < 1:
        print("[DXF_ALIGN] Alignment score too low (<50%), skipping auto-align")
        return None

    return {
        "scale": best_s,
        "rotation_deg": best_r,
        "fittings_centroid": (fcx, fcy),
        "rooms_centroid": (rcx, rcy),
    }


def _apply_transform(x: float, y: float, transform: dict) -> Tuple[float, float]:
    """Apply auto-align transform to a single point."""
    import math
    scale = transform["scale"]
    rot = transform["rotation_deg"]
    fcx, fcy = transform["fittings_centroid"]
    rcx, rcy = transform["rooms_centroid"]

    # Scale around fittings centroid
    x = (x - fcx) * scale + fcx
    y = (y - fcy) * scale + fcy

    # Rotate around fittings centroid
    if rot != 0:
        rad = math.radians(rot)
        dx, dy = x - fcx, y - fcy
        x = dx * math.cos(rad) - dy * math.sin(rad) + fcx
        y = dx * math.sin(rad) + dy * math.cos(rad) + fcy

    # Translate fittings centroid to rooms centroid
    x += rcx - fcx
    y += rcy - fcy

    return x, y


def scan_dxf_fittings(
    dxf_path: str,
    rooms: List[dict],
    negate_y: bool = True
) -> dict:
    """
    Main entry point: scan a DXF file and assign fittings to rooms.
    
    Uses auto-alignment to find the best coordinate transform between
    DXF space and room polygon space. Falls back to simple Y-negate
    if auto-alignment fails.
    
    Args:
        dxf_path: Path to the .dxf file
        rooms: List of room dicts with 'room_uid' and 'polygon'
        negate_y: Fallback: negate Y if auto-alignment fails
    
    Returns:
        {
            "per_room": {
                "<room_uid>": {
                    "lights": int, "sockets": int, ...
                    "_source": "DXF_AUTO",
                    "_inserts": [ list of matched inserts ]
                }
            },
            "unmatched_blocks": [ unique block names with no fitting match ],
            "unassigned_fittings": [ fittings outside any room polygon ],
            "total_inserts": int,
            "total_matched": int,
            "total_assigned": int,
            "transform": { scale, rotation_deg, ... } or None
        }
    """
    # 1. Extract all INSERT entities
    _shrunk_cache.clear()  # Reset shrunk polygon cache for fresh scan
    all_inserts = extract_inserts_from_dxf(dxf_path)
    print(f"[DXF_SCAN] Extracted {len(all_inserts)} INSERT entities from {os.path.basename(dxf_path)}")
    
    # 2. Filter to matched fittings only
    matched = [ins for ins in all_inserts if ins["fitting_type"] is not None]
    unmatched_names = list(set(
        ins["block_name"] for ins in all_inserts if ins["fitting_type"] is None
    ))
    
    print(f"[DXF_SCAN] Fitted: {len(matched)} | Unmatched blocks: {len(unmatched_names)}")
    if unmatched_names:
        safe_names = [_safe_str(n) for n in unmatched_names[:20]]
        print(f"[DXF_SCAN] Unmatched block names: {safe_names}")
    
    # 3. AUTO-ALIGNMENT: Find best transform
    transform = _auto_align_transform(matched, rooms)
    use_auto = transform is not None

    if use_auto:
        print(f"[DXF_SCAN] Using auto-alignment: scale={transform['scale']:.6f} rot={transform['rotation_deg']} deg")
    else:
        print(f"[DXF_SCAN] Auto-alignment failed, using negate_y={negate_y}")

    # 4. Assign each matched fitting to a room
    per_room = {}
    for room in rooms:
        uid = room.get("room_uid", "")
        per_room[uid] = _empty_fittings()
        per_room[uid]["_source"] = "DXF_AUTO"
        per_room[uid]["_inserts"] = []
    
    unassigned = []
    assigned_count = 0
    
    for ins in matched:
        if use_auto:
            x, y = _apply_transform(ins["x"], ins["y"], transform)
        else:
            x = ins["x"]
            y = -ins["y"] if negate_y else ins["y"]
        
        room = _assign_point_to_room(x, y, rooms)
        
        if room:
            uid = room.get("room_uid", "")
            fitting_key = ins["fitting_type"]
            per_room[uid][fitting_key] = per_room[uid].get(fitting_key, 0) + 1
            per_room[uid]["_inserts"].append({
                "block": ins["block_name"],
                "type": fitting_key,
                "x": ins["x"],
                "y": ins["y"],
                "layer": ins["layer"]
            })
            assigned_count += 1
            rname = room.get("room_name", "?")
            print(f"[DXF_ASSIGN] {_safe_str(ins['block_name'])} -> {rname} ({fitting_key})")
        else:
            unassigned.append(ins)
            print(f"[DXF_ASSIGN] {_safe_str(ins['block_name'])} at ({x:.2f},{y:.2f}) -> UNASSIGNED")
    
    print(f"[DXF_SCAN] Assigned: {assigned_count} | Unassigned: {len(unassigned)}")
    
    # 5. Log per-room summary
    for room in rooms:
        uid = room.get("room_uid", "")
        rname = room.get("room_name", "?")
        f = per_room.get(uid, {})
        non_zero = {k: v for k, v in f.items() if k in FITTING_KEYS and v > 0}
        if non_zero:
            print(f"[DXF_ROOM] {rname}: {non_zero}")
        else:
            print(f"[DXF_ROOM] {rname}: (no fittings detected)")
    
    return {
        "per_room": per_room,
        "unmatched_blocks": unmatched_names,
        "unassigned_fittings": [
            {"block": u["block_name"], "x": u["x"], "y": u["y"], "layer": u["layer"]}
            for u in unassigned
        ],
        "total_inserts": len(all_inserts),
        "total_matched": len(matched),
        "total_assigned": assigned_count,
        "transform": transform,
    }


def apply_dxf_fittings_to_rooms(
    rooms: List[dict],
    scan_result: dict,
    overwrite: bool = True
) -> List[dict]:
    """
    Write DXF-detected fittings into the room dicts.
    
    Args:
        rooms: List of room dicts (will be mutated)
        scan_result: Output from scan_dxf_fittings()
        overwrite: If True, replaces any existing fittings.
                   If False, only fills rooms that have no fittings.
    
    Returns:
        Modified rooms list
    """
    per_room = scan_result.get("per_room", {})
    
    for room in rooms:
        uid = room.get("room_uid", "")
        if uid not in per_room:
            continue
        
        dxf_fittings = per_room[uid]
        existing = room.get("fittings", {})
        has_existing = any(v for k, v in existing.items() if k in FITTING_KEYS and v)
        
        if overwrite or not has_existing:
            # Build clean fittings dict (without internal keys)
            clean = {k: dxf_fittings.get(k, 0) for k in FITTING_KEYS}
            room["fittings"] = clean
            room["fittings_source"] = "DXF_AUTO"
            print(f"[DXF_APPLY] {room.get('room_name','?')}: applied DXF fittings")
        else:
            print(f"[DXF_APPLY] {room.get('room_name','?')}: kept existing manual fittings")
    
    return rooms
