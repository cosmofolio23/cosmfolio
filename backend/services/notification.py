import os
import threading
import json
import urllib.request
from datetime import datetime

# Configure in .env
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "thecosmofolio@gmail.com")
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")

class NotificationService:
    @staticmethod
    def _send_email(subject: str, html_content: str):
        # Run in background thread so it doesn't block the request
        thread = threading.Thread(target=NotificationService._do_send_email, args=(subject, html_content), daemon=True)
        thread.start()
        return True

    @staticmethod
    def _do_send_email(subject: str, html_content: str):
        if not RESEND_API_KEY:
            print(f"[MOCK EMAIL] Subject: {subject}\n{html_content}")
            try:
                from database import supabase
                supabase.table("error_logs").insert({
                    "user_id": "system",
                    "error_type": "EMAIL_CONFIG_MISSING",
                    "error_message": "Missing RESEND_API_KEY",
                    "stack_trace": "NotificationService._send_email",
                    "page_url": "backend"
                }).execute()
            except Exception:
                pass
            return False

        try:
            url = "https://api.resend.com/emails"
            payload = {
                "from": "CosmoFolio Alerts <onboarding@resend.dev>",
                "to": ADMIN_EMAIL,
                "subject": subject,
                "html": html_content
            }
            data = json.dumps(payload).encode("utf-8")
            
            req = urllib.request.Request(url, data=data, method="POST")
            req.add_header("Authorization", f"Bearer {RESEND_API_KEY}")
            req.add_header("Content-Type", "application/json")
            req.add_header("User-Agent", "CosmoFolio/1.0 (Python)")
            
            with urllib.request.urlopen(req, timeout=15) as response:
                if response.status >= 400:
                    raise Exception(f"Resend API Error: {response.read().decode('utf-8')}")
            
            return True
        except Exception as e:
            error_msg = str(e)
            print(f"[EMAIL ERROR] Failed to send email: {error_msg}")
            try:
                from database import supabase
                supabase.table("error_logs").insert({
                    "user_id": "system",
                    "error_type": "SMTP_SEND_FAILED",
                    "error_message": error_msg,
                    "stack_trace": "NotificationService._send_email",
                    "page_url": "backend"
                }).execute()
            except:
                pass
            return False

    @staticmethod
    def sendSignupAlert(user_data: dict):
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
        return NotificationService._send_email(subject, html)

    @staticmethod
    def sendSupportEmail(support_data: dict):
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
        return NotificationService._send_email(subject, html)

    @staticmethod
    def sendPaymentAlert(payment_data: dict):
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
        return NotificationService._send_email(subject, html)

    @staticmethod
    def sendBoostPackAlert(payment_data: dict):
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
        return NotificationService._send_email(subject, html)

    @staticmethod
    def sendPaymentFailedAlert(error_data: dict):
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
        return NotificationService._send_email(subject, html)

    @staticmethod
    def sendErrorAlert(error_data: dict):
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
        return NotificationService._send_email(subject, html)

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
