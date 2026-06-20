import sys
import subprocess
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent.resolve()

def run_script(script_name, *args):
    print(f"\n--- Running {script_name} ---")
    script_path = SCRIPT_DIR / script_name
    
    cmd = [sys.executable, str(script_path)] + list(args)
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
    if result.returncode != 0:
        print(f"Error: {script_name} failed with exit code {result.returncode}")
        sys.exit(result.returncode)

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/content_pipeline/run_behance.py <behance_url1> [behance_url2] ...")
        sys.exit(1)
        
    urls = sys.argv[1:]
    
    for url in urls:
        print(f"\n>>> Processing Behance URL: {url}")
        run_script("extract_behance.py", url)
        
    run_script("generate_layouts.py")
    run_script("merge_templates.py")
    
    print("\n--- Final Summary ---")
    print(f"* Successfully scraped and processed {len(urls)} Behance portfolio(s).")
    print("* Reload /dashboard/templates to see your new template(s)!")

if __name__ == "__main__":
    main()
