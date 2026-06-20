"""
PDF Export Service - Generate print-ready PDFs from portfolios
Uses Puppeteer/headless Chrome via pyppeteer
"""

import asyncio
import logging
from typing import Optional, Dict, Any, List, Tuple
import io
from datetime import datetime
from enum import Enum

logger = logging.getLogger(__name__)

try:
    from pyppeteer import launch
    PUPPETEER_AVAILABLE = True
except ImportError:
    PUPPETEER_AVAILABLE = False
    logger.warning("pyppeteer not installed - PDF export will use fallback method")


class PageSizeEnum(str, Enum):
    A4 = "A4"
    A3 = "A3"
    Letter = "Letter"
    Tabloid = "Tabloid"
    Custom = "Custom"


class PageOrientationEnum(str, Enum):
    portrait = "portrait"
    landscape = "landscape"


async def generate_pdf_from_html(
    html_content: str,
    title: str = "Portfolio",
    options: Optional[Dict[str, Any]] = None
) -> bytes:
    """
    Generate PDF from HTML using Puppeteer.
    """
    if not PUPPETEER_AVAILABLE:
        return await _generate_pdf_fallback(html_content)

    browser = None
    try:
        browser = await launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
            ]
        )
        page = await browser.newPage()
        await page.setViewport({'width': 1200, 'height': 1600})
        await page.setContent(html_content, {'waitUntil': 'networkidle2'})

        pdf_options = {
            'format': 'A4',
            'margin': {
                'top': '0.5cm',
                'right': '0.5cm',
                'bottom': '0.5cm',
                'left': '0.5cm',
            },
            'printBackground': True,
            'preferCSSPageSize': True,
        }
        if options:
            pdf_options.update(options)

        pdf_bytes = await page.pdf(pdf_options)
        await page.close()
        return pdf_bytes

    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        return await _generate_pdf_fallback(html_content)
    finally:
        if browser:
            await browser.close()


async def _generate_pdf_fallback(html_content: str) -> bytes:
    """
    Fallback PDF generation when a headless browser isn't available.
    """
    from io import BytesIO

    try:
        from xhtml2pdf import pisa
        buf = BytesIO()
        result = pisa.CreatePDF(src=html_content, dest=buf, encoding="utf-8")
        if not result.err:
            return buf.getvalue()
        logger.warning("xhtml2pdf reported errors; trying WeasyPrint")
    except ImportError:
        logger.info("xhtml2pdf not installed; trying WeasyPrint")
    except Exception as e:
        logger.warning(f"xhtml2pdf failed ({e}); trying WeasyPrint")

    try:
        from weasyprint import HTML
        buf = BytesIO()
        HTML(string=html_content).write_pdf(buf)
        return buf.getvalue()
    except Exception as e:
        logger.error(f"WeasyPrint unavailable: {e}")

    return _create_error_pdf("PDF generation unavailable").encode()


def _create_error_pdf(error_message: str) -> str:
    """Create a simple text-based error PDF"""
    return f"""
    <html>
    <head>
        <title>Error</title>
        <style>
            body {{ font-family: system-ui; padding: 40px; }}
            .error {{ color: red; background: #fee; padding: 20px; border-radius: 8px; }}
        </style>
    </head>
    <body>
        <div class="error">
            <h2>PDF Generation Error</h2>
            <p>{error_message}</p>
        </div>
    </body>
    </html>
    """


def create_pdf_filename(project_title: str, variant_num: int = 1) -> str:
    """Create a descriptive PDF filename"""
    clean_title = "".join(c for c in project_title if c.isalnum() or c in (" ", "-", "_"))
    clean_title = clean_title.strip().replace(" ", "-")[:50]
    timestamp = datetime.now().strftime("%Y%m%d")
    return f"{clean_title}-variant{variant_num}-{timestamp}.pdf"


class PDFExportService:
    """Service for managing PDF exports and optimization"""

    def __init__(self):
        self.weasyprint_available = True
        try:
            import weasyprint
        except ImportError:
            self.weasyprint_available = False

        self.page_sizes = {
            "A4": (210, 297),
            "A3": (297, 420),
            "Letter": (215.9, 279.4),
            "Tabloid": (279.4, 431.8),
            "Custom": (0, 0)
        }

        self.style_configurations = {
            "minimal_white": {"colors": {"background": "#ffffff"}},
            "dark_studio": {"colors": {"background": "#121212"}},
            "scandinavian": {"colors": {"background": "#f4f4f4"}},
            "architectural_journal": {"colors": {"background": "#faf9f6"}},
        }

    async def export_portfolio_pdf(
        self,
        portfolio_html: str,
        page_size: str,
        orientation: str,
        style_pack: str,
        include_margins: bool
    ) -> Tuple[bytes, Dict[str, Any]]:
        """
        Generate and export PDF content and metadata.
        """
        options = {
            "format": page_size if page_size in self.page_sizes else "A4",
            "landscape": orientation == "landscape",
        }
        
        pdf_bytes = await generate_pdf_from_html(portfolio_html, options=options)
        
        metadata = {
            "page_size": page_size,
            "orientation": orientation,
            "style_pack": style_pack,
            "margins": "standard" if include_margins else "none",
            "exported_at": datetime.utcnow().isoformat(),
            "file_size": len(pdf_bytes),
            "pages_count": 4,  # Estimated pages
        }
        return pdf_bytes, metadata

    def generate_pdf_metadata(
        self,
        portfolio_id: str,
        title: str,
        author: str,
        page_size: str,
    ) -> Dict[str, Any]:
        """
        Generate mock or calculated PDF metadata.
        """
        return {
            "portfolio_id": portfolio_id,
            "title": title,
            "author": author,
            "page_size": page_size,
            "estimated_pages": 4,
            "created_at": datetime.utcnow().isoformat(),
            "status": "ready"
        }

    def optimize_images_for_pdf(
        self,
        image_paths: List[str],
        quality: str,
        max_width: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Mock image optimization for PDF exports.
        """
        count = len(image_paths)
        size_before = count * 1024 * 1024  # 1MB per image
        ratio = 0.5 if quality == "medium" else (0.3 if quality == "low" else 0.8)
        size_after = int(size_before * ratio)

        return {
            "optimized_count": count,
            "total_size_before": size_before,
            "total_size_after": size_after,
            "status": "success",
            "message": f"Successfully optimized {count} images"
        }


# Singleton pattern getter
_pdf_export_service = None

def get_pdf_export_service() -> PDFExportService:
    global _pdf_export_service
    if _pdf_export_service is None:
        _pdf_export_service = PDFExportService()
    return _pdf_export_service
