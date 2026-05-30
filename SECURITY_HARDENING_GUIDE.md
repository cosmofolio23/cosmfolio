# Security Hardening Guide
## Phase 7: Task 7.3 - Complete Security Implementation

---

## Executive Summary

CosmoFolio security implementation includes:
- ✅ Rate limiting (per user, per IP, per endpoint)
- ✅ CSRF protection (token validation)
- ✅ Input validation & sanitization (XSS prevention)
- ✅ SQL injection protection (via ORM)
- ✅ API key management (rotation, expiration)
- ✅ Audit logging (sensitive operations)
- ✅ Security headers (CSP, HSTS, X-Frame-Options)

---

## 1. Rate Limiting

### 1.1 Implementation

**File:** `backend/middleware/rate_limit.py` (400 lines)

**Features:**
- ✅ In-memory rate limiter with sliding window
- ✅ Per-user and per-IP tracking
- ✅ Endpoint-specific limits
- ✅ Burst limit detection
- ✅ Budget tracking for expensive operations
- ✅ Automatic cleanup (prevent memory bloat)

### 1.2 Configuration

**Default Limits (requests per minute):**
```python
LIMITS = {
    "/api/auth/login": 5,
    "/api/auth/signup": 3,
    "/api/auth/reset": 3,
    "/api/portfolios": 30,
    "/api/portfolios/*/export-pdf": 10,
    "/api/portfolios/*/publish": 10,
    "/api/ai/generate": 5,  # Most restrictive
}
```

### 1.3 Integration in FastAPI

```python
from fastapi import FastAPI
from middleware.rate_limit import RateLimitMiddleware

app = FastAPI()
app.add_middleware(RateLimitMiddleware)
```

### 1.4 Response Headers

Rate limit info included in all responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1685923200
```

### 1.5 Over Limit Response (429)

```json
{
  "error": "Too many requests",
  "retry_after": 45
}
```

---

## 2. CSRF Protection

### 2.1 Implementation

**File:** `backend/middleware/security.py` (CSRF section)

**Features:**
- ✅ Token generation (secrets.token_urlsafe)
- ✅ Token validation with constant-time comparison
- ✅ Cookie-based token storage
- ✅ Automatic token rotation
- ✅ SameSite=Strict cookie policy

### 2.2 Token Generation

```python
from middleware.security import CSRFProtection

# Generate token (send to client)
token = CSRFProtection.generate_token()

# Validate on form submission
is_valid = CSRFProtection.validate_token(request, token)
```

### 2.3 Frontend Integration

```typescript
// Get CSRF token from cookie or endpoint
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('csrf_token='))
  ?.split('=')[1];

// Include in form submission
const response = await fetch('/api/portfolios', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});
```

### 2.4 Cookie Settings

```
csrf_token=<token>
httponly=true          # Not accessible via JS
secure=true            # HTTPS only
samesite=Strict        # No cross-site requests
max_age=3600           # 1 hour expiration
```

---

## 3. Input Validation & Sanitization

### 3.1 Implementation

**File:** `backend/middleware/security.py` (InputValidator class)

**Features:**
- ✅ Email validation (RFC 5322)
- ✅ URL validation
- ✅ Slug validation (alphanumeric, hyphens, underscores)
- ✅ HTML sanitization (bleach library)
- ✅ Filename sanitization (prevent path traversal)
- ✅ Length limits enforcement

### 3.2 Usage Examples

```python
from middleware.security import InputValidator

# Validate email
if not InputValidator.validate_email(email):
    raise ValueError("Invalid email")

# Sanitize HTML (prevent XSS)
safe_html = InputValidator.sanitize_html(user_content)

# Sanitize plain text
safe_text = InputValidator.sanitize_string(description, max_length=500)

# Sanitize filename (prevent path traversal)
safe_filename = InputValidator.sanitize_filename("../../etc/passwd")
# Result: "etcpasswd"
```

### 3.3 Validation Rules

**Email:**
- RFC 5322 compliant
- Max 254 characters
- Must contain @ and domain

**URL:**
- HTTP or HTTPS protocol
- Valid domain
- Max 2048 characters

**Slug:**
- 3-50 characters
- Alphanumeric, hyphens, underscores only
- Lowercase preferred

**HTML:**
- Strip potentially dangerous tags
- Only allow safe tags (p, a, img, etc.)
- Escape special characters

### 3.4 Allowed HTML Tags

```python
ALLOWED_TAGS = {
    "p", "br", "strong", "em", "u",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "blockquote",
    "a", "img", "code", "pre",
}

ALLOWED_ATTRIBUTES = {
    "a": ["href", "title"],
    "img": ["src", "alt", "width", "height"],
}
```

---

## 4. SQL Injection Protection

### 4.1 Status

**Already Protected:** Using Supabase ORM (SQLAlchemy)

ORM automatically:
- ✅ Uses parameterized queries
- ✅ Escapes user input
- ✅ Prevents SQL injection
- ✅ Validates data types

### 4.2 Safe Query Example

```python
# GOOD: Uses parameterized query
from sqlalchemy import select

query = select(Portfolio).where(Portfolio.id == portfolio_id)
result = db.execute(query)

# BAD: String concatenation (NEVER DO THIS)
# query = f"SELECT * FROM portfolios WHERE id = '{portfolio_id}'"
```

### 4.3 Additional Protection

```python
# Input validation prevents malformed data
if not InputValidator.validate_slug(portfolio_slug):
    raise ValueError("Invalid slug")

# Type hints enforce data types
def get_portfolio(portfolio_id: str):  # Must be string
    pass
```

---

## 5. API Key Management

### 5.1 Key Generation

```python
import secrets

def generate_api_key() -> str:
    """Generate cryptographically secure API key"""
    return secrets.token_urlsafe(32)

# Store hashed version in database
from hashlib import sha256
api_key_hash = sha256(api_key.encode()).hexdigest()
```

### 5.2 Key Rotation

```python
# Rotate API keys every 90 days
from datetime import datetime, timedelta

key_created_at = datetime.utcnow()
key_expires_at = key_created_at + timedelta(days=90)

if datetime.utcnow() > key_expires_at:
    # Generate new key
    old_key = api_key
    new_key = generate_api_key()
    logger.info(f"API key rotated: {key_id}")
```

### 5.3 API Key Validation

```python
from fastapi import Depends, HTTPException
from fastapi.security import APIKeyHeader

api_key_header = APIKeyHeader(name="X-API-Key")

async def verify_api_key(api_key: str = Depends(api_key_header)):
    """Verify API key is valid and not expired"""

    # Hash incoming key
    key_hash = sha256(api_key.encode()).hexdigest()

    # Look up in database
    db_key = db.query(APIKey).filter_by(key_hash=key_hash).first()

    if not db_key or db_key.is_expired():
        raise HTTPException(status_code=403, detail="Invalid API key")

    return db_key

@app.get("/api/protected")
async def protected_route(api_key: APIKey = Depends(verify_api_key)):
    return {"message": "Authorized"}
```

---

## 6. Audit Logging

### 6.1 Implementation

**File:** `backend/middleware/security.py` (AuditLogger class)

**Log Events:**
- ✅ Authentication attempts (success/failure)
- ✅ Permission denied attempts
- ✅ Sensitive operations (publish, share, export)
- ✅ Suspicious activities (rate limit bypasses)

### 6.2 Usage

```python
from middleware.security import AuditLogger

# Log authentication attempt
AuditLogger.log_auth_attempt(
    user_id="user_123",
    email="jane@example.com",
    success=True,
    ip_address="192.168.1.1",
    user_agent="Mozilla/5.0...",
)

# Log sensitive operation
AuditLogger.log_sensitive_operation(
    user_id="user_123",
    operation="portfolio_published",
    details={"portfolio_id": "port_456", "is_public": True},
    ip_address="192.168.1.1",
)

# Log suspicious activity
AuditLogger.log_suspicious_activity(
    description="Multiple failed login attempts",
    user_id="user_123",
    ip_address="192.168.1.100",
    details={"failed_attempts": 5, "window": "10 minutes"},
)
```

### 6.3 Log Format

```
[AUDIT] Auth attempt: SUCCESS | User: user_123 (jane@example.com) | IP: 192.168.1.1
[AUDIT] Sensitive operation: User user_123 performed portfolio_published | Details: {...} | IP: 192.168.1.1
[SECURITY] Suspicious activity: Multiple failed logins | User: user_123 | IP: 192.168.1.100 | Details: {...}
```

### 6.4 Log Retention

- Audit logs: 1 year (regulatory compliance)
- Error logs: 90 days
- Info logs: 30 days
- Debug logs: 7 days

---

## 7. Security Headers

### 7.1 Implementation

**File:** `backend/middleware/security.py` (SecurityHeadersMiddleware)

### 7.2 Headers Set

| Header | Value | Purpose |
|--------|-------|---------|
| X-Frame-Options | DENY | Prevent clickjacking |
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| X-XSS-Protection | 1; mode=block | Enable browser XSS protection |
| Referrer-Policy | strict-origin-when-cross-origin | Control referrer info |
| Strict-Transport-Security | max-age=31536000 | Force HTTPS |
| Content-Security-Policy | [custom policy] | Prevent XSS, injection |

### 7.3 Content Security Policy

```
default-src 'self'                    # Default: same origin only
script-src 'self' cdn.jsdelivr.net   # Scripts: self + CDN
style-src 'self' 'unsafe-inline'     # Styles: self + inline
img-src 'self' data: https:           # Images: self, data URLs, HTTPS
font-src 'self'                       # Fonts: self only
connect-src 'self' api.cosmofolio.com # Fetch/WebSocket: API
frame-ancestors 'none'                # No embedding in iframes
```

---

## 8. Environment Security

### 8.1 Environment Variables

```bash
# .env (NEVER commit this file)
# Use a .env.example template for documentation

# API Keys
REPLICATE_API_TOKEN=r8_...
OPENAI_API_KEY=sk-...

# Database
DATABASE_URL=postgresql://user:pass@host/db
DATABASE_PASSWORD=<strong password>

# Security
SECRET_KEY=<64 random characters>
CSRF_ENABLED=true
RATE_LIMIT_ENABLED=true

# HTTPS
SECURE_COOKIES=true
SECURE_PROXY_HEADER=X-Forwarded-Proto

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<password>
```

### 8.2 .env.example (for documentation)

```bash
# Template - copy to .env and fill in values
REPLICATE_API_TOKEN=your_token_here
OPENAI_API_KEY=your_key_here
DATABASE_URL=postgresql://user:pass@localhost/cosmofolio
SECRET_KEY=generate_random_64_char_key
```

### 8.3 Secrets Management (Production)

```bash
# Use AWS Secrets Manager, HashiCorp Vault, or similar
import boto3

def get_secret(secret_name: str):
    client = boto3.client('secretsmanager')
    response = client.get_secret_value(SecretId=secret_name)
    return response['SecretString']

# Usage
api_token = get_secret('cosmofolio/replicate-api-token')
```

---

## 9. Authentication & Authorization

### 9.1 Password Security

```python
from passlib.context import CryptContext

# Use bcrypt for password hashing
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,  # High iteration count
)

# Hash password
hashed_password = pwd_context.hash(plain_password)

# Verify password
is_valid = pwd_context.verify(plain_password, hashed_password)
```

### 9.2 JWT Tokens

```python
from datetime import datetime, timedelta
import jwt

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 30

def create_access_token(user_id: str) -> str:
    """Create JWT access token"""

    expires = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": user_id,
        "exp": expires,
        "iat": datetime.utcnow(),
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> str:
    """Verify and decode JWT token"""

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")

        if not user_id:
            raise ValueError("Invalid token")

        return user_id

    except jwt.ExpiredSignatureError:
        raise ValueError("Token expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")
```

### 9.3 Session Management

```python
# Use secure session cookies
session_options = {
    "httponly": True,         # Not accessible via JS
    "secure": True,           # HTTPS only
    "samesite": "Strict",     # No cross-site
    "max_age": 3600,          # 1 hour
    "domain": "cosmofolio.com",
    "path": "/",
}

response.set_cookie(
    key="session_id",
    value=session_token,
    **session_options,
)
```

---

## 10. Security Testing

### 10.1 Manual Testing

```bash
# Test CSRF protection
curl -X POST https://api.cosmofolio.com/api/portfolios \
  -H "Content-Type: application/json" \
  -d '{...}'
# Should return 403 without valid CSRF token

# Test rate limiting
for i in {1..101}; do
  curl https://api.cosmofolio.com/api/portfolios
done
# Should get 429 on request 101

# Test input validation
curl -X POST https://api.cosmofolio.com/api/portfolios \
  -H "Content-Type: application/json" \
  -d '{"title": "<script>alert(1)</script>"}'
# Should sanitize HTML

# Test SQL injection
curl "https://api.cosmofolio.com/api/portfolios?id=1' OR '1'='1"
# Should return 400 (invalid input)
```

### 10.2 Automated Testing

```python
# Security tests
def test_csrf_protection():
    response = client.post("/api/portfolios", json={})
    assert response.status_code == 403

def test_rate_limiting():
    for i in range(101):
        response = client.get("/api/portfolios")
    assert response.status_code == 429

def test_input_sanitization():
    response = client.post(
        "/api/portfolios",
        json={"title": "<script>alert(1)</script>"},
    )
    data = response.json()
    assert "<script>" not in data["title"]

def test_sql_injection():
    response = client.get("/api/portfolios?id=1' OR '1'='1")
    assert response.status_code == 400
```

---

## 11. Production Deployment Checklist

### Security
- ✅ HTTPS enabled (SSL/TLS certificates)
- ✅ Environment variables configured
- ✅ Rate limiting enabled
- ✅ CSRF protection enabled
- ✅ Input validation enabled
- ✅ Security headers set
- ✅ Audit logging enabled
- ✅ API keys rotated
- ✅ Database password strong
- ✅ Redis password set

### Monitoring
- ✅ Audit logs monitored
- ✅ Error tracking (Sentry)
- ✅ Rate limit alerts
- ✅ Suspicious activity alerts
- ✅ Failed authentication alerts

### Updates
- ✅ Dependencies up to date
- ✅ Security patches applied
- ✅ OS updates current

---

## 12. Security Best Practices

✅ **Do:**
- Always validate input
- Use HTTPS
- Hash passwords (bcrypt)
- Rotate API keys
- Log sensitive operations
- Use CSRF tokens for state-changing requests
- Implement rate limiting
- Keep dependencies updated
- Use secure random for tokens

❌ **Don't:**
- Store passwords in plain text
- Concatenate SQL queries
- Trust user input
- Disable HTTPS
- Hardcode secrets
- Log sensitive data
- Use predictable tokens
- Ignore security warnings

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-30  
**Next Review:** 2026-08-30  
**Security Officer:** CosmoFolio Security Team
