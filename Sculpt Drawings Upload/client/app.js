// =======================
// CONFIG
// =======================
const API_BASE = ""; // same origin

// Parse Project ID from URL or default
const urlParams = new URLSearchParams(window.location.search);
let projectId = urlParams.get('projectId') || urlParams.get('job_id') || "default_project";

// DOM
const SVG_CONTAINER = document.getElementById("svg-container");
const storeySelect = document.getElementById("storey-select");
const uploadBtn = document.getElementById("upload-btn");
const uploadFile = document.getElementById("ifc-file");
const loadPlanBtn = document.getElementById("load-plan-btn");
const uploadStatus = document.getElementById("upload-status");

// State
const state = {
    storeys: [],
    currentStoreyKey: null,   // uid preferred
    currentStoreyCode: null,  // fallback
    svgEl: null,
    rooms: [],
    elements: {}
};

// =======================
// UTIL
// =======================
function setStatus(msg, color = "#666") {
    if (!uploadStatus) return;
    uploadStatus.textContent = msg;
    uploadStatus.style.color = color;
}

function encodeKey(key) {
    return encodeURIComponent(key);
}

function resetPlanUI() {
    SVG_CONTAINER.innerHTML = "";
    state.svgEl = null;
    state.elements = {};
}

function resetStoreysUI() {
    storeySelect.innerHTML = `<option value="">Select Storey...</option>`;
    storeySelect.disabled = true;
    loadPlanBtn.disabled = true;
}

// =======================
// STOREYS
// =======================
function renderStoreys(storeys) {
    console.log("Rendering storeys:", storeys);
    resetStoreysUI();

    storeys.forEach(s => {
        const uid = s.storey_uid || s.uid;
        const code = s.storey_code || s.code;

        const opt = document.createElement("option");
        opt.value = uid || code;               // key to use in plan endpoint
        opt.dataset.storeyCode = code || "";
        opt.textContent = `${s.storey_name || s.name || code} (${s.elevation ?? 0}m)`;

        storeySelect.appendChild(opt);
    });

    storeySelect.disabled = false;
    loadPlanBtn.disabled = false;

    // Auto-select first real storey
    if (storeySelect.options.length > 1) {
        storeySelect.selectedIndex = 1;
        syncSelectedStorey();
    }
}

function syncSelectedStorey() {
    const opt = storeySelect.options[storeySelect.selectedIndex];
    state.currentStoreyKey = storeySelect.value || null;
    state.currentStoreyCode = opt?.dataset?.storeyCode || null;
}

// =======================
// API CALLS
// =======================
async function apiJson(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, options);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        const msg = data?.detail || data?.message || `${res.status} ${res.statusText}`;
        throw new Error(msg);
    }
    return data;
}

async function apiText(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, options);
    const text = await res.text();
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return text;
}

// =======================
// IFC UPLOAD
// =======================


// =======================
// PLAN LOADING (SINGLE SOURCE OF TRUTH)
// =======================
// =======================
// PLAN LOADING (SINGLE SOURCE OF TRUTH)
// =======================
async function loadPlan(explicitKey = null, silent = false) {
    if (explicitKey) {
        state.currentStoreyKey = explicitKey;
        // Sync DOM to state
        storeySelect.value = explicitKey;
        // If value didn't take (e.g. invalid key), try to fallback or ignore
        if (storeySelect.value !== explicitKey) {
            console.warn("Explicit code not found in dropdown");
        }
        const opt = storeySelect.options[storeySelect.selectedIndex];
        state.currentStoreyCode = opt?.dataset?.storeyCode || explicitKey;
    } else {
        syncSelectedStorey();
    }

    if (!state.currentStoreyKey) {
        if (!silent) alert("Please select a storey.");
        return false;
    }

    resetPlanUI();

    // try key first, fallback to storey_code if 404
    const tryFetchSvg = async (key) => {
        const url = `/projects/${projectId}/plans/${encodeKey(key)}?ts=${Date.now()}`;
        return await apiText(url);
    };

    try {
        let svgText;
        try {
            svgText = await tryFetchSvg(state.currentStoreyKey);
        } catch (e) {
            // fallback attempt only if we have a different code
            if (state.currentStoreyCode && state.currentStoreyCode !== state.currentStoreyKey) {
                svgText = await tryFetchSvg(state.currentStoreyCode);
            } else {
                throw e;
            }
        }

        // inject
        SVG_CONTAINER.innerHTML = svgText;
        const svg = SVG_CONTAINER.querySelector("svg");
        if (!svg) throw new Error("SVG response contained no <svg> tag.");

        // ensure viewBox so it fits
        if (!svg.getAttribute("viewBox")) {
            try {
                const bb = svg.getBBox();
                svg.setAttribute("viewBox", `${bb.x} ${bb.y} ${bb.width} ${bb.height}`);
            } catch (_) { }
        }
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.style.display = "block";

        state.svgEl = svg;

        // Bind hover tooltips to SVG elements
        bindTooltips(svg);

        // Load elements metadata (dimensions)
        await loadElements();

        // load rooms overlay (your system)
        await loadRoomsAndRender();

        return true;
    } catch (e) {
        console.error(e);
        if (!silent) alert("Failed to load SVG plan.");
        return false;
    }
}

// =======================
// ELEMENT METADATA LOADING
// =======================
async function loadElements() {
    if (!state.currentStoreyKey) return;
    try {
        const key = encodeURIComponent(state.currentStoreyKey);
        const metaUrl = `${API_BASE}/projects/${projectId}/plans/${key}.elements.json?ts=${Date.now()}`;
        const resp = await fetch(metaUrl);
        if (resp.ok) {
            const data = await resp.json();
            state.elements = data || {};
            const count = Object.keys(state.elements).length;
            console.log(`Loaded ${count} element metadata entries`);
        } else {
            console.warn(`Elements metadata not available (${resp.status})`);
            state.elements = {};
        }
    } catch (e) {
        console.warn("Elements metadata fetch failed:", e.message);
        state.elements = {};
    }
}

// =======================
// TOOLTIP SYSTEM
// =======================
function bindTooltips(svg) {
    const tooltipEl = document.getElementById("tooltip");
    if (!tooltipEl) { console.warn("No tooltip element found"); return; }

    // PATched: Walk up from target to find nearest element with ID (or Ifc class)
    function findIfcGroup(el) {
        let node = el;
        while (node && node !== svg) {
            const ifcId = node.getAttribute && node.getAttribute('id');
            const cls = node.getAttribute && node.getAttribute('class');

            if (ifcId && (node.tagName === 'g' || node.tagName === 'path' || node.tagName === 'polygon')) {
                return node;
            }
            if (cls && (cls.startsWith('Ifc') || cls.startsWith('ifc-') || cls === 'Symbol' || cls === 'Dimension')) {
                return node;
            }
            node = node.parentElement;
        }
        return null;
    }

    svg.addEventListener("mousemove", (evt) => {
        if (isDrawing) {
            tooltipEl.style.display = "none";
            return;
        }

        // 1. Detect underlying IFC element (since rooms have pointer-events: none)
        // Note: Room polygons MUST have pointer-events: none for this to work.
        const target = evt.target;
        const group = findIfcGroup(target);

        // 2. Detect Room manually (point-in-polygon logic)
        // Since room polys don't catch events, we scan state.rooms
        const pt = getSvgPoint(evt);
        let hoveredRoom = null;
        if (pt) {
            hoveredRoom = state.rooms.find(r => {
                if (!r.polygon || r.polygon.length < 3) return false;
                // Filter by storey if needed
                if (state.currentStoreyCode && r.storey_code !== state.currentStoreyCode) return false;
                return isPointInPolygon(pt.x, pt.y, r.polygon);
            });
        }

        if (!group && !hoveredRoom) {
            tooltipEl.style.display = "none";
            // Clear highlights
            svg.querySelectorAll('g[style*="opacity"]').forEach(g => g.style.opacity = '');
            return;
        }

        let html = "";

        // ROOM INFO
        if (hoveredRoom) {
            const rArea = hoveredRoom.area_m2 || calculatePolygonArea(hoveredRoom.polygon);
            const srcLabel = hoveredRoom.source === 'IFC_AUTO'
                ? '<span style="background:#e6fff0;color:#00994d;padding:1px 4px;border-radius:2px;font-size:0.8em">IFC AUTO</span>'
                : '<span style="background:#e6f0ff;color:#0055aa;padding:1px 4px;border-radius:2px;font-size:0.8em">Manual</span>';

            html += `<div style="border-bottom:1px solid #ddd; padding-bottom:4px; margin-bottom:4px;">
                        <strong>${hoveredRoom.room_name}</strong> ${srcLabel}<br>
                        Area: ${rArea.toFixed(2)} m²
                      </div>`;
        }

        if (group) {
            const cls = group.getAttribute('class') || 'Unknown';
            const guid = group.getAttribute('data-guid') || '';
            const name = group.getAttribute('data-name') || '';
            const id = group.getAttribute('id') || '';
            const typeName = cls.replace(/ifc-?/i, '').replace(/([A-Z])/g, ' $1').trim().toUpperCase();

            html += `<div><strong>${typeName}</strong>`;
            if (name && name !== 'undefined') html += `<br>${name}`;

            // Metadata lookup
            const elGuid = guid || group.getAttribute('data-guid') || '';
            const guidKey = elGuid ? `product-${elGuid}-body` : '';
            const elId = id || group.getAttribute('id') || '';
            let lookupId = elId;
            // If ID is raw GUID, try formatting it to match elements.json key
            if (elId && !elId.startsWith('product-')) {
                lookupId = `product-${elId}-body`;
            }
            const elMeta = state.elements[guidKey] || state.elements[elId] || state.elements[lookupId] || null;

            if (elMeta) {
                if (elMeta.type === 'IfcWall') {
                    if (elMeta.length_m) html += `<br>Length: ${elMeta.length_m.toFixed(2)} m`;
                    if (elMeta.height_m) html += `<br>Height: ${elMeta.height_m.toFixed(2)} m`;
                } else if (elMeta.type === 'IfcDoor' || elMeta.type === 'IfcWindow') {
                    if (elMeta.width_m) html += `<br>W: ${elMeta.width_m.toFixed(2)} m H: ${elMeta.height_m.toFixed(2)} m`;
                }
            }
            html += `</div>`;

            // Highlight
            if (group.style) group.style.opacity = '0.6';
        } else {
            // Clear highlights if only room hovered
            svg.querySelectorAll('g[style*="opacity"]').forEach(g => g.style.opacity = '');
        }

        tooltipEl.innerHTML = html;
        tooltipEl.style.display = "block";

        // Position
        const container = svg.closest('.main-view') || svg.parentElement;
        const containerRect = container.getBoundingClientRect();
        // Keep tooltip within bounds
        const x = evt.clientX - containerRect.left + 15;
        const y = evt.clientY - containerRect.top + 15;
        tooltipEl.style.left = x + "px";
        tooltipEl.style.top = y + "px";
    });

    svg.addEventListener("mouseleave", () => {
        tooltipEl.style.display = "none";
        svg.querySelectorAll('g[style*="opacity"]').forEach(g => g.style.opacity = '');
    });

    // Mouseout logic handled by mousemove (clearing highlights)

    console.log("Tooltips bound to SVG elements");
}

// =======================
// ROOMS
// =======================
async function loadRoomsAndRender() {
    try {
        const data = await apiJson(`/projects/${projectId}/rooms`);
        // Server returns plain array, not {rooms: [...]}
        state.rooms = Array.isArray(data) ? data : (data.rooms || []);

        // FEATURE 1+3: Auto-generate rooms from IFC Spaces and merge (no duplicates)
        const autoRooms = autoGenerateRoomsFromIfcSpaces();
        if (autoRooms.length > 0) {
            console.log(`Auto-generated ${autoRooms.length} rooms from IFC Spaces`);
            // Merge: only add auto rooms whose uid doesn't already exist
            autoRooms.forEach(ar => {
                if (!state.rooms.some(r => r.room_uid === ar.room_uid)) {
                    state.rooms.push(ar);
                }
            });
        }

        renderRooms(state.rooms);

        // FEATURE 4: Map rooms to currentElements for tooltip lookup
        state.rooms.forEach(room => {
            if (room.room_uid) {
                state.elements[room.room_uid] = {
                    display_name: room.room_name,
                    type: "IfcSpace",
                    area_m2: room.area_m2 || 0,
                    source: room.source
                };
            }
        });
    } catch (e) {
        console.warn("Rooms load failed:", e.message);
        // Still try auto-generation even if server rooms fail
        const autoRooms = autoGenerateRoomsFromIfcSpaces();
        if (autoRooms.length > 0) {
            state.rooms = autoRooms;
            renderRooms(state.rooms);
        }
    }
}

// =======================
// IFC SPACE AUTO-ROOM GENERATION
// =======================

/**
 * FEATURE 2 — Extract polygon from SVG element by ID
 * Uses BBox to generate a rectangle polygon
 */
function extractPolygonFromSvg(svgElementId) {
    if (!state.svgEl) return null;

    // Try direct ID match
    let el = state.svgEl.querySelector(`[id="${svgElementId}"]`);

    // Also try id with -body suffix (IFC convention)
    if (!el) el = state.svgEl.querySelector(`[id="${svgElementId}-body"]`);

    // Try matching by data-guid
    if (!el) el = state.svgEl.querySelector(`[data-guid="${svgElementId}"]`);

    if (!el) return null;

    try {
        const bbox = el.getBBox();
        if (bbox.width === 0 || bbox.height === 0) return null;

        // Generate rectangle polygon from bounding box
        return [
            [bbox.x, bbox.y],
            [bbox.x + bbox.width, bbox.y],
            [bbox.x + bbox.width, bbox.y + bbox.height],
            [bbox.x, bbox.y + bbox.height]
        ];
    } catch (_) {
        return null;
    }
}

/**
 * FEATURE 1 — Auto-generate room objects from IfcSpace SVG elements
 * Scans the SVG DOM for any <g class="IfcSpace"> elements
 */
function autoGenerateRoomsFromIfcSpaces() {
    if (!state.svgEl) return [];

    const autoRooms = [];
    const ifcSpaceGroups = state.svgEl.querySelectorAll('g.IfcSpace, g.ifc-space');

    ifcSpaceGroups.forEach(g => {
        const id = g.getAttribute('id') || '';
        const guid = g.getAttribute('data-guid') || '';
        const name = g.getAttribute('data-name') || '';
        const roomUid = id || `ifc-space-${guid}`;

        // FEATURE 3: Skip if already exists
        if (state.rooms && state.rooms.some(r => r.room_uid === roomUid)) return;

        // Extract polygon from BBox
        const polygon = extractPolygonFromSvg(id || guid);
        if (!polygon) return;

        // Calculate area from polygon
        const area = calculatePolygonArea(polygon);

        const room = {
            room_uid: roomUid,
            room_name: name || `IFC Space ${autoRooms.length + 1}`,
            room_type: "AUTO_IFC",
            source: "IFC_AUTO",
            storey_code: state.currentStoreyCode || "0",
            polygon: polygon,
            ifc_guid: guid,
            area_m2: area
        };

        autoRooms.push(room);
        console.log(`Auto room: ${room.room_name} (${area.toFixed(2)} m²) from ${id || guid}`);
    });

    // Also check state.elements if populated
    if (state.elements && Object.keys(state.elements).length > 0) {
        Object.entries(state.elements).forEach(([elId, meta]) => {
            if (meta.type !== 'IfcSpace') return;
            const roomUid = elId;

            // Skip if already added
            if (autoRooms.some(r => r.room_uid === roomUid)) return;
            if (state.rooms && state.rooms.some(r => r.room_uid === roomUid)) return;

            const polygon = extractPolygonFromSvg(elId);
            if (!polygon) return;

            const area = meta.area_m2 || calculatePolygonArea(polygon);

            autoRooms.push({
                room_uid: roomUid,
                room_name: meta.display_name || `IFC Space`,
                room_type: "AUTO_IFC",
                source: "IFC_AUTO",
                storey_code: state.currentStoreyCode || "0",
                polygon: polygon,
                ifc_guid: roomUid,
                area_m2: area
            });
        });
    }

    console.log(`IFC Space auto-generation complete: ${autoRooms.length} rooms found`);
    return autoRooms;
}

// =======================
// UNIT CONVERSION & GEOMETRY
// =======================

/**
 * Single Source of Truth for Unit Conversion
 * Returns factor to multiply SVG units by to get meters.
 * Heuristic: If max dimension > 5000, assume mm (factor 0.001), else meters (factor 1).
 */
function getSvgUnitsToMetersFactor() {
    if (!state.svgEl) return 1;
    const vb = state.svgEl.getAttribute("viewBox");
    if (!vb) return 1;

    const parts = vb.split(/[\s,]+/).map(Number);
    const w = Math.abs(parts[2]) || 0;
    const h = Math.abs(parts[3]) || 0;
    const maxDim = Math.max(w, h);

    // Threshold 500 implies mm (e.g. 500 units = 0.5m which is tiny for a building, so likely 500mm)
    if (maxDim > 500) {
        return 0.001; // mm to m
    }
    return 1; // already m
}

function calculatePolygonArea(points) {
    let area = 0;
    // Shoelace Formula
    for (let i = 0; i < points.length; i++) {
        let j = (i + 1) % points.length;
        area += points[i][0] * points[j][1];
        area -= points[j][0] * points[i][1];
    }
    const rawArea = Math.abs(area) / 2;
    const factor = getSvgUnitsToMetersFactor();

    // Area scales with square of factor
    const areaM2 = rawArea * (factor * factor);

    console.log(`Area Calc: Raw=${rawArea.toFixed(1)}, Factor=${factor}, Result=${areaM2.toFixed(2)} m²`);
    return areaM2;
}

function polygonPerimeterMeters(points) {
    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
        let j = (i + 1) % points.length;
        const dx = points[j][0] - points[i][0];
        const dy = points[j][1] - points[i][1];
        perimeter += Math.sqrt(dx * dx + dy * dy);
    }
    const factor = getSvgUnitsToMetersFactor();
    return perimeter * factor;
}

function getPolygonCentroid(points) {
    let cx = 0, cy = 0;
    for (const p of points) { cx += p[0]; cy += p[1]; }
    return [cx / points.length, cy / points.length];
}

function renderRooms(rooms) {
    if (!state.svgEl) return;

    // Clear old room polys and labels
    const existing = state.svgEl.querySelectorAll(".room-poly, .room-label");
    existing.forEach(el => el.remove());

    // Also clear existing list
    const listEl = document.getElementById("room-list");
    if (listEl) listEl.innerHTML = "";

    const scale = getSvgScale();

    rooms.forEach(room => {
        // Filter by current storey if applicable
        if (state.currentStoreyCode && room.storey_code !== state.currentStoreyCode) return;

        // Draw Polygon
        const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        if (!Array.isArray(room.polygon) || room.polygon.length < 3) return;

        const pts = room.polygon.map(p => p.join(",")).join(" ");
        poly.setAttribute("points", pts);

        // FEATURE 5: Differentiated styling for auto vs manual rooms
        const isAutoRoom = room.source === "IFC_AUTO" || room.room_type === "AUTO_IFC";
        if (isAutoRoom) {
            // Architectural Style: Pale Blue
            poly.setAttribute("fill", "#dbeafe");
            poly.setAttribute("fill-opacity", "0.4");
            poly.setAttribute("stroke", "#1d4ed8");
            poly.setAttribute("stroke-width", "2.5");
        } else {
            // Manual Room Style
            poly.setAttribute("fill", "rgba(0, 123, 255, 0.15)");
            poly.setAttribute("stroke", "#007bff");
            poly.setAttribute("stroke-width", String(scale * 1.5));
        }
        poly.setAttribute("class", "room-poly");
        poly.setAttribute("data-room-uid", room.room_uid || '');
        poly.setAttribute("data-room-source", isAutoRoom ? 'IFC_AUTO' : 'MANUAL');
        // PATCH: Disable pointer events so we can hover underlying IFC elements
        // (User can enable selection mode if needed, but default is pass-through)
        poly.style.pointerEvents = "none";
        state.svgEl.appendChild(poly);

        // Calc Area
        const area = room.area_m2 || calculatePolygonArea(room.polygon);

        // Add area label at centroid of polygon
        const centroid = getPolygonCentroid(room.polygon);
        const labelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        labelGroup.setAttribute("class", "room-label");
        labelGroup.style.pointerEvents = "none";

        // Room name text
        const nameText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        nameText.setAttribute("x", centroid[0]);
        nameText.setAttribute("y", centroid[1]);
        nameText.setAttribute("text-anchor", "middle");
        nameText.setAttribute("dominant-baseline", "middle");
        nameText.setAttribute("font-size", String(scale * 8));
        nameText.setAttribute("font-weight", "bold");
        nameText.setAttribute("fill", isAutoRoom ? "#007a3d" : "#004085");
        nameText.textContent = room.room_name;

        // Area text (below name)
        const areaText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        areaText.setAttribute("x", centroid[0]);
        areaText.setAttribute("y", centroid[1] + scale * 10);
        areaText.setAttribute("text-anchor", "middle");
        areaText.setAttribute("dominant-baseline", "middle");
        areaText.setAttribute("font-size", String(scale * 7));
        areaText.setAttribute("fill", isAutoRoom ? "#2d7a46" : "#336699");
        areaText.textContent = `${area.toFixed(2)} m²`;

        // Source badge (below area, smaller)
        if (isAutoRoom) {
            const srcText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            srcText.setAttribute("x", centroid[0]);
            srcText.setAttribute("y", centroid[1] + scale * 18);
            srcText.setAttribute("text-anchor", "middle");
            srcText.setAttribute("dominant-baseline", "middle");
            srcText.setAttribute("font-size", String(scale * 5));
            srcText.setAttribute("fill", "#888");
            srcText.textContent = "IFC AUTO";
            labelGroup.appendChild(srcText);
        }

        labelGroup.appendChild(nameText);
        labelGroup.appendChild(areaText);
        state.svgEl.appendChild(labelGroup);

        // Add to sidebar list
        if (listEl) {
            const li = document.createElement("li");
            li.style.borderBottom = "1px solid #eee";
            li.style.padding = "5px 0";
            li.style.display = "flex";
            li.style.justifyContent = "space-between";
            li.style.alignItems = "center";
            li.style.cursor = "pointer";

            const sourceBadge = isAutoRoom
                ? `<span style="font-size:0.7em;background:#e6fff0;color:#00994d;padding:1px 5px;border-radius:3px;margin-left:5px;">IFC</span>`
                : `<span style="font-size:0.7em;background:#e6f0ff;color:#0055aa;padding:1px 5px;border-radius:3px;margin-left:5px;">Manual</span>`;

            li.innerHTML = `
                <div>
                    <strong>${room.room_name}</strong>${sourceBadge}<br>
                    <span style="font-size:0.85em; color:#666;">${area.toFixed(2)} m²</span>
                </div>
                <div style="display:flex; gap:3px; align-items:center;">
                    <button onclick="event.stopPropagation(); window.selectRoomForFittings('${room.room_uid}')" style="background:#17a2b8; color:white; border:none; border-radius:3px; padding:2px 6px; cursor:pointer; font-size:0.75em;" title="Edit Fittings">⚡</button>
                    ${!isAutoRoom ? `<button onclick="event.stopPropagation(); window.deleteRoom('${room.room_uid}')" style="background:#dc3545; color:white; border:none; border-radius:3px; padding:2px 6px; cursor:pointer;" title="Delete Room">x</button>` : '<span style="font-size:0.7em;color:#999;">auto</span>'}
                </div>
            `;
            listEl.appendChild(li);
        }
    });

    // If list is empty
    if (listEl && listEl.innerHTML === "") {
        listEl.innerHTML = `<li style="color: #999; font-style: italic;">No rooms yet on this storey.</li>`;
    }
}

// Function to delete specific room
window.deleteRoom = async function (uid) {
    if (!confirm("Are you sure you want to delete this room?")) return;
    try {
        await apiJson(`/projects/${projectId}/rooms/${uid}`, { method: "DELETE" });
        // Optimistic update
        state.rooms = state.rooms.filter(r => r.room_uid !== uid);
        renderRooms(state.rooms);
        // Hide fittings if this was the selected room
        const selUid = document.getElementById("selected-room-uid");
        if (selUid && selUid.value === uid) {
            document.getElementById("fittings-section").style.display = "none";
        }
    } catch (e) {
        console.error(e);
        alert("Failed to delete room: " + e.message);
    }
};

// =======================
// ROOM FITTINGS EDITOR
// =======================

// Fittings field mapping: HTML input id -> JSON key
const FITTINGS_MAP = {
    "fit-lights": "lights",
    "fit-sockets": "sockets",
    "fit-switches": "switches",
    "fit-extractors": "extractor_fans",
    "fit-smoke": "smoke_alarms",
    "fit-data": "data_points",
    "fit-tv": "tv_points",
    "fit-hot": "hot_points",
    "fit-cold": "cold_points",
    "fit-waste": "waste_points",
    "fit-radiators": "radiators"
};

// +/- button handler
window.adjustFitting = function (inputId, delta) {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.value = Math.max(0, parseInt(el.value || 0) + delta);
};

// Select a room and load its fittings into the editor
window.selectRoomForFittings = function (uid) {
    const room = state.rooms.find(r => r.room_uid === uid);
    if (!room) return;

    // Set the hidden selected-room-uid input
    const selInput = document.getElementById("selected-room-uid");
    if (selInput) selInput.value = uid;

    // Also populate name/type fields
    const nameInput = document.getElementById("room-name");
    const typeSelect = document.getElementById("room-type");
    if (nameInput) nameInput.value = room.room_name || "";
    if (typeSelect) typeSelect.value = room.room_type || "Generic";

    // Show fittings section
    const section = document.getElementById("fittings-section");
    if (section) section.style.display = "block";

    // Load fittings values
    const fittings = room.fittings || {};
    for (const [inputId, key] of Object.entries(FITTINGS_MAP)) {
        const el = document.getElementById(inputId);
        if (el) el.value = fittings[key] || 0;
    }

    // Status indicator
    const statusEl = document.getElementById("fittings-status");
    const hasFittings = Object.values(fittings).some(v => v > 0);
    const isDxf = room.fittings_source === "DXF_AUTO";

    if (isDxf) {
        if (statusEl) {
            statusEl.textContent = `🔶 DXF-scanned fittings for: ${room.room_name} (read-only)`;
            statusEl.style.color = "#e65100";
        }
        // Disable all fittings inputs and buttons
        for (const inputId of Object.keys(FITTINGS_MAP)) {
            const el = document.getElementById(inputId);
            if (el) el.disabled = true;
        }
        // Disable +/- buttons and action buttons
        const fitSection = document.getElementById("fittings-section");
        if (fitSection) {
            fitSection.querySelectorAll("button").forEach(b => {
                if (b.id !== "reset-fittings-btn") b.disabled = true;
            });
        }
    } else {
        if (statusEl) {
            statusEl.textContent = hasFittings ? `✅ Loaded fittings for: ${room.room_name}` : `⚠️ No fittings set for: ${room.room_name}`;
            statusEl.style.color = hasFittings ? "#28a745" : "#ffc107";
        }
        // Enable all fittings inputs and buttons
        for (const inputId of Object.keys(FITTINGS_MAP)) {
            const el = document.getElementById(inputId);
            if (el) el.disabled = false;
        }
        const fitSection = document.getElementById("fittings-section");
        if (fitSection) {
            fitSection.querySelectorAll("button").forEach(b => b.disabled = false);
        }
    }
};

// Save fittings to backend
async function saveFittings() {
    const uid = document.getElementById("selected-room-uid")?.value;
    if (!uid) {
        alert("Select a room first (click the ⚡ button next to a room)");
        return;
    }

    const fittings = {};
    for (const [inputId, key] of Object.entries(FITTINGS_MAP)) {
        const el = document.getElementById(inputId);
        fittings[key] = parseInt(el?.value || 0);
    }

    const statusEl = document.getElementById("fittings-status");
    try {
        if (statusEl) { statusEl.textContent = "Saving..."; statusEl.style.color = "blue"; }

        await fetch(`${API_BASE}/projects/${projectId}/rooms/${uid}/fittings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fittings)
        });

        // Update local state too
        const room = state.rooms.find(r => r.room_uid === uid);
        if (room) room.fittings = fittings;

        if (statusEl) { statusEl.textContent = `✅ Fittings saved for ${room?.room_name || uid}`; statusEl.style.color = "#28a745"; }
    } catch (e) {
        console.error("Save fittings failed:", e);
        if (statusEl) { statusEl.textContent = "❌ Save failed: " + e.message; statusEl.style.color = "red"; }
    }
}

// Reset all fittings inputs to 0
function resetFittings() {
    for (const inputId of Object.keys(FITTINGS_MAP)) {
        const el = document.getElementById(inputId);
        if (el) el.value = 0;
    }
    const statusEl = document.getElementById("fittings-status");
    if (statusEl) { statusEl.textContent = "All fittings reset to 0 (not saved yet)"; statusEl.style.color = "#6c757d"; }
}

// Auto-suggest fittings based on room type/name/area
function suggestFittings() {
    const uid = document.getElementById("selected-room-uid")?.value;
    if (!uid) {
        alert("Select a room first (click the ⚡ button next to a room)");
        return;
    }

    const room = state.rooms.find(r => r.room_uid === uid);
    if (!room) return;

    const roomName = (room.room_name || "").toLowerCase();
    const roomType = (room.room_type || "").toLowerCase();
    const area = room.area_m2 || calculatePolygonArea(room.polygon || []);

    // Determine room category
    let cat = "generic";
    if (["bathroom", "ensuite", "wc", "shower"].some(k => roomName.includes(k) || roomType.includes(k))) cat = "bathroom";
    else if (["kitchen"].some(k => roomName.includes(k) || roomType.includes(k))) cat = "kitchen";
    else if (["bedroom", "master"].some(k => roomName.includes(k) || roomType.includes(k))) cat = "bedroom";
    else if (["living", "lounge", "sitting", "dining", "reception"].some(k => roomName.includes(k) || roomType.includes(k))) cat = "living";
    else if (["hall", "landing", "corridor", "circulation"].some(k => roomName.includes(k) || roomType.includes(k))) cat = "circulation";
    else if (["utility"].some(k => roomName.includes(k) || roomType.includes(k))) cat = "utility";

    const suggestions = {
        bathroom: { lights: 1, sockets: 1, switches: 1, extractor_fans: 1, smoke_alarms: 0, data_points: 0, tv_points: 0, hot_points: 2, cold_points: 2, waste_points: 2, radiators: 1 },
        kitchen: { lights: 2, sockets: Math.max(8, Math.ceil(area / 2.5)), switches: 2, extractor_fans: 1, smoke_alarms: 1, data_points: 0, tv_points: 0, hot_points: 2, cold_points: 2, waste_points: 2, radiators: 1 },
        bedroom: { lights: 1, sockets: Math.max(4, Math.ceil(area / 4)), switches: 1, extractor_fans: 0, smoke_alarms: 0, data_points: 1, tv_points: 1, hot_points: 0, cold_points: 0, waste_points: 0, radiators: 1 },
        living: { lights: 2, sockets: Math.max(6, Math.ceil(area / 3)), switches: 2, extractor_fans: 0, smoke_alarms: 0, data_points: 1, tv_points: 1, hot_points: 0, cold_points: 0, waste_points: 0, radiators: 1 },
        circulation: { lights: 1, sockets: 1, switches: 2, extractor_fans: 0, smoke_alarms: 1, data_points: 0, tv_points: 0, hot_points: 0, cold_points: 0, waste_points: 0, radiators: 0 },
        utility: { lights: 1, sockets: 4, switches: 1, extractor_fans: 1, smoke_alarms: 0, data_points: 0, tv_points: 0, hot_points: 1, cold_points: 1, waste_points: 1, radiators: 0 },
        generic: { lights: 1, sockets: Math.max(2, Math.ceil(area / 4)), switches: 1, extractor_fans: 0, smoke_alarms: 0, data_points: 0, tv_points: 0, hot_points: 0, cold_points: 0, waste_points: 0, radiators: 1 },
    };

    const sug = suggestions[cat] || suggestions.generic;

    // Populate inputs
    for (const [inputId, key] of Object.entries(FITTINGS_MAP)) {
        const el = document.getElementById(inputId);
        if (el && sug[key] !== undefined) el.value = sug[key];
    }

    const statusEl = document.getElementById("fittings-status");
    if (statusEl) {
        statusEl.textContent = `✨ Auto-suggested for "${cat}" room (${area.toFixed(1)} m²). Review and click Save.`;
        statusEl.style.color = "#17a2b8";
    }
}

// =======================
// DXF FITTINGS SCANNER
// =======================

async function uploadDxf() {
    const fileInput = document.getElementById("dxf-file");
    const statusEl = document.getElementById("dxf-status");
    if (!fileInput || !fileInput.files[0]) {
        alert("Please select a DXF file first.");
        return;
    }

    const file = fileInput.files[0];
    if (!file.name.toLowerCase().endsWith(".dxf")) {
        alert("Please select a .dxf file.");
        return;
    }

    const btn = document.getElementById("upload-dxf-btn");
    if (btn) { btn.disabled = true; btn.textContent = "⏳ Scanning..."; }
    if (statusEl) { statusEl.textContent = "Uploading and scanning DXF..."; statusEl.style.color = "blue"; }

    const formData = new FormData();
    formData.append("file", file);

    try {
        const resp = await fetch(`${API_BASE}/projects/${projectId}/dxf/upload`, {
            method: "POST",
            body: formData
        });

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err.error || `${resp.status} ${resp.statusText}`);
        }

        const result = await resp.json();

        // Update status
        if (statusEl) {
            statusEl.innerHTML = `
                ✅ DXF scan complete!<br>
                📦 ${result.total_inserts} blocks found,
                ✅ ${result.total_matched} matched,
                🏠 ${result.total_assigned} assigned to rooms
                ${result.unmatched_blocks.length > 0 ? `<br>⚠️ ${result.unmatched_blocks.length} unmatched block types` : ''}
            `;
            statusEl.style.color = "#28a745";
        }

        // Reload rooms to get updated fittings
        try {
            const roomsResp = await fetch(`${API_BASE}/projects/${projectId}/rooms`);
            if (roomsResp.ok) {
                const roomsData = await roomsResp.json();
                state.rooms = roomsData;
                renderRooms(state.rooms);
            }
        } catch (e) {
            console.warn("Could not reload rooms after DXF scan:", e);
        }

        // Show DXF active banner
        showDxfBanner(result);

        // Hide manual fittings section (DXF takes over)
        const fitSection = document.getElementById("fittings-section");
        if (fitSection) fitSection.style.display = "none";

    } catch (e) {
        console.error("DXF upload failed:", e);
        if (statusEl) { statusEl.textContent = "❌ DXF scan failed: " + e.message; statusEl.style.color = "red"; }
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = "📤 Scan DXF"; }
    }
}

function showDxfBanner(result) {
    const banner = document.getElementById("dxf-active-banner");
    const details = document.getElementById("dxf-banner-details");
    if (!banner) return;

    banner.style.display = "block";
    if (details) {
        details.textContent = `${result.total_matched || '?'} fittings detected, ${result.total_assigned || result.rooms_updated || '?'} assigned to rooms`;
    }
}

async function checkDxfStatus() {
    try {
        const resp = await fetch(`${API_BASE}/projects/${projectId}/dxf/status`);
        if (!resp.ok) return;
        const data = await resp.json();

        if (data.has_dxf && data.report) {
            showDxfBanner(data.report);
        }
    } catch (e) {
        console.warn("DXF status check failed:", e);
    }
}

// =======================
// WIPE (ISOLATED, DOES NOT TOUCH PLAN LOADER)
// =======================
async function wipeWorkspace() {
    if (!confirm("Are you sure? This will delete all current workspace data.")) return;

    try {
        const data = await apiJson(`/system/wipe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ confirm: true })
        });

        resetPlanUI();
        resetStoreysUI();
        state.storeys = [];
        state.rooms = [];
        setStatus("Workspace wiped.", "green");
    } catch (e) {
        console.error(e);
        alert("Wipe failed: " + e.message);
    }
}

// =======================
// UI / WIZARD NAVIGATION
// =======================
window.setStep = function (step) {
    // Update Tabs
    document.querySelectorAll('.wizard-step').forEach((el, idx) => {
        // Nav items in the top bar (indices 0-3)
        if (idx < 4) el.classList.toggle('active', idx + 1 === step);
    });

    // Update Content
    document.querySelectorAll('.wizard-content').forEach((el, idx) => {
        el.classList.toggle('active', idx + 1 === step);
    });
};

window.switchTenderTab = function (tab) {
    // Tab Styling
    const roomsTab = document.getElementById('tab-rooms');
    const packagesTab = document.getElementById('tab-packages');

    if (tab === 'rooms') {
        roomsTab.classList.add('active');
        packagesTab.classList.remove('active');
        document.getElementById('tender-dashboard-grid').style.display = 'flex';
        document.getElementById('package-dashboard-grid').style.display = 'none';
    } else {
        roomsTab.classList.remove('active');
        packagesTab.classList.add('active');
        document.getElementById('tender-dashboard-grid').style.display = 'none';
        document.getElementById('package-dashboard-grid').style.display = 'flex';
    }
};

// Toggle Advanced/Wizard
// Toggle Advanced/Wizard
const toggleBtn = document.getElementById("toggle-advanced-btn");
if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
        console.log("Toggle view clicked. Current key:", state.currentStoreyKey);
        const body = document.body;
        if (body.classList.contains("mode-wizard")) {
            body.classList.replace("mode-wizard", "mode-advanced");
            toggleBtn.textContent = "Switch to Wizard View";
            // Ensure plan loads if switching to advanced
            if (state.currentStoreyKey) {
                console.log("Loading plan silently...");
                loadPlan(state.currentStoreyKey, true);
            }
        } else {
            body.classList.replace("mode-advanced", "mode-wizard");
            toggleBtn.textContent = "Switch to Advanced View";
        }
    });
}

// Bind Wizard Upload Button
const wizUploadBtn = document.getElementById("wiz-upload-btn");
if (wizUploadBtn) {
    wizUploadBtn.addEventListener("click", () => {
        // divert to main upload function, but ensure we use the WIZARD input if needed
        // The main `uploadIfc` uses `uploadFile` which is `ifc-file` (Advanced).
        // We need to support `wiz-ifc-file` too.

        const wizFile = document.getElementById("wiz-ifc-file");
        if (wizFile && wizFile.files.length > 0) {
            // Swap the global reference temporarily or pass arg? 
            // Better to refactor uploadIfc to accept an input element, but for now:
            const file = wizFile.files[0];
            performUpload(file);
        } else {
            alert("Please select an IFC file in the Wizard step.");
        }
    });
}

// Refactored Upload Logic to share between Wizard/Advanced
async function performUpload(file) {
    if (!file) return alert("Please select an IFC file.");

    // Update status in both places
    const setGlobalStatus = (msg, color) => {
        setStatus(msg, color); // Advanced
        const wizStatus = document.getElementById("wiz-upload-status");
        if (wizStatus) { wizStatus.textContent = msg; wizStatus.style.color = color; }
    };

    if (uploadBtn) { uploadBtn.disabled = true; uploadBtn.textContent = "Processing..."; }
    if (wizUploadBtn) { wizUploadBtn.disabled = true; wizUploadBtn.textContent = "Processing..."; }

    setGlobalStatus("Uploading and processing geometry...", "#666");

    const formData = new FormData();
    formData.append("file", file);

    try {
        const data = await apiJson(`/projects/${projectId}/upload`, {
            method: "POST",
            body: formData
        });

        if (data.status !== "success" && data.status !== "processing_complete") {
            throw new Error(data.message || "IFC processing failed");
        }

        // AUTO-CLEAR OLD ROOMS (Client & Server)
        state.rooms = [];
        renderRooms([]);
        try {
            // Attempt silent delete on server
            await apiJson(`/projects/${projectId}/rooms`, { method: "DELETE" });
            console.log("Auto-cleared old rooms on server.");
        } catch (e) {
            console.warn("Could not auto-clear server rooms (Server might need restart):", e);
        }

        // FIX: Ensure we don't clear the dropdown if upload returns empty list
        const list = data.storeys || [];
        if (list.length > 0) {
            state.storeys = list;
        } else {
            console.warn("Upload returned no storeys. using default.");
            state.storeys = [{
                storey_name: "Default Storey",
                elevation: 0,
                storey_code: "0",
                storey_uid: "0"
            }];
        }

        renderStoreys(state.storeys);

        setGlobalStatus("Success! Storeys loaded.", "green");

        // If in Wizard, auto-advance advice or enable next step visually
        // For now just stay on step.

    } catch (e) {
        console.error(e);
        setGlobalStatus(`Upload failed: ${e.message}`, "red");
        alert("Failed to upload IFC.");
    } finally {
        if (uploadBtn) { uploadBtn.disabled = false; uploadBtn.textContent = "Upload & Process"; }
        if (wizUploadBtn) { wizUploadBtn.disabled = false; wizUploadBtn.textContent = "Upload & Process"; }
    }
}

// Update original uploadIfc to use shared logic
async function uploadIfc() {
    const file = uploadFile.files[0];
    performUpload(file);
}

// CSV Upload Logic
// CSV Upload Logic
// CSV Upload Logic
async function uploadCsv() {
    // Try Wizard Input first, then Advanced
    let fileInput = document.getElementById("wiz-csv-file");
    let file = fileInput?.files[0];

    // Fallback to advanced
    if (!file) {
        fileInput = document.getElementById("csv-file");
        file = fileInput?.files[0];
    }

    if (!file) return alert("Please select a CSV file.");

    // === AUTO-DETECT CLIENT NAME ===
    try {
        const text = await file.text();
        const lines = text.split('\n').slice(0, 10);
        let clientName = null;

        for (const line of lines) {
            // Look for "Name" at start of line
            if (line.toLowerCase().startsWith('name')) {
                // Split by comma or tab
                const parts = line.split(/[,;\t]/);
                if (parts.length > 1 && parts[1].trim()) {
                    clientName = parts[1].trim();
                    break;
                }
            }
        }

        if (clientName) {
            // Sanitize
            let newId = clientName.replace(/[^a-zA-Z0-9_\-]/g, '_');

            // If different from current ID
            if (newId && newId !== projectId) {
                if (confirm(`New Client Detected: "${clientName}".\n\nSwitch project to "${newId}"?`)) {
                    // Call Rename API
                    try {
                        const renameResp = await fetch(`${API_BASE}/api/projects/${projectId}/rename?new_name=${encodeURIComponent(newId)}`, {
                            method: "POST"
                        });

                        if (renameResp.ok) {
                            const rData = await renameResp.json();
                            if (rData.status === "success" || rData.status === "same_name") {
                                projectId = rData.new_id || newId;

                                // Update URL
                                const url = new URL(window.location);
                                url.searchParams.set('job_id', projectId);
                                window.history.pushState({}, '', url);

                                // Update UI Title
                                const pInfo = document.getElementById("project-info");
                                if (pInfo) {
                                    pInfo.textContent = "Project: " + projectId;
                                    pInfo.style.color = "green";
                                    pInfo.style.fontWeight = "bold";
                                }

                                alert(`✅ Project renamed to: ${projectId}\nProceeding with upload...`);
                            } else {
                                console.error("Rename failed data:", rData);
                                alert("Could not rename project: " + (rData.error || "Unknown error"));
                            }
                        } else {
                            const errText = await renameResp.text();
                            console.error("Rename API failed:", errText);
                            alert("Server Error during rename: " + renameResp.status);
                        }
                    } catch (renErr) {
                        console.error("Rename Network Error:", renErr);
                        alert("Network error during rename.");
                    }
                }
            }
        }
    } catch (e) {
        console.warn("Client detection error:", e);
    }
    // ===============================

    // UI Elements for both Helper
    const wizBtn = document.getElementById("wiz-upload-csv-btn");
    const wizStatus = document.getElementById("wiz-csv-status");

    const advBtn = document.getElementById("upload-csv-btn");
    const advStatus = document.getElementById("csv-status");

    // Lock UI
    if (wizBtn) { wizBtn.disabled = true; wizBtn.textContent = "Processing..."; }
    if (advBtn) { advBtn.disabled = true; advBtn.textContent = "Processing..."; }

    const setStatus = (msg, color) => {
        if (wizStatus) { wizStatus.textContent = msg; wizStatus.style.color = color; }
        if (advStatus) { advStatus.textContent = msg; advStatus.style.color = color; }
    };

    setStatus("Uploading CSV...", "#666");

    const formData = new FormData();
    formData.append("file", file);

    try {
        // Post to new CSV endpoint (using potentially NEW projectId)
        const data = await apiJson(`/projects/${projectId}/csv`, {
            method: "POST",
            body: formData
        });

        setStatus("Success! CSV scope loaded.", "green");

        // Refresh Consistency Check
        checkConsistency();

    } catch (e) {
        console.error("CSV Upload Error:", e);
        setStatus("Upload failed: " + e.message, "red");
        alert("Failed to upload CSV.");
    } finally {
        if (wizBtn) { wizBtn.disabled = false; wizBtn.textContent = "Upload & Classify"; }
        if (advBtn) { advBtn.disabled = false; advBtn.textContent = "Upload & Classify"; }
    }
}

// =======================
// IFC-AWARE GEOMETRY HELPERS
// =======================

/**
 * Ray-casting point-in-polygon test
 * @param {number} x - point x
 * @param {number} y - point y
 * @param {Array} polygon - array of [x,y] pairs
 * @returns {boolean}
 */
function isPointInPolygon(x, y, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
}

/**
 * Check if two polygons overlap (lightweight: checks if any vertex of A is inside B or vice versa)
 */
function polygonsOverlap(polyA, polyB) {
    // Check if any point of A is inside B
    if (polyA.some(p => isPointInPolygon(p[0], p[1], polyB))) return true;
    // Check if any point of B is inside A
    if (polyB.some(p => isPointInPolygon(p[0], p[1], polyA))) return true;
    return false;
}

/**
 * Get bounding box center of an SVG group element in SVG coordinate space
 */
function getGroupCenter(groupEl) {
    try {
        const bbox = groupEl.getBBox();
        return [bbox.x + bbox.width / 2, bbox.y + bbox.height / 2];
    } catch (_) {
        return null;
    }
}

/**
 * Scan SVG for IFC elements inside a given polygon
 * Returns { doors: count, windows: count, spaces: [{name, area, guid}] }
 */
function detectIfcElementsInPolygon(svg, polygon) {
    const result = { doors: 0, windows: 0, walls: 0, spaces: [] };
    if (!svg || polygon.length < 3) return result;

    const polyArr = polygon.map(p => Array.isArray(p) ? p : [p.x, p.y]);

    // Scan all IFC groups
    const groups = svg.querySelectorAll('g[class^="Ifc"], g[class^="ifc"]');
    groups.forEach(g => {
        const cls = (g.getAttribute('class') || '').toLowerCase(); // normalizing
        const center = getGroupCenter(g);
        if (!center) return;

        const inside = isPointInPolygon(center[0], center[1], polyArr);
        if (!inside) return;

        if (cls.includes('ifcdoor')) result.doors++;
        else if (cls.includes('ifcwindow')) result.windows++;
        else if (cls.includes('ifcwall')) result.walls++;
        else if (cls.includes('ifcspace')) {
            const name = g.getAttribute('data-name') || 'Space';
            const guid = g.getAttribute('data-guid') || '';
            // Try to compute space area from its bounding box
            try {
                const bbox = g.getBBox();
                const spaceArea = bbox.width * bbox.height;
                result.spaces.push({ name, guid, area: spaceArea });
            } catch (_) {
                result.spaces.push({ name, guid, area: 0 });
            }
        }
    });

    console.log(`IFC Detection: ${result.doors} doors, ${result.windows} windows, ${result.walls} walls, ${result.spaces.length} spaces`);
    return result;
}

// =======================
// ROOM POLYGON TOOL
// =======================
let isDrawing = false;
let currentPoints = []; // Array of {x, y}
let tempPolyLine = null; // SVG element for visual feedback
let pointMarkers = []; // Circle markers for each clicked point
let clickTimer = null; // Timer to distinguish click from dblclick
let liveFeedbackGroup = null; // SVG group for live area/point feedback
let highlightedElements = []; // Track elements highlighted during drawing

function getSvgPoint(evt) {
    if (!state.svgEl) return null;
    const pt = state.svgEl.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    // Transform to SVG coordinates
    const val = pt.matrixTransform(state.svgEl.getScreenCTM().inverse());
    return { x: val.x, y: val.y };
}

function getSvgScale() {
    if (!state.svgEl) return 1;
    const vb = state.svgEl.getAttribute("viewBox");
    if (!vb) return 1;
    const parts = vb.split(/[\s,]+/).map(Number);
    const w = parts[2] || 100;
    const h = parts[3] || 100;
    return Math.max(w, h) / 500; // scale factor: 1 unit per 500px equivalent
}

function attachDrawListeners() {
    if (!state.svgEl) return;
    state.svgEl.addEventListener("click", onSvgClick);
    state.svgEl.addEventListener("dblclick", onSvgDblClick);
    state.svgEl.addEventListener("mousemove", onDrawMouseMove);
    state.svgEl.addEventListener("mouseout", onDrawMouseOut);
    state.svgEl.style.cursor = "crosshair";
}

function detachDrawListeners() {
    if (!state.svgEl) return;
    state.svgEl.removeEventListener("click", onSvgClick);
    state.svgEl.removeEventListener("dblclick", onSvgDblClick);
    state.svgEl.removeEventListener("mousemove", onDrawMouseMove);
    state.svgEl.removeEventListener("mouseout", onDrawMouseOut);
    state.svgEl.style.cursor = "";
}

function onSvgClick(evt) {
    if (!isDrawing) return;
    evt.preventDefault();
    evt.stopPropagation();
    // Delay to distinguish from dblclick
    if (clickTimer) clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
        addPoint(evt);
    }, 250);
}

function onSvgDblClick(evt) {
    if (!isDrawing) return;
    evt.preventDefault();
    evt.stopPropagation();
    // Cancel the pending single-click
    if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
    finishDrawing();
}

function startDrawing() {
    if (!state.svgEl) return alert("No plan loaded to draw on.");
    isDrawing = true;
    currentPoints = [];
    pointMarkers = [];
    highlightedElements = [];

    // UI Updates
    document.getElementById("start-draw-btn").disabled = true;
    document.getElementById("undo-btn").disabled = false;
    document.getElementById("finish-btn").disabled = false;
    document.getElementById("clear-draw-btn").disabled = false;

    // Create new polyline for feedback
    tempPolyLine = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    tempPolyLine.setAttribute("fill", "none");
    tempPolyLine.setAttribute("stroke", "#007bff");
    const scale = getSvgScale();
    tempPolyLine.setAttribute("stroke-width", String(scale * 1.5));
    tempPolyLine.setAttribute("points", "");
    tempPolyLine.style.pointerEvents = "none";
    state.svgEl.appendChild(tempPolyLine);

    // Create live feedback group
    liveFeedbackGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    liveFeedbackGroup.setAttribute("class", "live-feedback");
    liveFeedbackGroup.style.pointerEvents = "none";
    state.svgEl.appendChild(liveFeedbackGroup);

    // Attach listeners directly to SVG element (includes IFC hover highlight)
    attachDrawListeners();

    setStatus("Drawing mode: Click points on the plan. Double-click to finish.", "blue");
}

function addPoint(evt) {
    if (!isDrawing) return;
    const pt = getSvgPoint(evt);
    if (!pt) return;

    currentPoints.push(pt);

    // Add a circle marker at the clicked point
    const scale = getSvgScale();
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", pt.x);
    circle.setAttribute("cy", pt.y);
    circle.setAttribute("r", String(scale * 2));
    circle.setAttribute("fill", "#ff0000");
    circle.setAttribute("stroke", "#fff");
    circle.setAttribute("stroke-width", String(scale * 0.5));
    circle.style.pointerEvents = "none";
    state.svgEl.appendChild(circle);
    pointMarkers.push(circle);

    updatePolyVisual();
    updateLiveFeedback();
    console.log(`Point ${currentPoints.length} added: (${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`);
}

function updatePolyVisual() {
    if (!tempPolyLine) return;
    const pointsStr = currentPoints.map(p => `${p.x},${p.y}`).join(" ");
    tempPolyLine.setAttribute("points", pointsStr);
}

/**
 * FEATURE 4 — Live Drawing Feedback
 * Shows current area, point count, and detected IFC elements while drawing
 */
function updateLiveFeedback() {
    if (!liveFeedbackGroup || currentPoints.length < 1) return;

    // Clear previous feedback
    liveFeedbackGroup.innerHTML = '';

    const scale = getSvgScale();
    const polyArr = currentPoints.map(p => [p.x, p.y]);

    // Calculate centroid for label placement
    const centroid = getPolygonCentroid(polyArr);

    let lines = [`Points: ${currentPoints.length}`];

    if (currentPoints.length >= 3) {
        // PATCH: calculatePolygonArea already handles unit conversion via viewBox check
        const areaM2 = calculatePolygonArea(polyArr);
        lines.push(`Area: ${areaM2.toFixed(2)} m²`);

        // Detect IFC elements inside the polygon
        const ifc = detectIfcElementsInPolygon(state.svgEl, polyArr);
        if (ifc.doors > 0) lines.push(`Doors: ${ifc.doors}`);
        if (ifc.windows > 0) lines.push(`Windows: ${ifc.windows}`);
        if (ifc.walls > 0) lines.push(`Walls: ${ifc.walls}`);
        if (ifc.spaces.length > 0) {
            const ifcArea = ifc.spaces.reduce((s, sp) => s + sp.area, 0);
            const ifcAreaM2 = calculatePolygonArea([[0, 0], [ifcArea, 0], [ifcArea, 1], [0, 1]]) > 0 ? ifcArea : 0;
            lines.push(`IFC Spaces: ${ifc.spaces.length}`);
        }
    }

    // Render feedback text
    lines.forEach((line, i) => {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", centroid[0]);
        text.setAttribute("y", centroid[1] + i * scale * 8);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "middle");
        text.setAttribute("font-size", String(scale * 6));
        text.setAttribute("fill", "#007bff");
        text.setAttribute("font-weight", "bold");
        text.style.pointerEvents = "none";
        text.textContent = line;
        liveFeedbackGroup.appendChild(text);
    });
}

function undoPoint() {
    if (!isDrawing || currentPoints.length === 0) return;
    currentPoints.pop();
    // Remove last circle marker
    if (pointMarkers.length > 0) {
        pointMarkers.pop().remove();
    }
    updatePolyVisual();
    updateLiveFeedback();
}

function finishDrawing() {
    if (!isDrawing) return;
    if (currentPoints.length < 3) {
        alert("A room requires at least 3 points. You have " + currentPoints.length + ".");
        return;
    }

    const newPoly = currentPoints.map(p => [p.x, p.y]);

    // FEATURE 3 — Overlap Prevention
    const overlapping = state.rooms.some(existing => {
        if (!Array.isArray(existing.polygon) || existing.polygon.length < 3) return false;
        // Only check rooms on same storey
        if (state.currentStoreyCode && existing.storey_code !== state.currentStoreyCode) return false;
        return polygonsOverlap(existing.polygon, newPoly);
    });

    if (overlapping) {
        alert("⚠ Room overlaps an existing room! Please adjust your polygon or delete the existing room first.");
        // Don't finish — let user adjust
        return;
    }

    isDrawing = false;
    detachDrawListeners();
    if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
    clearHighlights();

    // UI Updates
    document.getElementById("start-draw-btn").disabled = false;
    document.getElementById("undo-btn").disabled = true;
    document.getElementById("finish-btn").disabled = true;

    // FEATURE 1 — IFC Space Detection & Area Comparison
    const polyArea = calculatePolygonArea(newPoly);
    const ifcInfo = detectIfcElementsInPolygon(state.svgEl, newPoly);

    let statusMsg = `Room: ${polyArea.toFixed(2)} m²`;

    // Check for IFC spaces
    if (ifcInfo.spaces.length > 0) {
        const totalIfcArea = ifcInfo.spaces.reduce((s, sp) => s + sp.area, 0);
        // Apply same unit conversion
        let convFactor = 1;
        if (state.svgEl) {
            const vb = state.svgEl.getAttribute("viewBox");
            if (vb) {
                const parts = vb.split(/[\s,]+/).map(Number);
                if (Math.max(Math.abs(parts[2] || 0), Math.abs(parts[3] || 0)) > 100) convFactor = 1 / 1000000;
            }
        }
        const ifcAreaM2 = totalIfcArea * convFactor;
        const delta = polyArea - ifcAreaM2;
        const deltaColor = Math.abs(delta) < 0.2 ? 'green' : 'orange';
        statusMsg += ` | IFC: ${ifcAreaM2.toFixed(2)} m² | Δ: ${delta >= 0 ? '+' : ''}${delta.toFixed(2)} m²`;
        console.log(`IFC comparison: Poly=${polyArea.toFixed(2)}, IFC=${ifcAreaM2.toFixed(2)}, Delta=${delta.toFixed(2)}`);
    }

    // FEATURE 2 — Door & Window counts
    if (ifcInfo.doors > 0) statusMsg += ` | Doors: ${ifcInfo.doors}`;
    if (ifcInfo.windows > 0) statusMsg += ` | Windows: ${ifcInfo.windows}`;

    // Submit Room
    submitRoom(currentPoints);

    // Cleanup temporary visual
    if (tempPolyLine) tempPolyLine.remove();
    tempPolyLine = null;
    if (liveFeedbackGroup) liveFeedbackGroup.remove();
    liveFeedbackGroup = null;
    pointMarkers.forEach(m => m.remove());
    pointMarkers = [];
    currentPoints = [];
    setStatus(statusMsg, "green");
}

function resetDrawing() {
    isDrawing = false;
    currentPoints = [];
    if (tempPolyLine) tempPolyLine.remove();
    tempPolyLine = null;
    if (liveFeedbackGroup) liveFeedbackGroup.remove();
    liveFeedbackGroup = null;
    pointMarkers.forEach(m => m.remove());
    pointMarkers = [];
    if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
    detachDrawListeners();
    clearHighlights();

    document.getElementById("start-draw-btn").disabled = false;
    document.getElementById("undo-btn").disabled = true;
    document.getElementById("finish-btn").disabled = true;
    setStatus("Drawing cancelled.", "#666");
}

// =======================
// FEATURE 5 — Visual IFC Highlighting During Drawing
// =======================
function onDrawMouseMove(evt) {
    if (!isDrawing || !state.svgEl) return;

    // Walk up to find IFC group
    // PATCH: Handle blocking polygons using elementFromPoint
    let node = evt.target;

    // If hovering a room polygon, hide it momentarily to see what's under
    if (node.classList && node.classList.contains('room-poly')) {
        const prevDisplay = node.style.display;
        node.style.display = 'none';
        const realEl = document.elementFromPoint(evt.clientX, evt.clientY);
        node.style.display = prevDisplay;
        if (realEl) node = realEl;
    }

    while (node && node !== state.svgEl) {
        if (node.tagName === 'g' && node.getAttribute('class')) {
            const cls = node.getAttribute('class');
            if (cls.toLowerCase().startsWith('ifc')) {
                // Apply highlight
                if (!node.dataset.origStroke) {
                    node.dataset.origStroke = node.style.outline || '';
                }
                node.style.outline = '2px solid #00ccff';
                node.style.outlineOffset = '-1px';
                // Track for cleanup
                if (!highlightedElements.includes(node)) {
                    highlightedElements.push(node);
                }
                return;
            }
        }
        node = node.parentElement;
    }
}

function onDrawMouseOut(evt) {
    if (!isDrawing) return;
    let node = evt.target;
    while (node && node !== state.svgEl) {
        if (node.tagName === 'g' && node.dataset.origStroke !== undefined) {
            node.style.outline = node.dataset.origStroke;
            delete node.dataset.origStroke;
            return;
        }
        node = node.parentElement;
    }
}

function clearHighlights() {
    highlightedElements.forEach(el => {
        el.style.outline = '';
        delete el.dataset.origStroke;
    });
    highlightedElements = [];
}

async function submitRoom(points) {
    const roomName = document.getElementById("room-name").value || "New Room";
    const roomType = document.getElementById("room-type").value || "Generic";

    const payload = {
        project_id: projectId,
        rooms: [{
            storey_code: state.currentStoreyCode,
            room_name: roomName,
            room_type: roomType,
            polygon: points.map(p => [p.x, p.y])
        }]
    };

    try {
        await apiJson(`/projects/${projectId}/rooms`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        setStatus("Room saved successfully!", "green");
        loadRoomsAndRender(); // Refresh list/visuals
    } catch (e) {
        console.error(e);
        setStatus("Failed to save room: " + e.message, "red");
    }
}


// =======================
// TENDER GENERATION & DASHBOARD
// =======================

async function generateTender() {
    const btn = document.getElementById("generate-tender-btn");
    if (btn) {
        btn.disabled = true;
        btn.textContent = "⏳ Generating...";
    }
    setStatus("Generating tender packages...", "blue");

    try {
        const resp = await fetch(`${API_BASE}/projects/${projectId}/tender/generate`, { method: "POST" });
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err.error || `${resp.status} ${resp.statusText}`);
        }
        const tender = await resp.json();
        renderTenderDashboard(tender);
        setStatus(`Tender generated: ${tender.total_rooms} rooms`, "green");
    } catch (e) {
        console.error("Tender generation failed:", e);
        alert("Failed to generate tender: " + e.message);
        setStatus("Tender generation failed.", "red");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = "⚡ Generate Tender Packages";
        }
    }
}

/* ========================
   TENDER DASHBOARD (Refactored)
   ======================== */
function renderTenderDashboard(tender) {
    if (!tender) return;

    // 1. Calculations
    const totalRooms = tender.rooms ? tender.rooms.length : 0;
    let totalScope = 0;
    let allocated = 0;

    if (tender.rooms) {
        tender.rooms.forEach(r => {
            let rScope = 0;
            let rAlloc = 0;
            if (r.sections) {
                r.sections.forEach(s => {
                    if (s.items) {
                        s.items.forEach(i => {
                            totalScope++;
                            rScope++;
                            if (i.source && i.source !== "REQ" && i.source !== "NONE") {
                                allocated++;
                                rAlloc++;
                            }
                        });
                    }
                });
            }
            // Store completion for sorting
            r.completion = rScope > 0 ? (rAlloc / rScope) * 100 : 0;
        });

        // SORT: Least complete first
        tender.rooms.sort((a, b) => a.completion - b.completion);
    }

    const completion = totalScope > 0 ? Math.round((allocated / totalScope) * 100) : 0;

    // 2. Update Metrics UI (Wizard Step 4)
    const mRooms = document.getElementById("metric-rooms");
    if (mRooms) mRooms.textContent = totalRooms;

    const mScope = document.getElementById("metric-scope");
    if (mScope) mScope.textContent = totalScope;

    const mAlloc = document.getElementById("metric-allocated");
    if (mAlloc) mAlloc.textContent = allocated;

    const mComp = document.getElementById("metric-completion");
    if (mComp) mComp.textContent = completion + "%";

    // 2b. ADDITIVE: Populate Budget Summary Bar
    const fmtGBP = (v) => "£" + Number(v || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const tenderTotal = tender.tender_total || 0;
    const hbxlTotal = tender.hbxl_budget_total || 0;
    const variance = tender.variance || 0;
    const bl = tender.budget_ledger || {};

    const elTT = document.getElementById("metric-tender-total");
    if (elTT) elTT.textContent = fmtGBP(tenderTotal);

    const elHT = document.getElementById("metric-hbxl-total");
    if (elHT) elHT.textContent = fmtGBP(hbxlTotal);

    const elVar = document.getElementById("metric-variance");
    if (elVar) {
        elVar.textContent = (variance >= 0 ? "+" : "") + fmtGBP(variance);
        elVar.style.color = variance > 0 ? "#ff6b6b" : variance < 0 ? "#4ecdc4" : "#aaa";
    }

    const elLMP = document.getElementById("metric-lmp-split");
    if (elLMP) {
        elLMP.textContent = `${fmtGBP(bl.labour_total)} / ${fmtGBP(bl.material_total)} / ${fmtGBP(bl.plant_total)}`;
    }

    // 3. Populate Wizard Grid (tender-dashboard-grid)
    const wizardGrid = document.getElementById("tender-dashboard-grid");
    if (wizardGrid) {
        wizardGrid.innerHTML = "";
        if (totalRooms === 0) {
            wizardGrid.innerHTML = `<div style="text-align:center; padding:50px; color:#999;">No rooms found.</div>`;
        } else {
            tender.rooms.forEach(room => {
                const card = createRoomCard(room);
                wizardGrid.appendChild(card);
            });
        }
    }

    // 4. Populate Legacy Grid (tender-cards) if active
    const legacyDashboard = document.getElementById("tender-dashboard");
    const legacyCards = document.getElementById("tender-cards");
    if (legacyDashboard && legacyCards) {
        legacyDashboard.style.display = "block";
        legacyCards.innerHTML = "";
        if (tender.rooms) {
            tender.rooms.forEach(room => {
                const card = createRoomCard(room);
                legacyCards.appendChild(card);
            });
        }

        const tsEl = document.getElementById("tender-timestamp");
        if (tsEl && tender.generated_at) {
            tsEl.textContent = `Generated: ${new Date(tender.generated_at).toLocaleTimeString()}`;
        }
    }
}

// =======================
// INIT (NO DUPLICATE LISTENERS)
// =======================
function bindEvents() {
    uploadBtn.addEventListener("click", uploadIfc);
    loadPlanBtn.addEventListener("click", () => loadPlan());
    storeySelect.addEventListener("change", syncSelectedStorey);

    // Wizard CSV Button
    const wizCsvBtn = document.getElementById("wiz-upload-csv-btn");
    if (wizCsvBtn) wizCsvBtn.addEventListener("click", uploadCsv);

    // Wizard Auto-Run Button
    const wizRunBtn = document.getElementById("wiz-autorun-btn");
    console.log("Binding Auto-Run Btn:", wizRunBtn);
    if (wizRunBtn) {
        wizRunBtn.removeEventListener("click", startAutoRun);
        wizRunBtn.addEventListener("click", startAutoRun);
    }

    // Advanced CSV Button
    const advCsvBtn = document.getElementById("upload-csv-btn");
    if (advCsvBtn) advCsvBtn.addEventListener("click", uploadCsv);

    // if you have a wipe button:
    const wipeBtn = document.getElementById("header-wipe-btn");
    if (wipeBtn) wipeBtn.addEventListener("click", wipeWorkspace);

    // DRAWING TOOLS
    document.getElementById("start-draw-btn").addEventListener("click", startDrawing);
    document.getElementById("undo-btn").addEventListener("click", undoPoint);
    document.getElementById("finish-btn").addEventListener("click", finishDrawing);
    document.getElementById("clear-draw-btn").addEventListener("click", resetDrawing);

    // SVG drawing events are attached/detached dynamically in startDrawing/finishDrawing

    // DELETE ALL BTN
    const delRoomsBtn = document.getElementById("delete-all-rooms-btn");
    if (delRoomsBtn) delRoomsBtn.addEventListener("click", deleteAllRooms);

    // DELETE PLANS BTN
    const delPlansBtn = document.getElementById("delete-plans-btn");
    if (delPlansBtn) delPlansBtn.addEventListener("click", deletePlans);

    // TENDER GENERATION
    const tenderBtn = document.getElementById("generate-tender-btn");
    if (tenderBtn) tenderBtn.addEventListener("click", generateTender);

    // Toggle tender dashboard
    const toggleBtn = document.getElementById("toggle-tender-btn");
    if (toggleBtn) toggleBtn.addEventListener("click", () => {
        const cards = document.getElementById("tender-cards");
        if (cards) {
            const hidden = cards.style.display === "none";
            cards.style.display = hidden ? "grid" : "none";
            toggleBtn.textContent = hidden ? "Hide" : "Show";
        }
    });

    // FITTINGS BUTTONS
    const saveFitBtn = document.getElementById("save-fittings-btn");
    if (saveFitBtn) saveFitBtn.addEventListener("click", saveFittings);

    const resetFitBtn = document.getElementById("reset-fittings-btn");
    if (resetFitBtn) resetFitBtn.addEventListener("click", resetFittings);

    const suggestFitBtn = document.getElementById("suggest-fittings-btn");
    if (suggestFitBtn) suggestFitBtn.addEventListener("click", suggestFittings);

    // DXF UPLOAD BUTTON
    const dxfBtn = document.getElementById("upload-dxf-btn");
    if (dxfBtn) dxfBtn.addEventListener("click", uploadDxf);

    // Update Project Info
    const pInfo = document.getElementById("project-info");
    if (pInfo) pInfo.textContent = "Project: " + projectId;

    // Check DXF status on load
    checkDxfStatus();

    const resetBtn = document.getElementById("reset-project-btn");
    if (resetBtn) resetBtn.addEventListener("click", resetProject);

    // Check CSV Consistency on load
    checkConsistency();

    // Bind Show Details button
    const detailsBtn = document.getElementById("show-details-btn");
    if (detailsBtn) detailsBtn.addEventListener("click", checkConsistency);
}

async function deleteAllRooms() {
    if (!confirm("Are you sure you want to delete ALL rooms? This cannot be undone.")) return;
    try {
        await apiJson(`/projects/${projectId}/rooms`, { method: "DELETE" });
        state.rooms = [];
        renderRooms([]);
        setStatus("All rooms deleted.", "green");
    } catch (e) {
        console.error(e);
        alert("Failed to delete rooms: " + e.message);
    }
}

async function deletePlans() {
    if (!confirm("Are you sure you want to delete ALL plans? This helps if you see old drawings.")) return;
    try {
        await apiJson(`/projects/${projectId}/plans`, { method: "DELETE" });
        resetPlanUI();
        resetStoreysUI();
        state.storeys = [];
        setStatus("All plans deleted. Please upload a new IFC.", "green");
    } catch (e) {
        console.error(e);
        alert("Failed to delete plans: " + e.message);
    }
}

async function init() {
    console.log("App init running...");
    bindEvents();

    // load storeys if already exist on server
    try {
        console.log("Fetching storeys...");
        const data = await apiJson(`/projects/${projectId}/storeys`);
        console.log("Storeys fetch response:", data);

        // Handle response being a raw array OR an object with .storeys
        const list = Array.isArray(data) ? data : (data.storeys || []);

        if (list.length) {
            console.log("Storeys found from API:", list);
            state.storeys = list;
            renderStoreys(state.storeys);
        } else {
            // FORCE FALLBACK if empty
            console.warn("No storeys returned. Forcing default.");
            state.storeys = [{
                storey_name: "Default Storey",
                elevation: 0,
                storey_code: "0",
                storey_uid: "0"
            }];
            renderStoreys(state.storeys);
        }
    } catch (e) {
        console.warn("Could not load initial storeys:", e);
        // FORCE FALLBACK ON ERROR
        state.storeys = [{
            storey_name: "Default Storey (Recovery)",
            elevation: 0,
            storey_code: "0",
            storey_uid: "0"
        }];
        renderStoreys(state.storeys);
    }
}

window.addEventListener("DOMContentLoaded", init);

// =======================
// CONSISTENCY CHECK
// =======================
async function checkConsistency() {
    const statusEl = document.getElementById("consistency-status");
    if (!statusEl) return;

    statusEl.innerHTML = "⏳ Checking...";
    statusEl.style.color = "#666"; // Reset color

    try {
        const resp = await fetch(`${API_BASE}/projects/${projectId}/csv/consistency`);
        if (!resp.ok) throw new Error("API Error");

        const data = await resp.json();
        const report = data.report || {};

        // Show message
        statusEl.innerHTML = report.message || "Unknown Status";

        // Style based on status
        if (report.status === "ok") {
            statusEl.style.color = "green";
        } else if (report.status === "missing") {
            statusEl.innerText = "No CSV found.";
            statusEl.style.color = "orange";
        } else if (report.status === "empty") {
            statusEl.style.color = "orange";
        } else {
            statusEl.style.color = "red";
        }

    } catch (e) {
        console.error("Consistency Check Failed:", e);
        statusEl.textContent = "Check Failed.";
        statusEl.style.color = "red";
    }
}

// =======================
// RESET PROJECT
// =======================
async function resetProject() {
    if (!confirm("⚠ WARNING: This will DELETE ALL DATA (Drawings, CSV, Tender) for this project.\n\nAre you sure you want to start fresh?")) {
        return;
    }

    let btn = document.getElementById("reset-project-btn");
    let originalText = "";
    if (btn) {
        originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = "Resetting...";
    }

    try {
        const resp = await fetch(`${API_BASE}/projects/${projectId}/reset`, {
            method: "DELETE"
        });

        if (!resp.ok) throw new Error("Reset failed");

        const data = await resp.json();
        alert(data.message);

        // Reload to clear UI
        location.reload();

    } catch (e) {
        console.error(e);
        alert("Failed to reset project: " + e.message);
        if (btn) {
            btn.disabled = false;
            btn.textContent = originalText || "⚠ RESET PROJECT";
        }
    }
}

/* ========================
   DASHBOARD HELPERS
   ======================== */
function getSourceTag(source) {
    if (source === "IFC_AUTO") return `<span style="background:#e6fff0;color:#00994d;padding:1px 6px;border-radius:3px;font-size:0.75em;margin-left:6px;">IFC</span>`;
    if (source === "DXF_AUTO") return `<span style="background:#fff3e0;color:#e65100;padding:1px 6px;border-radius:3px;font-size:0.75em;margin-left:6px;">DXF</span>`;
    return `<span style="background:#e6f0ff;color:#0055aa;padding:1px 6px;border-radius:3px;font-size:0.75em;margin-left:6px;">Manual</span>`;
}

function createRoomCard(room) {
    const card = document.createElement("div");
    card.style.cssText = "background:#fff; border:1px solid #ddd; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08); display:flex; flex-direction:column; break-inside: avoid;";

    const sourceTag = getSourceTag(room.source);

    const completion = Math.round(room.completion || 0);
    const compColor = completion === 100 ? '#28a745' : (completion > 0 ? '#ffc107' : '#dc3545');

    let headerHtml = `
        <div style="background:linear-gradient(135deg, #1a1a2e, #16213e); color:#fff; padding:12px 15px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-size:1.1em; font-weight:bold;">${room.room_name} ${sourceTag}</div>
                <div style="font-size:0.8em; opacity:0.8; margin-top:3px;">${room.room_type}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:1.2em; font-weight:bold; color:${compColor}">${completion}%</div>
            </div>
        </div>
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:1px; background:#eee; font-size:0.78em;">
            <div style="background:#f8f9fa; padding:6px; text-align:center;">
                <div style="color:#666;">Area</div>
                <div style="font-weight:bold;">${parseFloat(room.floor_area_m2).toFixed(2)} m²</div>
            </div>
            <div style="background:#f8f9fa; padding:6px; text-align:center;">
                <div style="color:#666;">Perimeter</div>
                <div style="font-weight:bold;">${parseFloat(room.perimeter_m).toFixed(2)} m</div>
            </div>
            <div style="background:#f8f9fa; padding:6px; text-align:center;">
                <div style="color:#666;">Height</div>
                <div style="font-weight:bold;">${parseFloat(room.ceiling_height_m).toFixed(2)} m</div>
            </div>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1px; background:#eee; font-size:0.78em;">
            <div style="background:#f8f9fa; padding:4px; text-align:center;">🚪 Doors: <b>${room.n_doors}</b></div>
            <div style="background:#f8f9fa; padding:4px; text-align:center;">🪟 Windows: <b>${room.n_windows}</b></div>
        </div>
    `;

    // Sections Body
    let sectionsHtml = '<div style="padding:10px; flex:1;">';

    const tradeColors = {
        "Electrical": { bg: "#fff3cd", border: "#ffc107", icon: "⚡" },
        "Plumbing": { bg: "#d1ecf1", border: "#17a2b8", icon: "🔧" },
        "Joinery": { bg: "#f5e6d3", border: "#c68642", icon: "🪵" },
        "Finishes": { bg: "#e8daef", border: "#8e44ad", icon: "🎨" },
    };

    const fixColors = {
        "FIRST_FIX": { label: "1st Fix", bg: "#e65100", text: "#fff" },
        "SECOND_FIX": { label: "2nd Fix", bg: "#2e7d32", text: "#fff" },
    };

    const firstFix = room.sections.filter(s => s.fix === "FIRST_FIX");
    const secondFix = room.sections.filter(s => s.fix === "SECOND_FIX");

    [
        { label: "FIRST FIX", sections: firstFix, fixKey: "FIRST_FIX" },
        { label: "SECOND FIX", sections: secondFix, fixKey: "SECOND_FIX" }
    ].forEach(phase => {
        if (phase.sections.length === 0) return;
        const fc = fixColors[phase.fixKey];

        sectionsHtml += `
            <div style="margin-bottom:10px;">
                <div style="background:${fc.bg}; color:${fc.text}; padding:4px 10px; border-radius:4px; font-weight:bold; font-size:0.85em; margin-bottom:6px;">
                    ${phase.label}
                </div>
        `;

        phase.sections.forEach(section => {
            const tc = tradeColors[section.trade] || { bg: "#f0f0f0", border: "#999", icon: "📦" };

            sectionsHtml += `
                <div style="margin-bottom:8px; border-left:3px solid ${tc.border}; padding-left:8px;">
                    <div style="font-size:0.8em; font-weight:bold; color:#555; margin-bottom:3px;">
                        ${tc.icon} ${section.trade}
                    </div>
                </div>
                <table style="width:100%; font-size:0.8em; border-collapse:collapse; margin-bottom:5px;">
                    <thead>
                        <tr style="background:#f8f9fa; border-bottom:2px solid #dee2e6;">
                            <th style="padding:3px 4px; text-align:left; font-weight:600; color:#495057;">Description</th>
                            <th style="padding:3px 4px; text-align:right; font-weight:600; color:#495057;">Qty</th>
                            <th style="padding:3px 4px; text-align:center; font-weight:600; color:#495057;">Unit</th>
                            <th style="padding:3px 4px; text-align:right; font-weight:600; color:#495057;">Unit Price</th>
                            <th style="padding:3px 4px; text-align:right; font-weight:600; color:#495057;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            section.items.forEach(item => {
                let badge = "";
                const src = item.source || "";
                if (src === "IFC") badge = `<span class="source-badge ifc">IFC</span>`;
                else if (src === "MANUAL") badge = `<span class="source-badge manual">MANUAL</span>`;
                else if (src === "GEO") badge = `<span class="source-badge geo">GEO</span>`;
                else if (src === "REQ") badge = `<span class="source-badge req">REQ</span>`;
                else if (src === "DXF") badge = `<span class="source-badge dxf">DXF</span>`;

                // Pricing fields (additive — default to 0 if missing for older data)
                const unitPrice = item.unit_price || 0;
                const totalPrice = item.total_price || 0;
                const priceDisplay = unitPrice > 0 ? `£${unitPrice.toFixed(2)}` : '—';
                const totalDisplay = totalPrice > 0 ? `£${totalPrice.toFixed(2)}` : '—';

                sectionsHtml += `
                    <tr style="border-bottom:1px solid #f0f0f0;">
                        <td style="padding:2px 4px; color:#333;">${item.description}${badge}</td>
                        <td style="padding:2px 4px; text-align:right; font-weight:bold; white-space:nowrap;">${item.qty}</td>
                        <td style="padding:2px 4px; text-align:center; color:#666;">${item.unit}</td>
                        <td style="padding:2px 4px; text-align:right; color:#888; white-space:nowrap;">${priceDisplay}</td>
                        <td style="padding:2px 4px; text-align:right; font-weight:bold; white-space:nowrap;">${totalDisplay}</td>
                    </tr>
                `;
            });

            sectionsHtml += `</tbody></table>`;
        });
        sectionsHtml += `</div>`;
    });

    // Tender Summary footer (ADDITIVE — only show if tender_summary exists)
    const ts = room.tender_summary;
    if (ts) {
        sectionsHtml += `
            <div style="border-top:2px solid #dee2e6; margin-top:8px; padding-top:8px; font-size:0.82em;">
                <div style="display:flex; justify-content:space-between; padding:2px 0;">
                    <span style="color:#666;">1st Fix Subtotal</span>
                    <span style="font-weight:bold;">${ts.subtotal_first_fix > 0 ? '£' + ts.subtotal_first_fix.toFixed(2) : '—'}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:2px 0;">
                    <span style="color:#666;">2nd Fix Subtotal</span>
                    <span style="font-weight:bold;">${ts.subtotal_second_fix > 0 ? '£' + ts.subtotal_second_fix.toFixed(2) : '—'}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:4px 0; border-top:1px solid #adb5bd; margin-top:4px; font-size:1.05em;">
                    <span style="font-weight:bold;">Room Total</span>
                    <span style="font-weight:bold; color:#0d6efd;">${ts.subtotal_room > 0 ? '£' + ts.subtotal_room.toFixed(2) : '£0.00'}</span>
                </div>
            </div>
        `;
    }

    sectionsHtml += "</div>";
    card.innerHTML = headerHtml + sectionsHtml;

    return card;
}

/* ========================
   WIZARD AUTO-RUN (Missing Function)
   ======================== */
async function startAutoRun() {
    console.log("startAutoRun triggered!");
    const btn = document.getElementById("wiz-autorun-btn");
    const statusEl = document.getElementById("wiz-autorun-status");
    let originalText = btn ? btn.textContent : "START AUTO-RUN";

    if (btn) {
        btn.disabled = true;
        btn.textContent = "Processing...";
    }
    if (statusEl) {
        statusEl.textContent = "Generating tender packages...";
        statusEl.style.color = "#007bff";
    }

    try {
        console.log("Calling generateTender...");
        await generateTender();
        console.log("generateTender done.");

        if (statusEl) {
            statusEl.textContent = "✅ Success! Loading Results...";
            statusEl.style.color = "green";
        }

        setTimeout(() => {
            console.log("Transitioning to Step 4...");
            if (typeof setStep === 'function') {
                setStep(4);
            } else {
                const step3 = document.getElementById("step-3-content");
                const step4 = document.getElementById("step-4-content");
                if (step3) step3.classList.remove("active");
                if (step4) step4.classList.add("active");

                const steps = document.querySelectorAll(".wizard-step");
                if (steps.length >= 4) {
                    steps[2].classList.remove("active");
                    steps[3].classList.add("active");
                }
            }
        }, 1000);

    } catch (e) {
        console.error("Auto-Run Error:", e);
        if (statusEl) {
            statusEl.textContent = "❌ " + e.message;
            statusEl.style.color = "red";
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }
}
window.startAutoRun = startAutoRun;

/* ========================
   EXPORT & UPLOAD HANDLERS
   ======================== */
window.exportTender = async function () {
    try {
        const resp = await fetch(`${API_BASE}/projects/${projectId}/tender`);
        if (!resp.ok) throw new Error("No tender data found. Make sure you have generated the tender first.");
        const json = await resp.json();

        const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tender_${projectId}_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        alert("Export failed: " + e.message);
    }
};

window.toggleSettings = function () {
    const panel = document.getElementById('settings-panel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
};

window.uploadJobTracker = async function () {
    const btn = document.querySelector(".btn-warning");
    const originalText = btn ? btn.textContent : "☁ Sync to Job Tracker";

    if (!projectId || projectId === "default_project") {
        alert("Please load a real project before syncing.");
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.textContent = "Syncing...";
    }

    try {
        const jtUrlInput = document.getElementById('jt-url-input');
        const jtUrl = jtUrlInput ? jtUrlInput.value.trim() : "http://localhost:5000";

        // 1. Fetch full project export from LOCAL server
        console.log(`[SYNC] Fetching export for ${projectId}...`);
        const exportUrl = `${API_BASE}/api/projects/${projectId}/export`;
        const exportResp = await fetch(exportUrl);

        if (!exportResp.ok) {
            throw new Error(`Failed to fetch project export from Geometry Service: ${exportResp.statusText}`);
        }

        const exportData = await exportResp.json();
        console.log(`[SYNC] Export received. Pushing to Job Tracker at ${jtUrl}...`);

        // 2. POST payload to Job Tracker's DIRECT import endpoint
        const importUrl = `${jtUrl}/api/import/direct`;
        const importResp = await fetch(importUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(exportData)
        });

        if (importResp.ok) {
            const result = await importResp.json();
            const msg = `Success! Synced "${exportData.manifest?.display_name || projectId}" to Job Tracker.\n\nRooms: ${result.rooms || 0}\nPackages: ${result.packages || 0}`;
            alert(msg);
        } else {
            const errText = await importResp.text();
            console.error("Import Failed:", errText);
            alert(`Sync failed at Job Tracker!\nStatus: ${importResp.status}\nError: ${errText}`);
        }
    } catch (e) {
        console.error("Sync Exception:", e);
        alert(`Sync Error: ${e.message}\n\nEnsure both servers are running and CORS is configured.`);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }
};
