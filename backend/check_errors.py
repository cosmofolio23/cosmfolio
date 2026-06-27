import os
import sys
from dotenv import load_dotenv

# Load from .env if running locally
load_dotenv('.env')
load_dotenv('.env.production')

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Missing Supabase credentials")
    sys.exit(1)

try:
    from supabase import create_client, Client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    res = supabase.table("error_logs").select("*").order("created_at", desc=True).limit(10).execute()
    print("Latest 10 Error Logs:")
    for row in res.data:
        print(f"[{row.get('created_at')}] Type: {row.get('error_type')} | Msg: {row.get('error_message')}")
except Exception as e:
    print(f"Error querying Supabase: {e}")
