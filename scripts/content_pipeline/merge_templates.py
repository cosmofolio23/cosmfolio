import json
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

SCRIPT_DIR = Path(__file__).parent.resolve()
OUTPUT_DIR = SCRIPT_DIR / "output"
TEMPLATES_JSON = SCRIPT_DIR.parent.parent / "templates_library" / "templates.json"

def main():
    if not OUTPUT_DIR.exists():
        logging.warning(f"Output directory not found: {OUTPUT_DIR}")
        return
        
    jsons = list(OUTPUT_DIR.glob("*.json"))
    if not jsons:
        logging.info("No JSONs found in output to merge.")
        return
        
    new_templates = []
    for jpath in jsons:
        with open(jpath, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
                new_templates.append(data)
            except Exception as e:
                logging.error(f"Failed to read {jpath.name}: {e}")
                
    if not new_templates:
        return
        
    existing_templates = []
    if TEMPLATES_JSON.exists():
        with open(TEMPLATES_JSON, 'r', encoding='utf-8-sig') as f:
            try:
                existing_templates = json.load(f)
            except Exception as e:
                logging.error(f"Failed to read {TEMPLATES_JSON}: {e}")
                
    # Upsert: replace an existing entry with the same id (so re-extraction with
    # improved colour/content actually propagates), append genuinely new ones.
    by_id = {t.get("id"): i for i, t in enumerate(existing_templates) if t.get("id")}

    added_count = 0
    updated_count = 0
    for nt in new_templates:
        nid = nt.get("id")
        if nid in by_id:
            existing_templates[by_id[nid]] = nt
            updated_count += 1
        else:
            by_id[nid] = len(existing_templates)
            existing_templates.append(nt)
            added_count += 1

    if added_count or updated_count:
        # Preserve the BOM — templates.json ships with one and the project is
        # BOM-sensitive; writing plain utf-8 would silently change the file.
        with open(TEMPLATES_JSON, 'w', encoding='utf-8-sig') as f:
            json.dump(existing_templates, f, indent=2)
        logging.info(f"✓ Added {added_count} templates, updated {updated_count} existing.")
    else:
        logging.info("Nothing to merge.")

if __name__ == "__main__":
    main()
