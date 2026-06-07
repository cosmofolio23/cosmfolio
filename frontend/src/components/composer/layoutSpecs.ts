/**
 * Parametric Layout Engine
 *
 * Instead of hand-coding layouts, we describe each as a set of REGIONS on a
 * 12x12 grid, then GENERATE 100+ layouts by combining:
 *   image families (how images are arranged)  ×  frames (where title/text/legend sit)
 *
 * A single GridRenderer can draw any spec, so adding variety costs nothing.
 */

import {
  type Block, type Page, type PageType,
  uid, createBlock, clamp, planLabel,
} from './types'

export type RegionRole = 'image' | 'title' | 'subtitle' | 'text' | 'legend' | 'meta'

export interface Region {
  role: RegionRole
  c0: number   // grid column start (1..12)
  cs: number   // column span
  r0: number   // grid row start (1..12)
  rs: number   // row span
  imageIndex?: number
}

export type LayoutCategory = 'Cover' | 'Single' | 'Duo' | 'Grid' | 'Hero' | 'Asymmetric' | 'Strip' | 'Text' | 'Contact'

export interface LayoutSpec {
  id: string
  name: string
  category: LayoutCategory
  suits: PageType[]
  regions: Region[]
  imageCount: number
  kind?: 'overlay'   // cover overlay rendering
}

export const LAYOUT_CATEGORIES: LayoutCategory[] = ['Cover', 'Single', 'Duo', 'Hero', 'Strip', 'Grid', 'Asymmetric', 'Text', 'Contact']

/* ------------------------------- geometry -------------------------------- */

interface Rect { c0: number; cs: number; r0: number; rs: number }
const FULL: Rect = { c0: 1, cs: 12, r0: 1, rs: 12 }

function lines(start: number, span: number, n: number): number[] {
  const out: number[] = []
  for (let i = 0; i <= n; i++) out.push(start + Math.round((span * i) / n))
  return out
}

function gridCells(rect: Rect, rows: number, cols: number, startIndex = 0): Region[] {
  const regions: Region[] = []
  const cl = lines(rect.c0, rect.cs, cols)
  const rl = lines(rect.r0, rect.rs, rows)
  let idx = startIndex
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      regions.push({ role: 'image', imageIndex: idx++, c0: cl[c], cs: cl[c + 1] - cl[c], r0: rl[r], rs: rl[r + 1] - rl[r] })
    }
  }
  return regions
}

const img = (imageIndex: number, c0: number, cs: number, r0: number, rs: number): Region => ({ role: 'image', imageIndex, c0, cs, r0, rs })

/* ----------------------------- image families ---------------------------- */

interface Family { key: string; name: string; category: LayoutCategory; count: number; build: (r: Rect) => Region[] }

const FAMILIES: Family[] = [
  { key: 'single', name: 'Full Bleed', category: 'Single', count: 1, build: r => [img(0, r.c0, r.cs, r.r0, r.rs)] },
  { key: 'band', name: 'Centered Band', category: 'Single', count: 1, build: r => [img(0, r.c0, r.cs, r.r0 + Math.round(r.rs * 0.22), Math.round(r.rs * 0.56))] },
  { key: 'duoH', name: 'Side by Side', category: 'Duo', count: 2, build: r => gridCells(r, 1, 2) },
  { key: 'duoV', name: 'Stacked Pair', category: 'Duo', count: 2, build: r => gridCells(r, 2, 1) },
  { key: 'triptychH', name: 'Triptych', category: 'Strip', count: 3, build: r => gridCells(r, 1, 3) },
  { key: 'filmstrip', name: 'Filmstrip', category: 'Strip', count: 4, build: r => gridCells(r, 1, 4) },
  { key: 'quad', name: '2×2 Grid', category: 'Grid', count: 4, build: r => gridCells(r, 2, 2) },
  { key: 'six', name: '2×3 Grid', category: 'Grid', count: 6, build: r => gridCells(r, 2, 3) },
  { key: 'nine', name: 'Contact Sheet', category: 'Grid', count: 9, build: r => gridCells(r, 3, 3) },
  {
    key: 'heroStripBottom', name: 'Hero + Strip', category: 'Hero', count: 4, build: r => {
      const topH = Math.round(r.rs * 0.64)
      const top = img(0, r.c0, r.cs, r.r0, topH)
      const bottom = gridCells({ c0: r.c0, cs: r.cs, r0: r.r0 + topH, rs: r.rs - topH }, 1, 3, 1)
      return [top, ...bottom]
    },
  },
  {
    key: 'heroStripTop', name: 'Strip + Hero', category: 'Hero', count: 4, build: r => {
      const stripH = Math.round(r.rs * 0.34)
      const strip = gridCells({ c0: r.c0, cs: r.cs, r0: r.r0, rs: stripH }, 1, 3, 1)
      const hero = img(0, r.c0, r.cs, r.r0 + stripH, r.rs - stripH)
      return [hero, ...strip]
    },
  },
  {
    key: 'heroSideRight', name: 'Hero + Side', category: 'Hero', count: 3, build: r => {
      const lw = Math.round(r.cs * 0.64)
      const left = img(0, r.c0, lw, r.r0, r.rs)
      const right = gridCells({ c0: r.c0 + lw, cs: r.cs - lw, r0: r.r0, rs: r.rs }, 2, 1, 1)
      return [left, ...right]
    },
  },
  {
    key: 'heroSideLeft', name: 'Side + Hero', category: 'Hero', count: 3, build: r => {
      const sw = Math.round(r.cs * 0.36)
      const side = gridCells({ c0: r.c0, cs: sw, r0: r.r0, rs: r.rs }, 2, 1, 1)
      const right = img(0, r.c0 + sw, r.cs - sw, r.r0, r.rs)
      return [right, ...side]
    },
  },
  {
    key: 'asymLeftBig', name: 'Big Left', category: 'Asymmetric', count: 3, build: r => {
      const lw = Math.round(r.cs * 0.66)
      const left = img(0, r.c0, lw, r.r0, r.rs)
      const right = gridCells({ c0: r.c0 + lw, cs: r.cs - lw, r0: r.r0, rs: r.rs }, 2, 1, 1)
      return [left, ...right]
    },
  },
  {
    key: 'asymRightBig', name: 'Big Right', category: 'Asymmetric', count: 3, build: r => {
      const sw = Math.round(r.cs * 0.34)
      const left = gridCells({ c0: r.c0, cs: sw, r0: r.r0, rs: r.rs }, 2, 1, 1)
      const right = img(0, r.c0 + sw, r.cs - sw, r.r0, r.rs)
      return [right, ...left]
    },
  },
  {
    key: 'twoThirdsStack', name: 'Feature + Pair', category: 'Hero', count: 3, build: r => {
      const topH = Math.round(r.rs * 0.6)
      const top = img(0, r.c0, r.cs, r.r0, topH)
      const bottom = gridCells({ c0: r.c0, cs: r.cs, r0: r.r0 + topH, rs: r.rs - topH }, 1, 2, 1)
      return [top, ...bottom]
    },
  },
  {
    key: 'mosaicLeft', name: 'Mosaic', category: 'Asymmetric', count: 5, build: r => {
      const lw = Math.round(r.cs * 0.6)
      const left = img(0, r.c0, lw, r.r0, r.rs)
      const right = gridCells({ c0: r.c0 + lw, cs: r.cs - lw, r0: r.r0, rs: r.rs }, 4, 1, 1)
      return [left, ...right]
    },
  },
  {
    key: 'mondrian3', name: 'Mondrian', category: 'Asymmetric', count: 3, build: r => {
      const lw = Math.round(r.cs * 0.6)
      const th = Math.round(r.rs * 0.6)
      return [
        img(0, r.c0, lw, r.r0, th),                          // big top-left
        img(1, r.c0 + lw, r.cs - lw, r.r0, r.rs),            // tall right
        img(2, r.c0, lw, r.r0 + th, r.rs - th),              // wide bottom-left
      ]
    },
  },
  {
    key: 'bandsThree', name: 'Three Bands', category: 'Strip', count: 3, build: r => gridCells(r, 3, 1) },
  {
    key: 'gridSixTall', name: '3×2 Grid', category: 'Grid', count: 6, build: r => gridCells(r, 3, 2) },
]

/* --------------------------------- frames -------------------------------- */

interface Frame { key: string; name: string; build: () => { rect: Rect; extra: Region[] } }

const FRAMES: Frame[] = [
  { key: 'bare', name: 'Bare', build: () => ({ rect: FULL, extra: [] }) },
  {
    key: 'titleTop', name: 'Title top', build: () => ({
      rect: { c0: 1, cs: 12, r0: 3, rs: 10 },
      extra: [{ role: 'title', c0: 1, cs: 12, r0: 1, rs: 2 }],
    }),
  },
  {
    key: 'titleTopText', name: 'Title + caption', build: () => ({
      rect: { c0: 1, cs: 12, r0: 3, rs: 8 },
      extra: [{ role: 'title', c0: 1, cs: 12, r0: 1, rs: 2 }, { role: 'text', c0: 1, cs: 12, r0: 11, rs: 2 }],
    }),
  },
  {
    key: 'titleBottom', name: 'Title bottom', build: () => ({
      rect: { c0: 1, cs: 12, r0: 1, rs: 10 },
      extra: [{ role: 'title', c0: 1, cs: 12, r0: 11, rs: 2 }],
    }),
  },
  {
    key: 'titleSideRight', name: 'Side title (R)', build: () => ({
      rect: { c0: 1, cs: 8, r0: 1, rs: 12 },
      extra: [
        { role: 'title', c0: 9, cs: 4, r0: 1, rs: 2 },
        { role: 'meta', c0: 9, cs: 4, r0: 3, rs: 4 },
        { role: 'text', c0: 9, cs: 4, r0: 7, rs: 6 },
      ],
    }),
  },
  {
    key: 'titleSideLeft', name: 'Side title (L)', build: () => ({
      rect: { c0: 5, cs: 8, r0: 1, rs: 12 },
      extra: [
        { role: 'title', c0: 1, cs: 4, r0: 1, rs: 2 },
        { role: 'meta', c0: 1, cs: 4, r0: 3, rs: 4 },
        { role: 'text', c0: 1, cs: 4, r0: 7, rs: 6 },
      ],
    }),
  },
  {
    key: 'titleLegendSide', name: 'Title + legend', build: () => ({
      rect: { c0: 1, cs: 9, r0: 3, rs: 10 },
      extra: [
        { role: 'title', c0: 1, cs: 12, r0: 1, rs: 2 },
        { role: 'legend', c0: 10, cs: 3, r0: 3, rs: 10 },
      ],
    }),
  },
  {
    key: 'titleMetaInline', name: 'Title + meta', build: () => ({
      rect: { c0: 1, cs: 12, r0: 4, rs: 9 },
      extra: [
        { role: 'title', c0: 1, cs: 8, r0: 1, rs: 3 },
        { role: 'meta', c0: 9, cs: 4, r0: 1, rs: 3 },
      ],
    }),
  },
]

/* ------------------------ assemble the catalog --------------------------- */

function buildImageSpecs(): LayoutSpec[] {
  const specs: LayoutSpec[] = []
  for (const fam of FAMILIES) {
    for (const frame of FRAMES) {
      const { rect, extra } = frame.build()
      const imageRegions = fam.build(rect)
      specs.push({
        id: `${fam.key}.${frame.key}`,
        name: `${fam.name} · ${frame.name}`,
        category: fam.category,
        suits: ['project'],
        regions: [...imageRegions, ...extra],
        imageCount: fam.count,
      })
    }
  }
  return specs
}

/* --------------------------------- covers -------------------------------- */
/**
 * Covers are generated parametrically too: a COMPOSITION decides where the
 * image(s) sit and leaves a free "text zone"; a PLACEMENT positions the
 * title/subtitle inside that zone. comp × placement => 50+ covers.
 */

interface CoverComp {
  key: string
  name: string
  overlay: boolean        // does the text sit on top of the image?
  tall: boolean           // tall text zone (full height) → allows the 'display' placement
  images: Region[]
  zone: Rect              // where title/subtitle go
  imageCount: number
}

const COVER_COMPS: CoverComp[] = [
  // ---- wide text zone (band along top/bottom or overlay) ----
  { key: 'fullBleed', name: 'Full Bleed', overlay: true, tall: false, imageCount: 1, images: [img(0, 1, 12, 1, 12)], zone: { c0: 1, cs: 12, r0: 8, rs: 5 } },
  { key: 'fullBleedCenter', name: 'Full Bleed Center', overlay: true, tall: false, imageCount: 1, images: [img(0, 1, 12, 1, 12)], zone: { c0: 2, cs: 10, r0: 4, rs: 5 } },
  { key: 'bandTop', name: 'Image Band Top', overlay: false, tall: false, imageCount: 1, images: [img(0, 1, 12, 1, 7)], zone: { c0: 1, cs: 12, r0: 8, rs: 5 } },
  { key: 'bandBottom', name: 'Image Band Bottom', overlay: false, tall: false, imageCount: 1, images: [img(0, 1, 12, 6, 7)], zone: { c0: 1, cs: 12, r0: 1, rs: 5 } },
  { key: 'framed', name: 'Framed', overlay: false, tall: false, imageCount: 1, images: [img(0, 2, 10, 2, 7)], zone: { c0: 1, cs: 12, r0: 9, rs: 4 } },
  { key: 'mondrian', name: 'Mondrian', overlay: false, tall: false, imageCount: 3, images: [img(0, 1, 7, 1, 8), img(1, 8, 5, 1, 5), img(2, 8, 5, 6, 3)], zone: { c0: 1, cs: 12, r0: 9, rs: 4 } },
  { key: 'contactSheet', name: 'Contact Sheet', overlay: false, tall: false, imageCount: 6, images: gridCells({ c0: 1, cs: 12, r0: 7, rs: 6 }, 2, 3), zone: { c0: 1, cs: 12, r0: 1, rs: 6 } },
  // ---- tall text zone (full-height column beside image) ----
  { key: 'splitLeft', name: 'Split Left', overlay: false, tall: true, imageCount: 1, images: [img(0, 1, 6, 1, 12)], zone: { c0: 7, cs: 6, r0: 1, rs: 12 } },
  { key: 'splitRight', name: 'Split Right', overlay: false, tall: true, imageCount: 1, images: [img(0, 7, 6, 1, 12)], zone: { c0: 1, cs: 6, r0: 1, rs: 12 } },
  { key: 'splitWideLeft', name: 'Wide Split Left', overlay: false, tall: true, imageCount: 1, images: [img(0, 1, 8, 1, 12)], zone: { c0: 9, cs: 4, r0: 1, rs: 12 } },
  { key: 'splitWideRight', name: 'Wide Split Right', overlay: false, tall: true, imageCount: 1, images: [img(0, 5, 8, 1, 12)], zone: { c0: 1, cs: 4, r0: 1, rs: 12 } },
  { key: 'typographic', name: 'Typographic', overlay: false, tall: true, imageCount: 0, images: [], zone: { c0: 2, cs: 10, r0: 1, rs: 12 } },
]

type CoverPlacement = 'topLeft' | 'center' | 'bottom' | 'eyebrow' | 'display'
const PLACE_NAME: Record<CoverPlacement, string> = {
  topLeft: 'Title Top', center: 'Centered', bottom: 'Title Bottom', eyebrow: 'Eyebrow', display: 'Display',
}
const WIDE_PLACEMENTS: CoverPlacement[] = ['topLeft', 'center', 'bottom', 'eyebrow']
const TALL_PLACEMENTS: CoverPlacement[] = ['topLeft', 'center', 'bottom', 'eyebrow', 'display']

function rrow(z: Rect, r0: number, rs: number): { r0: number; rs: number } {
  const top = clamp(r0, z.r0, z.r0 + z.rs - 1)
  const span = clamp(rs, 1, z.r0 + z.rs - top)
  return { r0: top, rs: span }
}

function placeCoverText(p: CoverPlacement, z: Rect): Region[] {
  switch (p) {
    case 'topLeft': {
      const t = rrow(z, z.r0, 2), s = rrow(z, z.r0 + 2, 1)
      return [{ role: 'title', c0: z.c0, cs: z.cs, ...t }, { role: 'subtitle', c0: z.c0, cs: z.cs, ...s }]
    }
    case 'center': {
      const mid = z.r0 + Math.max(0, Math.floor((z.rs - 3) / 2))
      const t = rrow(z, mid, 2), s = rrow(z, mid + 2, 1)
      return [{ role: 'title', c0: z.c0, cs: z.cs, ...t }, { role: 'subtitle', c0: z.c0, cs: z.cs, ...s }]
    }
    case 'bottom': {
      const t = rrow(z, z.r0 + z.rs - 3, 2), s = rrow(z, z.r0 + z.rs - 1, 1)
      return [{ role: 'title', c0: z.c0, cs: z.cs, ...t }, { role: 'subtitle', c0: z.c0, cs: z.cs, ...s }]
    }
    case 'eyebrow': {
      const s = rrow(z, z.r0, 1), t = rrow(z, z.r0 + 1, 2)
      return [{ role: 'subtitle', c0: z.c0, cs: z.cs, ...s }, { role: 'title', c0: z.c0, cs: z.cs, ...t }]
    }
    case 'display': {
      const t = rrow(z, z.r0, z.rs - 1), s = rrow(z, z.r0 + z.rs - 1, 1)
      return [{ role: 'title', c0: z.c0, cs: z.cs, ...t }, { role: 'subtitle', c0: z.c0, cs: z.cs, ...s }]
    }
  }
}

function buildCoverSpecs(): LayoutSpec[] {
  const specs: LayoutSpec[] = []
  for (const comp of COVER_COMPS) {
    const placements = comp.tall ? TALL_PLACEMENTS : WIDE_PLACEMENTS
    for (const p of placements) {
      specs.push({
        id: `cover.${comp.key}.${p}`,
        name: `${comp.name} · ${PLACE_NAME[p]}`,
        category: 'Cover',
        suits: ['cover'],
        regions: [...comp.images, ...placeCoverText(p, comp.zone)],
        imageCount: comp.imageCount,
        kind: comp.overlay ? 'overlay' : undefined,
      })
    }
  }
  return specs
}

const COVER_SPECS: LayoutSpec[] = buildCoverSpecs()

/** Legacy cover ids → nearest new cover, so already-saved portfolios still resolve. */
const COVER_ALIAS: Record<string, string> = {
  'cover.hero': 'cover.fullBleed.bottom',
  'cover.minimal': 'cover.typographic.center',
  'cover.splitRight': 'cover.splitRight.center',
  'cover.splitLeft': 'cover.splitLeft.center',
  'cover.bandTop': 'cover.bandTop.bottom',
}

const TEXT_SPECS: LayoutSpec[] = [
  {
    id: 'text.statement', name: 'Statement', category: 'Text', suits: ['about', 'cover'], imageCount: 0,
    regions: [{ role: 'title', c0: 1, cs: 11, r0: 2, rs: 3 }, { role: 'text', c0: 1, cs: 9, r0: 5, rs: 6 }],
  },
  {
    id: 'text.statementImage', name: 'Statement + Image', category: 'Text', suits: ['about'], imageCount: 1,
    regions: [{ role: 'title', c0: 1, cs: 6, r0: 2, rs: 2 }, { role: 'text', c0: 1, cs: 6, r0: 4, rs: 8 }, img(0, 7, 6, 2, 10)],
  },
  {
    id: 'text.twoColumn', name: 'Two Column Text', category: 'Text', suits: ['about'], imageCount: 0,
    regions: [{ role: 'title', c0: 1, cs: 12, r0: 1, rs: 2 }, { role: 'text', c0: 1, cs: 6, r0: 3, rs: 9 }, { role: 'meta', c0: 7, cs: 6, r0: 3, rs: 9 }],
  },
]

const CONTACT_SPECS: LayoutSpec[] = [
  { id: 'contact.center', name: 'Contact · Centered', category: 'Contact', suits: ['contact'], imageCount: 0, regions: [{ role: 'title', c0: 2, cs: 10, r0: 4, rs: 2 }, { role: 'text', c0: 2, cs: 10, r0: 6, rs: 3 }] },
  { id: 'contact.left', name: 'Contact · Left', category: 'Contact', suits: ['contact'], imageCount: 0, regions: [{ role: 'title', c0: 1, cs: 10, r0: 3, rs: 2 }, { role: 'text', c0: 1, cs: 8, r0: 5, rs: 4 }] },
  { id: 'contact.split', name: 'Contact · With Image', category: 'Contact', suits: ['contact'], imageCount: 1, regions: [{ role: 'title', c0: 1, cs: 5, r0: 4, rs: 2 }, { role: 'text', c0: 1, cs: 5, r0: 6, rs: 4 }, img(0, 7, 6, 1, 12)] },
]

export const LAYOUT_CATALOG: LayoutSpec[] = [
  ...COVER_SPECS,
  ...buildImageSpecs(),
  ...TEXT_SPECS,
  ...CONTACT_SPECS,
]

const SPEC_BY_ID = new Map(LAYOUT_CATALOG.map(s => [s.id, s]))

export function getSpec(id: string): LayoutSpec {
  const resolved = SPEC_BY_ID.get(id) || SPEC_BY_ID.get(COVER_ALIAS[id])
  return resolved || LAYOUT_CATALOG.find(s => s.category === 'Single')! || LAYOUT_CATALOG[0]
}

export function specsForType(type: PageType): LayoutSpec[] {
  return LAYOUT_CATALOG.filter(s => s.suits.includes(type))
}

export const LAYOUT_COUNT = LAYOUT_CATALOG.length

/* -------------------------- seed from template --------------------------- */

interface TemplateLike {
  name?: string
  layouts?: Record<string, { structure?: string; grid?: string; image_ratio?: string | null }>
  placeholders?: {
    renders?: number; plans?: number; sections?: number; diagrams?: number
    legend?: boolean; text_description?: boolean; project_title?: boolean
  }
}

function pickProjectSpec(grid: string, c: { renders: number; plans: number; sections: number; diagrams: number }): string {
  const g = (grid || '').toLowerCase()
  if (g.includes('asymmetric')) return 'asymRightBig.titleSideLeft'
  if (c.plans >= 2 && c.sections >= 2) return 'six.titleTop'
  if (c.plans > 0) return 'heroSideRight.titleLegendSide'
  if (c.sections > 0) return 'single.titleTopText'
  if (c.renders >= 3) return 'heroStripBottom.titleTop'
  if (c.renders >= 2) return 'twoThirdsStack.titleMetaInline'
  return 'duoV.titleTopText'
}

/** Choose a cover layout that matches the template's described cover structure. */
export function pickCoverSpec(template: TemplateLike): string {
  const cov = template.layouts?.cover
  const s = `${cov?.structure || ''} ${cov?.grid || ''}`.toLowerCase()
  const renders = template.placeholders?.renders ?? 1

  if (s.includes('contact') || s.includes('thumbnail') || s.includes('mosaic')) return 'cover.contactSheet.topLeft'
  if (s.includes('mondrian')) return 'cover.mondrian.bottom'
  if (s.includes('full-bleed') || s.includes('full bleed') || s.includes('overlay')) return 'cover.fullBleed.bottom'
  if (s.includes('split')) return s.includes('right') ? 'cover.splitRight.center' : 'cover.splitLeft.center'
  if (s.includes('frame') || s.includes('border')) return 'cover.framed.bottom'
  if (s.includes('band')) return s.includes('bottom') ? 'cover.bandBottom.topLeft' : 'cover.bandTop.bottom'
  if (s.includes('center')) return 'cover.fullBleedCenter.center'
  if (s.includes('minimal') || s.includes('white space') || s.includes('typographic') || renders === 0) return 'cover.typographic.center'
  // fallback by available imagery
  return renders > 0 ? 'cover.fullBleed.bottom' : 'cover.typographic.center'
}

/** Choose a project/content layout for a template (template-shaped wrapper around pickProjectSpec). */
export function pickProjectSpecForTemplate(template: TemplateLike): string {
  const ph = template.placeholders || {}
  const renders = clamp(ph.renders ?? 2, 0, 9)
  const plans = clamp(ph.plans ?? 1, 0, 9)
  const sections = clamp(ph.sections ?? 1, 0, 9)
  const diagrams = clamp((ph as any).diagrams ?? 0, 0, 6)
  const grid = template.layouts?.project?.grid || ''
  return pickProjectSpec(grid, { renders, plans, sections, diagrams })
}

export function seedPagesFromTemplate(template: TemplateLike): Page[] {
  const ph = template.placeholders || {}
  const renders = clamp(ph.renders ?? 2, 0, 9)
  const plans = clamp(ph.plans ?? 1, 0, 9)
  const sections = clamp(ph.sections ?? 1, 0, 9)
  const diagrams = clamp(ph.diagrams ?? 0, 0, 6)
  const hasLegend = (ph as any).legend ?? plans > 0
  const grid = template.layouts?.project?.grid || ''
  const pages: Page[] = []

  const coverId = pickCoverSpec(template)
  const coverHasImage = getSpec(coverId).imageCount > 0
  pages.push({
    id: uid('p'), type: 'cover', layoutId: coverId,
    blocks: [
      { ...createBlock('title'), text: template.name || 'Portfolio' },
      { ...createBlock('subtitle'), text: 'Architecture & Design — 2026' },
      ...(coverHasImage ? [{ ...createBlock('render'), label: 'Cover Image' }] : []),
    ],
  })

  pages.push({
    id: uid('p'), type: 'about', layoutId: 'text.statement',
    blocks: [{ ...createBlock('title'), text: 'About' }, createBlock('description')],
  })

  const projectSpec = pickProjectSpec(grid, { renders, plans, sections, diagrams })
  for (let i = 1; i <= 2; i++) {
    const blocks: Block[] = [{ ...createBlock('title'), text: `Project 0${i}` }]
    blocks.push(createBlock('meta'))
    blocks.push(createBlock('description'))
    for (let r = 0; r < Math.min(renders, 4); r++) blocks.push({ ...createBlock('render'), label: `Render — View 0${r + 1}` })
    for (let p = 0; p < Math.min(plans, 4); p++) blocks.push({ ...createBlock('plan'), label: planLabel(p) })
    for (let s = 0; s < Math.min(sections, 4); s++) blocks.push({ ...createBlock('section'), label: `Section ${String.fromCharCode(65 + s)}–${String.fromCharCode(65 + s)}` })
    for (let d = 0; d < Math.min(diagrams, 3); d++) blocks.push({ ...createBlock('diagram'), label: `Diagram 0${d + 1}` })
    if (hasLegend) blocks.push(createBlock('legend'))
    pages.push({ id: uid('p'), type: 'project', layoutId: projectSpec, blocks })
  }

  pages.push({
    id: uid('p'), type: 'contact', layoutId: 'contact.center',
    blocks: [{ ...createBlock('title'), text: 'Get in Touch' }, { ...createBlock('description'), text: 'hello@yourstudio.com\n+1 (555) 123-4567\nyourstudio.com' }],
  })

  return pages
}
