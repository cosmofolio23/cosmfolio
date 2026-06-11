'use client'

/**
 * Site Analysis Page Builder — assemble a complete site-analysis sheet from
 * built-in generators (sun path, wind rose) and map-overlay editors
 * (location, land use, noise, access, green cover, topography).
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import MapAnnotator, { type MapMode } from '@/components/siteAnalysis/MapAnnotator'
import { INDIAN_CITIES, generateSunPath, generateWindRose, type SunPathStyle } from '@/lib/siteAnalysis/generators'
import { downloadBlob, saveImageToLibrary } from '@/lib/saveToLibrary'
import { libraryApi } from '@/lib/libraryApi'

const LAYOUTS = [
  { id: '2x2', name: '4-panel (2×2)', cols: 2, rows: 2 },
  { id: '3x2', name: '6-panel (3×2)', cols: 3, rows: 2 },
  { id: '4x2', name: '8-panel (4×2)', cols: 4, rows: 2 },
  { id: 'full', name: 'Single diagram', cols: 1, rows: 1 },
]

const DIAGRAM_TYPES: Array<{ id: string; name: string; icon: string; kind: 'sun' | 'wind' | MapMode }> = [
  { id: 'sun', name: 'Sun Path', icon: '☀️', kind: 'sun' },
  { id: 'wind', name: 'Wind Rose', icon: '🌬️', kind: 'wind' },
  { id: 'location', name: 'Location Map', icon: '📍', kind: 'location' },
  { id: 'landuse', name: 'Land Use', icon: '🏘️', kind: 'landuse' },
  { id: 'noise', name: 'Noise Map', icon: '🔊', kind: 'noise' },
  { id: 'access', name: 'Access & Circulation', icon: '🚦', kind: 'access' },
  { id: 'green', name: 'Green Cover', icon: '🌿', kind: 'green' },
  { id: 'topo', name: 'Topography', icon: '⛰️', kind: 'topo' },
]

interface Panel {
  title: string
  notes: string
  image: string | null
  typeId: string | null
}

const emptyPanel = (): Panel => ({ title: '', notes: '', image: null, typeId: null })

function svgToDataUrl(svg: string): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.width * 2; c.height = img.height * 2
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height)
      ctx.drawImage(img, 0, 0, c.width, c.height)
      res(c.toDataURL('image/png'))
    }
    img.onerror = () => rej(new Error('svg render'))
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  })
}

export default function SiteAnalysisPage() {
  const [layoutId, setLayoutId] = useState('3x2')
  const [panels, setPanels] = useState<Panel[]>(Array.from({ length: 6 }, emptyPanel))
  const [meta, setMeta] = useState({ project: '', student: '', college: '', year: String(new Date().getFullYear()), sheetNo: '01' })
  const [editorFor, setEditorFor] = useState<{ idx: number; kind: 'sun' | 'wind' | MapMode } | null>(null)
  const [chooserFor, setChooserFor] = useState<number | null>(null)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState('')

  // sun config
  const [cityIdx, setCityIdx] = useState(0)
  const [customLat, setCustomLat] = useState('')
  const [sunStyle, setSunStyle] = useState<SunPathStyle>('flat')
  // wind config
  const [windCityIdx, setWindCityIdx] = useState(0)
  const [windPct, setWindPct] = useState<number[]>([...INDIAN_CITIES[0].wind])
  const [speedSplit, setSpeedSplit] = useState<[number, number, number]>([40, 40, 20])

  const layout = LAYOUTS.find(l => l.id === layoutId)!
  const flash = (m: string) => { setNotice(m); setTimeout(() => setNotice(''), 4000) }

  const setLayout = (id: string) => {
    const l = LAYOUTS.find(x => x.id === id)!
    setLayoutId(id)
    setPanels(prev => {
      const n = l.cols * l.rows
      const next = prev.slice(0, n)
      while (next.length < n) next.push(emptyPanel())
      return next
    })
  }

  const updatePanel = (i: number, patch: Partial<Panel>) =>
    setPanels(prev => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))

  const sunSvg = useMemo(() => {
    const lat = customLat ? parseFloat(customLat) : INDIAN_CITIES[cityIdx].lat
    return generateSunPath(Number.isFinite(lat) ? lat : 20, sunStyle)
  }, [cityIdx, customLat, sunStyle])

  const windSvg = useMemo(
    () => generateWindRose({ percentages: windPct, speedSplit }),
    [windPct, speedSplit]
  )

  const applySun = async () => {
    if (!editorFor) return
    const url = await svgToDataUrl(sunSvg)
    updatePanel(editorFor.idx, { image: url, typeId: 'sun', title: panels[editorFor.idx].title || 'Sun Path' })
    setEditorFor(null)
  }
  const applyWind = async () => {
    if (!editorFor) return
    const url = await svgToDataUrl(windSvg)
    updatePanel(editorFor.idx, { image: url, typeId: 'wind', title: panels[editorFor.idx].title || `Wind Rose — ${INDIAN_CITIES[windCityIdx].name}` })
    setEditorFor(null)
  }

  const importFromLibrary = async () => {
    try {
      const { items } = await libraryApi.listProjects()
      const real = items.filter(p => p.name !== 'Studio Tools' && p.name !== 'Processed Drawings')
      if (!real.length) { flash('No Library projects found — fill the fields manually.'); return }
      const p = real[0]
      setMeta(m => ({ ...m, project: p.name, year: p.year ? String(p.year) : m.year }))
      flash(`Imported “${p.name}” from your Library.`)
    } catch { flash('Library unavailable — fill the fields manually.') }
  }

  // ---------------- compose + export ----------------
  const compose = async (mult: number): Promise<Blob> => {
    const W = 1684 * mult, H = 1190 * mult
    const c = document.createElement('canvas')
    c.width = W; c.height = H
    const ctx = c.getContext('2d')!
    const u = (n: number) => n * mult
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H)
    // header
    ctx.fillStyle = '#111111'; ctx.fillRect(0, 0, W, u(76))
    ctx.fillStyle = '#D4AF37'
    ctx.font = `700 ${u(30)}px Inter, sans-serif`
    ctx.fillText('SITE ANALYSIS', u(36), u(48))
    ctx.fillStyle = '#ffffff'
    ctx.font = `400 ${u(14)}px Inter, sans-serif`
    const right = [meta.project, meta.student, meta.college].filter(Boolean).join('  ·  ')
    ctx.textAlign = 'right'
    ctx.fillText(right, W - u(36), u(38))
    ctx.fillText(`${meta.year}   Sheet ${meta.sheetNo}`, W - u(36), u(60))
    ctx.textAlign = 'left'
    // grid
    const pad = u(28), top = u(100), footH = u(40)
    const gw = (W - pad * (layout.cols + 1)) / layout.cols
    const gh = (H - top - footH - pad * layout.rows) / layout.rows
    for (let i = 0; i < panels.length; i++) {
      const col = i % layout.cols, row = Math.floor(i / layout.cols)
      const x = pad + col * (gw + pad), y = top + row * (gh + pad)
      ctx.strokeStyle = '#dddddd'; ctx.lineWidth = u(1)
      ctx.strokeRect(x, y, gw, gh)
      const p = panels[i]
      // title
      ctx.fillStyle = '#111'
      ctx.font = `700 ${u(15)}px Inter, sans-serif`
      ctx.fillText((p.title || `Panel ${i + 1}`).toUpperCase(), x + u(12), y + u(24))
      ctx.fillStyle = '#D4AF37'; ctx.fillRect(x + u(12), y + u(32), u(34), u(3))
      // image
      const noteLines = p.notes ? p.notes.split('\n').filter(Boolean) : []
      const notesH = noteLines.length ? u(16) * noteLines.length + u(10) : 0
      const imgY = y + u(44), imgH = gh - u(56) - notesH
      if (p.image) {
        const img = new Image()
        await new Promise<void>(r => { img.onload = () => r(); img.onerror = () => r(); img.src = p.image! })
        if (img.width) {
          const s = Math.min((gw - u(24)) / img.width, imgH / img.height)
          const dw = img.width * s, dh = img.height * s
          ctx.drawImage(img, x + (gw - dw) / 2, imgY + (imgH - dh) / 2, dw, dh)
        }
      } else {
        ctx.fillStyle = '#f5f5f5'; ctx.fillRect(x + u(12), imgY, gw - u(24), imgH)
        ctx.fillStyle = '#bbb'; ctx.font = `400 ${u(13)}px Inter, sans-serif`
        ctx.textAlign = 'center'; ctx.fillText('empty panel', x + gw / 2, imgY + imgH / 2); ctx.textAlign = 'left'
      }
      // notes
      ctx.fillStyle = '#444'; ctx.font = `400 ${u(11)}px Inter, sans-serif`
      noteLines.forEach((ln, li) => {
        ctx.fillText(`• ${ln}`, x + u(12), y + gh - notesH + u(14) + li * u(16))
      })
    }
    // footer
    ctx.fillStyle = '#999'; ctx.font = `400 ${u(11)}px Inter, sans-serif`
    ctx.fillText('Generated with CosmoFolio — Site Analysis Builder', pad, H - u(14))
    return await new Promise<Blob>((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('blob'))), 'image/png'))
  }

  const doExport = async (mult: number, toLib: boolean) => {
    setBusy(toLib ? 'Saving…' : 'Exporting…')
    try {
      const blob = await compose(mult)
      const name = `site_analysis_${(meta.project || 'sheet').replace(/\s+/g, '_')}.png`
      if (toLib) flash((await saveImageToLibrary(blob, name)).message)
      else downloadBlob(blob, name)
    } catch { flash('Export failed — try again.') }
    setBusy('')
  }

  return (
    <div className="min-h-screen bg-bg-primary dark:bg-dark-bg-primary">
      <header className="glass-nav shadow-elevation-1 sticky top-0 z-40">
        <div className="container-centered py-4 flex items-center gap-3">
          <Link href="/dashboard" className="text-stone-light hover:text-slate text-sm">← Dashboard</Link>
          <span className="text-gray-200">|</span>
          <Logo size="sm" variant="gold" />
          <span className="font-semibold text-charcoal">Site Analysis Builder</span>
        </div>
      </header>

      <main className="container-centered py-6">
        {notice && <div className="mb-4 border border-[#D4AF37]/40 bg-[#FBE7A1]/30 text-[#9C7416] rounded-lg px-4 py-2.5 text-sm">{notice}</div>}

        {/* meta */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Sheet header</h3>
            <button onClick={importFromLibrary} className="text-xs text-[#9C7416] hover:underline">⤓ Auto-fill from Library</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {([['project', 'Project name'], ['student', 'Student name'], ['college', 'College'], ['year', 'Year'], ['sheetNo', 'Sheet no.']] as const).map(([k, label]) => (
              <input key={k} value={(meta as any)[k]} onChange={e => setMeta(m => ({ ...m, [k]: e.target.value }))}
                placeholder={label} className="border rounded-lg px-3 py-2 text-sm" />
            ))}
          </div>
        </div>

        {/* layout */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {LAYOUTS.map(l => (
            <button key={l.id} onClick={() => setLayout(l.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${layoutId === l.id ? 'bg-[#D4AF37] text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>{l.name}</button>
          ))}
        </div>

        {/* panels */}
        <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: `repeat(${layout.cols}, minmax(0,1fr))` }}>
          {panels.map((p, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-3 flex flex-col">
              <input value={p.title} onChange={e => updatePanel(i, { title: e.target.value })}
                placeholder={`Panel ${i + 1} title`} className="border-b border-gray-100 pb-1 mb-2 text-sm font-semibold focus:outline-none" />
              {p.image ? (
                <div className="relative group">
                  <img src={p.image} alt={p.title} className="w-full h-40 object-contain bg-gray-50 rounded" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded flex items-center justify-center gap-2">
                    <button onClick={() => setChooserFor(i)} className="px-3 py-1.5 rounded bg-white text-xs font-medium">Replace</button>
                    <button onClick={() => updatePanel(i, { image: null, typeId: null })} className="px-3 py-1.5 rounded bg-red-500 text-white text-xs font-medium">Remove</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setChooserFor(i)}
                  className="h-40 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-sm hover:border-[#D4AF37] hover:text-[#9C7416] transition">
                  ＋ Add diagram
                </button>
              )}
              <textarea value={p.notes} onChange={e => updatePanel(i, { notes: e.target.value })}
                placeholder="Observations (one per line → bullets)" rows={2}
                className="mt-2 border rounded-lg px-2 py-1.5 text-xs resize-none" />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => doExport(1, false)} disabled={!!busy} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50">🖼️ PNG (screen)</button>
          <button onClick={() => doExport(2, false)} disabled={!!busy} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50">🖨️ PNG (print)</button>
          <button onClick={() => doExport(2, true)} disabled={!!busy} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-br from-[#D4AF37] to-[#9C7416] disabled:opacity-50">💾 Save to Library</button>
          <Link href="/dashboard/sheets" className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50">→ Sheet Composer</Link>
          {busy && <span className="px-3 py-2.5 text-sm text-gray-500">{busy}</span>}
        </div>
      </main>

      {/* diagram type chooser */}
      {chooserFor !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setChooserFor(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-3">Choose diagram type</h3>
            <div className="grid grid-cols-2 gap-2">
              {DIAGRAM_TYPES.map(d => (
                <button key={d.id} onClick={() => { setEditorFor({ idx: chooserFor, kind: d.kind }); setChooserFor(null) }}
                  className="p-3 rounded-xl border-2 border-gray-200 hover:border-[#D4AF37] text-left">
                  <div className="text-2xl">{d.icon}</div>
                  <div className="text-sm font-semibold text-gray-900">{d.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* sun editor */}
      {editorFor?.kind === 'sun' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditorFor(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-auto p-5" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-3">☀️ Sun Path Diagram</h3>
            <div className="flex gap-3 flex-wrap items-center mb-3 text-sm">
              <select value={cityIdx} onChange={e => { setCityIdx(Number(e.target.value)); setCustomLat('') }} className="border rounded-lg px-3 py-2">
                {INDIAN_CITIES.map((c, i) => <option key={c.name} value={i}>{c.name} ({c.lat.toFixed(1)}°N)</option>)}
              </select>
              <input value={customLat} onChange={e => setCustomLat(e.target.value)} placeholder="…or latitude (e.g. 19.07)" className="border rounded-lg px-3 py-2 w-44" />
              {(['flat', 'dome', 'arc'] as SunPathStyle[]).map(s => (
                <button key={s} onClick={() => setSunStyle(s)} className={`px-3 py-1.5 rounded-lg text-xs capitalize ${sunStyle === s ? 'bg-[#D4AF37] text-white' : 'bg-gray-100 text-gray-600'}`}>{s}</button>
              ))}
            </div>
            <div className="border border-gray-200 rounded-lg flex justify-center p-2" dangerouslySetInnerHTML={{ __html: sunSvg }} />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditorFor(null)} className="px-4 py-2 rounded-lg text-sm border border-gray-200">Cancel</button>
              <button onClick={applySun} className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-br from-[#D4AF37] to-[#9C7416]">✓ Use diagram</button>
            </div>
          </div>
        </div>
      )}

      {/* wind editor */}
      {editorFor?.kind === 'wind' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditorFor(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-auto p-5" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-3">🌬️ Wind Rose</h3>
            <div className="grid md:grid-cols-[300px_1fr] gap-4">
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Typical data (approx.)</label>
                  <select value={windCityIdx} onChange={e => { const i = Number(e.target.value); setWindCityIdx(i); setWindPct([...INDIAN_CITIES[i].wind]) }} className="border rounded-lg px-3 py-2 w-full">
                    {INDIAN_CITIES.map((c, i) => <option key={c.name} value={i}>{c.name}</option>)}
                  </select>
                </div>
                {['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map((d, i) => (
                  <div key={d} className="flex items-center gap-2">
                    <span className="w-7 text-xs font-semibold text-gray-600">{d}</span>
                    <input type="range" min={0} max={40} value={windPct[i]}
                      onChange={e => setWindPct(prev => prev.map((v, vi) => (vi === i ? Number(e.target.value) : v)))}
                      className="flex-1 accent-[#D4AF37]" />
                    <span className="w-8 text-xs text-gray-400 tabular-nums">{windPct[i]}%</span>
                  </div>
                ))}
                <div className="pt-1">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Speed mix — light/moderate/strong</label>
                  <div className="flex gap-2">
                    {speedSplit.map((v, i) => (
                      <input key={i} type="number" min={0} max={100} value={v}
                        onChange={e => setSpeedSplit(prev => prev.map((pv, pi) => (pi === i ? Number(e.target.value) : pv)) as [number, number, number])}
                        className="w-16 border rounded px-2 py-1 text-xs" />
                    ))}
                  </div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg flex justify-center p-2" dangerouslySetInnerHTML={{ __html: windSvg }} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditorFor(null)} className="px-4 py-2 rounded-lg text-sm border border-gray-200">Cancel</button>
              <button onClick={applyWind} className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-br from-[#D4AF37] to-[#9C7416]">✓ Use diagram</button>
            </div>
          </div>
        </div>
      )}

      {/* map-based editors */}
      {editorFor && editorFor.kind !== 'sun' && editorFor.kind !== 'wind' && (
        <MapAnnotator
          mode={editorFor.kind}
          onCancel={() => setEditorFor(null)}
          onDone={r => {
            const dt = DIAGRAM_TYPES.find(d => d.kind === editorFor.kind)
            const extra = r.greenPct !== undefined ? `Green cover ≈ ${r.greenPct}%` : ''
            updatePanel(editorFor.idx, {
              image: r.dataUrl,
              typeId: editorFor.kind,
              title: panels[editorFor.idx].title || dt?.name || '',
              notes: panels[editorFor.idx].notes || extra,
            })
            setEditorFor(null)
          }}
        />
      )}
    </div>
  )
}
