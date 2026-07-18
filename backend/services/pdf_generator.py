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
        context = await browser.new_context(
            viewport={"width": 1124, "height": 794},
            device_scale_factor=2,  # High res rendering
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        page.on("console", lambda msg: print(f"[BROWSER] {msg.text}"))
        
        try:
            # Navigate to the portfolio print page
            await page.goto(print_url, wait_until="domcontentloaded", timeout=60000)
            
            # Wait for the explicit signal that React has finished rendering everything
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
            
            # Print to PDF. Since we set prefer_css_page_size=True,
            # Chromium will respect the CSS @page size defined in page.tsx (e.g. A4 / 297mm x 210mm).
            # The CSS auto-scaling rule will automatically scale the PageComposer contents
            # to fit 100vw / 100vh of the page perfectly with zero margins.
            pdf_bytes = await page.pdf(
                print_background=True,
                prefer_css_page_size=True,
                margin={"top": "0", "right": "0", "bottom": "0", "left": "0"}
            )
            
            return pdf_bytes
        finally:
            await browser.close()
