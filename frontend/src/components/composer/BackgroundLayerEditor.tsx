/**
 * Background Layer Editor — design background layers for pages/spreads.
 *
 * Supports: solid, gradient, image, texture, pattern, grid, shape, watermark.
 * Manages stacking (zIndex), opacity, blend modes, locking.
 */

import React, { useState } from 'react'
import type { BackgroundLayer, BackgroundDefinition } from './publishingTypes'

interface BackgroundLayerEditorProps {
  layer: BackgroundLayer
  onUpdate: (layer: BackgroundLayer) => void
  onDelete?: () => void
}

export function BackgroundLayerEditor({ layer, onUpdate, onDelete }: BackgroundLayerEditorProps) {
  const [expandedDef, setExpandedDef] = useState<number | null>(null)
  const [showAddDef, setShowAddDef] = useState(false)

  const addDefinition = (type: BackgroundDefinition['type']) => {
    const newDef: any = {}
    newDef.type = type

    switch (type) {
      case 'solid':
        newDef.color = '#ffffff'
        break
      case 'gradient':
        newDef.from = '#ffffff'
        newDef.to = '#000000'
        newDef.angle = 135
        newDef.opacity = 1
        break
      case 'image':
        newDef.url = ''
        newDef.fit = 'cover'
        newDef.opacity = 1
        break
      case 'watermark':
        newDef.text = 'DRAFT'
        newDef.opacity = 0.1
        newDef.rotation = -45
        newDef.fontSize = 60
        break
      case 'grid':
        newDef.columns = 12
        newDef.color = '#cccccc'
        newDef.opacity = 0.3
        newDef.scale = 20
        break
      case 'pattern':
        newDef.pattern = 'dots'
        newDef.color = '#000000'
        newDef.scale = 10
        newDef.opacity = 0.5
        break
      case 'texture':
        newDef.texture = 'concrete'
        newDef.opacity = 0.3
        break
      case 'shape':
        newDef.shape = 'rectangle'
        newDef.color = '#cccccc'
        newDef.x = 0
        newDef.y = 0
        newDef.width = 100
        newDef.height = 100
        break
    }

    // @ts-ignore - complex union type, but we know it's valid at runtime
    onUpdate({ ...layer, definitions: [...layer.definitions, newDef] })
    setShowAddDef(false)
  }

  const updateDefinition = (index: number, updates: Partial<BackgroundDefinition>) => {
    const newDefs = [...layer.definitions]
    // @ts-ignore - complex union type, but updates are valid at runtime
    newDefs[index] = { ...newDefs[index], ...updates }
    onUpdate({ ...layer, definitions: newDefs })
  }

  const deleteDefinition = (index: number) => {
    onUpdate({ ...layer, definitions: layer.definitions.filter((_, i) => i !== index) })
  }

  const renderDefinitionEditor = (def: BackgroundDefinition, index: number) => {
    return (
      <div key={index} className="space-y-2 p-2 bg-gray-50 rounded border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase text-gray-600">{def.type}</span>
          <button onClick={() => deleteDefinition(index)} className="text-red-500 hover:text-red-700 text-xs">
            ✕
          </button>
        </div>

        {def.type === 'solid' && (
          <div>
            <label className="text-[10px] uppercase text-gray-500">Color</label>
            <input
              type="color"
              value={def.color}
              onChange={e => updateDefinition(index, { color: e.target.value })}
              className="w-full h-8 border rounded"
            />
          </div>
        )}

        {def.type === 'gradient' && (
          <>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] uppercase text-gray-500">From</label>
                <input
                  type="color"
                  value={def.from}
                  onChange={e => updateDefinition(index, { from: e.target.value })}
                  className="w-full h-6 border rounded"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] uppercase text-gray-500">To</label>
                <input
                  type="color"
                  value={def.to}
                  onChange={e => updateDefinition(index, { to: e.target.value })}
                  className="w-full h-6 border rounded"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase text-gray-500">Angle</label>
              <input
                type="number"
                value={def.angle || 135}
                onChange={e => updateDefinition(index, { angle: parseInt(e.target.value) })}
                className="w-full px-2 py-1 border rounded text-xs"
                min="0"
                max="360"
              />
            </div>
          </>
        )}

        {def.type === 'image' && (
          <>
            <input
              type="text"
              value={def.url}
              onChange={e => updateDefinition(index, { url: e.target.value })}
              className="w-full px-2 py-1 border rounded text-xs"
              placeholder="Image URL"
            />
            <select
              value={def.fit || 'cover'}
              onChange={e => updateDefinition(index, { fit: e.target.value as 'cover' | 'contain' | 'stretch' | 'tile' })}
              className="w-full px-2 py-1 border rounded text-xs"
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="stretch">Stretch</option>
              <option value="tile">Tile</option>
            </select>
          </>
        )}

        {def.type === 'watermark' && (
          <>
            <input
              type="text"
              value={def.text}
              onChange={e => updateDefinition(index, { text: e.target.value })}
              className="w-full px-2 py-1 border rounded text-xs"
              placeholder="Watermark text"
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] uppercase text-gray-500">Size</label>
                <input
                  type="number"
                  value={def.fontSize || 60}
                  onChange={e => updateDefinition(index, { fontSize: parseInt(e.target.value) })}
                  className="w-full px-2 py-1 border rounded text-xs"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] uppercase text-gray-500">Rotate</label>
                <input
                  type="number"
                  value={def.rotation || -45}
                  onChange={e => updateDefinition(index, { rotation: parseInt(e.target.value) })}
                  className="w-full px-2 py-1 border rounded text-xs"
                />
              </div>
            </div>
          </>
        )}

        {def.type === 'grid' && (
          <>
            <input
              type="number"
              value={def.columns || 12}
              onChange={e => updateDefinition(index, { columns: parseInt(e.target.value) })}
              className="w-full px-2 py-1 border rounded text-xs"
              placeholder="Columns"
            />
            <input
              type="color"
              value={def.color}
              onChange={e => updateDefinition(index, { color: e.target.value })}
              className="w-full h-6 border rounded"
            />
          </>
        )}

        {def.type === 'pattern' && (
          <>
            <select
              value={def.pattern}
              onChange={e => updateDefinition(index, { pattern: e.target.value as any })}
              className="w-full px-2 py-1 border rounded text-xs"
            >
              <option value="dots">Dots</option>
              <option value="lines">Lines</option>
              <option value="grid">Grid</option>
              <option value="cross">Cross</option>
              <option value="diagonal">Diagonal</option>
              <option value="parametric">Parametric</option>
            </select>
            <input
              type="color"
              value={def.color}
              onChange={e => updateDefinition(index, { color: e.target.value })}
              className="w-full h-6 border rounded"
            />
          </>
        )}

        {/* Opacity for all */}
        {def.type !== 'solid' && (
          <div>
            <label className="text-[10px] uppercase text-gray-500">Opacity: {(def.opacity || 1).toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={def.opacity || 1}
              onChange={e => updateDefinition(index, { opacity: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{layer.name}</h3>
        </div>
        {onDelete && (
          <button onClick={onDelete} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">
            Delete
          </button>
        )}
      </div>

      {/* Layer Controls */}
      <div className="space-y-2">
        <div>
          <label className="text-[10px] uppercase text-gray-500">Opacity: {(layer.opacity || 1).toFixed(2)}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={layer.opacity || 1}
            onChange={e => onUpdate({ ...layer, opacity: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        <select
          value={layer.blendMode || 'normal'}
          onChange={e => onUpdate({ ...layer, blendMode: e.target.value as any })}
          className="w-full px-2 py-1 border rounded text-xs"
        >
          <option value="normal">Normal</option>
          <option value="multiply">Multiply</option>
          <option value="screen">Screen</option>
          <option value="overlay">Overlay</option>
        </select>

        <select
          value={layer.appliesTo}
          onChange={e => onUpdate({ ...layer, appliesTo: e.target.value as any })}
          className="w-full px-2 py-1 border rounded text-xs"
        >
          <option value="current-page">Current Page Only</option>
          <option value="current-spread">Current Spread</option>
          <option value="entire-project">Entire Project</option>
        </select>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!layer.visible}
            onChange={e => onUpdate({ ...layer, visible: !e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-xs">Hidden</span>
        </div>
      </div>

      {/* Definitions */}
      <div className="space-y-2">
        {layer.definitions.map((def, i) => (
          <div key={i}>
            <button
              onClick={() => setExpandedDef(expandedDef === i ? null : i)}
              className="w-full px-2 py-1 text-left text-xs bg-white border rounded hover:bg-gray-50"
            >
              {def.type} {expandedDef !== i && '→'}
            </button>
            {expandedDef === i && renderDefinitionEditor(def, i)}
          </div>
        ))}
      </div>

      {/* Add Definition */}
      {showAddDef ? (
        <div className="grid grid-cols-3 gap-1">
          {(['solid', 'gradient', 'image', 'pattern', 'grid', 'watermark', 'texture', 'shape'] as const).map(type => (
            <button
              key={type}
              onClick={() => addDefinition(type)}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium"
            >
              {type}
            </button>
          ))}
          <button
            onClick={() => setShowAddDef(false)}
            className="col-span-3 px-2 py-1 border rounded text-xs text-gray-600"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddDef(true)}
          className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded text-xs font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600"
        >
          + Add Layer Definition
        </button>
      )}
    </div>
  )
}
