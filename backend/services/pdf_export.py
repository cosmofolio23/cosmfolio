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
    Fallback PDF generation if Puppeteer unavailable.
    Uses weasyprint if available, otherwise returns error PDF.
    """
    try:
        from weasyprint import HTML, CSS
        from io import BytesIO

        # Create BytesIO object
        pdf_buffer = BytesIO()

        # Generate PDF with weasyprint
        HTML(string=html_content).write_pdf(pdf_buffer)
        return pdf_buffer.getvalue()

    except ImportError:
        logger.error("Neither pyppeteer nor weasyprint available")
        # Return a simple HTML-to-PDF conversion as last resort
        # (This would need wkhtmltopdf or similar external tool)
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
