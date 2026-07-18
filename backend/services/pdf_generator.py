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
        # Viewport = 760px wide: matches PageComposer baseWidth so scale=1.0
        # The frontend's checkReady() will strip all ancestor padding so the 
        # print container is exactly 760px wide (not 696px which p-8 caused).
        context = await browser.new_context(
            viewport={"width": 760, "height": 2000},
            device_scale_factor=2,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        page.on("console", lambda msg: print(f"[BROWSER] {msg.text}"))
        
        try:
            await page.goto(print_url, wait_until="domcontentloaded", timeout=60000)
            
            # Wait for frontend to signal ready (fonts, images, layout all settled)
            await page.wait_for_selector("#render-complete", state="attached", timeout=60000)
            
            # Scroll to trigger lazy image/background loading
            await page.evaluate("""
                async () => {
                    window.scrollTo(0, document.body.scrollHeight);
                    await new Promise(r => setTimeout(r, 1000));
                    window.scrollTo(0, 0);
                    
                    const elements = document.querySelectorAll('*');
                    const promises = [];
                    for (let el of elements) {
                        const style = window.getComputedStyle(el);
                        const bg = style.backgroundImage;
                        if (bg && bg !== 'none' && bg.includes('url(')) {
                            const url = bg.slice(bg.indexOf('url(') + 4, bg.indexOf(')'));
                            const cleanUrl = url.replace(/['"]/g, '');
                            if (cleanUrl && !cleanUrl.startsWith('data:')) {
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
            
            # Read the EXACT pixel size of one page of content.
            # After checkReady() strips all ancestor padding, the outer PageComposer
            # container should be exactly 760px wide (= baseWidth, scale=1.0).
            # Its aspect-ratio CSS then sets the height correctly for the page size.
            page_dims = await page.evaluate("""
                () => {
                    const printPage = document.querySelector('.pf-print-page');
                    if (!printPage) return { width: 760, height: 537 };
                    const content = printPage.firstElementChild;
                    if (!content) return { width: 760, height: 537 };
                    // Force a reflow to get fresh layout values
                    void content.offsetHeight;
                    const rect = content.getBoundingClientRect();
                    console.log('[PDF] Page content rect:', JSON.stringify({w: rect.width, h: rect.height}));
                    return {
                        width: Math.round(rect.width),
                        height: Math.round(rect.height)
                    };
                }
            """)
            
            w = page_dims.get("width", 760)
            h = page_dims.get("height", 537)
            print(f"[PDF] Measured content size: {w}px x {h}px → PDF will be {w}px x {h}px")
            
            # Resize viewport to exactly match the content page dimensions
            await page.set_viewport_size({"width": w, "height": h})
            await page.wait_for_timeout(300)
            
            # Generate PDF where the page size EXACTLY matches the content dimensions.
            # Using px units: 1px = 1/96 inch. This ensures no scaling occurs.
            pdf_bytes = await page.pdf(
                width=f"{w}px",
                height=f"{h}px",
                print_background=True,
                margin={"top": "0", "right": "0", "bottom": "0", "left": "0"}
            )
            
            return pdf_bytes
        finally:
            await browser.close()
