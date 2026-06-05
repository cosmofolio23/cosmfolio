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
}

export type PageType = 'cover' | 'about' | 'project' | 'contact'

export type LayoutId =
  | 'cover-hero'
  | 'cover-minimal'
  | 'title-block-drawing'   // big drawing + side title block (technical)
  | 'plan-legend'           // large plan + legend panel
  | 'section-study'         // section + description
  | 'drawing-grid'          // grid of all drawings
  | 'render-showcase'       // hero render + supporting images
  | 'split-render-plan'     // render top / plan bottom
  | 'statement'             // large text statement (about/intro)
  | 'contact-center'

export interface Page {
  id: string
  type: PageType
  layoutId: LayoutId
  blocks: Block[]
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

export interface LayoutDef {
  id: LayoutId
  name: string
  description: string
  icon: string
  /** which page types this layout suits */
  suits: PageType[]
}

/** The architecture layout library. Each arranges blocks differently. */
export const LAYOUTS: LayoutDef[] = [
  { id: 'cover-hero',          name: 'Hero Cover',        description: 'Full-bleed image with title overlay',   icon: '🖼️', suits: ['cover'] },
  { id: 'cover-minimal',       name: 'Minimal Cover',     description: 'Centered title on solid background',     icon: '◻️', suits: ['cover'] },
  { id: 'title-block-drawing', name: 'Title Block',       description: 'Large drawing + side title block',       icon: '📐', suits: ['project'] },
  { id: 'plan-legend',         name: 'Plan + Legend',     description: 'Large plan with numbered legend panel',  icon: '🗺️', suits: ['project'] },
  { id: 'section-study',       name: 'Section Study',     description: 'Section drawing + description',          icon: '📏', suits: ['project'] },
  { id: 'drawing-grid',        name: 'Drawing Grid',      description: 'Grid of plans & sections',               icon: '▦', suits: ['project'] },
  { id: 'render-showcase',     name: 'Render Showcase',   description: 'Hero render + supporting shots',         icon: '✨', suits: ['project'] },
  { id: 'split-render-plan',   name: 'Render / Plan',     description: 'Render on top, plan below',              icon: '⬓', suits: ['project'] },
  { id: 'statement',           name: 'Statement',         description: 'Large text statement',                   icon: '✍️', suits: ['about', 'cover'] },
  { id: 'contact-center',      name: 'Contact',           description: 'Centered contact details',               icon: '✉️', suits: ['contact'] },
]

let _id = 0
export function uid(prefix = 'b'): string {
  _id += 1
  return `${prefix}-${Date.now().toString(36)}-${_id}`
}

/** Create a fresh block of a given type with sensible defaults. */
export function createBlock(type: BlockType): Block {
  const base: Block = { id: uid(), type }
  switch (type) {
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

interface TemplateLike {
  name?: string
  layouts?: Record<string, { structure?: string; grid?: string; image_ratio?: string | null }>
  placeholders?: {
    renders?: number; plans?: number; sections?: number; diagrams?: number
    legend?: boolean; text_description?: boolean; project_title?: boolean
    year?: boolean; location?: boolean
  }
}

/**
 * Seed pages from a template's REAL metadata.
 * Reads placeholders (how many plans/sections/renders) and grid hints
 * so different templates produce genuinely different page structures.
 */
export function seedPagesFromTemplate(template: TemplateLike): Page[] {
  const ph = template.placeholders || {}
  const renders = clamp(ph.renders ?? 2, 0, 8)
  const plans = clamp(ph.plans ?? 1, 0, 8)
  const sections = clamp(ph.sections ?? 1, 0, 8)
  const diagrams = clamp(ph.diagrams ?? 0, 0, 6)
  const hasLegend = ph.legend ?? plans > 0
  const projectGrid = template.layouts?.project?.grid || ''

  const pages: Page[] = []

  // 1) Cover
  pages.push({
    id: uid('p'),
    type: 'cover',
    layoutId: renders > 0 ? 'cover-hero' : 'cover-minimal',
    blocks: [
      { ...createBlock('title'), text: template.name ? `${template.name}` : 'Portfolio' },
      { ...createBlock('subtitle'), text: 'Architecture & Design — 2026' },
      ...(renders > 0 ? [{ ...createBlock('render'), label: 'Cover Image' }] : []),
    ],
  })

  // 2) About / statement
  pages.push({
    id: uid('p'),
    type: 'about',
    layoutId: 'statement',
    blocks: [
      { ...createBlock('title'), text: 'About' },
      createBlock('description'),
    ],
  })

  // 3) Two project pages, structured from placeholders
  for (let i = 1; i <= 2; i++) {
    const blocks: Block[] = [
      { ...createBlock('title'), text: `Project 0${i}` },
    ]
    if (ph.project_title !== false) blocks.push(createBlock('meta'))
    if (ph.text_description !== false) blocks.push(createBlock('description'))

    // images per placeholder counts (cap per page so it stays readable)
    for (let r = 0; r < Math.min(renders, 3); r++) blocks.push({ ...createBlock('render'), label: `Render — View 0${r + 1}` })
    for (let p = 0; p < Math.min(plans, 4); p++) blocks.push({ ...createBlock('plan'), label: planLabel(p) })
    for (let s = 0; s < Math.min(sections, 4); s++) blocks.push({ ...createBlock('section'), label: `Section ${String.fromCharCode(65 + s)}–${String.fromCharCode(65 + s)}` })
    for (let d = 0; d < Math.min(diagrams, 3); d++) blocks.push({ ...createBlock('diagram'), label: `Diagram 0${d + 1}` })
    if (hasLegend) blocks.push(createBlock('legend'))

    blocks.push(createBlock('description'))

    pages.push({
      id: uid('p'),
      type: 'project',
      layoutId: pickProjectLayout(projectGrid, { renders, plans, sections, diagrams }),
      blocks,
    })
  }

  // 4) Contact
  pages.push({
    id: uid('p'),
    type: 'contact',
    layoutId: 'contact-center',
    blocks: [
      { ...createBlock('title'), text: 'Get in Touch' },
      { ...createBlock('description'), text: 'hello@yourstudio.com\n+1 (555) 123-4567\nyourstudio.com' },
    ],
  })

  return pages
}

function pickProjectLayout(grid: string, counts: { renders: number; plans: number; sections: number; diagrams: number }): LayoutId {
  const g = grid.toLowerCase()
  if (g.includes('asymmetric')) return 'title-block-drawing'
  if (counts.plans >= 2 && counts.sections >= 2) return 'drawing-grid'
  if (counts.plans > 0) return 'plan-legend'
  if (counts.sections > 0) return 'section-study'
  if (counts.renders >= 2) return 'render-showcase'
  return 'split-render-plan'
}

function planLabel(i: number): string {
  const names = ['Ground Floor Plan', 'First Floor Plan', 'Second Floor Plan', 'Roof Plan', 'Site Plan']
  return names[i] || `Floor Plan ${i + 1}`
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}
