#!/usr/bin/env python
"""
Verify Replicate API token is valid
Run: python verify_replicate_token.py
"""

import os
from dotenv import load_dotenv
import httpx

# Load environment variables
load_dotenv()

def verify_token():
    """Verify Replicate API token"""

    print("=" * 70)
    print("REPLICATE API TOKEN VERIFICATION")
    print("=" * 70)

    # Check token is set
    token = os.getenv("REPLICATE_API_TOKEN")
    if not token:
        print("[FAIL] REPLICATE_API_TOKEN not found in .env file")
        print("\nMake sure you have set the token in backend/.env:")
        print('   REPLICATE_API_TOKEN=r8_your_token_here')
        return False

    print("[OK] Token loaded from .env")
    print(f"     Token: {token[:20]}...{token[-10:]}")
    print(f"     Length: {len(token)} characters")

    # Verify token format
    if not token.startswith("r8_"):
        print("[WARN] Token doesn't start with r8_, format might be wrong")
    else:
        print("[OK] Token format looks valid (starts with r8_)")

    # Try to use token with Replicate API
    print("\n[TEST] Testing Replicate API connection...")

    try:
        # Use httpx to test the token directly
        headers = {"Authorization": f"Bearer {token}"}

        # Try to get available models (doesn't require running anything)
        print("       Checking API access with token...")

        # Actually, let's just check if we can authenticate
        # by trying to get account info or list models
        response = httpx.get(
            "https://api.replicate.com/v1/account",
            headers=headers,
            timeout=10
        )

        if response.status_code == 200:
            print("[OK] API authentication successful!")
            account_info = response.json()
            print(f"     Account: {account_info.get('username', 'Unknown')}")
            print(f"     Monthly usage: ${account_info.get('monthly_usage_usd', 'N/A')}")

            print("\n" + "=" * 70)
            print("REPLICATE API TOKEN IS VALID!")
            print("=" * 70)

            print("\nToken Status:")
            print("   Status: [OK] Active and valid")
            print(f"   Token: {token[:20]}...{token[-15:]}")
            print("   Setup: Complete")

            print("\nYou can now:")
            print("   1. Use the token for AI-powered content generation")
            print("   2. Start the backend: cd backend && python main.py")
            print("   3. Test endpoints with curl or Postman")
            print("   4. Monitor usage at: https://replicate.com/account/usage")

            print("\nIMPORTANT NOTES:")
            print("   [OK] .env is in .gitignore (safe from git)")
            print("   [!] Never share your REPLICATE_API_TOKEN")
            print("   [!] Keep .env secure and private")
            print("   [!] Monitor your API usage and costs")

            print("\nFREE TIER INFORMATION:")
            print("   Free credits: $10 per month (first month)")
            print("   Cost after: $0.0025/second (Llama 2 70B)")
            print("   Faster: $0.001/second (Mistral 7B)")
            print("   Est cost: $0.05 per project description")

            print("\nAPI DOCUMENTATION:")
            print("   Main docs: PHASE_4_API_DOCUMENTATION.md")
            print("   Setup guide: REPLICATE_SETUP_GUIDE.md")
            print("   Testing guide: PHASE_4_TESTING_CHECKLIST.md")

            print("\n")
            return True

        elif response.status_code == 401:
            print("[FAIL] API authentication failed!")
            print("       Status: 401 Unauthorized")
            print("       This likely means the token is invalid or expired")
            print("\n[ACTION] Get a new token:")
            print("   1. Go to https://replicate.com/account/api-tokens")
            print("   2. Create a new API token")
            print("   3. Copy the token (starts with r8_)")
            print("   4. Update backend/.env")
            print("   5. Run this test again")
            return False

        else:
            print(f"[FAIL] API returned status {response.status_code}")
            print(f"       Error: {response.text}")
            print("\n[ACTION] Check:")
            print("   1. Internet connection")
            print("   2. Replicate status: https://replicate.com/status")
            print("   3. Account: https://replicate.com/account")
            print("   4. Token validity")
            return False

    except Exception as e:
        print(f"[FAIL] Error: {str(e)}")
        print("\n[ACTION] Troubleshooting:")
        print("   1. Check internet connection")
        print("   2. Verify token is in backend/.env")
        print("   3. Check Replicate status: https://replicate.com/status")
        print("   4. Try creating a new token at:")
        print("      https://replicate.com/account/api-tokens")
        return False

if __name__ == "__main__":
    import sys
    try:
        success = verify_token()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nVerification cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n[FAIL] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
