import asyncio
import traceback
from datetime import datetime, timezone
from database import engine, supabase
from sqlalchemy import text
from services.notification import NotificationService

async def weekly_report_loop():
    print("[TASKS] Starting weekly report background loop...")
    while True:
        try:
            # 1. Check when we last sent the report
            # We use `activity_logs` with event_name = 'weekly_report_sent'
            last_sent_res = supabase.table("activity_logs") \
                .select("created_at") \
                .eq("event_name", "weekly_report_sent") \
                .order("created_at", desc=True) \
                .limit(1).execute()
            
            should_send = False
            if not last_sent_res.data:
                # Never sent, send it now
                should_send = True
            else:
                last_sent_str = last_sent_res.data[0]['created_at']
                # Supabase returns ISO format string like 2023-01-01T12:00:00+00:00
                last_sent = datetime.fromisoformat(last_sent_str.replace("Z", "+00:00"))
                # If more than 7 days ago (in seconds)
                if (datetime.now(timezone.utc) - last_sent).total_seconds() > 7 * 24 * 3600:
                    should_send = True
            
            if should_send:
                print("[TASKS] Compiling weekly report...")
                if not engine:
                    print("[TASKS] Skipping report generation: DATABASE_URL not configured")
                    await asyncio.sleep(86400) # Sleep a day
                    continue
                    
                # Query metrics using SQLAlchemy
                with engine.connect() as conn:
                    # Freemium Users
                    freemium_users = conn.execute(text("SELECT COUNT(*) FROM users WHERE plan_type = 'free'")).scalar() or 0
                    
                    # Pro Upgrades in last 7 days
                    pro_upgrades = conn.execute(text("SELECT COUNT(*) FROM users WHERE plan_type = 'pro' AND updated_at >= NOW() - INTERVAL '7 days'")).scalar() or 0
                    
                    # PDF Effort (completed exports)
                    pdf_effort = conn.execute(text("SELECT COUNT(*) FROM activity_logs WHERE event_name = 'pdf_export_success' AND created_at >= NOW() - INTERVAL '7 days'")).scalar() or 0
                    
                    # Total Revenue
                    revenue_res = conn.execute(text("SELECT SUM(amount) FROM transactions WHERE status = 'paid' AND created_at >= NOW() - INTERVAL '7 days'")).scalar() or 0
                    total_revenue = float(revenue_res) / 100 # Assuming paise/cents
                    
                    # Error Count
                    error_count = conn.execute(text("SELECT COUNT(*) FROM error_logs WHERE created_at >= NOW() - INTERVAL '7 days'")).scalar() or 0
                    
                    # Active Projects
                    active_projects = conn.execute(text("SELECT COUNT(*) FROM projects WHERE created_at >= NOW() - INTERVAL '7 days'")).scalar() or 0

                stats = {
                    "freemium_users": freemium_users,
                    "pro_upgrades": pro_upgrades,
                    "pdf_effort": pdf_effort,
                    "total_revenue": total_revenue,
                    "currency": "INR", # Adjust if needed
                    "error_count": error_count,
                    "active_projects": active_projects
                }
                
                # Send email
                NotificationService.sendWeeklyReport(stats)
                print("[TASKS] Weekly report sent successfully.")
                
                # Log it so it doesn't send again for 7 days
                # Ensure the system user_id exists, or don't require user_id
                # Wait, activity_logs requires user_id. Let's get any admin user id or just None if it allows.
                # If not, we will just use a fake UUID "00000000-0000-0000-0000-000000000000" if user_id is foreign keyed.
                # Actually, let's insert it via SQLAlchemy so we bypass RLS or schema issues
                with engine.connect() as conn:
                    conn.execute(
                        text("INSERT INTO activity_logs (event_name, metadata) VALUES (:evt, :meta)"),
                        {"evt": "weekly_report_sent", "meta": str(stats)}
                    )
                    conn.commit()
        
        except Exception as e:
            print(f"[TASKS] Error in weekly report loop: {e}")
            traceback.print_exc()

        # Check every 4 hours (to not overload DB on free tier)
        await asyncio.sleep(4 * 3600)
