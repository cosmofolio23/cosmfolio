import os
from dotenv import load_dotenv
from supabase import create_client
import json

load_dotenv(dotenv_path="backend/.env")

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supa = create_client(url, key)

project_id = "ebec35a2-be46-4747-adb8-36a0c0cf1f9c"

try:
    res = supa.storage.from_("assets").download(f"documents/{project_id}.json")
    doc = json.loads(res.decode("utf-8"))
    publishing = doc.get("publishing", {})
    pageSize = publishing.get("pageSize", {})
    print("Page size in storage JSON:", pageSize)
except Exception as e:
    print("Error:", e)
