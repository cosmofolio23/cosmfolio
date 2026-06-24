import os
import sys
from pathlib import Path
from datetime import datetime, timedelta

# Setup paths
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
load_dotenv()

from database import engine
from sqlalchemy import text
from services.notification import NotificationService

def generate_daily_report():
    print("Generating CosmoFolio Daily Report...")
    
    with engine.begin() as conn:
        # Metrics
        new_users = conn.execute(text("SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '24 hours'")).scalar() or 0
        total_users = conn.execute(text("SELECT COUNT(*) FROM auth.users")).scalar() or 0
        portfolios = conn.execute(text("SELECT COUNT(*) FROM portfolios WHERE created_at >= NOW() - INTERVAL '24 hours'")).scalar() or 0
        exports = conn.execute(text("SELECT COUNT(*) FROM activity_logs WHERE event_name = 'pdf_export_success' AND created_at >= NOW() - INTERVAL '24 hours'")).scalar() or 0
        
        # Upgrades
        upgrades = conn.execute(text("SELECT COUNT(*) FROM transactions WHERE status = 'paid' AND product_type = 'pro_upgrade' AND created_at >= NOW() - INTERVAL '24 hours'")).scalar() or 0
        
        # Revenue
        revenue = conn.execute(text("SELECT SUM(amount) FROM transactions WHERE status = 'paid' AND created_at >= NOW() - INTERVAL '24 hours'")).scalar() or 0
        revenue_str = f"₹{revenue / 100:.2f}" if revenue > 0 else "₹0.00"

        # Failed Payments
        failed_payments = conn.execute(text("SELECT COUNT(*) FROM activity_logs WHERE event_name = 'payment_failed' AND created_at >= NOW() - INTERVAL '24 hours'")).scalar() or 0

        # Top Errors
        top_errors_rows = conn.execute(text("""
            SELECT error_type as msg, COUNT(DISTINCT user_id) as count 
            FROM error_logs 
            WHERE created_at >= NOW() - INTERVAL '24 hours'
            GROUP BY error_type
            ORDER BY count DESC
            LIMIT 5
        """)).fetchall()
        top_errors = [{"msg": r.msg, "count": r.count} for r in top_errors_rows]

        # Templates
        top_templates_rows = conn.execute(text("""
            SELECT style_id as name, COUNT(*) as count 
            FROM portfolios 
            WHERE created_at >= NOW() - INTERVAL '24 hours' AND style_id IS NOT NULL
            GROUP BY style_id
            ORDER BY count DESC
            LIMIT 5
        """)).fetchall()
        top_templates = [{"name": str(r.name), "count": r.count} for r in top_templates_rows]

    stats = {
        "new_users": new_users,
        "total_users": total_users,
        "portfolios_created": portfolios,
        "pdf_exports": exports,
        "pro_upgrades": upgrades,
        "revenue": revenue_str,
        "failed_payments": failed_payments,
        "top_errors": top_errors,
        "top_templates": top_templates
    }

    success = NotificationService.sendDailyReport(stats)
    if success:
        print("Daily report sent successfully!")
    else:
        print("Failed to send daily report. (Check SMTP configuration)")

if __name__ == "__main__":
    generate_daily_report()
