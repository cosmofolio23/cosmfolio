/**
 * Canonical Asset Taxonomy — the single source of truth for what an architecture
 * asset *is*, shared by the Library, the Portfolio generator, and COSMO SHEET.
 *
 * Why this exists: the product grew two separate vocabularies —
 *   • Portfolio:  render | plan | section | diagram | detail | material | cover | ...
 *   • Sheet:      plan | section | elevation | detail | diagram | render | sketch | concept | analysis
 *
 * The Library can't sit on two vocabularies, so this module defines ONE canonical
 * (category → type) taxonomy and provides bridge functions both directions, so
 * legacy data maps in and the generators can map back out.
 */

// ─────────────────────────────────────────────────────────────
// CANONICAL TYPES
// ─────────────────────────────────────────────────────────────

export type AssetCategory = 'drawing' | 'visual' | 'process' | 'analysis' | 'text' | 'info'

export type AssetType =
  // drawing — scaled technical drawings
  | 'plan' | 'section' | 'elevation' | 'detail' | 'site-plan' | 'master-plan'
  // visual — renders & photographic output
  | 'exterior-render' | 'interior-render' | 'aerial' | 'model-photo'
  // process — design thinking made visible
  | 'sketch' | 'concept-diagram' | 'circulation' | 'zoning' | 'exploded' | 'evolution' | 'material'
  // analysis — research & site study
  | 'site-analysis' | 'climate' | 'swot' | 'user-study' | 'case-study'
  // text — written content (stored separately, but typed here for completeness)
  | 'concept' | 'description' | 'sustainability' | 'abstract'
  // info — utility / identity assets
  | 'cover' | 'logo' | 'north-arrow' | 'scale-bar' | 'other'

export interface TaxonomyEntry {
  category: AssetCategory
  type: AssetType
  label: string
  /** technical drawings carry scale; others don't */
  scaled: boolean
}

// ─────────────────────────────────────────────────────────────
// THE TAXONOMY TREE
// ─────────────────────────────────────────────────────────────

export const ASSET_TAXONOMY: Record<AssetCategory, { label: string; icon: string; types: Array<{ type: AssetType; label: string; scaled?: boolean }> }> = {
  drawing: {
    label: 'Drawings',
    icon: '📐',
    types: [
      { type: 'plan', label: 'Plan', scaled: true },
      { type: 'section', label: 'Section', scaled: true },
      { type: 'elevation', label: 'Elevation', scaled: true },
      { type: 'detail', label: 'Detail', scaled: true },
      { type: 'site-plan', label: 'Site Plan', scaled: true },
      { type: 'master-plan', label: 'Master Plan', scaled: true },
    ],
  },
  visual: {
    label: 'Visuals',
    icon: '🖼️',
    types: [
      { type: 'exterior-render', label: 'Exterior Render' },
      { type: 'interior-render', label: 'Interior Render' },
      { type: 'aerial', label: 'Aerial View' },
      { type: 'model-photo', label: 'Model Photo' },
    ],
  },
  process: {
    label: 'Process',
    icon: '✏️',
    types: [
      { type: 'sketch', label: 'Sketch' },
      { type: 'concept-diagram', label: 'Concept Diagram' },
      { type: 'circulation', label: 'Circulation Diagram' },
      { type: 'zoning', label: 'Zoning Diagram' },
      { type: 'exploded', label: 'Exploded Diagram' },
      { type: 'evolution', label: 'Form Evolution' },
      { type: 'material', label: 'Material Board' },
    ],
  },
  analysis: {
    label: 'Analysis',
    icon: '📊',
    types: [
      { type: 'site-analysis', label: 'Site Analysis' },
      { type: 'climate', label: 'Climate Study' },
      { type: 'swot', label: 'SWOT' },
      { type: 'user-study', label: 'User Study' },
      { type: 'case-study', label: 'Case Study' },
    ],
  },
  text: {
    label: 'Text',
    icon: '📝',
    types: [
      { type: 'concept', label: 'Concept' },
      { type: 'description', label: 'Description' },
      { type: 'sustainability', label: 'Sustainability' },
      { type: 'abstract', label: 'Abstract' },
    ],
  },
  info: {
    label: 'Info',
    icon: 'ℹ️',
    types: [
      { type: 'cover', label: 'Cover Image' },
      { type: 'logo', label: 'Logo' },
      { type: 'north-arrow', label: 'North Arrow' },
      { type: 'scale-bar', label: 'Scale Bar' },
      { type: 'other', label: 'Other' },
    ],
  },
}

/** Flat lookup of every canonical type. */
export const CANONICAL_TYPES: TaxonomyEntry[] = Object.entries(ASSET_TAXONOMY).flatMap(
  ([category, def]) =>
    def.types.map(t => ({
      category: category as AssetCategory,
      type: t.type,
      label: t.label,
      scaled: !!t.scaled,
    }))
)

export function categoryOf(type: AssetType): AssetCategory {
  return CANONICAL_TYPES.find(t => t.type === type)?.category ?? 'info'
}

export function isScaled(type: AssetType): boolean {
  return CANONICAL_TYPES.find(t => t.type === type)?.scaled ?? false
}

export function labelOf(type: AssetType): string {
  return CANONICAL_TYPES.find(t => t.type === type)?.label ?? type
}

// ─────────────────────────────────────────────────────────────
// BRIDGE: legacy Portfolio asset_type  →  canonical
// (portfolio API valid_types: render, plan, section, diagram, detail,
//  material, cover, elevation, concept, model, process, site, other)
// ─────────────────────────────────────────────────────────────

export function fromPortfolioType(legacy: string): { category: AssetCategory; type: AssetType } {
  const map: Record<string, AssetType> = {
    render: 'exterior-render',
    plan: 'plan',
    section: 'section',
    elevation: 'elevation',
    detail: 'detail',
    diagram: 'concept-diagram',
    material: 'material',
    cover: 'cover',
    concept: 'concept-diagram',
    model: 'model-photo',
    process: 'sketch',
    site: 'site-analysis',
    other: 'other',
  }
  const type = map[legacy] ?? 'other'
  return { category: categoryOf(type), type }
}

// ─────────────────────────────────────────────────────────────
// BRIDGE: Sheet DrawingType  →  canonical
// (sheet DrawingType: plan, section, elevation, detail, diagram,
//  render, sketch, concept, analysis)
// ─────────────────────────────────────────────────────────────

export function fromSheetDrawingType(dt: string): { category: AssetCategory; type: AssetType } {
  const map: Record<string, AssetType> = {
    plan: 'plan',
    section: 'section',
    elevation: 'elevation',
    detail: 'detail',
    diagram: 'concept-diagram',
    render: 'exterior-render',
    sketch: 'sketch',
    concept: 'concept-diagram',
    analysis: 'site-analysis',
  }
  const type = map[dt] ?? 'other'
  return { category: categoryOf(type), type }
}

// ─────────────────────────────────────────────────────────────
// BRIDGE OUT: canonical  →  legacy consumers
// so the existing generators can keep their own vocabulary.
// ─────────────────────────────────────────────────────────────

/** canonical → the Portfolio generator's category bucket */
export function toPortfolioType(type: AssetType): string {
  const cat = categoryOf(type)
  if (type === 'cover') return 'cover'
  if (cat === 'drawing') return type === 'plan' || type === 'site-plan' || type === 'master-plan' ? 'plan' : type === 'section' ? 'section' : type === 'elevation' ? 'elevation' : 'detail'
  if (cat === 'visual') return 'render'
  if (cat === 'process') return type === 'material' ? 'material' : 'diagram'
  if (cat === 'analysis') return 'site'
  return 'other'
}

/** canonical → the Sheet generator's DrawingType */
export function toSheetDrawingType(type: AssetType): string {
  const cat = categoryOf(type)
  if (cat === 'drawing') {
    if (type === 'plan' || type === 'site-plan' || type === 'master-plan') return 'plan'
    return type // section, elevation, detail map 1:1
  }
  if (cat === 'visual') return 'render'
  if (cat === 'process') return type === 'sketch' ? 'sketch' : 'diagram'
  if (cat === 'analysis') return 'analysis'
  return 'diagram'
}

// ─────────────────────────────────────────────────────────────
// SMART INFERENCE: guess category/type (+ scale) from a filename.
// Forgiving — students dump files; we suggest, they correct in one click.
// ─────────────────────────────────────────────────────────────

// Descending so longer scales are tested first (avoids "1-1" matching inside "1-100").
const ARCH_SCALES = ['1:1000', '1:500', '1:200', '1:100', '1:50', '1:20', '1:10', '1:5', '1:1'] as const
export type InferredScale = (typeof ARCH_SCALES)[number]

const isDigitChar = (ch?: string) => ch !== undefined && ch >= '0' && ch <= '9'

/** Detect an architectural scale token in a filename, guarding against partial
 *  matches: "1-1" must NOT match inside "1-100" (the neighbouring chars can't be digits). */
function detectScale(n: string): InferredScale | undefined {
  for (const s of ARCH_SCALES) {
    for (const token of [s, s.replace(':', '-'), s.replace(':', 'to')]) {
      const i = n.indexOf(token)
      if (i === -1) continue
      if (!isDigitChar(n[i - 1]) && !isDigitChar(n[i + token.length])) return s
    }
  }
  return undefined
}

export function inferFromFilename(fileName: string): {
  category: AssetCategory
  type: AssetType
  scale?: InferredScale
  confident: boolean
} {
  const n = fileName.toLowerCase()
  const scale = detectScale(n)

  const guess = (type: AssetType, confident = true): { category: AssetCategory; type: AssetType; scale?: InferredScale; confident: boolean } =>
    ({ category: categoryOf(type), type, scale, confident })

  if (n.includes('master') && n.includes('plan')) return guess('master-plan')
  if (n.includes('site') && n.includes('plan')) return guess('site-plan')
  if (n.includes('plan') || n.includes('gf') || n.includes('ff') || n.includes('floor')) return guess('plan')
  if (n.includes('section') || /\bsec\b/.test(n)) return guess('section')
  if (n.includes('elevation') || /\belev\b/.test(n)) return guess('elevation')
  if (n.includes('detail')) return guess('detail')
  if (n.includes('exterior') || n.includes('ext_') || n.includes('perspective')) return guess('exterior-render')
  if (n.includes('interior') || n.includes('int_')) return guess('interior-render')
  if (n.includes('aerial') || n.includes('birdseye') || n.includes('birds-eye')) return guess('aerial')
  if (n.includes('render') || n.includes('view') || n.includes('visual')) return guess('exterior-render', false)
  if (n.includes('model')) return guess('model-photo')
  if (n.includes('sketch')) return guess('sketch')
  if (n.includes('concept')) return guess('concept-diagram')
  if (n.includes('circulation')) return guess('circulation')
  if (n.includes('zoning') || n.includes('zone')) return guess('zoning')
  if (n.includes('exploded') || n.includes('axo')) return guess('exploded')
  if (n.includes('evolution') || n.includes('massing')) return guess('evolution')
  if (n.includes('material')) return guess('material')
  if (n.includes('climate') || n.includes('sun') || n.includes('wind')) return guess('climate')
  if (n.includes('swot')) return guess('swot')
  if (n.includes('user')) return guess('user-study')
  if (n.includes('case')) return guess('case-study')
  if (n.includes('site') || n.includes('context') || n.includes('analysis')) return guess('site-analysis')
  if (n.includes('cover')) return guess('cover')
  if (n.includes('logo')) return guess('logo')
  if (n.includes('diagram')) return guess('concept-diagram', false)

  // unknown → land in Unsorted (info/other), low confidence
  return guess('other', false)
}

export function isVectorFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase()
  return ext === 'svg' || ext === 'pdf'
}
