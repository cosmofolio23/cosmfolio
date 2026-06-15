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

export interface MetaField {
  label: string
  value: string
}

export interface LegendItem {
  key: string      // "01"
  label: string    // "Living Room"
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
  
  // Crop / zoom / fit properties for V4
  fit?: 'cover' | 'contain' | 'fill'
  zoom?: number
  xOffset?: number
  yOffset?: number
}

export type PageType = 'cover' | 'about' | 'project' | 'contact' | 'resume'

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
}

export interface DesignTokens {
  background: string
  text: string
  primary: string
  accent: string
  muted: string
  headingFont: string
  bodyFont: string
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
    default:            return base
  }
}

const BLOCK_LABELS: Record<BlockType, string> = {
  title: 'Title', subtitle: 'Subtitle', meta: 'Metadata', description: 'Description',
  legend: 'Legend', render: 'Render', plan: 'Plan', section: 'Section', diagram: 'Diagram',
  contents: 'Table of Contents',
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
