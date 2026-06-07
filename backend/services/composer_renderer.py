"""
Composer document renderer.

Turns a parametric composer document (pages with resolved layout regions +
blocks + design tokens) into standalone print-ready HTML. This MIRRORS the
frontend PageComposer so that exported/published portfolios look the same as
what the user sees in the parametric editor.

The composer_doc is produced by the generate-flow editor and stored in
portfolio.page_structure.composer_doc. Each page carries its resolved
`regions` (12x12 grid) + `kind` so this renderer is fully self-contained and
does not need the frontend layout catalog.
"""

import html as _html

IMAGE_TYPES = {"render", "plan", "section", "diagram"}
ROLE_TO_TYPE = {"title": "title", "subtitle": "subtitle", "text": "description", "legend": "legend", "meta": "meta"}


def _esc(s) -> str:
    return _html.escape(str(s if s is not None else ""))


def _grid_style(r: dict) -> str:
    return (
        f"grid-column:{r.get('c0', 1)} / span {r.get('cs', 1)};"
        f"grid-row:{r.get('r0', 1)} / span {r.get('rs', 1)};"
        "min-width:0;min-height:0;overflow:hidden;"
    )


def _images(blocks):
    return [b for b in blocks if b.get("type") in IMAGE_TYPES]


def _first(blocks, t):
    for b in blocks:
        if b.get("type") == t:
            return b
    return None


def _render_region(region: dict, blocks: list, tokens: dict, overlay: bool) -> str:
    role = region.get("role")
    style = _grid_style(region)

    if role == "image":
        imgs = _images(blocks)
        idx = region.get("imageIndex", 0) or 0
        block = imgs[idx] if 0 <= idx < len(imgs) else None
        if block and block.get("imageUrl"):
            return (f'<div style="{style}">'
                    f'<img src="{_esc(block["imageUrl"])}" style="width:100%;height:100%;object-fit:cover;display:block;"/></div>')
        return f'<div style="{style}background:rgba(0,0,0,0.06);"></div>'

    t = ROLE_TO_TYPE.get(role)
    block = _first(blocks, t) if t else None
    color = "#ffffff" if overlay else tokens.get("text", "#1a1a1a")
    primary = "#ffffff" if overlay else tokens.get("primary", color)
    z = "position:relative;z-index:10;" if overlay else ""

    if not block:
        return f'<div style="{style}"></div>'

    if role == "title":
        return (f'<div style="{style}{z}"><div style="font-family:{_esc(tokens.get("headingFont", "Georgia"))};'
                f'font-weight:700;font-size:28px;line-height:1.1;color:{primary};">{_esc(block.get("text", ""))}</div></div>')
    if role == "subtitle":
        return f'<div style="{style}{z}"><div style="font-size:15px;color:{color};opacity:.85;">{_esc(block.get("text", ""))}</div></div>'
    if role == "text":
        return (f'<div style="{style}{z}"><div style="font-size:12px;line-height:1.5;color:{color};'
                f'white-space:pre-wrap;">{_esc(block.get("text", ""))}</div></div>')
    if role == "meta":
        fields = block.get("fields") or []
        items = "".join(
            f'<div style="margin-bottom:4px;"><div style="font-size:8px;text-transform:uppercase;letter-spacing:.5px;opacity:.6;color:{color};">'
            f'{_esc(f.get("label"))}</div><div style="font-size:11px;color:{color};">{_esc(f.get("value"))}</div></div>'
            for f in fields
        )
        return f'<div style="{style}{z}">{items}</div>'
    if role == "legend":
        items = block.get("legendItems") or []
        rows = "".join(
            f'<div style="font-size:10px;margin-bottom:2px;color:{color};"><b>{_esc(i.get("key"))}</b> {_esc(i.get("label"))}</div>'
            for i in items
        )
        return f'<div style="{style}{z}">{rows}</div>'
    return f'<div style="{style}"></div>'


def _render_page(page: dict, tokens: dict) -> str:
    regions = page.get("regions") or []
    blocks = page.get("blocks") or []
    overlay = page.get("kind") == "overlay"
    cells = "".join(_render_region(r, blocks, tokens, overlay) for r in regions)
    scrim = ('<div style="position:absolute;left:0;right:0;bottom:0;height:66%;'
             'background:linear-gradient(to top,rgba(0,0,0,0.6),transparent);pointer-events:none;"></div>') if overlay else ""
    bg = tokens.get("background", "#ffffff")
    return (
        f'<section class="page" style="position:relative;width:210mm;height:297mm;background:{bg};'
        f'page-break-after:always;overflow:hidden;font-family:{_esc(tokens.get("bodyFont", "Inter"))};">'
        f'<div style="position:absolute;inset:0;display:grid;grid-template-columns:repeat(12,1fr);'
        f'grid-template-rows:repeat(12,1fr);gap:8px;padding:18mm;">{cells}</div>{scrim}</section>'
    )


def render_composer_pages(doc: dict):
    """Return {"pages": [{id, type, html}]} for the public/flipbook viewer."""
    if not doc or not isinstance(doc, dict):
        return None
    pages = doc.get("pages") or []
    if not pages:
        return None
    tokens = doc.get("tokens") or {}
    out = []
    for i, p in enumerate(pages):
        out.append({
            "id": p.get("id", f"page-{i}"),
            "type": p.get("type", "project"),
            "name": (_first(p.get("blocks") or [], "title") or {}).get("text", f"Page {i + 1}"),
            "html": _render_page(p, tokens),
        })
    return {"pages": out}


def render_composer_doc(doc: dict):
    """Return a full standalone HTML document, or None if doc is empty/invalid."""
    if not doc or not isinstance(doc, dict):
        return None
    pages = doc.get("pages") or []
    if not pages:
        return None
    tokens = doc.get("tokens") or {}
    body = "".join(_render_page(p, tokens) for p in pages)
    return (
        '<!DOCTYPE html><html><head><meta charset="utf-8">'
        '<style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;'
        '-webkit-print-color-adjust:exact;print-color-adjust:exact;}body{background:#e5e5e5;}</style>'
        f'</head><body>{body}</body></html>'
    )
