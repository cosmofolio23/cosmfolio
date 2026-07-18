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
        # Use a viewport width of 760px — this matches the PageComposer's baseWidth,
        # so the CSS transform scale will be ~1.0 and content fills the viewport exactly.
        context = await browser.new_context(
            viewport={"width": 760, "height": 1074},
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
            
            # Read the page size and orientation from the frontend
            page_info = await page.evaluate("""
                () => {
                    const el = document.querySelector('.pf-print-page');
                    if (!el) return { is_landscape: false };
                    const child = el.firstElementChild;
                    if (!child) return { is_landscape: false };
                    const rect = child.getBoundingClientRect();
                    return {
                        is_landscape: rect.width > rect.height,
                        content_width: Math.round(rect.width),
                        content_height: Math.round(rect.height)
                    };
                }
            """)
            
            is_landscape = page_info.get("is_landscape", False)
            
            # Inject CSS to force full-page printing: each .pf-print-page fills one printed sheet
            await page.add_style_tag(content="""
                @media print {
                    @page { margin: 0; }
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    /* Hide everything except the print container */
                    body > * { display: none !important; }
                    #pf-print-container,
                    #pf-print-container ~ script,
                    #__next { display: block !important; }
                    #__next > * { display: none !important; }
                    #__next > div:has(#pf-print-container) { display: block !important; }
                    #__next > div > * { display: none !important; }
                    #__next > div > main { display: block !important; }
                    #__next > div > main > * { display: none !important; }
                    #pf-print-container { display: block !important; }
                    
                    /* Each print page fills exactly one sheet */
                    .pf-print-page {
                        width: 100vw !important;
                        height: 100vh !important;
                        overflow: hidden !important;
                        break-after: page;
                        page-break-after: always;
                        page-break-inside: avoid;
                    }
                    .pf-print-page:last-child {
                        break-after: auto;
                        page-break-after: auto;
                    }
                    /* Force the PageComposer outer container to fill the print page */
                    .pf-print-page > div {
                        width: 100% !important;
                        height: 100% !important;
                        max-width: none !important;
                    }
                    /* Force the inner scaled content to fill 100% too */
                    .pf-print-page > div > div {
                        width: 100% !important;
                        height: 100% !important;
                        transform: none !important;
                    }
                }
            """)
            
            await page.wait_for_timeout(500)
            
            # Print to PDF
            pdf_bytes = await page.pdf(
                format="A4",
                landscape=is_landscape,
                print_background=True,
                margin={"top": "0", "right": "0", "bottom": "0", "left": "0"}
            )
            
            return pdf_bytes
        finally:
            await browser.close()
