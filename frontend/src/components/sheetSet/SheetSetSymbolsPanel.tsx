import React, { useState } from 'react'
import type { SheetElement } from './sheetSetTypes'

interface SymbolItem {
  id: string
  name: string
  type: 'north-arrow' | 'graphic-scale'
  svg: string
  aspectRatio: number // w/h
}

const SYMBOLS: SymbolItem[] = [
  {
    id: 'north-minimal',
    name: 'Minimal North',
    type: 'north-arrow',
    aspectRatio: 1,
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4"><circle cx="50" cy="50" r="40"/><path d="M50 10 L50 90 M25 35 L50 10 L75 35"/><text x="50" y="85" text-anchor="middle" font-size="20" font-family="sans-serif" fill="currentColor" stroke="none">N</text></svg>`
  },
  {
    id: 'north-classic',
    name: 'Classic North',
    type: 'north-arrow',
    aspectRatio: 1,
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 0 L65 50 L50 100 L35 50 Z"/><path d="M50 0 L50 100 L35 50 Z" fill-opacity="0.3"/><text x="50" y="85" text-anchor="middle" font-size="20" font-family="serif" fill="white">N</text></svg>`
  },
  {
    id: 'scale-metric-small',
    name: 'Metric Bar (Small)',
    type: 'graphic-scale',
    aspectRatio: 10,
    svg: `<svg viewBox="0 0 200 20" fill="none" stroke="currentColor" stroke-width="2"><rect x="0" y="5" width="200" height="10"/><rect x="0" y="5" width="50" height="10" fill="currentColor"/><rect x="100" y="5" width="50" height="10" fill="currentColor"/><text x="0" y="4" font-size="6" font-family="sans-serif" fill="currentColor" stroke="none">0</text><text x="50" y="4" font-size="6" font-family="sans-serif" fill="currentColor" stroke="none">1m</text><text x="100" y="4" font-size="6" font-family="sans-serif" fill="currentColor" stroke="none">2m</text><text x="200" y="4" font-size="6" font-family="sans-serif" fill="currentColor" stroke="none" text-anchor="end">4m</text></svg>`
  },
  {
    id: 'scale-metric-large',
    name: 'Metric Bar (Large)',
    type: 'graphic-scale',
    aspectRatio: 10,
    svg: `<svg viewBox="0 0 200 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M0 10 L200 10 M0 5 L0 15 M50 5 L50 15 M100 5 L100 15 M200 5 L200 15"/><text x="0" y="4" font-size="6" font-family="sans-serif" fill="currentColor" stroke="none">0</text><text x="50" y="4" font-size="6" font-family="sans-serif" fill="currentColor" stroke="none">5m</text><text x="100" y="4" font-size="6" font-family="sans-serif" fill="currentColor" stroke="none">10m</text><text x="200" y="4" font-size="6" font-family="sans-serif" fill="currentColor" stroke="none" text-anchor="end">20m</text></svg>`
  }
]

interface SheetSetSymbolsPanelProps {
  onAddElement: (el: SheetElement) => void
}

export function SheetSetSymbolsPanel({ onAddElement }: SheetSetSymbolsPanelProps) {
  const [collapsed, setCollapsed] = useState(true)

  const addSymbol = (symbol: SymbolItem) => {
    const wPct = symbol.type === 'north-arrow' ? 5 : 20
    const hPct = wPct / symbol.aspectRatio

    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(symbol.svg)}`

    onAddElement({
      id: `sym-${Date.now()}`,
      kind: 'drawing',
      x: 50 - wPct / 2,
      y: 50 - hPct / 2,
      w: wPct,
      h: hPct,
      z: 80,
      locked: false,
      visible: true,
      drawing: {
        drawingName: symbol.name,
        drawingType: 'diagram',
        originalScale: '1:1',
        sheetScale: '1:1',
        vector: true,
        url: svgUrl,
      },
    })
  }

  const addCustomWidget = (type: 'keyplan' | 'section-line' | 'elevation-bubble' | 'room-tag' | 'detail-callout' | 'scalebar' | 'sunpath' | 'windrose' | 'climatology') => {
    if (type === 'keyplan') {
      onAddElement({
        id: `kp-${Date.now()}`,
        kind: 'keyplan',
        x: 5, y: 70, w: 20, h: 20, z: 90,
        locked: false, visible: true,
        highlightZone: { x: 20, y: 20, w: 30, h: 30 }
      })
    } else if (type === 'scalebar') {
      onAddElement({
        id: `sb-${Date.now()}`,
        kind: 'scalebar',
        scalebarLengthMeters: 10,
        scalebarStyle: 'metric-blocks',
        x: 10, y: 85, w: 25, h: 7, z: 90,
        locked: false, visible: true
      })
    } else if (type === 'sunpath' || type === 'windrose' || type === 'climatology') {
      onAddElement({
        id: `site-${Date.now()}`,
        kind: 'sitewidget',
        siteAnalysisType: type,
        locationName: 'Chennai, TN (Latitude 13.08° N)',
        x: 35, y: 35, w: 25, h: 25, z: 85,
        locked: false, visible: true
      })
    } else {
      // Annotations
      let w = 15, h = 15
      let primary = 'A', secondary = '01', extra = ''
      if (type === 'section-line') { w = 80; h = 8 }
      if (type === 'elevation-bubble') { w = 10; h = 10; primary = '1' }
      if (type === 'room-tag') { w = 18; h = 6; primary = 'ROOM NAME'; extra = '15.0 sq.m' }
      if (type === 'detail-callout') { w = 15; h = 15; primary = '1'; secondary = '05' }
      
      onAddElement({
        id: `annot-${Date.now()}`,
        kind: 'annotation',
        annotationType: type as any,
        annotationLabels: { primary, secondary, extra },
        x: 50 - w / 2, y: 50 - h / 2, w, h, z: 95,
        locked: false, visible: true
      })
    }
  }

  if (collapsed) {
    return (
      <div className="w-10 bg-white border-r border-gray-200 flex flex-col items-center pt-3 shrink-0">
        <button onClick={() => setCollapsed(false)} title="Open architectural symbols"
          className="text-lg hover:scale-110 transition" >🧭</button>
        <span className="mt-2 text-[9px] text-gray-400 font-semibold tracking-wide" style={{ writingMode: 'vertical-rl' }}>
          SYMBOLS
        </span>
      </div>
    )
  }

  const northArrows = SYMBOLS.filter(s => s.type === 'north-arrow')
  const graphicScales = SYMBOLS.filter(s => s.type === 'graphic-scale')

  const renderGroup = (title: string, group: SymbolItem[]) => (
    <div className="mb-4">
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{title}</h3>
      <div className="grid grid-cols-2 gap-2">
        {group.map(sym => (
          <button
            key={sym.id}
            onClick={() => addSymbol(sym)}
            className="group relative aspect-square bg-gray-50 border border-gray-200 rounded-lg overflow-hidden hover:border-[#D4AF37] flex items-center justify-center p-3"
            title={`Add ${sym.name}`}
          >
            <div 
              className="w-full h-full text-gray-800"
              dangerouslySetInnerHTML={{ __html: sym.svg }}
            />
            <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-1 translate-y-full group-hover:translate-y-0 transition-transform">
              <p className="text-[8px] text-white font-medium truncate text-center">{sym.name}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="w-[230px] shrink-0 flex flex-col bg-white border-r border-gray-200">
      <div className="px-3 py-2.5 border-b border-gray-200 flex items-center justify-between bg-[#FBE7A1]/10">
        <span className="text-xs font-bold text-[#9C7416]">🧭 Symbols & Tools</span>
        <button onClick={() => setCollapsed(true)} className="text-gray-400 text-xs hover:text-gray-600" title="Collapse">◀</button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Architectural Widgets & Tools Group */}
        <div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Smart Layout Widgets</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => addCustomWidget('keyplan')}
              className="p-2 border border-gray-200 rounded-lg bg-gray-50 hover:border-[#D4AF37] hover:bg-amber-50 text-left transition"
            >
              <span className="text-lg">🗺️</span>
              <p className="text-[9px] font-bold mt-1 text-gray-800">Key Plan</p>
              <p className="text-[7px] text-gray-500 leading-tight">Footprint reference</p>
            </button>
            <button
              onClick={() => addCustomWidget('scalebar')}
              className="p-2 border border-gray-200 rounded-lg bg-gray-50 hover:border-[#D4AF37] hover:bg-amber-50 text-left transition"
            >
              <span className="text-lg">📏</span>
              <p className="text-[9px] font-bold mt-1 text-gray-800">Scale Bar</p>
              <p className="text-[7px] text-gray-500 leading-tight">Metric graphical bar</p>
            </button>
          </div>
        </div>

        {/* Site Analysis Widgets (Feature 1) */}
        <div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">☀️ Site Analysis Widgets</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => addCustomWidget('sunpath')}
              className="p-2 border border-gray-200 rounded-lg bg-gray-50 hover:border-[#D4AF37] hover:bg-amber-50 text-left transition"
            >
              <span className="text-lg">☀️</span>
              <p className="text-[9px] font-bold mt-1 text-gray-800">Sun Path</p>
              <p className="text-[7px] text-gray-500 leading-tight">Solar orientation graph</p>
            </button>
            <button
              onClick={() => addCustomWidget('windrose')}
              className="p-2 border border-gray-200 rounded-lg bg-gray-50 hover:border-[#D4AF37] hover:bg-amber-50 text-left transition"
            >
              <span className="text-lg">💨</span>
              <p className="text-[9px] font-bold mt-1 text-gray-800">Wind Rose</p>
              <p className="text-[7px] text-gray-500 leading-tight">Wind frequency rose</p>
            </button>
            <button
              onClick={() => addCustomWidget('climatology')}
              className="p-2 border border-gray-200 rounded-lg bg-gray-50 hover:border-[#D4AF37] hover:bg-amber-50 text-left transition col-span-2"
            >
              <span className="text-lg">📊</span>
              <p className="text-[9px] font-bold mt-1 text-gray-800">Climatology Chart</p>
              <p className="text-[7px] text-gray-500 leading-tight">Precipitation & temp curves</p>
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Drafting Callouts</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => addCustomWidget('section-line')}
              className="p-2 border border-gray-200 rounded-lg bg-gray-50 hover:border-[#D4AF37] hover:bg-blue-50 text-left transition"
            >
              <span className="text-lg">✂️</span>
              <p className="text-[9px] font-bold mt-1 text-gray-800">Section Line</p>
              <p className="text-[7px] text-gray-500 leading-tight">Interactive cuts</p>
            </button>
            <button
              onClick={() => addCustomWidget('elevation-bubble')}
              className="p-2 border border-gray-200 rounded-lg bg-gray-50 hover:border-[#D4AF37] hover:bg-blue-50 text-left transition"
            >
              <span className="text-lg">🧭</span>
              <p className="text-[9px] font-bold mt-1 text-gray-800">Elevation Mark</p>
              <p className="text-[7px] text-gray-500 leading-tight">4-way indicators</p>
            </button>
            <button
              onClick={() => addCustomWidget('room-tag')}
              className="p-2 border border-gray-200 rounded-lg bg-gray-50 hover:border-[#D4AF37] hover:bg-blue-50 text-left transition"
            >
              <span className="text-lg">🏷️</span>
              <p className="text-[9px] font-bold mt-1 text-gray-800">Room Tag</p>
              <p className="text-[7px] text-gray-500 leading-tight">Name + area label</p>
            </button>
            <button
              onClick={() => addCustomWidget('detail-callout')}
              className="p-2 border border-gray-200 rounded-lg bg-gray-50 hover:border-[#D4AF37] hover:bg-blue-50 text-left transition"
            >
              <span className="text-lg">🫧</span>
              <p className="text-[9px] font-bold mt-1 text-gray-800">Detail Ring</p>
              <p className="text-[7px] text-gray-500 leading-tight">Zoom callout box</p>
            </button>
          </div>
        </div>

        <hr className="border-gray-200" />

        {renderGroup('North Arrows', northArrows)}
        {renderGroup('Graphic Scales', graphicScales)}
      </div>
    </div>
  )
}
