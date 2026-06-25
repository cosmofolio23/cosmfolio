import os
import sys
import json
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

migrations_path = Path(__file__).parent / "migrations_ambassadors.sql"
with open(migrations_path, 'r') as f:
    sql = f.read()

statements = [s.strip() for s in sql.split(';') if s.strip()]

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}
rpc_url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"

for i, stmt in enumerate(statements, 1):
    print(f"\nExecuting statement {i}/{len(statements)}:")
    print(stmt[:100] + "..." if len(stmt) > 100 else stmt)
    payload = {"query": stmt}
    res = requests.post(rpc_url, headers=headers, json=payload)
    if res.status_code >= 400:
        print(f"Error {res.status_code}: {res.text}")
    else:
        print("Success")

print("\nAmbassador Migrations complete!")
