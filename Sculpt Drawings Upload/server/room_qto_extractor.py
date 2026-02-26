"""
ROOM_QTO Extractor
==================
Extracts IfcSpace entities from an IFC file and produces ROOM-only packages
with sqm (m²) quantity takeoff lines for contractor tendering.

Output: list of ROOM packages, each containing floor area items.
Contractors price £/m² in the pre-award tender.

Phase 1: Floor area extraction from IfcSpace
Phase 2 (optional, safe-only): Wall/Ceiling areas by room association
"""

import os
import json
import re
import uuid
from typing import List, Dict, Optional, Any

try:
    import ifcopenshell
    import ifcopenshell.geom
    HAS_IFC = True
except ImportError:
    HAS_IFC = False
    print("[ROOM_QTO] WARNING: ifcopenshell not available. Geometry fallback disabled.")


# -- Helpers ------------------------------------------------------

def _clean_room_name(name: str) -> str:
    """Strip trailing HBXL version digits from room names.
    e.g. 'Bedroom7' -> 'Bedroom', 'Living room6' -> 'Living room'
    Only strips if the base name is a recognisable room type."""
    stripped = re.sub(r'\d+$', '', name).strip()
    if stripped:  # Avoid returning empty string
        return stripped
    return name


def _get_quantity_value(element, qset_name: str, qty_name: str) -> Optional[float]:
    """Extract a quantity value from an IfcElementQuantity set."""
    try:
        for rel in element.IsDefinedBy:
            if rel.is_a("IfcRelDefinesByProperties"):
                qset = rel.RelatingPropertyDefinition
                if qset.is_a("IfcElementQuantity") and qset.Name == qset_name:
                    for q in qset.Quantities:
                        if q.Name == qty_name:
                            if hasattr(q, 'AreaValue') and q.AreaValue is not None:
                                return float(q.AreaValue)
                            if hasattr(q, 'LengthValue') and q.LengthValue is not None:
                                return float(q.LengthValue)
                            if hasattr(q, 'VolumeValue') and q.VolumeValue is not None:
                                return float(q.VolumeValue)
    except Exception:
        pass
    return None


def _get_pset_value(element, pset_name: str, prop_name: str) -> Optional[float]:
    """Extract a property value from an IfcPropertySet."""
    try:
        for rel in element.IsDefinedBy:
            if rel.is_a("IfcRelDefinesByProperties"):
                pset = rel.RelatingPropertyDefinition
                if pset.is_a("IfcPropertySet") and pset.Name == pset_name:
                    for prop in pset.HasProperties:
                        if prop.Name == prop_name and hasattr(prop, 'NominalValue'):
                            val = prop.NominalValue
                            if val:
                                return float(val.wrappedValue) if hasattr(val, 'wrappedValue') else float(val)
    except Exception:
        pass
    return None


def _compute_floor_area_from_geometry(space) -> Optional[float]:
    """
    Fallback: compute floor area from IfcSpace geometry.
    Projects bounding box footprint (width * depth) as an approximation.
    """
    if not HAS_IFC:
        return None
    try:
        settings = ifcopenshell.geom.settings()
        shape = ifcopenshell.geom.create_shape(settings, space)
        verts = shape.geometry.verts
        if not verts or len(verts) < 9:  # Need at least 3 vertices
            return None
        xs = verts[0::3]
        ys = verts[1::3]
        width = max(xs) - min(xs)
        depth = max(ys) - min(ys)
        area = width * depth
        if area > 0:
            return round(area, 2)
    except Exception as e:
        print(f"[ROOM_QTO] Geometry fallback failed for space: {e}")
    return None


def _get_storey_name(space) -> Optional[str]:
    """Get the storey name a space belongs to via IfcRelContainedInSpatialStructure."""
    try:
        for rel in space.Decomposes:
            parent = rel.RelatingObject
            if parent.is_a("IfcBuildingStorey"):
                return parent.Name or parent.LongName or None
    except Exception:
        pass
    try:
        # Alternative: ContainedInStructure
        for rel in space.ContainedInStructure:
            parent = rel.RelatingStructure
            if parent.is_a("IfcBuildingStorey"):
                return parent.Name or parent.LongName or None
    except Exception:
        pass
    return None


def _get_building_name(space) -> Optional[str]:
    """Get the building name via IfcRelAggregates chain."""
    try:
        for rel in space.Decomposes:
            parent = rel.RelatingObject
            if parent.is_a("IfcBuildingStorey"):
                # Go up to building
                for rel2 in parent.Decomposes:
                    building = rel2.RelatingObject
                    if building.is_a("IfcBuilding"):
                        return building.Name or building.LongName or None
    except Exception:
        pass
    return None


# -- Main Extraction ----------------------------------------------

def extract_room_qto(ifc_path: str) -> Dict[str, Any]:
    """
    Main extraction function.
    
    Args:
        ifc_path: Path to the IFC file
        
    Returns:
        {
            "packages": [...],          # List of ROOM packages
            "stats": {...},             # Extraction statistics
            "warnings": [...]           # Any warnings
        }
    
    Raises:
        ValueError: If no IfcSpace entities found
        FileNotFoundError: If IFC file doesn't exist
    """
    if not os.path.exists(ifc_path):
        raise FileNotFoundError(f"IFC file not found: {ifc_path}")
    
    if not HAS_IFC:
        raise RuntimeError("ifcopenshell is required for ROOM_QTO extraction")
    
    print(f"[ROOM_QTO] Opening IFC: {ifc_path}")
    ifc_file = ifcopenshell.open(ifc_path)
    
    spaces = ifc_file.by_type("IfcSpace")
    total_spaces = len(spaces)
    
    print(f"[ROOM_QTO] Found {total_spaces} IfcSpace entities")
    
    if total_spaces == 0:
        raise ValueError(
            "No IfcSpace entities found. ROOM_QTO requires rooms/spaces in IFC. "
            "Ensure the IFC model contains IfcSpace entities."
        )
    
    packages = []
    warnings = []
    stats = {
        "total_spaces": total_spaces,
        "qto_source": 0,      # Used Qto_SpaceBaseQuantities
        "geom_source": 0,     # Used geometry fallback
        "missing_source": 0,  # Could not determine area
        "total_items": 0
    }
    
    for space in spaces:
        global_id = space.GlobalId
        
        # -- Room Name Resolution --
        room_name = None
        if space.LongName and str(space.LongName).strip():
            room_name = _clean_room_name(str(space.LongName).strip())
        elif space.Name and str(space.Name).strip():
            room_name = _clean_room_name(str(space.Name).strip())
        else:
            room_name = f"Space {global_id[:8]}"
        
        # -- Storey / Building metadata --
        storey_name = _get_storey_name(space)
        building_name = _get_building_name(space)
        
        # -- Floor Area Extraction (Phase 1) --
        floor_area = None
        area_source = "MISSING"
        qto_property_used = None
        
        # 1. Try QTO: NetFloorArea
        net_area = _get_quantity_value(space, "Qto_SpaceBaseQuantities", "NetFloorArea")
        if net_area is not None and net_area > 0:
            floor_area = round(net_area, 2)
            area_source = "QTO"
            qto_property_used = "NetFloorArea"
            stats["qto_source"] += 1
            print(f"[ROOM_QTO]   {room_name}: NetFloorArea = {floor_area} m² (QTO)")
        
        # 2. Fallback: GrossFloorArea
        if floor_area is None:
            gross_area = _get_quantity_value(space, "Qto_SpaceBaseQuantities", "GrossFloorArea")
            if gross_area is not None and gross_area > 0:
                floor_area = round(gross_area, 2)
                area_source = "QTO"
                qto_property_used = "GrossFloorArea"
                stats["qto_source"] += 1
                print(f"[ROOM_QTO]   {room_name}: GrossFloorArea = {floor_area} m² (QTO fallback)")
        
        # 3. Fallback: Pset GrossPlannedArea
        if floor_area is None:
            planned_area = _get_pset_value(space, "Pset_SpaceCommon", "GrossPlannedArea")
            if planned_area is not None and planned_area > 0:
                floor_area = round(planned_area, 2)
                area_source = "QTO"
                qto_property_used = "GrossPlannedArea"
                stats["qto_source"] += 1
                print(f"[ROOM_QTO]   {room_name}: GrossPlannedArea = {floor_area} m² (Pset fallback)")
        
        # 4. Geometry fallback
        if floor_area is None:
            geom_area = _compute_floor_area_from_geometry(space)
            if geom_area is not None and geom_area > 0:
                floor_area = round(geom_area, 2)
                area_source = "GEOM"
                stats["geom_source"] += 1
                print(f"[ROOM_QTO]   {room_name}: {floor_area} m² (geometry fallback)")
            else:
                stats["missing_source"] += 1
                warnings.append(f"Room '{room_name}' (GlobalId={global_id}): floor area unavailable (QTO missing, geometry failed)")
                print(f"[ROOM_QTO]   {room_name}: MISSING floor area")
        
        # -- Build Item --
        item_external_id = f"{global_id}::FLOOR_AREA_NET"
        item = {
            "external_id": item_external_id,
            "description": "Floor area",
            "unit": "m2",
            "qty": floor_area,  # May be None if missing
            "category": "Areas",
            "meta_json": {
                "source": area_source,
                "qtoPropertyName": qto_property_used,
                "ifcEntity": "IfcSpace",
                "ifcGlobalId": global_id
            }
        }
        stats["total_items"] += 1
        
        # -- Build Package --
        package_external_id = global_id  # Stable key = IfcSpace.GlobalId
        
        pkg = {
            "external_id": package_external_id,
            "name": room_name,
            "type": "ROOM",
            "items": [item],
            "meta_json": {
                "ifcSpaceGlobalId": global_id,
                "storeyName": storey_name,
                "buildingName": building_name,
                "qtoSourceStats": {
                    "source": area_source,
                    "property": qto_property_used
                }
            }
        }
        
        packages.append(pkg)
    
    # -- SAFETY VALIDATION --
    # Hard reject if any package is not ROOM type
    for pkg in packages:
        if pkg["type"] != "ROOM":
            raise RuntimeError(f"ROOM_QTO safety violation: package '{pkg['name']}' has type '{pkg['type']}' (expected ROOM)")
    
    # Hard reject if any item unit is not m2
    for pkg in packages:
        for item in pkg["items"]:
            if item["unit"] != "m2":
                raise RuntimeError(f"ROOM_QTO safety violation: item '{item['description']}' in package '{pkg['name']}' has unit '{item['unit']}' (expected m2)")
    
    print(f"[ROOM_QTO] -- EXTRACTION COMPLETE --")
    print(f"[ROOM_QTO]   Packages: {len(packages)}")
    print(f"[ROOM_QTO]   Items: {stats['total_items']}")
    print(f"[ROOM_QTO]   Sources: QTO={stats['qto_source']}, GEOM={stats['geom_source']}, MISSING={stats['missing_source']}")
    if warnings:
        print(f"[ROOM_QTO]   Warnings: {len(warnings)}")
        for w in warnings:
            print(f"[ROOM_QTO]     ! {w}")
    
    return {
        "packages": packages,
        "stats": stats,
        "warnings": warnings
    }


# -- Idempotent Package Merge ------------------------------------

def merge_room_qto_packages(existing_packages: List[Dict], new_packages: List[Dict]) -> List[Dict]:
    """
    Merges new ROOM_QTO packages into existing packages idempotently.
    - Updates existing packages with same external_id
    - Adds new packages that don't exist yet
    - Does NOT duplicate
    
    Args:
        existing_packages: Current packages list
        new_packages: New packages from extraction
        
    Returns:
        Merged packages list
    """
    # Index existing by external_id
    existing_by_id = {}
    for pkg in existing_packages:
        eid = pkg.get("external_id")
        if eid:
            existing_by_id[eid] = pkg
    
    result = list(existing_packages)  # Start with existing
    
    updated = 0
    added = 0
    
    for new_pkg in new_packages:
        eid = new_pkg.get("external_id")
        if not eid:
            continue
        
        if eid in existing_by_id:
            # Update in place
            idx = result.index(existing_by_id[eid])
            result[idx] = new_pkg
            updated += 1
        else:
            result.append(new_pkg)
            added += 1
    
    print(f"[ROOM_QTO] Merge: {updated} updated, {added} added, {len(result)} total")
    return result


# -- File I/O ----------------------------------------------------

def save_room_qto(project_dir: str, packages: List[Dict], stats: Dict, warnings: List[str]):
    """
    Save ROOM_QTO output to project directory.
    Writes to: <project_dir>/output/room_qto.json
    """
    output_dir = os.path.join(project_dir, "output")
    os.makedirs(output_dir, exist_ok=True)
    
    output_path = os.path.join(output_dir, "room_qto.json")
    
    output = {
        "mode": "ROOM_QTO",
        "version": "1.0",
        "packages": packages,
        "stats": stats,
        "warnings": warnings
    }
    
    # Idempotent: if existing file, merge
    if os.path.exists(output_path):
        try:
            with open(output_path, "r") as f:
                existing = json.load(f)
            existing_pkgs = existing.get("packages", [])
            packages = merge_room_qto_packages(existing_pkgs, packages)
            output["packages"] = packages
        except Exception as e:
            print(f"[ROOM_QTO] Could not merge with existing: {e}")
    
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    
    print(f"[ROOM_QTO] Saved to: {output_path}")
    return output_path


def load_room_qto(project_dir: str) -> Optional[Dict]:
    """Load previously saved ROOM_QTO data."""
    output_path = os.path.join(project_dir, "output", "room_qto.json")
    if os.path.exists(output_path):
        with open(output_path, "r") as f:
            return json.load(f)
    return None
