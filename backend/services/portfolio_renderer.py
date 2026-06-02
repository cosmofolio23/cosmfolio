"""
Portfolio Renderer - Batch 3
Generates complete HTML portfolio using selected layouts and design pack tokens.

Each layout template is a function that takes (page_data, pack_tokens) → HTML string.
Cover layouts + project page layouts + about/contents/end layouts.
"""

from typing import Dict, Any, List, Optional
import logging
import json

logger = logging.getLogger(__name__)


def _font_stack(font_type: str) -> str:
    """Resolve font family to actual stack."""
    if "serif" in (font_type or "").lower():
        return "'Playfair Display', Georgia, 'Times New Roman', serif"
    return "'Inter', 'Helvetica Neue', system-ui, sans-serif"


def _body_font_stack(font_type: str) -> str:
    if "serif" in (font_type or "").lower():
        return "'Lora', Georgia, serif"
    return "'Inter', system-ui, sans-serif"


def _extract_tokens(pack: Dict[str, Any]) -> Dict[str, str]:
    """Extract render-ready tokens from a style pack."""
    colors = pack.get("colors", {})
    typo = pack.get("typography", {})
    spacing = pack.get("spacing", {})

    return {
        "color_primary": colors.get("primary", "#000000"),
        "color_secondary": colors.get("secondary", "#666666"),
        "color_accent": colors.get("accent", "#0066cc"),
        "color_background": colors.get("background", "#ffffff"),
        "color_text": colors.get("text", "#333333"),
        "heading_font": _font_stack(typo.get("heading_font", "sans-serif")),
        "body_font": _body_font_stack(typo.get("body_font", "sans-serif")),
        "heading_size": f"{typo.get('heading_size', 36)}px",
        "body_size": f"{typo.get('body_size', 16)}px",
        "heading_weight": str(typo.get("heading_weight", 700)),
        "body_weight": str(typo.get("body_weight", 400)),
        "line_height": str(typo.get("line_height", 1.6)),
        "space_xs": f"{spacing.get('xs', 4)}px",
        "space_sm": f"{spacing.get('sm', 8)}px",
        "space_md": f"{spacing.get('md', 16)}px",
        "space_lg": f"{spacing.get('lg', 24)}px",
        "space_xl": f"{spacing.get('xl', 32)}px",
    }


# ====================================================
# COVER LAYOUTS
# ====================================================

def cover_hero_full(data: Dict, tokens: Dict[str, str]) -> str:
    """Full-bleed hero image with overlaid title"""
    img = data.get("cover_image_url", "")
    bg = f"background-image: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url('{img}'); background-size: cover; background-position: center;" if img else f"background: {tokens['color_primary']};"

    return f"""
<section class="page cover-page" style="{bg} color: white; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; padding: {tokens['space_xl']};">
    <h1 style="font-family: {tokens['heading_font']}; font-size: 5em; font-weight: {tokens['heading_weight']}; letter-spacing: -0.03em; line-height: 1.0; margin-bottom: {tokens['space_md']};">{data.get('title', 'Portfolio')}</h1>
    <p style="font-family: {tokens['body_font']}; font-size: 1.5em; font-weight: 300; opacity: 0.9; margin-bottom: {tokens['space_sm']};">{data.get('subtitle', '')}</p>
    <div style="margin-top: {tokens['space_xl']}; display: flex; gap: {tokens['space_md']}; font-family: {tokens['body_font']}; font-size: 0.9em; opacity: 0.8; letter-spacing: 0.1em; text-transform: uppercase;">
        <span>{data.get('author_name', '')}</span>
        <span>·</span>
        <span>{data.get('year', '')}</span>
    </div>
</section>
"""


def cover_split_image(data: Dict, tokens: Dict[str, str]) -> str:
    """Half image, half text"""
    img = data.get("cover_image_url", "")
    return f"""
<section class="page cover-page" style="min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr;">
    <div style="background: {tokens['color_background']}; padding: {tokens['space_xl']}; display: flex; flex-direction: column; justify-content: center;">
        <div style="height: 4px; width: 60px; background: {tokens['color_accent']}; margin-bottom: {tokens['space_lg']};"></div>
        <h1 style="font-family: {tokens['heading_font']}; font-size: 4em; font-weight: {tokens['heading_weight']}; color: {tokens['color_primary']}; line-height: 1.0; margin-bottom: {tokens['space_md']};">{data.get('title', 'Portfolio')}</h1>
        <p style="font-family: {tokens['body_font']}; font-size: 1.25em; color: {tokens['color_text']}; opacity: 0.7; margin-bottom: {tokens['space_lg']};">{data.get('subtitle', '')}</p>
        <div style="font-family: {tokens['body_font']}; color: {tokens['color_text']}; font-size: 0.85em; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.6;">
            <div>{data.get('author_name', '')}</div>
            <div>{data.get('studio', '')}</div>
            <div>{data.get('year', '')}</div>
        </div>
    </div>
    <div style="background: {tokens['color_primary']}; background-image: url('{img}'); background-size: cover; background-position: center;"></div>
</section>
"""


def cover_minimal(data: Dict, tokens: Dict[str, str]) -> str:
    """Clean minimal cover with no image"""
    return f"""
<section class="page cover-page" style="background: {tokens['color_background']}; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: {tokens['space_xl']};">
    <div style="text-align: center; max-width: 800px;">
        <p style="font-family: {tokens['body_font']}; color: {tokens['color_accent']}; font-size: 0.85em; letter-spacing: 0.3em; text-transform: uppercase; margin-bottom: {tokens['space_lg']};">Portfolio · {data.get('year', '')}</p>
        <h1 style="font-family: {tokens['heading_font']}; font-size: 6em; font-weight: {tokens['heading_weight']}; color: {tokens['color_primary']}; line-height: 1.0; letter-spacing: -0.04em; margin-bottom: {tokens['space_lg']};">{data.get('title', 'Portfolio')}</h1>
        <div style="height: 2px; width: 80px; background: {tokens['color_primary']}; margin: 0 auto {tokens['space_lg']} auto;"></div>
        <p style="font-family: {tokens['body_font']}; color: {tokens['color_text']}; font-size: 1.5em; font-weight: 300;">{data.get('subtitle', '')}</p>
        <p style="font-family: {tokens['body_font']}; color: {tokens['color_text']}; opacity: 0.6; margin-top: {tokens['space_xl']}; letter-spacing: 0.15em; text-transform: uppercase; font-size: 0.85em;">{data.get('author_name', '')}</p>
    </div>
</section>
"""


# ====================================================
# PROJECT PAGE LAYOUTS
# ====================================================

def project_hero_image(data: Dict, tokens: Dict[str, str]) -> str:
    """Big image with text below"""
    hero = (data.get("renders", []) + [data.get("cover_image_url", "")])[0]
    return f"""
<section class="page project-page" style="background: {tokens['color_background']}; min-height: 100vh; padding: {tokens['space_xl']};">
    <div style="max-width: 1200px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: {tokens['space_lg']}; border-bottom: 1px solid {tokens['color_text']}22; padding-bottom: {tokens['space_md']};">
            <h2 style="font-family: {tokens['heading_font']}; font-size: 3em; font-weight: {tokens['heading_weight']}; color: {tokens['color_primary']}; line-height: 1.1;">{data.get('name', 'Project')}</h2>
            <div style="font-family: {tokens['body_font']}; color: {tokens['color_text']}; opacity: 0.7; text-align: right; font-size: 0.85em; letter-spacing: 0.1em; text-transform: uppercase;">
                <div>{data.get('location', '')}</div>
                <div>{data.get('year', '')} · {data.get('typology', '')}</div>
            </div>
        </div>
        {f'<img src="{hero}" style="width: 100%; height: 65vh; object-fit: cover; margin-bottom: {tokens["space_lg"]};" />' if hero else ''}
        <p style="font-family: {tokens['body_font']}; font-size: 1.1em; color: {tokens['color_text']}; line-height: {tokens['line_height']}; max-width: 720px;">{data.get('description', '')}</p>
    </div>
</section>
"""


def project_grid_3col(data: Dict, tokens: Dict[str, str]) -> str:
    """3-column grid of renders"""
    renders = data.get("renders", [])[:6]
    img_tags = "".join([f'<div style="aspect-ratio: 4/3; overflow: hidden;"><img src="{r}" style="width: 100%; height: 100%; object-fit: cover;" /></div>' for r in renders])
    return f"""
<section class="page project-page" style="background: {tokens['color_background']}; min-height: 100vh; padding: {tokens['space_xl']};">
    <div style="max-width: 1200px; margin: 0 auto;">
        <h2 style="font-family: {tokens['heading_font']}; font-size: 2.5em; font-weight: {tokens['heading_weight']}; color: {tokens['color_primary']}; margin-bottom: {tokens['space_md']};">{data.get('name', 'Project')}</h2>
        <p style="font-family: {tokens['body_font']}; color: {tokens['color_text']}; opacity: 0.8; margin-bottom: {tokens['space_lg']}; max-width: 720px;">{data.get('description', '')}</p>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: {tokens['space_sm']};">
            {img_tags}
        </div>
    </div>
</section>
"""


def project_plan_section(data: Dict, tokens: Dict[str, str]) -> str:
    """Plan-centric with sections below"""
    plan = (data.get("plans", []) + [""])[0]
    sections = data.get("sections", [])[:2]
    section_tags = "".join([f'<div><img src="{s}" style="width: 100%; height: 250px; object-fit: cover;" /></div>' for s in sections])
    return f"""
<section class="page project-page" style="background: {tokens['color_background']}; min-height: 100vh; padding: {tokens['space_xl']};">
    <div style="max-width: 1200px; margin: 0 auto;">
        <div style="display: grid; grid-template-columns: 200px 1fr; gap: {tokens['space_lg']}; margin-bottom: {tokens['space_lg']};">
            <div>
                <h3 style="font-family: {tokens['body_font']}; font-size: 0.75em; letter-spacing: 0.2em; text-transform: uppercase; color: {tokens['color_accent']}; margin-bottom: {tokens['space_sm']};">Project</h3>
                <h2 style="font-family: {tokens['heading_font']}; font-size: 2em; font-weight: {tokens['heading_weight']}; color: {tokens['color_primary']}; line-height: 1.1; margin-bottom: {tokens['space_md']};">{data.get('name', 'Project')}</h2>
                <div style="font-family: {tokens['body_font']}; font-size: 0.85em; color: {tokens['color_text']}; opacity: 0.7;">
                    <div>{data.get('location', '')}</div>
                    <div>{data.get('typology', '')}</div>
                    <div>{data.get('year', '')}</div>
                </div>
            </div>
            <div>
                {f'<img src="{plan}" style="width: 100%; max-height: 60vh; object-fit: contain; background: {tokens["color_background"]};" />' if plan else f'<div style="width: 100%; height: 50vh; background: {tokens["color_text"]}11; display: flex; align-items: center; justify-content: center; font-family: {tokens["body_font"]}; color: {tokens["color_text"]}; opacity: 0.5;">Plan</div>'}
            </div>
        </div>
        <p style="font-family: {tokens['body_font']}; color: {tokens['color_text']}; margin-bottom: {tokens['space_lg']}; max-width: 720px;">{data.get('description', '')}</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: {tokens['space_sm']};">
            {section_tags}
        </div>
    </div>
</section>
"""


def project_asymmetric(data: Dict, tokens: Dict[str, str]) -> str:
    """Asymmetric magazine-style layout"""
    imgs = (data.get("renders", []) + data.get("plans", []))[:4]
    placeholder = lambda i: imgs[i] if i < len(imgs) else ""
    return f"""
<section class="page project-page" style="background: {tokens['color_background']}; min-height: 100vh; padding: {tokens['space_xl']};">
    <div style="max-width: 1200px; margin: 0 auto;">
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: {tokens['space_md']}; margin-bottom: {tokens['space_md']};">
            <div style="height: 60vh; background: {tokens['color_text']}11;">
                {f'<img src="{placeholder(0)}" style="width: 100%; height: 100%; object-fit: cover;" />' if placeholder(0) else ''}
            </div>
            <div style="display: flex; flex-direction: column; gap: {tokens['space_md']};">
                <div style="flex: 1; background: {tokens['color_text']}11;">
                    {f'<img src="{placeholder(1)}" style="width: 100%; height: 100%; object-fit: cover;" />' if placeholder(1) else ''}
                </div>
                <div style="flex: 1; background: {tokens['color_accent']}; color: {tokens['color_background']}; padding: {tokens['space_md']}; display: flex; flex-direction: column; justify-content: center;">
                    <div style="font-family: {tokens['body_font']}; font-size: 0.7em; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: {tokens['space_xs']}; opacity: 0.8;">{data.get('typology', '')}</div>
                    <h2 style="font-family: {tokens['heading_font']}; font-size: 1.5em; font-weight: {tokens['heading_weight']}; line-height: 1.1;">{data.get('name', 'Project')}</h2>
                    <div style="font-family: {tokens['body_font']}; font-size: 0.8em; margin-top: {tokens['space_xs']}; opacity: 0.9;">{data.get('location', '')} · {data.get('year', '')}</div>
                </div>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: {tokens['space_md']};">
            <p style="font-family: {tokens['body_font']}; color: {tokens['color_text']}; font-size: 0.95em; line-height: {tokens['line_height']};">{data.get('description', '')}</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: {tokens['space_sm']};">
                <div style="aspect-ratio: 4/3; background: {tokens['color_text']}11;">
                    {f'<img src="{placeholder(2)}" style="width: 100%; height: 100%; object-fit: cover;" />' if placeholder(2) else ''}
                </div>
                <div style="aspect-ratio: 4/3; background: {tokens['color_text']}11;">
                    {f'<img src="{placeholder(3)}" style="width: 100%; height: 100%; object-fit: cover;" />' if placeholder(3) else ''}
                </div>
            </div>
        </div>
    </div>
</section>
"""


def project_masonry(data: Dict, tokens: Dict[str, str]) -> str:
    """Pinterest-style masonry"""
    imgs = (data.get("renders", []) + data.get("plans", []) + data.get("sections", []))[:8]
    tags = "".join([f'<div style="break-inside: avoid; margin-bottom: {tokens["space_sm"]}; background: {tokens["color_text"]}11;"><img src="{i}" style="width: 100%; display: block;" /></div>' for i in imgs])
    return f"""
<section class="page project-page" style="background: {tokens['color_background']}; min-height: 100vh; padding: {tokens['space_xl']};">
    <div style="max-width: 1200px; margin: 0 auto;">
        <h2 style="font-family: {tokens['heading_font']}; font-size: 2.5em; font-weight: {tokens['heading_weight']}; color: {tokens['color_primary']}; margin-bottom: {tokens['space_md']};">{data.get('name', 'Project')}</h2>
        <p style="font-family: {tokens['body_font']}; color: {tokens['color_text']}; margin-bottom: {tokens['space_lg']}; max-width: 720px; opacity: 0.8;">{data.get('description', '')}</p>
        <div style="column-count: 3; column-gap: {tokens['space_sm']};">
            {tags}
        </div>
    </div>
</section>
"""


# ====================================================
# ABOUT / END LAYOUTS
# ====================================================

def about_page(data: Dict, tokens: Dict[str, str]) -> str:
    """About me page with profile photo + sections"""
    photo = data.get("profile_photo_url", "")
    sections = data.get("sections", {})
    section_blocks = []

    if sections.get("bio"):
        section_blocks.append(f'<div><h3 style="font-family: {tokens["heading_font"]}; font-size: 1.2em; color: {tokens["color_primary"]}; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: {tokens["space_sm"]};">About</h3><p style="font-family: {tokens["body_font"]}; color: {tokens["color_text"]}; line-height: {tokens["line_height"]};">Architecture student & designer passionate about sustainable spaces and cultural narratives.</p></div>')

    if sections.get("skills"):
        section_blocks.append(f'<div><h3 style="font-family: {tokens["heading_font"]}; font-size: 1.2em; color: {tokens["color_primary"]}; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: {tokens["space_sm"]};">Skills</h3><p style="font-family: {tokens["body_font"]}; color: {tokens["color_text"]};">Design Strategy · Spatial Reasoning · Sustainability · Concept Development</p></div>')

    if sections.get("software"):
        section_blocks.append(f'<div><h3 style="font-family: {tokens["heading_font"]}; font-size: 1.2em; color: {tokens["color_primary"]}; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: {tokens["space_sm"]};">Software</h3><p style="font-family: {tokens["body_font"]}; color: {tokens["color_text"]};">Rhino · Grasshopper · AutoCAD · Revit · Adobe Suite · V-Ray</p></div>')

    blocks_html = "".join(section_blocks)
    return f"""
<section class="page about-page" style="background: {tokens['color_background']}; min-height: 100vh; padding: {tokens['space_xl']};">
    <div style="max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: 280px 1fr; gap: {tokens['space_xl']};">
        <div>
            {f'<img src="{photo}" style="width: 240px; height: 240px; object-fit: cover; border-radius: 50%; margin-bottom: {tokens["space_md"]};" />' if photo else f'<div style="width: 240px; height: 240px; background: {tokens["color_accent"]}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: {tokens["heading_font"]}; font-size: 4em; color: {tokens["color_background"]}; margin-bottom: {tokens["space_md"]};">{data.get("author_initial", "A")}</div>'}
            <h1 style="font-family: {tokens['heading_font']}; font-size: 2em; color: {tokens['color_primary']}; font-weight: {tokens['heading_weight']}; line-height: 1.1;">{data.get('author_name', 'About Me')}</h1>
            <p style="font-family: {tokens['body_font']}; color: {tokens['color_text']}; opacity: 0.7; font-size: 0.9em; margin-top: {tokens['space_xs']};">Architecture Portfolio</p>
        </div>
        <div style="display: flex; flex-direction: column; gap: {tokens['space_lg']}; padding-top: {tokens['space_md']};">
            {blocks_html}
        </div>
    </div>
</section>
"""


def contents_page(data: Dict, tokens: Dict[str, str]) -> str:
    """Table of contents"""
    items = data.get("items", [])
    items_html = "".join([f'<li style="display: flex; justify-content: space-between; padding: {tokens["space_sm"]} 0; border-bottom: 1px solid {tokens["color_text"]}22; font-family: {tokens["body_font"]}; color: {tokens["color_text"]};"><span>{item["title"]}</span><span style="color: {tokens["color_accent"]}; font-weight: 600;">{item["page"]:02d}</span></li>' for item in items])
    return f"""
<section class="page contents-page" style="background: {tokens['color_background']}; min-height: 100vh; padding: {tokens['space_xl']};">
    <div style="max-width: 800px; margin: 0 auto;">
        <p style="font-family: {tokens['body_font']}; color: {tokens['color_accent']}; font-size: 0.85em; letter-spacing: 0.3em; text-transform: uppercase; margin-bottom: {tokens['space_md']};">Index</p>
        <h2 style="font-family: {tokens['heading_font']}; font-size: 3em; color: {tokens['color_primary']}; font-weight: {tokens['heading_weight']}; margin-bottom: {tokens['space_xl']};">Contents</h2>
        <ul style="list-style: none; padding: 0;">
            {items_html}
        </ul>
    </div>
</section>
"""


def end_page(data: Dict, tokens: Dict[str, str]) -> str:
    """Contact / closing page"""
    return f"""
<section class="page end-page" style="background: {tokens['color_primary']}; color: {tokens['color_background']}; min-height: 100vh; padding: {tokens['space_xl']}; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
    <div style="max-width: 600px;">
        <p style="font-family: {tokens['body_font']}; opacity: 0.7; font-size: 0.85em; letter-spacing: 0.3em; text-transform: uppercase; margin-bottom: {tokens['space_lg']};">Thank You</p>
        <h2 style="font-family: {tokens['heading_font']}; font-size: 4em; font-weight: {tokens['heading_weight']}; line-height: 1.1; margin-bottom: {tokens['space_lg']};">Get in Touch</h2>
        <div style="height: 2px; width: 60px; background: {tokens['color_accent']}; margin: 0 auto {tokens['space_lg']} auto;"></div>
        <div style="font-family: {tokens['body_font']}; font-size: 1.1em; line-height: 2.2; opacity: 0.95;">
            {f'<div>{data.get("email", "")}</div>' if data.get('email') else ''}
            {f'<div>{data.get("website", "")}</div>' if data.get('website') else ''}
            {f'<div>{data.get("phone", "")}</div>' if data.get('phone') else ''}
            {f'<div>@{data.get("instagram", "")}</div>' if data.get('instagram') else ''}
            {f'<div>{data.get("linkedin", "")}</div>' if data.get('linkedin') else ''}
        </div>
    </div>
</section>
"""


# ====================================================
# LAYOUT REGISTRY
# ====================================================

LAYOUT_REGISTRY = {
    # Cover layouts
    "cover-hero-full": cover_hero_full,
    "cover-split-image": cover_split_image,
    "cover-minimal": cover_minimal,
    "hero_render": cover_hero_full,  # alias
    # Project layouts
    "project-hero-image": project_hero_image,
    "project-grid-3col": project_grid_3col,
    "project-plan-section": project_plan_section,
    "project-asymmetric": project_asymmetric,
    "project-masonry": project_masonry,
    "grid_2col": project_grid_3col,  # alias
    "grid_3col": project_grid_3col,
    "plan_centric": project_plan_section,
    "section_heavy": project_plan_section,
    "asymmetric": project_asymmetric,
    "timeline": project_asymmetric,
    "competition_board": project_asymmetric,
    "technical": project_plan_section,
    "thesis": project_hero_image,
    # Special pages
    "about-page": about_page,
    "contents-page": contents_page,
    "end-page": end_page,
}


def get_layout_renderer(layout_id: str):
    """Get a layout renderer by ID, with fallback"""
    return LAYOUT_REGISTRY.get(layout_id, project_hero_image)


# ====================================================
# MAIN RENDERER
# ====================================================

def render_full_portfolio(
    portfolio: Dict[str, Any],
    project: Dict[str, Any],
    assets: List[Dict[str, Any]],
    wizard_config: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Render a complete portfolio as HTML.

    Args:
        portfolio: Portfolio record (has style_pack, layout_id, page_structure)
        project: Project record
        assets: List of asset records for this project
        wizard_config: Optional saved wizard config (for personalized content)

    Returns:
        Complete HTML string
    """
    # Extract style pack tokens
    page_structure = portfolio.get("page_structure") or {}
    if isinstance(page_structure, str):
        try:
            page_structure = json.loads(page_structure)
        except Exception:
            page_structure = {}

    style_pack = page_structure.get("style_pack") or {}
    tokens = _extract_tokens(style_pack)

    layout_id = portfolio.get("layout_id", "project-hero-image")
    project_layout_fn = get_layout_renderer(layout_id)

    # Group assets by type
    assets_by_type = {"renders": [], "plans": [], "sections": [], "elevations": [], "concepts": [], "diagrams": []}
    for a in assets:
        t = a.get("asset_type", "render")
        # Map singular to plural
        type_map = {"render": "renders", "plan": "plans", "section": "sections", "elevation": "elevations", "concept": "concepts", "diagram": "diagrams"}
        key = type_map.get(t, "renders")
        if a.get("file_url"):
            assets_by_type[key].append(a["file_url"])

    # Build pages
    pages_html = []
    page_num = 1

    # Use wizard config if available
    wc = wizard_config or {}
    front_cover = wc.get("front_cover", {})
    design_projects = wc.get("design_projects", [])
    about = wc.get("about_page", {})
    end = wc.get("end_page", {})
    contents_enabled = wc.get("contents_page_enabled", True)

    # 1. Cover page
    cover_data = {
        "title": front_cover.get("title") or project.get("title", "Portfolio"),
        "subtitle": front_cover.get("subtitle", ""),
        "author_name": front_cover.get("authorName", ""),
        "year": front_cover.get("year", ""),
        "studio": front_cover.get("studio", ""),
        "cover_image_url": front_cover.get("coverImageUrl") or (assets_by_type["renders"][0] if assets_by_type["renders"] else ""),
    }
    # Match cover layout based on style pack character (luxury/minimal → minimal cover, bold → hero)
    pack_id = style_pack.get("id", "")
    if "minimal" in pack_id or "luxury" in pack_id or "scandinavian" in pack_id:
        pages_html.append(cover_minimal(cover_data, tokens))
    elif "competition" in pack_id or "dark" in pack_id or "future" in pack_id:
        pages_html.append(cover_hero_full(cover_data, tokens))
    else:
        pages_html.append(cover_split_image(cover_data, tokens))
    page_num += 1

    # 2. Contents page (if enabled)
    if contents_enabled:
        contents_items = []
        if about.get("enabled"):
            contents_items.append({"title": "About", "page": page_num + 1})
        # Add each project
        start_proj_page = page_num + 1 + (1 if about.get("enabled") else 0)
        for i, dp in enumerate(design_projects):
            contents_items.append({"title": dp.get("name", f"Project {i+1}"), "page": start_proj_page + i * 2})
        pages_html.append(contents_page({"items": contents_items}, tokens))
        page_num += 1

    # 3. About page (if enabled)
    if about.get("enabled"):
        about_data = {
            "author_name": front_cover.get("authorName", "Architect"),
            "author_initial": (front_cover.get("authorName", "A") or "A")[0].upper(),
            "profile_photo_url": about.get("profilePhotoUrl", ""),
            "sections": about.get("sections", {}),
        }
        pages_html.append(about_page(about_data, tokens))
        page_num += 1

    # 4. Project pages — choose layout per project
    project_layouts = [
        project_hero_image,
        project_grid_3col,
        project_plan_section,
        project_asymmetric,
        project_masonry,
    ]

    if design_projects:
        for i, dp in enumerate(design_projects):
            # Get this project's assets
            dp_assets = dp.get("assets", {}) or {}
            dp_data = {
                "name": dp.get("name", f"Project {i+1}"),
                "location": dp.get("location", ""),
                "year": dp.get("year", ""),
                "typology": dp.get("typology", ""),
                "description": dp.get("description", ""),
                "cover_image_url": dp.get("coverImageUrl", ""),
                "renders": dp_assets.get("renders", []),
                "plans": dp_assets.get("plans", []),
                "sections": dp_assets.get("sections", []),
                "elevations": dp_assets.get("elevations", []),
                "concepts": dp_assets.get("concepts", []),
                "diagrams": dp_assets.get("diagrams", []),
            }
            # Use selected layout for first project, rotate through others
            if i == 0:
                layout_fn = project_layout_fn
            else:
                layout_fn = project_layouts[i % len(project_layouts)]
            pages_html.append(layout_fn(dp_data, tokens))
            page_num += 1
    else:
        # Fallback: use raw project + assets
        fallback_data = {
            "name": project.get("title", "Project"),
            "location": "",
            "year": str(project.get("year", "")),
            "typology": project.get("project_type", ""),
            "description": project.get("description", ""),
            "cover_image_url": assets_by_type["renders"][0] if assets_by_type["renders"] else "",
            **assets_by_type,
        }
        pages_html.append(project_layout_fn(fallback_data, tokens))
        page_num += 1

    # 5. End page (if enabled)
    if end.get("enabled"):
        end_data = {
            "email": end.get("email", ""),
            "website": end.get("website", ""),
            "phone": end.get("phone", ""),
            "instagram": end.get("instagram", ""),
            "linkedin": end.get("linkedin", ""),
        }
        pages_html.append(end_page(end_data, tokens))

    # Wrap in full document
    body_html = "\n".join(pages_html)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{cover_data['title']}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&family=Playfair+Display:wght@400;500;600;700;900&family=Lora:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ background: #f5f5f5; font-family: {tokens['body_font']}; }}
        .page {{ width: 100%; max-width: 1400px; margin: 0 auto {tokens['space_lg']} auto; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }}
        img {{ display: block; max-width: 100%; }}
        @media print {{
            .page {{ page-break-after: always; margin: 0; box-shadow: none; }}
            body {{ background: white; }}
        }}
    </style>
</head>
<body>
{body_html}
</body>
</html>"""


def render_full_portfolio_safe(*args, **kwargs) -> str:
    """Safe wrapper that returns error HTML if rendering fails."""
    try:
        return render_full_portfolio(*args, **kwargs)
    except Exception as e:
        logger.exception("Portfolio rendering failed")
        return f"""<!DOCTYPE html><html><body style="font-family: system-ui; padding: 40px; max-width: 600px; margin: 80px auto;">
            <h2>Render Error</h2>
            <p style="color: #666;">Could not render this portfolio. Details:</p>
            <pre style="background: #f0f0f0; padding: 16px; overflow: auto; font-size: 13px;">{type(e).__name__}: {str(e)}</pre>
        </body></html>"""


def render_portfolio_pages(
    portfolio: Dict[str, Any],
    project: Dict[str, Any],
    assets: List[Dict[str, Any]],
    wizard_config: Optional[Dict[str, Any]] = None,
    page_layouts: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    """
    Render portfolio as a list of individual pages with metadata.
    Used by the magazine flipbook editor.

    Returns:
        {
            "pages": [
                {"id": "cover-0", "type": "cover", "name": "Cover", "html": "..."},
                {"id": "about-1", "type": "about", "name": "About", "html": "..."},
                ...
            ],
            "style_pack": {...},
            "head_html": "<...font links + base styles...>"
        }
    """
    page_structure = portfolio.get("page_structure") or {}
    if isinstance(page_structure, str):
        try:
            page_structure = json.loads(page_structure)
        except Exception:
            page_structure = {}

    style_pack = page_structure.get("style_pack") or {}
    tokens = _extract_tokens(style_pack)
    layout_id = portfolio.get("layout_id", "project-hero-image")
    project_layout_fn = get_layout_renderer(layout_id)

    # Build assets_by_type
    assets_by_type = {"renders": [], "plans": [], "sections": [], "elevations": [], "concepts": [], "diagrams": []}
    type_map = {"render": "renders", "plan": "plans", "section": "sections", "elevation": "elevations", "concept": "concepts", "diagram": "diagrams"}
    for a in assets:
        t = a.get("asset_type", "render")
        key = type_map.get(t, "renders")
        if a.get("file_url"):
            assets_by_type[key].append(a["file_url"])

    wc = wizard_config or {}
    front_cover = wc.get("front_cover", {})
    design_projects = wc.get("design_projects", [])
    about = wc.get("about_page", {})
    end = wc.get("end_page", {})
    contents_enabled = wc.get("contents_page_enabled", True)

    pages = []

    # Cover
    cover_data = {
        "title": front_cover.get("title") or project.get("title", "Portfolio"),
        "subtitle": front_cover.get("subtitle", ""),
        "author_name": front_cover.get("authorName", ""),
        "year": front_cover.get("year", ""),
        "studio": front_cover.get("studio", ""),
        "cover_image_url": front_cover.get("coverImageUrl") or (assets_by_type["renders"][0] if assets_by_type["renders"] else ""),
    }
    pack_id = style_pack.get("id", "")
    if "minimal" in pack_id or "luxury" in pack_id or "scandinavian" in pack_id:
        cover_html = cover_minimal(cover_data, tokens)
    elif "competition" in pack_id or "dark" in pack_id or "future" in pack_id:
        cover_html = cover_hero_full(cover_data, tokens)
    else:
        cover_html = cover_split_image(cover_data, tokens)
    pages.append({"id": "cover", "type": "cover", "name": "Cover", "html": cover_html})

    # Contents
    if contents_enabled:
        contents_items = []
        page_num = 2
        if about.get("enabled"):
            contents_items.append({"title": "About", "page": page_num + 1})
            page_num += 1
        for i, dp in enumerate(design_projects):
            contents_items.append({"title": dp.get("name", f"Project {i+1}"), "page": page_num + 1 + i})
        pages.append({
            "id": "contents",
            "type": "contents",
            "name": "Contents",
            "html": contents_page({"items": contents_items}, tokens)
        })

    # About
    if about.get("enabled"):
        about_data = {
            "author_name": front_cover.get("authorName", "Architect"),
            "author_initial": (front_cover.get("authorName", "A") or "A")[0].upper(),
            "profile_photo_url": about.get("profilePhotoUrl", ""),
            "sections": about.get("sections", {}),
        }
        pages.append({"id": "about", "type": "about", "name": "About Me", "html": about_page(about_data, tokens)})

    # Project pages
    project_layouts = [project_hero_image, project_grid_3col, project_plan_section, project_asymmetric, project_masonry]

    if design_projects:
        for i, dp in enumerate(design_projects):
            dp_assets = dp.get("assets", {}) or {}
            dp_data = {
                "name": dp.get("name", f"Project {i+1}"),
                "location": dp.get("location", ""),
                "year": dp.get("year", ""),
                "typology": dp.get("typology", ""),
                "description": dp.get("description", ""),
                "cover_image_url": dp.get("coverImageUrl", ""),
                "renders": dp_assets.get("renders", []),
                "plans": dp_assets.get("plans", []),
                "sections": dp_assets.get("sections", []),
                "elevations": dp_assets.get("elevations", []),
                "concepts": dp_assets.get("concepts", []),
                "diagrams": dp_assets.get("diagrams", []),
            }

            page_id = f"project-{i}"
            # Per-page layout override > global layout > rotation default
            custom_layout_id = (page_layouts or {}).get(page_id)
            if custom_layout_id:
                layout_fn = get_layout_renderer(custom_layout_id)
                used_layout = custom_layout_id
            elif i == 0:
                layout_fn = project_layout_fn
                used_layout = layout_id
            else:
                layout_fn = project_layouts[i % len(project_layouts)]
                used_layout = ["project-hero-image", "project-grid-3col", "project-plan-section", "project-asymmetric", "project-masonry"][i % 5]

            pages.append({
                "id": page_id,
                "type": "project",
                "name": dp.get("name", f"Project {i+1}"),
                "html": layout_fn(dp_data, tokens),
                "current_layout": used_layout,
                "available_layouts": ["project-hero-image", "project-grid-3col", "project-plan-section", "project-asymmetric", "project-masonry"],
            })
    else:
        fallback_data = {
            "name": project.get("title", "Project"),
            "location": "",
            "year": str(project.get("year", "")),
            "typology": project.get("project_type", ""),
            "description": project.get("description", ""),
            "cover_image_url": assets_by_type["renders"][0] if assets_by_type["renders"] else "",
            **assets_by_type,
        }
        page_id = "project-default"
        custom_layout_id = (page_layouts or {}).get(page_id)
        layout_fn = get_layout_renderer(custom_layout_id) if custom_layout_id else project_layout_fn
        pages.append({
            "id": page_id,
            "type": "project",
            "name": project.get("title", "Project"),
            "html": layout_fn(fallback_data, tokens),
            "current_layout": custom_layout_id or layout_id,
            "available_layouts": ["project-hero-image", "project-grid-3col", "project-plan-section", "project-asymmetric", "project-masonry"],
        })

    # End
    if end.get("enabled"):
        end_data = {
            "email": end.get("email", ""),
            "website": end.get("website", ""),
            "phone": end.get("phone", ""),
            "instagram": end.get("instagram", ""),
            "linkedin": end.get("linkedin", ""),
        }
        pages.append({"id": "end", "type": "end", "name": "Contact", "html": end_page(end_data, tokens)})

    # Build the page document wrapper (head with fonts + body open/close)
    head_html = """<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&family=Playfair+Display:wght@400;500;600;700;900&family=Lora:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: white; }
        .page { width: 100%; min-height: 100vh; }
        img { display: block; max-width: 100%; }
    </style>
</head>"""

    return {
        "pages": pages,
        "style_pack": style_pack,
        "head_html": head_html,
    }


def render_portfolio_pages_safe(*args, **kwargs) -> Dict[str, Any]:
    """Safe wrapper for paged renderer"""
    try:
        return render_portfolio_pages(*args, **kwargs)
    except Exception as e:
        logger.exception("Paged renderer failed")
        return {
            "pages": [{
                "id": "error",
                "type": "error",
                "name": "Error",
                "html": f"<div style='padding: 80px; font-family: system-ui; text-align: center;'><h2>Render Error</h2><pre style='background: #fee; padding: 16px; margin-top: 16px;'>{type(e).__name__}: {str(e)}</pre></div>"
            }],
            "style_pack": {},
            "head_html": "<head></head>",
        }
