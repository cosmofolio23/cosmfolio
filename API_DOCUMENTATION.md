# API Documentation
## Phase 7: Task 7.4 - Complete API Reference & Swagger Integration

---

## Quick Start

**Base URL:** `https://api.cosmofolio.com`

**Authentication:** Bearer token in Authorization header

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.cosmofolio.com/api/portfolios
```

**Swagger UI:** `https://api.cosmofolio.com/docs`

**ReDoc:** `https://api.cosmofolio.com/redoc`

---

## Swagger Configuration

**FastAPI Setup:**

```python
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

app = FastAPI(
    title="CosmoFolio API",
    description="AI-powered architecture portfolio generator",
    version="1.0.0",
)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="CosmoFolio API",
        version="1.0.0",
        description="Complete API for portfolio management",
        routes=app.routes,
    )
    
    # Add authentication scheme
    openapi_schema["components"]["securitySchemes"] = {
        "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
```

---

## API Endpoints Reference

### Authentication Endpoints

#### POST /api/auth/login
Login user

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "Jane Doe"
  }
}
```

**Status Codes:**
- 200: Success
- 401: Invalid credentials
- 429: Too many attempts

---

#### POST /api/auth/signup
Create new account

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "name": "Jane Doe"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Account created successfully",
  "user_id": "user_123"
}
```

---

### Portfolio Endpoints

#### GET /api/portfolios
List user's portfolios

**Query Parameters:**
- `skip`: Offset (default: 0)
- `limit`: Results per page (default: 50, max: 100)
- `status`: Filter by status (draft, published, archived)

**Response:**
```json
{
  "portfolios": [
    {
      "id": "port_123",
      "title": "Modern Tower",
      "description": "Sustainable architecture",
      "status": "published",
      "created_at": "2026-05-30T10:30:00Z"
    }
  ],
  "total": 5,
  "skip": 0,
  "limit": 50
}
```

**Rate Limit:** 30 requests/minute

---

#### POST /api/portfolios/{id}/publish
Make portfolio public

**Request:**
```json
{
  "is_password_protected": false
}
```

**Response:**
```json
{
  "status": "published",
  "public_url": "/p/modern-tower/abc123xyz789",
  "public_token": "abc123xyz789",
  "is_password_protected": false
}
```

**Rate Limit:** 10 requests/minute

---

#### POST /api/portfolios/{id}/share
Create shareable link

**Request:**
```json
{
  "expires_in_days": 30,
  "custom_message": "Check out my work!"
}
```

**Response:**
```json
{
  "share_url": "https://cosmofolio.com/share/xyz789abc123",
  "share_token": "xyz789abc123",
  "expires_at": "2026-06-29T10:30:00Z"
}
```

---

#### POST /api/portfolios/{id}/download
Download portfolio

**Request:**
```json
{
  "format": "zip",
  "filename": "my-portfolio.zip"
}
```

**Supported Formats:**
- `pdf`: PDF document
- `html`: Interactive HTML
- `zip`: Complete package
- `self_contained_html`: Offline HTML

**Response:**
```json
{
  "status": "success",
  "format": "zip",
  "filename": "my-portfolio.zip",
  "file_size_mb": 5.2,
  "download_url": "/api/downloads/port_123/zip/..."
}
```

**Rate Limit:** 10 requests/minute

---

#### GET /api/portfolios/{id}/analytics
Get portfolio view analytics

**Query Parameters:**
- `days`: Number of days to retrieve (default: 30, max: 365)

**Response:**
```json
{
  "portfolio_id": "port_123",
  "period": "Last 30 days",
  "total_views": 127,
  "unique_visitors": 89,
  "top_referrers": [
    {
      "source": "LinkedIn",
      "count": 45
    }
  ],
  "devices": {
    "desktop": 72,
    "mobile": 39,
    "tablet": 16
  }
}
```

---

#### POST /api/portfolios/{id}/social-preview
Generate social media preview

**Request:**
```json
{
  "platform": "linkedin"
}
```

**Supported Platforms:**
- `linkedin`
- `twitter`
- `facebook`
- `instagram`
- `pinterest`
- `email`

**Response:**
```json
{
  "platform": "linkedin",
  "title": "Modern Tower",
  "description": "Sustainable residential tower",
  "hashtags": ["#Architecture", "#Design"],
  "image_size": "1200x627",
  "preview_text": "..."
}
```

---

### Public Endpoints (No Auth Required)

#### GET /public/p/{slug}/{token}
View published portfolio

**Response:**
HTML page of published portfolio

**Status Codes:**
- 200: Success
- 401: Password required (if protected)
- 404: Portfolio not found

---

#### GET /public/share/{token}
Access via share token

**Response:**
```json
{
  "status": "success",
  "portfolio_id": "port_123",
  "custom_message": "Check out my work!"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid input",
  "details": "Email must be valid"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid credentials or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests",
  "retry_after": 45
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "request_id": "req_abc123"
}
```

---

## Authentication

### Bearer Token

Include JWT token in Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Refresh

GET `/api/auth/refresh`

Returns new access token valid for 30 minutes.

---

## Rate Limiting

**Headers:**

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1685923200
Retry-After: 45
```

**Limits by Endpoint:**

| Endpoint | Limit |
|----------|-------|
| /auth/login | 5/min |
| /portfolios | 30/min |
| /export-pdf | 10/min |
| /ai/generate | 5/min |

---

## Pagination

Use `skip` and `limit` query parameters:

```
GET /api/portfolios?skip=0&limit=20
```

**Max limit:** 100

---

## Filtering & Sorting

**Status Filter:**
```
GET /api/portfolios?status=published
```

**Sort:**
```
GET /api/portfolios?sort=created_at&order=desc
```

---

## Webhooks

### Enable Webhook

POST `/api/webhooks/subscribe`

```json
{
  "event": "portfolio.published",
  "url": "https://yourapp.com/webhook",
  "secret": "webhook_secret_123"
}
```

### Events

- `portfolio.created`
- `portfolio.published`
- `portfolio.shared`
- `portfolio.viewed`
- `export.completed`

---

## Code Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.cosmofolio.com',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

// Get portfolios
const portfolios = await api.get('/api/portfolios');

// Publish portfolio
const published = await api.post(`/api/portfolios/${portfolioId}/publish`, {
  is_password_protected: false,
});

// Download portfolio
const download = await api.post(`/api/portfolios/${portfolioId}/download`, {
  format: 'zip',
});
```

### Python

```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
}

# Get portfolios
response = requests.get(
    'https://api.cosmofolio.com/api/portfolios',
    headers=headers,
)

# Publish portfolio
response = requests.post(
    f'https://api.cosmofolio.com/api/portfolios/{portfolio_id}/publish',
    headers=headers,
    json={'is_password_protected': False},
)
```

### cURL

```bash
# Login
curl -X POST https://api.cosmofolio.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"..."}'

# Publish portfolio
curl -X POST https://api.cosmofolio.com/api/portfolios/port_123/publish \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_password_protected":false}'
```

---

## API Versioning

Current version: **v1**

Future versions accessible at `/api/v2/...`

**Deprecation Policy:**
- Current version supported for minimum 12 months
- 6 months notice before deprecation
- Old versions maintained for 6 months after deprecation

---

## Support

**API Status:** https://status.cosmofolio.com

**Documentation:** https://docs.cosmofolio.com

**Support Email:** api-support@cosmofolio.com

---

**Last Updated:** 2026-05-30  
**Version:** 1.0.0
