# 📚 Phase 4 - Template API Documentation

**Base URL**: `http://localhost:8000` (dev) or `https://api.cosmofolio.app` (production)  
**Authentication**: None required (templates are public)  
**Rate Limit**: None (can be added in Phase 5)

---

## 🎨 Portfolio Template Endpoints

### GET /api/templates/portfolios
Get paginated list of portfolio templates with optional filtering

**Query Parameters**:
```
category      (string, optional)    - Filter by category (e.g., "Minimalist", "Contemporary")
source        (string, optional)    - Filter by source ("ai-generated", "archifolio")
search        (string, optional)    - Search by name or description
limit         (integer, default=50) - Results per page (1-100)
offset        (integer, default=0)  - Pagination offset
```

**Example Request**:
```bash
GET /api/templates/portfolios?category=Minimalist&limit=10&offset=0
```

**Example Response**:
```json
{
  "total": 16,
  "templates": [
    {
      "id": "tpl_001",
      "name": "Nordic Minimal",
      "category": "Minimalist",
      "description": "Clean Scandinavian-inspired with white space...",
      "source": "ai-generated",
      "colors": {
        "primary": "#1A1A1A",
        "accent": "#E8E4DC",
        "background": "#FFFFFF",
        "text": "#1A1A1A",
        "muted": "#999999"
      },
      "fonts": {
        "heading": "Cormorant Garamond",
        "body": "Inter",
        "accent": "Inter"
      },
      "layouts": {
        "cover": {
          "structure": "Full-bleed hero image with centered content",
          "grid": "1-column",
          "image_ratio": "full-bleed"
        },
        "project": {
          "structure": "Hero image, project details in centered column",
          "grid": "1-column",
          "image_ratio": "3:2"
        },
        "about": {
          "structure": "Centered layout with portrait and bio",
          "grid": "centered"
        }
      },
      "placeholders": {
        "renders": 3,
        "plans": 2,
        "sections": 1,
        "diagrams": 2,
        "text_description": true,
        "project_title": true,
        "year": true,
        "location": true
      },
      "preview_image": "Clean white pages with crisp hero images...",
      "style_notes": "Premium gallery-style for high-end residential",
      "page_count_range": "16-24",
      "orientation": "portrait_A4",
      "created_at": "2026-06-05T10:30:00Z"
    },
    ...
  ]
}
```

**Status Codes**:
- `200` - Success
- `400` - Invalid query parameters
- `500` - Database connection error

---

### GET /api/templates/portfolios/{template_id}
Get a specific portfolio template by ID

**Path Parameters**:
```
template_id (string) - Template ID (e.g., "tpl_061")
```

**Example Request**:
```bash
GET /api/templates/portfolios/tpl_061
```

**Example Response**:
```json
{
  "id": "tpl_061",
  "name": "Museum",
  "category": "Contemporary",
  "description": "Sophisticated, yet modern feel with crisp hero image...",
  "source": "archifolio",
  "colors": {
    "primary": "#FFFFFF",
    "accent": "#1A1A1A",
    "background": "#FFFFFF",
    "text": "#1A1A1A",
    "muted": "#999999"
  },
  "fonts": {
    "heading": "Serif (Classic)",
    "body": "Sans-serif (Clean)",
    "accent": "Sans-serif"
  },
  "layouts": {
    "cover": {
      "structure": "Full-bleed hero image with tagline space below centered",
      "grid": "1-column",
      "image_ratio": "full-bleed"
    },
    "project": {
      "structure": "Centered hero image, project title below, description centered",
      "grid": "centered",
      "image_ratio": "3:2"
    },
    "about": {
      "structure": "Centered layout, portrait top, bio centered below",
      "grid": "centered"
    }
  },
  "placeholders": {
    "renders": 3,
    "plans": 1,
    "sections": 1,
    "diagrams": 1,
    "text_description": true,
    "project_title": true,
    "year": true,
    "location": true
  },
  "preview_image": "Clean white pages with crisp hero images...",
  "style_notes": "Established architects, professional practices",
  "page_count_range": "16-24",
  "orientation": "portrait_A4",
  "created_at": "2026-06-05T10:30:00Z"
}
```

**Status Codes**:
- `200` - Success
- `404` - Template not found
- `400` - Invalid template ID

---

### GET /api/templates/portfolios/categories
Get all available portfolio template categories

**Example Request**:
```bash
GET /api/templates/portfolios/categories
```

**Example Response**:
```json
[
  "Bauhaus",
  "Brutalist",
  "Classical",
  "Contemporary",
  "Dark Premium",
  "Editorial",
  "Industrial",
  "Minimalist",
  "Modern",
  "Organic",
  "Parametric"
]
```

**Status Codes**:
- `200` - Success
- `400` - Database error

---

## 📋 Sheet Template Endpoints

### GET /api/templates/sheets
Get paginated list of sheet templates with optional filtering

**Query Parameters**:
```
sheet_type    (string, optional)    - Filter by type (concept, plan, section, elevation, etc)
category      (string, optional)    - Filter by category
format        (string, optional)    - Filter by format (A0, A1, A2, A3, etc)
search        (string, optional)    - Search by name or description
limit         (integer, default=50) - Results per page (1-100)
offset        (integer, default=0)  - Pagination offset
```

**Example Request**:
```bash
GET /api/templates/sheets?sheet_type=concept&format=A2&limit=10
```

**Example Response**:
```json
{
  "total": 76,
  "templates": [
    {
      "id": "sht_001",
      "name": "Concept Sheet",
      "sheet_type": "concept",
      "category": "Conceptual Ideas",
      "description": "For presenting architectural concepts and ideas...",
      "source": "ai-generated",
      "colors": {
        "primary": "#FFFFFF",
        "accent": "#1A1A1A",
        "background": "#FFFFFF",
        "text": "#1A1A1A",
        "muted": "#999999"
      },
      "fonts": {
        "heading": "Sans-serif",
        "body": "Sans-serif",
        "accent": "Sans-serif"
      },
      "layout_zones": [
        {
          "type": "title",
          "position": "top",
          "size": {
            "width": 100,
            "height": 10
          },
          "content_type": "text"
        },
        {
          "type": "image",
          "position": "center",
          "size": {
            "width": 100,
            "height": 60
          },
          "content_type": "render"
        },
        {
          "type": "description",
          "position": "bottom",
          "size": {
            "width": 100,
            "height": 30
          },
          "content_type": "text"
        }
      ],
      "format": "A2",
      "aspect_ratio": "1:1.41",
      "preview_image": "Minimalist white sheet with centered title...",
      "style_notes": "Clean, architectural presentation style",
      "content_requirements": {
        "renders": 1,
        "plans": 0,
        "diagrams": 1,
        "text": true
      },
      "created_at": "2026-06-05T10:30:00Z"
    },
    ...
  ]
}
```

**Status Codes**:
- `200` - Success
- `400` - Invalid query parameters
- `500` - Database connection error

---

### GET /api/templates/sheets/{template_id}
Get a specific sheet template by ID

**Path Parameters**:
```
template_id (string) - Sheet template ID (e.g., "sht_001")
```

**Example Request**:
```bash
GET /api/templates/sheets/sht_001
```

**Example Response**:
```json
{
  "id": "sht_001",
  "name": "Concept Sheet",
  "sheet_type": "concept",
  "category": "Conceptual Ideas",
  "description": "For presenting architectural concepts and ideas...",
  "source": "ai-generated",
  "colors": {...},
  "fonts": {...},
  "layout_zones": [...],
  "format": "A2",
  "aspect_ratio": "1:1.41",
  "preview_image": "...",
  "style_notes": "...",
  "content_requirements": {...},
  "created_at": "2026-06-05T10:30:00Z"
}
```

**Status Codes**:
- `200` - Success
- `404` - Template not found
- `400` - Invalid template ID

---

### GET /api/templates/sheets/types
Get all available sheet template types

**Example Request**:
```bash
GET /api/templates/sheets/types
```

**Example Response**:
```json
[
  "Axonometric",
  "Concept",
  "Diagram",
  "Detail",
  "Elevation",
  "Floor Plan",
  "Material",
  "Mood Board",
  "Presentation Board",
  "Process",
  "Render",
  "Section"
]
```

**Status Codes**:
- `200` - Success
- `400` - Database error

---

### GET /api/templates/sheets/formats
Get all available sheet formats

**Example Request**:
```bash
GET /api/templates/sheets/formats
```

**Example Response**:
```json
[
  "A0",
  "A1",
  "A2",
  "A3",
  "Square",
  "Panoramic"
]
```

**Status Codes**:
- `200` - Success
- `400` - Database error

---

## 🔗 Compatibility Endpoints

### GET /api/templates/compatibility/{portfolio_id}
Get sheet templates recommended for a portfolio template

**Path Parameters**:
```
portfolio_id (string) - Portfolio template ID (e.g., "tpl_061")
```

**Query Parameters**:
```
limit (integer, default=10) - Number of recommended sheets (1-50)
```

**Example Request**:
```bash
GET /api/templates/compatibility/tpl_061?limit=15
```

**Example Response**:
```json
{
  "portfolio_template_id": "tpl_061",
  "compatible_sheets": [
    {
      "id": "sht_001",
      "name": "Concept Sheet",
      "sheet_type": "concept",
      ...
    },
    {
      "id": "sht_005",
      "name": "Section Detail",
      "sheet_type": "section",
      ...
    },
    ...
  ]
}
```

**Status Codes**:
- `200` - Success
- `400` - Database error

---

## 📊 Statistics & Health Endpoints

### GET /api/templates/stats
Get overall template statistics

**Example Request**:
```bash
GET /api/templates/stats
```

**Example Response**:
```json
{
  "portfolio_templates": 73,
  "sheet_templates": 76,
  "total_templates": 149,
  "portfolio_categories": {
    "Minimalist": 16,
    "Contemporary": 12,
    "Brutalist": 8,
    "Editorial": 7,
    "Dark Premium": 6,
    "Bauhaus": 4,
    "Industrial": 4,
    "Organic": 4,
    "Classical": 3,
    "Modern": 3,
    "Parametric": 2,
    "Other": 4
  },
  "template_sources": {
    "ai-generated": 60,
    "archifolio": 13
  }
}
```

**Status Codes**:
- `200` - Success
- `400` - Database error

---

### GET /api/templates/health
Check template database health

**Example Request**:
```bash
GET /api/templates/health
```

**Example Response (Healthy)**:
```json
{
  "status": "ok",
  "portfolio_templates": "accessible",
  "sheet_templates": "accessible"
}
```

**Example Response (Error)**:
```json
{
  "status": "error",
  "message": "Connection refused: 127.0.0.1:5432"
}
```

**Status Codes**:
- `200` - Success (check status field for actual health)
- `500` - Critical error

---

## 🔄 Common Use Cases

### Use Case 1: Display Template Gallery
```bash
# Get first 20 minimalist templates
GET /api/templates/portfolios?category=Minimalist&limit=20&offset=0

# Get next page
GET /api/templates/portfolios?category=Minimalist&limit=20&offset=20
```

### Use Case 2: Show Template Details
```bash
# Get full details of Museum template
GET /api/templates/portfolios/tpl_061
```

### Use Case 3: Get Recommended Sheets for Portfolio
```bash
# User selected Museum template, what sheets are recommended?
GET /api/templates/compatibility/tpl_061?limit=10
```

### Use Case 4: Filter Sheet by Type and Format
```bash
# Get A2 concept sheets
GET /api/templates/sheets?sheet_type=concept&format=A2&limit=20

# Get all elevation sheets
GET /api/templates/sheets?sheet_type=elevation&limit=50
```

### Use Case 5: Search Templates
```bash
# Search portfolio templates
GET /api/templates/portfolios?search=residential&limit=10

# Search sheet templates  
GET /api/templates/sheets?search=plan&limit=10
```

---

## 💾 Data Structure Reference

### ColorPalette
```json
{
  "primary": "#1A1A1A",
  "accent": "#E8E4DC",
  "background": "#FFFFFF",
  "text": "#1A1A1A",
  "muted": "#999999"
}
```

### FontSystem
```json
{
  "heading": "Font Name",
  "body": "Font Name",
  "accent": "Font Name"
}
```

### LayoutDefinitionTemplate
```json
{
  "structure": "Description of how content is arranged",
  "grid": "1-column, 2-column, asymmetric, etc",
  "image_ratio": "16:9, 3:2, full-bleed, varied"
}
```

### Placeholders
```json
{
  "renders": 3,
  "plans": 1,
  "sections": 1,
  "diagrams": 2,
  "text_description": true,
  "project_title": true,
  "year": false,
  "location": false
}
```

### LayoutZone
```json
{
  "type": "title|image|text|diagram|grid",
  "position": "top|center|bottom|left|right",
  "size": {
    "width": 100,
    "height": 50
  },
  "content_type": "text|render|plan|section|diagram"
}
```

---

## ⚡ Performance Tips

### Caching
- Portfolio categories rarely change: cache for 24 hours
- Sheet types/formats rarely change: cache for 24 hours
- Stats can be cached for 1 hour
- Individual templates can be cached for 1 hour

### Pagination
- Always use limit (default 50, max 100)
- Use offset for pagination (not cursor-based)
- Sort by created_at descending for consistency

### Filtering
- Use category/sheet_type filters instead of search when possible
- Filters are indexed for fast queries
- Combine filters: `?sheet_type=concept&format=A2&limit=20`

---

## 🔐 Security Notes

- All endpoints are **read-only** (GET only)
- No authentication required (templates are public)
- CORS enabled for frontend access
- Rate limiting: None (will add in Phase 5)
- SQL injection: Not possible (using parameterized queries)

---

## 🐛 Error Handling

### Error Response Format
```json
{
  "detail": "Human-readable error message"
}
```

### Common Errors
```
404 - Template not found
400 - Invalid query parameters (bad category, sheet_type, etc)
500 - Database connection error
```

---

## 📞 Integration Notes

### Frontend Integration
```javascript
// Fetch portfolio templates
const response = await fetch('/api/templates/portfolios?category=Minimalist&limit=10');
const { total, templates } = await response.json();

// Fetch specific template
const template = await fetch('/api/templates/portfolios/tpl_061');
const details = await template.json();

// Get sheet recommendations
const sheets = await fetch('/api/templates/compatibility/tpl_061?limit=10');
const { compatible_sheets } = await sheets.json();
```

### Backend Integration
```python
# Using Python requests
import requests

# Get templates
response = requests.get('http://localhost:8000/api/templates/portfolios', 
                       params={'category': 'Minimalist', 'limit': 10})
templates = response.json()

# Get specific template
response = requests.get('http://localhost:8000/api/templates/portfolios/tpl_061')
template = response.json()
```

---

## 📝 Summary

**Total Endpoints**: 12  
**Authentication**: None required  
**Rate Limiting**: None (opt-in for Phase 5)  
**Pagination**: Limit/offset based  
**Filtering**: Category, sheet_type, format, search

**Status**: ✅ Ready for Phase 5 (Frontend Gallery UI)
