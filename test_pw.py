import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def main():
    try:
        from backend.services.pdf_generator import generate_portfolio_pdf
        # Test with a dummy project id that exists or just let it timeout
        # I need a real project ID to test if it loads, or I can just test with google.com?
        # The function hardcodes frontend_url.
        print("Running playwright...")
        pdf_bytes = await generate_portfolio_pdf("dummy", "mock")
        print(f"Success! PDF size: {len(pdf_bytes)}")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
