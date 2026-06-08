/**
 * Sheet Set Editor
 *
 * Main container: Navigator (left) + Canvas (center) + Properties (right)
 * Complete professional architectural sheet set composer
 */

import React, { useState, useEffect } from 'react'
import { Save, Download, FileJson, AlertCircle } from 'lucide-react'
import type { SheetSet, Sheet, SheetElement, DrawingMetadata, SheetSetTemplate } from './sheetSetTypes'
import { SHEET_SIZES, mmToPx } from './sheetSetTypes'
import { SheetSetNavigator } from './SheetSetNavigator'
import { SheetSetCanvas } from './SheetSetCanvas'
import { SheetProperties } from './SheetProperties'
import { AISheetComposer } from './AISheetComposer'

interface SheetSetEditorProps {
  initialSheetSet?: SheetSet
  template?: SheetSetTemplate
  onSave?: (sheetSet: SheetSet) => void
  onClose?: () => void
}

export function SheetSetEditor({
  initialSheetSet,
  template,
  onSave,
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

  const currentSheet = sheetSet.sheets.find(s => s.id === selectedSheetId)
  const selectedElement = currentSheet?.elements.find(e => e.id === selectedElementId) || null

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
    updateSheet(currentSheet.id, {
      elements: currentSheet.elements.map(e => (e.id === id ? { ...e, ...update } : e)),
    })
  }

  const deleteElement = (id: string) => {
    if (!currentSheet) return
    updateSheet(currentSheet.id, {
      elements: currentSheet.elements.filter(e => e.id !== id),
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

  const handleReorderSheets = (sheets: Sheet[]) => {
    setSheetSet(prev => ({ ...prev, sheets }))
  }

  const handleAICommand = async (cmd: any) => {
    setAiProcessing(true)
    // Simulate AI processing
    await new Promise(r => setTimeout(r, 2000))
    setAiProcessing(false)
    // In real implementation, would call API
  }

  if (!currentSheet) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No sheet selected</p>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-gray-100">
      {/* Navigator */}
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
      />

      {/* Canvas */}
      <SheetSetCanvas
        sheet={currentSheet}
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
      />

      {/* Right Sidebar: Properties + AI */}
      <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
        {/* Properties */}
        <SheetProperties
          sheet={currentSheet}
          selectedElement={selectedElement}
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
              const json = JSON.stringify(sheetSet, null, 2)
              const blob = new Blob([json], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${sheetSet.projectName}.sheet-set.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="px-3 py-2 border border-gray-300 rounded hover:bg-white text-sm"
            title="Export as JSON"
          >
            <FileJson size={16} />
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
