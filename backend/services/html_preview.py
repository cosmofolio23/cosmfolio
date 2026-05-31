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

        # Design system tokens
        self.design_tokens = {
            "minimal_white": {
                "primary": "#000000",
                "secondary": "#ffffff",
                "accent": "#f0f0f0",
                "text_primary": "#1a1a1a",
                "text_secondary": "#666666",
                "border": "#e0e0e0",
                "spacing": "16px",
            },
            "dark_studio": {
                "primary": "#ffb81c",
                "secondary": "#1a1a1a",
                "accent": "#2a2a2a",
                "text_primary": "#ffffff",
                "text_secondary": "#cccccc",
                "border": "#333333",
                "spacing": "16px",
            },
            "scandinavian": {
                "primary": "#8b6f47",
                "secondary": "#f5f3f0",
                "accent": "#e8dcc8",
                "text_primary": "#3a3a3a",
                "text_secondary": "#666666",
                "border": "#d4c4b0",
                "spacing": "18px",
            },
            "architectural_journal": {
                "primary": "#d4a574",
                "secondary": "#fafafa",
                "accent": "#f0e6d2",
                "text_primary": "#2a2a2a",
                "text_secondary": "#555555",
                "border": "#e0d0c0",
                "spacing": "18px",
            },
            "competition_board": {
                "primary": "#ff0000",
                "secondary": "#ffffff",
                "accent": "#f5f5f5",
                "text_primary": "#000000",
                "text_secondary": "#333333",
                "border": "#cccccc",
                "spacing": "16px",
            },
            "parametric": {
                "primary": "#00ff00",
                "secondary": "#0a0a0a",
                "accent": "#1a1a1a",
                "text_primary": "#00ff00",
                "text_secondary": "#00cc00",
                "border": "#00ff00",
                "spacing": "14px",
            },
            "corporate": {
                "primary": "#0056b3",
                "secondary": "#f8f9fa",
                "accent": "#e9ecef",
                "text_primary": "#212529",
                "text_secondary": "#495057",
                "border": "#dee2e6",
                "spacing": "16px",
            },
        }

        logger.info("HTML Preview Service initialized")

    async def generate_html_preview(
        self,
        portfolio_id: str,
        portfolio_data: Dict[str, Any],
        style_pack: str = "minimal_white",
        layout: str = "default",
        include_meta: bool = True,
        responsive: bool = True,
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

            # Get design tokens
            tokens = self.design_tokens.get(style_pack, self.design_tokens["minimal_white"])

            # Generate HTML
            html = self._build_html_document(
                portfolio_id=portfolio_id,
                portfolio_data=portfolio_data,
                style_pack=style_pack,
                tokens=tokens,
                include_meta=include_meta,
                responsive=responsive,
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

        # Assemble document
        html = f"""<!DOCTYPE html>
<html lang="en">
{head}
<body>
{css}
{body_html}
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
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Georgia:wght@400;700&family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet">
</head>
"""

    def _generate_responsive_css(
        self,
        tokens: Dict[str, str],
        style_pack: str,
        responsive: bool,
    ) -> str:
        """Generate responsive CSS with design tokens"""

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
    font-family: 'Inter', 'Helvetica Neue', sans-serif;
    font-size: 16px;
    line-height: 1.6;
}}

/* Responsive Typography */
h1 {{
    font-size: 3em;
    font-weight: 700;
    margin-bottom: var(--spacing);
    color: var(--primary);
    letter-spacing: -0.02em;
}}

h2 {{
    font-size: 2.25em;
    font-weight: 700;
    margin-bottom: calc(var(--spacing) * 0.75);
    color: var(--primary);
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
