"""
Library API — the premium, project-centric unified store.

Upload once → feeds Portfolio + Sheet. Gated behind the `library` entitlement.
Lives on its own clean tables (library_projects / library_assets /
library_project_text); the legacy per-product `assets` flow is untouched.
"""

from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form, Query
from typing import List, Optional
from datetime import datetime
from uuid import uuid4

from .deps import get_current_user
from services.entitlements import require_library, get_user_entitlements
from services.upload import get_upload_manager
from services.storage import get_storage_client
from database import supabase

router = APIRouter()

# ──────────────────────────────────────────────────────────────
# Canonical taxonomy (Python mirror of frontend/src/lib/assetTaxonomy.ts)
# ──────────────────────────────────────────────────────────────

CATEGORY_OF = {
    # drawing
    "plan": "drawing", "section": "drawing", "elevation": "drawing",
    "detail": "drawing", "site-plan": "drawing", "master-plan": "drawing",
    # visual
    "exterior-render": "visual", "interior-render": "visual",
    "aerial": "visual", "model-photo": "visual",
    # process
    "sketch": "process", "concept-diagram": "process", "circulation": "process",
    "zoning": "process", "exploded": "process", "evolution": "process", "material": "process",
    # analysis
    "site-analysis": "analysis", "climate": "analysis", "swot": "analysis",
    "user-study": "analysis", "case-study": "analysis",
    # text
    "concept": "text", "description": "text", "sustainability": "text", "abstract": "text",
    # info
    "cover": "info", "logo": "info", "north-arrow": "info", "scale-bar": "info", "other": "info",
}

SCALED_TYPES = {"plan", "section", "elevation", "detail", "site-plan", "master-plan"}
# Descending so longer scales test first (avoids "1-1" matching inside "1-100").
ARCH_SCALES = ["1:1000", "1:500", "1:200", "1:100", "1:50", "1:20", "1:10", "1:5", "1:1"]


def _detect_scale(n: str):
    """Find a scale token, guarding against partial matches via digit boundaries."""
    for s in ARCH_SCALES:
        for token in (s, s.replace(":", "-"), s.replace(":", "to")):
            i = n.find(token)
            if i == -1:
                continue
            before = n[i - 1] if i > 0 else ""
            after = n[i + len(token)] if i + len(token) < len(n) else ""
            if not before.isdigit() and not after.isdigit():
                return s
    return None


def infer_from_filename(file_name: str) -> dict:
    """Guess (category, type, scale) from a filename. Forgiving — we suggest, the
    user corrects. Mirrors the frontend heuristic so client/server agree."""
    n = (file_name or "").lower()
    scale = _detect_scale(n)

    def g(t):
        return {"category": CATEGORY_OF.get(t, "info"), "asset_type": t, "scale": scale}

    if "master" in n and "plan" in n: return g("master-plan")
    if "site" in n and "plan" in n: return g("site-plan")
    if "plan" in n or "floor" in n or n.startswith("gf") or n.startswith("ff"): return g("plan")
    if "section" in n or "_sec" in n: return g("section")
    if "elevation" in n or "elev" in n: return g("elevation")
    if "detail" in n: return g("detail")
    if "exterior" in n or "perspective" in n: return g("exterior-render")
    if "interior" in n: return g("interior-render")
    if "aerial" in n or "birdseye" in n: return g("aerial")
    if "render" in n or "view" in n or "visual" in n: return g("exterior-render")
    if "model" in n: return g("model-photo")
    if "sketch" in n: return g("sketch")
    if "circulation" in n: return g("circulation")
    if "zoning" in n or "zone" in n: return g("zoning")
    if "exploded" in n or "axo" in n: return g("exploded")
    if "evolution" in n or "massing" in n: return g("evolution")
    if "material" in n: return g("material")
    if "climate" in n or "sun" in n or "wind" in n: return g("climate")
    if "user" in n: return g("user-study")
    if "case" in n: return g("case-study")
    if "concept" in n: return g("concept-diagram")
    if "cover" in n: return g("cover")
    if "logo" in n: return g("logo")
    if "site" in n or "context" in n or "analysis" in n: return g("site-analysis")
    if "diagram" in n: return g("concept-diagram")
    return g("other")


def _is_vector(file_name: str) -> bool:
    ext = (file_name or "").rsplit(".", 1)[-1].lower()
    return ext in ("svg", "pdf")


def _own_project(project_id: str, user_id: str) -> dict:
    """Fetch a library project and assert ownership."""
    resp = supabase.table("library_projects").select("*").eq("id", project_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Library project not found")
    proj = resp.data[0]
    if proj["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your project")
    return proj


# ──────────────────────────────────────────────────────────────
# ENTITLEMENTS (frontend gating)
# ──────────────────────────────────────────────────────────────

@router.get("/api/library/entitlements")
async def my_entitlements(current_user: dict = Depends(get_current_user)):
    """Frontend reads this to gate UI. Always 200 (never blocks)."""
    return get_user_entitlements(current_user["user_id"])


# ──────────────────────────────────────────────────────────────
# PROJECTS
# ──────────────────────────────────────────────────────────────

@router.post("/api/library/projects")
async def create_project(
    payload: dict,
    current_user: dict = Depends(require_library),
):
    now = datetime.utcnow().isoformat()
    data = {
        "id": str(uuid4()),
        "user_id": current_user["user_id"],
        "name": payload.get("name") or "Untitled Project",
        "typology": payload.get("typology"),
        "year": payload.get("year"),
        "semester": payload.get("semester"),
        "studio_brief": payload.get("studio_brief"),
        "status": "active",
        "sort_order": payload.get("sort_order", 0),
        "created_at": now,
        "updated_at": now,
    }
    resp = supabase.table("library_projects").insert(data).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to create project")
    return resp.data[0]


@router.get("/api/library/projects")
async def list_projects(current_user: dict = Depends(require_library)):
    resp = (
        supabase.table("library_projects")
        .select("*")
        .eq("user_id", current_user["user_id"])
        .order("sort_order")
        .execute()
    )
    projects = resp.data or []
    # attach a quick asset count per project
    for p in projects:
        try:
            c = supabase.table("library_assets").select("id", count="exact").eq("project_id", p["id"]).execute()
            p["asset_count"] = c.count or 0
        except Exception:
            p["asset_count"] = 0
    return {"items": projects, "total": len(projects)}


@router.get("/api/library/projects/{project_id}")
async def get_project(project_id: str, current_user: dict = Depends(require_library)):
    proj = _own_project(project_id, current_user["user_id"])
    assets = (
        supabase.table("library_assets").select("*")
        .eq("project_id", project_id).order("sort_order").execute()
    ).data or []
    text = (
        supabase.table("library_project_text").select("*")
        .eq("project_id", project_id).execute()
    ).data or []
    return {**proj, "assets": assets, "text": text}


@router.put("/api/library/projects/{project_id}")
async def update_project(project_id: str, payload: dict, current_user: dict = Depends(require_library)):
    _own_project(project_id, current_user["user_id"])
    allowed = {"name", "typology", "year", "semester", "studio_brief", "status", "cover_asset_id", "sort_order"}
    update = {k: v for k, v in payload.items() if k in allowed}
    update["updated_at"] = datetime.utcnow().isoformat()
    resp = supabase.table("library_projects").update(update).eq("id", project_id).execute()
    return resp.data[0] if resp.data else {}


@router.delete("/api/library/projects/{project_id}", status_code=204)
async def delete_project(project_id: str, current_user: dict = Depends(require_library)):
    _own_project(project_id, current_user["user_id"])
    supabase.table("library_projects").delete().eq("id", project_id).execute()


# ──────────────────────────────────────────────────────────────
# ASSETS — upload (bulk, with auto-categorization)
# ──────────────────────────────────────────────────────────────

@router.post("/api/library/projects/{project_id}/assets/bulk")
async def bulk_upload(
    project_id: str,
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(require_library),
):
    """Drop many files → each is auto-categorized from its filename, stored, and
    a library_assets row created. The student corrects categories afterward."""
    _own_project(project_id, current_user["user_id"])
    upload_manager = get_upload_manager()

    created = []
    errors = []
    for f in files:
        try:
            asset_id = str(uuid4())
            guess = infer_from_filename(f.filename)
            up = await upload_manager.upload_file(f, project_id, asset_id, guess["asset_type"])

            now = datetime.utcnow().isoformat()
            width = up.get("width")
            height = up.get("height")
            row = {
                "id": asset_id,
                "project_id": project_id,
                "user_id": current_user["user_id"],
                "category": guess["category"],
                "asset_type": guess["asset_type"],
                "title": (f.filename or "").rsplit(".", 1)[0],
                "storage_path": up.get("storage_path", ""),
                "url": up.get("file_url") or "",
                "thumb_url": up.get("thumb_path") or "",
                "scale": guess["scale"] if guess["asset_type"] in SCALED_TYPES else None,
                "orientation": ("landscape" if (width and height and width >= height) else "portrait") if width and height else None,
                "is_vector": _is_vector(f.filename),
                "width_px": width,
                "height_px": height,
                "file_size": up.get("file_size", 0),
                "mime_type": up.get("mime_type", "image/jpeg"),
                "created_at": now,
                "updated_at": now,
            }
            ins = supabase.table("library_assets").insert(row).execute()
            asset = ins.data[0] if ins.data else row
            # ensure a public URL
            if not asset.get("url") and asset.get("storage_path"):
                try:
                    asset["url"] = await get_storage_client().get_public_url(asset["storage_path"])
                    supabase.table("library_assets").update({"url": asset["url"]}).eq("id", asset_id).execute()
                except Exception:
                    pass
            created.append(asset)
        except Exception as e:
            errors.append({"file": f.filename, "error": str(e)})

    return {"created": created, "uploaded": len(created), "failed": len(errors), "errors": errors or None}


@router.put("/api/library/projects/{project_id}/assets/{asset_id}")
async def update_asset(project_id: str, asset_id: str, payload: dict, current_user: dict = Depends(require_library)):
    """Correct an asset's category/type/scale/metadata (progressive metadata)."""
    _own_project(project_id, current_user["user_id"])
    allowed = {"category", "asset_type", "title", "caption", "scale", "orientation",
               "has_north", "is_vector", "is_featured", "sort_order"}
    update = {k: v for k, v in payload.items() if k in allowed}
    # keep category consistent if only asset_type changed
    if "asset_type" in update and "category" not in update:
        update["category"] = CATEGORY_OF.get(update["asset_type"], "info")
    update["updated_at"] = datetime.utcnow().isoformat()
    resp = supabase.table("library_assets").update(update).eq("id", asset_id).eq("project_id", project_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Asset not found")
    return resp.data[0]


@router.delete("/api/library/projects/{project_id}/assets/{asset_id}", status_code=204)
async def delete_asset(project_id: str, asset_id: str, current_user: dict = Depends(require_library)):
    _own_project(project_id, current_user["user_id"])
    supabase.table("library_assets").delete().eq("id", asset_id).eq("project_id", project_id).execute()


# ──────────────────────────────────────────────────────────────
# TEXT BRANCH
# ──────────────────────────────────────────────────────────────

# ──────────────────────────────────────────────────────────────
# GENERATE FROM LIBRARY — the payoff: upload once → portfolio
# ──────────────────────────────────────────────────────────────

# canonical asset_type → the portfolio generator's bucket vocabulary
# (it only understands render | plan | section | diagram)
_PORTFOLIO_TYPE = {
    "plan": "plan", "site-plan": "plan", "master-plan": "plan",
    "section": "section", "elevation": "section",
    "exterior-render": "render", "interior-render": "render",
    "aerial": "render", "model-photo": "render", "cover": "render",
}


def _to_portfolio_type(t: str) -> str:
    return _PORTFOLIO_TYPE.get(t, "diagram")


@router.post("/api/library/projects/{project_id}/generate-portfolio")
async def generate_portfolio_from_library(
    project_id: str,
    payload: dict = None,
    current_user: dict = Depends(require_library),
):
    """Materialize a standard project + mapped asset rows from the library, then
    reuse the existing portfolio generator. The library stays the source of
    truth; the portfolio is a generated view linked back via library_project_id."""
    from routes.portfolios import generate_portfolio_structure  # local import avoids any import-order issues

    payload = payload or {}
    proj = _own_project(project_id, current_user["user_id"])
    uid = current_user["user_id"]
    now = datetime.utcnow().isoformat()

    lib_assets = (
        supabase.table("library_assets").select("*").eq("project_id", project_id).execute()
    ).data or []
    if not lib_assets:
        raise HTTPException(status_code=400, detail="No assets in this project yet — upload some first.")

    # find-or-create a backing `projects` row (reuse if we generated before)
    existing = (
        supabase.table("portfolios").select("project_id")
        .eq("library_project_id", project_id).limit(1).execute()
    ).data
    if existing and existing[0].get("project_id"):
        backing_id = existing[0]["project_id"]
    else:
        backing_id = str(uuid4())
        supabase.table("projects").insert({
            "id": backing_id, "user_id": uid, "title": proj["name"],
            "project_type": proj.get("typology") or "design", "status": "concept",
            "created_at": now, "updated_at": now,
        }).execute()

    # sync assets: clear backing project's assets, copy mapped library assets in
    supabase.table("assets").delete().eq("project_id", backing_id).execute()
    rows = []
    for a in lib_assets:
        rows.append({
            "id": str(uuid4()),
            "project_id": backing_id,
            "asset_type": _to_portfolio_type(a["asset_type"]),
            "file_url": a.get("url") or "",
            "file_name": a.get("title") or "asset",
            "file_size": a.get("file_size") or 0,
            "upload_order": a.get("sort_order") or 0,
            "analysis": {
                "storage_path": a.get("storage_path"),
                "width": a.get("width_px"), "height": a.get("height_px"),
                "library_asset_id": a["id"],
            },
            "created_at": now,
        })
    if rows:
        supabase.table("assets").insert(rows).execute()

    # bucket asset ids for the generator
    buckets = {"renders": [], "plans": [], "sections": [], "diagrams": []}
    key_of = {"render": "renders", "plan": "plans", "section": "sections", "diagram": "diagrams"}
    for r in rows:
        k = key_of.get(r["asset_type"])
        if k:
            buckets[k].append(r["id"])

    layout_id = payload.get("layout_id") or "editorial"
    style_pack = (payload.get("style_pack") or "minimal_white")[:50]
    page_structure = generate_portfolio_structure(backing_id, layout_id, style_pack, buckets)

    portfolio_id = str(uuid4())
    supabase.table("portfolios").insert({
        "id": portfolio_id,
        "project_id": backing_id,
        "layout_id": layout_id,
        "style_pack": style_pack,
        "status": "ready",
        "variant_number": 1,
        "library_project_id": project_id,
        "page_structure": page_structure,
        "created_at": now,
    }).execute()

    return {
        "portfolio_id": portfolio_id,
        "project_id": backing_id,
        "pages": page_structure.get("total_pages", 0),
        "assets_used": len(rows),
    }


@router.put("/api/library/projects/{project_id}/text/{kind}")
async def upsert_text(project_id: str, kind: str, payload: dict, current_user: dict = Depends(require_library)):
    """Upsert a text block (concept|description|sustainability|abstract) with
    short/medium/long variants."""
    _own_project(project_id, current_user["user_id"])
    if kind not in ("concept", "description", "sustainability", "abstract"):
        raise HTTPException(status_code=400, detail="Invalid text kind")

    existing = (
        supabase.table("library_project_text").select("id")
        .eq("project_id", project_id).eq("kind", kind).execute()
    ).data
    now = datetime.utcnow().isoformat()
    body = {
        "short": payload.get("short"),
        "medium": payload.get("medium"),
        "long": payload.get("long"),
        "updated_at": now,
    }
    if existing:
        resp = supabase.table("library_project_text").update(body).eq("id", existing[0]["id"]).execute()
    else:
        resp = supabase.table("library_project_text").insert({
            "id": str(uuid4()), "project_id": project_id, "user_id": current_user["user_id"],
            "kind": kind, "created_at": now, **body,
        }).execute()
    return resp.data[0] if resp.data else {}
