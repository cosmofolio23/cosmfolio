import os
import threading
import json
import urllib.request
import socket
from datetime import datetime

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configure in .env
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "thecosmofolio@gmail.com")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "thecosmofolio@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "thecosmofolio@gmail.com")

# Force IPv4 for SMTP to fix Railway "Network is unreachable" IPv6 issues globally
_orig_getaddrinfo = socket.getaddrinfo
def _ipv4_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    if host == SMTP_SERVER:
        family = socket.AF_INET
    return _orig_getaddrinfo(host, port, family, type, proto, flags)
socket.getaddrinfo = _ipv4_getaddrinfo

class NotificationService:
    @staticmethod
    def _send_email(subject: str, html_content: str, background_tasks = None):
        if background_tasks is not None:
            background_tasks.add_task(NotificationService._do_send_email, subject, html_content)
        else:
            thread = threading.Thread(target=NotificationService._do_send_email, args=(subject, html_content), daemon=True)
            thread.start()
        return True

    @staticmethod
    def _do_send_email(subject: str, html_content: str):
        RESEND_API_KEY = os.getenv("RESEND_API_KEY")
        
        if RESEND_API_KEY:
            try:
                import requests
                headers = {
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json"
                }
                # Resend blocks sending from @gmail.com. Fallback to onboarding@resend.dev
                # if they haven't set a custom domain sender yet.
                from_addr = SMTP_FROM_EMAIL if not SMTP_FROM_EMAIL.endswith("@gmail.com") else "onboarding@resend.dev"
                
                data = {
                    "from": f"CosmoFolio Alerts <{from_addr}>",
                    "to": ADMIN_EMAIL,
                    "subject": subject,
                    "html": html_content
                }
                resp = requests.post("https://api.resend.com/emails", headers=headers, json=data, timeout=10)
                
                if resp.status_code >= 400:
                    print(f"[EMAIL ERROR] Resend API failed: {resp.text}")
                    print("[INFO] Falling back to SMTP...")
                else:
                    return True
            except Exception as e:
                print(f"[EMAIL ERROR] Failed to send email via Resend: {str(e)}")
                print("[INFO] Falling back to SMTP...")

        if not SMTP_PASSWORD:
            print(f"[MOCK EMAIL] Subject: {subject}\n{html_content}")
            try:
                from database import supabase
                supabase.table("error_logs").insert({
                    "user_id": None,
                    "error_type": "EMAIL_CONFIG_MISSING",
                    "message": "Missing SMTP_PASSWORD and RESEND_API_KEY",
                    "stack_trace": "NotificationService._send_email",
                    "page": "backend"
                }).execute()
            except Exception:
                pass
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"CosmoFolio Alerts <{SMTP_FROM_EMAIL}>"
            msg["To"] = ADMIN_EMAIL
            
            # Attach HTML content
            part = MIMEText(html_content, "html")
            msg.attach(part)
            
            if SMTP_PORT == 465:
                server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT)
            else:
                server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
                server.starttls()
                
            with server:
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)
            
            return True
        except Exception as e:
            error_msg = str(e)
            print(f"[EMAIL ERROR] Failed to send email: {error_msg}")
            try:
                from database import supabase
                supabase.table("error_logs").insert({
                    "user_id": None,
                    "error_type": "SMTP_SEND_FAILED",
                    "message": error_msg,
                    "stack_trace": "NotificationService._send_email",
                    "page": "backend"
                }).execute()
            except:
                pass
            return False

    @staticmethod
    def sendSignupAlert(user_data: dict, background_tasks = None):
        subject = "🎉 New CosmoFolio User Registered"
        now = datetime.now().strftime("%d %B %Y - %I:%M %p")
        
        name = user_data.get('name', 'N/A')
        email = user_data.get('email', 'N/A')
        country = user_data.get('country', 'Unknown')
        device = user_data.get('device', 'Unknown')
        login_method = user_data.get('login_method', 'Email')

        html = f"""
        <h2>New User Joined 🚀</h2>
        <p><strong>Name:</strong> {name}</p>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Country:</strong> {country}</p>
        <p><strong>Joined:</strong> {now}</p>
        <p><strong>Login Method:</strong> {login_method}</p>
        <p><strong>Device/Browser:</strong> {device}</p>
        """
        return NotificationService._send_email(subject, html, background_tasks)

    @staticmethod
    def sendSupportEmail(support_data: dict, background_tasks = None):
        subject = f"📬 New Support Request from {support_data.get('name', 'Unknown')}"
        now = datetime.now().strftime("%d %B %Y - %I:%M %p")
        
        name = support_data.get('name', 'N/A')
        email = support_data.get('email', 'N/A')
        message = support_data.get('message', 'No message provided')

        html = f"""
        <h2>New Support Message 📬</h2>
        <p><strong>Name:</strong> {name}</p>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Time:</strong> {now}</p>
        <br/>
        <h3>Message:</h3>
        <p style="white-space: pre-wrap; background: #f4f4f4; padding: 15px; border-radius: 8px;">{message}</p>
        <br/>
        <p><em>Reply directly to {email} to answer this user.</em></p>
        """
        return NotificationService._send_email(subject, html, background_tasks)

    @staticmethod
    def sendPaymentAlert(payment_data: dict, background_tasks = None):
        subject = "💰 CosmoFolio Pro Purchase"
        now = datetime.now().strftime("%d %B %Y - %I:%M %p")
        
        name = payment_data.get('name', 'Unknown')
        email = payment_data.get('email', 'Unknown')
        country = payment_data.get('country', 'Unknown')
        plan = payment_data.get('plan', 'Pro')
        amount = payment_data.get('amount', '0')
        currency = payment_data.get('currency', 'INR')
        provider = payment_data.get('provider', 'Razorpay')
        payment_id = payment_data.get('payment_id', 'N/A')

        html = f"""
        <h2>NEW PAYMENT RECEIVED 🚀</h2>
        <p><strong>User:</strong> {name} ({email})</p>
        <p><strong>Country:</strong> {country}</p>
        <p><strong>Plan:</strong> {plan}</p>
        <p><strong>Amount:</strong> {amount} {currency}</p>
        <p><strong>Provider:</strong> {provider}</p>
        <p><strong>Payment ID:</strong> {payment_id}</p>
        <p><strong>Date:</strong> {now}</p>
        """
        return NotificationService._send_email(subject, html, background_tasks)

    @staticmethod
    def sendWeeklyReport(stats: dict):
        subject = "📊 CosmoFolio Weekly Analytics Report"
        now = datetime.now().strftime("%d %B %Y")
        
        freemium_users = stats.get('freemium_users', 0)
        pro_upgrades = stats.get('pro_upgrades', 0)
        pdf_effort = stats.get('pdf_effort', 0)
        total_revenue = stats.get('total_revenue', 0)
        currency = stats.get('currency', 'INR')
        error_count = stats.get('error_count', 0)
        active_projects = stats.get('active_projects', 0)

        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; text-align: center;">Weekly Analytics Report</h2>
            <p style="text-align: center; color: #666;">{now}</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <h3 style="color: #444; border-bottom: 2px solid #ddd; padding-bottom: 10px;">User Metrics</h3>
                <p><strong>Freemium Users:</strong> {freemium_users}</p>
                <p><strong>New Pro Upgrades:</strong> {pro_upgrades}</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <h3 style="color: #444; border-bottom: 2px solid #ddd; padding-bottom: 10px;">Platform Usage</h3>
                <p><strong>Active Projects Created:</strong> {active_projects}</p>
                <p><strong>PDF Export Effort:</strong> {pdf_effort} exports</p>
            </div>

            <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <h3 style="color: #2e7d32; border-bottom: 2px solid #a5d6a7; padding-bottom: 10px;">Revenue</h3>
                <p><strong>Total Revenue This Week:</strong> {total_revenue} {currency}</p>
            </div>

            <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <h3 style="color: #c62828; border-bottom: 2px solid #ef9a9a; padding-bottom: 10px;">System Health</h3>
                <p><strong>Total Errors Logged:</strong> {error_count}</p>
            </div>
            
            <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #888;">Automated by CosmoFolio Backend</p>
        </div>
        """
        return NotificationService._send_email(subject, html)

    @staticmethod
    def sendBoostPackAlert(payment_data: dict, background_tasks = None):
        subject = "🚀 Boost Pack Purchased"
        
        name = payment_data.get('name', 'Unknown')
        email = payment_data.get('email', 'Unknown')
        amount = payment_data.get('amount', '0')
        packs = payment_data.get('total_packs', 0)
        pages = payment_data.get('new_page_limit', 0)
        downloads = payment_data.get('new_download_limit', 0)

        html = f"""
        <h2>BOOST PACK PURCHASED 🚀</h2>
        <p><strong>User:</strong> {name} ({email})</p>
        <p><strong>Amount:</strong> {amount}</p>
        <p><strong>Total Boost Packs:</strong> {packs}</p>
        <p><strong>New Page Limit:</strong> {pages}</p>
        <p><strong>New Download Limit:</strong> {downloads}</p>
        """
        return NotificationService._send_email(subject, html, background_tasks)

    @staticmethod
    def sendPaymentFailedAlert(error_data: dict, background_tasks = None):
        subject = "⚠️ Payment Failed"
        
        email = error_data.get('email', 'Unknown')
        amount = error_data.get('amount', '0')
        method = error_data.get('method', 'Unknown')
        reason = error_data.get('reason', 'Unknown error')
        gateway = error_data.get('gateway_response', '')

        html = f"""
        <h2>Payment Failed</h2>
        <p><strong>User:</strong> {email}</p>
        <p><strong>Amount Attempted:</strong> {amount}</p>
        <p><strong>Method:</strong> {method}</p>
        <p><strong>Reason:</strong> {reason}</p>
        <p><strong>Gateway Response:</strong> {gateway}</p>
        """
        return NotificationService._send_email(subject, html, background_tasks)

    @staticmethod
    def sendErrorAlert(error_data: dict, background_tasks = None):
        subject = "🚨 CosmoFolio Error Detected"
        now = datetime.now().strftime("%d %B %Y - %I:%M %p")

        user = error_data.get('user', 'Anonymous')
        page = error_data.get('page', 'Unknown URL')
        action = error_data.get('action', 'Unknown action')
        message = error_data.get('message', 'No message provided')
        stack = error_data.get('stack_trace', '')
        browser = error_data.get('browser', 'Unknown')
        device = error_data.get('device', 'Unknown')

        html = f"""
        <h2 style="color: red;">Error Detected</h2>
        <p><strong>Time:</strong> {now}</p>
        <p><strong>User:</strong> {user}</p>
        <p><strong>Page:</strong> {page}</p>
        <p><strong>Action:</strong> {action}</p>
        <p><strong>Error Message:</strong> {message}</p>
        <p><strong>Browser/Device:</strong> {browser} / {device}</p>
        <h3>Stack Trace:</h3>
        <pre style="background: #f4f4f4; padding: 10px; overflow-x: auto;">{stack}</pre>
        """
        return NotificationService._send_email(subject, html, background_tasks)

    @staticmethod
    def sendDailyReport(stats: dict):
        subject = "📊 CosmoFolio Daily Report"
        
        new_users = stats.get('new_users', 0)
        total_users = stats.get('total_users', 0)
        portfolios = stats.get('portfolios_created', 0)
        exports = stats.get('pdf_exports', 0)
        upgrades = stats.get('pro_upgrades', 0)
        revenue = stats.get('revenue', 0)
        failed_payments = stats.get('failed_payments', 0)
        top_errors = stats.get('top_errors', [])
        top_templates = stats.get('top_templates', [])

        errors_html = "".join([f"<li>{e['msg']} - {e['count']} users</li>" for e in top_errors]) or "<li>None</li>"
        templates_html = "".join([f"<li>{t['name']} - {t['count']} uses</li>" for t in top_templates]) or "<li>None</li>"

        html = f"""
        <h2>Daily Health Summary</h2>
        <table style="width: 100%; max-width: 600px; text-align: left;">
            <tr><th>New Users Today:</th><td>{new_users}</td></tr>
            <tr><th>Total Users:</th><td>{total_users}</td></tr>
            <tr><th>Portfolios Created:</th><td>{portfolios}</td></tr>
            <tr><th>PDF Exports:</th><td>{exports}</td></tr>
            <tr><th>Pro Upgrades:</th><td>{upgrades}</td></tr>
            <tr><th>Revenue:</th><td>{revenue}</td></tr>
            <tr><th>Failed Payments:</th><td>{failed_payments}</td></tr>
        </table>
        
        <h3>Top Errors</h3>
        <ul>{errors_html}</ul>

        <h3>Most Used Templates</h3>
        <ul>{templates_html}</ul>
        """
        return NotificationService._send_email(subject, html)

    @staticmethod
    def sendAmbassadorJoined(data: dict):
        subject = f"🤝 New Ambassador Joined: {data.get('name', 'User')}"
        html = f"""
        <h2>New Ambassador Joined 🤝</h2>
        <p><strong>Name:</strong> {data.get('name', 'N/A')}</p>
        <p><strong>Email:</strong> {data.get('email', 'N/A')}</p>
        <p><strong>Referral Code:</strong> {data.get('code', 'N/A')}</p>
        """
        return NotificationService._send_email(subject, html)
        
    @staticmethod
    def sendAmbassadorSale(ambassador_id: str, commission: float):
        # Fire and forget query to get ambassador details
        try:
            from database import supabase
            res = supabase.table("users").select("name, email").eq("id", ambassador_id).execute()
            if res.data:
                name = res.data[0].get("name", "Ambassador")
                email = res.data[0].get("email", "N/A")
                subject = f"💸 Ambassador Sale: {name} earned commission!"
                html = f"""
                <h2>Ambassador Sale Generated 💸</h2>
                <p><strong>Name:</strong> {name}</p>
                <p><strong>Email:</strong> {email}</p>
                <p><strong>Commission Earned:</strong> ₹{commission:.2f}</p>
                <p>This amount is now in their pending balance.</p>
                """
                return NotificationService._send_email(subject, html)
        except:
            pass
            
    @staticmethod
    def sendAmbassadorUpgraded(ambassador_id: str, new_tier: str):
        try:
            from database import supabase
            res = supabase.table("users").select("name, email").eq("id", ambassador_id).execute()
            if res.data:
                name = res.data[0].get("name", "Ambassador")
                email = res.data[0].get("email", "N/A")
                subject = f"🚀 Ambassador Leveled Up! {name} -> {new_tier.upper()}"
                html = f"""
                <h2>Ambassador Auto-Upgrade 🚀</h2>
                <p><strong>Name:</strong> {name}</p>
                <p><strong>Email:</strong> {email}</p>
                <p><strong>New Tier:</strong> {new_tier.upper()}</p>
                """
                return NotificationService._send_email(subject, html)
        except:
            pass
            
    @staticmethod
    def sendWithdrawalRequested(data: dict):
        subject = f"💰 Withdrawal Request: {data.get('name', 'User')} ({data.get('amount')})"
        html = f"""
        <h2>New Withdrawal Request 💰</h2>
        <p><strong>Name:</strong> {data.get('name', 'N/A')}</p>
        <p><strong>Email:</strong> {data.get('email', 'N/A')}</p>
        <p><strong>Amount:</strong> {data.get('amount', 'N/A')}</p>
        <p><strong>Method:</strong> {data.get('method', 'N/A')}</p>
        <p><strong>Details (UPI/Email):</strong> {data.get('details', 'N/A')}</p>
        <br/>
        <p><i>Please process this manually via your bank or PayPal and update the user if needed.</i></p>
        """
        return NotificationService._send_email(subject, html)
