'use client'

/**
 * FreeCanvas — InDesign-style free-positioning layer over a page. Any element
 * (text, image, rectangle, ellipse, line, graphic) can be moved, resized, rotated,
 * re-ordered, locked, duplicated and deleted. Sits above the grid layout.
 *
 * Controlled: `elements` + `onChange`. When `editable` is false it renders
 * static (for preview / book / export).
 */

import { useRef, useState, useCallback, useEffect } from 'react'
import type { FreeElement, DesignTokens } from './types'

interface Props {
  elements: FreeElement[]
  onChange: (els: FreeElement[]) => void
  tokens: DesignTokens
  editable?: boolean
  onApplyScope?: (scope: 'page' | 'spread' | 'all', el: FreeElement) => void
  onSelectionChange?: (el: FreeElement | null) => void
}

type DragMode = 'move' | 'resize' | 'rotate'
type SnapLine = { axis: 'x' | 'y'; pos: number }

export function FreeCanvas({ elements, onChange, tokens, editable = false, onApplyScope, onSelectionChange }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [selId, setSelId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [snapLines, setSnapLines] = useState<SnapLine[]>([])

  useEffect(() => {
    const el = selId ? elements.find(e => e.id === selId) ?? null : null
    onSelectionChange?.(el)
  }, [selId, elements]) // eslint-disable-line react-hooks/exhaustive-deps
  const drag = useRef<{ mode: DragMode; id: string; sx: number; sy: number; el: FreeElement; cx: number; cy: number } | null>(null)

  useEffect(() => {
    if (!editable) return
    const handleGlobalClick = (e: PointerEvent) => {
      // If we clicked inside a FreeCanvas element, the element's onPointerDown stops propagation
      // Or we can just check if e.target is part of our canvas
      // But actually, onDown calls e.stopPropagation(). So if this fires on window, it means it wasn't a free element!
      setSelId(null)
      setEditId(null)
    }
    window.addEventListener('pointerdown', handleGlobalClick)
    return () => window.removeEventListener('pointerdown', handleGlobalClick)
  }, [editable])

  const rect = () => ref.current?.getBoundingClientRect()

  const patch = useCallback((id: string, p: Partial<FreeElement>) => {
    onChange(elements.map(e => (e.id === id ? { ...e, ...p } : e)))
  }, [elements, onChange])

  const onDown = (e: React.PointerEvent, el: FreeElement, mode: DragMode) => {
    if (!editable || el.locked) return
    e.stopPropagation()
    const r = rect(); if (!r) return
    setSelId(el.id)
    drag.current = { mode, id: el.id, sx: e.clientX, sy: e.clientY, el, cx: r.left + (el.x + el.w / 2) / 100 * r.width, cy: r.top + (el.y + el.h / 2) / 100 * r.height }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return
    const r = rect(); if (!r) return
    const dxp = ((e.clientX - d.sx) / r.width) * 100
    const dyp = ((e.clientY - d.sy) / r.height) * 100
    
    if (d.mode === 'move' || d.mode === 'resize') {
      let nx = d.el.x + dxp
      let ny = d.el.y + dyp
      let nw = d.el.w
      let nh = d.el.h

      if (d.mode === 'resize') {
        nx = d.el.x
        ny = d.el.y
        nw = Math.max(3, d.el.w + dxp)
        nh = Math.max(3, d.el.h + dyp)
      }

      const SNAP_T = 1.5 // 1.5% threshold
      const newSnaps: SnapLine[] = []

      const myX = [nx, nx + nw / 2, nx + nw]
      const myY = [ny, ny + nh / 2, ny + nh]

      let snappedX = false
      let snappedY = false
      let finalX = nx
      let finalY = ny
      let finalW = nw
      let finalH = nh

      const targets = [
        { id: 'page', x: [0, 50, 100], y: [0, 50, 100] },
        ...elements.filter(e => e.id !== d.id).map(e => ({
          id: e.id,
          x: [e.x, e.x + e.w / 2, e.x + e.w],
          y: [e.y, e.y + e.h / 2, e.y + e.h]
        }))
      ]

      for (const t of targets) {
        if (!snappedX) {
          for (let i = 0; i < 3; i++) {
            if (d.mode === 'resize' && i !== 2) continue // only snap right edge for SE resize
            for (let j = 0; j < 3; j++) {
              if (Math.abs(myX[i] - t.x[j]) < SNAP_T) {
                if (d.mode === 'move') finalX = t.x[j] - (i * nw / 2)
                else finalW = t.x[j] - d.el.x
                newSnaps.push({ axis: 'x', pos: t.x[j] })
                snappedX = true; break
              }
            }
            if (snappedX) break
          }
        }
        if (!snappedY) {
          for (let i = 0; i < 3; i++) {
            if (d.mode === 'resize' && i !== 2) continue // only snap bottom edge for SE resize
            for (let j = 0; j < 3; j++) {
              if (Math.abs(myY[i] - t.y[j]) < SNAP_T) {
                if (d.mode === 'move') finalY = t.y[j] - (i * nh / 2)
                else finalH = t.y[j] - d.el.y
                newSnaps.push({ axis: 'y', pos: t.y[j] })
                snappedY = true; break
              }
            }
            if (snappedY) break
          }
        }
      }

      setSnapLines(newSnaps)

      if (d.mode === 'move') {
        patch(d.id, { x: Math.max(-50, Math.min(150, finalX)), y: Math.max(-50, Math.min(150, finalY)) })
      } else {
        patch(d.id, { w: Math.max(3, finalW), h: Math.max(3, finalH) })
      }
    } else {
      const ang = Math.atan2(e.clientY - d.cy, e.clientX - d.cx) * 180 / Math.PI + 90
      let rot = Math.round(ang)
      if (Math.abs(rot % 45) < 4 || Math.abs(rot % 45) > 41) rot = Math.round(rot / 45) * 45 // 45deg snap
      patch(d.id, { rotation: rot })
      setSnapLines([])
    }
  }

  const onUp = () => { drag.current = null; setSnapLines([]) }

  const sel = elements.find(e => e.id === selId)
  const maxZ = elements.reduce((m, e) => Math.max(m, e.z ?? 0), 0)
  
  const layerOp = (op: 'front' | 'back' | 'dup' | 'del' | 'lock') => {
    if (!sel) return
    if (op === 'front') patch(sel.id, { z: maxZ + 1 })
    else if (op === 'back') patch(sel.id, { z: (elements.reduce((m, e) => Math.min(m, e.z ?? 0), 0)) - 1 })
    else if (op === 'lock') patch(sel.id, { locked: !sel.locked })
    else if (op === 'dup') { 
      const n: FreeElement = { ...sel, id: `fe-${Date.now().toString(36)}`, x: sel.x + 3, y: sel.y + 3, z: maxZ + 1 }; 
      onChange([...elements, n]); 
      setSelId(n.id) 
    }
    else if (op === 'del') { onChange(elements.filter(e => e.id !== sel.id)); setSelId(null) }
  }

  return (
    <div
      ref={ref}
      className="absolute inset-0"
      style={{ zIndex: editable ? 40 : 10, pointerEvents: 'none' }}
      onPointerMove={editable ? onMove : undefined}
      onPointerUp={editable ? onUp : undefined}
      onPointerLeave={editable ? onUp : undefined}
    >
      {[...elements].sort((a, b) => (a.z ?? 0) - (b.z ?? 0)).map(el => {
        const selected = editable && el.id === selId
        const style: React.CSSProperties = {
          position: 'absolute', left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%`,
          transform: `rotate(${el.rotation || 0}deg)`, opacity: el.opacity ?? 1,
          cursor: editable && !el.locked ? 'move' : 'default',
          outline: selected ? '1.5px solid #3b82f6' : 'none', outlineOffset: 2,
          pointerEvents: editable ? 'auto' : 'none',
        }
        const editing = editable && editId === el.id && el.kind === 'text'
        return (
          <div key={el.id} style={style}
            onPointerDown={e => { if (!editing) onDown(e, el, 'move') }}
            onDoubleClick={e => { if (editable && el.kind === 'text') { e.stopPropagation(); setSelId(el.id); setEditId(el.id) } }}>
            {editing ? (
              <textarea
                autoFocus
                value={el.text || ''}
                onChange={e => patch(el.id, { text: e.target.value })}
                onBlur={() => setEditId(null)}
                onPointerDown={e => e.stopPropagation()}
                className="w-full h-full resize-none bg-white/90 outline outline-1 outline-blue-400 p-1 rounded text-[11px]"
                style={{ 
                  color: el.color || tokens.text, 
                  fontFamily: el.fontFamily || tokens.bodyFont, 
                  fontSize: el.fontSize || 14, 
                  fontWeight: el.bold ? 700 : 400, 
                  textAlign: el.align || 'left', 
                  lineHeight: el.lineHeight || 1.25,
                  letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : 'normal'
                }}
              />
            ) : (
              <ElementBody el={el} tokens={tokens} />
            )}
            {selected && !el.locked && (
              <>
                {/* resize handle (SE) */}
                <div onPointerDown={e => onDown(e, el, 'resize')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm" style={{ cursor: 'nwse-resize' }} />
                {/* rotate handle */}
                <div onPointerDown={e => onDown(e, el, 'rotate')} className="absolute left-1/2 -top-6 w-3 h-3 -translate-x-1/2 bg-blue-500 rounded-full" style={{ cursor: 'grab' }} />
                <div className="absolute left-1/2 -top-4 -translate-x-1/2 w-px h-4 bg-blue-500" />
              </>
            )}
          </div>
        )
      })}

      {/* Snap Lines */}
      {snapLines.map((line, i) => (
        <div key={`snap-${i}`} className="absolute bg-pink-500 pointer-events-none z-50"
          style={line.axis === 'x' ? {
            left: `${line.pos}%`, top: 0, bottom: 0, width: 1, transform: 'translateX(-50%)'
          } : {
            top: `${line.pos}%`, left: 0, right: 0, height: 1, transform: 'translateY(-50%)'
          }}
        />
      ))}
    </div>
  )
}

function ElementBody({ el, tokens }: { el: FreeElement; tokens: DesignTokens }) {
  if (el.kind === 'text') {
    return (
      <div className="w-full h-full flex overflow-hidden" style={{
        color: el.color || tokens.text, 
        fontFamily: el.fontFamily || tokens.bodyFont,
        fontSize: el.fontSize || 14, 
        fontWeight: el.bold ? 700 : 400,
        textAlign: el.align || 'left', 
        alignItems: 'flex-start',
        justifyContent: el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start',
        lineHeight: el.lineHeight || 1.25, 
        letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : 'normal',
        whiteSpace: 'pre-wrap', 
        wordBreak: 'break-word',
      }}>
        {el.text || 'Text'}
      </div>
    )
  }
  if (el.kind === 'image') {
    return el.src
      ? <img src={el.src} alt="" className="w-full h-full" style={{ objectFit: 'cover' }} draggable={false} />
      : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">Image</div>
  }
  if (el.kind === 'line') {
    return <div className="w-full" style={{ height: el.strokeWidth || 2, background: el.stroke || tokens.text, marginTop: '50%' }} />
  }
  if (el.kind === 'graphic') {
    return <GraphicDNARenderer type={el.graphicType || 'parametric-curve'} color={el.color || tokens.accent} strokeWidth={el.strokeWidth} />
  }
  // rect / ellipse
  return <div className="w-full h-full" style={{
    background: el.fill ?? `${tokens.accent}33`,
    border: el.strokeWidth ? `${el.strokeWidth}px solid ${el.stroke || tokens.accent}` : 'none',
    borderRadius: el.kind === 'ellipse' ? '50%' : 0,
  }} />
}

function GraphicDNARenderer({ type, color, strokeWidth = 1.5 }: { type: string; color: string; strokeWidth?: number }) {
  const c = color || '#000000'
  const sw = strokeWidth
  
  switch (type) {
    case 'parametric-curve':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <path d="M 0 50 Q 25 20, 50 50 T 100 50 M 0 30 Q 30 70, 60 20 T 100 80" fill="none" stroke={c} strokeWidth={sw} opacity="0.6"/>
          <path d="M 0 60 Q 40 10, 70 80 T 100 30" fill="none" stroke={c} strokeWidth={sw * 0.7} opacity="0.4"/>
        </svg>
      )
    case 'zaha-flow':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <path d="M -10 20 C 30 120, 70 -20, 110 80" fill="none" stroke={c} strokeWidth={sw * 1.5} />
          <path d="M -10 30 C 30 130, 70 -10, 110 90" fill="none" stroke={c} strokeWidth={sw} opacity="0.7" strokeDasharray="3 3" />
          <path d="M -10 10 C 30 110, 70 -30, 110 70" fill="none" stroke={c} strokeWidth={sw * 0.7} opacity="0.5" />
          <path d="M -10 40 C 40 140, 60 0, 110 100" fill="none" stroke={c} strokeWidth={sw * 0.5} opacity="0.3" />
        </svg>
      )
    case 'contour':
    case 'topo':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <path d="M 50 10 C 70 15, 80 30, 85 50 C 90 70, 75 85, 50 90 C 25 85, 10 70, 15 50 C 20 30, 30 15, 50 10 Z" fill="none" stroke={c} strokeWidth={sw * 0.7} />
          <path d="M 50 25 C 65 28, 70 40, 73 50 C 76 60, 68 70, 50 75 C 32 70, 24 60, 27 50 C 30 40, 35 28, 50 25 Z" fill="none" stroke={c} strokeWidth={sw * 0.7} opacity="0.8" />
          <path d="M 50 40 C 58 41, 60 45, 62 50 C 64 55, 58 60, 50 62 C 42 60, 36 55, 38 50 C 40 45, 42 41, 50 40 Z" fill="none" stroke={c} strokeWidth={sw * 0.8} opacity="0.6" />
          <path d="M 50 48 C 52 48, 54 49, 54 50 C 54 51, 52 52, 50 52 C 48 52, 46 51, 46 50 C 46 49, 48 48, 50 48 Z" fill="none" stroke={c} strokeWidth={sw} opacity="0.4" />
        </svg>
      )
    case 'wind-flow':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <path d="M 10 20 Q 40 10, 70 30 T 90 70" fill="none" stroke={c} strokeWidth={sw} strokeDasharray="5 5" />
          <path d="M 15 50 Q 45 40, 60 70 T 100 80" fill="none" stroke={c} strokeWidth={sw} strokeDasharray="5 5" />
          <path d="M 10 20 L 18 17 M 10 20 L 14 28" fill="none" stroke={c} strokeWidth={sw} />
          <path d="M 15 50 L 23 47 M 15 50 L 19 58" fill="none" stroke={c} strokeWidth={sw} />
        </svg>
      )
    case 'movement-path':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <path d="M 5 95 C 10 40, 90 60, 95 5" fill="none" stroke={c} strokeWidth={sw * 1.3} strokeDasharray="4 4" />
          <circle cx="5" cy="95" r="3" fill={c} />
          <circle cx="95" cy="5" r="3" fill={c} />
          <path d="M 50 45 L 56 42 M 50 45 L 48 38" fill="none" stroke={c} strokeWidth={sw} />
        </svg>
      )
    case 'spline':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <path d="M 0 20 C 30 80, 40 10, 70 90 T 100 40" fill="none" stroke={c} strokeWidth={sw} />
        </svg>
      )
    case 'voronoi':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <path d="M 10 10 L 40 15 L 30 50 L 10 40 Z M 40 15 L 70 5 L 80 40 L 55 50 L 30 50 Z M 10 40 L 30 50 L 25 90 L 5 80 Z M 30 50 L 55 50 L 60 85 L 25 90 Z M 55 50 L 80 40 L 95 70 L 60 85 Z" fill="none" stroke={c} strokeWidth={sw * 0.7} opacity="0.7" />
          <circle cx="10" cy="10" r="1.5" fill={c} />
          <circle cx="40" cy="15" r="1.5" fill={c} />
          <circle cx="30" cy="50" r="1.5" fill={c} />
          <circle cx="70" cy="5" r="1.5" fill={c} />
          <circle cx="80" cy="40" r="1.5" fill={c} />
          <circle cx="55" cy="50" r="1.5" fill={c} />
          <circle cx="10" cy="40" r="1.5" fill={c} />
          <circle cx="25" cy="90" r="1.5" fill={c} />
          <circle cx="60" cy="85" r="1.5" fill={c} />
          <circle cx="95" cy="70" r="1.5" fill={c} />
        </svg>
      )
    case 'hexagon':
      return (
        <svg viewBox="0 0 60 60" className="w-full h-full" preserveAspectRatio="none">
          <path d="M 10 20 L 20 15 L 30 20 L 30 30 L 20 35 L 10 30 Z M 30 20 L 40 15 L 50 20 L 50 30 L 40 35 L 30 30 Z M 20 35 L 30 40 L 30 50 L 20 55 L 10 50 L 10 40 Z M 40 35 L 50 40 L 50 50 L 40 55 L 30 55 L 30 50 M 10 30 L 10 40 M 30 30 L 30 40 M 50 30 L 50 40" fill="none" stroke={c} strokeWidth={sw * 0.7} opacity="0.6" />
        </svg>
      )
    case 'triangle-grid':
      return (
        <svg viewBox="0 0 150 100" className="w-full h-full" preserveAspectRatio="none">
          <path d="M 0 0 L 100 0 L 50 86.6 Z M 50 86.6 L 150 86.6 L 100 0 Z M 0 0 L 50 86.6 M 100 0 L 50 86.6 M 100 0 L 150 86.6" fill="none" stroke={c} strokeWidth={sw * 0.7} opacity="0.5" />
        </svg>
      )
    case 'blueprint-grid':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <line x1="0" y1="20" x2="100" y2="20" stroke={c} strokeWidth={sw * 0.3} strokeDasharray="1 4" opacity="0.5" />
          <line x1="0" y1="40" x2="100" y2="40" stroke={c} strokeWidth={sw * 0.3} strokeDasharray="1 4" opacity="0.5" />
          <line x1="0" y1="60" x2="100" y2="60" stroke={c} strokeWidth={sw * 0.3} strokeDasharray="1 4" opacity="0.5" />
          <line x1="0" y1="80" x2="100" y2="80" stroke={c} strokeWidth={sw * 0.3} strokeDasharray="1 4" opacity="0.5" />
          <line x1="20" y1="0" x2="20" y2="100" stroke={c} strokeWidth={sw * 0.3} strokeDasharray="1 4" opacity="0.5" />
          <line x1="40" y1="0" x2="40" y2="100" stroke={c} strokeWidth={sw * 0.3} strokeDasharray="1 4" opacity="0.5" />
          <line x1="60" y1="0" x2="60" y2="100" stroke={c} strokeWidth={sw * 0.3} strokeDasharray="1 4" opacity="0.5" />
          <line x1="80" y1="0" x2="80" y2="100" stroke={c} strokeWidth={sw * 0.3} strokeDasharray="1 4" opacity="0.5" />
          <text x="2" y="15" fill={c} fontSize="4" opacity="0.5" style={{ fontFamily: 'monospace' }}>A-1</text>
          <text x="2" y="35" fill={c} fontSize="4" opacity="0.5" style={{ fontFamily: 'monospace' }}>A-2</text>
          <text x="2" y="55" fill={c} fontSize="4" opacity="0.5" style={{ fontFamily: 'monospace' }}>A-3</text>
        </svg>
      )
    case 'cad-background':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <circle cx="50" cy="50" r="40" fill="none" stroke={c} strokeWidth={sw * 0.3} strokeDasharray="2 2" opacity="0.4" />
          <line x1="50" y1="5" x2="50" y2="95" stroke={c} strokeWidth={sw * 0.3} strokeDasharray="5 5" opacity="0.5" />
          <line x1="5" y1="50" x2="95" y2="50" stroke={c} strokeWidth={sw * 0.3} strokeDasharray="5 5" opacity="0.5" />
          <path d="M 5 5 L 15 5 M 5 5 L 5 15 M 95 5 L 85 5 M 95 5 L 95 15 M 5 95 L 15 95 M 5 95 L 5 85 M 95 95 L 85 95 M 95 95 L 95 85" fill="none" stroke={c} strokeWidth={sw * 0.7} opacity="0.7" />
        </svg>
      )
    case 'section-line':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <line x1="10" y1="50" x2="90" y2="50" stroke={c} strokeWidth={sw * 1.5} strokeDasharray="6 3 1 3" />
          <line x1="10" y1="50" x2="10" y2="35" stroke={c} strokeWidth={sw * 1.5} />
          <line x1="90" y1="50" x2="90" y2="35" stroke={c} strokeWidth={sw * 1.5} />
          <polygon points="10,30 5,37 15,37" fill={c} />
          <polygon points="90,30 85,37 95,37" fill={c} />
          <text x="18" y="44" fill={c} fontSize="10" fontWeight="bold" style={{ fontFamily: 'sans-serif' }}>A</text>
          <text x="76" y="44" fill={c} fontSize="10" fontWeight="bold" style={{ fontFamily: 'sans-serif' }}>A</text>
        </svg>
      )
    case 'site-overlay':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <circle cx="50" cy="50" r="30" fill="none" stroke={c} strokeWidth={sw * 0.7} />
          <circle cx="50" cy="50" r="45" fill="none" stroke={c} strokeWidth={sw * 0.3} strokeDasharray="2 2" />
          <line x1="50" y1="2" x2="50" y2="98" stroke={c} strokeWidth={sw * 0.5} />
          <line x1="2" y1="50" x2="98" y2="50" stroke={c} strokeWidth={sw * 0.5} />
          <path d="M 50 50 L 80 20" stroke={c} strokeWidth={sw * 1.2} />
          <text x="53" y="12" fill={c} fontSize="8" fontWeight="bold" style={{ fontFamily: 'sans-serif' }}>N</text>
          <text x="83" y="23" fill={c} fontSize="6" style={{ fontFamily: 'sans-serif' }}>30°</text>
        </svg>
      )
    case 'measurement':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <line x1="10" y1="50" x2="90" y2="50" stroke={c} strokeWidth={sw} />
          <line x1="10" y1="35" x2="10" y2="65" stroke={c} strokeWidth={sw * 0.7} />
          <line x1="90" y1="35" x2="90" y2="65" stroke={c} strokeWidth={sw * 0.7} />
          <line x1="5" y1="55" x2="15" y2="45" stroke={c} strokeWidth={sw * 1.3} />
          <line x1="85" y1="55" x2="95" y2="45" stroke={c} strokeWidth={sw * 1.3} />
          <text x="50" y="44" fill={c} fontSize="8" textAnchor="middle" fontWeight="bold" style={{ fontFamily: 'monospace' }}>12,450</text>
        </svg>
      )
    case 'coordinates':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <line x1="20" y1="50" x2="80" y2="50" stroke={c} strokeWidth={sw * 0.7} />
          <line x1="50" y1="20" x2="50" y2="80" stroke={c} strokeWidth={sw * 0.7} />
          <circle cx="50" cy="50" r="3" fill="none" stroke={c} strokeWidth={sw * 0.7} />
          <text x="54" y="44" fill={c} fontSize="6" style={{ fontFamily: 'monospace' }}>N 53°20'45"</text>
          <text x="54" y="60" fill={c} fontSize="6" style={{ fontFamily: 'monospace' }}>E 6°15'12"</text>
        </svg>
      )
    case 'section-marker':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <circle cx="50" cy="50" r="16" fill="none" stroke={c} strokeWidth={sw * 1.3} />
          <line x1="34" y1="50" x2="66" y2="50" stroke={c} strokeWidth={sw} />
          <text x="50" y="44" fill={c} fontSize="10" textAnchor="middle" fontWeight="bold" style={{ fontFamily: 'sans-serif' }}>A</text>
          <text x="50" y="62" fill={c} fontSize="8" textAnchor="middle" style={{ fontFamily: 'sans-serif' }}>04</text>
          <path d="M 66 50 L 76 45 L 76 55 Z" fill={c} />
        </svg>
      )
    case 'arrow':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <polygon points="50,5 30,85 50,70 70,85" fill="none" stroke={c} strokeWidth={sw * 1.3} />
          <line x1="50" y1="5" x2="50" y2="95" stroke={c} strokeWidth={sw * 0.7} strokeDasharray="3 3" />
        </svg>
      )
    case 'frame-corner':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <path d="M 15 5 L 5 5 L 5 15 M 85 5 L 95 5 L 95 15 M 15 95 L 5 95 L 5 85 M 85 95 L 95 95 L 95 85" fill="none" stroke={c} strokeWidth={sw * 1.3} />
        </svg>
      )
    case 'construction-line':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <line x1="0" y1="30" x2="100" y2="30" stroke={c} strokeWidth={sw * 0.5} strokeDasharray="5 2 1 2" />
          <line x1="0" y1="70" x2="100" y2="70" stroke={c} strokeWidth={sw * 0.5} strokeDasharray="5 2 1 2" />
          <line x1="30" y1="0" x2="30" y2="100" stroke={c} strokeWidth={sw * 0.5} strokeDasharray="5 2 1 2" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <rect x="5" y="5" width="90" height="90" fill="none" stroke={c} strokeWidth={sw} strokeDasharray="2 2" />
          <text x="50" y="55" fill={c} fontSize="10" textAnchor="middle">{type}</text>
        </svg>
      )
  }
}

let _fe = 0
export function newFreeElement(kind: FreeElement['kind'], tokens: DesignTokens, src?: string): FreeElement {
  const base = { id: `fe-${Date.now().toString(36)}-${_fe++}`, kind, x: 30, y: 35, w: 30, h: 14, z: 1, rotation: 0 }
  switch (kind) {
    case 'text': return { ...base, h: 8, text: 'Double-click to edit', fontSize: 18, color: tokens.text, align: 'left', lineHeight: 1.25, letterSpacing: 0 }
    case 'image': return { ...base, w: 32, h: 24, src }
    case 'line': return { ...base, h: 2, stroke: tokens.text, strokeWidth: 2 }
    case 'ellipse': return { ...base, w: 20, h: 20, fill: `${tokens.accent}44`, stroke: tokens.accent, strokeWidth: 1 }
    case 'graphic': return { ...base, w: 35, h: 25, graphicType: 'parametric-curve', color: tokens.accent, strokeWidth: 1.5, opacity: 0.85 }
    default: return { ...base, fill: `${tokens.accent}33`, stroke: tokens.accent, strokeWidth: 1 }
  }
}
