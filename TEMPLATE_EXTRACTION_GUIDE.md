# Template Extraction Guide: Portfolio + Sheet Composer

## 🎯 WHAT TO EXTRACT & WHERE

### **BEST SOURCES TO PULL FROM**

#### **1. ArchDaily** (Architecture Focus) ⭐⭐⭐
Website: archdaily.com
```
What to extract:
├─ Project presentation layouts
├─ Color schemes from featured projects
├─ Photography composition styles
├─ Section/elevation drawing styles
└─ Rendering aesthetics

How:
├─ Search "Architecture Portfolio"
├─ Take screenshots of projects
├─ Note color palette (use eyedropper tool)
├─ Document layout (how images arranged, text placement)
└─ Save as template inspiration
```

#### **2. Behance** (Design Portfolios) ⭐⭐⭐
Website: behance.net
```
What to extract:
├─ Portfolio presentation styles
├─ Visual hierarchy patterns
├─ Typography combinations
├─ Color harmony examples
├─ Mood boards
└─ Layout compositions

How:
├─ Search "Architecture Portfolio"
├─ Screenshot each portfolio
├─ Use Figma color picker to extract palette
├─ Document layout structure
└─ Save screenshots + color codes
```

#### **3. Dribbble** (Design Showcase) ⭐⭐
Website: dribbble.com
```
What to extract:
├─ Modern layout trends
├─ Color combinations
├─ Typography pairings
├─ Visual effects
└─ Micro-interactions

How:
├─ Search "Portfolio Design"
├─ Screenshot designs you like
├─ Extract color values
├─ Document layout structure
└─ Note typography (fonts used)
```

#### **4. Canva** (Template Gallery) ⭐⭐⭐
Website: canva.com/templates
```
What to extract:
├─ Pre-designed portfolio templates
├─ Sheet composition layouts
├─ Color palettes (Canva shows them)
├─ Font pairings (Canva documents them)
├─ Section structures
└─ Grid systems

How:
├─ Browse "Architecture Portfolio" templates
├─ For each template you like:
│  ├─ Screenshot it
│  ├─ Note the colors (Canva shows codes)
│  ├─ Note the fonts (Canva lists them)
│  ├─ Document the layout structure
│  └─ Download PNG for reference
└─ Save organized in folders
```

#### **5. Pinterest** (Curation Hub) ⭐⭐
Website: pinterest.com
```
What to extract:
├─ Aesthetic inspiration
├─ Color trends
├─ Composition ideas
├─ Typography styles
└─ Visual references

How:
├─ Search "Architecture Portfolio Design"
├─ Pin designs you like to a board
├─ Screenshot each with color palette
├─ Document what makes it work
└─ Save references folder
```

#### **6. Real Architect Websites** ⭐⭐⭐
Examples: zaha-hadid.com, big.dk, mvrdv.com
```
What to extract:
├─ Professional portfolio structures
├─ Navigation patterns
├─ How projects are presented
├─ Color schemes
├─ Typography hierarchy
└─ Image aspect ratios

How:
├─ Visit 10-15 famous architecture firms
├─ Screenshot each project page
├─ Document layout (header, images, text)
├─ Extract color palette
├─ Note typography
└─ Save as portfolio template inspiration
```

---

## 📋 WHAT TO EXTRACT (SPECIFIC ITEMS)

### **FOR PORTFOLIO TEMPLATES**

#### **1. Colors** 📝
```
Extract:
├─ Primary color (main theme)
├─ Secondary/accent color
├─ Background color
├─ Text color
├─ Neutral/gray tones
└─ Optional: 2-3 tertiary colors

Tools:
├─ Chrome extension: "Color Picker for Chrome"
├─ Online: https://www.coolors.co/
├─ Adobe Color: color.adobe.com
└─ Screenshot + Figma color picker

Save as:
{
  "colors": {
    "primary": "#1A1A1A",
    "accent": "#FF6B35",
    "background": "#FFFFFF",
    "text": "#000000",
    "muted": "#999999"
  },
  "source": "ArchDaily - Studio XYZ Portfolio"
}
```

#### **2. Typography** 📝
```
Extract:
├─ Heading font (serif or sans-serif?)
├─ Body font (readable at small sizes?)
├─ Font pairing
├─ Font sizes (title, heading, body)
├─ Line heights
└─ Letter spacing

Tools:
├─ WhatFont (Chrome extension) - identify fonts
├─ Google Fonts (identify similar fonts)
├─ FontSpy - identify fonts on websites
├─ Inspect Element - check CSS font-family

Save as:
{
  "fonts": {
    "heading": "Cormorant Garamond",
    "body": "Inter",
    "sizes": {
      "title": "48px",
      "heading": "32px",
      "body": "16px"
    }
  },
  "source": "Editorial Magazine style from Behance"
}
```

#### **3. Layout Structure** 📐
```
Extract:
├─ Cover page layout (hero + title positioning)
├─ Project page layout (images + text ratio)
├─ About page layout (photo + bio arrangement)
├─ Grid system (columns, margins, gaps)
├─ Page sequence (how many pages, what order)
└─ Spacing/padding

Tools:
├─ Screenshot the design
├─ Overlay grid in Figma (CMD+Shift+G)
├─ Measure with browser DevTools
├─ Draw layout wireframe

Save as:
{
  "layout": {
    "cover": {
      "structure": "Full-bleed image + centered title",
      "image_ratio": "16:9",
      "title_position": "bottom-left"
    },
    "project": {
      "structure": "2-column: image left, text right",
      "image_ratio": "3:2",
      "text_width": "40%"
    }
  },
  "source": "Nordic Minimal style from ArchDaily"
}
```

#### **4. Visual Style/Mood** 📸
```
Extract:
├─ Aesthetic (minimal, bold, editorial, dark, etc.)
├─ Photography style (lifestyle, technical, artistic)
├─ Image treatment (full-bleed, framed, overlaid)
├─ Animations/transitions (if any)
├─ White space usage (generous vs tight)
├─ Visual hierarchy (how emphasis is created)

Tools:
├─ Screenshot multiple pages
├─ Describe in words what you see
├─ Compare with similar templates
└─ Note what makes it unique

Save as:
{
  "style": {
    "aesthetic": "Minimalist",
    "photography": "Clean, architectural, high-res",
    "spacing": "Generous white space",
    "hierarchy": "Large typography, minimal text",
    "unique": "Gold accent color on typography only"
  },
  "source": "Nordic Minimal trend 2026"
}
```

---

### **FOR SHEET TEMPLATES**

#### **1. Sheet Composition** 📐
```
Extract for each sheet type:
├─ Content zones (where do elements go?)
├─ Zone sizes (what % of page)
├─ Zone spacing (margins between zones)
├─ Image aspect ratios
├─ Text area sizes
└─ Grid structure

Example - Floor Plan Sheet:
{
  "zones": {
    "title": {"position": "top-left", "width": "40%"},
    "plan": {"position": "center", "width": "70%"},
    "legend": {"position": "bottom-right", "width": "25%"}
  }
}
```

#### **2. Sheet Style Variants** 🎨
```
For each sheet type, extract variants:

Concept Sheet:
├─ Variant 1: Minimal Thesis
├─ Variant 2: Bold Manifesto
├─ Variant 3: Narrative Flow
├─ Variant 4: Sketch Style
└─ Variant 5: Dark Mode

For each variant:
├─ Color scheme
├─ Typography
├─ Layout structure
├─ Callout/annotation style
└─ Example image

Save as:
{
  "sheet_type": "concept",
  "variants": [
    {
      "name": "Minimal Thesis",
      "colors": {...},
      "fonts": {...},
      "layout": {...}
    },
    {
      "name": "Bold Manifesto",
      "colors": {...},
      "fonts": {...},
      "layout": {...}
    }
  ]
}
```

#### **3. Content Placement** 📍
```
Extract how content is positioned:

For Plans:
├─ Plan drawing position (% of page)
├─ Legend position (corner or side)
├─ Scale bar position (bottom-left standard?)
├─ North arrow position (top-right standard?)
├─ Title block position (bottom-right standard?)
└─ Dimension strings placement

For Sections:
├─ Section drawing position
├─ Material hatching (how shown?)
├─ Level markers (where?)
├─ Detail callout bubbles (where?)
├─ Dimensions (which side?)
└─ Scale bar position

For Mood Boards:
├─ Image grid layout (3x3? 2x4?)
├─ Color swatches (sidebar or bottom?)
├─ Material samples (integrated or separate?)
├─ Text placement (where descriptions go?)
└─ White space distribution
```

---

## 🗂️ FOLDER STRUCTURE TO CREATE

```
templates_extraction/
│
├─ portfolio_templates/
│  ├─ minimalist/
│  │  ├─ screenshots/
│  │  │  ├─ cover.png
│  │  │  ├─ project_page.png
│  │  │  ├─ about.png
│  │  │  └─ details.png
│  │  ├─ colors.json
│  │  ├─ typography.json
│  │  ├─ layout.json
│  │  └─ notes.txt
│  │
│  ├─ brutalist/
│  │  ├─ screenshots/
│  │  ├─ colors.json
│  │  ├─ typography.json
│  │  ├─ layout.json
│  │  └─ notes.txt
│  │
│  └─ editorial/
│     ├─ screenshots/
│     ├─ colors.json
│     ├─ typography.json
│     ├─ layout.json
│     └─ notes.txt
│
├─ sheet_templates/
│  ├─ concept/
│  │  ├─ minimal_thesis/
│  │  │  ├─ example.png
│  │  │  ├─ layout.json
│  │  │  ├─ colors.json
│  │  │  └─ zones.json
│  │  ├─ bold_manifesto/
│  │  └─ narrative_flow/
│  │
│  ├─ floor_plan/
│  │  ├─ technical/
│  │  ├─ rendered/
│  │  └─ minimal/
│  │
│  ├─ section/
│  │  ├─ technical/
│  │  ├─ rendered/
│  │  └─ atmospheric/
│  │
│  └─ mood_board/
│     ├─ grid_classic/
│     ├─ organic_collage/
│     └─ material_focus/
│
├─ color_palettes/
│  ├─ minimalist.json
│  ├─ brutalist.json
│  ├─ editorial.json
│  ├─ dark_luxury.json
│  └─ sustainable.json
│
├─ typography/
│  ├─ serif_combinations.json
│  ├─ sans_serif_combinations.json
│  └─ mixed_combinations.json
│
└─ references/
   ├─ archdaily_links.txt
   ├─ behance_portfolio_links.txt
   ├─ real_firm_websites.txt
   └─ inspiration_notes.txt
```

---

## 📝 EXTRACTION CHECKLIST

### **For Each Portfolio Template You Find:**

```
☐ Screenshot cover page
☐ Screenshot 2-3 project pages
☐ Screenshot about page
☐ Extract primary color (get hex code)
☐ Extract accent color(s)
☐ Extract background color
☐ Identify heading font
☐ Identify body font
☐ Document layout structure (describe in words)
☐ Note page count
☐ Identify aesthetic (minimal, bold, editorial, etc.)
☐ Take note of what makes it unique
☐ Save all in organized folder
☐ Add JSON file with extracted data
```

### **For Each Sheet Template You Find:**

```
☐ Screenshot the sheet at full size
☐ Take close-up of key details
☐ Document content zones (% of page)
☐ Identify color scheme
☐ Identify fonts
☐ Document image aspect ratios
☐ Note annotation style (callouts, leaders, etc.)
☐ Document white space distribution
☐ Note any special elements (hatching, symbols, etc.)
☐ Take notes on what makes it effective
☐ Save screenshot + JSON
```

---

## 🎯 PRIORITY: WHAT TO EXTRACT FIRST

### **HIGH PRIORITY** (Extract First)

#### **Portfolio Templates** (Pick top 10-15 styles)
```
1. Nordic Minimal
   └─ Source: ArchDaily minimal house portfolios
   └─ Why: Most popular, clean aesthetic
   
2. Brutalist Bold
   └─ Source: Behance designer portfolios
   └─ Why: Strong identity, trending
   
3. Editorial Magazine
   └─ Source: Real firm websites (awards portfolio)
   └─ Why: Professional, narrative-driven
   
4. Dark Luxury
   └─ Source: Luxury architecture firm websites
   └─ Why: Premium feel, high-end market
   
5. Sustainable Green
   └─ Source: ArchDaily green architecture
   └─ Why: Growing market, eco-conscious
   
6. Parametric/Computational
   └─ Source: Zaha Hadid, MVRDV websites
   └─ Why: Complex, shows innovation
   
7. Japanese/Zen Minimalist
   └─ Source: Japanese architecture sites
   └─ Why: Different aesthetic, growing interest
   
8. Hospitality/Interior
   └─ Source: Hotel/resort design portfolios
   └─ Why: Different market, high value
   
9. Urban/Commercial
   └─ Source: Large architecture firm portfolios
   └─ Why: Corporate market, established style
   
10. Sketch/Hand-Drawn
    └─ Source: Emerging architect portfolios
    └─ Why: Trendy, personal, emerging talent market
```

#### **Sheet Templates** (Pick top 5-8 types)
```
1. Concept Sheets (3 variants)
   └─ Minimal, Bold, Narrative
   
2. Floor Plans (3 variants)
   └─ Technical, Rendered, Minimal
   
3. Sections (2 variants)
   └─ Technical, Atmospheric
   
4. Elevations (2 variants)
   └─ Technical, Rendered
   
5. Site Analysis (2 variants)
   └─ Full analytical, Minimal map
   
6. Mood Boards (2 variants)
   └─ Grid, Organic collage
   
7. Presentation Boards (2 variants)
   └─ Full project, Competition format
```

---

## 🛠️ TOOLS YOU'LL NEED

```
Color Extraction:
├─ Chrome extension: "Color Picker for Chrome" (free)
├─ Adobe Color: color.adobe.com (free)
├─ Coolors: coolors.co (free)
└─ Firefox: Built-in eyedropper (right-click)

Font Identification:
├─ Chrome extension: "WhatFont" (free)
├─ FontSpy: fontspy.io (free)
├─ Adobe Fonts: fonts.adobe.com (search)
└─ Google Fonts: fonts.google.com (search)

Layout Analysis:
├─ Figma: figma.com (free tier)
├─ Browser DevTools (F12 → Inspect)
├─ Screenshot + markup tools
└─ Grid overlays (browser extensions)

Screenshot/Organization:
├─ ShareX (Windows, free)
├─ Greenshot (Windows, free)
├─ macOS Screenshot (built-in)
├─ Notion: notion.so (organize findings)
└─ Figma: organize images + notes
```

---

## 📦 OUTPUT STRUCTURE

Once you've extracted, save as:

```json
{
  "portfolio_template": {
    "name": "Nordic Minimal",
    "category": "Minimalist",
    "source": "ArchDaily - Studio XYZ Portfolio",
    "source_url": "https://archdaily.com/...",
    "colors": {
      "primary": "#1A1A1A",
      "accent": "#E8E4DC",
      "background": "#FFFFFF",
      "text": "#333333",
      "muted": "#A8A8A8"
    },
    "fonts": {
      "heading": "Cormorant Garamond",
      "body": "Inter",
      "accent": "Inter"
    },
    "layouts": {
      "cover": "Full-bleed hero image with title overlay bottom-left",
      "project": "2-column: image left 60%, text right 40%",
      "about": "Portrait left 1/3, bio right 2/3, CV below in 3-column"
    },
    "aesthetic": "Clean Scandinavian, abundant white space, elegant",
    "page_count": "20-28",
    "best_for": "High-end residential, premium practices",
    "unique_features": [
      "Thin serif typography",
      "Minimal color palette",
      "Generous spacing",
      "Single hero image per project"
    ],
    "screenshots": [
      "cover.png",
      "project_page.png",
      "about_page.png"
    ]
  }
}
```

---

## 📊 EXTRACTION GOAL (NEXT 2 WEEKS)

**Target**: Extract 20-30 portfolio + 50-75 sheet templates

**Timeline**:
- Days 1-3: Research & identify sources
- Days 4-7: Extract color palettes + typography
- Days 8-10: Extract layout structures
- Days 11-14: Organize, document, save as JSON

**Effort**: 2-3 hours per day, 1 person

**Output**: 
- 20-30 portfolio templates in organized folder
- 50-75 sheet template variants documented
- Color palette library (20+ combinations)
- Typography pairing library (15+ combinations)
- All saved as JSON + screenshots for reference

---

## ✅ NEXT STEP

1. Create the folder structure above
2. Start with top 5 portfolio styles (Nordic, Brutalist, Editorial, Dark, Sustainable)
3. For each, extract:
   - 3 screenshots
   - Colors (JSON)
   - Typography (JSON)
   - Layout notes (text)
4. Save organized
5. Share screenshots + JSONs back to me
6. We can enhance them into full templates

**Start tomorrow. Aim for 1-2 templates per day.**

Once extracted, we can:
- Validate against real use cases
- Refine the layouts
- Add to database
- Build the gallery UI

Ready? 🚀
