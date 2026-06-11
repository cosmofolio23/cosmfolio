'use client'

/**
 * Scale Bar & North Arrow Generator — instant, correct drawing furniture.
 */

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { generateScaleBar, COMMON_SCALES, type ScaleBarStyle, type ScaleBarSize } from '@/lib/graphics/scaleBar'
import { NORTH_ARROWS, NORTH_CATEGORIES, northArrowSVG, getNorthArrow } from '@/lib/graphics/northArrows'
import { downloadBlob, saveImageToLibrary } from '@/lib/saveToLibrary'

function svgStringToPng(svg: string, mult: number, cb: (blob: Blob) => void) {
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = img.width * mult
    canvas.height = img.height * mult
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(b => b && cb(b), 'image/png')
  }
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export default function ScaleNorthPage() {
  const [tab, setTab] = useState<'scale' | 'north'>('scale')
  const [notice, setNotice] = useState('')

  // scale bar state
  const [scale, setScale] = useState(100)
  const [customScale, setCustomScale] = useState('')
  const [length, setLength] = useState(10)
  const [units, setUnits] = useState<'m' | 'ft'>('m')
  const [sbStyle, setSbStyle] = useState<ScaleBarStyle>('classic')
  const [sbSize, setSbSize] = useState<ScaleBarSize>('medium')
  const [sbColor, setSbColor] = useState('#111111')

  // north arrow state
  const [naCat, setNaCat] = useState<string>('All')
  const [naId, setNaId] = useState('min-line')
  const [naColor, setNaColor] = useState('#111111')
  const [naSize, setNaSize] = useState(200)
  const [showMagnetic, setShowMagnetic] = useState(false)
  const [declination, setDeclination] = useState(8)
  const customRef = useRef<HTMLInputElement | null>(null)
  const [customArrow, setCustomArrow] = useState<string | null>(null)

  const effScale = customScale ? Math.max(1, parseInt(customScale) || 100) : scale
  const bar = useMemo(
    () => generateScaleBar({ scale: effScale, length, units, style: sbStyle, size: sbSize, color: sbColor }),
    [effScale, length, units, sbStyle, sbSize, sbColor]
  )

  const arrowSvg = useMemo(() => {
    const def = getNorthArrow(naId) || NORTH_ARROWS[0]
    return northArrowSVG(def, naColor, { size: naSize, magneticDeclination: showMagnetic ? declination : null })
  }, [naId, naColor, naSize, showMagnetic, declination])

  const flash = (m: string) => { setNotice(m); setTimeout(() => setNotice(''), 3500) }

  const dlSvg = (svg: string, name: string) => downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `${name}.svg`)
  const dlPng = (svg: string, name: string, mult = 3) => svgStringToPng(svg, mult, b => downloadBlob(b, `${name}.png`))
  const toLib = (svg: string, name: string) => svgStringToPng(svg, 3, async b => flash((await saveImageToLibrary(b, `${name}.png`)).message))

  return (
    <div className="min-h-screen bg-bg-primary dark:bg-dark-bg-primary">
      <header className="glass-nav shadow-elevation-1 sticky top-0 z-40">
        <div className="container-centered py-4 flex items-center gap-3">
          <Link href="/dashboard" className="text-stone-light hover:text-slate text-sm">← Dashboard</Link>
          <span className="text-gray-200">|</span>
          <Logo size="sm" variant="gold" />
          <span className="font-semibold text-charcoal">Scale Bar & North Arrow</span>
        </div>
      </header>

      <main className="container-centered py-8 max-w-5xl">
        {notice && <div className="mb-4 border border-[#D4AF37]/40 bg-[#FBE7A1]/30 text-[#9C7416] rounded-lg px-4 py-2.5 text-sm">{notice}</div>}

        <div className="flex gap-2 mb-6">
          {([['scale', '📏 Scale Bar'], ['north', '🧭 North Arrow']] as const).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === k ? 'bg-[#D4AF37] text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>{label}</button>
          ))}
        </div>

        {tab === 'scale' && (
          <div className="grid lg:grid-cols-[340px_1fr] gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Drawing scale</label>
                <div className="flex gap-1.5 flex-wrap">
                  {COMMON_SCALES.map(s => (
                    <button key={s} onClick={() => { setScale(s); setCustomScale('') }}
                      className={`px-2.5 py-1.5 rounded-md text-xs border ${effScale === s && !customScale ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-white text-gray-600 border-gray-200'}`}>1:{s}</button>
                  ))}
                </div>
                <input value={customScale} onChange={e => setCustomScale(e.target.value.replace(/\D/g, ''))}
                  placeholder="Custom (e.g. 250)" className="mt-2 w-full border rounded-lg px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Bar shows 0 – {length}{units}</label>
                <input type="range" min={1} max={units === 'm' ? 100 : 300} value={length}
                  onChange={e => setLength(Number(e.target.value))} className="w-full accent-[#D4AF37]" />
                <div className="flex gap-1.5 mt-1.5">
                  {(units === 'm' ? [5, 10, 20, 50] : [10, 25, 50, 100]).map(v => (
                    <button key={v} onClick={() => setLength(v)} className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">{v}{units}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-600">Units</label>
                {(['m', 'ft'] as const).map(u => (
                  <button key={u} onClick={() => setUnits(u)} className={`px-2.5 py-1 rounded text-xs border ${units === u ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-white text-gray-600 border-gray-200'}`}>{u === 'm' ? 'metres' : 'feet'}</button>
                ))}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Style</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['classic', 'minimal', 'graphic', 'dotted'] as ScaleBarStyle[]).map(s => (
                    <button key={s} onClick={() => setSbStyle(s)} className={`px-2 py-1.5 rounded-md text-xs capitalize border ${sbStyle === s ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-white text-gray-600 border-gray-200'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {(['small', 'medium', 'large'] as ScaleBarSize[]).map(s => (
                    <button key={s} onClick={() => setSbSize(s)} className={`px-2 py-1 rounded text-xs capitalize border ${sbSize === s ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-white text-gray-600 border-gray-200'}`}>{s[0].toUpperCase()}</button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-600">Colour</span>
                  <input type="color" value={sbColor} onChange={e => setSbColor(e.target.value)} className="w-8 h-7 rounded border" />
                </div>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-xl border border-gray-200 p-8 flex items-center justify-center min-h-[200px] overflow-auto"
                dangerouslySetInnerHTML={{ __html: bar.svg }} />
              <p className="text-[11px] text-gray-400 mt-2">True paper size at 1:{effScale} — {length}{units} prints {(units === 'ft' ? length * 0.3048 : length) * 1000 / effScale}mm long.</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                <button onClick={() => dlSvg(bar.svg, `scalebar_1-${effScale}`)} className="px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50">⬇ SVG</button>
                <button onClick={() => dlPng(bar.svg, `scalebar_1-${effScale}`)} className="px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50">⬇ PNG</button>
                <button onClick={() => toLib(bar.svg, `scalebar_1-${effScale}`)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-br from-[#D4AF37] to-[#9C7416]">💾 Save to Library</button>
              </div>
            </div>
          </div>
        )}

        {tab === 'north' && (
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            <div>
              <div className="flex gap-1.5 mb-3 flex-wrap">
                {['All', ...NORTH_CATEGORIES].map(c => (
                  <button key={c} onClick={() => setNaCat(c)} className={`px-3 py-1.5 rounded-lg text-xs ${naCat === c ? 'bg-[#D4AF37] text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{c}</button>
                ))}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                {NORTH_ARROWS.filter(a => naCat === 'All' || a.category === naCat).map(a => (
                  <button key={a.id} onClick={() => setNaId(a.id)} title={a.name}
                    className={`bg-white rounded-xl border-2 p-2 hover:shadow transition ${naId === a.id ? 'border-[#D4AF37]' : 'border-gray-200'}`}>
                    <div dangerouslySetInnerHTML={{ __html: northArrowSVG(a, naColor, { size: 72 }) }} />
                    <div className="text-[10px] text-gray-500 mt-1 truncate">{a.name}</div>
                  </button>
                ))}
                <button onClick={() => customRef.current?.click()}
                  className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-2 text-gray-400 hover:border-[#D4AF37] flex flex-col items-center justify-center min-h-[100px]">
                  <span className="text-2xl">＋</span>
                  <span className="text-[10px]">Upload own</span>
                  <input ref={customRef} type="file" accept="image/svg+xml,image/png" className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      const r = new FileReader()
                      r.onload = () => setCustomArrow(String(r.result))
                      r.readAsDataURL(f)
                    }} />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 h-fit">
              <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4 min-h-[220px]">
                {customArrow
                  ? <img src={customArrow} alt="custom north arrow" style={{ width: naSize, height: naSize, objectFit: 'contain' }} />
                  : <div dangerouslySetInnerHTML={{ __html: arrowSvg }} />}
              </div>
              {customArrow && <button onClick={() => setCustomArrow(null)} className="text-xs text-[#9C7416] hover:underline">← Back to library arrows</button>}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Size — {naSize}px</label>
                <input type="range" min={60} max={400} value={naSize} onChange={e => setNaSize(Number(e.target.value))} className="w-full accent-[#D4AF37]" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-600">Colour</label>
                <input type="color" value={naColor} onChange={e => setNaColor(e.target.value)} className="w-8 h-7 rounded border" />
                {['#111111', '#666666', '#ffffff', '#D4AF37'].map(c => (
                  <button key={c} onClick={() => setNaColor(c)} className="w-6 h-6 rounded border" style={{ background: c }} />
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={showMagnetic} onChange={e => setShowMagnetic(e.target.checked)} />
                Show magnetic north (true vs magnetic)
              </label>
              {showMagnetic && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Declination — {declination}°</label>
                  <input type="range" min={-30} max={30} value={declination} onChange={e => setDeclination(Number(e.target.value))} className="w-full accent-[#D4AF37]" />
                </div>
              )}
              <div className="flex gap-2 flex-wrap pt-1">
                <button onClick={() => dlSvg(arrowSvg, `north_${naId}`)} disabled={!!customArrow} className="px-3 py-2 rounded-lg text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40">⬇ SVG</button>
                <button onClick={() => dlPng(arrowSvg, `north_${naId}`)} disabled={!!customArrow} className="px-3 py-2 rounded-lg text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40">⬇ PNG</button>
                <button onClick={() => toLib(arrowSvg, `north_${naId}`)} disabled={!!customArrow} className="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-br from-[#D4AF37] to-[#9C7416] disabled:opacity-40">💾 Library</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
