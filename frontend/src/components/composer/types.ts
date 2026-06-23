/**
 * Architecture Portfolio Composer - Type System
 *
 * A page is composed of typed BLOCKS (title, render, plan, section, legend, etc.).
 * A LAYOUT arranges those blocks in a specific architectural grid.
 * Templates seed pages with the right blocks + layout based on their metadata.
 */

export type BlockType =
  | 'title'        // Project / page title (heading)
  | 'subtitle'     // Secondary line under title
  | 'meta'         // Metadata fields: Year, Location, Program, Area
  | 'description'  // Body paragraph(s)
  | 'legend'       // Numbered legend: 01 → Living Room
  | 'render'       // 3D render / photograph
  | 'plan'         // Floor plan drawing (with scale + label)
  | 'section'      // Section / elevation drawing
  | 'diagram'      // Concept / analysis diagram
  | 'contents'     // Table of contents auto-block
  // ── Resume block types ──
  | 'headshot'     // Portrait photo
  | 'bio'          // About-me paragraph
  | 'education'    // Degree / school / year entries
  | 'skills'       // Soft/hard skills with optional rating bars
  | 'software'     // Software proficiency (icons + bars)
  | 'achievement'  // Awards, competitions, publications
  | 'interest'     // Hobbies / interests

export interface MetaField {
  label: string
  value: string
}

export interface LegendItem {
  key: string      // "01"
  label: string    // "Living Room"
}

export interface ResumeEntry {
  title: string     // degree name / award name / hobby
  org?: string      // school / institution
  year?: string     // graduation year / award year
  detail?: string   // specialization / description
}

export interface SkillItem {
  name: string
  level: number     // 0–5
  icon?: string     // emoji or short text icon
}

export interface Block {
  id: string
  type: BlockType
  // Text blocks
  text?: string
  // Image blocks (render/plan/section/diagram)
  imageUrl?: string
  label?: string   // Drawing label e.g. "GROUND FLOOR PLAN" / "Section A-A"
  scale?: string   // e.g. "1:100"
  // Legend
  legendItems?: LegendItem[]
  // Metadata
  fields?: MetaField[]
  
  // Resume-specific structured data
  resumeEntries?: ResumeEntry[]   // education / achievement / interest rows
  skillItems?: SkillItem[]        // skills / software items with rating

  // Crop / zoom / fit properties for V4
  fit?: 'cover' | 'contain' | 'fill'
  zoom?: number
  xOffset?: number
  yOffset?: number
  cssFilter?: string // Added for Global Filters feature

  // On-canvas text formatting (V4 floating toolbar)
  fontFamily?: string
  fontSize?: number
  bold?: boolean
  align?: 'left' | 'center' | 'right'
  color?: string
}

export type PageType = 'cover' | 'about' | 'project' | 'contact' | 'resume' | 'contents'

/** A freely-positioned, movable/resizable/rotatable element layered over the
 *  grid layout. Powers the InDesign-style free-canvas editing. */
export interface FreeElement {
  id: string
  kind: 'text' | 'image' | 'rect' | 'ellipse' | 'line' | 'graphic'
  x: number; y: number; w: number; h: number   // % of page
  rotation?: number
  z?: number
  locked?: boolean
  // text
  text?: string
  fontSize?: number          // px at 760px-wide page reference
  fontFamily?: string
  color?: string
  align?: 'left' | 'center' | 'right'
  bold?: boolean
  // shape
  fill?: string
  stroke?: string
  strokeWidth?: number
  // image
  src?: string
  opacity?: number
  cssFilter?: string // Added for Global Filters feature

  // Graphic DNA properties for V4
  graphicType?: string // e.g. 'parametric-curve', 'contour', 'voronoi', etc.
  lineHeight?: number
  letterSpacing?: number
}

export interface Page {
  id: string
  type: PageType
  layoutId: string   // references a LayoutSpec in the layout catalog
  blocks: Block[]
  titleBlockId?: string     // optional Master Title Block applied to this page's title
  freeElements?: FreeElement[]   // free-canvas overlay elements
  drawingMeta?: import('./publishingTypes').DrawingMetadata   // architectural scale + scale bar / north
  /** True spread: this page is a single 1520px-wide canvas that exports as TWO PDF pages. */
  isSpread?: boolean
}

export interface DesignTokens {
  background: string
  text: string
  primary: string
  accent: string
  muted: string
  headingFont: string
  bodyFont: string
  fontScale?: number
  // Content block overlay settings
  overlayEnabled?: boolean
  overlayColor?: string
  overlayOpacity?: number
  overlayPadding?: number
}

let _id = 0
export function uid(prefix = 'b'): string {
  _id += 1
  return `${prefix}-${Date.now().toString(36)}-${_id}`
}

/** Create a fresh block of a given type with sensible defaults. */
export function createBlock(type: BlockType): Block {
  const base: Block = { id: uid(), type }
  switch (type) {
    case 'contents':    return { ...base, label: 'Table of Contents' }
    case 'title':       return { ...base, text: 'Project Title' }
    case 'subtitle':    return { ...base, text: 'Project subtitle or tagline' }
    case 'meta':        return { ...base, fields: [
                          { label: 'Year', value: '2026' },
                          { label: 'Location', value: 'City, Country' },
                          { label: 'Program', value: 'Residential' },
                          { label: 'Area', value: '450 m²' },
                        ] }
    case 'description': return { ...base, text: 'Describe the project: its context, your role, the design concept, and the key moves that make it work.' }
    case 'legend':      return { ...base, label: 'LEGEND', legendItems: [
                          { key: '01', label: 'Entrance' },
                          { key: '02', label: 'Living Room' },
                          { key: '03', label: 'Kitchen' },
                          { key: '04', label: 'Bedroom' },
                        ] }
    case 'render':      return { ...base, imageUrl: '', label: 'Render — View 01' }
    case 'plan':        return { ...base, imageUrl: '', label: 'Ground Floor Plan', scale: '1:100' }
    case 'section':     return { ...base, imageUrl: '', label: 'Section A–A', scale: '1:100' }
    case 'diagram':     return { ...base, imageUrl: '', label: 'Concept Diagram' }
    case 'headshot':    return { ...base, imageUrl: '', label: 'Profile Photo' }
    case 'bio':         return { ...base, text: 'Architecture student with a passion for sustainable design and urban environments. Experienced in design studios, documentation, and model-making.' }
    case 'education':   return { ...base, resumeEntries: [
                          { title: 'B.Arch', org: 'School of Architecture', year: '2026', detail: 'CGPA 8.4 / 10' },
                          { title: 'XII Science', org: 'State Board', year: '2021', detail: '92%' },
                        ] }
    case 'skills':      return { ...base, skillItems: [
                          { name: 'Design Thinking', level: 5 },
                          { name: 'Technical Drawing', level: 4 },
                          { name: 'Model Making', level: 4 },
                          { name: 'Site Analysis', level: 3 },
                          { name: 'Presentation', level: 5 },
                        ] }
    case 'software':    return { ...base, skillItems: [
                          { name: 'AutoCAD', level: 5, icon: '📐' },
                          { name: 'Revit', level: 4, icon: '🏗' },
                          { name: 'SketchUp', level: 4, icon: '📦' },
                          { name: 'Photoshop', level: 4, icon: '🎨' },
                          { name: 'Lumion', level: 3, icon: '✨' },
                          { name: 'Rhino', level: 3, icon: '🦏' },
                        ] }
    case 'achievement': return { ...base, resumeEntries: [
                          { title: 'NASA BAJA Design Award', org: 'National', year: '2025', detail: '1st Place, Structural Category' },
                          { title: 'Dean\'s List', org: 'School of Architecture', year: '2024', detail: 'Academic Excellence' },
                          { title: 'Studio Jury Best Project', org: 'Semester 6', year: '2024', detail: 'Urban Housing Studio' },
                        ] }
    case 'interest':    return { ...base, resumeEntries: [
                          { title: 'Photography', detail: 'Urban & architectural' },
                          { title: 'Sketching', detail: 'Travel journals' },
                          { title: 'Music', detail: 'Guitar, 6 years' },
                          { title: 'Reading', detail: 'Design theory & sci-fi' },
                        ] }
    default:            return base
  }
}

const BLOCK_LABELS: Record<BlockType, string> = {
  title: 'Title', subtitle: 'Subtitle', meta: 'Metadata', description: 'Description',
  legend: 'Legend', render: 'Render', plan: 'Plan', section: 'Section', diagram: 'Diagram',
  contents: 'Table of Contents',
  headshot: 'Headshot', bio: 'Bio', education: 'Education', skills: 'Skills',
  software: 'Software', achievement: 'Achievements', interest: 'Interests',
}
export function blockLabel(t: BlockType): string { return BLOCK_LABELS[t] }

/** Selector helpers used by layouts */
export function byType(blocks: Block[], type: BlockType): Block[] {
  return blocks.filter(b => b.type === type)
}
export function firstImage(blocks: Block[]): Block | undefined {
  return blocks.find(b => ['render', 'plan', 'section', 'diagram'].includes(b.type) && true)
}
export function allImages(blocks: Block[]): Block[] {
  return blocks.filter(b => ['render', 'plan', 'section', 'diagram'].includes(b.type))
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

export function planLabel(i: number): string {
  const names = ['Ground Floor Plan', 'First Floor Plan', 'Second Floor Plan', 'Roof Plan', 'Site Plan']
  return names[i] || `Floor Plan ${i + 1}`
}
