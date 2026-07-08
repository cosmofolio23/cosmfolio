import os
from supabase import create_client

url = "https://rjobifgysmovmcvhdlnd.supabase.co"
key = "sb_publishable_IsZjamlpYF9KrkJ07-Cikg_Lgl_UFoB"
supabase = create_client(url, key)

res = supabase.table("projects").select("id").limit(1).execute()
if res.data:
    print(res.data[0]['id'])
else:
    print("No projects found")
