"""
PDF Export Service - Generate print-ready PDFs from portfolios
Uses Puppeteer/headless Chrome via pyppeteer
"""

import asyncio
import logging
from typing import Optional, Dict, Any
import io
from datetime import datetime

logger = logging.getLogger(__name__)

try:
    from pyppeteer import launch
    PUPPETEER_AVAILABLE = True
except ImportError:
    PUPPETEER_AVAILABLE = False
    logger.warning("pyppeteer not installed - PDF export will use fallback method")


async def generate_pdf_from_html(
    html_content: str,
    title: str = "Portfolio",
    options: Optional[Dict[str, Any]] = None
) -> bytes:
    """
    Generate PDF from HTML using Puppeteer.

    Args:
        html_content: Complete HTML string with embedded CSS
        title: PDF title for metadata
        options: {
            'format': 'A4' | 'Letter',
            'margin': {'top': '0.5cm', 'right': '0.5cm', 'bottom': '0.5cm', 'left': '0.5cm'},
            'printBackground': True,
            'preferCSSPageSize': True,
            'displayHeaderFooter': False,
        }

    Returns:
        PDF file content as bytes
    """
    if not PUPPETEER_AVAILABLE:
        return await _generate_pdf_fallback(html_content)

    browser = None
    try:
        # Launch headless browser
        browser = await launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',  # Use /tmp instead of /dev/shm
            ]
        )
        page = await browser.newPage()

        # Set default viewport
        await page.setViewport({'width': 1200, 'height': 1600})

        # Load HTML
        await page.setContent(html_content, {'waitUntil': 'networkidle2'})

        # Build PDF options
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

        # Generate PDF
        pdf_bytes = await page.pdf(pdf_options)

        await page.close()
        return pdf_bytes

    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        # Return fallback PDF
        return await _generate_pdf_fallback(html_content)
    finally:
        if browser:
            await browser.close()


async def _generate_pdf_fallback(html_content: str) -> bytes:
    """
    Fallback PDF generation when a headless browser isn't available.

    Order: xhtml2pdf (pure Python, NO native deps — works on Render's Python
    buildpack) -> WeasyPrint (needs pango/cairo system libs) -> error PDF.
    """
    from io import BytesIO

    # 1) xhtml2pdf — pure Python, no system libraries required.
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

    # 2) WeasyPrint — higher fidelity but needs native libs (may be absent).
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
