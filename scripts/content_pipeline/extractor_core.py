import json
import logging
import re
import colorsys
from pathlib import Path
import numpy as np
from sklearn.cluster import KMeans

SCRIPT_DIR = Path(__file__).parent.resolve()
ROOT_DIR = SCRIPT_DIR.parent.parent
OUTPUT_DIR = SCRIPT_DIR / "output"
PREVIEWS_DIR = SCRIPT_DIR / "previews"
TEMPLATES_JSON = ROOT_DIR / "templates_library" / "templates.json"

for d in [OUTPUT_DIR, PREVIEWS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

def _to_hex(color):
    return "#{:02x}{:02x}{:02x}".format(
        max(0, min(255, int(color[0]))),
        max(0, min(255, int(color[1]))),
        max(0, min(255, int(color[2]))),
    )

def _brightness(rgb):
    return float(np.mean(rgb))

def _saturation(rgb):
    r, g, b = [x / 255.0 for x in rgb]
    _, s, _ = colorsys.rgb_to_hsv(r, g, b)
    return s

def extract_colors(images):
    """Extract a usable 6-role palette.

    Samples the cover PLUS a few interior pages so brand/accent colours that only
    appear inside the book are captured (a white cover alone yields a flat grey
    palette). The accent is the most *saturated* cluster after near-white and
    near-black are filtered out, so we never surface a grey as the accent.
    """
    if not isinstance(images, list):
        images = [images]

    # Always sample the cover; add interior quartile pages for true brand colour.
    sample = [images[0]]
    if len(images) > 2:
        n = len(images)
        for idx in {n // 4, n // 2, (3 * n) // 4}:
            sample.append(images[idx])

    pixel_blocks = []
    for im in sample:
        small = im.convert("RGB").resize((120, 120))
        pixel_blocks.append(np.array(small).reshape(-1, 3))
    arr = np.concatenate(pixel_blocks, axis=0)

    k = 8
    kmeans = KMeans(n_clusters=k, n_init=10, random_state=42)
    labels = kmeans.fit_predict(arr)
    centers = kmeans.cluster_centers_
    unique, counts = np.unique(labels, return_counts=True)
    size = {int(u): int(c) for u, c in zip(unique, counts)}
    by_freq = sorted(range(k), key=lambda i: size.get(i, 0), reverse=True)

    # Background: bright AND common (the page field). Weight brightness by frequency.
    bg_idx = max(range(k), key=lambda i: _brightness(centers[i]) * (size.get(i, 0) ** 0.3))
    # Text: the darkest cluster.
    text_idx = min(range(k), key=lambda i: _brightness(centers[i]))

    # Accent: most saturated vivid cluster (exclude near-white / near-black / greys).
    vivid = [i for i in range(k)
             if 25 < _brightness(centers[i]) < 235 and _saturation(centers[i]) > 0.18]
    if vivid:
        accent_idx = max(vivid, key=lambda i: _saturation(centers[i]) * (size.get(i, 0) ** 0.15))
    else:
        # Genuinely monochrome portfolio — use a mid-dark tone as a charcoal accent
        # rather than a washed-out grey that reads as broken.
        mids = sorted((i for i in range(k) if i != bg_idx),
                      key=lambda i: _brightness(centers[i]))
        accent_idx = mids[len(mids) // 3] if mids else text_idx

    assigned = {bg_idx, text_idx, accent_idx}
    rest = [i for i in by_freq if i not in assigned]
    primary_idx = rest[0] if rest else text_idx
    muted_idx = rest[1] if len(rest) > 1 else primary_idx
    secondary_idx = rest[2] if len(rest) > 2 else muted_idx

    return {
        "background": _to_hex(centers[bg_idx]),
        "text": _to_hex(centers[text_idx]),
        "accent": _to_hex(centers[accent_idx]),
        "primary": _to_hex(centers[primary_idx]),
        "muted": _to_hex(centers[muted_idx]),
        "secondary": _to_hex(centers[secondary_idx]),
    }

def layout_heuristics(pil_img):
    w, h = pil_img.size
    arr = np.array(pil_img.convert('L'))
    
    zones = {}
    for row in range(3):
        for col in range(3):
            y0, y1 = row * h // 3, (row + 1) * h // 3
            x0, x1 = col * w // 3, (col + 1) * w // 3
            zones[(row, col)] = np.mean(arr[y0:y1, x0:x1])

    dark_threshold = 140
    dark_zones = [(r, c) for (r, c), v in zones.items() if v < dark_threshold]
    light_zones = [(r, c) for (r, c), v in zones.items() if v >= dark_threshold]

    if len(dark_zones) >= 7:
        image_zone = 'full-bleed'
    elif all(c == 0 for r, c in dark_zones) and dark_zones:
        image_zone = 'left-half'
    elif all(c == 2 for r, c in dark_zones) and dark_zones:
        image_zone = 'right-half'
    elif all(r == 0 for r, c in dark_zones) and dark_zones:
        image_zone = 'top-third'
    elif all(r == 2 for r, c in dark_zones) and dark_zones:
        image_zone = 'bottom-third'
    elif len(dark_zones) >= 3:
        image_zone = 'hero-top'
    else:
        image_zone = 'minimal'

    stripe_vars = []
    for col in range(6):
        x0, x1 = col * w // 6, (col + 1) * w // 6
        stripe_vars.append(np.var(arr[:, x0:x1]))
    col_changes = sum(1 for i in range(1, len(stripe_vars))
                      if abs(stripe_vars[i] - stripe_vars[i-1]) > 500)
                      
    if col_changes >= 4:
        grid_type = '3-column'
    elif col_changes >= 2:
        grid_type = '2-column'
    else:
        grid_type = '1-column'

    if dark_zones:
        rows_used = set(r for r, c in dark_zones)
        cols_used = set(c for r, c in dark_zones)
        ratio_w = len(cols_used)
        ratio_h = len(rows_used)
        if ratio_w > ratio_h:
            image_ratio = '16:9'
        elif ratio_h > ratio_w:
            image_ratio = '3:4'
        else:
            image_ratio = '1:1'
    else:
        image_ratio = '4:3'

    return {
        'image_zone': image_zone,
        'grid_type': grid_type,
        'image_ratio': image_ratio,
        'mean_brightness': float(np.mean(arr)),
        'dark_zone_count': len(dark_zones)
    }

def get_next_cosmo_number(output_json_path):
    if output_json_path.exists():
        try:
            with open(output_json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                match = re.search(r'cosmo-special-(\d+)', data.get("id", ""))
                if match:
                    return int(match.group(1))
        except Exception:
            pass
            
    max_num = 0
    
    # Check templates.json
    if TEMPLATES_JSON.exists():
        try:
            with open(TEMPLATES_JSON, 'r', encoding='utf-8-sig') as f:
                templates = json.load(f)
                for t in templates:
                    match = re.search(r'cosmo-special-(\d+)', t.get("id", ""))
                    if match:
                        num = int(match.group(1))
                        if num > max_num:
                            max_num = num
        except Exception as e:
            logging.warning(f"Error reading templates.json: {e}")
            
    # Also check output directory for already processed but unmerged files
    for jpath in OUTPUT_DIR.glob("*.json"):
        if jpath == output_json_path:
            continue
        try:
            with open(jpath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                match = re.search(r'cosmo-special-(\d+)', data.get("id", ""))
                if match:
                    num = int(match.group(1))
                    if num > max_num:
                        max_num = num
        except Exception:
            pass
            
    return max_num + 1

_RESUME_KW = ('education', 'experience', 'skills', 'software', 'curriculum',
              'bachelor', 'master', 'internship', 'employment', 'languages')
_ABOUT_KW = ('about', 'i am', "i'm", 'designer', 'architect', 'passionate',
             'biography', 'profile', 'hello')
_CONTENTS_KW = ('contents', 'index', 'table of', 'projects')
_CONTACT_KW = ('contact', 'email', 'phone', '@', 'www', 'linkedin', 'instagram')


def _clean(text, limit=600):
    text = (text or '').replace('�', "'")  # PDF font glitch → apostrophe
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text).strip()
    return text[:limit].strip()


def _despace(s):
    """Collapse letter-tracked titles ('A r c h i t e c t u r e' -> 'Architecture')."""
    s = (s or '').replace('�', "'").strip()
    toks = s.split(' ')
    if len(toks) >= 3 and sum(1 for t in toks if len(t) == 1) / len(toks) > 0.6:
        words, word = [], ''
        for t in toks:
            if t == '':
                if word:
                    words.append(word)
                    word = ''
            else:
                word += t
        if word:
            words.append(word)
        return ' '.join(words)
    return s


def extract_page_content(pages_data):
    """Pull real text from the PDF and bucket it by page type.

    pages_data[i] = {'text': str, 'spans': [(font_size, text), ...], 'image_count': int}
    Returns a dict of sample content the editor can seed pages with.
    """
    content = {'title': '', 'author': '', 'about': '', 'resume': '',
               'contents': [], 'project_titles': [], 'contact': ''}
    if not pages_data:
        return content

    # Cover: biggest text line = portfolio name; second biggest = author/subtitle.
    cover_spans = sorted(pages_data[0].get('spans', []), key=lambda s: s[0], reverse=True)
    big = [t.strip() for sz, t in cover_spans if t.strip()]
    if big:
        content['title'] = _despace(big[0])[:80]
    if len(big) > 1:
        content['author'] = _despace(big[1])[:80]

    for i, pd in enumerate(pages_data):
        text = pd.get('text', '') or ''
        low = text.lower()
        if not text.strip():
            continue
        if not content['resume'] and sum(kw in low for kw in _RESUME_KW) >= 2:
            content['resume'] = _clean(text, 900)
        if not content['about'] and 0 < i < len(pages_data) - 1 \
                and any(kw in low for kw in _ABOUT_KW) and len(text) > 150:
            content['about'] = _clean(text, 600)
        if any(kw in low for kw in _CONTENTS_KW) and i < 4:
            lines = [ln.strip().replace('�', "'") for ln in text.splitlines()
                     if 2 < len(ln.strip()) < 60]
            if lines:
                content['contents'] = lines[:12]
        if not content['contact'] and i >= len(pages_data) - 2 \
                and any(kw in low for kw in _CONTACT_KW):
            content['contact'] = _clean(text, 300)
        # Project titles: short, prominent lines on image-heavy interior pages.
        if pd.get('image_count', 0) >= 1 and 0 < i < len(pages_data) - 1:
            spans = sorted(pd.get('spans', []), key=lambda s: s[0], reverse=True)
            for sz, t in spans[:2]:
                t = t.strip()
                if 3 < len(t) < 50 and t not in content['project_titles']:
                    content['project_titles'].append(t)

    content['project_titles'] = content['project_titles'][:8]
    return content


def generate_template_from_images(images_list, stem, source="pdf-extract"):
    """Image-only entry point (e.g. Behance scrape) — no text available."""
    pages_data = [{'image': im, 'text': '', 'spans': [], 'image_count': 0}
                  for im in (images_list or [])]
    return generate_template(pages_data, stem, source)


def generate_template(pages_data, stem, source="pdf-extract"):
    if not pages_data:
        logging.warning(f"No pages provided for {stem}")
        return

    images_list = [pd['image'] for pd in pages_data]
    output_json = OUTPUT_DIR / f"{stem}.json"
    page_count = len(images_list)

    cover_img = images_list[0]
    orientation = "landscape" if cover_img.width > cover_img.height else "portrait"

    colors = extract_colors(images_list)
    extracted_content = extract_page_content(pages_data)

    classified = {'cover': None, 'project': None, 'about': None, 'resume': None, 'contents': None}

    classified['cover'] = layout_heuristics(images_list[0])
    if page_count > 1:
        classified['contact'] = layout_heuristics(images_list[-1])

    for i, img in enumerate(images_list):
        if i == 0 or i == page_count - 1:
            continue
        h = layout_heuristics(img)
        b = h['mean_brightness']
        d = h['dark_zone_count']

        if b > 200 and h['grid_type'] != '1-column':
            if page_count > 6 and classified['resume'] is None:
                classified['resume'] = h
            elif i < 3 and classified['contents'] is None:
                classified['contents'] = h
        elif d >= 4 and classified['project'] is None:
            classified['project'] = h
        elif 0 < d < 4 and classified['about'] is None:
            classified['about'] = h

    fallback = {'image_zone': 'minimal', 'grid_type': '1-column', 'image_ratio': '4:3'}
    for k in ['cover', 'project', 'about', 'resume', 'contents']:
        if classified.get(k) is None:
            classified[k] = fallback

    preview_w = 400
    preview_h = int(preview_w * cover_img.height / cover_img.width)
    preview_img = cover_img.resize((preview_w, preview_h))
    preview_path = PREVIEWS_DIR / f"{stem}_cover.png"
    preview_img.save(preview_path)

    next_n = get_next_cosmo_number(output_json)
    
    layouts = {}
    for k in ['cover', 'project', 'about']:
        layouts[k] = {
            "structure": classified[k]['image_zone'],
            "grid": classified[k]['grid_type'],
            "image_ratio": classified[k]['image_ratio']
        }
    layouts['resume'] = {
        "structure": "columns",
        "grid": classified['resume']['grid_type'],
        "image_ratio": "1:1"
    }
    layouts['contents'] = {
        "structure": "index",
        "grid": "1-column",
        "image_ratio": "1:1"
    }
    
    template_data = {
        "id": f"cosmo-special-{next_n}",
        "name": f"Cosmo Special {next_n}",
        "category": "Cosmo Special",
        "source": source,
        "origin_file": stem,
        "orientation": orientation,
        "page_count": page_count,
        "preview_image": f"scripts/content_pipeline/previews/{stem}_cover.png",
        "colors": colors,
        "fonts": { "heading": "Georgia", "body": "Inter" },
        "layouts": layouts,
        "extracted_content": extracted_content,
        "placeholders": { "renders": 5, "plans": 2, "sections": 1 },
        "description": f"Cosmo Special {next_n} — extracted from {stem}",
        "layout_ids": {
            "cover":    f"cosmo-special-{next_n}-cover",
            "project":  f"cosmo-special-{next_n}-project",
            "about":    f"cosmo-special-{next_n}-about",
            "resume":   f"cosmo-special-{next_n}-resume",
            "contents": f"cosmo-special-{next_n}-contents"
        }
    }
    
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(template_data, f, indent=2)
        
    logging.info(f"Successfully extracted {stem} to {output_json.name}")
