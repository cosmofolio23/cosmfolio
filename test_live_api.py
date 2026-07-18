import requests
import jwt
from datetime import datetime, timedelta

# Use a project ID that ACTUALLY exists in Supabase storage and DB!
project_id = "ebec35a2-be46-4747-adb8-36a0c0cf1f9c"
user_id = "j0vIwRZFZCWa1nvHUYihFhhhaUt1"

headless_token = jwt.encode(
    {"project_id": project_id, "user_id": user_id, "is_pro": True, "exp": datetime.utcnow() + timedelta(minutes=5)},
    "super-secret-headless-key",
    algorithm="HS256"
)

API_URL = "https://cosmfolio-production.up.railway.app"
print(f"Calling live API: {API_URL}/api/projects/{project_id}/export-pdf")
res = requests.post(
    f"{API_URL}/api/projects/{project_id}/export-pdf",
    headers={"Authorization": f"Bearer {headless_token}"}
)
print("Status:", res.status_code)
if res.status_code == 200:
    with open("test.pdf", "wb") as f:
        f.write(res.content)
    print("Saved to test.pdf. Size:", len(res.content))
else:
    print("Error:", res.text)
