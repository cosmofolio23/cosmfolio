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

export type RegionRole = 'image' | 'title' | 'subtitle' | 'text' | 'legend' | 'meta' | 'contents'
  | 'headshot' | 'bio' | 'education' | 'skills' | 'software' | 'achievement' | 'interest'

export interface Region {
  role: RegionRole
  c0: number   // grid column start (1..12)
  cs: number   // column span
  r0: number   // grid row start (1..12)
  rs: number   // row span
  imageIndex?: number
}

export type LayoutCategory = 'Cover' | 'Single' | 'Duo' | 'Grid' | 'Hero' | 'Asymmetric' | 'Strip' | 'Text' | 'Contact' | 'Resume' | 'Contents' | 'Spread' | 'About'

export interface LayoutSpec {
  id: string
  name: string
  category: LayoutCategory
  suits: PageType[]
  regions: Region[]
  imageCount: number
  kind?: 'overlay'   // cover overlay rendering
  pro?: boolean      // Requires Pro subscription
}

export const LAYOUT_CATEGORIES: LayoutCategory[] = ['Cover', 'Single', 'Duo', 'Hero', 'Strip', 'Grid', 'Asymmetric', 'Text', 'Contact', 'Resume', 'Contents', 'Spread']

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
  { key: 'gridEight', name: '2×4 Grid', category: 'Grid', count: 8, build: r => gridCells(r, 2, 4) },
  { key: 'gridTwelve', name: 'Contact XL', category: 'Grid', count: 12, build: r => gridCells(r, 3, 4) },
  {
    key: 'sidebarLeft', name: 'Sidebar + Feature', category: 'Asymmetric', count: 4, build: r => {
      const sw = Math.round(r.cs * 0.32)
      const side = gridCells({ c0: r.c0, cs: sw, r0: r.r0, rs: r.rs }, 3, 1, 1)
      const main = img(0, r.c0 + sw, r.cs - sw, r.r0, r.rs)
      return [main, ...side]
    },
  },
  {
    key: 'sidebarRight', name: 'Feature + Sidebar', category: 'Asymmetric', count: 4, build: r => {
      const sw = Math.round(r.cs * 0.32)
      const main = img(0, r.c0, r.cs - sw, r.r0, r.rs)
      const side = gridCells({ c0: r.c0 + r.cs - sw, cs: sw, r0: r.r0, rs: r.rs }, 3, 1, 1)
      return [main, ...side]
    },
  },
  {
    key: 'topBannerQuad', name: 'Banner + Quad', category: 'Hero', count: 5, build: r => {
      const topH = Math.round(r.rs * 0.42)
      const banner = img(0, r.c0, r.cs, r.r0, topH)
      const quad = gridCells({ c0: r.c0, cs: r.cs, r0: r.r0 + topH, rs: r.rs - topH }, 2, 2, 1)
      return [banner, ...quad]
    },
  },
  {
    key: 'fullBleedCaption', name: 'Full Bleed + Caption', category: 'Hero', count: 1, build: r => [img(0, r.c0, r.cs, r.r0, Math.round(r.rs * 0.88)), { role: 'text', c0: r.c0 + 1, cs: r.cs - 2, r0: Math.round(r.r0 + r.rs * 0.82), rs: 2 }],
  },
  {
    key: 'splitTextImage', name: 'Split Text / Image', category: 'Asymmetric', count: 2, build: r => {
      const sw = Math.round(r.cs * 0.5)
      return [{ role: 'text', c0: r.c0, cs: sw, r0: r.r0 + 1, rs: r.rs - 2 }, img(0, r.c0 + sw, r.cs - sw, r.r0, r.rs), { role: 'meta', c0: r.c0, cs: sw, r0: r.r0, rs: 1 }]
    },
  },
  {
    key: 'gridCaptioned', name: 'Grid + Captions', category: 'Grid', count: 4, build: r => {
      const quads = gridCells(r, 2, 2)
      return quads.map((q, i) => (i === 3 ? { ...q, role: 'text' as const } : q))
    },
  },
  {
    key: 'centerStage', name: 'Center Stage', category: 'Single', count: 1, build: r => {
      const cm = Math.round(r.cs * 0.16), rm = Math.round(r.rs * 0.14)
      return [img(0, r.c0 + cm, r.cs - cm * 2, r.r0 + rm, r.rs - rm * 2)]
    },
  },
  {
    key: 'pinwheel', name: 'Pinwheel', category: 'Grid', count: 4, build: r => {
      const cMid = r.c0 + Math.round(r.cs * 0.55)
      const rMid = r.r0 + Math.round(r.rs * 0.55)
      return [
        img(0, r.c0, cMid - r.c0, r.r0, rMid - r.r0),
        img(1, cMid, r.c0 + r.cs - cMid, r.r0, Math.round(r.rs * 0.45)),
        img(2, cMid, r.c0 + r.cs - cMid, rMid, r.r0 + r.rs - rMid),
        img(3, r.c0, cMid - r.c0, rMid, r.r0 + r.rs - rMid),
      ]
    },
  },
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
  // ---- additional tall compositions (expand the set) ----
  { key: 'sidebarLeft', name: 'Sidebar Left', overlay: false, tall: true, imageCount: 4, images: gridCells({ c0: 1, cs: 3, r0: 1, rs: 12 }, 4, 1), zone: { c0: 5, cs: 8, r0: 1, rs: 12 } },
  { key: 'sidebarRight', name: 'Sidebar Right', overlay: false, tall: true, imageCount: 4, images: gridCells({ c0: 10, cs: 3, r0: 1, rs: 12 }, 4, 1), zone: { c0: 1, cs: 8, r0: 1, rs: 12 } },
  { key: 'cornerImage', name: 'Corner Image', overlay: false, tall: true, imageCount: 1, images: [img(0, 1, 3, 1, 3)], zone: { c0: 1, cs: 12, r0: 4, rs: 9 } },
  { key: 'storyBand', name: 'Story Band', overlay: false, tall: true, imageCount: 3, images: [img(0, 1, 4, 1, 12), img(1, 5, 4, 1, 6), img(2, 5, 4, 7, 6)], zone: { c0: 9, cs: 4, r0: 1, rs: 12 } },
  { key: 'imageStrip', name: 'Image Strip', overlay: false, tall: true, imageCount: 2, images: [img(0, 1, 12, 1, 5), img(1, 1, 12, 9, 4)], zone: { c0: 1, cs: 12, r0: 6, rs: 3 } },
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

/* --------------------------------- resume -------------------------------- */
/** CV / resume page layouts. Roles map: title=name, subtitle=role/tagline,
 *  meta=contact or skills key/values, text=experience/education body,
 *  legend=skills list, image=headshot. */
const RESUME_SPECS: LayoutSpec[] = [
  { id: 'resume.classic', name: 'Resume · Classic', category: 'Resume', suits: ['resume'], imageCount: 0,
    regions: [
      { role: 'title', c0: 1, cs: 12, r0: 1, rs: 2 }, { role: 'subtitle', c0: 1, cs: 12, r0: 3, rs: 1 },
      { role: 'meta', c0: 1, cs: 4, r0: 5, rs: 8 }, { role: 'text', c0: 6, cs: 7, r0: 5, rs: 8 },
    ] },
  { id: 'resume.sidebar', name: 'Resume · Sidebar', category: 'Resume', suits: ['resume'], imageCount: 1,
    regions: [
      img(0, 1, 4, 1, 4), { role: 'meta', c0: 1, cs: 4, r0: 5, rs: 4 }, { role: 'legend', c0: 1, cs: 4, r0: 9, rs: 4 },
      { role: 'title', c0: 5, cs: 8, r0: 1, rs: 2 }, { role: 'subtitle', c0: 5, cs: 8, r0: 3, rs: 1 }, { role: 'text', c0: 5, cs: 8, r0: 4, rs: 9 },
    ] },
  { id: 'resume.modern', name: 'Resume · Modern Header', category: 'Resume', suits: ['resume'], imageCount: 0,
    regions: [
      { role: 'title', c0: 1, cs: 8, r0: 1, rs: 2 }, { role: 'subtitle', c0: 1, cs: 8, r0: 3, rs: 1 }, { role: 'meta', c0: 9, cs: 4, r0: 1, rs: 3 },
      { role: 'text', c0: 1, cs: 6, r0: 5, rs: 8 }, { role: 'legend', c0: 7, cs: 6, r0: 5, rs: 8 },
    ] },
  { id: 'resume.minimal', name: 'Resume · Minimal', category: 'Resume', suits: ['resume'], imageCount: 0,
    regions: [
      { role: 'title', c0: 2, cs: 10, r0: 2, rs: 2 }, { role: 'subtitle', c0: 2, cs: 10, r0: 4, rs: 1 }, { role: 'text', c0: 2, cs: 10, r0: 6, rs: 6 },
    ] },
  { id: 'resume.photoTop', name: 'Resume · Photo Top', category: 'Resume', suits: ['resume'], imageCount: 1,
    regions: [
      img(0, 1, 12, 1, 4), { role: 'title', c0: 1, cs: 8, r0: 5, rs: 2 }, { role: 'subtitle', c0: 1, cs: 8, r0: 7, rs: 1 },
      { role: 'meta', c0: 9, cs: 4, r0: 5, rs: 3 }, { role: 'text', c0: 1, cs: 12, r0: 8, rs: 5 },
    ] },
  { id: 'resume.twoColumn', name: 'Resume · Two Column', category: 'Resume', suits: ['resume'], imageCount: 0,
    regions: [
      { role: 'title', c0: 1, cs: 12, r0: 1, rs: 2 }, { role: 'text', c0: 1, cs: 6, r0: 4, rs: 9 }, { role: 'meta', c0: 7, cs: 6, r0: 4, rs: 9 },
    ] },
  { id: 'resume.timeline', name: 'Resume · Timeline', category: 'Resume', suits: ['resume'], imageCount: 0,
    regions: [
      { role: 'title', c0: 1, cs: 4, r0: 1, rs: 2 }, { role: 'subtitle', c0: 1, cs: 4, r0: 3, rs: 2 }, { role: 'meta', c0: 1, cs: 4, r0: 6, rs: 6 },
      { role: 'text', c0: 6, cs: 7, r0: 1, rs: 12 },
    ] },
  { id: 'resume.skillsRail', name: 'Resume · Skills Rail', category: 'Resume', suits: ['resume'], imageCount: 0,
    regions: [
      { role: 'title', c0: 1, cs: 12, r0: 1, rs: 2 }, { role: 'subtitle', c0: 1, cs: 9, r0: 3, rs: 1 },
      { role: 'text', c0: 1, cs: 9, r0: 5, rs: 8 }, { role: 'legend', c0: 10, cs: 3, r0: 5, rs: 8 },
    ] },
  { id: 'resume.split', name: 'Resume · Split', category: 'Resume', suits: ['resume'], imageCount: 1,
    regions: [
      { role: 'title', c0: 1, cs: 5, r0: 2, rs: 2 }, { role: 'subtitle', c0: 1, cs: 5, r0: 4, rs: 1 }, { role: 'meta', c0: 1, cs: 5, r0: 6, rs: 6 },
      img(0, 7, 6, 1, 4), { role: 'text', c0: 7, cs: 6, r0: 5, rs: 8 },
    ] },
  { id: 'resume.compact', name: 'Resume · Compact', category: 'Resume', suits: ['resume'], imageCount: 0,
    regions: [
      { role: 'title', c0: 1, cs: 8, r0: 1, rs: 2 }, { role: 'meta', c0: 9, cs: 4, r0: 1, rs: 2 },
      { role: 'subtitle', c0: 1, cs: 12, r0: 3, rs: 1 }, { role: 'text', c0: 1, cs: 12, r0: 5, rs: 8 },
    ] },
  { id: 'resume.swissGrid', name: 'Resume · Swiss Grid (New)', category: 'Resume', suits: ['resume'], imageCount: 0,
    regions: [
      { role: 'title', c0: 1, cs: 4, r0: 1, rs: 2 },
      { role: 'subtitle', c0: 1, cs: 4, r0: 3, rs: 2 },
      { role: 'meta', c0: 1, cs: 4, r0: 5, rs: 4 },
      { role: 'text', c0: 5, cs: 4, r0: 1, rs: 12 },
      { role: 'legend', c0: 9, cs: 4, r0: 1, rs: 12 },
    ] },
  { id: 'resume.splitColumn', name: 'Resume · Split Column (New)', category: 'Resume', suits: ['resume'], imageCount: 1,
    regions: [
      img(0, 1, 4, 1, 5),
      { role: 'title', c0: 1, cs: 4, r0: 6, rs: 2 },
      { role: 'meta', c0: 1, cs: 4, r0: 8, rs: 5 },
      { role: 'text', c0: 6, cs: 7, r0: 1, rs: 6 },
      { role: 'subtitle', c0: 6, cs: 7, r0: 8, rs: 5 },
    ] },
  { id: 'resume.minimalText', name: 'Resume · Minimal Text (New)', category: 'Resume', suits: ['resume'], imageCount: 0,
    regions: [
      { role: 'title', c0: 3, cs: 8, r0: 1, rs: 2 },
      { role: 'text', c0: 3, cs: 8, r0: 4, rs: 5 },
      { role: 'subtitle', c0: 3, cs: 8, r0: 10, rs: 3 },
    ] },
]

/* ------------------------------- about spreads --------------------------- */
/** Resume + About-the-architect spreads. Roles: title=name, subtitle=role,
 *  text=bio/philosophy, meta=education/experience/contact, legend=skills,
 *  image=portrait. suits 'about' + 'resume' so they appear in the About &
 *  Resume library and apply to either page type. */
const ABOUT_SPREAD_SPECS: LayoutSpec[] = [
  { id: 'about.portraitLeft', name: 'About · Portrait Left', category: 'Resume', suits: ['about', 'resume'], imageCount: 1,
    regions: [img(0, 1, 4, 1, 7), { role: 'meta', c0: 1, cs: 4, r0: 8, rs: 5 },
      { role: 'title', c0: 6, cs: 7, r0: 1, rs: 2 }, { role: 'subtitle', c0: 6, cs: 7, r0: 3, rs: 1 }, { role: 'text', c0: 6, cs: 7, r0: 4, rs: 5 }, { role: 'legend', c0: 6, cs: 7, r0: 9, rs: 4 }] },
  { id: 'about.portraitRight', name: 'About · Portrait Right', category: 'Resume', suits: ['about', 'resume'], imageCount: 1,
    regions: [img(0, 9, 4, 1, 7), { role: 'legend', c0: 9, cs: 4, r0: 8, rs: 5 },
      { role: 'title', c0: 1, cs: 7, r0: 1, rs: 2 }, { role: 'subtitle', c0: 1, cs: 7, r0: 3, rs: 1 }, { role: 'text', c0: 1, cs: 7, r0: 4, rs: 5 }, { role: 'meta', c0: 1, cs: 7, r0: 9, rs: 4 }] },
  { id: 'about.portraitBanner', name: 'About · Portrait Banner', category: 'Resume', suits: ['about', 'resume'], imageCount: 1,
    regions: [img(0, 1, 12, 1, 4), { role: 'title', c0: 1, cs: 8, r0: 5, rs: 2 }, { role: 'subtitle', c0: 1, cs: 8, r0: 7, rs: 1 },
      { role: 'text', c0: 1, cs: 7, r0: 8, rs: 5 }, { role: 'meta', c0: 9, cs: 4, r0: 5, rs: 4 }, { role: 'legend', c0: 9, cs: 4, r0: 9, rs: 4 }] },
  { id: 'about.twoColumnBio', name: 'About · Two-Column Bio', category: 'Resume', suits: ['about', 'resume'], imageCount: 0,
    regions: [{ role: 'title', c0: 1, cs: 12, r0: 1, rs: 2 }, { role: 'subtitle', c0: 1, cs: 12, r0: 3, rs: 1 },
      { role: 'text', c0: 1, cs: 6, r0: 5, rs: 8 }, { role: 'meta', c0: 7, cs: 6, r0: 5, rs: 4 }, { role: 'legend', c0: 7, cs: 6, r0: 9, rs: 4 }] },
  { id: 'about.sidebarSkills', name: 'About · Skills Sidebar', category: 'Resume', suits: ['about', 'resume'], imageCount: 1,
    regions: [{ role: 'title', c0: 1, cs: 8, r0: 1, rs: 2 }, { role: 'subtitle', c0: 1, cs: 8, r0: 3, rs: 1 }, { role: 'text', c0: 1, cs: 8, r0: 5, rs: 8 },
      img(0, 9, 4, 1, 4), { role: 'legend', c0: 9, cs: 4, r0: 5, rs: 4 }, { role: 'meta', c0: 9, cs: 4, r0: 9, rs: 4 }] },
  { id: 'about.timeline', name: 'About · Experience Timeline', category: 'Resume', suits: ['about', 'resume'], imageCount: 1,
    regions: [{ role: 'title', c0: 1, cs: 5, r0: 1, rs: 2 }, { role: 'subtitle', c0: 1, cs: 5, r0: 3, rs: 1 }, img(0, 1, 5, 5, 4), { role: 'legend', c0: 1, cs: 5, r0: 9, rs: 4 },
      { role: 'text', c0: 7, cs: 6, r0: 1, rs: 12 }] },
  { id: 'about.magazine', name: 'About · Magazine', category: 'Resume', suits: ['about', 'resume'], imageCount: 1,
    regions: [img(0, 1, 6, 1, 12), { role: 'title', c0: 8, cs: 5, r0: 1, rs: 2 }, { role: 'subtitle', c0: 8, cs: 5, r0: 3, rs: 1 },
      { role: 'text', c0: 8, cs: 5, r0: 5, rs: 5 }, { role: 'legend', c0: 8, cs: 5, r0: 10, rs: 3 }] },
  { id: 'about.statementHero', name: 'About · Statement', category: 'Resume', suits: ['about', 'resume'], imageCount: 0,
    regions: [{ role: 'title', c0: 1, cs: 11, r0: 2, rs: 3 }, { role: 'text', c0: 1, cs: 9, r0: 5, rs: 5 }, { role: 'meta', c0: 1, cs: 11, r0: 11, rs: 2 }] },
  { id: 'about.centeredMinimal', name: 'About · Centered', category: 'Resume', suits: ['about', 'resume'], imageCount: 1,
    regions: [img(0, 5, 4, 1, 4), { role: 'title', c0: 2, cs: 10, r0: 5, rs: 2 }, { role: 'subtitle', c0: 2, cs: 10, r0: 7, rs: 1 }, { role: 'text', c0: 3, cs: 8, r0: 8, rs: 5 }] },
  { id: 'about.dossier', name: 'About · Dossier', category: 'Resume', suits: ['about', 'resume'], imageCount: 1,
    regions: [img(0, 1, 3, 1, 4), { role: 'title', c0: 4, cs: 9, r0: 1, rs: 2 }, { role: 'subtitle', c0: 4, cs: 9, r0: 3, rs: 1 },
      { role: 'text', c0: 1, cs: 12, r0: 6, rs: 4 }, { role: 'meta', c0: 1, cs: 6, r0: 10, rs: 3 }, { role: 'legend', c0: 7, cs: 6, r0: 10, rs: 3 }] },
  { id: 'about.cardStack', name: 'About · Card Stack', category: 'Resume', suits: ['about', 'resume'], imageCount: 0,
    regions: [{ role: 'title', c0: 1, cs: 12, r0: 1, rs: 2 }, { role: 'subtitle', c0: 1, cs: 12, r0: 3, rs: 1 },
      { role: 'text', c0: 1, cs: 4, r0: 5, rs: 8 }, { role: 'meta', c0: 5, cs: 4, r0: 5, rs: 8 }, { role: 'legend', c0: 9, cs: 4, r0: 5, rs: 8 }] },
  { id: 'about.portraitFull', name: 'About · Full Portrait', category: 'Resume', suits: ['about', 'resume'], imageCount: 1,
    regions: [img(0, 7, 6, 1, 12), { role: 'title', c0: 1, cs: 5, r0: 2, rs: 2 }, { role: 'subtitle', c0: 1, cs: 5, r0: 4, rs: 1 }, { role: 'text', c0: 1, cs: 5, r0: 6, rs: 4 }, { role: 'meta', c0: 1, cs: 5, r0: 10, rs: 3 }] },
]

/* ----------------------------- content / index spreads ------------------- */
/** Project-index / table-of-contents spreads. Roles: title=section title,
 *  text=project list, meta=numbers/years, image=preview thumbnails. */
const INDEX_SPREAD_SPECS: LayoutSpec[] = [
  { id: 'index.numberedList', name: 'Index · Numbered List', category: 'Contents', suits: ['contents', 'about', 'project'], imageCount: 0,
    regions: [{ role: 'title', c0: 1, cs: 12, r0: 1, rs: 2 }, { role: 'meta', c0: 1, cs: 2, r0: 4, rs: 9 }, { role: 'contents', c0: 3, cs: 9, r0: 4, rs: 9 }] },
  { id: 'index.thumbGrid', name: 'Index · Thumbnail Grid', category: 'Contents', suits: ['contents', 'about', 'project'], imageCount: 6,
    regions: [{ role: 'title', c0: 1, cs: 12, r0: 1, rs: 2 }, ...gridCells({ c0: 1, cs: 12, r0: 4, rs: 9 }, 2, 3).map(r => ({ ...r, role: 'contents' as const }))] },
  { id: 'index.timeline', name: 'Index · Timeline', category: 'Contents', suits: ['contents', 'about', 'project'], imageCount: 0,
    regions: [{ role: 'title', c0: 1, cs: 12, r0: 1, rs: 2 }, { role: 'meta', c0: 1, cs: 12, r0: 4, rs: 2 }, { role: 'contents', c0: 1, cs: 12, r0: 6, rs: 7 }] },
  { id: 'index.magazine', name: 'Index · Magazine', category: 'Contents', suits: ['contents', 'about', 'project'], imageCount: 1,
    regions: [{ role: 'title', c0: 1, cs: 6, r0: 1, rs: 3 }, img(0, 7, 6, 1, 6), { role: 'contents', c0: 1, cs: 6, r0: 4, rs: 9 }] },
  { id: 'index.twoColumn', name: 'Index · Two Column', category: 'Contents', suits: ['contents', 'about', 'project'], imageCount: 0,
    regions: [{ role: 'title', c0: 1, cs: 12, r0: 1, rs: 2 }, { role: 'contents', c0: 1, cs: 12, r0: 4, rs: 9 }] },
]

function buildContentsSpecs(): LayoutSpec[] {
  const styles = [
    { key: 'minimal', name: 'Minimal Index' },
    { key: 'magazine', name: 'Magazine Contents' },
    { key: 'timeline', name: 'Project Timeline' },
    { key: 'grid', name: 'Image Grid Contents' },
    { key: 'luxury', name: 'Luxury Index' },
    { key: 'research', name: 'Research Index' },
    { key: 'parametric', name: 'Parametric Contents' },
    { key: 'competition', name: 'Competition Contents' },
    { key: 'academic', name: 'Academic Thesis Contents' }
  ]

  const variations = [
    { key: 'default', name: 'Standard Layout', regions: [{ role: 'title' as const, c0: 1, cs: 12, r0: 1, rs: 2 }, { role: 'contents' as const, c0: 1, cs: 12, r0: 3, rs: 10 }] },
    { key: 'leftSidebar', name: 'Left Sidebar', regions: [{ role: 'title' as const, c0: 1, cs: 3, r0: 2, rs: 3 }, { role: 'contents' as const, c0: 5, cs: 8, r0: 2, rs: 10 }] },
    { key: 'rightSidebar', name: 'Right Sidebar', regions: [{ role: 'title' as const, c0: 10, cs: 3, r0: 2, rs: 3 }, { role: 'contents' as const, c0: 1, cs: 8, r0: 2, rs: 10 }] },
    { key: 'framed', name: 'Framed Margins', regions: [{ role: 'title' as const, c0: 2, cs: 10, r0: 2, rs: 2 }, { role: 'contents' as const, c0: 2, cs: 10, r0: 4, rs: 7 }] },
    { key: 'compact', name: 'Compact Grid', regions: [{ role: 'title' as const, c0: 1, cs: 7, r0: 1, rs: 2 }, { role: 'contents' as const, c0: 1, cs: 12, r0: 4, rs: 8 }] },
    { key: 'spread', name: 'Spread Span', regions: [{ role: 'title' as const, c0: 1, cs: 12, r0: 1, rs: 2 }, { role: 'contents' as const, c0: 1, cs: 12, r0: 3, rs: 9 }] }
  ]

  const specs: LayoutSpec[] = []
  for (const s of styles) {
    for (const v of variations) {
      specs.push({
        id: `index.${s.key}.${v.key}`,
        name: `${s.name} · ${v.name}`,
        category: 'Contents',
        suits: ['contents', 'about', 'project'],
        regions: v.regions,
        imageCount: s.key === 'magazine' ? 1 : (s.key === 'grid' ? 4 : 0)
      })
    }
  }
  return specs
}

function buildProceduralResumes(): LayoutSpec[] {
  const specs: LayoutSpec[] = []
  
  // 50 variations
  for(let i=1; i<=50; i++) {
    const regions: Region[] = []
    const type = i % 5
    const hasImage = i % 2 !== 0
    const isSpread = i % 4 === 0
    
    if (type === 0) { // Classic Top-Down
       regions.push({ role: 'title', c0: 2, cs: 10, r0: 1, rs: 2 })
       regions.push({ role: 'subtitle', c0: 2, cs: 10, r0: 3, rs: 1 })
       if (hasImage) regions.push(img(0, 1, 12, 4, 3))
       regions.push({ role: 'text', c0: 2, cs: 6, r0: hasImage ? 8 : 5, rs: 5 })
       regions.push({ role: 'meta', c0: 9, cs: 3, r0: hasImage ? 8 : 5, rs: 2 })
       regions.push({ role: 'legend', c0: 9, cs: 3, r0: hasImage ? 11 : 8, rs: 2 })
    } else if (type === 1) { // Split Left
       if (hasImage) regions.push(img(0, 1, 4, 1, isSpread ? 12 : 5))
       regions.push({ role: 'title', c0: 5, cs: 8, r0: 1, rs: 2 })
       regions.push({ role: 'subtitle', c0: 5, cs: 8, r0: 3, rs: 1 })
       regions.push({ role: 'text', c0: 5, cs: 8, r0: 5, rs: 8 })
       regions.push({ role: 'meta', c0: 1, cs: 4, r0: hasImage && !isSpread ? 7 : 1, rs: 3 })
       if (!isSpread) regions.push({ role: 'legend', c0: 1, cs: 4, r0: hasImage ? 10 : 5, rs: 3 })
    } else if (type === 2) { // Split Right
       regions.push({ role: 'title', c0: 1, cs: 8, r0: 1, rs: 2 })
       regions.push({ role: 'subtitle', c0: 1, cs: 8, r0: 3, rs: 1 })
       regions.push({ role: 'text', c0: 1, cs: 8, r0: 5, rs: 8 })
       if (hasImage) regions.push(img(0, 9, 4, 1, isSpread ? 12 : 5))
       regions.push({ role: 'meta', c0: 9, cs: 4, r0: hasImage && !isSpread ? 7 : 1, rs: 3 })
       if (!isSpread) regions.push({ role: 'legend', c0: 9, cs: 4, r0: hasImage ? 10 : 5, rs: 3 })
    } else if (type === 3) { // Masonry / Abstract
       regions.push({ role: 'title', c0: 1, cs: 6, r0: 1, rs: 3 })
       regions.push({ role: 'meta', c0: 8, cs: 5, r0: 1, rs: 3 })
       if (hasImage) regions.push(img(0, 1, 4, 5, 8))
       regions.push({ role: 'text', c0: hasImage ? 6 : 1, cs: hasImage ? 7 : 8, r0: 5, rs: 8 })
       if (!hasImage) regions.push({ role: 'legend', c0: 10, cs: 3, r0: 5, rs: 8 })
    } else { // Typographic Minimal
       regions.push({ role: 'title', c0: (i%3)+1, cs: 8, r0: 2, rs: 2 })
       regions.push({ role: 'subtitle', c0: (i%3)+1, cs: 8, r0: 4, rs: 1 })
       regions.push({ role: 'text', c0: (i%3)+3, cs: 8, r0: 6, rs: 7 })
       regions.push({ role: 'meta', c0: 1, cs: (i%3)+1, r0: 6, rs: 7 })
    }
    
    specs.push({
      id: `resume.gen${i}`,
      name: `Resume · ${isSpread ? 'Spread ' : ''}Variation ${String(i).padStart(2, '0')}`,
      category: 'Resume',
      suits: ['resume'],
      imageCount: hasImage ? 1 : 0,
      regions
    })
  }
  return specs
}

function buildProceduralContents(): LayoutSpec[] {
  const specs: LayoutSpec[] = []
  for (let i = 1; i <= 50; i++) {
    const regions: Region[] = []
    const type = i % 4
    const images = i % 3 === 0 ? 3 : i % 2 === 0 ? 1 : 0
    const isSpread = i % 4 === 0
    
    regions.push({ role: 'title', c0: 1, cs: 12, r0: 1, rs: 2 })
    
    if (type === 0) {
      regions.push({ role: 'contents', c0: 1, cs: isSpread ? 8 : 6, r0: 4, rs: 9 })
      if (images === 1) regions.push(img(0, isSpread ? 9 : 8, isSpread ? 4 : 5, 4, 9))
      else if (images === 3) {
         regions.push(img(0, 8, 5, 4, 2))
         regions.push(img(1, 8, 5, 7, 2))
         regions.push(img(2, 8, 5, 10, 2))
      }
    } else if (type === 1) {
      if (images > 0) regions.push(img(0, 1, 12, 3, 3))
      regions.push({ role: 'contents', c0: 1, cs: 12, r0: 7, rs: 6 })
    } else if (type === 2) {
      regions.push({ role: 'contents', c0: isSpread ? 2 : 1, cs: isSpread ? 10 : 12, r0: 4, rs: 9 })
    } else {
      regions.push({ role: 'contents', c0: 4, cs: 9, r0: 3, rs: 10 })
      if (images > 0) regions.push(img(0, 1, 2, 3, 10))
    }
    
    specs.push({
      id: `contents.gen${i}`,
      name: `Contents · ${isSpread ? 'Spread ' : ''}Variation ${String(i).padStart(2, '0')}`,
      category: 'Contents',
      suits: ['contents', 'about', 'project'],
      imageCount: images,
      regions
    })
  }
  return specs
}

function buildProceduralMasterSpreads(): LayoutSpec[] {
  const specs: LayoutSpec[] = []
  for (let i = 1; i <= 100; i++) {
    const regions: Region[] = []
    const type = i % 5
    const imageCount = (i % 3) + 1
    
    // Master Bleed Layouts spanning 24 columns (Left page -> Right page)
    if (type === 0) { // Full Bleed Master Image
       regions.push(img(0, 1, 24, 1, 13)) // Full cover across both pages
       regions.push({ role: 'title', c0: 2, cs: 8, r0: 10, rs: 2 })
       regions.push({ role: 'text', c0: 14, cs: 6, r0: 10, rs: 2 })
    } else if (type === 1) { // Cinematic Split
       regions.push(img(0, 1, 24, 4, 6)) // Middle cinematic band spanning both pages
       regions.push({ role: 'title', c0: 1, cs: 10, r0: 1, rs: 2 })
       regions.push({ role: 'text', c0: 1, cs: 8, r0: 10, rs: 3 })
       regions.push({ role: 'legend', c0: 15, cs: 4, r0: 10, rs: 3 })
    } else if (type === 2) { // Asymmetric Master
       regions.push(img(0, 6, 18, 1, 13)) // Bleeds from middle of left page entirely across right page
       regions.push({ role: 'title', c0: 1, cs: 4, r0: 2, rs: 4 })
       regions.push({ role: 'text', c0: 1, cs: 4, r0: 6, rs: 6 })
    } else if (type === 3) { // Floating Dual Renders
       regions.push(img(0, 3, 8, 2, 8)) // Left page
       regions.push(img(1, 14, 8, 4, 8)) // Right page (offset)
       regions.push({ role: 'title', c0: 1, cs: 24, r0: 1, rs: 1 })
       regions.push({ role: 'text', c0: 14, cs: 6, r0: 1, rs: 2 })
    } else { // Magazine Editorial Spread
       regions.push(img(0, 1, 14, 1, 13)) // Bleeds slightly past the gutter
       regions.push({ role: 'title', c0: 16, cs: 8, r0: 2, rs: 3 })
       regions.push({ role: 'subtitle', c0: 16, cs: 8, r0: 5, rs: 1 })
       regions.push({ role: 'text', c0: 16, cs: 8, r0: 7, rs: 5 })
    }
    
    specs.push({
      id: `spread.master${i}`,
      name: `Master Spread · Variation ${String(i).padStart(2, '0')}`,
      category: 'Spread',
      suits: ['project', 'about', 'cover'],
      imageCount: imageCount,
      regions
    })
  }
  return specs
}

// ─────────────────────────────────────────────────────────────────────────────
// TRUE SPREAD LAYOUTS  (isSpread:true pages — 12-col grid spans 1520px wide)
// Left page  = columns 1-6   Right page = columns 7-12
// Cross-gutter elements freely span col 1-12
// ─────────────────────────────────────────────────────────────────────────────
export const SPREAD_SPECS: LayoutSpec[] = [
  // ── PANORAMA / FULL-BLEED (1–8) ─────────────────────────────────────────
  { id: 'spread.full-bleed', name: 'Full Bleed Panorama', category: 'Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ img(0, 1, 12, 1, 12) ] },

  { id: 'spread.panorama-strip', name: 'Panorama + Caption Strip', category: 'Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ img(0, 1, 12, 1, 9), { role: 'title', c0: 1, cs: 5, r0: 10, rs: 2 }, { role: 'text', c0: 6, cs: 7, r0: 10, rs: 3 } ] },

  { id: 'spread.panorama-top-strip', name: 'Header Strip + Panorama', category: 'Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 6, r0: 1, rs: 2 }, { role: 'text', c0: 7, cs: 6, r0: 1, rs: 2 }, img(0, 1, 12, 3, 10) ] },

  { id: 'spread.panorama-mid-caption', name: 'Panorama + Mid Caption', category: 'Spread', suits: ['project'], imageCount: 1,
    regions: [ img(0, 1, 12, 1, 7), { role: 'title', c0: 3, cs: 4, r0: 8, rs: 2 }, { role: 'text', c0: 2, cs: 8, r0: 10, rs: 3 } ] },

  { id: 'spread.two-panoramas', name: 'Two Panoramas Stacked', category: 'Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 12, 1, 6), img(1, 1, 12, 7, 6) ] },

  { id: 'spread.panorama-bleed-text', name: 'Bleed Image + Text Overlay', category: 'Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ img(0, 1, 12, 1, 12), { role: 'title', c0: 2, cs: 5, r0: 9, rs: 2 }, { role: 'text', c0: 7, cs: 4, r0: 9, rs: 3 } ] },

  { id: 'spread.panorama-thirds', name: 'Image Two-Thirds + Text', category: 'Spread', suits: ['project'], imageCount: 1,
    regions: [ img(0, 1, 12, 1, 8), { role: 'title', c0: 1, cs: 4, r0: 9, rs: 2 }, { role: 'subtitle', c0: 1, cs: 4, r0: 11, rs: 1 }, { role: 'text', c0: 5, cs: 8, r0: 9, rs: 4 } ] },

  { id: 'spread.horizon', name: 'Horizon Band', category: 'Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 12, r0: 1, rs: 2 }, img(0, 1, 12, 3, 7), { role: 'text', c0: 1, cs: 6, r0: 10, rs: 3 }, { role: 'meta', c0: 7, cs: 6, r0: 10, rs: 3 } ] },

  // ── HALF + HALF (9–20) ────────────────────────────────────────────────────
  { id: 'spread.left-image-right-text', name: 'Image + Narrative', category: 'Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ img(0, 1, 6, 1, 12), { role: 'title', c0: 7, cs: 5, r0: 2, rs: 2 }, { role: 'subtitle', c0: 7, cs: 5, r0: 4, rs: 1 }, { role: 'text', c0: 7, cs: 5, r0: 5, rs: 5 }, { role: 'meta', c0: 7, cs: 5, r0: 10, rs: 2 } ] },

  { id: 'spread.right-image-left-text', name: 'Narrative + Image', category: 'Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ { role: 'title', c0: 2, cs: 5, r0: 2, rs: 2 }, { role: 'subtitle', c0: 2, cs: 5, r0: 4, rs: 1 }, { role: 'text', c0: 2, cs: 5, r0: 5, rs: 5 }, { role: 'meta', c0: 2, cs: 5, r0: 10, rs: 2 }, img(0, 7, 6, 1, 12) ] },

  { id: 'spread.two-renders', name: 'Two Renders', category: 'Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 6, 1, 12), img(1, 7, 6, 1, 12) ] },

  { id: 'spread.image-text-centered', name: 'Image + Centered Text', category: 'Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ img(0, 1, 6, 1, 12), { role: 'title', c0: 8, cs: 3, r0: 3, rs: 2 }, { role: 'text', c0: 8, cs: 3, r0: 5, rs: 6 } ] },

  { id: 'spread.left-image-right-two', name: 'Image + Stacked Pair', category: 'Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 6, 1, 12), img(1, 7, 6, 1, 6), img(2, 7, 6, 7, 6) ] },

  { id: 'spread.left-two-right-image', name: 'Stacked Pair + Image', category: 'Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 6, 1, 6), img(1, 1, 6, 7, 6), img(2, 7, 6, 1, 12) ] },

  { id: 'spread.left-text-right-two', name: 'Text + Stacked Pair', category: 'Spread', suits: ['project', 'about'], imageCount: 2,
    regions: [ { role: 'title', c0: 1, cs: 5, r0: 2, rs: 2 }, { role: 'text', c0: 1, cs: 5, r0: 4, rs: 6 }, { role: 'meta', c0: 1, cs: 5, r0: 10, rs: 2 }, img(0, 7, 6, 1, 6), img(1, 7, 6, 7, 6) ] },

  { id: 'spread.image-inset-caption', name: 'Image + Inset Caption Block', category: 'Spread', suits: ['project'], imageCount: 1,
    regions: [ img(0, 1, 6, 1, 12), { role: 'title', c0: 7, cs: 6, r0: 1, rs: 2 }, { role: 'text', c0: 7, cs: 6, r0: 3, rs: 5 }, { role: 'legend', c0: 7, cs: 6, r0: 8, rs: 4 } ] },

  { id: 'spread.half-image-half-plan', name: 'Render + Plan', category: 'Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 6, 1, 12), img(1, 7, 6, 1, 10), { role: 'meta', c0: 7, cs: 6, r0: 11, rs: 2 } ] },

  { id: 'spread.symmetrical-mirrors', name: 'Symmetrical Mirrors', category: 'Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 6, 1, 10), { role: 'title', c0: 1, cs: 6, r0: 11, rs: 2 }, img(1, 7, 6, 1, 10), { role: 'meta', c0: 7, cs: 6, r0: 11, rs: 2 } ] },

  { id: 'spread.image-text-meta-row', name: 'Image + Text + Meta Row', category: 'Spread', suits: ['project'], imageCount: 1,
    regions: [ img(0, 1, 6, 1, 12), { role: 'title', c0: 7, cs: 6, r0: 1, rs: 2 }, { role: 'text', c0: 7, cs: 6, r0: 3, rs: 7 }, { role: 'meta', c0: 7, cs: 6, r0: 10, rs: 3 } ] },

  // ── ASYMMETRIC (21–32) ───────────────────────────────────────────────────
  { id: 'spread.asymmetric-75', name: '1.5 Page Image + Half Text', category: 'Spread', suits: ['project'], imageCount: 1,
    regions: [ img(0, 1, 9, 1, 12), { role: 'title', c0: 10, cs: 3, r0: 2, rs: 2 }, { role: 'text', c0: 10, cs: 3, r0: 4, rs: 7 }, { role: 'meta', c0: 10, cs: 3, r0: 11, rs: 2 } ] },

  { id: 'spread.asymmetric-25', name: 'Half Text + 1.5 Page Image', category: 'Spread', suits: ['project'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 3, r0: 2, rs: 2 }, { role: 'text', c0: 1, cs: 3, r0: 4, rs: 7 }, { role: 'meta', c0: 1, cs: 3, r0: 11, rs: 2 }, img(0, 4, 9, 1, 12) ] },

  { id: 'spread.asymmetric-image-wide', name: 'Wide Image + Slim Column', category: 'Spread', suits: ['project'], imageCount: 1,
    regions: [ img(0, 1, 8, 1, 12), { role: 'title', c0: 9, cs: 4, r0: 3, rs: 2 }, { role: 'text', c0: 9, cs: 4, r0: 5, rs: 5 }, { role: 'meta', c0: 9, cs: 4, r0: 10, rs: 3 } ] },

  { id: 'spread.asymmetric-slim-wide', name: 'Slim Column + Wide Image', category: 'Spread', suits: ['project'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 4, r0: 3, rs: 2 }, { role: 'text', c0: 1, cs: 4, r0: 5, rs: 5 }, { role: 'meta', c0: 1, cs: 4, r0: 10, rs: 3 }, img(0, 5, 8, 1, 12) ] },

  { id: 'spread.asymmetric-image-third', name: 'Two-Thirds Image + Third Text', category: 'Spread', suits: ['project'], imageCount: 1,
    regions: [ img(0, 1, 8, 1, 12), { role: 'title', c0: 9, cs: 4, r0: 1, rs: 2 }, { role: 'subtitle', c0: 9, cs: 4, r0: 3, rs: 1 }, { role: 'text', c0: 9, cs: 4, r0: 4, rs: 6 }, { role: 'legend', c0: 9, cs: 4, r0: 10, rs: 3 } ] },

  { id: 'spread.offset-left', name: 'Offset Image Left', category: 'Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 7, 1, 10), { role: 'title', c0: 8, cs: 5, r0: 1, rs: 2 }, { role: 'text', c0: 8, cs: 5, r0: 3, rs: 5 }, img(1, 8, 5, 8, 5) ] },

  { id: 'spread.offset-right', name: 'Offset Image Right', category: 'Spread', suits: ['project'], imageCount: 2,
    regions: [ { role: 'title', c0: 1, cs: 5, r0: 1, rs: 2 }, { role: 'text', c0: 1, cs: 5, r0: 3, rs: 5 }, img(0, 1, 5, 8, 5), img(1, 6, 7, 1, 10) ] },

  { id: 'spread.golden-ratio', name: 'Golden Ratio Split', category: 'Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ img(0, 1, 7, 1, 12), { role: 'title', c0: 9, cs: 4, r0: 2, rs: 2 }, { role: 'text', c0: 9, cs: 4, r0: 4, rs: 6 }, { role: 'meta', c0: 8, cs: 5, r0: 10, rs: 3 } ] },

  { id: 'spread.golden-ratio-flip', name: 'Golden Ratio Flip', category: 'Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 4, r0: 2, rs: 2 }, { role: 'text', c0: 1, cs: 4, r0: 4, rs: 6 }, { role: 'meta', c0: 1, cs: 5, r0: 10, rs: 3 }, img(0, 6, 7, 1, 12) ] },

  { id: 'spread.bleed-plus-quarter', name: 'Bleed + Quarter Column', category: 'Spread', suits: ['project'], imageCount: 1,
    regions: [ img(0, 1, 9, 1, 12), { role: 'title', c0: 10, cs: 3, r0: 1, rs: 2 }, { role: 'subtitle', c0: 10, cs: 3, r0: 3, rs: 1 }, { role: 'text', c0: 10, cs: 3, r0: 4, rs: 5 }, { role: 'legend', c0: 10, cs: 3, r0: 9, rs: 4 } ] },

  { id: 'spread.quarter-plus-bleed', name: 'Quarter Column + Bleed', category: 'Spread', suits: ['project'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 3, r0: 1, rs: 2 }, { role: 'subtitle', c0: 1, cs: 3, r0: 3, rs: 1 }, { role: 'text', c0: 1, cs: 3, r0: 4, rs: 5 }, { role: 'legend', c0: 1, cs: 3, r0: 9, rs: 4 }, img(0, 4, 9, 1, 12) ] },

  { id: 'spread.asymmetric-mid-divide', name: 'Asymmetric Mid-Divide', category: 'Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 5, 1, 12), { role: 'title', c0: 6, cs: 4, r0: 2, rs: 2 }, { role: 'text', c0: 6, cs: 4, r0: 4, rs: 5 }, img(1, 10, 3, 1, 8), { role: 'meta', c0: 6, cs: 7, r0: 10, rs: 3 } ] },

  // ── GRIDS (33–44) ────────────────────────────────────────────────────────
  { id: 'spread.four-grid', name: '2×2 Grid', category: 'Spread', suits: ['project'], imageCount: 4,
    regions: [ img(0, 1, 6, 1, 6), img(1, 7, 6, 1, 6), img(2, 1, 6, 7, 6), img(3, 7, 6, 7, 6) ] },

  { id: 'spread.six-grid', name: '3×2 Grid', category: 'Spread', suits: ['project'], imageCount: 6,
    regions: [ img(0, 1, 4, 1, 6), img(1, 5, 4, 1, 6), img(2, 9, 4, 1, 6), img(3, 1, 4, 7, 6), img(4, 5, 4, 7, 6), img(5, 9, 4, 7, 6) ] },

  { id: 'spread.eight-grid', name: '4×2 Grid', category: 'Spread', suits: ['project'], imageCount: 8,
    regions: [ img(0, 1, 3, 1, 6), img(1, 4, 3, 1, 6), img(2, 7, 3, 1, 6), img(3, 10, 3, 1, 6), img(4, 1, 3, 7, 6), img(5, 4, 3, 7, 6), img(6, 7, 3, 7, 6), img(7, 10, 3, 7, 6) ] },

  { id: 'spread.three-row', name: '3-Row Strip', category: 'Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 12, 1, 4), img(1, 1, 12, 5, 4), img(2, 1, 12, 9, 4) ] },

  { id: 'spread.grid-title', name: '2×2 Grid + Title Block', category: 'Spread', suits: ['project'], imageCount: 4,
    regions: [ img(0, 1, 6, 1, 5), img(1, 7, 6, 1, 5), img(2, 1, 6, 6, 5), img(3, 7, 6, 6, 5), { role: 'title', c0: 1, cs: 6, r0: 11, rs: 2 }, { role: 'text', c0: 7, cs: 6, r0: 11, rs: 2 } ] },

  { id: 'spread.mosaic-five', name: 'Mosaic Five', category: 'Spread', suits: ['project'], imageCount: 5,
    regions: [ img(0, 1, 7, 1, 7), img(1, 8, 5, 1, 4), img(2, 8, 5, 5, 3), img(3, 1, 4, 8, 5), img(4, 5, 8, 8, 5) ] },

  { id: 'spread.mosaic-seven', name: 'Mosaic Seven', category: 'Spread', suits: ['project'], imageCount: 7,
    regions: [ img(0, 1, 5, 1, 6), img(1, 6, 4, 1, 4), img(2, 10, 3, 1, 3), img(3, 6, 4, 5, 3), img(4, 10, 3, 4, 3), img(5, 1, 6, 7, 6), img(6, 7, 6, 7, 6) ] },

  { id: 'spread.contact-sheet', name: 'Contact Sheet 9', category: 'Spread', suits: ['project'], imageCount: 9,
    regions: [ img(0, 1, 4, 1, 4), img(1, 5, 4, 1, 4), img(2, 9, 4, 1, 4), img(3, 1, 4, 5, 4), img(4, 5, 4, 5, 4), img(5, 9, 4, 5, 4), img(6, 1, 4, 9, 4), img(7, 5, 4, 9, 4), img(8, 9, 4, 9, 4) ] },

  { id: 'spread.grid-caption-row', name: 'Grid + Caption Row', category: 'Spread', suits: ['project'], imageCount: 4,
    regions: [ img(0, 1, 6, 1, 5), img(1, 7, 6, 1, 5), img(2, 1, 6, 6, 5), img(3, 7, 6, 6, 5), { role: 'legend', c0: 1, cs: 12, r0: 11, rs: 2 } ] },

  { id: 'spread.two-col-with-text', name: '2-Col Images + Text Column', category: 'Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 4, 1, 12), img(1, 5, 4, 1, 12), { role: 'title', c0: 9, cs: 4, r0: 1, rs: 2 }, { role: 'text', c0: 9, cs: 4, r0: 3, rs: 7 }, { role: 'meta', c0: 9, cs: 4, r0: 10, rs: 3 } ] },

  { id: 'spread.three-col-equal', name: 'Three Equal Columns', category: 'Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 4, 1, 12), img(1, 5, 4, 1, 12), img(2, 9, 4, 1, 12) ] },

  { id: 'spread.four-col-equal', name: 'Four Equal Columns', category: 'Spread', suits: ['project'], imageCount: 4,
    regions: [ img(0, 1, 3, 1, 12), img(1, 4, 3, 1, 12), img(2, 7, 3, 1, 12), img(3, 10, 3, 1, 12) ] },

  // ── TRIPTYCH / TRIO (45–52) ───────────────────────────────────────────────
  { id: 'spread.triptych', name: 'Triptych', category: 'Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 4, 1, 12), img(1, 5, 4, 1, 12), img(2, 9, 4, 1, 12) ] },

  { id: 'spread.triptych-caption', name: 'Triptych + Captions', category: 'Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 4, 1, 10), img(1, 5, 4, 1, 10), img(2, 9, 4, 1, 10), { role: 'title', c0: 1, cs: 4, r0: 11, rs: 2 }, { role: 'text', c0: 5, cs: 4, r0: 11, rs: 2 }, { role: 'meta', c0: 9, cs: 4, r0: 11, rs: 2 } ] },

  { id: 'spread.triptych-top-header', name: 'Header + Triptych', category: 'Spread', suits: ['project', 'about'], imageCount: 3,
    regions: [ { role: 'title', c0: 1, cs: 6, r0: 1, rs: 2 }, { role: 'text', c0: 7, cs: 6, r0: 1, rs: 2 }, img(0, 1, 4, 3, 10), img(1, 5, 4, 3, 10), img(2, 9, 4, 3, 10) ] },

  { id: 'spread.triptych-unequal', name: 'Triptych Unequal', category: 'Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 6, 1, 12), img(1, 7, 3, 1, 12), img(2, 10, 3, 1, 12) ] },

  { id: 'spread.duo-strip-caption', name: 'Duo + Caption Strip', category: 'Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 6, 1, 9), img(1, 7, 6, 1, 9), { role: 'title', c0: 1, cs: 4, r0: 10, rs: 3 }, { role: 'text', c0: 5, cs: 8, r0: 10, rs: 3 } ] },

  { id: 'spread.hero-duo', name: 'Hero + Duo Below', category: 'Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 12, 1, 7), img(1, 1, 6, 8, 5), img(2, 7, 6, 8, 5) ] },

  { id: 'spread.duo-hero-text', name: 'Duo Above + Hero Text', category: 'Spread', suits: ['project', 'about'], imageCount: 2,
    regions: [ img(0, 1, 6, 1, 5), img(1, 7, 6, 1, 5), { role: 'title', c0: 1, cs: 6, r0: 6, rs: 2 }, { role: 'text', c0: 7, cs: 6, r0: 6, rs: 4 }, { role: 'meta', c0: 1, cs: 12, r0: 10, rs: 3 } ] },

  { id: 'spread.large-plus-pair', name: 'Large + Pair', category: 'Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 7, 1, 12), img(1, 8, 5, 1, 6), img(2, 8, 5, 7, 6) ] },

  // ── MAGAZINE / EDITORIAL (53–65) ──────────────────────────────────────────
  { id: 'spread.magazine', name: 'Magazine Feature', category: 'Spread', suits: ['project', 'about'], imageCount: 3,
    regions: [ img(0, 1, 7, 1, 12), img(1, 8, 5, 1, 6), img(2, 8, 5, 7, 4), { role: 'title', c0: 8, cs: 5, r0: 11, rs: 2 } ] },

  { id: 'spread.magazine-text-dominant', name: 'Magazine Text Dominant', category: 'Spread', suits: ['project', 'about'], imageCount: 2,
    regions: [ img(0, 1, 6, 1, 7), { role: 'title', c0: 1, cs: 6, r0: 8, rs: 2 }, { role: 'text', c0: 1, cs: 6, r0: 10, rs: 3 }, img(1, 7, 6, 1, 12) ] },

  { id: 'spread.editorial-pull-quote', name: 'Editorial Pull Quote', category: 'Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ img(0, 1, 6, 1, 12), { role: 'subtitle', c0: 7, cs: 6, r0: 2, rs: 3 }, { role: 'text', c0: 7, cs: 6, r0: 5, rs: 5 }, { role: 'meta', c0: 7, cs: 6, r0: 10, rs: 3 } ] },

  { id: 'spread.editorial-five-col', name: 'Editorial 5-Column', category: 'Spread', suits: ['about'], imageCount: 1,
    regions: [ img(0, 1, 4, 1, 8), { role: 'title', c0: 5, cs: 3, r0: 1, rs: 2 }, { role: 'text', c0: 5, cs: 3, r0: 3, rs: 6 }, { role: 'text', c0: 8, cs: 5, r0: 1, rs: 8 }, { role: 'meta', c0: 1, cs: 12, r0: 9, rs: 4 } ] },

  { id: 'spread.bold-opener', name: 'Bold Opener', category: 'Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 12, r0: 1, rs: 3 }, img(0, 1, 12, 4, 7), { role: 'text', c0: 3, cs: 8, r0: 11, rs: 2 } ] },

  { id: 'spread.cover-spread', name: 'Cover Spread', category: 'Spread', suits: ['cover', 'project'], imageCount: 1,
    regions: [ img(0, 1, 12, 1, 9), { role: 'title', c0: 2, cs: 8, r0: 10, rs: 2 }, { role: 'subtitle', c0: 2, cs: 8, r0: 12, rs: 1 } ] },

  { id: 'spread.story-arc', name: 'Story Arc', category: 'Spread', suits: ['project', 'about'], imageCount: 2,
    regions: [ { role: 'title', c0: 1, cs: 5, r0: 1, rs: 2 }, img(0, 1, 5, 3, 6), { role: 'text', c0: 1, cs: 5, r0: 9, rs: 4 }, img(1, 6, 7, 1, 12) ] },

  { id: 'spread.double-story', name: 'Double Story', category: 'Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 6, 1, 8), { role: 'title', c0: 1, cs: 6, r0: 9, rs: 2 }, { role: 'text', c0: 1, cs: 6, r0: 11, rs: 2 }, img(1, 7, 6, 3, 8), { role: 'subtitle', c0: 7, cs: 6, r0: 11, rs: 2 } ] },

  { id: 'spread.folio-left', name: 'Folio Left', category: 'Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 3, r0: 1, rs: 3 }, { role: 'meta', c0: 1, cs: 3, r0: 4, rs: 2 }, img(0, 4, 9, 1, 12) ] },

  { id: 'spread.folio-right', name: 'Folio Right', category: 'Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ img(0, 1, 9, 1, 12), { role: 'title', c0: 10, cs: 3, r0: 1, rs: 3 }, { role: 'meta', c0: 10, cs: 3, r0: 4, rs: 2 } ] },

  { id: 'spread.exhibition', name: 'Exhibition Style', category: 'Spread', suits: ['project'], imageCount: 3,
    regions: [ { role: 'title', c0: 1, cs: 12, r0: 1, rs: 1 }, img(0, 1, 5, 2, 9), img(1, 6, 4, 2, 9), img(2, 10, 3, 2, 9), { role: 'legend', c0: 1, cs: 12, r0: 11, rs: 2 } ] },

  { id: 'spread.editorial-band', name: 'Editorial Band', category: 'Spread', suits: ['project', 'about'], imageCount: 2,
    regions: [ img(0, 1, 6, 1, 8), { role: 'title', c0: 7, cs: 6, r0: 1, rs: 2 }, { role: 'text', c0: 7, cs: 6, r0: 3, rs: 6 }, img(1, 7, 6, 9, 4) ] },

  // ── ACADEMIC / TECHNICAL (66–76) ─────────────────────────────────────────
  { id: 'spread.academic', name: 'Academic / Thesis', category: 'Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 5, r0: 1, rs: 2 }, { role: 'subtitle', c0: 1, cs: 5, r0: 3, rs: 1 }, { role: 'text', c0: 7, cs: 6, r0: 1, rs: 4 }, img(0, 1, 12, 5, 8) ] },

  { id: 'spread.plan-sections', name: 'Plan + Stacked Sections', category: 'Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 7, 1, 10), img(1, 8, 5, 1, 5), img(2, 8, 5, 6, 5), { role: 'legend', c0: 1, cs: 3, r0: 11, rs: 2 }, { role: 'meta', c0: 4, cs: 4, r0: 11, rs: 2 } ] },

  { id: 'spread.plan-elevations', name: 'Plan + Three Elevations', category: 'Spread', suits: ['project'], imageCount: 4,
    regions: [ img(0, 1, 7, 1, 8), { role: 'legend', c0: 1, cs: 7, r0: 9, rs: 4 }, img(1, 8, 5, 1, 4), img(2, 8, 5, 5, 4), img(3, 8, 5, 9, 4) ] },

  { id: 'spread.axo-and-plans', name: 'Axonometric + Plans', category: 'Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 6, 1, 8), { role: 'meta', c0: 1, cs: 6, r0: 9, rs: 4 }, img(1, 7, 6, 1, 6), img(2, 7, 6, 7, 6) ] },

  { id: 'spread.section-detail', name: 'Section + Detail', category: 'Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 8, 1, 12), { role: 'legend', c0: 1, cs: 8, r0: 11, rs: 2 }, img(1, 9, 4, 1, 8), { role: 'meta', c0: 9, cs: 4, r0: 9, rs: 4 } ] },

  { id: 'spread.site-plan-context', name: 'Site Plan + Context', category: 'Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 8, 1, 10), { role: 'title', c0: 1, cs: 8, r0: 11, rs: 2 }, img(1, 9, 4, 1, 6), { role: 'text', c0: 9, cs: 4, r0: 7, rs: 6 } ] },

  { id: 'spread.diagram-grid', name: 'Diagram Grid', category: 'Spread', suits: ['project'], imageCount: 6,
    regions: [ img(0, 1, 4, 1, 6), img(1, 5, 4, 1, 6), img(2, 9, 4, 1, 6), img(3, 1, 4, 7, 6), img(4, 5, 4, 7, 6), img(5, 9, 4, 7, 6) ] },

  { id: 'spread.process-timeline', name: 'Process Timeline', category: 'Spread', suits: ['project', 'about'], imageCount: 4,
    regions: [ img(0, 1, 3, 1, 9), img(1, 4, 3, 1, 9), img(2, 7, 3, 1, 9), img(3, 10, 3, 1, 9), { role: 'title', c0: 1, cs: 12, r0: 10, rs: 1 }, { role: 'text', c0: 1, cs: 12, r0: 11, rs: 2 } ] },

  { id: 'spread.construction-notes', name: 'Construction Notes', category: 'Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 7, 1, 10), { role: 'legend', c0: 1, cs: 7, r0: 11, rs: 2 }, { role: 'title', c0: 8, cs: 5, r0: 1, rs: 2 }, { role: 'text', c0: 8, cs: 5, r0: 3, rs: 5 }, img(1, 8, 5, 8, 5) ] },

  { id: 'spread.technical-drawing', name: 'Technical Drawing', category: 'Spread', suits: ['project'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 12, r0: 1, rs: 1 }, img(0, 1, 12, 2, 9), { role: 'meta', c0: 1, cs: 6, r0: 11, rs: 2 }, { role: 'legend', c0: 7, cs: 6, r0: 11, rs: 2 } ] },

  { id: 'spread.model-photo', name: 'Model Photograph', category: 'Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 8, 1, 12), { role: 'title', c0: 9, cs: 4, r0: 1, rs: 2 }, { role: 'text', c0: 9, cs: 4, r0: 3, rs: 5 }, img(1, 9, 4, 8, 5) ] },

  // ── SPECIAL / CINEMATIC (77–100) ──────────────────────────────────────────
  { id: 'spread.cinematic-wide', name: 'Cinematic Widescreen', category: 'Spread', suits: ['project'], imageCount: 1,
    regions: [ img(0, 1, 12, 3, 7), { role: 'title', c0: 1, cs: 12, r0: 10, rs: 2 }, { role: 'text', c0: 1, cs: 12, r0: 12, rs: 1 } ] },

  { id: 'spread.hero-caption-bottom', name: 'Hero + Bottom Caption', category: 'Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ img(0, 1, 12, 1, 10), { role: 'title', c0: 1, cs: 4, r0: 11, rs: 2 }, { role: 'text', c0: 5, cs: 8, r0: 11, rs: 2 } ] },

  { id: 'spread.hero-caption-top', name: 'Caption + Hero', category: 'Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 4, r0: 1, rs: 2 }, { role: 'text', c0: 5, cs: 8, r0: 1, rs: 2 }, img(0, 1, 12, 3, 10) ] },

  { id: 'spread.diagonal-split', name: 'Diagonal Split', category: 'Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 7, 1, 7), img(1, 6, 7, 6, 7), { role: 'title', c0: 1, cs: 5, r0: 8, rs: 2 }, { role: 'meta', c0: 8, cs: 5, r0: 8, rs: 2 } ] },

  { id: 'spread.mondrian', name: 'Mondrian', category: 'Spread', suits: ['project'], imageCount: 5,
    regions: [ img(0, 1, 5, 1, 7), img(1, 6, 3, 1, 4), img(2, 9, 4, 1, 4), img(3, 6, 7, 5, 5), img(4, 1, 5, 8, 5) ] },

  { id: 'spread.mondrian-b', name: 'Mondrian B', category: 'Spread', suits: ['project'], imageCount: 6,
    regions: [ img(0, 1, 4, 1, 6), img(1, 5, 4, 1, 4), img(2, 9, 4, 1, 5), img(3, 1, 6, 7, 6), img(4, 7, 3, 7, 6), img(5, 10, 3, 7, 6) ] },

  { id: 'spread.spine-title', name: 'Spine Title', category: 'Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ img(0, 1, 5, 1, 12), { role: 'title', c0: 6, cs: 2, r0: 1, rs: 12 }, { role: 'text', c0: 8, cs: 5, r0: 2, rs: 8 }, { role: 'meta', c0: 8, cs: 5, r0: 10, rs: 3 } ] },

  { id: 'spread.floating-image', name: 'Floating Image', category: 'Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 5, r0: 1, rs: 2 }, { role: 'subtitle', c0: 1, cs: 5, r0: 3, rs: 1 }, img(0, 2, 9, 3, 8), { role: 'meta', c0: 1, cs: 12, r0: 11, rs: 2 } ] },

  { id: 'spread.diptych-text', name: 'Diptych + Text', category: 'Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 5, 1, 10), img(1, 6, 5, 1, 10), { role: 'title', c0: 11, cs: 2, r0: 1, rs: 3 }, { role: 'text', c0: 11, cs: 2, r0: 4, rs: 7 }, { role: 'meta', c0: 1, cs: 12, r0: 11, rs: 2 } ] },

  { id: 'spread.night-sky', name: 'Night Sky (Dark Bleed)', category: 'Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 6, 1, 10), { role: 'title', c0: 1, cs: 6, r0: 11, rs: 2 }, img(1, 7, 6, 3, 8), { role: 'meta', c0: 7, cs: 6, r0: 11, rs: 2 } ] },

  { id: 'spread.large-small-bottom', name: 'Large + Two Small Bottom', category: 'Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 12, 1, 8), img(1, 1, 6, 9, 4), img(2, 7, 6, 9, 4) ] },

  { id: 'spread.large-small-top', name: 'Two Small Top + Large', category: 'Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 6, 1, 4), img(1, 7, 6, 1, 4), img(2, 1, 12, 5, 8) ] },

  { id: 'spread.one-third-hero', name: 'Third + Full Hero', category: 'Spread', suits: ['project'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 4, r0: 1, rs: 3 }, { role: 'text', c0: 1, cs: 4, r0: 4, rs: 5 }, { role: 'meta', c0: 1, cs: 4, r0: 9, rs: 4 }, img(0, 5, 8, 1, 12) ] },

  { id: 'spread.diagonal-trio', name: 'Diagonal Trio', category: 'Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 5, 1, 5), img(1, 4, 5, 4, 5), img(2, 8, 5, 7, 6), { role: 'title', c0: 1, cs: 3, r0: 6, rs: 2 }, { role: 'meta', c0: 10, cs: 3, r0: 1, rs: 3 } ] },

  { id: 'spread.manifesto', name: 'Manifesto', category: 'Spread', suits: ['about'], imageCount: 0,
    regions: [ { role: 'title', c0: 2, cs: 10, r0: 2, rs: 3 }, { role: 'subtitle', c0: 2, cs: 10, r0: 5, rs: 2 }, { role: 'text', c0: 2, cs: 5, r0: 7, rs: 5 }, { role: 'text', c0: 7, cs: 5, r0: 7, rs: 5 } ] },

  { id: 'spread.portrait-landscape', name: 'Portrait + Landscape', category: 'Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 4, 1, 12), img(1, 5, 8, 3, 7), { role: 'title', c0: 5, cs: 8, r0: 1, rs: 2 }, { role: 'meta', c0: 5, cs: 8, r0: 10, rs: 3 } ] },

  { id: 'spread.collage-left', name: 'Collage Left + Text', category: 'Spread', suits: ['project'], imageCount: 4,
    regions: [ img(0, 1, 4, 1, 6), img(1, 1, 4, 7, 6), img(2, 5, 3, 1, 6), img(3, 5, 3, 7, 6), { role: 'title', c0: 8, cs: 5, r0: 2, rs: 2 }, { role: 'text', c0: 8, cs: 5, r0: 4, rs: 6 }, { role: 'meta', c0: 8, cs: 5, r0: 10, rs: 3 } ] },

  { id: 'spread.collage-right', name: 'Text + Collage Right', category: 'Spread', suits: ['project'], imageCount: 4,
    regions: [ { role: 'title', c0: 1, cs: 5, r0: 2, rs: 2 }, { role: 'text', c0: 1, cs: 5, r0: 4, rs: 6 }, { role: 'meta', c0: 1, cs: 5, r0: 10, rs: 3 }, img(0, 6, 4, 1, 6), img(1, 6, 4, 7, 6), img(2, 10, 3, 1, 6), img(3, 10, 3, 7, 6) ] },

  { id: 'spread.caption-between', name: 'Image Caption Image', category: 'Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 5, 1, 12), { role: 'title', c0: 6, cs: 2, r0: 3, rs: 2 }, { role: 'text', c0: 6, cs: 2, r0: 5, rs: 5 }, img(1, 8, 5, 1, 12) ] },

  { id: 'spread.grand-plan', name: 'Grand Plan', category: 'Spread', suits: ['project'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 12, r0: 1, rs: 1 }, img(0, 1, 12, 2, 10), { role: 'legend', c0: 1, cs: 6, r0: 12, rs: 1 }, { role: 'meta', c0: 7, cs: 6, r0: 12, rs: 1 } ] },

  { id: 'spread.hero-inset', name: 'Hero + Inset Detail', category: 'Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 12, 1, 10), { role: 'title', c0: 1, cs: 4, r0: 11, rs: 2 }, img(1, 5, 4, 9, 4), { role: 'meta', c0: 9, cs: 4, r0: 11, rs: 2 } ] },

  { id: 'spread.zigzag', name: 'Zigzag Alternating', category: 'Spread', suits: ['project'], imageCount: 4,
    regions: [ img(0, 1, 7, 1, 3), img(1, 8, 5, 1, 3), img(2, 1, 5, 4, 3), img(3, 6, 7, 4, 3), { role: 'title', c0: 1, cs: 6, r0: 7, rs: 2 }, { role: 'text', c0: 7, cs: 6, r0: 7, rs: 4 }, { role: 'meta', c0: 1, cs: 12, r0: 11, rs: 2 } ] },

  { id: 'spread.data-rich', name: 'Data Rich', category: 'Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ img(0, 1, 6, 1, 8), { role: 'legend', c0: 1, cs: 6, r0: 9, rs: 4 }, { role: 'title', c0: 7, cs: 6, r0: 1, rs: 2 }, { role: 'meta', c0: 7, cs: 6, r0: 3, rs: 3 }, { role: 'text', c0: 7, cs: 6, r0: 6, rs: 7 } ] },

  { id: 'spread.concept-render', name: 'Concept + Render', category: 'Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 6, 1, 7), { role: 'title', c0: 1, cs: 6, r0: 8, rs: 2 }, { role: 'text', c0: 1, cs: 6, r0: 10, rs: 3 }, img(1, 7, 6, 1, 12) ] },

  { id: 'spread.narrative-sequence', name: 'Narrative Sequence', category: 'Spread', suits: ['project', 'about'], imageCount: 3,
    regions: [ img(0, 1, 4, 2, 9), img(1, 5, 4, 2, 9), img(2, 9, 4, 2, 9), { role: 'title', c0: 1, cs: 12, r0: 11, rs: 2 } ] },

  { id: 'spread.five-strip', name: 'Five Image Strip', category: 'Spread', suits: ['project'], imageCount: 5,
    regions: [ img(0, 1, 12, 1, 2), img(1, 1, 12, 3, 2), img(2, 1, 12, 5, 3), img(3, 1, 12, 8, 2), img(4, 1, 12, 10, 3) ] },
]

// shorthand for resume regions
const rv = (role: RegionRole, c0: number, cs: number, r0: number, rs: number): Region => ({ role, c0, cs, r0, rs })

export const RESUME_SPREAD_SPECS: LayoutSpec[] = [
  // ── 2-PAGE RESUME SPREADS ────────────────────────────────────────────────
  {
    id: 'resume.spread-classic',
    name: 'Classic CV Spread',
    category: 'Spread',
    suits: ['resume'],
    imageCount: 1,
    regions: [
      // LEFT PAGE — headshot + identity
      img(0, 1, 5, 1, 5),                          // headshot top-left
      rv('title',       1, 5, 6, 2),               // name
      rv('bio',         1, 5, 8, 4),               // about / bio paragraph
      rv('meta',        1, 5, 12, 1),              // contact row
      // RIGHT PAGE — content
      rv('education',   7, 6, 1, 4),
      rv('skills',      7, 3, 5, 4),
      rv('software',    10, 3, 5, 4),
      rv('achievement', 7, 6, 9, 2),
      rv('interest',    7, 6, 11, 2),
    ],
  },
  {
    id: 'resume.spread-editorial',
    name: 'Editorial CV Spread',
    category: 'Spread',
    suits: ['resume'],
    imageCount: 1,
    regions: [
      // LEFT PAGE — dark sidebar + headshot
      img(0, 1, 4, 1, 12),                         // full-height headshot
      rv('title',       5, 2, 2, 2),
      rv('bio',         5, 2, 4, 4),
      rv('meta',        5, 2, 8, 4),
      rv('interest',    5, 2, 12, 1),
      // RIGHT PAGE
      rv('education',   7, 6, 1, 3),
      rv('skills',      7, 3, 4, 4),
      rv('software',    10, 3, 4, 4),
      rv('achievement', 7, 6, 8, 4),
    ],
  },
  {
    id: 'resume.spread-minimal',
    name: 'Minimal CV Spread',
    category: 'Spread',
    suits: ['resume'],
    imageCount: 1,
    regions: [
      // LEFT PAGE — pure typography
      rv('title',       1, 6, 1, 3),
      rv('subtitle',    1, 6, 4, 1),
      rv('bio',         1, 6, 5, 5),
      rv('meta',        1, 6, 10, 3),
      // RIGHT PAGE
      rv('education',   7, 6, 1, 4),
      rv('skills',      7, 3, 5, 3),
      rv('software',    10, 3, 5, 3),
      rv('achievement', 7, 6, 8, 2),
      rv('interest',    7, 6, 10, 3),
    ],
  },
  {
    id: 'resume.spread-portrait',
    name: 'Portrait CV Spread',
    category: 'Spread',
    suits: ['resume'],
    imageCount: 1,
    regions: [
      // LEFT — headshot dominant
      img(0, 1, 6, 1, 8),
      rv('title',       1, 6, 9, 2),
      rv('meta',        1, 6, 11, 2),
      // RIGHT — all content
      rv('bio',         7, 6, 1, 2),
      rv('education',   7, 6, 3, 3),
      rv('skills',      7, 3, 6, 3),
      rv('software',    10, 3, 6, 3),
      rv('achievement', 7, 6, 9, 2),
      rv('interest',    7, 6, 11, 2),
    ],
  },
  {
    id: 'resume.spread-grid',
    name: 'Grid CV Spread',
    category: 'Spread',
    suits: ['resume'],
    imageCount: 1,
    regions: [
      img(0, 1, 3, 1, 4),
      rv('title',       4, 3, 1, 2),
      rv('subtitle',    4, 3, 3, 1),
      rv('meta',        4, 3, 4, 1),
      rv('bio',         1, 6, 5, 3),
      rv('interest',    1, 6, 8, 2),
      rv('skills',      1, 6, 10, 3),
      rv('education',   7, 6, 1, 5),
      rv('software',    7, 3, 6, 4),
      rv('achievement', 10, 3, 6, 4),
      rv('interest',    7, 6, 10, 3),
    ],
  },

  // ── 3-PAGE RESUME SPREADS (uses isSpread on two consecutive pages) ────────
  // These are single-canvas 3-page spreads at 2280px wide (3× 760px)
  // Implemented as a 2-page spread (left+right) — the 3rd page is a separate spread page
  {
    id: 'resume.spread-3page-intro',
    name: '3-Page CV · Intro', // page 1 of 3: cover-style intro
    category: 'Spread',
    suits: ['resume'],
    imageCount: 1,
    regions: [
      img(0, 1, 12, 1, 9),
      rv('title',       2, 8, 10, 2),
      rv('subtitle',    2, 8, 12, 1),
    ],
  },
  {
    id: 'resume.spread-3page-skills',
    name: '3-Page CV · Skills',
    category: 'Spread',
    suits: ['resume'],
    imageCount: 1,
    regions: [
      img(0, 1, 4, 1, 6),
      rv('bio',         1, 4, 7, 3),
      rv('meta',        1, 4, 10, 3),
      rv('education',   5, 4, 1, 6),
      rv('skills',      5, 4, 7, 6),
      rv('software',    9, 4, 1, 6),
      rv('achievement', 9, 4, 7, 3),
      rv('interest',    9, 4, 10, 3),
    ],
  },
  {
    id: 'resume.spread-3page-projects',
    name: '3-Page CV · Projects',
    category: 'Spread',
    suits: ['resume'],
    imageCount: 3,
    regions: [
      rv('title',       1, 12, 1, 1),
      img(0, 1, 4, 2, 9),
      img(1, 5, 4, 2, 9),
      img(2, 9, 4, 2, 9),
      rv('achievement', 1, 6, 11, 2),
      rv('interest',    7, 6, 11, 2),
    ],
  },
]

export const RAW_LAYOUT_CATALOG: LayoutSpec[] = [
  ...SPREAD_SPECS,
  ...RESUME_SPREAD_SPECS,
  ...COVER_SPECS,
  ...buildImageSpecs(),
  ...TEXT_SPECS,
  ...CONTACT_SPECS,
  ...RESUME_SPECS,
  ...buildProceduralResumes(),
  ...ABOUT_SPREAD_SPECS,
  ...INDEX_SPREAD_SPECS,
  ...buildContentsSpecs(),
  ...buildProceduralContents(),
  ...buildProceduralMasterSpreads(),

  {
    id: 'cosmo-special-2-cover',
    name: 'Cosmo Special 2 · Cover',
    category: 'Cover',
    suits: ['cover'],
    imageCount: 0,
    regions: [
      { role: 'title',    c0: 2, cs: 10, r0: 4, rs: 2 },
      { role: 'subtitle', c0: 2, cs: 10, r0: 7, rs: 4 },
    ],
  },
  {
    id: 'cosmo-special-2-project',
    name: 'Cosmo Special 2 · Project',
    category: 'Single',
    suits: ['project'],
    imageCount: 1,
    regions: [
      { role: 'image', c0: 1, cs: 12, r0: 1,  rs: 12, imageIndex: 0 },
      { role: 'title', c0: 1, cs:  7, r0: 9,  rs:  2 },
      { role: 'meta',  c0: 1, cs:  6, r0: 11, rs:  1 },
    ],
  },
  {
    id: 'cosmo-special-2-about',
    name: 'Cosmo Special 2 · About',
    category: 'About',
    suits: ['about'],
    imageCount: 1,
    regions: [
      { role: 'image', c0: 1, cs: 6, r0: 1, rs: 12, imageIndex: 0 },
      { role: 'title', c0: 7, cs: 5, r0: 3, rs:  2 },
      { role: 'text',  c0: 7, cs: 5, r0: 6, rs:  5 },
    ],
  },
  {
    id: 'cosmo-special-2-resume',
    name: 'Cosmo Special 2 · Resume',
    category: 'Resume',
    suits: ['resume'],
    imageCount: 0,
    regions: [
      { role: 'title', c0: 1, cs: 11, r0: 1, rs: 1 },
      { role: 'meta',  c0: 1, cs:  5, r0: 2, rs: 7 },
      { role: 'text',  c0: 6, cs:  6, r0: 2, rs: 9 },
    ],
  },
  {
    id: 'cosmo-special-2-contents',
    name: 'Cosmo Special 2 · Contents',
    category: 'Contents',
    suits: ['contents'],
    imageCount: 0,
    regions: [
      { role: 'title',    c0: 1, cs: 11, r0: 1, rs:  1 },
      { role: 'contents', c0: 1, cs: 11, r0: 3, rs:  9 },
    ],
  },
  {
    id: 'cosmo-special-3-cover',
    name: 'Cosmo Special 3 · Cover',
    category: 'Cover',
    suits: ['cover'],
    imageCount: 0,
    regions: [
      { role: 'title',    c0: 2, cs: 10, r0: 4, rs: 2 },
      { role: 'subtitle', c0: 2, cs: 10, r0: 7, rs: 4 },
    ],
  },
  {
    id: 'cosmo-special-3-project',
    name: 'Cosmo Special 3 · Project',
    category: 'Single',
    suits: ['project'],
    imageCount: 0,
    regions: [
      { role: 'title', c0: 2, cs: 10, r0: 4, rs: 2 },
      { role: 'text',  c0: 2, cs: 10, r0: 7, rs: 4 },
    ],
  },
  {
    id: 'cosmo-special-3-about',
    name: 'Cosmo Special 3 · About',
    category: 'About',
    suits: ['about'],
    imageCount: 1,
    regions: [
      { role: 'title', c0: 1, cs: 5, r0: 3, rs: 2 },
      { role: 'text',  c0: 1, cs: 5, r0: 6, rs: 5 },
      { role: 'image', c0: 7, cs: 6, r0: 1, rs: 12, imageIndex: 0 },
    ],
  },
  {
    id: 'cosmo-special-3-resume',
    name: 'Cosmo Special 3 · Resume',
    category: 'Resume',
    suits: ['resume'],
    imageCount: 0,
    regions: [
      { role: 'title', c0: 1, cs: 11, r0: 1, rs: 1 },
      { role: 'meta',  c0: 1, cs:  5, r0: 2, rs: 7 },
      { role: 'text',  c0: 6, cs:  6, r0: 2, rs: 9 },
    ],
  },
  {
    id: 'cosmo-special-3-contents',
    name: 'Cosmo Special 3 · Contents',
    category: 'Contents',
    suits: ['contents'],
    imageCount: 0,
    regions: [
      { role: 'title',    c0: 1, cs: 11, r0: 1, rs:  1 },
      { role: 'contents', c0: 1, cs: 11, r0: 3, rs:  9 },
    ],
  },
  {
    id: 'cosmo-special-4-cover',
    name: 'Cosmo Special 4 · Cover',
    category: 'Cover',
    suits: ['cover'],
    imageCount: 0,
    regions: [
      { role: 'title',    c0: 2, cs: 10, r0: 4, rs: 2 },
      { role: 'subtitle', c0: 2, cs: 10, r0: 7, rs: 4 },
    ],
  },
  {
    id: 'cosmo-special-4-project',
    name: 'Cosmo Special 4 · Project',
    category: 'Single',
    suits: ['project'],
    imageCount: 2,
    regions: [
      { role: 'image', c0: 1, cs: 12, r0: 1,  rs: 12, imageIndex: 0 },
      { role: 'title', c0: 1, cs:  7, r0: 9,  rs:  2 },
      { role: 'meta',  c0: 1, cs:  6, r0: 11, rs:  1 },
      { role: 'image', c0: 7, cs:  6, r0: 1,  rs:  6, imageIndex: 1 },
    ],
  },
  {
    id: 'cosmo-special-4-about',
    name: 'Cosmo Special 4 · About',
    category: 'About',
    suits: ['about'],
    imageCount: 1,
    regions: [
      { role: 'title', c0: 1, cs: 11, r0: 1, rs: 2 },
      { role: 'text',  c0: 1, cs: 11, r0: 3, rs: 4 },
      { role: 'image', c0: 1, cs: 12, r0: 7, rs: 6, imageIndex: 0 },
    ],
  },
  {
    id: 'cosmo-special-4-resume',
    name: 'Cosmo Special 4 · Resume',
    category: 'Resume',
    suits: ['resume'],
    imageCount: 0,
    regions: [
      { role: 'title', c0: 1, cs: 11, r0: 1, rs: 1 },
      { role: 'meta',  c0: 1, cs:  5, r0: 2, rs: 7 },
      { role: 'text',  c0: 6, cs:  6, r0: 2, rs: 9 },
    ],
  },
  {
    id: 'cosmo-special-4-contents',
    name: 'Cosmo Special 4 · Contents',
    category: 'Contents',
    suits: ['contents'],
    imageCount: 0,
    regions: [
      { role: 'title',    c0: 1, cs: 11, r0: 1, rs:  1 },
      { role: 'contents', c0: 1, cs: 11, r0: 3, rs:  9 },
    ],
  },
  {
    id: 'cosmo-special-5-cover',
    name: 'Cosmo Special 5 · Cover',
    category: 'Cover',
    suits: ['cover'],
    imageCount: 1,
    regions: [
      { role: 'title',    c0: 1, cs: 5, r0: 3, rs: 2 },
      { role: 'subtitle', c0: 1, cs: 5, r0: 6, rs: 5 },
      { role: 'image',    c0: 7, cs: 6, r0: 1, rs: 12, imageIndex: 0 },
    ],
  },
  {
    id: 'cosmo-special-5-project',
    name: 'Cosmo Special 5 · Project',
    category: 'Single',
    suits: ['project'],
    imageCount: 2,
    regions: [
      { role: 'image', c0: 1, cs: 12, r0: 1,  rs:  7, imageIndex: 0 },
      { role: 'title', c0: 1, cs:  7, r0: 8,  rs:  2 },
      { role: 'meta',  c0: 1, cs: 11, r0: 10, rs:  1 },
      { role: 'text',  c0: 1, cs: 11, r0: 11, rs:  1 },
      { role: 'image', c0: 7, cs:  6, r0: 1,  rs:  6, imageIndex: 1 },
    ],
  },
  {
    id: 'cosmo-special-5-about',
    name: 'Cosmo Special 5 · About',
    category: 'About',
    suits: ['about'],
    imageCount: 1,
    regions: [
      { role: 'title', c0: 1, cs: 5, r0: 3, rs: 2 },
      { role: 'text',  c0: 1, cs: 5, r0: 6, rs: 5 },
      { role: 'image', c0: 7, cs: 6, r0: 1, rs: 12, imageIndex: 0 },
    ],
  },
  {
    id: 'cosmo-special-5-resume',
    name: 'Cosmo Special 5 · Resume',
    category: 'Resume',
    suits: ['resume'],
    imageCount: 0,
    regions: [
      { role: 'title', c0: 1, cs: 11, r0: 1, rs: 1 },
      { role: 'meta',  c0: 1, cs:  5, r0: 2, rs: 7 },
      { role: 'text',  c0: 6, cs:  6, r0: 2, rs: 9 },
    ],
  },
  {
    id: 'cosmo-special-5-contents',
    name: 'Cosmo Special 5 · Contents',
    category: 'Contents',
    suits: ['contents'],
    imageCount: 0,
    regions: [
      { role: 'title',    c0: 1, cs: 11, r0: 1, rs:  1 },
      { role: 'contents', c0: 1, cs: 11, r0: 3, rs:  9 },
    ],
  },
]

export const LAYOUT_CATALOG: LayoutSpec[] = (() => {
  // We want exactly 10 free layouts across different categories
  const freeIds = [
    'cover.minimal', 'cover.split', 
    'single.titleTopText', 'single.titleSideLeft',
    'duoH.titleTopText', 
    'quad.titleTopText',
    'contact.center',
    'resume.swissGrid',
    'index.magazine',
    'heroStripBottom.titleTop'
  ]

  return RAW_LAYOUT_CATALOG.map(spec => ({
    ...spec,
    pro: !freeIds.includes(spec.id)
  }))
})()

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
  layout_ids?: Record<string, string>
  extracted_content?: {
    title?: string
    author?: string
    about?: string
    resume?: string
    contents?: string[]
    project_titles?: string[]
    contact?: string
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
  const ids = template.layout_ids || {}
  // Real text pulled from the source portfolio (PDF-sourced templates only).
  const ec = template.extracted_content || {}
  const projectTitles = ec.project_titles || []
  const pages: Page[] = []

  // Use explicit layout_ids when provided (e.g. Cosmo Special templates), else derive from structure hints
  const coverId = (ids.cover && SPEC_BY_ID.has(ids.cover)) ? ids.cover : pickCoverSpec(template)
  const coverHasImage = getSpec(coverId).imageCount > 0
  pages.push({
    id: uid('p'), type: 'cover', layoutId: coverId,
    blocks: [
      { ...createBlock('title'), text: ec.title || template.name || 'Portfolio' },
      { ...createBlock('subtitle'), text: ec.author || 'Architecture & Design — 2026' },
      ...(coverHasImage ? [{ ...createBlock('render'), label: 'Cover Image' }] : []),
    ],
  })

  const aboutId = (ids.about && SPEC_BY_ID.has(ids.about)) ? ids.about : 'text.statement'
  pages.push({
    id: uid('p'), type: 'about', layoutId: aboutId,
    blocks: [
      { ...createBlock('title'), text: 'About' },
      ...(ec.about ? [{ ...createBlock('description'), text: ec.about }] : [createBlock('description')]),
    ],
  })

  const projectSpec = (ids.project && SPEC_BY_ID.has(ids.project)) ? ids.project : pickProjectSpec(grid, { renders, plans, sections, diagrams })
  for (let i = 1; i <= 2; i++) {
    const realTitle = projectTitles[i - 1]
    const blocks: Block[] = [{ ...createBlock('title'), text: realTitle || `Project 0${i}` }]
    blocks.push(createBlock('meta'))
    blocks.push(createBlock('description'))
    for (let r = 0; r < Math.min(renders, 4); r++) blocks.push({ ...createBlock('render'), label: `Render — View 0${r + 1}` })
    for (let p = 0; p < Math.min(plans, 4); p++) blocks.push({ ...createBlock('plan'), label: planLabel(p) })
    for (let s = 0; s < Math.min(sections, 4); s++) blocks.push({ ...createBlock('section'), label: `Section ${String.fromCharCode(65 + s)}–${String.fromCharCode(65 + s)}` })
    for (let d = 0; d < Math.min(diagrams, 3); d++) blocks.push({ ...createBlock('diagram'), label: `Diagram 0${d + 1}` })
    if (hasLegend) blocks.push(createBlock('legend'))
    pages.push({ id: uid('p'), type: 'project', layoutId: projectSpec, blocks })
  }

  // Résumé page — only when the source had real résumé text to seed it with.
  if (ec.resume && ids.resume && SPEC_BY_ID.has(ids.resume)) {
    pages.push({
      id: uid('p'), type: 'resume', layoutId: ids.resume,
      blocks: [
        { ...createBlock('title'), text: 'Curriculum Vitae' },
        { ...createBlock('description'), text: ec.resume },
      ],
    })
  }

  pages.push({
    id: uid('p'), type: 'contact', layoutId: 'contact.center',
    blocks: [
      { ...createBlock('title'), text: 'Get in Touch' },
      { ...createBlock('description'), text: ec.contact || 'hello@yourstudio.com\n+1 (555) 123-4567\nyourstudio.com' },
    ],
  })

  return pages
}
