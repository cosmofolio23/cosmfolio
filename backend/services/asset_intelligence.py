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
import logging
import os
import re

logger = logging.getLogger(__name__)

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


_VISION_MODEL = "yorickvp/llava-13b"
_VISION_MODEL_VERSION = "e37337b315d6b460e8c95c2b1f72bb5881b57eebc0aa106ae63272ae2e28a22f"  # pinned to a known-working version

_VISION_PROMPT = (
    "You are analysing an architecture portfolio image. Classify it. Reply with ONLY "
    'compact JSON: {"type": one of [exterior_render, interior_render, render, plan, '
    "site_plan, section, elevation, axonometric, exploded_diagram, massing_diagram, "
    'concept_diagram, diagram, sketch, physical_model, material_board], '
    '"orientation": one of [landscape, portrait, square]}. No prose.'
)


def _vision_analyze(image_url: str, filename: str = ""):
    """Pixel-level analysis via a Replicate multimodal model (LLaVA).

    Gated on REPLICATE_API_TOKEN + ENABLE_VISION_TAGGING=1 so it only runs when
    the account is funded and the operator opts in. Any failure (no credit,
    timeout, unparseable output) returns None → caller uses the heuristic.
    """
    if not image_url or not os.getenv("REPLICATE_API_TOKEN"):
        return None
    if os.getenv("ENABLE_VISION_TAGGING") != "1":
        return None
    # Validate image_url is a full URL
    if not image_url.startswith(("http://", "https://", "data:")):
        logger.warning("Vision analysis skipped: image_url is not a valid URL (%s)", image_url[:80])
        return None
    try:
        import replicate
        import json
        import re
        model_ref = f"{_VISION_MODEL}:{_VISION_MODEL_VERSION}"
        out = replicate.run(
            model_ref,
            input={"image": image_url, "prompt": _VISION_PROMPT, "max_tokens": 150, "temperature": 0.1},
        )
        text = "".join(out) if isinstance(out, (list, tuple)) else str(out)
        m = re.search(r"\{.*\}", text, re.S)
        if not m:
            return None
        data = json.loads(m.group(0))
        result = {}
        t = (data.get("type") or "").strip().lower().replace(" ", "_")
        o = (data.get("orientation") or "").strip().lower()
        if t:
            result["type"] = t
        if o in ("landscape", "portrait", "square"):
            result["orientation"] = o
        return result or None
    except Exception as e:
        logger.error("Vision analysis failed for %s: %s", image_url[:80], e)
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
