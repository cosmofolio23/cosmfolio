from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models import UserResponse

class ErrorLogCreate(BaseModel):
    error_message: str
    stack_trace: Optional[str] = None
    component: Optional[str] = None
    url: Optional[str] = None
    browser_info: Optional[Dict[str, Any]] = None

class ActivityLogCreate(BaseModel):
    event_name: str
    metadata: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None
from routes.deps import get_current_user_optional, get_current_user
from services.notification import NotificationService

router = APIRouter()

@router.post("/track-activity")
async def track_activity(
    activity: ActivityLogCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: Optional[UserResponse] = Depends(get_current_user_optional)
):
    try:
        user_id = user.id if user else None
        
        # Save to database
        db.execute(
            text("INSERT INTO activity_logs (user_id, event_name, metadata) VALUES (:uid, :evt, :meta)"),
            {"uid": user_id, "evt": activity.event_name, "meta": activity.model_dump_json(include={'metadata'})}
        )
        db.commit()
        return {"status": "ok"}
    except Exception as e:
        print(f"[Monitoring Error] Failed to track activity: {str(e)}")
        return {"status": "error"}

@router.post("/track-error")
async def track_error(
    error: ErrorLogCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: Optional[UserResponse] = Depends(get_current_user_optional)
):
    try:
        user_id = user.id if user else None
        
        db.execute(
            text("""INSERT INTO error_logs (user_id, error_type, message, stack_trace, page, browser, device) 
               VALUES (:uid, :type, :msg, :stack, :page, :browser, :dev)"""),
            {
                "uid": user_id,
                "type": error.error_type,
                "msg": error.message,
                "stack": error.stack_trace,
                "page": error.page,
                "browser": error.browser,
                "dev": error.device
            }
        )
        db.commit()

        # Alert admin if critical
        critical_types = ["pdf_export_failed", "payment_error", "payment_failed", "crash"]
        if error.error_type in critical_types or "timeout" in error.message.lower():
            NotificationService.sendErrorAlert({
                "user": user.email if user else "Anonymous",
                "page": error.page,
                "action": error.error_type,
                "message": error.message,
                "stack_trace": error.stack_trace,
                "browser": error.browser,
                "device": error.device
            })

        return {"status": "ok"}
    except Exception as e:
        print(f"[Monitoring Error] Failed to track error: {str(e)}")
        return {"status": "error"}

@router.get("/admin/dashboard-stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    user: UserResponse = Depends(get_current_user)
):
    if user.email.lower() != "boseraj001@gmail.com":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    try:
        total_users = db.execute(text("SELECT COUNT(*) FROM auth.users")).scalar()
        today_signups = db.execute(text("SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '24 hours'")).scalar()
        portfolios_count = db.execute(text("SELECT COUNT(*) FROM portfolios")).scalar()
        exports = db.execute(text("SELECT COUNT(*) FROM activity_logs WHERE event_name = 'pdf_export_success'")).scalar()
        error_count = db.execute(text("SELECT COUNT(*) FROM error_logs WHERE resolved = FALSE")).scalar()
        
        # Simple active users (users who performed an activity in last 7 days)
        active_users = db.execute(text("SELECT COUNT(DISTINCT user_id) FROM activity_logs WHERE created_at >= NOW() - INTERVAL '7 days'")).scalar()
        
        return {
            "total_users": total_users or 0,
            "today_signups": today_signups or 0,
            "portfolios_count": portfolios_count or 0,
            "exports": exports or 0,
            "error_count": error_count or 0,
            "active_users": active_users or 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
