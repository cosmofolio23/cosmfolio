"""
Layout Rendering Engine
Phase 5: Task 5.5 - Responsive grid rendering for 12 layout templates
"""

import logging
from typing import Dict, Any, List, Optional
from enum import Enum
from dataclasses import dataclass

logger = logging.getLogger(__name__)


class LayoutTemplate(str, Enum):
    """Available portfolio layout templates"""
    HERO_RENDER = "hero_render"
    SPLIT_RENDER_TEXT = "split_render_text"
    THREE_IMAGE_GRID = "three_image_grid"
    PLAN_SECTION_RENDER = "plan_section_render"
    DIAGRAM_HEAVY = "diagram_heavy"
    COMPETITION_BOARD = "competition_board"
    TIMELINE = "timeline"
    MASONRY_GRID = "masonry_grid"
    LIST_VIEW = "list_view"
    CAROUSEL = "carousel"
    COLLAGE = "collage"
    CUSTOM = "custom"


@dataclass
class GridConfig:
    """Grid layout configuration"""
    columns: int
    gap: str
    min_width: str
    alignment: str
    direction: str


class LayoutRenderingEngine:
    """Advanced layout rendering with responsive grids"""

    def __init__(self):
        """Initialize layout engine"""

        self.placeholder_image = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%23999999' text-anchor='middle' dominant-baseline='middle'%3EImage Placeholder%3C/text%3E%3C/svg%3E"

        # Layout configurations
        self.layouts = {
            LayoutTemplate.HERO_RENDER: {
                "name": "Hero Render",
                "description": "Full-page hero image with text overlay",
                "min_assets": 1,
                "max_assets": 1,
                "responsive": True,
                "grid_config": GridConfig(
                    columns=1,
                    gap="0",
                    min_width="100%",
                    alignment="center",
                    direction="column",
                ),
            },
            LayoutTemplate.SPLIT_RENDER_TEXT: {
                "name": "Split Render & Text",
                "description": "50/50 split between image and text",
                "min_assets": 1,
                "max_assets": 2,
                "responsive": True,
                "grid_config": GridConfig(
                    columns=2,
                    gap="32px",
                    min_width="300px",
                    alignment="center",
                    direction="row",
                ),
            },
            LayoutTemplate.THREE_IMAGE_GRID: {
                "name": "Three Image Grid",
                "description": "Grid of three images per row",
                "min_assets": 3,
                "max_assets": 12,
                "responsive": True,
                "grid_config": GridConfig(
                    columns=3,
                    gap="16px",
                    min_width="250px",
                    alignment="stretch",
                    direction="row",
                ),
            },
            LayoutTemplate.PLAN_SECTION_RENDER: {
                "name": "Plan + Section + Render",
                "description": "Technical layout: plan, section, and render",
                "min_assets": 2,
                "max_assets": 3,
                "responsive": True,
                "grid_config": GridConfig(
                    columns=3,
                    gap="24px",
                    min_width="200px",
                    alignment="stretch",
                    direction="row",
                ),
            },
            LayoutTemplate.DIAGRAM_HEAVY: {
                "name": "Diagram Heavy",
                "description": "Multiple technical diagrams and details",
                "min_assets": 2,
                "max_assets": 9,
                "responsive": True,
                "grid_config": GridConfig(
                    columns=4,
                    gap="12px",
                    min_width="150px",
                    alignment="stretch",
                    direction="row",
                ),
            },
            LayoutTemplate.COMPETITION_BOARD: {
                "name": "Competition Board",
                "description": "Poster-style competition presentation",
                "min_assets": 1,
                "max_assets": 4,
                "responsive": False,
                "grid_config": GridConfig(
                    columns=2,
                    gap="20px",
                    min_width="400px",
                    alignment="center",
                    direction="row",
                ),
            },
            LayoutTemplate.TIMELINE: {
                "name": "Timeline",
                "description": "Project evolution timeline",
                "min_assets": 2,
                "max_assets": 10,
                "responsive": True,
                "grid_config": GridConfig(
                    columns=1,
                    gap="40px",
                    min_width="100%",
                    alignment="center",
                    direction="column",
                ),
            },
            LayoutTemplate.MASONRY_GRID: {
                "name": "Masonry Grid",
                "description": "Pinterest-style masonry layout",
                "min_assets": 3,
                "max_assets": 20,
                "responsive": True,
                "grid_config": GridConfig(
                    columns=3,
                    gap="16px",
                    min_width="200px",
                    alignment="stretch",
                    direction="row",
                ),
            },
            LayoutTemplate.LIST_VIEW: {
                "name": "List View",
                "description": "Vertical list with image and text",
                "min_assets": 1,
                "max_assets": 10,
                "responsive": True,
                "grid_config": GridConfig(
                    columns=1,
                    gap="24px",
                    min_width="100%",
                    alignment="center",
                    direction="column",
                ),
            },
            LayoutTemplate.CAROUSEL: {
                "name": "Carousel",
                "description": "Horizontal scrolling carousel",
                "min_assets": 3,
                "max_assets": 20,
                "responsive": True,
                "grid_config": GridConfig(
                    columns=4,
                    gap="16px",
                    min_width="300px",
                    alignment="flex-start",
                    direction="row",
                ),
            },
            LayoutTemplate.COLLAGE: {
                "name": "Collage",
                "description": "Artistic collage arrangement",
                "min_assets": 4,
                "max_assets": 16,
                "responsive": True,
                "grid_config": GridConfig(
                    columns=4,
                    gap="8px",
                    min_width="100px",
                    alignment="stretch",
                    direction="row",
                ),
            },
            LayoutTemplate.CUSTOM: {
                "name": "Custom Layout",
                "description": "User-defined custom layout",
                "min_assets": 1,
                "max_assets": 50,
                "responsive": True,
                "grid_config": GridConfig(
                    columns=3,
                    gap="16px",
                    min_width="250px",
                    alignment="stretch",
                    direction="row",
                ),
            },
        }

        logger.info("Layout Rendering Engine initialized with 12 templates")

    def render_layout(
        self,
        layout: str,
        assets: List[Dict[str, Any]],
        style_pack: str,
    ) -> str:
        """
        Render HTML for specified layout with assets

        Args:
            layout: Layout template name
            assets: List of asset dicts with url, title, description
            style_pack: Design system style pack

        Returns:
            HTML string for rendered layout
        """

        try:
            layout_template = LayoutTemplate(layout)
            layout_config = self.layouts.get(layout_template)

            if not layout_config:
                raise ValueError(f"Unknown layout: {layout}")

            # Validate asset count
            min_assets = layout_config.get("min_assets", 1)
            max_assets = layout_config.get("max_assets", 50)

            if len(assets) < min_assets:
                logger.warning(
                    f"Layout {layout} requires at least {min_assets} assets, "
                    f"got {len(assets)}. Using placeholder assets."
                )
                assets = self._add_placeholder_assets(assets, min_assets)

            if len(assets) > max_assets:
                logger.warning(
                    f"Layout {layout} supports max {max_assets} assets, "
                    f"got {len(assets)}. Truncating."
                )
                assets = assets[:max_assets]

            # Generate layout-specific HTML
            html = self._generate_layout_html(layout_template, assets, style_pack)

            logger.info(f"Rendered layout {layout} with {len(assets)} assets")

            return html

        except Exception as e:
            logger.error(f"Error rendering layout: {str(e)}")
            raise

    def _generate_layout_html(
        self,
        layout: LayoutTemplate,
        assets: List[Dict[str, Any]],
        style_pack: str,
    ) -> str:
        """Generate HTML for specific layout"""

        if layout == LayoutTemplate.HERO_RENDER:
            return self._render_hero_layout(assets, style_pack)
        elif layout == LayoutTemplate.SPLIT_RENDER_TEXT:
            return self._render_split_layout(assets, style_pack)
        elif layout == LayoutTemplate.THREE_IMAGE_GRID:
            return self._render_grid_layout(assets, style_pack, columns=3)
        elif layout == LayoutTemplate.PLAN_SECTION_RENDER:
            return self._render_technical_layout(assets, style_pack)
        elif layout == LayoutTemplate.DIAGRAM_HEAVY:
            return self._render_grid_layout(assets, style_pack, columns=4)
        elif layout == LayoutTemplate.COMPETITION_BOARD:
            return self._render_competition_layout(assets, style_pack)
        elif layout == LayoutTemplate.TIMELINE:
            return self._render_timeline_layout(assets, style_pack)
        elif layout == LayoutTemplate.MASONRY_GRID:
            return self._render_masonry_layout(assets, style_pack)
        elif layout == LayoutTemplate.LIST_VIEW:
            return self._render_list_layout(assets, style_pack)
        elif layout == LayoutTemplate.CAROUSEL:
            return self._render_carousel_layout(assets, style_pack)
        elif layout == LayoutTemplate.COLLAGE:
            return self._render_collage_layout(assets, style_pack)
        else:
            return self._render_grid_layout(assets, style_pack, columns=3)

    def _render_hero_layout(self, assets: List[Dict[str, Any]], style_pack: str) -> str:
        """Render hero layout (full-page image)"""
        asset = assets[0] if assets else {}
        image_url = asset.get("url", self.placeholder_image)
        title = asset.get("title", "Project")
        description = asset.get("description", "")

        return f"""
        <section class="layout-hero">
            <div class="hero-image" style="background-image: url('{image_url}');">
                <div class="hero-overlay">
                    <h1 class="hero-title">{title}</h1>
                    {f'<p class="hero-description">{description}</p>' if description else ''}
                </div>
            </div>
        </section>
        """

    def _render_split_layout(
        self, assets: List[Dict[str, Any]], style_pack: str
    ) -> str:
        """Render split layout (50/50 image and text)"""
        asset = assets[0] if assets else {}
        image_url = asset.get("url", self.placeholder_image)
        title = asset.get("title", "Project")
        description = asset.get("description", "")

        return f"""
        <section class="layout-split">
            <div class="split-image">
                <img src="{image_url}" alt="{title}" />
            </div>
            <div class="split-text">
                <h2>{title}</h2>
                <p>{description}</p>
            </div>
        </section>
        """

    def _render_grid_layout(
        self, assets: List[Dict[str, Any]], style_pack: str, columns: int = 3
    ) -> str:
        """Render grid layout"""
        items_html = ""
        for asset in assets:
            image_url = asset.get("url", self.placeholder_image)
            title = asset.get("title", "Untitled")
            description = asset.get("description", "")

            items_html += f"""
            <div class="grid-item">
                <img src="{image_url}" alt="{title}" class="grid-image" />
                <div class="grid-caption">
                    <h3>{title}</h3>
                    {f'<p>{description}</p>' if description else ''}
                </div>
            </div>
            """

        return f"""
        <section class="layout-grid" style="--grid-columns: {columns};">
            {items_html}
        </section>
        """

    def _render_technical_layout(
        self, assets: List[Dict[str, Any]], style_pack: str
    ) -> str:
        """Render technical layout (plan, section, render)"""
        asset_labels = ["Plan", "Section", "Render"]
        items_html = ""

        for idx, asset in enumerate(assets[:3]):
            image_url = asset.get("url", self.placeholder_image)
            title = asset.get("title", asset_labels[idx] if idx < len(asset_labels) else f"Item {idx + 1}")

            items_html += f"""
            <div class="technical-item">
                <img src="{image_url}" alt="{title}" />
                <p class="technical-label">{title}</p>
            </div>
            """

        return f"""
        <section class="layout-technical">
            {items_html}
        </section>
        """

    def _render_competition_layout(
        self, assets: List[Dict[str, Any]], style_pack: str
    ) -> str:
        """Render competition board layout"""
        items_html = ""
        for asset in assets[:4]:
            image_url = asset.get("url", self.placeholder_image)
            title = asset.get("title", "")

            items_html += f"""
            <div class="competition-item">
                <img src="{image_url}" alt="{title}" />
                {f'<h3 class="competition-title">{title}</h3>' if title else ''}
            </div>
            """

        return f"""
        <section class="layout-competition">
            <div class="competition-board">
                {items_html}
            </div>
        </section>
        """

    def _render_timeline_layout(
        self, assets: List[Dict[str, Any]], style_pack: str
    ) -> str:
        """Render timeline layout"""
        items_html = ""

        for idx, asset in enumerate(assets):
            image_url = asset.get("url", self.placeholder_image)
            title = asset.get("title", f"Phase {idx + 1}")
            description = asset.get("description", "")

            items_html += f"""
            <div class="timeline-item">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <h3>{title}</h3>
                    <img src="{image_url}" alt="{title}" />
                    {f'<p>{description}</p>' if description else ''}
                </div>
            </div>
            """

        return f"""
        <section class="layout-timeline">
            {items_html}
        </section>
        """

    def _render_masonry_layout(
        self, assets: List[Dict[str, Any]], style_pack: str
    ) -> str:
        """Render masonry layout"""
        items_html = ""

        for asset in assets:
            image_url = asset.get("url", self.placeholder_image)
            title = asset.get("title", "")

            items_html += f"""
            <div class="masonry-item">
                <img src="{image_url}" alt="{title}" />
                {f'<h4>{title}</h4>' if title else ''}
            </div>
            """

        return f"""
        <section class="layout-masonry">
            {items_html}
        </section>
        """

    def _render_list_layout(
        self, assets: List[Dict[str, Any]], style_pack: str
    ) -> str:
        """Render list view layout"""
        items_html = ""

        for asset in assets:
            image_url = asset.get("url", self.placeholder_image)
            title = asset.get("title", "")
            description = asset.get("description", "")

            items_html += f"""
            <div class="list-item">
                <img src="{image_url}" alt="{title}" class="list-image" />
                <div class="list-content">
                    <h3>{title}</h3>
                    {f'<p>{description}</p>' if description else ''}
                </div>
            </div>
            """

        return f"""
        <section class="layout-list">
            {items_html}
        </section>
        """

    def _render_carousel_layout(
        self, assets: List[Dict[str, Any]], style_pack: str
    ) -> str:
        """Render carousel layout"""
        items_html = ""

        for asset in assets:
            image_url = asset.get("url", self.placeholder_image)
            title = asset.get("title", "")

            items_html += f"""
            <div class="carousel-item">
                <img src="{image_url}" alt="{title}" />
                {f'<p class="carousel-caption">{title}</p>' if title else ''}
            </div>
            """

        return f"""
        <section class="layout-carousel">
            <div class="carousel-track">
                {items_html}
            </div>
        </section>
        """

    def _render_collage_layout(
        self, assets: List[Dict[str, Any]], style_pack: str
    ) -> str:
        """Render collage layout"""
        items_html = ""

        for idx, asset in enumerate(assets):
            image_url = asset.get("url", self.placeholder_image)
            title = asset.get("title", "")
            # Vary sizes for collage effect
            size_class = "size-large" if idx % 3 == 0 else "size-medium"

            items_html += f"""
            <div class="collage-item {size_class}">
                <img src="{image_url}" alt="{title}" />
            </div>
            """

        return f"""
        <section class="layout-collage">
            {items_html}
        </section>
        """

    def _add_placeholder_assets(
        self, assets: List[Dict[str, Any]], min_count: int
    ) -> List[Dict[str, Any]]:
        """Add placeholder assets if count is below minimum"""
        while len(assets) < min_count:
            assets.append({
                "url": self.placeholder_image,
                "title": f"Placeholder {len(assets) + 1}",
                "description": "Image placeholder - add real assets",
            })
        return assets

    def get_layout_info(self, layout: str) -> Dict[str, Any]:
        """Get information about a layout"""
        try:
            layout_template = LayoutTemplate(layout)
            return self.layouts.get(layout_template, {})
        except ValueError:
            return {}

    def get_all_layouts(self) -> Dict[str, Dict[str, Any]]:
        """Get all available layouts"""
        return {
            layout.value: config for layout, config in self.layouts.items()
        }

    def validate_assets_for_layout(
        self, layout: str, asset_count: int
    ) -> Dict[str, Any]:
        """Validate if assets count is valid for layout"""
        layout_config = self.get_layout_info(layout)

        if not layout_config:
            return {"valid": False, "error": f"Unknown layout: {layout}"}

        min_assets = layout_config.get("min_assets", 1)
        max_assets = layout_config.get("max_assets", 50)

        return {
            "valid": min_assets <= asset_count <= max_assets,
            "min_assets": min_assets,
            "max_assets": max_assets,
            "asset_count": asset_count,
            "layout": layout,
        }


# ==================== SINGLETON INSTANCE ====================

_layout_rendering_engine = None

def get_layout_rendering_engine() -> LayoutRenderingEngine:
    """Get or create layout rendering engine singleton"""
    global _layout_rendering_engine
    if _layout_rendering_engine is None:
        _layout_rendering_engine = LayoutRenderingEngine()
    return _layout_rendering_engine
