/**
 * Diagram Packs — architecture "entourage" library.
 *
 * Self-contained inline SVG art (no external assets / network). Each item is
 * exposed as a data-URI so it can be dropped onto the sheet canvas as a normal
 * image element. Art uses currentColor-ish dark strokes so it reads on white
 * sheets; users can recolor via element opacity/filters.
 */

export type DiagramCategory =
  | 'trees' | 'people' | 'furniture' | 'north_arrows'
  | 'scale_bars' | 'icons' | 'climate' | 'mapping'

export interface DiagramItem {
  id: string
  label: string
  category: DiagramCategory
  /** raw inner SVG markup (without the <svg> wrapper) */
  body: string
  /** viewBox for the wrapper */
  vb?: string
}

export const DIAGRAM_CATEGORIES: { id: DiagramCategory; label: string; icon: string }[] = [
  { id: 'trees', label: 'Trees', icon: '🌳' },
  { id: 'people', label: 'People', icon: '🧍' },
  { id: 'furniture', label: 'Furniture', icon: '🛋️' },
  { id: 'north_arrows', label: 'North Arrows', icon: '🧭' },
  { id: 'scale_bars', label: 'Scale Bars', icon: '📏' },
  { id: 'icons', label: 'Icons', icon: '⚑' },
  { id: 'climate', label: 'Climate', icon: '☀️' },
  { id: 'mapping', label: 'Mapping', icon: '📍' },
]

const S = '#1a1a1a' // default stroke/fill

export const DIAGRAM_ITEMS: DiagramItem[] = [
  // ── trees ──
  { id: 'tree-round', label: 'Round Tree', category: 'trees', body:
    `<line x1="50" y1="60" x2="50" y2="92" stroke="${S}" stroke-width="4"/><circle cx="50" cy="40" r="26" fill="none" stroke="${S}" stroke-width="3"/>` },
  { id: 'tree-conifer', label: 'Conifer', category: 'trees', body:
    `<line x1="50" y1="60" x2="50" y2="92" stroke="${S}" stroke-width="4"/><path d="M50 10 L70 60 H30 Z" fill="none" stroke="${S}" stroke-width="3"/>` },
  { id: 'tree-plan', label: 'Tree (Plan)', category: 'trees', body:
    `<circle cx="50" cy="50" r="34" fill="none" stroke="${S}" stroke-width="2"/>${Array.from({length:16}).map((_,i)=>{const a=i*Math.PI/8;return `<line x1="50" y1="50" x2="${(50+34*Math.cos(a)).toFixed(1)}" y2="${(50+34*Math.sin(a)).toFixed(1)}" stroke="${S}" stroke-width="1"/>`}).join('')}` },

  // ── people ──
  { id: 'person-stand', label: 'Standing', category: 'people', body:
    `<circle cx="50" cy="20" r="9" fill="${S}"/><path d="M50 30 V62 M50 40 L36 54 M50 40 L64 54 M50 62 L40 92 M50 62 L60 92" stroke="${S}" stroke-width="4" fill="none" stroke-linecap="round"/>` },
  { id: 'person-walk', label: 'Walking', category: 'people', body:
    `<circle cx="48" cy="20" r="9" fill="${S}"/><path d="M48 30 V60 M48 40 L34 50 M48 40 L62 48 M48 60 L36 90 M48 60 L62 86" stroke="${S}" stroke-width="4" fill="none" stroke-linecap="round"/>` },
  { id: 'person-pair', label: 'Pair', category: 'people', body:
    `<g><circle cx="36" cy="22" r="8" fill="${S}"/><path d="M36 30 V60 M36 60 L28 90 M36 60 L44 90 M36 40 L24 52 M36 40 L48 52" stroke="${S}" stroke-width="3.5" fill="none" stroke-linecap="round"/></g><g><circle cx="66" cy="22" r="8" fill="${S}"/><path d="M66 30 V60 M66 60 L58 90 M66 60 L74 90 M66 40 L54 52 M66 40 L78 52" stroke="${S}" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>` },

  // ── furniture ──
  { id: 'sofa', label: 'Sofa', category: 'furniture', body:
    `<rect x="14" y="40" width="72" height="40" rx="6" fill="none" stroke="${S}" stroke-width="3"/><rect x="14" y="30" width="14" height="50" rx="4" fill="none" stroke="${S}" stroke-width="3"/><rect x="72" y="30" width="14" height="50" rx="4" fill="none" stroke="${S}" stroke-width="3"/>` },
  { id: 'bed', label: 'Bed', category: 'furniture', body:
    `<rect x="20" y="18" width="60" height="64" rx="4" fill="none" stroke="${S}" stroke-width="3"/><line x1="20" y1="40" x2="80" y2="40" stroke="${S}" stroke-width="2"/><rect x="28" y="22" width="20" height="14" rx="3" fill="none" stroke="${S}" stroke-width="2"/><rect x="52" y="22" width="20" height="14" rx="3" fill="none" stroke="${S}" stroke-width="2"/>` },
  { id: 'table', label: 'Table + Chairs', category: 'furniture', body:
    `<rect x="34" y="34" width="32" height="32" fill="none" stroke="${S}" stroke-width="3"/><rect x="40" y="14" width="20" height="12" fill="none" stroke="${S}" stroke-width="2"/><rect x="40" y="74" width="20" height="12" fill="none" stroke="${S}" stroke-width="2"/><rect x="14" y="40" width="12" height="20" fill="none" stroke="${S}" stroke-width="2"/><rect x="74" y="40" width="12" height="20" fill="none" stroke="${S}" stroke-width="2"/>` },

  // ── north arrows ──
  { id: 'north-classic', label: 'North N', category: 'north_arrows', body:
    `<path d="M50 8 L62 50 L50 42 L38 50 Z" fill="${S}"/><path d="M50 42 L62 50 L50 92 L38 50 Z" fill="none" stroke="${S}" stroke-width="2"/><text x="50" y="100" font-size="14" text-anchor="middle" fill="${S}" font-family="Arial">N</text>` },
  { id: 'north-circle', label: 'North (Ring)', category: 'north_arrows', body:
    `<circle cx="50" cy="50" r="36" fill="none" stroke="${S}" stroke-width="2"/><path d="M50 18 L60 54 H40 Z" fill="${S}"/><path d="M50 82 L60 54 H40 Z" fill="none" stroke="${S}" stroke-width="2"/>` },
  { id: 'north-simple', label: 'Arrow N', category: 'north_arrows', body:
    `<line x1="50" y1="92" x2="50" y2="16" stroke="${S}" stroke-width="3"/><path d="M50 8 L58 26 H42 Z" fill="${S}"/><text x="64" y="20" font-size="13" fill="${S}" font-family="Arial">N</text>` },

  // ── scale bars ──
  { id: 'scale-3', label: 'Scale 0–3', category: 'scale_bars', vb: '0 0 160 40', body:
    `<rect x="10" y="14" width="40" height="10" fill="${S}"/><rect x="50" y="14" width="40" height="10" fill="none" stroke="${S}" stroke-width="2"/><rect x="90" y="14" width="40" height="10" fill="${S}"/><text x="10" y="36" font-size="9" fill="${S}" font-family="Arial">0</text><text x="86" y="36" font-size="9" fill="${S}" font-family="Arial">2</text><text x="126" y="36" font-size="9" fill="${S}" font-family="Arial">3m</text>` },
  { id: 'scale-graphic', label: 'Graphic Scale', category: 'scale_bars', vb: '0 0 160 40', body:
    `<line x1="10" y1="20" x2="150" y2="20" stroke="${S}" stroke-width="2"/>${[10,45,80,115,150].map(x=>`<line x1="${x}" y1="14" x2="${x}" y2="26" stroke="${S}" stroke-width="2"/>`).join('')}<text x="8" y="36" font-size="9" fill="${S}" font-family="Arial">0</text><text x="140" y="36" font-size="9" fill="${S}" font-family="Arial">10m</text>` },

  // ── icons ──
  { id: 'icon-entry', label: 'Entry', category: 'icons', body:
    `<rect x="24" y="20" width="40" height="60" fill="none" stroke="${S}" stroke-width="3"/><path d="M64 50 H86 M78 42 L86 50 L78 58" fill="none" stroke="${S}" stroke-width="3"/>` },
  { id: 'icon-stair', label: 'Stairs', category: 'icons', body:
    `${[0,1,2,3,4].map(i=>`<rect x="${20+i*12}" y="${24+i*10}" width="12" height="${52-i*10}" fill="none" stroke="${S}" stroke-width="2"/>`).join('')}` },
  { id: 'icon-camera', label: 'View Point', category: 'icons', body:
    `<circle cx="40" cy="50" r="10" fill="${S}"/><path d="M48 44 L86 24 V76 L48 56 Z" fill="none" stroke="${S}" stroke-width="3"/>` },

  // ── climate ──
  { id: 'sun', label: 'Sun', category: 'climate', body:
    `<circle cx="50" cy="50" r="16" fill="none" stroke="${S}" stroke-width="3"/>${Array.from({length:8}).map((_,i)=>{const a=i*Math.PI/4;return `<line x1="${(50+24*Math.cos(a)).toFixed(1)}" y1="${(50+24*Math.sin(a)).toFixed(1)}" x2="${(50+34*Math.cos(a)).toFixed(1)}" y2="${(50+34*Math.sin(a)).toFixed(1)}" stroke="${S}" stroke-width="3"/>`}).join('')}` },
  { id: 'wind', label: 'Wind', category: 'climate', body:
    `<path d="M14 36 H70 a10 10 0 1 0 -10 -10" fill="none" stroke="${S}" stroke-width="3"/><path d="M14 54 H58 a8 8 0 1 1 -8 8" fill="none" stroke="${S}" stroke-width="3"/>` },
  { id: 'sun-path', label: 'Sun Path', category: 'climate', body:
    `<path d="M10 80 A40 40 0 0 1 90 80" fill="none" stroke="${S}" stroke-width="2" stroke-dasharray="4 4"/><circle cx="50" cy="40" r="8" fill="${S}"/><line x1="10" y1="80" x2="90" y2="80" stroke="${S}" stroke-width="2"/>` },

  // ── mapping ──
  { id: 'map-pin', label: 'Pin', category: 'mapping', body:
    `<path d="M50 88 C30 60 30 40 50 20 C70 40 70 60 50 88 Z" fill="none" stroke="${S}" stroke-width="3"/><circle cx="50" cy="40" r="8" fill="${S}"/>` },
  { id: 'map-contour', label: 'Contours', category: 'mapping', body:
    `${[14,22,30,38].map(r=>`<ellipse cx="50" cy="50" rx="${r+6}" ry="${r}" fill="none" stroke="${S}" stroke-width="1.6"/>`).join('')}` },
  { id: 'map-section', label: 'Section Cut', category: 'mapping', body:
    `<line x1="14" y1="50" x2="86" y2="50" stroke="${S}" stroke-width="2"/><path d="M14 50 L24 42 M14 50 L24 58" stroke="${S}" stroke-width="2" fill="none"/><path d="M86 50 L76 42 M86 50 L76 58" stroke="${S}" stroke-width="2" fill="none"/><text x="44" y="42" font-size="12" fill="${S}" font-family="Arial">A</text>` },
]

/** Wrap an item's body into a full SVG string. */
export function itemSvg(item: DiagramItem): string {
  const vb = item.vb || '0 0 100 100'
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${item.body}</svg>`
}

/** Item as a data-URI usable as <img src>. */
export function itemDataUri(item: DiagramItem): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(itemSvg(item))}`
}

export function itemsByCategory(cat: DiagramCategory): DiagramItem[] {
  return DIAGRAM_ITEMS.filter(i => i.category === cat)
}
