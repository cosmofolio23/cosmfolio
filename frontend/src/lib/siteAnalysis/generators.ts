/**
 * Site-analysis diagram generators: sun path (real solar geometry) and wind
 * rose, with typical-climate presets for major Indian cities.
 */

export interface CityPreset {
  name: string
  lat: number
  lon: number
  /** typical annual wind frequency % by direction [N,NE,E,SE,S,SW,W,NW] (approximate) */
  wind: number[]
}

export const INDIAN_CITIES: CityPreset[] = [
  { name: 'Mumbai', lat: 19.08, lon: 72.88, wind: [6, 5, 4, 6, 10, 18, 30, 21] },
  { name: 'Delhi', lat: 28.61, lon: 77.21, wind: [10, 8, 8, 10, 8, 12, 22, 22] },
  { name: 'Chennai', lat: 13.08, lon: 80.27, wind: [8, 10, 14, 22, 18, 12, 8, 8] },
  { name: 'Bangalore', lat: 12.97, lon: 77.59, wind: [6, 10, 22, 18, 8, 8, 16, 12] },
  { name: 'Kolkata', lat: 22.57, lon: 88.36, wind: [8, 8, 8, 14, 26, 18, 8, 10] },
  { name: 'Hyderabad', lat: 17.39, lon: 78.49, wind: [8, 8, 12, 16, 10, 14, 22, 10] },
  { name: 'Ahmedabad', lat: 23.02, lon: 72.57, wind: [8, 6, 6, 8, 12, 24, 24, 12] },
  { name: 'Pune', lat: 18.52, lon: 73.86, wind: [8, 6, 6, 8, 8, 14, 28, 22] },
  { name: 'Jaipur', lat: 26.91, lon: 75.79, wind: [8, 8, 8, 8, 10, 18, 26, 14] },
  { name: 'Chandigarh', lat: 30.73, lon: 76.78, wind: [10, 8, 8, 16, 12, 10, 14, 22] },
]

const D2R = Math.PI / 180

/** Solar position (altitude/azimuth in degrees) for latitude, declination, hour angle H (deg). */
function solarPos(latDeg: number, decDeg: number, Hdeg: number) {
  const lat = latDeg * D2R, dec = decDeg * D2R, H = Hdeg * D2R
  const sinAlt = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H)
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)))
  let cosAz = (Math.sin(dec) - sinAlt * Math.sin(lat)) / (Math.cos(alt) * Math.cos(lat) || 1e-9)
  cosAz = Math.max(-1, Math.min(1, cosAz))
  let az = Math.acos(cosAz) / D2R // from north, 0..180
  if (Hdeg > 0) az = 360 - az      // afternoon → west side
  return { alt: alt / D2R, az }
}

function dayArcPath(lat: number, dec: number, R: number, cx: number, cy: number): { d: string; any: boolean } {
  let d = ''
  let any = false
  for (let H = -120; H <= 120; H += 3) {
    const { alt, az } = solarPos(lat, dec, H)
    if (alt <= 0) continue
    const r = R * (90 - alt) / 90
    const x = cx + r * Math.sin(az * D2R)
    const y = cy - r * Math.cos(az * D2R)
    d += `${any ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)} `
    any = true
  }
  return { d, any }
}

function sunTimes(lat: number, dec: number): { rise: string; set: string } {
  const t = -Math.tan(lat * D2R) * Math.tan(dec * D2R)
  if (t <= -1) return { rise: '00:00', set: '24:00' }
  if (t >= 1) return { rise: '—', set: '—' }
  const H0 = Math.acos(t) / D2R
  const hrs = H0 / 15
  const fmt = (h: number) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`
  return { rise: fmt(12 - hrs), set: fmt(12 + hrs) }
}

export type SunPathStyle = 'flat' | 'dome' | 'arc'

export function generateSunPath(lat: number, style: SunPathStyle = 'flat'): string {
  const W = 520, H2 = 540, cx = W / 2, cy = 268, R = 200
  const warm = ['#E8801A', '#E8B021', '#C24E11']
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H2}" width="${W}" height="${H2}">`
  s += `<rect width="${W}" height="${H2}" fill="#ffffff"/>`

  if (style === 'arc') {
    // simple section-style arcs: E left → W right
    const gy = 380
    s += `<line x1="40" y1="${gy}" x2="${W - 40}" y2="${gy}" stroke="#444" stroke-width="2"/>`
    const arcs: Array<[number, string, string]> = [
      [90 - Math.abs(lat - 23.44), warm[0], 'Summer solstice'],
      [90 - Math.abs(lat), warm[1], 'Equinox'],
      [90 - Math.abs(lat + 23.44), warm[2], 'Winter solstice'],
    ]
    arcs.forEach(([alt, col, label], i) => {
      const peak = gy - (alt / 90) * 300
      s += `<path d="M70 ${gy} Q ${cx} ${peak * 2 - gy} ${W - 70} ${gy}" fill="none" stroke="${col}" stroke-width="3"/>`
      s += `<text x="${cx}" y="${Math.max(26, peak - 8)}" font-size="11" text-anchor="middle" fill="${col}" font-family="Inter,sans-serif">${label} · ${alt.toFixed(0)}°</text>`
      s += `<circle cx="${cx + (i - 1) * 60}" cy="${gy - ((alt / 90) * 300) * (1 - Math.pow(((i - 1) * 60) / (cx - 70), 2))}" r="9" fill="${col}"/>`
    })
    s += `<text x="60" y="${gy + 22}" font-size="13" font-weight="700" fill="#333" font-family="Inter,sans-serif">E</text>`
    s += `<text x="${W - 70}" y="${gy + 22}" font-size="13" font-weight="700" fill="#333" font-family="Inter,sans-serif">W</text>`
    s += `<text x="${cx}" y="${gy + 40}" font-size="11" text-anchor="middle" fill="#777" font-family="Inter,sans-serif">Solar noon altitudes at latitude ${lat.toFixed(1)}°</text>`
    s += '</svg>'
    return s
  }

  // dome shading
  if (style === 'dome') {
    s += `<defs><radialGradient id="dome" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#FFF7E0"/><stop offset="100%" stop-color="#FFE9B8"/></radialGradient></defs>`
    s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#dome)"/>`
  }

  // altitude rings 30/60 + horizon
  for (const alt of [0, 30, 60]) {
    const r = R * (90 - alt) / 90
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#bbb" stroke-width="${alt === 0 ? 2 : 1}" ${alt !== 0 ? 'stroke-dasharray="5 4"' : ''}/>`
    if (alt > 0) s += `<text x="${cx + 4}" y="${cy - r - 3}" font-size="9" fill="#999" font-family="Inter,sans-serif">${alt}°</text>`
  }
  // cardinal labels
  const card: Array<[string, number, number]> = [['N', cx, cy - R - 10], ['S', cx, cy + R + 20], ['E', cx + R + 14, cy + 4], ['W', cx - R - 14, cy + 4]]
  for (const [t, x, y] of card) s += `<text x="${x}" y="${y}" font-size="14" font-weight="700" text-anchor="middle" fill="#333" font-family="Inter,sans-serif">${t}</text>`
  // hour ticks
  for (let i = 0; i < 24; i++) {
    const a = i * 15 * D2R
    s += `<line x1="${cx + (R - 5) * Math.sin(a)}" y1="${cy - (R - 5) * Math.cos(a)}" x2="${cx + R * Math.sin(a)}" y2="${cy - R * Math.cos(a)}" stroke="#bbb" stroke-width="1"/>`
  }

  const days: Array<[number, string, string]> = [
    [23.44, warm[0], 'Summer solstice (Jun 21)'],
    [0, warm[1], 'Equinox (Mar/Sep 21)'],
    [-23.44, warm[2], 'Winter solstice (Dec 21)'],
  ]
  let legendY = cy + R + 44
  for (const [dec, col, label] of days) {
    const { d, any } = dayArcPath(lat, dec, R, cx, cy)
    if (any) s += `<path d="${d}" fill="none" stroke="${col}" stroke-width="3.5" stroke-linecap="round"/>`
    const noon = solarPos(lat, dec, 0)
    if (noon.alt > 0) {
      const r = R * (90 - noon.alt) / 90
      const x = cx + r * Math.sin(noon.az * D2R), y = cy - r * Math.cos(noon.az * D2R)
      s += `<circle cx="${x}" cy="${y}" r="7" fill="${col}"/>`
    }
    const t = sunTimes(lat, dec)
    s += `<circle cx="60" cy="${legendY - 4}" r="5" fill="${col}"/>`
    s += `<text x="72" y="${legendY}" font-size="11" fill="#444" font-family="Inter,sans-serif">${label} · ↑${t.rise} ↓${t.set} · noon ${(90 - Math.abs(lat - dec)).toFixed(0)}°</text>`
    legendY += 18
  }
  s += `<text x="${cx}" y="24" font-size="12" text-anchor="middle" fill="#777" font-family="Inter,sans-serif">Sun path · latitude ${lat.toFixed(1)}°${lat >= 0 ? 'N' : 'S'}</text>`
  s += '</svg>'
  return s
}

export interface WindRoseInput {
  percentages: number[] // 8 dirs N..NW
  speedSplit: [number, number, number] // % light / moderate / strong of each petal
}

const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
const SPEED_COLORS = ['#9CC4E4', '#4A90C4', '#1F5C8B']
const SPEED_LABELS = ['Light (0–3 m/s)', 'Moderate (3–6 m/s)', 'Strong (6+ m/s)']

export function generateWindRose(input: WindRoseInput): string {
  const W = 520, H = 560, cx = W / 2, cy = 250, R = 190
  const maxP = Math.max(...input.percentages, 1)
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`
  s += `<rect width="${W}" height="${H}" fill="#ffffff"/>`
  // rings + labels
  for (let i = 1; i <= 4; i++) {
    const r = (R * i) / 4
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ddd" stroke-width="1"/>`
    s += `<text x="${cx + 4}" y="${cy - r - 3}" font-size="9" fill="#aaa" font-family="Inter,sans-serif">${Math.round((maxP * i) / 4)}%</text>`
  }
  DIRS.forEach((d, i) => {
    const a = i * 45 * D2R
    s += `<text x="${cx + (R + 18) * Math.sin(a)}" y="${cy - (R + 18) * Math.cos(a) + 5}" font-size="13" font-weight="700" text-anchor="middle" fill="#333" font-family="Inter,sans-serif">${d}</text>`
  })
  // petals (stacked by speed)
  const split = input.speedSplit
  const splitSum = split[0] + split[1] + split[2] || 1
  input.percentages.forEach((p, i) => {
    const a = i * 45 * D2R
    const halfW = 13 * D2R
    let r0 = 0
    for (let sIdx = 0; sIdx < 3; sIdx++) {
      const segLen = (R * (p / maxP)) * (split[sIdx] / splitSum)
      const r1 = r0 + segLen
      if (segLen < 0.5) { r0 = r1; continue }
      const x0a = cx + r0 * Math.sin(a - halfW), y0a = cy - r0 * Math.cos(a - halfW)
      const x0b = cx + r0 * Math.sin(a + halfW), y0b = cy - r0 * Math.cos(a + halfW)
      const x1a = cx + r1 * Math.sin(a - halfW), y1a = cy - r1 * Math.cos(a - halfW)
      const x1b = cx + r1 * Math.sin(a + halfW), y1b = cy - r1 * Math.cos(a + halfW)
      s += `<path d="M${x0a} ${y0a} L${x1a} ${y1a} L${x1b} ${y1b} L${x0b} ${y0b} Z" fill="${SPEED_COLORS[sIdx]}" stroke="#fff" stroke-width="1"/>`
      r0 = r1
    }
  })
  s += `<circle cx="${cx}" cy="${cy}" r="6" fill="#333"/>`
  // legend
  let ly = cy + R + 50
  SPEED_LABELS.forEach((lbl, i) => {
    s += `<rect x="60" y="${ly - 10}" width="14" height="14" fill="${SPEED_COLORS[i]}"/>`
    s += `<text x="82" y="${ly + 2}" font-size="11" fill="#444" font-family="Inter,sans-serif">${lbl}</text>`
    ly += 22
  })
  s += `<text x="${cx}" y="24" font-size="12" text-anchor="middle" fill="#777" font-family="Inter,sans-serif">Wind rose · frequency by direction</text>`
  s += '</svg>'
  return s
}

/** Land use type palette (standard architectural colour codes). */
export const LAND_USE_TYPES = [
  { id: 'residential', name: 'Residential', color: '#F2D478' },
  { id: 'commercial', name: 'Commercial', color: '#E2574C' },
  { id: 'industrial', name: 'Industrial', color: '#9B7EB8' },
  { id: 'institutional', name: 'Institutional', color: '#5B8FD9' },
  { id: 'green', name: 'Green / Open', color: '#7FBE7B' },
  { id: 'mixed', name: 'Mixed Use', color: '#E8A14E' },
  { id: 'water', name: 'Water body', color: '#7EC8E3' },
  { id: 'transport', name: 'Transportation', color: '#A9A9A9' },
]

export const ACCESS_TYPES = [
  { id: 'vehicular', name: 'Vehicular', color: '#2F4B7C', dash: '' },
  { id: 'pedestrian', name: 'Pedestrian', color: '#2E8B57', dash: '10 7' },
  { id: 'transit', name: 'Public transport', color: '#E8801A', dash: '' },
  { id: 'emergency', name: 'Emergency', color: '#D03B3B', dash: '14 5 3 5' },
]

export const NOISE_LEVELS = [
  { id: 'high', name: 'High', color: '#D03B3B' },
  { id: 'medium', name: 'Medium', color: '#E8B021' },
  { id: 'low', name: 'Low', color: '#5BA85A' },
]
