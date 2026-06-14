'use client'

/**
 * Drawing Processor — apply architecture styles, hatches and colour zones to an
 * uploaded drawing entirely client-side (HTML5 Canvas). Replaces the Photoshop
 * step of processing raw CAD exports.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { libraryApi } from '@/lib/libraryApi'
import { stashSheetImage, createSheetProject } from '@/lib/sheetHandoff'
import {
  DRAWING_TYPES, STYLE_PRESETS, type StylePreset, type Background,
} from '@/lib/drawingProcessor/stylePresets'
import {
  HATCHES, HATCH_CATEGORIES, makeHatchPattern, type HatchScale,
} from '@/lib/drawingProcessor/hatchPatterns'
import { ROOM_TYPES, getRoomType } from '@/lib/drawingProcessor/roomTypes'
import {
  applyAdjustments, computeInk, floodFillRegion, maskToCanvas,
  type Adjustments, type LineSettings,
} from '@/lib/drawingProcessor/imageOps'

const MAX_WORK = 1800   // longest edge of the working canvas
const PRINT_MULT = 2    // export multiplier for "300dpi" output

const GOLD = '#D4AF37'

type Tool = 'none' | 'hatch' | 'zone'

interface Fill {
  id: string
  kind: 'color' | 'hatch'
  color: string
  alpha: number
  hatchId?: string
  hatchScale?: HatchScale
  hatchColor?: string
  mask: Uint8Array
  maskCanvas: HTMLCanvasElement
  cx: number
  cy: number
  label?: string
}

const defaultAdjustments = (): Adjustments => ({ brightness: 0, contrast: 0, tone: 0, invert: false })
const defaultLine = (): LineSettings => ({ threshold: 135, weight: 1, wall: 1, annotation: 0.8, dimension: 0.6, color: '#111111' })

export default function DrawingProcessor() {
  const router = useRouter()
  const [step, setStep] = useState<'upload' | 'edit'>('upload')
  const [drawingType, setDrawingType] = useState('floor-plan')
  const [fileName, setFileName] = useState('')

  const [presetId, setPresetId] = useState<string | null>(null)
  const [adjustments, setAdjustments] = useState<Adjustments>(defaultAdjustments())
  const [line, setLine] = useState<LineSettings>(defaultLine())
  const [background, setBackground] = useState<Background>('white')
  const [preset, setPreset] = useState<StylePreset | null>(null)

  const [tool, setTool] = useState<Tool>('none')
  const [hatchId, setHatchId] = useState('concrete')
  const [hatchScale, setHatchScale] = useState<HatchScale>('medium')
  const [hatchColor, setHatchColor] = useState('#333333')
  const [hatchCat, setHatchCat] = useState<typeof HATCH_CATEGORIES[number]>('Structural')

  const [roomTypeId, setRoomTypeId] = useState('living')
  const [zoneColor, setZoneColor] = useState<string | null>(null) // override
  const [showLabels, setShowLabels] = useState(false)
  const [tolerance, setTolerance] = useState(42)

  const [fills, setFills] = useState<Fill[]>([])
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err' | 'info'; msg: string } | null>(null)

  const imgRef = useRef<HTMLImageElement | null>(null)
  const srcDataRef = useRef<ImageData | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const workRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 })
  const rafRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const flash = (kind: 'ok' | 'err' | 'info', msg: string, ms = 3500) => {
    setNotice({ kind, msg })
    window.setTimeout(() => setNotice(null), ms)
  }

  // ---------------- Upload ----------------
  const handleFile = useCallback((file: File) => {
    if (!file) return
    if (file.type === 'application/pdf') {
      flash('info', 'PDF detected — please export the page as PNG or JPG for processing (full PDF support coming soon).', 6000)
      return
    }
    if (!file.type.startsWith('image/')) {
      flash('err', 'Please upload a PNG, JPG or WEBP image.')
      return
    }
    setFileName(file.name)
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, MAX_WORK / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const off = document.createElement('canvas')
      off.width = w; off.height = h
      const octx = off.getContext('2d')!
      octx.drawImage(img, 0, 0, w, h)
      srcDataRef.current = octx.getImageData(0, 0, w, h)
      imgRef.current = img
      workRef.current = { w, h }
      setFills([])
      setStep('edit')
      // apply the first preset for this type
      const first = STYLE_PRESETS[drawingType]?.[0]
      if (first) applyPreset(first)
      URL.revokeObjectURL(url)
    }
    img.onerror = () => flash('err', 'Could not read that image.')
    img.src = url
  }, [drawingType])

  // ---------------- Preset ----------------
  const applyPreset = useCallback((p: StylePreset) => {
    setPresetId(p.id)
    setPreset(p)
    setAdjustments({ ...defaultAdjustments(), ...p.adjustments })
    setLine({ ...defaultLine(), ...p.line })
    setBackground(p.background)
  }, [])

  // ---------------- Render ----------------
  const renderComposite = useCallback((ctx: CanvasRenderingContext2D) => {
    const src = srcDataRef.current
    const { w, h } = workRef.current
    if (!src || !w) return

    // 1. background
    paintBackground(ctx, w, h, background, preset)

    // 2. fills (colour zones + hatches), under the ink
    for (const f of fills) {
      const layer = document.createElement('canvas')
      layer.width = w; layer.height = h
      const lctx = layer.getContext('2d')!
      if (f.kind === 'hatch' && f.hatchId) {
        const pat = makeHatchPattern(lctx, f.hatchId, { scale: f.hatchScale, color: f.hatchColor, lineWidth: 1.2 })
        // faint wash so the hatch reads as a filled material
        lctx.fillStyle = hexA(f.hatchColor || '#333', 0.06)
        lctx.fillRect(0, 0, w, h)
        if (pat) { lctx.fillStyle = pat; lctx.fillRect(0, 0, w, h) }
      } else {
        lctx.fillStyle = hexA(f.color, f.alpha)
        lctx.fillRect(0, 0, w, h)
      }
      lctx.globalCompositeOperation = 'destination-in'
      lctx.drawImage(f.maskCanvas, 0, 0)
      ctx.drawImage(layer, 0, 0)
    }

    // 3. ink (linework) on top
    const adjusted = applyAdjustments(src, adjustments)
    const ink = computeInk(adjusted, line)
    const inkCanvas = document.createElement('canvas')
    inkCanvas.width = w; inkCanvas.height = h
    inkCanvas.getContext('2d')!.putImageData(ink, 0, 0)
    ctx.drawImage(inkCanvas, 0, 0)

    // 4. labels
    if (showLabels) {
      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const f of fills) {
        if (!f.label) continue
        const fontPx = Math.max(11, Math.round(w / 60))
        ctx.font = `600 ${fontPx}px Inter, system-ui, sans-serif`
        const tw = ctx.measureText(f.label).width
        ctx.fillStyle = 'rgba(255,255,255,0.82)'
        ctx.fillRect(f.cx - tw / 2 - 5, f.cy - fontPx / 2 - 3, tw + 10, fontPx + 6)
        ctx.fillStyle = '#222'
        ctx.fillText(f.label, f.cx, f.cy)
      }
      ctx.restore()
    }

    // 5. paper grain
    if (preset?.paperGrain) paintGrain(ctx, w, h)
  }, [fills, adjustments, line, background, preset, showLabels])

  const scheduleRender = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current
      const { w, h } = workRef.current
      if (!canvas || !w) return
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')!
      renderComposite(ctx)
    })
  }, [renderComposite])

  useEffect(() => {
    if (step === 'edit') scheduleRender()
  }, [step, scheduleRender])

  // ---------------- Canvas click (hatch / zone) ----------------
  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'none') return
    const src = srcDataRef.current
    const canvas = canvasRef.current
    const { w, h } = workRef.current
    if (!src || !canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * w)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * h)
    if (x < 0 || y < 0 || x >= w || y >= h) return

    setBusy('Filling region…')
    // defer so the busy indicator paints
    window.setTimeout(() => {
      const adjusted = applyAdjustments(src, adjustments)
      const res = floodFillRegion(adjusted, x, y, line.threshold, tolerance)
      if (res.count < 12) {
        setBusy('')
        flash('info', 'No clear region there — click inside an enclosed area, or raise tolerance.')
        return
      }
      const maskCanvas = maskToCanvas(res.mask, w, h)
      let fill: Fill
      if (tool === 'hatch') {
        fill = {
          id: crypto.randomUUID(), kind: 'hatch', color: hatchColor, alpha: 1,
          hatchId, hatchScale, hatchColor, mask: res.mask, maskCanvas, cx: res.cx, cy: res.cy,
        }
      } else {
        const rt = getRoomType(roomTypeId)
        const color = zoneColor || rt?.color || '#CCCCCC'
        fill = {
          id: crypto.randomUUID(), kind: 'color', color, alpha: 0.55,
          mask: res.mask, maskCanvas, cx: res.cx, cy: res.cy, label: rt?.name,
        }
      }
      setFills(prev => [...prev, fill])
      setBusy('')
    }, 20)
  }

  const undoFill = () => setFills(prev => prev.slice(0, -1))
  const clearFills = () => setFills([])
  const resetAll = () => {
    setAdjustments(defaultAdjustments())
    setLine(defaultLine())
    setFills([])
    const first = STYLE_PRESETS[drawingType]?.[0]
    if (first) applyPreset(first)
  }

  // ---------------- Export ----------------
  const buildExportCanvas = (mult: number): HTMLCanvasElement => {
    const { w, h } = workRef.current
    const out = document.createElement('canvas')
    out.width = Math.round(w * mult)
    out.height = Math.round(h * mult)
    const octx = out.getContext('2d')!
    octx.imageSmoothingEnabled = true
    octx.imageSmoothingQuality = 'high'
    octx.scale(mult, mult)
    renderComposite(octx)
    return out
  }

  const download = (canvas: HTMLCanvasElement, suffix: string) => {
    canvas.toBlob((blob) => {
      if (!blob) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${(fileName || 'drawing').replace(/\.[^.]+$/, '')}_${suffix}.png`
      a.click()
      URL.revokeObjectURL(a.href)
    }, 'image/png')
  }

  const exportScreen = () => { setBusy('Exporting…'); setTimeout(() => { download(buildExportCanvas(1), 'screen'); setBusy(''); flash('ok', 'Screen-resolution PNG downloaded.') }, 20) }
  const exportPrint = () => { setBusy('Rendering print resolution…'); setTimeout(() => { download(buildExportCanvas(PRINT_MULT), 'print'); setBusy(''); flash('ok', 'High-resolution PNG downloaded.') }, 20) }

  const sendToSheet = () => {
    setBusy('Preparing sheet…')
    setTimeout(async () => {
      const canvas = buildExportCanvas(PRINT_MULT)
      const dataUrl = canvas.toDataURL('image/png')
      stashSheetImage(dataUrl, `${(fileName || 'drawing').replace(/\.[^.]+$/, '')} (processed)`, canvas.height / canvas.width, 'Drawing Processor')
      const id = await createSheetProject()
      setBusy('')
      router.push(id ? `/dashboard/project/${id}/sheet-set` : '/dashboard/sheets')
    }, 20)
  }

  const saveToLibrary = async () => {
    setBusy('Saving to library…')
    try {
      const canvas = buildExportCanvas(PRINT_MULT)
      const blob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/png'))
      if (!blob) throw new Error('Could not render image')
      const file = new File([blob], `${(fileName || 'drawing').replace(/\.[^.]+$/, '')}_processed.png`, { type: 'image/png' })
      // find or create a holding project
      let projectId: string
      const { items } = await libraryApi.listProjects()
      const existing = items.find(p => p.name === 'Processed Drawings')
      projectId = existing ? existing.id : (await libraryApi.createProject({ name: 'Processed Drawings', typology: 'Drawings' })).id
      await libraryApi.uploadAssets(projectId, [file])
      setBusy('')
      flash('ok', 'Saved to your Library → “Processed Drawings”.')
    } catch (e: any) {
      setBusy('')
      const msg = e?.response?.status === 403
        ? 'Library is a premium feature — downloading the PNG instead.'
        : 'Could not reach the Library — downloading the PNG instead.'
      flash('info', msg, 5000)
      download(buildExportCanvas(PRINT_MULT), 'processed')
    }
  }

  // ---------------- UI ----------------
  if (step === 'upload') {
    return (
      <div className="min-h-screen bg-bg-primary dark:bg-dark-bg-primary">
        <Header />
        <main className="container-centered py-10 max-w-4xl">
          <h1 className="text-3xl font-bold text-charcoal mb-1">Drawing Processor</h1>
          <p className="text-stone-light mb-8">Apply architecture styles, hatches and colour zones to your CAD exports — no Photoshop needed.</p>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate mb-3">1. What are you processing?</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {DRAWING_TYPES.map(t => (
                <button key={t.id} onClick={() => setDrawingType(t.id)}
                  className={`p-4 rounded-xl border-2 text-left transition ${drawingType === t.id ? 'border-[#D4AF37] bg-[#FBE7A1]/25' : 'border-gray-200 hover:border-[#D4AF37]/50 bg-white'}`}>
                  <div className="text-2xl mb-1">{t.icon}</div>
                  <div className="font-semibold text-sm text-gray-900">{t.name}</div>
                </button>
              ))}
            </div>
          </div>

          <label className="block text-sm font-semibold text-slate mb-3">2. Upload your drawing</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault() }}
            onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]) }}
            className="border-2 border-dashed border-[#D4AF37]/40 rounded-2xl p-14 text-center cursor-pointer hover:border-[#D4AF37] hover:bg-[#FBE7A1]/10 transition bg-white"
          >
            <div className="text-5xl mb-3">📤</div>
            <p className="font-semibold text-gray-700">Drop your drawing here or click to browse</p>
            <p className="text-sm text-gray-400 mt-1">PNG, JPG, WEBP · high-contrast exports work best</p>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>

          {notice && <NoticeBar notice={notice} />}
        </main>
      </div>
    )
  }

  const presets = STYLE_PRESETS[drawingType] || []
  const typeName = DRAWING_TYPES.find(t => t.id === drawingType)?.name

  return (
    <div className="min-h-screen bg-bg-primary dark:bg-dark-bg-primary flex flex-col">
      <Header />
      {notice && <div className="container-centered pt-3"><NoticeBar notice={notice} /></div>}

      <div className="flex-1 flex flex-col lg:flex-row gap-4 container-centered py-4">
        {/* Controls */}
        <aside className="lg:w-[340px] shrink-0 space-y-4 lg:max-h-[calc(100vh-130px)] lg:overflow-y-auto pr-1">
          <Section title={`Style — ${typeName}`}>
            <div className="grid grid-cols-1 gap-2">
              {presets.map(p => (
                <button key={p.id} onClick={() => applyPreset(p)}
                  className={`text-left px-3 py-2 rounded-lg border-2 transition ${presetId === p.id ? 'border-[#D4AF37] bg-[#FBE7A1]/25' : 'border-gray-200 hover:border-[#D4AF37]/50 bg-white'}`}>
                  <div className="font-semibold text-sm text-gray-900">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.desc}</div>
                </button>
              ))}
            </div>
            <div className="mt-3">
              <label className="text-xs font-medium text-gray-600">Background</label>
              <div className="flex gap-1.5 mt-1 flex-wrap">
                {(['white', 'paper', 'sky', 'dark', 'transparent'] as Background[]).map(b => (
                  <button key={b} onClick={() => setBackground(b)}
                    className={`px-2.5 py-1 rounded-md text-xs capitalize border ${background === b ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-white text-gray-600 border-gray-200'}`}>{b}</button>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Tone & Colour">
            <Slider label="Brightness" min={-100} max={100} value={adjustments.brightness} onChange={v => setAdjustments(a => ({ ...a, brightness: v }))} />
            <Slider label="Contrast" min={-100} max={100} value={adjustments.contrast} onChange={v => setAdjustments(a => ({ ...a, contrast: v }))} />
            <Slider label="Warm / Cool" min={-100} max={100} value={adjustments.tone} onChange={v => setAdjustments(a => ({ ...a, tone: v }))} />
            <label className="flex items-center gap-2 mt-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={adjustments.invert} onChange={e => setAdjustments(a => ({ ...a, invert: e.target.checked }))} />
              Invert (white-on-black drawings)
            </label>
          </Section>

          <Section title="Line Weight">
            <Slider label="Overall weight" min={0} max={4} step={1} value={line.weight} onChange={v => setLine(l => ({ ...l, weight: v }))} />
            <Slider label="Wall lines" min={0} max={150} value={Math.round(line.wall * 100)} onChange={v => setLine(l => ({ ...l, wall: v / 100 }))} />
            <Slider label="Annotation lines" min={0} max={150} value={Math.round(line.annotation * 100)} onChange={v => setLine(l => ({ ...l, annotation: v / 100 }))} />
            <Slider label="Dimension lines" min={0} max={150} value={Math.round(line.dimension * 100)} onChange={v => setLine(l => ({ ...l, dimension: v / 100 }))} />
            <Slider label="Ink threshold" min={60} max={220} value={line.threshold} onChange={v => setLine(l => ({ ...l, threshold: v }))} />
            <div className="flex items-center gap-2 mt-2">
              <label className="text-xs text-gray-600">Ink colour</label>
              <input type="color" value={line.color} onChange={e => setLine(l => ({ ...l, color: e.target.value }))} className="w-8 h-7 rounded border" />
            </div>
          </Section>

          {drawingType === 'floor-plan' && (
            <Section title="Colour Zone Tool">
              <ToolToggle active={tool === 'zone'} onClick={() => setTool(tool === 'zone' ? 'none' : 'zone')}
                label="Click rooms to colour" />
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {ROOM_TYPES.map(rt => (
                  <button key={rt.id} onClick={() => { setRoomTypeId(rt.id); setZoneColor(null); setTool('zone') }}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs border ${roomTypeId === rt.id ? 'border-[#D4AF37]' : 'border-gray-200'}`}>
                    <span className="w-3.5 h-3.5 rounded-sm border" style={{ background: rt.color }} />
                    {rt.name}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <label className="text-xs text-gray-600">Override colour</label>
                <input type="color" value={zoneColor || getRoomType(roomTypeId)?.color || '#cccccc'} onChange={e => setZoneColor(e.target.value)} className="w-8 h-7 rounded border" />
              </div>
              <label className="flex items-center gap-2 mt-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} />
                Show room labels
              </label>
            </Section>
          )}

          <Section title="Hatch & Material">
            <ToolToggle active={tool === 'hatch'} onClick={() => setTool(tool === 'hatch' ? 'none' : 'hatch')}
              label="Click areas to apply hatch" />
            <div className="flex gap-1 mt-2 flex-wrap">
              {HATCH_CATEGORIES.map(c => (
                <button key={c} onClick={() => setHatchCat(c)}
                  className={`px-2 py-1 rounded text-xs ${hatchCat === c ? 'bg-[#D4AF37] text-white' : 'bg-gray-100 text-gray-600'}`}>{c}</button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              {HATCHES.filter(h => h.category === hatchCat).map(h => (
                <button key={h.id} onClick={() => { setHatchId(h.id); setTool('hatch') }}
                  title={h.name}
                  className={`rounded-md border-2 overflow-hidden ${hatchId === h.id ? 'border-[#D4AF37]' : 'border-gray-200'}`}>
                  <HatchSwatch hatchId={h.id} color={hatchColor} />
                  <div className="text-[9px] text-gray-600 px-1 py-0.5 leading-tight truncate">{h.name}</div>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 mt-2">
              <div className="flex gap-1">
                {(['small', 'medium', 'large'] as HatchScale[]).map(s => (
                  <button key={s} onClick={() => setHatchScale(s)}
                    className={`px-2 py-1 rounded text-xs capitalize border ${hatchScale === s ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-white text-gray-600 border-gray-200'}`}>{s[0].toUpperCase()}</button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-gray-600">Colour</label>
                <input type="color" value={hatchColor} onChange={e => setHatchColor(e.target.value)} className="w-8 h-7 rounded border" />
              </div>
            </div>
          </Section>

          <Section title="Region tolerance">
            <Slider label="Fill tolerance" min={10} max={90} value={tolerance} onChange={setTolerance} />
            <p className="text-[11px] text-gray-400">Higher = fills across softer edges. Lower = stops at faint lines.</p>
          </Section>
        </aside>

        {/* Canvas */}
        <section className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <button onClick={undoFill} disabled={!fills.length} className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50">↶ Undo fill</button>
            <button onClick={clearFills} disabled={!fills.length} className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50">Clear fills ({fills.length})</button>
            <button onClick={resetAll} className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white hover:bg-gray-50">Reset</button>
            <button onClick={() => { setStep('upload'); setFills([]) }} className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white hover:bg-gray-50">↻ New drawing</button>
            <div className="flex-1" />
            {tool !== 'none' && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#FBE7A1]/50 text-[#9C7416]">
                {tool === 'hatch' ? '🖱️ Click an area to apply hatch' : '🖱️ Click a room to colour'}
              </span>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-[repeating-conic-gradient(#f3f3f3_0%_25%,#fff_0%_50%)] bg-[length:24px_24px] p-3 flex items-center justify-center min-h-[320px] overflow-auto">
            <canvas
              ref={canvasRef}
              onClick={onCanvasClick}
              className="max-w-full h-auto shadow-md"
              style={{ cursor: tool === 'none' ? 'default' : 'crosshair', maxHeight: '70vh' }}
            />
          </div>

          {/* Export */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={exportScreen} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50">🖼️ PNG (screen)</button>
            <button onClick={exportPrint} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50">🖨️ PNG (high-res)</button>
            <button onClick={saveToLibrary} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-br from-[#D4AF37] to-[#9C7416] hover:brightness-105">💾 Save to Library</button>
            <button onClick={sendToSheet} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700">📐 Send to Sheet</button>
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

// ============ Background / texture painters ============
function paintBackground(ctx: CanvasRenderingContext2D, w: number, h: number, bg: Background, preset: StylePreset | null) {
  if (bg === 'transparent') { ctx.clearRect(0, 0, w, h) } else if (bg === 'white') {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h)
  } else if (bg === 'paper') {
    ctx.fillStyle = '#f6f1e6'; ctx.fillRect(0, 0, w, h)
  } else if (bg === 'dark') {
    ctx.fillStyle = '#1d1d1f'; ctx.fillRect(0, 0, w, h)
  } else if (bg === 'sky') {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#cfe0ef'); g.addColorStop(0.55, '#eef4f8'); g.addColorStop(1, '#ffffff')
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
  }
  // ground band / shadow / hatch
  if (preset?.shadow) {
    const g = ctx.createLinearGradient(0, h * 0.74, 0, h)
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.16)')
    ctx.fillStyle = g; ctx.fillRect(0, h * 0.74, w, h * 0.26)
  }
  if (preset?.groundHatch) {
    const bandTop = h * 0.84
    const pat = makeHatchPattern(ctx, preset.groundHatch, { scale: 'medium', color: '#6b6357', lineWidth: 1.1 })
    if (pat) { ctx.fillStyle = pat; ctx.fillRect(0, bandTop, w, h - bandTop) }
    ctx.strokeStyle = 'rgba(40,40,40,0.5)'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(0, bandTop); ctx.lineTo(w, bandTop); ctx.stroke()
  }
}

function paintGrain(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save()
  ctx.globalAlpha = 0.05
  for (let i = 0; i < (w * h) / 900; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#806a3a'
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1)
  }
  ctx.restore()
}

function hexA(hex: string, a: number): string {
  const m = hex.replace('#', '')
  const f = m.length === 3 ? m.split('').map(c => c + c).join('') : m
  const r = parseInt(f.slice(0, 2), 16), g = parseInt(f.slice(2, 4), 16), b = parseInt(f.slice(4, 6), 16)
  return `rgba(${r || 0},${g || 0},${b || 0},${a})`
}

// ============ Small UI helpers ============
function Header() {
  return (
    <header className="glass-nav shadow-elevation-1 sticky top-0 z-40">
      <div className="container-centered py-4 flex items-center gap-3">
        <Link href="/dashboard" className="text-stone-light hover:text-slate text-sm">← Dashboard</Link>
        <span className="text-gray-200">|</span>
        <Logo size="sm" variant="gold" />
        <span className="font-semibold text-charcoal">Drawing Processor</span>
        <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-[#FBE7A1]/50 text-[#9C7416] font-medium">Beta</span>
      </div>
    </header>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3.5">
      <h3 className="text-sm font-bold text-gray-900 mb-2.5">{title}</h3>
      {children}
    </div>
  )
}

function Slider({ label, min, max, value, step = 1, onChange }: { label: string; min: number; max: number; value: number; step?: number; onChange: (v: number) => void }) {
  return (
    <div className="mb-2.5">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span><span className="tabular-nums text-gray-400">{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-[#D4AF37]" />
    </div>
  )
}

function ToolToggle({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className={`w-full px-3 py-2 rounded-lg text-sm font-medium border-2 transition ${active ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#D4AF37]/50'}`}>
      {active ? '● ' : ''}{label}
    </button>
  )
}

function HatchSwatch({ hatchId, color }: { hatchId: string; color: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height)
    const pat = makeHatchPattern(ctx, hatchId, { scale: 'small', color, lineWidth: 1 })
    if (pat) { ctx.fillStyle = pat; ctx.fillRect(0, 0, c.width, c.height) }
  }, [hatchId, color])
  return <canvas ref={ref} width={54} height={30} className="w-full h-7 block" />
}

function NoticeBar({ notice }: { notice: { kind: 'ok' | 'err' | 'info'; msg: string } }) {
  const styles = {
    ok: 'bg-green-50 border-green-200 text-green-700',
    err: 'bg-red-50 border-red-200 text-red-700',
    info: 'bg-[#FBE7A1]/30 border-[#D4AF37]/40 text-[#9C7416]',
  }[notice.kind]
  return <div className={`border rounded-lg px-4 py-2.5 text-sm ${styles}`}>{notice.msg}</div>
}
