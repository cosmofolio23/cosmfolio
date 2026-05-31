# Phase 4: AI Integration Testing Checklist

## Overview
Complete testing checklist for AI Generation Service (Phase 4). Tests cover unit tests, integration tests, API endpoint validation, rate limiting, and error handling.

**Status:** 🚀 Ready for Testing
**Last Updated:** 2026-05-30

---

## 1. Unit Tests for AI Service ✅

### Service Initialization
- [ ] Service initializes with Replicate token when `REPLICATE_API_TOKEN` is set
- [ ] Service initializes in mock mode when token is not set
- [ ] Tone descriptions are properly loaded (5 tones: academic, professional, creative, technical, marketing)
- [ ] Default model is set to "llama2"
- [ ] Model URLs are configured for Llama 2, Mistral, and Neural Chat

### Tone Validation
- [ ] `get_available_tones()` returns all 5 tones with descriptions
- [ ] `validate_tone("professional")` returns True
- [ ] `validate_tone("invalid_tone")` returns False
- [ ] All tone values are correctly mapped in `tone_descriptions`

### Mock Text Generation
- [ ] `_generate_mock_text("topic", length="short")` returns short text
- [ ] `_generate_mock_text("topic", length="medium")` returns medium text
- [ ] `_generate_mock_text("topic", length="long")` returns long text
- [ ] Mock text contains the topic reference

### Singleton Pattern
- [ ] `get_ai_generation_service()` returns same instance on multiple calls
- [ ] Singleton is properly reset between tests

---

## 2. Content Generation Tests ✅

### Project Description Generation
- [ ] `generate_project_description()` returns dict with keys: description, brief, strategy, tone
- [ ] Generated content is non-empty
- [ ] Tone parameter is respected
- [ ] Works with different project types (residential, commercial, industrial, etc.)
- [ ] Handles optional location parameter
- [ ] Falls back to mock on API error

### Concept Statement Generation
- [ ] `generate_concept_statement()` returns non-empty string
- [ ] Concept is 2-3 sentences (in production LLM mode)
- [ ] Respects tone parameter
- [ ] Handles missing description parameter

### Image Caption Generation
- [ ] `generate_image_caption()` returns non-empty string
- [ ] Caption is 1-2 sentences (in production LLM mode)
- [ ] Works with different asset types (render, plan, section, diagram)
- [ ] Respects tone parameter

### Portfolio Bio Generation
- [ ] `generate_portfolio_bio()` returns non-empty string
- [ ] Bio is 3-4 sentences (in production LLM mode)
- [ ] Works with multiple specialties
- [ ] Handles optional experience_years parameter
- [ ] Respects tone parameter

### Project Title Suggestions
- [ ] `suggest_project_titles()` returns list of strings
- [ ] Returns requested count (max 10)
- [ ] All titles are non-empty
- [ ] Works with and without project description
- [ ] Parsed correctly from numbered list format

### Portfolio Tagline Generation
- [ ] `generate_portfolio_tagline()` returns list of 5 strings
- [ ] All taglines are non-empty
- [ ] Taglines work for different specialties
- [ ] Respects tone parameter (especially creative)
- [ ] Parsed correctly from numbered list format

---

## 3. Content Analysis & Improvement ✅

### Content Quality Analysis
- [ ] `analyze_content_quality()` returns dict with required keys:
  - word_count
  - sentence_count
  - avg_words_per_sentence
  - readability_score (0-100)
  - suggestions (list)
- [ ] Readability score is between 0-100
- [ ] Suggestions include brevity warning for <50 words
- [ ] Suggestions include length warning for >500 words
- [ ] Suggestions include sentence length warning for >20 words/sentence

### Text Improvement
- [ ] `improve_text()` returns non-empty string
- [ ] Works with aspect="clarity"
- [ ] Works with aspect="brevity"
- [ ] Works with aspect="engagement"
- [ ] Works with aspect="tone"
- [ ] Improved text is different from original (in production mode)

---

## 4. API Endpoint Tests

### Authentication & Authorization
- [ ] ✅ All endpoints require authentication token
- [ ] ✅ Unauthorized requests return 403
- [ ] ✅ Invalid tokens return 403
- [ ] ✅ Valid tokens allow access

### Generate Project Description Endpoint
**Route:** `POST /api/portfolios/{portfolio_id}/projects/{project_id}/generate-description`
- [ ] Returns 200 with valid request
- [ ] Returns 401 without token
- [ ] Returns 403 if user doesn't own portfolio
- [ ] Returns 404 if project not found
- [ ] Accepts tone parameter (academic, professional, creative, technical, marketing)
- [ ] Rejects invalid tone with 422
- [ ] Response includes portfolio_id, project_id, generated_content, tone

### Generate Concept Statement Endpoint
**Route:** `POST /api/portfolios/{portfolio_id}/projects/{project_id}/generate-concept`
- [ ] Returns 200 with valid request
- [ ] Default tone is "creative"
- [ ] Response includes project_id, concept_statement, tone

### Generate Image Caption Endpoint
**Route:** `POST /api/portfolios/{portfolio_id}/assets/{asset_id}/generate-caption`
- [ ] Returns 200 with valid request
- [ ] Requires image_context query parameter
- [ ] Accepts tone parameter
- [ ] Response includes asset_id, caption, tone
- [ ] Returns 400 if image_context is missing

### Generate Portfolio Bio Endpoint
**Route:** `POST /api/portfolios/{portfolio_id}/generate-bio`
- [ ] Returns 200 with valid request
- [ ] Requires architect_name parameter
- [ ] Accepts specialties list parameter
- [ ] Accepts experience_years parameter
- [ ] Accepts tone parameter
- [ ] Response includes portfolio_id, biography, tone

### Suggest Project Titles Endpoint
**Route:** `POST /api/portfolios/{portfolio_id}/projects/{project_id}/suggest-titles`
- [ ] Returns 200 with valid request
- [ ] Default count is 5
- [ ] Accepts count parameter (1-10)
- [ ] Rejects count > 10 with 422
- [ ] Response includes project_id, suggested_titles, count

### Generate Portfolio Taglines Endpoint
**Route:** `POST /api/portfolios/{portfolio_id}/generate-taglines`
- [ ] Returns 200 with valid request
- [ ] Requires firm_name parameter
- [ ] Accepts specialties list parameter
- [ ] Default tone is "creative"
- [ ] Response includes portfolio_id, suggested_taglines, tone

### Get Available Tones Endpoint
**Route:** `GET /api/portfolios/ai-tones`
- [ ] Returns 200 with valid request
- [ ] Returns list of 5 tones with descriptions
- [ ] Response format: { tones: [{ name: "...", description: "..." }, ...] }

### Analyze Content Quality Endpoint
**Route:** `POST /api/portfolios/{portfolio_id}/analyze-content`
- [ ] Returns 200 with valid request
- [ ] Requires text query parameter
- [ ] Response includes portfolio_id, analysis
- [ ] Analysis includes readability_score, suggestions

### Improve Text Endpoint
**Route:** `POST /api/portfolios/{portfolio_id}/improve-text`
- [ ] Returns 200 with valid request
- [ ] Requires text parameter
- [ ] Accepts aspect parameter (clarity, brevity, engagement, tone)
- [ ] Response includes portfolio_id, original_text, improved_text, aspect

---

## 5. Rate Limiting Tests

### Free Tier Rate Limiting
- [ ] [ ] Delay between API calls is at least 1 second (REPLICATE_FREE_TIER_DELAY)
- [ ] [ ] Multiple rapid requests are properly throttled
- [ ] [ ] Rate limiter doesn't block legitimate sequential requests

### Retry Logic
- [ ] [ ] Failed API calls retry up to 3 times (REPLICATE_MAX_RETRIES)
- [ ] [ ] Retry delay is 2+ seconds between attempts (REPLICATE_RETRY_DELAY)
- [ ] [ ] After max retries, falls back to mock text
- [ ] [ ] Success on first attempt doesn't trigger retries

---

## 6. Error Handling Tests

### Service Error Handling
- [ ] [ ] Missing Replicate token falls back to mock mode gracefully
- [ ] [ ] API errors are logged properly
- [ ] [ ] Timeout errors are retried
- [ ] [ ] Network errors are handled with fallback
- [ ] [ ] Malformed responses are handled gracefully

### Endpoint Error Handling
- [ ] [ ] Missing required parameters return 422 (validation error)
- [ ] [ ] Invalid portfolio ID returns 404
- [ ] [ ] Invalid project ID returns 404
- [ ] [ ] Invalid asset ID returns 404
- [ ] [ ] Invalid tone returns 422
- [ ] [ ] Invalid count returns 422
- [ ] [ ] Permission denied returns 403

### Response Parsing Error Handling
- [ ] [ ] Invalid numbered list format is handled
- [ ] [ ] Empty responses don't crash
- [ ] [ ] Unexpected response format falls back gracefully

---

## 7. Integration Tests

### Service + Routes Integration
- [ ] [ ] AI service methods work with actual route handlers
- [ ] [ ] Auth middleware works with AI endpoints
- [ ] [ ] Database queries work within routes

### Mock Mode Integration
- [ ] [ ] Without Replicate token, all endpoints work with mock data
- [ ] [ ] Mock data quality is acceptable
- [ ] [ ] Mock mode is transparent to client

### Real LLM Mode Integration (with valid token)
- [ ] [ ] Replicate API calls succeed with valid token
- [ ] [ ] Generated content is better quality than mock
- [ ] [ ] Rate limiting prevents API throttling
- [ ] [ ] Response times are acceptable (<30s per request)

---

## 8. Load Testing

### Response Times
- [ ] [ ] Single request completes in <30 seconds (with Replicate)
- [ ] [ ] Mock requests complete in <1 second
- [ ] [ ] Rate limiting adds appropriate delays

### Concurrent Requests
- [ ] [ ] 5 sequential requests complete successfully
- [ ] [ ] Rate limiting prevents simultaneous API calls
- [ ] [ ] No race conditions in singleton pattern

### Memory Usage
- [ ] [ ] Service doesn't leak memory over 100+ requests
- [ ] [ ] Large text inputs don't cause crashes
- [ ] [ ] Singleton pattern doesn't cause memory bloat

---

## 9. Mock API Testing

### Without Replicate Token
- [ ] [ ] All endpoints return mock data
- [ ] [ ] Mock data format matches real data
- [ ] [ ] Mock data quality is consistent
- [ ] [ ] All tone variations work with mocks

### Mock Response Quality
- [ ] [ ] Mock descriptions are >100 characters
- [ ] [ ] Mock captions are 1-2 sentences
- [ ] [ ] Mock bios are 3-4 sentences
- [ ] [ ] Mock titles/taglines are unique

---

## 10. Documentation Tests

### Docstrings
- [ ] [ ] All service methods have docstrings
- [ ] [ ] All route handlers have docstrings
- [ ] [ ] Docstrings include parameter descriptions
- [ ] [ ] Docstrings include return value descriptions

### Type Hints
- [ ] [ ] All service methods have type hints
- [ ] [ ] All route handlers have proper return types
- [ ] [ ] Optional parameters are marked Optional

### API Documentation
- [ ] [ ] All endpoints appear in FastAPI /docs
- [ ] [ ] All parameters are documented
- [ ] [ ] All response codes are documented
- [ ] [ ] Examples are provided for each endpoint

---

## Test Execution

### Run All Tests
```bash
pytest tests/ -v
```

### Run AI Tests Only
```bash
pytest tests/test_ai_generation.py -v
```

### Run with Coverage
```bash
pytest tests/test_ai_generation.py --cov=services.ai_generation --cov-report=html
```

### Run Integration Tests
```bash
pytest tests/test_ai_generation.py::TestAiGenerationEndpoints -v
```

### Run Mock Tests
```bash
pytest tests/test_ai_generation.py::TestAiGenerationService -v
```

---

## Testing Environment

### Required Environment Variables
```bash
REPLICATE_API_TOKEN=  # Can be empty for mock testing
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
SECRET_KEY=test_secret
DEBUG=True
```

### Test Data
- Test users, projects, portfolios, and assets are created by fixtures
- All test data is isolated and cleaned up after tests
- Database is NOT modified during unit tests (mocked)

---

## Sign-Off Checklist

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All API endpoints tested
- [ ] Rate limiting verified
- [ ] Error handling verified
- [ ] Mock mode works without token
- [ ] Real mode works with token
- [ ] Performance is acceptable
- [ ] No memory leaks detected
- [ ] Documentation is complete

**Last Tested:** ___________
**Tested By:** ___________
**Notes:** ___________

---

## Appendix: Common Issues

### Issue: "REPLICATE_API_TOKEN not set"
**Solution:** Set `REPLICATE_API_TOKEN` in `.env` file or skip real API tests

### Issue: "ModuleNotFoundError: No module named 'replicate'"
**Solution:** Install with `pip install -r requirements.txt`

### Issue: "Connection refused to Replicate API"
**Solution:** Check internet connection, Replicate API status

### Issue: "Tests hang or timeout"
**Solution:** Reduce API timeouts in test fixtures, use mock mode

### Issue: "Rate limiting too aggressive"
**Solution:** Adjust `REPLICATE_FREE_TIER_DELAY` constant in service

---

## Next Steps After Testing

1. ✅ Fix any failing tests
2. ✅ Achieve >90% code coverage
3. ✅ Deploy to staging environment
4. ✅ Run integration tests against staging API
5. ✅ Verify Replicate API integration in production
6. ✅ Move to Phase 4.4: Database Schema
