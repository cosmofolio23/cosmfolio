import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="backend/.env")

print("SUPABASE_URL:", os.getenv("SUPABASE_URL"))
print("SUPABASE_SERVICE_ROLE_KEY:", os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

# Test supabase
from supabase import create_client
try:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    client = create_client(url, key)
    res = client.table("projects").select("id").limit(1).execute()
    print("Supabase connection OK!", res.data)
except Exception as e:
    print("Supabase connection FAILED:", e)
