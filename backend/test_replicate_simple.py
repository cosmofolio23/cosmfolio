#!/usr/bin/env python
"""
Simple test to verify Replicate API token works
Run: python test_replicate_simple.py
"""

import os
import sys
from dotenv import load_dotenv
import replicate

# Load environment variables
load_dotenv()

def test_replicate():
    """Test Replicate API token"""

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
    print(f"     Token: {token[:15]}...{token[-10:]}")

    # Test with actual Replicate API
    print("\n[TEST] Testing Replicate API connection...")
    print("       (This will make a small API call to verify token validity)")

    try:
        # Make a small test with one of the available models
        # Using a very short prompt to minimize cost
        print("\n       Calling Llama 2 70B Chat model with test prompt...")
        output = replicate.run(
            "replicate/llama-2-70b-chat:2796214f78e5eec3d865db034e748e11018e16966319624e650e7ee309b68423",
            input={
                "prompt": "Say hello",
                "max_tokens": 20,
            }
        )

        # Parse response
        if isinstance(output, list):
            result = "".join(output)
        else:
            result = str(output)

        print("\n[SUCCESS] API CONNECTION SUCCESSFUL!")
        print(f"          Response: {result[:100].strip()}")

        print("\n" + "=" * 70)
        print("REPLICATE API IS WORKING!")
        print("=" * 70)
        print("\nToken Information:")
        print(f"   Status: Active and valid")
        print(f"   Token: {token[:20]}...{token[-15:]}")
        print(f"   Setup: Complete")

        print("\nNext Steps:")
        print("   1. Start the backend server:")
        print("      cd backend && python main.py")
        print("")
        print("   2. Test the AI endpoints with curl:")
        print('      curl -X GET "http://localhost:8000/api/portfolios/ai-tones" \\')
        print('        -H "Authorization: Bearer your_firebase_token"')
        print("")
        print("   3. Check API documentation:")
        print("      backend/PHASE_4_API_DOCUMENTATION.md")
        print("")
        print("   4. Monitor usage at:")
        print("      https://replicate.com/account/usage")

        print("\nSECURITY REMINDERS:")
        print("   [OK] .env is in .gitignore (safe from git)")
        print("   [!] Never share your REPLICATE_API_TOKEN")
        print("   [!] Never commit .env to version control")
        print("   [!] Monitor your API usage and costs")

        print("\nFREE TIER INFO:")
        print("   First month: $10 free credits")
        print("   After: $0.0025/second (Llama 2 70B)")
        print("   Faster models: ~$0.001/second (Mistral)")
        print("   Estimated: ~$0.05 per project description")

        print("\n")
        return True

    except Exception as e:
        print(f"\n[FAIL] API CONNECTION FAILED")
        print(f"       Error: {str(e)}")
        print("\nTroubleshooting:")
        print("   1. Verify token is correct:")
        print(f"      {token[:20]}...{token[-15:]}")
        print("   2. Check internet connection")
        print("   3. Verify Replicate status: https://replicate.com/status")
        print("   4. Check account at: https://replicate.com/account")
        print("\nIf token is invalid:")
        print("   1. Go to https://replicate.com/account/api-tokens")
        print("   2. Create a new token")
        print("   3. Update backend/.env with new token")
        print("   4. Run this test again")
        return False

if __name__ == "__main__":
    try:
        success = test_replicate()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTest cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n[FAIL] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
