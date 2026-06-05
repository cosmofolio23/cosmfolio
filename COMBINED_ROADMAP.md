# CosmoFolio: Combined Portfolio + Sheet Template Implementation Roadmap

## 🎯 THE BIG PICTURE

```
ARCHITECT'S WORKFLOW:

1. BROWSE TEMPLATES
   └─ Browse 60 Portfolio Templates (structure)
      └─ Pick one (e.g., "Nordic Minimal")

2. CREATE PORTFOLIO FROM TEMPLATE
   └─ Portfolio Template loads with default structure
      └─ Comes with suggested Sheet Templates
      └─ Example: Nordic Minimal suggests:
         • Concept — Minimal Thesis
         • Site Analysis — Minimal Map Focus
         • Floor Plan — Minimal Gallery
         • Section — Rendered Atmospheric
         • Mood Board — Classic Grid
         • Materials — Finish Schedule

3. POPULATE WITH CONTENT
   └─ For each page/sheet:
      └─ Upload renders, diagrams, photos
      └─ Sheet Template auto-layouts content
      └─ Customize fonts, colors, text

4. EXPORT & SHARE
   └─ Generate PDF
   └─ Download
   └─ Share link
```

---

## 📊 WHAT WE HAVE

### **Portfolio Templates (60)**
- Complete portfolio structures (16-48 pages each)
- Cover, project pages, about, back matter
- Pre-defined colors, fonts, layouts
- Examples: Nordic Minimal, Editorial Magazine, Brutalist Bold, etc.

### **Sheet Templates (76)**
- Individual presentation sheets (1 page each)
- 13 types: concept, site analysis, plan, section, elevation, etc.
- Style variants within each type
- Examples: Concept—Minimal Thesis, Floor Plan—Rendered Presentation, etc.

### **Integration Point**
Each Portfolio Template recommends a curated set of Sheet Templates that work together stylistically and programmatically.

---

## 🔄 HOW THEY WORK TOGETHER

### **Portfolio Template** = Container (What it looks like overall)
- Style identity (Brutalist, Minimalist, Editorial, etc.)
- Color palette, typography, spacing
- Page structure (cover, projects, about)
- 16-48 pages with defined zones

### **Sheet Templates** = Content (What goes on each page)
- Specific layout for one type of content
- Diagram templates, material palettes, floor plans, sections
- Reusable across projects, custom per project

### **Example Combination**

**Portfolio: Editorial Magazine**
- Colors: cream + gold + burgundy
- Fonts: Playfair Display (heading) + Source Serif Pro (body)
- Pages: Cover, Project 1, Project 2, About, etc.

**Sheet Templates Used:**
- Page 1 (Cover) → Editorial Magazine cover structure
- Pages 2-5 (Projects) → Rendered Presentation Floor Plan + Rendered Atmospheric Section + Material Board
- Page 6 (Process) → Design Timeline Process diagram
- Page 7 (About) → Editorial Magazine about layout

---

## 🏗️ IMPLEMENTATION PHASES

---

## **PHASE 1: FOUNDATION (Week 1-2)**

### 1.1 Database Setup
```sql
-- Portfolio Templates Table
CREATE TABLE portfolio_templates (
  id UUID PRIMARY KEY,
  name VARCHAR UNIQUE,
  category VARCHAR,
  description TEXT,
  style_identity VARCHAR,
  template_json JSONB,
  preview_image_url VARCHAR,
  colors JSONB,
  fonts JSONB,
  page_count INT,
  recommended_sheets UUID[],  -- IDs of suggested sheet templates
  created_at TIMESTAMP
);

-- Sheet Templates Table
CREATE TABLE sheet_templates (
  id UUID PRIMARY KEY,
  name VARCHAR UNIQUE,
  sheet_type VARCHAR,  -- concept, plan, section, elevation, etc.
  category VARCHAR,
  format VARCHAR,  -- A1_landscape, A2_portrait, etc.
  template_json JSONB,
  colors JSONB,
  fonts JSONB,
  layout_zones JSONB,  -- where content goes
  preview_image_url VARCHAR,
  compatible_portfolios UUID[],  -- which portfolio styles it works with
  created_at TIMESTAMP
);

-- Portfolios (User-created)
CREATE TABLE portfolios (
  id UUID PRIMARY KEY,
  user_id UUID FOREIGN KEY,
  portfolio_template_id UUID FOREIGN KEY,
  name VARCHAR,
  status VARCHAR,  -- draft, review, published
  pages JSONB,  -- array of pages with sheet_template_id + content
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Portfolio Pages
CREATE TABLE portfolio_pages (
  id UUID PRIMARY KEY,
  portfolio_id UUID FOREIGN KEY,
  sheet_template_id UUID FOREIGN KEY,
  page_number INT,
  content JSONB,  -- renders, diagrams, text, etc.
  customizations JSONB,  -- color overrides, font changes, etc.
  order INT
);
```

### 1.2 Data Import
- Insert 60 portfolio templates from `templates.json`
- Insert 76 sheet templates from `sheets.json`
- Create compatibility mappings (which sheets work with which portfolios)
- Generate preview images from preview descriptions

### 1.3 Backend Endpoints
```
GET /api/v1/templates/portfolios          → List all portfolio templates
GET /api/v1/templates/portfolios/:id      → Get portfolio template details
GET /api/v1/templates/portfolios/:id/sheets → Get recommended sheets

GET /api/v1/templates/sheets              → List all sheet templates
GET /api/v1/templates/sheets?type=plan    → Filter by type
GET /api/v1/templates/sheets/:id          → Get sheet details

POST /api/v1/portfolios                   → Create portfolio from template
GET /api/v1/portfolios/:id                → Get portfolio
PUT /api/v1/portfolios/:id                → Update portfolio
POST /api/v1/portfolios/:id/pages         → Add/update portfolio page
```

**Effort: 2 weeks (1 backend engineer)**

---

## **PHASE 2: TEMPLATE GALLERY (Week 3-4)**

### 2.1 Portfolio Template Gallery UI
```
SCREEN: Browse Portfolio Templates
├─ Search bar (text search)
├─ Filters:
│  ├─ Category (Residential, Commercial, Minimalist, Brutalist, etc.)
│  ├─ Color mood (Light, Dark, Warm, Cool, Vibrant)
│  ├─ Page count (Quick 16-24pp, Standard 24-32pp, Comprehensive 40-60pp)
│  └─ Style (Minimal, Bold, Editorial, Technical, etc.)
├─ Template Grid (3 columns, scrollable):
│  └─ Each card shows:
│     ├─ Thumbnail preview (cover page)
│     ├─ Name
│     ├─ Category badge
│     ├─ Color swatch preview
│     ├─ Page count
│     └─ "View Details" button
└─ Sorting: Most Popular, Newest, Alphabetical
```

### 2.2 Portfolio Template Details Page
```
SCREEN: Portfolio Template Detail
├─ Hero: Large cover preview
├─ Info:
│  ├─ Name + Description
│  ├─ Category, Style, Page Count
│  ├─ Color Palette (5 swatches)
│  ├─ Typography (show fonts)
│  ├─ Price/Free badge
├─ Preview Carousel:
│  ├─ Cover page
│  ├─ Project page sample
│  ├─ About page sample
│  └─ Recommended sheet types
├─ Details Panel:
│  ├─ What's Included
│  ├─ Best For (residential, commercial, etc.)
│  ├─ Suggested Sheet Types (list of 7-10 recommended sheets)
│  └─ Customization Notes
└─ CTA: "Create Portfolio with This Template"
```

### 2.3 Sheet Template Gallery (Browse View)
```
SCREEN: Sheet Template Library
├─ Tabs: All | Concept | Plans | Sections | Mood Boards | Diagrams | etc.
├─ Filters:
│  ├─ Type (dropdown)
│  ├─ Style (Minimal, Rendered, Dark, Sketch, etc.)
│  ├─ Format (A1, A2, A0)
│  └─ Color theme
├─ Sheet Grid (4 columns):
│  └─ Each card shows:
│     ├─ Thumbnail (preview image)
│     ├─ Name
│     ├─ Type badge
│     ├─ Format tag
│     └─ Quick preview on hover
└─ Sorting: Most Compatible, Newest, Alphabetical
```

**Effort: 3 weeks (1-2 frontend engineers)**
**Tech: React, Figma design system, image lazy-loading**

---

## **PHASE 3: PORTFOLIO CREATOR ENHANCEMENT (Week 5-6)**

### 3.1 Portfolio Template Selection Flow
```
FLOW: Create New Portfolio
1. User clicks "New Portfolio"
2. Modal: "Choose a Template"
   ├─ Show 60 portfolio templates
   ├─ User selects one
   └─ Click "Create"
3. New portfolio opens with:
   ├─ Template structure pre-loaded
   ├─ Suggested sheet templates shown
   ├─ Default colors/fonts from template
   ├─ Empty content zones ready for content
```

### 3.2 Portfolio Structure Display
```
SCREEN: Portfolio Editor
├─ Sidebar (left):
│  ├─ Portfolio name + template name (label)
│  ├─ Pages list (expandable tree):
│  │  ├─ Cover (lock/no-edit)
│  │  ├─ Project 1 (current sheet: Concept—Minimal Thesis)
│  │  ├─ Project 2 (current sheet: Floor Plan—Rendered)
│  │  ├─ About (lock/no-edit)
│  │  └─ "+ Add Page" button
│  └─ Quick style panel:
│     ├─ Font override toggle
│     ├─ Color override toggle
│     └─ Reset to template
│
├─ Canvas (center):
│  └─ Full-page preview of current sheet
│
└─ Right Panel (inspector):
   ├─ Sheet type (e.g., "Floor Plan")
   ├─ Current style (e.g., "Rendered Presentation")
   ├─ Content zones ready for upload
   └─ Customization options
```

### 3.3 Add/Change Sheet on a Page
```
FLOW: Update Page Sheet Type
1. User clicks "+ Add Page" or "Change Sheet"
2. Modal: "Select Sheet Type"
   ├─ Filter by type (Concept, Plan, Section, etc.)
   ├─ Show compatible sheets with current portfolio style
   ├─ Highlight "recommended" sheets
   └─ User picks one
3. New sheet loads:
   ├─ Correct zones appear for content
   ├─ Colors/fonts from portfolio template applied
   ├─ Ready for content upload
```

**Effort: 2 weeks (1 frontend engineer)**

---

## **PHASE 4: SHEET COMPOSER (Week 7-9)**

### 4.1 Sheet Composer UI
```
SCREEN: Edit Single Sheet (within Portfolio)
├─ Top Bar:
│  ├─ Sheet Name (Concept — Minimal Thesis)
│  ├─ Sheet Type indicator (Concept)
│  ├─ Current style indicator (Minimal)
│  └─ "Change Sheet Style" button
│
├─ Canvas (main):
│  └─ Live sheet preview with zones labeled:
│     ├─ [TITLE_ZONE] — Drop title text or image here
│     ├─ [HERO_ZONE] — Drop render or photo (1200x800px)
│     ├─ [DIAGRAM_ZONE_1] — Drop diagram or sketch (400x600px)
│     ├─ [DIAGRAM_ZONE_2] — Drop diagram or sketch
│     ├─ [DIAGRAM_ZONE_3] — Drop diagram or sketch
│     ├─ [TEXT_ZONE] — Drop description text
│     └─ [FOOTER_ZONE] — Project info auto-fills
│
├─ Inspector (right):
│  ├─ Content Zones:
│  │  ├─ Title: [text input] + image upload
│  │  ├─ Hero: [file upload] + aspect ratio lock
│  │  ├─ Diagram 1: [file upload]
│  │  ├─ Diagram 2: [file upload]
│  │  ├─ Diagram 3: [file upload]
│  │  ├─ Description: [rich text editor]
│  │  └─ Project Info: [auto-filled from portfolio]
│  │
│  ├─ Style Override:
│  │  ├─ Typography (inherit from template / custom)
│  │  ├─ Colors (inherit / override)
│  │  └─ "Reset to Template"
│  │
│  └─ Quick Tools:
│     ├─ 📐 Dimension markers (show on hover)
│     ├─ 🎨 Color picker (extract from image)
│     ├─ 🔄 Rotate/crop image
│     └─ ↔️ Swap image aspect ratio
│
└─ Actions:
   ├─ Save
   ├─ Duplicate sheet
   ├─ Delete
   └─ Preview (full-page)
```

### 4.2 Sheet Type Variants
When user clicks "Change Sheet Style", show variants:
```
MODAL: Change Sheet Style

Current: Concept — Minimal Thesis ✓

Other Concept Styles:
├─ Concept — Bold Manifesto
├─ Concept — Narrative Flow
├─ Concept — Parametric Diagram
├─ Concept — Exploded Axonometric
├─ Concept — Black Canvas Dark
├─ Concept — Hand Sketch Organic
├─ Concept — Sustainability Systems
├─ Concept — Urban Context Response
└─ Concept — Collage Experiential

[Each shows thumbnail preview]
[Click to instantly swap - auto-reflows content to new zones]
```

### 4.3 Smart Content Mapping
When user changes sheet type:
- If old sheet had a render → auto-place in new hero zone
- If old sheet had diagrams → auto-place in diagram zones
- If old sheet had text → auto-place in text zone
- Aspect ratios adjusted, warn if content might crop
- User can manually adjust after swap

### 4.4 Template Component Library
```
AVAILABLE IN COMPOSER:

Icon Library (for diagrams):
├─ Sun path icons
├─ Wind rose icons
├─ Water/drainage icons
├─ Circulation arrows
├─ Program bubbles
├─ Structural symbols
└─ Landscape symbols

Diagram Stencils:
├─ Grid lines (for plans)
├─ Section cut lines (for plans)
├─ North arrow variations
├─ Scale bar variations
├─ Dimension callouts
├─ Material hatching patterns
└─ Color/grayscale variations

Material Swatches:
├─ Auto-generated from uploaded image
├─ Color extraction (pull palette from render)
├─ Material library (common finishes)
└─ Texture patterns

Annotation Tools:
├─ Leader lines (connect to callouts)
├─ Callout bubbles (numbered or labeled)
├─ Dimension strings
├─ Section cut indicators
└─ North arrow + scale
```

**Effort: 3 weeks (2 frontend engineers + 1 UX designer)**

---

## **PHASE 5: EXPORT & PUBLISHING (Week 10-11)**

### 5.1 PDF Export
```
ENDPOINT: POST /api/v1/portfolios/:id/export

Options:
├─ Format: PDF (single-file), PNG (per-page), JPG
├─ Quality: Draft (72dpi), Screen (150dpi), Print (300dpi)
├─ Range: All pages, Selected pages, Custom range
├─ Paper: A4, A3, Letter, Tabloid, Custom
├─ Binding: Single-sided, Double-sided (facing pages)
└─ Include: Cover, Back matter, Page numbers, Metadata

Output:
└─ Portfolio_Nordic_Minimal_2026_06_05.pdf (300MB for print quality)
```

### 5.2 Share Link
```
FEATURE: Public Portfolio Share
├─ Generate unique link: cosmofolio.com/p/abc123xyz
├─ Set password protection (optional)
├─ Expiration date (optional)
├─ Download restrictions:
│  ├─ Allow download (full PDF)
│  ├─ View only (read-only)
│  └─ No screenshots
├─ Analytics: View count, page dwell time
└─ Watermark option (for sharing to clients)
```

### 5.3 Publishing Workflow
```
FLOW: Publish Portfolio
1. User clicks "Publish"
2. Pre-flight checks:
   ├─ All content zones filled? ✓
   ├─ All images high-res? ✓
   ├─ All text spell-checked? ✓
   └─ PDF preview looks good?
3. Publish options:
   ├─ Save locally (no publication)
   ├─ Generate share link (get link immediately)
   └─ Publish to profile (shows on cosmofolio.com/architects/john-doe)
4. Success: Get PDF + share link
```

**Effort: 2 weeks (1 backend engineer + 1 frontend)**

---

## **PHASE 6: CUSTOMIZATION & REFINEMENT (Week 12-13)**

### 6.1 Theme Customization
```
FEATURE: Customize Portfolio Template

Once selected, architect can override:
├─ Colors:
│  ├─ Primary color
│  ├─ Accent color
│  ├─ Background
│  └─ Text color
├─ Typography:
│  ├─ Heading font (swap between Cormorant, Playfair, Inter, etc.)
│  ├─ Body font
│  ├─ Font sizes (small, medium, large)
│  └─ Letter spacing
├─ Spacing:
│  ├─ Margin size (compact, normal, generous)
│  ├─ Grid gap
│  └─ Line height
└─ Reset to Template

[All changes apply to entire portfolio automatically]
```

### 6.2 Page-Level Customization
```
FEATURE: Custom Page Layout (Advanced)

For each page, architect can:
├─ Swap sheet type (keep same content)
├─ Adjust zone sizes (drag to resize)
├─ Rearrange zones (drag to reorder)
├─ Add/remove zones
├─ Custom background (solid, gradient, image)
├─ Custom text boxes (free-form)
└─ Lock zones (prevent accidental changes)
```

### 6.3 Content Management
```
FEATURE: Asset Library

Within portfolio editor:
├─ Upload renders (auto-organize by project)
├─ Upload diagrams (auto-organize by type)
├─ Manage materials/swatches
├─ Reuse content across pages
├─ Version history (track changes)
└─ Batch operations (resize, rename, tag)
```

**Effort: 2 weeks (1-2 frontend engineers)**

---

## **PHASE 7: ADVANCED FEATURES (Week 14-16)**

### 7.1 AI-Powered Features
```
FEATURES:

1. Auto-Generate Preview Images
   └─ Use preview_descriptions.txt + DALL-E/Midjourney
      to generate sheet preview thumbnails

2. Smart Content Suggestions
   └─ "You're missing a site analysis, add one?"
   └─ "Concept sheet needs 3 diagrams, you have 1"

3. Layout Recommendations
   └─ "Floor plan is too crowded, try Minimal Gallery style"
   └─ "Section needs more detail, try Rendered Atmospheric"

4. Content Analysis
   └─ "Renders are low-res (72dpi), recommend 150dpi minimum"
   └─ "Text too small, hard to read at print"

5. Style Matching
   └─ "This sheet style doesn't match your portfolio theme"
   └─ Suggest compatible alternatives
```

### 7.2 Collaboration Features
```
FEATURES:

1. Share for Review
   └─ Send to client/colleague
   └─ Collect feedback/annotations
   └─ Track version history

2. Multi-User Editing
   └─ Multiple architects edit same portfolio
   └─ Real-time sync
   └─ Conflict resolution

3. Comments & Markup
   └─ Pin comments to specific pages/zones
   └─ Annotate with arrows/circles
   └─ Resolve comments when addressed
```

### 7.3 Template Marketplace
```
FEATURES:

1. Community Sharing
   └─ Architects can share custom templates
   └─ Earn revenue on paid templates

2. Template Discovery
   └─ Browse user-created templates
   └─ Filter by rating, downloads, category

3. Licensing
   └─ Free / Pay-what-you-want / Commercial license
   └─ Royalty sharing with creators
```

**Effort: 4 weeks (2-3 engineers + design)**

---

## 📈 COMPLETE TIMELINE

```
WEEK   PHASE                           TEAM
1-2    Phase 1: Foundation            Backend (1) + Database
3-4    Phase 2: Template Gallery      Frontend (2) + Design (1)
5-6    Phase 3: Portfolio Creator     Frontend (1) + Design
7-9    Phase 4: Sheet Composer        Frontend (2) + UX (1)
10-11  Phase 5: Export & Publishing   Backend (1) + Frontend (1)
12-13  Phase 6: Customization         Frontend (2)
14-16  Phase 7: Advanced Features     Engineers (3) + AI

TOTAL: 16 weeks (4 months) for full feature set
MVP:   Phase 1-5 (11 weeks / 3 months)
```

---

## 🎯 MVP DELIVERABLES (Phase 1-5)

By end of Week 11, architects can:

✅ Browse 60 portfolio templates + 76 sheet templates  
✅ Create a portfolio from a template (structure + style)  
✅ Populate portfolio pages with sheet templates  
✅ Upload renders, diagrams, text content to sheets  
✅ Switch between sheet style variants (e.g., Minimal → Rendered)  
✅ Customize portfolio colors/fonts  
✅ Export portfolio to PDF (print-ready)  
✅ Share portfolio via unique link  

**This is production-ready and generates revenue.**

---

## 💰 BUSINESS IMPACT

| Phase | Feature | Value |
|---|---|---|
| 1-2 | Templates | Differentiation (vs Canva, Adobe) |
| 3-4 | Creator UI | Core product - architects can create |
| 5 | Export | Monetizable (PDF generation) |
| 6 | Customization | Premium feature, upsell |
| 7 | AI + Marketplace | Recurring revenue + network effects |

---

## 🚀 RECOMMENDATION

**Start with Phase 1-2 in parallel:**
- Backend engineer: Database + APIs (Week 1-2)
- Frontend engineer: Gallery UI (Week 1-4)
- Then merge and test integration

This gets you to MVP fastest with shared learnings.

---

## 📋 DEPENDENCY TREE

```
Phase 1 (Database)
    ↓
Phase 2 (Template Gallery)  +  Phase 3 (Portfolio Creator)
    ↓
Phase 4 (Sheet Composer)
    ↓
Phase 5 (Export/Publish)
    ↓
Phase 6 (Customization)
    ↓
Phase 7 (Advanced)
```

Each phase builds on the previous, but Phases 2 & 3 can start together after Phase 1.

---

## 📊 SUCCESS METRICS

By end of MVP (Week 11):
- [ ] 60 portfolio templates imported + searchable
- [ ] 76 sheet templates imported + filterable
- [ ] Template gallery loads <2s
- [ ] Portfolio creation <5 clicks
- [ ] Sheet composer auto-layouts content correctly
- [ ] PDF exports at 300dpi without errors
- [ ] Beta users can complete portfolio in <30 min
- [ ] NPS score >40

---

## ❓ QUESTIONS FOR YOU

1. **Team size?** How many engineers/designers do you have?
2. **Timeline?** Any launch deadline?
3. **Budget?** Any hosting/API cost constraints?
4. **MVP scope?** Should we focus on Phases 1-5 first?
5. **Monetization?** Free tier + premium, or paid from start?
6. **Integrations?** Need Dropbox, Google Drive, Figma sync?

---

Let me know what resonates and we can dive deeper into any phase! 🎯
