"""
Layout customization service
Phase 3: Task 3.3 - Layout templates, variations, customization
"""

import logging
from typing import Dict, Any, Optional, List
from uuid import uuid4
from datetime import datetime
from enum import Enum

from database import supabase

logger = logging.getLogger(__name__)

# ==================== LAYOUT TEMPLATES ====================

class LayoutTemplate(str, Enum):
    """Available layout templates"""
    minimal = "minimal"
    classic = "classic"
    modern = "modern"
    grid = "grid"
    masonry = "masonry"
    carousel = "carousel"
    timeline = "timeline"
    gallery = "gallery"
    list = "list"
    split = "split"
    hero = "hero"
    portfolio = "portfolio"


class LayoutCustomizationService:
    """Manage layout customization and variations"""

    def __init__(self):
        """Initialize layout customization service"""
        self.supabase = supabase
        self.templates = self._get_default_templates()

    def _get_default_templates(self) -> Dict[str, Dict[str, Any]]:
        """Get default layout templates"""
        return {
            LayoutTemplate.minimal.value: {
                "id": "layout-minimal",
                "name": "Minimal",
                "description": "Clean, minimalist layout with focus on content",
                "columns": 1,
                "gap": 16,
                "padding": 20,
                "components": ["image", "text"],
                "preview": "minimal-preview.jpg",
                "best_for": ["portfolios", "galleries"],
            },
            LayoutTemplate.classic.value: {
                "id": "layout-classic",
                "name": "Classic",
                "description": "Traditional portfolio layout with sidebars",
                "columns": 2,
                "gap": 24,
                "padding": 32,
                "components": ["header", "sidebar", "content"],
                "preview": "classic-preview.jpg",
                "best_for": ["portfolios", "presentations"],
            },
            LayoutTemplate.modern.value: {
                "id": "layout-modern",
                "name": "Modern",
                "description": "Contemporary design with bold typography",
                "columns": 3,
                "gap": 20,
                "padding": 24,
                "components": ["hero", "grid", "cta"],
                "preview": "modern-preview.jpg",
                "best_for": ["portfolios", "presentations"],
            },
            LayoutTemplate.grid.value: {
                "id": "layout-grid",
                "name": "Grid",
                "description": "Perfect grid layout for image-heavy content",
                "columns": 4,
                "gap": 12,
                "padding": 16,
                "components": ["image-grid"],
                "preview": "grid-preview.jpg",
                "best_for": ["galleries", "image-portfolios"],
            },
            LayoutTemplate.masonry.value: {
                "id": "layout-masonry",
                "name": "Masonry",
                "description": "Pinterest-style masonry layout",
                "columns": 3,
                "gap": 16,
                "padding": 20,
                "components": ["masonry-grid"],
                "preview": "masonry-preview.jpg",
                "best_for": ["galleries", "mixed-content"],
            },
            LayoutTemplate.carousel.value: {
                "id": "layout-carousel",
                "name": "Carousel",
                "description": "Slide-based carousel layout",
                "columns": 1,
                "gap": 0,
                "padding": 0,
                "components": ["carousel"],
                "preview": "carousel-preview.jpg",
                "best_for": ["presentations", "featured-projects"],
            },
            LayoutTemplate.gallery.value: {
                "id": "layout-gallery",
                "name": "Gallery",
                "description": "Showcase layout emphasizing images",
                "columns": 2,
                "gap": 24,
                "padding": 32,
                "components": ["large-image", "caption"],
                "preview": "gallery-preview.jpg",
                "best_for": ["galleries", "photography"],
            },
            LayoutTemplate.list.value: {
                "id": "layout-list",
                "name": "List",
                "description": "Simple list-based layout",
                "columns": 1,
                "gap": 20,
                "padding": 24,
                "components": ["list-item"],
                "preview": "list-preview.jpg",
                "best_for": ["portfolios", "directories"],
            },
        }

    # ==================== LAYOUT CONFIGURATION ====================

    async def create_layout_config(
        self,
        page_id: str,
        portfolio_id: str,
        template: str,
        columns: int,
        gap: int,
        padding: int,
        background_color: Optional[str] = None,
        custom_css: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create layout configuration for a page"""
        try:
            config_id = str(uuid4())

            config_data = {
                "id": config_id,
                "page_id": page_id,
                "portfolio_id": portfolio_id,
                "template": template,
                "columns": columns,
                "gap": gap,
                "padding": padding,
                "background_color": background_color,
                "custom_css": custom_css,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }

            result = self.supabase.table("layout_configs").insert(config_data).execute()

            if not result.data:
                raise Exception("Failed to create layout config")

            logger.info(f"Created layout config for page {page_id}")
            return result.data[0]

        except Exception as e:
            logger.error(f"Error creating layout config: {str(e)}")
            raise

    async def get_layout_config(
        self,
        page_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get layout configuration for a page"""
        try:
            result = self.supabase.table("layout_configs").select("*").eq(
                "page_id", page_id
            ).execute()

            return result.data[0] if result.data else None

        except Exception as e:
            logger.error(f"Error getting layout config: {str(e)}")
            raise

    async def update_layout_config(
        self,
        page_id: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Update layout configuration"""
        try:
            kwargs["updated_at"] = datetime.utcnow().isoformat()

            result = self.supabase.table("layout_configs").update(kwargs).eq(
                "page_id", page_id
            ).execute()

            if not result.data:
                raise Exception("Failed to update layout config")

            logger.info(f"Updated layout config for page {page_id}")
            return result.data[0]

        except Exception as e:
            logger.error(f"Error updating layout config: {str(e)}")
            raise

    # ==================== LAYOUT VARIATIONS ====================

    async def create_layout_variant(
        self,
        portfolio_id: str,
        name: str,
        description: Optional[str],
        template: str,
        configuration: Dict[str, Any],
        is_featured: bool = False
    ) -> Dict[str, Any]:
        """Create a layout variant/preset"""
        try:
            variant_id = str(uuid4())

            variant_data = {
                "id": variant_id,
                "portfolio_id": portfolio_id,
                "name": name,
                "description": description,
                "template": template,
                "configuration": configuration,
                "is_featured": is_featured,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }

            result = self.supabase.table("layout_variants").insert(variant_data).execute()

            if not result.data:
                raise Exception("Failed to create layout variant")

            logger.info(f"Created layout variant: {name}")
            return result.data[0]

        except Exception as e:
            logger.error(f"Error creating layout variant: {str(e)}")
            raise

    async def list_layout_variants(
        self,
        portfolio_id: str,
        featured_only: bool = False
    ) -> List[Dict[str, Any]]:
        """List layout variants for portfolio"""
        try:
            query = self.supabase.table("layout_variants").select("*").eq(
                "portfolio_id", portfolio_id
            )

            if featured_only:
                query = query.eq("is_featured", True)

            result = query.execute()
            return result.data or []

        except Exception as e:
            logger.error(f"Error listing layout variants: {str(e)}")
            raise

    async def delete_layout_variant(
        self,
        variant_id: str
    ) -> bool:
        """Delete a layout variant"""
        try:
            self.supabase.table("layout_variants").delete().eq(
                "id", variant_id
            ).execute()

            logger.info(f"Deleted layout variant: {variant_id}")
            return True

        except Exception as e:
            logger.error(f"Error deleting layout variant: {str(e)}")
            raise

    # ==================== TEMPLATE RECOMMENDATIONS ====================

    def recommend_layout(
        self,
        asset_count: int,
        asset_types: List[str],
        preferred_style: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Recommend layout based on asset count and types

        Returns: {recommendations, best_match, alternatives}
        """
        recommendations = []

        # Analyze asset composition
        has_images = "image" in asset_types
        has_videos = "video" in asset_types
        has_text = "text" in asset_types or "document" in asset_types

        # Rule-based recommendations
        if asset_count <= 5:
            # Few assets - use minimal or classic
            recommendations.append({
                "template": LayoutTemplate.minimal.value,
                "score": 95 if has_images else 85,
                "reason": "Perfect for showcasing quality over quantity",
                "pros": ["Clean focus", "Fast loading", "Mobile friendly"],
                "cons": ["Limited content", "Less engagement"],
            })
            recommendations.append({
                "template": LayoutTemplate.classic.value,
                "score": 85,
                "reason": "Traditional approach works well with fewer items",
                "pros": ["Professional look", "Organized", "Classic appeal"],
                "cons": ["Takes more vertical space"],
            })

        elif 5 < asset_count <= 20:
            # Medium assets - use modern or grid
            recommendations.append({
                "template": LayoutTemplate.modern.value,
                "score": 90,
                "reason": "Contemporary design for balanced portfolios",
                "pros": ["Engaging", "Scalable", "Modern aesthetic"],
                "cons": ["Requires good design sense"],
            })
            if has_images:
                recommendations.append({
                    "template": LayoutTemplate.grid.value,
                    "score": 88,
                    "reason": "Grid layout perfect for image galleries",
                    "pros": ["Visual impact", "Organized", "Responsive"],
                    "cons": ["Less flexible for mixed content"],
                })

        else:
            # Many assets - use masonry or gallery
            if has_images:
                recommendations.append({
                    "template": LayoutTemplate.masonry.value,
                    "score": 92,
                    "reason": "Masonry excels with many images",
                    "pros": ["Organic flow", "Space efficient", "Engaging"],
                    "cons": ["Can feel chaotic"],
                })
                recommendations.append({
                    "template": LayoutTemplate.gallery.value,
                    "score": 88,
                    "reason": "Classic gallery for image-heavy portfolios",
                    "pros": ["Elegant", "Focused", "Professional"],
                    "cons": ["Slower with many images"],
                })

        # Carousel for presentations
        if "presentation" in preferred_style or "featured" in preferred_style:
            recommendations.append({
                "template": LayoutTemplate.carousel.value,
                "score": 85 if asset_count > 3 else 70,
                "reason": "Carousel great for featured projects",
                "pros": ["Interactive", "Attention grabbing"],
                "cons": ["Slower load", "Less discoverable"],
            })

        # Sort by score
        recommendations.sort(key=lambda x: x["score"], reverse=True)

        return {
            "recommendations": recommendations,
            "best_match": recommendations[0]["template"] if recommendations else LayoutTemplate.grid.value,
            "alternatives": [r["template"] for r in recommendations[1:3]],
            "analysis": {
                "asset_count": asset_count,
                "asset_types": asset_types,
                "has_images": has_images,
                "has_videos": has_videos,
                "has_text": has_text,
            },
        }

    # ==================== TEMPLATE UTILITIES ====================

    def get_template_details(
        self,
        template: str
    ) -> Optional[Dict[str, Any]]:
        """Get details about a specific template"""
        return self.templates.get(template)

    def list_all_templates(self) -> List[Dict[str, Any]]:
        """Get all available templates"""
        return list(self.templates.values())

    def get_responsive_breakpoints(
        self,
        columns: int
    ) -> Dict[str, int]:
        """Get responsive breakpoints based on column count"""
        breakpoints = {
            "mobile": 375,
            "tablet": 768,
            "desktop": 1024,
            "wide": 1440,
        }

        # Adjust based on column count
        if columns == 1:
            return breakpoints
        elif columns == 2:
            return {
                "mobile": 375,
                "tablet": 768,
                "desktop": 1024,
            }
        elif columns >= 3:
            return {
                "mobile": 375,
                "tablet": 768,
                "desktop": 1200,
                "wide": 1440,
            }

        return breakpoints

    # ==================== LAYOUT EXPORT ====================

    def generate_layout_html(
        self,
        template: str,
        columns: int,
        gap: int,
        padding: int,
        background_color: Optional[str] = None
    ) -> str:
        """Generate HTML/CSS for layout"""
        grid_css = f"""
        .layout-grid {{
            display: grid;
            grid-template-columns: repeat({columns}, 1fr);
            gap: {gap}px;
            padding: {padding}px;
            background-color: {background_color or '#ffffff'};
        }}

        @media (max-width: 768px) {{
            .layout-grid {{
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: {max(12, gap - 4)}px;
                padding: {max(16, padding - 4)}px;
            }}
        }}

        @media (max-width: 480px) {{
            .layout-grid {{
                grid-template-columns: 1fr;
                gap: {max(8, gap - 8)}px;
                padding: {max(12, padding - 8)}px;
            }}
        }}
        """

        html = f"""
        <div class="layout-grid">
            <!-- Content goes here -->
        </div>

        <style>
        {grid_css}
        </style>
        """

        return html.strip()

    def generate_layout_json(
        self,
        template: str,
        columns: int,
        gap: int,
        padding: int,
        background_color: Optional[str] = None,
        custom_css: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate layout configuration as JSON"""
        return {
            "template": template,
            "grid": {
                "columns": columns,
                "gap": f"{gap}px",
                "padding": f"{padding}px",
                "background_color": background_color or "#ffffff",
            },
            "responsive": {
                "mobile": {
                    "columns": max(1, columns // 2),
                    "gap": f"{max(12, gap - 4)}px",
                },
                "tablet": {
                    "columns": max(1, columns - 1),
                    "gap": f"{gap}px",
                },
            },
            "custom_css": custom_css,
            "exported_at": datetime.utcnow().isoformat(),
        }

    # ==================== LAYOUT PRESETS ====================

    def get_layout_presets(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get layout presets grouped by template"""
        return {
            LayoutTemplate.grid.value: [
                {
                    "name": "4-Column Grid",
                    "columns": 4,
                    "gap": 12,
                    "padding": 16,
                },
                {
                    "name": "3-Column Grid",
                    "columns": 3,
                    "gap": 16,
                    "padding": 20,
                },
            ],
            LayoutTemplate.masonry.value: [
                {
                    "name": "Pinterest Style",
                    "columns": 3,
                    "gap": 16,
                    "padding": 20,
                },
                {
                    "name": "Compact Masonry",
                    "columns": 4,
                    "gap": 12,
                    "padding": 16,
                },
            ],
            LayoutTemplate.minimal.value: [
                {
                    "name": "Single Column",
                    "columns": 1,
                    "gap": 24,
                    "padding": 32,
                },
            ],
            LayoutTemplate.classic.value: [
                {
                    "name": "Two Column",
                    "columns": 2,
                    "gap": 24,
                    "padding": 32,
                },
            ],
        }


# ==================== SINGLETON INSTANCE ====================

_layout_customization_service = None

def get_layout_customization_service() -> LayoutCustomizationService:
    """Get or create layout customization service singleton"""
    global _layout_customization_service
    if _layout_customization_service is None:
        _layout_customization_service = LayoutCustomizationService()
    return _layout_customization_service
