/**
 * Entourage library — parametric SVG architecture graphics.
 *
 * Every item knows its real-world size in metres, so the studio can place it
 * at the correct size for any drawing scale (1:50, 1:100, 1:200 …) and
 * re-scale proportionally when the sheet scale changes. All items are pure
 * vector and colour-customisable.
 */

export type EntourageView = 'plan' | 'elevation' | 'section'
export type EntourageCategory = 'People' | 'Trees' | 'Vehicles' | 'Furniture' | 'Site'

export interface EntourageItem {
  id: string
  name: string
  category: EntourageCategory
  views: EntourageView[]
  style?: 'minimal' | 'solid' | 'detailed'
  widthM: number
  heightM: number
  /** viewBox width/height the body is drawn in */
  vb: [number, number]
  body: (c: string) => string
}

const I = (i: EntourageItem) => i

// ---------- People (elevation/section silhouettes) ----------
const personStanding = (c: string, fill: boolean) => {
  const f = fill ? c : 'none'
  const sw = fill ? 0 : 4
  return `<circle cx="50" cy="22" r="14" fill="${f}" stroke="${c}" stroke-width="${sw}"/>` +
    `<path d="M50 38 C36 40 32 56 33 78 L38 78 L42 130 L40 178 L48 178 L52 132 L56 178 L64 178 L61 128 L66 78 L67 78 C68 56 64 40 50 38 Z" fill="${f}" stroke="${c}" stroke-width="${sw}" stroke-linejoin="round"/>`
}
const personWalking = (c: string, fill: boolean) => {
  const f = fill ? c : 'none'
  const sw = fill ? 0 : 4
  return `<circle cx="52" cy="22" r="14" fill="${f}" stroke="${c}" stroke-width="${sw}"/>` +
    `<path d="M52 38 C40 41 36 56 38 76 L30 104 L36 106 L46 84 L48 96 L30 172 L39 174 L56 116 L66 170 L75 168 L62 100 L60 74 C64 54 62 41 52 38 Z" fill="${f}" stroke="${c}" stroke-width="${sw}" stroke-linejoin="round"/>`
}
const personSitting = (c: string, fill: boolean) => {
  const f = fill ? c : 'none'
  const sw = fill ? 0 : 4
  return `<circle cx="44" cy="24" r="14" fill="${f}" stroke="${c}" stroke-width="${sw}"/>` +
    `<path d="M44 40 C32 44 30 58 31 78 L32 106 L78 106 L80 118 L78 168 L86 168 L90 114 L84 100 L48 98 L52 76 C56 56 54 44 44 40 Z" fill="${f}" stroke="${c}" stroke-width="${sw}" stroke-linejoin="round"/>` +
    `<path d="M32 106 L30 168 L38 168 L42 110 Z" fill="${f}" stroke="${c}" stroke-width="${sw}"/>`
}

const PEOPLE: EntourageItem[] = []
const poses: Array<['standing' | 'walking' | 'sitting', (c: string, f: boolean) => string, number]> = [
  ['standing', personStanding, 1.75],
  ['walking', personWalking, 1.75],
  ['sitting', personSitting, 1.3],
]
for (const [pose, fn, h] of poses) {
  PEOPLE.push(I({ id: `person-${pose}-line`, name: `Person ${pose} (line)`, category: 'People', views: ['elevation', 'section'], style: 'minimal', widthM: 0.55, heightM: h, vb: [100, 180], body: c => fn(c, false) }))
  PEOPLE.push(I({ id: `person-${pose}-solid`, name: `Person ${pose} (solid)`, category: 'People', views: ['elevation', 'section'], style: 'solid', widthM: 0.55, heightM: h, vb: [100, 180], body: c => fn(c, true) }))
}
PEOPLE.push(I({
  id: 'person-plan', name: 'Person (plan)', category: 'People', views: ['plan'], widthM: 0.5, heightM: 0.5, vb: [100, 100],
  body: c => `<circle cx="46" cy="46" r="34" fill="${c}" opacity="0.18"/><circle cx="50" cy="50" r="30" fill="none" stroke="${c}" stroke-width="5"/><circle cx="50" cy="50" r="9" fill="${c}"/>`,
}))
PEOPLE.push(I({
  id: 'person-plan-pair', name: 'People pair (plan)', category: 'People', views: ['plan'], widthM: 1.1, heightM: 0.6, vb: [200, 110],
  body: c => `<circle cx="55" cy="55" r="42" fill="none" stroke="${c}" stroke-width="6"/><circle cx="55" cy="55" r="12" fill="${c}"/><circle cx="145" cy="55" r="42" fill="none" stroke="${c}" stroke-width="6"/><circle cx="145" cy="55" r="12" fill="${c}"/>`,
}))

// ---------- Trees ----------
const scallopCircle = (cx: number, cy: number, r: number, n: number, c: string, fill = 'none') => {
  let d = ''
  for (let i = 0; i < n; i++) {
    const a1 = (i / n) * Math.PI * 2, a2 = ((i + 1) / n) * Math.PI * 2
    const x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r
    const x2 = cx + Math.cos(a2) * r, y2 = cy + Math.sin(a2) * r
    const mx = cx + Math.cos((a1 + a2) / 2) * r * 1.18, my = cy + Math.sin((a1 + a2) / 2) * r * 1.18
    d += `${i === 0 ? `M${x1} ${y1}` : ''} Q${mx} ${my} ${x2} ${y2} `
  }
  return `<path d="${d}Z" fill="${fill}" stroke="${c}" stroke-width="3"/>`
}

const TREES: EntourageItem[] = [
  I({ id: 'tree-plan-deciduous', name: 'Deciduous (plan)', category: 'Trees', views: ['plan'], widthM: 6, heightM: 6, vb: [200, 200], body: c => `${scallopCircle(100, 100, 80, 11, c)}<circle cx="100" cy="100" r="5" fill="${c}"/><line x1="100" y1="100" x2="148" y2="62" stroke="${c}" stroke-width="2" opacity="0.5"/>` }),
  I({ id: 'tree-plan-conifer', name: 'Conifer (plan)', category: 'Trees', views: ['plan'], widthM: 4, heightM: 4, vb: [200, 200], body: c => { let sp = ''; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; sp += `<line x1="${100 + Math.cos(a) * 28}" y1="${100 + Math.sin(a) * 28}" x2="${100 + Math.cos(a) * 86}" y2="${100 + Math.sin(a) * 86}" stroke="${c}" stroke-width="3"/>` } return `<circle cx="100" cy="100" r="86" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>${sp}<circle cx="100" cy="100" r="6" fill="${c}"/>` } }),
  I({ id: 'tree-plan-palm', name: 'Palm (plan)', category: 'Trees', views: ['plan'], widthM: 5, heightM: 5, vb: [200, 200], body: c => { let fr = ''; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const x2 = 100 + Math.cos(a) * 85, y2 = 100 + Math.sin(a) * 85; const mx = 100 + Math.cos(a + 0.35) * 50, my = 100 + Math.sin(a + 0.35) * 50; fr += `<path d="M100 100 Q${mx} ${my} ${x2} ${y2}" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>` } return `${fr}<circle cx="100" cy="100" r="8" fill="${c}"/>` } }),
  I({ id: 'tree-plan-shrub', name: 'Shrub (plan)', category: 'Trees', views: ['plan'], widthM: 1.5, heightM: 1.5, vb: [100, 100], body: c => scallopCircle(50, 50, 38, 8, c) }),
  I({ id: 'tree-plan-bush', name: 'Bush cluster (plan)', category: 'Trees', views: ['plan'], widthM: 2.5, heightM: 2, vb: [160, 130], body: c => `${scallopCircle(50, 60, 38, 8, c)}${scallopCircle(105, 50, 32, 7, c)}${scallopCircle(85, 90, 28, 7, c)}` }),
  I({ id: 'tree-elev-deciduous', name: 'Deciduous (elev)', category: 'Trees', views: ['elevation', 'section'], widthM: 6, heightM: 8, vb: [180, 240], body: c => `<path d="M86 240 L86 150 C60 150 30 130 34 96 C20 60 56 30 90 36 C130 24 162 56 152 92 C166 126 130 152 96 150 L96 240 Z" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/><path d="M86 170 L60 140 M92 150 L120 118" stroke="${c}" stroke-width="3" fill="none"/>` }),
  I({ id: 'tree-elev-deciduous-solid', name: 'Deciduous solid (elev)', category: 'Trees', views: ['elevation', 'section'], style: 'solid', widthM: 6, heightM: 8, vb: [180, 240], body: c => `<path d="M86 240 L86 150 C60 150 30 130 34 96 C20 60 56 30 90 36 C130 24 162 56 152 92 C166 126 130 152 96 150 L96 240 Z" fill="${c}"/>` }),
  I({ id: 'tree-elev-conifer', name: 'Conifer (elev)', category: 'Trees', views: ['elevation', 'section'], widthM: 4, heightM: 9, vb: [140, 260], body: c => `<path d="M70 10 L110 80 L92 78 L122 150 L100 146 L130 215 L76 206 L76 260 L64 260 L64 206 L10 215 L40 146 L18 150 L48 78 L30 80 Z" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>` }),
  I({ id: 'tree-elev-palm', name: 'Palm (elev)', category: 'Trees', views: ['elevation', 'section'], widthM: 5, heightM: 9, vb: [180, 260], body: c => { let fr = ''; const tip: Array<[number, number]> = [[20, 60], [60, 30], [110, 22], [150, 45], [165, 85], [40, 95]]; for (const [tx, ty] of tip) { fr += `<path d="M95 70 Q${(95 + tx) / 2} ${Math.min(ty, 70) - 22} ${tx} ${ty}" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>` } return `${fr}<path d="M95 70 C90 130 86 190 90 260 L104 260 C100 190 100 130 102 70 Z" fill="none" stroke="${c}" stroke-width="4"/>` } }),
  I({ id: 'plant-pot', name: 'Potted plant', category: 'Trees', views: ['elevation', 'section', 'plan'], widthM: 0.5, heightM: 1, vb: [100, 180], body: c => `<path d="M30 120 L70 120 L64 175 L36 175 Z" fill="none" stroke="${c}" stroke-width="4"/><path d="M50 120 C50 90 30 80 22 56 C44 64 48 80 50 92 C52 70 60 52 80 44 C72 72 56 84 52 104 C54 86 66 76 84 74 C72 92 58 98 52 112" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>` }),
]

// ---------- Vehicles ----------
const VEHICLES: EntourageItem[] = [
  I({ id: 'car-plan-sedan', name: 'Sedan (plan)', category: 'Vehicles', views: ['plan'], widthM: 4.5, heightM: 1.8, vb: [300, 120], body: c => `<rect x="8" y="14" width="284" height="92" rx="26" fill="none" stroke="${c}" stroke-width="5"/><line x1="78" y1="18" x2="78" y2="102" stroke="${c}" stroke-width="3"/><line x1="206" y1="18" x2="206" y2="102" stroke="${c}" stroke-width="3"/><rect x="92" y="22" width="102" height="76" rx="10" fill="none" stroke="${c}" stroke-width="2.5"/>` }),
  I({ id: 'car-plan-suv', name: 'SUV (plan)', category: 'Vehicles', views: ['plan'], widthM: 4.8, heightM: 1.95, vb: [300, 122], body: c => `<rect x="6" y="10" width="288" height="102" rx="18" fill="none" stroke="${c}" stroke-width="5"/><line x1="70" y1="14" x2="70" y2="108" stroke="${c}" stroke-width="3"/><line x1="232" y1="14" x2="232" y2="108" stroke="${c}" stroke-width="3"/><rect x="84" y="18" width="134" height="86" rx="8" fill="none" stroke="${c}" stroke-width="2.5"/>` }),
  I({ id: 'bus-plan', name: 'Bus (plan)', category: 'Vehicles', views: ['plan'], widthM: 12, heightM: 2.5, vb: [600, 125], body: c => { let win = ''; for (let i = 0; i < 8; i++) win += `<line x1="${80 + i * 60}" y1="10" x2="${80 + i * 60}" y2="115" stroke="${c}" stroke-width="2.5"/>`; return `<rect x="5" y="5" width="590" height="115" rx="14" fill="none" stroke="${c}" stroke-width="6"/>${win}` } }),
  I({ id: 'car-elev', name: 'Car (elevation)', category: 'Vehicles', views: ['elevation', 'section'], widthM: 4.5, heightM: 1.5, vb: [300, 100], body: c => `<path d="M12 72 C12 58 22 52 40 50 L62 28 C70 20 84 16 110 16 L170 16 C196 16 210 24 222 38 L238 50 C268 52 288 58 288 70 L288 78 L12 78 Z" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/><circle cx="70" cy="78" r="16" fill="none" stroke="${c}" stroke-width="4"/><circle cx="226" cy="78" r="16" fill="none" stroke="${c}" stroke-width="4"/><line x1="138" y1="18" x2="138" y2="50" stroke="${c}" stroke-width="3"/>` }),
  I({ id: 'bicycle-plan', name: 'Bicycle (plan)', category: 'Vehicles', views: ['plan'], widthM: 1.8, heightM: 0.6, vb: [240, 80], body: c => `<ellipse cx="40" cy="40" rx="32" ry="11" fill="none" stroke="${c}" stroke-width="4"/><ellipse cx="200" cy="40" rx="32" ry="11" fill="none" stroke="${c}" stroke-width="4"/><line x1="72" y1="40" x2="168" y2="40" stroke="${c}" stroke-width="4"/><line x1="118" y1="14" x2="118" y2="66" stroke="${c}" stroke-width="3.5"/>` }),
  I({ id: 'bicycle-elev', name: 'Bicycle (elevation)', category: 'Vehicles', views: ['elevation', 'section'], widthM: 1.8, heightM: 1.1, vb: [240, 150], body: c => `<circle cx="52" cy="106" r="38" fill="none" stroke="${c}" stroke-width="4"/><circle cx="188" cy="106" r="38" fill="none" stroke="${c}" stroke-width="4"/><path d="M52 106 L96 48 L160 48 L188 106 L110 106 L96 48 M110 106 L80 48 L60 48 M96 48 L92 34 L78 32 M160 48 L168 30 M158 28 L180 32" fill="none" stroke="${c}" stroke-width="3.5" stroke-linejoin="round"/>` }),
]

// ---------- Furniture (plan symbols) ----------
const FURNITURE: EntourageItem[] = [
  I({ id: 'sofa-plan', name: 'Sofa 3-seat', category: 'Furniture', views: ['plan'], widthM: 2.2, heightM: 0.9, vb: [240, 100], body: c => `<rect x="4" y="4" width="232" height="92" rx="12" fill="none" stroke="${c}" stroke-width="4"/><line x1="4" y1="28" x2="236" y2="28" stroke="${c}" stroke-width="2.5"/><line x1="30" y1="4" x2="30" y2="96" stroke="${c}" stroke-width="2.5"/><line x1="210" y1="4" x2="210" y2="96" stroke="${c}" stroke-width="2.5"/><line x1="90" y1="28" x2="90" y2="96" stroke="${c}" stroke-width="2"/><line x1="150" y1="28" x2="150" y2="96" stroke="${c}" stroke-width="2"/>` }),
  I({ id: 'bed-plan', name: 'Double bed', category: 'Furniture', views: ['plan'], widthM: 1.8, heightM: 2.0, vb: [180, 200], body: c => `<rect x="4" y="4" width="172" height="192" rx="6" fill="none" stroke="${c}" stroke-width="4"/><rect x="16" y="12" width="64" height="36" rx="8" fill="none" stroke="${c}" stroke-width="2.5"/><rect x="100" y="12" width="64" height="36" rx="8" fill="none" stroke="${c}" stroke-width="2.5"/><line x1="4" y1="60" x2="176" y2="60" stroke="${c}" stroke-width="2.5"/><line x1="4" y1="60" x2="40" y2="86" stroke="${c}" stroke-width="2"/>` }),
  I({ id: 'dining-plan', name: 'Dining table + 4', category: 'Furniture', views: ['plan'], widthM: 1.9, heightM: 1.9, vb: [200, 200], body: c => { const chair = (x: number, y: number, r: number) => `<g transform="rotate(${r} ${x} ${y})"><rect x="${x - 20}" y="${y - 16}" width="40" height="32" rx="6" fill="none" stroke="${c}" stroke-width="2.5"/><line x1="${x - 20}" y1="${y - 8}" x2="${x + 20}" y2="${y - 8}" stroke="${c}" stroke-width="2"/></g>`; return `<rect x="50" y="50" width="100" height="100" fill="none" stroke="${c}" stroke-width="4"/>${chair(100, 28, 0)}${chair(100, 172, 180)}${chair(28, 100, -90)}${chair(172, 100, 90)}` } }),
  I({ id: 'chair-plan', name: 'Chair', category: 'Furniture', views: ['plan'], widthM: 0.5, heightM: 0.5, vb: [100, 100], body: c => `<rect x="14" y="14" width="72" height="72" rx="10" fill="none" stroke="${c}" stroke-width="4"/><line x1="14" y1="30" x2="86" y2="30" stroke="${c}" stroke-width="3"/>` }),
  I({ id: 'desk-plan', name: 'Desk + chair', category: 'Furniture', views: ['plan'], widthM: 1.4, heightM: 1.2, vb: [150, 130], body: c => `<rect x="6" y="6" width="138" height="60" fill="none" stroke="${c}" stroke-width="4"/><rect x="52" y="80" width="46" height="40" rx="8" fill="none" stroke="${c}" stroke-width="3"/><line x1="52" y1="110" x2="98" y2="110" stroke="${c}" stroke-width="2.5"/>` }),
  I({ id: 'bathtub-plan', name: 'Bathtub', category: 'Furniture', views: ['plan'], widthM: 1.7, heightM: 0.75, vb: [180, 80], body: c => `<rect x="4" y="4" width="172" height="72" rx="10" fill="none" stroke="${c}" stroke-width="4"/><rect x="16" y="14" width="148" height="52" rx="22" fill="none" stroke="${c}" stroke-width="2.5"/><circle cx="32" cy="40" r="5" fill="${c}"/>` }),
  I({ id: 'toilet-plan', name: 'WC', category: 'Furniture', views: ['plan'], widthM: 0.4, heightM: 0.65, vb: [80, 130], body: c => `<rect x="14" y="6" width="52" height="28" rx="5" fill="none" stroke="${c}" stroke-width="3.5"/><ellipse cx="40" cy="80" rx="26" ry="38" fill="none" stroke="${c}" stroke-width="3.5"/><ellipse cx="40" cy="80" rx="16" ry="26" fill="none" stroke="${c}" stroke-width="2"/>` }),
  I({ id: 'sink-plan', name: 'Sink', category: 'Furniture', views: ['plan'], widthM: 0.5, heightM: 0.45, vb: [100, 90], body: c => `<rect x="6" y="6" width="88" height="78" rx="14" fill="none" stroke="${c}" stroke-width="3.5"/><ellipse cx="50" cy="48" rx="28" ry="22" fill="none" stroke="${c}" stroke-width="2.5"/><circle cx="50" cy="18" r="4" fill="${c}"/>` }),
  I({ id: 'kitchen-plan', name: 'Kitchen counter L', category: 'Furniture', views: ['plan'], widthM: 2.4, heightM: 1.5, vb: [240, 150], body: c => `<path d="M4 4 L236 4 L236 64 L64 64 L64 146 L4 146 Z" fill="none" stroke="${c}" stroke-width="4"/><circle cx="160" cy="34" r="11" fill="none" stroke="${c}" stroke-width="2.5"/><circle cx="196" cy="34" r="11" fill="none" stroke="${c}" stroke-width="2.5"/><rect x="84" y="16" width="48" height="36" rx="6" fill="none" stroke="${c}" stroke-width="2.5"/><circle cx="34" cy="106" r="14" fill="none" stroke="${c}" stroke-width="2.5"/>` }),
  I({ id: 'wardrobe-plan', name: 'Wardrobe', category: 'Furniture', views: ['plan'], widthM: 1.8, heightM: 0.6, vb: [180, 60], body: c => `<rect x="4" y="4" width="172" height="52" fill="none" stroke="${c}" stroke-width="4"/><line x1="4" y1="30" x2="176" y2="30" stroke="${c}" stroke-width="2" stroke-dasharray="6 4"/><line x1="90" y1="4" x2="90" y2="56" stroke="${c}" stroke-width="2.5"/>` }),
]

// ---------- Site elements ----------
const SITE: EntourageItem[] = [
  I({ id: 'bench-plan', name: 'Bench (plan)', category: 'Site', views: ['plan'], widthM: 1.8, heightM: 0.5, vb: [180, 50], body: c => `<rect x="4" y="10" width="172" height="30" rx="4" fill="none" stroke="${c}" stroke-width="4"/><line x1="4" y1="25" x2="176" y2="25" stroke="${c}" stroke-width="2"/>` }),
  I({ id: 'streetlight-plan', name: 'Street light (plan)', category: 'Site', views: ['plan'], widthM: 0.6, heightM: 0.6, vb: [100, 100], body: c => `<circle cx="50" cy="50" r="12" fill="${c}"/><circle cx="50" cy="50" r="38" fill="none" stroke="${c}" stroke-width="2.5" stroke-dasharray="8 6"/><line x1="50" y1="12" x2="50" y2="88" stroke="${c}" stroke-width="2"/><line x1="12" y1="50" x2="88" y2="50" stroke="${c}" stroke-width="2"/>` }),
  I({ id: 'bollard-plan', name: 'Bollard (plan)', category: 'Site', views: ['plan'], widthM: 0.3, heightM: 0.3, vb: [60, 60], body: c => `<circle cx="30" cy="30" r="20" fill="none" stroke="${c}" stroke-width="4"/><circle cx="30" cy="30" r="6" fill="${c}"/>` }),
  I({ id: 'busstop-plan', name: 'Bus stop (plan)', category: 'Site', views: ['plan'], widthM: 3, heightM: 1.5, vb: [300, 150], body: c => `<rect x="6" y="6" width="288" height="138" fill="none" stroke="${c}" stroke-width="3" stroke-dasharray="10 6"/><rect x="20" y="20" width="260" height="36" fill="none" stroke="${c}" stroke-width="4"/><circle cx="60" cy="100" r="14" fill="none" stroke="${c}" stroke-width="3"/><circle cx="150" cy="100" r="14" fill="none" stroke="${c}" stroke-width="3"/><circle cx="240" cy="100" r="14" fill="none" stroke="${c}" stroke-width="3"/>` }),
]

export const ENTOURAGE_ITEMS: EntourageItem[] = [...PEOPLE, ...TREES, ...VEHICLES, ...FURNITURE, ...SITE]
export const ENTOURAGE_CATEGORIES: EntourageCategory[] = ['People', 'Trees', 'Vehicles', 'Furniture', 'Site']
export const getEntourageItem = (id: string) => ENTOURAGE_ITEMS.find(i => i.id === id)

/** Full standalone SVG for an item (panel thumbnails, exports). */
export function entourageSVG(item: EntourageItem, color = '#222222', px = 64): string {
  const [w, h] = item.vb
  const ratio = h / w
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${px}" height="${Math.round(px * ratio)}">${item.body(color)}</svg>`
}
