/**
 * Architectural hatch / material pattern library.
 *
 * Each pattern is drawn onto a small transparent tile canvas which is then used
 * as a repeating CanvasPattern. Patterns are scalable (the tile size grows with
 * `scale`) and colour-customisable.
 */

export type HatchScale = 'small' | 'medium' | 'large'

export interface HatchDef {
  id: string
  name: string
  category: 'Structural' | 'Natural' | 'Building' | 'Site'
  /** Base tile size in px at medium scale. */
  base: number
  draw: (ctx: CanvasRenderingContext2D, s: number, color: string, lw: number) => void
}

const SCALE_FACTOR: Record<HatchScale, number> = {
  small: 0.7,
  medium: 1,
  large: 1.5,
}

const line = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

const dot = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

export const HATCHES: HatchDef[] = [
  // ---------------- Structural ----------------
  {
    id: 'concrete', name: 'Concrete', category: 'Structural', base: 16,
    draw: (ctx, s, c, lw) => {
      ctx.strokeStyle = c; ctx.lineWidth = lw
      line(ctx, 0, s, s, 0)
      ctx.fillStyle = c
      dot(ctx, s * 0.3, s * 0.35, lw * 0.7)
      dot(ctx, s * 0.7, s * 0.7, lw * 0.7)
    },
  },
  {
    id: 'reinforced-concrete', name: 'Reinforced Concrete', category: 'Structural', base: 16,
    draw: (ctx, s, c, lw) => {
      ctx.strokeStyle = c; ctx.lineWidth = lw
      line(ctx, 0, s, s, 0)
      line(ctx, 0, s * 0.5, s * 0.5, 0)
      line(ctx, s * 0.5, s, s, s * 0.5)
      ctx.fillStyle = c
      dot(ctx, s * 0.25, s * 0.25, lw * 0.8)
      dot(ctx, s * 0.75, s * 0.75, lw * 0.8)
    },
  },
  {
    id: 'brick', name: 'Brick (running bond)', category: 'Structural', base: 22,
    draw: (ctx, s, c, lw) => {
      ctx.strokeStyle = c; ctx.lineWidth = lw
      const h = s / 2
      line(ctx, 0, h, s, h)
      line(ctx, 0, s, s, s)
      line(ctx, s * 0.5, 0, s * 0.5, h)
      line(ctx, 0, h, 0, s)
      line(ctx, s, h, s, s)
    },
  },
  {
    id: 'stone', name: 'Stone (random)', category: 'Structural', base: 24,
    draw: (ctx, s, c, lw) => {
      ctx.strokeStyle = c; ctx.lineWidth = lw
      ctx.beginPath()
      ctx.moveTo(0, s * 0.4); ctx.lineTo(s * 0.4, s * 0.3); ctx.lineTo(s * 0.45, s * 0.7)
      ctx.lineTo(s * 0.1, s * 0.85); ctx.lineTo(0, s * 0.6)
      ctx.moveTo(s * 0.55, 0); ctx.lineTo(s, s * 0.15); ctx.lineTo(s * 0.85, s * 0.55)
      ctx.lineTo(s * 0.55, s * 0.45); ctx.closePath()
      ctx.moveTo(s * 0.5, s * 0.8); ctx.lineTo(s, s * 0.7); ctx.lineTo(s * 0.9, s)
      ctx.stroke()
    },
  },
  {
    id: 'blockwork', name: 'Blockwork', category: 'Structural', base: 22,
    draw: (ctx, s, c, lw) => {
      ctx.strokeStyle = c; ctx.lineWidth = lw
      ctx.strokeRect(lw, lw, s - lw * 2, s / 2 - lw * 2)
      ctx.strokeRect(lw, s / 2 + lw, s - lw * 2, s / 2 - lw * 2)
    },
  },
  // ---------------- Natural ----------------
  {
    id: 'earth', name: 'Earth / Soil', category: 'Natural', base: 16,
    draw: (ctx, s, c, lw) => {
      ctx.strokeStyle = c; ctx.lineWidth = lw
      ctx.setLineDash([s * 0.18, s * 0.14])
      line(ctx, -2, s, s + 2, 0)
      line(ctx, -2, s * 1.5, s + 2, s * 0.5)
      ctx.setLineDash([])
    },
  },
  {
    id: 'grass', name: 'Grass / Vegetation', category: 'Natural', base: 18,
    draw: (ctx, s, c, lw) => {
      ctx.strokeStyle = c; ctx.lineWidth = lw
      const tuft = (x: number) => {
        line(ctx, x, s, x - s * 0.12, s * 0.55)
        line(ctx, x, s, x, s * 0.45)
        line(ctx, x, s, x + s * 0.12, s * 0.55)
      }
      tuft(s * 0.3); tuft(s * 0.75)
    },
  },
  {
    id: 'water', name: 'Water', category: 'Natural', base: 16,
    draw: (ctx, s, c, lw) => {
      ctx.strokeStyle = c; ctx.lineWidth = lw
      line(ctx, 0, s * 0.35, s, s * 0.35)
      line(ctx, 0, s * 0.7, s * 0.6, s * 0.7)
    },
  },
  {
    id: 'sand', name: 'Sand', category: 'Natural', base: 12,
    draw: (ctx, s, c, lw) => {
      ctx.fillStyle = c
      const pts = [[0.2, 0.25], [0.6, 0.2], [0.8, 0.55], [0.35, 0.65], [0.5, 0.9], [0.1, 0.8]]
      pts.forEach(([x, y]) => dot(ctx, x * s, y * s, lw * 0.6))
    },
  },
  {
    id: 'gravel', name: 'Gravel', category: 'Natural', base: 16,
    draw: (ctx, s, c, lw) => {
      ctx.strokeStyle = c; ctx.lineWidth = lw * 0.8
      const circ = (x: number, y: number, r: number) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke() }
      circ(s * 0.3, s * 0.3, s * 0.12)
      circ(s * 0.7, s * 0.6, s * 0.16)
      circ(s * 0.25, s * 0.75, s * 0.1)
    },
  },
  // ---------------- Building ----------------
  {
    id: 'timber', name: 'Timber (grain)', category: 'Building', base: 18,
    draw: (ctx, s, c, lw) => {
      ctx.strokeStyle = c; ctx.lineWidth = lw * 0.8
      for (let i = 0.2; i < 1; i += 0.3) {
        ctx.beginPath()
        ctx.moveTo(0, s * i)
        ctx.bezierCurveTo(s * 0.3, s * (i - 0.12), s * 0.7, s * (i + 0.12), s, s * i)
        ctx.stroke()
      }
    },
  },
  {
    id: 'glass', name: 'Glass', category: 'Building', base: 16,
    draw: (ctx, s, c, lw) => {
      ctx.strokeStyle = c; ctx.lineWidth = lw * 0.7
      line(ctx, 0, s * 0.7, s * 0.7, 0)
      line(ctx, s * 0.3, s, s, s * 0.3)
    },
  },
  {
    id: 'insulation', name: 'Insulation', category: 'Building', base: 20,
    draw: (ctx, s, c, lw) => {
      ctx.strokeStyle = c; ctx.lineWidth = lw * 0.9
      ctx.beginPath()
      const n = 4, amp = s * 0.3, mid = s * 0.5
      ctx.moveTo(0, mid)
      for (let i = 0; i <= n; i++) {
        const x = (i / n) * s
        ctx.lineTo(x, mid + (i % 2 === 0 ? -amp : amp))
      }
      ctx.stroke()
    },
  },
  {
    id: 'steel', name: 'Steel (cross hatch)', category: 'Building', base: 12,
    draw: (ctx, s, c, lw) => {
      ctx.strokeStyle = c; ctx.lineWidth = lw
      line(ctx, 0, s, s, 0)
      line(ctx, 0, 0, s, s)
    },
  },
  {
    id: 'screed', name: 'Screed', category: 'Building', base: 12,
    draw: (ctx, s, c, lw) => {
      ctx.fillStyle = c
      dot(ctx, s * 0.5, s * 0.5, lw * 0.5)
      dot(ctx, s * 0.1, s * 0.15, lw * 0.4)
      dot(ctx, s * 0.85, s * 0.8, lw * 0.4)
    },
  },
  // ---------------- Site ----------------
  {
    id: 'tarmac', name: 'Tarmac / Road', category: 'Site', base: 10,
    draw: (ctx, s, c, lw) => {
      ctx.fillStyle = c
      for (let i = 0; i < 7; i++) {
        dot(ctx, Math.random() * s, Math.random() * s, lw * 0.45)
      }
    },
  },
  {
    id: 'paving', name: 'Paving (grid)', category: 'Site', base: 20,
    draw: (ctx, s, c, lw) => {
      ctx.strokeStyle = c; ctx.lineWidth = lw
      ctx.strokeRect(0, 0, s, s)
      line(ctx, s * 0.5, 0, s * 0.5, s)
      line(ctx, 0, s * 0.5, s, s * 0.5)
    },
  },
  {
    id: 'gravel-path', name: 'Gravel Path', category: 'Site', base: 14,
    draw: (ctx, s, c, lw) => {
      ctx.strokeStyle = c; ctx.lineWidth = lw * 0.7
      const circ = (x: number, y: number, r: number) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke() }
      circ(s * 0.35, s * 0.35, s * 0.14)
      circ(s * 0.72, s * 0.68, s * 0.1)
    },
  },
  {
    id: 'planted', name: 'Planted Area', category: 'Site', base: 18,
    draw: (ctx, s, c, lw) => {
      ctx.strokeStyle = c; ctx.lineWidth = lw * 0.8
      ctx.fillStyle = c
      const plant = (x: number, y: number) => {
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
          line(ctx, x, y, x + Math.cos(a) * s * 0.14, y + Math.sin(a) * s * 0.14)
        }
      }
      plant(s * 0.35, s * 0.4); plant(s * 0.72, s * 0.72)
    },
  },
]

export const HATCH_CATEGORIES = ['Structural', 'Natural', 'Building', 'Site'] as const

export const getHatch = (id: string): HatchDef | undefined => HATCHES.find(h => h.id === id)

/**
 * Build a repeating CanvasPattern tile for the given hatch.
 */
export function makeHatchPattern(
  ctx: CanvasRenderingContext2D,
  hatchId: string,
  opts: { scale?: HatchScale; color?: string; lineWidth?: number } = {}
): CanvasPattern | null {
  const def = getHatch(hatchId)
  if (!def) return null
  const scale = SCALE_FACTOR[opts.scale ?? 'medium']
  const size = Math.max(6, Math.round(def.base * scale))
  const lw = Math.max(0.6, (opts.lineWidth ?? 1.1) * scale)
  const tile = document.createElement('canvas')
  tile.width = size
  tile.height = size
  const tctx = tile.getContext('2d')!
  tctx.lineCap = 'round'
  tctx.lineJoin = 'round'
  def.draw(tctx, size, opts.color ?? '#333333', lw)
  return ctx.createPattern(tile, 'repeat')
}
