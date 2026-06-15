'use client'

/**
 * FreeCanvas — InDesign-style free-positioning layer over a page. Any element
 * (text, image, rectangle, ellipse, line) can be moved, resized, rotated,
 * re-ordered, locked, duplicated and deleted. Sits above the grid layout.
 *
 * Controlled: `elements` + `onChange`. When `editable` is false it renders
 * static (for preview / book / export).
 */

import { useRef, useState, useCallback } from 'react'
import type { FreeElement, DesignTokens } from './types'

interface Props {
  elements: FreeElement[]
  onChange: (els: FreeElement[]) => void
  tokens: DesignTokens
  editable?: boolean
}

type DragMode = 'move' | 'resize' | 'rotate'

export function FreeCanvas({ elements, onChange, tokens, editable = false }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [selId, setSelId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const drag = useRef<{ mode: DragMode; id: string; sx: number; sy: number; el: FreeElement; cx: number; cy: number } | null>(null)

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
    if (d.mode === 'move') {
      patch(d.id, { x: Math.max(-20, Math.min(100, d.el.x + dxp)), y: Math.max(-20, Math.min(100, d.el.y + dyp)) })
    } else if (d.mode === 'resize') {
      patch(d.id, { w: Math.max(3, d.el.w + dxp), h: Math.max(3, d.el.h + dyp) })
    } else {
      const ang = Math.atan2(e.clientY - d.cy, e.clientX - d.cx) * 180 / Math.PI + 90
      patch(d.id, { rotation: Math.round(ang) })
    }
  }

  const onUp = () => { drag.current = null }

  const sel = elements.find(e => e.id === selId)
  const maxZ = elements.reduce((m, e) => Math.max(m, e.z ?? 0), 0)
  const layerOp = (op: 'front' | 'back' | 'dup' | 'del' | 'lock') => {
    if (!sel) return
    if (op === 'front') patch(sel.id, { z: maxZ + 1 })
    else if (op === 'back') patch(sel.id, { z: (elements.reduce((m, e) => Math.min(m, e.z ?? 0), 0)) - 1 })
    else if (op === 'lock') patch(sel.id, { locked: !sel.locked })
    else if (op === 'dup') { const n: FreeElement = { ...sel, id: `fe-${Date.now().toString(36)}`, x: sel.x + 3, y: sel.y + 3, z: maxZ + 1 }; onChange([...elements, n]); setSelId(n.id) }
    else if (op === 'del') { onChange(elements.filter(e => e.id !== sel.id)); setSelId(null) }
  }

  return (
    <div
      ref={ref}
      className="absolute inset-0"
      style={{ zIndex: 40, pointerEvents: editable ? 'auto' : 'none' }}
      onPointerMove={editable ? onMove : undefined}
      onPointerUp={editable ? onUp : undefined}
      onPointerLeave={editable ? onUp : undefined}
      onPointerDown={editable ? () => setSelId(null) : undefined}
    >
      {[...elements].sort((a, b) => (a.z ?? 0) - (b.z ?? 0)).map(el => {
        const selected = editable && el.id === selId
        const style: React.CSSProperties = {
          position: 'absolute', left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%`,
          transform: `rotate(${el.rotation || 0}deg)`, opacity: el.opacity ?? 1,
          cursor: editable && !el.locked ? 'move' : 'default',
          outline: selected ? '1.5px solid #3b82f6' : 'none', outlineOffset: 2,
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
                className="w-full h-full resize-none bg-white/70 outline outline-1 outline-blue-400 p-0"
                style={{ color: el.color || tokens.text, fontFamily: el.fontFamily || tokens.bodyFont, fontSize: el.fontSize || 16, fontWeight: el.bold ? 700 : 400, textAlign: el.align || 'left', lineHeight: 1.25 }}
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

      {/* selection toolbar */}
      {sel && editable && (
        <div className="absolute z-50 flex items-center gap-1 bg-gray-900 text-white rounded-lg px-1.5 py-1 shadow-xl"
          style={{ left: `${Math.max(0, Math.min(70, sel.x))}%`, top: `calc(${Math.max(0, sel.y)}% - 34px)` }}
          onPointerDown={e => e.stopPropagation()}>
          <button onClick={() => layerOp('front')} title="Bring forward" className="px-1.5 hover:text-blue-300 text-xs">⬆</button>
          <button onClick={() => layerOp('back')} title="Send backward" className="px-1.5 hover:text-blue-300 text-xs">⬇</button>
          <button onClick={() => layerOp('lock')} title="Lock" className="px-1.5 hover:text-blue-300 text-xs">{sel.locked ? '🔒' : '🔓'}</button>
          <button onClick={() => layerOp('dup')} title="Duplicate" className="px-1.5 hover:text-blue-300 text-xs">⧉</button>
          <button onClick={() => layerOp('del')} title="Delete" className="px-1.5 hover:text-red-400 text-xs">🗑</button>
        </div>
      )}
    </div>
  )
}

function ElementBody({ el, tokens }: { el: FreeElement; tokens: DesignTokens }) {
  if (el.kind === 'text') {
    return (
      <div className="w-full h-full flex overflow-hidden" style={{
        color: el.color || tokens.text, fontFamily: el.fontFamily || tokens.bodyFont,
        fontSize: el.fontSize || 16, fontWeight: el.bold ? 700 : 400,
        textAlign: el.align || 'left', alignItems: 'flex-start',
        justifyContent: el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start',
        lineHeight: 1.25, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
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
  // rect / ellipse
  return <div className="w-full h-full" style={{
    background: el.fill ?? `${tokens.accent}33`,
    border: el.strokeWidth ? `${el.strokeWidth}px solid ${el.stroke || tokens.accent}` : 'none',
    borderRadius: el.kind === 'ellipse' ? '50%' : 0,
  }} />
}

let _fe = 0
export function newFreeElement(kind: FreeElement['kind'], tokens: DesignTokens, src?: string): FreeElement {
  const base = { id: `fe-${Date.now().toString(36)}-${_fe++}`, kind, x: 30, y: 35, w: 30, h: 14, z: 1, rotation: 0 }
  switch (kind) {
    case 'text': return { ...base, h: 8, text: 'Double-click to edit', fontSize: 18, color: tokens.text, align: 'left' }
    case 'image': return { ...base, w: 32, h: 24, src }
    case 'line': return { ...base, h: 2, stroke: tokens.text, strokeWidth: 2 }
    case 'ellipse': return { ...base, w: 20, h: 20, fill: `${tokens.accent}44`, stroke: tokens.accent, strokeWidth: 1 }
    default: return { ...base, fill: `${tokens.accent}33`, stroke: tokens.accent, strokeWidth: 1 }
  }
}
