import React, { useState, useEffect, useRef } from 'react'
import {
  Maximize2,
  Minimize2,
  Copy,
  Trash2,
  Plus,
  FileDown,
  Sparkles,
  Layers,
  LayoutGrid,
  RotateCw,
  Eye,
  EyeOff,
  ChevronRight,
  Move,
  Type,
  Image as ImageIcon,
  Check,
  Grid,
  Sliders,
  Settings,
  BookOpen
} from 'lucide-react'
import type { SheetSet, Sheet, SheetElement } from './sheetSetTypes'
import { TitleBlockRenderer } from './TitleBlockEngine'
import { SHEET_SIZES, mmToPx } from './sheetSetTypes'

interface InDesignCanvaHybridEngineProps {
  sheetSet: SheetSet
  currentSheetId: string
  onUpdateSheetSet: (updates: Partial<SheetSet>) => void
  onUpdateSheet: (sheetId: string, updates: Partial<Sheet>) => void
  onAddSheet: (title?: string) => void
  onDeleteSheet: (sheetId: string) => void
  onSelectSheet: (sheetId: string) => void
  onExportPdf: () => void
}

interface CyanGuide {
  id: string
  type: 'h' | 'v'
  posPercent: number // 0-100% of sheet
}

export const InDesignCanvaHybridEngine: React.FC<InDesignCanvaHybridEngineProps> = ({
  sheetSet,
  currentSheetId,
  onUpdateSheetSet,
  onUpdateSheet,
  onAddSheet,
  onDeleteSheet,
  onSelectSheet,
  onExportPdf,
}) => {
  const [selectedElementId, setSelectedElementId] = useState<string>('')
  const [zoom, setZoom] = useState<number>(75)
  const [screenMode, setScreenMode] = useState<'normal' | 'preview'>('normal') // InDesign W-key toggle
  const [cyanGuides, setCyanGuides] = useState<CyanGuide[]>([
    { id: 'g1', type: 'v', posPercent: 10 },
    { id: 'g2', type: 'v', posPercent: 90 },
    { id: 'g3', type: 'h', posPercent: 15 },
  ])

  const [activePanel, setActivePanel] = useState<'pages' | 'styles' | 'layers'>('pages')
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [draggingGuideId, setDraggingGuideId] = useState<string | null>(null)

  // Find active sheet
  const activeSheet = sheetSet.sheets.find(s => s.id === currentSheetId) || sheetSet.sheets[0]
  const selectedElement = activeSheet?.elements.find(e => e.id === selectedElementId)

  // Paper dimension math
  const pageSize = SHEET_SIZES[sheetSet.sheetSize as keyof typeof SHEET_SIZES] || SHEET_SIZES.A1
  const isPortrait = sheetSet.orientation === 'portrait'
  const sheetWidthMm = isPortrait ? pageSize.width : pageSize.height
  const sheetHeightMm = isPortrait ? pageSize.height : pageSize.width
  const sheetWidthPx = mmToPx(sheetWidthMm) * (zoom / 100)
  const sheetHeightPx = mmToPx(sheetHeightMm) * (zoom / 100)

  // Keyboard shortcut listener (W key preview toggle, Delete, Esc, Ctrl+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing inside an input/textarea
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return

      // InDesign W-Key Screen Mode Toggle
      if (e.key.toLowerCase() === 'w') {
        e.preventDefault()
        setScreenMode(prev => prev === 'normal' ? 'preview' : 'normal')
        return
      }

      if (selectedElementId && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault()
        handleDeleteSelectedElement()
        return
      }

      if (selectedElementId && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        handleDuplicateSelectedElement()
        return
      }

      if (e.key === 'Escape') {
        setSelectedElementId('')
        setEditingTextId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElementId, screenMode])

  // Element updates
  const handleUpdateSelectedElement = (updates: Partial<SheetElement>) => {
    if (!activeSheet || !selectedElementId) return
    onUpdateSheet(activeSheet.id, {
      elements: activeSheet.elements.map(e => e.id === selectedElementId ? { ...e, ...updates } : e)
    })
  }

  const handleDeleteSelectedElement = () => {
    if (!activeSheet || !selectedElementId) return
    onUpdateSheet(activeSheet.id, {
      elements: activeSheet.elements.filter(e => e.id !== selectedElementId)
    })
    setSelectedElementId('')
  }

  const handleDuplicateSelectedElement = () => {
    if (!activeSheet || !selectedElement) return
    const dup: SheetElement = {
      ...selectedElement,
      id: `elem-${Date.now()}`,
      x: Math.min(90, selectedElement.x + 4),
      y: Math.min(90, selectedElement.y + 4),
      z: (selectedElement.z || 0) + 1
    }
    onUpdateSheet(activeSheet.id, {
      elements: [...activeSheet.elements, dup]
    })
    setSelectedElementId(dup.id)
  }

  // Cyan Guide handlers
  const handleAddCyanGuide = (type: 'h' | 'v') => {
    const newGuide: CyanGuide = {
      id: `guide-${Date.now()}`,
      type,
      posPercent: 50
    }
    setCyanGuides(prev => [...prev, newGuide])
  }

  return (
    <div className="flex-1 bg-slate-900 text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. ADOBE INDESIGN TOP CONTROL BAR */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center gap-3 text-xs shrink-0 shadow-md">
        {/* Reference Point Picker Matrix (9-point anchor) */}
        <div className="grid grid-cols-3 gap-0.5 w-6 h-6 p-0.5 bg-slate-900 border border-slate-600 rounded">
          {[1,2,3,4,5,6,7,8,9].map(pt => (
            <div key={pt} className={`w-1.5 h-1.5 rounded-full ${pt === 5 ? 'bg-cyan-400' : 'bg-slate-600'}`} />
          ))}
        </div>

        <div className="h-5 w-px bg-slate-700 mx-1" />

        {/* Selected Element Position & Size Transform Inputs */}
        {selectedElement ? (
          <div className="flex items-center gap-3 flex-1 overflow-x-auto">
            {/* X Position */}
            <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded border border-slate-700">
              <span className="text-slate-400 font-mono font-bold">X:</span>
              <input
                type="number"
                value={Math.round((selectedElement.x / 100) * sheetWidthMm)}
                onChange={e => {
                  const valMm = parseFloat(e.target.value) || 0
                  handleUpdateSelectedElement({ x: (valMm / sheetWidthMm) * 100 })
                }}
                className="w-12 bg-transparent text-cyan-300 font-mono font-bold text-xs focus:outline-none"
              />
              <span className="text-slate-500 text-[10px]">mm</span>
            </div>

            {/* Y Position */}
            <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded border border-slate-700">
              <span className="text-slate-400 font-mono font-bold">Y:</span>
              <input
                type="number"
                value={Math.round((selectedElement.y / 100) * sheetHeightMm)}
                onChange={e => {
                  const valMm = parseFloat(e.target.value) || 0
                  handleUpdateSelectedElement({ y: (valMm / sheetHeightMm) * 100 })
                }}
                className="w-12 bg-transparent text-cyan-300 font-mono font-bold text-xs focus:outline-none"
              />
              <span className="text-slate-500 text-[10px]">mm</span>
            </div>

            {/* Width */}
            <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded border border-slate-700">
              <span className="text-slate-400 font-mono font-bold">W:</span>
              <input
                type="number"
                value={Math.round((selectedElement.w / 100) * sheetWidthMm)}
                onChange={e => {
                  const valMm = parseFloat(e.target.value) || 10
                  handleUpdateSelectedElement({ w: (valMm / sheetWidthMm) * 100 })
                }}
                className="w-12 bg-transparent text-cyan-300 font-mono font-bold text-xs focus:outline-none"
              />
              <span className="text-slate-500 text-[10px]">mm</span>
            </div>

            {/* Height */}
            <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded border border-slate-700">
              <span className="text-slate-400 font-mono font-bold">H:</span>
              <input
                type="number"
                value={Math.round((selectedElement.h / 100) * sheetHeightMm)}
                onChange={e => {
                  const valMm = parseFloat(e.target.value) || 10
                  handleUpdateSelectedElement({ h: (valMm / sheetHeightMm) * 100 })
                }}
                className="w-12 bg-transparent text-cyan-300 font-mono font-bold text-xs focus:outline-none"
              />
              <span className="text-slate-500 text-[10px]">mm</span>
            </div>

            <div className="h-5 w-px bg-slate-700 mx-1" />

            {/* Rotation Angle */}
            <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded border border-slate-700" title="Rotation Angle">
              <span className="text-slate-400">🔄</span>
              <input
                type="number"
                value={selectedElement.rotation || 0}
                onChange={e => handleUpdateSelectedElement({ rotation: parseInt(e.target.value) || 0 })}
                className="w-10 bg-transparent text-cyan-300 font-mono font-bold text-xs focus:outline-none"
              />
              <span className="text-slate-500">°</span>
            </div>

            {/* InDesign Graphic Frame Fitting Controls */}
            {(selectedElement.kind === 'image' || selectedElement.kind === 'drawing') && (
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded border border-slate-700">
                <button
                  onClick={() => handleUpdateSelectedElement({ fitMode: 'cover' })}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                    selectedElement.fitMode === 'cover' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-700'
                  }`}
                  title="Fill Frame Proportionally (Ctrl+Alt+Shift+C)"
                >
                  <span>🖼️ Fill Frame</span>
                </button>
                <button
                  onClick={() => handleUpdateSelectedElement({ fitMode: 'contain' })}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                    selectedElement.fitMode === 'contain' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-700'
                  }`}
                  title="Fit Content Proportionally"
                >
                  <span>📐 Fit Content</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-slate-400 flex-1">
            <span className="font-semibold text-slate-300">InDesign + Canva Hybrid Studio</span>
            <span className="text-[10px] bg-slate-700/60 px-2 py-0.5 rounded text-slate-300 font-mono">
              Sheet Size: {sheetSet.sheetSize.toUpperCase()} ({sheetWidthMm} x {sheetHeightMm} mm)
            </span>
          </div>
        )}

        {/* Right Header Actions (Cyan Guides & InDesign Screen Mode W Toggle) */}
        <div className="flex items-center gap-2">
          {/* Add Cyan Guides */}
          <button
            onClick={() => handleAddCyanGuide('v')}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-cyan-300 text-[10px] font-bold rounded border border-cyan-500/30 flex items-center gap-1"
            title="Add Vertical Cyan Guide Line"
          >
            <span>+ V-Guide</span>
          </button>
          <button
            onClick={() => handleAddCyanGuide('h')}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-cyan-300 text-[10px] font-bold rounded border border-cyan-500/30 flex items-center gap-1"
            title="Add Horizontal Cyan Guide Line"
          >
            <span>+ H-Guide</span>
          </button>

          <div className="h-5 w-px bg-slate-700 mx-1" />

          {/* InDesign Screen Mode W-Key Toggle Button */}
          <button
            onClick={() => setScreenMode(prev => prev === 'normal' ? 'preview' : 'normal')}
            className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 ${
              screenMode === 'preview'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Toggle Screen Mode (Press 'W' Key)"
          >
            {screenMode === 'preview' ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{screenMode === 'preview' ? 'Preview Mode (W)' : 'Normal Mode (W)'}</span>
          </button>

          <button
            onClick={onExportPdf}
            className="px-3.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-bold text-xs rounded shadow transition flex items-center gap-1"
          >
            <FileDown size={14} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. MAIN HYBRID CANVAS WORKSPACE WITH RULERS */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* CENTER SHEET BOARD CANVAS */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-10 bg-slate-950 relative">
          {activeSheet && (
            <div
              id={`sheet-canvas-${activeSheet.id}`}
              className="relative shadow-2xl transition-all duration-150"
              style={{
                width: `${sheetWidthPx}px`,
                height: `${sheetHeightPx}px`,
                backgroundColor: sheetSet.backgroundColor || '#ffffff',
                color: sheetSet.textColor || '#111111',
                fontFamily: sheetSet.fontFamily || 'Inter'
              }}
              onClick={() => setSelectedElementId('')}
            >
              {/* Title Block Engine */}
              <TitleBlockRenderer sheetSet={sheetSet} sheet={activeSheet} />

              {/* INDESIGN CYAN GUIDES (#00FFFF) — Rendered only in Normal Screen Mode */}
              {screenMode === 'normal' && cyanGuides.map(g => (
                <div
                  key={g.id}
                  className="absolute pointer-events-auto z-40 cursor-grab active:cursor-grabbing group"
                  style={{
                    ...(g.type === 'v' ? {
                      left: `${g.posPercent}%`,
                      top: 0,
                      bottom: 0,
                      width: '3px',
                      backgroundColor: '#00FFFF',
                      boxShadow: '0 0 4px rgba(0,255,255,0.8)'
                    } : {
                      top: `${g.posPercent}%`,
                      left: 0,
                      right: 0,
                      height: '3px',
                      backgroundColor: '#00FFFF',
                      boxShadow: '0 0 4px rgba(0,255,255,0.8)'
                    })
                  }}
                  title="InDesign Cyan Alignment Guide (Click to remove)"
                  onClick={(e) => {
                    e.stopPropagation()
                    setCyanGuides(prev => prev.filter(cg => cg.id !== g.id))
                  }}
                />
              ))}

              {/* INDESIGN MAGENTA MARGIN BOUNDS (#FF00FF) — Normal Mode */}
              {screenMode === 'normal' && (
                <div
                  className="absolute pointer-events-none border border-pink-500/50 z-30"
                  style={{
                    left: '5%',
                    right: '5%',
                    top: '5%',
                    bottom: '5%',
                    borderStyle: 'dashed'
                  }}
                />
              )}

              {/* ELEMENTS LAYER */}
              <div className="absolute inset-0 z-10 pointer-events-auto">
                {activeSheet.elements.map(elem => {
                  const isSelected = selectedElementId === elem.id
                  return (
                    <div
                      key={elem.id}
                      onClick={e => {
                        e.stopPropagation()
                        setSelectedElementId(elem.id)
                      }}
                      className={`absolute transition-all ${
                        isSelected ? 'ring-2 ring-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'hover:ring-1 hover:ring-cyan-400'
                      }`}
                      style={{
                        left: `${elem.x}%`,
                        top: `${elem.y}%`,
                        width: `${elem.w}%`,
                        height: `${elem.h}%`,
                        zIndex: elem.z,
                        opacity: elem.opacity ?? 1,
                        transform: `rotate(${elem.rotation || 0}deg)`,
                        transformOrigin: 'center center'
                      }}
                    >
                      {/* Element Content */}
                      {elem.kind === 'drawing' && elem.drawing && (
                        <img
                          src={elem.drawing.url}
                          alt={elem.drawing.drawingName}
                          className="w-full h-full"
                          style={{ objectFit: elem.fitMode || 'contain' }}
                        />
                      )}

                      {elem.kind === 'text' && (
                        editingTextId === elem.id ? (
                          <textarea
                            autoFocus
                            value={elem.content || ''}
                            onChange={e => handleUpdateSelectedElement({ content: e.target.value })}
                            onBlur={() => setEditingTextId(null)}
                            className="w-full h-full p-2 bg-white/95 border-2 border-purple-600 text-gray-900 rounded outline-none font-medium resize-none shadow-xl"
                            style={{
                              fontSize: `${elem.fontSize || 14}px`,
                              fontFamily: elem.fontFamily || 'Inter',
                              color: elem.color || '#000'
                            }}
                          />
                        ) : (
                          <div
                            onDoubleClick={() => setEditingTextId(elem.id)}
                            className="w-full h-full p-2 flex items-center text-gray-900 overflow-hidden cursor-pointer"
                            style={{
                              fontSize: `${elem.fontSize || 14}px`,
                              fontFamily: elem.fontFamily || 'Inter',
                              color: elem.color || '#000'
                            }}
                          >
                            {elem.content || 'Double click to edit text'}
                          </div>
                        )
                      )}

                      {/* Visual placeholder for diagrams or images without src */}
                      {(elem.kind === 'diagram' || elem.kind === 'image') && !elem.src && (
                        <div className="w-full h-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-500 text-xs font-semibold">
                          {elem.content || elem.kind.toUpperCase()}
                        </div>
                      )}

                      {/* CANVA SELECTION HANDLES & ROTATION STEM */}
                      {isSelected && screenMode === 'normal' && (
                        <>
                          {/* 4 Corner Circular Dots */}
                          {['nw', 'ne', 'sw', 'se'].map(pos => (
                            <div
                              key={pos}
                              className={`absolute w-3 h-3 bg-white border-2 border-purple-600 rounded-full shadow z-30 ${
                                pos.includes('n') ? '-top-1.5' : '-bottom-1.5'
                              } ${
                                pos.includes('w') ? '-left-1.5' : '-right-1.5'
                              }`}
                            />
                          ))}

                          {/* Rotation Stem Handle */}
                          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center z-30">
                            <div className="w-0.5 h-3 bg-purple-600" />
                            <div className="w-5 h-5 rounded-full bg-white border-2 border-purple-600 text-purple-700 shadow flex items-center justify-center text-[10px]">
                              🔄
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 3. INDESIGN RIGHT DOCK PANELS */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col overflow-hidden shrink-0 shadow-xl">
          {/* Panel Selector Tabs */}
          <div className="flex border-b border-slate-700 bg-slate-900/60 p-1 text-xs font-bold">
            <button
              onClick={() => setActivePanel('pages')}
              className={`flex-1 py-1.5 rounded text-center transition ${
                activePanel === 'pages' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              📄 Pages
            </button>
            <button
              onClick={() => setActivePanel('styles')}
              className={`flex-1 py-1.5 rounded text-center transition ${
                activePanel === 'styles' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              🎨 Style DNA
            </button>
            <button
              onClick={() => setActivePanel('layers')}
              className={`flex-1 py-1.5 rounded text-center transition ${
                activePanel === 'layers' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              🥞 Layers
            </button>
          </div>

          {/* PAGES PANEL (InDesign Master Pages & Sheet Thumbnails) */}
          {activePanel === 'pages' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Master Pages Header */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Master Pages</span>
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center">A</span>
                    <div>
                      <div className="text-xs font-bold text-white">A-Master Title Block</div>
                      <div className="text-[10px] text-slate-400">Propagates across all portfolio sheets</div>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-slate-700" />

              {/* Sheet Spreads Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Portfolio Sheets ({sheetSet.sheets.length})</span>
                  <button
                    onClick={() => onAddSheet(`Sheet ${sheetSet.sheets.length + 1}`)}
                    className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                  >
                    <Plus size={14} />
                    <span>Add Page</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {sheetSet.sheets.map((s, idx) => (
                    <div
                      key={s.id}
                      onClick={() => onSelectSheet(s.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition flex flex-col justify-between aspect-[1.414/1] ${
                        s.id === activeSheet?.id
                          ? 'bg-slate-900 border-purple-500 ring-2 ring-purple-500/40 shadow-lg'
                          : 'bg-slate-900/40 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-[10px] font-bold text-purple-300">Page {idx + 1}</div>
                      <div className="text-xs font-bold text-white truncate">{s.sheetName}</div>
                      <div className="text-[9px] text-slate-400">{s.elements.length} elements</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STYLE DNA PRESETS */}
          {activePanel === 'styles' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1-Click Office Theme Presets</span>
              
              {[
                { name: 'BIG (Bjarke Ingels)', color: '#FF4B4B', bg: '#F9F9FB', font: 'Outfit, sans-serif' },
                { name: 'Zaha Hadid Studio', color: '#8B5CF6', bg: '#0F172A', font: 'Space Grotesk, sans-serif' },
                { name: 'Foster + Partners', color: '#2563EB', bg: '#FFFFFF', font: 'Inter, sans-serif' },
                { name: 'Blueprint Tech', color: '#38BDF8', bg: '#0B2A66', font: 'Courier New, monospace' }
              ].map(st => (
                <button
                  key={st.name}
                  onClick={() => onUpdateSheetSet({ fontFamily: st.font, backgroundColor: st.bg, primaryColor: st.color })}
                  className="w-full p-3 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-900 hover:border-purple-500 text-left transition flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{st.name}</div>
                    <div className="text-[10px] text-slate-400">{st.font.split(',')[0]}</div>
                  </div>
                  <div className="w-5 h-5 rounded-full border border-slate-600" style={{ backgroundColor: st.color }} />
                </button>
              ))}
            </div>
          )}

          {/* LAYERS PANEL */}
          {activePanel === 'layers' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sheet Elements ({activeSheet?.elements.length || 0})</span>

              {activeSheet?.elements.map(el => (
                <div
                  key={el.id}
                  onClick={() => setSelectedElementId(el.id)}
                  className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition ${
                    selectedElementId === el.id ? 'bg-purple-600/20 border-purple-500 text-white' : 'bg-slate-900/40 border-slate-700 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <span className="font-semibold truncate max-w-[180px]">{el.content || el.kind.toUpperCase()}</span>
                  <span className="text-[10px] font-mono text-slate-500">Z: {el.z}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
