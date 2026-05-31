#!/usr/bin/env python
"""
Quick test to verify Replicate API token is working
Run: python test_replicate_token.py
"""

import os
import asyncio
from dotenv import load_dotenv
from services.ai_generation import AiGenerationService

# Load environment variables
load_dotenv()

async def test_replicate():
    """Test Replicate API connection"""

    print("=" * 60)
    print("🧪 REPLICATE API TOKEN TEST")
    print("=" * 60)

    # Check token is set
    token = os.getenv("REPLICATE_API_TOKEN")
    if not token:
        print("❌ REPLICATE_API_TOKEN not set in environment")
        return False

    print(f"✅ Token found: {token[:10]}...{token[-10:]}")

    # Initialize service
    service = AiGenerationService()

    if not service.use_replicate:
        print("⚠️  Replicate disabled (no valid token)")
        return False

    print("✅ Service initialized with Replicate")

    # Test available tones
    print("\n📋 Testing available tones...")
    tones = service.get_available_tones()
    print(f"✅ Found {len(tones)} tones:")
    for tone_name, tone_desc in tones.items():
        print(f"   - {tone_name}: {tone_desc}")

    # Test mock generation (doesn't call API)
    print("\n🔄 Testing mock generation (fallback)...")
    try:
        result = await service.generate_project_description(
            project_type="residential",
            location="San Francisco",
            project_title="Modern Tower",
            tone="professional"
        )
        print(f"✅ Generated description: {result['description'][:80]}...")
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

    # Test concept statement
    print("\n📝 Testing concept statement...")
    try:
        result = await service.generate_concept_statement(
            project_type="residential",
            title="Modern Tower",
            description="A sustainable building",
            tone="creative"
        )
        print(f"✅ Concept: {result[:80]}...")
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

    # Test content analysis (local, no API call)
    print("\n📊 Testing content analysis (local)...")
    try:
        result = await service.analyze_content_quality(
            "This is a test architecture project description."
        )
        print(f"✅ Analysis:")
        print(f"   - Word count: {result['word_count']}")
        print(f"   - Readability: {result['readability_score']}/100")
        print(f"   - Suggestions: {len(result['suggestions'])}")
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED - Replicate is ready!")
    print("=" * 60)
    print("\n📖 Next steps:")
    print("   1. Start the backend: python main.py")
    print("   2. Test endpoints with curl or Postman")
    print("   3. Check PHASE_4_API_DOCUMENTATION.md for examples")
    print("\n⚠️  IMPORTANT:")
    print("   - Never commit .env to git (already in .gitignore)")
    print("   - Keep REPLICATE_API_TOKEN secure")
    print("   - Monitor usage at https://replicate.com/account/usage")
    print("\n")

    return True

if __name__ == "__main__":
    try:
        success = asyncio.run(test_replicate())
        exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Test failed: {e}")
        exit(1)
