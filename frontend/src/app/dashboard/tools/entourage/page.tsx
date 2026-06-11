'use client'

/**
 * Entourage Studio — drag architecture graphics (people, trees, cars,
 * furniture, site elements, north arrows, scale bars) onto a sheet, at the
 * correct size for the chosen drawing scale. Pure SVG → crisp at any export.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import {
  ENTOURAGE_ITEMS, ENTOURAGE_CATEGORIES, getEntourageItem, entourageSVG,
  type EntourageView,
} from '@/lib/entourage/items'
import { PX_PER_MM } from '@/lib/graphics/scaleBar'
import { NORTH_ARROWS, northArrowSVG } from '@/lib/graphics/northArrows'
import { downloadBlob, saveImageToLibrary, svgToPngBlob } from '@/lib/saveToLibrary'

const VBW = 1587 // A3 landscape @96dpi
const VBH = 1123
const SCALES = [50, 100, 200, 500]

interface CustomItem { id: string; name: string; src: string; aspect: number }

interface Placed {
  uid: string
  itemId?: string
  customSrc?: string
  customAspect?: number
  x: number; y: number
  widthM: number; heightM: number
  mult: number
  rot: number
  flipH: boolean; flipV: boolean
  color: string
  opacity: number
  locked: boolean
}

type DragMode = 'move' | 'resize' | 'rotate' | null

export default function EntourageStudioPage() {
  const [scaleDen, setScaleDen] = useState(100)
  const [placed, setPlaced] = useState<Placed[]>([])
  const [selectedUid, setSelectedUid] = useState<string | null>(null)
  const [bg, setBg] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState<string>('All')
  const [view, setView] = useState<EntourageView | 'all'>('all')
  const [custom, setCustom] = useState<CustomItem[]>([])
  const [notice, setNotice] = useState('')
  const [exporting, setExporting] = useState(false)
  const [busy, setBusy] = useState('')

  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragRef = useRef<{ mode: DragMode; uid: string; sx: number; sy: number; ox: number; oy: number; om: number; or: number } | null>(null)
  const bgInputRef = useRef<HTMLInputElement | null>(null)
  const customInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    try { setCustom(JSON.parse(localStorage.getItem('cosmofolio_entourage_custom') || '[]')) } catch {}
  }, [])

  const flash = (m: string) => { setNotice(m); setTimeout(() => setNotice(''), 3500) }

  const sizePx = (p: Placed) => {
    const w = (p.widthM * 1000 / scaleDen) * PX_PER_MM * p.mult
    const h = (p.heightM * 1000 / scaleDen) * PX_PER_MM * p.mult
    return { w, h }
  }

  const toSvgCoords = (clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect()
    return { x: ((clientX - rect.left) / rect.width) * VBW, y: ((clientY - rect.top) / rect.height) * VBH }
  }

  // ---------------- add / select / transform ----------------
  const addItem = (itemId: string, x = VBW / 2, y = VBH / 2) => {
    const item = getEntourageItem(itemId)
    if (!item) return
    const p: Placed = {
      uid: crypto.randomUUID(), itemId, x, y,
      widthM: item.widthM, heightM: item.heightM,
      mult: 1, rot: 0, flipH: false, flipV: false,
      color: '#222222', opacity: 1, locked: false,
    }
    setPlaced(prev => [...prev, p])
    setSelectedUid(p.uid)
  }

  const addCustom = (ci: CustomItem, x = VBW / 2, y = VBH / 2) => {
    const p: Placed = {
      uid: crypto.randomUUID(), customSrc: ci.src, customAspect: ci.aspect, x, y,
      widthM: 2, heightM: 2 * ci.aspect,
      mult: 1, rot: 0, flipH: false, flipV: false,
      color: '#222222', opacity: 1, locked: false,
    }
    setPlaced(prev => [...prev, p])
    setSelectedUid(p.uid)
  }

  const addNorthArrow = (arrowId: string) => {
    const def = NORTH_ARROWS.find(a => a.id === arrowId) || NORTH_ARROWS[0]
    const svg = northArrowSVG(def, '#222222', { size: 100 })
    const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    addCustomDirect(src, 1, 1.5)
  }

  const addCustomDirect = (src: string, aspect: number, widthM: number) => {
    const p: Placed = {
      uid: crypto.randomUUID(), customSrc: src, customAspect: aspect, x: VBW - 160, y: 140,
      widthM, heightM: widthM * aspect,
      mult: 1, rot: 0, flipH: false, flipV: false, color: '#222222', opacity: 1, locked: false,
    }
    setPlaced(prev => [...prev, p])
    setSelectedUid(p.uid)
  }

  const update = (uid: string, patch: Partial<Placed>) =>
    setPlaced(prev => prev.map(p => (p.uid === uid ? { ...p, ...patch } : p)))

  const selected = placed.find(p => p.uid === selectedUid) || null

  const onItemPointerDown = (e: React.PointerEvent, p: Placed) => {
    if (p.locked) { setSelectedUid(p.uid); return }
    e.stopPropagation()
    setSelectedUid(p.uid)
    const c = toSvgCoords(e.clientX, e.clientY)
    dragRef.current = { mode: 'move', uid: p.uid, sx: c.x, sy: c.y, ox: p.x, oy: p.y, om: p.mult, or: p.rot }
  }

  const onHandleDown = (e: React.PointerEvent, p: Placed, mode: DragMode) => {
    e.stopPropagation()
    const c = toSvgCoords(e.clientX, e.clientY)
    dragRef.current = { mode, uid: p.uid, sx: c.x, sy: c.y, ox: p.x, oy: p.y, om: p.mult, or: p.rot }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d || !d.mode) return
    const c = toSvgCoords(e.clientX, e.clientY)
    const p = placed.find(pp => pp.uid === d.uid)
    if (!p) return
    if (d.mode === 'move') {
      update(d.uid, { x: d.ox + (c.x - d.sx), y: d.oy + (c.y - d.sy) })
    } else if (d.mode === 'resize') {
      const start = Math.hypot(d.sx - d.ox, d.sy - d.oy) || 1
      const now = Math.hypot(c.x - d.ox, c.y - d.oy)
      update(d.uid, { mult: Math.max(0.1, Math.min(20, d.om * (now / start))) })
    } else if (d.mode === 'rotate') {
      const a0 = Math.atan2(d.sy - d.oy, d.sx - d.ox)
      const a1 = Math.atan2(c.y - d.oy, c.x - d.ox)
      update(d.uid, { rot: d.or + ((a1 - a0) * 180) / Math.PI })
    }
  }

  const endDrag = () => { dragRef.current = null }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedUid) {
        const t = e.target as HTMLElement
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
        setPlaced(prev => prev.filter(p => p.uid !== selectedUid))
        setSelectedUid(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedUid])

  // ---------------- scale change keeps real-world sizes ----------------
  const changeScale = (next: number) => setScaleDen(next) // sizes derive from widthM, so items rescale automatically

  // ---------------- uploads ----------------
  const onBgUpload = (f: File) => {
    const r = new FileReader()
    r.onload = () => setBg(String(r.result))
    r.readAsDataURL(f)
  }

  const onCustomUpload = (f: File) => {
    const r = new FileReader()
    r.onload = () => {
      const src = String(r.result)
      const img = new Image()
      img.onload = () => {
        const ci: CustomItem = { id: crypto.randomUUID(), name: f.name.replace(/\.[^.]+$/, ''), src, aspect: img.height / Math.max(1, img.width) }
        const next = [...custom, ci]
        setCustom(next)
        try { localStorage.setItem('cosmofolio_entourage_custom', JSON.stringify(next)) } catch {}
        flash('Added to your personal entourage library.')
      }
      img.src = src
    }
    r.readAsDataURL(f)
  }

  // ---------------- export ----------------
  const doExport = (mult: number, toLibrary: boolean) => {
    setBusy(toLibrary ? 'Saving…' : 'Exporting…')
    setSelectedUid(null)
    setExporting(true)
    setTimeout(async () => {
      try {
        const blob = await svgToPngBlob(svgRef.current!, mult, '#ffffff')
        if (toLibrary) flash((await saveImageToLibrary(blob, `entourage_sheet_1-${scaleDen}.png`)).message)
        else downloadBlob(blob, `entourage_sheet_1-${scaleDen}.png`)
      } catch { flash('Export failed — try again.') }
      setExporting(false)
      setBusy('')
    }, 60)
  }

  // ---------------- filtered panel items ----------------
  const items = useMemo(() => ENTOURAGE_ITEMS.filter(i => {
    if (cat !== 'All' && i.category !== cat) return false
    if (view !== 'all' && !i.views.includes(view)) return false
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [cat, view, search])

  return (
    <div className="min-h-screen bg-bg-primary dark:bg-dark-bg-primary flex flex-col">
      <header className="glass-nav shadow-elevation-1 sticky top-0 z-40">
        <div className="container-centered py-4 flex items-center gap-3 flex-wrap">
          <Link href="/dashboard" className="text-stone-light hover:text-slate text-sm">← Dashboard</Link>
          <span className="text-gray-200">|</span>
          <Logo size="sm" variant="gold" />
          <span className="font-semibold text-charcoal">Entourage Studio</span>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Sheet scale</span>
            {SCALES.map(s => (
              <button key={s} onClick={() => changeScale(s)}
                className={`px-2.5 py-1 rounded-md text-xs border ${scaleDen === s ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-white text-gray-600 border-gray-200'}`}>1:{s}</button>
            ))}
          </div>
        </div>
      </header>

      {notice && <div className="container-centered pt-3"><div className="border border-[#D4AF37]/40 bg-[#FBE7A1]/30 text-[#9C7416] rounded-lg px-4 py-2.5 text-sm">{notice}</div></div>}

      <div className="flex-1 flex flex-col lg:flex-row gap-4 container-centered py-4">
        {/* Panel */}
        <aside className="lg:w-[300px] shrink-0 space-y-3 lg:max-h-[calc(100vh-130px)] lg:overflow-y-auto pr-1">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search entourage…"
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white" />
          <div className="flex gap-1 flex-wrap">
            {['All', ...ENTOURAGE_CATEGORIES].map(c => (
              <button key={c} onClick={() => setCat(c)} className={`px-2 py-1 rounded text-xs ${cat === c ? 'bg-[#D4AF37] text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{c}</button>
            ))}
          </div>
          <div className="flex gap-1">
            {(['all', 'plan', 'elevation', 'section'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className={`px-2 py-1 rounded text-xs capitalize ${view === v ? 'bg-[#9C7416] text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{v}</button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {items.map(i => (
              <button key={i.id}
                draggable
                onDragStart={e => e.dataTransfer.setData('text/entourage', i.id)}
                onClick={() => addItem(i.id)}
                title={`${i.name} — ${i.widthM}m wide`}
                className="bg-white rounded-lg border border-gray-200 p-1.5 hover:border-[#D4AF37] transition flex flex-col items-center">
                <div className="h-12 flex items-center justify-center overflow-hidden" dangerouslySetInnerHTML={{ __html: entourageSVG(i, '#333', 44) }} />
                <span className="text-[9px] text-gray-500 leading-tight text-center truncate w-full">{i.name}</span>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <h4 className="text-xs font-bold text-gray-800 mb-2">🧭 North arrows</h4>
            <div className="grid grid-cols-5 gap-1">
              {NORTH_ARROWS.slice(0, 10).map(a => (
                <button key={a.id} onClick={() => addNorthArrow(a.id)} title={a.name}
                  className="border border-gray-200 rounded p-0.5 hover:border-[#D4AF37]"
                  dangerouslySetInnerHTML={{ __html: northArrowSVG(a, '#333', { size: 38 }) }} />
              ))}
            </div>
            <Link href="/dashboard/tools/scale-north" className="text-[10px] text-[#9C7416] hover:underline">All 25+ styles & scale bars →</Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <h4 className="text-xs font-bold text-gray-800 mb-2">📁 My uploads</h4>
            {custom.length > 0 && (
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {custom.map(ci => (
                  <button key={ci.id} onClick={() => addCustom(ci)} title={ci.name}
                    className="bg-gray-50 rounded-lg border border-gray-200 p-1 hover:border-[#D4AF37]">
                    <img src={ci.src} alt={ci.name} className="h-10 w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => customInputRef.current?.click()} className="w-full py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 hover:border-[#D4AF37]">＋ Upload PNG / SVG</button>
            <input ref={customInputRef} type="file" accept="image/png,image/svg+xml,image/jpeg" className="hidden"
              onChange={e => e.target.files?.[0] && onCustomUpload(e.target.files[0])} />
          </div>
        </aside>

        {/* Canvas */}
        <section className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <button onClick={() => bgInputRef.current?.click()} className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white hover:bg-gray-50">🖼️ Background drawing</button>
            <input ref={bgInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && onBgUpload(e.target.files[0])} />
            {bg && <button onClick={() => setBg(null)} className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white hover:bg-gray-50">✕ Remove bg</button>}
            <button onClick={() => { setPlaced([]); setSelectedUid(null) }} disabled={!placed.length} className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50">Clear all</button>
            <div className="flex-1" />
            <span className="text-xs text-gray-400">{placed.length} items · click or drag from panel · Del removes</span>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-100 p-3 overflow-auto">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${VBW} ${VBH}`}
              className="w-full h-auto bg-white shadow"
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
              onPointerDown={() => setSelectedUid(null)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                const id = e.dataTransfer.getData('text/entourage')
                if (id) { const c = toSvgCoords(e.clientX, e.clientY); addItem(id, c.x, c.y) }
              }}
            >
              <rect x="0" y="0" width={VBW} height={VBH} fill="#ffffff" />
              {bg && <image href={bg} x="0" y="0" width={VBW} height={VBH} preserveAspectRatio="xMidYMid meet" />}

              {placed.map(p => {
                const { w, h } = sizePx(p)
                const item = p.itemId ? getEntourageItem(p.itemId) : null
                const sel = p.uid === selectedUid && !exporting
                return (
                  <g key={p.uid}
                    transform={`translate(${p.x} ${p.y}) rotate(${p.rot}) scale(${p.flipH ? -1 : 1} ${p.flipV ? -1 : 1})`}
                    opacity={p.opacity}
                    style={{ cursor: p.locked ? 'not-allowed' : 'move' }}
                    onPointerDown={e => onItemPointerDown(e, p)}
                  >
                    {item ? (
                      <svg x={-w / 2} y={-h / 2} width={w} height={h} viewBox={`0 0 ${item.vb[0]} ${item.vb[1]}`} overflow="visible" preserveAspectRatio="none">
                        <g dangerouslySetInnerHTML={{ __html: item.body(p.color) }} />
                      </svg>
                    ) : (
                      <image href={p.customSrc} x={-w / 2} y={-h / 2} width={w} height={h} preserveAspectRatio="none" />
                    )}
                    {sel && (
                      <g>
                        <rect x={-w / 2 - 4} y={-h / 2 - 4} width={w + 8} height={h + 8} fill="none" stroke="#D4AF37" strokeWidth={2.5} strokeDasharray="8 5" />
                        <circle cx={w / 2 + 4} cy={h / 2 + 4} r={11} fill="#D4AF37" style={{ cursor: 'nwse-resize' }} onPointerDown={e => onHandleDown(e, p, 'resize')} />
                        <line x1={0} y1={-h / 2 - 4} x2={0} y2={-h / 2 - 34} stroke="#D4AF37" strokeWidth={2.5} />
                        <circle cx={0} cy={-h / 2 - 40} r={11} fill="#fff" stroke="#D4AF37" strokeWidth={3} style={{ cursor: 'grab' }} onPointerDown={e => onHandleDown(e, p, 'rotate')} />
                      </g>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Selected controls */}
          {selected && (
            <div className="mt-3 bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3 flex-wrap text-sm">
              <span className="font-semibold text-gray-800 text-xs">{selected.itemId ? getEntourageItem(selected.itemId)?.name : 'Custom image'}</span>
              <button onClick={() => update(selected.uid, { flipH: !selected.flipH })} className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs">⇋ Flip H</button>
              <button onClick={() => update(selected.uid, { flipV: !selected.flipV })} className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs">⇵ Flip V</button>
              {selected.itemId && (
                <span className="flex items-center gap-1.5 text-xs text-gray-600">
                  Colour
                  <input type="color" value={selected.color} onChange={e => update(selected.uid, { color: e.target.value })} className="w-7 h-6 rounded border" />
                  {['#222222', '#777777', '#000000'].map(c => (
                    <button key={c} onClick={() => update(selected.uid, { color: c })} className="w-5 h-5 rounded border" style={{ background: c }} />
                  ))}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-gray-600">
                Opacity
                <input type="range" min={10} max={100} value={Math.round(selected.opacity * 100)} onChange={e => update(selected.uid, { opacity: Number(e.target.value) / 100 })} className="w-20 accent-[#D4AF37]" />
              </span>
              <button onClick={() => update(selected.uid, { locked: !selected.locked })} className={`px-2.5 py-1.5 rounded-lg border text-xs ${selected.locked ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'border-gray-200 hover:bg-gray-50'}`}>{selected.locked ? '🔒 Locked' : '🔓 Lock'}</button>
              <button onClick={() => { const cp = { ...selected, uid: crypto.randomUUID(), x: selected.x + 40, y: selected.y + 40 }; setPlaced(prev => [...prev, cp]); setSelectedUid(cp.uid) }} className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs">⧉ Duplicate</button>
              <button onClick={() => { setPlaced(prev => prev.filter(pp => pp.uid !== selected.uid)); setSelectedUid(null) }} className="px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs">🗑 Delete</button>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => doExport(1, false)} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50">🖼️ PNG (screen)</button>
            <button onClick={() => doExport(2.5, false)} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50">🖨️ PNG (high-res)</button>
            <button onClick={() => doExport(2.5, true)} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-br from-[#D4AF37] to-[#9C7416] hover:brightness-105">💾 Save to Library</button>
            <Link href="/dashboard/sheets" className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50">→ Sheet Composer</Link>
          </div>
        </section>
      </div>

      {busy && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl px-6 py-4 shadow-xl flex items-center gap-3">
            <span className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-700">{busy}</span>
          </div>
        </div>
      )}
    </div>
  )
}
