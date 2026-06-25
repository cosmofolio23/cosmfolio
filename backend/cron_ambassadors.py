import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

try:
    from database import supabase
except ImportError:
    print("Could not import database. Run from backend dir.")
    sys.exit(1)

def release_pending_commissions():
    print(f"[{datetime.utcnow()}] Starting cron job: Release Pending Commissions")
    
    # 14 days ago
    cutoff_date = (datetime.utcnow() - timedelta(days=14)).isoformat()
    
    # Get pending transactions older than 14 days
    res = supabase.table("referral_transactions").select("*").eq("status", "pending").lt("created_at", cutoff_date).execute()
    
    transactions = res.data or []
    print(f"Found {len(transactions)} pending transactions ready to be released.")
    
    if not transactions:
        return

    # Process each
    # Group by ambassador to batch updates to ambassador balance
    ambassador_totals = {}
    
    for tx in transactions:
        a_id = tx["ambassador_id"]
        ambassador_totals[a_id] = ambassador_totals.get(a_id, 0.0) + tx["commission_amount"]
        
        # Update transaction status
        supabase.table("referral_transactions").update({"status": "available"}).eq("id", tx["id"]).execute()
        
    for a_id, released_amount in ambassador_totals.items():
        # Fetch current balances
        amb_res = supabase.table("ambassadors").select("pending_balance, available_balance").eq("user_id", a_id).execute()
        if amb_res.data:
            amb = amb_res.data[0]
            new_pending = max(0.0, amb["pending_balance"] - released_amount)
            new_available = amb["available_balance"] + released_amount
            
            supabase.table("ambassadors").update({
                "pending_balance": new_pending,
                "available_balance": new_available
            }).eq("user_id", a_id).execute()
            print(f"Updated ambassador {a_id}: moved {released_amount} to available.")

if __name__ == "__main__":
    release_pending_commissions()
