/**
 * Portfolio Type Definitions
 * Defines all TypeScript types and interfaces used throughout the portfolio builder application
 */

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
  tertiary?: string
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
    accent: ColorPalette
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

// Builder state
export interface BuilderState {
  currentStep: number
  totalPages: number
  projectCount: number
  frontPage: FrontPageConfig
  lastPage: LastPageConfig
  resumePage: ResumePageConfig
  contentsPage: ContentsPageConfig
  projectPages: ProjectPageConfig[]
  stylePackId: string
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
