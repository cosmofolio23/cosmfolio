'use client'

/**
 * Concept Diagram Builder — bubble diagrams, zoning overlays, circulation,
 * Kevin Lynch site-concept elements and auto-generated program charts.
 * Pure SVG editor with undo/redo, grid snap, zoom and PNG/SVG export.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import { downloadBlob, saveImageToLibrary, svgToPngBlob } from '@/lib/saveToLibrary'
import { stashSheetImage, aspectOfDataUrl, createSheetProject } from '@/lib/sheetHandoff'

const VW = 1400, VH = 1000

const ZONES = [
  { id: 'public', name: 'Public', color: '#F0A93B' },
  { id: 'semi', name: 'Semi-private', color: '#E8CB7A' },
  { id: 'private', name: 'Private', color: '#6B9AC4' },
  { id: 'service', name: 'Service', color: '#A9A9A9' },
  { id: 'circulation', name: 'Circulation', color: '#D8CFC0' },
  { id: 'green', name: 'Green', color: '#7FBE7B' },
]

const CIRC_TYPES = [
  { id: 'primary', name: 'Primary', color: '#C84B31', width: 7, dash: '' },
  { id: 'secondary', name: 'Secondary', color: '#E8A14E', width: 4.5, dash: '' },
  { id: 'emergency', name: 'Emergency', color: '#D03B3B', width: 4, dash: '14 6 3 6' },
  { id: 'service', name: 'Service', color: '#7A7A7A', width: 4, dash: '10 7' },
]

const CONN_KINDS = [
  { id: 'strong', name: 'Strong ━', },
  { id: 'weak', name: 'Weak ┅' },
  { id: 'barrier', name: 'Barrier ═' },
  { id: 'movement', name: 'Movement →' },
] as const

type ConnKind = typeof CONN_KINDS[number]['id']

interface El {
  id: string
  type: 'bubble' | 'rect' | 'poly' | 'free' | 'arrow' | 'conn' | 'text' | 'image' | 'star'
  x: number; y: number
  rx: number; ry: number
  w: number; h: number
  pts: number[][]
  fromId?: string; toId?: string
  connKind?: ConnKind
  label: string
  areaSqm?: number
  fill: string; stroke: string; strokeWidth: number; dash: string
  opacity: number; radius: number; shadow: boolean
  fontSize: number
  src?: string
}

type Tool = 'select' | 'bubble' | 'rect' | 'poly' | 'free' | 'arrow' | 'conn' | 'text' | 'node' | 'landmark' | 'edge' | 'district' | 'circ'

const newEl = (partial: Partial<El>): El => ({
  id: crypto.randomUUID(), type: 'bubble', x: 0, y: 0, rx: 60, ry: 60, w: 120, h: 90, pts: [],
  label: '', fill: '#F0A93B', stroke: '#333333', strokeWidth: 2, dash: '', opacity: 0.85,
  radius: 8, shadow: false, fontSize: 16, ...partial,
})

export default function ConceptDiagramPage() {
  const router = useRouter()
  const [els, setEls] = useState<El[]>([])
  const [selId, setSelId] = useState<string | null>(null)
  const [tool, setTool] = useState<Tool>('select')
  const [zone, setZone] = useState(ZONES[0])
  const [circType, setCircType] = useState(CIRC_TYPES[0])
  const [connKind, setConnKind] = useState<ConnKind>('strong')
  const [connFrom, setConnFrom] = useState<string | null>(null)
  const [drawPts, setDrawPts] = useState<number[][]>([])
  const [freeDrawing, setFreeDrawing] = useState(false)
  const [arrowStart, setArrowStart] = useState<number[] | null>(null)
  const [snap, setSnap] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [history, setHistory] = useState<El[][]>([[]])
  const [histIdx, setHistIdx] = useState(0)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState('')
  const [exporting, setExporting] = useState(false)
  const [showCharts, setShowCharts] = useState(false)
  const [chartRows, setChartRows] = useState<Array<{ name: string; sqm: number; zone: string }>>([
    { name: 'Living', sqm: 40, zone: 'public' }, { name: 'Bedrooms', sqm: 50, zone: 'private' },
    { name: 'Kitchen', sqm: 15, zone: 'service' }, { name: 'Circulation', sqm: 20, zone: 'circulation' },
  ])
  const [chartKind, setChartKind] = useState<'pie' | 'bar' | 'treemap' | 'bubble'>('pie')

  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragRef = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number; mode: 'move' | 'resize' } | null>(null)
  const imgRef = useRef<HTMLInputElement | null>(null)

  const sel = els.find(e => e.id === selId) || null
  const flash = (m: string) => { setNotice(m); setTimeout(() => setNotice(''), 3500) }

  const commit = (next: El[]) => {
    setEls(next)
    const h = history.slice(0, histIdx + 1)
    h.push(JSON.parse(JSON.stringify(next)))
    if (h.length > 60) h.shift()
    setHistory(h)
    setHistIdx(h.length - 1)
  }
  const undo = () => { if (histIdx > 0) { setHistIdx(histIdx - 1); setEls(JSON.parse(JSON.stringify(history[histIdx - 1]))); setSelId(null) } }
  const redo = () => { if (histIdx < history.length - 1) { setHistIdx(histIdx + 1); setEls(JSON.parse(JSON.stringify(history[histIdx + 1]))); setSelId(null) } }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo() }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selId) {
        commit(els.filter(el => el.id !== selId && el.fromId !== selId && el.toId !== selId))
        setSelId(null)
      }
      if (e.key === 'Escape') { setDrawPts([]); setArrowStart(null); setConnFrom(null) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const toC = (e: { clientX: number; clientY: number }): [number, number] => {
    const r = svgRef.current!.getBoundingClientRect()
    let x = ((e.clientX - r.left) / r.width) * VW
    let y = ((e.clientY - r.top) / r.height) * VH
    if (snap) { x = Math.round(x / 20) * 20; y = Math.round(y / 20) * 20 }
    return [x, y]
  }

  // ---------------- canvas interactions ----------------
  const onCanvasDown = (e: React.PointerEvent) => {
    const [x, y] = toC(e)
    if (tool === 'select') { setSelId(null); return }
    if (tool === 'bubble' || tool === 'node') {
      const isNode = tool === 'node'
      commit([...els, newEl({
        type: 'bubble', x, y, rx: isNode ? 26 : 70, ry: isNode ? 26 : 56,
        fill: isNode ? '#ffffff' : zone.color, stroke: '#333333', strokeWidth: isNode ? 4 : 2,
        label: isNode ? 'Node' : zone.name, areaSqm: isNode ? undefined : 50, opacity: isNode ? 1 : 0.85,
      })])
      setTool('select')
    } else if (tool === 'rect') {
      commit([...els, newEl({ type: 'rect', x, y, w: 180, h: 120, fill: zone.color, label: zone.name })])
      setTool('select')
    } else if (tool === 'landmark') {
      commit([...els, newEl({ type: 'star', x, y, rx: 34, ry: 34, fill: '#E8B021', stroke: '#7A5800', label: 'Landmark', opacity: 1 })])
      setTool('select')
    } else if (tool === 'poly' || tool === 'district') {
      setDrawPts(prev => [...prev, [x, y]])
    } else if (tool === 'free' || tool === 'edge') {
      setFreeDrawing(true)
      setDrawPts([[x, y]])
    } else if (tool === 'arrow' || tool === 'circ') {
      if (!arrowStart) setArrowStart([x, y])
      else {
        const ct = tool === 'circ' ? circType : null
        commit([...els, newEl({
          type: 'arrow', pts: [arrowStart, [x, y]],
          stroke: ct ? ct.color : '#333333', strokeWidth: ct ? ct.width : 4, dash: ct ? ct.dash : '',
          fill: 'none', opacity: 1, label: '',
        })])
        setArrowStart(null)
      }
    } else if (tool === 'text') {
      commit([...els, newEl({ type: 'text', x, y, label: 'Double-edit in panel →', fill: '#222222', opacity: 1, fontSize: 20 })])
      setTool('select')
    } else if (tool === 'conn') {
      // handled per-bubble below
      setSelId(null)
    }
  }

  const onCanvasMove = (e: React.PointerEvent) => {
    if (freeDrawing) {
      const [x, y] = toC(e)
      setDrawPts(prev => [...prev, [x, y]])
      return
    }
    const d = dragRef.current
    if (!d) return
    const [x, y] = toC(e)
    setEls(prev => prev.map(el => {
      if (el.id !== d.id) return el
      if (d.mode === 'move') {
        const dx = x - d.sx, dy = y - d.sy
        if (el.type === 'arrow' || el.type === 'poly' || el.type === 'free') {
          return { ...el, pts: el.pts.map(p => [p[0] + dx, p[1] + dy]), x: el.x, y: el.y }
        }
        return { ...el, x: d.ox + dx, y: d.oy + dy }
      }
      // resize from center
      const k = Math.max(0.2, Math.hypot(x - el.x, y - el.y) / Math.max(20, Math.hypot(d.sx - el.x, d.sy - el.y)))
      return { ...el, rx: el.rx * k, ry: el.ry * k, w: el.w * k, h: el.h * k, fontSize: el.fontSize * k }
    }))
    if (d.mode === 'move') { d.sx = x; d.sy = y; const el = els.find(e2 => e2.id === d.id); if (el) { d.ox = el.x; d.oy = el.y } }
  }

  const onCanvasUp = () => {
    if (freeDrawing) {
      setFreeDrawing(false)
      if (drawPts.length > 3) {
        const isEdge = tool === 'edge'
        commit([...els, newEl({
          type: 'free', pts: drawPts, fill: 'none',
          stroke: isEdge ? '#333333' : zone.color, strokeWidth: isEdge ? 7 : 4, dash: isEdge ? '16 10' : '',
          opacity: 1, label: '',
        })])
      }
      setDrawPts([])
    }
    if (dragRef.current) { commit([...els]); dragRef.current = null }
  }

  const closePoly = () => {
    if (drawPts.length >= 3) {
      commit([...els, newEl({
        type: 'poly', pts: drawPts, fill: zone.color, stroke: zone.color,
        strokeWidth: 2, opacity: tool === 'district' ? 0.35 : 0.55, label: zone.name,
      })])
    }
    setDrawPts([])
    setTool('select')
  }

  const onElDown = (e: React.PointerEvent, el: El) => {
    e.stopPropagation()
    if (tool === 'conn' && el.type === 'bubble') {
      if (!connFrom) { setConnFrom(el.id); setSelId(el.id) }
      else if (connFrom !== el.id) {
        commit([...els, newEl({ type: 'conn', fromId: connFrom, toId: el.id, connKind, stroke: '#444444', fill: 'none', opacity: 1, label: '' })])
        setConnFrom(null)
        setTool('select')
      }
      return
    }
    setSelId(el.id)
    const [x, y] = toC(e)
    dragRef.current = { id: el.id, sx: x, sy: y, ox: el.x, oy: el.y, mode: 'move' }
  }

  const onResizeDown = (e: React.PointerEvent, el: El) => {
    e.stopPropagation()
    const [x, y] = toC(e)
    dragRef.current = { id: el.id, sx: x, sy: y, ox: el.x, oy: el.y, mode: 'resize' }
  }

  const update = (id: string, patch: Partial<El>) => {
    const next = els.map(el => {
      if (el.id !== id) return el
      const merged = { ...el, ...patch }
      if (patch.areaSqm !== undefined && el.type === 'bubble') {
        const r = Math.max(22, Math.sqrt(Math.max(1, patch.areaSqm)) * 9)
        merged.rx = r; merged.ry = r * 0.82
      }
      return merged
    })
    commit(next)
  }

  // ---------------- auto-arrange (simple force layout) ----------------
  const autoArrange = () => {
    const bubbles = els.filter(e => e.type === 'bubble')
    if (bubbles.length < 2) return
    const pos: Record<string, [number, number]> = {}
    bubbles.forEach((b, i) => {
      const a = (i / bubbles.length) * Math.PI * 2
      pos[b.id] = [VW / 2 + Math.cos(a) * 240, VH / 2 + Math.sin(a) * 200]
    })
    const conns = els.filter(e => e.type === 'conn')
    for (let it = 0; it < 120; it++) {
      for (const b of bubbles) {
        let fx = (VW / 2 - pos[b.id][0]) * 0.002, fy = (VH / 2 - pos[b.id][1]) * 0.002
        for (const o of bubbles) {
          if (o.id === b.id) continue
          const dx = pos[b.id][0] - pos[o.id][0], dy = pos[b.id][1] - pos[o.id][1]
          const dist = Math.max(30, Math.hypot(dx, dy))
          const min = b.rx + o.rx + 50
          if (dist < min) { fx += (dx / dist) * (min - dist) * 0.06; fy += (dy / dist) * (min - dist) * 0.06 }
        }
        for (const cn of conns) {
          const other = cn.fromId === b.id ? cn.toId : cn.toId === b.id ? cn.fromId : null
          if (!other || !pos[other]) continue
          const dx = pos[other][0] - pos[b.id][0], dy = pos[other][1] - pos[b.id][1]
          fx += dx * 0.004; fy += dy * 0.004
        }
        pos[b.id] = [
          Math.max(b.rx + 20, Math.min(VW - b.rx - 20, pos[b.id][0] + fx * 10)),
          Math.max(b.ry + 20, Math.min(VH - b.ry - 20, pos[b.id][1] + fy * 10)),
        ]
      }
    }
    commit(els.map(e => (e.type === 'bubble' ? { ...e, x: pos[e.id][0], y: pos[e.id][1] } : e)))
    flash('Bubbles auto-arranged.')
  }

  // ---------------- background image ----------------
  const onImage = (f: File) => {
    const r = new FileReader()
    r.onload = () => {
      const src = String(r.result)
      const img = new Image()
      img.onload = () => {
        const s = Math.min(VW / img.width, VH / img.height)
        commit([newEl({
          type: 'image', src, x: VW / 2, y: VH / 2,
          w: img.width * s, h: img.height * s, opacity: 0.35, label: '', fill: 'none',
        }), ...els])
        flash('Background imported (ghosted). Adjust opacity in the panel.')
      }
      img.src = src
    }
    r.readAsDataURL(f)
  }

  // ---------------- program charts ----------------
  const chartSvg = useMemo(() => {
    const rows = chartRows.filter(r => r.name && r.sqm > 0)
    const total = rows.reduce((a, r) => a + r.sqm, 0) || 1
    const col = (z: string) => ZONES.find(zz => zz.id === z)?.color || '#999'
    const W = 480, H = 380
    let s = ''
    if (chartKind === 'pie') {
      let a0 = -Math.PI / 2
      const cx = 190, cy = 180, R = 130
      rows.forEach(r => {
        const a1 = a0 + (r.sqm / total) * Math.PI * 2
        const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0)
        const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1)
        const large = a1 - a0 > Math.PI ? 1 : 0
        s += `<path d="M${cx} ${cy} L${x0} ${y0} A${R} ${R} 0 ${large} 1 ${x1} ${y1} Z" fill="${col(r.zone)}" stroke="#fff" stroke-width="2"/>`
        const mid = (a0 + a1) / 2
        s += `<text x="${cx + (R + 24) * Math.cos(mid)}" y="${cy + (R + 24) * Math.sin(mid)}" font-size="11" text-anchor="middle" fill="#333" font-family="Inter,sans-serif">${r.name} ${Math.round((r.sqm / total) * 100)}%</text>`
        a0 = a1
      })
    } else if (chartKind === 'bar') {
      const max = Math.max(...rows.map(r => r.sqm))
      rows.forEach((r, i) => {
        const y = 40 + i * 42
        const w = (r.sqm / max) * 300
        s += `<rect x="120" y="${y}" width="${w}" height="26" fill="${col(r.zone)}" rx="4"/>`
        s += `<text x="112" y="${y + 18}" font-size="12" text-anchor="end" fill="#333" font-family="Inter,sans-serif">${r.name}</text>`
        s += `<text x="${126 + w}" y="${y + 18}" font-size="11" fill="#666" font-family="Inter,sans-serif">${r.sqm}m²</text>`
      })
    } else if (chartKind === 'treemap') {
      // proportional vertical slices (slice-and-dice treemap)
      const sorted = [...rows].sort((a, b) => b.sqm - a.sqm)
      let cx0 = 20
      sorted.forEach(r => {
        const ww = (W - 40) * (r.sqm / total)
        s += `<rect x="${cx0}" y="30" width="${ww - 3}" height="${H - 90}" fill="${col(r.zone)}" rx="4"/>`
        if (ww > 40) s += `<text x="${cx0 + ww / 2}" y="${H / 2 - 10}" font-size="11" text-anchor="middle" fill="#fff" font-family="Inter,sans-serif">${r.name}</text><text x="${cx0 + ww / 2}" y="${H / 2 + 8}" font-size="10" text-anchor="middle" fill="#fff" font-family="Inter,sans-serif">${r.sqm}m²</text>`
        cx0 += ww
      })
    } else {
      // bubble chart — simple row packing
      let bx = 60, by = 120, rowMax = 0
      rows.forEach(r => {
        const R = Math.max(18, Math.sqrt(r.sqm) * 8)
        if (bx + R * 2 > W - 30) { bx = 60; by += rowMax * 2 + 26; rowMax = 0 }
        s += `<circle cx="${bx + R}" cy="${by}" r="${R}" fill="${col(r.zone)}" opacity="0.85"/>`
        s += `<text x="${bx + R}" y="${by + 3}" font-size="11" text-anchor="middle" fill="#222" font-family="Inter,sans-serif">${r.name}</text>`
        bx += R * 2 + 22
        rowMax = Math.max(rowMax, R)
      })
    }
    s += `<text x="${W / 2}" y="${H - 16}" font-size="11" text-anchor="middle" fill="#888" font-family="Inter,sans-serif">Total ${total} m²</text>`
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#ffffff"/>${s}</svg>`
  }, [chartRows, chartKind])

  const insertChart = () => {
    const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(chartSvg)}`
    commit([...els, newEl({ type: 'image', src, x: VW / 2, y: VH / 2, w: 480, h: 380, opacity: 1, label: '', fill: 'none' })])
    setShowCharts(false)
  }

  // ---------------- export ----------------
  const doExport = (kind: 'png' | 'png-hi' | 'svg' | 'lib') => {
    setSelId(null); setExporting(true); setBusy('Exporting…')
    setTimeout(async () => {
      try {
        if (kind === 'svg') {
          const xml = new XMLSerializer().serializeToString(svgRef.current!)
          downloadBlob(new Blob([xml], { type: 'image/svg+xml' }), 'concept_diagram.svg')
        } else {
          const blob = await svgToPngBlob(svgRef.current!, kind === 'png' ? 1 : 2.5, '#ffffff')
          if (kind === 'lib') flash((await saveImageToLibrary(blob, 'concept_diagram.png')).message)
          else downloadBlob(blob, 'concept_diagram.png')
        }
      } catch { flash('Export failed — try again.') }
      setExporting(false); setBusy('')
    }, 60)
  }

  const sendToSheet = () => {
    setSelId(null); setExporting(true); setBusy('Preparing for Sheet Composer…')
    setTimeout(async () => {
      try {
        const blob = await svgToPngBlob(svgRef.current!, 2.5, '#ffffff')
        const dataUrl = await new Promise<string>((res, rej) => {
          const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error('read')); r.readAsDataURL(blob)
        })
        const aspect = await aspectOfDataUrl(dataUrl)
        stashSheetImage(dataUrl, 'Concept Diagram', aspect, 'Concept Diagrams')
        const id = await createSheetProject()
        router.push(id ? `/dashboard/project/${id}/sheet-set` : '/dashboard/sheets')
      } catch { flash('Could not prepare the sheet image — try again.'); setExporting(false); setBusy('') }
    }, 60)
  }

  // ---------------- render helpers ----------------
  const bubbleById = (id?: string) => els.find(e => e.id === id && e.type === 'bubble')

  const renderConn = (c: El) => {
    const a = bubbleById(c.fromId), b = bubbleById(c.toId)
    if (!a || !b) return null
    const dx = b.x - a.x, dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len, uy = dy / len
    const x1 = a.x + ux * a.rx, y1 = a.y + uy * a.ry
    const x2 = b.x - ux * b.rx, y2 = b.y - uy * b.ry
    if (c.connKind === 'barrier') {
      const px = -uy * 4, py = ux * 4
      return <g key={c.id} onPointerDown={e => { e.stopPropagation(); setSelId(c.id) }} style={{ cursor: 'pointer' }}>
        <line x1={x1 + px} y1={y1 + py} x2={x2 + px} y2={y2 + py} stroke={c.stroke} strokeWidth={3} />
        <line x1={x1 - px} y1={y1 - py} x2={x2 - px} y2={y2 - py} stroke={c.stroke} strokeWidth={3} />
      </g>
    }
    return <line key={c.id} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c.stroke}
      strokeWidth={c.connKind === 'strong' ? 6 : 3}
      strokeDasharray={c.connKind === 'weak' ? '10 8' : undefined}
      markerEnd={c.connKind === 'movement' ? 'url(#cd-arrow)' : undefined}
      onPointerDown={e => { e.stopPropagation(); setSelId(c.id) }} style={{ cursor: 'pointer' }} />
  }

  return (
    <div className="min-h-screen bg-bg-primary dark:bg-dark-bg-primary flex flex-col">
      <header className="glass-nav shadow-elevation-1 sticky top-0 z-40">
        <div className="container-centered py-4 flex items-center gap-3 flex-wrap">
          <Link href="/dashboard" className="text-stone-light hover:text-slate text-sm">← Dashboard</Link>
          <span className="text-gray-200">|</span>
          <Logo size="sm" variant="gold" />
          <span className="font-semibold text-charcoal">Concept Diagram Builder</span>
          <div className="flex-1" />
          <button onClick={undo} className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-sm">↶</button>
          <button onClick={redo} className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-sm">↷</button>
          <button onClick={() => setSnap(!snap)} className={`px-2.5 py-1.5 rounded-lg border text-sm ${snap ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-white border-gray-200 text-gray-600'}`}>⌗ Snap</button>
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-sm">−</button>
          <span className="text-xs text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-sm">＋</button>
        </div>
      </header>

      {notice && <div className="container-centered pt-3"><div className="border border-[#D4AF37]/40 bg-[#FBE7A1]/30 text-[#9C7416] rounded-lg px-4 py-2.5 text-sm">{notice}</div></div>}

      <div className="flex-1 flex flex-col lg:flex-row gap-4 container-centered py-4">
        {/* Tools */}
        <aside className="lg:w-[280px] shrink-0 space-y-3 lg:max-h-[calc(100vh-130px)] lg:overflow-y-auto pr-1">
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <h4 className="text-xs font-bold text-gray-800 mb-2">Tools</h4>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {([['select', '🖱 Select'], ['bubble', '⬭ Bubble'], ['rect', '▭ Rectangle'], ['poly', '▱ Polygon'], ['free', '✎ Freehand'], ['arrow', '→ Arrow'], ['conn', '⟟ Connector'], ['text', 'T Text']] as Array<[Tool, string]>).map(([t, label]) => (
                <button key={t} onClick={() => { setTool(t); setDrawPts([]); setArrowStart(null); setConnFrom(null) }}
                  className={`px-2 py-2 rounded-lg border ${tool === t ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-white border-gray-200 text-gray-700'}`}>{label}</button>
              ))}
            </div>
            {tool === 'poly' && drawPts.length > 0 && <button onClick={closePoly} className="mt-2 w-full py-1.5 rounded-lg bg-[#D4AF37] text-white text-xs">✓ Close polygon ({drawPts.length} pts)</button>}
            {tool === 'conn' && <p className="mt-2 text-[10px] text-gray-500">{connFrom ? 'Now click the target bubble…' : 'Click the first bubble…'}</p>}
            {(tool === 'arrow' || tool === 'circ') && arrowStart && <p className="mt-2 text-[10px] text-gray-500">Click the arrow end point…</p>}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <h4 className="text-xs font-bold text-gray-800 mb-2">Zone colours</h4>
            <div className="grid grid-cols-2 gap-1.5">
              {ZONES.map(z => (
                <button key={z.id} onClick={() => setZone(z)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs border ${zone.id === z.id ? 'border-gray-900' : 'border-gray-200'}`}>
                  <span className="w-3.5 h-3.5 rounded-sm" style={{ background: z.color }} />{z.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <h4 className="text-xs font-bold text-gray-800 mb-2">Connector type</h4>
            <div className="grid grid-cols-2 gap-1.5">
              {CONN_KINDS.map(k => (
                <button key={k.id} onClick={() => { setConnKind(k.id); setTool('conn') }}
                  className={`px-2 py-1.5 rounded-md text-xs border ${connKind === k.id && tool === 'conn' ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'border-gray-200 text-gray-700'}`}>{k.name}</button>
              ))}
            </div>
            <button onClick={autoArrange} className="mt-2 w-full py-1.5 rounded-lg border border-[#D4AF37]/50 text-[#9C7416] text-xs hover:bg-[#FBE7A1]/30">✨ Auto-arrange bubbles</button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <h4 className="text-xs font-bold text-gray-800 mb-2">Circulation arrows</h4>
            <div className="grid grid-cols-2 gap-1.5">
              {CIRC_TYPES.map(t => (
                <button key={t.id} onClick={() => { setCircType(t); setTool('circ') }}
                  className={`px-2 py-1.5 rounded-md text-xs border ${circType.id === t.id && tool === 'circ' ? 'border-gray-900' : 'border-gray-200'}`}
                  style={{ color: t.color }}>{t.name}</button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <h4 className="text-xs font-bold text-gray-800 mb-2">Site concept (Lynch)</h4>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {([['node', '◉ Node'], ['landmark', '★ Landmark'], ['edge', '〰 Edge'], ['district', '▦ District']] as Array<[Tool, string]>).map(([t, label]) => (
                <button key={t} onClick={() => { setTool(t); setDrawPts([]) }}
                  className={`px-2 py-1.5 rounded-md border ${tool === t ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'border-gray-200 text-gray-700'}`}>{label}</button>
              ))}
            </div>
            {tool === 'district' && drawPts.length > 0 && <button onClick={closePoly} className="mt-2 w-full py-1.5 rounded-lg bg-[#D4AF37] text-white text-xs">✓ Close district</button>}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
            <button onClick={() => imgRef.current?.click()} className="w-full py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50">🖼️ Import plan / map (ghosted)</button>
            <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && onImage(e.target.files[0])} />
            <button onClick={() => setShowCharts(true)} className="w-full py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50">📊 Program / brief charts</button>
            <button onClick={() => commit([])} className="w-full py-1.5 rounded-lg border border-red-200 text-xs text-red-600 hover:bg-red-50">Clear canvas</button>
          </div>
        </aside>

        {/* Canvas + inspector */}
        <section className="flex-1 min-w-0">
          <div className="rounded-xl border border-gray-200 bg-gray-100 p-3 overflow-auto">
            <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} style={{ width: `${zoom * 100}%` }}
              className="bg-white shadow min-w-full"
              onPointerDown={onCanvasDown} onPointerMove={onCanvasMove} onPointerUp={onCanvasUp} onPointerLeave={onCanvasUp}>
              <defs>
                <marker id="cd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M0 0 L10 5 L0 10 Z" fill="#333333" />
                </marker>
                <filter id="cd-shadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="3" dy="4" stdDeviation="5" floodOpacity="0.3" />
                </filter>
              </defs>
              <rect width={VW} height={VH} fill="#ffffff" />
              {snap && !exporting && Array.from({ length: Math.floor(VW / 100) }, (_, i) => (
                <line key={`gv${i}`} x1={(i + 1) * 100} y1={0} x2={(i + 1) * 100} y2={VH} stroke="#f3f0e8" strokeWidth={1} data-ui="1" />
              ))}
              {snap && !exporting && Array.from({ length: Math.floor(VH / 100) }, (_, i) => (
                <line key={`gh${i}`} x1={0} y1={(i + 1) * 100} x2={VW} y2={(i + 1) * 100} stroke="#f3f0e8" strokeWidth={1} data-ui="1" />
              ))}

              {els.map(el => {
                const seld = el.id === selId && !exporting
                const common = { opacity: el.opacity, filter: el.shadow ? 'url(#cd-shadow)' : undefined, style: { cursor: 'move' } as React.CSSProperties }
                let node: React.ReactNode = null
                if (el.type === 'image') node = <image href={el.src} x={el.x - el.w / 2} y={el.y - el.h / 2} width={el.w} height={el.h} {...common} onPointerDown={e => onElDown(e, el)} />
                else if (el.type === 'bubble') node = <g {...common} onPointerDown={e => onElDown(e, el)}>
                  <ellipse cx={el.x} cy={el.y} rx={el.rx} ry={el.ry} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} strokeDasharray={el.dash || undefined} />
                  {el.label && <text x={el.x} y={el.y + 1} fontSize={el.fontSize} fontWeight={600} textAnchor="middle" fill="#222" fontFamily="Inter,sans-serif">{el.label}</text>}
                  {el.areaSqm ? <text x={el.x} y={el.y + el.fontSize + 3} fontSize={el.fontSize * 0.65} textAnchor="middle" fill="#555" fontFamily="Inter,sans-serif">{el.areaSqm} m²</text> : null}
                </g>
                else if (el.type === 'star') {
                  const pts: string[] = []
                  for (let i = 0; i < 10; i++) {
                    const r = i % 2 === 0 ? el.rx : el.rx * 0.45
                    const a = (i / 10) * Math.PI * 2 - Math.PI / 2
                    pts.push(`${el.x + r * Math.cos(a)},${el.y + r * Math.sin(a)}`)
                  }
                  node = <g {...common} onPointerDown={e => onElDown(e, el)}>
                    <polygon points={pts.join(' ')} fill={el.fill} stroke={el.stroke} strokeWidth={2} />
                    {el.label && <text x={el.x} y={el.y + el.rx + 16} fontSize={el.fontSize * 0.8} textAnchor="middle" fill="#444" fontFamily="Inter,sans-serif">{el.label}</text>}
                  </g>
                }
                else if (el.type === 'rect') node = <g {...common} onPointerDown={e => onElDown(e, el)}>
                  <rect x={el.x - el.w / 2} y={el.y - el.h / 2} width={el.w} height={el.h} rx={el.radius} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} strokeDasharray={el.dash || undefined} />
                  {el.label && <text x={el.x} y={el.y + 1} fontSize={el.fontSize} fontWeight={600} textAnchor="middle" fill="#222" fontFamily="Inter,sans-serif">{el.label}</text>}
                </g>
                else if (el.type === 'poly') node = <g {...common} onPointerDown={e => onElDown(e, el)}>
                  <polygon points={el.pts.map(p => p.join(',')).join(' ')} fill={el.fill} fillOpacity={0.5} stroke={el.stroke} strokeWidth={el.strokeWidth} strokeDasharray={el.dash || undefined} />
                  {el.label && <text x={el.pts.reduce((a, p) => a + p[0], 0) / el.pts.length} y={el.pts.reduce((a, p) => a + p[1], 0) / el.pts.length} fontSize={el.fontSize} fontWeight={600} textAnchor="middle" fill="#333" fontFamily="Inter,sans-serif">{el.label}</text>}
                </g>
                else if (el.type === 'free') node = <polyline {...common} onPointerDown={e => onElDown(e, el)} points={el.pts.map(p => p.join(',')).join(' ')} fill="none" stroke={el.stroke} strokeWidth={el.strokeWidth} strokeDasharray={el.dash || undefined} strokeLinecap="round" strokeLinejoin="round" />
                else if (el.type === 'arrow') node = <line {...common} onPointerDown={e => onElDown(e, el)} x1={el.pts[0]?.[0]} y1={el.pts[0]?.[1]} x2={el.pts[1]?.[0]} y2={el.pts[1]?.[1]} stroke={el.stroke} strokeWidth={el.strokeWidth} strokeDasharray={el.dash || undefined} markerEnd="url(#cd-arrow)" strokeLinecap="round" />
                else if (el.type === 'conn') return renderConn(el)
                else if (el.type === 'text') node = <text {...common} onPointerDown={e => onElDown(e, el)} x={el.x} y={el.y} fontSize={el.fontSize} fontWeight={600} fill={el.fill} fontFamily="Inter,sans-serif">{el.label}</text>

                return <g key={el.id}>
                  {node}
                  {seld && (
                    <g data-ui="1">
                      <rect x={el.x - Math.max(el.rx, el.w / 2) - 6} y={el.y - Math.max(el.ry, el.h / 2) - 6}
                        width={Math.max(el.rx, el.w / 2) * 2 + 12} height={Math.max(el.ry, el.h / 2) * 2 + 12}
                        fill="none" stroke="#D4AF37" strokeWidth={2} strokeDasharray="7 5" />
                      <circle cx={el.x + Math.max(el.rx, el.w / 2) + 6} cy={el.y + Math.max(el.ry, el.h / 2) + 6} r={9}
                        fill="#D4AF37" style={{ cursor: 'nwse-resize' }} onPointerDown={e => onResizeDown(e, el)} />
                    </g>
                  )}
                </g>
              })}

              {/* in-progress */}
              {drawPts.length > 0 && <g data-ui="1">
                <polyline points={drawPts.map(p => p.join(',')).join(' ')} fill="none" stroke="#D4AF37" strokeWidth={2.5} strokeDasharray="6 4" />
                {!freeDrawing && drawPts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={5} fill="#D4AF37" />)}
              </g>}
              {arrowStart && <circle data-ui="1" cx={arrowStart[0]} cy={arrowStart[1]} r={6} fill={tool === 'circ' ? circType.color : '#333'} />}
            </svg>
          </div>

          {/* inspector */}
          {sel && (
            <div className="mt-3 bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3 flex-wrap text-xs">
              {sel.type !== 'conn' && sel.type !== 'image' && (
                <input value={sel.label} onChange={e => update(sel.id, { label: e.target.value })} placeholder="Label"
                  className="border rounded-lg px-2 py-1.5 w-36" />
              )}
              {sel.type === 'bubble' && (
                <span className="flex items-center gap-1 text-gray-600">Area
                  <input type="number" value={sel.areaSqm || 0} onChange={e => update(sel.id, { areaSqm: Number(e.target.value) })} className="w-16 border rounded px-1.5 py-1" /> m²
                </span>
              )}
              {sel.type === 'conn' && (
                <span className="flex items-center gap-1 text-gray-600">Type
                  <select value={sel.connKind} onChange={e => update(sel.id, { connKind: e.target.value as ConnKind })} className="border rounded px-1.5 py-1">
                    {CONN_KINDS.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                </span>
              )}
              {sel.type !== 'conn' && <>
                <span className="flex items-center gap-1 text-gray-600">Fill <input type="color" value={sel.fill === 'none' ? '#ffffff' : sel.fill} onChange={e => update(sel.id, { fill: e.target.value })} className="w-7 h-6 rounded border" /></span>
                <span className="flex items-center gap-1 text-gray-600">Stroke <input type="color" value={sel.stroke} onChange={e => update(sel.id, { stroke: e.target.value })} className="w-7 h-6 rounded border" /></span>
                <span className="flex items-center gap-1 text-gray-600">W <input type="range" min={1} max={12} value={sel.strokeWidth} onChange={e => update(sel.id, { strokeWidth: Number(e.target.value) })} className="w-14 accent-[#D4AF37]" /></span>
                <select value={sel.dash === '' ? 'solid' : sel.dash === '10 8' ? 'dashed' : 'dotted'} onChange={e => update(sel.id, { dash: e.target.value === 'solid' ? '' : e.target.value === 'dashed' ? '10 8' : '2 6' })} className="border rounded px-1.5 py-1">
                  <option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option>
                </select>
              </>}
              <span className="flex items-center gap-1 text-gray-600">Opacity <input type="range" min={10} max={100} value={Math.round(sel.opacity * 100)} onChange={e => update(sel.id, { opacity: Number(e.target.value) / 100 })} className="w-16 accent-[#D4AF37]" /></span>
              {sel.type === 'rect' && <span className="flex items-center gap-1 text-gray-600">Radius <input type="range" min={0} max={40} value={sel.radius} onChange={e => update(sel.id, { radius: Number(e.target.value) })} className="w-14 accent-[#D4AF37]" /></span>}
              <label className="flex items-center gap-1 text-gray-600 cursor-pointer"><input type="checkbox" checked={sel.shadow} onChange={e => update(sel.id, { shadow: e.target.checked })} /> Shadow</label>
              <button onClick={() => { const cp = { ...sel, id: crypto.randomUUID(), x: sel.x + 30, y: sel.y + 30, pts: sel.pts.map(p => [p[0] + 30, p[1] + 30]) }; commit([...els, cp]); setSelId(cp.id) }} className="px-2 py-1.5 rounded border border-gray-200">⧉</button>
              <button onClick={() => { commit(els.filter(e => e.id !== sel.id && e.fromId !== sel.id && e.toId !== sel.id)); setSelId(null) }} className="px-2 py-1.5 rounded border border-red-200 text-red-600">🗑</button>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => doExport('png')} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50">🖼️ PNG</button>
            <button onClick={() => doExport('png-hi')} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50">🖨️ PNG (print)</button>
            <button onClick={() => doExport('svg')} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50">⬇ SVG</button>
            <button onClick={() => doExport('lib')} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-br from-[#D4AF37] to-[#9C7416]">💾 Save to Library</button>
            <button onClick={sendToSheet} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700">📐 Send to Sheet</button>
            {busy && <span className="px-3 py-2.5 text-sm text-gray-500">{busy}</span>}
          </div>
        </section>
      </div>

      {/* charts modal */}
      {showCharts && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCharts(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-auto p-5" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-3">📊 Program / Brief Charts</h3>
            <div className="grid md:grid-cols-[320px_1fr] gap-4">
              <div className="space-y-2">
                {chartRows.map((r, i) => (
                  <div key={i} className="flex gap-1.5 items-center">
                    <input value={r.name} onChange={e => setChartRows(rows => rows.map((rr, ri) => ri === i ? { ...rr, name: e.target.value } : rr))} placeholder="Space" className="border rounded px-2 py-1 text-xs flex-1" />
                    <input type="number" value={r.sqm} onChange={e => setChartRows(rows => rows.map((rr, ri) => ri === i ? { ...rr, sqm: Number(e.target.value) } : rr))} className="border rounded px-2 py-1 text-xs w-16" />
                    <select value={r.zone} onChange={e => setChartRows(rows => rows.map((rr, ri) => ri === i ? { ...rr, zone: e.target.value } : rr))} className="border rounded px-1 py-1 text-xs">
                      {ZONES.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                    <button onClick={() => setChartRows(rows => rows.filter((_, ri) => ri !== i))} className="text-red-400 text-xs">✕</button>
                  </div>
                ))}
                <button onClick={() => setChartRows(rows => [...rows, { name: '', sqm: 10, zone: 'public' }])} className="text-xs text-[#9C7416] hover:underline">＋ Add space</button>
                <div className="flex gap-1.5 pt-2">
                  {(['pie', 'bar', 'treemap', 'bubble'] as const).map(k => (
                    <button key={k} onClick={() => setChartKind(k)} className={`px-2.5 py-1.5 rounded text-xs capitalize ${chartKind === k ? 'bg-[#D4AF37] text-white' : 'bg-gray-100 text-gray-600'}`}>{k}</button>
                  ))}
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg flex justify-center p-2" dangerouslySetInnerHTML={{ __html: chartSvg }} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowCharts(false)} className="px-4 py-2 rounded-lg text-sm border border-gray-200">Cancel</button>
              <button onClick={insertChart} className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-br from-[#D4AF37] to-[#9C7416]">✓ Insert chart</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
