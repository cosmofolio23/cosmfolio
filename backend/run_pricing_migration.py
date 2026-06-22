import os
import requests
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

migrations_path = Path(__file__).parent / "migrations_pricing.sql"

with open(migrations_path, 'r') as f:
    migrations_sql = f.read()

statements = [s.strip() for s in migrations_sql.split(';') if s.strip()]

for i, statement in enumerate(statements, 1):
    if statement.startswith('--') or not statement:
        continue
    print(f"[{i}/{len(statements)}] Executing...")
    
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    data = {"sql": statement}
    
    response = requests.post(url, headers=headers, json=data)
    if response.status_code >= 400:
        print(f"X Failed: {response.text}")
    else:
        print(f"O Completed")

print("Migration complete!")
