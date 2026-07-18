import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(dotenv_path="backend/.env")

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supa = create_client(url, key)

project_id = "945ba699-7af1-4a0f-9d87-037d57fe42f1"

# List files in bucket
try:
    files = supa.storage.from_("assets").list("documents")
    print("Files in assets bucket under documents/:")
    for f in files:
        if f["name"].startswith(project_id) or "945b" in f["name"]:
            print(" - MATCHED:", f)
        else:
            print(" - ", f["name"])
except Exception as e:
    print("Error listing documents bucket:", e)
