'use client'

/**
 * Entourage panel for Sheet Composer — click to place architecture graphics
 * (people, trees, cars, furniture, site elements) on the current sheet.
 * Items carry real-world sizes and are placed at the chosen drawing scale.
 */

import { useState } from 'react'
import { ENTOURAGE_ITEMS, entourageSVG, getEntourageItem } from '@/lib/entourage/items'
import type { SheetElement, ArchScale } from './sheetSetTypes'

const SCALES: Array<{ den: number; label: ArchScale }> = [
  { den: 50, label: '1:50' },
  { den: 100, label: '1:100' },
  { den: 200, label: '1:200' },
  { den: 500, label: '1:500' },
]

interface SheetSetEntouragePanelProps {
  /** Sheet dimensions in mm (already orientation-corrected). */
  sheetWidthMm: number
  sheetHeightMm: number
  onAddElement: (el: SheetElement) => void
}

export function SheetSetEntouragePanel({ sheetWidthMm, sheetHeightMm, onAddElement }: SheetSetEntouragePanelProps) {
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('All')
  const [view, setView] = useState<'all' | 'plan' | 'elevation' | 'section'>('all')
  const [scale, setScale] = useState(SCALES[1])
  const [collapsed, setCollapsed] = useState(true)

  const items = ENTOURAGE_ITEMS.filter(i => {
    if (cat !== 'All' && i.category !== cat) return false
    if (view !== 'all' && !i.views.includes(view)) return false
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const categories = ['All', ...Array.from(new Set(ENTOURAGE_ITEMS.map(i => i.category)))]

  const addItem = (id: string) => {
    const item = getEntourageItem(id)
    if (!item) return
    // real-world size → paper mm at the chosen scale → % of the sheet
    const paperWmm = (item.widthM * 1000) / scale.den
    const paperHmm = (item.heightM * 1000) / scale.den
    let wPct = (paperWmm / sheetWidthMm) * 100
    let hPct = (paperHmm / sheetHeightMm) * 100
    // keep oversized items manageable on small sheets
    const over = Math.max(wPct / 60, hPct / 60, 1)
    wPct /= over
    hPct /= over
    const svg = entourageSVG(item, '#222222', 200)
    onAddElement({
      id: crypto.randomUUID(),
      kind: 'drawing',
      x: 50 - wPct / 2,
      y: 50 - hPct / 2,
      w: wPct,
      h: hPct,
      z: 50,
      locked: false,
      visible: true,
      drawing: {
        drawingName: item.name,
        drawingType: 'diagram',
        originalScale: scale.label,
        sheetScale: scale.label,
        vector: true,
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      },
    })
  }

  if (collapsed) {
    return (
      <div className="w-10 bg-white border-r border-gray-200 flex flex-col items-center pt-3">
        <button onClick={() => setCollapsed(false)} title="Open entourage library"
          className="text-lg hover:scale-110 transition" >🌳</button>
        <span className="mt-2 text-[9px] text-gray-400 font-semibold tracking-wide" style={{ writingMode: 'vertical-rl' }}>
          ENTOURAGE
        </span>
      </div>
    )
  }

  return (
    <div className="w-[230px] shrink-0 flex flex-col bg-white border-r border-gray-200">
      <div className="px-3 py-2.5 border-b border-gray-200 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-700">🌳 Entourage</span>
        <button onClick={() => setCollapsed(true)} className="text-gray-400 text-xs hover:text-gray-600" title="Collapse">◀</button>
      </div>

      <div className="p-2.5 border-b border-gray-100 space-y-1.5">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search…"
          className="w-full border rounded-lg px-2.5 py-1.5 text-xs bg-gray-50" />
        <div className="flex gap-1 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cat === c ? 'bg-[#D4AF37] text-white' : 'bg-gray-100 text-gray-600'}`}>{c}</button>
          ))}
        </div>
        <div className="flex gap-1">
          {(['all', 'plan', 'elevation', 'section'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-1.5 py-0.5 rounded text-[9px] capitalize ${view === v ? 'bg-[#9C7416] text-white' : 'bg-gray-100 text-gray-600'}`}>{v}</button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-gray-400">Drawing scale</span>
          {SCALES.map(s => (
            <button key={s.den} onClick={() => setScale(s)}
              className={`px-1.5 py-0.5 rounded text-[9px] ${scale.den === s.den ? 'bg-[#D4AF37] text-white' : 'bg-gray-100 text-gray-600'}`}>{s.label}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-3 gap-1.5">
          {items.map(i => (
            <button key={i.id} onClick={() => addItem(i.id)} title={`${i.name} — ${i.widthM}m wide, placed at ${scale.label}`}
              className="bg-gray-50 hover:bg-gray-100 rounded-lg p-1.5 text-center transition border border-gray-200 hover:border-[#D4AF37]">
              <div className="h-10 flex items-center justify-center overflow-hidden mb-0.5"
                dangerouslySetInnerHTML={{ __html: entourageSVG(i, '#333', 30) }} />
              <div className="text-[8px] leading-tight text-gray-600 truncate">{i.name}</div>
            </button>
          ))}
        </div>
        {items.length === 0 && <div className="text-center py-8 text-xs text-gray-400">No items match</div>}
      </div>

      <div className="p-2 border-t border-gray-200 text-[9px] text-gray-400 leading-snug">
        Click to place at sheet centre, true to {scale.label}. Drag it into position on the canvas.
      </div>
    </div>
  )
}
