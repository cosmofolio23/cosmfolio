from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from database import supabase
from datetime import datetime
import logging
from services.notification import NotificationService

logger = logging.getLogger(__name__)

router = APIRouter()

class SupportRequest(BaseModel):
    name: str
    email: EmailStr
    message: str

# Simple in-memory rate limiting dict (IP -> timestamp array)
rate_limit_store = {}
RATE_LIMIT = 5 # max 5 requests
RATE_LIMIT_WINDOW = 3600 # per hour

def is_rate_limited(client_ip: str) -> bool:
    now = datetime.now().timestamp()
    if client_ip not in rate_limit_store:
        rate_limit_store[client_ip] = []
    
    # Clean up old timestamps
    rate_limit_store[client_ip] = [ts for ts in rate_limit_store[client_ip] if now - ts < RATE_LIMIT_WINDOW]
    
    if len(rate_limit_store[client_ip]) >= RATE_LIMIT:
        return True
        
    rate_limit_store[client_ip].append(now)
    return False

@router.post("")
async def create_support_request(req: SupportRequest, request: Request):
    """Submit a support request from the contact form."""
    
    # Rate Limiting
    client_ip = request.client.host if request.client else "unknown"
    if is_rate_limited(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many support requests submitted. Please try again later."
        )

    # Basic spam protection (message length, simple honeypots could be added on frontend)
    if len(req.message.strip()) < 10:
        raise HTTPException(status_code=400, detail="Message is too short.")
    if len(req.message) > 5000:
        raise HTTPException(status_code=400, detail="Message is too long.")

    try:
        data = {
            "name": req.name.strip(),
            "email": req.email.strip(),
            "message": req.message.strip(),
            "status": "new",
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Insert into Supabase
        res = supabase.table("support_requests").insert(data).execute()
        
        if res.data:
            # Send email alert to founder
            NotificationService.sendSupportEmail(data)
            return {"status": "success", "message": "Support request submitted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to submit support request")
            
    except Exception as e:
        logger.error(f"Error submitting support request: {e}")
        # Even if the table doesn't exist yet (SQL not run), we return a graceful error or mock success
        # We will return 500 if Supabase fails
        raise HTTPException(status_code=500, detail="Internal server error while saving request")
