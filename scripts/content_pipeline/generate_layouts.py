import json
import logging
from pathlib import Path
import re

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

SCRIPT_DIR = Path(__file__).parent.resolve()
OUTPUT_DIR = SCRIPT_DIR / "output"
FRONTEND_SPECS_PATH = SCRIPT_DIR.parent.parent / "frontend" / "src" / "components" / "composer" / "layoutSpecs.ts"

def get_regions(page_type, image_zone, grid_type):
    regions = []
    if page_type == 'resume':
        return [
            "{ role:'title',  x:5,  y:5,  w:90,  h:10 }",
            "{ role:'meta',   x:5,  y:18, w:40,  h:60 }",
            "{ role:'body',   x:48, y:18, w:47,  h:75 }"
        ]
    if page_type == 'contents':
        return [
            "{ role:'title',    x:5,  y:5,  w:90, h:10 }",
            "{ role:'contents', x:5,  y:20, w:90, h:75 }"
        ]
        
    if image_zone == 'full-bleed':
        regions = [
            "{ role:'render', x:0,  y:0,   w:100, h:100 }",
            "{ role:'title',  x:5,  y:70,  w:60,  h:15  }",
            "{ role:'meta',   x:5,  y:86,  w:50,  h:8   }"
        ]
    elif image_zone == 'left-half':
        regions = [
            "{ role:'render', x:0,  y:0,  w:50, h:100 }",
            "{ role:'title',  x:55, y:20, w:40, h:20  }",
            "{ role:'body',   x:55, y:45, w:40, h:40  }"
        ]
    elif image_zone == 'right-half':
        regions = [
            "{ role:'title',  x:5,  y:20, w:40, h:20  }",
            "{ role:'body',   x:5,  y:45, w:40, h:40  }",
            "{ role:'render', x:50, y:0,  w:50, h:100 }"
        ]
    elif image_zone == 'top-third':
        regions = [
            "{ role:'render', x:0,  y:0,  w:100, h:45 }",
            "{ role:'title',  x:5,  y:50, w:55,  h:15 }",
            "{ role:'body',   x:5,  y:68, w:90,  h:25 }"
        ]
    elif image_zone == 'hero-top':
        regions = [
            "{ role:'render', x:0,  y:0,  w:100, h:60 }",
            "{ role:'title',  x:5,  y:63, w:60,  h:12 }",
            "{ role:'meta',   x:5,  y:77, w:90,  h:10 }",
            "{ role:'body',   x:5,  y:88, w:90,  h:10 }"
        ]
    elif image_zone == 'bottom-third':
        regions = [
            "{ role:'title',  x:5,  y:5,  w:90,  h:15 }",
            "{ role:'body',   x:5,  y:25, w:90,  h:30 }",
            "{ role:'render', x:0,  y:58, w:100, h:42 }"
        ]
    elif image_zone == 'minimal':
        regions = [
            "{ role:'title',  x:10, y:30, w:80, h:20 }",
            "{ role:'body',   x:10, y:55, w:80, h:35 }"
        ]
    else:
        # Fallback
        regions = [
            "{ role:'title',  x:10, y:30, w:80, h:20 }",
            "{ role:'body',   x:10, y:55, w:80, h:35 }"
        ]
        
    if page_type == 'project' and grid_type == '2-column':
        regions.append("{ role:'render', x:52, y:0, w:48, h:50 }")
        
    return regions

def format_layout_spec(spec_id, name, category, page_type, image_count, regions, kind=None):
    kind_str = f",\n    kind: '{kind}'" if kind else ""
    regions_str = ",\n      ".join(regions)
    return f"""  {{
    id: '{spec_id}',
    name: '{name}',
    category: '{category}',
    suits: ['{page_type}'],
    imageCount: {image_count}{kind_str},
    regions: [
      {regions_str}
    ]
  }}"""

def main():
    if not OUTPUT_DIR.exists():
        logging.warning(f"Output directory not found: {OUTPUT_DIR}")
        return
        
    jsons = list(OUTPUT_DIR.glob("*.json"))
    if not jsons:
        logging.info("No JSONs found to process.")
        return
        
    layout_specs_strs = []
    new_spec_ids = []
    
    for jpath in jsons:
        with open(jpath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        template_id = data.get('id')
        if not template_id:
            continue
            
        template_name = data.get('name', 'Cosmo Special')
        layouts = data.get('layouts', {})
        layout_ids = data.get('layout_ids', {})
        
        for page_type, p_data in layouts.items():
            if not p_data:
                continue
            
            image_zone = p_data.get('structure', 'minimal')
            grid_type = p_data.get('grid', '1-column')
            spec_id = layout_ids.get(page_type, f"{template_id}-{page_type}")
            
            # Map page type to category nicely
            category = page_type.capitalize()
            if page_type == 'project':
                category = 'Single' # Usually single/duo for projects in layoutSpecs, we can use 'Single'
                
            regions = get_regions(page_type, image_zone, grid_type)
            
            # Count renders
            image_count = sum(1 for r in regions if "role:'render'" in r or "role: 'render'" in r)
            
            kind = 'overlay' if page_type == 'cover' and image_zone == 'full-bleed' else None
            
            spec_str = format_layout_spec(
                spec_id, 
                f"{template_name} · {page_type.capitalize()}", 
                category, 
                page_type, 
                image_count, 
                regions, 
                kind
            )
            layout_specs_strs.append(spec_str)
            new_spec_ids.append(spec_id)
            
    if not layout_specs_strs:
        logging.info("No layout specs generated.")
        return
        
    # Write TS snippet
    ts_snippet_path = OUTPUT_DIR / "cosmo_special_layouts.ts"
    joined_specs = ",\n".join(layout_specs_strs)
    ts_content = f"""// AUTO-GENERATED by generate_layouts.py — DO NOT EDIT BY HAND
// Append contents of this array to LAYOUT_CATALOG in layoutSpecs.ts
export const COSMO_SPECIAL_LAYOUTS: LayoutSpec[] = [
{joined_specs}
]
"""
    with open(ts_snippet_path, 'w', encoding='utf-8') as f:
        f.write(ts_content)
    logging.info(f"Wrote generated layouts to {ts_snippet_path}")
    
    # Patch layoutSpecs.ts
    if FRONTEND_SPECS_PATH.exists():
        with open(FRONTEND_SPECS_PATH, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Extract existing IDs to avoid duplicates
        existing_ids = set(re.findall(r"id:\s*'([^']+)'", content))
        
        specs_to_insert = []
        for i, sid in enumerate(new_spec_ids):
            if sid not in existing_ids:
                specs_to_insert.append(layout_specs_strs[i])
                
        if not specs_to_insert:
            logging.info("No new layouts to append to layoutSpecs.ts (all already exist).")
            return
            
        # Find the export const LAYOUT_CATALOG: LayoutSpec[] = [ and its closing bracket
        search_str = "export const LAYOUT_CATALOG: LayoutSpec[] = ["
        start_idx = content.find(search_str)
        if start_idx == -1:
            logging.error("Could not find LAYOUT_CATALOG in layoutSpecs.ts")
            return
            
        # find the closing bracket
        bracket_count = 1 # since we start after the opening '['
        in_string = False
        string_char = None
        end_idx = -1
        
        search_start = start_idx + len(search_str)
        
        for i in range(search_start, len(content)):
            c = content[i]
            if in_string:
                if c == string_char and content[i-1] != '\\':
                    in_string = False
            else:
                if c in ("'", '"', '`'):
                    in_string = True
                    string_char = c
                elif c == '[':
                    bracket_count += 1
                elif c == ']':
                    bracket_count -= 1
                    if bracket_count == 0:
                        end_idx = i
                        break
                        
        if end_idx != -1:
            # Check if there is a trailing comma before the closing bracket
            last_char_idx = end_idx - 1
            while last_char_idx > 0 and content[last_char_idx].isspace():
                last_char_idx -= 1
            
            prefix = ""
            if content[last_char_idx] != ',':
                prefix = ","
                
            insertion_str = prefix + "\n" + ",\n".join(specs_to_insert) + "\n"
            new_content = content[:end_idx] + insertion_str + content[end_idx:]
            
            with open(FRONTEND_SPECS_PATH, 'w', encoding='utf-8') as f:
                f.write(new_content)
            logging.info(f"Appended {len(specs_to_insert)} layouts to layoutSpecs.ts")
        else:
            logging.error("Could not find closing bracket for LAYOUT_CATALOG")

if __name__ == "__main__":
    main()
