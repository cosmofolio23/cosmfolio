"""
Asset Intelligence — automatic asset tagging (Phase 4).

Produces the spec's tagging structure for each uploaded asset:

    { type, subtype, orientation, priority, best_usage }

The reliable baseline uses the asset's category + filename keywords (no model
needed, never fails). A vision model (Replicate multimodal) can be plugged into
_vision_analyze() later to read the pixels directly — the public API stays the
same so callers don't change.
"""

from __future__ import annotations
import os
import re

# filename keyword → canonical image type
_TYPE_KEYWORDS = [
    (r"site\s*plan|masterplan|master\s*plan", "site_plan"),
    (r"\bplan|floor", "plan"),
    (r"section", "section"),
    (r"elevation|elev\b", "elevation"),
    (r"axon|isometric|iso\b", "axonometric"),
    (r"explod", "exploded_diagram"),
    (r"massing", "massing_diagram"),
    (r"concept|parti", "concept_diagram"),
    (r"diagram|circulation|analysis", "diagram"),
    (r"sketch", "sketch"),
    (r"model|maquette", "physical_model"),
    (r"material|board", "material_board"),
    (r"interior", "interior_render"),
    (r"exterior|aerial", "exterior_render"),
    (r"render|view|visual|persp", "render"),
]

# canonical type → (priority, best_usage)
_PROFILE = {
    "render": ("hero", ["cover", "opening spread", "full bleed"]),
    "exterior_render": ("hero", ["cover", "opening spread", "full bleed"]),
    "interior_render": ("supporting", ["experience page", "gallery"]),
    "site_plan": ("technical", ["site page", "context spread"]),
    "plan": ("technical", ["plan focused page", "technical layout", "drawing spread"]),
    "section": ("technical", ["technical layout", "drawing spread"]),
    "elevation": ("technical", ["technical layout", "drawing spread"]),
    "axonometric": ("supporting", ["concept page", "technical layout"]),
    "exploded_diagram": ("supporting", ["concept page", "process"]),
    "massing_diagram": ("supporting", ["concept page", "early project page"]),
    "concept_diagram": ("supporting", ["concept page", "early project page"]),
    "diagram": ("supporting", ["concept page", "process", "storytelling"]),
    "sketch": ("supporting", ["process", "concept page"]),
    "physical_model": ("supporting", ["process", "experience page"]),
    "material_board": ("supporting", ["details page", "material page"]),
}

# upload category → fallback canonical type when filename is uninformative
_CATEGORY_FALLBACK = {
    "render": "render", "cover": "exterior_render", "plan": "plan", "site": "site_plan",
    "section": "section", "elevation": "elevation", "diagram": "diagram",
    "concept": "concept_diagram", "model": "physical_model", "process": "sketch",
    "material": "material_board", "detail": "material_board", "other": "render",
}

_SUBTYPE_KEYWORDS = [
    (r"ground", "ground floor"), (r"first|level\s*1|l1\b", "first floor"),
    (r"second|level\s*2|l2\b", "second floor"), (r"roof", "roof"),
    (r"site", "site"), (r"exterior", "exterior"), (r"interior", "interior"),
    (r"\baa\b|a-a", "AA"), (r"\bbb\b|b-b", "BB"),
    (r"north", "north"), (r"south", "south"), (r"east", "east"), (r"west", "west"),
]


def _detect_type(filename: str, category: str | None) -> str:
    name = (filename or "").lower()
    for pattern, t in _TYPE_KEYWORDS:
        if re.search(pattern, name):
            return t
    return _CATEGORY_FALLBACK.get((category or "").lower(), "render")


def _detect_subtype(filename: str) -> str | None:
    name = (filename or "").lower()
    for pattern, s in _SUBTYPE_KEYWORDS:
        if re.search(pattern, name):
            return s
    return None


def _detect_orientation(filename: str, ctype: str) -> str:
    name = (filename or "").lower()
    if "portrait" in name:
        return "portrait"
    if "square" in name:
        return "square"
    # renders/plans default to landscape; sections/elevations often wide too
    return "landscape"


def _vision_analyze(image_url: str):  # pragma: no cover - hook for a Replicate vision model
    """Optional pixel-level analysis. Returns a partial dict or None.

    Plug a Replicate multimodal model here (gated on REPLICATE_API_TOKEN). Kept
    disabled by default so the heuristic baseline is always used until the
    vision path is tuned + tested.
    """
    if os.getenv("ENABLE_VISION_TAGGING") != "1":
        return None
    return None


def analyze_asset(image_url: str = "", filename: str = "", category: str | None = None) -> dict:
    """Return the spec's tagging structure for one asset."""
    vision = _vision_analyze(image_url) or {}
    ctype = vision.get("type") or _detect_type(filename, category)
    priority, best_usage = _PROFILE.get(ctype, ("supporting", ["supporting image"]))
    return {
        "type": ctype,
        "subtype": vision.get("subtype") or _detect_subtype(filename),
        "orientation": vision.get("orientation") or _detect_orientation(filename, ctype),
        "priority": priority,
        "best_usage": best_usage,
        "source": "vision" if vision else "heuristic",
    }


def analyze_assets(assets: list) -> list:
    """Batch-tag a list of asset rows (each may have file_url / file_name / asset_type)."""
    out = []
    for a in assets or []:
        tag = analyze_asset(
            image_url=a.get("file_url") or a.get("url") or "",
            filename=a.get("file_name") or a.get("name") or "",
            category=a.get("asset_type"),
        )
        out.append({"id": a.get("id"), "asset_type": a.get("asset_type"), **tag})
    return out
