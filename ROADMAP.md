# CosmoFolio Roadmap — AI Architecture Portfolio Engine

## 🎯 The Vision
Build a parametric portfolio generation system capable of producing millions of unique portfolios through:
- Style DNA × Layout DNA × Grid DNA × Typography DNA × Asset Analysis × AI Decisions

Plus a separate **Sheet Generator** for presentation boards.

---

## 📋 BATCH PLAN — Execute in this order

### ✅ BATCH 0: Foundation Fixes (CURRENT)
- Fix asset upload (route mismatch)
- Fix auth token sync
- Add proper error messages everywhere
- Ensure all existing routes work end-to-end

### 🔨 BATCH 1: Portfolio Creation Wizard (Step 1)
Per your spec:
- Portfolio Name
- Portfolio Type: Internship / Academic / Thesis / Professional / Competition
- Total Number of Pages
- Projects Included (count)
- Page toggles: Resume / About / Contents / Skills / Software / Experience / Contact / Awards / Publication
- "Generate Portfolio" button → triggers DNA system

### 🧬 BATCH 2: Portfolio DNA System
Backend services for:
- **Style DNA** (10 packs: Minimal White / Dark Studio / Scandinavian / Architectural Journal / Competition Board / Parametric / Corporate / Luxury Editorial / Future Tech / Monochrome)
- **Layout DNA** (50+ layouts categorized)
- **Typography DNA** (font pairings)
- **Grid DNA** (column/gutter systems)
- **Spacing DNA** (margin/padding systems)
- **Asset DNA** (AI analyzer of uploaded assets)

### 🎨 BATCH 3: Front Cover Designer
- 50 cover variations (Hero Render / Minimal Typography / Competition / Magazine / Parametric / Dark Studio / Technical Drawing / AI Generated / etc.)
- Preview gallery with thumbnails
- Edit panel: Title / Subtitle / Year / Author / Studio / Fonts / Colors / Layout
- AI buttons: Generate Cover / Generate Typography / Generate Composition

### 👤 BATCH 4: About Me Page Designer
- Question form: Name / Designation / Short Bio / Long Bio / Vision / Mission / Philosophy / Education / Skills / Interests / Languages
- 7 layout variants: Editorial / Magazine / Timeline / Minimal / Corporate / Studio / Creative
- Preview gallery
- AI bio generator

### 📑 BATCH 5: Contents Page Generator
- Auto-generate from project structure
- 5 layouts: Simple List / Grid / Magazine / Architectural Index / AI Generated
- Preview before selection

### 🏗️ BATCH 6: Project Page Engine
- Per project: Name / Location / Area / Year / Typology / Concept / Description
- Asset slots: Images / Plans / Sections / Elevations / Diagrams / Videos / QR Links / Models
- AI Asset Analyzer service
- 6 project styles: Render Heavy / Plan Heavy / Technical Heavy / Diagram Heavy / Competition / Thesis
- AI auto-selects layouts

### 📐 BATCH 7: Layout Engine (50+ Layouts)
Generate full layout library:
- Full Hero Render
- Render + Text
- 3 Render Grid
- Plan + Section + Render
- Diagram Storyboard
- Magazine Spread
- Competition Board
- Technical Sheet
- Timeline Layout
- Parametric Layout
- Mixed Layout
- (... 40+ more variations)

### 🧱 BATCH 8: Component System
Reusable blocks with multiple variants:
- Project Header (5 variants)
- Concept Block (5 variants)
- Image Gallery (5 variants)
- Render Showcase (5 variants)
- Technical Drawings (5 variants)
- Statistics Card (5 variants)
- Timeline (5 variants)
- Material Palette (5 variants)
- QR Block (3 variants)
- Awards Block (5 variants)
- Skills Block (5 variants)
- Software Block (5 variants)
- Contact Block (5 variants)

### 🤖 BATCH 9: AI Portfolio Generator (THE BRAIN)
Backend service that takes:
- Project Type / Page Count / Assets / Style / Grid Preference / Portfolio Goal
And produces complete page-by-page plan:
- Page 1: Cover (which variation)
- Page 2: About (which layout)
- Page 3: Contents (which style)
- Page 4-N: Project pages (which layouts per asset type)
- Final pages: Skills/Software/Contact/Awards

### 👁️ BATCH 10: Viewer Mode (Default After Creation)
Per your spec: after creation, open VIEWER not EDITOR
- Preview button
- Present button (fullscreen slideshow)
- Share button
- Export button (PDF/HTML/PNG)
- Duplicate button
- Edit button (only this opens editor)

### ✏️ BATCH 11: Editor Mode (Figma-style)
- Left panel: Pages list with thumbnails
- Center: Canvas with selected page
- Right panel: Properties (size, color, font, position)
- Top toolbar: Tools (select/text/image/shapes)
- Operations: Drag / Resize / Replace / Swap Layout / Change Style
- AI buttons: Regenerate Page / Rewrite Content / Change Typography / Generate Alternative Layout

### 📊 BATCH 12: Sheet Generation System (Separate from Portfolio)
Already partially built (Phase 8). Polish + expand:
- 6 sheet templates (your existing)
- Sheet wizard
- Element editor
- AI features (title/description/narrative/jury script)
- Export PDF/PNG

### 🎁 BATCH 13: Polish & Launch
- Performance optimization
- Mobile responsive
- Onboarding tour
- Help docs
- Sample portfolios
- Marketing site

---

## 🕒 Realistic Timeline

Each batch is 1-3 chat sessions of focused work.
- **Per session:** ~1-3 batches if simple, 1 batch if complex
- **Total batches:** 13
- **Estimated sessions:** 15-25 chats spread over weeks

We deploy after EACH batch. Test, fix, move on.

---

## 🚦 Current Status

| Batch | Status |
|-------|--------|
| 0 — Foundation | 🔄 IN PROGRESS |
| 1-13 | ⏳ Planned |
