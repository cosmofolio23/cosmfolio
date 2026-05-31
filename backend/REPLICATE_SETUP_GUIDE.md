# Replicate API Setup Guide

**Purpose:** Configure Replicate API for AI-powered content generation  
**Estimated Time:** 5-10 minutes  
**Difficulty:** Beginner  
**Cost:** Free (with free tier, $0.0025/second for paid)

---

## Quick Start (5 minutes)

### 1. Create Replicate Account

1. Go to [replicate.com](https://replicate.com)
2. Click "Sign In" → "Create Account"
3. Sign up with email or GitHub

### 2. Get API Token

1. Go to Account Settings → API Tokens
2. Click "Create Token"
3. Copy the token (starts with `r8_`)
4. Keep it safe (don't commit to git!)

### 3. Set Environment Variable

**macOS/Linux:**
```bash
export REPLICATE_API_TOKEN=r8_your_token_here
```

**Windows PowerShell:**
```powershell
$env:REPLICATE_API_TOKEN="r8_your_token_here"
```

**Windows Command Prompt:**
```cmd
set REPLICATE_API_TOKEN=r8_your_token_here
```

### 4. Verify Setup

```bash
# Start the server
python main.py

# In another terminal, test the endpoint
curl -H "Authorization: Bearer your_auth_token" \
  http://localhost:8000/api/portfolios/ai-tones
```

**Expected Response:**
```json
{
  "tones": [
    {"name": "academic", "description": "..."},
    {"name": "professional", "description": "..."},
    ...
  ]
}
```

---

## Detailed Setup

### Step 1: Create Replicate Account

**Visit:** https://replicate.com

Click **"Sign In"** in top-right corner.

![Replicate Homepage](https://replicate.com/static/images/homepage.png)

If you don't have an account:
- Click **"Create Account"**
- Sign up with **Email** or **GitHub**
- Verify your email

### Step 2: Get API Token

Navigate to:
**Settings** → **API Tokens** (or https://replicate.com/account/api-tokens)

Click **"Create token"**

![Create Token](https://replicate.com/static/images/api-token.png)

You'll see a token like:
```
r8_ABCDefghIJKlmnopqrSTUvwxyz1234567890
```

**⚠️ IMPORTANT:**
- Copy this token immediately
- You won't be able to see it again
- Never share or commit to git
- Use for server-side only (never frontend)

### Step 3: Store in Environment

**Option A: `.env` File (Development)**

Create or update `backend/.env`:
```bash
# Replicate API Configuration
REPLICATE_API_TOKEN=r8_your_actual_token_here
```

Then load it in Python:
```python
from dotenv import load_dotenv
load_dotenv()
```

**Option B: System Environment (Production)**

Set globally for your system:

**macOS/Linux (Bash/Zsh):**
```bash
# Add to ~/.bashrc or ~/.zshrc
export REPLICATE_API_TOKEN=r8_your_token_here

# Apply immediately
source ~/.bashrc  # or source ~/.zshrc
```

**Windows PowerShell:**
```powershell
# Set for current session
$env:REPLICATE_API_TOKEN = "r8_your_token_here"

# Set permanently
[System.Environment]::SetEnvironmentVariable("REPLICATE_API_TOKEN", "r8_your_token_here", "User")
```

**Option C: Docker (Containerized)**

In Dockerfile:
```dockerfile
ENV REPLICATE_API_TOKEN=r8_your_token_here
```

Or via docker-compose:
```yaml
environment:
  REPLICATE_API_TOKEN: r8_your_token_here
```

Or at runtime:
```bash
docker run -e REPLICATE_API_TOKEN=r8_your_token_here ...
```

### Step 4: Verify Installation

```bash
# Check environment variable is set
# macOS/Linux
echo $REPLICATE_API_TOKEN

# Windows PowerShell
echo $env:REPLICATE_API_TOKEN

# Should output: r8_your_token_here
```

Test the API:
```bash
# Start backend server
python backend/main.py

# In another terminal, get available tones
curl -X GET "http://localhost:8000/api/portfolios/ai-tones" \
  -H "Authorization: Bearer eyJhbGc..." # your Firebase token
```

---

## Free Tier Details

### What's Included

| Feature | Free Tier | Paid |
|---------|-----------|------|
| API Access | ✅ Unlimited | ✅ Unlimited |
| Models | ✅ All models | ✅ All models |
| First month | ✅ Free credits | - |
| Cost | **Free first month** | $0.0025/second |
| Support | ✅ Community | ✅ Priority |
| Rate limits | ✅ No | ✅ No |

### Free Credits

- **New accounts:** $10 free credits (first month)
- **Enough for:** ~4,000 model runs (varies by model)
- **Expires:** 1 month from account creation

### Usage Estimation

Average generation (Llama 2):
- **Time:** 20 seconds per request
- **Cost:** 20s × $0.0025/s = $0.05 per request
- **Budget:** $10 ÷ $0.05 = ~200 requests

### Upgrade to Paid

When free credits run out:

1. Go to **Account Settings** → **Billing**
2. Add payment method
3. Set monthly budget (optional)
4. Usage charges appear in invoice

Current pricing:
- **Llama 2 70B:** $0.0025/second (run time)
- **Mistral 7B:** $0.0001/second (much faster!)
- **Other models:** Varies

---

## Models Available

### Recommended for Phase 4

#### Llama 2 70B (Most Capable)
```
Model ID: replicate/llama-2-70b-chat:2796214f78e5...
Time per request: 20-30 seconds
Cost: $0.0025/second = ~$0.05 per request
Best for: High quality, long responses
```

#### Mistral 7B (Fastest)
```
Model ID: mistralai/mistral-7b-instruct-v0.2:39e3d...
Time per request: 5-10 seconds
Cost: $0.0001/second = ~$0.001 per request
Best for: Quick generation, cost savings
```

#### Neural Chat 7B (Balanced)
```
Model ID: replicate/neural-chat-7b-v3-1:6a98652f...
Time per request: 8-15 seconds
Cost: Similar to Mistral
Best for: Balanced speed/quality
```

### How to Add New Models

1. Find model on replicate.com
2. Copy model URL (e.g., `replicate/llama-2-70b-chat:...`)
3. Add to `services/ai_generation.py`:

```python
self.models = {
    "llama2": "replicate/llama-2-70b-chat:2796214f...",
    "mistral": "mistralai/mistral-7b-instruct-v0.2:39e3d...",
    "your_model": "your/model-name:sha256hash..."  # Add here
}
```

---

## Troubleshooting

### Issue: "REPLICATE_API_TOKEN not set"

**Cause:** Environment variable not found

**Solution:**
```bash
# Check if set
echo $REPLICATE_API_TOKEN

# If empty, set it
export REPLICATE_API_TOKEN=r8_your_token

# Verify
echo $REPLICATE_API_TOKEN  # Should show token
```

### Issue: "Invalid API token"

**Cause:** Token is expired or incorrect

**Solution:**
1. Go to https://replicate.com/account/api-tokens
2. Create a new token
3. Replace old token in `.env`
4. Restart server

### Issue: "Model not found"

**Cause:** Model URL is incorrect or deprecated

**Solution:**
1. Go to https://replicate.com/models
2. Search for the model
3. Copy exact URL from model page
4. Update in `services/ai_generation.py`

### Issue: "Rate limit exceeded"

**Cause:** Making requests too fast (free tier)

**Solution:**
```python
# Current rate limit (in ai_generation.py)
REPLICATE_FREE_TIER_DELAY = 1.0  # seconds between calls

# Increase delay if needed
REPLICATE_FREE_TIER_DELAY = 2.0  # 2 seconds between calls
```

### Issue: Slow responses (>30 seconds)

**Cause:** Replicate queue or model size

**Solution:**
- Use Mistral 7B instead of Llama 2 70B
- Check Replicate status: https://replicate.com/status
- Retry after a minute

### Issue: "Connection refused"

**Cause:** Replicate API unreachable

**Solution:**
1. Check internet connection
2. Check Replicate status page
3. Fallback to mock mode works automatically

---

## Configuration Options

### Change Default Model

In `backend/services/ai_generation.py`:

```python
# Default model (currently: llama2)
self.default_model = "llama2"

# Change to Mistral for speed
self.default_model = "mistral"  # Much faster!
```

### Adjust Rate Limiting

```python
# For paid tier (no limits)
REPLICATE_FREE_TIER_DELAY = 0

# For free tier (1-2 requests/minute)
REPLICATE_FREE_TIER_DELAY = 1.0  # or 2.0

# Retry configuration
REPLICATE_MAX_RETRIES = 3  # Number of retry attempts
REPLICATE_RETRY_DELAY = 2.0  # Seconds between retries
```

### Control Response Quality

In route handlers:

```python
# Lower temperature = more consistent
result = await ai_service._call_llm(
    prompt,
    temperature=0.3,  # Less creative
    max_tokens=200
)

# Higher temperature = more creative
result = await ai_service._call_llm(
    prompt,
    temperature=0.9,  # More creative
    max_tokens=500
)
```

### Mock Mode (for development)

```bash
# Leave REPLICATE_API_TOKEN empty to use mock mode
unset REPLICATE_API_TOKEN

# Or set to empty in .env
# REPLICATE_API_TOKEN=

# All API calls will return mock data
```

---

## Best Practices

### ✅ DO

- ✅ Use environment variables for tokens
- ✅ Start with Mistral 7B (cheaper, faster)
- ✅ Monitor usage in Replicate dashboard
- ✅ Implement retry logic for failures
- ✅ Cache results when possible
- ✅ Use mock mode for development
- ✅ Set monthly budget limits

### ❌ DON'T

- ❌ Commit tokens to git
- ❌ Share tokens in logs
- ❌ Use token in frontend code
- ❌ Make simultaneous requests (respect rate limits)
- ❌ Leave token in code comments
- ❌ Use token in public repositories
- ❌ Share token via unencrypted channels

---

## Monitoring & Analytics

### Check API Usage

1. Go to https://replicate.com/account/usage
2. See requests, API calls, costs
3. View detailed usage history

### Set Budget Limits

1. Go to **Settings** → **Billing**
2. Click **"Set monthly budget"**
3. Enter max spending (e.g., $50)
4. Replicate will stop accepting requests if exceeded

### Cost Estimation

```
Scenario: Generate 100 project descriptions

Using Llama 2 70B:
- Time: 20 seconds per request
- Cost: $0.05 per request
- Total: 100 × $0.05 = $5.00
- Free tier: ✅ Covered by $10 credit

Using Mistral 7B:
- Time: 8 seconds per request
- Cost: $0.001 per request
- Total: 100 × $0.001 = $0.10
- Free tier: ✅ Minimal cost
```

---

## Integration with CosmoFolio

### How It Works

1. **User requests generation** → API endpoint called
2. **Service receives request** → Constructs prompt
3. **Replicate API called** → LLM generates content
4. **Response parsed** → Formatted for API
5. **Content saved** → Stored in database
6. **User receives** → Generated content displayed

### Fallback Behavior

If Replicate API fails:
```
Request → Service tries Replicate
         ↓ (fails or no token)
         → Falls back to mock text
         → Returns gracefully
         → User sees content (quality varies)
```

### Rate Limiting in Action

```
Request 1: 0s  → API call made ✅
Request 2: <1s → Delayed until 1s ⏳
Request 3: 1s  → API call made ✅
Request 4: 2s  → API call made ✅
```

---

## Testing Your Setup

### Quick Test Script

Create `test_replicate.py`:

```python
import os
from dotenv import load_dotenv
from services.ai_generation import AiGenerationService
import asyncio

load_dotenv()

async def test():
    service = AiGenerationService()
    
    if not service.use_replicate:
        print("⚠️ Replicate not configured, using mock mode")
    else:
        print("✅ Replicate configured and ready!")
    
    # Test mock generation
    result = await service.generate_project_description(
        project_type="residential",
        location="San Francisco",
        project_title="Modern Tower",
        tone="professional"
    )
    
    print("\nGenerated content:")
    print(f"Description: {result['description'][:100]}...")
    print(f"Tone: {result['tone']}")

asyncio.run(test())
```

Run it:
```bash
python test_replicate.py
```

---

## Support

### Replicate Help

- **Docs:** https://replicate.com/docs
- **Status:** https://replicate.com/status
- **Discord:** https://discord.gg/5RKpYqt9
- **Email:** support@replicate.com

### CosmoFolio Support

- **GitHub Issues:** Report problems here
- **Documentation:** Check PHASE_4_API_DOCUMENTATION.md
- **Troubleshooting:** See PHASE_4_TESTING_CHECKLIST.md

---

## Frequently Asked Questions

**Q: Is Replicate free?**  
A: Yes! Free tier includes $10 credits (first month). After that, standard pricing applies.

**Q: Can I use Replicate without a credit card?**  
A: Yes, but only during the first month. After free credits expire, you need a payment method.

**Q: Which model should I use?**  
A: For Phase 4, Mistral 7B is recommended (faster and cheaper). Use Llama 2 70B for higher quality.

**Q: How long do requests take?**  
A: 8-30 seconds depending on model. Mistral 7B: 8-10s, Llama 2 70B: 20-30s.

**Q: What if Replicate is down?**  
A: Automatic fallback to mock text generation. System stays operational.

**Q: Can I upgrade models later?**  
A: Yes! Change `REPLICATE_API_TOKEN` and update model URLs anytime.

**Q: Is my data sent to Replicate?**  
A: Yes, prompts are sent to generate content. Don't include sensitive data in prompts.

**Q: How do I monitor usage?**  
A: Check https://replicate.com/account/usage for detailed stats and costs.

---

## Migration Path

### Phase 4 (Current)
- ✅ Free tier with Replicate
- ✅ Free tier rate limiting
- ✅ Cost: ~$0 (free credits)

### Phase 5
- 📋 Add paid tier support
- 📋 Remove rate limiting when paid
- 📋 Implement usage analytics

### Phase 6+
- 📋 Custom model fine-tuning
- 📋 Multi-provider support
- 📋 Advanced billing integration

---

## Next Steps

1. ✅ Sign up for Replicate account
2. ✅ Get API token
3. ✅ Set REPLICATE_API_TOKEN environment variable
4. ✅ Start server and test endpoints
5. ✅ Monitor usage in Replicate dashboard
6. ✅ Proceed to Phase 5 when ready

---

**Setup Complete!** Your CosmoFolio AI integration is ready.  
**Questions?** Check the Replicate docs or contact support.  
**Feedback?** Create an issue on GitHub.

---

**Last Updated:** 2026-05-30  
**Version:** 1.0.0  
**Maintained By:** CosmoFolio Team
