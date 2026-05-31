# Phase 4: AI Integration API Documentation

**Status:** 🚀 Implemented
**Version:** 1.0.0
**Last Updated:** 2026-05-30

---

## Overview

Phase 4 introduces AI-powered content generation using the Replicate API with free-tier compatible models (Llama 2, Mistral). All AI endpoints require authentication and support multiple tones for flexible content generation.

**Key Features:**
- ✅ Real LLM integration with Replicate (free tier available)
- ✅ Multiple models supported (Llama 2, Mistral)
- ✅ 5 professional tones (academic, professional, creative, technical, marketing)
- ✅ Content versioning and approval workflow
- ✅ Rate limiting for free tier ($1/hour limit)
- ✅ Usage tracking and analytics
- ✅ Fallback to mock mode when API unavailable

---

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/portfolios/{portfolio_id}/projects/{project_id}/generate-description` | Generate project description |
| POST | `/api/portfolios/{portfolio_id}/projects/{project_id}/generate-concept` | Generate concept statement |
| POST | `/api/portfolios/{portfolio_id}/assets/{asset_id}/generate-caption` | Generate image caption |
| POST | `/api/portfolios/{portfolio_id}/generate-bio` | Generate architect biography |
| POST | `/api/portfolios/{portfolio_id}/projects/{project_id}/suggest-titles` | Suggest project titles |
| POST | `/api/portfolios/{portfolio_id}/generate-taglines` | Generate portfolio taglines |
| GET | `/api/portfolios/ai-tones` | Get available AI tones |
| POST | `/api/portfolios/{portfolio_id}/analyze-content` | Analyze content quality |
| POST | `/api/portfolios/{portfolio_id}/improve-text` | Improve existing text |

**Total:** 9 endpoints across 6 main features

---

## Detailed Endpoint Documentation

### 1. Generate Project Description

Generate comprehensive descriptions for architecture projects with multiple sections.

**Endpoint:** `POST /api/portfolios/{portfolio_id}/projects/{project_id}/generate-description`

**Authentication:** Required (Bearer token)

**Query Parameters:**
| Parameter | Type | Default | Options | Description |
|-----------|------|---------|---------|-------------|
| `tone` | string | professional | academic, professional, creative, technical, marketing | Writing tone for description |

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/portfolios/port_123/projects/proj_456/generate-description?tone=professional" \
  -H "Authorization: Bearer your_token_here"
```

**Success Response (200):**
```json
{
  "portfolio_id": "port_123",
  "project_id": "proj_456",
  "generated_content": {
    "description": "Detailed project description (150-200 words)...",
    "brief": "Brief overview (50-75 words)...",
    "strategy": "Design strategy (100-150 words)..."
  },
  "tone": "professional"
}
```

**Error Responses:**
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (user doesn't own portfolio)
- `404`: Not found (portfolio or project)
- `422`: Unprocessable entity (invalid tone)

---

### 2. Generate Concept Statement

Create compelling concept statements that capture project essence.

**Endpoint:** `POST /api/portfolios/{portfolio_id}/projects/{project_id}/generate-concept`

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Default | Options |
|-----------|------|---------|---------|
| `tone` | string | creative | academic, professional, creative, technical, marketing |

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/portfolios/port_123/projects/proj_456/generate-concept?tone=creative" \
  -H "Authorization: Bearer your_token_here"
```

**Success Response (200):**
```json
{
  "project_id": "proj_456",
  "concept_statement": "A 2-3 sentence statement that captures the architectural vision and essence of the project, demonstrating innovative thinking and thoughtful design principles.",
  "tone": "creative"
}
```

---

### 3. Generate Image Caption

Create professional captions for architectural images.

**Endpoint:** `POST /api/portfolios/{portfolio_id}/assets/{asset_id}/generate-caption`

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image_context` | string | Yes | Description of what's in the image |
| `tone` | string | No | Writing tone (default: professional) |

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/portfolios/port_123/assets/asset_789/generate-caption?image_context=Glass%20and%20steel%20facade%20with%20modern%20geometry&tone=professional" \
  -H "Authorization: Bearer your_token_here"
```

**Success Response (200):**
```json
{
  "asset_id": "asset_789",
  "caption": "A striking glass and steel facade featuring geometric patterns that emphasize the building's modern aesthetic and innovative design approach.",
  "tone": "professional"
}
```

---

### 4. Generate Portfolio Bio

Create architect biographies that establish credibility.

**Endpoint:** `POST /api/portfolios/{portfolio_id}/generate-bio`

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `architect_name` | string | Yes | Full name of architect |
| `specialties` | list | No | List of specialties (e.g., ["residential", "sustainable"]) |
| `experience_years` | integer | No | Years of professional experience |
| `tone` | string | No | Writing tone (default: professional) |

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/portfolios/port_123/generate-bio?architect_name=Jane%20Doe&specialties=residential&specialties=sustainable&experience_years=15&tone=professional" \
  -H "Authorization: Bearer your_token_here"
```

**Success Response (200):**
```json
{
  "portfolio_id": "port_123",
  "biography": "Jane Doe is a distinguished architect with 15 years of experience specializing in residential and sustainable design. Her work demonstrates a commitment to innovative solutions that balance aesthetic excellence with environmental responsibility...",
  "tone": "professional"
}
```

---

### 5. Suggest Project Titles

Generate creative and professional project titles.

**Endpoint:** `POST /api/portfolios/{portfolio_id}/projects/{project_id}/suggest-titles`

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| `count` | integer | 5 | 1-10 | Number of titles to suggest |

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/portfolios/port_123/projects/proj_456/suggest-titles?count=5" \
  -H "Authorization: Bearer your_token_here"
```

**Success Response (200):**
```json
{
  "project_id": "proj_456",
  "suggested_titles": [
    "Urban Renewal: Modern Living Space",
    "The Bridge Project: Connecting Communities",
    "Skyline Evolution: A Contemporary Vision",
    "Geometric Harmony: Residential Tower",
    "Vision 2025: Sustainable Architecture"
  ],
  "count": 5
}
```

---

### 6. Generate Portfolio Taglines

Create memorable taglines for architecture firms.

**Endpoint:** `POST /api/portfolios/{portfolio_id}/generate-taglines`

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `firm_name` | string | Required | Name of architecture firm |
| `specialties` | list | [] | List of firm specialties |
| `tone` | string | creative | Writing tone |

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/portfolios/port_123/generate-taglines?firm_name=Modern%20Architecture%20Inc&specialties=residential&specialties=commercial&tone=creative" \
  -H "Authorization: Bearer your_token_here"
```

**Success Response (200):**
```json
{
  "portfolio_id": "port_123",
  "suggested_taglines": [
    "Building Tomorrow's Vision Today",
    "Where Innovation Meets Design",
    "Spaces That Inspire",
    "Transforming Communities Through Design",
    "Modern Spaces, Timeless Design"
  ],
  "tone": "creative"
}
```

---

### 7. Get Available AI Tones

List all available writing tones with descriptions.

**Endpoint:** `GET /api/portfolios/ai-tones`

**Authentication:** Required

**Example Request:**
```bash
curl -X GET "http://localhost:8000/api/portfolios/ai-tones" \
  -H "Authorization: Bearer your_token_here"
```

**Success Response (200):**
```json
{
  "tones": [
    {
      "name": "academic",
      "description": "Formal, scholarly, well-researched tone for academic presentation"
    },
    {
      "name": "professional",
      "description": "Professional, business-focused, corporate tone"
    },
    {
      "name": "creative",
      "description": "Creative, engaging, storytelling-focused tone"
    },
    {
      "name": "technical",
      "description": "Technical, detailed, specification-focused tone"
    },
    {
      "name": "marketing",
      "description": "Marketing, persuasive, conversion-focused tone"
    }
  ]
}
```

---

### 8. Analyze Content Quality

Evaluate the quality of existing content.

**Endpoint:** `POST /api/portfolios/{portfolio_id}/analyze-content`

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | Yes | Text to analyze |

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/portfolios/port_123/analyze-content?text=This%20is%20a%20sample%20project%20description" \
  -H "Authorization: Bearer your_token_here"
```

**Success Response (200):**
```json
{
  "portfolio_id": "port_123",
  "analysis": {
    "word_count": 42,
    "sentence_count": 3,
    "avg_words_per_sentence": 14.0,
    "readability_score": 78,
    "suggestions": [
      "Consider expanding content with more detail"
    ]
  }
}
```

---

### 9. Improve Text

Enhance existing text for clarity, brevity, engagement, or tone.

**Endpoint:** `POST /api/portfolios/{portfolio_id}/improve-text`

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Default | Options | Description |
|-----------|------|---------|---------|-------------|
| `text` | string | Required | - | Text to improve |
| `aspect` | string | clarity | clarity, brevity, engagement, tone | What to improve |

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/portfolios/port_123/improve-text?text=The%20building%20is%20big.%20It%20is%20modern.&aspect=clarity" \
  -H "Authorization: Bearer your_token_here"
```

**Success Response (200):**
```json
{
  "portfolio_id": "port_123",
  "original_text": "The building is big. It is modern.",
  "improved_text": "The expansive modern building showcases contemporary architectural principles with innovative design elements.",
  "aspect": "clarity"
}
```

---

## Authentication

All endpoints require a Bearer token in the Authorization header:

```bash
Authorization: Bearer {your_auth_token}
```

**Token Acquisition:**
1. Sign up: `POST /api/auth/signup`
2. Get Firebase ID token
3. Use Firebase token as Bearer token

---

## Rate Limiting

**Free Tier Limits (Replicate API):**
- 1 second delay between API calls
- ~100 free API requests per month
- $1 per hour during free tier testing

**Upgrade to Paid:**
- Remove rate limiting (REPLICATE_FREE_TIER_DELAY = 0)
- Access to faster processing
- Higher monthly quotas

---

## Error Handling

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request format and parameters |
| 401 | Unauthorized | Verify authentication token |
| 403 | Forbidden | Ensure you own the resource |
| 404 | Not Found | Verify resource IDs exist |
| 422 | Validation Error | Check parameter values and types |
| 429 | Rate Limited | Wait before retrying |
| 500 | Server Error | Try again or contact support |

### Error Response Format

```json
{
  "detail": "Error message describing what went wrong"
}
```

---

## Integration Examples

### Example 1: Generate Complete Project Content

```javascript
// Generate all content for a project
async function generateProjectContent(portfolioId, projectId, token) {
  const headers = { Authorization: `Bearer ${token}` };

  // 1. Generate description
  const description = await fetch(
    `/api/portfolios/${portfolioId}/projects/${projectId}/generate-description?tone=professional`,
    { method: 'POST', headers }
  ).then(r => r.json());

  // 2. Generate concept
  const concept = await fetch(
    `/api/portfolios/${portfolioId}/projects/${projectId}/generate-concept?tone=creative`,
    { method: 'POST', headers }
  ).then(r => r.json());

  // 3. Suggest titles
  const titles = await fetch(
    `/api/portfolios/${portfolioId}/projects/${projectId}/suggest-titles?count=5`,
    { method: 'POST', headers }
  ).then(r => r.json());

  return {
    description,
    concept,
    titles
  };
}
```

### Example 2: Create Portfolio with AI-Generated Bio

```python
import requests

def create_portfolio_with_bio(portfolio_id, architect_name, specialties, token):
    headers = {"Authorization": f"Bearer {token}"}
    
    # Generate bio
    bio_response = requests.post(
        f"http://localhost:8000/api/portfolios/{portfolio_id}/generate-bio",
        params={
            "architect_name": architect_name,
            "specialties": specialties,
            "experience_years": 15,
            "tone": "professional"
        },
        headers=headers
    )
    
    bio = bio_response.json()["biography"]
    
    # Save to portfolio
    # ... your code to save bio
    
    return bio
```

### Example 3: Batch Generate Captions for Images

```typescript
async function generateCaptionsForImages(
  portfolioId: string,
  images: Array<{id: string, context: string}>,
  token: string
) {
  const headers = { Authorization: `Bearer ${token}` };
  const captions = [];
  
  for (const image of images) {
    const response = await fetch(
      `/api/portfolios/${portfolioId}/assets/${image.id}/generate-caption?image_context=${encodeURIComponent(image.context)}`,
      { method: 'POST', headers }
    );
    
    const data = await response.json();
    captions.push({
      assetId: image.id,
      caption: data.caption
    });
    
    // Respect rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return captions;
}
```

---

## Performance Metrics

**Expected Response Times:**

| Endpoint | Mock Mode | Replicate Mode |
|----------|-----------|----------------|
| Generate Description | <100ms | 15-30s |
| Generate Concept | <100ms | 10-20s |
| Generate Caption | <100ms | 8-15s |
| Generate Bio | <100ms | 12-25s |
| Suggest Titles | <100ms | 15-25s |
| Generate Taglines | <100ms | 15-25s |
| Analyze Content | <50ms | <50ms |
| Improve Text | <100ms | 10-20s |
| Get Tones | <10ms | <10ms |

**Note:** Times vary based on prompt complexity and Replicate API load.

---

## Deployment Notes

### Prerequisites
1. Replicate API account (free tier available at replicate.com)
2. API token from Replicate dashboard
3. Set `REPLICATE_API_TOKEN` in environment

### Configuration

```bash
# In .env
REPLICATE_API_TOKEN=your_token_here
DEBUG=False  # For production
```

### Fallback Behavior
If Replicate API is unavailable:
- Returns mock text automatically
- No errors thrown to client
- Graceful degradation ensures reliability

---

## Future Enhancements

- [ ] Streaming responses for large generations
- [ ] Batch processing for multiple items
- [ ] Custom model fine-tuning
- [ ] Content caching to reduce API calls
- [ ] Advanced analytics dashboard
- [ ] Scheduled content generation

---

## Support & Troubleshooting

### Issue: "Rate limited" errors
**Solution:** Ensure 1+ second delay between calls

### Issue: "API token invalid"
**Solution:** Verify REPLICATE_API_TOKEN is set correctly

### Issue: Slow responses (>30s)
**Solution:** Use mock mode for development, retry on production

### Issue: Empty or malformed responses
**Solution:** Check request format, verify project/portfolio exist

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-05-30 | Initial Phase 4 implementation |

---

**Last Updated:** 2026-05-30  
**Maintained By:** CosmoFolio Team
