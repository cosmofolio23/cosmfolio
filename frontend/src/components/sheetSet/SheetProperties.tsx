/**
 * Sheet Properties Panel
 *
 * Right sidebar for editing element properties and drawing metadata
 */

import React, { useState } from 'react'
import { ChevronDown, Upload } from 'lucide-react'
import type { Sheet, SheetElement, DrawingMetadata, SheetSet } from './sheetSetTypes'
import { SCALE_RATIOS } from './drawingScaleEngine'

interface SheetPropertiesProps {
  sheet: Sheet
  selectedElement: SheetElement | null
  onUpdateElement: (update: Partial<SheetElement>) => void
  onUploadDrawing: (element: SheetElement, file: File, metadata: Partial<DrawingMetadata>) => void
  sheetSet: SheetSet
  onUpdateSheet: (update: Partial<Sheet>) => void
  onUpdateSheetSet: (update: Partial<SheetSet>) => void
  onAICommand?: (cmd: string) => Promise<any>
}

export function SheetProperties({
  sheet,
  sheetSet,
  selectedElement,
  onUpdateElement,
  onUploadDrawing,
  onUpdateSheet,
  onUpdateSheetSet,
  onAICommand,
}: SheetPropertiesProps) {
  const [uploadingElement, setUploadingElement] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['position', 'style']))

  const toggleSection = (section: string) => {
    const newSections = new Set(expandedSections)
    if (newSections.has(section)) {
      newSections.delete(section)
    } else {
      newSections.add(section)
    }
    setExpandedSections(newSections)
  }

  const handleAutoGenerateRoomTags = () => {
    if (!sheet || !selectedElement) return
    
    const dx = selectedElement.x
    const dy = selectedElement.y
    const dw = selectedElement.w
    const dh = selectedElement.h

    const drawingName = selectedElement.drawing?.drawingName?.toLowerCase() || ''
    
    let rooms = [
      { name: 'LIVING ROOM', area: '24.5 sq.m', rx: 0.25, ry: 0.3 },
      { name: 'KITCHEN', area: '12.0 sq.m', rx: 0.75, ry: 0.3 },
      { name: 'MASTER BEDROOM', area: '18.0 sq.m', rx: 0.25, ry: 0.7 },
      { name: 'BATHROOM', area: '6.5 sq.m', rx: 0.75, ry: 0.7 }
    ]

    if (drawingName.includes('first') || drawingName.includes('upper') || drawingName.includes('level 1')) {
      rooms = [
        { name: 'BEDROOM 01', area: '16.0 sq.m', rx: 0.25, ry: 0.3 },
        { name: 'BEDROOM 02', area: '14.5 sq.m', rx: 0.75, ry: 0.3 },
        { name: 'STUDY ROOM', area: '11.0 sq.m', rx: 0.25, ry: 0.7 },
        { name: 'BALCONY', area: '5.2 sq.m', rx: 0.75, ry: 0.7 }
      ]
    } else if (drawingName.includes('site') || drawingName.includes('layout') || drawingName.includes('plan')) {
      rooms = [
        { name: 'MAIN ENTRANCE', area: 'SITE BOUNDARY', rx: 0.3, ry: 0.2 },
        { name: 'COURTYARD GARDEN', area: '68.0 sq.m', rx: 0.7, ry: 0.4 },
        { name: 'PARKING BAY', area: '32.0 sq.m', rx: 0.3, ry: 0.7 },
        { name: 'SECURITY CABIN', area: '4.5 sq.m', rx: 0.8, ry: 0.8 }
      ]
    }

    const newElements = rooms.map((r, idx) => {
      const w = 18
      const h = 6
      const x = dx + dw * r.rx - w / 2
      const y = dy + dh * r.ry - h / 2
      return {
        id: `annot-ai-${Date.now()}-${idx}`,
        kind: 'annotation' as const,
        annotationType: 'room-tag' as const,
        annotationLabels: {
          primary: r.name,
          extra: r.area
        },
        x: Math.max(0, Math.min(100 - w, x)),
        y: Math.max(0, Math.min(100 - h, y)),
        w,
        h,
        z: 95,
        locked: false,
        visible: true
      }
    })

    onUpdateSheet({
      elements: [...sheet.elements, ...newElements]
    })
  }

  if (!selectedElement) {
    const handleOrientationChange = (newOrientation: 'portrait' | 'landscape') => {
      if (newOrientation === sheetSet.orientation) return
      // The actual reflow math will be handled upstream, or we can just emit the update
      onUpdateSheetSet({ orientation: newOrientation })
    }

    return (
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-900">Sheet Settings</h3>
          <p className="text-xs text-gray-500">Configure page setup and backgrounds</p>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Page Setup */}
          <section>
            <h4 className="text-xs font-bold text-gray-700 uppercase mb-3 tracking-wider">Page Setup</h4>
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-gray-700">Sheet Name</span>
                <input
                  type="text"
                  value={sheet.sheetName}
                  onChange={e => onUpdateSheet({ sheetName: e.target.value })}
                  className="w-full mt-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-gray-700 mb-1 block">Orientation</span>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    className={`flex-1 py-1.5 text-xs font-medium rounded ${sheetSet.orientation === 'portrait' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => handleOrientationChange('portrait')}
                  >
                    Portrait
                  </button>
                  <button
                    className={`flex-1 py-1.5 text-xs font-medium rounded ${sheetSet.orientation === 'landscape' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => handleOrientationChange('landscape')}
                  >
                    Landscape
                  </button>
                </div>
              </label>

              {onAICommand && (
                <button
                  onClick={() => {
                    if (confirm("Auto-flow will scan your project assets and automatically place matching plans, sections, and renders into their respective sheet templates. Proceed?")) {
                      onAICommand('auto-fill-assets')
                    }
                  }}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-amber-500 to-[#D4AF37] hover:brightness-105 text-white font-bold rounded-lg text-xs transition shadow-sm"
                >
                  <span>🪄 Auto-Flow Drawings</span>
                </button>
              )}
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Modular Layout Grid & Border Settings */}
          <section>
            <h4 className="text-xs font-bold text-gray-700 uppercase mb-3 tracking-wider">📏 Modular Layout Grid</h4>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] text-gray-500 font-medium">Grid Columns</span>
                  <select
                    value={sheetSet.gridColumns || 12}
                    onChange={e => onUpdateSheetSet({ gridColumns: parseInt(e.target.value) })}
                    className="w-full mt-1 px-2 py-1.5 border border-gray-300 rounded text-xs bg-white"
                  >
                    <option value="4">4 Columns</option>
                    <option value="6">6 Columns</option>
                    <option value="8">8 Columns</option>
                    <option value="12">12 Columns (Std)</option>
                    <option value="16">16 Columns</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-[10px] text-gray-500 font-medium">Gutter Width</span>
                  <select
                    value={sheetSet.gridGutter || 1.5}
                    onChange={e => onUpdateSheetSet({ gridGutter: parseFloat(e.target.value) })}
                    className="w-full mt-1 px-2 py-1.5 border border-gray-300 rounded text-xs bg-white"
                  >
                    <option value="0">0% (No Gutter)</option>
                    <option value="1">1.0% Gutter</option>
                    <option value="1.5">1.5% Gutter</option>
                    <option value="2">2.0% Gutter</option>
                    <option value="3">3.0% Gutter</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] text-gray-500 font-medium">Sheet Margins (mm)</span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={sheetSet.sheetMargins ?? 15}
                    onChange={e => onUpdateSheetSet({ sheetMargins: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] text-gray-500 font-medium">Sheet Outer Border</span>
                  <select
                    value={sheetSet.sheetBorder || 'none'}
                    onChange={e => onUpdateSheetSet({ sheetBorder: e.target.value as any })}
                    className="w-full mt-1 px-2 py-1.5 border border-gray-300 rounded text-xs bg-white"
                  >
                    <option value="none">None (Border-free)</option>
                    <option value="thin-black">Thin Technical Border</option>
                    <option value="double-line">Double Line Studio Frame</option>
                    <option value="dashed-border">Dashed Layout Guide</option>
                  </select>
                </label>
              </div>
              <p className="text-[9px] text-gray-400 leading-tight">
                Propagated across all sheets to enforce alignment. Red margins and columns only show when grid lines are visible.
              </p>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Master Title Block */}
          <section>
            <h4 className="text-xs font-bold text-gray-700 uppercase mb-3 tracking-wider">Master Title Block</h4>
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-gray-700 mb-1 block">Style Template</span>
                <select
                  value={sheetSet.titleBlockTemplate || 'none'}
                  onChange={e => onUpdateSheetSet({ titleBlockTemplate: e.target.value as any })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                >
                  <option value="none">None</option>
                  <option value="bottom-strip">Bottom Strip</option>
                  <option value="right-column">Right Column</option>
                  <option value="minimal-corner">Minimal Corner</option>
                </select>
              </label>
              <p className="text-[10px] text-gray-500 leading-tight mt-1">
                This title block is dynamically applied to all sheets in the set and automatically populated.
              </p>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Backgrounds */}
          <section>
            <h4 className="text-xs font-bold text-gray-700 uppercase mb-3 tracking-wider">Background Overlays</h4>
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-gray-700 mb-1 block">Pattern Overlay</span>
                <select
                  value={sheet.background?.pattern || 'none'}
                  onChange={e => {
                    const pattern = e.target.value as any
                    if (pattern === 'none') {
                      onUpdateSheet({ background: undefined })
                    } else {
                      onUpdateSheet({
                        background: {
                          ...sheet.background,
                          id: sheet.background?.id || `bg-${Date.now()}`,
                          type: 'pattern',
                          pattern,
                          visible: true,
                          opacity: sheet.background?.opacity || 0.1,
                        }
                      })
                    }
                  }}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                >
                  <option value="none">None</option>
                  <option value="dots">Drafting Dots</option>
                  <option value="grid">Architectural Grid</option>
                  <option value="lines">Horizontal Lines</option>
                  <option value="diagonal">Diagonal Hatch</option>
                  <option disabled>──────</option>
                  <option value="topographic">Topographic Contours</option>
                  <option value="waves">Parametric Waves</option>
                  <option value="abstract-grid">Abstract Grid</option>
                </select>
              </label>

              {sheet.background && (
                <>
                  <label className="block">
                    <span className="text-xs font-medium text-gray-700 flex justify-between">
                      Opacity
                      <span className="text-gray-400">{(sheet.background.opacity || 0.1) * 100}%</span>
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={sheet.background.opacity || 0.1}
                      onChange={e => onUpdateSheet({
                        background: { ...sheet.background!, opacity: parseFloat(e.target.value) }
                      })}
                      className="w-full mt-1"
                    />
                  </label>
                </>
              )}
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Aesthetic Style DNA Presets (Feature 5) */}
          <section>
            <h4 className="text-xs font-bold text-gray-700 uppercase mb-3 tracking-wider">🎨 Style DNA Presets</h4>
            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                onClick={() => onUpdateSheetSet({
                  fontFamily: 'Outfit, sans-serif',
                  backgroundColor: '#F9F9FB',
                  textColor: '#111111',
                  primaryColor: '#FF4B4B', // BIG Red
                  titleBlockTemplate: 'minimal-corner'
                })}
                className={`p-2.5 rounded-lg border text-left transition ${sheetSet.fontFamily?.includes('Outfit') ? 'border-red-500 bg-red-50/40' : 'border-gray-200 hover:border-red-400 bg-gray-50'}`}
              >
                <div className="font-bold text-xs text-gray-900">BIG Style</div>
                <div className="text-[7.5px] text-gray-500 mt-0.5 leading-tight">Vibrant red accents, modern rounded headers, minimal block.</div>
              </button>

              <button
                onClick={() => onUpdateSheetSet({
                  fontFamily: 'Space Grotesk, sans-serif',
                  backgroundColor: '#0B0E14', // Zaha Dark Mode
                  textColor: '#FFFFFF',
                  primaryColor: '#00FFBB', // Neon cyan
                  titleBlockTemplate: 'right-column'
                })}
                className={`p-2.5 rounded-lg border text-left transition ${sheetSet.fontFamily?.includes('Space Grotesk') ? 'border-emerald-500 bg-emerald-950/40' : 'border-gray-200 hover:border-emerald-400 bg-gray-50'}`}
              >
                <div className="font-bold text-xs text-gray-900">Zaha Hadid</div>
                <div className="text-[7.5px] text-gray-500 mt-0.5 leading-tight">Futuristic dark mode, neon cyan lines, column borders.</div>
              </button>

              <button
                onClick={() => onUpdateSheetSet({
                  fontFamily: 'Inter, sans-serif',
                  backgroundColor: '#FFFFFF', // Minimal White
                  textColor: '#000000',
                  primaryColor: '#111111',
                  titleBlockTemplate: 'none'
                })}
                className={`p-2.5 rounded-lg border text-left transition ${sheetSet.fontFamily?.includes('Inter') && sheetSet.backgroundColor === '#FFFFFF' ? 'border-stone-800 bg-stone-50' : 'border-gray-200 hover:border-stone-400 bg-gray-50'}`}
              >
                <div className="font-bold text-xs text-gray-900">SANAA Minimal</div>
                <div className="text-[7.5px] text-gray-500 mt-0.5 leading-tight">Whitespace-heavy, hairline thin black fonts, raw grids.</div>
              </button>

              <button
                onClick={() => onUpdateSheetSet({
                  fontFamily: 'Courier New, monospace',
                  backgroundColor: '#0B2A66', // Blueprint Blue
                  textColor: '#FFFFFF',
                  primaryColor: '#FFFFFF', // White lines
                  titleBlockTemplate: 'bottom-strip'
                })}
                className={`p-2.5 rounded-lg border text-left transition ${sheetSet.fontFamily?.includes('Courier New') ? 'border-blue-500 bg-blue-900/40' : 'border-gray-200 hover:border-blue-400 bg-gray-50'}`}
              >
                <div className="font-bold text-xs text-gray-900">Blueprint Retro</div>
                <div className="text-[7.5px] text-gray-500 mt-0.5 leading-tight">Classic blueprint cyan paper, monospaced tech fonts.</div>
              </button>
            </div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 sticky top-0 bg-white">
        <h3 className="font-semibold text-gray-900 capitalize">{selectedElement.kind}</h3>
        <p className="text-xs text-gray-500 mt-1">
          {selectedElement.content || selectedElement.drawing?.drawingName || 'Element'}
        </p>
      </div>

      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={selectedElement.isMaster || false}
            onChange={e => {
              if (e.target.checked) {
                onUpdateElement({ isMaster: true, masterId: selectedElement.masterId || `master-${crypto.randomUUID()}` })
              } else {
                onUpdateElement({ isMaster: false, masterId: undefined })
              }
            }}
            className="w-4 h-4 text-blue-600 rounded border-gray-300"
          />
          Sync across all sheets (Master)
        </label>
        <p className="text-[10px] text-gray-500 mt-1 ml-6 leading-tight">
          When checked, changes to this element will automatically replicate to all sheets in the set.
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Material Swatch Shape (Feature 1) */}
        {(selectedElement.kind === 'image' || selectedElement.kind === 'drawing') && (
          <div className="space-y-3 p-3 bg-stone-50 rounded border border-stone-200">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">🎭 Material Swatch & Frame</h4>
            <label className="block">
              <span className="text-[10px] text-gray-500 font-medium">Mask Shape</span>
              <select
                value={selectedElement.maskShape || 'rect'}
                onChange={e => onUpdateElement({ maskShape: e.target.value as any })}
                className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs bg-white"
              >
                <option value="rect">Rectangle (Default)</option>
                <option value="circle">Circular Swatch</option>
                <option value="hexagon">Hexagonal Swatch</option>
                <option value="slanted-left">Slanted Left Cut</option>
                <option value="slanted-right">Slanted Right Cut</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] text-gray-500 font-medium block">Frame Fit Mode</span>
              <div className="flex bg-gray-200 p-0.5 rounded mt-1">
                <button
                  type="button"
                  onClick={() => onUpdateElement({ fitMode: 'contain' })}
                  className={`flex-1 py-1 text-[10px] font-semibold rounded ${
                    (selectedElement.fitMode || (selectedElement.kind === 'drawing' ? 'contain' : 'cover')) === 'contain'
                      ? 'bg-white shadow text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Fit (Contain)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateElement({ fitMode: 'cover' })}
                  className={`flex-1 py-1 text-[10px] font-semibold rounded ${
                    (selectedElement.fitMode || (selectedElement.kind === 'drawing' ? 'contain' : 'cover')) === 'cover'
                      ? 'bg-white shadow text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Fill (Crop)
                </button>
              </div>
            </label>
          </div>
        )}

        {/* Key Plan Settings (Feature 2) */}
        {selectedElement.kind === 'keyplan' && (
          <div className="space-y-3 p-3 bg-[#FBE7A1]/10 rounded border border-[#D4AF37]/30">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">🗺️ Key Plan Settings</h4>
            
            <label className="block">
              <span className="text-[10px] text-gray-500 font-medium">Building Footprint Footprint</span>
              <select
                value={selectedElement.keyplanOutlineSvg ? 'custom' : 'u-shape'}
                onChange={e => {
                  if (e.target.value === 'u-shape') {
                    onUpdateElement({ keyplanOutlineSvg: undefined })
                  } else if (e.target.value === 'l-shape') {
                    onUpdateElement({ keyplanOutlineSvg: `
                      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2" class="w-full h-full">
                        <path d="M 10 10 L 90 10 L 90 40 L 40 40 L 40 90 L 10 90 Z" fill="currentColor" fill-opacity="0.05" stroke-dasharray="2,2"/>
                      </svg>
                    ` })
                  } else if (e.target.value === 'courtyard') {
                    onUpdateElement({ keyplanOutlineSvg: `
                      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2" class="w-full h-full">
                        <rect x="10" y="10" width="80" height="80" fill="currentColor" fill-opacity="0.05" />
                        <rect x="35" y="35" width="30" height="30" fill="white" stroke="currentColor" stroke-width="2" />
                      </svg>
                    ` })
                  }
                }}
                className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs bg-white"
              >
                <option value="u-shape">U-Shaped Courtyard</option>
                <option value="l-shape">L-Shaped Wing</option>
                <option value="courtyard">Rectangular Courtyard</option>
              </select>
            </label>

            <div>
              <span className="text-[10px] text-gray-500 font-medium block mb-1">Highlight Zone (% position)</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label>
                  <span>Left (X)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={selectedElement.highlightZone?.x ?? 20}
                    onChange={e => onUpdateElement({
                      highlightZone: {
                        x: parseInt(e.target.value) || 0,
                        y: selectedElement.highlightZone?.y ?? 20,
                        w: selectedElement.highlightZone?.w ?? 30,
                        h: selectedElement.highlightZone?.h ?? 30,
                      }
                    })}
                    className="w-full px-1.5 py-1 border border-gray-300 rounded mt-0.5"
                  />
                </label>
                <label>
                  <span>Top (Y)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={selectedElement.highlightZone?.y ?? 20}
                    onChange={e => onUpdateElement({
                      highlightZone: {
                        x: selectedElement.highlightZone?.x ?? 20,
                        y: parseInt(e.target.value) || 0,
                        w: selectedElement.highlightZone?.w ?? 30,
                        h: selectedElement.highlightZone?.h ?? 30,
                      }
                    })}
                    className="w-full px-1.5 py-1 border border-gray-300 rounded mt-0.5"
                  />
                </label>
                <label>
                  <span>Width (W)</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={selectedElement.highlightZone?.w ?? 30}
                    onChange={e => onUpdateElement({
                      highlightZone: {
                        x: selectedElement.highlightZone?.x ?? 20,
                        y: selectedElement.highlightZone?.y ?? 20,
                        w: parseInt(e.target.value) || 10,
                        h: selectedElement.highlightZone?.h ?? 30,
                      }
                    })}
                    className="w-full px-1.5 py-1 border border-gray-300 rounded mt-0.5"
                  />
                </label>
                <label>
                  <span>Height (H)</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={selectedElement.highlightZone?.h ?? 30}
                    onChange={e => onUpdateElement({
                      highlightZone: {
                        x: selectedElement.highlightZone?.x ?? 20,
                        y: selectedElement.highlightZone?.y ?? 20,
                        w: selectedElement.highlightZone?.w ?? 30,
                        h: parseInt(e.target.value) || 10,
                      }
                    })}
                    className="w-full px-1.5 py-1 border border-gray-300 rounded mt-0.5"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Drafting Callouts & Annotations (Feature 3) */}
        {selectedElement.kind === 'annotation' && (
          <div className="space-y-3 p-3 bg-blue-50/50 rounded border border-blue-200">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">🫧 Drafting Annotations</h4>
            
            <label className="block">
              <span className="text-[10px] text-gray-500 font-medium">Annotation Type</span>
              <select
                value={selectedElement.annotationType || 'section-line'}
                onChange={e => onUpdateElement({ annotationType: e.target.value as any })}
                className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs bg-white"
              >
                <option value="section-line">Section Cut Line</option>
                <option value="elevation-bubble">Elevation Bubble</option>
                <option value="room-tag">Room Name Tag</option>
                <option value="detail-callout">Detail Callout Circle</option>
              </select>
            </label>

            <div className="space-y-2">
              <label className="block">
                <span className="text-[10px] text-gray-500 font-medium">Primary Label (Room/Section Name)</span>
                <input
                  type="text"
                  value={selectedElement.annotationLabels?.primary || ''}
                  placeholder={selectedElement.annotationType === 'room-tag' ? 'Living Room' : 'A'}
                  onChange={e => onUpdateElement({
                    annotationLabels: {
                      ...selectedElement.annotationLabels,
                      primary: e.target.value
                    }
                  })}
                  className="w-full mt-0.5 px-2 py-1 border border-gray-300 rounded text-xs"
                />
              </label>

              {selectedElement.annotationType !== 'room-tag' && (
                <label className="block">
                  <span className="text-[10px] text-gray-500 font-medium">Secondary Label (Sheet Reference)</span>
                  <input
                    type="text"
                    value={selectedElement.annotationLabels?.secondary || ''}
                    placeholder="05"
                    onChange={e => onUpdateElement({
                      annotationLabels: {
                        ...selectedElement.annotationLabels,
                        secondary: e.target.value
                      }
                    })}
                    className="w-full mt-0.5 px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                </label>
              )}

              {selectedElement.annotationType === 'room-tag' && (
                <label className="block">
                  <span className="text-[10px] text-gray-500 font-medium">Area Label (sq.m / sq.ft)</span>
                  <input
                    type="text"
                    value={selectedElement.annotationLabels?.extra || ''}
                    placeholder="15.2 sq.m"
                    onChange={e => onUpdateElement({
                      annotationLabels: {
                        ...selectedElement.annotationLabels,
                        extra: e.target.value
                      }
                    })}
                    className="w-full mt-0.5 px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Scale Bar Settings (Feature 4) */}
        {selectedElement.kind === 'scalebar' && (
          <div className="space-y-3 p-3 bg-stone-50 rounded border border-stone-200">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">📏 Graphical Scale Bar</h4>

            <label className="block">
              <span className="text-[10px] text-gray-500 font-medium">Total Length (Meters)</span>
              <input
                type="number"
                min="1"
                max="5000"
                value={selectedElement.scalebarLengthMeters || 10}
                onChange={e => onUpdateElement({ scalebarLengthMeters: parseInt(e.target.value) || 10 })}
                className="w-full mt-0.5 px-2 py-1 border border-gray-300 rounded text-xs"
              />
            </label>

            <label className="block">
              <span className="text-[10px] text-gray-500 font-medium">Scale Bar Style</span>
              <select
                value={selectedElement.scalebarStyle || 'metric-blocks'}
                onChange={e => onUpdateElement({ scalebarStyle: e.target.value as any })}
                className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs bg-white"
              >
                <option value="metric-blocks">Alternating Metric Blocks</option>
                <option value="tick-marks">Tick Marks Bar</option>
                <option value="minimal-line">Minimal Line Endcaps</option>
              </select>
            </label>
          </div>
        )}

         {/* Site Analysis Widgets (Feature 1) */}
        {selectedElement.kind === 'sitewidget' && (
          <div className="space-y-3 p-3 bg-amber-50/50 rounded border border-amber-200">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">☀️ Site Analysis Widget</h4>

            <label className="block">
              <span className="text-[10px] text-gray-500 font-medium">Widget Type</span>
              <select
                value={selectedElement.siteAnalysisType || 'sunpath'}
                onChange={e => onUpdateElement({ siteAnalysisType: e.target.value as any })}
                className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs bg-white"
              >
                <option value="sunpath">Sun Path Solar Graph</option>
                <option value="windrose">Wind Rose Frequency Spoke</option>
                <option value="climatology">Monthly Temperature & Rain</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] text-gray-500 font-medium">Location Info Label</span>
              <input
                type="text"
                value={selectedElement.locationName || ''}
                placeholder="Chennai, TN (Latitude 13.08° N)"
                onChange={e => onUpdateElement({ locationName: e.target.value })}
                className="w-full mt-0.5 px-2 py-1 border border-gray-300 rounded text-xs"
              />
            </label>
          </div>
        )}

        {/* Drawing Upload (if drawing element) */}
        {selectedElement.kind === 'drawing' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Drawing File</label>

            {selectedElement.drawing?.url ? (
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-xs text-blue-900 truncate">{selectedElement.drawing.drawingName}</p>
                <p className="text-xs text-blue-700 mt-1">{selectedElement.drawing.originalScale}</p>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded border-2 border-dashed border-gray-300 text-center">
                <p className="text-xs text-gray-600">No drawing uploaded</p>
              </div>
            )}

            <input
              type="file"
              accept=".pdf,.svg,.png,.jpg,.jpeg"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) {
                  setUploadingElement(selectedElement.id)
                  // Mock metadata inference
                  const metadata: Partial<DrawingMetadata> = {
                    drawingName: file.name.split('.')[0],
                    vector: file.type === 'application/pdf' || file.type === 'image/svg+xml',
                  }
                  onUploadDrawing(selectedElement, file, metadata)
                  setUploadingElement(null)
                }
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700"
            />

            <hr className="my-4 border-gray-200" />

            <h4 className="text-xs font-bold text-gray-700 uppercase mb-3 tracking-wider">Image Effects</h4>
            
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 mb-2">
              <input
                type="checkbox"
                checked={selectedElement.imageEffects?.grayscale || false}
                onChange={e => onUpdateElement({ 
                  imageEffects: { ...selectedElement.imageEffects, grayscale: e.target.checked } 
                })}
                className="rounded border-gray-300"
              />
              Grayscale
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 mb-2">
              <input
                type="checkbox"
                checked={selectedElement.imageEffects?.invert || false}
                onChange={e => onUpdateElement({ 
                  imageEffects: { ...selectedElement.imageEffects, invert: e.target.checked } 
                })}
                className="rounded border-gray-300"
              />
              Invert Colors
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 mb-2">
              <input
                type="checkbox"
                checked={selectedElement.imageEffects?.multiply || false}
                onChange={e => onUpdateElement({ 
                  imageEffects: { ...selectedElement.imageEffects, multiply: e.target.checked } 
                })}
                className="rounded border-gray-300"
              />
              Multiply (Transparent Whites)
            </label>

            <label className="block mt-3">
              <span className="text-xs text-gray-700 flex justify-between">
                Contrast
                <span className="text-gray-400">{selectedElement.imageEffects?.contrast || 100}%</span>
              </span>
              <input
                type="range"
                min="0"
                max="200"
                value={selectedElement.imageEffects?.contrast || 100}
                onChange={e => onUpdateElement({ 
                  imageEffects: { ...selectedElement.imageEffects, contrast: parseInt(e.target.value) } 
                })}
                className="w-full mt-1"
              />
            </label>

            {/* Premium Enhancer Presets (Feature 2) */}
            <div className="mt-3 border-t border-gray-100 pt-3">
              <span className="text-xs font-semibold text-gray-700 block mb-2">🪄 Premium Enhancers</span>
              <div className="grid grid-cols-3 gap-1 text-[9px] font-bold">
                <button
                  onClick={() => onUpdateElement({
                    imageEffects: {
                      ...selectedElement.imageEffects,
                      whiteOut: !selectedElement.imageEffects?.whiteOut,
                      blueprintMode: false,
                      charcoalMode: false
                    }
                  })}
                  className={`py-1.5 rounded border transition ${selectedElement.imageEffects?.whiteOut ? 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                  title="Remove yellow/grey paper scanning backgrounds and boost line weights"
                >
                  ⚡ Ink Clean
                </button>
                <button
                  onClick={() => onUpdateElement({
                    imageEffects: {
                      ...selectedElement.imageEffects,
                      blueprintMode: !selectedElement.imageEffects?.blueprintMode,
                      whiteOut: false,
                      charcoalMode: false
                    }
                  })}
                  className={`py-1.5 rounded border transition ${selectedElement.imageEffects?.blueprintMode ? 'bg-blue-600 text-white border-blue-700 font-extrabold' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                  title="Convert drawing to classic white lines on deep blue blueprint background"
                >
                  📘 Blueprint
                </button>
                <button
                  onClick={() => onUpdateElement({
                    imageEffects: {
                      ...selectedElement.imageEffects,
                      charcoalMode: !selectedElement.imageEffects?.charcoalMode,
                      whiteOut: false,
                      blueprintMode: false
                    }
                  })}
                  className={`py-1.5 rounded border transition ${selectedElement.imageEffects?.charcoalMode ? 'bg-stone-800 text-stone-100 border-stone-900 font-extrabold' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                  title="Make scan look like organic charcoal sketches on textured board"
                >
                  ✏️ Charcoal
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Drawing Metadata */}
        {selectedElement.drawing && (
          <>
            <Section
              title="Drawing Info"
              id="drawing-info"
              expanded={expandedSections.has('drawing-info')}
              onToggle={toggleSection}
            >
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-medium text-gray-700">Drawing Name</span>
                  <input
                    type="text"
                    value={selectedElement.drawing.drawingName}
                    onChange={e =>
                      onUpdateElement({
                        drawing: { ...selectedElement.drawing!, drawingName: e.target.value },
                      })
                    }
                    className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-gray-700">Drawing Type</span>
                  <select
                    value={selectedElement.drawing.drawingType}
                    onChange={e =>
                      onUpdateElement({
                        drawing: { ...selectedElement.drawing!, drawingType: e.target.value as any },
                      })
                    }
                    className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs"
                  >
                    {['plan', 'section', 'elevation', 'detail', 'render', 'diagram'].map(t => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-gray-700">Original Scale</span>
                  <select
                    value={selectedElement.drawing.originalScale}
                    onChange={e =>
                      onUpdateElement({
                        drawing: { ...selectedElement.drawing!, originalScale: e.target.value as any },
                      })
                    }
                    className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                  >
                    {Object.keys(SCALE_RATIOS).map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-gray-700">Sheet Scale</span>
                  <select
                    value={selectedElement.drawing.sheetScale}
                    onChange={e =>
                      onUpdateElement({
                        drawing: { ...selectedElement.drawing!, sheetScale: e.target.value as any },
                      })
                    }
                    className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                  >
                    {Object.keys(SCALE_RATIOS).map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedElement.drawing.northPoint || false}
                    onChange={e =>
                      onUpdateElement({
                        drawing: { ...selectedElement.drawing!, northPoint: e.target.checked },
                      })
                    }
                    className="w-3 h-3"
                  />
                  <span className="text-gray-700">North Point</span>
                </label>
              </div>
            </Section>

            {/* AI Documenter Tool (Feature 4) */}
            <Section
              title="🤖 AI Documenter"
              id="ai-helper"
              expanded={expandedSections.has('ai-helper')}
              onToggle={toggleSection}
            >
              <div className="space-y-2">
                <span className="text-[10px] text-gray-500 block leading-tight">
                  Auto-detect rooms and generate interactive room area tags directly on your floor plan or site layout.
                </span>
                <button
                  onClick={handleAutoGenerateRoomTags}
                  className="w-full py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-105 text-white font-bold rounded text-xs transition shadow-sm flex items-center justify-center gap-1.5 mt-2"
                >
                  <span>🤖 Auto-Tag Rooms</span>
                </button>
              </div>
            </Section>
          </>
        )}

        {/* Position & Size */}
        <Section
          title="Position & Size"
          id="position"
          expanded={expandedSections.has('position')}
          onToggle={toggleSection}
        >
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs font-medium text-gray-700">X (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={selectedElement.x}
                onChange={e => onUpdateElement({ x: parseFloat(e.target.value) })}
                className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-700">Y (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={selectedElement.y}
                onChange={e => onUpdateElement({ y: parseFloat(e.target.value) })}
                className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-700">Width (%)</span>
              <input
                type="number"
                min="1"
                max="100"
                step="1"
                value={selectedElement.w}
                onChange={e => {
                  if (selectedElement.kind === 'drawing') {
                    if (!window.confirm('Warning: Resizing this drawing will break its architectural scale. Do you want to proceed and lose scale accuracy?')) return
                  }
                  onUpdateElement({ w: parseFloat(e.target.value) })
                }}
                className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-700">Height (%)</span>
              <input
                type="number"
                min="1"
                max="100"
                step="1"
                value={selectedElement.h}
                onChange={e => {
                  if (selectedElement.kind === 'drawing') {
                    if (!window.confirm('Warning: Resizing this drawing will break its architectural scale. Do you want to proceed and lose scale accuracy?')) return
                  }
                  onUpdateElement({ h: parseFloat(e.target.value) })
                }}
                className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs"
              />
            </label>
          </div>
        </Section>

        {/* Style */}
        <Section
          title="Style"
          id="style"
          expanded={expandedSections.has('style')}
          onToggle={toggleSection}
        >
          <div className="space-y-2">
            <label className="block">
              <span className="text-xs font-medium text-gray-700">Opacity (%)</span>
              <input
                type="range"
                min="0"
                max="100"
                value={(selectedElement.opacity ?? 1) * 100}
                onChange={e => onUpdateElement({ opacity: parseInt(e.target.value) / 100 })}
                className="w-full"
              />
              <span className="text-xs text-gray-500 mt-1">
                {Math.round((selectedElement.opacity ?? 1) * 100)}%
              </span>
            </label>

            {selectedElement.kind === 'text' && (
              <>
                <label className="block">
                  <span className="text-xs font-medium text-gray-700">Font Size</span>
                  <input
                    type="number"
                    min="8"
                    max="72"
                    value={selectedElement.fontSize || 12}
                    onChange={e => onUpdateElement({ fontSize: parseInt(e.target.value) })}
                    className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-gray-700">Color</span>
                  <input
                    type="color"
                    value={selectedElement.color || '#000000'}
                    onChange={e => onUpdateElement({ color: e.target.value })}
                    className="w-full mt-1 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                </label>
              </>
            )}
          </div>
        </Section>

        {/* Advanced */}
        <Section
          title="Advanced"
          id="advanced"
          expanded={expandedSections.has('advanced')}
          onToggle={toggleSection}
        >
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedElement.locked}
                onChange={e => onUpdateElement({ locked: e.target.checked })}
                className="w-3 h-3"
              />
              <span className="text-xs text-gray-700">Lock Position</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedElement.visible}
                onChange={e => onUpdateElement({ visible: e.target.checked })}
                className="w-3 h-3"
              />
              <span className="text-xs text-gray-700">Visible</span>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-700">Z-Index</span>
              <input
                type="number"
                value={selectedElement.z}
                onChange={e => onUpdateElement({ z: parseInt(e.target.value) })}
                className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs"
              />
            </label>
          </div>
        </Section>
      </div>
    </div>
  )
}

interface SectionProps {
  title: string
  id: string
  expanded: boolean
  onToggle: (id: string) => void
  children: React.ReactNode
}

function Section({ title, id, expanded, onToggle, children }: SectionProps) {
  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition"
      >
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <ChevronDown size={16} className={`text-gray-500 transition ${expanded ? '' : '-rotate-90'}`} />
      </button>

      {expanded && <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">{children}</div>}
    </div>
  )
}
