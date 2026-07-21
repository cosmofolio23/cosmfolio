/**
 * Sheet Set Editor
 *
 * Main container: Navigator (left) + Canvas (center) + Properties (right)
 * Complete professional architectural sheet set composer
 */

import React, { useState, useEffect } from 'react'
import { Save, Download, FileJson, AlertCircle, ChevronRight } from 'lucide-react'
import type { SheetSet, Sheet, SheetElement, DrawingMetadata, SheetSetTemplate, DrawingType, ArchScale } from './sheetSetTypes'
import { SHEET_SIZES, mmToPx } from './sheetSetTypes'
import { SheetSetNavigator } from './SheetSetNavigator'
import { SheetSetCanvas } from './SheetSetCanvas'
import { SheetProperties } from './SheetProperties'
import { AISheetComposer } from './AISheetComposer'
import { SheetSetEntouragePanel } from './SheetSetEntouragePanel'
import { layoutsForType, applyLayoutToSheet } from './sheetTypeLayouts'
import { LayoutMiniPreview } from './LayoutMiniPreview'
import { peekSheetImage, clearSheetImage, type SheetImageHandoff } from '@/lib/sheetHandoff'
import { AssetUploadModal } from './AssetUploadModal'
import { SheetSetAssetLibrary, type ProjectAsset } from './SheetSetAssetLibrary'
import { SheetSetSymbolsPanel } from './SheetSetSymbolsPanel'
import { ThesisCompanion } from './ThesisCompanion'
import { SheetStoryboardEngine } from './SheetStoryboardEngine'
import { InDesignCanvaHybridEngine } from './InDesignCanvaHybridEngine'
import { ProjectStyleManager } from './ProjectStyleManager'
import { BlownUpDetailTool } from './tools/BlownUpDetailTool'
import { VectorBorderOverlay } from './borders/VectorBorderOverlay'
import { MasterTitleBlock } from './borders/MasterTitleBlock'

interface SheetSetEditorProps {
  initialSheetSet?: SheetSet
  template?: SheetSetTemplate
  onSave?: (sheetSet: SheetSet) => void
  onExport?: (html: string, sheetSet: SheetSet) => void
  onAICommand?: (cmd: string, payload: any) => Promise<any>
  onClose?: () => void
}

export function SheetSetEditor({
  initialSheetSet,
  template,
  onSave,
  onExport,
  onAICommand,
  onClose,
}: SheetSetEditorProps) {
  const [sheetSet, setSheetSet] = useState<SheetSet>(
    initialSheetSet || createEmptySheetSet(template)
  )
  const [selectedSheetId, setSelectedSheetId] = useState(sheetSet.sheets[0]?.id || '')
  const [selectedElementId, setSelectedElementId] = useState<string>('')
  const [zoom, setZoom] = useState(75)
  const [isSaving, setIsSaving] = useState(false)
  const [aiProcessing, setAiProcessing] = useState(false)
  const [handoff, setHandoff] = useState<SheetImageHandoff | null>(null)
  const [spreadMode, setSpreadMode] = useState(false)
  const [overviewMode, setOverviewMode] = useState(false)
  const [viewMode, setViewMode] = useState<'indesign' | 'storyboard' | 'canvas'>('indesign')
  const [isLeftSidebarExpanded, setIsLeftSidebarExpanded] = useState(false)
  const [showProjectStyleManager, setShowProjectStyleManager] = useState(false)
  const [showDetailTool, setShowDetailTool] = useState(false)
  
  // File upload state
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null)
  const [pendingUploadUrl, setPendingUploadUrl] = useState<string | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [projectAssets, setProjectAssets] = useState<ProjectAsset[]>([])

  // Pick up an image handed off from a studio tool (Drawing Processor, etc.)
  useEffect(() => {
    setHandoff(peekSheetImage())
  }, [])

  const currentSheet = sheetSet.sheets.find(s => s.id === selectedSheetId)
  const nextSheet = spreadMode && currentSheet ? sheetSet.sheets.find(s => s.order === currentSheet.order + 1) : undefined
  const selectedElement = currentSheet?.elements.find(e => e.id === selectedElementId) || nextSheet?.elements.find(e => e.id === selectedElementId) || null

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSave) {
        setIsSaving(true)
        onSave(sheetSet)
        setTimeout(() => setIsSaving(false), 500)
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [sheetSet])

  const updateSheet = (id: string, update: Partial<Sheet>) => {
    setSheetSet(prev => ({
      ...prev,
      sheets: prev.sheets.map(s => (s.id === id ? { ...s, ...update } : s)),
    }))
  }

  const updateElement = (id: string, update: Partial<SheetElement>) => {
    if (!currentSheet) return
    const elementToUpdate = currentSheet.elements.find(e => e.id === id)

    if (elementToUpdate?.isMaster && elementToUpdate.masterId) {
      // Sync across all sheets
      setSheetSet(prev => ({
        ...prev,
        sheets: prev.sheets.map(s => ({
          ...s,
          elements: s.elements.map(e => 
            e.masterId === elementToUpdate.masterId ? { ...e, ...update } : e
          )
        }))
      }))
    } else {
      updateSheet(currentSheet.id, {
        elements: currentSheet.elements.map(e => (e.id === id ? { ...e, ...update } : e)),
      })
    }
  }

  const deleteElement = (id: string) => {
    if (!currentSheet) return
    updateSheet(currentSheet.id, {
      elements: currentSheet.elements.filter(e => e.id !== id),
    })
  }

  const addElement = (element: SheetElement) => {
    if (!currentSheet) return
    updateSheet(currentSheet.id, {
      elements: [...currentSheet.elements, element],
    })
  }

  const duplicateElement = (id: string) => {
    if (!currentSheet) return
    const element = currentSheet.elements.find(e => e.id === id)
    if (!element) return

    const newElement: SheetElement = {
      ...element,
      id: `elem-${Date.now()}`,
      x: element.x + 5,
      y: element.y + 5,
      z: Math.max(...currentSheet.elements.map(e => e.z), 0) + 1,
    }

    updateSheet(currentSheet.id, {
      elements: [...currentSheet.elements, newElement],
    })
  }

  const handleAddSheet = () => {
    const newSheet: Sheet = {
      id: `sheet-${Date.now()}`,
      setId: sheetSet.id,
      sheetNumber: sheetSet.sheets.length + 1,
      sheetName: `Sheet ${sheetSet.sheets.length + 1}`,
      sheetType: 'generic',
      layout: {
        id: 'layout-blank',
        name: 'Blank',
        description: 'Start from scratch',
        columnCount: 1,
        rowCount: 1,
        gridSize: 'column',
        slotDefinitions: [],
      },
      background: undefined,
      elements: [],
      gridEnabled: true,
      snapEnabled: true,
      gridType: 'column',
      order: sheetSet.sheets.length,
    }

    setSheetSet(prev => ({
      ...prev,
      sheets: [...prev.sheets, newSheet],
    }))
    setSelectedSheetId(newSheet.id)
  }

  const handleDeleteSheet = (id: string) => {
    if (sheetSet.sheets.length <= 1) {
      alert('Cannot delete the last sheet')
      return
    }

    const newSheets = sheetSet.sheets.filter(s => s.id !== id)
    setSheetSet(prev => ({
      ...prev,
      sheets: newSheets.map((s, i) => ({ ...s, sheetNumber: i + 1, order: i })),
    }))

    if (selectedSheetId === id) {
      setSelectedSheetId(newSheets[0].id)
    }
  }

  const handleMoveSheet = (index: number, direction: 'left' | 'right') => {
    const newIndex = direction === 'left' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= sheetSet.sheets.length) return
    
    const updatedSheets = [...sheetSet.sheets]
    const temp = updatedSheets[index]
    updatedSheets[index] = updatedSheets[newIndex]
    updatedSheets[newIndex] = temp
    
    const orderedSheets = updatedSheets.map((s, i) => ({
      ...s,
      order: i,
      sheetNumber: i + 1
    }))
    
    setSheetSet(prev => ({
      ...prev,
      sheets: orderedSheets
    }))
  }

  const handleDuplicateSheet = (sheet: Sheet) => {
    const duplicatedSheet: Sheet = {
      ...sheet,
      id: `sheet-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sheetName: `${sheet.sheetName} (Copy)`,
      sheetNumber: sheetSet.sheets.length + 1,
      order: sheetSet.sheets.length,
      elements: sheet.elements.map(el => ({
        ...el,
        id: `elem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        isMaster: false,
        masterId: undefined
      }))
    }
    
    setSheetSet(prev => ({
      ...prev,
      sheets: [...prev.sheets, duplicatedSheet]
    }))
  }

  const handleReorderSheets = (sheets: Sheet[]) => {
    setSheetSet(prev => ({ ...prev, sheets }))
  }

  const handleUpdateSheetSet = (update: Partial<SheetSet>) => {
    if (update.orientation && update.orientation !== sheetSet.orientation) {
      const pageSize = SHEET_SIZES[sheetSet.sheetSize as keyof typeof SHEET_SIZES]
      const oldWidth = sheetSet.orientation === 'portrait' ? pageSize.width : pageSize.height
      const oldHeight = sheetSet.orientation === 'portrait' ? pageSize.height : pageSize.width
      const newWidth = update.orientation === 'portrait' ? pageSize.width : pageSize.height
      const newHeight = update.orientation === 'portrait' ? pageSize.height : pageSize.width

      const reflowedSheets = sheetSet.sheets.map(sheet => ({
        ...sheet,
        elements: sheet.elements.map(el => {
          const absX = (el.x / 100) * oldWidth
          const absY = (el.y / 100) * oldHeight
          const absW = (el.w / 100) * oldWidth
          const absH = (el.h / 100) * oldHeight
          return {
            ...el,
            x: (absX / newWidth) * 100,
            y: (absY / newHeight) * 100,
            w: (absW / newWidth) * 100,
            h: (absH / newHeight) * 100,
          }
        })
      }))
      
      setSheetSet(prev => ({ ...prev, ...update, sheets: reflowedSheets }))
    } else {
      setSheetSet(prev => ({ ...prev, ...update }))
    }
  }

  const handleAICommand = async (cmd: any) => {
    if (!currentSheet || !onAICommand) return
    setAiProcessing(true)
    try {
      if (cmd === 'auto-fill-assets') {
        const updatedSet = await onAICommand(cmd, sheetSet)
        if (updatedSet) {
          setSheetSet(updatedSet)
        }
      } else {
        const updatedSheet = await onAICommand(cmd, currentSheet)
        if (updatedSheet) {
          updateSheet(currentSheet.id, updatedSheet)
        }
      }
    } catch (err) {
      console.error('AI command failed:', err)
    } finally {
      setAiProcessing(false)
    }
  }

  if (!currentSheet) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No sheet selected</p>
      </div>
    )
  }

  // sheet dimensions in mm (orientation-corrected) for scale-true entourage placement
  const pageSpec = SHEET_SIZES[sheetSet.sheetSize] || SHEET_SIZES.A1
  const baseW = sheetSet.sheetSize === 'custom' ? (sheetSet.customWidth || 594) : pageSpec.width
  const baseH = sheetSet.sheetSize === 'custom' ? (sheetSet.customHeight || 841) : pageSpec.height
  const sheetWidthMm = sheetSet.orientation === 'portrait' ? baseW : baseH
  const sheetHeightMm = sheetSet.orientation === 'portrait' ? baseH : baseW

  const currentLayouts = layoutsForType(currentSheet.sheetType)

  const addHandoffToSheet = () => {
    if (!handoff) return
    let wPct = 45
    let hPct = wPct * handoff.aspect * (sheetWidthMm / sheetHeightMm)
    if (hPct > 80) { hPct = 80; wPct = hPct / (handoff.aspect * (sheetWidthMm / sheetHeightMm)) }
    addElement({
      id: `el-${Date.now().toString(36)}`,
      kind: 'drawing',
      x: 50 - wPct / 2, y: 50 - hPct / 2, w: wPct, h: hPct, z: 60,
      locked: false, visible: true,
      drawing: {
        drawingName: handoff.name, drawingType: 'diagram',
        originalScale: '1:100', sheetScale: '1:100', vector: false, url: handoff.dataUrl,
      },
    })
    clearSheetImage()
    setHandoff(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    
    // Check if it's an internal asset drag
    const assetJson = e.dataTransfer.getData('application/json')
    if (assetJson) {
      try {
        const asset = JSON.parse(assetJson)
        
        // Find which slot was hovered, or just drop it at sheet center
        const canvasEl = document.getElementById(`sheet-canvas-${selectedSheetId}`)
        if (canvasEl && currentSheet) {
          const rect = canvasEl.getBoundingClientRect()
          const mouseX = e.clientX - rect.left
          const mouseY = e.clientY - rect.top
          
          // Convert to percentage
          const pctX = (mouseX / rect.width) * 100
          const pctY = (mouseY / rect.height) * 100
          
          // Check if we dropped it directly onto a placeholder element
          const targetSlot = currentSheet.elements.find(el => {
            const isPlaceholder = el.kind === 'text' && (el.content || '').startsWith('+ ')
            if (!isPlaceholder) return false
            return (
              pctX >= el.x && pctX <= (el.x + el.w) &&
              pctY >= el.y && pctY <= (el.y + el.h)
            )
          })
          
          if (targetSlot) {
            // Replace the placeholder slot with the drawing!
            updateElement(targetSlot.id, {
              kind: 'drawing',
              content: undefined,
              drawing: {
                drawingName: asset.name,
                drawingType: asset.type,
                originalScale: asset.originalScale || '1:100',
                sheetScale: asset.originalScale || '1:100',
                url: asset.url,
                vector: asset.url.endsWith('.svg') || asset.url.endsWith('.pdf'),
              }
            })
            return
          }
        }
        
        // Fallback: place at center
        const wPct = 40
        const hPct = 40
        addElement({
          id: `elem-${Date.now()}`,
          kind: 'drawing',
          x: 30, y: 30, w: wPct, h: hPct, z: 100,
          locked: false, visible: true,
          drawing: {
            drawingName: asset.name,
            drawingType: asset.type,
            originalScale: asset.originalScale || '1:100',
            sheetScale: asset.originalScale || '1:100',
            url: asset.url,
            vector: asset.url.endsWith('.svg') || asset.url.endsWith('.pdf'),
          }
        })
      } catch (err) {
        console.error('Failed to parse dropped asset:', err)
      }
      return
    }

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPendingUploadFile(file)
      setPendingUploadUrl(url)
    }
  }

  const handleUploadConfirm = (metadata: { drawingType: DrawingType; originalScale?: ArchScale }) => {
    if (!pendingUploadUrl) return
    const wPct = 40
    const hPct = 40
    
    const assetId = `img-${Date.now()}`
    
    // Add to project library
    setProjectAssets(prev => [...prev, {
      id: assetId,
      url: pendingUploadUrl,
      name: pendingUploadFile?.name || 'Uploaded Drawing',
      type: metadata.drawingType,
      originalScale: metadata.originalScale
    }])

    // Add to current sheet
    addElement({
      id: assetId,
      kind: 'drawing',
      x: 50 - wPct / 2, y: 50 - hPct / 2, w: wPct, h: hPct, z: 100,
      locked: false, visible: true,
      drawing: {
        drawingName: pendingUploadFile?.name || 'Uploaded Drawing',
        drawingType: metadata.drawingType,
        originalScale: metadata.originalScale || '1:100',
        sheetScale: metadata.originalScale || '1:100',
        vector: false,
        url: pendingUploadUrl,
      },
    })
    setPendingUploadFile(null)
    setPendingUploadUrl(null)
  }

  if (viewMode === 'indesign') {
    return (
      <div className="flex h-full relative bg-slate-900">
        <InDesignCanvaHybridEngine
          sheetSet={sheetSet}
          currentSheetId={selectedSheetId}
          onUpdateSheetSet={updates => setSheetSet(prev => ({ ...prev, ...updates }))}
          onUpdateSheet={updateSheet}
          onAddSheet={handleAddSheet}
          onDeleteSheet={handleDeleteSheet}
          onSelectSheet={setSelectedSheetId}
          onExportPdf={() => {
            if (onExport) {
              const canvas = document.querySelector('[id^="sheet-canvas"]')
              if (canvas) {
                onExport(canvas.outerHTML, sheetSet)
              }
            } else {
              const json = JSON.stringify(sheetSet, null, 2)
              const blob = new Blob([json], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${sheetSet.projectName}.sheet-set.json`
              a.click()
              URL.revokeObjectURL(url)
            }
          }}
        />
      </div>
    )
  }

  return (
    <div 
      className={`flex h-full relative transition-colors ${isDraggingOver ? 'bg-blue-50' : 'bg-gray-100'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {pendingUploadUrl && (
        <AssetUploadModal 
          assetUrl={pendingUploadUrl} 
          onConfirm={handleUploadConfirm} 
          onCancel={() => {
            setPendingUploadFile(null)
            setPendingUploadUrl(null)
          }} 
        />
      )}
      {/* Sheet Composer 2.0 Action Bar */}
      <div className="absolute top-3 right-4 z-40 flex items-center gap-2">
        <button
          onClick={() => setShowProjectStyleManager(true)}
          className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-gray-950 font-bold text-xs rounded-lg shadow-md border border-amber-300 flex items-center gap-1.5 transition-all"
        >
          🎨 Project Style Engine
        </button>
        {selectedElement && selectedElement.kind === 'drawing' && (
          <button
            onClick={() => setShowDetailTool(true)}
            className="px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs rounded-lg shadow-md border border-gray-700 flex items-center gap-1.5 transition-all"
          >
            🔍 Blown-Up Detail
          </button>
        )}
      </div>

      {/* Handoff banner — an image pushed from a studio tool */}
      {handoff && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-white rounded-xl shadow-xl border border-[#D4AF37]/40 px-3 py-2 flex items-center gap-3">
          <img src={handoff.dataUrl} alt={handoff.name} className="w-12 h-12 object-contain rounded border border-gray-200 bg-gray-50" />
          <div className="text-xs">
            <div className="font-semibold text-gray-800">From {handoff.source}</div>
            <div className="text-gray-500 max-w-[180px] truncate">{handoff.name}</div>
          </div>
          <button onClick={addHandoffToSheet}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-br from-[#D4AF37] to-[#9C7416] hover:brightness-105">
            ＋ Add to this sheet
          </button>
          <button onClick={() => { clearSheetImage(); setHandoff(null) }}
            className="text-gray-400 hover:text-gray-600 text-sm px-1" title="Dismiss">✕</button>
        </div>
      )}

      {/* Left Sidebar: Navigator */}
      {isLeftSidebarExpanded ? (
        <SheetSetNavigator
          sheetSet={sheetSet}
          selectedSheetId={selectedSheetId}
          onSelectSheet={setSelectedSheetId}
          onAddSheet={handleAddSheet}
          onDeleteSheet={handleDeleteSheet}
          onReorderSheets={handleReorderSheets}
          onToggleVisibility={id => {
            if (currentSheet?.id === id) {
              updateSheet(id, {
                elements: currentSheet.elements.map(e => ({
                  ...e,
                  visible: !e.visible,
                })),
              })
            }
          }}
          onToggleLock={id => {
            if (currentSheet?.id === id) {
              updateSheet(id, {
                elements: currentSheet.elements.map(e => ({
                  ...e,
                  locked: !e.locked,
                })),
              })
            }
          }}
          onCollapse={() => setIsLeftSidebarExpanded(false)}
        />
      ) : (
        <button
          onClick={() => setIsLeftSidebarExpanded(true)}
          className="absolute left-0 top-4 z-50 bg-white hover:bg-gray-50 border border-l-0 border-gray-300 shadow-md rounded-r-lg p-2.5 flex items-center justify-center transition-all duration-200 cursor-pointer group"
          title="Expand Navigator"
        >
          <ChevronRight size={20} className="text-gray-550 group-hover:text-gray-850 transition" />
        </button>
      )}

      {/* Project Assets Library */}
      <SheetSetAssetLibrary 
        assets={projectAssets} 
        onDragStart={() => {}} 
        onAddAssets={newAssets => setProjectAssets(prev => [...prev, ...newAssets])}
      />

      {/* Architectural Symbols */}
      <SheetSetSymbolsPanel 
        onAddElement={addElement} 
      />

      {/* Entourage Panel */}
      <SheetSetEntouragePanel
        sheetWidthMm={sheetWidthMm}
        sheetHeightMm={sheetHeightMm}
        onAddElement={addElement}
      />

      {/* Thesis Tracker Widget */}
      <ThesisCompanion sheets={sheetSet.sheets} />

      {/* Canvas or Light Table Overview */}
      {overviewMode ? (
        <div className="flex-1 overflow-y-auto bg-gray-100 p-8 h-full">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">📊 Light Table</h2>
                <p className="text-xs text-gray-500 font-medium">Overview of all sheets in your portfolio submission. Compare layouts, margins, and borders.</p>
              </div>
              <button
                onClick={handleAddSheet}
                className="px-4 py-2 bg-[#D4AF37] hover:bg-[#b8952d] text-gray-950 font-bold rounded-lg text-xs shadow transition flex items-center gap-1.5"
              >
                <span>＋ Add Page</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {sheetSet.sheets.map((sheet, index) => {
                const isPortrait = sheetSet.orientation === 'portrait'
                const pageSpec = SHEET_SIZES[sheetSet.sheetSize as keyof typeof SHEET_SIZES] || SHEET_SIZES.A1
                const baseW = sheetSet.sheetSize === 'custom' ? (sheetSet.customWidth || 594) : pageSpec.width
                const baseH = sheetSet.sheetSize === 'custom' ? (sheetSet.customHeight || 841) : pageSpec.height
                const sWidth = isPortrait ? baseW : baseH
                const sHeight = isPortrait ? baseH : baseW

                return (
                  <div 
                    key={sheet.id} 
                    className={`bg-white rounded-xl shadow border p-4 flex flex-col justify-between group transition ${
                      selectedSheetId === sheet.id ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/20 shadow-md' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Miniature Page Canvas Preview */}
                    <div 
                      onClick={() => {
                        setSelectedSheetId(sheet.id)
                        setOverviewMode(false)
                      }}
                      className="cursor-pointer relative bg-gray-50 rounded border border-gray-250 overflow-hidden flex items-center justify-center p-2 hover:bg-gray-100 transition"
                      style={{
                        aspectRatio: isPortrait ? '1 / 1.414' : '1.414 / 1',
                        backgroundColor: sheetSet.backgroundColor || '#ffffff',
                      }}
                    >
                      {/* Outer Theme Border */}
                      {sheetSet.sheetBorder && sheetSet.sheetBorder !== 'none' && (
                        <div 
                          className="absolute pointer-events-none"
                          style={{
                            left: '5%',
                            top: '5%',
                            right: '5%',
                            bottom: '5%',
                            border: sheetSet.sheetBorder === 'thin-black' ? '0.5px solid currentColor'
                              : sheetSet.sheetBorder === 'double-line' ? '1.5px double currentColor'
                              : sheetSet.sheetBorder === 'dashed-border' ? '0.5px dashed currentColor'
                              : 'none',
                            borderColor: sheetSet.textColor || '#111111'
                          }}
                        />
                      )}

                      {/* Elements placeholder list */}
                      <div className="absolute inset-0 p-3 pointer-events-none">
                        {sheet.elements.map(el => (
                          <div 
                            key={el.id} 
                            className="absolute bg-gray-400/20 border border-gray-400/30 rounded flex items-center justify-center text-[7px] text-gray-500 overflow-hidden truncate"
                            style={{
                              left: `${el.x}%`,
                              top: `${el.y}%`,
                              width: `${el.w}%`,
                              height: `${el.h}%`,
                            }}
                          >
                            {el.kind === 'drawing' ? '📐' : el.kind === 'image' ? '🖼️' : '💬'}
                          </div>
                        ))}
                      </div>

                      {/* Quick click label */}
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-black/75 backdrop-blur-sm text-white text-[9px] font-bold rounded-full transition shadow">
                          ✏️ Edit
                        </span>
                      </div>
                    </div>

                    {/* Metadata & Controls */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#9C7416] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          PAGE {index + 1}
                        </span>
                        <div className="flex gap-1">
                          <button
                            disabled={index === 0}
                            onClick={() => handleMoveSheet(index, 'left')}
                            className="p-1 rounded hover:bg-gray-150 text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Move Left"
                          >
                            ◀
                          </button>
                          <button
                            disabled={index === sheetSet.sheets.length - 1}
                            onClick={() => handleMoveSheet(index, 'right')}
                            className="p-1 rounded hover:bg-gray-150 text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Move Right"
                          >
                            ▶
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-gray-800 mt-1 truncate">{sheet.sheetName}</h4>
                      <p className="text-[9px] text-gray-400 capitalize">{sheet.sheetType} layout</p>

                      <div className="flex gap-2 mt-3 pt-2.5 border-t border-gray-100">
                        <button
                          onClick={() => {
                            setSelectedSheetId(sheet.id)
                            setOverviewMode(false)
                          }}
                          className="flex-1 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-250 rounded text-[9px] font-bold text-gray-700 transition"
                        >
                          ✏️ Canvas
                        </button>
                        <button
                          onClick={() => handleDuplicateSheet(sheet)}
                          className="flex-1 py-1.5 bg-gray-50 hover:bg-amber-50 hover:border-amber-200 rounded text-[9px] font-bold text-gray-700 hover:text-[#9C7416] transition border border-gray-250"
                        >
                          📋 Clone
                        </button>
                        <button
                          onClick={() => handleDeleteSheet(sheet.id)}
                          className="p-1.5 bg-gray-50 hover:bg-red-50 hover:border-red-200 text-gray-500 hover:text-red-750 border border-gray-250 rounded transition"
                          title="Delete Page"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Add New Sheet Placeholder Card */}
              <div 
                onClick={handleAddSheet}
                className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-100 hover:border-gray-400 cursor-pointer flex flex-col items-center justify-center text-center p-6 transition"
                style={{
                  aspectRatio: sheetSet.orientation === 'portrait' ? '1 / 1.414' : '1.414 / 1',
                }}
              >
                <span className="text-2xl text-gray-400">＋</span>
                <span className="text-xs font-bold text-gray-600 mt-1">Add Page</span>
                <span className="text-[9px] text-gray-400 mt-0.5">Appends sheet to set</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <SheetSetCanvas
          sheet={currentSheet}
          nextSheet={nextSheet}
          spreadMode={spreadMode}
          sheetSet={sheetSet}
          selectedElementId={selectedElementId}
          onSelectElement={setSelectedElementId}
          onUpdateElement={updateElement}
          onDeleteElement={deleteElement}
          onDuplicateElement={duplicateElement}
          zoom={zoom}
          onZoomChange={setZoom}
          gridEnabled={currentSheet.gridEnabled}
          snapEnabled={currentSheet.snapEnabled}
          onToggleGrid={() => updateSheet(currentSheet.id, { gridEnabled: !currentSheet.gridEnabled })}
          onToggleSnap={() => updateSheet(currentSheet.id, { snapEnabled: !currentSheet.snapEnabled })}
        />
      )}

      {/* Right Sidebar: Properties + AI */}
      <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
        
        {/* View Mode Controls */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex flex-col gap-2">
          <button
            onClick={() => setViewMode('storyboard')}
            className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-105 text-white font-bold text-xs rounded-lg shadow transition flex items-center justify-center gap-1.5"
          >
            <span>✨ Switch to Storyboard Engine</span>
          </button>

          <div className="flex items-center justify-between border-t border-gray-200 pt-2">
            <span className="text-xs font-bold text-gray-700">📖 Spread View</span>
            <button 
              onClick={() => {
                setSpreadMode(!spreadMode)
                if (overviewMode) setOverviewMode(false)
              }}
              className={`w-10 h-5 rounded-full relative transition-colors ${spreadMode ? 'bg-[#D4AF37]' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${spreadMode ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between border-t border-gray-100 pt-2">
            <span className="text-xs font-bold text-gray-700">📊 Light Table Overview</span>
            <button 
              onClick={() => {
                setOverviewMode(!overviewMode)
                if (spreadMode) setSpreadMode(false)
              }}
              className={`w-10 h-5 rounded-full relative transition-colors ${overviewMode ? 'bg-[#D4AF37]' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${overviewMode ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Sheet Layout Switcher */}
        <div className="p-4 border-b border-gray-200 bg-[#FBE7A1]/10">
          <label className="text-xs font-bold text-gray-700 block mb-1.5 capitalize">
            📐 Layout — {currentSheet.sheetType.replace('-', ' ')} sheet
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {currentLayouts.map(l => (
              <button
                key={l.id}
                onClick={() => updateSheet(currentSheet.id, applyLayoutToSheet(currentSheet, l))}
                title={l.description}
                className={`p-1.5 rounded-lg border-2 transition ${currentSheet.layout?.id === l.id ? 'border-[#D4AF37] bg-[#FBE7A1]/30' : 'border-gray-200 hover:border-[#D4AF37]/50'}`}
              >
                <LayoutMiniPreview layout={l} className="w-full h-9" />
                <div className="text-[9px] text-gray-600 mt-1 leading-tight truncate">{l.name}</div>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">Switching re-flows your drawings into the new grid.</p>
        </div>

        {/* Properties */}
        <SheetProperties
          sheet={currentSheet}
          sheetSet={sheetSet}
          selectedElement={selectedElement}
          onUpdateSheet={update => updateSheet(currentSheet.id, update)}
          onUpdateSheetSet={handleUpdateSheetSet}
          onUpdateElement={update => {
            if (selectedElement) {
              updateElement(selectedElement.id, update)
            }
          }}
          onUploadDrawing={(element, file, metadata) => {
            // In real implementation, upload to storage and get URL
            const url = URL.createObjectURL(file)
            updateElement(element.id, {
              drawing: {
                ...metadata,
                drawingName: metadata.drawingName || file.name,
                drawingType: metadata.drawingType || 'diagram',
                originalScale: metadata.originalScale || '1:100',
                sheetScale: metadata.sheetScale || '1:100',
                url,
                vector: file.type === 'application/pdf' || file.type === 'image/svg+xml',
              },
            })
          }}
          onAICommand={handleAICommand}
        />

        <div className="border-t border-gray-200" />

        {/* AI Assistant */}
        <div className="p-4 flex-1 overflow-y-auto">
          <AISheetComposer
            onCommand={handleAICommand}
            isProcessing={aiProcessing}
          />
        </div>

        {/* Footer Controls */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex gap-2">
          <button
            onClick={() => {
              if (onSave) {
                setIsSaving(true)
                onSave(sheetSet)
                setTimeout(() => setIsSaving(false), 500)
              }
            }}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
          >
            <Save size={16} /> {isSaving ? 'Saving...' : 'Save'}
          </button>

          <button
            onClick={() => {
              if (onExport) {
                const canvas = document.getElementById('sheet-canvas')
                if (canvas) {
                  onExport(canvas.outerHTML, sheetSet)
                }
              } else {
                // Fallback to JSON if onExport not provided
                const json = JSON.stringify(sheetSet, null, 2)
                const blob = new Blob([json], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${sheetSet.projectName}.sheet-set.json`
                a.click()
                URL.revokeObjectURL(url)
              }
            }}
            className="px-3 py-2 border border-gray-300 rounded hover:bg-white text-sm"
            title="Export to PDF"
          >
            <Download size={16} />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 border border-gray-300 rounded hover:bg-white text-sm"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Sheet Composer 2.0 Modals */}
      {showProjectStyleManager && (
        <ProjectStyleManager
          sheetSet={sheetSet}
          onApplyProjectStyle={updatedSet => setSheetSet(updatedSet)}
          onClose={() => setShowProjectStyleManager(false)}
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

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function createEmptySheetSet(template?: SheetSetTemplate): SheetSet {
  const sheets: Sheet[] = template
    ? template.sheets.map(ts => ({
        id: `sheet-${Date.now()}-${Math.random()}`,
        setId: `set-${Date.now()}`,
        sheetNumber: ts.sheetNumber,
        sheetName: ts.name,
        sheetType: ts.type,
        layout: ts.layout,
        background: undefined,
        elements: ts.sampleContent
          ? ts.sampleContent.drawings.map((d, i) => ({
              id: `elem-${i}`,
              kind: 'drawing' as const,
              x: 10 + i * 20,
              y: 10,
              w: 40,
              h: 60,
              z: i,
              locked: false,
              visible: true,
              drawing: d,
            }))
          : [],
        gridEnabled: true,
        snapEnabled: true,
        gridType: 'column' as const,
        order: ts.sheetNumber - 1,
      }))
    : [
        {
          id: `sheet-${Date.now()}`,
          setId: `set-${Date.now()}`,
          sheetNumber: 1,
          sheetName: 'Sheet 1',
          sheetType: 'generic',
          layout: {
            id: 'layout-blank',
            name: 'Blank',
            description: 'Start from scratch',
            columnCount: 1,
            rowCount: 1,
            gridSize: 'column',
            slotDefinitions: [],
          },
          background: undefined,
          elements: [],
          gridEnabled: true,
          snapEnabled: true,
          gridType: 'column',
          order: 0,
        },
      ]

  return {
    id: `set-${Date.now()}`,
    projectId: '',
    projectName: template?.name || 'New Sheet Set',
    submissionType: template?.submissionType || 'professional',
    date: new Date().toISOString().split('T')[0],
    sheetSize: template?.defaultSize || 'A2',
    orientation: template?.defaultOrientation || 'portrait',
    masterSheets: [],
    primaryColor: template?.style.primaryColor || '#1a1a1a',
    secondaryColor: '#6b7280',
    accentColor: '#3b82f6',
    textColor: '#1f2937',
    backgroundColor: '#ffffff',
    fontFamily: template?.style.fontFamily || 'Inter, sans-serif',
    sheets,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    published: false,
  }
}
