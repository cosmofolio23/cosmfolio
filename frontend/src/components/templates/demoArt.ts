/**
 * Demo project database + parametric architectural artwork.
 *
 * Powers REALISTIC template previews: instead of empty grey boxes, every image
 * slot renders believable architecture (renders, plans, sections, elevations,
 * diagrams) drawn as inline SVG that adapts to the template's own palette — so
 * a student sees "this is how my portfolio will look", not a wireframe.
 *
 * Pure SVG, zero assets, zero dependencies. Used by TemplateSpread (gallery)
 * and available for seeding the editor with example content.
 */

export interface DemoPalette {
  primary: string
  accent: string
  bg: string
  text: string
  muted: string
}

export type ArchArtKind = 'render' | 'plan' | 'section' | 'elevation' | 'diagram' | 'portrait'

export interface DemoProject {
  num: string
  name: string
  typology: string
  year: string
  location: string
  blurb: string
}

export const DEMO_PROJECTS: DemoProject[] = [
  {
    num: '01', name: 'Cultural Center', typology: 'Cultural / Civic', year: '2026', location: 'Ahmedabad, IN',
    blurb: 'A layered civic armature where a folded roof plane gathers public courtyards, galleries and an amphitheatre under one continuous datum.',
  },
  {
    num: '02', name: 'Riverside Housing', typology: 'Residential', year: '2025', location: 'Kochi, IN',
    blurb: 'Stepped terraces and shaded verandahs negotiate the flood line, giving every dwelling a garden and a view back to the water.',
  },
  {
    num: '03', name: 'Museum of Light', typology: 'Museum / Exhibition', year: '2026', location: 'Jaipur, IN',
    blurb: 'A procession of top-lit volumes calibrates daylight room by room, turning circulation itself into the primary exhibit.',
  },
  {
    num: '04', name: 'Transit Urbanism', typology: 'Urban Design', year: '2025', location: 'Pune, IN',
    blurb: 'A transit-led masterplan knits fragmented blocks into a walkable spine of plazas, market streets and green corridors.',
  },
]

export const ABOUT_DEMO = {
  name: 'Aanya Sharma',
  role: 'Architect · B.Arch 2026',
  philosophy: 'Architecture as a quiet negotiation between light, structure and the everyday rituals of its people.',
  about: 'Final-year architecture student working at the intersection of civic space, climate-responsive design and craft. I draw to think — every project begins as a section.',
  education: ['B.Arch — CEPT University, 2021–2026', 'Exchange — Politecnico di Milano, 2024'],
  experience: ['Studio Mumbai — Intern, 2024', 'rat[LAB] — Design Intern, 2023'],
  skills: ['Design', 'Parametric', 'Detailing', 'Research'],
  software: ['Rhino', 'Revit', 'Grasshopper', 'AutoCAD', 'Enscape', 'InDesign'],
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** A seeded 0..1 pseudo-random so each slot varies but stays stable. */
function rng(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

function svgWrap(inner: string): string {
  return `<svg viewBox="0 0 100 130" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">${inner}</svg>`
}

/* ------------------------------ RENDER ----------------------------------- */
/** 3D massing render: sky gradient, building masses in perspective, ground, sun. */
function renderArt(p: DemoPalette, seed: number): string {
  const r = rng(seed)
  const gid = `sky${seed}`, gg = `gr${seed}`
  const sunX = 18 + r() * 12, sunY = 20 + r() * 10
  const horizon = 80
  // a few massed volumes
  const masses: string[] = []
  let x = 8
  const n = 3 + Math.floor(r() * 2)
  for (let i = 0; i < n; i++) {
    const w = 14 + r() * 16
    const h = 26 + r() * 34
    const topY = horizon - h
    const depth = 5 + r() * 4
    const tone = i % 2 === 0 ? p.primary : p.accent
    // front face + roof + side (simple axon)
    masses.push(`<polygon points="${x},${horizon} ${x},${topY} ${x + w},${topY} ${x + w},${horizon}" fill="${tone}" opacity="0.92"/>`)
    masses.push(`<polygon points="${x},${topY} ${x + depth},${topY - depth} ${x + w + depth},${topY - depth} ${x + w},${topY}" fill="${tone}" opacity="0.7"/>`)
    masses.push(`<polygon points="${x + w},${topY} ${x + w + depth},${topY - depth} ${x + w + depth},${horizon - depth} ${x + w},${horizon}" fill="${tone}" opacity="0.55"/>`)
    // window grid on front
    const cols = Math.max(2, Math.floor(w / 6)), rows = Math.max(2, Math.floor(h / 9))
    for (let c = 0; c < cols; c++) for (let rr = 0; rr < rows; rr++) {
      if (r() > 0.35) masses.push(`<rect x="${x + 2 + c * (w / cols)}" y="${topY + 3 + rr * (h / rows)}" width="${(w / cols) * 0.55}" height="${(h / rows) * 0.5}" fill="${p.bg}" opacity="0.5"/>`)
    }
    x += w * 0.78
    if (x > 78) break
  }
  return svgWrap(`
    <defs>
      <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${p.bg}"/>
        <stop offset="1" stop-color="${p.muted}"/>
      </linearGradient>
      <linearGradient id="${gg}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${p.muted}"/>
        <stop offset="1" stop-color="${p.bg}"/>
      </linearGradient>
    </defs>
    <rect width="100" height="130" fill="url(#${gid})"/>
    <circle cx="${sunX}" cy="${sunY}" r="6" fill="${p.accent}" opacity="0.5"/>
    ${masses.join('')}
    <rect y="${horizon}" width="100" height="${130 - horizon}" fill="url(#${gg})"/>
    <line x1="0" y1="${horizon}" x2="100" y2="${horizon}" stroke="${p.text}" stroke-width="0.4" opacity="0.3"/>
    <ellipse cx="62" cy="${horizon + 14}" rx="10" ry="2.2" fill="${p.text}" opacity="0.12"/>
    <line x1="74" y1="${horizon}" x2="74" y2="${horizon + 12}" stroke="${p.text}" stroke-width="0.6" opacity="0.4"/>
    <circle cx="74" cy="${horizon + 13}" r="2.4" fill="${p.text}" opacity="0.3"/>`)
}

/* ------------------------------- PLAN ------------------------------------ */
/** Floor plan: outer poché walls, structural grid, partitions, a stair + swing. */
function planArt(p: DemoPalette, seed: number): string {
  const r = rng(seed)
  const x0 = 12, y0 = 16, w = 76, h = 98
  const grid: string[] = []
  for (let i = 1; i < 6; i++) grid.push(`<line x1="${x0 + (w * i) / 6}" y1="${y0 - 4}" x2="${x0 + (w * i) / 6}" y2="${y0 + h + 4}" stroke="${p.accent}" stroke-width="0.25" opacity="0.5" stroke-dasharray="2 2"/>`)
  for (let i = 1; i < 7; i++) grid.push(`<line x1="${x0 - 4}" y1="${y0 + (h * i) / 7}" x2="${x0 + w + 4}" y2="${y0 + (h * i) / 7}" stroke="${p.accent}" stroke-width="0.25" opacity="0.5" stroke-dasharray="2 2"/>`)
  const parts: string[] = []
  // internal partitions
  const my = y0 + h * (0.35 + r() * 0.1)
  parts.push(`<line x1="${x0}" y1="${my}" x2="${x0 + w * 0.62}" y2="${my}" stroke="${p.primary}" stroke-width="1.1"/>`)
  const mx = x0 + w * (0.45 + r() * 0.12)
  parts.push(`<line x1="${mx}" y1="${my}" x2="${mx}" y2="${y0 + h}" stroke="${p.primary}" stroke-width="1.1"/>`)
  parts.push(`<line x1="${x0 + w * 0.62}" y1="${y0}" x2="${x0 + w * 0.62}" y2="${my}" stroke="${p.primary}" stroke-width="1.1"/>`)
  // door swing
  parts.push(`<path d="M ${mx} ${my + 10} A 10 10 0 0 1 ${mx + 10} ${my}" fill="none" stroke="${p.text}" stroke-width="0.4" opacity="0.6"/>`)
  // stair
  const sx = x0 + w * 0.7, sy = y0 + h * 0.55
  const steps: string[] = []
  for (let i = 0; i < 7; i++) steps.push(`<line x1="${sx}" y1="${sy + i * 3}" x2="${sx + 16}" y2="${sy + i * 3}" stroke="${p.text}" stroke-width="0.4" opacity="0.6"/>`)
  steps.push(`<rect x="${sx}" y="${sy}" width="16" height="${6 * 3}" fill="none" stroke="${p.primary}" stroke-width="0.6"/>`)
  // columns at grid intersections
  const cols: string[] = []
  for (let i = 1; i < 6; i++) for (let j = 1; j < 7; j++) if (r() > 0.55) cols.push(`<circle cx="${x0 + (w * i) / 6}" cy="${y0 + (h * j) / 7}" r="1.1" fill="${p.primary}"/>`)
  return svgWrap(`
    <rect width="100" height="130" fill="${p.bg}"/>
    ${grid.join('')}
    <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="none" stroke="${p.primary}" stroke-width="2.4"/>
    <rect x="${x0 + 1.4}" y="${y0 + 1.4}" width="${w - 2.8}" height="${h - 2.8}" fill="none" stroke="${p.primary}" stroke-width="0.5" opacity="0.5"/>
    ${parts.join('')}${steps.join('')}${cols.join('')}
    <rect x="${x0 + w * 0.4}" y="${y0 + h - 1.5}" width="10" height="3" fill="${p.bg}" stroke="none"/>
    <text x="${x0}" y="${y0 + h + 12}" font-family="monospace" font-size="5" fill="${p.text}" opacity="0.5">GROUND FLOOR · 1:200</text>`)
}

/* ------------------------------ SECTION ---------------------------------- */
/** Section cut: ground hatch, floor slabs, roof profile, a tree + figure for scale. */
function sectionArt(p: DemoPalette, seed: number): string {
  const r = rng(seed)
  const x0 = 8, w = 84, ground = 96
  const floors = 3 + Math.floor(r() * 2)
  const fh = 20
  const top = ground - floors * fh
  const slabs: string[] = []
  for (let i = 0; i <= floors; i++) {
    const y = ground - i * fh
    slabs.push(`<rect x="${x0}" y="${y - 1.4}" width="${w}" height="2.4" fill="${p.primary}"/>`)
  }
  // vertical poché walls (cut)
  slabs.push(`<rect x="${x0}" y="${top}" width="2.4" height="${ground - top}" fill="${p.primary}"/>`)
  slabs.push(`<rect x="${x0 + w - 2.4}" y="${top}" width="2.4" height="${ground - top}" fill="${p.primary}"/>`)
  // interior verticals (lighter)
  const verts: string[] = []
  for (let i = 1; i < 4; i++) if (r() > 0.4) verts.push(`<line x1="${x0 + (w * i) / 4}" y1="${top}" x2="${x0 + (w * i) / 4}" y2="${ground}" stroke="${p.text}" stroke-width="0.4" opacity="0.4"/>`)
  // roof profile (folded)
  const ry = top - 8 - r() * 6
  const roof = `<polyline points="${x0},${top} ${x0 + w * 0.3},${ry} ${x0 + w * 0.7},${top - 3} ${x0 + w},${ry - 2}" fill="none" stroke="${p.primary}" stroke-width="1.6"/>`
  // ground hatch
  const hatch: string[] = []
  for (let i = 0; i < 22; i++) hatch.push(`<line x1="${i * 5}" y1="${ground + 2}" x2="${i * 5 - 6}" y2="${ground + 12}" stroke="${p.text}" stroke-width="0.3" opacity="0.35"/>`)
  // scale figures + tree
  const fig = `<circle cx="${x0 + 14}" cy="${ground - 6}" r="1.4" fill="${p.text}" opacity="0.5"/><line x1="${x0 + 14}" y1="${ground - 5}" x2="${x0 + 14}" y2="${ground}" stroke="${p.text}" stroke-width="0.6" opacity="0.5"/>`
  const tree = `<line x1="${x0 + w + 4}" y1="${ground}" x2="${x0 + w + 4}" y2="${ground - 14}" stroke="${p.text}" stroke-width="0.7" opacity="0.45"/><circle cx="${x0 + w + 4}" cy="${ground - 16}" r="5" fill="${p.accent}" opacity="0.4"/>`
  return svgWrap(`
    <rect width="100" height="130" fill="${p.bg}"/>
    ${roof}
    <rect x="${x0}" y="${top}" width="${w}" height="${ground - top}" fill="${p.muted}" opacity="0.25"/>
    ${slabs.join('')}${verts.join('')}
    <line x1="0" y1="${ground}" x2="100" y2="${ground}" stroke="${p.text}" stroke-width="0.8"/>
    ${hatch.join('')}${fig}${tree}
    <text x="${x0}" y="${ground + 26}" font-family="monospace" font-size="5" fill="${p.text}" opacity="0.5">SECTION A–A · 1:200</text>`)
}

/* ----------------------------- ELEVATION --------------------------------- */
/** Facade: window grid, entrance, roofline, shadow. */
function elevationArt(p: DemoPalette, seed: number): string {
  const r = rng(seed)
  const x0 = 8, w = 84, ground = 100, h = 70
  const top = ground - h
  const cols = 5 + Math.floor(r() * 3), rows = 4 + Math.floor(r() * 2)
  const win: string[] = []
  const pad = 5
  const cw = (w - pad * 2) / cols, rh = (h - pad * 2) / rows
  for (let c = 0; c < cols; c++) for (let rr = 0; rr < rows; rr++) {
    if (r() > 0.18) win.push(`<rect x="${x0 + pad + c * cw + cw * 0.15}" y="${top + pad + rr * rh + rh * 0.15}" width="${cw * 0.7}" height="${rh * 0.7}" fill="${p.accent}" opacity="${0.25 + r() * 0.5}"/>`)
  }
  return svgWrap(`
    <rect width="100" height="130" fill="${p.bg}"/>
    <rect x="${x0}" y="${top}" width="${w}" height="${h}" fill="${p.muted}" opacity="0.3"/>
    <rect x="${x0}" y="${top}" width="${w}" height="${h}" fill="none" stroke="${p.primary}" stroke-width="1.4"/>
    ${win.join('')}
    <rect x="${x0 + w * 0.42}" y="${ground - 16}" width="${w * 0.16}" height="16" fill="${p.primary}" opacity="0.85"/>
    <line x1="${x0 - 2}" y1="${top}" x2="${x0 + w + 2}" y2="${top}" stroke="${p.primary}" stroke-width="1.8"/>
    <line x1="0" y1="${ground}" x2="100" y2="${ground}" stroke="${p.text}" stroke-width="0.8"/>
    <rect x="${x0}" y="${ground}" width="${w}" height="3" fill="${p.text}" opacity="0.12"/>
    <text x="${x0}" y="${ground + 18}" font-family="monospace" font-size="5" fill="${p.text}" opacity="0.5">SOUTH ELEVATION · 1:200</text>`)
}

/* ----------------------------- DIAGRAM ----------------------------------- */
/** Concept diagram: program bubbles + flows + axis. */
function diagramArt(p: DemoPalette, seed: number): string {
  const r = rng(seed)
  const bubbles: string[] = []
  const lines: string[] = []
  const pts: Array<[number, number, number]> = []
  const n = 4 + Math.floor(r() * 2)
  for (let i = 0; i < n; i++) {
    const cx = 18 + r() * 64, cy = 24 + r() * 80, rad = 7 + r() * 12
    pts.push([cx, cy, rad])
    bubbles.push(`<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${i % 2 ? p.accent : p.primary}" opacity="0.22"/>`)
    bubbles.push(`<circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="${i % 2 ? p.accent : p.primary}" stroke-width="0.6"/>`)
  }
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i]
    lines.push(`<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="${p.text}" stroke-width="0.5" opacity="0.4" stroke-dasharray="3 2"/>`)
  }
  // arrow axis
  const arrow = `<line x1="10" y1="120" x2="90" y2="120" stroke="${p.primary}" stroke-width="0.8"/><polygon points="90,120 85,118 85,122" fill="${p.primary}"/>`
  return svgWrap(`
    <rect width="100" height="130" fill="${p.bg}"/>
    ${lines.join('')}${bubbles.join('')}${arrow}
    <text x="10" y="16" font-family="monospace" font-size="5" fill="${p.text}" opacity="0.5">CONCEPT</text>`)
}

/* ----------------------------- PORTRAIT ---------------------------------- */
/** Profile picture placeholder: head & shoulders silhouette. */
function portraitArt(p: DemoPalette, seed: number): string {
  return svgWrap(`
    <rect width="100" height="130" fill="${p.muted}"/>
    <circle cx="50" cy="50" r="22" fill="${p.primary}" opacity="0.85"/>
    <path d="M 18 130 Q 18 86 50 86 Q 82 86 82 130 Z" fill="${p.primary}" opacity="0.85"/>`)
}

const ART: Record<ArchArtKind, (p: DemoPalette, seed: number) => string> = {
  render: renderArt, plan: planArt, section: sectionArt,
  elevation: elevationArt, diagram: diagramArt, portrait: portraitArt,
}

/** Inline SVG markup for a given architectural drawing kind. */
export function archArt(kind: ArchArtKind, p: DemoPalette, seed = 1): string {
  return (ART[kind] || renderArt)(p, seed)
}

/** Map an image slot index → a believable drawing kind (render-first mix). */
export function artKindForIndex(i: number, total: number): ArchArtKind {
  if (total <= 1) return 'render'
  const cycle: ArchArtKind[] = ['render', 'plan', 'section', 'elevation', 'diagram', 'render', 'plan', 'elevation', 'section']
  return cycle[i % cycle.length]
}

export function paletteFrom(colors?: Record<string, string>): DemoPalette {
  const c = colors || {}
  return {
    primary: c.primary || c.text || '#1f2937',
    accent: c.accent || c.secondary || '#b08d57',
    bg: c.background || '#ffffff',
    text: c.text || '#1f2937',
    muted: c.muted || c.secondary || '#e7e5e1',
  }
}
