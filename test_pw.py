import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def main():
    try:
        from backend.services.pdf_generator import generate_portfolio_pdf
        import jwt
        from datetime import datetime, timedelta
        
        project_id = "945ba699-7af1-4a0f-9d87-037d57fe42f1"
        
        # Let's get the real user ID
        from supabase import create_client
        url = "https://rjobifgysmovmcvhdlnd.supabase.co"
        key = "sb_publishable_IsZjamlpYF9KrkJ07-Cikg_Lgl_UFoB"
        supa = create_client(url, key)
        proj = supa.table("projects").select("user_id").eq("id", project_id).execute()
        user_id = proj.data[0]["user_id"]
        
        # Generate token
        headless_token = jwt.encode(
            {"project_id": project_id, "user_id": user_id, "exp": datetime.utcnow() + timedelta(minutes=5)},
            "super-secret-headless-key",
            algorithm="HS256"
        )
        
        print("Running playwright...")
        pdf_bytes = await generate_portfolio_pdf(project_id, headless_token)
        print(f"Success! PDF size: {len(pdf_bytes)}")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
