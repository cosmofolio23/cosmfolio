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
        <span className="text-xs font-bold text-[#9C7416]">🧭 Symbols</span>
        <button onClick={() => setCollapsed(true)} className="text-gray-400 text-xs hover:text-gray-600" title="Collapse">◀</button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {renderGroup('North Arrows', northArrows)}
        {renderGroup('Graphic Scales', graphicScales)}
      </div>
    </div>
  )
}
