import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

db = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_ROLE_KEY'])

user_id = "oAbaeVu97EZouv8dJNR53bDQfe03"

print(f"Looking for user_id = '{user_id}'")

# Direct query
res = db.table("transactions").select("id,user_id,status,gateway_order_id").eq("user_id", user_id).execute()
print(f"Found {len(res.data)} transactions")
for tx in res.data:
    print(f"  {tx}")

# Also check: what user_ids exist in transactions?
all_res = db.table("transactions").select("user_id").execute()
print(f"\nAll user_ids in transactions table:")
unique_ids = set()
for tx in all_res.data:
    unique_ids.add(tx['user_id'])
for uid in unique_ids:
    print(f"  '{uid}' (len={len(uid)})")
