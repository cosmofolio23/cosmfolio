import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(dotenv_path="backend/.env")

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Could not find SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env")
    exit(1)

client = create_client(url, key)

bucket_name = "assets"
files_to_delete = [
    "portfolios/0dce94a9-b7cc-4722-aac9-b568ed082a30/assets/9c76a4e2-6192-43a4-95ed-7af871555738/original.png",
    "portfolios/28538929-004e-415e-8a1e-c3781ed38402/assets/bc8c8f28-5a81-4fd2-b90c-bbc1aa7b10cc/original.png",
    "portfolios/4e131046-4510-4f3d-b428-296f53d11841/assets/d3c44ce4-9ed1-4c1a-adfe-d0b3220b11da/original.png",
    "portfolios/287506d3-2a65-43c6-b742-3c2aba4b8658/assets/4702a991-834e-497c-8a27-5759a7583930/original.png"
]

try:
    print(f"Attempting to delete {len(files_to_delete)} large files from bucket '{bucket_name}'...")
    response = client.storage.from_(bucket_name).remove(files_to_delete)
    print("Delete operation response:", response)
    print("\nFiles deleted successfully.")
except Exception as e:
    print(f"Error deleting files: {e}")
