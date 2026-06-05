"""
Template Import Script
Imports portfolio and sheet templates from JSON files to Supabase
Run this once during database setup
"""
import json
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from database import supabase

def load_json_file(filepath):
    """Load JSON file and return data"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"[ERROR] Failed to load {filepath}: {e}")
        return None

def import_portfolio_templates():
    """Import portfolio templates from templates.json"""
    print("\n" + "="*60)
    print("IMPORTING PORTFOLIO TEMPLATES")
    print("="*60)

    # Find templates.json
    possible_paths = [
        Path(__file__).parent.parent.parent / "templates_library" / "templates.json",
        Path(__file__).parent.parent.parent / "ArchPortfolio_Generator" / "templates_library" / "templates.json",
        Path("templates_library") / "templates.json",
    ]

    templates_file = None
    for path in possible_paths:
        if path.exists():
            templates_file = path
            break

    if not templates_file:
        print("[ERROR] templates.json not found")
        print(f"Searched in: {possible_paths}")
        return False

    print(f"[OK] Found templates.json at: {templates_file}")

    # Load templates
    templates_data = load_json_file(templates_file)
    if not templates_data:
        return False

    if not isinstance(templates_data, list):
        print(f"[ERROR] Expected list of templates, got {type(templates_data)}")
        return False

    print(f"[OK] Loaded {len(templates_data)} templates from JSON")

    # Import to Supabase
    if not supabase:
        print("[ERROR] Supabase not initialized")
        return False

    success_count = 0
    error_count = 0

    for template in templates_data:
        try:
            # Validate required fields
            required_fields = ["id", "name", "category", "colors", "fonts", "layouts", "placeholders"]
            missing_fields = [f for f in required_fields if f not in template]

            if missing_fields:
                print(f"[SKIP] Template {template.get('id', '?')}: Missing fields: {missing_fields}")
                error_count += 1
                continue

            # Insert into database
            response = supabase.table("portfolio_templates").insert([{
                "id": template["id"],
                "name": template["name"],
                "category": template["category"],
                "description": template.get("description"),
                "source": template.get("source", "ai-generated"),
                "colors": template["colors"],
                "fonts": template["fonts"],
                "layouts": template["layouts"],
                "placeholders": template["placeholders"],
                "preview_image": template.get("preview_image"),
                "style_notes": template.get("style_notes"),
                "page_count_range": template.get("page_count_range"),
                "orientation": template.get("orientation", "portrait_A4"),
            }]).execute()

            print(f"[OK] {template['id']:12} {template['name'][:40]:40} - SUCCESS")
            success_count += 1

        except Exception as e:
            error_msg = str(e)
            if "duplicate key" in error_msg.lower():
                print(f"[SKIP] {template.get('id', '?'):12} {template.get('name', '?')[:40]:40} - ALREADY EXISTS")
            else:
                print(f"[ERROR] {template.get('id', '?'):12} {template.get('name', '?')[:40]:40} - {error_msg[:50]}")
            error_count += 1

    print(f"\n[SUMMARY] Portfolio Templates")
    print(f"  Imported: {success_count}")
    print(f"  Errors:   {error_count}")
    print(f"  Total:    {success_count + error_count}")

    return error_count == 0

def import_sheet_templates():
    """Import sheet templates from sheets.json"""
    print("\n" + "="*60)
    print("IMPORTING SHEET TEMPLATES")
    print("="*60)

    # Find sheets.json
    possible_paths = [
        Path(__file__).parent.parent.parent / "sheets_library" / "sheets.json",
        Path(__file__).parent.parent.parent / "ArchPortfolio_Generator" / "sheets_library" / "sheets.json",
        Path("sheets_library") / "sheets.json",
    ]

    sheets_file = None
    for path in possible_paths:
        if path.exists():
            sheets_file = path
            break

    if not sheets_file:
        print("[ERROR] sheets.json not found")
        print(f"Searched in: {possible_paths}")
        return False

    print(f"[OK] Found sheets.json at: {sheets_file}")

    # Load templates
    sheets_data = load_json_file(sheets_file)
    if not sheets_data:
        return False

    if not isinstance(sheets_data, list):
        print(f"[ERROR] Expected list of sheet templates, got {type(sheets_data)}")
        return False

    print(f"[OK] Loaded {len(sheets_data)} sheet templates from JSON")

    # Import to Supabase
    if not supabase:
        print("[ERROR] Supabase not initialized")
        return False

    success_count = 0
    error_count = 0

    for template in sheets_data:
        try:
            # Validate required fields
            required_fields = ["id", "name", "sheet_type", "colors", "fonts", "layout_zones"]
            missing_fields = [f for f in required_fields if f not in template]

            if missing_fields:
                print(f"[SKIP] Template {template.get('id', '?')}: Missing fields: {missing_fields}")
                error_count += 1
                continue

            # Insert into database
            response = supabase.table("sheet_templates").insert([{
                "id": template["id"],
                "name": template["name"],
                "sheet_type": template["sheet_type"],
                "category": template.get("category"),
                "description": template.get("description"),
                "source": template.get("source", "ai-generated"),
                "colors": template["colors"],
                "fonts": template["fonts"],
                "layout_zones": template["layout_zones"],
                "format": template.get("format"),
                "aspect_ratio": template.get("aspect_ratio"),
                "preview_image": template.get("preview_image"),
                "style_notes": template.get("style_notes"),
                "content_requirements": template.get("content_requirements"),
            }]).execute()

            print(f"[OK] {template['id']:12} {template['name'][:40]:40} - SUCCESS")
            success_count += 1

        except Exception as e:
            error_msg = str(e)
            if "duplicate key" in error_msg.lower():
                print(f"[SKIP] {template.get('id', '?'):12} {template.get('name', '?')[:40]:40} - ALREADY EXISTS")
            else:
                print(f"[ERROR] {template.get('id', '?'):12} {template.get('name', '?')[:40]:40} - {error_msg[:50]}")
            error_count += 1

    print(f"\n[SUMMARY] Sheet Templates")
    print(f"  Imported: {success_count}")
    print(f"  Errors:   {error_count}")
    print(f"  Total:    {success_count + error_count}")

    return error_count == 0

def create_default_compatibility_mappings():
    """Create default compatibility mappings between templates"""
    print("\n" + "="*60)
    print("CREATING COMPATIBILITY MAPPINGS")
    print("="*60)

    if not supabase:
        print("[ERROR] Supabase not initialized")
        return False

    try:
        # Get all portfolio templates
        portfolio_response = supabase.table("portfolio_templates").select("id").execute()
        portfolio_ids = [item["id"] for item in portfolio_response.data]

        # Get all sheet templates
        sheet_response = supabase.table("sheet_templates").select("id").execute()
        sheet_ids = [item["id"] for item in sheet_response.data]

        print(f"[OK] Found {len(portfolio_ids)} portfolio templates")
        print(f"[OK] Found {len(sheet_ids)} sheet templates")

        # Create all possible combinations with default score of 0.8
        # (compatibility scoring can be refined later)
        mappings = []
        for portfolio_id in portfolio_ids:
            for sheet_id in sheet_ids[:20]:  # Limit to first 20 sheets per portfolio for now
                mappings.append({
                    "portfolio_template_id": portfolio_id,
                    "sheet_template_id": sheet_id,
                    "compatibility_score": 0.8,
                    "recommended": False,
                })

        if mappings:
            # Try to insert mappings (will skip if they already exist)
            try:
                supabase.table("template_compatibility").insert(mappings).execute()
                print(f"[OK] Created {len(mappings)} compatibility mappings")
            except Exception as e:
                if "duplicate" in str(e).lower():
                    print(f"[INFO] Compatibility mappings already exist")
                else:
                    print(f"[WARNING] Could not create all mappings: {e}")

        return True

    except Exception as e:
        print(f"[ERROR] Failed to create compatibility mappings: {e}")
        return False

def main():
    """Main import function"""
    print("\n" + "="*60)
    print("COSMOFOLIO TEMPLATE IMPORT SCRIPT")
    print("="*60)
    print(f"Started: {datetime.now().isoformat()}")

    # Verify Supabase connection
    if not supabase:
        print("[ERROR] Cannot connect to Supabase")
        print("Make sure SUPABASE_URL and SUPABASE_KEY are set")
        return False

    print("[OK] Supabase connected")

    # Import templates
    portfolio_ok = import_portfolio_templates()
    sheet_ok = import_sheet_templates()

    # Create compatibility mappings (optional)
    # compat_ok = create_default_compatibility_mappings()

    print("\n" + "="*60)
    print("IMPORT COMPLETE")
    print("="*60)
    print(f"Portfolio Templates: {'✅ OK' if portfolio_ok else '❌ FAILED'}")
    print(f"Sheet Templates:     {'✅ OK' if sheet_ok else '❌ FAILED'}")
    print(f"Finished: {datetime.now().isoformat()}")

    return portfolio_ok and sheet_ok

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
