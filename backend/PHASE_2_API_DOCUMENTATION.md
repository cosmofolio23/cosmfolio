# Phase 2 API Documentation
## Asset Management System

**Version**: 2.0  
**Status**: Complete  
**Endpoints**: 40+ routes  
**Authentication**: Firebase Bearer Token

---

## Overview

Phase 2 provides comprehensive asset management with:
- Asset upload (single and batch)
- Full-text search and advanced filtering
- Preview generation and thumbnails
- Image optimization and format conversion
- Asset versioning and restoration
- Cache optimization and CDN integration

---

## Authentication

All endpoints require Firebase Bearer token:

```
Authorization: Bearer <firebase_id_token>
```

**How to get token:**
1. User signs in with Firebase Auth (frontend)
2. Firebase returns ID token
3. Frontend sends token in Authorization header
4. Backend validates token with Firebase Admin SDK

---

## Error Responses

All errors return JSON with consistent format:

```json
{
  "error": "ErrorType",
  "message": "Human readable message",
  "status_code": 400,
  "timestamp": "2026-05-30T12:34:56Z"
}
```

### Status Codes
- `200 OK` - Success
- `400 Bad Request` - Invalid input validation
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource doesn't exist
- `413 Payload Too Large` - File too large
- `500 Internal Server Error` - Server error

---

## Asset Upload APIs

### 1. Single File Upload

```
POST /api/portfolios/{portfolio_id}/assets
```

**Parameters:**
- `portfolio_id` (path, required) - Portfolio ID
- `file` (formData, required) - File to upload
- `tags` (formData, optional) - Comma-separated tags
- `description` (formData, optional) - Asset description
- `asset_type` (formData, optional) - image|video|document|audio

**Request:**
```bash
curl -X POST \
  https://api.archportfolio.com/api/portfolios/123/assets \
  -H "Authorization: Bearer token" \
  -F "file=@photo.jpg" \
  -F "tags=residential,interior" \
  -F "description=Living room photo"
```

**Response (200):**
```json
{
  "id": "asset_456",
  "portfolio_id": "123",
  "file_name": "photo.jpg",
  "file_size": 2048576,
  "mime_type": "image/jpeg",
  "asset_type": "image",
  "storage_path": "portfolios/123/assets/photo.jpg",
  "preview_path": "portfolios/123/previews/photo-1200.webp",
  "thumb_path": "portfolios/123/thumbs/photo-250.webp",
  "tags": ["residential", "interior"],
  "width": 1920,
  "height": 1440,
  "aspect_ratio": 1.33,
  "created_at": "2026-05-30T12:34:56Z"
}
```

**Errors:**
- `400` - File size invalid, MIME type not allowed
- `401` - Invalid token
- `403` - Not portfolio owner
- `404` - Portfolio not found
- `413` - File too large

---

### 2. Batch Upload

```
POST /api/portfolios/{portfolio_id}/assets/bulk
```

**Parameters:**
- `portfolio_id` (path, required) - Portfolio ID
- `files` (formData, required) - Multiple files

**Request:**
```bash
curl -X POST \
  https://api.archportfolio.com/api/portfolios/123/assets/bulk \
  -H "Authorization: Bearer token" \
  -F "files=@photo1.jpg" \
  -F "files=@photo2.jpg" \
  -F "files=@photo3.jpg"
```

**Response (200):**
```json
{
  "uploaded_count": 3,
  "failed_count": 0,
  "assets": [
    {
      "id": "asset_456",
      "file_name": "photo1.jpg",
      "file_size": 2048576
    }
  ],
  "errors": []
}
```

---

## Asset Management APIs

### 3. List Assets

```
GET /api/portfolios/{portfolio_id}/assets?limit=50&offset=0
```

**Query Parameters:**
- `limit` (optional, default=50, max=100) - Results per page
- `offset` (optional, default=0) - Pagination offset
- `type` (optional) - Filter by type (image, video, document)
- `tags` (optional) - Comma-separated tags to filter
- `sort` (optional) - Sort field (created_at, file_size)

**Response (200):**
```json
{
  "items": [
    {
      "id": "asset_456",
      "file_name": "photo.jpg",
      "file_size": 2048576,
      "mime_type": "image/jpeg",
      "asset_type": "image",
      "created_at": "2026-05-30T12:34:56Z",
      "tags": ["residential"]
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total_count": 150,
    "has_more": true
  }
}
```

### 4. Get Asset Details

```
GET /api/portfolios/{portfolio_id}/assets/{asset_id}
```

**Response (200):**
```json
{
  "id": "asset_456",
  "portfolio_id": "123",
  "file_name": "photo.jpg",
  "file_size": 2048576,
  "mime_type": "image/jpeg",
  "asset_type": "image",
  "storage_path": "portfolios/123/assets/photo.jpg",
  "preview_path": "portfolios/123/previews/photo-1200.webp",
  "tags": ["residential", "interior"],
  "width": 1920,
  "height": 1440,
  "aspect_ratio": 1.33,
  "created_at": "2026-05-30T12:34:56Z",
  "updated_at": "2026-05-30T12:34:56Z"
}
```

### 5. Update Asset

```
PUT /api/portfolios/{portfolio_id}/assets/{asset_id}
```

**Body:**
```json
{
  "tags": ["residential", "modern"],
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "id": "asset_456",
  "tags": ["residential", "modern"],
  "updated_at": "2026-05-30T13:00:00Z"
}
```

### 6. Delete Asset

```
DELETE /api/portfolios/{portfolio_id}/assets/{asset_id}
```

**Response (200):**
```json
{
  "id": "asset_456",
  "deleted_at": "2026-05-30T13:00:00Z",
  "message": "Asset soft-deleted successfully"
}
```

---

## Search & Filtering APIs

### 7. Advanced Search

```
GET /api/portfolios/{portfolio_id}/search?query=living&type=image&tags=interior
```

**Query Parameters:**
- `query` (optional) - Full-text search
- `type` (optional) - Asset type
- `tags` (optional) - Filter by tags
- `date_from` (optional) - Start date (ISO 8601)
- `date_to` (optional) - End date
- `size_min` (optional) - Minimum file size (KB)
- `size_max` (optional) - Maximum file size (KB)
- `aspect_ratio` (optional) - Image aspect ratio

**Response (200):**
```json
{
  "items": [
    {
      "id": "asset_456",
      "file_name": "living_room.jpg",
      "relevance_score": 0.95,
      "tags": ["interior", "living"]
    }
  ],
  "filters_applied": {
    "query": "living",
    "type": "image",
    "tags": ["interior"]
  },
  "pagination": {
    "total_count": 15,
    "limit": 50
  }
}
```

### 8. Text Search

```
GET /api/portfolios/{portfolio_id}/search/by-filename?query=photo&limit=20
```

**Response (200):**
```json
{
  "results": [
    {
      "id": "asset_456",
      "file_name": "photo.jpg",
      "match_field": "filename"
    }
  ]
}
```

### 9. Tag Search

```
GET /api/portfolios/{portfolio_id}/search/by-tags?tags=residential,interior&match_all=false
```

**Query Parameters:**
- `tags` - Comma-separated tags
- `match_all` (optional, default=false) - Require all tags (AND) or any (OR)

**Response (200):**
```json
{
  "results": [
    {
      "id": "asset_456",
      "tags": ["residential", "interior"]
    }
  ]
}
```

### 10. Get All Tags

```
GET /api/portfolios/{portfolio_id}/tags
```

**Response (200):**
```json
{
  "tags": [
    {
      "name": "residential",
      "count": 45
    },
    {
      "name": "interior",
      "count": 32
    }
  ]
}
```

### 11. Get Collections

```
GET /api/portfolios/{portfolio_id}/collections
```

**Response (200):**
```json
{
  "image": {
    "count": 150,
    "total_size_mb": 2048,
    "types": ["jpeg", "webp", "png"]
  },
  "video": {
    "count": 5,
    "total_size_mb": 5120
  }
}
```

---

## Preview & Thumbnail APIs

### 12. Get Preview

```
GET /api/portfolios/{portfolio_id}/assets/{asset_id}/preview?size=preview-1200
```

**Query Parameters:**
- `size` (optional) - thumb-250 | thumb-500 | preview-1200 | original

**Response (200):**
```json
{
  "asset_id": "asset_456",
  "size": "preview-1200",
  "url": "https://cdn.example.com/assets/preview.webp",
  "width": 1200,
  "height": 900,
  "aspect_ratio": 1.33
}
```

### 13. Get Blur Placeholder

```
GET /api/portfolios/{portfolio_id}/assets/{asset_id}/blur?quality=60
```

**Response (200):**
```json
{
  "asset_id": "asset_456",
  "blur_data_url": "data:image/webp;base64,...",
  "dominant_color": {
    "color": "#d4a574",
    "hex": "d4a574"
  },
  "aspect_ratio": 1.33
}
```

### 14. Get Responsive Config

```
GET /api/portfolios/{portfolio_id}/assets/{asset_id}/responsive-config?base_url=https://example.com
```

**Response (200):**
```json
{
  "src": "/api/portfolios/123/assets/456/preview?size=preview-1200",
  "srcSet": "/api/portfolios/123/assets/456/preview?size=thumb-250 250w, ...",
  "sizes": "(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw",
  "loading": "lazy",
  "width": 1920,
  "height": 1440
}
```

### 15. Get Dominant Color

```
GET /api/portfolios/{portfolio_id}/assets/{asset_id}/color
```

**Response (200):**
```json
{
  "asset_id": "asset_456",
  "color": "#d4a574",
  "rgb": [212, 165, 116],
  "hex": "d4a574"
}
```

---

## Image Optimization APIs

### 16. Convert to WebP

```
POST /api/portfolios/{portfolio_id}/optimize/convert-webp?quality=75
```

**Body:** Multipart form with `file`

**Response (200):**
```json
{
  "format": "webp",
  "quality": 75,
  "original_size_kb": 2048.0,
  "optimized_size_kb": 512.5,
  "reduction_percent": 75.0,
  "saved_kb": 1535.5
}
```

### 17. Adaptive Compression

```
POST /api/portfolios/{portfolio_id}/optimize/adaptive?target_size_kb=200&format=webp
```

**Response (200):**
```json
{
  "target_size_kb": 200,
  "optimized_size_kb": 198.5,
  "quality": 65,
  "meets_target": true,
  "format": "webp"
}
```

### 18. Resize and Optimize

```
POST /api/portfolios/{portfolio_id}/optimize/resize?width=1200&height=800&quality=medium&format=webp
```

**Response (200):**
```json
{
  "optimized_dimensions": "1200x800",
  "optimized_size_kb": 256.0,
  "quality": "medium",
  "format": "webp"
}
```

### 19. Batch Optimization

```
POST /api/portfolios/{portfolio_id}/optimize/batch?quality=medium&format=webp
```

**Body:** Multipart form with multiple `files`

**Response (200):**
```json
{
  "total_files": 10,
  "results": [
    {
      "filename": "photo1.jpg",
      "original_size_kb": 2048.0,
      "optimized_size_kb": 512.0,
      "reduction_percent": 75.0
    }
  ],
  "total_reduction_percent": 74.5
}
```

### 20. Get Recommendations

```
POST /api/portfolios/{portfolio_id}/optimize/recommend
```

**Body:** Multipart form with `file`

**Response (200):**
```json
{
  "original_size_kb": 2048.0,
  "recommendations": [
    {
      "format": "webp",
      "size_kb": 512.0,
      "reduction_percent": 75.0,
      "recommended": true
    },
    {
      "format": "jpeg",
      "size_kb": 768.0,
      "reduction_percent": 62.5
    }
  ],
  "best_format": "webp"
}
```

---

## Asset Versioning APIs

### 21. Get Version History

```
GET /api/portfolios/{portfolio_id}/assets/{asset_id}/versions?limit=50&offset=0
```

**Response (200):**
```json
{
  "asset_id": "asset_456",
  "versions": [
    {
      "version_num": 3,
      "file_size": 2048576,
      "mime_type": "image/jpeg",
      "created_at": "2026-05-30T13:00:00Z",
      "version_notes": "Updated colors"
    },
    {
      "version_num": 2,
      "file_size": 2097152,
      "created_at": "2026-05-29T10:00:00Z"
    }
  ],
  "pagination": {
    "total_count": 3
  }
}
```

### 22. Get Specific Version

```
GET /api/portfolios/{portfolio_id}/assets/{asset_id}/versions/2
```

**Response (200):**
```json
{
  "version_num": 2,
  "file_size": 2097152,
  "mime_type": "image/jpeg",
  "created_at": "2026-05-29T10:00:00Z",
  "storage_path": "portfolios/123/versions/asset_456/v2.jpg"
}
```

### 23. Restore Version

```
POST /api/portfolios/{portfolio_id}/assets/{asset_id}/versions/2/restore?restore_notes=Reverted to original
```

**Response (200):**
```json
{
  "asset_id": "asset_456",
  "restored_to_version": 2,
  "new_version_num": 4,
  "restored_at": "2026-05-30T13:30:00Z"
}
```

### 24. Compare Versions

```
GET /api/portfolios/{portfolio_id}/assets/{asset_id}/versions/1/compare/2
```

**Response (200):**
```json
{
  "version_a": 1,
  "version_b": 2,
  "differences": {
    "file_size": {
      "version_a": 2048576,
      "version_b": 2097152,
      "changed": true
    },
    "mime_type": {
      "changed": false
    }
  }
}
```

---

## Caching APIs

### 25. Cache Analysis

```
GET /api/portfolios/{portfolio_id}/cache/analysis
```

**Response (200):**
```json
{
  "portfolio_id": "123",
  "total_assets": 150,
  "average_score": 85.5,
  "recommendations": [
    "Enable gzip compression for documents",
    "Consider using AVIF format for images"
  ]
}
```

### 26. Cache Statistics

```
GET /api/portfolios/{portfolio_id}/cache/statistics
```

**Response (200):**
```json
{
  "portfolio_id": "123",
  "cache_statistics": {
    "hit_rate": 87.5,
    "bandwidth_saved_gb": 12.5,
    "cost_savings_estimate": 1.06
  }
}
```

### 27. Invalidate Cache

```
POST /api/portfolios/{portfolio_id}/cache/invalidate?asset_ids=456,789&cdn_provider=cloudflare
```

**Response (200):**
```json
{
  "portfolio_id": "123",
  "invalidated_count": 2,
  "tags": ["asset:456", "asset:789", "portfolio:123"]
}
```

### 28. Warm Cache

```
POST /api/portfolios/{portfolio_id}/cache/warm?base_url=https://api.example.com
```

**Response (200):**
```json
{
  "portfolio_id": "123",
  "warmed_assets": 150,
  "warming_urls_count": 450
}
```

### 29. Get CDN Configuration

```
GET /api/portfolios/{portfolio_id}/cdn/config
```

**Response (200):**
```json
{
  "recommended_cdn_providers": [
    {
      "name": "Cloudflare",
      "pricing": "Free tier available"
    }
  ],
  "caching_rules": {
    "images": {
      "cache_duration": "1 year",
      "immutable": true
    }
  }
}
```

---

## Request Rate Limits

- **Standard tier**: 100 requests/minute
- **Pro tier**: 1000 requests/minute
- **Enterprise**: Custom limits

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1654067040
```

---

## Data Models

### Asset
```json
{
  "id": "string",
  "portfolio_id": "string",
  "file_name": "string",
  "file_size": "number (bytes)",
  "mime_type": "string",
  "asset_type": "enum: image|video|document|audio",
  "storage_path": "string (S3 path)",
  "preview_path": "string",
  "tags": ["string"],
  "description": "string",
  "width": "number",
  "height": "number",
  "aspect_ratio": "number",
  "created_at": "ISO8601",
  "updated_at": "ISO8601",
  "deleted_at": "ISO8601 | null"
}
```

### Version
```json
{
  "version_num": "number",
  "file_size": "number",
  "mime_type": "string",
  "storage_path": "string",
  "version_notes": "string",
  "created_at": "ISO8601"
}
```

---

## Environment Variables

```
FIREBASE_PROJECT_ID=your-project
FIREBASE_PRIVATE_KEY=your-key
S3_BUCKET=your-bucket
S3_REGION=us-east-1
SUPABASE_URL=https://project.supabase.co
SUPABASE_KEY=your-key
```

---

## Code Examples

### JavaScript/TypeScript
```typescript
const response = await fetch(
  'https://api.archportfolio.com/api/portfolios/123/assets',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData
  }
);
const asset = await response.json();
```

### Python
```python
import requests

response = requests.post(
    'https://api.archportfolio.com/api/portfolios/123/assets',
    headers={'Authorization': f'Bearer {token}'},
    files={'file': open('photo.jpg', 'rb')}
)
asset = response.json()
```

---

## Changelog

### v2.0 (Phase 2)
- Asset management system
- Advanced search and filtering
- Image optimization
- Asset versioning
- Caching and CDN integration

### v1.0 (Phase 1)
- Basic portfolio management
- Authentication
- Page configuration
- Layout templates

