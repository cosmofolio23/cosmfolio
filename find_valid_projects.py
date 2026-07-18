import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(dotenv_path="backend/.env")

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supa = create_client(url, key)

# List projects from DB
try:
    proj_res = supa.table("projects").select("id, user_id, title").execute()
    db_ids = {p["id"]: p for p in proj_res.data}
    print(f"Total projects in DB: {len(db_ids)}")
except Exception as e:
    print("Error querying DB:", e)
    db_ids = {}

# List files in assets bucket under documents/
try:
    files = supa.storage.from_("assets").list("documents")
    print("Matched files in storage:")
    for f in files:
        name = f["name"].replace(".json", "")
        if name in db_ids:
            print(f" - ID: {name} | Title: {db_ids[name]['title']} | User ID: {db_ids[name]['user_id']}")
except Exception as e:
    print("Error listing documents bucket:", e)
