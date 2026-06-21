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

migrations_path = Path(__file__).parent / "migrations_coupons.sql"
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
    if not stmt:
        continue
    try:
        print(f"Executing statement {i}...")
        res = requests.post(rpc_url, headers=headers, json={"sql": stmt})
        if res.status_code >= 400:
            print(f"Failed: {res.status_code} - {res.text}")
        else:
            print("Success!")
    except Exception as e:
        print(f"Failed: {e}")

