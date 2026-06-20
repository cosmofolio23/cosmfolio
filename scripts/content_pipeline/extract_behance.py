import sys
import time
import requests
import logging
from io import BytesIO
from pathlib import Path
from PIL import Image
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

from extractor_core import generate_template_from_images

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def get_project_slug(url):
    # e.g. https://www.behance.net/gallery/19876543/My-Awesome-Portfolio
    path = urlparse(url).path
    parts = path.strip('/').split('/')
    if len(parts) >= 3 and parts[0] == 'gallery':
        return parts[2]
    elif len(parts) >= 1:
        return parts[-1]
    return "behance-project"

def extract_behance(url):
    stem = get_project_slug(url)
    logging.info(f"Extracting Behance project: {stem}")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        logging.info("Navigating to URL...")
        page.goto(url, wait_until="domcontentloaded")
        
        # Accept cookies if the banner is there (to unblock view)
        try:
            page.locator("button#onetrust-accept-btn-handler").click(timeout=3000)
        except Exception:
            pass
            
        logging.info("Scrolling to force lazy-load images...")
        # Behance heavily relies on lazy loading. We must scroll down slowly.
        last_height = page.evaluate("document.body.scrollHeight")
        while True:
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(2)
            new_height = page.evaluate("document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height
            
        logging.info("Gathering image URLs...")
        # Usually project images have class 'image-module' or are inside 'Project-content'
        img_locators = page.locator("div#project-modules img").all()
        if not img_locators:
            # Fallback
            img_locators = page.locator("img").all()
            
        image_urls = []
        for img in img_locators:
            src = img.get_attribute("src")
            # Filter for actual project modules, typically they have "project_modules" in URL
            if src and "project_modules" in src:
                # Get the highest resolution (fs, max_1200, etc)
                # Sometimes Behance sets srcset. Let's just use src if it's high res, or find it in srcset
                srcset = img.get_attribute("srcset")
                best_src = src
                if srcset:
                    # srcset format: "url1 1x, url2 2x" or "url1 300w, url2 1200w"
                    parts = srcset.split(',')
                    best_width = 0
                    for part in parts:
                        part = part.strip()
                        if not part: continue
                        tokens = part.split(' ')
                        if len(tokens) == 2:
                            url_part, width_part = tokens
                            if width_part.endswith('w'):
                                w = int(width_part[:-1])
                                if w > best_width:
                                    best_width = w
                                    best_src = url_part
                
                if best_src not in image_urls:
                    image_urls.append(best_src)
                    
        browser.close()
        
    if not image_urls:
        logging.warning("No project images found on the page.")
        return
        
    logging.info(f"Found {len(image_urls)} images. Downloading...")
    pages_images = []
    
    for i, img_url in enumerate(image_urls):
        try:
            response = requests.get(img_url, timeout=10)
            if response.status_code == 200:
                img = Image.open(BytesIO(response.content)).convert("RGB")
                pages_images.append(img)
                logging.info(f"  Downloaded {i+1}/{len(image_urls)}")
            else:
                logging.warning(f"  Failed to download {img_url} (status {response.status_code})")
        except Exception as e:
            logging.error(f"  Error downloading {img_url}: {e}")
            
    if not pages_images:
        logging.warning("No images were successfully downloaded.")
        return
        
    logging.info("Generating template from images...")
    generate_template_from_images(pages_images, stem, source="behance-extract")
    logging.info("Behance extraction complete.")

def main():
    if len(sys.argv) < 2:
        print("Usage: python extract_behance.py <behance_url>")
        sys.exit(1)
        
    url = sys.argv[1]
    if not url.startswith("http"):
        print("Error: URL must start with http:// or https://")
        sys.exit(1)
        
    extract_behance(url)

if __name__ == "__main__":
    main()
