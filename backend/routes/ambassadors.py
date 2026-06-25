import os
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import supabase
from .deps import get_current_user
from services.notification import NotificationService

router = APIRouter()

class JoinRequest(BaseModel):
    referral_code: str
    invite_code: str

class WithdrawRequest(BaseModel):
    amount: float
    method: str
    details: str

@router.get("/me")
async def get_my_ambassador_profile(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id")
    res = supabase.table("ambassadors").select("*").eq("user_id", user_id).execute()
    if not res.data:
        return {"is_ambassador": False}
    
    ambassador = res.data[0]
    
    # Calculate dynamically the available balance from referral_transactions > 14 days
    tx_res = supabase.table("referral_transactions").select("*").eq("ambassador_id", user_id).execute()
    transactions = tx_res.data or []
    
    total_earnings = 0.0
    pending_balance = 0.0
    available_balance = 0.0
    
    now = datetime.utcnow()
    for tx in transactions:
        if tx["status"] in ["pending", "available"]:
            total_earnings += tx["commission_amount"]
            
            created_at = datetime.fromisoformat(tx["created_at"].replace("Z", "+00:00")).replace(tzinfo=None)
            days_passed = (now - created_at).days
            
            if days_passed >= 14:
                available_balance += tx["commission_amount"]
                # Optionally, update status to available in DB
                if tx["status"] == "pending":
                    supabase.table("referral_transactions").update({"status": "available"}).eq("id", tx["id"]).execute()
            else:
                pending_balance += tx["commission_amount"]
                
    withdrawn_amount = ambassador.get("withdrawn_amount", 0.0)
    available_balance -= withdrawn_amount
    
    # Update ambassador balance in DB to match
    supabase.table("ambassadors").update({
        "total_earnings": total_earnings,
        "pending_balance": pending_balance,
        "available_balance": available_balance
    }).eq("user_id", user_id).execute()
    
    ambassador["total_earnings"] = total_earnings
    ambassador["pending_balance"] = pending_balance
    ambassador["available_balance"] = available_balance
    
    return {
        "is_ambassador": True,
        "profile": ambassador,
        "transactions": transactions
    }

@router.post("/join")
async def join_ambassador_program(req: JoinRequest, current_user: dict = Depends(get_current_user)):
    # Validate Invite Code
    secret = os.getenv("AMBASSADOR_INVITE_CODE", "COSMOFOLIO_PARTNER_2026")
    if req.invite_code.strip() != secret:
        raise HTTPException(status_code=403, detail="Invalid invitation code.")

    user_id = current_user.get("user_id")
    
    # Check if already joined
    res = supabase.table("ambassadors").select("user_id").eq("user_id", user_id).execute()
    if res.data:
        raise HTTPException(status_code=400, detail="Already an ambassador")
        
    code = req.referral_code.strip().upper()
    if not code or len(code) < 3:
        raise HTTPException(status_code=400, detail="Invalid referral code")
        
    # Check if code exists
    code_res = supabase.table("ambassadors").select("referral_code").eq("referral_code", code).execute()
    if code_res.data:
        raise HTTPException(status_code=400, detail="Referral code already taken")
        
    data = {
        "user_id": user_id,
        "referral_code": code,
        "tier": "starter",
        "successful_sales": 0,
        "discount_percentage": 15,
        "commission_percentage": 15
    }
    
    supabase.table("ambassadors").insert(data).execute()
    
    # Notification
    NotificationService.sendAmbassadorJoined({
        "name": current_user.get("name", current_user.get("email")),
        "email": current_user.get("email"),
        "code": code
    })
    
    return {"success": True, "message": "Welcome to the Ambassador Program!"}

@router.post("/withdraw")
async def request_withdrawal(req: WithdrawRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id")
    
    # Re-calculate available balance
    profile_res = await get_my_ambassador_profile(current_user)
    if not profile_res.get("is_ambassador"):
        raise HTTPException(status_code=403, detail="Not an ambassador")
        
    profile = profile_res["profile"]
    if req.amount > profile["available_balance"]:
        raise HTTPException(status_code=400, detail="Insufficient available balance")
        
    # Check minimums
    if req.method in ["UPI", "Bank"] and req.amount < 500:
        raise HTTPException(status_code=400, detail="Minimum withdrawal for India is ₹500")
    if req.method == "PayPal" and req.amount < 10: # Assuming 10 dollars or equivalent
        pass
        
    # Mark withdrawal
    new_withdrawn = profile["withdrawn_amount"] + req.amount
    new_available = profile["available_balance"] - req.amount
    
    supabase.table("ambassadors").update({
        "withdrawn_amount": new_withdrawn,
        "available_balance": new_available
    }).eq("user_id", user_id).execute()
    
    NotificationService.sendWithdrawalRequested({
        "name": current_user.get("name", current_user.get("email")),
        "email": current_user.get("email"),
        "amount": req.amount,
        "method": req.method,
        "details": req.details
    })
    
    return {"success": True, "message": "Withdrawal requested successfully!"}

@router.get("/leaderboard")
async def get_public_leaderboard():
    res = supabase.table("ambassadors").select("user_id, tier, successful_sales").order("successful_sales", desc=True).limit(10).execute()
    if not res.data:
        return []
        
    ambassadors = res.data
    # Fetch names from users table
    user_ids = [a["user_id"] for a in ambassadors]
    users_res = supabase.table("users").select("id, name").in_("id", user_ids).execute()
    user_map = {u["id"]: u.get("name") or "Anonymous" for u in (users_res.data or [])}
    
    leaderboard = []
    for a in ambassadors:
        leaderboard.append({
            "name": user_map.get(a["user_id"], "Anonymous"),
            "tier": a["tier"],
            "sales": a["successful_sales"]
        })
        
    return leaderboard

@router.post("/apply-code")
async def apply_code(req: JoinRequest):
    code = req.referral_code.strip().upper()
    res = supabase.table("ambassadors").select("discount_percentage, user_id").eq("referral_code", code).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    return {
        "success": True,
        "discount_percentage": res.data[0]["discount_percentage"],
        "ambassador_id": res.data[0]["user_id"]
    }

@router.get("/admin/list")
async def admin_list_ambassadors(current_user: dict = Depends(get_current_user)):
    # Check admin
    if current_user.get("email") != "boseraj001@gmail.com":
        raise HTTPException(status_code=403, detail="Admin only")
        
    res = supabase.table("ambassadors").select("*").order("successful_sales", desc=True).execute()
    ambassadors = res.data or []
    
    # Get user details
    user_ids = [a["user_id"] for a in ambassadors]
    users_res = supabase.table("users").select("id, name, email").in_("id", user_ids).execute()
    users_map = {u["id"]: {"name": u.get("name"), "email": u.get("email")} for u in (users_res.data or [])}
    
    for a in ambassadors:
        u_info = users_map.get(a["user_id"], {})
        a["name"] = u_info.get("name")
        a["email"] = u_info.get("email")
        
    return {
        "ambassadors": ambassadors,
        "invite_code": os.getenv("AMBASSADOR_INVITE_CODE", "COSMOFOLIO_PARTNER_2026")
    }
