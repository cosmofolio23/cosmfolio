'use client'

/**
 * PublishingLayers — renders the Professional Publishing data (background
 * layers + master-page elements) onto a page. Previously the publishing editors
 * wrote to a model that was never drawn; this connects that model to the canvas,
 * the book view and the exported PDF.
 */

import type { DesignTokens } from './types'
import type { BackgroundLayer, BackgroundDefinition, MasterElement, GridSettings } from './publishingTypes'

export interface PageContext {
  pageNumber: number
  totalPages: number
  projectTitle?: string
  projectNumber?: string
}

const subst = (s: string | undefined, ctx: PageContext): string =>
  (s || '')
    .replace(/\$\{pageNumber\}/g, String(ctx.pageNumber))
    .replace(/\$\{totalPages\}/g, String(ctx.totalPages))
    .replace(/\$\{projectTitle\}/g, ctx.projectTitle || '')
    .replace(/\$\{projectNumber\}/g, ctx.projectNumber || '')
    .replace(/\$\{date\}/g, new Date().getFullYear().toString())

/* ----------------------------- backgrounds ------------------------------- */

function defStyle(d: BackgroundDefinition): React.CSSProperties {
  switch (d.type) {
    case 'solid':
      return { background: d.color }
    case 'gradient':
      return { background: `linear-gradient(${d.angle ?? 135}deg, ${d.from}, ${d.to})`, opacity: d.opacity ?? 1 }
    case 'image':
      return {
        backgroundImage: `url(${d.url})`,
        backgroundSize: d.fit === 'contain' ? 'contain' : d.fit === 'stretch' ? '100% 100%' : d.fit === 'tile' ? 'auto' : 'cover',
        backgroundRepeat: d.fit === 'tile' ? 'repeat' : 'no-repeat',
        backgroundPosition: 'center',
        opacity: d.opacity ?? 1,
        filter: d.blur ? `blur(${d.blur}px)` : undefined,
      }
    case 'pattern': {
      const c = d.color
      const s = (d.scale ?? 1) * 16
      const map: Record<string, string> = {
        dots: `radial-gradient(${c} 1.2px, transparent 1.2px)`,
        grid: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`,
        lines: `repeating-linear-gradient(0deg, ${c}, ${c} 1px, transparent 1px, transparent ${s}px)`,
        cross: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`,
        diagonal: `repeating-linear-gradient(45deg, ${c}, ${c} 1px, transparent 1px, transparent ${s}px)`,
        parametric: `repeating-linear-gradient(60deg, ${c}, ${c} 1px, transparent 1px, transparent ${s}px), repeating-linear-gradient(-60deg, ${c}, ${c} 1px, transparent 1px, transparent ${s}px)`,
      }
      return { backgroundImage: map[d.pattern] || map.dots, backgroundSize: `${s}px ${s}px`, opacity: d.opacity ?? 0.5 }
    }
    case 'grid': {
      const c = d.color
      const s = (d.scale ?? 1) * 24
      return {
        backgroundImage: `linear-gradient(${c} ${d.strokeWidth ?? 1}px, transparent ${d.strokeWidth ?? 1}px), linear-gradient(90deg, ${c} ${d.strokeWidth ?? 1}px, transparent ${d.strokeWidth ?? 1}px)`,
        backgroundSize: `${s}px ${s}px`,
        opacity: d.opacity ?? 0.3,
      }
    }
    case 'texture': {
      const tint: Record<string, string> = { concrete: '#9ca3af', brick: '#b45f4d', wood: '#a87b4f', stone: '#8d8d86', paper: '#efece4', fabric: '#b8b3a7' }
      return { background: tint[d.texture] || '#e5e5e5', opacity: d.opacity ?? 0.25 }
    }
    default:
      return {}
  }
}

function BackgroundLayerView({ layer }: { layer: BackgroundLayer }) {
  if (layer.visible === false) return null
  return (
    <div className="absolute inset-0" style={{ opacity: layer.opacity ?? 1, mixBlendMode: (layer.blendMode as any) || 'normal', zIndex: layer.zIndex ?? 0 }}>
      {layer.definitions.map((d, i) => {
        if (d.type === 'shape') {
          return <div key={i} className="absolute" style={{ left: `${d.x}%`, top: `${d.y}%`, width: `${d.width}%`, height: `${d.height}%`, background: d.color, opacity: d.opacity ?? 1, borderRadius: d.shape === 'circle' ? '50%' : undefined }} />
        }
        if (d.type === 'watermark') {
          return <div key={i} className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: d.opacity ?? 0.08 }}>
            <span style={{ transform: `rotate(${d.rotation ?? -30}deg)`, fontSize: d.fontSize ?? 72, color: d.color || '#000', fontWeight: 800, whiteSpace: 'nowrap' }}>{d.text}</span>
          </div>
        }
        return <div key={i} className="absolute inset-0" style={defStyle(d)} />
      })}
    </div>
  )
}

export function BackgroundLayers({ backgrounds }: { backgrounds?: BackgroundLayer[] }) {
  if (!backgrounds?.length) return null
  const sorted = [...backgrounds].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
  return <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>{sorted.map(l => <BackgroundLayerView key={l.id} layer={l} />)}</div>
}

/* --------------------------- master elements ----------------------------- */

const POS: Record<string, React.CSSProperties> = {
  'top-left': { top: '4%', left: '5%', textAlign: 'left' },
  'top-center': { top: '4%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' },
  'top-right': { top: '4%', right: '5%', textAlign: 'right' },
  'bottom-left': { bottom: '4%', left: '5%', textAlign: 'left' },
  'bottom-center': { bottom: '4%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' },
  'bottom-right': { bottom: '4%', right: '5%', textAlign: 'right' },
  'center': { top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' },
}

function MasterElementView({ el, ctx, tokens }: { el: MasterElement; ctx: PageContext; tokens: DesignTokens }) {
  if (el.hidden) return null
  const base: React.CSSProperties = el.position === 'custom'
    ? { left: el.x, top: el.y, width: el.width, height: el.height }
    : (POS[el.position] || POS['bottom-center'])
  const rot = el.rotation ? `rotate(${el.rotation}deg)` : ''
  const style: React.CSSProperties = {
    position: 'absolute', ...base,
    transform: `${base.transform || ''} ${rot}`.trim() || undefined,
    opacity: el.opacity ?? 1, zIndex: el.zIndex ?? 30,
    color: el.color || tokens.text, fontSize: el.fontSize ?? 11, fontFamily: el.fontFamily || tokens.bodyFont,
  }
  if (el.type === 'line') {
    return <div style={{ ...style, width: el.width ? `${el.width}px` : '90%', height: el.strokeWidth ?? 1, background: el.strokeColor || el.color || tokens.text }} />
  }
  if (el.type === 'shape') {
    return <div style={{ ...style, width: el.width ?? 40, height: el.height ?? 40, background: el.color || tokens.accent }} />
  }
  if (el.type === 'image' && el.imageUrl) {
    return <img src={el.imageUrl} alt="" style={{ ...style, width: el.width ?? 60, height: el.height ?? 60, objectFit: 'contain' }} />
  }
  if (el.type === 'watermark') {
    return <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: el.opacity ?? 0.08, zIndex: el.zIndex ?? 30 }}>
      <span style={{ transform: `rotate(${el.rotation ?? -30}deg)`, fontSize: el.fontSize ?? 64, color: el.color || tokens.text, fontWeight: 800, whiteSpace: 'nowrap' }}>{subst(el.textTemplate || el.text, ctx)}</span>
    </div>
  }
  // text
  return <div style={style} className="whitespace-nowrap">{subst(el.textTemplate || el.text, ctx)}</div>
}

export function MasterElements({ elements, ctx, tokens }: { elements?: MasterElement[]; ctx: PageContext; tokens: DesignTokens }) {
  if (!elements?.length) return null
  return <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 30 }}>{elements.map(el => <MasterElementView key={el.id} el={el} ctx={ctx} tokens={tokens} />)}</div>
}

/* ------------------------------- grid guides ----------------------------- */
/** Visual grid overlay (editing aid). Honors the GridEditor settings. */
export function GridOverlay({ grid }: { grid?: GridSettings }) {
  if (!grid || !grid.enabled || !grid.showGrid) return null
  const color = grid.gridColor || '#3b82f6'
  const op = grid.gridOpacity ?? 0.18
  const sw = grid.gridStrokeWidth ?? 1
  const lines: React.ReactNode[] = []

  if (grid.type === 'column') {
    const n = grid.columns ?? 12
    for (let i = 0; i <= n; i++) lines.push(<div key={`c${i}`} className="absolute top-0 bottom-0" style={{ left: `${(i / n) * 100}%`, width: sw, background: color }} />)
  } else if (grid.type === 'baseline') {
    const h = grid.baselineHeight ?? 24
    for (let y = 0; y < 1200; y += h) lines.push(<div key={`b${y}`} className="absolute left-0 right-0" style={{ top: y, height: sw, background: color }} />)
  } else if (grid.type === 'golden-ratio') {
    [38.2, 61.8].forEach((p, i) => {
      lines.push(<div key={`gx${i}`} className="absolute top-0 bottom-0" style={{ left: `${p}%`, width: sw, background: color }} />)
      lines.push(<div key={`gy${i}`} className="absolute left-0 right-0" style={{ top: `${p}%`, height: sw, background: color }} />)
    })
  } else {
    // modular / architectural / custom → square module grid
    const m = grid.moduleSize || grid.columnWidth || 40
    for (let x = 0; x < 800; x += m) lines.push(<div key={`mx${x}`} className="absolute top-0 bottom-0" style={{ left: x, width: sw, background: color }} />)
    for (let y = 0; y < 1200; y += (grid.rowHeight || m)) lines.push(<div key={`my${y}`} className="absolute left-0 right-0" style={{ top: y, height: sw, background: color }} />)
  }

  return <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 20, opacity: op }}>{lines}</div>
}
