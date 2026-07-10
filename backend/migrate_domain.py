import os
import sys
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: credentials missing")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

sql = "ALTER TABLE projects ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255) UNIQUE;"

try:
    response = supabase.rpc("exec_sql", {"sql": sql}).execute()
    print("Migration successful: ", response)
except Exception as e:
    print(f"RPC exec_sql failed (might not exist): {e}")
    print("\nPlease run this SQL manually in your Supabase SQL Editor:")
    print("-" * 40)
    print(sql)
    print("-" * 40)
