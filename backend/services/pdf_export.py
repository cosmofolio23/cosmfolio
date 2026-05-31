"""
PDF Export Service
Phase 5: Task 5.1 - Portfolio PDF export with styling and optimization
"""

import logging
import os
from io import BytesIO
from typing import Optional, Dict, Any, Tuple
from enum import Enum
from datetime import datetime
import asyncio

try:
    from weasyprint import HTML, CSS
    WEASYPRINT_AVAILABLE = True
except (ImportError, OSError) as e:
    WEASYPRINT_AVAILABLE = False
    logging.warning(f"WeasyPrint not available: {str(e)[:100]}. PDF export will use fallback.")

logger = logging.getLogger(__name__)


class PageSizeEnum(str, Enum):
    """Supported PDF page sizes"""
    A4 = "A4"  # 210mm x 297mm
    A3 = "A3"  # 297mm x 420mm
    Letter = "Letter"  # 8.5in x 11in
    Tabloid = "Tabloid"  # 11in x 17in
    Custom = "Custom"  # Custom width x height


class PageOrientationEnum(str, Enum):
    """PDF page orientation"""
    portrait = "portrait"
    landscape = "landscape"


class PDFExportService:
    """Service for exporting portfolios as PDF files"""

    def __init__(self):
        """Initialize PDF export service"""
        self.weasyprint_available = WEASYPRINT_AVAILABLE

        # Page size mappings (in mm)
        self.page_sizes = {
            PageSizeEnum.A4: {"width": 210, "height": 297, "margin": 20},
            PageSizeEnum.A3: {"width": 297, "height": 420, "margin": 25},
            PageSizeEnum.Letter: {"width": 215.9, "height": 279.4, "margin": 20},
            PageSizeEnum.Tabloid: {"width": 279.4, "height": 431.8, "margin": 25},
        }

        # Style pack configurations
        self.style_configurations = {
            "minimal_white": {
                "bg_color": "#ffffff",
                "text_color": "#1a1a1a",
                "accent_color": "#000000",
                "font_family": "'Inter', 'Helvetica Neue', sans-serif",
                "font_size_base": "12pt",
                "line_height": "1.6",
                "spacing_unit": "16px",
            },
            "dark_studio": {
                "bg_color": "#1a1a1a",
                "text_color": "#ffffff",
                "accent_color": "#ffb81c",
                "font_family": "'Courier New', monospace",
                "font_size_base": "11pt",
                "line_height": "1.8",
                "spacing_unit": "14px",
            },
            "scandinavian": {
                "bg_color": "#f5f3f0",
                "text_color": "#3a3a3a",
                "accent_color": "#8b6f47",
                "font_family": "'Georgia', serif",
                "font_size_base": "12pt",
                "line_height": "1.7",
                "spacing_unit": "16px",
            },
            "architectural_journal": {
                "bg_color": "#fafafa",
                "text_color": "#2a2a2a",
                "accent_color": "#d4a574",
                "font_family": "'Garamond', serif",
                "font_size_base": "13pt",
                "line_height": "1.8",
                "spacing_unit": "18px",
            },
            "competition_board": {
                "bg_color": "#ffffff",
                "text_color": "#000000",
                "accent_color": "#ff0000",
                "font_family": "'Arial', sans-serif",
                "font_size_base": "11pt",
                "line_height": "1.5",
                "spacing_unit": "14px",
            },
            "parametric": {
                "bg_color": "#0a0a0a",
                "text_color": "#00ff00",
                "accent_color": "#00ffff",
                "font_family": "'Courier New', monospace",
                "font_size_base": "10pt",
                "line_height": "1.5",
                "spacing_unit": "12px",
            },
            "corporate": {
                "bg_color": "#f8f9fa",
                "text_color": "#212529",
                "accent_color": "#0056b3",
                "font_family": "'Segoe UI', 'Roboto', sans-serif",
                "font_size_base": "12pt",
                "line_height": "1.6",
                "spacing_unit": "16px",
            },
        }

        logger.info("PDF Export Service initialized")

    async def export_portfolio_pdf(
        self,
        portfolio_html: str,
        page_size: str = "A4",
        orientation: str = "portrait",
        style_pack: str = "minimal_white",
        custom_width: Optional[float] = None,
        custom_height: Optional[float] = None,
        include_margins: bool = True,
    ) -> Tuple[bytes, Dict[str, Any]]:
        """
        Export portfolio as PDF

        Args:
            portfolio_html: HTML content of portfolio
            page_size: Page size (A4, A3, Letter, Tabloid, Custom)
            orientation: Portrait or landscape
            style_pack: Design system style pack
            custom_width: Custom width in mm (for Custom page size)
            custom_height: Custom height in mm (for Custom page size)
            include_margins: Whether to include margins

        Returns:
            Tuple of (PDF bytes, metadata dict)
        """
        try:
            if not self.weasyprint_available:
                logger.warning("WeasyPrint not available, using fallback")
                return await self._generate_fallback_pdf(portfolio_html)

            # Get page configuration
            page_config = self._get_page_config(
                page_size, orientation, custom_width, custom_height
            )

            # Get style configuration
            style_config = self.style_configurations.get(style_pack, self.style_configurations["minimal_white"])

            # Generate CSS
            css_string = self._generate_css(page_config, style_config, include_margins)

            # Generate PDF
            logger.info(f"Generating PDF: {page_size} {orientation}, style: {style_pack}")

            # Run WeasyPrint in thread to avoid blocking
            pdf_bytes = await asyncio.to_thread(
                self._render_pdf,
                portfolio_html,
                css_string,
                page_config
            )

            # Generate metadata
            metadata = {
                "page_size": page_size,
                "orientation": orientation,
                "style_pack": style_pack,
                "file_size_bytes": len(pdf_bytes),
                "generated_at": datetime.utcnow().isoformat(),
                "format": "PDF",
            }

            logger.info(f"PDF generated successfully: {len(pdf_bytes)} bytes")

            return pdf_bytes, metadata

        except Exception as e:
            logger.error(f"Error exporting PDF: {str(e)}")
            raise

    def _get_page_config(
        self,
        page_size: str,
        orientation: str,
        custom_width: Optional[float],
        custom_height: Optional[float],
    ) -> Dict[str, Any]:
        """Get page configuration based on size and orientation"""

        if page_size == "Custom":
            if not custom_width or not custom_height:
                raise ValueError("Custom page size requires width and height")
            config = {
                "width": custom_width,
                "height": custom_height,
                "margin": 20,
            }
        else:
            config = self.page_sizes.get(page_size, self.page_sizes[PageSizeEnum.A4]).copy()

        # Swap dimensions if landscape
        if orientation == "landscape":
            config["width"], config["height"] = config["height"], config["width"]

        return config

    def _generate_css(
        self,
        page_config: Dict[str, Any],
        style_config: Dict[str, str],
        include_margins: bool,
    ) -> str:
        """Generate CSS for PDF styling"""

        margin = page_config.get("margin", 20) if include_margins else 0

        css = f"""
        @page {{
            size: {page_config['width']}mm {page_config['height']}mm;
            margin: {margin}mm;
        }}

        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            background-color: {style_config['bg_color']};
            color: {style_config['text_color']};
            font-family: {style_config['font_family']};
            font-size: {style_config['font_size_base']};
            line-height: {style_config['line_height']};
        }}

        h1, h2, h3, h4, h5, h6 {{
            color: {style_config['accent_color']};
            margin-top: {style_config['spacing_unit']};
            margin-bottom: calc({style_config['spacing_unit']} / 2);
            font-weight: 600;
        }}

        h1 {{ font-size: 2.5em; }}
        h2 {{ font-size: 2em; }}
        h3 {{ font-size: 1.5em; }}
        h4 {{ font-size: 1.25em; }}

        p {{
            margin-bottom: {style_config['spacing_unit']};
        }}

        img {{
            max-width: 100%;
            height: auto;
            display: block;
            margin: {style_config['spacing_unit']} 0;
        }}

        .portfolio-page {{
            page-break-after: always;
            min-height: 100%;
            display: flex;
            flex-direction: column;
        }}

        .portfolio-section {{
            margin-bottom: {style_config['spacing_unit']};
            padding-bottom: {style_config['spacing_unit']};
            border-bottom: 1px solid {style_config['accent_color']};
        }}

        .portfolio-hero {{
            text-align: center;
            padding: calc({style_config['spacing_unit']} * 2) {style_config['spacing_unit']};
            background: linear-gradient(135deg, {style_config['bg_color']}, {style_config['accent_color']}15);
        }}

        .portfolio-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: {style_config['spacing_unit']};
            margin: {style_config['spacing_unit']} 0;
        }}

        .portfolio-image {{
            width: 100%;
            height: auto;
            object-fit: cover;
        }}

        @media print {{
            body {{
                background: white;
                color: black;
            }}
            a {{
                text-decoration: none;
                color: inherit;
            }}
        }}

        /* Font embedding - will be enhanced with Google Fonts */
        @font-face {{
            font-family: 'Inter';
            src: url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        }}

        @font-face {{
            font-family: 'Georgia';
            src: local('Georgia');
        }}

        @font-face {{
            font-family: 'Garamond';
            src: local('Garamond');
        }}
        """

        return css

    def _render_pdf(
        self,
        html_content: str,
        css_string: str,
        page_config: Dict[str, Any]
    ) -> bytes:
        """Render PDF using WeasyPrint (runs in thread)"""

        try:
            # Create HTML object
            html_obj = HTML(string=html_content, base_url=os.getcwd())

            # Create CSS object
            css_obj = CSS(string=css_string)

            # Render to PDF
            pdf_bytes = html_obj.write_pdf(stylesheets=[css_obj])

            return pdf_bytes

        except Exception as e:
            logger.error(f"WeasyPrint rendering error: {str(e)}")
            raise

    async def _generate_fallback_pdf(
        self,
        portfolio_html: str
    ) -> Tuple[bytes, Dict[str, Any]]:
        """Generate simple PDF fallback (without WeasyPrint)"""

        logger.warning("Using simple text-based PDF fallback")

        # For now, return a simple placeholder
        # In production, could use reportlab or similar
        fallback_content = f"""
        Portfolio Export (Fallback Mode)
        Generated: {datetime.utcnow().isoformat()}

        Note: WeasyPrint is not available.
        Please install WeasyPrint for full PDF support:
        pip install WeasyPrint

        Content:
        {portfolio_html[:500]}...
        """

        metadata = {
            "format": "PDF",
            "mode": "fallback",
            "generated_at": datetime.utcnow().isoformat(),
            "file_size_bytes": len(fallback_content),
        }

        return fallback_content.encode(), metadata

    def optimize_images_for_pdf(
        self,
        image_paths: list,
        quality: int = 85,
        max_width: int = 1200,
    ) -> Dict[str, Any]:
        """
        Optimize images for PDF export

        Args:
            image_paths: List of image file paths
            quality: JPEG compression quality (1-100)
            max_width: Maximum image width in pixels

        Returns:
            Dict with optimization results
        """

        try:
            from PIL import Image
            pil_available = True
        except ImportError:
            logger.warning("Pillow not available, skipping image optimization")
            pil_available = False

        results = {
            "optimized_count": 0,
            "failed_count": 0,
            "total_size_before": 0,
            "total_size_after": 0,
            "images": [],
        }

        if not pil_available:
            return results

        for image_path in image_paths:
            try:
                if not os.path.exists(image_path):
                    results["failed_count"] += 1
                    continue

                # Get original size
                original_size = os.path.getsize(image_path)
                results["total_size_before"] += original_size

                # Open and optimize image
                with Image.open(image_path) as img:
                    # Resize if too wide
                    if img.width > max_width:
                        ratio = max_width / img.width
                        new_height = int(img.height * ratio)
                        img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

                    # Save optimized
                    optimized_path = image_path.replace(".jpg", "_opt.jpg").replace(".png", "_opt.jpg")
                    img.save(optimized_path, "JPEG", quality=quality, optimize=True)

                    # Get optimized size
                    optimized_size = os.path.getsize(optimized_path)
                    results["total_size_after"] += optimized_size

                    results["optimized_count"] += 1
                    results["images"].append({
                        "original_path": image_path,
                        "optimized_path": optimized_path,
                        "size_before": original_size,
                        "size_after": optimized_size,
                        "compression": round(100 * (1 - optimized_size / original_size), 1),
                    })

            except Exception as e:
                logger.error(f"Error optimizing image {image_path}: {str(e)}")
                results["failed_count"] += 1

        return results

    def generate_pdf_metadata(
        self,
        portfolio_id: str,
        title: str,
        author: str,
        page_size: str,
    ) -> Dict[str, str]:
        """Generate PDF metadata"""

        return {
            "title": title,
            "author": author,
            "creator": "CosmoFolio Portfolio Generator",
            "producer": "WeasyPrint",
            "subject": "Architecture Portfolio",
            "keywords": "architecture, portfolio, design",
            "creation_date": datetime.utcnow().isoformat(),
        }


# ==================== SINGLETON INSTANCE ====================

_pdf_export_service = None

def get_pdf_export_service() -> PDFExportService:
    """Get or create PDF export service singleton"""
    global _pdf_export_service
    if _pdf_export_service is None:
        _pdf_export_service = PDFExportService()
    return _pdf_export_service
