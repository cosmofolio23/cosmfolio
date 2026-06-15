/**
 * Professional Publishing System — Page Sizes, Spreads, Masters, Backgrounds
 *
 * Extends the basic composer types with:
 * - Fixed paper sizes (A5-A0, custom, responsive scaling)
 * - Spread-based design (left/right pages, like a book)
 * - Master pages (fixed elements: headers, footers, page numbers, logos)
 * - Background layers (solid, gradient, image, pattern, grid)
 * - Architectural scales (1:1 → 1:1000)
 */

import type { Page, Block, DesignTokens } from './types'

/* ======================== PAGE SIZES ======================== */

export type PageSizePreset = 'a5' | 'a4-portrait' | 'a4-landscape' | 'a3-portrait' | 'a3-landscape' | 'a2-portrait' | 'a2-landscape' | 'a1-portrait' | 'a1-landscape' | 'a0-portrait' | 'a0-landscape' | 'square' | 'custom'

export interface PageSize {
  preset: PageSizePreset
  /** mm width */
  width: number
  /** mm height */
  height: number
  /** pixels (for canvas) — computed from mm + DPI */
  pxWidth?: number
  pxHeight?: number
  name: string
  /** some sizes are "portrait only" (A0 is huge) or "landscape only" */
  supportsLandscape?: boolean
  supportsPortrait?: boolean
}

export const PAGE_SIZES: Record<PageSizePreset, PageSize> = {
  'a5': { preset: 'a5', width: 148, height: 210, name: 'A5 (148×210mm)', supportsLandscape: true, supportsPortrait: true },
  'a4-portrait': { preset: 'a4-portrait', width: 210, height: 297, name: 'A4 Portrait (210×297mm)' },
  'a4-landscape': { preset: 'a4-landscape', width: 297, height: 210, name: 'A4 Landscape (297×210mm)' },
  'a3-portrait': { preset: 'a3-portrait', width: 297, height: 420, name: 'A3 Portrait (297×420mm)' },
  'a3-landscape': { preset: 'a3-landscape', width: 420, height: 297, name: 'A3 Landscape (420×297mm)' },
  'a2-portrait': { preset: 'a2-portrait', width: 420, height: 594, name: 'A2 Portrait (420×594mm)' },
  'a2-landscape': { preset: 'a2-landscape', width: 594, height: 420, name: 'A2 Landscape (594×420mm)' },
  'a1-portrait': { preset: 'a1-portrait', width: 594, height: 841, name: 'A1 Portrait (594×841mm)' },
  'a1-landscape': { preset: 'a1-landscape', width: 841, height: 594, name: 'A1 Landscape (841×594mm)' },
  'a0-portrait': { preset: 'a0-portrait', width: 841, height: 1189, name: 'A0 Portrait (841×1189mm)' },
  'a0-landscape': { preset: 'a0-landscape', width: 1189, height: 841, name: 'A0 Landscape (1189×841mm)' },
  'square': { preset: 'square', width: 250, height: 250, name: 'Square (250×250mm)' },
  'custom': { preset: 'custom', width: 210, height: 297, name: 'Custom Size' },
}

/** MM to PX at 96 DPI (standard screen) */
export function mmToPx(mm: number): number {
  return Math.round((mm / 25.4) * 96)
}

export function pageSizeToPx(size: PageSize): { width: number; height: number } {
  return { width: mmToPx(size.width), height: mmToPx(size.height) }
}

/* ======================== SPREADS ======================== */

export interface Spread {
  id: string
  /** e.g. "pages-2-3" or "cover-about" */
  name: string
  /** left page of the spread */
  leftPage: Page
  /** right page of the spread (optional; some spreads are single-page) */
  rightPage?: Page
  /** Page size applies to both pages */
  pageSize: PageSize
  /** Master page id (layout, headers, footers, etc.) */
  masterId?: string
  /** Background applies to entire spread */
  background?: BackgroundLayer
  /** Grid settings for both pages */
  grid?: GridSettings
}

/* ======================== ARCHITECTURAL SCALES ======================== */

export type ArchScale = '1:1' | '1:5' | '1:10' | '1:20' | '1:50' | '1:100' | '1:200' | '1:500' | '1:1000'

export interface DrawingMetadata {
  type: 'plan' | 'section' | 'elevation' | 'detail'
  name: string
  scale: ArchScale
  showScaleBar?: boolean
  northPoint?: boolean
  drawingNumber?: string
  caption?: string
}

/* ======================== MASTER PAGES ======================== */

export interface MasterElement {
  id: string
  /** e.g. "page-number", "project-title", "footer-line" */
  type: 'text' | 'shape' | 'image' | 'line' | 'watermark'
  /** Position relative to page (top-left, top-center, etc.) */
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'center' | 'custom'
  x?: number /** px if position is 'custom' */
  y?: number /** px if position is 'custom' */
  width?: number
  height?: number
  /** Text content for text elements */
  text?: string
  /** e.g. "${pageNumber}", "${projectTitle}", "${projectNumber}", literal text */
  textTemplate?: string
  /** Image URL for image elements */
  imageUrl?: string
  fontSize?: number
  fontFamily?: string
  color?: string
  opacity?: number
  locked?: boolean
  hidden?: boolean
  /** applies to 'line' type */
  strokeColor?: string
  strokeWidth?: number
  rotation?: number
  zIndex?: number
}

export interface MasterPage {
  id: string
  name: string
  description?: string
  /** Elements that repeat on every page using this master */
  elements: MasterElement[]
  /** Margins (mm) that apply to content area */
  marginTop?: number
  marginBottom?: number
  marginLeft?: number
  marginRight?: number
  /** When user changes layout, preserve these master elements */
  preserveOnLayoutChange?: boolean
}

/* ======================== BACKGROUND LAYERS ======================== */

export type BackgroundType = 'solid' | 'gradient' | 'image' | 'texture' | 'pattern' | 'grid' | 'shape' | 'watermark'

export interface SolidBackground {
  type: 'solid'
  color: string
}

export interface GradientBackground {
  type: 'gradient'
  from: string
  to: string
  angle?: number
  stops?: Array<{ offset: number; color: string }>
  opacity?: number
}

export interface ImageBackground {
  type: 'image'
  url: string
  fit?: 'cover' | 'contain' | 'stretch' | 'tile'
  opacity?: number
  blur?: number
}

export interface TextureBackground {
  type: 'texture'
  texture: 'concrete' | 'brick' | 'wood' | 'stone' | 'paper' | 'fabric'
  scale?: number
  opacity?: number
}

export interface PatternBackground {
  type: 'pattern'
  pattern: 'dots' | 'lines' | 'grid' | 'cross' | 'diagonal' | 'parametric'
  color: string
  scale?: number
  opacity?: number
}

export interface GridBackground {
  type: 'grid'
  columns?: number
  rows?: number
  color: string
  strokeWidth?: number
  opacity?: number
  scale?: number
}

export interface ShapeBackground {
  type: 'shape'
  shape: 'rectangle' | 'circle' | 'triangle' | 'polygon'
  color: string
  x: number
  y: number
  width: number
  height: number
  opacity?: number
}

export interface WatermarkBackground {
  type: 'watermark'
  text: string
  opacity?: number
  rotation?: number
  fontSize?: number
  color?: string
}

export type BackgroundDefinition =
  | SolidBackground
  | GradientBackground
  | ImageBackground
  | TextureBackground
  | PatternBackground
  | GridBackground
  | ShapeBackground
  | WatermarkBackground

export interface BackgroundLayer {
  id: string
  /** e.g. "site-plan-background", "concrete-texture" */
  name: string
  /** Stack order (0 = bottommost) */
  zIndex: number
  opacity?: number
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten'
  locked?: boolean
  visible?: boolean
  definitions: BackgroundDefinition[]
  /** Apply to */
  appliesTo: 'current-page' | 'current-spread' | 'entire-project'
  /** the page this layer was created on (for 'current-page' / 'current-spread' scoping) */
  pageId?: string
}

/* ======================== GRID SYSTEM ======================== */

export type GridType = 'column' | 'modular' | 'baseline' | 'golden-ratio' | 'architectural' | 'custom'

export interface GridSettings {
  type: GridType
  enabled: boolean
  snapEnabled: boolean
  snapModes: Array<'to-grid' | 'to-object' | 'to-center'>

  // Column grid
  columns?: number
  columnGutter?: number

  // Modular grid
  moduleSize?: number

  // Baseline grid
  baselineHeight?: number

  // Custom grid
  columnWidth?: number
  rowHeight?: number

  // Display
  showGrid: boolean
  gridColor?: string
  gridOpacity?: number
  gridStrokeWidth?: number
}

/* ======================== PORTFOLIO PUBLICATION ======================== */

export interface Portfolio {
  id: string
  name: string
  spreads: Spread[]
  pageSize: PageSize
  defaultMaster?: MasterPage
  masterPages?: MasterPage[]
  defaultBackground?: BackgroundLayer
  backgrounds?: BackgroundLayer[]
  grid?: GridSettings
  designTokens?: DesignTokens
}
