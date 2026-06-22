from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
import razorpay
import os
import hmac
import hashlib
from .deps import get_current_user
from database import supabase

router = APIRouter()

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_placeholder")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "secret_placeholder")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "webhook_secret")

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

class CheckoutRequest(BaseModel):
    product_type: str  # "pro_upgrade" or "boost_pack"
    currency: str      # "INR" or "USD"

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

PRICING = {
    "pro_upgrade": {
        "INR": 29900,  # paise
        "USD": 999     # cents
    },
    "boost_pack": {
        "INR": 9900,
        "USD": 299
    }
}

@router.post("/checkout")
async def create_checkout_session(req: CheckoutRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if req.product_type not in PRICING:
        raise HTTPException(status_code=400, detail="Invalid product type")
    
    if req.currency not in ["INR", "USD"]:
        raise HTTPException(status_code=400, detail="Invalid currency")

    # If they are trying to buy a boost pack but are not pro, block them
    if req.product_type == "boost_pack":
        user_res = supabase.table("users").select("plan_type").eq("id", user_id).execute()
        if not user_res.data or user_res.data[0].get("plan_type") != "pro":
            raise HTTPException(status_code=403, detail="Boost Packs are only available for Pro members.")

    amount = PRICING[req.product_type][req.currency]

    # Create order in Razorpay
    data = {
        "amount": amount,
        "currency": req.currency,
        "receipt": f"receipt_{user_id[:8]}_{req.product_type}",
        "notes": {
            "user_id": user_id,
            "product_type": req.product_type
        }
    }
    
    try:
        order = razorpay_client.order.create(data=data)
    except Exception as e:
        print(f"Razorpay order creation failed: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"Razorpay error: {str(e)}")

    try:
        supabase.table("transactions").insert({
            "user_id": user_id,
            "product_type": req.product_type,
            "amount": amount,
            "currency": req.currency,
            "gateway_order_id": order["id"],
            "status": "created"
        }).execute()
    except Exception as e:
        print(f"Transaction log failed (non-fatal): {e}")

    return {
        "order_id": order["id"],
        "amount": amount,
        "currency": req.currency,
        "key": RAZORPAY_KEY_ID
    }

@router.post("/webhook")
async def razorpay_webhook(request: Request):
    payload = await request.body()
    signature = request.headers.get("x-razorpay-signature")
    
    if not signature:
        raise HTTPException(status_code=400, detail="Missing signature")
        
    try:
        # Verify signature
        razorpay_client.utility.verify_webhook_signature(
            payload.decode('utf-8'),
            signature,
            RAZORPAY_WEBHOOK_SECRET
        )
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
        
    data = await request.json()
    
    if data.get("event") == "payment.captured":
        payment = data["payload"]["payment"]["entity"]
        order_id = payment.get("order_id")
        payment_id = payment.get("id")
        notes = payment.get("notes", {})
        user_id = notes.get("user_id")
        product_type = notes.get("product_type")
        
        if not user_id or not product_type:
            return {"status": "ok"} # Skip irrelevant payments
            
        # Check if transaction exists and is not already paid
        tx_res = supabase.table("transactions").select("status").eq("gateway_order_id", order_id).execute()
        if not tx_res.data or tx_res.data[0].get("status") == "paid":
            return {"status": "ok"}
            
        # Update transaction status
        supabase.table("transactions").update({
            "status": "paid",
            "gateway_payment_id": payment_id
        }).eq("gateway_order_id", order_id).execute()
        
        # Update user entitlements
        if product_type == "pro_upgrade":
            supabase.table("users").update({"plan_type": "pro"}).eq("id", user_id).execute()
        elif product_type == "boost_pack":
            # Fetch current count to increment safely
            u_res = supabase.table("users").select("boost_pack_count").eq("id", user_id).execute()
            current_count = 0
            if u_res.data:
                current_count = u_res.data[0].get("boost_pack_count") or 0
            supabase.table("users").update({"boost_pack_count": current_count + 1}).eq("id", user_id).execute()
            
    return {"status": "ok"}

@router.post("/verify-payment")
async def verify_payment(req: VerifyPaymentRequest, current_user: dict = Depends(get_current_user)):
    try:
        # Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
        # Compare generated signature with razorpay_signature
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': req.razorpay_order_id,
            'razorpay_payment_id': req.razorpay_payment_id,
            'razorpay_signature': req.razorpay_signature
        })
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # If verification is successful, we should find the transaction, mark it as paid, and grant entitlements.
    tx_res = supabase.table("transactions").select("*").eq("gateway_order_id", req.razorpay_order_id).execute()
    if not tx_res.data:
        raise HTTPException(status_code=400, detail="Transaction not found")
        
    tx = tx_res.data[0]
    if tx["status"] == "paid":
        return {"success": True, "message": "Already verified"}

    # Update transaction
    supabase.table("transactions").update({
        "status": "paid",
        "gateway_payment_id": req.razorpay_payment_id
    }).eq("gateway_order_id", req.razorpay_order_id).execute()

    user_id = tx["user_id"]
    product_type = tx["product_type"]

    if product_type == "pro_upgrade":
        supabase.table("users").update({"plan_type": "pro"}).eq("id", user_id).execute()
    elif product_type == "boost_pack":
        u_res = supabase.table("users").select("boost_pack_count").eq("id", user_id).execute()
        current_count = 0
        if u_res.data:
            current_count = u_res.data[0].get("boost_pack_count") or 0
        supabase.table("users").update({"boost_pack_count": current_count + 1}).eq("id", user_id).execute()
        
    return {"success": True}
