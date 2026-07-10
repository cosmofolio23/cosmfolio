from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel
import boto3
from botocore.exceptions import ClientError
from botocore.client import Config
import os
import uuid
from datetime import datetime

from .deps import get_current_user

router = APIRouter()

class PresignedUrlRequest(BaseModel):
    filename: str
    content_type: str
    folder: str = "assets"  # E.g., 'assets', 'avatars', 'portfolios/123/assets'

class PresignedUrlResponse(BaseModel):
    upload_url: str
    public_url: str
    file_path: str

@router.post("/presigned-url", response_model=PresignedUrlResponse)
async def generate_presigned_url(
    request: PresignedUrlRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a presigned URL for direct upload to Cloudflare R2 from the frontend.
    """
    account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID")
    access_key = os.getenv("CLOUDFLARE_R2_ACCESS_KEY_ID")
    secret_key = os.getenv("CLOUDFLARE_R2_SECRET_ACCESS_KEY")
    bucket_name = os.getenv("CLOUDFLARE_R2_BUCKET_NAME")
    public_url_base = os.getenv("CLOUDFLARE_R2_PUBLIC_URL", "").rstrip('/')
    
    if not all([account_id, access_key, secret_key, bucket_name]):
        raise HTTPException(status_code=500, detail="Cloudflare R2 is not configured properly.")

    try:
        s3 = boto3.client(
            's3',
            endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name='auto', # Cloudflare uses auto
            config=Config(signature_version='s3v4')
        )
        
        # Generate a unique path
        file_extension = request.filename.split('.')[-1] if '.' in request.filename else ''
        file_path = f"{request.folder}/{uuid.uuid4()}.{file_extension}"

        # Get presigned URL
        presigned_url = s3.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': bucket_name,
                'Key': file_path,
                'ContentType': request.content_type
            },
            ExpiresIn=300 # 5 minutes
        )

        public_url = f"{public_url_base}/{file_path}"
        
        return PresignedUrlResponse(
            upload_url=presigned_url,
            public_url=public_url,
            file_path=file_path
        )
        
    except ClientError as e:
        print(f"Error generating presigned URL: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate upload URL")
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
