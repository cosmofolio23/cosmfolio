import asyncio
import os
import sys
import jwt
from datetime import datetime, timedelta

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def main():
    from playwright.async_api import async_playwright
    
    project_id = "945ba699-7af1-4a0f-9d87-037d57fe42f1"
    
    # Get user ID from Supabase
    from supabase import create_client
    url = "https://rjobifgysmovmcvhdlnd.supabase.co"
    key = "sb_publishable_IsZjamlpYF9KrkJ07-Cikg_Lgl_UFoB"
    supa = create_client(url, key)
    proj = supa.table("projects").select("user_id").eq("id", project_id).execute()
    user_id = proj.data[0]["user_id"]
    
    # Generate token
    headless_token = jwt.encode(
        {"project_id": project_id, "user_id": user_id, "is_pro": True, "exp": datetime.utcnow() + timedelta(minutes=5)},
        "super-secret-headless-key",
        algorithm="HS256"
    )
    
    frontend_url = "https://thecosmofolio.com"
    print_url = f"{frontend_url}/dashboard/portfolio-book/{project_id}?headless_token={headless_token}"
    print("Navigating to:", print_url)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        # Log console messages
        page.on("console", lambda msg: print(f"[BROWSER CONSOLE] {msg.text}"))
        page.on("pageerror", lambda err: print(f"[BROWSER ERROR] {err}"))
        
        try:
            print("Loading page...")
            await page.goto(print_url, wait_until="domcontentloaded", timeout=30000)
            
            # Wait 10 seconds to see what renders
            print("Waiting 10 seconds...")
            await asyncio.sleep(10)
            
            # Take screenshot
            screenshot_path = os.path.abspath("playwright_screenshot.png")
            await page.screenshot(path=screenshot_path)
            print("Screenshot saved to:", screenshot_path)
            
            # Check if render-complete is in DOM
            has_complete = await page.evaluate("() => !!document.getElementById('render-complete')")
            print("Has #render-complete:", has_complete)
            
            # Check the body HTML
            body_text = await page.evaluate("() => document.body.innerText")
            print("Body text snippet:", body_text[:500])
            
        except Exception as e:
            print("Error during test:", e)
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
