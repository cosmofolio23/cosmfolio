import os
import time
from dotenv import load_dotenv
from supabase import create_client
from PIL import Image
import io

load_dotenv(dotenv_path="backend/.env")

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Could not find SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

client = create_client(url, key)

BUCKET = 'assets'
TEMP_DIR = 'temp_pictures'
os.makedirs(TEMP_DIR, exist_ok=True)
SIZE_LIMIT = 1 * 1024 * 1024 # 1 MB

total_saved = 0
total_files_processed = 0

def has_transparency(img):
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        alpha = img.convert('RGBA').split()[-1]
        if alpha.getextrema()[0] < 255:
            return True
    return False

def compress_file(file_path, file_size):
    global total_saved, total_files_processed
    
    print(f"\nProcessing: {file_path} ({(file_size / 1024 / 1024):.2f} MB)")
    
    try:
        # Download the file
        res = client.storage.from_(BUCKET).download(file_path)
        img = Image.open(io.BytesIO(res))
        
        is_transparent = has_transparency(img)
        
        # Max dimensions 4000x4000
        img.thumbnail((4000, 4000), Image.Resampling.LANCZOS)
        
        output_buffer = io.BytesIO()
        content_type = ""
        
        if is_transparent:
            print("  Image has transparency, compressing as PNG...")
            img.save(output_buffer, format="PNG", optimize=True)
            content_type = "image/png"
        else:
            print("  Image is opaque, converting to high-quality JPEG...")
            rgb_img = img.convert('RGB')
            rgb_img.save(output_buffer, format="JPEG", quality=90, optimize=True)
            content_type = "image/jpeg"
            
        new_size = output_buffer.tell()
        
        if new_size < file_size:
            savings = file_size - new_size
            print(f"  Compressed to {(new_size / 1024 / 1024):.2f} MB (Saved {(savings / 1024 / 1024):.2f} MB)")
            
            output_buffer.seek(0)
            
            # Upload back, replacing the old file
            upload_res = client.storage.from_(BUCKET).upload(
                file_path, 
                output_buffer.read(), 
                file_options={"upsert": "true", "contentType": content_type}
            )
            print("  Upload complete.")
            
            total_saved += savings
            total_files_processed += 1
        else:
            print("  Compressed size is larger, skipping upload.")
            
    except Exception as e:
        print(f"  Error processing {file_path}: {e}")

def list_and_compress(prefix=""):
    try:
        response = client.storage.from_(BUCKET).list(path=prefix)
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
                
            is_dir = f.get("id") is None
            full_path = f"{prefix}/{name}" if prefix else name
            
            if is_dir:
                list_and_compress(full_path)
            else:
                size = f.get("metadata", {}).get("size", 0) if f.get("metadata") else 0
                if size > SIZE_LIMIT:
                    compress_file(full_path, size)
                    
    except Exception as e:
        print(f"Error listing {prefix}: {e}")

print("Starting batch compression...")
list_and_compress()
print(f"\nBatch compression finished!")
print(f"Total files compressed: {total_files_processed}")
print(f"Total storage space saved: {(total_saved / 1024 / 1024):.2f} MB")
