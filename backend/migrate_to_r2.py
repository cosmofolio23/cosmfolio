import os
import asyncio
import boto3
from botocore.client import Config
from supabase import create_client
import requests
from dotenv import load_dotenv

load_dotenv()

# Cloudflare R2 Settings
R2_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
R2_ACCESS_KEY = os.getenv("CLOUDFLARE_R2_ACCESS_KEY_ID")
R2_SECRET_KEY = os.getenv("CLOUDFLARE_R2_SECRET_ACCESS_KEY")
R2_BUCKET = os.getenv("CLOUDFLARE_R2_BUCKET_NAME", "cosmofolio-assets")
R2_PUBLIC_URL = os.getenv("CLOUDFLARE_R2_PUBLIC_URL", "").rstrip('/')

# Supabase Settings
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "assets")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

r2_client = boto3.client(
    "s3",
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    region_name="auto",
    config=Config(signature_version="s3v4"),
)

def get_supabase_public_url(storage_path):
    # e.g. https://xyz.supabase.co/storage/v1/object/public/assets/path/to/file.jpg
    base = SUPABASE_URL.rstrip('/')
    clean_path = storage_path.lstrip('/')
    return f"{base}/storage/v1/object/public/{SUPABASE_BUCKET}/{clean_path}"

def upload_to_r2(file_data, file_path, content_type):
    cache_control = "max-age=31536000" if "original" in file_path else "max-age=2592000"
    r2_client.put_object(
        Bucket=R2_BUCKET,
        Key=file_path,
        Body=file_data,
        ContentType=content_type,
        CacheControl=cache_control
    )
    return f"{R2_PUBLIC_URL}/{file_path}"

def migrate_table(table_name):
    print(f"\n--- Migrating {table_name} ---")
    page_size = 100
    offset = 0
    total_migrated = 0

    while True:
        resp = supabase.table(table_name).select("*").range(offset, offset + page_size - 1).execute()
        records = resp.data
        if not records:
            break

        for record in records:
            storage_path = record.get("storage_path")
            if not storage_path:
                continue
            
            # Reconstruct the URLs since they might be missing or broken
            original_path = storage_path
            
            # For each URL field, if it exists and points to supabase (or we just want to enforce R2)
            update_data = {}
            
            # Map of fields to their typical paths
            paths_to_check = {
                "url": original_path,
                "thumb_url": original_path.replace("original", "thumb-250").replace(".jpg", ".webp").replace(".png", ".webp") if "original" in original_path else "",
                "preview_url": original_path.replace("original", "preview-1200").replace(".jpg", ".webp").replace(".png", ".webp") if "original" in original_path else "",
            }

            # If it's a library asset, thumb_url might be set, preview_url might not exist
            if table_name == "library_assets" and "preview_url" in paths_to_check:
                del paths_to_check["preview_url"]

            for field, path in paths_to_check.items():
                if not path:
                    continue
                
                # Check if it already has an R2 URL
                current_url = record.get(field)
                if current_url and "r2.dev" in current_url:
                    continue

                # Download from Supabase
                supa_url = get_supabase_public_url(path)
                try:
                    r = requests.get(supa_url, timeout=10)
                    if r.status_code == 200:
                        content_type = r.headers.get("Content-Type", "image/jpeg")
                        # Upload to R2
                        r2_url = upload_to_r2(r.content, path, content_type)
                        update_data[field] = r2_url
                        print(f"Migrated {field} for {record['id']}")
                    else:
                        pass
                except Exception as e:
                    print(f"Error migrating {path}: {e}")

            if update_data:
                supabase.table(table_name).update(update_data).eq("id", record["id"]).execute()
                total_migrated += 1

        offset += page_size

    print(f"Finished {table_name}. Migrated {total_migrated} records.")

def migrate_users():
    print(f"\n--- Migrating user avatars ---")
    resp = supabase.table("users").select("*").execute()
    records = resp.data
    
    for record in records:
        avatar_url = record.get("avatar_url")
        if not avatar_url or "r2.dev" in avatar_url or "supabase" not in avatar_url:
            continue
            
        # Extract path from Supabase URL
        # e.g. https://.../storage/v1/object/public/assets/avatars/user_id.jpg
        parts = avatar_url.split("/public/assets/")
        if len(parts) == 2:
            path = parts[1]
            try:
                r = requests.get(avatar_url, timeout=10)
                if r.status_code == 200:
                    content_type = r.headers.get("Content-Type", "image/jpeg")
                    r2_url = upload_to_r2(r.content, path, content_type)
                    supabase.table("users").update({"avatar_url": r2_url}).eq("id", record["id"]).execute()
                    print(f"Migrated avatar for user {record['id']}")
            except Exception as e:
                print(f"Error migrating avatar: {e}")

if __name__ == "__main__":
    migrate_table("assets")
    migrate_table("library_assets")
    migrate_users()
    print("Migration complete!")
