import logging
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image
from extractor_core import generate_template, OUTPUT_DIR, PREVIEWS_DIR

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

SCRIPT_DIR = Path(__file__).parent.resolve()
INPUT_DIR = SCRIPT_DIR / "input"

for d in [INPUT_DIR, OUTPUT_DIR, PREVIEWS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

def process_pdf(pdf_path):
    stem = pdf_path.stem
    logging.info(f"Processing {pdf_path.name}...")
    try:
        doc = fitz.open(str(pdf_path))
    except Exception as e:
        logging.error(f"Failed to open {pdf_path.name}: {e}")
        return
        
    page_count = doc.page_count
    if page_count == 0:
        logging.warning(f"No pages in {pdf_path.name}")
        return
        
    pages_data = []
    for i in range(page_count):
        page = doc.load_page(i)
        pix = page.get_pixmap(dpi=120)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        # Real text + font-size spans for content extraction
        text = page.get_text("text")
        spans = []
        try:
            d = page.get_text("dict")
            for block in d.get("blocks", []):
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        t = span.get("text", "").strip()
                        if t:
                            spans.append((round(span.get("size", 0), 1), t))
        except Exception:
            pass

        try:
            image_count = len(page.get_images(full=True))
        except Exception:
            image_count = 0

        pages_data.append({
            "image": img,
            "text": text,
            "spans": spans,
            "image_count": image_count,
        })

    generate_template(pages_data, stem, source="pdf-extract")

def main():
    if not INPUT_DIR.exists():
        logging.warning(f"Input directory not found: {INPUT_DIR}")
        return
        
    pdfs = list(INPUT_DIR.glob("*.pdf"))
    if not pdfs:
        logging.info(f"No PDFs found in {INPUT_DIR}")
        return
        
    for pdf in pdfs:
        process_pdf(pdf)

if __name__ == "__main__":
    main()
