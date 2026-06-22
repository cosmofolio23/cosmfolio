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

export type LayoutCategory = 'Cover' | 'Single' | 'Duo' | 'Grid' | 'Hero' | 'Asymmetric' | 'Strip' | 'Text' | 'Contact' | 'Resume' | 'Contents' | 'Spread' | 'About' | 'Project Spread' | 'Content Spread' | 'About Spread'

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

export const LAYOUT_CATEGORIES: LayoutCategory[] = ['Cover', 'Single', 'Duo', 'Hero', 'Strip', 'Grid', 'Asymmetric', 'Text', 'About', 'Contact', 'Resume', 'Contents', 'Spread', 'Project Spread', 'Content Spread', 'About Spread']

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
  { id: 'about.portraitLeft', name: 'About · Portrait Left', category: 'About', suits: ['about'], imageCount: 1,
    regions: [img(0, 1, 4, 1, 7), { role: 'meta', c0: 1, cs: 4, r0: 8, rs: 5 },
      { role: 'title', c0: 6, cs: 7, r0: 1, rs: 2 }, { role: 'subtitle', c0: 6, cs: 7, r0: 3, rs: 1 }, { role: 'text', c0: 6, cs: 7, r0: 4, rs: 5 }, { role: 'legend', c0: 6, cs: 7, r0: 9, rs: 4 }] },
  { id: 'about.portraitRight', name: 'About · Portrait Right', category: 'About', suits: ['about'], imageCount: 1,
    regions: [img(0, 9, 4, 1, 7), { role: 'legend', c0: 9, cs: 4, r0: 8, rs: 5 },
      { role: 'title', c0: 1, cs: 7, r0: 1, rs: 2 }, { role: 'subtitle', c0: 1, cs: 7, r0: 3, rs: 1 }, { role: 'text', c0: 1, cs: 7, r0: 4, rs: 5 }, { role: 'meta', c0: 1, cs: 7, r0: 9, rs: 4 }] },
  { id: 'about.portraitBanner', name: 'About · Portrait Banner', category: 'About', suits: ['about'], imageCount: 1,
    regions: [img(0, 1, 12, 1, 4), { role: 'title', c0: 1, cs: 8, r0: 5, rs: 2 }, { role: 'subtitle', c0: 1, cs: 8, r0: 7, rs: 1 },
      { role: 'text', c0: 1, cs: 7, r0: 8, rs: 5 }, { role: 'meta', c0: 9, cs: 4, r0: 5, rs: 4 }, { role: 'legend', c0: 9, cs: 4, r0: 9, rs: 4 }] },
  { id: 'about.twoColumnBio', name: 'About · Two-Column Bio', category: 'About', suits: ['about'], imageCount: 0,
    regions: [{ role: 'title', c0: 1, cs: 12, r0: 1, rs: 2 }, { role: 'subtitle', c0: 1, cs: 12, r0: 3, rs: 1 },
      { role: 'text', c0: 1, cs: 6, r0: 5, rs: 8 }, { role: 'meta', c0: 7, cs: 6, r0: 5, rs: 4 }, { role: 'legend', c0: 7, cs: 6, r0: 9, rs: 4 }] },
  { id: 'about.sidebarSkills', name: 'About · Skills Sidebar', category: 'About', suits: ['about'], imageCount: 1,
    regions: [{ role: 'title', c0: 1, cs: 8, r0: 1, rs: 2 }, { role: 'subtitle', c0: 1, cs: 8, r0: 3, rs: 1 }, { role: 'text', c0: 1, cs: 8, r0: 5, rs: 8 },
      img(0, 9, 4, 1, 4), { role: 'legend', c0: 9, cs: 4, r0: 5, rs: 4 }, { role: 'meta', c0: 9, cs: 4, r0: 9, rs: 4 }] },
  { id: 'about.timeline', name: 'About · Experience Timeline', category: 'About', suits: ['about'], imageCount: 1,
    regions: [{ role: 'title', c0: 1, cs: 5, r0: 1, rs: 2 }, { role: 'subtitle', c0: 1, cs: 5, r0: 3, rs: 1 }, img(0, 1, 5, 5, 4), { role: 'legend', c0: 1, cs: 5, r0: 9, rs: 4 },
      { role: 'text', c0: 7, cs: 6, r0: 1, rs: 12 }] },
  { id: 'about.magazine', name: 'About · Magazine', category: 'About', suits: ['about'], imageCount: 1,
    regions: [img(0, 1, 6, 1, 12), { role: 'title', c0: 8, cs: 5, r0: 1, rs: 2 }, { role: 'subtitle', c0: 8, cs: 5, r0: 3, rs: 1 },
      { role: 'text', c0: 8, cs: 5, r0: 5, rs: 5 }, { role: 'legend', c0: 8, cs: 5, r0: 10, rs: 3 }] },
  { id: 'about.statementHero', name: 'About · Statement', category: 'About', suits: ['about'], imageCount: 0,
    regions: [{ role: 'title', c0: 1, cs: 11, r0: 2, rs: 3 }, { role: 'text', c0: 1, cs: 9, r0: 5, rs: 5 }, { role: 'meta', c0: 1, cs: 11, r0: 11, rs: 2 }] },
  { id: 'about.centeredMinimal', name: 'About · Centered', category: 'About', suits: ['about'], imageCount: 1,
    regions: [img(0, 5, 4, 1, 4), { role: 'title', c0: 2, cs: 10, r0: 5, rs: 2 }, { role: 'subtitle', c0: 2, cs: 10, r0: 7, rs: 1 }, { role: 'text', c0: 3, cs: 8, r0: 8, rs: 5 }] },
  { id: 'about.dossier', name: 'About · Dossier', category: 'About', suits: ['about'], imageCount: 1,
    regions: [img(0, 1, 3, 1, 4), { role: 'title', c0: 4, cs: 9, r0: 1, rs: 2 }, { role: 'subtitle', c0: 4, cs: 9, r0: 3, rs: 1 },
      { role: 'text', c0: 1, cs: 12, r0: 6, rs: 4 }, { role: 'meta', c0: 1, cs: 6, r0: 10, rs: 3 }, { role: 'legend', c0: 7, cs: 6, r0: 10, rs: 3 }] },
  { id: 'about.cardStack', name: 'About · Card Stack', category: 'About', suits: ['about'], imageCount: 0,
    regions: [{ role: 'title', c0: 1, cs: 12, r0: 1, rs: 2 }, { role: 'subtitle', c0: 1, cs: 12, r0: 3, rs: 1 },
      { role: 'text', c0: 1, cs: 4, r0: 5, rs: 8 }, { role: 'meta', c0: 5, cs: 4, r0: 5, rs: 8 }, { role: 'legend', c0: 9, cs: 4, r0: 5, rs: 8 }] },
  { id: 'about.portraitFull', name: 'About · Full Portrait', category: 'About', suits: ['about'], imageCount: 1,
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
  { id: 'spread.full-bleed', name: 'Full Bleed Panorama', category: 'Project Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ img(0, 1, 12, 1, 12) ] },

  { id: 'spread.panorama-strip', name: 'Panorama + Caption Strip', category: 'Project Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ img(0, 1, 12, 1, 9), { role: 'title', c0: 1, cs: 5, r0: 10, rs: 2 }, { role: 'text', c0: 6, cs: 7, r0: 10, rs: 3 } ] },

  { id: 'spread.panorama-top-strip', name: 'Header Strip + Panorama', category: 'Project Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 6, r0: 1, rs: 2 }, { role: 'text', c0: 7, cs: 6, r0: 1, rs: 2 }, img(0, 1, 12, 3, 10) ] },

  { id: 'spread.panorama-mid-caption', name: 'Panorama + Mid Caption', category: 'Project Spread', suits: ['project'], imageCount: 1,
    regions: [ img(0, 1, 12, 1, 7), { role: 'title', c0: 3, cs: 4, r0: 8, rs: 2 }, { role: 'text', c0: 2, cs: 8, r0: 10, rs: 3 } ] },

  { id: 'spread.two-panoramas', name: 'Two Panoramas Stacked', category: 'Project Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 12, 1, 6), img(1, 1, 12, 7, 6) ] },

  { id: 'spread.panorama-bleed-text', name: 'Bleed Image + Text Overlay', category: 'Project Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ img(0, 1, 12, 1, 12), { role: 'title', c0: 2, cs: 5, r0: 9, rs: 2 }, { role: 'text', c0: 7, cs: 4, r0: 9, rs: 3 } ] },

  { id: 'spread.panorama-thirds', name: 'Image Two-Thirds + Text', category: 'Project Spread', suits: ['project'], imageCount: 1,
    regions: [ img(0, 1, 12, 1, 8), { role: 'title', c0: 1, cs: 4, r0: 9, rs: 2 }, { role: 'subtitle', c0: 1, cs: 4, r0: 11, rs: 1 }, { role: 'text', c0: 5, cs: 8, r0: 9, rs: 4 } ] },

  { id: 'spread.horizon', name: 'Horizon Band', category: 'Project Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 12, r0: 1, rs: 2 }, img(0, 1, 12, 3, 7), { role: 'text', c0: 1, cs: 6, r0: 10, rs: 3 }, { role: 'meta', c0: 7, cs: 6, r0: 10, rs: 3 } ] },

  // ── HALF + HALF (9–20) ────────────────────────────────────────────────────
  { id: 'spread.left-image-right-text', name: 'Image + Narrative', category: 'Project Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ img(0, 1, 6, 1, 12), { role: 'title', c0: 7, cs: 5, r0: 2, rs: 2 }, { role: 'subtitle', c0: 7, cs: 5, r0: 4, rs: 1 }, { role: 'text', c0: 7, cs: 5, r0: 5, rs: 5 }, { role: 'meta', c0: 7, cs: 5, r0: 10, rs: 2 } ] },

  { id: 'spread.right-image-left-text', name: 'Narrative + Image', category: 'Project Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ { role: 'title', c0: 2, cs: 5, r0: 2, rs: 2 }, { role: 'subtitle', c0: 2, cs: 5, r0: 4, rs: 1 }, { role: 'text', c0: 2, cs: 5, r0: 5, rs: 5 }, { role: 'meta', c0: 2, cs: 5, r0: 10, rs: 2 }, img(0, 7, 6, 1, 12) ] },

  { id: 'spread.two-renders', name: 'Two Renders', category: 'Project Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 6, 1, 12), img(1, 7, 6, 1, 12) ] },

  { id: 'spread.image-text-centered', name: 'Image + Centered Text', category: 'Project Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ img(0, 1, 6, 1, 12), { role: 'title', c0: 8, cs: 3, r0: 3, rs: 2 }, { role: 'text', c0: 8, cs: 3, r0: 5, rs: 6 } ] },

  { id: 'spread.left-image-right-two', name: 'Image + Stacked Pair', category: 'Project Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 6, 1, 12), img(1, 7, 6, 1, 6), img(2, 7, 6, 7, 6) ] },

  { id: 'spread.left-two-right-image', name: 'Stacked Pair + Image', category: 'Project Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 6, 1, 6), img(1, 1, 6, 7, 6), img(2, 7, 6, 1, 12) ] },

  { id: 'spread.left-text-right-two', name: 'Text + Stacked Pair', category: 'Project Spread', suits: ['project', 'about'], imageCount: 2,
    regions: [ { role: 'title', c0: 1, cs: 5, r0: 2, rs: 2 }, { role: 'text', c0: 1, cs: 5, r0: 4, rs: 6 }, { role: 'meta', c0: 1, cs: 5, r0: 10, rs: 2 }, img(0, 7, 6, 1, 6), img(1, 7, 6, 7, 6) ] },

  { id: 'spread.image-inset-caption', name: 'Image + Inset Caption Block', category: 'Project Spread', suits: ['project'], imageCount: 1,
    regions: [ img(0, 1, 6, 1, 12), { role: 'title', c0: 7, cs: 6, r0: 1, rs: 2 }, { role: 'text', c0: 7, cs: 6, r0: 3, rs: 5 }, { role: 'legend', c0: 7, cs: 6, r0: 8, rs: 4 } ] },

  { id: 'spread.half-image-half-plan', name: 'Render + Plan', category: 'Project Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 6, 1, 12), img(1, 7, 6, 1, 10), { role: 'meta', c0: 7, cs: 6, r0: 11, rs: 2 } ] },

  { id: 'spread.symmetrical-mirrors', name: 'Symmetrical Mirrors', category: 'Project Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 6, 1, 10), { role: 'title', c0: 1, cs: 6, r0: 11, rs: 2 }, img(1, 7, 6, 1, 10), { role: 'meta', c0: 7, cs: 6, r0: 11, rs: 2 } ] },

  { id: 'spread.image-text-meta-row', name: 'Image + Text + Meta Row', category: 'Project Spread', suits: ['project'], imageCount: 1,
    regions: [ img(0, 1, 6, 1, 12), { role: 'title', c0: 7, cs: 6, r0: 1, rs: 2 }, { role: 'text', c0: 7, cs: 6, r0: 3, rs: 7 }, { role: 'meta', c0: 7, cs: 6, r0: 10, rs: 3 } ] },

  // ── ASYMMETRIC (21–32) ───────────────────────────────────────────────────
  { id: 'spread.asymmetric-75', name: '1.5 Page Image + Half Text', category: 'Project Spread', suits: ['project'], imageCount: 1,
    regions: [ img(0, 1, 9, 1, 12), { role: 'title', c0: 10, cs: 3, r0: 2, rs: 2 }, { role: 'text', c0: 10, cs: 3, r0: 4, rs: 7 }, { role: 'meta', c0: 10, cs: 3, r0: 11, rs: 2 } ] },

  { id: 'spread.asymmetric-25', name: 'Half Text + 1.5 Page Image', category: 'Project Spread', suits: ['project'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 3, r0: 2, rs: 2 }, { role: 'text', c0: 1, cs: 3, r0: 4, rs: 7 }, { role: 'meta', c0: 1, cs: 3, r0: 11, rs: 2 }, img(0, 4, 9, 1, 12) ] },

  { id: 'spread.asymmetric-image-wide', name: 'Wide Image + Slim Column', category: 'Project Spread', suits: ['project'], imageCount: 1,
    regions: [ img(0, 1, 8, 1, 12), { role: 'title', c0: 9, cs: 4, r0: 3, rs: 2 }, { role: 'text', c0: 9, cs: 4, r0: 5, rs: 5 }, { role: 'meta', c0: 9, cs: 4, r0: 10, rs: 3 } ] },

  { id: 'spread.asymmetric-slim-wide', name: 'Slim Column + Wide Image', category: 'Project Spread', suits: ['project'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 4, r0: 3, rs: 2 }, { role: 'text', c0: 1, cs: 4, r0: 5, rs: 5 }, { role: 'meta', c0: 1, cs: 4, r0: 10, rs: 3 }, img(0, 5, 8, 1, 12) ] },

  { id: 'spread.asymmetric-image-third', name: 'Two-Thirds Image + Third Text', category: 'Project Spread', suits: ['project'], imageCount: 1,
    regions: [ img(0, 1, 8, 1, 12), { role: 'title', c0: 9, cs: 4, r0: 1, rs: 2 }, { role: 'subtitle', c0: 9, cs: 4, r0: 3, rs: 1 }, { role: 'text', c0: 9, cs: 4, r0: 4, rs: 6 }, { role: 'legend', c0: 9, cs: 4, r0: 10, rs: 3 } ] },

  { id: 'spread.offset-left', name: 'Offset Image Left', category: 'Project Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 7, 1, 10), { role: 'title', c0: 8, cs: 5, r0: 1, rs: 2 }, { role: 'text', c0: 8, cs: 5, r0: 3, rs: 5 }, img(1, 8, 5, 8, 5) ] },

  { id: 'spread.offset-right', name: 'Offset Image Right', category: 'Project Spread', suits: ['project'], imageCount: 2,
    regions: [ { role: 'title', c0: 1, cs: 5, r0: 1, rs: 2 }, { role: 'text', c0: 1, cs: 5, r0: 3, rs: 5 }, img(0, 1, 5, 8, 5), img(1, 6, 7, 1, 10) ] },

  { id: 'spread.golden-ratio', name: 'Golden Ratio Split', category: 'Project Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ img(0, 1, 7, 1, 12), { role: 'title', c0: 9, cs: 4, r0: 2, rs: 2 }, { role: 'text', c0: 9, cs: 4, r0: 4, rs: 6 }, { role: 'meta', c0: 8, cs: 5, r0: 10, rs: 3 } ] },

  { id: 'spread.golden-ratio-flip', name: 'Golden Ratio Flip', category: 'Project Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 4, r0: 2, rs: 2 }, { role: 'text', c0: 1, cs: 4, r0: 4, rs: 6 }, { role: 'meta', c0: 1, cs: 5, r0: 10, rs: 3 }, img(0, 6, 7, 1, 12) ] },

  { id: 'spread.bleed-plus-quarter', name: 'Bleed + Quarter Column', category: 'Project Spread', suits: ['project'], imageCount: 1,
    regions: [ img(0, 1, 9, 1, 12), { role: 'title', c0: 10, cs: 3, r0: 1, rs: 2 }, { role: 'subtitle', c0: 10, cs: 3, r0: 3, rs: 1 }, { role: 'text', c0: 10, cs: 3, r0: 4, rs: 5 }, { role: 'legend', c0: 10, cs: 3, r0: 9, rs: 4 } ] },

  { id: 'spread.quarter-plus-bleed', name: 'Quarter Column + Bleed', category: 'Project Spread', suits: ['project'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 3, r0: 1, rs: 2 }, { role: 'subtitle', c0: 1, cs: 3, r0: 3, rs: 1 }, { role: 'text', c0: 1, cs: 3, r0: 4, rs: 5 }, { role: 'legend', c0: 1, cs: 3, r0: 9, rs: 4 }, img(0, 4, 9, 1, 12) ] },

  { id: 'spread.asymmetric-mid-divide', name: 'Asymmetric Mid-Divide', category: 'Project Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 5, 1, 12), { role: 'title', c0: 6, cs: 4, r0: 2, rs: 2 }, { role: 'text', c0: 6, cs: 4, r0: 4, rs: 5 }, img(1, 10, 3, 1, 8), { role: 'meta', c0: 6, cs: 7, r0: 10, rs: 3 } ] },

  // ── GRIDS (33–44) ────────────────────────────────────────────────────────
  { id: 'spread.four-grid', name: '2×2 Grid', category: 'Project Spread', suits: ['project'], imageCount: 4,
    regions: [ img(0, 1, 6, 1, 6), img(1, 7, 6, 1, 6), img(2, 1, 6, 7, 6), img(3, 7, 6, 7, 6) ] },

  { id: 'spread.six-grid', name: '3×2 Grid', category: 'Project Spread', suits: ['project'], imageCount: 6,
    regions: [ img(0, 1, 4, 1, 6), img(1, 5, 4, 1, 6), img(2, 9, 4, 1, 6), img(3, 1, 4, 7, 6), img(4, 5, 4, 7, 6), img(5, 9, 4, 7, 6) ] },

  { id: 'spread.eight-grid', name: '4×2 Grid', category: 'Project Spread', suits: ['project'], imageCount: 8,
    regions: [ img(0, 1, 3, 1, 6), img(1, 4, 3, 1, 6), img(2, 7, 3, 1, 6), img(3, 10, 3, 1, 6), img(4, 1, 3, 7, 6), img(5, 4, 3, 7, 6), img(6, 7, 3, 7, 6), img(7, 10, 3, 7, 6) ] },

  { id: 'spread.three-row', name: '3-Row Strip', category: 'Project Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 12, 1, 4), img(1, 1, 12, 5, 4), img(2, 1, 12, 9, 4) ] },

  { id: 'spread.grid-title', name: '2×2 Grid + Title Block', category: 'Project Spread', suits: ['project'], imageCount: 4,
    regions: [ img(0, 1, 6, 1, 5), img(1, 7, 6, 1, 5), img(2, 1, 6, 6, 5), img(3, 7, 6, 6, 5), { role: 'title', c0: 1, cs: 6, r0: 11, rs: 2 }, { role: 'text', c0: 7, cs: 6, r0: 11, rs: 2 } ] },

  { id: 'spread.mosaic-five', name: 'Mosaic Five', category: 'Project Spread', suits: ['project'], imageCount: 5,
    regions: [ img(0, 1, 7, 1, 7), img(1, 8, 5, 1, 4), img(2, 8, 5, 5, 3), img(3, 1, 4, 8, 5), img(4, 5, 8, 8, 5) ] },

  { id: 'spread.mosaic-seven', name: 'Mosaic Seven', category: 'Project Spread', suits: ['project'], imageCount: 7,
    regions: [ img(0, 1, 5, 1, 6), img(1, 6, 4, 1, 4), img(2, 10, 3, 1, 3), img(3, 6, 4, 5, 3), img(4, 10, 3, 4, 3), img(5, 1, 6, 7, 6), img(6, 7, 6, 7, 6) ] },

  { id: 'spread.contact-sheet', name: 'Contact Sheet 9', category: 'Project Spread', suits: ['project'], imageCount: 9,
    regions: [ img(0, 1, 4, 1, 4), img(1, 5, 4, 1, 4), img(2, 9, 4, 1, 4), img(3, 1, 4, 5, 4), img(4, 5, 4, 5, 4), img(5, 9, 4, 5, 4), img(6, 1, 4, 9, 4), img(7, 5, 4, 9, 4), img(8, 9, 4, 9, 4) ] },

  { id: 'spread.grid-caption-row', name: 'Grid + Caption Row', category: 'Project Spread', suits: ['project'], imageCount: 4,
    regions: [ img(0, 1, 6, 1, 5), img(1, 7, 6, 1, 5), img(2, 1, 6, 6, 5), img(3, 7, 6, 6, 5), { role: 'legend', c0: 1, cs: 12, r0: 11, rs: 2 } ] },

  { id: 'spread.two-col-with-text', name: '2-Col Images + Text Column', category: 'Project Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 4, 1, 12), img(1, 5, 4, 1, 12), { role: 'title', c0: 9, cs: 4, r0: 1, rs: 2 }, { role: 'text', c0: 9, cs: 4, r0: 3, rs: 7 }, { role: 'meta', c0: 9, cs: 4, r0: 10, rs: 3 } ] },

  { id: 'spread.three-col-equal', name: 'Three Equal Columns', category: 'Project Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 4, 1, 12), img(1, 5, 4, 1, 12), img(2, 9, 4, 1, 12) ] },

  { id: 'spread.four-col-equal', name: 'Four Equal Columns', category: 'Project Spread', suits: ['project'], imageCount: 4,
    regions: [ img(0, 1, 3, 1, 12), img(1, 4, 3, 1, 12), img(2, 7, 3, 1, 12), img(3, 10, 3, 1, 12) ] },

  // ── TRIPTYCH / TRIO (45–52) ───────────────────────────────────────────────
  { id: 'spread.triptych', name: 'Triptych', category: 'Project Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 4, 1, 12), img(1, 5, 4, 1, 12), img(2, 9, 4, 1, 12) ] },

  { id: 'spread.triptych-caption', name: 'Triptych + Captions', category: 'Project Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 4, 1, 10), img(1, 5, 4, 1, 10), img(2, 9, 4, 1, 10), { role: 'title', c0: 1, cs: 4, r0: 11, rs: 2 }, { role: 'text', c0: 5, cs: 4, r0: 11, rs: 2 }, { role: 'meta', c0: 9, cs: 4, r0: 11, rs: 2 } ] },

  { id: 'spread.triptych-top-header', name: 'Header + Triptych', category: 'Project Spread', suits: ['project', 'about'], imageCount: 3,
    regions: [ { role: 'title', c0: 1, cs: 6, r0: 1, rs: 2 }, { role: 'text', c0: 7, cs: 6, r0: 1, rs: 2 }, img(0, 1, 4, 3, 10), img(1, 5, 4, 3, 10), img(2, 9, 4, 3, 10) ] },

  { id: 'spread.triptych-unequal', name: 'Triptych Unequal', category: 'Project Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 6, 1, 12), img(1, 7, 3, 1, 12), img(2, 10, 3, 1, 12) ] },

  { id: 'spread.duo-strip-caption', name: 'Duo + Caption Strip', category: 'Project Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 6, 1, 9), img(1, 7, 6, 1, 9), { role: 'title', c0: 1, cs: 4, r0: 10, rs: 3 }, { role: 'text', c0: 5, cs: 8, r0: 10, rs: 3 } ] },

  { id: 'spread.hero-duo', name: 'Hero + Duo Below', category: 'Project Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 12, 1, 7), img(1, 1, 6, 8, 5), img(2, 7, 6, 8, 5) ] },

  { id: 'spread.duo-hero-text', name: 'Duo Above + Hero Text', category: 'Project Spread', suits: ['project', 'about'], imageCount: 2,
    regions: [ img(0, 1, 6, 1, 5), img(1, 7, 6, 1, 5), { role: 'title', c0: 1, cs: 6, r0: 6, rs: 2 }, { role: 'text', c0: 7, cs: 6, r0: 6, rs: 4 }, { role: 'meta', c0: 1, cs: 12, r0: 10, rs: 3 } ] },

  { id: 'spread.large-plus-pair', name: 'Large + Pair', category: 'Project Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 7, 1, 12), img(1, 8, 5, 1, 6), img(2, 8, 5, 7, 6) ] },

  // ── MAGAZINE / EDITORIAL (53–65) ──────────────────────────────────────────
  { id: 'spread.magazine', name: 'Magazine Feature', category: 'Project Spread', suits: ['project', 'about'], imageCount: 3,
    regions: [ img(0, 1, 7, 1, 12), img(1, 8, 5, 1, 6), img(2, 8, 5, 7, 4), { role: 'title', c0: 8, cs: 5, r0: 11, rs: 2 } ] },

  { id: 'spread.magazine-text-dominant', name: 'Magazine Text Dominant', category: 'Project Spread', suits: ['project', 'about'], imageCount: 2,
    regions: [ img(0, 1, 6, 1, 7), { role: 'title', c0: 1, cs: 6, r0: 8, rs: 2 }, { role: 'text', c0: 1, cs: 6, r0: 10, rs: 3 }, img(1, 7, 6, 1, 12) ] },

  { id: 'spread.editorial-pull-quote', name: 'Editorial Pull Quote', category: 'Project Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ img(0, 1, 6, 1, 12), { role: 'subtitle', c0: 7, cs: 6, r0: 2, rs: 3 }, { role: 'text', c0: 7, cs: 6, r0: 5, rs: 5 }, { role: 'meta', c0: 7, cs: 6, r0: 10, rs: 3 } ] },

  { id: 'spread.editorial-five-col', name: 'Editorial 5-Column', category: 'About Spread', suits: ['about'], imageCount: 1,
    regions: [ img(0, 1, 4, 1, 8), { role: 'title', c0: 5, cs: 3, r0: 1, rs: 2 }, { role: 'text', c0: 5, cs: 3, r0: 3, rs: 6 }, { role: 'text', c0: 8, cs: 5, r0: 1, rs: 8 }, { role: 'meta', c0: 1, cs: 12, r0: 9, rs: 4 } ] },

  { id: 'spread.bold-opener', name: 'Bold Opener', category: 'Project Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 12, r0: 1, rs: 3 }, img(0, 1, 12, 4, 7), { role: 'text', c0: 3, cs: 8, r0: 11, rs: 2 } ] },

  { id: 'spread.cover-spread', name: 'Cover Spread', category: 'Project Spread', suits: ['cover', 'project'], imageCount: 1,
    regions: [ img(0, 1, 12, 1, 9), { role: 'title', c0: 2, cs: 8, r0: 10, rs: 2 }, { role: 'subtitle', c0: 2, cs: 8, r0: 12, rs: 1 } ] },

  { id: 'spread.story-arc', name: 'Story Arc', category: 'Project Spread', suits: ['project', 'about'], imageCount: 2,
    regions: [ { role: 'title', c0: 1, cs: 5, r0: 1, rs: 2 }, img(0, 1, 5, 3, 6), { role: 'text', c0: 1, cs: 5, r0: 9, rs: 4 }, img(1, 6, 7, 1, 12) ] },

  { id: 'spread.double-story', name: 'Double Story', category: 'Project Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 6, 1, 8), { role: 'title', c0: 1, cs: 6, r0: 9, rs: 2 }, { role: 'text', c0: 1, cs: 6, r0: 11, rs: 2 }, img(1, 7, 6, 3, 8), { role: 'subtitle', c0: 7, cs: 6, r0: 11, rs: 2 } ] },

  { id: 'spread.folio-left', name: 'Folio Left', category: 'Project Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 3, r0: 1, rs: 3 }, { role: 'meta', c0: 1, cs: 3, r0: 4, rs: 2 }, img(0, 4, 9, 1, 12) ] },

  { id: 'spread.folio-right', name: 'Folio Right', category: 'Project Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ img(0, 1, 9, 1, 12), { role: 'title', c0: 10, cs: 3, r0: 1, rs: 3 }, { role: 'meta', c0: 10, cs: 3, r0: 4, rs: 2 } ] },

  { id: 'spread.exhibition', name: 'Exhibition Style', category: 'Project Spread', suits: ['project'], imageCount: 3,
    regions: [ { role: 'title', c0: 1, cs: 12, r0: 1, rs: 1 }, img(0, 1, 5, 2, 9), img(1, 6, 4, 2, 9), img(2, 10, 3, 2, 9), { role: 'legend', c0: 1, cs: 12, r0: 11, rs: 2 } ] },

  { id: 'spread.editorial-band', name: 'Editorial Band', category: 'Project Spread', suits: ['project', 'about'], imageCount: 2,
    regions: [ img(0, 1, 6, 1, 8), { role: 'title', c0: 7, cs: 6, r0: 1, rs: 2 }, { role: 'text', c0: 7, cs: 6, r0: 3, rs: 6 }, img(1, 7, 6, 9, 4) ] },

  // ── ACADEMIC / TECHNICAL (66–76) ─────────────────────────────────────────
  { id: 'spread.academic', name: 'Academic / Thesis', category: 'Project Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 5, r0: 1, rs: 2 }, { role: 'subtitle', c0: 1, cs: 5, r0: 3, rs: 1 }, { role: 'text', c0: 7, cs: 6, r0: 1, rs: 4 }, img(0, 1, 12, 5, 8) ] },

  { id: 'spread.plan-sections', name: 'Plan + Stacked Sections', category: 'Project Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 7, 1, 10), img(1, 8, 5, 1, 5), img(2, 8, 5, 6, 5), { role: 'legend', c0: 1, cs: 3, r0: 11, rs: 2 }, { role: 'meta', c0: 4, cs: 4, r0: 11, rs: 2 } ] },

  { id: 'spread.plan-elevations', name: 'Plan + Three Elevations', category: 'Project Spread', suits: ['project'], imageCount: 4,
    regions: [ img(0, 1, 7, 1, 8), { role: 'legend', c0: 1, cs: 7, r0: 9, rs: 4 }, img(1, 8, 5, 1, 4), img(2, 8, 5, 5, 4), img(3, 8, 5, 9, 4) ] },

  { id: 'spread.axo-and-plans', name: 'Axonometric + Plans', category: 'Project Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 6, 1, 8), { role: 'meta', c0: 1, cs: 6, r0: 9, rs: 4 }, img(1, 7, 6, 1, 6), img(2, 7, 6, 7, 6) ] },

  { id: 'spread.section-detail', name: 'Section + Detail', category: 'Project Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 8, 1, 12), { role: 'legend', c0: 1, cs: 8, r0: 11, rs: 2 }, img(1, 9, 4, 1, 8), { role: 'meta', c0: 9, cs: 4, r0: 9, rs: 4 } ] },

  { id: 'spread.site-plan-context', name: 'Site Plan + Context', category: 'Project Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 8, 1, 10), { role: 'title', c0: 1, cs: 8, r0: 11, rs: 2 }, img(1, 9, 4, 1, 6), { role: 'text', c0: 9, cs: 4, r0: 7, rs: 6 } ] },

  { id: 'spread.diagram-grid', name: 'Diagram Grid', category: 'Project Spread', suits: ['project'], imageCount: 6,
    regions: [ img(0, 1, 4, 1, 6), img(1, 5, 4, 1, 6), img(2, 9, 4, 1, 6), img(3, 1, 4, 7, 6), img(4, 5, 4, 7, 6), img(5, 9, 4, 7, 6) ] },

  { id: 'spread.process-timeline', name: 'Process Timeline', category: 'Project Spread', suits: ['project', 'about'], imageCount: 4,
    regions: [ img(0, 1, 3, 1, 9), img(1, 4, 3, 1, 9), img(2, 7, 3, 1, 9), img(3, 10, 3, 1, 9), { role: 'title', c0: 1, cs: 12, r0: 10, rs: 1 }, { role: 'text', c0: 1, cs: 12, r0: 11, rs: 2 } ] },

  { id: 'spread.construction-notes', name: 'Construction Notes', category: 'Project Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 7, 1, 10), { role: 'legend', c0: 1, cs: 7, r0: 11, rs: 2 }, { role: 'title', c0: 8, cs: 5, r0: 1, rs: 2 }, { role: 'text', c0: 8, cs: 5, r0: 3, rs: 5 }, img(1, 8, 5, 8, 5) ] },

  { id: 'spread.technical-drawing', name: 'Technical Drawing', category: 'Project Spread', suits: ['project'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 12, r0: 1, rs: 1 }, img(0, 1, 12, 2, 9), { role: 'meta', c0: 1, cs: 6, r0: 11, rs: 2 }, { role: 'legend', c0: 7, cs: 6, r0: 11, rs: 2 } ] },

  { id: 'spread.model-photo', name: 'Model Photograph', category: 'Project Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 8, 1, 12), { role: 'title', c0: 9, cs: 4, r0: 1, rs: 2 }, { role: 'text', c0: 9, cs: 4, r0: 3, rs: 5 }, img(1, 9, 4, 8, 5) ] },

  // ── SPECIAL / CINEMATIC (77–100) ──────────────────────────────────────────
  { id: 'spread.cinematic-wide', name: 'Cinematic Widescreen', category: 'Project Spread', suits: ['project'], imageCount: 1,
    regions: [ img(0, 1, 12, 3, 7), { role: 'title', c0: 1, cs: 12, r0: 10, rs: 2 }, { role: 'text', c0: 1, cs: 12, r0: 12, rs: 1 } ] },

  { id: 'spread.hero-caption-bottom', name: 'Hero + Bottom Caption', category: 'Project Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ img(0, 1, 12, 1, 10), { role: 'title', c0: 1, cs: 4, r0: 11, rs: 2 }, { role: 'text', c0: 5, cs: 8, r0: 11, rs: 2 } ] },

  { id: 'spread.hero-caption-top', name: 'Caption + Hero', category: 'Project Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 4, r0: 1, rs: 2 }, { role: 'text', c0: 5, cs: 8, r0: 1, rs: 2 }, img(0, 1, 12, 3, 10) ] },

  { id: 'spread.diagonal-split', name: 'Diagonal Split', category: 'Project Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 7, 1, 7), img(1, 6, 7, 6, 7), { role: 'title', c0: 1, cs: 5, r0: 8, rs: 2 }, { role: 'meta', c0: 8, cs: 5, r0: 8, rs: 2 } ] },

  { id: 'spread.mondrian', name: 'Mondrian', category: 'Project Spread', suits: ['project'], imageCount: 5,
    regions: [ img(0, 1, 5, 1, 7), img(1, 6, 3, 1, 4), img(2, 9, 4, 1, 4), img(3, 6, 7, 5, 5), img(4, 1, 5, 8, 5) ] },

  { id: 'spread.mondrian-b', name: 'Mondrian B', category: 'Project Spread', suits: ['project'], imageCount: 6,
    regions: [ img(0, 1, 4, 1, 6), img(1, 5, 4, 1, 4), img(2, 9, 4, 1, 5), img(3, 1, 6, 7, 6), img(4, 7, 3, 7, 6), img(5, 10, 3, 7, 6) ] },

  { id: 'spread.spine-title', name: 'Spine Title', category: 'Project Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ img(0, 1, 5, 1, 12), { role: 'title', c0: 6, cs: 2, r0: 1, rs: 12 }, { role: 'text', c0: 8, cs: 5, r0: 2, rs: 8 }, { role: 'meta', c0: 8, cs: 5, r0: 10, rs: 3 } ] },

  { id: 'spread.floating-image', name: 'Floating Image', category: 'Project Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 5, r0: 1, rs: 2 }, { role: 'subtitle', c0: 1, cs: 5, r0: 3, rs: 1 }, img(0, 2, 9, 3, 8), { role: 'meta', c0: 1, cs: 12, r0: 11, rs: 2 } ] },

  { id: 'spread.diptych-text', name: 'Diptych + Text', category: 'Project Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 5, 1, 10), img(1, 6, 5, 1, 10), { role: 'title', c0: 11, cs: 2, r0: 1, rs: 3 }, { role: 'text', c0: 11, cs: 2, r0: 4, rs: 7 }, { role: 'meta', c0: 1, cs: 12, r0: 11, rs: 2 } ] },

  { id: 'spread.night-sky', name: 'Night Sky (Dark Bleed)', category: 'Project Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 6, 1, 10), { role: 'title', c0: 1, cs: 6, r0: 11, rs: 2 }, img(1, 7, 6, 3, 8), { role: 'meta', c0: 7, cs: 6, r0: 11, rs: 2 } ] },

  { id: 'spread.large-small-bottom', name: 'Large + Two Small Bottom', category: 'Project Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 12, 1, 8), img(1, 1, 6, 9, 4), img(2, 7, 6, 9, 4) ] },

  { id: 'spread.large-small-top', name: 'Two Small Top + Large', category: 'Project Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 6, 1, 4), img(1, 7, 6, 1, 4), img(2, 1, 12, 5, 8) ] },

  { id: 'spread.one-third-hero', name: 'Third + Full Hero', category: 'Project Spread', suits: ['project'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 4, r0: 1, rs: 3 }, { role: 'text', c0: 1, cs: 4, r0: 4, rs: 5 }, { role: 'meta', c0: 1, cs: 4, r0: 9, rs: 4 }, img(0, 5, 8, 1, 12) ] },

  { id: 'spread.diagonal-trio', name: 'Diagonal Trio', category: 'Project Spread', suits: ['project'], imageCount: 3,
    regions: [ img(0, 1, 5, 1, 5), img(1, 4, 5, 4, 5), img(2, 8, 5, 7, 6), { role: 'title', c0: 1, cs: 3, r0: 6, rs: 2 }, { role: 'meta', c0: 10, cs: 3, r0: 1, rs: 3 } ] },

  { id: 'spread.manifesto', name: 'Manifesto', category: 'About Spread', suits: ['about'], imageCount: 0,
    regions: [ { role: 'title', c0: 2, cs: 10, r0: 2, rs: 3 }, { role: 'subtitle', c0: 2, cs: 10, r0: 5, rs: 2 }, { role: 'text', c0: 2, cs: 5, r0: 7, rs: 5 }, { role: 'text', c0: 7, cs: 5, r0: 7, rs: 5 } ] },

  { id: 'spread.portrait-landscape', name: 'Portrait + Landscape', category: 'Project Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 4, 1, 12), img(1, 5, 8, 3, 7), { role: 'title', c0: 5, cs: 8, r0: 1, rs: 2 }, { role: 'meta', c0: 5, cs: 8, r0: 10, rs: 3 } ] },

  { id: 'spread.collage-left', name: 'Collage Left + Text', category: 'Project Spread', suits: ['project'], imageCount: 4,
    regions: [ img(0, 1, 4, 1, 6), img(1, 1, 4, 7, 6), img(2, 5, 3, 1, 6), img(3, 5, 3, 7, 6), { role: 'title', c0: 8, cs: 5, r0: 2, rs: 2 }, { role: 'text', c0: 8, cs: 5, r0: 4, rs: 6 }, { role: 'meta', c0: 8, cs: 5, r0: 10, rs: 3 } ] },

  { id: 'spread.collage-right', name: 'Text + Collage Right', category: 'Project Spread', suits: ['project'], imageCount: 4,
    regions: [ { role: 'title', c0: 1, cs: 5, r0: 2, rs: 2 }, { role: 'text', c0: 1, cs: 5, r0: 4, rs: 6 }, { role: 'meta', c0: 1, cs: 5, r0: 10, rs: 3 }, img(0, 6, 4, 1, 6), img(1, 6, 4, 7, 6), img(2, 10, 3, 1, 6), img(3, 10, 3, 7, 6) ] },

  { id: 'spread.caption-between', name: 'Image Caption Image', category: 'Project Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 5, 1, 12), { role: 'title', c0: 6, cs: 2, r0: 3, rs: 2 }, { role: 'text', c0: 6, cs: 2, r0: 5, rs: 5 }, img(1, 8, 5, 1, 12) ] },

  { id: 'spread.grand-plan', name: 'Grand Plan', category: 'Project Spread', suits: ['project'], imageCount: 1,
    regions: [ { role: 'title', c0: 1, cs: 12, r0: 1, rs: 1 }, img(0, 1, 12, 2, 10), { role: 'legend', c0: 1, cs: 6, r0: 12, rs: 1 }, { role: 'meta', c0: 7, cs: 6, r0: 12, rs: 1 } ] },

  { id: 'spread.hero-inset', name: 'Hero + Inset Detail', category: 'Project Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 12, 1, 10), { role: 'title', c0: 1, cs: 4, r0: 11, rs: 2 }, img(1, 5, 4, 9, 4), { role: 'meta', c0: 9, cs: 4, r0: 11, rs: 2 } ] },

  { id: 'spread.zigzag', name: 'Zigzag Alternating', category: 'Project Spread', suits: ['project'], imageCount: 4,
    regions: [ img(0, 1, 7, 1, 3), img(1, 8, 5, 1, 3), img(2, 1, 5, 4, 3), img(3, 6, 7, 4, 3), { role: 'title', c0: 1, cs: 6, r0: 7, rs: 2 }, { role: 'text', c0: 7, cs: 6, r0: 7, rs: 4 }, { role: 'meta', c0: 1, cs: 12, r0: 11, rs: 2 } ] },

  { id: 'spread.data-rich', name: 'Data Rich', category: 'Project Spread', suits: ['project', 'about'], imageCount: 1,
    regions: [ img(0, 1, 6, 1, 8), { role: 'legend', c0: 1, cs: 6, r0: 9, rs: 4 }, { role: 'title', c0: 7, cs: 6, r0: 1, rs: 2 }, { role: 'meta', c0: 7, cs: 6, r0: 3, rs: 3 }, { role: 'text', c0: 7, cs: 6, r0: 6, rs: 7 } ] },

  { id: 'spread.concept-render', name: 'Concept + Render', category: 'Project Spread', suits: ['project'], imageCount: 2,
    regions: [ img(0, 1, 6, 1, 7), { role: 'title', c0: 1, cs: 6, r0: 8, rs: 2 }, { role: 'text', c0: 1, cs: 6, r0: 10, rs: 3 }, img(1, 7, 6, 1, 12) ] },

  { id: 'spread.narrative-sequence', name: 'Narrative Sequence', category: 'Project Spread', suits: ['project', 'about'], imageCount: 3,
    regions: [ img(0, 1, 4, 2, 9), img(1, 5, 4, 2, 9), img(2, 9, 4, 2, 9), { role: 'title', c0: 1, cs: 12, r0: 11, rs: 2 } ] },

  { id: 'spread.five-strip', name: 'Five Image Strip', category: 'Project Spread', suits: ['project'], imageCount: 5,
    regions: [ img(0, 1, 12, 1, 2), img(1, 1, 12, 3, 2), img(2, 1, 12, 5, 3), img(3, 1, 12, 8, 2), img(4, 1, 12, 10, 3) ] },
]

// shorthand for resume regions
const rv = (role: RegionRole, c0: number, cs: number, r0: number, rs: number): Region => ({ role, c0, cs, r0, rs })

export const RESUME_SPREAD_SPECS: LayoutSpec[] = [
  // ── 2 BIG COMPREHENSIVE RESUME SPREADS ───────────────────────────────────
  {
    id: 'resume.spread-luxury-editorial',
    name: 'Luxury Editorial CV Spread',
    category: 'Resume',
    suits: ['resume'],
    imageCount: 1,
    regions: [
      img(0, 1, 4, 1, 10),                         // 4-column elegant image with whitespace below
      rv('title',       6, 6, 2, 2),               // Massive header area
      rv('bio',         6, 4, 4, 3),               // Wide bio
      rv('education',   6, 2, 8, 4),               // Minimalist split data
      rv('skills',      8, 2, 8, 4),
      rv('software',    10, 2, 8, 4),
      rv('meta',        6, 6, 12, 1),
    ],
  },
  {
    id: 'resume.spread-architectural-grid',
    name: 'Architectural Grid CV Spread',
    category: 'Resume',
    suits: ['resume'],
    imageCount: 0,
    regions: [
      rv('title',       1, 12, 1, 3),              // Full width cinematic title
      rv('bio',         1, 5, 4, 4),               // Left aligned bio block
      rv('education',   7, 3, 4, 4),               // Right aligned stats
      rv('skills',      10, 3, 4, 4),              // Right aligned stats
      rv('achievement', 1, 5, 9, 3),
      rv('software',    7, 6, 9, 3),
      rv('meta',        1, 12, 12, 1),
    ],
  },
  {
    id: 'resume.spread-swiss-dossier',
    name: 'Swiss Dossier CV Spread',
    category: 'Resume',
    suits: ['resume'],
    imageCount: 2,
    regions: [
      rv('title',       1, 4, 1, 2),               
      rv('bio',         1, 4, 3, 4),               
      rv('meta',        1, 4, 8, 4),               
      img(0, 6, 4, 1, 6),
      img(1, 10, 3, 1, 6),
      rv('education',   6, 7, 8, 2),
      rv('skills',      6, 7, 10, 2),
      rv('software',    6, 7, 12, 1),
    ],
  },

  // ── 2-PAGE RESUME SPREADS ────────────────────────────────────────────────
  {
    id: 'resume.spread-classic',
    name: 'Classic CV Spread',
    category: 'Resume',
    suits: ['resume'],
    imageCount: 1,
    regions: [
      img(0, 1, 5, 1, 5),                          // headshot top-left
      rv('title',       1, 5, 6, 2),
      rv('bio',         1, 5, 8, 4),
      rv('meta',        1, 5, 12, 1),
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
    category: 'Resume',
    suits: ['resume'],
    imageCount: 1,
    regions: [
      img(0, 1, 4, 1, 12),                         // full-height headshot
      rv('title',       5, 2, 2, 2),
      rv('bio',         5, 2, 4, 4),
      rv('meta',        5, 2, 8, 4),
      rv('interest',    5, 2, 12, 1),
      rv('education',   7, 6, 1, 3),
      rv('skills',      7, 3, 4, 4),
      rv('software',    10, 3, 4, 4),
      rv('achievement', 7, 6, 8, 4),
    ],
  },
  {
    id: 'resume.spread-minimal',
    name: 'Minimal CV Spread',
    category: 'Resume',
    suits: ['resume'],
    imageCount: 0,
    regions: [
      rv('title',       1, 6, 1, 3),
      rv('subtitle',    1, 6, 4, 1),
      rv('bio',         1, 6, 5, 5),
      rv('meta',        1, 6, 10, 3),
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
    category: 'Resume',
    suits: ['resume'],
    imageCount: 1,
    regions: [
      img(0, 1, 6, 1, 8),
      rv('title',       1, 6, 9, 2),
      rv('meta',        1, 6, 11, 2),
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
    category: 'Resume',
    suits: ['resume'],
    imageCount: 1,
    regions: [
      img(0, 1, 3, 1, 4),
      rv('title',       4, 3, 1, 2),
      rv('subtitle',    4, 3, 3, 1),
      rv('meta',        4, 3, 4, 1),
      rv('bio',         1, 6, 5, 3),
      rv('skills',      1, 6, 8, 2),
      rv('interest',    1, 6, 10, 3),
      rv('education',   7, 6, 1, 5),
      rv('software',    7, 3, 6, 4),
      rv('achievement', 10, 3, 6, 4),
    ],
  },

  // ── 3-PAGE (2-spread) RESUME LAYOUTS ─────────────────────────────────────
  {
    id: 'resume.spread-3page-intro',
    name: '3-Page CV · Intro',
    category: 'Resume',
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
    category: 'Resume',
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
    category: 'Resume',
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

  // ── 2 BIG COMPREHENSIVE RESUME SPREADS ───────────────────────────────────
  {
    id: 'resume.spread-architect-full',
    name: 'Architect Full CV',
    category: 'Resume',
    suits: ['resume'],
    imageCount: 3,
    regions: [
      // LEFT PAGE — headshot strip + identity block + 2 project thumbnails
      img(0, 1, 3, 1, 9),                           // tall headshot left column
      rv('title',       4, 3, 1, 2),                // name
      rv('subtitle',    4, 3, 3, 1),                // role / tagline
      rv('meta',        4, 3, 4, 3),                // contact details
      rv('bio',         4, 3, 7, 3),                // about paragraph
      img(1, 1, 3, 10, 3),                          // project thumb 1
      img(2, 4, 3, 10, 3),                          // project thumb 2
      rv('interest',    7, 1, 10, 3),               // interest narrow strip
      // RIGHT PAGE — all skills + education + achievements
      rv('education',   8, 5, 1, 5),               // education top-right
      rv('skills',      8, 5, 6, 4),               // skills mid-right
      rv('software',    8, 5, 10, 3),              // software bottom-right
      rv('achievement', 7, 1, 1, 12),              // achievements narrow left strip of right page
    ],
  },
  {
    id: 'resume.spread-thesis-cv',
    name: 'Thesis / Research CV',
    category: 'Resume',
    suits: ['resume'],
    imageCount: 2,
    regions: [
      // LEFT PAGE — large headshot + name + contact + bio in elegant academic style
      img(0, 1, 6, 1, 6),                           // square headshot top-left
      rv('title',       1, 6, 7, 2),                // name — large
      rv('subtitle',    1, 6, 9, 1),                // thesis title / specialisation
      rv('bio',         1, 6, 10, 3),               // research statement
      // RIGHT PAGE top — education + awards prominent
      rv('education',   7, 6, 1, 5),                // education block full width right
      rv('achievement', 7, 6, 6, 4),                // awards / publications
      // RIGHT PAGE bottom — skills, software, interests in 3 equal columns
      rv('skills',      7, 2, 10, 3),
      rv('software',    9, 2, 10, 3),
      rv('interest',    11, 2, 10, 3),
      // Visual accent — a project photo bottom-left of left page
      img(1, 1, 6, 7, 6),                           // project render / thesis image
    ],
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// GENERATED LAYOUT BANKS — 100 each
// ═══════════════════════════════════════════════════════════════════════════

function generateResumeSpreads100(): LayoutSpec[] {
  const mk = (id: string, n: string, r: Region[]): LayoutSpec => ({
    id, name: n, category: 'Resume' as LayoutCategory, suits: ['resume'] as PageType[],
    imageCount: r.filter(x => x.role === 'image').length, regions: r,
  })
  return [
    // ── CLASSIC: photo top-left, systematic credentials right ──────────────
    mk('gen-c01','Classic · Mid Portrait',[img(0,1,4,1,6),rv('title',1,4,7,2),rv('subtitle',1,4,9,1),rv('meta',1,4,10,3),rv('bio',5,2,1,8),rv('interest',5,2,9,4),rv('education',7,6,1,4),rv('skills',7,3,5,4),rv('software',10,3,5,4),rv('achievement',7,6,9,4)]),
    mk('gen-c02','Classic · Tall Portrait',[img(0,1,4,1,9),rv('title',1,4,10,2),rv('meta',1,4,12,1),rv('bio',5,2,1,7),rv('interest',5,2,8,5),rv('education',7,6,1,4),rv('skills',7,3,5,4),rv('software',10,3,5,4),rv('achievement',7,6,9,4)]),
    mk('gen-c03','Classic · Sidebar Strip',[img(0,1,2,1,12),rv('title',3,4,1,2),rv('subtitle',3,4,3,1),rv('bio',3,4,4,5),rv('meta',3,4,9,2),rv('interest',3,4,11,2),rv('education',7,6,1,4),rv('skills',7,3,5,4),rv('software',10,3,5,4),rv('achievement',7,6,9,4)]),
    mk('gen-c04','Classic · Square Photo',[img(0,1,5,1,7),rv('title',1,5,8,2),rv('subtitle',1,5,10,1),rv('meta',6,1,1,12),rv('bio',1,5,11,2),rv('education',7,6,1,4),rv('skills',7,3,5,4),rv('software',10,3,5,4),rv('achievement',7,6,9,4)]),
    mk('gen-c05','Classic · No Photo',[rv('title',1,6,1,3),rv('subtitle',1,6,4,1),rv('bio',1,6,5,5),rv('meta',1,6,10,3),rv('education',7,6,1,5),rv('skills',7,3,6,4),rv('software',10,3,6,4),rv('achievement',7,6,10,3)]),
    mk('gen-c06','Classic · Centered Portrait',[img(0,2,4,1,7),rv('title',1,6,8,2),rv('meta',1,6,10,3),rv('education',7,6,1,4),rv('bio',7,6,5,4),rv('skills',7,3,9,4),rv('software',10,3,9,4)]),
    mk('gen-c07','Classic · Small Photo',[img(0,1,3,1,5),rv('title',4,3,1,2),rv('bio',4,3,3,7),rv('meta',1,3,6,5),rv('interest',1,3,11,2),rv('education',7,6,1,4),rv('skills',7,3,5,4),rv('software',10,3,5,4),rv('achievement',7,6,9,4)]),
    mk('gen-c08','Classic · Panoramic',[img(0,1,12,1,4),rv('title',1,6,5,2),rv('bio',1,6,7,4),rv('meta',1,6,11,2),rv('education',7,6,5,4),rv('skills',7,3,9,4),rv('software',10,3,9,4)]),
    mk('gen-c09','Classic · Half Page Photo',[img(0,1,6,1,6),rv('title',1,3,7,2),rv('subtitle',1,3,9,1),rv('meta',4,3,7,4),rv('interest',1,6,11,2),rv('bio',7,6,1,3),rv('education',7,6,4,4),rv('skills',7,3,8,5),rv('software',10,3,8,5)]),
    mk('gen-c10','Classic · Full Height',[img(0,1,4,1,12),rv('title',5,2,1,3),rv('subtitle',5,2,4,1),rv('bio',5,2,5,4),rv('interest',5,2,9,2),rv('meta',5,2,11,2),rv('education',7,6,1,4),rv('skills',7,3,5,4),rv('software',10,3,5,4),rv('achievement',7,6,9,4)]),
    // ── EDITORIAL: magazine-inspired, bold, asymmetric ────────────────────
    mk('gen-e01','Editorial · Full Spread Name',[rv('title',1,12,1,2),img(0,1,4,3,10),rv('bio',5,2,3,6),rv('meta',5,2,9,4),rv('interest',1,6,12,1),rv('education',7,6,3,5),rv('skills',7,3,8,5),rv('software',10,3,8,5)]),
    mk('gen-e02','Editorial · Right Photo',[img(0,4,3,1,10),rv('title',1,3,1,3),rv('subtitle',1,3,4,1),rv('bio',1,3,5,5),rv('meta',1,3,10,3),rv('interest',4,3,11,2),rv('education',7,5,1,4),rv('achievement',7,6,5,5),rv('skills',7,3,10,3),rv('software',10,3,10,3)]),
    mk('gen-e03','Editorial · Full Right Photo',[img(0,7,6,1,12),rv('title',1,6,1,3),rv('subtitle',1,6,4,1),rv('bio',1,6,5,5),rv('education',1,6,10,3)]),
    mk('gen-e04','Editorial · Two Photos',[img(0,1,5,1,8),img(1,7,6,1,5),rv('title',1,6,9,2),rv('meta',1,6,11,2),rv('bio',7,6,6,4),rv('achievement',7,6,10,3)]),
    mk('gen-e05','Editorial · Left Image Bold',[img(0,1,6,1,12),rv('title',7,6,1,3),rv('subtitle',7,6,4,1),rv('bio',7,6,5,4),rv('education',7,6,9,4)]),
    mk('gen-e06','Editorial · Diagonal Flow',[rv('title',1,12,1,1),img(0,1,3,2,9),rv('skills',4,3,2,5),rv('software',4,3,7,5),rv('bio',1,6,11,2),rv('education',7,6,2,5),rv('achievement',7,6,7,6)]),
    mk('gen-e07','Editorial · No Photo Bold',[rv('title',1,6,3,5),rv('subtitle',1,6,8,1),rv('bio',1,6,9,4),rv('education',7,6,1,4),rv('achievement',7,6,5,4),rv('skills',7,6,9,4)]),
    mk('gen-e08','Editorial · Dark Headshot',[img(0,1,6,1,9),rv('title',1,6,10,2),rv('meta',1,6,12,1),rv('bio',7,6,1,3),rv('education',7,6,4,4),rv('skills',7,3,8,3),rv('software',10,3,8,3),rv('achievement',7,6,11,2)]),
    mk('gen-e09','Editorial · Sidebar Identity',[rv('bio',1,5,1,7),rv('meta',1,5,8,5),rv('title',7,6,1,2),rv('education',7,6,3,4),rv('skills',7,3,7,3),rv('software',10,3,7,3),rv('achievement',7,6,10,3)]),
    mk('gen-e10','Editorial · Three Column',[img(0,1,3,4,9),rv('title',1,3,1,3),rv('bio',4,2,1,12),rv('education',7,4,1,12),rv('skills',11,2,1,6),rv('achievement',11,2,7,6)]),
    // ── MINIMAL: sparse whitespace, pure typography ───────────────────────
    mk('gen-m01','Minimal · Centered Name',[rv('title',2,5,4,2),rv('subtitle',2,5,6,1),rv('bio',2,5,8,3),rv('meta',2,5,11,2),rv('education',8,4,3,4),rv('skills',8,4,7,3),rv('achievement',8,4,10,3)]),
    mk('gen-m02','Minimal · Left Lean',[rv('title',1,6,2,3),rv('subtitle',1,6,5,1),rv('bio',2,5,7,4),rv('meta',2,5,11,2),rv('education',8,4,2,4),rv('skills',8,4,6,3),rv('software',8,4,9,2),rv('achievement',8,4,11,2)]),
    mk('gen-m03','Minimal · No Image',[rv('title',2,5,5,2),rv('subtitle',2,5,7,1),rv('bio',8,4,3,5),rv('education',8,4,8,5)]),
    mk('gen-m04','Minimal · Tiny Photo',[img(0,3,2,3,5),rv('title',1,6,7,2),rv('meta',1,6,9,4),rv('bio',8,4,2,4),rv('education',8,4,6,4),rv('skills',8,4,10,3)]),
    mk('gen-m05','Minimal · Strip Accent',[img(0,1,1,1,12),rv('title',3,4,2,2),rv('subtitle',3,4,4,1),rv('bio',3,4,6,4),rv('meta',3,4,10,3),rv('education',8,4,2,4),rv('skills',8,4,6,4),rv('achievement',8,4,10,3)]),
    mk('gen-m06','Minimal · Full Width Name',[rv('title',1,6,1,2),rv('bio',1,6,5,5),rv('meta',1,6,10,3),rv('education',7,6,1,4),rv('skills',9,4,5,4),rv('achievement',9,4,9,4)]),
    mk('gen-m07','Minimal · Far Right Photo',[img(0,5,2,1,6),rv('title',1,4,3,2),rv('subtitle',1,4,5,1),rv('bio',1,4,6,4),rv('meta',1,4,10,3),rv('interest',5,2,7,6),rv('education',8,4,2,4),rv('skills',8,4,6,3),rv('achievement',8,4,9,4)]),
    mk('gen-m08','Minimal · Centered Full',[rv('title',1,12,5,2),rv('meta',2,11,7,1),rv('bio',7,5,1,4),rv('education',7,5,5,4),rv('skills',7,5,9,4)]),
    mk('gen-m09','Minimal · Narrow Portrait',[img(0,1,2,3,7),rv('title',3,4,4,2),rv('bio',3,4,6,5),rv('meta',3,4,11,2),rv('education',8,4,2,5),rv('skills',8,4,7,4),rv('achievement',8,4,11,2)]),
    mk('gen-m10','Minimal · White Space',[rv('title',1,6,1,2),rv('bio',1,6,5,6),rv('meta',1,6,11,2),rv('education',7,6,1,4),rv('skills',7,6,6,3),rv('achievement',7,6,10,3)]),
    // ── BOLD: strong typographic hierarchy ────────────────────────────────
    mk('gen-b01','Bold · Giant Name',[rv('title',1,12,1,3),img(0,1,4,4,9),rv('meta',5,2,4,4),rv('bio',5,2,8,5),rv('education',7,6,4,5),rv('skills',7,3,9,4),rv('software',10,3,9,4)]),
    mk('gen-b02','Bold · Vertical Name',[rv('title',1,2,1,12),img(0,3,4,1,7),rv('subtitle',3,4,8,1),rv('meta',3,4,9,4),rv('education',7,6,1,4),rv('bio',7,6,5,4),rv('skills',7,3,9,4),rv('software',10,3,9,4)]),
    mk('gen-b03','Bold · Oversized Heading',[rv('title',1,6,1,4),rv('subtitle',1,6,5,1),rv('bio',1,6,7,6),rv('education',7,6,1,3),rv('achievement',7,6,4,4),rv('skills',7,3,8,5),rv('software',10,3,8,5)]),
    mk('gen-b04','Bold · Name + Photo Strip',[rv('title',1,6,1,3),rv('subtitle',1,6,4,1),img(0,1,6,5,6),rv('meta',1,6,11,2),rv('education',7,6,1,4),rv('bio',7,6,5,3),rv('skills',7,3,8,5),rv('software',10,3,8,5)]),
    mk('gen-b05','Bold · Dark Photo',[img(0,1,5,1,9),rv('title',1,6,10,3),rv('education',7,6,1,4),rv('bio',7,6,5,3),rv('skills',7,3,8,5),rv('software',10,3,8,5)]),
    mk('gen-b06','Bold · Uppercase',[rv('title',1,6,1,2),rv('subtitle',1,6,3,1),img(0,1,3,4,9),rv('bio',4,3,4,6),rv('meta',4,3,10,3),rv('education',7,6,1,4),rv('achievement',7,6,5,5),rv('skills',7,3,10,3),rv('software',10,3,10,3)]),
    mk('gen-b07','Bold · Left Accent',[rv('title',1,6,1,2),img(0,1,2,3,10),rv('bio',3,4,3,6),rv('meta',3,4,9,4),rv('education',7,6,1,5),rv('skills',7,3,6,4),rv('software',10,3,6,4),rv('achievement',7,6,10,3)]),
    mk('gen-b08','Bold · Centered Statement',[rv('title',1,12,3,3),rv('subtitle',1,12,6,1),rv('bio',1,6,8,5),rv('meta',7,6,8,5)]),
    mk('gen-b09','Bold · Name + Project',[rv('title',1,6,1,3),img(0,1,6,4,9),rv('meta',1,6,12,1),rv('bio',7,6,1,3),rv('education',7,6,4,4),rv('skills',7,3,8,5),rv('software',10,3,8,5)]),
    mk('gen-b10','Bold · Landscape Photo',[img(0,1,12,1,5),rv('title',1,6,6,3),rv('bio',1,6,9,4),rv('education',7,6,6,4),rv('skills',7,3,10,3),rv('software',10,3,10,3)]),
    // ── PORTRAIT DOMINANT ─────────────────────────────────────────────────
    mk('gen-p01','Portrait · Full Left',[img(0,1,6,1,12),rv('title',7,6,1,2),rv('subtitle',7,6,3,1),rv('bio',7,6,4,3),rv('meta',7,6,7,2),rv('education',7,6,9,4)]),
    mk('gen-p02','Portrait · Three Quarter',[img(0,1,6,1,9),rv('title',1,6,10,2),rv('meta',1,6,12,1),rv('bio',7,6,1,3),rv('education',7,6,4,4),rv('skills',7,3,8,5),rv('software',10,3,8,5)]),
    mk('gen-p03','Portrait · Duo Photo',[img(0,1,4,1,9),img(1,5,2,1,5),rv('title',5,2,6,2),rv('meta',1,4,10,3),rv('interest',5,2,8,5),rv('bio',7,6,1,3),rv('education',7,6,4,4),rv('skills',7,3,8,5),rv('software',10,3,8,5)]),
    mk('gen-p04','Portrait · 2/3 Photo',[img(0,1,6,1,8),rv('title',1,6,9,2),rv('subtitle',1,3,11,1),rv('meta',4,3,11,1),rv('bio',1,6,12,1),rv('education',7,6,1,4),rv('skills',7,3,5,4),rv('software',10,3,5,4),rv('achievement',7,6,9,4)]),
    mk('gen-p05','Portrait · Right Aligned',[img(0,4,3,1,12),rv('title',1,3,1,3),rv('bio',1,3,4,5),rv('meta',1,3,9,4),rv('education',7,6,1,4),rv('skills',7,3,5,4),rv('software',10,3,5,4),rv('achievement',7,6,9,4)]),
    mk('gen-p06','Portrait · Dual Strip',[img(0,1,1,1,12),img(1,2,1,1,12),rv('title',3,4,1,3),rv('subtitle',3,4,4,1),rv('bio',3,4,5,5),rv('meta',3,4,10,3),rv('education',7,6,1,4),rv('skills',7,3,5,4),rv('software',10,3,5,4),rv('achievement',7,6,9,4)]),
    mk('gen-p07','Portrait · Three Quarter Right',[img(0,3,4,1,10),rv('title',1,2,1,3),rv('bio',1,2,4,5),rv('meta',1,2,9,4),rv('subtitle',7,6,1,2),rv('education',7,6,3,5),rv('skills',7,3,8,5),rv('software',10,3,8,5)]),
    mk('gen-p08','Portrait · Panorama Top',[img(0,1,12,1,5),rv('title',1,6,6,3),rv('bio',1,6,9,4),rv('meta',1,6,12,1),rv('education',7,6,6,3),rv('skills',7,3,9,4),rv('software',10,3,9,4)]),
    mk('gen-p09','Portrait · Paired Photos',[img(0,1,4,1,12),img(1,5,2,1,6),rv('title',5,2,7,3),rv('meta',5,2,10,3),rv('bio',7,6,1,3),rv('education',7,6,4,4),rv('skills',7,3,8,5),rv('software',10,3,8,5)]),
    mk('gen-p10','Portrait · Right Full Page',[img(0,7,6,1,12),rv('title',1,6,1,3),rv('bio',1,6,4,4),rv('meta',1,6,8,3),rv('education',1,6,11,2)]),
    // ── ACADEMIC: research style, dense info ──────────────────────────────
    mk('gen-a01','Academic · Dense CV',[rv('title',1,6,1,2),rv('subtitle',1,6,3,1),rv('bio',1,6,4,5),rv('meta',1,6,9,4),rv('education',7,6,1,5),rv('achievement',7,6,6,4),rv('skills',7,6,10,3)]),
    mk('gen-a02','Academic · Small Photo',[img(0,1,2,1,4),rv('title',3,4,1,2),rv('subtitle',3,4,3,1),rv('meta',3,4,4,1),rv('bio',1,6,5,5),rv('interest',1,6,10,3),rv('education',7,6,1,5),rv('achievement',7,6,6,7)]),
    mk('gen-a03','Academic · Timeline',[rv('title',1,6,1,2),rv('meta',1,6,3,1),rv('bio',1,6,4,5),rv('skills',1,3,9,4),rv('software',4,3,9,4),rv('education',7,6,1,6),rv('achievement',7,6,7,6)]),
    mk('gen-a04','Academic · Publications',[rv('title',1,6,1,2),rv('meta',1,6,3,1),img(0,1,2,4,5),rv('bio',3,4,4,4),rv('interest',1,6,9,4),rv('education',7,6,1,5),rv('achievement',7,6,6,7)]),
    mk('gen-a05','Academic · Research Statement',[rv('title',1,6,1,2),rv('subtitle',1,6,3,1),rv('bio',1,6,4,9),rv('education',7,6,1,5),rv('achievement',7,6,6,4),rv('skills',7,6,10,3)]),
    mk('gen-a06','Academic · Three Column',[rv('title',1,12,1,2),rv('bio',1,4,3,10),rv('education',5,4,3,10),rv('achievement',9,4,3,10)]),
    mk('gen-a07','Academic · Compact Dense',[rv('title',1,2,1,2),rv('subtitle',3,4,1,2),rv('meta',1,6,3,1),rv('bio',1,6,4,3),rv('skills',7,3,1,4),rv('software',10,3,1,4),rv('education',7,6,5,5),rv('achievement',7,6,10,3),rv('interest',1,6,7,6)]),
    mk('gen-a08','Academic · Poster Style',[rv('title',1,6,1,3),img(0,1,2,4,6),rv('bio',3,4,4,6),rv('meta',1,6,10,3),rv('education',7,6,1,5),rv('achievement',7,6,6,4),rv('skills',7,6,10,3)]),
    mk('gen-a09','Academic · Institution First',[rv('title',1,6,1,1),rv('meta',1,6,2,1),rv('education',1,6,3,7),rv('bio',1,6,10,3),img(0,7,3,1,6),rv('achievement',10,3,1,6),rv('skills',7,3,7,6),rv('software',10,3,7,6)]),
    mk('gen-a10','Academic · Grid Info',[img(0,1,3,1,5),rv('meta',4,3,1,5),rv('bio',1,6,6,7),rv('title',7,6,1,2),rv('education',7,6,3,5),rv('skills',7,3,8,5),rv('software',10,3,8,5)]),
    // ── SPLIT: strong left/right divide ───────────────────────────────────
    mk('gen-s01','Split · Identity | Credentials',[img(0,1,4,1,8),rv('title',1,4,9,2),rv('meta',1,4,11,2),rv('bio',5,2,1,8),rv('interest',5,2,9,4),rv('education',7,6,1,5),rv('skills',7,3,6,4),rv('software',10,3,6,4),rv('achievement',7,6,10,3)]),
    mk('gen-s02','Split · Bio | Education',[rv('title',1,6,1,2),rv('subtitle',1,6,3,1),rv('bio',1,6,4,8),rv('interest',1,6,12,1),rv('education',7,6,1,6),rv('achievement',7,6,7,4),rv('skills',7,6,11,2)]),
    mk('gen-s03','Split · Narrow Left',[img(0,1,3,1,9),rv('title',1,3,10,2),rv('meta',4,3,1,12),rv('bio',7,6,1,3),rv('education',7,6,4,5),rv('skills',7,3,9,4),rv('software',10,3,9,4)]),
    mk('gen-s04','Split · Equal Halves',[rv('title',1,6,1,2),rv('bio',1,6,3,7),rv('meta',1,6,10,3),rv('education',7,6,1,4),rv('skills',7,6,5,4),rv('achievement',7,6,9,4)]),
    mk('gen-s05','Split · Accent Column',[img(0,3,1,1,12),rv('title',1,2,1,3),rv('bio',1,2,4,6),rv('meta',1,2,10,3),rv('interest',4,3,1,12),rv('education',7,6,1,4),rv('skills',7,3,5,4),rv('software',10,3,5,4),rv('achievement',7,6,9,4)]),
    mk('gen-s06','Split · Photo Identity',[img(0,1,6,1,7),rv('title',1,6,8,2),rv('meta',1,6,10,3),rv('bio',7,6,1,4),rv('education',7,6,5,4),rv('skills',7,3,9,4),rv('software',10,3,9,4)]),
    mk('gen-s07','Split · Text + Photo',[rv('title',1,5,1,3),rv('subtitle',1,5,4,1),rv('bio',1,5,5,5),rv('meta',1,5,10,3),img(0,6,1,1,12),rv('education',7,6,1,5),rv('skills',7,3,6,4),rv('software',10,3,6,4),rv('achievement',7,6,10,3)]),
    mk('gen-s08','Split · Photo Corner',[img(0,1,4,1,9),rv('title',5,2,3,3),rv('bio',5,2,6,4),rv('meta',5,2,10,3),rv('education',7,6,1,5),rv('skills',7,3,6,4),rv('software',10,3,6,4),rv('achievement',7,6,10,3)]),
    mk('gen-s09','Split · Thin Accent Strip',[rv('title',1,6,1,2),rv('bio',1,6,3,7),rv('meta',1,6,10,3),img(0,7,1,1,12),rv('education',8,5,1,5),rv('skills',8,3,6,4),rv('software',11,2,6,4),rv('achievement',8,5,10,3)]),
    mk('gen-s10','Split · Info Grid',[rv('title',1,6,1,2),rv('meta',1,3,3,10),rv('bio',4,3,3,5),rv('interest',4,3,8,5),rv('education',7,6,1,4),rv('skills',7,3,5,4),rv('software',10,3,5,4),rv('achievement',7,6,9,4)]),
    // ── GRID: modular block system ──────────────────────────────────────────
    mk('gen-g01','Grid · 2×2 Blocks',[img(0,1,3,1,6),rv('title',4,3,1,3),rv('meta',4,3,4,3),rv('bio',1,6,7,6),rv('education',7,6,1,6),rv('skills',7,3,7,6),rv('software',10,3,7,6)]),
    mk('gen-g02','Grid · 3-Col Right',[rv('title',1,6,1,2),img(0,1,6,3,8),rv('meta',1,6,11,2),rv('education',7,4,1,12),rv('skills',11,2,1,6),rv('achievement',11,2,7,6)]),
    mk('gen-g03','Grid · Uniform Cells',[img(0,1,3,1,4),rv('title',4,3,1,4),rv('bio',1,3,5,8),rv('meta',4,3,5,4),rv('interest',4,3,9,4),rv('education',7,6,1,4),rv('skills',7,3,5,4),rv('software',10,3,5,4),rv('achievement',7,6,9,4)]),
    mk('gen-g04','Grid · Bento Box',[img(0,1,3,1,6),rv('title',4,3,1,3),rv('subtitle',4,3,4,3),rv('bio',1,6,7,4),rv('meta',1,6,11,2),rv('education',7,3,1,6),rv('skills',10,3,1,6),rv('achievement',7,6,7,4),rv('software',7,6,11,2)]),
    mk('gen-g05','Grid · Timeline Layout',[rv('title',1,6,1,2),rv('meta',1,6,3,1),rv('bio',1,6,4,4),rv('skills',1,3,8,5),rv('software',4,3,8,5),rv('education',7,6,1,6),rv('achievement',7,6,7,6)]),
    mk('gen-g06','Grid · 4-Block',[img(0,1,3,1,4),rv('title',4,3,1,4),img(1,1,3,5,4),rv('meta',4,3,5,4),rv('bio',1,6,9,4),rv('education',7,6,1,4),rv('skills',7,3,5,4),rv('software',10,3,5,4),rv('achievement',7,6,9,4)]),
    mk('gen-g07','Grid · Horizontal Bands',[rv('title',1,12,1,2),rv('bio',1,6,3,3),rv('meta',7,6,3,3),rv('skills',1,4,6,3),rv('software',5,4,6,3),rv('interest',9,4,6,3),rv('education',1,12,9,4)]),
    mk('gen-g08','Grid · Mixed Cells',[img(0,1,4,1,5),rv('title',5,2,1,5),rv('bio',1,6,6,4),rv('meta',1,6,10,3),rv('education',7,4,1,5),rv('skills',11,2,1,5),rv('achievement',7,6,6,4),rv('software',7,6,10,3)]),
    mk('gen-g09','Grid · Square Mosaic',[img(0,1,3,1,6),img(1,4,3,1,3),rv('title',4,3,4,3),rv('bio',1,6,7,6),rv('education',7,6,1,4),rv('skills',7,3,5,4),rv('software',10,3,5,4),rv('achievement',7,6,9,4)]),
    mk('gen-g10','Grid · Data Dashboard',[rv('title',1,6,1,1),rv('subtitle',7,6,1,1),rv('meta',1,3,2,4),rv('bio',4,3,2,4),img(0,1,6,6,7),rv('education',7,6,2,5),rv('skills',7,3,7,6),rv('software',10,3,7,6)]),
    // ── CONTEMPORARY: asymmetric modern ───────────────────────────────────
    mk('gen-t01','Contemporary · Asymmetric',[img(0,1,5,1,7),rv('title',1,5,8,3),rv('meta',6,1,1,12),rv('bio',7,6,1,3),rv('education',7,6,4,5),rv('skills',7,3,9,4),rv('software',10,3,9,4)]),
    mk('gen-t02','Contemporary · Inset Photo',[rv('title',1,6,1,3),img(0,2,4,4,7),rv('bio',1,6,11,2),rv('education',7,6,1,4),rv('skills',7,3,5,4),rv('software',10,3,5,4),rv('achievement',7,6,9,4)]),
    mk('gen-t03','Contemporary · Wide Grid',[rv('title',1,12,1,2),img(0,1,4,3,7),rv('bio',5,2,3,4),rv('meta',5,2,7,3),rv('interest',1,6,10,3),rv('education',7,6,3,5),rv('skills',7,3,8,5),rv('software',10,3,8,5)]),
    mk('gen-t04','Contemporary · Off Center',[img(0,2,5,2,8),rv('title',1,6,10,3),rv('bio',7,6,1,3),rv('education',7,6,4,4),rv('skills',7,3,8,5),rv('software',10,3,8,5)]),
    mk('gen-t05','Contemporary · Floating',[img(0,3,4,1,8),rv('title',1,2,3,4),rv('meta',1,2,7,4),rv('bio',7,6,1,3),rv('education',7,6,4,4),rv('skills',7,3,8,5),rv('software',10,3,8,5)]),
    mk('gen-t06','Contemporary · Column Shift',[rv('title',1,6,1,2),img(0,1,3,3,9),rv('bio',4,3,3,4),rv('meta',4,3,7,4),rv('interest',1,6,12,1),rv('education',7,6,1,5),rv('skills',7,3,6,4),rv('software',10,3,6,4),rv('achievement',7,6,10,3)]),
    mk('gen-t07','Contemporary · Dynamic Split',[img(0,1,5,1,10),rv('title',1,6,11,2),rv('bio',7,6,1,3),rv('education',7,6,4,4),rv('skills',7,3,8,5),rv('software',10,3,8,5)]),
    mk('gen-t08','Contemporary · Layer',[img(0,1,6,1,5),rv('title',1,6,6,2),rv('bio',1,6,8,5),rv('education',7,6,1,4),rv('skills',7,6,5,4),rv('achievement',7,6,9,4)]),
    mk('gen-t09','Contemporary · Stepped',[rv('title',1,4,1,3),rv('subtitle',5,2,2,2),img(0,1,4,4,8),rv('bio',5,2,4,6),rv('meta',5,2,10,3),rv('education',7,6,1,4),rv('skills',7,3,5,4),rv('software',10,3,5,4),rv('achievement',7,6,9,4)]),
    mk('gen-t10','Contemporary · Frame',[img(0,2,5,2,10),rv('title',1,6,12,1),rv('bio',7,6,1,3),rv('education',7,6,4,4),rv('skills',7,3,8,5),rv('software',10,3,8,5)]),
    // ── EXPERIMENTAL: unconventional compositions ──────────────────────────
    mk('gen-x01','Experimental · Vertical Bands',[img(0,1,2,1,12),img(1,3,2,1,12),rv('title',5,2,1,4),rv('bio',5,2,5,4),rv('meta',5,2,9,4),rv('education',7,3,1,8),rv('skills',10,3,1,8),rv('achievement',7,6,9,4)]),
    mk('gen-x02','Experimental · Wraparound',[img(0,1,6,1,4),rv('title',1,6,5,2),rv('bio',1,6,7,6),rv('education',7,6,1,3),img(1,7,6,4,5),rv('skills',7,6,9,4)]),
    mk('gen-x03','Experimental · Triptych Left',[img(0,1,2,1,12),img(1,3,2,1,12),img(2,5,2,1,12),rv('title',7,6,1,3),rv('bio',7,6,4,3),rv('education',7,6,7,3),rv('skills',7,6,10,3)]),
    mk('gen-x04','Experimental · Diagonal Grid',[img(0,1,4,1,8),rv('title',5,2,1,3),img(1,5,2,4,5),rv('meta',5,2,9,4),rv('bio',7,6,1,3),rv('education',7,6,4,4),rv('skills',7,3,8,5),rv('software',10,3,8,5)]),
    mk('gen-x05','Experimental · Oversized Initial',[rv('title',1,12,1,5),rv('subtitle',1,6,6,1),rv('bio',1,6,7,6),rv('education',7,6,6,4),rv('skills',7,6,10,3)]),
    mk('gen-x06','Experimental · Four Panels',[img(0,1,3,1,6),rv('title',4,3,1,3),rv('subtitle',4,3,4,3),rv('bio',1,3,7,6),rv('meta',4,3,7,6),rv('education',7,6,1,4),rv('skills',7,3,5,4),rv('software',10,3,5,4),rv('achievement',7,6,9,4)]),
    mk('gen-x07','Experimental · Type Grid',[rv('title',1,12,1,3),rv('meta',1,4,4,3),rv('subtitle',5,4,4,3),rv('interest',9,4,4,3),rv('bio',1,6,7,6),rv('education',7,6,4,4),rv('skills',7,3,8,5),rv('software',10,3,8,5)]),
    mk('gen-x08','Experimental · Strip Grid',[img(0,1,6,1,3),img(1,7,6,1,3),rv('title',1,12,4,2),rv('bio',1,6,6,7),rv('education',7,6,6,3),rv('skills',7,3,9,4),rv('software',10,3,9,4)]),
    mk('gen-x09','Experimental · Corner Anchor',[img(0,4,3,4,6),rv('title',1,3,1,3),rv('subtitle',1,3,4,3),rv('meta',1,3,7,6),rv('bio',7,6,1,3),rv('education',7,6,4,4),rv('skills',7,3,8,5),rv('software',10,3,8,5)]),
    mk('gen-x10','Experimental · Panoramic Band',[img(0,1,12,4,5),rv('title',1,6,1,3),rv('meta',7,6,1,3),rv('bio',1,6,9,4),rv('education',7,6,9,4)]),
  ]
}

function generateProjectSpreads100(): LayoutSpec[] {
  const mk = (id: string, n: string, r: Region[]): LayoutSpec => ({
    id, name: n, category: 'Spread' as LayoutCategory, suits: ['project'] as PageType[],
    imageCount: r.filter(x => x.role === 'image').length, regions: r,
  })
  return [
    // ── SINGLE IMAGE: one dominant photo ──────────────────────────────────
    mk('proj-s01','Project · Hero Left',[img(0,1,7,1,12),rv('title',8,5,1,2),rv('subtitle',8,5,3,1),rv('text',8,5,4,6),rv('meta',8,5,10,3)]),
    mk('proj-s02','Project · Hero Right',[rv('title',1,5,2,2),rv('subtitle',1,5,4,1),rv('text',1,5,5,5),rv('meta',1,5,10,3),img(0,6,7,1,12)]),
    mk('proj-s03','Project · Full Spread',[img(0,1,12,1,9),rv('title',1,6,10,2),rv('text',1,6,12,1),rv('meta',7,6,10,3)]),
    mk('proj-s04','Project · Top Band',[img(0,1,12,1,5),rv('title',1,6,6,3),rv('text',1,6,9,4),rv('meta',7,6,6,3),rv('legend',7,6,9,4)]),
    mk('proj-s05','Project · Bottom Image',[rv('title',1,6,1,2),rv('text',1,6,3,5),rv('meta',7,6,1,3),rv('legend',7,6,4,4),img(0,1,12,8,5)]),
    mk('proj-s06','Project · Left Column',[img(0,1,6,1,12),rv('title',7,6,2,2),rv('text',7,6,4,5),rv('meta',7,6,9,2),rv('legend',7,6,11,2)]),
    mk('proj-s07','Project · Right Column',[rv('title',1,5,2,2),rv('text',1,5,4,6),rv('legend',1,5,10,3),img(0,6,7,1,12)]),
    mk('proj-s08','Project · Inset Image',[rv('title',1,6,1,3),img(0,2,5,4,7),rv('meta',1,6,11,2),rv('text',7,6,1,6),rv('legend',7,6,7,6)]),
    mk('proj-s09','Project · Upper Third',[img(0,1,12,1,7),rv('title',1,4,8,2),rv('text',1,4,10,3),rv('legend',5,4,8,5),rv('meta',9,4,8,5)]),
    mk('proj-s10','Project · Side Strip',[img(0,1,1,1,12),img(1,2,7,1,12),rv('title',9,4,1,2),rv('text',9,4,3,7),rv('meta',9,4,10,3)]),
    mk('proj-s11','Project · Left 2/3',[img(0,1,8,1,12),rv('title',9,4,2,2),rv('text',9,4,4,6),rv('meta',9,4,10,3)]),
    mk('proj-s12','Project · Tall Right',[rv('title',1,5,1,2),rv('text',1,5,3,7),rv('meta',1,5,10,3),img(0,6,7,1,12)]),
    mk('proj-s13','Project · Corner Fill',[img(0,1,8,1,9),rv('title',1,6,10,2),rv('meta',1,6,12,1),rv('text',9,4,1,9),rv('legend',9,4,10,3)]),
    mk('proj-s14','Project · Centered Image',[rv('title',1,5,1,2),img(0,2,9,3,8),rv('text',1,5,11,2),rv('meta',8,5,11,2)]),
    mk('proj-s15','Project · Lower Split',[img(0,1,12,7,6),rv('title',1,4,1,2),rv('text',1,4,3,4),rv('legend',5,4,1,6),rv('meta',9,4,1,6)]),
    mk('proj-s16','Project · Magazine Cover',[img(0,1,6,1,10),rv('title',1,6,11,2),rv('text',7,6,1,6),rv('meta',7,6,7,3),rv('legend',7,6,10,3)]),
    mk('proj-s17','Project · Landscape Strip',[img(0,1,12,3,6),rv('title',1,6,1,2),rv('meta',7,6,1,2),rv('text',1,5,9,4),rv('legend',7,6,9,4)]),
    mk('proj-s18','Project · Right Third',[rv('title',1,8,1,2),rv('text',1,5,3,9),rv('meta',1,5,12,1),img(0,6,3,3,10),rv('legend',9,4,3,10)]),
    mk('proj-s19','Project · Overlay Caption',[img(0,1,9,1,12),rv('title',10,3,1,3),rv('text',10,3,4,7),rv('meta',10,3,11,2)]),
    mk('proj-s20','Project · Wide Text',[img(0,1,5,1,12),rv('title',6,7,1,2),rv('text',6,7,3,7),rv('meta',6,7,10,3)]),
    // ── TWO IMAGES ────────────────────────────────────────────────────────
    mk('proj-d01','Duo · Side by Side',[img(0,1,6,1,12),img(1,7,6,1,12)]),
    mk('proj-d02','Duo · Left Big Right Small',[img(0,1,7,1,12),img(1,8,5,4,6),rv('title',8,5,1,3),rv('text',8,5,10,3)]),
    mk('proj-d03','Duo · Stacked Left',[img(0,1,6,1,6),img(1,1,6,7,6),rv('title',7,6,1,3),rv('text',7,6,4,6),rv('meta',7,6,10,3)]),
    mk('proj-d04','Duo · Stacked Right',[rv('title',1,6,1,2),rv('text',1,6,3,7),rv('meta',1,6,10,3),img(0,7,6,1,6),img(1,7,6,7,6)]),
    mk('proj-d05','Duo · Asymmetric Heights',[img(0,1,6,1,8),img(1,7,6,3,9),rv('title',1,6,9,2),rv('meta',1,6,11,2),rv('text',7,6,12,1)]),
    mk('proj-d06','Duo · Horizontal Strip',[img(0,1,6,4,5),img(1,7,6,4,5),rv('title',1,6,1,3),rv('text',1,6,9,4),rv('meta',7,6,1,3),rv('legend',7,6,9,4)]),
    mk('proj-d07','Duo · Featured + Inset',[img(0,1,9,1,12),img(1,10,3,5,5),rv('title',10,3,1,4),rv('text',10,3,10,3)]),
    mk('proj-d08','Duo · Text Between',[img(0,1,4,1,12),rv('title',5,4,1,3),rv('text',5,4,4,6),rv('meta',5,4,10,3),img(1,9,4,1,12)]),
    mk('proj-d09','Duo · Lower Band',[img(0,1,6,1,5),img(1,7,6,1,5),rv('title',1,6,6,3),rv('text',1,6,9,4),rv('legend',7,6,6,3),rv('meta',7,6,9,4)]),
    mk('proj-d10','Duo · One Full One Small',[img(0,1,6,1,12),img(1,7,6,1,5),rv('title',7,6,6,3),rv('text',7,6,9,4)]),
    mk('proj-d11','Duo · Overlapping',[img(0,1,7,1,10),img(1,5,8,4,9),rv('title',1,4,11,2),rv('meta',8,5,11,2)]),
    mk('proj-d12','Duo · Editorial Pair',[img(0,1,6,2,8),img(1,7,6,2,8),rv('title',1,6,1,1),rv('meta',7,6,1,1),rv('text',1,12,10,3)]),
    mk('proj-d13','Duo · Plan + Render',[img(0,1,6,1,7),img(1,7,6,1,7),rv('title',1,12,8,2),rv('text',1,6,10,3),rv('meta',7,6,10,3)]),
    mk('proj-d14','Duo · Section + Plan',[img(0,1,12,1,6),img(1,1,6,7,6),rv('title',7,6,7,2),rv('text',7,6,9,4)]),
    mk('proj-d15','Duo · Vertical + Square',[img(0,1,4,1,12),img(1,5,5,1,8),rv('title',5,5,9,2),rv('meta',5,5,11,2),rv('text',10,3,1,12)]),
    // ── THREE IMAGES ──────────────────────────────────────────────────────
    mk('proj-t01','Trio · Hero + Pair Right',[img(0,1,6,1,12),img(1,7,6,1,6),img(2,7,6,7,6)]),
    mk('proj-t02','Trio · Hero + Pair Bottom',[img(0,1,12,1,7),img(1,1,6,8,5),img(2,7,6,8,5)]),
    mk('proj-t03','Trio · Triptych',[img(0,1,4,1,12),img(1,5,4,1,12),img(2,9,4,1,12)]),
    mk('proj-t04','Trio · Feature Left + Stack',[img(0,1,7,1,12),img(1,8,5,1,5),img(2,8,5,7,5),rv('text',8,5,12,1)]),
    mk('proj-t05','Trio · Stack Left + Feature',[img(0,1,5,1,5),img(1,1,5,7,5),img(2,6,7,1,12),rv('text',1,5,12,1)]),
    mk('proj-t06','Trio · Equal Grid',[img(0,1,6,1,6),img(1,7,6,1,6),img(2,1,6,7,6),rv('title',7,6,7,3),rv('text',7,6,10,3)]),
    mk('proj-t07','Trio · Band + Two',[img(0,1,12,1,5),img(1,1,6,6,7),img(2,7,6,6,7)]),
    mk('proj-t08','Trio · Strip Bottom',[img(0,1,6,1,7),rv('title',7,6,1,3),rv('text',7,6,4,4),img(1,1,6,8,5),img(2,7,6,8,5)]),
    mk('proj-t09','Trio · Asymmetric',[img(0,1,5,1,9),img(1,6,4,1,4),img(2,6,4,5,4),rv('title',10,3,1,4),rv('text',10,3,5,8)]),
    mk('proj-t10','Trio · Diagonal',[img(0,1,6,1,8),img(1,4,5,9,4),img(2,7,6,1,5),rv('title',7,6,6,3),rv('meta',7,6,9,4)]),
    mk('proj-t11','Trio · Cross Layout',[img(0,1,6,1,6),img(1,7,6,7,6),img(2,1,12,7,3),rv('title',1,6,10,3),rv('text',7,6,1,3)]),
    mk('proj-t12','Trio · Text Middle',[img(0,1,4,1,12),rv('title',5,4,1,3),rv('text',5,4,4,6),rv('meta',5,4,10,3),img(1,9,2,1,6),img(2,11,2,1,6)]),
    mk('proj-t13','Trio · Magazine',[img(0,1,8,1,7),img(1,9,4,1,5),img(2,9,4,6,2),rv('title',1,6,8,2),rv('text',1,6,10,3),rv('meta',7,2,8,5)]),
    mk('proj-t14','Trio · Plan Set',[img(0,1,6,1,6),img(1,7,3,1,6),img(2,10,3,1,6),rv('title',1,12,7,2),rv('text',1,6,9,4),rv('meta',7,6,9,4)]),
    mk('proj-t15','Trio · Staggered',[img(0,1,5,1,5),img(1,3,5,6,5),img(2,5,5,11,2),rv('title',10,3,1,5),rv('text',10,3,6,7)]),
    // ── FOUR+ IMAGES ──────────────────────────────────────────────────────
    mk('proj-q01','Quad · 2×2 Grid',[img(0,1,6,1,6),img(1,7,6,1,6),img(2,1,6,7,6),img(3,7,6,7,6)]),
    mk('proj-q02','Quad · Hero + Three',[img(0,1,6,1,12),img(1,7,6,1,4),img(2,7,6,5,4),img(3,7,6,9,4)]),
    mk('proj-q03','Quad · Three + One',[img(0,1,6,1,4),img(1,1,6,5,4),img(2,1,6,9,4),img(3,7,6,1,12)]),
    mk('proj-q04','Quad · Filmstrip',[img(0,1,3,1,12),img(1,4,3,1,12),img(2,7,3,1,12),img(3,10,3,1,12)]),
    mk('proj-q05','Quad · Cross',[img(0,1,6,1,6),img(1,7,6,1,6),img(2,1,6,7,6),img(3,7,6,7,6)]),
    mk('proj-q06','Quad · Strip + Feature',[img(0,1,12,1,4),img(1,1,4,5,8),img(2,5,4,5,8),img(3,9,4,5,8)]),
    mk('proj-q07','Quad · Feature + Strip',[img(0,1,8,1,9),img(1,1,3,10,3),img(2,4,3,10,3),img(3,7,3,10,3),rv('title',10,3,1,5),rv('text',10,3,6,7)]),
    mk('proj-q08','Quad · Mosaic A',[img(0,1,4,1,6),img(1,5,8,1,6),img(2,1,8,7,6),img(3,9,4,7,6)]),
    mk('proj-q09','Quad · Mosaic B',[img(0,1,8,1,6),img(1,9,4,1,6),img(2,1,4,7,6),img(3,5,8,7,6)]),
    mk('proj-q10','Quad · Text Column',[rv('title',1,4,1,2),rv('text',1,4,3,7),rv('meta',1,4,10,3),img(0,5,4,1,6),img(1,9,4,1,6),img(2,5,4,7,6),img(3,9,4,7,6)]),
    // ── FIVE IMAGES: gallery style ─────────────────────────────────────────
    mk('proj-f01','Gallery · Contact Sheet',[img(0,1,4,1,4),img(1,5,4,1,4),img(2,9,4,1,4),img(3,1,4,5,4),img(4,5,4,5,4),img(5,9,4,5,4),rv('title',1,12,9,2),rv('meta',1,12,11,2)]),
    mk('proj-f02','Gallery · Feature + Four',[img(0,1,6,1,12),img(1,7,3,1,3),img(2,10,3,1,3),img(3,7,3,4,3),img(4,10,3,4,3),rv('title',7,6,7,3),rv('text',7,6,10,3)]),
    mk('proj-f03','Gallery · Top Row',[img(0,1,3,1,4),img(1,4,3,1,4),img(2,7,3,1,4),img(3,10,3,1,4),rv('title',1,6,5,3),rv('text',1,6,8,5),rv('meta',7,6,5,8)]),
    mk('proj-f04','Gallery · Mosaic',[img(0,1,4,1,8),img(1,5,4,1,4),img(2,9,4,1,4),img(3,5,4,5,4),img(4,9,4,5,4),rv('text',1,12,9,4)]),
    mk('proj-f05','Gallery · Strip + Text',[img(0,1,3,1,12),img(1,4,3,1,12),img(2,7,3,1,12),img(3,10,3,1,5),rv('title',10,3,6,3),rv('text',10,3,9,4)]),
  ]
}

function generateContentSpreads100(): LayoutSpec[] {
  const mk = (id: string, n: string, r: Region[]): LayoutSpec => ({
    id, name: n, category: 'Spread' as LayoutCategory, suits: ['project', 'about'] as PageType[],
    imageCount: r.filter(x => x.role === 'image').length, regions: r,
  })
  return [
    // ── TEXT HEAVY: editorial, analysis ───────────────────────────────────
    mk('cont-t01','Analysis · Two Column',[rv('title',1,12,1,2),rv('text',1,6,3,10),rv('meta',7,6,3,5),rv('legend',7,6,8,5)]),
    mk('cont-t02','Analysis · Wide Column',[rv('title',1,12,1,2),rv('text',1,8,3,10),rv('meta',9,4,3,10)]),
    mk('cont-t03','Analysis · Three Column',[rv('title',1,12,1,2),rv('text',1,4,3,10),rv('legend',5,4,3,10),rv('meta',9,4,3,10)]),
    mk('cont-t04','Analysis · Sidebar Right',[rv('title',1,9,1,2),rv('text',1,9,3,10),rv('meta',10,3,1,12)]),
    mk('cont-t05','Analysis · Sidebar Left',[rv('meta',1,3,1,12),rv('title',4,9,1,2),rv('text',4,9,3,10)]),
    mk('cont-t06','Process · Title + Body',[rv('title',1,12,2,3),rv('subtitle',1,12,5,1),rv('text',1,6,7,6),rv('legend',7,6,7,6)]),
    mk('cont-t07','Process · Statement',[rv('title',2,10,4,3),rv('text',2,5,8,5),rv('meta',7,5,8,5)]),
    mk('cont-t08','Process · Text + Caption',[rv('title',1,6,1,2),rv('text',1,6,3,9),rv('subtitle',1,6,12,1),rv('legend',7,6,1,12)]),
    mk('cont-t09','Process · Dense',[rv('title',1,12,1,1),rv('text',1,4,2,8),rv('meta',5,4,2,5),rv('legend',5,4,7,4),rv('subtitle',9,4,2,12)]),
    mk('cont-t10','Process · Minimal Text',[rv('title',3,6,4,3),rv('text',3,6,8,5)]),
    // ── IMAGE + TEXT: balanced layouts ────────────────────────────────────
    mk('cont-i01','Mixed · Left Image Text',[img(0,1,5,1,12),rv('title',6,7,1,2),rv('text',6,7,3,6),rv('legend',6,7,9,4)]),
    mk('cont-i02','Mixed · Right Image Text',[rv('title',1,5,1,2),rv('text',1,5,3,7),rv('legend',1,5,10,3),img(0,6,7,1,12)]),
    mk('cont-i03','Mixed · Top Image',[img(0,1,12,1,5),rv('title',1,6,6,2),rv('text',1,6,8,5),rv('legend',7,6,6,7)]),
    mk('cont-i04','Mixed · Bottom Image',[rv('title',1,6,1,2),rv('text',1,6,3,4),rv('legend',7,6,1,7),img(0,1,12,8,5)]),
    mk('cont-i05','Mixed · Inset Image',[rv('title',1,12,1,2),rv('text',1,6,3,5),img(0,2,5,8,5),rv('legend',7,6,3,10)]),
    mk('cont-i06','Mixed · Side by Side',[img(0,1,6,1,8),rv('title',7,6,1,2),rv('text',7,6,3,7),rv('meta',7,6,10,3)]),
    mk('cont-i07','Mixed · Image Band',[img(0,1,12,4,4),rv('title',1,6,1,3),rv('text',1,6,8,5),rv('legend',7,6,8,5)]),
    mk('cont-i08','Mixed · Diagram Focus',[img(0,4,6,3,8),rv('title',1,3,1,4),rv('text',1,3,5,8),rv('legend',10,3,1,12)]),
    mk('cont-i09','Mixed · Plan Focus',[img(0,1,7,1,10),rv('title',8,5,1,2),rv('legend',8,5,3,6),rv('meta',8,5,9,4)]),
    mk('cont-i10','Mixed · Section Focus',[img(0,1,12,1,7),rv('title',1,4,8,2),rv('text',1,4,10,3),rv('legend',5,4,8,5),rv('meta',9,4,8,5)]),
    // ── ANALYSIS: diagram-heavy ────────────────────────────────────────────
    mk('cont-a01','Diagram · Single Focus',[img(0,2,9,2,9),rv('title',1,12,1,1),rv('text',1,5,11,2),rv('meta',7,6,11,2)]),
    mk('cont-a02','Diagram · Two Diagrams',[img(0,1,6,2,9),img(1,7,6,2,9),rv('title',1,12,1,1),rv('text',1,12,11,2)]),
    mk('cont-a03','Diagram · Three Diagrams',[img(0,1,4,2,9),img(1,5,4,2,9),img(2,9,4,2,9),rv('title',1,12,1,1),rv('text',1,12,11,2)]),
    mk('cont-a04','Diagram · Annotated',[img(0,1,8,1,9),rv('title',9,4,1,3),rv('text',9,4,4,6),rv('legend',9,4,10,3)]),
    mk('cont-a05','Diagram · Caption Below',[img(0,1,12,1,8),rv('title',1,5,9,2),rv('text',6,7,9,4)]),
    mk('cont-a06','Diagram · Left Panel',[img(0,1,5,3,9),rv('title',1,5,1,2),rv('text',6,7,1,6),rv('legend',6,7,7,6)]),
    mk('cont-a07','Diagram · Matrix',[img(0,1,4,1,6),img(1,5,4,1,6),img(2,9,4,1,6),img(3,1,6,7,6),rv('legend',7,6,7,6)]),
    mk('cont-a08','Diagram · Grid Caption',[img(0,1,4,1,4),img(1,5,4,1,4),img(2,9,4,1,4),rv('title',1,12,5,2),rv('text',1,6,7,6),rv('legend',7,6,7,6)]),
    mk('cont-a09','Diagram · Exploded',[img(0,3,9,1,8),rv('title',1,2,1,12),rv('text',12,1,1,12)]),
    mk('cont-a10','Diagram · Study',[img(0,1,6,1,7),rv('title',7,6,1,2),rv('text',7,6,3,5),rv('legend',1,6,8,5),rv('meta',7,6,8,5)]),
    // ── TECHNICAL: plans, sections ────────────────────────────────────────
    mk('cont-p01','Technical · Plan + Text',[img(0,1,7,3,9),rv('title',1,7,1,2),rv('text',8,5,1,7),rv('meta',8,5,8,5)]),
    mk('cont-p02','Technical · Section + Plan',[img(0,1,12,1,5),img(1,1,6,6,7),rv('title',7,6,6,2),rv('text',7,6,8,5)]),
    mk('cont-p03','Technical · Elevation',[img(0,1,12,3,6),rv('title',1,6,1,2),rv('meta',7,6,1,2),rv('text',1,5,9,4),rv('legend',7,6,9,4)]),
    mk('cont-p04','Technical · Detail Sheet',[img(0,1,6,1,6),img(1,7,6,1,6),img(2,1,6,7,6),rv('legend',7,6,7,6)]),
    mk('cont-p05','Technical · Plan Set',[img(0,1,4,1,12),img(1,5,4,1,12),img(2,9,4,1,12)]),
    mk('cont-p06','Technical · Site Plan',[img(0,1,8,1,12),rv('title',9,4,1,2),rv('text',9,4,3,6),rv('meta',9,4,9,4)]),
    mk('cont-p07','Technical · Floor Plan',[img(0,2,10,2,10),rv('title',1,12,1,1),rv('legend',1,5,11,2),rv('meta',7,6,11,2)]),
    mk('cont-p08','Technical · Section Study',[img(0,1,12,1,8),img(1,1,6,9,4),rv('legend',7,6,9,4)]),
    mk('cont-p09','Technical · Render + Plan',[img(0,1,6,1,9),img(1,7,6,1,6),rv('title',7,6,7,2),rv('legend',7,6,9,4)]),
    mk('cont-p10','Technical · Three Drawing',[img(0,1,6,1,7),img(1,7,6,1,7),img(2,1,12,8,5)]),
    // ── EDITORIAL: magazine, luxury ───────────────────────────────────────
    mk('cont-e01','Editorial · Pull Quote',[img(0,1,5,1,12),rv('title',6,7,3,3),rv('text',6,7,7,6)]),
    mk('cont-e02','Editorial · Two Page Text',[rv('title',1,12,1,2),rv('text',1,6,4,9),rv('subtitle',7,6,4,2),rv('meta',7,6,7,6)]),
    mk('cont-e03','Editorial · Image Column',[img(0,1,2,1,12),rv('title',3,10,1,2),rv('text',3,10,4,9)]),
    mk('cont-e04','Editorial · Feature Image',[img(0,3,8,2,9),rv('title',1,12,1,1),rv('text',1,2,11,2),rv('meta',11,2,11,2)]),
    mk('cont-e05','Editorial · Magazine Grid',[img(0,1,6,1,7),img(1,7,4,1,4),rv('title',11,2,1,4),img(2,7,4,5,3),rv('text',7,6,8,5)]),
    mk('cont-e06','Editorial · Luxury Spread',[img(0,1,5,2,10),rv('title',1,12,1,1),rv('text',6,7,2,5),rv('meta',6,7,7,6)]),
    mk('cont-e07','Editorial · Academic',[rv('title',1,12,1,2),img(0,1,4,3,6),rv('text',5,8,3,6),rv('legend',1,12,9,4)]),
    mk('cont-e08','Editorial · Poster',[img(0,1,12,1,7),rv('title',2,10,8,3),rv('text',2,10,11,2)]),
    mk('cont-e09','Editorial · Landscape',[img(0,1,6,1,12),rv('title',7,6,2,3),rv('text',7,6,6,7)]),
    mk('cont-e10','Editorial · Spread Title',[rv('title',1,12,4,4),rv('subtitle',3,8,8,1),rv('text',1,6,10,3),rv('meta',7,6,10,3)]),
    // ── PROCESS: documentation, narrative ─────────────────────────────────
    mk('cont-r01','Process · Sketch + Photo',[img(0,1,6,1,6),img(1,1,6,7,6),img(2,7,6,1,6),rv('title',7,6,7,2),rv('text',7,6,9,4)]),
    mk('cont-r02','Process · Steps',[rv('title',1,12,1,2),img(0,1,3,3,5),img(1,4,3,3,5),img(2,7,3,3,5),img(3,10,3,3,5),rv('text',1,6,8,5),rv('legend',7,6,8,5)]),
    mk('cont-r03','Process · Iteration',[img(0,1,4,1,5),img(1,5,4,1,5),img(2,9,4,1,5),img(3,1,6,6,7),rv('title',7,6,6,2),rv('text',7,6,8,5)]),
    mk('cont-r04','Process · Concept',[img(0,4,6,3,7),rv('title',1,3,1,5),rv('text',10,3,1,5),rv('subtitle',1,12,1,2),rv('legend',1,12,10,3)]),
    mk('cont-r05','Process · Timeline',[rv('title',1,12,1,2),img(0,1,3,3,5),rv('subtitle',1,3,8,2),img(1,4,3,3,5),rv('subtitle',4,3,8,2),img(2,7,3,3,5),rv('subtitle',7,3,8,2),img(3,10,3,3,5),rv('subtitle',10,3,8,2)]),
    mk('cont-r06','Process · Model Photos',[img(0,1,6,1,6),img(1,7,3,1,3),img(2,10,3,1,3),img(3,7,3,4,3),img(4,10,3,4,3),rv('title',1,6,7,3),rv('text',1,6,10,3)]),
    mk('cont-r07','Process · Research Board',[img(0,1,4,1,4),img(1,1,4,5,4),img(2,5,4,1,4),rv('text',5,4,5,8),img(3,9,4,1,8),rv('legend',1,12,9,4)]),
    mk('cont-r08','Process · Site Photos',[img(0,1,4,1,8),img(1,5,4,1,4),img(2,5,4,5,4),img(3,9,4,1,4),img(4,9,4,5,4),rv('title',1,12,9,2),rv('text',1,12,11,2)]),
    mk('cont-r09','Process · Parti Diagram',[img(0,2,4,3,8),img(1,6,4,3,4),rv('title',1,12,1,2),rv('text',6,4,7,6),rv('legend',10,3,1,12)]),
    mk('cont-r10','Process · Full Documentation',[img(0,1,6,1,6),img(1,7,3,1,6),img(2,10,3,1,3),img(3,10,3,4,3),rv('title',1,12,7,2),rv('text',1,6,9,4),rv('legend',7,6,9,4)]),
  ]
}

function generateEndPages100(): LayoutSpec[] {
  const mk = (id: string, n: string, r: Region[]): LayoutSpec => ({
    id, name: n, category: 'Contact' as LayoutCategory, suits: ['contact'] as PageType[],
    imageCount: r.filter(x => x.role === 'image').length, regions: r,
  })
  return [
    // ── TYPOGRAPHIC: text-only closing ────────────────────────────────────
    mk('end-ty01','Closing · Centered',[rv('title',2,10,4,3),rv('text',3,8,7,3),rv('meta',3,8,10,3)]),
    mk('end-ty02','Closing · Left Aligned',[rv('title',1,8,3,3),rv('text',1,8,6,4),rv('meta',1,8,10,3)]),
    mk('end-ty03','Closing · Bottom Anchor',[rv('title',1,12,8,2),rv('text',2,10,10,2),rv('meta',3,8,12,1)]),
    mk('end-ty04','Closing · Top Anchor',[rv('title',1,12,2,2),rv('text',2,10,4,2),rv('meta',3,8,6,2)]),
    mk('end-ty05','Closing · Stacked',[rv('title',3,8,2,2),rv('subtitle',3,8,4,1),rv('text',3,8,6,4),rv('meta',3,8,10,3)]),
    mk('end-ty06','Closing · Minimal Single',[rv('title',4,6,5,3),rv('meta',4,6,8,2)]),
    mk('end-ty07','Closing · Split',[rv('title',1,5,3,3),rv('text',1,5,6,7),rv('meta',7,6,3,10)]),
    mk('end-ty08','Closing · Wide Title',[rv('title',1,12,4,2),rv('subtitle',2,10,6,1),rv('meta',4,6,8,2)]),
    mk('end-ty09','Closing · Fine Print',[rv('title',1,8,5,2),rv('text',1,8,7,2),rv('meta',1,8,9,4)]),
    mk('end-ty10','Closing · Column',[rv('title',5,3,3,2),rv('text',5,3,5,5),rv('meta',5,3,10,3)]),
    // ── WITH IMAGE: photo + contact ────────────────────────────────────────
    mk('end-im01','Contact · Photo Right',[rv('title',1,5,3,3),rv('text',1,5,6,4),rv('meta',1,5,10,3),img(0,7,6,1,12)]),
    mk('end-im02','Contact · Photo Left',[img(0,1,6,1,12),rv('title',7,6,3,3),rv('text',7,6,6,4),rv('meta',7,6,10,3)]),
    mk('end-im03','Contact · Photo Top',[img(0,1,12,1,6),rv('title',1,6,7,3),rv('text',1,6,10,3),rv('meta',7,6,7,6)]),
    mk('end-im04','Contact · Photo Bottom',[rv('title',1,6,2,2),rv('text',1,6,4,4),rv('meta',7,6,2,8),img(0,1,12,9,4)]),
    mk('end-im05','Contact · Headshot',[img(0,4,5,3,8),rv('title',1,12,1,2),rv('meta',1,5,11,2),rv('text',7,6,11,2)]),
    mk('end-im06','Contact · Inset Photo',[rv('title',1,12,1,2),img(0,2,4,4,6),rv('text',7,6,2,7),rv('meta',1,12,10,3)]),
    mk('end-im07','Contact · Side Strip',[img(0,1,2,1,12),rv('title',3,10,3,3),rv('text',3,10,6,4),rv('meta',3,10,10,3)]),
    mk('end-im08','Contact · Right Strip',[rv('title',1,9,3,3),rv('text',1,9,6,4),rv('meta',1,9,10,3),img(0,11,2,1,12)]),
    mk('end-im09','Contact · Full Bleed',[img(0,1,12,1,12),rv('title',2,10,3,2),rv('text',2,10,5,3),rv('meta',2,10,8,3)]),
    mk('end-im10','Contact · Corner Photo',[img(0,8,5,8,5),rv('title',1,7,2,3),rv('text',1,7,5,5),rv('meta',1,7,10,3)]),
    // ── THANK YOU: gratitude closing ───────────────────────────────────────
    mk('end-th01','Thank You · Elegant',[rv('title',3,8,4,4),rv('subtitle',3,8,8,1),rv('meta',4,6,10,3)]),
    mk('end-th02','Thank You · With Bio',[rv('title',1,6,2,2),rv('text',1,6,4,6),rv('meta',1,6,10,3)]),
    mk('end-th03','Thank You · Centered Big',[rv('title',1,12,5,4)]),
    mk('end-th04','Thank You · Contact Grid',[rv('title',1,12,1,2),rv('meta',1,3,4,8),rv('text',4,3,4,8),rv('subtitle',7,3,4,8)]),
    mk('end-th05','Thank You · Large Photo',[img(0,1,8,1,10),rv('title',9,4,3,4),rv('meta',9,4,8,5)]),
    mk('end-th06','Thank You · Minimal',[rv('title',5,4,6,2),rv('meta',5,4,8,2)]),
    mk('end-th07','Thank You · Black Box',[rv('title',1,12,4,4),rv('subtitle',2,10,8,1),rv('meta',4,6,10,3)]),
    mk('end-th08','Thank You · Contact Strip',[rv('title',1,12,1,3),rv('meta',1,12,5,8)]),
    mk('end-th09','Thank You · With Image',[img(0,1,12,1,7),rv('title',2,10,8,3),rv('meta',3,8,11,2)]),
    mk('end-th10','Thank You · Typographic',[rv('title',1,6,3,5),rv('subtitle',7,6,5,3),rv('meta',1,12,10,3)]),
    // ── COLOPHON: credits, bibliography ───────────────────────────────────
    mk('end-co01','Colophon · Credits',[rv('title',1,12,1,2),rv('text',1,6,3,10),rv('meta',7,6,3,10)]),
    mk('end-co02','Colophon · Dense',[rv('title',1,12,1,1),rv('text',1,4,2,11),rv('meta',5,4,2,11),rv('legend',9,4,2,11)]),
    mk('end-co03','Colophon · With Logo',[img(0,1,4,1,3),rv('title',5,8,1,3),rv('text',1,6,5,8),rv('meta',7,6,5,8)]),
    mk('end-co04','Colophon · Minimal',[rv('title',3,8,2,2),rv('text',3,8,5,8)]),
    mk('end-co05','Colophon · Two Column',[rv('title',1,12,1,2),rv('text',1,6,4,9),rv('legend',7,6,4,9)]),
    // ── SOCIAL: links, QR, portfolio ──────────────────────────────────────
    mk('end-so01','Social · Center QR',[rv('title',1,12,1,2),img(0,4,5,4,6),rv('meta',1,5,11,2),rv('text',7,6,11,2)]),
    mk('end-so02','Social · Right QR',[rv('title',1,7,3,3),rv('meta',1,7,6,4),rv('text',1,7,10,3),img(0,9,4,3,8)]),
    mk('end-so03','Social · Links Row',[rv('title',1,12,3,3),rv('meta',1,12,7,3),rv('text',1,12,10,3)]),
    mk('end-so04','Social · Grid Links',[rv('title',1,12,1,2),rv('meta',1,3,4,8),rv('text',5,4,4,8),rv('legend',9,4,4,8)]),
    mk('end-so05','Social · Full Contact',[img(0,1,4,1,12),rv('title',5,8,2,2),rv('text',5,8,4,4),rv('meta',5,8,8,5)]),
    // ── ABOUT CLOSING: who am I ───────────────────────────────────────────
    mk('end-ab01','About · Photo Statement',[img(0,1,6,1,12),rv('title',7,6,2,2),rv('text',7,6,4,7),rv('meta',7,6,11,2)]),
    mk('end-ab02','About · Portrait',[img(0,3,7,2,9),rv('title',1,12,1,1),rv('meta',1,5,11,2),rv('text',6,7,11,2)]),
    mk('end-ab03','About · Text Only',[rv('title',2,9,2,2),rv('text',2,9,5,8)]),
    mk('end-ab04','About · Headshot + Bio',[img(0,1,3,2,8),rv('title',4,9,2,2),rv('text',4,9,4,7),rv('meta',1,12,10,3)]),
    mk('end-ab05','About · Full Spread',[img(0,1,12,1,7),rv('title',2,10,8,3),rv('text',2,10,11,2)]),
    // ── GALLERY END: final project view ───────────────────────────────────
    mk('end-ga01','Gallery · Four Grid',[img(0,1,6,1,6),img(1,7,6,1,6),img(2,1,6,7,6),img(3,7,6,7,6)]),
    mk('end-ga02','Gallery · Strip',[img(0,1,3,2,10),img(1,4,3,2,10),img(2,7,3,2,10),img(3,10,3,2,10),rv('meta',1,12,11,2)]),
    mk('end-ga03','Gallery · Feature',[img(0,1,8,1,12),rv('title',9,4,2,3),rv('meta',9,4,5,8)]),
    mk('end-ga04','Gallery · Mosaic',[img(0,1,4,1,8),img(1,5,8,1,4),img(2,5,4,5,4),img(3,9,4,5,4),rv('meta',1,12,9,4)]),
    mk('end-ga05','Gallery · Triptych',[img(0,1,4,1,12),img(1,5,4,1,12),img(2,9,4,1,12)]),
  ]
}

function generateExtraCovers100(): LayoutSpec[] {
  const mk = (id: string, n: string, r: Region[], overlay?: boolean): LayoutSpec => ({
    id, name: n, category: 'Cover' as LayoutCategory, suits: ['cover'] as PageType[],
    imageCount: r.filter(x => x.role === 'image').length, regions: r,
    kind: overlay ? 'overlay' : undefined,
  })
  return [
    // ── FULL BLEED variations ─────────────────────────────────────────────
    mk('gen-cv01','Cover · Full Bleed Top Title',[img(0,1,12,1,12),rv('title',1,12,1,2),rv('subtitle',1,12,3,1)],true),
    mk('gen-cv02','Cover · Full Bleed Center Title',[img(0,1,12,1,12),rv('title',2,10,5,2),rv('subtitle',2,10,7,1)],true),
    mk('gen-cv03','Cover · Full Bleed Bottom Strip',[img(0,1,12,1,12),rv('title',1,12,10,2),rv('meta',1,12,12,1)],true),
    mk('gen-cv04','Cover · Full Bleed Side Title',[img(0,1,12,1,12),rv('title',1,4,2,10),rv('subtitle',1,4,12,1)],true),
    mk('gen-cv05','Cover · Full Bleed Diagonal',[img(0,1,12,1,12),rv('title',7,6,1,3),rv('subtitle',7,6,4,1)],true),
    mk('gen-cv06','Cover · Full Bleed Minimal',[img(0,1,12,1,12),rv('title',2,10,11,2)],true),
    mk('gen-cv07','Cover · Full Bleed Corner',[img(0,1,12,1,12),rv('title',8,5,9,2),rv('meta',8,5,11,2)],true),
    mk('gen-cv08','Cover · Full Bleed Left Third',[img(0,1,12,1,12),rv('title',1,4,2,8),rv('subtitle',1,4,10,2)],true),
    mk('gen-cv09','Cover · Full Bleed Frame',[img(0,1,12,1,12),rv('title',3,8,10,2),rv('subtitle',3,8,12,1)],true),
    mk('gen-cv10','Cover · Full Bleed Centered Meta',[img(0,1,12,1,12),rv('title',2,10,4,3),rv('meta',2,10,7,2)],true),
    // ── SPLIT LEFT: image left, text right ────────────────────────────────
    mk('gen-cv11','Cover · Split 50/50',[img(0,1,6,1,12),rv('title',7,6,4,3),rv('subtitle',7,6,7,1),rv('meta',7,6,9,2)]),
    mk('gen-cv12','Cover · Split 60/40',[img(0,1,7,1,12),rv('title',8,5,3,3),rv('subtitle',8,5,6,1),rv('meta',8,5,8,2)]),
    mk('gen-cv13','Cover · Split 40/60',[img(0,1,5,1,12),rv('title',6,7,3,3),rv('subtitle',6,7,6,1),rv('meta',6,7,8,2)]),
    mk('gen-cv14','Cover · Split Centered',[img(0,1,6,1,12),rv('title',7,6,5,3),rv('meta',7,6,8,2)]),
    mk('gen-cv15','Cover · Split Tall Text',[img(0,1,6,1,12),rv('title',7,6,2,4),rv('subtitle',7,6,6,2),rv('text',7,6,8,3),rv('meta',7,6,11,2)]),
    mk('gen-cv16','Cover · Split 1/3',[img(0,1,4,1,12),rv('title',5,8,3,4),rv('subtitle',5,8,7,2),rv('meta',5,8,9,2)]),
    mk('gen-cv17','Cover · Split 2/3',[img(0,1,8,1,12),rv('title',9,4,4,4),rv('subtitle',9,4,8,2),rv('meta',9,4,10,2)]),
    mk('gen-cv18','Cover · Split Bottom Name',[img(0,1,6,1,12),rv('title',7,6,8,3),rv('meta',7,6,11,2)]),
    mk('gen-cv19','Cover · Split with Band',[img(0,1,6,1,12),rv('title',7,6,1,2),rv('subtitle',7,6,3,1),rv('meta',7,6,4,3)]),
    mk('gen-cv20','Cover · Split 3-Element',[img(0,1,6,1,12),rv('title',7,6,2,3),rv('subtitle',7,6,5,2),rv('meta',7,6,7,3)]),
    // ── SPLIT RIGHT: text left, image right ───────────────────────────────
    mk('gen-cv21','Cover · Text Left Image Right',[rv('title',1,5,4,3),rv('subtitle',1,5,7,1),rv('meta',1,5,9,2),img(0,6,7,1,12)]),
    mk('gen-cv22','Cover · Minimal Left',[rv('title',2,4,5,3),rv('meta',2,4,8,2),img(0,7,6,1,12)]),
    mk('gen-cv23','Cover · Wide Text Left',[rv('title',1,6,3,3),rv('subtitle',1,6,6,2),rv('text',1,6,8,3),img(0,7,6,1,12)]),
    mk('gen-cv24','Cover · Name Left Big Image',[rv('title',1,5,2,4),rv('meta',1,5,7,3),img(0,6,7,1,12)]),
    mk('gen-cv25','Cover · Two Panel',[rv('title',1,5,1,2),rv('subtitle',1,5,3,1),rv('meta',1,5,4,3),img(0,6,7,1,12)]),
    // ── BAND TOP: image top, text bottom ──────────────────────────────────
    mk('gen-cv26','Cover · Band Top 50%',[img(0,1,12,1,6),rv('title',1,12,7,3),rv('subtitle',1,12,10,1),rv('meta',1,12,11,2)]),
    mk('gen-cv27','Cover · Band Top 40%',[img(0,1,12,1,5),rv('title',1,12,6,3),rv('subtitle',1,12,9,2),rv('meta',1,12,11,2)]),
    mk('gen-cv28','Cover · Band Top 60%',[img(0,1,12,1,7),rv('title',1,12,8,3),rv('subtitle',1,12,11,2)]),
    mk('gen-cv29','Cover · Band Top Centered',[img(0,1,12,1,6),rv('title',2,10,8,3),rv('meta',3,8,11,2)]),
    mk('gen-cv30','Cover · Band Top Split Text',[img(0,1,12,1,5),rv('title',1,6,7,4),rv('meta',7,6,7,4)]),
    // ── BAND BOTTOM: text top, image bottom ───────────────────────────────
    mk('gen-cv31','Cover · Band Bottom 50%',[rv('title',1,12,2,3),rv('subtitle',1,12,5,1),rv('meta',1,12,6,1),img(0,1,12,7,6)]),
    mk('gen-cv32','Cover · Band Bottom 40%',[rv('title',2,10,2,3),rv('subtitle',2,10,5,1),rv('meta',2,10,6,1),img(0,1,12,8,5)]),
    mk('gen-cv33','Cover · Band Bottom 60%',[rv('title',1,12,1,2),rv('subtitle',1,12,3,1),img(0,1,12,5,8)]),
    mk('gen-cv34','Cover · Band Bottom Center Title',[rv('title',3,8,2,3),rv('meta',3,8,5,2),img(0,1,12,8,5)]),
    mk('gen-cv35','Cover · Band Bottom Minimal',[rv('title',1,12,4,3),img(0,1,12,8,5)]),
    // ── FRAMED: image inset with border ───────────────────────────────────
    mk('gen-cv36','Cover · Framed Center',[img(0,2,10,2,9),rv('title',1,12,11,2)]),
    mk('gen-cv37','Cover · Framed With Title',[img(0,2,10,3,8),rv('title',1,12,1,2),rv('meta',1,12,11,2)]),
    mk('gen-cv38','Cover · Double Frame',[img(0,3,8,2,9),rv('title',1,2,1,12),rv('meta',11,2,1,12)]),
    mk('gen-cv39','Cover · Framed Top Strip',[img(0,1,12,3,8),rv('title',2,10,1,2),rv('meta',2,10,11,2)]),
    mk('gen-cv40','Cover · Inset Portrait',[img(0,3,7,2,9),rv('title',1,12,11,2)]),
    // ── TYPOGRAPHIC: no image ─────────────────────────────────────────────
    mk('gen-cv41','Cover · Type Only Center',[rv('title',2,10,4,4),rv('subtitle',2,10,8,1),rv('meta',3,8,10,3)]),
    mk('gen-cv42','Cover · Type Only Left',[rv('title',1,10,3,4),rv('subtitle',1,10,7,1),rv('meta',1,8,9,3)]),
    mk('gen-cv43','Cover · Type Only Right',[rv('title',3,10,3,4),rv('subtitle',3,10,7,1),rv('meta',4,8,9,3)]),
    mk('gen-cv44','Cover · Big Name',[rv('title',1,12,5,5),rv('meta',2,10,10,3)]),
    mk('gen-cv45','Cover · Vertical Name',[rv('title',1,3,1,12),rv('subtitle',4,9,4,3),rv('meta',4,9,8,2)]),
    mk('gen-cv46','Cover · Type Grid',[rv('title',1,12,1,3),rv('subtitle',2,10,5,2),rv('meta',3,8,8,2),rv('text',4,6,10,3)]),
    mk('gen-cv47','Cover · Centered Minimal',[rv('title',3,8,5,3),rv('meta',4,6,9,2)]),
    mk('gen-cv48','Cover · Name Large',[rv('title',1,12,3,6),rv('meta',3,8,10,3)]),
    mk('gen-cv49','Cover · Statement',[rv('title',2,10,4,3),rv('subtitle',2,10,7,2),rv('meta',2,10,10,3)]),
    mk('gen-cv50','Cover · Spine Title',[rv('title',1,2,1,12),rv('subtitle',3,10,5,3),rv('meta',3,10,9,3)]),
    // ── CORNER: image in corner ────────────────────────────────────────────
    mk('gen-cv51','Cover · Corner TL',[img(0,1,6,1,6),rv('title',7,6,3,3),rv('subtitle',7,6,6,2),rv('meta',7,6,8,3)]),
    mk('gen-cv52','Cover · Corner TR',[img(0,7,6,1,6),rv('title',1,6,3,3),rv('subtitle',1,6,6,2),rv('meta',1,6,8,3)]),
    mk('gen-cv53','Cover · Corner BL',[img(0,1,6,7,6),rv('title',1,12,1,3),rv('subtitle',7,6,5,4),rv('meta',7,6,9,3)]),
    mk('gen-cv54','Cover · Corner BR',[img(0,7,6,7,6),rv('title',1,12,1,3),rv('subtitle',1,5,5,4),rv('meta',1,5,9,3)]),
    mk('gen-cv55','Cover · Two Corners',[img(0,1,4,1,5),img(1,9,4,8,5),rv('title',1,12,6,3),rv('meta',3,8,9,2)]),
    // ── MONDRIAN: multiple image rectangles ───────────────────────────────
    mk('gen-cv56','Cover · Mondrian 3',[img(0,1,8,1,8),img(1,9,4,1,4),img(2,9,4,5,4),rv('title',1,12,9,3)]),
    mk('gen-cv57','Cover · Mondrian 4',[img(0,1,4,1,6),img(1,5,8,1,6),img(2,1,8,7,6),img(3,9,4,7,6)]),
    mk('gen-cv58','Cover · Mondrian 2',[img(0,1,7,1,12),img(1,8,5,1,6),rv('title',8,5,7,3),rv('meta',8,5,10,3)]),
    mk('gen-cv59','Cover · Strip Grid',[img(0,1,4,1,4),img(1,5,4,1,4),img(2,9,4,1,4),rv('title',1,12,5,4),rv('subtitle',1,12,9,4)]),
    mk('gen-cv60','Cover · Mosaic',[img(0,1,6,1,6),img(1,7,6,1,3),img(2,7,6,4,3),rv('title',1,12,7,3),rv('meta',1,12,10,3)]),
    // ── EDITORIAL: inspired by architecture magazines ──────────────────────
    mk('gen-cv61','Cover · Dezeen Style',[img(0,1,12,1,10),rv('title',1,6,11,2),rv('meta',7,6,11,2)],true),
    mk('gen-cv62','Cover · Wallpaper Style',[img(0,1,12,1,12),rv('title',1,12,1,1),rv('subtitle',1,12,2,1)],true),
    mk('gen-cv63','Cover · Architectural Digest',[img(0,1,12,3,10),rv('title',2,10,1,2),rv('meta',2,10,12,1)],true),
    mk('gen-cv64','Cover · Monocle Style',[img(0,1,6,1,12),rv('title',7,6,1,2),rv('subtitle',7,6,3,2),rv('text',7,6,5,5),rv('meta',7,6,10,3)]),
    mk('gen-cv65','Cover · Domus Style',[img(0,1,12,1,7),rv('title',1,6,8,4),rv('meta',7,6,8,4)]),
    mk('gen-cv66','Cover · A10 Style',[img(0,4,9,1,12),rv('title',1,3,1,8),rv('meta',1,3,9,4)]),
    mk('gen-cv67','Cover · Frame Magazine',[img(0,2,9,1,10),rv('title',1,12,11,2)]),
    mk('gen-cv68','Cover · Icon Magazine',[img(0,1,12,4,9),rv('title',1,12,1,3),rv('meta',1,12,12,1)],true),
    mk('gen-cv69','Cover · Surface Style',[img(0,1,12,1,10),rv('title',9,4,9,2),rv('meta',1,8,11,2)],true),
    mk('gen-cv70','Cover · Metropolis',[img(0,1,12,1,12),rv('title',1,12,4,4)],true),
    // ── LUXURY: refined, minimal ───────────────────────────────────────────
    mk('gen-cv71','Cover · Luxury Centered',[img(0,3,8,2,9),rv('title',3,8,11,2)]),
    mk('gen-cv72','Cover · Luxury Strip',[img(0,1,12,4,6),rv('title',2,10,1,3),rv('meta',4,6,10,3)]),
    mk('gen-cv73','Cover · Luxury Type',[rv('title',4,6,4,4),rv('subtitle',4,6,8,1),rv('meta',5,4,10,2)]),
    mk('gen-cv74','Cover · Luxury Portrait',[img(0,4,5,2,10),rv('title',1,3,4,5),rv('meta',9,4,4,5)]),
    mk('gen-cv75','Cover · Luxury Band',[img(0,1,12,5,4),rv('title',2,10,1,4),rv('meta',4,6,9,4)]),
    // ── BOLD: strong graphic presence ─────────────────────────────────────
    mk('gen-cv76','Cover · Bold Full',[img(0,1,12,1,12),rv('title',1,12,9,4)],true),
    mk('gen-cv77','Cover · Bold Type',[rv('title',1,12,1,6),rv('subtitle',1,12,7,2),img(0,1,12,9,4)]),
    mk('gen-cv78','Cover · Bold Split',[rv('title',1,6,1,12),img(0,7,6,1,12)]),
    mk('gen-cv79','Cover · Bold Name',[rv('title',1,12,3,8),rv('meta',2,10,11,2)]),
    mk('gen-cv80','Cover · Bold Strip',[rv('title',1,12,5,4),img(0,1,12,1,4),img(1,1,12,9,4)]),
    // ── EXPERIMENTAL: unusual compositions ───────────────────────────────
    mk('gen-cv81','Cover · Diagonal',[img(0,1,12,1,12),rv('title',1,5,1,4),rv('subtitle',8,5,9,4)],true),
    mk('gen-cv82','Cover · Three Strip',[img(0,1,4,1,12),img(1,5,4,1,12),rv('title',9,4,4,5),rv('meta',9,4,9,4)]),
    mk('gen-cv83','Cover · Cross',[img(0,1,12,5,3),img(1,5,3,1,12),rv('title',9,4,1,4),rv('meta',9,4,9,4)]),
    mk('gen-cv84','Cover · Stacked',[img(0,1,12,1,4),rv('title',1,12,4,2),img(1,1,12,6,4),rv('subtitle',1,12,10,3)]),
    mk('gen-cv85','Cover · Corner Frame',[img(0,1,3,1,4),img(1,10,3,9,4),rv('title',2,10,4,5),rv('meta',3,8,9,4)]),
    mk('gen-cv86','Cover · Magazine Grid',[img(0,1,4,1,4),rv('title',5,8,1,4),img(1,1,4,5,8),img(2,5,4,5,4),img(3,9,4,5,4)]),
    mk('gen-cv87','Cover · Panorama',[img(0,1,12,1,6),img(1,1,12,7,6)]),
    mk('gen-cv88','Cover · Off Center',[img(0,2,9,2,9),rv('title',1,1,2,9),rv('meta',11,2,2,9)]),
    mk('gen-cv89','Cover · Band Triple',[img(0,1,12,1,4),img(1,1,12,5,4),img(2,1,12,9,4)]),
    mk('gen-cv90','Cover · Large Square',[img(0,2,9,2,9),rv('title',2,9,11,2)]),
    // ── ACADEMIC / COMPETITION ─────────────────────────────────────────────
    mk('gen-cv91','Cover · Competition',[img(0,1,12,1,8),rv('title',1,12,9,2),rv('subtitle',1,12,11,1),rv('meta',1,12,12,1)],true),
    mk('gen-cv92','Cover · Thesis',[rv('title',2,10,2,4),rv('subtitle',2,10,6,2),rv('meta',3,8,8,3),img(0,4,6,11,2)]),
    mk('gen-cv93','Cover · Academic',[img(0,1,12,1,5),rv('title',1,6,6,3),rv('subtitle',1,6,9,2),rv('meta',7,6,6,5)]),
    mk('gen-cv94','Cover · Scholastic',[rv('title',1,8,1,4),rv('subtitle',1,8,5,2),rv('meta',1,8,7,3),img(0,9,4,1,12)]),
    mk('gen-cv95','Cover · Research',[img(0,1,12,7,6),rv('title',2,10,1,3),rv('subtitle',2,10,4,2),rv('meta',2,10,6,1)]),
    mk('gen-cv96','Cover · Studio',[img(0,1,6,4,9),rv('title',1,6,1,3),rv('subtitle',7,6,4,3),rv('meta',7,6,7,6)]),
    mk('gen-cv97','Cover · Workshop',[img(0,3,8,3,8),rv('title',1,12,1,2),rv('meta',1,12,11,2)]),
    mk('gen-cv98','Cover · Seminar',[rv('title',1,9,3,4),img(0,10,3,1,12),rv('meta',1,9,8,5)]),
    mk('gen-cv99','Cover · Exhibition',[img(0,1,12,1,12),rv('title',1,6,4,4),rv('meta',7,6,8,4)],true),
    mk('gen-cv100','Cover · Portfolio Mark',[img(0,1,12,1,9),rv('title',1,5,10,3),rv('subtitle',6,7,10,3)],true),
  ]
}

export const RAW_LAYOUT_CATALOG: LayoutSpec[] = [
  ...SPREAD_SPECS,
  ...RESUME_SPREAD_SPECS,
  ...generateResumeSpreads100(),
  ...generateProjectSpreads100(),
  ...generateContentSpreads100(),
  ...generateEndPages100(),
  ...generateExtraCovers100(),
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
