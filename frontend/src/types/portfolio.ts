/**
 * Portfolio Type Definitions
 * Defines all TypeScript types and interfaces used throughout the portfolio builder application
 */

// Layout types
export interface LayoutDefinition {
  id: string
  name: string
  description: string
  category: string
  thumbnail_url?: string
  grid_mode?: string
  cols?: number
  rows?: number
  minAssets?: number
  maxAssets?: number
  gridConfig?: {
    columns: number
    rows: number
    gap?: string
  }
  tags?: string[]
  requiredAssetTypes?: string[]
}

// Overlay types - all variants used in PageFrame.tsx switch cases
export type OverlayType = 'color' | 'gradient' | 'pattern' | 'text' | 'vignette' | 'blur'

// Page numbering format types
export type PageNumberFormat = 'numeric' | 'roman' | 'dash' | 'dot'

export interface OverlaySettings {
  color?: string
  opacity?: number
  gradientAngle?: number
  gradientFrom?: string
  gradientTo?: string
  patternType?: 'dots' | 'lines' | 'grid'
  textContent?: string
  blurAmount?: number
  vignetteColor?: string
  vignetteIntensity?: number
  [key: string]: any
}

export interface OverlayConfig {
  id: string
  type: OverlayType
  enabled: boolean
  settings: OverlaySettings
}

// Design system types
export interface FontToken {
  family: string
  weight: number
  size: string
  letterSpacing?: string
  lineHeight?: string | number
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
}

export interface ColorPalette {
  primary: string
  secondary: string
  tertiary: string
}

export interface AccentPalette {
  primary: string
  secondary: string
}

export interface StylePackTokens {
  id: string
  name: string
  description: string
  fonts: {
    heading: FontToken
    subheading: FontToken
    body: FontToken
    caption: FontToken
    pageNumber: FontToken
  }
  colors: {
    background: string
    surface: string
    text: ColorPalette
    accent: AccentPalette
    border: string
    overlay: string
  }
  spacing: {
    pageMargin: string
    sectionGap: string
    itemGap: string
    innerPadding: string
    headerHeight: string
  }
  grid: {
    columns: number
    gutter: string
    maxWidth: string
  }
  borders: {
    width: string
    style: string
    color: string
    radius: string
  }
  pageNumber: {
    position: string
    format: string
  }
  effects: {
    imageBorderRadius: string
    cardShadow: string
    hoverScale: number
    overlayOpacity: number
  }
}

// Portfolio builder state
export interface FrontPageConfig {
  designMode: 'auto' | 'manual'
  selectedLayoutId: string | null
  content: {
    title: string
    subtitle: string
    tagline: string
  }
}

export interface LastPageConfig {
  selectedLayoutId: string | null
  content: {
    contactEmail: string
    website: string
    phone: string
    qrCode: boolean
  }
}

export interface ResumePageConfig {
  enabled: boolean
  content: {
    name: string
    bio: string
    education: any[]
    experience: any[]
    skills: string[]
    awards: string[]
    software: string[]
    languages: string[]
    interests: string[]
  }
}

export interface ContentsPageConfig {
  enabled: boolean
  style: 'minimal' | 'detailed'
}

export interface ProjectPageConfig {
  projectId: string
  projectName: string
  layoutId: string
  pageNumbers: number[]
  content: {
    title: string
    description: string
    location: string
    year: string
    area: string
    typology: string
    status: string
    role: string
    conceptStatement: string
  }
  assets: {
    renders: string[]
    plans: string[]
    sections: string[]
    diagrams: string[]
  }
}

// Design mode types
export type DesignMode = 'auto' | 'manual'

// ====================================================
// BATCH 1: Portfolio Wizard Types
// ====================================================

/** Portfolio Type — defines the audience and feel of the portfolio */
export type PortfolioType =
  | 'internship'    // For job applications, modern + clean
  | 'academic'      // For school submissions, thorough
  | 'thesis'        // For thesis defense, deep research focus
  | 'professional'  // For senior roles, polished + corporate
  | 'competition'   // For competitions, bold + striking

/** Front cover page content (editable by user) */
export interface FrontCoverConfig {
  title: string
  subtitle: string
  tagline: string
  authorName: string
  year: string
  studio: string
  coverImageUrl: string  // optional uploaded image
}

/** One design project within the portfolio (a single architecture project) */
export interface DesignProjectConfig {
  id: string           // unique index/uuid
  name: string         // e.g. "Museum Redesign"
  location: string     // e.g. "Mumbai, India"
  year: string         // e.g. "2025"
  typology: string     // e.g. "Cultural"
  pageCount: number    // how many pages this project gets in the portfolio
  description: string  // short blurb
  coverImageUrl: string // project cover/thumbnail image (displays in layout)
  assets: {
    renders: string[]     // photo-realistic visuals
    plans: string[]       // floor plans
    sections: string[]    // sections & elevations
    elevations: string[]  // building elevations
    concepts: string[]    // concept diagrams
    diagrams: string[]    // technical diagrams
  }
}

/** About Me page contains multiple toggleable sections (NOT separate pages) */
export interface AboutMePageConfig {
  enabled: boolean
  profilePhotoUrl: string // user's profile photo (displays on about page)
  sections: {
    bio: boolean         // short bio paragraph
    resume: boolean      // education + experience timeline
    skills: boolean      // design skills
    software: boolean    // tools (Rhino, AutoCAD, etc.)
    experience: boolean  // work history
    awards: boolean      // honors, competitions
    publications: boolean // articles, papers
    languages: boolean   // spoken languages
    interests: boolean   // personal interests
  }
  // Content (filled in later, optional now)
  content?: {
    bio?: string
    designation?: string
    vision?: string
    philosophy?: string
  }
}

/** End page (last page) — contact + closing */
export interface EndPageConfig {
  enabled: boolean
  email: string
  website: string
  phone: string
  instagram: string
  linkedin: string
  includeQrCode: boolean
}

/** Complete config from wizard */
export interface PortfolioWizardConfig {
  name: string
  type: PortfolioType
  projectCount: number
  frontCover: FrontCoverConfig
  aboutPage: AboutMePageConfig
  contentsPage: { enabled: boolean }
  endPage: EndPageConfig
}

// Builder state
export interface BuilderState {
  currentStep: number
  // Batch 1: Wizard fields (new structure)
  portfolioName: string
  portfolioType: PortfolioType
  projectCount: number
  totalPages: number  // auto-calculated from sections + projects
  pageFormat: 'pages' | 'spreads'
  frontCover: FrontCoverConfig
  designProjects: DesignProjectConfig[]  // per-project configuration with assets
  aboutPage: AboutMePageConfig
  contentsPageEnabled: boolean
  endPage: EndPageConfig
  // Existing fields (kept for backwards compat with old steps)
  frontPage: FrontPageConfig
  lastPage: LastPageConfig
  resumePage: ResumePageConfig
  contentsPage: ContentsPageConfig
  projectPages: ProjectPageConfig[]
  stylePackId: string
  selectedStylePack: any | null
  portfolioId: string | null
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Shared types
export interface Asset {
  id: string
  file_name: string
  file_size: number
  mime_type: string
  asset_type: string
  created_at: string
  updated_at?: string
  tags?: string[]
  preview_url?: string
}

export interface Layout {
  id: string
  name: string
  description: string
  category: string
  thumbnail_url?: string
  grid_mode?: string
}

export interface Portfolio {
  id: string
  user_id: string
  project_id: string
  layout_id: string
  style_pack: string
  grid_mode: string
  variant_count: number
  created_at: string
  updated_at?: string
}
