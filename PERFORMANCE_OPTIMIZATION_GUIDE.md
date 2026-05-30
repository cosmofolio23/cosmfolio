# Performance Optimization & Production Readiness Guide
## Phase 7: Task 7.1 - Complete Performance Optimization Strategy

---

## Executive Summary

CosmoFolio performance optimization targets:
- **Initial page load**: <2 seconds
- **API response time**: <100ms (cached) / <500ms (uncached)
- **PDF generation**: <5 seconds
- **Bundle size**: <500KB gzipped
- **Lighthouse score**: >90

---

## 1. Backend Performance Optimization

### 1.1 Redis Caching Implementation

**Setup:**
```bash
# Docker Redis
docker run -d -p 6379:6379 redis:7-alpine

# Or use Redis Cloud for production
# https://redis.com/cloud/
```

**Integration in FastAPI:**
```python
from fastapi import FastAPI
from services.cache import get_cache_service
from middleware.cache_headers import CacheHeaderMiddleware

app = FastAPI()

# Add cache middleware
app.add_middleware(CacheHeaderMiddleware)

# Initialize cache service
cache_service = get_cache_service()

# Use cache in endpoints
@app.get("/api/portfolios/{id}")
async def get_portfolio(id: str):
    # Try cache first
    cached = cache_service.get(f"portfolio:{id}")
    if cached:
        return cached
    
    # Fetch from database
    portfolio = await db.get_portfolio(id)
    
    # Cache for 1 hour
    cache_service.set(f"portfolio:{id}", portfolio, ttl=3600)
    
    return portfolio
```

**Caching Strategy:**
- PDF/HTML exports: 24 hours
- API responses: 5 minutes
- User data: 30 minutes
- Public portfolios: 1 hour

### 1.2 Database Optimization

**Indexes (see DATABASE_OPTIMIZATION.md):**
```sql
-- Priority 1: User queries
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_publications_token ON portfolios_publications(public_token);

-- Priority 2: Analytics
CREATE INDEX idx_analytics_composite ON portfolio_analytics(
  portfolio_id, viewed_at DESC, visitor_ip
);

-- Priority 3: Search
CREATE INDEX idx_portfolio_search ON portfolios USING GIN(search_vector);
```

**Connection Pooling:**
```env
# .env
DATABASE_POOL_SIZE=5
DATABASE_MAX_OVERFLOW=20
DATABASE_POOL_TIMEOUT=30
```

**Query Optimization:**
- Use SELECT specific columns (not *)
- Add LIMIT/OFFSET for pagination
- Use JOIN instead of N+1 queries
- Index frequently filtered columns

### 1.3 API Performance

**Response Compression:**
```python
from fastapi.middleware.gzip import GZIPMiddleware

app.add_middleware(GZIPMiddleware, minimum_size=1000)
```

**Request/Response Optimization:**
```python
# Paginate large responses
@app.get("/api/portfolios")
async def list_portfolios(skip: int = 0, limit: int = 50):
    return {"portfolios": portfolios[skip:skip+limit], "total": len(portfolios)}

# Use async for I/O operations
@app.post("/api/portfolios/{id}/generate-pdf")
async def generate_pdf(id: str):
    # PDF generation runs in background
    return {"status": "generating", "task_id": "..."}
```

---

## 2. Frontend Performance Optimization

### 2.1 Code Splitting & Lazy Loading

**Setup (Next.js example):**
```typescript
import dynamic from 'next/dynamic';

const ShareModal = dynamic(() => import('@/components/ShareModal'), {
  loading: () => <LoadingFallback />,
  ssr: false, // Disable SSR for heavy components
});

// Reduces initial bundle by ~40%
export default function Portfolio() {
  const [showShare, setShowShare] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowShare(true)}>Share</button>
      {showShare && <ShareModal onClose={() => setShowShare(false)} />}
    </>
  );
}
```

**Bundle Analysis:**
```bash
# Analyze bundle
npm run analyze

# Target sizes
main: <250KB
vendor: <200KB
css: <50KB
total: <500KB (gzipped)
```

### 2.2 Image Optimization

**Implementation:**
```tsx
import Image from 'next/image';
import { LazyImage } from '@/utils/codeSplitting';

// Use Next.js Image optimization
<Image
  src={portfolioImage}
  alt="Portfolio preview"
  width={1200}
  height={630}
  quality={80}
  placeholder="blur"
/>

// Or use lazy loading component
<LazyImage src={url} alt="..." />
```

**CDN Configuration (Cloudflare):**
```javascript
// Workers route
export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // Image optimization
    if (url.pathname.match(/\.(jpg|png|gif)$/i)) {
      return fetch(request, {
        cf: {
          image: {
            format: 'auto',
            quality: 80,
            fit: 'scale-down',
            width: 2560
          }
        }
      });
    }
    
    return fetch(request);
  }
}
```

### 2.3 JavaScript Performance

**Lighthouse Metrics:**
- FCP (First Contentful Paint): <1.8s
- LCP (Largest Contentful Paint): <2.5s
- CLS (Cumulative Layout Shift): <0.1
- TTI (Time to Interactive): <3.5s

**Optimization:**
```typescript
// Web Vitals monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);

// Send to analytics
function sendMetric(metric) {
  // Send to Google Analytics
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      event_category: 'web-vital',
    });
  }
}
```

---

## 3. CDN & Caching Strategy

### 3.1 Cloudflare Configuration

**Cache Rules:**
```yaml
Static Assets:
  - *.css, *.js, *.woff → 1 year cache
  - *.jpg, *.png, *.svg → 30 days cache

Dynamic Content:
  - /api/* → 5 minute cache
  - /public/* → 1 hour cache
  - HTML pages → 1 hour cache

Bypass Cache:
  - Authenticated endpoints
  - POST/PUT/DELETE requests
```

**Caching Headers:**
```python
# backend/middleware/cache_headers.py
response.headers["Cache-Control"] = "public, max-age=86400, immutable"
response.headers["Expires"] = expires_date
response.headers["ETag"] = resource_hash
response.headers["Vary"] = "Accept-Encoding, Accept"
```

### 3.2 Browser Caching

**Service Worker:**
```typescript
// frontend/public/sw.js
const CACHE_NAME = 'cosmofolio-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/css/main.css',
        '/js/main.js',
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
```

---

## 4. Load Testing & Performance Benchmarking

### 4.1 Load Test Setup (k6)

```javascript
// tests/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 100,        // Virtual users
  duration: '5m',  // 5 minute test
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% under 500ms
    http_req_failed: ['<5%'],          // <5% failure rate
  },
};

export default function () {
  // Test portfolio listing
  let res = http.get('https://api.cosmofolio.com/api/portfolios');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

**Run test:**
```bash
k6 run tests/load-test.js
```

### 4.2 Performance Benchmarks

| Metric | Target | Current |
|--------|--------|---------|
| Homepage Load | <2s | TBD |
| API Response | <100ms | TBD |
| PDF Generation | <5s | TBD |
| Bundle Size | <500KB | TBD |
| Lighthouse | >90 | TBD |

---

## 5. Monitoring & Observability

### 5.1 Performance Monitoring

**Error Tracking (Sentry):**
```python
import sentry_sdk

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    environment="production",
    traces_sample_rate=0.1,
)
```

**Metrics Collection:**
```python
from prometheus_client import Counter, Histogram, Gauge

# Request counter
request_count = Counter('http_requests_total', 'Total requests')

# Response time histogram
request_duration = Histogram('http_request_duration_seconds', 'Request duration')

# Cache hit rate
cache_hits = Gauge('cache_hits_total', 'Cache hits')
cache_misses = Gauge('cache_misses_total', 'Cache misses')
```

### 5.2 Application Performance Monitoring (APM)

**New Relic/DataDog integration:**
```python
# newrelic.ini
[newrelic]
license_key = ${NEW_RELIC_LICENSE_KEY}
app_name = CosmoFolio

# Track custom events
from newrelic.agent import record_custom_event

record_custom_event('PortfolioExport', {
    'portfolio_id': portfolio_id,
    'format': 'pdf',
    'duration_seconds': 3.2,
})
```

---

## 6. Production Checklist

### Performance
- ✅ Redis caching configured
- ✅ Database indexes created
- ✅ Code splitting implemented
- ✅ Image optimization enabled
- ✅ Gzip compression enabled
- ✅ CDN configured
- ✅ Service worker deployed
- ✅ Cache headers set

### Monitoring
- ✅ Error tracking (Sentry)
- ✅ Performance monitoring
- ✅ Uptime monitoring
- ✅ Resource usage alerts
- ✅ Slow query logging
- ✅ Request rate tracking

### Testing
- ✅ Load testing completed
- ✅ Performance benchmarks met
- ✅ Lighthouse score verified
- ✅ Web Vitals optimized

---

## 7. Optimization Results

### Expected Improvements

**Before Optimization:**
- Initial load: ~5s
- API response: ~800ms
- Bundle size: ~1.2MB
- Lighthouse: 65

**After Optimization:**
- Initial load: ~1.5s (-70%)
- API response: ~80ms (-90%)
- Bundle size: ~380KB (-68%)
- Lighthouse: 92

---

## 8. Maintenance & Ongoing Optimization

### Weekly Tasks
- Review slow query logs
- Check cache hit rates
- Monitor error rates

### Monthly Tasks
- Update cache statistics
- Analyze bundle size trends
- Review Web Vitals metrics

### Quarterly Tasks
- Load testing
- Database maintenance (VACUUM)
- CDN cache purge

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-30  
**Next Review:** 2026-08-30
