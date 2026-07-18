import os
import asyncio
from typing import Optional

async def generate_portfolio_pdf(project_id: str, headless_token: str) -> bytes:
    """
    Generates a PDF using a headless Chromium browser via Playwright.
    Connects to the frontend with a specific token to bypass Firebase Auth,
    waits for the 'render-complete' element to signal fonts and images are ready,
    and returns the raw PDF bytes.
    """
    frontend_url = os.environ.get("FRONTEND_URL", "https://thecosmofolio.com")
    
    from playwright.async_api import async_playwright
    
    print_url = f"{frontend_url}/dashboard/portfolio-book/{project_id}?headless_token={headless_token}"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox", 
                "--disable-setuid-sandbox", 
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--no-zygote"
            ]
        )
        # Start with a 760px viewport (PageComposer baseWidth) so scale=1.0
        context = await browser.new_context(
            viewport={"width": 760, "height": 1074},
            device_scale_factor=2,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        page.on("console", lambda msg: print(f"[BROWSER] {msg.text}"))
        
        try:
            await page.goto(print_url, wait_until="domcontentloaded", timeout=60000)
            await page.wait_for_selector("#render-complete", state="attached", timeout=60000)
            
            # Scroll to trigger lazy image loading
            await page.evaluate("""
                async () => {
                    window.scrollTo(0, document.body.scrollHeight);
                    await new Promise(r => setTimeout(r, 1000));
                    window.scrollTo(0, 0);
                    
                    // Wait for background images
                    const elements = document.querySelectorAll('*');
                    const promises = [];
                    for (let el of elements) {
                        const style = window.getComputedStyle(el);
                        const bg = style.backgroundImage;
                        if (bg && bg !== 'none' && bg.includes('url(')) {
                            const url = bg.slice(bg.indexOf('url(') + 4, bg.indexOf(')'));
                            const cleanUrl = url.replace(/['"]/g, '');
                            if(cleanUrl && !cleanUrl.startsWith('data:')) {
                                promises.push(new Promise(resolve => {
                                    const img = new Image();
                                    const timer = setTimeout(resolve, 15000);
                                    img.onload = () => { clearTimeout(timer); resolve(); };
                                    img.onerror = () => { clearTimeout(timer); resolve(); };
                                    img.src = cleanUrl;
                                }));
                            }
                        }
                    }
                    await Promise.all(promises);
                }
            """)
            
            # Read the EXACT pixel dimensions of the rendered content block.
            # This is the inner div (position: absolute, 760px base) scaled by CSS transform.
            # We read the outer container's rendered size (which respects aspect-ratio CSS).
            page_info = await page.evaluate("""
                () => {
                    // The outer container uses aspect-ratio CSS to maintain page proportions.
                    // Its pixel size IS the page size we want for the PDF.
                    const printPage = document.querySelector('.pf-print-page');
                    if (!printPage) return { width_mm: 297, height_mm: 210 };
                    
                    const outerContainer = printPage.firstElementChild;
                    if (!outerContainer) return { width_mm: 297, height_mm: 210 };
                    
                    const rect = outerContainer.getBoundingClientRect();
                    const w = rect.width;
                    const h = rect.height;
                    
                    // Convert px to mm at 96dpi: 1px = 25.4/96 mm
                    const PX_TO_MM = 25.4 / 96;
                    return {
                        width_mm: w * PX_TO_MM,
                        height_mm: h * PX_TO_MM,
                        width_px: w,
                        height_px: h
                    };
                }
            """)
            
            width_mm = page_info.get("width_mm", 297)
            height_mm = page_info.get("height_mm", 210)
            
            print(f"[PDF] Page size: {width_mm:.1f}mm x {height_mm:.1f}mm (viewport 760px)")
            
            # Resize the viewport height to match the content exactly
            await page.set_viewport_size({
                "width": 760,
                "height": max(100, round(page_info.get("height_px", 537)))
            })
            await page.wait_for_timeout(500)
            
            # Print to PDF using EXACT custom page size — content fills the page perfectly
            pdf_bytes = await page.pdf(
                width=f"{width_mm:.2f}mm",
                height=f"{height_mm:.2f}mm",
                print_background=True,
                margin={"top": "0", "right": "0", "bottom": "0", "left": "0"}
            )
            
            return pdf_bytes
        finally:
            await browser.close()
