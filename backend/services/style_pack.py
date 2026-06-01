"""
Style pack management service
Phase 3: Task 3.2 - Theme creation, style presets, management
"""

import logging
from typing import Dict, Any, Optional, List
from uuid import uuid4
from datetime import datetime
from enum import Enum

from database import supabase

logger = logging.getLogger(__name__)

# ==================== STYLE PACK SERVICE ====================

class StylePackService:
    """Manage style packs and themes"""

    def __init__(self):
        """Initialize style pack service"""
        self.supabase = supabase

    # ==================== STYLE PACK CRUD ====================

    async def create_style_pack(
        self,
        portfolio_id: str,
        user_id: str,
        name: str,
        description: Optional[str],
        colors: Dict[str, str],
        typography: Dict[str, Any],
        spacing: Optional[Dict[str, int]] = None,
        custom_css: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new style pack"""
        try:
            pack_id = str(uuid4())

            pack_data = {
                "id": pack_id,
                "portfolio_id": portfolio_id,
                "user_id": user_id,
                "name": name,
                "description": description,
                "colors": colors,
                "typography": typography,
                "spacing": spacing or {},
                "custom_css": custom_css,
                "is_default": False,
                "is_custom": True,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }

            result = supabase.table("style_packs").insert(pack_data).execute()

            if not result.data:
                raise Exception("Failed to create style pack")

            logger.info(f"Created style pack: {name}")
            return result.data[0]

        except Exception as e:
            logger.error(f"Error creating style pack: {str(e)}")
            raise

    async def get_style_pack(
        self,
        portfolio_id: str,
        pack_id: str
    ) -> Dict[str, Any]:
        """Get style pack details"""
        try:
            result = supabase.table("style_packs").select("*").eq(
                "id", pack_id
            ).eq("portfolio_id", portfolio_id).execute()

            if not result.data:
                raise Exception(f"Style pack not found: {pack_id}")

            return result.data[0]

        except Exception as e:
            logger.error(f"Error getting style pack: {str(e)}")
            raise

    async def list_style_packs(
        self,
        portfolio_id: str,
        include_defaults: bool = True
    ) -> Dict[str, Any]:
        """List all style packs for portfolio"""
        try:
            # Get custom packs
            custom_packs = supabase.table("style_packs").select("*").eq(
                "portfolio_id", portfolio_id
            ).execute()

            packs = custom_packs.data or []

            # Get default packs if requested
            if include_defaults:
                default_packs = supabase.table("style_packs").select("*").eq(
                    "is_default", True
                ).is_("portfolio_id", "null").execute()
                packs.extend(default_packs.data or [])

            return {
                "packs": packs,
                "total_count": len(packs),
                "custom_count": len([p for p in packs if p.get("is_custom")]),
                "default_count": len([p for p in packs if p.get("is_default")]),
            }

        except Exception as e:
            logger.error(f"Error listing style packs: {str(e)}")
            raise

    async def update_style_pack(
        self,
        portfolio_id: str,
        pack_id: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Update style pack"""
        try:
            # Add updated timestamp
            kwargs["updated_at"] = datetime.utcnow().isoformat()

            result = supabase.table("style_packs").update(kwargs).eq(
                "id", pack_id
            ).eq("portfolio_id", portfolio_id).execute()

            if not result.data:
                raise Exception("Failed to update style pack")

            logger.info(f"Updated style pack: {pack_id}")
            return result.data[0]

        except Exception as e:
            logger.error(f"Error updating style pack: {str(e)}")
            raise

    async def delete_style_pack(
        self,
        portfolio_id: str,
        pack_id: str
    ) -> bool:
        """Delete style pack"""
        try:
            result = supabase.table("style_packs").delete().eq(
                "id", pack_id
            ).eq("portfolio_id", portfolio_id).execute()

            logger.info(f"Deleted style pack: {pack_id}")
            return True

        except Exception as e:
            logger.error(f"Error deleting style pack: {str(e)}")
            raise

    # ==================== DEFAULT PACKS ====================

    async def set_default_pack(
        self,
        portfolio_id: str,
        pack_id: str
    ) -> Dict[str, Any]:
        """Set a style pack as the default for portfolio"""
        try:
            # Clear previous default
            supabase.table("style_packs").update(
                {"is_default": False}
            ).eq("portfolio_id", portfolio_id).eq("is_default", True).execute()

            # Set new default
            result = supabase.table("style_packs").update(
                {"is_default": True}
            ).eq("id", pack_id).eq("portfolio_id", portfolio_id).execute()

            if not result.data:
                raise Exception("Failed to set default style pack")

            logger.info(f"Set default style pack: {pack_id}")
            return result.data[0]

        except Exception as e:
            logger.error(f"Error setting default pack: {str(e)}")
            raise

    async def get_default_pack(
        self,
        portfolio_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get the default style pack for portfolio"""
        try:
            result = supabase.table("style_packs").select("*").eq(
                "portfolio_id", portfolio_id
            ).eq("is_default", True).limit(1).execute()

            return result.data[0] if result.data else None

        except Exception as e:
            logger.error(f"Error getting default pack: {str(e)}")
            raise

    # ==================== PRESET PACKS ====================

    def get_preset_packs(self) -> List[Dict[str, Any]]:
        """Get built-in preset style packs"""
        return [
            {
                "id": "preset-minimal-white",
                "name": "Minimal White",
                "description": "Clean, minimal design with white background",
                "is_preset": True,
                "colors": {
                    "primary": "#000000",
                    "secondary": "#666666",
                    "accent": "#0066cc",
                    "background": "#ffffff",
                    "text": "#333333",
                },
                "typography": {
                    "heading_font": "sans-serif",
                    "body_font": "sans-serif",
                    "heading_size": 36,
                    "body_size": 16,
                    "heading_weight": 700,
                    "body_weight": 400,
                    "line_height": 1.6,
                },
                "spacing": {
                    "xs": 4,
                    "sm": 8,
                    "md": 16,
                    "lg": 24,
                    "xl": 32,
                },
            },
            {
                "id": "preset-dark-studio",
                "name": "Dark Studio",
                "description": "Dark professional theme for architecture",
                "is_preset": True,
                "colors": {
                    "primary": "#ffffff",
                    "secondary": "#cccccc",
                    "accent": "#ff6b35",
                    "background": "#1a1a1a",
                    "text": "#f0f0f0",
                },
                "typography": {
                    "heading_font": "serif",
                    "body_font": "sans-serif",
                    "heading_size": 40,
                    "body_size": 16,
                    "heading_weight": 700,
                    "body_weight": 400,
                    "line_height": 1.5,
                },
                "spacing": {
                    "xs": 6,
                    "sm": 12,
                    "md": 20,
                    "lg": 30,
                    "xl": 40,
                },
            },
            {
                "id": "preset-scandinavian",
                "name": "Scandinavian",
                "description": "Light, airy Scandinavian design aesthetic",
                "is_preset": True,
                "colors": {
                    "primary": "#264653",
                    "secondary": "#2a9d8f",
                    "accent": "#e9c46a",
                    "background": "#f4f1de",
                    "text": "#333333",
                },
                "typography": {
                    "heading_font": "sans-serif",
                    "body_font": "sans-serif",
                    "heading_size": 32,
                    "body_size": 16,
                    "heading_weight": 600,
                    "body_weight": 400,
                    "line_height": 1.7,
                },
                "spacing": {
                    "xs": 5,
                    "sm": 10,
                    "md": 18,
                    "lg": 28,
                    "xl": 36,
                },
            },
            {
                "id": "preset-corporate",
                "name": "Corporate",
                "description": "Professional corporate design for architecture firms",
                "is_preset": True,
                "colors": {
                    "primary": "#003366",
                    "secondary": "#0055aa",
                    "accent": "#ff6633",
                    "background": "#ffffff",
                    "text": "#333333",
                },
                "typography": {
                    "heading_font": "serif",
                    "body_font": "sans-serif",
                    "heading_size": 38,
                    "body_size": 15,
                    "heading_weight": 700,
                    "body_weight": 400,
                    "line_height": 1.6,
                },
                "spacing": {
                    "xs": 4,
                    "sm": 8,
                    "md": 16,
                    "lg": 24,
                    "xl": 32,
                },
            },
            {
                "id": "preset-arch-journal",
                "name": "Architectural Journal",
                "description": "Magazine-like aesthetic with serif & sans-serif mix",
                "is_preset": True,
                "colors": {
                    "primary": "#2c2c2c",
                    "secondary": "#8b7355",
                    "accent": "#d4a574",
                    "background": "#f9f7f4",
                    "text": "#2c2c2c",
                },
                "typography": {
                    "heading_font": "serif",
                    "body_font": "sans-serif",
                    "heading_size": 44,
                    "body_size": 14,
                    "heading_weight": 700,
                    "body_weight": 400,
                    "line_height": 1.8,
                },
                "spacing": {
                    "xs": 6,
                    "sm": 12,
                    "md": 20,
                    "lg": 32,
                    "xl": 48,
                },
            },
            {
                "id": "preset-competition",
                "name": "Competition Board",
                "description": "Bold, high-contrast graphic design for competitions",
                "is_preset": True,
                "colors": {
                    "primary": "#000000",
                    "secondary": "#ff0000",
                    "accent": "#ffff00",
                    "background": "#ffffff",
                    "text": "#000000",
                },
                "typography": {
                    "heading_font": "sans-serif",
                    "body_font": "sans-serif",
                    "heading_size": 52,
                    "body_size": 12,
                    "heading_weight": 900,
                    "body_weight": 700,
                    "line_height": 1.4,
                },
                "spacing": {
                    "xs": 8,
                    "sm": 16,
                    "md": 24,
                    "lg": 40,
                    "xl": 56,
                },
            },
            {
                "id": "preset-parametric",
                "name": "Parametric",
                "description": "Geometric, tech-forward minimal design",
                "is_preset": True,
                "colors": {
                    "primary": "#1a1a2e",
                    "secondary": "#16213e",
                    "accent": "#00d4ff",
                    "background": "#f0f4ff",
                    "text": "#0f3460",
                },
                "typography": {
                    "heading_font": "sans-serif",
                    "body_font": "sans-serif",
                    "heading_size": 40,
                    "body_size": 14,
                    "heading_weight": 600,
                    "body_weight": 400,
                    "line_height": 1.5,
                },
                "spacing": {
                    "xs": 4,
                    "sm": 8,
                    "md": 16,
                    "lg": 28,
                    "xl": 40,
                },
            },
            {
                "id": "preset-luxury",
                "name": "Luxury Editorial",
                "description": "High-end serif typography with warm neutrals",
                "is_preset": True,
                "colors": {
                    "primary": "#5a4a42",
                    "secondary": "#c9ada7",
                    "accent": "#d4a574",
                    "background": "#fefaf0",
                    "text": "#5a4a42",
                },
                "typography": {
                    "heading_font": "serif",
                    "body_font": "serif",
                    "heading_size": 48,
                    "body_size": 16,
                    "heading_weight": 400,
                    "body_weight": 300,
                    "line_height": 1.9,
                },
                "spacing": {
                    "xs": 8,
                    "sm": 16,
                    "md": 24,
                    "lg": 40,
                    "xl": 56,
                },
            },
            {
                "id": "preset-future-tech",
                "name": "Future Tech",
                "description": "Neon accents with modern sans-serif design",
                "is_preset": True,
                "colors": {
                    "primary": "#0a0e27",
                    "secondary": "#1a1f3a",
                    "accent": "#00ff88",
                    "background": "#ffffff",
                    "text": "#0a0e27",
                },
                "typography": {
                    "heading_font": "sans-serif",
                    "body_font": "sans-serif",
                    "heading_size": 42,
                    "body_size": 14,
                    "heading_weight": 700,
                    "body_weight": 400,
                    "line_height": 1.6,
                },
                "spacing": {
                    "xs": 5,
                    "sm": 10,
                    "md": 18,
                    "lg": 30,
                    "xl": 44,
                },
            },
            {
                "id": "preset-monochrome",
                "name": "Monochrome",
                "description": "Black, white, and grayscale professional design",
                "is_preset": True,
                "colors": {
                    "primary": "#000000",
                    "secondary": "#666666",
                    "accent": "#333333",
                    "background": "#ffffff",
                    "text": "#1a1a1a",
                },
                "typography": {
                    "heading_font": "sans-serif",
                    "body_font": "sans-serif",
                    "heading_size": 36,
                    "body_size": 15,
                    "heading_weight": 700,
                    "body_weight": 400,
                    "line_height": 1.7,
                },
                "spacing": {
                    "xs": 4,
                    "sm": 8,
                    "md": 16,
                    "lg": 24,
                    "xl": 32,
                },
            },
        ]

    # ==================== COMPONENT STYLES ====================

    async def create_component_style(
        self,
        pack_id: str,
        component_type: str,
        styles: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create component-level styles within a pack"""
        try:
            style_id = str(uuid4())

            style_data = {
                "id": style_id,
                "pack_id": pack_id,
                "component_type": component_type,
                "styles": styles,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }

            result = supabase.table("component_styles").insert(style_data).execute()

            if not result.data:
                raise Exception("Failed to create component style")

            logger.info(f"Created component style: {component_type}")
            return result.data[0]

        except Exception as e:
            logger.error(f"Error creating component style: {str(e)}")
            raise

    async def get_component_styles(
        self,
        pack_id: str
    ) -> List[Dict[str, Any]]:
        """Get all component styles for a pack"""
        try:
            result = supabase.table("component_styles").select("*").eq(
                "pack_id", pack_id
            ).execute()

            return result.data or []

        except Exception as e:
            logger.error(f"Error getting component styles: {str(e)}")
            raise

    # ==================== STYLE COMPARISON ====================

    async def compare_style_packs(
        self,
        pack_id_1: str,
        pack_id_2: str
    ) -> Dict[str, Any]:
        """Compare two style packs to show differences"""
        try:
            pack1 = await self.get_style_pack("", pack_id_1)
            pack2 = await self.get_style_pack("", pack_id_2)

            differences = {
                "colors": self._compare_dicts(pack1.get("colors", {}), pack2.get("colors", {})),
                "typography": self._compare_dicts(pack1.get("typography", {}), pack2.get("typography", {})),
                "spacing": self._compare_dicts(pack1.get("spacing", {}), pack2.get("spacing", {})),
            }

            return {
                "pack_1": {"id": pack_id_1, "name": pack1.get("name")},
                "pack_2": {"id": pack_id_2, "name": pack2.get("name")},
                "differences": differences,
            }

        except Exception as e:
            logger.error(f"Error comparing packs: {str(e)}")
            raise

    @staticmethod
    def _compare_dicts(dict1: Dict, dict2: Dict) -> Dict[str, Any]:
        """Compare two dictionaries and return differences"""
        differences = {
            "added": {},
            "removed": {},
            "modified": {},
        }

        # Find modified and added
        for key, value in dict2.items():
            if key not in dict1:
                differences["added"][key] = value
            elif dict1[key] != value:
                differences["modified"][key] = {
                    "before": dict1[key],
                    "after": value,
                }

        # Find removed
        for key, value in dict1.items():
            if key not in dict2:
                differences["removed"][key] = value

        return differences

    # ==================== STYLE EXPORT ====================

    def generate_css_from_pack(
        self,
        pack: Dict[str, Any]
    ) -> str:
        """Generate CSS from a style pack"""
        lines = [":root {"]

        # Add color variables
        if "colors" in pack:
            for name, color in pack["colors"].items():
                lines.append(f"  --color-{name}: {color};")

        # Add typography
        if "typography" in pack:
            typo = pack["typography"]
            lines.append(f"  --font-heading: {typo.get('heading_font', 'sans-serif')};")
            lines.append(f"  --font-body: {typo.get('body_font', 'sans-serif')};")
            lines.append(f"  --size-heading: {typo.get('heading_size', 32)}px;")
            lines.append(f"  --size-body: {typo.get('body_size', 16)}px;")
            lines.append(f"  --line-height: {typo.get('line_height', 1.5)};")

        # Add spacing
        if "spacing" in pack:
            spacing = pack["spacing"]
            for name, value in spacing.items():
                lines.append(f"  --spacing-{name}: {value}px;")

        lines.append("}")

        # Add custom CSS if present
        if "custom_css" in pack and pack["custom_css"]:
            lines.append("")
            lines.append("/* Custom CSS */")
            lines.append(pack["custom_css"])

        return "\n".join(lines)

    # ==================== STYLE DUPLICATION ====================

    async def duplicate_style_pack(
        self,
        portfolio_id: str,
        pack_id: str,
        new_name: str
    ) -> Dict[str, Any]:
        """Duplicate a style pack with a new name"""
        try:
            original = await self.get_style_pack(portfolio_id, pack_id)

            new_pack = await self.create_style_pack(
                portfolio_id=portfolio_id,
                user_id=original["user_id"],
                name=new_name,
                description=f"Copy of {original.get('name')}",
                colors=original.get("colors", {}),
                typography=original.get("typography", {}),
                spacing=original.get("spacing", {}),
                custom_css=original.get("custom_css"),
            )

            logger.info(f"Duplicated style pack: {pack_id} -> {new_pack['id']}")
            return new_pack

        except Exception as e:
            logger.error(f"Error duplicating pack: {str(e)}")
            raise


# ==================== SINGLETON INSTANCE ====================

_style_pack_service = None

def get_style_pack_service() -> StylePackService:
    """Get or create style pack service singleton"""
    global _style_pack_service
    if _style_pack_service is None:
        _style_pack_service = StylePackService()
    return _style_pack_service
