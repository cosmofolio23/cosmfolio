"""
HTML Preview Service
Phase 5: Task 5.2 - Generate responsive HTML portfolios with CSS variables
"""

import logging
from typing import Dict, Any, Optional, List
from enum import Enum
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class ResponsiveBreakpoint(str, Enum):
    """Responsive design breakpoints"""
    mobile = "mobile"      # < 640px
    tablet = "tablet"      # 640px - 1024px
    desktop = "desktop"    # > 1024px


class HTMLPreviewService:
    """Service for generating responsive HTML portfolio previews"""

    def __init__(self):
        """Initialize HTML preview service"""

        # Design system tokens - now sourced from style_pack service to stay in sync
        self.design_tokens = self._build_design_tokens_from_presets()

        logger.info("HTML Preview Service initialized")

    def _build_design_tokens_from_presets(self) -> Dict[str, Dict[str, str]]:
        """Build HTML-compatible design tokens from style_pack presets"""
        tokens = {}
        try:
            from services.style_pack import get_style_pack_service
            service = get_style_pack_service()
            presets = service.get_preset_packs()

            for pack in presets:
                pack_id = pack["id"]
                colors = pack.get("colors", {})
                spacing = pack.get("spacing", {})
                typography = pack.get("typography", {})

                pack_tokens = {
                    "primary": colors.get("primary", "#000000"),
                    "secondary": colors.get("background", "#ffffff"),
                    "accent": colors.get("accent", "#f0f0f0"),
                    "text_primary": colors.get("text", "#1a1a1a"),
                    "text_secondary": colors.get("secondary", "#666666"),
                    "border": colors.get("secondary", "#e0e0e0") + "33",
                    "spacing": f"{spacing.get('md', 16)}px",
                    "heading_font": typography.get("heading_font", "sans-serif"),
                    "body_font": typography.get("body_font", "sans-serif"),
                    "heading_size": f"{typography.get('heading_size', 36)}px",
                    "body_size": f"{typography.get('body_size', 16)}px",
                    "heading_weight": str(typography.get("heading_weight", 700)),
                    "body_weight": str(typography.get("body_weight", 400)),
                    "line_height": str(typography.get("line_height", 1.6)),
                }
                tokens[pack_id] = pack_tokens

                # Also register legacy keys for backwards compat
                legacy_key = pack_id.replace("preset-", "").replace("-", "_")
                tokens[legacy_key] = pack_tokens

        except Exception as e:
            logger.error(f"Error loading design tokens from presets: {e}")

        # Always ensure fallback exists
        if "minimal_white" not in tokens:
            tokens["minimal_white"] = {
                "primary": "#000000", "secondary": "#ffffff", "accent": "#f0f0f0",
                "text_primary": "#1a1a1a", "text_secondary": "#666666",
                "border": "#e0e0e0", "spacing": "16px",
                "heading_font": "sans-serif", "body_font": "sans-serif",
                "heading_size": "36px", "body_size": "16px",
                "heading_weight": "700", "body_weight": "400", "line_height": "1.6",
            }
        return tokens

    def get_tokens_for_pack(self, pack_or_id) -> Dict[str, str]:
        """
        Get rendering tokens for a pack ID or full pack object.

        Supports:
        - String ID (lookup in presets/legacy)
        - Dict with full pack data (used directly, e.g. AI-generated packs)
        """
        if isinstance(pack_or_id, dict):
            # Full pack object - convert to render tokens
            colors = pack_or_id.get("colors", {})
            spacing = pack_or_id.get("spacing", {})
            typography = pack_or_id.get("typography", {})
            return {
                "primary": colors.get("primary", "#000000"),
                "secondary": colors.get("background", "#ffffff"),
                "accent": colors.get("accent", "#f0f0f0"),
                "text_primary": colors.get("text", "#1a1a1a"),
                "text_secondary": colors.get("secondary", "#666666"),
                "border": colors.get("secondary", "#e0e0e0") + "33",
                "spacing": f"{spacing.get('md', 16)}px",
                "heading_font": typography.get("heading_font", "sans-serif"),
                "body_font": typography.get("body_font", "sans-serif"),
                "heading_size": f"{typography.get('heading_size', 36)}px",
                "body_size": f"{typography.get('body_size', 16)}px",
                "heading_weight": str(typography.get("heading_weight", 700)),
                "body_weight": str(typography.get("body_weight", 400)),
                "line_height": str(typography.get("line_height", 1.6)),
            }
        # String ID lookup
        return self.design_tokens.get(pack_or_id, self.design_tokens.get("minimal_white"))

    async def generate_html_preview(
        self,
        portfolio_id: str,
        portfolio_data: Dict[str, Any],
        style_pack: str = "minimal_white",
        layout: str = "default",
        include_meta: bool = True,
        responsive: bool = True,
        is_free: bool = False,
    ) -> str:
        """
        Generate responsive HTML portfolio preview

        Args:
            portfolio_id: Portfolio identifier
            portfolio_data: Portfolio data (title, sections, assets, etc.)
            style_pack: Design system style pack
            layout: Layout template name
            include_meta: Include meta tags and head
            responsive: Enable responsive design

        Returns:
            Complete HTML string
        """

        try:
            logger.info(f"Generating HTML preview for portfolio {portfolio_id}")

            # Get design tokens — supports both pack ID string and full pack dict
            full_pack = portfolio_data.get("style_pack_data")  # Full pack object if available
            if full_pack and isinstance(full_pack, dict):
                tokens = self.get_tokens_for_pack(full_pack)
            else:
                tokens = self.get_tokens_for_pack(style_pack)

            # Generate HTML
            html = self._build_html_document(
                portfolio_id=portfolio_id,
                portfolio_data=portfolio_data,
                style_pack=style_pack,
                tokens=tokens,
                include_meta=include_meta,
                responsive=responsive,
                is_free=is_free,
            )

            logger.info(f"HTML preview generated: {len(html)} characters")
            return html

        except Exception as e:
            logger.error(f"Error generating HTML preview: {str(e)}")
            raise

    def _build_html_document(
        self,
        portfolio_id: str,
        portfolio_data: Dict[str, Any],
        style_pack: str,
        tokens: Dict[str, str],
        include_meta: bool,
        responsive: bool,
        is_free: bool = False,
    ) -> str:
        """Build complete HTML document"""

        # Extract portfolio data
        title = portfolio_data.get("title", "Portfolio")
        author = portfolio_data.get("author", "")
        sections = portfolio_data.get("sections", [])
        assets = portfolio_data.get("assets", [])
        description = portfolio_data.get("description", "")

        # Generate head section
        head = self._generate_head(title, author, description, include_meta)

        # Generate CSS
        css = self._generate_responsive_css(tokens, style_pack, responsive)

        # Generate body content
        body_html = self._generate_body_content(
            portfolio_id=portfolio_id,
            title=title,
            author=author,
            description=description,
            sections=sections,
            assets=assets,
            tokens=tokens,
        )

        watermark_html = ""
        if is_free:
            watermark_html = """
<div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 9999; display: flex; align-items: center; justify-content: center; overflow: hidden; opacity: 0.1;">
    <div style="font-size: 120px; font-weight: 900; color: #000; text-transform: uppercase; letter-spacing: 0.5em; transform: rotate(-35deg); user-select: none; white-space: nowrap; font-family: sans-serif;">
        COSMOFOLIO
    </div>
</div>
"""

        # Assemble document
        html = f"""<!DOCTYPE html>
<html lang="en">
{head}
<body>
{css}
{body_html}
{watermark_html}
</body>
</html>
"""

        return html

    def _generate_head(
        self,
        title: str,
        author: str,
        description: str,
        include_meta: bool,
    ) -> str:
        """Generate HTML head section"""

        meta_tags = ""
        if include_meta:
            meta_tags = f"""
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{description or 'Architecture Portfolio'}">
    <meta name="author" content="{author or 'CosmoFolio'}">
    <meta name="generator" content="CosmoFolio Portfolio Generator">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{description}">
    <meta name="theme-color" content="#000000">
"""

        return f"""<head>
    <title>{title}</title>
{meta_tags}
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&family=Playfair+Display:wght@400;500;600;700;900&family=Lora:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
"""

    def _generate_responsive_css(
        self,
        tokens: Dict[str, str],
        style_pack: str,
        responsive: bool,
    ) -> str:
        """Generate responsive CSS with design tokens"""

        # Resolve font-family stacks based on tokens
        heading_family = "'Playfair Display', Georgia, serif" if "serif" in tokens.get("heading_font", "sans-serif") else "'Inter', 'Helvetica Neue', sans-serif"
        body_family = "'Lora', Georgia, serif" if "serif" in tokens.get("body_font", "sans-serif") else "'Inter', 'Helvetica Neue', sans-serif"

        css = f"""
<style>
:root {{
    --primary: {tokens['primary']};
    --secondary: {tokens['secondary']};
    --accent: {tokens['accent']};
    --text-primary: {tokens['text_primary']};
    --text-secondary: {tokens['text_secondary']};
    --border: {tokens['border']};
    --spacing: {tokens['spacing']};
    --heading-font: {heading_family};
    --body-font: {body_family};
    --heading-size: {tokens.get('heading_size', '36px')};
    --body-size: {tokens.get('body_size', '16px')};
    --heading-weight: {tokens.get('heading_weight', '700')};
    --body-weight: {tokens.get('body_weight', '400')};
    --line-height: {tokens.get('line_height', '1.6')};
}}

* {{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}}

html {{
    scroll-behavior: smooth;
}}

body {{
    background-color: var(--secondary);
    color: var(--text-primary);
    font-family: var(--body-font);
    font-size: var(--body-size);
    font-weight: var(--body-weight);
    line-height: var(--line-height);
}}

/* Responsive Typography */
h1, h2, h3, h4 {{
    font-family: var(--heading-font);
    font-weight: var(--heading-weight);
}}

h1 {{
    font-size: calc(var(--heading-size) * 1.4);
    margin-bottom: var(--spacing);
    color: var(--primary);
    letter-spacing: -0.02em;
    line-height: 1.1;
}}

h2 {{
    font-size: var(--heading-size);
    margin-bottom: calc(var(--spacing) * 0.75);
    color: var(--primary);
    line-height: 1.2;
}}

h3 {{
    font-size: 1.75em;
    font-weight: 600;
    margin-bottom: calc(var(--spacing) * 0.6);
}}

h4 {{
    font-size: 1.25em;
    font-weight: 600;
    margin-bottom: calc(var(--spacing) * 0.5);
}}

p {{
    margin-bottom: var(--spacing);
    color: var(--text-secondary);
}}

a {{
    color: var(--primary);
    text-decoration: none;
    transition: opacity 0.3s ease;
}}

a:hover {{
    opacity: 0.8;
}}

img {{
    max-width: 100%;
    height: auto;
    display: block;
}}

/* Layout Components */
.portfolio-container {{
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing);
}}

.portfolio-header {{
    padding: calc(var(--spacing) * 3) var(--spacing);
    text-align: center;
    border-bottom: 1px solid var(--border);
    margin-bottom: calc(var(--spacing) * 2);
}}

.portfolio-title {{
    font-size: 4em;
    margin-bottom: calc(var(--spacing) * 0.5);
    color: var(--primary);
}}

.portfolio-subtitle {{
    font-size: 1.25em;
    color: var(--text-secondary);
    margin-bottom: var(--spacing);
}}

.portfolio-section {{
    margin-bottom: calc(var(--spacing) * 3);
    padding-bottom: calc(var(--spacing) * 2);
    border-bottom: 1px solid var(--border);
}}

.portfolio-section:last-child {{
    border-bottom: none;
}}

.section-title {{
    font-size: 2.5em;
    margin-bottom: var(--spacing);
    color: var(--primary);
}}

.section-description {{
    font-size: 1.1em;
    color: var(--text-secondary);
    margin-bottom: var(--spacing);
    line-height: 1.8;
}}

/* Grid Layouts */
.grid-2 {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing);
}}

.grid-3 {{
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing);
}}

.grid-4 {{
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing);
}}

.grid-auto {{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing);
}}

/* Asset Cards */
.asset-item {{
    overflow: hidden;
    border: 1px solid var(--border);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}}

.asset-item:hover {{
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}}

.asset-image {{
    width: 100%;
    height: 300px;
    object-fit: cover;
    background-color: var(--accent);
}}

.asset-caption {{
    padding: var(--spacing);
    background-color: var(--secondary);
    border-top: 1px solid var(--border);
}}

.asset-title {{
    font-weight: 600;
    margin-bottom: calc(var(--spacing) * 0.25);
    color: var(--primary);
}}

.asset-description {{
    font-size: 0.9em;
    color: var(--text-secondary);
}}

/* Hero Section */
.hero {{
    background: linear-gradient(135deg, var(--primary), var(--accent));
    color: var(--secondary);
    padding: calc(var(--spacing) * 4) var(--spacing);
    text-align: center;
    margin-bottom: calc(var(--spacing) * 3);
}}

.hero h1 {{
    color: var(--secondary);
    font-size: 4em;
}}

.hero p {{
    color: var(--secondary);
    font-size: 1.25em;
}}

/* Footer */
.portfolio-footer {{
    background-color: var(--accent);
    padding: calc(var(--spacing) * 2) var(--spacing);
    text-align: center;
    border-top: 1px solid var(--border);
    margin-top: calc(var(--spacing) * 3);
    color: var(--text-secondary);
    font-size: 0.9em;
}}

/* Print Styles */
@media print {{
    body {{
        background: white;
        color: black;
    }}
    a {{
        color: inherit;
    }}
    .no-print {{
        display: none !important;
    }}
}}

"""

        # Add responsive breakpoints if enabled
        if responsive:
            css += self._generate_breakpoints()

        css += "</style>\n"
        return css

    def _generate_breakpoints(self) -> str:
        """Generate responsive breakpoints"""

        return """
/* Tablet Breakpoint */
@media (max-width: 1024px) {
    h1 { font-size: 2.5em; }
    h2 { font-size: 1.75em; }
    h3 { font-size: 1.25em; }

    .grid-3 { grid-template-columns: repeat(2, 1fr); }
    .grid-4 { grid-template-columns: repeat(2, 1fr); }

    .portfolio-title { font-size: 2.5em; }
    .section-title { font-size: 1.75em; }

    .asset-image { height: 250px; }
}

/* Mobile Breakpoint */
@media (max-width: 640px) {
    body { font-size: 14px; }

    h1 { font-size: 1.75em; }
    h2 { font-size: 1.25em; }
    h3 { font-size: 1.1em; }

    .grid-2, .grid-3, .grid-4, .grid-auto {
        grid-template-columns: 1fr;
    }

    .portfolio-container { padding: calc(var(--spacing) * 0.5); }
    .portfolio-header { padding: calc(var(--spacing) * 1.5) var(--spacing); }

    .portfolio-title { font-size: 1.75em; }
    .portfolio-subtitle { font-size: 1em; }
    .section-title { font-size: 1.25em; }

    .hero { padding: calc(var(--spacing) * 2) var(--spacing); }
    .hero h1 { font-size: 2em; }
    .hero p { font-size: 1em; }

    .asset-image { height: 200px; }

    .portfolio-footer { font-size: 0.85em; }
}
"""

    def _generate_body_content(
        self,
        portfolio_id: str,
        title: str,
        author: str,
        description: str,
        sections: List[Dict[str, Any]],
        assets: List[Dict[str, Any]],
        tokens: Dict[str, str],
    ) -> str:
        """Generate portfolio body content"""

        # Header
        header_html = f"""
<header class="portfolio-header">
    <h1 class="portfolio-title">{title}</h1>
    {f'<p class="portfolio-subtitle">{author}</p>' if author else ''}
    {f'<p class="section-description">{description}</p>' if description else ''}
</header>
"""

        # Sections
        sections_html = ""
        for section in sections:
            section_title = section.get("title", "Section")
            section_content = section.get("content", "")
            section_layout = section.get("layout", "grid-auto")

            sections_html += f"""
<section class="portfolio-section">
    <h2 class="section-title">{section_title}</h2>
    <p class="section-description">{section_content}</p>
</section>
"""

        # Assets Grid
        assets_html = ""
        if assets:
            assets_html = '<section class="portfolio-section"><h2 class="section-title">Works</h2><div class="grid-auto">'

            for asset in assets:
                asset_title = asset.get("title", "Untitled")
                asset_description = asset.get("description", "")
                asset_url = asset.get("url", "")

                assets_html += f"""
<div class="asset-item">
    <img src="{asset_url}" alt="{asset_title}" class="asset-image" loading="lazy">
    <div class="asset-caption">
        <h3 class="asset-title">{asset_title}</h3>
        {f'<p class="asset-description">{asset_description}</p>' if asset_description else ''}
    </div>
</div>
"""

            assets_html += "</div></section>"

        # Footer
        footer_html = f"""
<footer class="portfolio-footer">
    <p>&copy; {datetime.now().year} {author or title}. Generated by CosmoFolio.</p>
    <p><small>Portfolio ID: {portfolio_id}</small></p>
</footer>
"""

        # Combine
        body_content = f"""
<div class="portfolio-container">
    {header_html}
    {sections_html}
    {assets_html}
    {footer_html}
</div>
"""

        return body_content

    def get_responsive_variants(
        self,
        html_content: str,
    ) -> Dict[str, str]:
        """
        Get HTML optimized for different breakpoints

        Returns dict with mobile, tablet, desktop variants
        """

        return {
            "full": html_content,  # Full responsive version
            "mobile": self._add_viewport_meta(html_content, 640),
            "tablet": self._add_viewport_meta(html_content, 1024),
            "desktop": self._add_viewport_meta(html_content, 1200),
        }

    def _add_viewport_meta(self, html: str, width: int) -> str:
        """Add viewport meta for specific width"""
        return html.replace(
            'content="width=device-width, initial-scale=1.0"',
            f'content="width={width}, initial-scale=1.0"'
        )


# ==================== SINGLETON INSTANCE ====================

_html_preview_service = None

def get_html_preview_service() -> HTMLPreviewService:
    """Get or create HTML preview service singleton"""
    global _html_preview_service
    if _html_preview_service is None:
        _html_preview_service = HTMLPreviewService()
    return _html_preview_service
