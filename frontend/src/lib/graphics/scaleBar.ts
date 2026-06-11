/**
 * Scale bar generator — produces SVG scale bars sized correctly for a given
 * architectural scale (1:N). At 96dpi, 1mm of paper = 3.7795px.
 */

export const PX_PER_MM = 3.7795

export type ScaleBarStyle = 'classic' | 'minimal' | 'graphic' | 'dotted'
export type ScaleBarSize = 'small' | 'medium' | 'large'

export interface ScaleBarOptions {
  scale: number          // denominator, e.g. 100 for 1:100
  length: number         // real-world length shown, in chosen units
  units: 'm' | 'ft'
  style: ScaleBarStyle
  size: ScaleBarSize
  color: string
}

export const COMMON_SCALES = [20, 50, 100, 200, 500, 1000]

const SIZE_MULT: Record<ScaleBarSize, number> = { small: 0.75, medium: 1, large: 1.5 }

/** Pick a friendly segment count for the given length. */
function segmentCount(length: number): number {
  for (const n of [5, 4, 2]) if (length % n === 0) return n
  return 4
}

export function generateScaleBar(o: ScaleBarOptions): { svg: string; width: number; height: number } {
  const meters = o.units === 'ft' ? o.length * 0.3048 : o.length
  const paperMm = (meters * 1000) / o.scale
  const mult = SIZE_MULT[o.size]
  const barW = Math.max(40, paperMm * PX_PER_MM * mult)
  const barH = 8 * mult
  const pad = 14 * mult
  const labelH = 14 * mult
  const W = barW + pad * 2
  const H = barH + labelH + 10 * mult
  const segs = segmentCount(o.length)
  const segW = barW / segs
  const c = o.color
  const fs = 9.5 * mult
  const y0 = labelH

  let body = ''
  if (o.style === 'classic') {
    for (let i = 0; i < segs; i++) {
      const fill = i % 2 === 0 ? c : 'none'
      body += `<rect x="${pad + i * segW}" y="${y0}" width="${segW}" height="${barH}" fill="${fill}" stroke="${c}" stroke-width="${1 * mult}"/>`
    }
  } else if (o.style === 'minimal') {
    body += `<line x1="${pad}" y1="${y0 + barH / 2}" x2="${pad + barW}" y2="${y0 + barH / 2}" stroke="${c}" stroke-width="${1.4 * mult}"/>`
    for (let i = 0; i <= segs; i++) {
      body += `<line x1="${pad + i * segW}" y1="${y0}" x2="${pad + i * segW}" y2="${y0 + barH}" stroke="${c}" stroke-width="${1.2 * mult}"/>`
    }
  } else if (o.style === 'graphic') {
    body += `<rect x="${pad}" y="${y0}" width="${barW}" height="${barH}" rx="${barH / 2}" fill="${c}" opacity="0.18"/>`
    body += `<rect x="${pad}" y="${y0}" width="${barW / 2}" height="${barH}" rx="${barH / 2}" fill="${c}"/>`
  } else { // dotted
    const dots = segs * 4
    for (let i = 0; i <= dots; i++) {
      const r = i % 4 === 0 ? 2.2 * mult : 1.1 * mult
      body += `<circle cx="${pad + (i / dots) * barW}" cy="${y0 + barH / 2}" r="${r}" fill="${c}"/>`
    }
  }

  // numeric labels at 0, mid, end (and quarter marks for classic/minimal)
  const labelAt = (i: number) => Math.round((o.length / segs) * i * 100) / 100
  let labels = ''
  const labelIdx = segs <= 2 ? [0, 1, 2].slice(0, segs + 1) : [0, segs / 2, segs].filter(n => Number.isInteger(n))
  const shown = o.style === 'classic' || o.style === 'minimal'
    ? Array.from({ length: segs + 1 }, (_, i) => i)
    : labelIdx
  for (const i of shown) {
    labels += `<text x="${pad + i * segW}" y="${y0 - 4 * mult}" font-size="${fs}" text-anchor="middle" fill="${c}" font-family="Inter, system-ui, sans-serif">${labelAt(i)}</text>`
  }
  labels += `<text x="${pad + barW + 4 * mult}" y="${y0 + barH / 2 + fs / 3}" font-size="${fs}" fill="${c}" font-family="Inter, system-ui, sans-serif">${o.units}</text>`
  const scaleText = `<text x="${pad}" y="${y0 + barH + 12 * mult}" font-size="${fs}" fill="${c}" font-family="Inter, system-ui, sans-serif">SCALE 1:${o.scale}</text>`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W + 20 * mult} ${H + 6 * mult}" width="${W + 20 * mult}" height="${H + 6 * mult}">${body}${labels}${scaleText}</svg>`
  return { svg, width: W + 20 * mult, height: H + 6 * mult }
}
