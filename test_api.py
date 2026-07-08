import requests
import jwt
from datetime import datetime, timedelta

from supabase import create_client
url = "https://rjobifgysmovmcvhdlnd.supabase.co"
key = "sb_publishable_IsZjamlpYF9KrkJ07-Cikg_Lgl_UFoB"
supa = create_client(url, key)
proj = supa.table("portfolios").select("project_id, projects(user_id)").limit(1).execute()
project_id = proj.data[0]["project_id"]
user_id = proj.data[0]["projects"]["user_id"]

headless_token = jwt.encode(
    {"project_id": project_id, "user_id": user_id, "exp": datetime.utcnow() + timedelta(minutes=5)},
    "super-secret-headless-key",
    algorithm="HS256"
)

# Test live backend!
API_URL = "https://cosmfolio-production.up.railway.app"
print(f"Testing {API_URL}/api/projects/{project_id}/document")
res = requests.get(
    f"{API_URL}/api/projects/{project_id}/document",
    headers={"Authorization": f"Bearer {headless_token}"}
)
print("Status:", res.status_code)
print("Body:", res.text)
