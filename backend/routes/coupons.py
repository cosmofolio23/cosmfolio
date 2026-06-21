from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

from database import supabase
from routes.deps import get_current_user as get_current_user_from_deps

router = APIRouter()

class CouponCreate(BaseModel):
    code: str
    discount_type: str = "free_pro"
    max_uses: int = 100
    expires_at: Optional[str] = None

class CouponApply(BaseModel):
    code: str

@router.get("/admin/coupons")
async def get_all_coupons(current_user: dict = Depends(get_current_user_from_deps)):
    """Admin only: List all coupons"""
    if not current_user or current_user.get("email") != "boseraj001@gmail.com":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access only")
    try:
        result = supabase.table("coupons").select("*").order("created_at", desc=True).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/admin/coupons")
async def create_coupon(coupon: CouponCreate, current_user: dict = Depends(get_current_user_from_deps)):
    """Admin only: Create a new coupon"""
    if not current_user or current_user.get("email") != "boseraj001@gmail.com":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access only")
    try:
        data = {
            "code": coupon.code.upper(),
            "discount_type": coupon.discount_type,
            "max_uses": coupon.max_uses,
            "expires_at": coupon.expires_at
        }
        result = supabase.table("coupons").insert(data).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        if "unique" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Coupon code already exists")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.delete("/admin/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, current_user: dict = Depends(get_current_user_from_deps)):
    """Admin only: Delete a coupon"""
    if not current_user or current_user.get("email") != "boseraj001@gmail.com":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access only")
    try:
        supabase.table("coupons").delete().eq("id", coupon_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/user/apply-coupon")
async def apply_coupon(payload: CouponApply, current_user: dict = Depends(get_current_user_from_deps)):
    """User applies a coupon"""
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    code = payload.code.upper().strip()
    try:
        # Check if coupon is valid
        coupon_res = supabase.table("coupons").select("*").eq("code", code).execute()
        if not coupon_res.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid coupon code")
            
        coupon = coupon_res.data[0]
        
        # Check expiration
        if coupon.get("expires_at"):
            expires_at = datetime.fromisoformat(coupon["expires_at"].replace("Z", "+00:00"))
            if expires_at < datetime.now(expires_at.tzinfo):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Coupon has expired")
                
        # Check usage limits
        if coupon.get("used_count", 0) >= coupon.get("max_uses", 100):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Coupon has reached its usage limit")
            
        # Apply the benefit (Pro Status)
        user_id = current_user.get("user_id") or current_user.get("id")
        
        # Check if user is already pro
        user_res = supabase.table("users").select("is_pro").eq("id", user_id).execute()
        if user_res.data and user_res.data[0].get("is_pro"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You are already on the Pro plan")
            
        # Update user to Pro
        supabase.table("users").update({"is_pro": True}).eq("id", user_id).execute()
        
        # Increment coupon usage
        new_count = coupon.get("used_count", 0) + 1
        supabase.table("coupons").update({"used_count": new_count}).eq("id", coupon["id"]).execute()
        
        return {"success": True, "message": "Coupon applied successfully! You are now a Pro user."}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
