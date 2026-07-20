/**
 * Architectural Sheet Set Composer
 *
 * Professional submission package generator
 * Thesis + Competition + Studio
 */

// ─────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────

export type SubmissionType = 'studio-review' | 'internal-review' | 'final-jury' | 'competition' | 'thesis' | 'professional'

export type SheetSize = 'A4' | 'A3' | 'A2' | 'A1' | 'A0' | 'custom'

export type Orientation = 'portrait' | 'landscape'

export type DrawingType = 'plan' | 'section' | 'elevation' | 'detail' | 'diagram' | 'render' | 'sketch' | 'concept' | 'analysis'

export type ArchScale = '1:1' | '1:5' | '1:10' | '1:20' | '1:50' | '1:100' | '1:200' | '1:500' | '1:1000'

export type SheetType =
  | 'cover' | 'abstract' | 'problem' | 'aim' | 'methodology' | 'literature'
  | 'case-study' | 'analysis' | 'site' | 'climate' | 'user-study'
  | 'concept' | 'form' | 'zoning' | 'master-plan' | 'plans'
  | 'sections' | 'elevations' | 'details' | 'structural' | 'services'
  | 'sustainability' | 'interior' | 'exterior' | 'presentation'
  | 'hero-board' | 'technical-board' | 'experience-board'
  | 'process' | 'renders' | 'generic'

export type ElementKind = 'drawing' | 'text' | 'title' | 'diagram' | 'image' | 'shape' | 'keyplan' | 'annotation' | 'scalebar' | 'sitewidget'

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten'

// ─────────────────────────────────────────────────────────────
// DRAWING METADATA
// ─────────────────────────────────────────────────────────────

export interface DrawingMetadata {
  drawingName: string        // "Ground Floor Plan"
  drawingType: DrawingType   // "plan"
  originalScale: ArchScale   // "1:100"
  sheetScale: ArchScale      // "1:100"
  northPoint?: boolean
  scaleLabel?: string        // "Scale 1:100"
  vector?: boolean           // SVG/PDF vs raster
  url: string
}

export interface SheetElement {
  id: string
  kind: ElementKind
  x: number                  // % of sheet
  y: number
  w: number
  h: number
  z: number
  locked: boolean
  visible: boolean

  // Identity Sync (Master Elements)
  isMaster?: boolean
  masterId?: string

  // Image Effects for cleanup
  imageEffects?: {
    grayscale?: boolean
    invert?: boolean
    contrast?: number // 100 is normal
    multiply?: boolean // blend mode multiply
    whiteOut?: boolean
    blueprintMode?: boolean
    charcoalMode?: boolean
  }

  // Drawing-specific
  drawing?: DrawingMetadata

  // Text-specific
  content?: string
  fontSize?: number
  fontFamily?: string
  color?: string
  bgColor?: string
  textAlign?: 'left' | 'center' | 'right'
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'

  // Image
  src?: string

  // Style & Transforms
  opacity?: number
  blendMode?: BlendMode
  rotation?: number // degrees (0-360)
  flipH?: boolean
  flipV?: boolean

  // Material Swatch Shape (Feature 1)
  maskShape?: 'circle' | 'hexagon' | 'slanted-left' | 'slanted-right' | 'rect'
  extractedPalette?: string[]

  // Key Plan footprints & zone selection (Feature 2)
  keyplanOutlineSvg?: string
  highlightZone?: { x: number; y: number; w: number; h: number }

  // Drafting Annotations (Feature 3)
  annotationType?: 'section-line' | 'elevation-bubble' | 'room-tag' | 'detail-callout'
  annotationLabels?: {
    primary?: string     // e.g. "A"
    secondary?: string   // e.g. "05"
    extra?: string       // e.g. "12.5 sq.m"
  }

  // Dynamic Scale Bars (Feature 4)
  scalebarLengthMeters?: number
  scalebarStyle?: 'metric-blocks' | 'tick-marks' | 'minimal-line'

  // Site Analysis Widgets (Feature 1)
  siteAnalysisType?: 'sunpath' | 'windrose' | 'climatology'
  locationName?: string

  // Image Frame Fitting
  fitMode?: 'contain' | 'cover'
}

// ─────────────────────────────────────────────────────────────
// MASTER ELEMENTS (LINKED ACROSS SHEET SET)
// ─────────────────────────────────────────────────────────────

export interface MasterElement {
  id: string
  kind: 'title' | 'sheet-number' | 'sheet-name' | 'logo' | 'north' | 'scale' | 'date' | 'student' | 'college' | 'guide'
  x: number                 // % position
  y: number
  w: number
  h: number
  locked: boolean

  // Template variables
  template?: string         // "${projectTitle}", "${sheetNumber}", "${date}"
  fontSize?: number
  fontFamily?: string
  color?: string
}

export interface MasterSheet {
  id: string
  name: string
  elements: MasterElement[]
  preserveOnLayoutChange: boolean
}

// ─────────────────────────────────────────────────────────────
// BACKGROUND / OVERLAY
// ─────────────────────────────────────────────────────────────

export interface BackgroundDefinition {
  id: string
  type: 'image' | 'color' | 'pattern' | 'shape' | 'grid'
  color?: string
  image?: string
  opacity?: number
  blendMode?: BlendMode
  pattern?: 'dots' | 'lines' | 'grid' | 'diagonal' | 'topographic' | 'waves' | 'abstract-grid'
  visible: boolean
}

// ─────────────────────────────────────────────────────────────
// SHEET LAYOUT
// ─────────────────────────────────────────────────────────────

export interface SheetLayout {
  id: string
  name: string
  description: string
  columnCount: number
  rowCount: number
  gridSize: 'column' | 'modular' | 'architectural' | 'custom'
  slotDefinitions: SlotDefinition[]
}

export interface SlotDefinition {
  id?: string
  position: number
  needsDrawingType?: DrawingType
  acceptedDrawingTypes?: DrawingType[]
  recommendedScale?: ArchScale
  needsScale?: ArchScale
  label: string
  /** Explicit placement (% of sheet). When set, overrides uniform grid placement — enables asymmetric layouts (hero + strip, columns, bands). */
  frame?: { x: number; y: number; w: number; h: number }
}

// ─────────────────────────────────────────────────────────────
// SHEET
// ─────────────────────────────────────────────────────────────

export interface Sheet {
  id: string
  setId: string
  sheetNumber: number
  sheetName: string
  sheetType: SheetType

  // Layout
  layout: SheetLayout
  background?: BackgroundDefinition

  // Content
  elements: SheetElement[]

  // Grid
  gridEnabled: boolean
  snapEnabled: boolean
  gridType: 'column' | 'modular' | 'architectural' | 'custom'

  // Order
  order: number
}

// ─────────────────────────────────────────────────────────────
// SHEET SET (THE MAIN DOCUMENT)
// ─────────────────────────────────────────────────────────────

export type TitleBlockType = 'bottom-strip' | 'right-column' | 'minimal-corner' | 'none'

export interface SheetSet {
  id: string
  projectId: string

  // Project metadata
  projectName: string
  submissionType: SubmissionType
  studentName?: string
  collegeName?: string
  guideName?: string
  location?: string
  date?: string

  // Page setup
  sheetSize: SheetSize
  customWidth?: number          // mm
  customHeight?: number         // mm
  orientation: Orientation
  titleBlockTemplate?: TitleBlockType

  // Modular Grid & Sheet Layout
  gridColumns?: number
  gridGutter?: number
  sheetMargins?: number
  sheetBorder?: 'none' | 'thin-black' | 'double-line' | 'dashed-border'

  // Master elements
  masterSheets: MasterSheet[]

  // Design tokens
  primaryColor: string
  secondaryColor: string
  accentColor: string
  textColor: string
  backgroundColor: string
  fontFamily: string

  // Content
  sheets: Sheet[]

  // Metadata
  createdAt: string
  updatedAt: string
  version: number
  published: boolean
}

// ─────────────────────────────────────────────────────────────
// TEMPLATE SHEET DEFINITION
// ─────────────────────────────────────────────────────────────

export interface TemplateSheetDef {
  sheetNumber: number
  name: string
  type: SheetType
  description: string
  layout: SheetLayout
  slots: Array<{
    position: number
    needsDrawingType: DrawingType
    needsScale?: ArchScale
    label: string
  }>
  sampleContent?: {
    drawings: DrawingMetadata[]
    diagrams: string[]
    text: string[]
  }
}

// ─────────────────────────────────────────────────────────────
// SHEET SET TEMPLATE PACK
// ─────────────────────────────────────────────────────────────

export interface SheetSetTemplate {
  id: string
  name: string
  description: string
  submissionType: SubmissionType
  sheetCount: number
  defaultSize: SheetSize
  defaultOrientation: Orientation
  sheets: TemplateSheetDef[]
  style: {
    primaryColor: string
    fontFamily: string
    description: string
  }
  requirements: {
    plans: number
    sections: number
    elevations: number
    renders: number
    diagrams: number
  }
  preview: {
    thumbnails: string[]     // Example sheet previews
    description: string
  }
}

// ─────────────────────────────────────────────────────────────
// PAGE SIZE SPECS
// ─────────────────────────────────────────────────────────────

export const SHEET_SIZES: Record<SheetSize, { name: string; width: number; height: number; pxWidth: number; pxHeight: number }> = {
  'A4': { name: 'A4', width: 210, height: 297, pxWidth: 794, pxHeight: 1123 },
  'A3': { name: 'A3', width: 297, height: 420, pxWidth: 1123, pxHeight: 1587 },
  'A2': { name: 'A2', width: 420, height: 594, pxWidth: 1587, pxHeight: 2245 },
  'A1': { name: 'A1', width: 594, height: 841, pxWidth: 2245, pxHeight: 3179 },
  'A0': { name: 'A0', width: 841, height: 1189, pxWidth: 3179, pxHeight: 4494 },
  'custom': { name: 'Custom', width: 0, height: 0, pxWidth: 0, pxHeight: 0 },
}

export function mmToPx(mm: number): number {
  return (mm * 96) / 25.4
}

export function pxToMm(px: number): number {
  return (px * 25.4) / 96
}

// ─────────────────────────────────────────────────────────────
// WIZARD STATE
// ─────────────────────────────────────────────────────────────

export interface SheetSetWizardState {
  step: 'project-info' | 'submission-type' | 'sheet-count' | 'page-setup' | 'template-select' | 'complete'
  projectName: string
  submissionType?: SubmissionType
  sheetCount?: number
  sheetSize?: SheetSize
  orientation?: Orientation
  customWidth?: number
  customHeight?: number
  selectedTemplate?: string
}

// ─────────────────────────────────────────────────────────────
// AI COMMANDS
// ─────────────────────────────────────────────────────────────

export type AISheetCommand =
  | 'compose-set'
  | 'improve-hierarchy'
  | 'improve-white-space'
  | 'make-jury-style'
  | 'make-thesis-style'
  | 'make-competition-style'
  | 'generate-similar'
  | 'fix-alignment'
  | 'improve-presentation'
  | 'auto-fill-assets'
