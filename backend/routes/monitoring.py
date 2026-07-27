from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models import UserResponse

class ErrorLogCreate(BaseModel):
    error_type: Optional[str] = "general_error"
    message: Optional[str] = None
    error_message: Optional[str] = None
    stack_trace: Optional[str] = None
    component: Optional[str] = None
    page: Optional[str] = None
    url: Optional[str] = None
    browser: Optional[str] = None
    browser_info: Optional[Dict[str, Any]] = None
    device: Optional[str] = None

class ActivityLogCreate(BaseModel):
    event_name: str
    metadata: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None

from routes.deps import get_current_user_optional, get_current_user
from services.notification import NotificationService

router = APIRouter()

def _extract_user_info(user: Any) -> tuple:
    """Safely extract user_id and email regardless of whether user is a dict or object"""
    user_id = None
    user_email = None
    if isinstance(user, dict):
        user_id = user.get("user_id") or user.get("id") or user.get("sub")
        user_email = user.get("email")
    elif user:
        user_id = getattr(user, "id", None) or getattr(user, "user_id", None)
        user_email = getattr(user, "email", None)
    return user_id, user_email

@router.post("/track-activity")
async def track_activity(
    activity: ActivityLogCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: Any = Depends(get_current_user_optional)
):
    try:
        user_id, user_email = _extract_user_info(user)
        
        # Merge session_id and email into metadata if provided
        metadata_dict = activity.metadata or {}
        if activity.session_id:
            metadata_dict['session_id'] = activity.session_id
        if user_email:
            metadata_dict['email'] = user_email
            
        # Save to database using Supabase client
        from database import supabase
        if supabase:
            supabase.table("activity_logs").insert({
                "user_id": user_id,
                "event_name": activity.event_name,
                "metadata": metadata_dict
            }).execute()
        return {"status": "ok"}
    except Exception as e:
        print(f"[Monitoring Error] Failed to track activity: {str(e)}")
        return {"status": "error"}

@router.post("/track-error")
async def track_error(
    error: ErrorLogCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: Any = Depends(get_current_user_optional)
):
    try:
        user_id, user_email = _extract_user_info(user)
        err_msg = error.message or error.error_message or "Unknown error"
        err_page = error.page or error.url or "Unknown page"
        err_type = error.error_type or "general_error"
        
        from database import supabase
        if supabase:
            supabase.table("error_logs").insert({
                "user_id": user_id,
                "error_type": err_type,
                "message": err_msg,
                "stack_trace": error.stack_trace,
                "page": err_page,
                "browser": error.browser or str(error.browser_info or ""),
                "device": error.device
            }).execute()

        # Alert admin if critical
        critical_types = ["pdf_export_failed", "payment_error", "payment_failed", "crash"]
        if err_type in critical_types or "timeout" in err_msg.lower():
            NotificationService.sendErrorAlert({
                "user": user_email or "Anonymous",
                "page": err_page,
                "action": err_type,
                "message": err_msg,
                "stack_trace": error.stack_trace,
                "browser": error.browser,
                "device": error.device
            })

        return {"status": "ok"}
    except Exception as e:
        print(f"[Monitoring Error] Failed to track error: {str(e)}")
        return {"status": "error"}

import datetime as dt

@router.get("/admin/dashboard-stats")
async def get_dashboard_stats(
    db = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    if not user or user.get("email", "").lower() != "boseraj001@gmail.com":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    stats = {
        "total_users": 0,
        "today_signups": 0,
        "portfolios_count": 0,
        "exports": 0,
        "error_count": 0,
        "active_users": 0,
        "live_visitors": 0,
        "total_page_views": 0,
        "today_page_views": 0,
        "top_pages": []
    }
    
    try:
        stats["total_users"] = db.table("users").select("id", count="exact").execute().count or 0
    except Exception as e: print(f"total_users error: {e}")
    
    try:
        yesterday = (dt.datetime.utcnow() - dt.timedelta(days=1)).isoformat()
        stats["today_signups"] = db.table("users").select("id", count="exact").gte("created_at", yesterday).execute().count or 0
    except Exception as e: print(f"today_signups error: {e}")

    try:
        stats["portfolios_count"] = db.table("portfolios").select("id", count="exact").execute().count or 0
    except Exception as e: print(f"portfolios_count error: {e}")

    try:
        stats["exports"] = db.table("activity_logs").select("id", count="exact").eq("event_name", "pdf_export_success").execute().count or 0
    except Exception as e: print(f"exports error: {e}")

    try:
        stats["error_count"] = db.table("error_logs").select("id", count="exact").eq("resolved", False).execute().count or 0
    except Exception as e: print(f"error_count error: {e}")

    try:
        seven_days_ago = (dt.datetime.utcnow() - dt.timedelta(days=7)).isoformat()
        active_logs = db.table("activity_logs").select("user_id").gte("created_at", seven_days_ago).execute().data
        stats["active_users"] = len(set(log["user_id"] for log in active_logs if log.get("user_id")))
    except Exception as e: print(f"active_users error: {e}")

    try:
        five_mins_ago = (dt.datetime.utcnow() - dt.timedelta(minutes=5)).isoformat()
        live_logs = db.table("activity_logs").select("metadata").gte("created_at", five_mins_ago).eq("event_name", "page_view").execute().data
        stats["live_visitors"] = len(set(log.get("metadata", {}).get("session_id") for log in live_logs if log.get("metadata") and log.get("metadata").get("session_id")))
    except Exception as e: print(f"live_visitors error: {e}")

    try:
        stats["total_page_views"] = db.table("activity_logs").select("id", count="exact").eq("event_name", "page_view").execute().count or 0
    except Exception as e: print(f"total_page_views error: {e}")

    try:
        midnight = dt.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        stats["today_page_views"] = db.table("activity_logs").select("id", count="exact").gte("created_at", midnight).eq("event_name", "page_view").execute().count or 0
    except Exception as e: print(f"today_page_views error: {e}")

    try:
        thirty_days_ago = (dt.datetime.utcnow() - dt.timedelta(days=30)).isoformat()
        recent_views = db.table("activity_logs").select("metadata").gte("created_at", thirty_days_ago).eq("event_name", "page_view").execute().data
        
        url_counts = {}
        for log in recent_views:
            url = log.get("metadata", {}).get("url")
            if url:
                url_counts[url] = url_counts.get(url, 0) + 1
                
        sorted_pages = sorted(url_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        stats["top_pages"] = [{"url": k, "views": v} for k, v in sorted_pages]
    except Exception as e: print(f"top_pages error: {e}")

    return stats
