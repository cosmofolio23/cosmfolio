'use client'

import React, { useState, useRef } from 'react'
import type { Block, FlowchartStep, FlowchartConfig, DesignTokens } from './types'
import { PROCESS_PRESETS } from './processPresets'
import ProcessFlowchartRenderer from './ProcessFlowchartRenderer'

type TabType = 'layout' | 'steps' | 'card' | 'scale' | 'colors' | null

export function FlowchartBlockRenderer({
  block, tokens, onChange, readonly, onUploadImage
}: {
  block: Block
  tokens: DesignTokens
  onChange: (patch: Partial<Block>) => void
  readonly?: boolean
  onUploadImage?: (file: File) => Promise<string>
}) {
  const [activeTab, setActiveTab] = useState<TabType>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const hideTimeout = useRef<NodeJS.Timeout | null>(null)
  const [uploadingStepId, setUploadingStepId] = useState<string | null>(null)

  const config = block.flowchartConfig || PROCESS_PRESETS[0].config

  const updateConfig = (newConfig: Partial<FlowchartConfig>) => {
    onChange({ flowchartConfig: { ...config, ...newConfig } })
  }

  // Steps mutations
  const handleUpdateStep = (stepId: string, updates: Partial<FlowchartStep>) => {
    updateConfig({ steps: config.steps.map(s => s.id === stepId ? { ...s, ...updates } : s) })
  }
  const handleAddStep = () => {
    updateConfig({ steps: [...config.steps, { id: String(Date.now()), title: `Step ${config.steps.length + 1}`, description: 'Enter description' }] })
  }
  const handleDeleteStep = (stepId: string) => {
    if (config.steps.length > 1) updateConfig({ steps: config.steps.filter(s => s.id !== stepId) })
  }
  const handleMoveStep = (idx: number, dir: 'up' | 'down') => {
    const tidx = dir === 'up' ? idx - 1 : idx + 1
    if (tidx < 0 || tidx >= config.steps.length) return
    const newSteps = [...config.steps]
    const t = newSteps[idx]; newSteps[idx] = newSteps[tidx]; newSteps[tidx] = t
    updateConfig({ steps: newSteps })
  }
  const handleStepImageUpload = async (stepId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onUploadImage) return
    setUploadingStepId(stepId)
    try {
      const url = await onUploadImage(file)
      handleUpdateStep(stepId, { imageUrl: url })
    } finally {
      setUploadingStepId(null)
    }
  }

  const handleRandomize = () => {
    const pathStyles = ['serpentine', 'zigzag', 'linear-h', 'linear-v', 'circular', 'radial']
    const nodeStyles = ['image', 'large-image', 'number', 'hexagon', 'minimal-dot']
    const connectorStyles = ['curved', 'sharp', 'dashed', 'double']
    const palettes = [
      { lineColor: '#D4A574', nodeBorderColor: '#D4A574', nodeBgColor: '#F5E6D3', textColor: '#1A1A1A' },
      { lineColor: '#475569', nodeBorderColor: '#334155', nodeBgColor: '#F8FAFC', textColor: '#0F172A' },
      { lineColor: '#6366F1', nodeBorderColor: '#4F46E5', nodeBgColor: '#EEF2FF', textColor: '#1E1B4B' },
      { lineColor: '#10B981', nodeBorderColor: '#059669', nodeBgColor: '#ECFDF5', textColor: '#064E3B' },
      { lineColor: '#F43F5E', nodeBorderColor: '#E11D48', nodeBgColor: '#FFF1F2', textColor: '#4C0519' },
      { lineColor: '#EAB308', nodeBorderColor: '#CA8A04', nodeBgColor: '#FEFCE8', textColor: '#713F12' }
    ]
    const pick = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)]
    
    updateConfig({
      pathStyle: pick(pathStyles),
      nodeStyle: pick(nodeStyles),
      connectorStyle: pick(connectorStyles),
      ...pick(palettes),
      lineWidth: Math.floor(Math.random() * 4) + 1
    })
  }

  return (
    <div 
      className="group/fc relative w-full h-full flex flex-col min-h-0"
      onMouseEnter={() => {
        if (hideTimeout.current) clearTimeout(hideTimeout.current)
        setIsEditorOpen(true)
      }}
      onMouseLeave={() => {
        hideTimeout.current = setTimeout(() => {
          setIsEditorOpen(false)
          setActiveTab(null)
        }, 300)
      }}
    >
      <ProcessFlowchartRenderer block={block} tokens={tokens} onChange={onChange} />
      
      {!readonly && (
        <div 
          className="absolute top-2 right-2 z-30 flex flex-col items-end gap-2"
          data-html2canvas-ignore="true"
        >
          {/* Toolbar */}
          <div className={`flex items-center gap-1 bg-white/95 backdrop-blur-md shadow-lg border border-black/10 rounded-md p-1 transition-opacity duration-200 ${isEditorOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button onClick={() => setActiveTab(t => t === 'layout' ? null : 'layout')} className={`p-1.5 rounded hover:bg-black/5 transition-colors ${activeTab === 'layout' ? 'bg-black/5' : ''}`} title="Layout Style">📐</button>
            <button onClick={() => setActiveTab(t => t === 'steps' ? null : 'steps')} className={`p-1.5 rounded hover:bg-black/5 transition-colors ${activeTab === 'steps' ? 'bg-black/5' : ''}`} title="Edit Steps">📝</button>
            <button onClick={() => setActiveTab(t => t === 'colors' ? null : 'colors')} className={`p-1.5 rounded hover:bg-black/5 transition-colors ${activeTab === 'colors' ? 'bg-black/5' : ''}`} title="Colors">🎨</button>
            <button onClick={() => setActiveTab(t => t === 'scale' ? null : 'scale')} className={`p-1.5 rounded hover:bg-black/5 transition-colors ${activeTab === 'scale' ? 'bg-black/5' : ''}`} title="Scale/Zoom">🔍</button>
            <button onClick={() => setActiveTab(t => t === 'card' ? null : 'card')} className={`p-1.5 rounded hover:bg-black/5 transition-colors ${activeTab === 'card' ? 'bg-black/5' : ''}`} title="Background Settings">🖼️</button>
            <button onClick={handleRandomize} className="p-1.5 rounded hover:bg-black/5 transition-colors" title="Randomize Style">🎲</button>
            <div className="w-px h-4 bg-black/10 mx-1" />
            
            {block.freeform && (
              <>
                <button onClick={() => (onChange as any)({ zOp: 'front' })} className="p-1 rounded text-[10px] text-gray-500 hover:text-black hover:bg-black/5" title="Bring to Front">⇈</button>
                <button onClick={() => (onChange as any)({ zOp: 'forward' })} className="p-1 rounded text-[10px] text-gray-500 hover:text-black hover:bg-black/5" title="Bring Forward">⇧</button>
                <button onClick={() => (onChange as any)({ zOp: 'backward' })} className="p-1 rounded text-[10px] text-gray-500 hover:text-black hover:bg-black/5" title="Send Backward">⇩</button>
                <button onClick={() => (onChange as any)({ zOp: 'back' })} className="p-1 rounded text-[10px] text-gray-500 hover:text-black hover:bg-black/5" title="Send to Back">⇊</button>
                <div className="w-px h-4 bg-black/10 mx-1" />
                <button onClick={() => onChange({ freeform: { ...block.freeform!, pinned: !block.freeform!.pinned } })} className={`p-1.5 rounded text-[10px] transition-colors ${block.freeform.pinned ? 'text-green-600 bg-green-50' : 'hover:bg-black/5'}`} title={block.freeform.pinned ? 'Unpin from Screen' : 'Pin to Screen'}>📍</button>
              </>
            )}
            
            <button onClick={() => onChange({ freeform: block.freeform ? undefined : { x: 10, y: 10, w: 40, h: 40 } })} className={`p-1.5 rounded text-[10px] transition-colors hover:bg-black/5 ${block.freeform ? 'text-blue-600' : ''}`} title={block.freeform ? 'Snap to Grid' : 'Unlock from Grid'}>{block.freeform ? '↩' : '🔓'}</button>
            <div className="w-px h-4 bg-black/10 mx-1" />
            <button onClick={() => (onChange as any)({ isDeleted: true })} className="p-1.5 rounded text-[10px] hover:bg-red-50 text-red-500/50 hover:text-red-600 transition-colors" title="Remove Block">✕</button>
          </div>

          {/* Panels */}
          {activeTab === 'layout' && (
            <div className="bg-white/95 backdrop-blur-md p-3 rounded-lg shadow-xl border border-black/10 w-64 text-left max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Preset Layouts</div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {PROCESS_PRESETS.map(preset => (
                  <button key={preset.id} onClick={() => updateConfig(preset.config)} className={`p-1.5 border rounded text-left hover:border-blue-500 transition ${config.presetId === preset.id ? 'border-blue-600 bg-blue-50/10 shadow-sm ring-1 ring-blue-600' : 'border-slate-200 bg-white'}`}>
                    <span className="block text-[9px] font-bold text-slate-900 truncate">{preset.name}</span>
                  </button>
                ))}
              </div>
              <div className="space-y-3 pt-3 border-t border-black/10">
                <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Path & Line</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase text-gray-500 font-semibold">Path Style</label>
                    <select value={config.pathStyle} onChange={e => updateConfig({ pathStyle: e.target.value as any })} className="w-full text-[10px] border border-slate-200 rounded p-1 bg-white">
                      <option value="serpentine">Serpentine</option><option value="zigzag">Zig-Zag</option><option value="linear-h">Horizontal</option><option value="linear-v">Vertical</option><option value="circular">Circular</option><option value="radial">Radial</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase text-gray-500 font-semibold">Node Style</label>
                    <select value={config.nodeStyle} onChange={e => updateConfig({ nodeStyle: e.target.value as any })} className="w-full text-[10px] border border-slate-200 rounded p-1 bg-white">
                      <option value="image">Small Image</option><option value="large-image">Large Image</option><option value="number">Number</option><option value="hexagon">Hexagon</option><option value="minimal-dot">Dot</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase text-gray-500 font-semibold">Connector</label>
                    <select value={config.connectorStyle} onChange={e => updateConfig({ connectorStyle: e.target.value as any })} className="w-full text-[10px] border border-slate-200 rounded p-1 bg-white">
                      <option value="curved">Curved</option><option value="sharp">Sharp</option><option value="dashed">Dashed</option><option value="double">Double</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase text-gray-500 font-semibold">Thickness</label>
                    <input type="range" min="1" max="5" step="0.5" value={config.lineWidth} onChange={e => updateConfig({ lineWidth: parseFloat(e.target.value) })} className="w-full accent-blue-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scale' && (
            <div className="bg-white/95 backdrop-blur-md p-3 rounded-lg shadow-xl border border-black/10 w-64 text-left">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Scale / Zoom</span>
                <span className="text-[9px] font-mono text-gray-500">{Math.round((config.scale || 1) * 100)}%</span>
              </div>
              <input type="range" min="0.25" max="3.0" step="0.05" value={config.scale || 1} onChange={e => updateConfig({ scale: parseFloat(e.target.value) })} className="w-full accent-blue-600" />
            </div>
          )}

          {activeTab === 'colors' && (
            <div className="bg-white/95 backdrop-blur-md p-3 rounded-lg shadow-xl border border-black/10 w-64 text-left">
              <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Colors</div>
              <div className="space-y-2">
                {[
                  { label: 'Line Color', key: 'lineColor' },
                  { label: 'Node Border', key: 'nodeBorderColor' },
                  { label: 'Node BG', key: 'nodeBgColor' },
                  { label: 'Text Color', key: 'textColor' },
                ].map(({ label, key }) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <span className="text-[9px] uppercase text-gray-500 font-semibold">{label}</span>
                    <input type="color" value={(config as any)[key]} onChange={e => updateConfig({ [key]: e.target.value })} className="w-5 h-5 rounded cursor-pointer border border-black/10 p-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'card' && (
            <div className="bg-white/95 backdrop-blur-md p-3 rounded-lg shadow-xl border border-black/10 w-64 text-left">
              <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Overlay Settings</div>
              <label className="flex items-center gap-2 text-[10px] uppercase font-bold cursor-pointer hover:bg-black/5 p-1 -mx-1 rounded">
                <input type="checkbox" checked={config.bgEnabled || false} onChange={e => updateConfig({ bgEnabled: e.target.checked })} className="rounded accent-blue-600" />
                Enable Background
              </label>
              <div className={`flex flex-col gap-3 mt-3 ${!config.bgEnabled ? 'opacity-30 pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] uppercase text-gray-500 font-semibold">Color</span>
                  <input type="color" value={config.bgColor || '#ffffff'} onChange={e => updateConfig({ bgColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer border border-black/10 p-0" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between"><span className="text-[9px] uppercase text-gray-500 font-semibold">Opacity</span><span className="text-[9px] font-mono">{Math.round((config.bgOpacity ?? 1)*100)}%</span></div>
                  <input type="range" min="0" max="1" step="0.05" value={config.bgOpacity ?? 1} onChange={e => updateConfig({ bgOpacity: parseFloat(e.target.value) })} className="w-full accent-blue-600" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'steps' && (
            <div className="bg-white/95 backdrop-blur-md p-3 rounded-lg shadow-xl border border-black/10 w-72 text-left max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-2">
                <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Process Steps ({config.steps.length})</div>
                <button onClick={handleAddStep} className="text-[9px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">+ Add Step</button>
              </div>
              
              <div className="space-y-3">
                {config.steps.map((step, idx) => (
                  <div key={step.id} className="border border-black/10 rounded-lg p-2 bg-black/5 space-y-2 relative group/step">
                    <div className="absolute right-1 top-1 flex items-center bg-white/80 rounded shadow-sm opacity-0 group-hover/step:opacity-100 transition-opacity backdrop-blur-sm z-10">
                      <button disabled={idx === 0} onClick={() => handleMoveStep(idx, 'up')} className="p-1 hover:bg-black/5 text-[9px] disabled:opacity-30">↑</button>
                      <button disabled={idx === config.steps.length - 1} onClick={() => handleMoveStep(idx, 'down')} className="p-1 hover:bg-black/5 text-[9px] disabled:opacity-30">↓</button>
                      <button disabled={config.steps.length <= 1} onClick={() => handleDeleteStep(step.id)} className="p-1 hover:bg-red-50 text-red-500 text-[9px] disabled:opacity-30">✕</button>
                    </div>

                    <div className="flex gap-2">
                      {config.nodeStyle === 'image' && (
                        <div className="w-10 flex-shrink-0 flex flex-col gap-1 items-center justify-start mt-2">
                          <div className="w-10 h-10 rounded-full border border-black/10 overflow-hidden bg-white flex items-center justify-center">
                            {step.imageUrl ? <img src={step.imageUrl} className="w-full h-full object-cover" alt="" /> : <span className="text-[8px] text-gray-400">Img</span>}
                          </div>
                          <label className="cursor-pointer text-[8px] font-bold text-blue-600 hover:text-blue-800 uppercase text-center w-full">
                            {uploadingStepId === step.id ? '...' : 'Upload'}
                            <input type="file" accept="image/*" className="hidden" disabled={uploadingStepId !== null} onChange={e => handleStepImageUpload(step.id, e)} />
                          </label>
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        <input type="text" value={step.title} onChange={e => handleUpdateStep(step.id, { title: e.target.value })} className="w-full text-[11px] font-bold bg-transparent border-b border-transparent hover:border-black/20 focus:border-blue-500 focus:bg-white outline-none px-1 py-0.5 transition-colors" placeholder="Step Title" />
                        <textarea value={step.description} onChange={e => handleUpdateStep(step.id, { description: e.target.value })} className="w-full text-[10px] bg-transparent border border-transparent hover:border-black/20 focus:border-blue-500 focus:bg-white outline-none px-1 py-0.5 rounded resize-none h-12 custom-scrollbar transition-colors" placeholder="Description" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
