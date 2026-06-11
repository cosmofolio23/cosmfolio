'use client'

/**
 * MapAnnotator — shared editor for map-based site-analysis diagrams.
 * Upload a map image, then draw polygons / arrows / markers / circles / labels
 * depending on the diagram mode. Output is a flattened PNG dataURL.
 */

import { useMemo, useRef, useState } from 'react'
import { LAND_USE_TYPES, ACCESS_TYPES, NOISE_LEVELS } from '@/lib/siteAnalysis/generators'
import { NORTH_ARROWS, northArrowSVG } from '@/lib/graphics/northArrows'

export type MapMode = 'location' | 'landuse' | 'noise' | 'access' | 'green' | 'topo'

const VW = 880, VH = 620

type Shape =
  | { kind: 'poly'; pts: Array<[number, number]>; color: string; typeName?: string }
  | { kind: 'arrow'; x1: number; y1: number; x2: number; y2: number; typeId: string }
  | { kind: 'marker'; x: number; y: number; level: string }
  | { kind: 'circle'; cx: number; cy: number; r: number; label: string }
  | { kind: 'label'; x: number; y: number; text: string }

export interface MapResult {
  dataUrl: string
  greenPct?: number
}

export default function MapAnnotator({ mode, onDone, onCancel }: {
  mode: MapMode
  onDone: (r: MapResult) => void
  onCancel: () => void
}) {
  const [bg, setBg] = useState<string | null>(null)
  const [shapes, setShapes] = useState<Shape[]>([])
  const [drawPts, setDrawPts] = useState<Array<[number, number]>>([])
  const [tool, setTool] = useState<'poly' | 'arrow' | 'marker' | 'circle' | 'label' | 'none'>(
    mode === 'topo' ? 'none' : mode === 'access' ? 'arrow' : mode === 'noise' ? 'marker' : 'poly')
  const [landUse, setLandUse] = useState(LAND_USE_TYPES[0])
  const [accessType, setAccessType] = useState(ACCESS_TYPES[0])
  const [noiseLevel, setNoiseLevel] = useState(NOISE_LEVELS[0])
  const [arrowStart, setArrowStart] = useState<[number, number] | null>(null)
  const [labelDraft, setLabelDraft] = useState<{ x: number; y: number } | null>(null)
  const [labelText, setLabelText] = useState('')
  const [mapWidthM, setMapWidthM] = useState(2000)
  const [topoStrength, setTopoStrength] = useState(70)
  const [busy, setBusy] = useState(false)

  const svgRef = useRef<SVGSVGElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const needsBg = mode !== 'landuse' && mode !== 'noise'

  const toCoords = (e: React.MouseEvent): [number, number] => {
    const rect = svgRef.current!.getBoundingClientRect()
    return [((e.clientX - rect.left) / rect.width) * VW, ((e.clientY - rect.top) / rect.height) * VH]
  }

  const onCanvasClick = (e: React.MouseEvent) => {
    if (tool === 'none') return
    const [x, y] = toCoords(e)
    if (tool === 'poly') setDrawPts(prev => [...prev, [x, y]])
    else if (tool === 'marker') setShapes(prev => [...prev, { kind: 'marker', x, y, level: noiseLevel.id }])
    else if (tool === 'circle') {
      const radii = [VW * (500 / mapWidthM), VW * (1000 / mapWidthM), VW * (2000 / mapWidthM)]
      const labels = ['500m', '1km', '2km']
      setShapes(prev => [...prev,
        ...radii.map((r, i) => ({ kind: 'circle', cx: x, cy: y, r, label: labels[i] } as Shape))])
      setTool('none')
    } else if (tool === 'arrow') {
      if (!arrowStart) setArrowStart([x, y])
      else {
        setShapes(prev => [...prev, { kind: 'arrow', x1: arrowStart[0], y1: arrowStart[1], x2: x, y2: y, typeId: accessType.id }])
        setArrowStart(null)
      }
    } else if (tool === 'label') {
      setLabelDraft({ x, y })
      setLabelText('')
    }
  }

  const closePoly = () => {
    if (drawPts.length >= 3) {
      const color = mode === 'green' ? '#3E9B4F' : mode === 'location' ? '#D03B3B' : landUse.color
      setShapes(prev => [...prev, { kind: 'poly', pts: drawPts, color, typeName: mode === 'landuse' ? landUse.name : undefined }])
    }
    setDrawPts([])
  }

  const undo = () => {
    if (drawPts.length) setDrawPts(p => p.slice(0, -1))
    else setShapes(s => s.slice(0, -1))
  }

  const greenPct = useMemo(() => {
    if (mode !== 'green') return undefined
    let area = 0
    for (const s of shapes) {
      if (s.kind !== 'poly') continue
      let a = 0
      for (let i = 0; i < s.pts.length; i++) {
        const [x1, y1] = s.pts[i]
        const [x2, y2] = s.pts[(i + 1) % s.pts.length]
        a += x1 * y2 - x2 * y1
      }
      area += Math.abs(a) / 2
    }
    return Math.min(100, Math.round((area / (VW * VH)) * 100))
  }, [shapes, mode])

  const usedLandUses = useMemo(() => {
    const names = new Set<string>()
    shapes.forEach(s => { if (s.kind === 'poly' && s.typeName) names.add(s.typeName) })
    return LAND_USE_TYPES.filter(t => names.has(t.name))
  }, [shapes])

  // ------- topo gradient map -------
  const applyTopo = (src: string, strength: number): Promise<string> => new Promise(res => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.width; c.height = img.height
      const ctx = c.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const d = ctx.getImageData(0, 0, c.width, c.height)
      const px = d.data
      const ramp = (t: number): [number, number, number] => {
        // low (blue) → green → yellow → brown → red (high)
        const stops: Array<[number, [number, number, number]]> = [
          [0, [70, 110, 175]], [0.3, [110, 165, 110]], [0.55, [225, 200, 110]], [0.8, [165, 110, 70]], [1, [185, 60, 50]],
        ]
        for (let i = 1; i < stops.length; i++) {
          if (t <= stops[i][0]) {
            const [t0, c0] = stops[i - 1], [t1, c1] = stops[i]
            const f = (t - t0) / (t1 - t0 || 1)
            return [c0[0] + (c1[0] - c0[0]) * f, c0[1] + (c1[1] - c0[1]) * f, c0[2] + (c1[2] - c0[2]) * f]
          }
        }
        return stops[stops.length - 1][1]
      }
      const k = strength / 100
      for (let i = 0; i < px.length; i += 4) {
        const L = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255
        const [r, g, b] = ramp(1 - L) // darker contours = higher
        px[i] = px[i] * (1 - k) + r * k
        px[i + 1] = px[i + 1] * (1 - k) + g * k
        px[i + 2] = px[i + 2] * (1 - k) + b * k
      }
      ctx.putImageData(d, 0, 0)
      res(c.toDataURL('image/png'))
    }
    img.src = src
  })

  const finish = async () => {
    setBusy(true)
    try {
      let bgFinal = bg
      if (mode === 'topo' && bg) bgFinal = await applyTopo(bg, topoStrength)
      // rasterize: draw bg + serialize overlay svg
      const canvas = document.createElement('canvas')
      canvas.width = VW * 2; canvas.height = VH * 2
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      if (bgFinal) {
        const img = new Image()
        await new Promise<void>(r => { img.onload = () => r(); img.src = bgFinal! })
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      const overlay = svgRef.current!.cloneNode(true) as SVGSVGElement
      overlay.querySelectorAll('[data-ui="1"]').forEach(n => n.remove())
      overlay.querySelector('[data-bg="1"]')?.remove()
      const xml = new XMLSerializer().serializeToString(overlay)
      const oimg = new Image()
      await new Promise<void>((r, j) => { oimg.onload = () => r(); oimg.onerror = () => j(new Error('overlay')); oimg.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}` })
      ctx.drawImage(oimg, 0, 0, canvas.width, canvas.height)
      onDone({ dataUrl: canvas.toDataURL('image/png'), greenPct })
    } catch {
      onCancel()
    }
    setBusy(false)
  }

  const arrowDef = (id: string) => ACCESS_TYPES.find(a => a.id === id) || ACCESS_TYPES[0]
  const noiseDef = (id: string) => NOISE_LEVELS.find(n => n.id === id) || NOISE_LEVELS[0]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-auto p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 capitalize">{mode === 'topo' ? 'Topography' : mode === 'landuse' ? 'Land use' : mode} diagram</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {/* toolbar */}
        <div className="flex items-center gap-2 mb-3 flex-wrap text-xs">
          <button onClick={() => fileRef.current?.click()} className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">🖼️ {bg ? 'Replace map' : 'Upload map image'}{needsBg && !bg ? ' *' : ''}</button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
            const f = e.target.files?.[0]
            if (!f) return
            const r = new FileReader()
            r.onload = () => setBg(String(r.result))
            r.readAsDataURL(f)
          }} />

          {mode === 'landuse' && (
            <>
              <span className="text-gray-400">Zone type:</span>
              {LAND_USE_TYPES.map(t => (
                <button key={t.id} onClick={() => { setLandUse(t); setTool('poly') }}
                  className={`px-2 py-1 rounded border ${landUse.id === t.id ? 'border-gray-900' : 'border-gray-200'}`}
                  style={{ background: `${t.color}55` }}>{t.name}</button>
              ))}
            </>
          )}
          {mode === 'access' && (
            <>
              <span className="text-gray-400">Route:</span>
              {ACCESS_TYPES.map(t => (
                <button key={t.id} onClick={() => { setAccessType(t); setTool('arrow') }}
                  className={`px-2 py-1 rounded border ${accessType.id === t.id ? 'border-gray-900' : 'border-gray-200'}`}
                  style={{ color: t.color }}>{t.name}</button>
              ))}
            </>
          )}
          {mode === 'noise' && (
            <>
              <span className="text-gray-400">Noise level:</span>
              {NOISE_LEVELS.map(t => (
                <button key={t.id} onClick={() => { setNoiseLevel(t); setTool('marker') }}
                  className={`px-2 py-1 rounded border ${noiseLevel.id === t.id ? 'border-gray-900' : 'border-gray-200'}`}
                  style={{ color: t.color }}>{t.name}</button>
              ))}
            </>
          )}
          {mode === 'location' && (
            <>
              <button onClick={() => setTool('poly')} className={`px-2 py-1 rounded border ${tool === 'poly' ? 'border-gray-900 bg-gray-100' : 'border-gray-200'}`}>▱ Site boundary</button>
              <button onClick={() => setTool('circle')} className={`px-2 py-1 rounded border ${tool === 'circle' ? 'border-gray-900 bg-gray-100' : 'border-gray-200'}`}>◎ Radius circles</button>
              <span className="flex items-center gap-1 text-gray-500">Map width
                <input type="number" value={mapWidthM} onChange={e => setMapWidthM(Math.max(100, Number(e.target.value) || 2000))} className="w-16 border rounded px-1 py-0.5" />m
              </span>
            </>
          )}
          {mode === 'green' && <button onClick={() => setTool('poly')} className={`px-2 py-1 rounded border ${tool === 'poly' ? 'border-gray-900 bg-gray-100' : 'border-gray-200'}`}>▱ Paint green zone</button>}
          {mode === 'topo' && (
            <span className="flex items-center gap-2 text-gray-600">Colour-grade strength
              <input type="range" min={0} max={100} value={topoStrength} onChange={e => setTopoStrength(Number(e.target.value))} className="accent-[#D4AF37]" />
              {topoStrength}%
            </span>
          )}
          {mode !== 'topo' && <button onClick={() => setTool('label')} className={`px-2 py-1 rounded border ${tool === 'label' ? 'border-gray-900 bg-gray-100' : 'border-gray-200'}`}>T Label</button>}

          {tool === 'poly' && drawPts.length > 0 && <button onClick={closePoly} className="px-2 py-1 rounded bg-[#D4AF37] text-white">✓ Close shape ({drawPts.length})</button>}
          <button onClick={undo} className="px-2 py-1 rounded border border-gray-200">↶ Undo</button>
          {mode === 'green' && greenPct !== undefined && <span className="font-semibold text-green-700">Green cover ≈ {greenPct}%</span>}
        </div>

        <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} className="w-full border border-gray-200 rounded-lg bg-gray-50"
          style={{ cursor: tool === 'none' ? 'default' : 'crosshair' }} onClick={onCanvasClick}>
          {bg && <image data-bg="1" href={bg} x="0" y="0" width={VW} height={VH} preserveAspectRatio="xMidYMid slice" />}
          <defs>
            {ACCESS_TYPES.map(t => (
              <marker key={t.id} id={`arr-${t.id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 Z" fill={t.color} />
              </marker>
            ))}
          </defs>

          {shapes.map((s, i) => {
            if (s.kind === 'poly') {
              return <g key={i}>
                <polygon points={s.pts.map(p => p.join(',')).join(' ')} fill={s.color} fillOpacity={mode === 'location' ? 0.12 : 0.45} stroke={s.color} strokeWidth={mode === 'location' ? 3 : 1.5} strokeDasharray={mode === 'location' ? '10 6' : undefined} />
                {s.typeName && <text x={s.pts.reduce((a, p) => a + p[0], 0) / s.pts.length} y={s.pts.reduce((a, p) => a + p[1], 0) / s.pts.length} fontSize="12" fontWeight="600" textAnchor="middle" fill="#333" fontFamily="Inter,sans-serif">{s.typeName}</text>}
              </g>
            }
            if (s.kind === 'arrow') {
              const t = arrowDef(s.typeId)
              return <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={t.color} strokeWidth={4.5} strokeDasharray={t.dash || undefined} markerEnd={`url(#arr-${t.id})`} strokeLinecap="round" />
            }
            if (s.kind === 'marker') {
              const n = noiseDef(s.level)
              const r = s.level === 'high' ? 90 : s.level === 'medium' ? 60 : 38
              return <g key={i}>
                <circle cx={s.x} cy={s.y} r={r} fill={n.color} opacity={0.22} />
                <circle cx={s.x} cy={s.y} r={r * 0.55} fill={n.color} opacity={0.3} />
                <circle cx={s.x} cy={s.y} r={9} fill={n.color} />
              </g>
            }
            if (s.kind === 'circle') {
              return <g key={i}>
                <circle cx={s.cx} cy={s.cy} r={s.r} fill="none" stroke="#333" strokeWidth={1.8} strokeDasharray="8 6" />
                <text x={s.cx + s.r * 0.71} y={s.cy - s.r * 0.71} fontSize="12" fontWeight="600" fill="#333" fontFamily="Inter,sans-serif">{s.label}</text>
              </g>
            }
            return <text key={i} x={s.x} y={s.y} fontSize="14" fontWeight="600" fill="#222" fontFamily="Inter,sans-serif">{s.text}</text>
          })}

          {/* in-progress poly */}
          {drawPts.length > 0 && (
            <g data-ui="1">
              <polyline points={drawPts.map(p => p.join(',')).join(' ')} fill="none" stroke="#D4AF37" strokeWidth={2.5} strokeDasharray="6 4" />
              {drawPts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={4.5} fill="#D4AF37" />)}
            </g>
          )}
          {arrowStart && <circle data-ui="1" cx={arrowStart[0]} cy={arrowStart[1]} r={6} fill={accessType.color} />}

          {/* legends (exported) */}
          {mode === 'landuse' && usedLandUses.length > 0 && (
            <g>
              <rect x={12} y={VH - 18 - usedLandUses.length * 20} width={170} height={usedLandUses.length * 20 + 10} fill="#ffffff" opacity={0.9} rx={6} />
              {usedLandUses.map((t, i) => (
                <g key={t.id}>
                  <rect x={20} y={VH - 14 - (usedLandUses.length - i) * 20} width={13} height={13} fill={t.color} opacity={0.7} />
                  <text x={40} y={VH - 3 - (usedLandUses.length - i) * 20} fontSize="11" fill="#333" fontFamily="Inter,sans-serif">{t.name}</text>
                </g>
              ))}
            </g>
          )}
          {mode === 'noise' && (
            <g>
              <rect x={12} y={VH - 80} width={120} height={70} fill="#ffffff" opacity={0.9} rx={6} />
              {NOISE_LEVELS.map((n, i) => (
                <g key={n.id}>
                  <circle cx={28} cy={VH - 64 + i * 21} r={7} fill={n.color} opacity={0.7} />
                  <text x={44} y={VH - 60 + i * 21} fontSize="11" fill="#333" fontFamily="Inter,sans-serif">{n.name}</text>
                </g>
              ))}
            </g>
          )}
          {mode === 'access' && (
            <g>
              <rect x={12} y={VH - 18 - ACCESS_TYPES.length * 20} width={170} height={ACCESS_TYPES.length * 20 + 10} fill="#ffffff" opacity={0.9} rx={6} />
              {ACCESS_TYPES.map((t, i) => (
                <g key={t.id}>
                  <line x1={20} y1={VH - 8 - (ACCESS_TYPES.length - i) * 20} x2={48} y2={VH - 8 - (ACCESS_TYPES.length - i) * 20} stroke={t.color} strokeWidth={3.5} strokeDasharray={t.dash || undefined} />
                  <text x={56} y={VH - 4 - (ACCESS_TYPES.length - i) * 20} fontSize="11" fill="#333" fontFamily="Inter,sans-serif">{t.name}</text>
                </g>
              ))}
            </g>
          )}
          {mode === 'green' && greenPct !== undefined && (
            <g>
              <rect x={12} y={VH - 44} width={190} height={32} fill="#ffffff" opacity={0.92} rx={6} />
              <text x={24} y={VH - 23} fontSize="14" fontWeight="700" fill="#2E7D32" fontFamily="Inter,sans-serif">Green cover ≈ {greenPct}%</text>
            </g>
          )}
          {mode === 'location' && (
            <g transform={`translate(${VW - 70} 16) scale(0.55)`} dangerouslySetInnerHTML={{ __html: NORTH_ARROWS[0].body('#222222') }} />
          )}
        </svg>

        {/* label input */}
        {labelDraft && (
          <div className="mt-2 flex gap-2 items-center">
            <input autoFocus value={labelText} onChange={e => setLabelText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && labelText.trim()) { setShapes(prev => [...prev, { kind: 'label', x: labelDraft.x, y: labelDraft.y, text: labelText.trim() }]); setLabelDraft(null) } }}
              placeholder="Label text — Enter to place" className="border rounded-lg px-3 py-1.5 text-sm flex-1" />
            <button onClick={() => setLabelDraft(null)} className="text-xs text-gray-400">cancel</button>
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm border border-gray-200">Cancel</button>
          <button onClick={finish} disabled={busy || (needsBg && !bg)}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-br from-[#D4AF37] to-[#9C7416] disabled:opacity-40">
            {busy ? 'Rendering…' : '✓ Use diagram'}
          </button>
        </div>
      </div>
    </div>
  )
}
