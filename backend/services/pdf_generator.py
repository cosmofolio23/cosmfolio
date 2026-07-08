import os
import asyncio
from typing import Optional
from playwright.async_api import async_playwright

async def generate_portfolio_pdf(project_id: str, headless_token: str) -> bytes:
    """
    Generates a PDF using a headless Chromium browser via Playwright.
    Connects to the frontend with a specific token to bypass Firebase Auth,
    waits for the 'render-complete' element to signal fonts and images are ready,
    and returns the raw PDF bytes.
    """
    frontend_url = os.environ.get("FRONTEND_URL", "https://thecosmofolio.com")
    
    # Construct the print URL with the headless token
    print_url = f"{frontend_url}/dashboard/portfolio-book/{project_id}?print=true&headless_token={headless_token}"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        )
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            device_scale_factor=2  # High res rendering
        )
        page = await context.new_page()
        
        try:
            # Navigate to the portfolio print page
            await page.goto(print_url, wait_until="networkidle", timeout=60000)
            
            # Wait for the explicit signal that React has finished rendering everything
            # (including fonts, images, and layout calculations).
            # The frontend will inject <div id="render-complete"></div> when ready.
            await page.wait_for_selector("#render-complete", state="attached", timeout=60000)
            
            # Optionally, give it 1 more second to let any micro-animations settle
            await page.wait_for_timeout(1000)
            
            # Print to PDF
            # A4 size in inches (8.27 x 11.69), standard portfolio format
            pdf_bytes = await page.pdf(
                format="A4",
                print_background=True,
                margin={"top": "0", "right": "0", "bottom": "0", "left": "0"}
            )
            
            return pdf_bytes
        finally:
            await browser.close()
