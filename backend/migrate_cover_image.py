import os
import sys
from supabase import create_client
from dotenv import load_dotenv

# Try to load production env first for real keys, fallback to standard .env
if os.path.exists(".env.production"):
    print("Loading environment from .env.production...")
    load_dotenv(".env.production")
else:
    print("Loading environment from .env...")
    load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or SUPABASE_KEY.startswith("sb_secret"):
    # If the loaded key is the mock key, let's check backend/.env.production specifically
    backend_prod = os.path.join(os.path.dirname(__file__), ".env.production")
    if os.path.exists(backend_prod):
        print(f"Loading environment from {backend_prod}...")
        load_dotenv(backend_prod, override=True)
        SUPABASE_URL = os.getenv("SUPABASE_URL")
        SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or SUPABASE_KEY.startswith("sb_secret"):
    print("ERROR: Valid SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

sql = "ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_image_url TEXT;"

try:
    print("Executing SQL migration via RPC exec_sql...")
    response = supabase.rpc("exec_sql", {"sql": sql}).execute()
    print("Migration successful: ", response)
except Exception as e:
    print(f"RPC exec_sql failed: {e}")
    sys.exit(1)
