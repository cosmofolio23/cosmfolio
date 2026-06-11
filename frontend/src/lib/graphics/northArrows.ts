/**
 * North arrow library — 25+ parametric SVG styles, colour-customisable.
 * Every arrow renders in a 100×100 viewBox pointing up; scale freely.
 */

export interface NorthArrowDef {
  id: string
  name: string
  category: 'Minimal' | 'Classic' | 'Graphic' | 'Compass' | 'Hand Drawn'
  /** Returns the inner SVG markup (no <svg> wrapper) in the given colour. */
  body: (c: string) => string
}

const N = (c: string, x = 50, y = 16, size = 13) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="700" text-anchor="middle" fill="${c}" font-family="Inter, system-ui, sans-serif">N</text>`

export const NORTH_ARROWS: NorthArrowDef[] = [
  // ---------------- Minimal ----------------
  { id: 'min-line', name: 'Line', category: 'Minimal', body: c => `${N(c)}<line x1="50" y1="22" x2="50" y2="88" stroke="${c}" stroke-width="3"/><path d="M50 22 L42 40 L50 34 L58 40 Z" fill="${c}"/>` },
  { id: 'min-chevron', name: 'Chevron', category: 'Minimal', body: c => `${N(c)}<path d="M50 24 L34 60 L50 50 L66 60 Z" fill="${c}"/>` },
  { id: 'min-needle', name: 'Needle', category: 'Minimal', body: c => `${N(c)}<path d="M50 20 L56 84 L50 74 L44 84 Z" fill="${c}"/>` },
  { id: 'min-dot', name: 'Dot & Stem', category: 'Minimal', body: c => `${N(c)}<circle cx="50" cy="80" r="6" fill="none" stroke="${c}" stroke-width="2.5"/><line x1="50" y1="74" x2="50" y2="30" stroke="${c}" stroke-width="2.5"/><path d="M50 22 L44 36 L50 31 L56 36 Z" fill="${c}"/>` },
  { id: 'min-open', name: 'Open Arrow', category: 'Minimal', body: c => `${N(c)}<line x1="50" y1="26" x2="50" y2="86" stroke="${c}" stroke-width="2.5"/><path d="M38 42 L50 26 L62 42" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` },
  { id: 'min-half', name: 'Half Fill', category: 'Minimal', body: c => `${N(c)}<path d="M50 22 L50 86 L34 70 Z" fill="${c}"/><path d="M50 22 L50 86 L66 70 Z" fill="none" stroke="${c}" stroke-width="2"/>` },
  // ---------------- Classic ----------------
  { id: 'cls-survey', name: 'Survey', category: 'Classic', body: c => `${N(c)}<circle cx="50" cy="58" r="30" fill="none" stroke="${c}" stroke-width="2"/><path d="M50 28 L58 58 L50 50 L42 58 Z" fill="${c}"/><path d="M50 88 L42 58 L50 66 L58 58 Z" fill="none" stroke="${c}" stroke-width="1.6"/>` },
  { id: 'cls-quartered', name: 'Quartered', category: 'Classic', body: c => `${N(c)}<circle cx="50" cy="58" r="28" fill="none" stroke="${c}" stroke-width="2"/><path d="M50 30 L50 58 L26 66 Z" fill="${c}"/><path d="M50 30 L50 58 L74 66 Z" fill="none" stroke="${c}" stroke-width="1.6"/>` },
  { id: 'cls-fleur', name: 'Fleur', category: 'Classic', body: c => `${N(c)}<line x1="50" y1="24" x2="50" y2="88" stroke="${c}" stroke-width="2"/><path d="M50 24 L43 44 L50 38 L57 44 Z" fill="${c}"/><path d="M40 52 Q50 44 60 52" fill="none" stroke="${c}" stroke-width="2"/><circle cx="50" cy="62" r="4" fill="${c}"/>` },
  { id: 'cls-crosshair', name: 'Crosshair', category: 'Classic', body: c => `${N(c)}<circle cx="50" cy="58" r="26" fill="none" stroke="${c}" stroke-width="2"/><line x1="50" y1="24" x2="50" y2="92" stroke="${c}" stroke-width="1.4"/><line x1="16" y1="58" x2="84" y2="58" stroke="${c}" stroke-width="1.4"/><path d="M50 28 L45 46 L50 42 L55 46 Z" fill="${c}"/>` },
  { id: 'cls-double-ring', name: 'Double Ring', category: 'Classic', body: c => `${N(c)}<circle cx="50" cy="58" r="29" fill="none" stroke="${c}" stroke-width="1.4"/><circle cx="50" cy="58" r="23" fill="none" stroke="${c}" stroke-width="1.4"/><path d="M50 32 L57 62 L50 55 L43 62 Z" fill="${c}"/>` },
  // ---------------- Graphic ----------------
  { id: 'gr-bold-tri', name: 'Bold Triangle', category: 'Graphic', body: c => `${N(c, 50, 18, 15)}<path d="M50 26 L74 84 L50 70 L26 84 Z" fill="${c}"/>` },
  { id: 'gr-circle-fill', name: 'Disc', category: 'Graphic', body: c => `<circle cx="50" cy="54" r="34" fill="${c}"/><path d="M50 28 L62 66 L50 57 L38 66 Z" fill="#fff"/><text x="50" y="86" font-size="13" font-weight="700" text-anchor="middle" fill="#fff" font-family="Inter, system-ui, sans-serif">N</text>` },
  { id: 'gr-split', name: 'Split', category: 'Graphic', body: c => `${N(c)}<path d="M50 22 L50 88 L28 88 Z" fill="${c}" opacity="0.35"/><path d="M50 22 L50 88 L72 88 Z" fill="${c}"/>` },
  { id: 'gr-banner', name: 'Banner', category: 'Graphic', body: c => `<rect x="34" y="8" width="32" height="20" rx="4" fill="${c}"/><text x="50" y="23" font-size="13" font-weight="700" text-anchor="middle" fill="#fff" font-family="Inter, system-ui, sans-serif">N</text><line x1="50" y1="28" x2="50" y2="86" stroke="${c}" stroke-width="3.5"/><path d="M50 86 L41 66 L50 72 L59 66 Z" fill="${c}" transform="rotate(180 50 76)"/>` },
  { id: 'gr-lightning', name: 'Angular', category: 'Graphic', body: c => `${N(c)}<path d="M56 22 L40 56 L52 52 L44 88 L62 50 L50 54 Z" fill="${c}"/>` },
  { id: 'gr-outline-tri', name: 'Outline Triangle', category: 'Graphic', body: c => `${N(c, 50, 18, 15)}<path d="M50 28 L72 82 L50 70 L28 82 Z" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round"/>` },
  // ---------------- Compass ----------------
  { id: 'cp-rose-4', name: 'Rose 4-point', category: 'Compass', body: c => {
      let pts = ''
      for (let i = 0; i < 4; i++) {
        const a = (i * 90 * Math.PI) / 180
        const x = 50 + Math.sin(a) * 30, y = 56 - Math.cos(a) * 30
        const lx = 50 + Math.sin(a + Math.PI / 2) * 7, ly = 56 - Math.cos(a + Math.PI / 2) * 7
        const rx = 50 + Math.sin(a - Math.PI / 2) * 7, ry = 56 - Math.cos(a - Math.PI / 2) * 7
        pts += `<path d="M${x} ${y} L${lx} ${ly} L50 56 Z" fill="${c}"/><path d="M${x} ${y} L${rx} ${ry} L50 56 Z" fill="none" stroke="${c}" stroke-width="1.2"/>`
      }
      return `${N(c, 50, 14)}${pts}<circle cx="50" cy="56" r="4" fill="none" stroke="${c}" stroke-width="1.5"/>`
    } },
  { id: 'cp-rose-8', name: 'Rose 8-point', category: 'Compass', body: c => {
      let pts = ''
      for (let i = 0; i < 8; i++) {
        const a = (i * 45 * Math.PI) / 180
        const long = i % 2 === 0
        const r = long ? 32 : 19
        const x = 50 + Math.sin(a) * r, y = 56 - Math.cos(a) * r
        const lx = 50 + Math.sin(a + Math.PI / 2) * 5, ly = 56 - Math.cos(a + Math.PI / 2) * 5
        const rx = 50 + Math.sin(a - Math.PI / 2) * 5, ry = 56 - Math.cos(a - Math.PI / 2) * 5
        pts += `<path d="M${x} ${y} L${lx} ${ly} L${rx} ${ry} Z" fill="${long ? c : 'none'}" stroke="${c}" stroke-width="1"/>`
      }
      return `${N(c, 50, 13, 12)}${pts}<circle cx="50" cy="56" r="3.5" fill="${c}"/>`
    } },
  { id: 'cp-ring-rose', name: 'Ringed Rose', category: 'Compass', body: c => {
      let ticks = ''
      for (let i = 0; i < 16; i++) {
        const a = (i * 22.5 * Math.PI) / 180
        const r1 = 30, r2 = i % 4 === 0 ? 24 : 27
        ticks += `<line x1="${50 + Math.sin(a) * r1}" y1="${56 - Math.cos(a) * r1}" x2="${50 + Math.sin(a) * r2}" y2="${56 - Math.cos(a) * r2}" stroke="${c}" stroke-width="1.2"/>`
      }
      return `${N(c, 50, 14, 12)}<circle cx="50" cy="56" r="30" fill="none" stroke="${c}" stroke-width="1.6"/>${ticks}<path d="M50 34 L56 60 L50 54 L44 60 Z" fill="${c}"/>`
    } },
  { id: 'cp-star', name: 'Star Rose', category: 'Compass', body: c => `${N(c, 50, 14)}<path d="M50 28 L55 51 L78 56 L55 61 L50 84 L45 61 L22 56 L45 51 Z" fill="${c}"/><circle cx="50" cy="56" r="3" fill="#fff"/>` },
  { id: 'cp-cardinal', name: 'Cardinal Letters', category: 'Compass', body: c => `<circle cx="50" cy="52" r="30" fill="none" stroke="${c}" stroke-width="1.6"/><path d="M50 28 L55 52 L50 47 L45 52 Z" fill="${c}"/><text x="50" y="16" font-size="11" font-weight="700" text-anchor="middle" fill="${c}" font-family="Inter, system-ui, sans-serif">N</text><text x="50" y="96" font-size="9" text-anchor="middle" fill="${c}" font-family="Inter, system-ui, sans-serif">S</text><text x="89" y="56" font-size="9" text-anchor="middle" fill="${c}" font-family="Inter, system-ui, sans-serif">E</text><text x="11" y="56" font-size="9" text-anchor="middle" fill="${c}" font-family="Inter, system-ui, sans-serif">W</text>` },
  // ---------------- Hand Drawn ----------------
  { id: 'hd-sketch', name: 'Sketch Arrow', category: 'Hand Drawn', body: c => `${N(c)}<path d="M50 24 C49 40 51 60 49.5 86" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/><path d="M41 40 C44 34 47 29 50 24 C53 30 56 35 59 41" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>` },
  { id: 'hd-loop', name: 'Loop', category: 'Hand Drawn', body: c => `${N(c)}<path d="M50 86 C46 66 42 56 50 52 C58 48 56 38 50 26" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/><path d="M43 38 L50 25 L57 39" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>` },
  { id: 'hd-circle', name: 'Sketch Circle', category: 'Hand Drawn', body: c => `${N(c, 50, 15)}<path d="M50 30 C70 28 82 42 80 58 C78 76 62 86 48 84 C32 82 20 70 22 54 C24 40 36 31 50 30" fill="none" stroke="${c}" stroke-width="1.8"/><path d="M50 36 L57 64 L50 57 L43 65 Z" fill="${c}"/>` },
  { id: 'hd-brush', name: 'Brush', category: 'Hand Drawn', body: c => `${N(c)}<path d="M50 24 L54 60 L50 88 L46 60 Z" fill="${c}" opacity="0.85"/><path d="M50 24 L60 46 L50 40 L40 46 Z" fill="${c}"/>` },
  { id: 'hd-dashed', name: 'Dashed', category: 'Hand Drawn', body: c => `${N(c)}<line x1="50" y1="30" x2="50" y2="86" stroke="${c}" stroke-width="2.4" stroke-dasharray="6 5" stroke-linecap="round"/><path d="M42 40 L50 25 L58 40 Z" fill="${c}"/>` },
]

export const NORTH_CATEGORIES = ['Minimal', 'Classic', 'Graphic', 'Compass', 'Hand Drawn'] as const

export function northArrowSVG(
  def: NorthArrowDef,
  color = '#111111',
  opts: { size?: number; magneticDeclination?: number | null } = {}
): string {
  const size = opts.size ?? 100
  let body = def.body(color)
  // optional magnetic-north secondary needle (thin, rotated, labelled MN)
  if (opts.magneticDeclination != null && !Number.isNaN(opts.magneticDeclination)) {
    body += `<g transform="rotate(${opts.magneticDeclination} 50 58)" opacity="0.75">` +
      `<line x1="50" y1="30" x2="50" y2="78" stroke="${color}" stroke-width="1.2" stroke-dasharray="3 3"/>` +
      `<path d="M46.5 37 L50 29 L53.5 37 Z" fill="none" stroke="${color}" stroke-width="1.2"/>` +
      `<text x="50" y="26" font-size="7" text-anchor="middle" fill="${color}" font-family="Inter, system-ui, sans-serif">MN</text></g>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">${body}</svg>`
}

export const getNorthArrow = (id: string) => NORTH_ARROWS.find(a => a.id === id)
