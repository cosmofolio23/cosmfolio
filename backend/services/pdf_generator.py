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
    
    # Construct the print URL with the headless token
    # NOTE: Do NOT use print=true here — that triggers window.print() on the frontend.
    # The headless_token param alone is sufficient for the frontend to enter headless mode.
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
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            device_scale_factor=2,  # High res rendering
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        page.on("console", lambda msg: print(f"[BROWSER] {msg.text}"))
        
        try:
            # Navigate to the portfolio print page
            await page.goto(print_url, wait_until="domcontentloaded", timeout=60000)
            
            # Wait for the explicit signal that React has finished rendering everything
            # (including fonts, images, and layout calculations).
            # The frontend will inject <div id="render-complete"></div> when ready.
            await page.wait_for_selector("#render-complete", state="attached", timeout=60000)
            
            # Scroll down to ensure all lazy images and background images are requested
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
                                    const timer = setTimeout(resolve, 15000); // 15s max per image
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
            
            # Get page orientation and exact dimensions dynamically
            dimensions = await page.evaluate("""
                () => {
                    const el = document.querySelector('.pf-print-page');
                    if (el) {
                        // Find the actual content container (the first child of the print page)
                        const child = el.firstElementChild;
                        if (child) {
                            const rect = child.getBoundingClientRect();
                            return {
                                width: Math.round(rect.width),
                                height: Math.round(rect.height),
                                is_landscape: rect.width > rect.height
                            };
                        }
                    }
                    return { width: 1414, height: 1000, is_landscape: true }; // Default A4 landscape fallback
                }
            """)
            
            is_landscape = dimensions.get("is_landscape", True)
            
            # Set the viewport to match the exact page content size to prevent scaling margins
            await page.set_viewport_size({
                "width": dimensions["width"],
                "height": dimensions["height"]
            })
            
            # Wait for layout adjustment
            await page.wait_for_timeout(500)
            
            # Print to PDF
            # A4 size, respecting orientation dynamically
            pdf_bytes = await page.pdf(
                format="A4",
                landscape=is_landscape,
                print_background=True,
                margin={"top": "0", "right": "0", "bottom": "0", "left": "0"}
            )
            
            return pdf_bytes
        finally:
            await browser.close()
