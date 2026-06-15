'use client'

/**
 * PublishingLayers — renders the Professional Publishing data (background
 * layers + master-page elements) onto a page. Previously the publishing editors
 * wrote to a model that was never drawn; this connects that model to the canvas,
 * the book view and the exported PDF.
 */

import { useState } from 'react'
import type { DesignTokens } from './types'
import type { BackgroundLayer, BackgroundDefinition, MasterElement, GridSettings, DrawingMetadata } from './publishingTypes'

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

function MasterElementView({
  el,
  ctx,
  tokens,
  editable = false,
  isSelected = false,
  onSelect,
}: {
  el: MasterElement
  ctx: PageContext
  tokens: DesignTokens
  editable?: boolean
  isSelected?: boolean
  onSelect?: () => void
}) {
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
    outline: isSelected ? '2px solid #7c3aed' : undefined,
    outlineOffset: '2px',
    cursor: editable && !el.locked ? 'pointer' : undefined,
  }

  const handleSelect = (e: React.MouseEvent) => {
    if (!editable) return
    e.stopPropagation()
    onSelect?.()
  }

  if (el.type === 'line') {
    return <div onClick={handleSelect} style={{ ...style, width: el.width ? `${el.width}px` : '90%', height: el.strokeWidth ?? 1, background: el.strokeColor || el.color || tokens.text }} />
  }
  if (el.type === 'shape') {
    return <div onClick={handleSelect} style={{ ...style, width: el.width ?? 40, height: el.height ?? 40, background: el.color || tokens.accent }} />
  }
  if (el.type === 'image' && el.imageUrl) {
    return <img onClick={handleSelect} src={el.imageUrl} alt="" style={{ ...style, width: el.width ?? 60, height: el.height ?? 60, objectFit: 'contain' }} />
  }
  if (el.type === 'watermark') {
    return (
      <div onClick={handleSelect} className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: el.opacity ?? 0.08, zIndex: el.zIndex ?? 30 }}>
        <span style={{ transform: `rotate(${el.rotation ?? -30}deg)`, fontSize: el.fontSize ?? 64, color: el.color || tokens.text, fontWeight: 800, whiteSpace: 'nowrap', pointerEvents: editable ? 'auto' : 'none' }}>{subst(el.textTemplate || el.text, ctx)}</span>
      </div>
    )
  }
  // text
  return <div onClick={handleSelect} style={style} className="whitespace-nowrap">{subst(el.textTemplate || el.text, ctx)}</div>
}

export function MasterElements({
  elements,
  ctx,
  tokens,
  editable = false,
  onUpdateElement,
}: {
  elements?: MasterElement[]
  ctx: PageContext
  tokens: DesignTokens
  editable?: boolean
  onUpdateElement?: (id: string, patch: Partial<MasterElement>) => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (!elements?.length) return null

  return (
    <div
      className={`absolute inset-0 overflow-hidden ${editable ? 'pointer-events-auto' : 'pointer-events-none'}`}
      style={{ zIndex: 30 }}
      onClick={() => setSelectedId(null)}
    >
      {elements.map(el => {
        const isSelected = selectedId === el.id
        return (
          <div key={el.id} className="contents">
            <MasterElementView
              el={el}
              ctx={ctx}
              tokens={tokens}
              editable={editable}
              isSelected={isSelected}
              onSelect={() => setSelectedId(el.id)}
            />

            {/* Popover/Toolbar for MasterElement editing */}
            {isSelected && editable && onUpdateElement && (
              <div
                className="absolute z-50 flex flex-col gap-1.5 bg-slate-900 text-white rounded-lg p-2.5 shadow-2xl border border-slate-700/60 whitespace-nowrap text-[11px] cursor-default"
                style={{
                  left: el.position === 'custom' ? `${el.x ?? 50}%` : '50%',
                  top: el.position === 'custom' ? `${(el.y ?? 50) + 5}%` : '85%',
                  transform: 'translate(-50%, -100%)',
                }}
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.preventDefault()}
              >
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5 mb-1.5">
                  <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">Edit Master Element</span>
                  <button type="button" onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
                </div>

                {/* Edit Text Template */}
                {(el.type === 'text' || el.type === 'watermark') && (
                  <div className="flex flex-col gap-0.5 mb-1">
                    <span className="text-[8px] text-slate-400 uppercase">Text Template</span>
                    <input
                      type="text"
                      value={el.textTemplate || el.text || ''}
                      onChange={e => onUpdateElement(el.id, { textTemplate: e.target.value, text: e.target.value })}
                      className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-white text-[10px]"
                    />
                    <span className="text-[7px] text-slate-500">Vars: {'${pageNumber}'}, {'${projectTitle}'}, {'${projectNumber}'}</span>
                  </div>
                )}

                {/* Font options */}
                {(el.type === 'text' || el.type === 'watermark') && (
                  <div className="grid grid-cols-2 gap-1.5 mb-1">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] text-slate-400 uppercase">Font</span>
                      <select
                        value={el.fontFamily || ''}
                        onChange={e => onUpdateElement(el.id, { fontFamily: e.target.value })}
                        className="bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-white text-[9px]"
                      >
                        <option value="">Body Font</option>
                        <option value={tokens.headingFont}>Heading Font</option>
                        <option value="Inter">Inter</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Georgia">Georgia</option>
                        <option value="monospace">Monospace</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] text-slate-400 uppercase">Size</span>
                      <input
                        type="number"
                        min="6"
                        max="96"
                        value={el.fontSize || 11}
                        onChange={e => onUpdateElement(el.id, { fontSize: parseInt(e.target.value) || 11 })}
                        className="bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-white text-[10px] w-14"
                      />
                    </div>
                  </div>
                )}

                {/* Position and Color */}
                <div className="grid grid-cols-2 gap-1.5 mb-1">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] text-slate-400 uppercase">Position</span>
                    <select
                      value={el.position}
                      onChange={e => onUpdateElement(el.id, { position: e.target.value as any })}
                      className="bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-white text-[9px]"
                    >
                      <option value="top-left">Top Left</option>
                      <option value="top-center">Top Center</option>
                      <option value="top-right">Top Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-center">Bottom Center</option>
                      <option value="bottom-right">Bottom Right</option>
                      <option value="center">Center</option>
                      <option value="custom">Custom X/Y</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] text-slate-400 uppercase">Color</span>
                    <input
                      type="color"
                      value={el.color || '#000000'}
                      onChange={e => onUpdateElement(el.id, { color: e.target.value })}
                      className="w-full h-5 rounded border-0 cursor-pointer bg-transparent"
                    />
                  </div>
                </div>

                {/* Custom coordinates if custom position */}
                {el.position === 'custom' && (
                  <div className="grid grid-cols-2 gap-1.5 mb-1">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] text-slate-400 uppercase">X (%)</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={el.x ?? 0}
                        onChange={e => onUpdateElement(el.id, { x: parseInt(e.target.value) || 0 })}
                        className="bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-white text-[10px]"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] text-slate-400 uppercase">Y (%)</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={el.y ?? 0}
                        onChange={e => onUpdateElement(el.id, { y: parseInt(e.target.value) || 0 })}
                        className="bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-white text-[10px]"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
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

/* --------------------------- drawing info bar ---------------------------- */
/** Architectural drawing furniture: scale bar + north arrow + number/name/caption,
 *  driven by the ArchitecturalScaleEditor metadata. */
const SCALE_MAX_M: Record<string, number> = {
  '1:1': 0.5, '1:5': 1, '1:10': 2, '1:20': 4, '1:50': 5, '1:100': 10, '1:200': 20, '1:500': 50, '1:1000': 100,
}

export function DrawingInfoBar({ meta, tokens }: { meta?: DrawingMetadata; tokens: DesignTokens }) {
  if (!meta) return null
  const maxM = SCALE_MAX_M[meta.scale] ?? 10
  const segs = 4
  return (
    <div className="absolute left-[5%] right-[5%] bottom-[3%] pointer-events-none flex items-end justify-between gap-3" style={{ zIndex: 25, color: tokens.text }}>
      {/* number + name + caption */}
      <div style={{ fontFamily: tokens.bodyFont }}>
        <div className="flex items-baseline gap-1.5">
          {meta.drawingNumber && <span style={{ fontWeight: 800, color: tokens.accent, fontSize: 13 }}>{meta.drawingNumber}</span>}
          <span style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{meta.name}</span>
          <span style={{ fontSize: 10, opacity: 0.6, fontFamily: 'monospace' }}>{meta.scale}</span>
        </div>
        {meta.caption && <div style={{ fontSize: 9, opacity: 0.65, marginTop: 1 }}>{meta.caption}</div>}
      </div>

      <div className="flex items-end gap-3">
        {meta.showScaleBar && (
          <div className="flex flex-col items-start">
            <div className="flex" style={{ height: 6, border: `1px solid ${tokens.text}` }}>
              {Array.from({ length: segs }, (_, i) => (
                <div key={i} style={{ width: 16, height: '100%', background: i % 2 === 0 ? tokens.text : 'transparent' }} />
              ))}
            </div>
            <div className="flex justify-between w-full" style={{ width: segs * 16, fontSize: 7, fontFamily: 'monospace', opacity: 0.7 }}>
              <span>0</span><span>{maxM}m</span>
            </div>
          </div>
        )}
        {meta.northPoint && (
          <svg width="22" height="28" viewBox="0 0 22 28" style={{ overflow: 'visible' }}>
            <polygon points="11,2 15,14 11,11 7,14" fill={tokens.text} />
            <polygon points="11,2 11,11 7,14" fill={tokens.text} opacity="0.5" />
            <text x="11" y="26" textAnchor="middle" fontSize="9" fontWeight="700" fill={tokens.text} fontFamily="sans-serif">N</text>
          </svg>
        )}
      </div>
    </div>
  )
}
