/**
 * Sheet Set Canvas
 *
 * Center editor rendering individual sheet with elements
 * Handles element selection, positioning, and drawing display
 */

import React, { useRef, useState } from 'react'
import { Grip, Trash2, Copy } from 'lucide-react'
import type { Sheet, SheetElement, SheetSet } from './sheetSetTypes'
import { SHEET_SIZES, mmToPx } from './sheetSetTypes'
import { generateScaleLabel } from './drawingScaleEngine'
import { TitleBlockRenderer } from './TitleBlockEngine'

const getClipPath = (shape?: string) => {
  if (shape === 'circle') return 'circle(50% at 50% 50%)'
  if (shape === 'hexagon') return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
  if (shape === 'slanted-left') return 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)'
  if (shape === 'slanted-right') return 'polygon(0% 0%, 85% 0%, 100% 100%, 15% 100%)'
  return undefined
}

interface SheetSetCanvasProps {
  sheet: Sheet
  nextSheet?: Sheet
  spreadMode?: boolean
  sheetSet: SheetSet
  selectedElementId: string | null
  onSelectElement: (id: string) => void
  onUpdateElement: (id: string, update: Partial<SheetElement>) => void
  onDeleteElement: (id: string) => void
  onDuplicateElement: (id: string) => void
  zoom: number
  onZoomChange: (zoom: number) => void
  gridEnabled: boolean
  snapEnabled: boolean
  onToggleGrid: () => void
  onToggleSnap: () => void
}

export function SheetSetCanvas({
  sheet,
  nextSheet,
  spreadMode,
  sheetSet,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  zoom,
  onZoomChange,
  gridEnabled,
  snapEnabled,
  onToggleGrid,
  onToggleSnap,
}: SheetSetCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [resizingId, setResizingId] = useState<string | null>(null)
  const [resizingHandle, setResizingHandle] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const [isSpaceDown, setIsSpaceDown] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && e.target === document.body) {
        e.preventDefault()
        setIsSpaceDown(true)
        return
      }

      if (selectedElementId && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
          return
        }
        e.preventDefault()
        
        const activeSheet = [sheet, nextSheet].find(s => s?.elements.some(el => el.id === selectedElementId))
        if (!activeSheet) return
        
        const element = activeSheet.elements.find(el => el.id === selectedElementId)
        if (!element || element.locked) return
        
        const nudgeAmt = e.shiftKey ? 2.0 : 0.5
        let newX = element.x
        let newY = element.y
        
        if (e.key === 'ArrowLeft') newX = Math.max(0, element.x - nudgeAmt)
        if (e.key === 'ArrowRight') newX = Math.min(100 - element.w, element.x + nudgeAmt)
        if (e.key === 'ArrowUp') newY = Math.max(0, element.y - nudgeAmt)
        if (e.key === 'ArrowDown') newY = Math.min(100 - element.h, element.y + nudgeAmt)
        
        onUpdateElement(element.id, { x: newX, y: newY })
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpaceDown(false)
        setIsPanning(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [selectedElementId, sheet, nextSheet, onUpdateElement])
  const pageSize = SHEET_SIZES[sheetSet.sheetSize as keyof typeof SHEET_SIZES]
  const isPortrait = sheetSet.orientation === 'portrait'
  const sheetWidth = isPortrait ? pageSize.width : pageSize.height
  const sheetHeight = isPortrait ? pageSize.height : pageSize.width
  const sheetWidthPx = mmToPx(sheetWidth) * (zoom / 100)
  const sheetHeightPx = mmToPx(sheetHeight) * (zoom / 100)

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (e.button !== 0 || isSpaceDown) return
    e.stopPropagation()
    setDraggingId(elementId)
    setDragStart({ x: e.clientX, y: e.clientY })
    onSelectElement(elementId)
  }

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (isSpaceDown || e.button === 1) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
    } else {
      onSelectElement('')
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -10 : 10
      onZoomChange(Math.min(200, Math.max(20, zoom + delta)))
    }
  }

  const handleResizeMouseDown = (e: React.MouseEvent, element: SheetElement, handle: string) => {
    e.stopPropagation()
    if (e.button !== 0) return
    if (element.kind === 'drawing') {
      const proceed = window.confirm('Warning: Resizing this drawing will break its architectural scale. Do you want to proceed and lose scale accuracy?')
      if (!proceed) return
    }
    setResizingId(element.id)
    setResizingHandle(handle)
    setDragStart({ x: e.clientX, y: e.clientY })
    onSelectElement(element.id)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && canvasRef.current) {
      const deltaX = e.clientX - panStart.x
      const deltaY = e.clientY - panStart.y
      canvasRef.current.scrollBy(-deltaX, -deltaY)
      setPanStart({ x: e.clientX, y: e.clientY })
      return
    }

    if ((!draggingId && !resizingId) || !canvasRef.current) return

    const id = draggingId || resizingId
    
    // Find element in either sheet
    const activeSheet = [sheet, nextSheet].find(s => s?.elements.some(el => el.id === id))
    if (!activeSheet) return

    const element = activeSheet.elements.find(el => el.id === id)
    if (!element || element.locked) return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    if (resizingId && resizingHandle) {
      let newX = element.x
      let newY = element.y
      let newW = element.w
      let newH = element.h

      const deltaWPct = (deltaX / sheetWidthPx) * 100
      const deltaHPct = (deltaY / sheetHeightPx) * 100

      if (resizingHandle.includes('e')) newW += deltaWPct
      if (resizingHandle.includes('w')) {
        newW -= deltaWPct
        newX += deltaWPct
      }
      if (resizingHandle.includes('s')) newH += deltaHPct
      if (resizingHandle.includes('n')) {
        newH -= deltaHPct
        newY += deltaHPct
      }

      // Constrain minimum size
      if (newW < 2) { newX -= (2 - newW); newW = 2; }
      if (newH < 2) { newY -= (2 - newH); newH = 2; }

      if (snapEnabled) {
        newW = Math.round(newW / 2) * 2
        newH = Math.round(newH / 2) * 2
        newX = Math.round(newX / 2) * 2
        newY = Math.round(newY / 2) * 2
      }
      onUpdateElement(element.id, { x: newX, y: newY, w: newW, h: newH })
    } else if (draggingId) {
      let newX = Math.max(0, Math.min(100 - element.w, element.x + (deltaX / sheetWidthPx) * 100))
      let newY = Math.max(0, Math.min(100 - element.h, element.y + (deltaY / sheetHeightPx) * 100))
      if (snapEnabled) {
        newX = Math.round(newX / 2) * 2
        newY = Math.round(newY / 2) * 2
      }
      onUpdateElement(element.id, { x: newX, y: newY })
    }
    
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setDraggingId(null)
    setResizingId(null)
    setResizingHandle(null)
    setIsPanning(false)
  }

  const renderSheetBoard = (currentSheet: Sheet, index: number) => {
    return (
      <div
        key={currentSheet.id}
        id={`sheet-canvas-${currentSheet.id}`}
        className="relative bg-white shadow-2xl shrink-0"
        style={{
          width: `${sheetWidthPx}px`,
          height: `${sheetHeightPx}px`,
          backgroundImage: gridEnabled
            ? `linear-gradient(90deg, #e5e7eb 1px, transparent 1px), linear-gradient(#e5e7eb 1px, transparent 1px)`
            : undefined,
          backgroundSize: gridEnabled ? '2% 2%' : undefined,
        }}
      >
        {/* Master Elements (Background) */}
        {currentSheet.background && currentSheet.background.visible !== false && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundColor: currentSheet.background.color,
              backgroundImage: currentSheet.background.image 
                ? `url(${currentSheet.background.image})` 
                : currentSheet.background.pattern === 'dots'
                ? 'radial-gradient(circle, currentColor 1px, transparent 1px)'
                : currentSheet.background.pattern === 'grid'
                ? 'linear-gradient(90deg, currentColor 1px, transparent 1px), linear-gradient(currentColor 1px, transparent 1px)'
                : currentSheet.background.pattern === 'lines'
                ? 'linear-gradient(currentColor 1px, transparent 1px)'
                : currentSheet.background.pattern === 'diagonal'
                ? 'repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)'
                : currentSheet.background.pattern === 'topographic'
                ? `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 100 Q 50 50, 100 100 T 200 100 M0 140 Q 50 90, 100 140 T 200 140 M0 60 Q 50 10, 100 60 T 200 60 M0 180 Q 50 130, 100 180 T 200 180 M0 20 Q 50 -30, 100 20 T 200 20' fill='none' stroke='currentColor' stroke-width='0.5'/%3E%3C/svg%3E")`
                : currentSheet.background.pattern === 'waves'
                ? `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q 25 0, 50 10 T 100 10' fill='none' stroke='currentColor' stroke-width='0.5'/%3E%3C/svg%3E")`
                : currentSheet.background.pattern === 'abstract-grid'
                ? `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 15 L20 25 M15 20 L25 20' fill='none' stroke='currentColor' stroke-width='0.5'/%3E%3C/svg%3E")`
                : undefined,
              backgroundSize: currentSheet.background.pattern === 'dots' 
                ? '20px 20px' 
                : currentSheet.background.pattern === 'grid'
                ? '40px 40px'
                : currentSheet.background.pattern === 'lines'
                ? '100% 20px'
                : currentSheet.background.pattern === 'diagonal'
                ? '10px 10px'
                : currentSheet.background.pattern === 'topographic'
                ? '200px 200px'
                : currentSheet.background.pattern === 'waves'
                ? '100px 20px'
                : currentSheet.background.pattern === 'abstract-grid'
                ? '40px 40px'
                : 'cover',
              opacity: currentSheet.background.opacity ?? 0.1,
              backgroundPosition: 'center',
              zIndex: 1,
              color: '#000',
            }}
          />
        )}

        {/* Dynamic Master Title Block */}
        <TitleBlockRenderer 
          sheetSet={sheetSet} 
          sheet={currentSheet} 
        />

        {/* Elements */}
        <div className="absolute inset-0" style={{ zIndex: 10 }}>
          {currentSheet.elements.map(element => (
            <div
              key={element.id}
              onMouseDown={e => handleElementMouseDown(e, element.id)}
              className={`absolute transition-all ${element.locked ? 'cursor-not-allowed' : 'cursor-move'} ${
                selectedElementId === element.id ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                width: `${element.w}%`,
                height: `${element.h}%`,
                zIndex: element.z,
                opacity: element.opacity ?? 1,
              }}
              title={element.drawing?.drawingName || element.content}
            >
              {/* Drawing */}
              {element.kind === 'drawing' && element.drawing && (
                <div className="w-full h-full relative group">
                  <img
                    src={element.drawing.url}
                    alt={element.drawing.drawingName}
                    className="w-full h-full object-contain"
                    style={{
                      filter: [
                        element.drawing.vector ? '' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                        element.imageEffects?.grayscale ? 'grayscale(100%)' : '',
                        element.imageEffects?.invert ? 'invert(100%)' : '',
                        element.imageEffects?.contrast !== undefined ? `contrast(${element.imageEffects.contrast}%)` : '',
                      ].filter(Boolean).join(' ') || 'none',
                      mixBlendMode: element.imageEffects?.multiply ? 'multiply' : 'normal',
                      clipPath: getClipPath(element.maskShape),
                    }}
                  />
                  {/* Scale Label */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition">
                    {generateScaleLabel(element.drawing)}
                  </div>
                </div>
              )}

              {/* Text */}
              {element.kind === 'text' && (
                <div
                  className="w-full h-full flex items-center justify-center p-2 overflow-hidden"
                  style={{
                    fontSize: `${element.fontSize || 12}px`,
                    fontFamily: element.fontFamily || 'Inter',
                    color: element.color || '#000',
                    backgroundColor: element.bgColor,
                  }}
                >
                  {element.content}
                </div>
              )}

              {/* Image */}
              {element.kind === 'image' && element.src && (
                <img
                  src={element.src}
                  alt="element"
                  className="w-full h-full object-cover"
                  style={{ clipPath: getClipPath(element.maskShape) }}
                />
              )}

              {/* Key Plan (Feature 2) */}
              {element.kind === 'keyplan' && (
                <div className="w-full h-full relative border border-gray-300 bg-gray-50 flex items-center justify-center p-2 overflow-hidden">
                  <div 
                    className="w-full h-full text-gray-500 relative flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: element.keyplanOutlineSvg || `
                      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2" class="w-full h-full">
                        <path d="M 10 10 L 90 10 L 90 90 L 70 90 L 70 40 L 30 40 L 30 90 L 10 90 Z" fill="currentColor" fill-opacity="0.05" stroke-dasharray="2,2"/>
                      </svg>
                    ` }}
                  />
                  {element.highlightZone && (
                    <div 
                      className="absolute border-2 border-red-500 bg-red-500/20 pointer-events-none"
                      style={{
                        left: `${element.highlightZone.x}%`,
                        top: `${element.highlightZone.y}%`,
                        width: `${element.highlightZone.w}%`,
                        height: `${element.highlightZone.h}%`,
                      }}
                    />
                  )}
                  <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded uppercase tracking-wider font-semibold pointer-events-none select-none">
                    Key Plan
                  </div>
                </div>
              )}

              {/* Drafting Annotations (Feature 3) */}
              {element.kind === 'annotation' && element.annotationType === 'section-line' && (
                <div className="w-full h-full relative flex items-center justify-center select-none pointer-events-none">
                  <div className="w-full border-t-2 border-dashed border-gray-800 absolute top-1/2 -translate-y-1/2" />
                  <div className="absolute top-1/2 -translate-y-1/2 left-6 flex flex-col items-center">
                    <span className="text-gray-800 text-[10px] leading-none mb-1">▲</span>
                  </div>
                  <div className="absolute top-1/2 -translate-y-1/2 right-6 flex flex-col items-center">
                    <span className="text-gray-800 text-[10px] leading-none mb-1">▲</span>
                  </div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-gray-800 bg-white flex flex-col items-center justify-center text-[8px] font-bold">
                    <div className="border-b border-gray-800 w-full text-center leading-tight">{element.annotationLabels?.primary || 'A'}</div>
                    <div className="w-full text-center leading-tight">{element.annotationLabels?.secondary || '01'}</div>
                  </div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-gray-800 bg-white flex flex-col items-center justify-center text-[8px] font-bold">
                    <div className="border-b border-gray-800 w-full text-center leading-tight">{element.annotationLabels?.primary || 'A'}</div>
                    <div className="w-full text-center leading-tight">{element.annotationLabels?.secondary || '01'}</div>
                  </div>
                </div>
              )}

              {element.kind === 'annotation' && element.annotationType === 'elevation-bubble' && (
                <div className="w-full h-full flex items-center justify-center relative select-none pointer-events-none">
                  <div className="w-10 h-10 rounded-full border-2 border-gray-800 bg-white flex items-center justify-center text-xs font-bold shadow-sm z-10 text-gray-800">
                    {element.annotationLabels?.primary || '1'}
                  </div>
                  <div className="absolute top-0 text-[10px] font-bold text-gray-800 flex flex-col items-center">
                    <span>▲</span>
                    <span className="text-[7px] -mt-1 font-mono">{element.annotationLabels?.secondary || 'A'}</span>
                  </div>
                  <div className="absolute bottom-0 text-[10px] font-bold text-gray-800 flex flex-col items-center">
                    <span className="text-[7px] mb-1 font-mono">B</span>
                    <span>▼</span>
                  </div>
                  <div className="absolute left-0 text-[10px] font-bold text-gray-800 flex items-center">
                    <span>◀</span>
                    <span className="text-[7px] ml-0.5 font-mono">C</span>
                  </div>
                  <div className="absolute right-0 text-[10px] font-bold text-gray-800 flex items-center">
                    <span className="text-[7px] mr-0.5 font-mono">D</span>
                    <span>▶</span>
                  </div>
                </div>
              )}

              {element.kind === 'annotation' && element.annotationType === 'room-tag' && (
                <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-gray-400 bg-white/80 p-2 text-center select-none pointer-events-none">
                  <span className="font-bold text-[10px] text-gray-800 uppercase tracking-widest leading-none">
                    {element.annotationLabels?.primary || 'ROOM NAME'}
                  </span>
                  <div className="w-12 h-px bg-gray-600 my-1" />
                  <span className="text-[8px] font-mono text-gray-600">
                    {element.annotationLabels?.extra || '15.0 sq.m'}
                  </span>
                </div>
              )}

              {element.kind === 'annotation' && element.annotationType === 'detail-callout' && (
                <div className="w-full h-full relative select-none pointer-events-none">
                  <div className="absolute inset-0 border-2 border-dashed border-[#D4AF37] rounded-lg" />
                  <svg className="absolute inset-0 w-full h-full">
                    <line x1="100%" y1="100%" x2="115%" y2="115%" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="2,2" />
                  </svg>
                  <div className="absolute -bottom-9 -right-9 w-8 h-8 rounded-full border-2 border-[#D4AF37] bg-white flex flex-col items-center justify-center text-[7px] font-bold shadow-md z-10 text-gray-800">
                    <div className="border-b border-[#D4AF37] w-full text-center leading-tight">{element.annotationLabels?.primary || '1'}</div>
                    <div className="w-full text-center leading-tight">{element.annotationLabels?.secondary || '05'}</div>
                  </div>
                </div>
              )}

              {/* Dynamic Graphical Scale Bar (Feature 4) */}
              {element.kind === 'scalebar' && (
                (() => {
                  const firstDrawing = sheet.elements.find(el => el.kind === 'drawing' && el.drawing?.sheetScale)
                  const activeScale = firstDrawing?.drawing?.sheetScale || '1:100'
                  const scaleDen = parseInt(activeScale.split(':')[1]) || 100
                  const lengthMeters = element.scalebarLengthMeters || 10
                  
                  return (
                    <div className="w-full h-full flex flex-col justify-end select-none bg-white/80 p-1.5 border border-gray-300 rounded shadow-sm">
                      <div className="flex justify-between text-[7px] font-mono text-gray-800 px-0.5 mb-0.5">
                        <span>0</span>
                        <span>{lengthMeters / 2}m</span>
                        <span>{lengthMeters}m</span>
                      </div>
                      <svg className="w-full h-2.5 border border-gray-800" viewBox="0 0 100 10" preserveAspectRatio="none">
                        {element.scalebarStyle === 'tick-marks' ? (
                          <>
                            <line x1="0" y1="5" x2="100" y2="5" stroke="black" strokeWidth="1" />
                            <line x1="0" y1="0" x2="0" y2="10" stroke="black" strokeWidth="1" />
                            <line x1="50" y1="0" x2="50" y2="10" stroke="black" strokeWidth="1" />
                            <line x1="100" y1="0" x2="100" y2="10" stroke="black" strokeWidth="1" />
                          </>
                        ) : element.scalebarStyle === 'minimal-line' ? (
                          <>
                            <line x1="0" y1="8" x2="100" y2="8" stroke="black" strokeWidth="1.5" />
                            <line x1="0" y1="4" x2="0" y2="8" stroke="black" strokeWidth="1.5" />
                            <line x1="100" y1="4" x2="100" y2="8" stroke="black" strokeWidth="1.5" />
                          </>
                        ) : (
                          <>
                            <rect x="0" y="0" width="25" height="10" fill="black" />
                            <rect x="25" y="0" width="25" height="10" fill="white" />
                            <rect x="50" y="0" width="25" height="10" fill="black" />
                            <rect x="75" y="0" width="25" height="10" fill="white" />
                          </>
                        )}
                      </svg>
                      <div className="text-[6px] text-gray-500 text-center font-mono mt-1 uppercase tracking-wider">
                        Scale {activeScale}
                      </div>
                    </div>
                  )
                })()
              )}

              {/* Diagram/Render (visual placeholder) */}
              {(element.kind === 'diagram' || element.kind === 'image') && !element.src && (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-xs">
                  {element.kind}
                </div>
              )}

              {/* Selection & Resize Handles */}
              {selectedElementId === element.id && !element.locked && (
                <>
                  {/* Floating Context Toolbar */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 p-1 flex items-center gap-1 z-50 whitespace-nowrap pointer-events-auto cursor-default">
                    <button onClick={(e) => { e.stopPropagation(); onUpdateElement(element.id, { z: (element.z || 0) + 1 }) }} className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Bring Forward">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 14h6v6H4zm10-10h6v6h-6zM10 10h10v10H10z"/></svg>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onUpdateElement(element.id, { z: Math.max(0, (element.z || 0) - 1) }) }} className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Send Backward">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h6v6H4zm10 10h6v6h-6zM10 10h10v10H10z"/></svg>
                    </button>
                    <div className="w-px h-4 bg-gray-300 mx-1" />
                    <button onClick={(e) => { e.stopPropagation(); onDuplicateElement(element.id) }} className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Duplicate">
                      <Copy size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteElement(element.id); onSelectElement('') }} className="p-1.5 hover:bg-red-50 rounded text-red-600" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* 8-Point Resize Handles */}
                  {['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'].map(pos => (
                    <div 
                      key={pos}
                      className={`absolute w-2.5 h-2.5 bg-white border-[1.5px] border-blue-500 shadow-sm ${
                        pos.includes('n') ? '-top-[5px]' : pos.includes('s') ? '-bottom-[5px]' : 'top-1/2 -translate-y-1/2'
                      } ${
                        pos.includes('w') ? '-left-[5px]' : pos.includes('e') ? '-right-[5px]' : 'left-1/2 -translate-x-1/2'
                      } cursor-${pos}-resize`}
                      onMouseDown={(e) => handleResizeMouseDown(e, element, pos)}
                    />
                  ))}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Sheet Info (Footer) */}
        <div className="absolute bottom-4 left-4 right-4 text-xs text-gray-600 pointer-events-none flex justify-between">
          <div>
            {sheetSet.projectName} — Sheet {currentSheet.sheetNumber}: {currentSheet.sheetName}
          </div>
          <div>
            {sheetSet.studentName && `${sheetSet.studentName} • `}
            {new Date().getFullYear()}
          </div>
        </div>
      </div>
    )
  }

  const sheetsToRender = [sheet]
  if (spreadMode && nextSheet) {
    sheetsToRender.push(nextSheet)
  }

  return (
    <div className="flex-1 bg-gray-100 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-3 flex items-center gap-2 shrink-0">
        <button
          onClick={() => onZoomChange(Math.max(50, zoom - 10))}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
        >
          −
        </button>
        <input
          type="number"
          value={zoom}
          onChange={e => onZoomChange(Math.min(200, Math.max(50, parseInt(e.target.value))))}
          className="w-16 px-2 py-1 text-sm border rounded text-center"
        />
        <span className="text-sm text-gray-600">%</span>
        <button
          onClick={() => onZoomChange(Math.min(200, zoom + 10))}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
        >
          +
        </button>

        <div className="border-l border-gray-300 mx-2 h-5" />

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={gridEnabled} onChange={onToggleGrid} className="w-4 h-4 text-blue-600" />
          Grid
        </label>

        <label className="flex items-center gap-2 text-sm cursor-pointer ml-2">
          <input type="checkbox" checked={snapEnabled} onChange={onToggleSnap} className="w-4 h-4 text-blue-600" />
          Snap
        </label>

        <div className="flex-1" />

        <span className="text-xs text-gray-500">
          {sheet.elements.length} elements
        </span>
      </div>

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        className={`flex-1 overflow-auto flex items-center justify-center p-8 ${isSpaceDown ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div className="flex items-center gap-0">
          {sheetsToRender.map((s, index) => renderSheetBoard(s, index))}
        </div>
      </div>

    </div>
  )
}
