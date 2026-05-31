"""
Sheet Template System
Phase 8: Task 8.1 — 20+ presentation sheet templates with editable grid system.
Supports A1/A2/A3/A4, 5/8/12-column layouts, and design-development series.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# ENUMS
# ──────────────────────────────────────────────

class PageSize(str, Enum):
    A1 = "A1"          # 841 × 1189 mm
    A2 = "A2"          # 594 × 841 mm
    A3 = "A3"          # 420 × 594 mm
    A4 = "A4"          # 210 × 297 mm
    CUSTOM = "custom"


class PageOrientation(str, Enum):
    PORTRAIT  = "portrait"
    LANDSCAPE = "landscape"


class GridColumns(int, Enum):
    FIVE   = 5
    EIGHT  = 8
    TWELVE = 12


class TemplateCategory(str, Enum):
    TITLE          = "title"
    DRAWING        = "drawing"
    SITE_ANALYSIS  = "site_analysis"
    DESIGN_DEV     = "design_development"
    MATERIAL       = "material_detail"
    RENDERS        = "renders"
    COMPETITION    = "competition"
    THESIS         = "thesis"


class ElementType(str, Enum):
    IMAGE       = "image"
    TEXT        = "text"
    TITLE       = "title"
    CAPTION     = "caption"
    LABEL       = "label"
    DIVIDER     = "divider"
    NORTH_ARROW = "north_arrow"
    SCALE_BAR   = "scale_bar"
    PAGE_NUMBER = "page_number"
    LOGO        = "logo"
    GRID_CELL   = "grid_cell"
    PLACEHOLDER = "placeholder"


# ──────────────────────────────────────────────
# PAGE SIZE DIMENSIONS (mm)
# ──────────────────────────────────────────────

PAGE_DIMENSIONS: dict[str, tuple[float, float]] = {
    "A1": (841.0, 1189.0),
    "A2": (594.0, 841.0),
    "A3": (420.0, 594.0),
    "A4": (210.0, 297.0),
}

# Standard margins (mm)
MARGINS = {
    "A1": {"top": 25, "bottom": 25, "left": 25, "right": 25},
    "A2": {"top": 20, "bottom": 20, "left": 20, "right": 20},
    "A3": {"top": 15, "bottom": 15, "left": 15, "right": 15},
    "A4": {"top": 12, "bottom": 12, "left": 12, "right": 12},
}


# ──────────────────────────────────────────────
# DATA CLASSES
# ──────────────────────────────────────────────

@dataclass
class GridCell:
    """A single cell in the template grid."""
    col_start: int          # 1-based
    col_span:  int
    row_start: int          # 1-based
    row_span:  int
    element_type: ElementType
    label:       str  = ""
    placeholder: str  = ""
    aspect_ratio: float | None = None   # w/h; None = fill cell
    style:        dict[str, Any] = field(default_factory=dict)


@dataclass
class SheetTemplate:
    """Complete definition of a presentation sheet template."""
    id:          str
    name:        str
    category:    TemplateCategory
    description: str

    # Layout
    page_size:    PageSize
    orientation:  PageOrientation
    grid_columns: GridColumns
    grid_rows:    int
    cells:        list[GridCell] = field(default_factory=list)

    # Metadata
    tags:           list[str] = field(default_factory=list)
    year_level:     str  = ""          # "Year 3", "Year 4", "Year 5"
    use_case:       str  = ""
    thumbnail_hint: str  = ""          # SVG path hint for UI preview

    def to_dict(self) -> dict[str, Any]:
        return {
            "id":          self.id,
            "name":        self.name,
            "category":    self.category.value,
            "description": self.description,
            "page_size":   self.page_size.value,
            "orientation": self.orientation.value,
            "grid_columns": self.grid_columns.value,
            "grid_rows":   self.grid_rows,
            "cells": [
                {
                    "col_start":    c.col_start,
                    "col_span":     c.col_span,
                    "row_start":    c.row_start,
                    "row_span":     c.row_span,
                    "element_type": c.element_type.value,
                    "label":        c.label,
                    "placeholder":  c.placeholder,
                    "aspect_ratio": c.aspect_ratio,
                    "style":        c.style,
                }
                for c in self.cells
            ],
            "tags":       self.tags,
            "year_level": self.year_level,
            "use_case":   self.use_case,
        }


# ──────────────────────────────────────────────
# TEMPLATE REGISTRY
# ──────────────────────────────────────────────

class SheetTemplateRegistry:
    """Registers and serves all 20+ built-in sheet templates."""

    def __init__(self) -> None:
        self._templates: dict[str, SheetTemplate] = {}
        self._register_all()
        logger.info("SheetTemplateRegistry: %d templates loaded", len(self._templates))

    # ── public API ────────────────────────────

    def get(self, template_id: str) -> SheetTemplate | None:
        return self._templates.get(template_id)

    def list_all(self) -> list[dict]:
        return [t.to_dict() for t in self._templates.values()]

    def list_by_category(self, category: str) -> list[dict]:
        return [
            t.to_dict()
            for t in self._templates.values()
            if t.category.value == category
        ]

    def list_categories(self) -> list[str]:
        return sorted({t.category.value for t in self._templates.values()})

    def list_by_year(self, year: str) -> list[dict]:
        return [
            t.to_dict()
            for t in self._templates.values()
            if t.year_level == year
        ]

    def get_grid_config(self, template_id: str, page_size: str = "A2") -> dict:
        """Return pixel/mm grid config for the editor."""
        tmpl = self.get(template_id)
        if not tmpl:
            return {}
        w, h = PAGE_DIMENSIONS.get(page_size, PAGE_DIMENSIONS["A2"])
        margins = MARGINS.get(page_size, MARGINS["A2"])
        usable_w = w - margins["left"] - margins["right"]
        usable_h = h - margins["top"]  - margins["bottom"]
        col_w = usable_w / tmpl.grid_columns.value
        row_h = usable_h / tmpl.grid_rows
        return {
            "page_size":    page_size,
            "page_w_mm":    w,
            "page_h_mm":    h,
            "margins_mm":   margins,
            "usable_w_mm":  usable_w,
            "usable_h_mm":  usable_h,
            "grid_columns": tmpl.grid_columns.value,
            "grid_rows":    tmpl.grid_rows,
            "col_w_mm":     col_w,
            "row_h_mm":     row_h,
        }

    # ── registration helpers ───────────────────

    def _register(self, t: SheetTemplate) -> None:
        self._templates[t.id] = t

    def _register_all(self) -> None:
        self._register_title_templates()
        self._register_drawing_templates()
        self._register_site_analysis_templates()
        self._register_design_dev_templates()
        self._register_material_templates()
        self._register_render_templates()
        self._register_competition_templates()
        self._register_thesis_templates()

    # ── TITLE SHEETS (2 templates) ────────────

    def _register_title_templates(self) -> None:

        self._register(SheetTemplate(
            id="title_bold",
            name="Bold Title Sheet",
            category=TemplateCategory.TITLE,
            description="Full-bleed hero image with large project title overlay",
            page_size=PageSize.A2,
            orientation=PageOrientation.LANDSCAPE,
            grid_columns=GridColumns.TWELVE,
            grid_rows=8,
            tags=["title", "hero", "year3", "year4", "year5"],
            year_level="Any",
            use_case="First sheet of every project submission",
            cells=[
                GridCell(1, 12, 1, 8, ElementType.IMAGE,
                         "Hero Image", "Full-bleed render or site photo",
                         aspect_ratio=16/9),
                GridCell(1, 12, 7, 1, ElementType.TITLE,
                         "Project Title", "PROJECT TITLE",
                         style={"font_size": 72, "font_weight": "bold",
                                "color": "#ffffff", "overlay": True}),
                GridCell(1,  6, 8, 1, ElementType.TEXT,
                         "Subtitle / Course", "Year 3 · Studio A · 2026",
                         style={"font_size": 18, "color": "#ffffff",
                                "overlay": True}),
                GridCell(7,  6, 8, 1, ElementType.TEXT,
                         "Student Name", "Student Name · ID",
                         style={"font_size": 18, "text_align": "right",
                                "color": "#ffffff", "overlay": True}),
            ],
        ))

        self._register(SheetTemplate(
            id="title_minimal",
            name="Minimal Title Sheet",
            category=TemplateCategory.TITLE,
            description="White background, large typography with small accent image",
            page_size=PageSize.A2,
            orientation=PageOrientation.LANDSCAPE,
            grid_columns=GridColumns.TWELVE,
            grid_rows=8,
            tags=["title", "minimal", "clean"],
            year_level="Any",
            use_case="Academic / competition submissions",
            cells=[
                GridCell(1, 7, 1, 8, ElementType.TEXT,
                         "Project Title Block",
                         "PROJECT TITLE\nSubtitle or thesis statement here",
                         style={"font_size": 60, "font_weight": "bold",
                                "padding": 40}),
                GridCell(8, 5, 1, 6, ElementType.IMAGE,
                         "Feature Image", "Key render or concept diagram",
                         aspect_ratio=4/3),
                GridCell(8, 5, 7, 1, ElementType.CAPTION,
                         "Course / Year", "Year 4 · Design Studio",
                         style={"font_size": 14}),
                GridCell(1, 7, 8, 1, ElementType.DIVIDER, label="Bottom rule"),
            ],
        ))

    # ── DRAWING SHEETS (4 templates) ──────────

    def _register_drawing_templates(self) -> None:

        self._register(SheetTemplate(
            id="plan_section_render",
            name="Plan + Section + Render",
            category=TemplateCategory.DRAWING,
            description="Classic three-panel: floor plan (left), section (centre), 3D render (right)",
            page_size=PageSize.A1,
            orientation=PageOrientation.LANDSCAPE,
            grid_columns=GridColumns.TWELVE,
            grid_rows=10,
            tags=["plan", "section", "render", "year3", "year4"],
            year_level="Year 3–4",
            use_case="Primary project drawings sheet",
            cells=[
                GridCell(1, 4, 1, 8, ElementType.IMAGE,
                         "Floor Plan", "1:100 or 1:200 floor plan",
                         aspect_ratio=1.0),
                GridCell(5, 4, 1, 8, ElementType.IMAGE,
                         "Section", "Longitudinal or cross section",
                         aspect_ratio=2.5),
                GridCell(9, 4, 1, 8, ElementType.IMAGE,
                         "3D Render / Axonometric", "Perspective or exploded axo",
                         aspect_ratio=1.0),
                GridCell(1, 4, 9, 1, ElementType.CAPTION,
                         "Plan Caption", "Ground Floor Plan  1:100",
                         style={"text_align": "center"}),
                GridCell(5, 4, 9, 1, ElementType.CAPTION,
                         "Section Caption", "Section A–A  1:100",
                         style={"text_align": "center"}),
                GridCell(9, 4, 9, 1, ElementType.CAPTION,
                         "Render Caption", "South Perspective",
                         style={"text_align": "center"}),
                GridCell(1, 12, 10, 1, ElementType.TEXT,
                         "Sheet Info Bar",
                         "Project Title · Drawing No. 02 · Scale 1:100",
                         style={"font_size": 11, "border_top": True}),
            ],
        ))

        self._register(SheetTemplate(
            id="multi_plans",
            name="Multi-Level Plans",
            category=TemplateCategory.DRAWING,
            description="Four floor plans on one sheet (basement → roof)",
            page_size=PageSize.A1,
            orientation=PageOrientation.LANDSCAPE,
            grid_columns=GridColumns.TWELVE,
            grid_rows=10,
            tags=["plans", "multi-floor", "year4", "year5"],
            year_level="Year 4–5",
            use_case="Multi-storey project plan documentation",
            cells=[
                *[GridCell(c, 3, 1, 8, ElementType.IMAGE,
                           f"Level {i+1} Plan", f"Level {i+1}  1:200")
                  for i, c in enumerate([1, 4, 7, 10])],
                *[GridCell(c, 3, 9, 1, ElementType.CAPTION,
                           f"Level {i+1} Label", f"Level {i+1} Floor Plan  1:200",
                           style={"text_align": "center"})
                  for i, c in enumerate([1, 4, 7, 10])],
                GridCell(1, 12, 10, 1, ElementType.TEXT,
                         "Sheet Info", "Project Title · Sheet 03",
                         style={"font_size": 11, "border_top": True}),
            ],
        ))

        self._register(SheetTemplate(
            id="sections_elevations",
            name="Sections & Elevations",
            category=TemplateCategory.DRAWING,
            description="Two sections (top) + two elevations (bottom)",
            page_size=PageSize.A1,
            orientation=PageOrientation.LANDSCAPE,
            grid_columns=GridColumns.TWELVE,
            grid_rows=10,
            tags=["sections", "elevations", "year3", "year4"],
            year_level="Year 3–4",
            use_case="Technical drawing submission",
            cells=[
                GridCell(1, 6, 1, 5, ElementType.IMAGE,
                         "Section A–A", "Primary longitudinal section"),
                GridCell(7, 6, 1, 5, ElementType.IMAGE,
                         "Section B–B", "Cross section"),
                GridCell(1, 6, 6, 4, ElementType.IMAGE,
                         "North Elevation", "North facade elevation"),
                GridCell(7, 6, 6, 4, ElementType.IMAGE,
                         "South Elevation", "South facade elevation"),
                GridCell(1,  6, 10, 1, ElementType.CAPTION, "Section A–A",
                         "Section A–A  1:100", style={"text_align": "center"}),
                GridCell(7,  6, 10, 1, ElementType.CAPTION, "Section B–B",
                         "Section B–B  1:100", style={"text_align": "center"}),
            ],
        ))

        self._register(SheetTemplate(
            id="detail_drawings",
            name="Construction Detail Sheet",
            category=TemplateCategory.DRAWING,
            description="Six construction details arranged in 2×3 grid",
            page_size=PageSize.A2,
            orientation=PageOrientation.PORTRAIT,
            grid_columns=GridColumns.EIGHT,
            grid_rows=12,
            tags=["details", "construction", "year4", "year5"],
            year_level="Year 4–5",
            use_case="Building technology & construction documentation",
            cells=[
                *[GridCell(col, 4, row, 4, ElementType.IMAGE,
                           f"Detail {i+1}", f"Detail {i+1}  1:10",
                           aspect_ratio=1.0)
                  for i, (col, row) in enumerate(
                      [(1,1),(5,1),(1,5),(5,5),(1,9),(5,9)])],
                *[GridCell(col, 4, row+4, 1, ElementType.CAPTION,
                           f"Detail {i+1} Caption",
                           f"Detail {i+1} — Component name  1:10",
                           style={"text_align": "center"})
                  for i, (col, row) in enumerate(
                      [(1,0),(5,0),(1,4),(5,4),(1,8),(5,8)])],
            ],
        ))

    # ── SITE ANALYSIS (3 templates) ───────────

    def _register_site_analysis_templates(self) -> None:

        self._register(SheetTemplate(
            id="site_overview",
            name="Site Overview Board",
            category=TemplateCategory.SITE_ANALYSIS,
            description="Site plan (large, centre), surrounded by analysis maps",
            page_size=PageSize.A1,
            orientation=PageOrientation.LANDSCAPE,
            grid_columns=GridColumns.TWELVE,
            grid_rows=8,
            tags=["site", "analysis", "year3", "year4"],
            year_level="Year 3–4",
            use_case="Site analysis and context study",
            cells=[
                GridCell(3, 8, 1, 8, ElementType.IMAGE,
                         "Site Plan", "Aerial site plan — north oriented",
                         aspect_ratio=1.0),
                GridCell(1, 2, 1, 4, ElementType.IMAGE,
                         "Location Map", "National / city location"),
                GridCell(1, 2, 5, 4, ElementType.IMAGE,
                         "Figure-Ground", "Figure-ground diagram"),
                GridCell(11, 2, 1, 4, ElementType.IMAGE,
                         "Topography", "Contour / topographic map"),
                GridCell(11, 2, 5, 4, ElementType.IMAGE,
                         "Sun Path", "Solar analysis diagram"),
                GridCell(3,  8, 8, 1, ElementType.TEXT,
                         "Site Description",
                         "Brief site context description — 50 words",
                         style={"font_size": 12}),
            ],
        ))

        self._register(SheetTemplate(
            id="site_analysis_deep",
            name="Deep Site Analysis",
            category=TemplateCategory.SITE_ANALYSIS,
            description="Six analysis diagrams with annotations (movement, views, sun, wind, history, ecology)",
            page_size=PageSize.A2,
            orientation=PageOrientation.LANDSCAPE,
            grid_columns=GridColumns.TWELVE,
            grid_rows=8,
            tags=["site", "diagrams", "year3", "year4", "year5"],
            year_level="Year 3–5",
            use_case="Comprehensive site analysis",
            cells=[
                *[GridCell(col, 4, row, 3, ElementType.IMAGE,
                           label, placeholder)
                  for (col, row, label, placeholder) in [
                      (1, 1, "Movement & Access", "Pedestrian & vehicle routes"),
                      (5, 1, "Views & Vistas", "Key views to/from site"),
                      (9, 1, "Solar Analysis", "Sun path overlay"),
                      (1, 5, "Wind & Microclimate", "Wind rose & prevailing winds"),
                      (5, 5, "Historical Context", "Overlay map — historic"),
                      (9, 5, "Ecology & Landscape", "Vegetation & green corridors"),
                  ]],
                *[GridCell(col, 4, row, 1, ElementType.CAPTION,
                           f"{lbl} Caption", f"{lbl}",
                           style={"text_align": "center"})
                  for (col, row, lbl) in [
                      (1, 4, "Movement"), (5, 4, "Views"), (9, 4, "Solar"),
                      (1, 8, "Wind"),     (5, 8, "History"),(9, 8, "Ecology"),
                  ]],
            ],
        ))

        self._register(SheetTemplate(
            id="site_precedent",
            name="Site + Precedent Studies",
            category=TemplateCategory.SITE_ANALYSIS,
            description="Site plan (left half) + two precedent project studies (right half)",
            page_size=PageSize.A2,
            orientation=PageOrientation.LANDSCAPE,
            grid_columns=GridColumns.TWELVE,
            grid_rows=8,
            tags=["site", "precedent", "year3"],
            year_level="Year 3",
            use_case="Early-stage contextual research",
            cells=[
                GridCell(1, 6, 1, 8, ElementType.IMAGE,
                         "Site Plan", "Site plan with context"),
                GridCell(7, 6, 1, 4, ElementType.IMAGE,
                         "Precedent 1", "Precedent project image"),
                GridCell(7, 6, 5, 3, ElementType.TEXT,
                         "Precedent 1 Analysis",
                         "Key design principles drawn from precedent 1 — 80 words"),
                GridCell(7, 6, 8, 1, ElementType.CAPTION,
                         "Precedent 1 Name", "Architect · Year · Location"),
            ],
        ))

    # ── DESIGN DEVELOPMENT (4 templates) ──────

    def _register_design_dev_templates(self) -> None:

        # 4-sheet design development series
        for i, (tid, name, desc, cells_fn) in enumerate([
            ("dd_concepts",    "Design Concepts", "Initial concept diagrams, sketches, and design intentions",
             self._dd_concepts_cells),
            ("dd_massing",     "Massing & Form Studies", "Massing model studies and form evolution",
             self._dd_massing_cells),
            ("dd_spatial",     "Spatial Organisation", "Spatial layout, circulation, and programmatic diagrams",
             self._dd_spatial_cells),
            ("dd_refinement",  "Design Refinement", "Developed design with resolved details",
             self._dd_refinement_cells),
        ]):
            self._register(SheetTemplate(
                id=tid,
                name=name,
                category=TemplateCategory.DESIGN_DEV,
                description=desc,
                page_size=PageSize.A2,
                orientation=PageOrientation.LANDSCAPE,
                grid_columns=GridColumns.TWELVE,
                grid_rows=8,
                tags=["design-dev", "series", f"dd-{i+1}", "year3", "year4"],
                year_level="Year 3–4",
                use_case=f"Design development series — Sheet {i+1} of 4",
                cells=cells_fn(),
            ))

    def _dd_concepts_cells(self) -> list[GridCell]:
        return [
            GridCell(1, 4, 1, 6, ElementType.IMAGE, "Concept Sketch", "Freehand concept sketch"),
            GridCell(5, 4, 1, 6, ElementType.IMAGE, "Diagram 1", "Conceptual diagram"),
            GridCell(9, 4, 1, 6, ElementType.IMAGE, "Diagram 2", "Programme / precedent diagram"),
            GridCell(1, 12, 7, 2, ElementType.TEXT, "Design Intent",
                     "Describe the core design concept in 150 words",
                     style={"font_size": 13}),
        ]

    def _dd_massing_cells(self) -> list[GridCell]:
        return [
            *[GridCell(c, 3, 1, 5, ElementType.IMAGE,
                       f"Massing Option {i+1}", f"Massing study {i+1}")
              for i, c in enumerate([1, 4, 7, 10])],
            GridCell(1, 12, 6, 2, ElementType.TEXT, "Massing Commentary",
                     "Explain each massing option — 100 words"),
            GridCell(1, 12, 8, 1, ElementType.CAPTION, "Series Label",
                     "Design Development Series — Sheet 2 of 4"),
        ]

    def _dd_spatial_cells(self) -> list[GridCell]:
        return [
            GridCell(1, 6, 1, 6, ElementType.IMAGE,
                     "Bubble Diagram", "Programme / spatial adjacency diagram"),
            GridCell(7, 6, 1, 6, ElementType.IMAGE,
                     "Circulation Diagram", "Vertical and horizontal circulation"),
            GridCell(1, 12, 7, 2, ElementType.TEXT, "Spatial Strategy",
                     "Spatial organisation narrative — 120 words"),
        ]

    def _dd_refinement_cells(self) -> list[GridCell]:
        return [
            GridCell(1, 5, 1, 5, ElementType.IMAGE, "Developed Plan", "1:200 developed floor plan"),
            GridCell(6, 4, 1, 5, ElementType.IMAGE, "Section", "Developed section"),
            GridCell(10, 3, 1, 5, ElementType.IMAGE, "Perspective", "Design perspective or model photo"),
            GridCell(1, 12, 6, 3, ElementType.TEXT, "Design Commentary",
                     "Summarise key design decisions — 200 words"),
        ]

    # ── MATERIAL / DETAIL (2 templates) ───────

    def _register_material_templates(self) -> None:

        self._register(SheetTemplate(
            id="material_palette",
            name="Material & Finish Palette",
            category=TemplateCategory.MATERIAL,
            description="Material swatches with annotations and supplier info",
            page_size=PageSize.A2,
            orientation=PageOrientation.PORTRAIT,
            grid_columns=GridColumns.EIGHT,
            grid_rows=12,
            tags=["materials", "palette", "year4", "year5"],
            year_level="Year 4–5",
            use_case="Interior/exterior material specification",
            cells=[
                GridCell(1, 8, 1, 2, ElementType.TITLE,
                         "Sheet Title", "MATERIAL PALETTE",
                         style={"font_size": 36}),
                *[GridCell(col, 4, row, 2, ElementType.IMAGE,
                           f"Material {i+1}", f"Material sample / photo",
                           aspect_ratio=1.0)
                  for i, (col, row) in enumerate(
                      [(1,3),(5,3),(1,5),(5,5),(1,7),(5,7),(1,9),(5,9)])],
                *[GridCell(col, 4, row+2, 1, ElementType.CAPTION,
                           f"Material {i+1} Name",
                           f"Material name · finish · supplier",
                           style={"font_size": 10})
                  for i, (col, row) in enumerate(
                      [(1,3),(5,3),(1,5),(5,5),(1,7),(5,7),(1,9),(5,9)])],
            ],
        ))

        self._register(SheetTemplate(
            id="construction_assembly",
            name="Construction Assembly",
            category=TemplateCategory.MATERIAL,
            description="Exploded axonometric of wall/roof assembly with callouts",
            page_size=PageSize.A2,
            orientation=PageOrientation.PORTRAIT,
            grid_columns=GridColumns.EIGHT,
            grid_rows=12,
            tags=["construction", "assembly", "detail", "year4", "year5"],
            year_level="Year 4–5",
            use_case="Building technology documentation",
            cells=[
                GridCell(1, 8, 1, 1, ElementType.TITLE,
                         "Sheet Title", "WALL ASSEMBLY",
                         style={"font_size": 28}),
                GridCell(2, 6, 2, 8, ElementType.IMAGE,
                         "Exploded Axo", "Exploded wall/floor/roof assembly",
                         aspect_ratio=0.75),
                GridCell(1, 1, 2, 8, ElementType.LABEL,
                         "Callout Column L", "Layer callouts — left",
                         style={"font_size": 10}),
                GridCell(8, 1, 2, 8, ElementType.LABEL,
                         "Callout Column R", "Layer callouts — right",
                         style={"font_size": 10}),
                GridCell(1, 8, 10, 2, ElementType.TEXT,
                         "Assembly Notes",
                         "Notes on thermal performance, U-value, fire rating"),
            ],
        ))

    # ── RENDERS (2 templates) ─────────────────

    def _register_render_templates(self) -> None:

        self._register(SheetTemplate(
            id="render_showcase",
            name="Render Showcase",
            category=TemplateCategory.RENDERS,
            description="One large hero render + two secondary renders",
            page_size=PageSize.A1,
            orientation=PageOrientation.LANDSCAPE,
            grid_columns=GridColumns.TWELVE,
            grid_rows=8,
            tags=["renders", "visuals", "year4", "year5"],
            year_level="Year 4–5",
            use_case="Final render presentation",
            cells=[
                GridCell(1, 8, 1, 6, ElementType.IMAGE,
                         "Hero Render", "Primary exterior / interior perspective",
                         aspect_ratio=16/9),
                GridCell(9, 4, 1, 4, ElementType.IMAGE,
                         "Render 2", "Secondary perspective"),
                GridCell(9, 4, 5, 4, ElementType.IMAGE,
                         "Render 3", "Night render or detail"),
                GridCell(1, 8, 7, 2, ElementType.TEXT,
                         "Render Description",
                         "Describe the spatial quality shown — 80 words",
                         style={"font_size": 12}),
                GridCell(9, 4, 7, 2, ElementType.CAPTION,
                         "Render Notes", "View descriptions"),
            ],
        ))

        self._register(SheetTemplate(
            id="night_day_renders",
            name="Day / Night Renders",
            category=TemplateCategory.RENDERS,
            description="Side-by-side day and night renders with lighting analysis",
            page_size=PageSize.A2,
            orientation=PageOrientation.LANDSCAPE,
            grid_columns=GridColumns.TWELVE,
            grid_rows=8,
            tags=["renders", "lighting", "day-night"],
            year_level="Year 4–5",
            use_case="Lighting and atmosphere studies",
            cells=[
                GridCell(1, 6, 1, 7, ElementType.IMAGE,
                         "Day Render", "Daytime render", aspect_ratio=4/3),
                GridCell(7, 6, 1, 7, ElementType.IMAGE,
                         "Night Render", "Night render", aspect_ratio=4/3),
                GridCell(1, 6, 8, 1, ElementType.CAPTION,
                         "Day Label", "Day — 12:00",
                         style={"text_align": "center"}),
                GridCell(7, 6, 8, 1, ElementType.CAPTION,
                         "Night Label", "Night — 21:00",
                         style={"text_align": "center"}),
            ],
        ))

    # ── COMPETITION (2 templates) ─────────────

    def _register_competition_templates(self) -> None:

        self._register(SheetTemplate(
            id="competition_board_h",
            name="Competition Board — Horizontal",
            category=TemplateCategory.COMPETITION,
            description="High-impact A1 landscape board for competition entry",
            page_size=PageSize.A1,
            orientation=PageOrientation.LANDSCAPE,
            grid_columns=GridColumns.TWELVE,
            grid_rows=10,
            tags=["competition", "A1", "year4", "year5"],
            year_level="Year 4–5",
            use_case="Architecture competition submission",
            cells=[
                GridCell(1, 12, 1, 1, ElementType.TITLE,
                         "Competition Title", "COMPETITION ENTRY — PROJECT NAME",
                         style={"font_size": 40, "font_weight": "bold"}),
                GridCell(1, 5, 2, 6, ElementType.IMAGE, "Main Render", "Primary render"),
                GridCell(6, 4, 2, 6, ElementType.IMAGE, "Site Plan", "Site plan 1:500"),
                GridCell(10, 3, 2, 3, ElementType.IMAGE, "Concept Diagram", "Concept"),
                GridCell(10, 3, 5, 3, ElementType.IMAGE, "Section", "Key section"),
                GridCell(1, 12, 8, 3, ElementType.TEXT, "Design Statement",
                         "Competition design statement — 300 words",
                         style={"columns": 3, "font_size": 11}),
                GridCell(1, 12, 10, 1, ElementType.TEXT, "Footer",
                         "Entry Code · Site Area · GFA · Storeys",
                         style={"font_size": 10, "border_top": True}),
            ],
        ))

        self._register(SheetTemplate(
            id="competition_board_v",
            name="Competition Board — Vertical",
            category=TemplateCategory.COMPETITION,
            description="A1 portrait competition board — structured narrative flow",
            page_size=PageSize.A1,
            orientation=PageOrientation.PORTRAIT,
            grid_columns=GridColumns.EIGHT,
            grid_rows=14,
            tags=["competition", "portrait", "year5"],
            year_level="Year 5",
            use_case="Vertical-format competition submission",
            cells=[
                GridCell(1, 8, 1, 1, ElementType.TITLE,
                         "Title", "PROJECT TITLE",
                         style={"font_size": 44}),
                GridCell(1, 8, 2, 5, ElementType.IMAGE,
                         "Hero Render", "Primary visual", aspect_ratio=16/9),
                GridCell(1, 4, 7, 4, ElementType.IMAGE, "Plan", "Floor plan"),
                GridCell(5, 4, 7, 4, ElementType.IMAGE, "Section", "Section"),
                GridCell(1, 8, 11, 3, ElementType.TEXT,
                         "Design Statement", "Design narrative — 250 words"),
                GridCell(1, 8, 14, 1, ElementType.TEXT, "Footer",
                         "Entry Code · Scale 1:200",
                         style={"font_size": 10, "border_top": True}),
            ],
        ))

    # ── THESIS (3 templates) ──────────────────

    def _register_thesis_templates(self) -> None:

        self._register(SheetTemplate(
            id="thesis_argument",
            name="Thesis Argument Sheet",
            category=TemplateCategory.THESIS,
            description="Research argument: text-heavy with supporting diagrams",
            page_size=PageSize.A2,
            orientation=PageOrientation.PORTRAIT,
            grid_columns=GridColumns.EIGHT,
            grid_rows=12,
            tags=["thesis", "research", "year5"],
            year_level="Year 5",
            use_case="Thesis book design chapter / argument sheets",
            cells=[
                GridCell(1, 8, 1, 1, ElementType.TITLE,
                         "Chapter / Section Title", "CHAPTER 1 — ARGUMENT TITLE",
                         style={"font_size": 28}),
                GridCell(1, 5, 2, 8, ElementType.TEXT,
                         "Main Argument Text",
                         "Primary thesis argument — up to 600 words",
                         style={"font_size": 12, "line_height": 1.6}),
                GridCell(6, 3, 2, 4, ElementType.IMAGE, "Diagram 1", "Supporting diagram"),
                GridCell(6, 3, 6, 4, ElementType.IMAGE, "Diagram 2", "Case study image"),
                GridCell(6, 3, 10, 1, ElementType.CAPTION, "Image Caption", "Figure caption"),
                GridCell(1, 8, 12, 1, ElementType.PAGE_NUMBER,
                         "Page Number", "Page 1",
                         style={"text_align": "right", "font_size": 10}),
            ],
        ))

        self._register(SheetTemplate(
            id="thesis_design_sheet",
            name="Thesis Design Sheet",
            category=TemplateCategory.THESIS,
            description="Thesis project: plan + sections + renders in academic layout",
            page_size=PageSize.A1,
            orientation=PageOrientation.LANDSCAPE,
            grid_columns=GridColumns.TWELVE,
            grid_rows=10,
            tags=["thesis", "design", "year5"],
            year_level="Year 5",
            use_case="Thesis design documentation — 70+ sheet project",
            cells=[
                GridCell(1, 12, 1, 1, ElementType.TITLE,
                         "Sheet Title", "PROJECT — SHEET TYPE",
                         style={"font_size": 32}),
                GridCell(1,  5, 2, 6, ElementType.IMAGE,
                         "Key Plan / Site Plan", "Key plan or site plan 1:500"),
                GridCell(6,  4, 2, 6, ElementType.IMAGE,
                         "Section", "Primary section 1:100"),
                GridCell(10, 3, 2, 4, ElementType.IMAGE,
                         "Render", "Interior or exterior render"),
                GridCell(10, 3, 6, 4, ElementType.IMAGE,
                         "Axonometric", "Exploded axo or diagram"),
                GridCell(1, 12, 8, 2, ElementType.TEXT,
                         "Design Notes", "Sheet-specific design notes — 150 words",
                         style={"font_size": 11, "columns": 3}),
                GridCell(1, 12, 10, 1, ElementType.TEXT,
                         "Sheet Footer",
                         "Thesis Project · Scale 1:100 · Sheet 14 of 70",
                         style={"font_size": 10, "border_top": True}),
            ],
        ))

        self._register(SheetTemplate(
            id="thesis_comparison",
            name="Thesis Case Study Comparison",
            category=TemplateCategory.THESIS,
            description="Compare three case studies side-by-side with analysis",
            page_size=PageSize.A2,
            orientation=PageOrientation.LANDSCAPE,
            grid_columns=GridColumns.TWELVE,
            grid_rows=8,
            tags=["thesis", "case-study", "comparison", "year5"],
            year_level="Year 5",
            use_case="Thesis research — case study comparison",
            cells=[
                GridCell(1, 12, 1, 1, ElementType.TITLE,
                         "Title", "CASE STUDY COMPARISON",
                         style={"font_size": 22}),
                *[GridCell(col, 4, 2, 4, ElementType.IMAGE,
                           f"Case Study {i+1}", f"Case study {i+1} image")
                  for i, col in enumerate([1, 5, 9])],
                *[GridCell(col, 4, 6, 3, ElementType.TEXT,
                           f"Analysis {i+1}",
                           f"Analysis of case study {i+1} — 80 words",
                           style={"font_size": 11})
                  for i, col in enumerate([1, 5, 9])],
            ],
        ))


# ──────────────────────────────────────────────
# SINGLETON
# ──────────────────────────────────────────────

_registry: SheetTemplateRegistry | None = None


def get_template_registry() -> SheetTemplateRegistry:
    global _registry
    if _registry is None:
        _registry = SheetTemplateRegistry()
    return _registry
