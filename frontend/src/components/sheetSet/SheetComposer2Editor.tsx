'use client'

/**
 * CosmoFolio — Sheet Composer 2.0 Studio Editor
 *
 * Canva + Figma + Apple architectural presentation sheet builder.
 * Radically simplified presentation board studio for architecture & interior design students.
 */

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Download,
  Save,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  Grid,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  Eye,
  Lock,
  Compass,
  FileText,
  Palette,
  Image as ImageIcon,
  Box,
  Layout,
  Tag,
  Maximize,
} from 'lucide-react'

import type { SheetSet, Sheet, SheetElement, SheetSize, ArchScale, ElementKind } from './sheetSetTypes'
import { SHEET_SIZES, mmToPx } from './sheetSetTypes'
import { ALL_BORDERS, filterBorders, getBorderById, type BorderCategory } from './borders/BorderLibrary'
import { VectorBorderOverlay } from './borders/VectorBorderOverlay'
import { MasterTitleBlock } from './borders/MasterTitleBlock'
import { ProjectStyleManager } from './ProjectStyleManager'
import { BlownUpDetailTool } from './tools/BlownUpDetailTool'
import { ScalebarGenerator } from './tools/ScalebarGenerator'
import { NORTH_POINTS } from './tools/NorthPointLibrary'
import { ENTOURAGE_ASSETS, calculateEntourageSheetBounds } from './tools/EntourageLibrary'
import { HATCH_PATTERNS } from './tools/HatchLibrary'
import { PLAN_THEMES } from './tools/MagicWandFill'
import { detectScaleMismatch } from './tools/ScaleEngine'

interface SheetComposer2EditorProps {
  initialSheetSet: SheetSet
  onSave?: (sheetSet: SheetSet) => void
  onExport?: (html: string, sheetSet: SheetSet) => void
  onClose?: () => void
}

export function SheetComposer2Editor({
  initialSheetSet,
  onSave,
  onExport,
  onClose,
}: SheetComposer2EditorProps) {
  const [sheetSet, setSheetSet] = useState<SheetSet>(initialSheetSet)
  const [selectedSheetId, setSelectedSheetId] = useState<string>(sheetSet.sheets[0]?.id || '')
  const [selectedElementId, setSelectedElementId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'templates' | 'borders' | 'entourage' | 'hatches' | 'symbols' | 'assets'>('borders')

  // Modals & Tools
  const [showStyleManager, setShowStyleManager] = useState<boolean>(false)
  const [showDetailTool, setShowDetailTool] = useState<boolean>(false)
  const [zoom, setZoom] = useState<number>(75)
  const [borderSearch, setBorderSearch] = useState<string>('')
  const [borderCategory, setBorderCategory] = useState<string>('all')
  const [isSaving, setIsSaving] = useState<boolean>(false)

  const currentSheet = sheetSet.sheets.find(s => s.id === selectedSheetId) || sheetSet.sheets[0]
  const selectedElement = currentSheet?.elements.find(e => e.id === selectedElementId) || null

  // Page Dimension Math
  const isPortrait = sheetSet.orientation === 'portrait'
  const spec = SHEET_SIZES[sheetSet.sheetSize as keyof typeof SHEET_SIZES] || SHEET_SIZES.A1
  const widthMm = isPortrait ? spec.width : spec.height
  const heightMm = isPortrait ? spec.height : spec.width
  const widthPx = mmToPx(widthMm) * (zoom / 100)
  const heightPx = mmToPx(heightMm) * (zoom / 100)

  // Auto-Save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSave) {
        setIsSaving(true)
        onSave(sheetSet)
        setTimeout(() => setIsSaving(false), 400)
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [sheetSet])

  const updateSheet = (sheetId: string, updates: Partial<Sheet>) => {
    setSheetSet(prev => ({
      ...prev,
      sheets: prev.sheets.map(s => (s.id === sheetId ? { ...s, ...updates } : s)),
    }))
  }

  const updateElement = (elementId: string, updates: Partial<SheetElement>) => {
    if (!currentSheet) return
    updateSheet(currentSheet.id, {
      elements: currentSheet.elements.map(e => (e.id === elementId ? { ...e, ...updates } : e)),
    })
  }

  const addElement = (newElem: SheetElement) => {
    if (!currentSheet) return
    updateSheet(currentSheet.id, {
      elements: [...currentSheet.elements, newElem],
    })
    setSelectedElementId(newElem.id)
  }

  const applyBorderToProject = (borderId: string) => {
    setSheetSet(prev => ({
      ...prev,
      borderId,
      projectStyle: prev.projectStyle ? { ...prev.projectStyle, borderId } : undefined,
      sheets: prev.sheets.map(s => ({ ...s, overrideBorderId: borderId })),
    }))
  }

  const bordersList = filterBorders(borderCategory, borderSearch)

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 select-none overflow-hidden font-sans">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP APP STUDIO TOOLBAR
          ───────────────────────────────────────────────────────────── */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-30">
        {/* Left Brand & Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Back to Dashboard"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-tight text-white text-base">CosmoFolio Sheet Composer 2.0</span>
              <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                PRO STUDIO
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {sheetSet.projectName} — <span className="text-amber-400">{sheetSet.sheetSize} {sheetSet.orientation}</span> ({sheetSet.sheets.length} Sheets)
            </div>
          </div>
        </div>

        {/* Center Canvas Zoom Controls */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
          <button onClick={() => setZoom(z => Math.max(30, z - 10))} className="text-slate-400 hover:text-white p-1">
            <ZoomOut size={15} />
          </button>
          <span className="text-xs font-mono font-bold text-slate-300 w-12 text-center">{zoom}%</span>
          <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="text-slate-400 hover:text-white p-1">
            <ZoomIn size={15} />
          </button>
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <button onClick={() => setZoom(75)} className="text-[11px] font-semibold text-slate-400 hover:text-amber-400">
            Fit
          </button>
        </div>

        {/* Right Master Actions */}
        <div className="flex items-center gap-3">
          {/* Master Project Style Engine Button */}
          <button
            onClick={() => setShowStyleManager(true)}
            className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black text-xs rounded-lg shadow-lg border border-amber-300/50 flex items-center gap-2 transition hover:scale-105"
          >
            <Sparkles size={15} />
            <span>Project Style Engine</span>
          </button>

          {/* Blown-Up Detail Tool */}
          {selectedElement && selectedElement.kind === 'drawing' && (
            <button
              onClick={() => setShowDetailTool(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs rounded-lg border border-cyan-500/40 flex items-center gap-1.5 transition"
            >
              <Maximize size={14} />
              <span>Blown-Up Detail</span>
            </button>
          )}

          {/* Export PDF Button */}
          <button
            onClick={() => {
              if (onExport) {
                const canvasNode = document.getElementById(`sheet-canvas-${currentSheet.id}`)
                if (canvasNode) onExport(canvasNode.outerHTML, sheetSet)
              }
            }}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-md flex items-center gap-2 transition"
          >
            <Download size={15} />
            <span>Export 300 DPI PDF</span>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN WORKSPACE: LEFT TABS + CENTER STAGE + RIGHT PROPERTY PANEL
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* LEFT TAB NAVIGATION BAR */}
        <aside className="w-16 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 space-y-4 shrink-0 z-20">
          {[
            { id: 'borders', label: 'Borders', icon: '🖼️' },
            { id: 'templates', label: 'Layouts', icon: '📋' },
            { id: 'entourage', label: 'Entourage', icon: '🌳' },
            { id: 'hatches', label: 'Hatches', icon: '🧱' },
            { id: 'symbols', label: 'North/Scale', icon: '🧭' },
            { id: 'assets', label: 'Drawings', icon: '📁' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-[9px] font-medium mt-0.5">{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* LEFT TABBED DRAWER (280px wide) */}
        <div className="w-72 bg-slate-900/95 border-r border-slate-800 flex flex-col overflow-hidden shrink-0 z-10 backdrop-blur-md">
          {/* TAB 1: 1000+ VECTOR BORDERS CATALOG */}
          {activeTab === 'borders' && (
            <div className="flex flex-col h-full p-4 space-y-3">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center justify-between">
                  <span>1,000+ Vector Borders</span>
                  <span className="text-[10px] text-amber-400 font-mono">{bordersList.length} Available</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Click any border to lock & auto-apply across your project.</p>
              </div>

              <input
                type="text"
                placeholder="Search border styles..."
                value={borderSearch}
                onChange={e => setBorderSearch(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs focus:outline-none focus:border-amber-500 text-white"
              />

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1">
                {['all', 'minimal', 'competition', 'jury', 'swiss', 'technical', 'dark', 'luxury'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setBorderCategory(cat)}
                    className={`px-2 py-0.5 text-[10px] rounded-full capitalize transition ${
                      borderCategory === cat ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Borders Grid */}
              <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2.5 pr-1">
                {bordersList.slice(0, 40).map(border => {
                  const isActive = (currentSheet.overrideBorderId || sheetSet.borderId) === border.id
                  return (
                    <div
                      key={border.id}
                      onClick={() => applyBorderToProject(border.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between h-24 ${
                        isActive
                          ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/40 shadow-md'
                          : 'border-slate-800 hover:border-slate-600 bg-slate-950'
                      }`}
                    >
                      <div className="text-[11px] font-bold text-white truncate">{border.name}</div>
                      <div className="flex items-center justify-between text-[9px] text-slate-400">
                        <span className="capitalize">{border.category}</span>
                        <span>{border.style.cornerStyle}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 2: TEMPLATES & LAYOUTS */}
          {activeTab === 'templates' && (
            <div className="flex flex-col h-full p-4 space-y-3">
              <h3 className="font-bold text-white text-sm">Presentation Board Layouts</h3>
              <p className="text-[11px] text-slate-400">Select multi-drawing layout grid for this sheet.</p>

              <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                {[
                  { name: '4-Elevation Grid', desc: '4 equal elevation viewports', cols: 2, rows: 2 },
                  { name: 'Hero Plan + 2 Sections', desc: 'Large plan hero + bottom sections', cols: 2, rows: 2 },
                  { name: 'Competition Board Grid', desc: '3x3 modular competition panel', cols: 3, rows: 3 },
                  { name: 'Thesis Jury Board', desc: 'Asymmetric layout for thesis review', cols: 3, rows: 2 },
                ].map((tmpl, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      updateSheet(currentSheet.id, {
                        gridEnabled: true,
                        gridType: 'modular',
                      })
                    }}
                    className="w-full p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition"
                  >
                    <div className="font-bold text-xs text-white">{tmpl.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{tmpl.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SCALE-AWARE ENTOURAGE LIBRARY */}
          {activeTab === 'entourage' && (
            <div className="flex flex-col h-full p-4 space-y-3">
              <h3 className="font-bold text-white text-sm">Scale-Aware Entourage</h3>
              <p className="text-[11px] text-slate-400">Auto-proportionately sized to drawing scale ($1:100, 1:50, 1:20$).</p>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {ENTOURAGE_ASSETS.map(asset => (
                  <div
                    key={asset.id}
                    onClick={() => {
                      const bounds = calculateEntourageSheetBounds(asset, '1:100', sheetSet.sheetSize)
                      addElement({
                        id: `elem-${Date.now()}`,
                        kind: 'image',
                        x: 35,
                        y: 35,
                        w: Math.max(8, bounds.widthPercent * 2),
                        h: Math.max(12, bounds.heightPercent * 2),
                        z: 50,
                        locked: false,
                        visible: true,
                        src: `data:image/svg+xml;utf8,${encodeURIComponent(asset.svgContent)}`,
                      })
                    }}
                    className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 rounded-xl cursor-pointer transition flex items-center gap-3"
                  >
                    <div
                      className="w-10 h-10 bg-slate-900 rounded flex items-center justify-center p-1 border border-slate-700"
                      dangerouslySetInnerHTML={{ __html: asset.svgContent }}
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{asset.name}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{asset.category} • {asset.realWorldHeightMm / 1000}m</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: HATCH LIBRARY */}
          {activeTab === 'hatches' && (
            <div className="flex flex-col h-full p-4 space-y-3">
              <h3 className="font-bold text-white text-sm">Vector Hatch Patterns</h3>
              <p className="text-[11px] text-slate-400">Architectural fills for walls, concrete, earth & glass.</p>

              <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto pr-1">
                {HATCH_PATTERNS.map(hatch => (
                  <div
                    key={hatch.id}
                    onClick={() => {
                      if (selectedElement) {
                        updateElement(selectedElement.id, {
                          bgColor: hatch.color,
                        })
                      }
                    }}
                    className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 rounded-xl cursor-pointer transition flex flex-col justify-between h-20"
                  >
                    <div className="w-full h-8 rounded border border-slate-700" style={{ backgroundColor: hatch.color }} />
                    <div className="text-[11px] font-bold text-white truncate mt-1">{hatch.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: NORTH POINTS & SCALE BARS */}
          {activeTab === 'symbols' && (
            <div className="flex flex-col h-full p-4 space-y-4">
              <h3 className="font-bold text-white text-sm">North Points & Scale Bars</h3>

              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Rotatable North Compass</div>
                {NORTH_POINTS.map(np => (
                  <div
                    key={np.id}
                    onClick={() => {
                      addElement({
                        id: `elem-${Date.now()}`,
                        kind: 'diagram',
                        x: 82,
                        y: 10,
                        w: 8,
                        h: 12,
                        z: 60,
                        locked: false,
                        visible: true,
                        src: `data:image/svg+xml;utf8,${encodeURIComponent(np.svgContent)}`,
                      })
                    }}
                    className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 rounded-xl cursor-pointer transition flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-slate-900 rounded p-1" dangerouslySetInnerHTML={{ __html: np.svgContent }} />
                    <div className="text-xs font-bold text-white">{np.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CENTER SHEET CANVAS STAGE */}
        <main className="flex-1 bg-slate-950 overflow-auto flex items-center justify-center p-8 relative">
          <div
            id={`sheet-canvas-${currentSheet.id}`}
            className="relative shadow-2xl transition-all duration-150"
            style={{
              width: `${widthPx}px`,
              height: `${heightPx}px`,
              backgroundColor: sheetSet.backgroundColor || '#FFFFFF',
              color: sheetSet.textColor || '#0F172A',
              fontFamily: sheetSet.fontFamily || 'Inter',
            }}
          >
            {/* PARAMETRIC 1000+ VECTOR BORDER OVERLAY */}
            <VectorBorderOverlay
              sheetSet={sheetSet}
              sheet={currentSheet}
              widthPx={widthPx}
              heightPx={heightPx}
            />

            {/* LIVE MASTER TITLE BLOCK */}
            <MasterTitleBlock
              sheetSet={sheetSet}
              sheet={currentSheet}
              widthPx={widthPx}
              heightPx={heightPx}
              onUpdateMetadata={updates => setSheetSet(prev => ({ ...prev, ...updates }))}
            />

            {/* CANVAS ELEMENTS LAYER */}
            <div className="absolute inset-0 z-10">
              {currentSheet.elements.map(el => {
                const isSelected = selectedElementId === el.id
                return (
                  <div
                    key={el.id}
                    onClick={e => {
                      e.stopPropagation()
                      setSelectedElementId(el.id)
                    }}
                    className={`absolute cursor-move transition-all ${
                      isSelected ? 'ring-2 ring-amber-500 shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'hover:ring-1 hover:ring-amber-300/50'
                    }`}
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: `${el.w}%`,
                      height: `${el.h}%`,
                      zIndex: el.z || 10,
                      opacity: el.opacity ?? 1,
                      transform: `rotate(${el.rotation || 0}deg)`,
                      backgroundColor: el.bgColor,
                    }}
                  >
                    {/* DRAWING / IMAGE */}
                    {(el.kind === 'drawing' || el.kind === 'image') && (
                      <div className="w-full h-full relative group">
                        <img
                          src={el.src || el.drawing?.url}
                          alt={el.drawing?.drawingName || 'Drawing'}
                          className="w-full h-full object-contain"
                        />
                        {/* Scale Badge */}
                        {el.drawing?.sheetScale && (
                          <div className="absolute bottom-2 left-2 bg-slate-900/90 text-amber-400 font-mono font-bold text-[9px] px-2 py-0.5 rounded backdrop-blur">
                            Scale {el.drawing.sheetScale}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </main>

        {/* RIGHT CONTEXTUAL PROPERTY INSPECTOR PANEL */}
        <aside className="w-80 bg-slate-900 border-l border-slate-800 p-5 flex flex-col space-y-6 overflow-y-auto shrink-0 z-20">
          <div>
            <h3 className="font-bold text-white text-sm">Sheet & Element Properties</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Scale ratio, position & drafting settings.</p>
          </div>

          {selectedElement ? (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  {selectedElement.kind.toUpperCase()} PROPERTIES
                </div>
                {selectedElement.drawing && (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Drawing Scale</label>
                    <select
                      value={selectedElement.drawing.sheetScale || '1:100'}
                      onChange={e => {
                        const newScale = e.target.value as ArchScale
                        updateElement(selectedElement.id, {
                          drawing: {
                            ...selectedElement.drawing!,
                            sheetScale: newScale,
                            scaleLabel: `Scale ${newScale}`,
                          },
                        })
                      }}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="1:1">1:1 (Full Size)</option>
                      <option value="1:5">1:5 (Fine Detail)</option>
                      <option value="1:10">1:10 (Detail)</option>
                      <option value="1:20">1:20 (Architectural Detail)</option>
                      <option value="1:50">1:50 (Room Plan / Section)</option>
                      <option value="1:100">1:100 (Floor Plan)</option>
                      <option value="1:200">1:200 (Site / Master Plan)</option>
                      <option value="1:500">1:500 (Urban Masterplan)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Dynamic Scalebar Preview */}
              {selectedElement.drawing && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-slate-300">Auto Scalebar</div>
                  <ScalebarGenerator scale={selectedElement.drawing.sheetScale || '1:100'} sheetSize={sheetSet.sheetSize} />
                </div>
              )}

              <button
                onClick={() => {
                  if (currentSheet) {
                    updateSheet(currentSheet.id, {
                      elements: currentSheet.elements.filter(e => e.id !== selectedElement.id),
                    })
                    setSelectedElementId('')
                  }
                }}
                className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-xs rounded-lg border border-red-500/30 transition flex items-center justify-center gap-2"
              >
                <Trash2 size={14} />
                <span>Delete Element</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-2">
                <div className="text-2xl">📐</div>
                <div className="text-xs font-bold text-white">No Element Selected</div>
                <div className="text-[11px] text-slate-400">Click any drawing on the canvas to adjust its scale, rotation, or vector hatch.</div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MASTER SYSTEM MODALS
          ───────────────────────────────────────────────────────────── */}
      {showStyleManager && (
        <ProjectStyleManager
          sheetSet={sheetSet}
          onApplyProjectStyle={updatedSet => setSheetSet(updatedSet)}
          onClose={() => setShowStyleManager(false)}
        />
      )}

      {showDetailTool && selectedElement && (
        <BlownUpDetailTool
          sourceElement={selectedElement}
          onCreateDetail={detailElem => addElement(detailElem as SheetElement)}
          onClose={() => setShowDetailTool(false)}
        />
      )}
    </div>
  )
}
