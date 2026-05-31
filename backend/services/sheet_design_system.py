"""
Sheet Design System
Phase 8: Task 8.3 — Typography presets, grid spacing, color palettes,
template-specific schemes, exportable CSS / JSON design tokens.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# ENUMS
# ─────────────────────────────────────────────

class TypographyRole(str, Enum):
    DISPLAY   = "display"    # sheet title
    HEADING   = "heading"    # section heading
    SUBHEADING= "subheading" # sub-section
    BODY      = "body"       # main text block
    CAPTION   = "caption"    # image captions
    LABEL     = "label"      # callout labels
    METADATA  = "metadata"   # sheet number, scale bar


class PaletteScheme(str, Enum):
    MONOCHROME   = "monochrome"
    WARM_STUDIO  = "warm_studio"
    COOL_MINIMAL = "cool_minimal"
    EARTHY       = "earthy"
    BOLD_ACCENT  = "bold_accent"
    NIGHT_DARK   = "night_dark"


# ─────────────────────────────────────────────
# DATA CLASSES
# ─────────────────────────────────────────────

@dataclass
class TypePreset:
    role:        TypographyRole
    font_family: str
    font_size_pt: float          # points  (1 pt = 0.353 mm)
    font_weight:  str            # "300" | "400" | "600" | "700"
    line_height:  float          # multiplier
    letter_spacing_em: float
    text_transform: str          # "none" | "uppercase" | "lowercase"
    color_token:  str            # references palette token


@dataclass
class ColorToken:
    name:        str
    hex_value:   str
    cmyk:        tuple[int, int, int, int]  # for print
    usage:       str


@dataclass
class GridSpec:
    """Physical grid specification for a given page size."""
    page_size:     str   # "A1" | "A2" | "A3" | "A4"
    columns:       int
    rows:          int
    margin_top_mm: float
    margin_bottom_mm: float
    margin_left_mm: float
    margin_right_mm: float
    gutter_mm:     float
    bleed_mm:      float   # for print bleed


@dataclass
class DesignScheme:
    id:          str
    name:        str
    description: str
    palette:     dict[str, ColorToken]   # token_name -> ColorToken
    typography:  dict[str, TypePreset]   # role -> TypePreset
    grid_specs:  dict[str, GridSpec]     # page_size -> GridSpec
    css_vars:    dict[str, str] = field(default_factory=dict)  # computed on export


# ─────────────────────────────────────────────
# CONSTANTS — grid specs per page size
# ─────────────────────────────────────────────

GRID_SPECS: dict[tuple[str, int], GridSpec] = {
    # (page_size, columns) -> GridSpec
    ("A1", 12): GridSpec("A1", 12, 10, 25, 25, 25, 25, 4, 3),
    ("A1",  8): GridSpec("A1",  8,  8, 25, 25, 25, 25, 5, 3),
    ("A1",  5): GridSpec("A1",  5,  6, 25, 25, 25, 25, 6, 3),
    ("A2", 12): GridSpec("A2", 12, 10, 20, 20, 20, 20, 3, 3),
    ("A2",  8): GridSpec("A2",  8,  8, 20, 20, 20, 20, 4, 3),
    ("A2",  5): GridSpec("A2",  5,  6, 20, 20, 20, 20, 5, 3),
    ("A3", 12): GridSpec("A3", 12,  8, 15, 15, 15, 15, 3, 2),
    ("A3",  8): GridSpec("A3",  8,  6, 15, 15, 15, 15, 3, 2),
    ("A3",  5): GridSpec("A3",  5,  5, 15, 15, 15, 15, 4, 2),
    ("A4", 12): GridSpec("A4", 12,  8, 12, 12, 12, 12, 2, 2),
    ("A4",  8): GridSpec("A4",  8,  6, 12, 12, 12, 12, 2, 2),
    ("A4",  5): GridSpec("A4",  5,  5, 12, 12, 12, 12, 3, 2),
}


# ─────────────────────────────────────────────
# DESIGN SYSTEM SERVICE
# ─────────────────────────────────────────────

class SheetDesignSystem:
    """Generates and exports design tokens for presentation sheets."""

    def __init__(self) -> None:
        self._schemes: dict[str, DesignScheme] = {}
        self._build_all_schemes()
        logger.info("SheetDesignSystem: %d schemes loaded", len(self._schemes))

    # ── public API ────────────────────────────

    def list_schemes(self) -> list[dict]:
        return [
            {"id": s.id, "name": s.name, "description": s.description}
            for s in self._schemes.values()
        ]

    def get_scheme(self, scheme_id: str) -> DesignScheme | None:
        return self._schemes.get(scheme_id)

    def get_grid_spec(self, page_size: str, columns: int) -> GridSpec | None:
        return GRID_SPECS.get((page_size, columns))

    def export_css(self, scheme_id: str) -> str:
        """Export scheme as CSS custom properties (:root block)."""
        scheme = self._schemes.get(scheme_id)
        if not scheme:
            return ""

        lines = [":root {"]

        # Colours
        for name, tok in scheme.palette.items():
            lines.append(f"  --color-{name}: {tok.hex_value};")

        # Typography
        for role, preset in scheme.typography.items():
            r = role.replace("_", "-")
            lines.append(f"  --font-family-{r}: {preset.font_family};")
            lines.append(f"  --font-size-{r}: {preset.font_size_pt}pt;")
            lines.append(f"  --font-weight-{r}: {preset.font_weight};")
            lines.append(f"  --line-height-{r}: {preset.line_height};")
            lines.append(f"  --letter-spacing-{r}: {preset.letter_spacing_em}em;")

        lines.append("}")
        return "\n".join(lines)

    def export_json(self, scheme_id: str) -> dict:
        """Export scheme as JSON design tokens (W3C token format draft)."""
        scheme = self._schemes.get(scheme_id)
        if not scheme:
            return {}

        tokens: dict[str, Any] = {
            "color": {
                name: {
                    "$value": tok.hex_value,
                    "$type":  "color",
                    "cmyk":   list(tok.cmyk),
                    "usage":  tok.usage,
                }
                for name, tok in scheme.palette.items()
            },
            "typography": {
                role: {
                    "fontFamily":     {"$value": p.font_family,       "$type": "string"},
                    "fontSize":       {"$value": p.font_size_pt,      "$type": "number"},
                    "fontWeight":     {"$value": p.font_weight,       "$type": "string"},
                    "lineHeight":     {"$value": p.line_height,       "$type": "number"},
                    "letterSpacing":  {"$value": p.letter_spacing_em, "$type": "number"},
                    "textTransform":  {"$value": p.text_transform,    "$type": "string"},
                }
                for role, p in scheme.typography.items()
            },
            "grid": {
                f"{g.page_size}_{g.columns}col": {
                    "columns":     g.columns,
                    "rows":        g.rows,
                    "marginMm":    {
                        "top": g.margin_top_mm, "bottom": g.margin_bottom_mm,
                        "left": g.margin_left_mm, "right": g.margin_right_mm,
                    },
                    "gutterMm":    g.gutter_mm,
                    "bleedMm":     g.bleed_mm,
                }
                for (ps, cols), g in GRID_SPECS.items()
            },
        }
        return tokens

    # ── scheme builders ───────────────────────

    def _build_all_schemes(self) -> None:
        for factory in [
            self._build_monochrome,
            self._build_warm_studio,
            self._build_cool_minimal,
            self._build_earthy,
            self._build_bold_accent,
            self._build_night_dark,
        ]:
            scheme = factory()
            self._schemes[scheme.id] = scheme

    def _make_type_presets(
        self,
        font_family: str,
        heading_color: str = "ink",
        body_color: str = "ink",
    ) -> dict[str, TypePreset]:
        sizes = {
            TypographyRole.DISPLAY:    (36.0, "700", 1.1, 0.0,  "uppercase"),
            TypographyRole.HEADING:    (18.0, "700", 1.2, 0.02, "uppercase"),
            TypographyRole.SUBHEADING: (13.0, "600", 1.3, 0.01, "none"),
            TypographyRole.BODY:       (10.0, "400", 1.5, 0.0,  "none"),
            TypographyRole.CAPTION:    ( 8.0, "400", 1.4, 0.01, "none"),
            TypographyRole.LABEL:      ( 7.0, "600", 1.2, 0.08, "uppercase"),
            TypographyRole.METADATA:   ( 7.0, "400", 1.2, 0.02, "none"),
        }
        result = {}
        for role, (size, weight, lh, ls, tt) in sizes.items():
            color = heading_color if role in (
                TypographyRole.DISPLAY, TypographyRole.HEADING
            ) else body_color
            result[role.value] = TypePreset(
                role=role,
                font_family=font_family,
                font_size_pt=size,
                font_weight=weight,
                line_height=lh,
                letter_spacing_em=ls,
                text_transform=tt,
                color_token=color,
            )
        return result

    # ── 6 Colour Schemes ─────────────────────

    def _build_monochrome(self) -> DesignScheme:
        palette = {
            "ink":          ColorToken("ink",          "#0D0D0D", (0,0,0,95),   "primary text"),
            "graphite":     ColorToken("graphite",     "#4A4A4A", (0,0,0,71),   "secondary text"),
            "stone":        ColorToken("stone",        "#9E9E9E", (0,0,0,38),   "captions"),
            "paper":        ColorToken("paper",        "#F7F5F2", (0,0,1,3),    "background"),
            "rule":         ColorToken("rule",         "#D6D3CE", (0,0,3,16),   "dividers"),
        }
        return DesignScheme(
            id="monochrome",
            name="Monochrome",
            description="Classic black-on-white — suitable for all academic submissions",
            palette=palette,
            typography=self._make_type_presets("'Times New Roman', Georgia, serif"),
            grid_specs={},
        )

    def _build_warm_studio(self) -> DesignScheme:
        palette = {
            "ink":      ColorToken("ink",      "#1A1209", (0,6,42,90), "primary text"),
            "warm_mid": ColorToken("warm_mid", "#7C6B55", (0,14,31,51),"secondary"),
            "warm_lt":  ColorToken("warm_lt",  "#C8B99A", (0,7,23,22), "captions"),
            "cream":    ColorToken("cream",    "#F5EFE2", (0,1,8,4),   "background"),
            "rule":     ColorToken("rule",     "#D9CEBC", (0,4,13,15), "dividers"),
            "accent":   ColorToken("accent",   "#8B4513", (0,51,85,45),"accent"),
        }
        return DesignScheme(
            id="warm_studio",
            name="Warm Studio",
            description="Warm cream tones — ideal for hand-drawing inspired boards",
            palette=palette,
            typography=self._make_type_presets(
                "'Playfair Display', Georgia, serif", "ink", "ink"
            ),
            grid_specs={},
        )

    def _build_cool_minimal(self) -> DesignScheme:
        palette = {
            "ink":     ColorToken("ink",     "#0F1923", (0,8,0,90),  "primary text"),
            "slate":   ColorToken("slate",   "#4E6070", (18,1,0,56), "secondary"),
            "mist":    ColorToken("mist",    "#A3B4C0", (14,5,0,25), "captions"),
            "white":   ColorToken("white",   "#FFFFFF", (0,0,0,0),   "background"),
            "rule":    ColorToken("rule",    "#D9E0E6", (5,2,0,10),  "dividers"),
            "accent":  ColorToken("accent",  "#1E88E5", (87,39,0,10),"accent"),
        }
        return DesignScheme(
            id="cool_minimal",
            name="Cool Minimal",
            description="Crisp white with cool-grey typography — competition and thesis favourite",
            palette=palette,
            typography=self._make_type_presets(
                "'Inter', 'Helvetica Neue', Arial, sans-serif", "ink", "slate"
            ),
            grid_specs={},
        )

    def _build_earthy(self) -> DesignScheme:
        palette = {
            "ink":      ColorToken("ink",      "#1C1209", (0,10,50,89),"primary text"),
            "soil":     ColorToken("soil",     "#5C4033", (0,31,43,64),"secondary"),
            "clay":     ColorToken("clay",     "#A07850", (0,25,50,37),"captions"),
            "sand":     ColorToken("sand",     "#F0E6D3", (0,4,13,6),  "background"),
            "rule":     ColorToken("rule",     "#D9C9B0", (0,7,19,15), "dividers"),
            "moss":     ColorToken("moss",     "#4A6741", (29,0,39,60),"accent"),
        }
        return DesignScheme(
            id="earthy",
            name="Earthy Landscape",
            description="Natural earth tones — perfect for landscape and environmental projects",
            palette=palette,
            typography=self._make_type_presets(
                "'Libre Baskerville', Georgia, serif", "ink", "soil"
            ),
            grid_specs={},
        )

    def _build_bold_accent(self) -> DesignScheme:
        palette = {
            "ink":     ColorToken("ink",     "#111111", (0,0,0,93),  "primary text"),
            "grey":    ColorToken("grey",    "#555555", (0,0,0,67),  "secondary"),
            "lt_grey": ColorToken("lt_grey", "#BBBBBB", (0,0,0,27),  "captions"),
            "white":   ColorToken("white",   "#FFFFFF", (0,0,0,0),   "background"),
            "rule":    ColorToken("rule",    "#E0E0E0", (0,0,0,12),  "dividers"),
            "red":     ColorToken("red",     "#E53935", (0,75,76,10),"accent — competition"),
        }
        return DesignScheme(
            id="bold_accent",
            name="Bold Accent",
            description="High-contrast with a single vivid accent — competition boards",
            palette=palette,
            typography=self._make_type_presets(
                "'DM Sans', 'Arial', sans-serif", "ink", "grey"
            ),
            grid_specs={},
        )

    def _build_night_dark(self) -> DesignScheme:
        palette = {
            "ink":     ColorToken("ink",     "#E8EAF0", (10,7,0,6),  "primary text on dark"),
            "silver":  ColorToken("silver",  "#9AA0AD", (14,8,0,32), "secondary"),
            "dim":     ColorToken("dim",     "#5C6270", (8,3,0,61),  "captions"),
            "night":   ColorToken("night",   "#0D1117", (0,0,0,93),  "background"),
            "rule":    ColorToken("rule",    "#21262D", (0,0,0,83),  "dividers"),
            "gold":    ColorToken("gold",    "#F0B429", (0,25,83,6), "accent"),
        }
        return DesignScheme(
            id="night_dark",
            name="Night Studio",
            description="Dark background with gold accent — dramatic render presentations",
            palette=palette,
            typography=self._make_type_presets(
                "'Space Grotesk', 'Helvetica Neue', sans-serif", "ink", "silver"
            ),
            grid_specs={},
        )


# ─────────────────────────────────────────────
# SINGLETON
# ─────────────────────────────────────────────

_design_system: SheetDesignSystem | None = None


def get_sheet_design_system() -> SheetDesignSystem:
    global _design_system
    if _design_system is None:
        _design_system = SheetDesignSystem()
    return _design_system
