import requests
import jwt
from datetime import datetime, timedelta

from supabase import create_client
url = "https://rjobifgysmovmcvhdlnd.supabase.co"
key = "sb_publishable_IsZjamlpYF9KrkJ07-Cikg_Lgl_UFoB"
supa = create_client(url, key)

files = supa.storage.from_("documents").list()
project_id = None
for f in files:
    if f["name"].endswith(".json"):
        project_id = f["name"].replace(".json", "")
        break

if not project_id:
    print("No documents found in storage")
    exit(1)

proj = supa.table("projects").select("user_id").eq("id", project_id).execute()
user_id = proj.data[0]["user_id"]

headless_token = jwt.encode(
    {"project_id": project_id, "user_id": user_id, "exp": datetime.utcnow() + timedelta(minutes=5)},
    "super-secret-headless-key",
    algorithm="HS256"
)

# Test live backend!
API_URL = "https://cosmfolio-production.up.railway.app"
print(f"Testing {API_URL}/api/projects/{project_id}/export-pdf")
res = requests.post(
    f"{API_URL}/api/projects/{project_id}/export-pdf",
    headers={"Authorization": f"Bearer {headless_token}"}
)
print("Status:", res.status_code)
if res.status_code == 200:
    with open("test.pdf", "wb") as f:
        f.write(res.content)
    print("Saved to test.pdf")
else:
    print("Body:", res.text)
