from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
import razorpay
import os
import hmac
import hashlib
from .deps import get_current_user
import database
from sqlalchemy import text
from services.notification import NotificationService

router = APIRouter()

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_placeholder")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "secret_placeholder")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "webhook_secret")

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

class CheckoutRequest(BaseModel):
    product_type: str  # "pro_upgrade" or "boost_pack"
    currency: str      # "INR" or "USD"
    referral_code: str = None

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
        user_res = database.supabase.table("users").select("plan_type").eq("id", user_id).execute()
        if not user_res.data or user_res.data[0].get("plan_type") != "pro":
            raise HTTPException(status_code=403, detail="Boost Packs are only available for Pro members.")

    amount = PRICING[req.product_type][req.currency]
    
    ambassador_id = None
    if req.referral_code and req.product_type == "pro_upgrade":
        res = database.supabase.table("ambassadors").select("*").eq("referral_code", req.referral_code.upper()).execute()
        if res.data:
            ambassador = res.data[0]
            if ambassador["user_id"] != user_id:
                ambassador_id = ambassador["user_id"]
                discount_amount = int(amount * (ambassador["discount_percentage"] / 100))
                amount = amount - discount_amount

    # Create order in Razorpay
    data = {
        "amount": amount,
        "currency": req.currency,
        "receipt": f"receipt_{user_id[:8]}_{req.product_type}",
        "notes": {
            "user_id": user_id,
            "product_type": req.product_type,
            "referral_code": req.referral_code.upper() if ambassador_id else ""
        }
    }
    
    try:
        order = razorpay_client.order.create(data=data)
    except Exception as e:
        print(f"Razorpay order creation failed: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"Razorpay error: {str(e)}")

    try:
        database.supabase.table("transactions").insert({
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
        tx_res = database.supabase.table("transactions").select("status").eq("gateway_order_id", order_id).execute()
        if not tx_res.data or tx_res.data[0].get("status") == "paid":
            return {"status": "ok"}
            
        # Update transaction status
        database.supabase.table("transactions").update({
            "status": "paid",
            "gateway_payment_id": payment_id
        }).eq("gateway_order_id", order_id).execute()
        
        # Update user entitlements
        if product_type == "pro_upgrade":
            database.supabase.table("users").update({"plan_type": "pro", "is_pro": True}).eq("id", user_id).execute()
        elif product_type == "boost_pack":
            user_data = database.supabase.table("users").select("boost_pack_count").eq("id", user_id).execute()
            current_boosts = user_data.data[0].get("boost_pack_count", 0) if user_data.data else 0
            database.supabase.table("users").update({"boost_pack_count": current_boosts + 1}).eq("id", user_id).execute()
            
        process_ambassador_reward(user_id, product_type, payment.get("amount", 0), order_id, payment_id)
            
    return {"status": "ok"}

def process_ambassador_reward(user_id: str, product_type: str, amount_paid: float, gateway_order_id: str, payment_id: str):
    if product_type != "pro_upgrade":
        return
        
    try:
        # Check if transaction has referral code in notes
        order = razorpay_client.order.fetch(gateway_order_id)
        referral_code = order.get("notes", {}).get("referral_code")
        if not referral_code:
            return
            
        res = database.supabase.table("ambassadors").select("*").eq("referral_code", referral_code).execute()
        if not res.data:
            return
            
        ambassador = res.data[0]
        ambassador_id = ambassador["user_id"]
        
        # Don't reward if it's the same user
        if ambassador_id == user_id:
            return
            
        commission_pct = ambassador["commission_percentage"]
        commission_amount = (amount_paid / 100) * (commission_pct / 100.0) # Razorpay amount is in paise
        discount_given = (PRICING["pro_upgrade"]["INR"] / 100) - (amount_paid / 100)
        
        # Insert referral transaction
        database.supabase.table("referral_transactions").insert({
            "ambassador_id": ambassador_id,
            "customer_id": user_id,
            "payment_id": payment_id,
            "sale_amount": amount_paid / 100,
            "discount_given": discount_given,
            "commission_amount": commission_amount,
            "status": "pending"
        }).execute()
        
        # Update successful sales and pending balance
        new_sales = ambassador["successful_sales"] + 1
        new_pending = ambassador["pending_balance"] + commission_amount
        
        # Check tier upgrade
        new_tier = ambassador["tier"]
        new_discount = ambassador["discount_percentage"]
        new_commission = ambassador["commission_percentage"]
        
        if new_sales >= 101 and new_tier != "creator":
            new_tier = "creator"
            new_discount = 25
            new_commission = 30
            NotificationService.sendAmbassadorUpgraded(ambassador_id, new_tier)
        elif new_sales >= 21 and new_tier == "starter":
            new_tier = "campus"
            new_discount = 20
            new_commission = 20
            NotificationService.sendAmbassadorUpgraded(ambassador_id, new_tier)
            
        database.supabase.table("ambassadors").update({
            "successful_sales": new_sales,
            "pending_balance": new_pending,
            "tier": new_tier,
            "discount_percentage": new_discount,
            "commission_percentage": new_commission
        }).eq("user_id", ambassador_id).execute()
        
        # Notify
        NotificationService.sendAmbassadorSale(ambassador_id, commission_amount)
        
    except Exception as e:
        print(f"Ambassador reward failed: {e}")

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
        NotificationService.sendPaymentFailedAlert({
            "email": current_user.get("email", "Unknown"),
            "amount": "Unknown",
            "method": "Razorpay",
            "reason": "Invalid signature",
            "gateway_response": "SignatureVerificationError"
        })
        try:
            with engine.begin() as conn:
                conn.execute(text("INSERT INTO activity_logs (user_id, event_name) VALUES (:u, :e)"), {"u": current_user.get("user_id"), "e": "payment_failed"})
        except:
            pass
        raise HTTPException(status_code=400, detail="Invalid signature")

    # If verification is successful, we should find the transaction, mark it as paid, and grant entitlements.
    tx_res = database.supabase.table("transactions").select("*").eq("gateway_order_id", req.razorpay_order_id).execute()
    if not tx_res.data:
        raise HTTPException(status_code=400, detail="Transaction not found")
        
    tx = tx_res.data[0]
    if tx["status"] == "paid":
        return {"success": True, "message": "Already verified"}

    # Update transaction
    database.supabase.table("transactions").update({
        "status": "paid",
        "gateway_payment_id": req.razorpay_payment_id
    }).eq("gateway_order_id", req.razorpay_order_id).execute()

    user_id = tx["user_id"]
    product_type = tx["product_type"]

    if product_type == "pro_upgrade":
        from datetime import datetime
        database.supabase.table("users").update({
            "plan_type": "pro",
            "is_pro": True,
            "payment_status": "paid",
            "pro_purchase_date": datetime.utcnow().isoformat(),
            "payment_gateway": "razorpay",
            "payment_id": req.razorpay_payment_id,
            "currency": tx.get("currency", "INR")
        }).eq("id", user_id).execute()
    elif product_type == "boost_pack":
        u_res = database.supabase.table("users").select("boost_pack_count").eq("id", user_id).execute()
        current_count = 0
        if u_res.data:
            current_count = u_res.data[0].get("boost_pack_count") or 0
        database.supabase.table("users").update({"boost_pack_count": current_count + 1}).eq("id", user_id).execute()

    user_email = current_user.get("email", "Unknown")
    
    try:
        with engine.begin() as conn:
            conn.execute(text("INSERT INTO activity_logs (user_id, event_name) VALUES (:u, :e)"), {"u": user_id, "e": "payment_success"})
    except:
        pass

    if product_type == "pro_upgrade":
        NotificationService.sendPaymentAlert({
            "name": "User",
            "email": user_email,
            "country": "Unknown",
            "plan": "Pro Upgrade",
            "amount": tx["amount"] / 100,
            "currency": tx["currency"],
            "provider": "Razorpay",
            "payment_id": req.razorpay_payment_id
        })
    elif product_type == "boost_pack":
        NotificationService.sendBoostPackAlert({
            "name": "User",
            "email": user_email,
            "amount": f"{tx['amount'] / 100} {tx['currency']}",
            "total_packs": current_count + 1,
            "new_page_limit": 10 + ((current_count + 1) * 5),
            "new_download_limit": 3 + ((current_count + 1) * 5)
        })
        
    # Process Ambassador Reward
    process_ambassador_reward(user_id, product_type, tx["amount"], req.razorpay_order_id, req.razorpay_payment_id)

    return {"success": True, "message": "Payment verified and entitlements granted"}

@router.post("/restore")
async def restore_purchase(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    # Find all transactions for this user that are NOT paid
    tx_res = database.supabase.table("transactions").select("*").eq("user_id", user_id).execute()
    if not tx_res.data:
        raise HTTPException(status_code=400, detail="No purchase history found to restore")
        
    errors = []
    for tx in tx_res.data:
        if tx["status"] == "paid" and tx["product_type"] == "pro_upgrade":
            # Just ensure they are actually pro
            database.supabase.table("users").update({"plan_type": "pro", "is_pro": True}).eq("id", user_id).execute()
            return {"success": True, "message": "Pro status restored from previous successful transaction"}
            
        if tx["status"] != "paid" and tx["product_type"] == "pro_upgrade":
            try:
                # Ask Razorpay if this order was actually paid
                payments = razorpay_client.order.payments(tx["gateway_order_id"])
                for payment in payments.get("items", []):
                    if payment.get("status") == "captured":
                        # We found a missing successful payment!
                        
                        # 1. Mark transaction paid
                        database.supabase.table("transactions").update({
                            "status": "paid",
                            "gateway_payment_id": payment.get("id")
                        }).eq("id", tx["id"]).execute()
                        
                        # 2. Upgrade user
                        from datetime import datetime
                        database.supabase.table("users").update({
                            "plan_type": "pro",
                            "is_pro": True,
                            "payment_status": "paid",
                            "pro_purchase_date": datetime.utcnow().isoformat(),
                            "payment_gateway": "razorpay",
                            "payment_id": payment.get("id"),
                            "currency": tx.get("currency", "INR")
                        }).eq("id", user_id).execute()
                        
                        return {"success": True, "message": "Purchase recovered and Pro status granted!"}
            except Exception as e:
                err_msg = f"Order {tx['gateway_order_id']}: {str(e)}"
                print(f"Restore check failed: {err_msg}")
                errors.append(err_msg)
                
    error_str = " | ".join(errors) if errors else "No captured payments found on Razorpay for your orders."
    raise HTTPException(status_code=400, detail=f"Failed to restore: {error_str}")
