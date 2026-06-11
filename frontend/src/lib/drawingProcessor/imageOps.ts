/**
 * Client-side raster image operations for the Drawing Processor.
 * All operations work on ImageData / typed arrays for speed.
 */

export interface Adjustments {
  brightness: number // -100..100
  contrast: number   // -100..100
  tone: number       // -100 (cool) .. 100 (warm)
  invert: boolean
}

export interface LineSettings {
  threshold: number    // 0..255 luminance cut-off for "ink"
  weight: number       // 0..4 overall dilation radius
  wall: number         // 0..1.5 opacity multiplier, darkest tier
  annotation: number   // 0..1.5 opacity multiplier, mid tier
  dimension: number    // 0..1.5 opacity multiplier, lightest tier
  color: string        // ink colour
}

export const luminance = (r: number, g: number, b: number) =>
  0.299 * r + 0.587 * g + 0.114 * b

const clamp = (v: number, lo = 0, hi = 255) => (v < lo ? lo : v > hi ? hi : v)

/** Apply brightness / contrast / warm-cool tone / invert. Returns a new ImageData. */
export function applyAdjustments(src: ImageData, adj: Adjustments): ImageData {
  const out = new ImageData(src.width, src.height)
  const s = src.data, d = out.data
  const b = adj.brightness * 1.2
  const cf = (259 * (adj.contrast + 255)) / (255 * (259 - adj.contrast))
  const warm = adj.tone * 0.6 // +warm: more red, less blue
  for (let i = 0; i < s.length; i += 4) {
    let r = s[i], g = s[i + 1], bl = s[i + 2]
    // brightness
    r += b; g += b; bl += b
    // contrast
    r = cf * (r - 128) + 128
    g = cf * (g - 128) + 128
    bl = cf * (bl - 128) + 128
    // tone
    r += warm; bl -= warm
    if (adj.invert) { r = 255 - r; g = 255 - g; bl = 255 - bl }
    d[i] = clamp(r); d[i + 1] = clamp(g); d[i + 2] = clamp(bl); d[i + 3] = s[i + 3]
  }
  return out
}

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace('#', '')
  const n = m.length === 3
    ? m.split('').map(c => parseInt(c + c, 16))
    : [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)]
  return [n[0] || 0, n[1] || 0, n[2] || 0]
}

/**
 * Build the "ink" layer: dark pixels of the adjusted image rendered in the ink
 * colour with alpha derived from how dark they are, bucketed into three weight
 * tiers (wall / annotation / dimension) and dilated by `weight` px.
 */
export function computeInk(src: ImageData, ls: LineSettings): ImageData {
  const { width: w, height: h } = src
  const s = src.data
  const t = ls.threshold
  const t1 = t * 0.34, t2 = t * 0.67
  const alpha = new Float32Array(w * h)
  for (let p = 0, i = 0; p < w * h; p++, i += 4) {
    const L = luminance(s[i], s[i + 1], s[i + 2])
    if (L < t) {
      let mul = ls.dimension
      if (L < t1) mul = ls.wall
      else if (L < t2) mul = ls.annotation
      let a = (1 - L / t) * mul
      alpha[p] = a > 1 ? 1 : a
    }
  }
  const dilated = ls.weight > 0 ? dilateAlpha(alpha, w, h, Math.round(ls.weight)) : alpha
  const out = new ImageData(w, h)
  const d = out.data
  const [ir, ig, ib] = hexToRgb(ls.color)
  for (let p = 0, i = 0; p < w * h; p++, i += 4) {
    const a = dilated[p]
    if (a > 0.003) {
      d[i] = ir; d[i + 1] = ig; d[i + 2] = ib; d[i + 3] = Math.round((a > 1 ? 1 : a) * 255)
    }
  }
  return out
}

/** Separable max-filter dilation on an alpha buffer. */
function dilateAlpha(a: Float32Array, w: number, h: number, r: number): Float32Array {
  if (r <= 0) return a
  const tmp = new Float32Array(w * h)
  const out = new Float32Array(w * h)
  // horizontal
  for (let y = 0; y < h; y++) {
    const row = y * w
    for (let x = 0; x < w; x++) {
      let m = 0
      for (let k = -r; k <= r; k++) {
        const xx = x + k
        if (xx >= 0 && xx < w) { const v = a[row + xx]; if (v > m) m = v }
      }
      tmp[row + x] = m
    }
  }
  // vertical
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let m = 0
      for (let k = -r; k <= r; k++) {
        const yy = y + k
        if (yy >= 0 && yy < h) { const v = tmp[yy * w + x]; if (v > m) m = v }
      }
      out[y * w + x] = m
    }
  }
  return out
}

export interface FloodResult {
  mask: Uint8Array
  /** Bounding centroid (for placing labels). */
  cx: number
  cy: number
  count: number
}

/**
 * Flood fill the connected "fillable" region around (sx, sy). A pixel is
 * fillable when it is not ink (luminance above lineThreshold) and its colour is
 * within `tolerance` of the seed. Ink pixels act as walls, so rooms bounded by
 * black lines fill cleanly.
 */
export function floodFillRegion(
  src: ImageData,
  sx: number,
  sy: number,
  lineThreshold: number,
  tolerance: number
): FloodResult {
  const { width: w, height: h } = src
  const s = src.data
  const mask = new Uint8Array(w * h)
  const si = (sy * w + sx) * 4
  const sr = s[si], sg = s[si + 1], sb = s[si + 2]
  // If seed is ink, nudge nothing — just return empty.
  if (luminance(sr, sg, sb) < lineThreshold) {
    return { mask, cx: sx, cy: sy, count: 0 }
  }
  const stack: number[] = [sy * w + sx]
  let sumX = 0, sumY = 0, count = 0
  const tol2 = tolerance * tolerance * 3
  while (stack.length) {
    const p = stack.pop()!
    if (mask[p]) continue
    const i = p * 4
    const L = luminance(s[i], s[i + 1], s[i + 2])
    if (L < lineThreshold) continue // hit a wall
    const dr = s[i] - sr, dg = s[i + 1] - sg, db = s[i + 2] - sb
    if (dr * dr + dg * dg + db * db > tol2) continue
    mask[p] = 1
    const x = p % w, y = (p - x) / w
    sumX += x; sumY += y; count++
    if (x > 0) stack.push(p - 1)
    if (x < w - 1) stack.push(p + 1)
    if (y > 0) stack.push(p - w)
    if (y < h - 1) stack.push(p + w)
  }
  return {
    mask,
    cx: count ? Math.round(sumX / count) : sx,
    cy: count ? Math.round(sumY / count) : sy,
    count,
  }
}

/** Convert a region mask into an alpha mask canvas (255 where region). */
export function maskToCanvas(mask: Uint8Array, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(w, h)
  const d = img.data
  for (let p = 0; p < mask.length; p++) {
    if (mask[p]) { const i = p * 4; d[i + 3] = 255 }
  }
  ctx.putImageData(img, 0, 0)
  return c
}
