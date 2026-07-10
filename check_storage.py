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

def list_files_recursive(client, bucket_name, prefix=""):
    total_size = 0
    large_files = []
    
    try:
        response = client.storage.from_(bucket_name).list(path=prefix)
        files = []
        if hasattr(response, 'data'):
            files = response.data
        elif isinstance(response, list):
            files = response
            
        for f in files:
            if not isinstance(f, dict):
                continue
            
            name = f.get("name")
            if not name or name == ".emptyFolderPlaceholder":
                continue
            
            # Subdirectory check (metadata is usually None or missing for directories)
            # Actually, in supabase storage, if it's a directory, its 'id' might be null and it has no metadata
            is_dir = f.get("id") is None
            
            if is_dir:
                new_prefix = f"{prefix}/{name}" if prefix else name
                sub_size, sub_large = list_files_recursive(client, bucket_name, new_prefix)
                total_size += sub_size
                large_files.extend(sub_large)
            else:
                size = f.get("metadata", {}).get("size", 0) if f.get("metadata") else 0
                total_size += size
                # Track files larger than 10MB
                if size > 10 * 1024 * 1024:
                    full_path = f"{prefix}/{name}" if prefix else name
                    large_files.append((full_path, size))
                    
    except Exception as e:
        print(f"Error listing {bucket_name}/{prefix}: {e}")
        
    return total_size, large_files

try:
    buckets = client.storage.list_buckets()
    print(f"Found {len(buckets)} buckets:")
    
    grand_total_size = 0
    all_large_files = []
    
    for bucket in buckets:
        bucket_name = bucket.name
        print(f"\nBucket: {bucket_name}")
        
        size, large_files = list_files_recursive(client, bucket_name)
        grand_total_size += size
        
        print(f"  Total size in bucket '{bucket_name}': {size / 1024 / 1024:.2f} MB")
        if large_files:
            print("  Large files found (> 10MB):")
            for f_path, f_size in sorted(large_files, key=lambda x: x[1], reverse=True):
                print(f"    - {f_path} ({f_size / 1024 / 1024:.2f} MB)")
                
    print(f"\nGrand total size calculated: {grand_total_size / 1024 / 1024 / 1024:.4f} GB")

except Exception as e:
    print(f"Error checking storage: {e}")
