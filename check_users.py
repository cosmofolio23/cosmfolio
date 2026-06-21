import os
import sys

# Add backend dir to path so we can import database
sys.path.append(os.path.abspath("backend"))

from database import supabase

print("Users table:")
res = supabase.table("users").select("*").execute()
for u in res.data:
    print(f"ID: {u.get('id')} - Email: {u.get('email')} - Export Count: {u.get('export_count')}")
