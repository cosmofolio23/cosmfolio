"""
Design system service
Phase 3: Task 3.1 - Design tokens, color management, validation
"""

import logging
from typing import Dict, Any, Optional, List, Tuple
from colorsys import rgb_to_hsv, hsv_to_rgb
import re
from uuid import uuid4
from datetime import datetime

logger = logging.getLogger(__name__)

# ==================== COLOR UTILITIES ====================

class ColorUtils:
    """Utilities for color manipulation and validation"""

    @staticmethod
    def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
        """Convert hex color to RGB tuple"""
        hex_color = hex_color.lstrip("#")
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

    @staticmethod
    def rgb_to_hex(rgb: Tuple[int, int, int]) -> str:
        """Convert RGB tuple to hex color"""
        return "#{:02x}{:02x}{:02x}".format(rgb[0], rgb[1], rgb[2])

    @staticmethod
    def hex_to_hsl(hex_color: str) -> Tuple[int, int, int]:
        """Convert hex to HSL"""
        r, g, b = ColorUtils.hex_to_rgb(hex_color)
        r, g, b = r / 255.0, g / 255.0, b / 255.0

        max_val = max(r, g, b)
        min_val = min(r, g, b)
        l = (max_val + min_val) / 2.0

        if max_val == min_val:
            h = s = 0.0
        else:
            d = max_val - min_val
            s = d / (2.0 - max_val - min_val) if l > 0.5 else d / (max_val + min_val)

            if max_val == r:
                h = (g - b) / d + (6.0 if g < b else 0.0)
            elif max_val == g:
                h = (b - r) / d + 2.0
            else:
                h = (r - g) / d + 4.0
            h /= 6.0

        return int(h * 360), int(s * 100), int(l * 100)

    @staticmethod
    def get_contrast_ratio(hex1: str, hex2: str) -> float:
        """Calculate contrast ratio between two colors (WCAG)"""
        def luminance(hex_color):
            r, g, b = ColorUtils.hex_to_rgb(hex_color)
            r, g, b = r / 255.0, g / 255.0, b / 255.0

            r = r / 12.92 if r <= 0.03928 else ((r + 0.055) / 1.055) ** 2.4
            g = g / 12.92 if g <= 0.03928 else ((g + 0.055) / 1.055) ** 2.4
            b = b / 12.92 if b <= 0.03928 else ((b + 0.055) / 1.055) ** 2.4

            return 0.2126 * r + 0.7152 * g + 0.0722 * b

        l1 = luminance(hex1)
        l2 = luminance(hex2)

        lighter = max(l1, l2)
        darker = min(l1, l2)

        return (lighter + 0.05) / (darker + 0.05)

    @staticmethod
    def is_valid_hex(hex_color: str) -> bool:
        """Validate hex color format"""
        pattern = r"^#[0-9a-fA-F]{6}$"
        return bool(re.match(pattern, hex_color))

    @staticmethod
    def generate_color_variants(base_color: str, count: int = 5) -> List[str]:
        """Generate color variants (lighter and darker shades)"""
        if not ColorUtils.is_valid_hex(base_color):
            raise ValueError("Invalid hex color")

        h, s, l = ColorUtils.hex_to_hsl(base_color)
        variants = []

        # Generate lighter shades
        for i in range(1, count // 2 + 1):
            new_l = min(100, l + (i * 10))
            r, g, b = hsv_to_rgb(h / 360, s / 100, new_l / 100)
            hex_variant = ColorUtils.rgb_to_hex((int(r * 255), int(g * 255), int(b * 255)))
            variants.append(hex_variant)

        variants.append(base_color)

        # Generate darker shades
        for i in range(1, count // 2 + 1):
            new_l = max(0, l - (i * 10))
            r, g, b = hsv_to_rgb(h / 360, s / 100, new_l / 100)
            hex_variant = ColorUtils.rgb_to_hex((int(r * 255), int(g * 255), int(b * 255)))
            variants.append(hex_variant)

        return variants[:count]

    @staticmethod
    def check_wcag_compliance(text_color: str, background_color: str, level: str = "AA") -> bool:
        """Check WCAG color contrast compliance"""
        ratio = ColorUtils.get_contrast_ratio(text_color, background_color)

        if level == "AAA":
            return ratio >= 7.0
        else:  # AA
            return ratio >= 4.5


# ==================== DESIGN TOKEN SERVICE ====================

class DesignToken:
    """Represents a design token"""

    def __init__(self, name: str, category: str, value: str, description: Optional[str] = None):
        self.id = str(uuid4())
        self.name = name
        self.category = category
        self.value = value
        self.description = description
        self.created_at = datetime.utcnow().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "value": self.value,
            "description": self.description,
            "created_at": self.created_at,
        }


class DesignSystemService:
    """Manage design systems and tokens"""

    def __init__(self):
        """Initialize design system service"""
        self.tokens: Dict[str, DesignToken] = {}
        self.color_utils = ColorUtils()

    # ==================== TOKEN MANAGEMENT ====================

    def create_token(
        self,
        name: str,
        category: str,
        value: str,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a design token"""
        try:
            token = DesignToken(name, category, value, description)
            self.tokens[token.id] = token

            logger.info(f"Created design token: {name}")
            return token.to_dict()

        except Exception as e:
            logger.error(f"Error creating token: {str(e)}")
            raise

    def get_token(self, token_id: str) -> Optional[Dict[str, Any]]:
        """Get token by ID"""
        token = self.tokens.get(token_id)
        return token.to_dict() if token else None

    def list_tokens(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all tokens, optionally filtered by category"""
        tokens = self.tokens.values()
        if category:
            tokens = [t for t in tokens if t.category == category]
        return [t.to_dict() for t in tokens]

    def update_token(self, token_id: str, **kwargs) -> Dict[str, Any]:
        """Update token properties"""
        if token_id not in self.tokens:
            raise ValueError(f"Token not found: {token_id}")

        token = self.tokens[token_id]
        for key, value in kwargs.items():
            if hasattr(token, key):
                setattr(token, key, value)

        logger.info(f"Updated token: {token.name}")
        return token.to_dict()

    def delete_token(self, token_id: str) -> bool:
        """Delete a token"""
        if token_id in self.tokens:
            del self.tokens[token_id]
            logger.info(f"Deleted token: {token_id}")
            return True
        return False

    # ==================== COLOR MANAGEMENT ====================

    def validate_color_palette(
        self,
        colors: Dict[str, str]
    ) -> Dict[str, Any]:
        """
        Validate color palette for accessibility and harmony

        Returns: {valid, issues, warnings, recommendations}
        """
        issues = []
        warnings = []
        recommendations = []

        for name, color in colors.items():
            # Check hex format
            if not ColorUtils.is_valid_hex(color):
                issues.append(f"{name}: Invalid hex format")
                continue

        # Check contrast ratios
        if "text_color" in colors and "background_color" in colors:
            ratio = ColorUtils.get_contrast_ratio(
                colors["text_color"],
                colors["background_color"]
            )

            if ratio < 4.5:
                issues.append(
                    f"Text/background contrast ratio ({ratio:.2f}) below WCAG AA minimum (4.5)"
                )
            elif ratio < 7.0:
                warnings.append(
                    f"Text/background contrast ratio ({ratio:.2f}) below WCAG AAA (7.0)"
                )

        # Check for color uniqueness
        color_values = list(colors.values())
        if len(color_values) != len(set(color_values)):
            warnings.append("Some colors are identical")

        # Recommendations
        if not issues and not warnings:
            recommendations.append("Color palette looks good!")

        if warnings:
            recommendations.append("Consider improving contrast ratios for AAA compliance")

        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "warnings": warnings,
            "recommendations": recommendations,
        }

    def generate_color_palette(
        self,
        base_color: str,
        include_variants: bool = True
    ) -> Dict[str, Any]:
        """
        Generate a complete color palette from a base color

        Returns: {primary, secondary, variants, neutrals}
        """
        if not ColorUtils.is_valid_hex(base_color):
            raise ValueError("Invalid base color format")

        try:
            variants = ColorUtils.generate_color_variants(base_color, count=5)

            return {
                "primary": base_color,
                "variants": variants if include_variants else [base_color],
                "lightness_scale": [
                    {"name": "50", "color": variants[0]},
                    {"name": "100", "color": variants[1]},
                    {"name": "500", "color": base_color},
                    {"name": "900", "color": variants[-1]},
                ],
            }

        except Exception as e:
            logger.error(f"Error generating palette: {str(e)}")
            raise

    def suggest_accent_color(
        self,
        primary: str,
        secondary: str
    ) -> str:
        """
        Suggest an accent color that complements primary and secondary

        Returns: hex color
        """
        # Simple algorithm: use complementary color of primary
        if not ColorUtils.is_valid_hex(primary):
            raise ValueError("Invalid primary color")

        h, s, l = ColorUtils.hex_to_hsl(primary)

        # Complementary hue (opposite on color wheel)
        comp_h = (h + 180) % 360

        # Reduce saturation for subtlety, adjust lightness for visibility
        comp_s = max(30, s - 20)
        comp_l = max(40, min(60, l + 10))

        r, g, b = hsv_to_rgb(comp_h / 360, comp_s / 100, comp_l / 100)
        return ColorUtils.rgb_to_hex((int(r * 255), int(g * 255), int(b * 255)))

    # ==================== TYPOGRAPHY VALIDATION ====================

    def validate_typography(
        self,
        typography: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Validate typography configuration

        Returns: {valid, issues, warnings}
        """
        issues = []
        warnings = []

        # Check font sizes
        if "heading_size" in typography and "body_size" in typography:
            if typography["heading_size"] <= typography["body_size"]:
                issues.append("Heading size must be larger than body size")

        # Check weights
        for key in ["heading_weight", "body_weight"]:
            if key in typography:
                weight = typography[key]
                if weight < 300 or weight > 900 or weight % 100 != 0:
                    issues.append(f"{key}: Invalid font weight {weight}")

        # Check line height
        if "line_height" in typography:
            lh = typography["line_height"]
            if lh < 1.0 or lh > 2.0:
                warnings.append("Line height should be between 1.0 and 2.0 for readability")

        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "warnings": warnings,
        }

    # ==================== SPACING VALIDATION ====================

    def validate_spacing(
        self,
        spacing: Dict[str, int]
    ) -> Dict[str, Any]:
        """
        Validate spacing configuration (scale)

        Returns: {valid, issues, scale_ratio}
        """
        issues = []
        values = list(spacing.values())

        # Check values are increasing
        for i in range(len(values) - 1):
            if values[i] >= values[i + 1]:
                issues.append("Spacing scale must be increasing")
                break

        # Calculate scale ratios
        ratios = []
        for i in range(len(values) - 1):
            if values[i] > 0:
                ratio = values[i + 1] / values[i]
                ratios.append(ratio)

        avg_ratio = sum(ratios) / len(ratios) if ratios else 0

        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "scale_ratio": round(avg_ratio, 2),
            "consistency": "good" if 1.4 <= avg_ratio <= 1.6 else "warning",
        }

    # ==================== DESIGN SYSTEM ANALYSIS ====================

    def analyze_design_system(
        self,
        colors: Dict[str, str],
        typography: Dict[str, Any],
        spacing: Dict[str, int]
    ) -> Dict[str, Any]:
        """
        Comprehensive analysis of design system

        Returns: {color_analysis, typography_analysis, spacing_analysis, overall_score}
        """
        color_analysis = self.validate_color_palette(colors)
        typography_analysis = self.validate_typography(typography)
        spacing_analysis = self.validate_spacing(spacing)

        # Calculate overall score
        score = 100
        if color_analysis.get("issues"):
            score -= len(color_analysis["issues"]) * 15
        if color_analysis.get("warnings"):
            score -= len(color_analysis["warnings"]) * 5
        if typography_analysis.get("issues"):
            score -= len(typography_analysis["issues"]) * 15
        if spacing_analysis.get("issues"):
            score -= len(spacing_analysis["issues"]) * 10

        score = max(0, min(100, score))

        return {
            "color_analysis": color_analysis,
            "typography_analysis": typography_analysis,
            "spacing_analysis": spacing_analysis,
            "overall_score": score,
            "grade": self._score_to_grade(score),
        }

    @staticmethod
    def _score_to_grade(score: int) -> str:
        """Convert score to letter grade"""
        if score >= 90:
            return "A"
        elif score >= 80:
            return "B"
        elif score >= 70:
            return "C"
        elif score >= 60:
            return "D"
        else:
            return "F"

    # ==================== EXPORT UTILITIES ====================

    def export_as_css_variables(
        self,
        colors: Dict[str, str],
        typography: Dict[str, Any],
        spacing: Dict[str, int]
    ) -> str:
        """Export design system as CSS variables"""
        css_lines = [":root {"]

        # Color variables
        for name, color in colors.items():
            css_name = "--color-" + name.replace("_", "-")
            css_lines.append(f"  {css_name}: {color};")

        # Typography variables
        for name, value in typography.items():
            css_name = "--" + name.replace("_", "-")
            if isinstance(value, str):
                css_lines.append(f"  {css_name}: {value};")
            else:
                css_lines.append(f"  {css_name}: {value};")

        # Spacing variables
        for name, value in spacing.items():
            css_name = "--spacing-" + name
            css_lines.append(f"  {css_name}: {value}px;")

        css_lines.append("}")
        return "\n".join(css_lines)

    def export_as_json(
        self,
        colors: Dict[str, str],
        typography: Dict[str, Any],
        spacing: Dict[str, int]
    ) -> Dict[str, Any]:
        """Export design system as JSON"""
        return {
            "colors": colors,
            "typography": typography,
            "spacing": spacing,
            "exported_at": datetime.utcnow().isoformat(),
        }


# ==================== SINGLETON INSTANCE ====================

_design_system_service = None

def get_design_system_service() -> DesignSystemService:
    """Get or create design system service singleton"""
    global _design_system_service
    if _design_system_service is None:
        _design_system_service = DesignSystemService()
    return _design_system_service
