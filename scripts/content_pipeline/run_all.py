import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent.resolve()
OUTPUT_DIR = SCRIPT_DIR / "output"
INPUT_DIR = SCRIPT_DIR / "input"

def run_script(script_name):
    print(f"\n--- Running {script_name} ---")
    script_path = SCRIPT_DIR / script_name
    result = subprocess.run([sys.executable, str(script_path)], capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
    if result.returncode != 0:
        print(f"Error: {script_name} failed with exit code {result.returncode}")
        sys.exit(result.returncode)

def main():
    pdfs_count = len(list(INPUT_DIR.glob("*.pdf"))) if INPUT_DIR.exists() else 0
    jsons_before = len(list(OUTPUT_DIR.glob("*.json"))) if OUTPUT_DIR.exists() else 0
    
    run_script("extract_template.py")
    
    jsons_after = len(list(OUTPUT_DIR.glob("*.json"))) if OUTPUT_DIR.exists() else 0
    new_templates = jsons_after # Or jsons_after - jsons_before if we only want newly generated this run
    # Let's consider all processed this run
    new_templates = max(0, jsons_after - jsons_before)
    
    run_script("generate_layouts.py")
    run_script("merge_templates.py")
    
    added_layouts = 0
    ts_file = OUTPUT_DIR / "cosmo_special_layouts.ts"
    if ts_file.exists():
        with open(ts_file, 'r', encoding='utf-8') as f:
            content = f.read()
            added_layouts = content.count("id: '")
            
    print("\n--- Final Summary ---")
    print(f"* Processed {pdfs_count} PDFs")
    print(f"* Added {new_templates} templates as \"Cosmo Special ...\"")
    print(f"* Added {added_layouts} layouts to layoutSpecs.ts")
    print("* Reload /dashboard/templates to see your new templates")

if __name__ == "__main__":
    main()
