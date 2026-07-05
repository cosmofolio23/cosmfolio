'use client'

import React, { useState } from 'react'
import type { Block, FlowchartStep, FlowchartConfig } from './types'
import { PROCESS_PRESETS } from './processPresets'
import ProcessFlowchartRenderer from './ProcessFlowchartRenderer'

interface FlowchartModalEditorProps {
  isOpen: boolean
  onClose: () => void
  block: Block
  onChange: (p: Partial<Block>) => void
  onUploadImage?: (file: File) => Promise<string>
}

type TabType = 'presets' | 'style' | 'steps'

export default function FlowchartModalEditor({
  isOpen,
  onClose,
  block,
  onChange,
  onUploadImage
}: FlowchartModalEditorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('presets')
  const [uploadingStepId, setUploadingStepId] = useState<string | null>(null)

  if (!isOpen) return null

  // Ensure config exists
  const config = block.flowchartConfig || PROCESS_PRESETS[0].config

  const updateConfig = (newConfig: Partial<FlowchartConfig>) => {
    onChange({
      flowchartConfig: {
        ...config,
        ...newConfig
      }
    })
  }

  // Steps mutations
  const handleUpdateStep = (stepId: string, updates: Partial<FlowchartStep>) => {
    const updatedSteps = config.steps.map(step =>
      step.id === stepId ? { ...step, ...updates } : step
    )
    updateConfig({ steps: updatedSteps })
  }

  const handleAddStep = () => {
    const newId = String(Date.now())
    const newStep: FlowchartStep = {
      id: newId,
      title: `Step ${config.steps.length + 1}`,
      description: 'Enter description of this process step.'
    }
    updateConfig({ steps: [...config.steps, newStep] })
  }

  const handleDeleteStep = (stepId: string) => {
    if (config.steps.length <= 1) return // Keep at least 1 step
    const updatedSteps = config.steps.filter(step => step.id !== stepId)
    updateConfig({ steps: updatedSteps })
  }

  const handleStepImageUpload = async (stepId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onUploadImage) return

    setUploadingStepId(stepId)
    try {
      const url = await onUploadImage(file)
      handleUpdateStep(stepId, { imageUrl: url })
    } catch (err) {
      console.error('Error uploading step image:', err)
    } finally {
      setUploadingStepId(null)
    }
  }

  const handleMoveStep = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= config.steps.length) return

    const newSteps = [...config.steps]
    const temp = newSteps[idx]
    newSteps[idx] = newSteps[targetIdx]
    newSteps[targetIdx] = temp

    updateConfig({ steps: newSteps })
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-slate-800">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Serpentine Design Process Flowchart Builder</h3>
            <p className="text-xs text-slate-500 mt-0.5">Customize process layouts, colors, steps, and drawings directly on your canvas.</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-medium p-1 focus:outline-none"
          >
            ✕
          </button>
        </div>

        {/* Workspace Panels */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel: Live SVG Preview */}
          <div className="w-[55%] border-r border-slate-100 bg-slate-50 p-6 flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Live Canvas Preview</span>
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center p-4">
              <ProcessFlowchartRenderer block={block} />
            </div>
            <div className="bg-slate-100 border border-slate-200/60 p-3 rounded-lg mt-3 text-[11px] text-slate-500 leading-normal">
              💡 <strong>Hint:</strong> Since this renders as a vector SVG, it will retain perfect sharpness when printed or exported to PDF.
            </div>
          </div>

          {/* Right panel: Tab Editor */}
          <div className="w-[45%] flex flex-col overflow-hidden">
            {/* Tabs Selector */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setActiveTab('presets')}
                className={`flex-1 py-3 text-xs font-semibold border-b-2 focus:outline-none transition ${
                  activeTab === 'presets'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. 20+ Generic Presets
              </button>
              <button
                onClick={() => setActiveTab('style')}
                className={`flex-1 py-3 text-xs font-semibold border-b-2 focus:outline-none transition ${
                  activeTab === 'style'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                2. Layout & Colors
              </button>
              <button
                onClick={() => setActiveTab('steps')}
                className={`flex-1 py-3 text-xs font-semibold border-b-2 focus:outline-none transition ${
                  activeTab === 'steps'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                3. Steps & Drawings ({config.steps.length})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* Presets Tab */}
              {activeTab === 'presets' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">Pick one of our 20 pre-configured design methodologies to start with:</p>
                  <div className="grid grid-cols-2 gap-3.5">
                    {PROCESS_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          onChange({
                            flowchartConfig: preset.config
                          })
                        }}
                        className={`flex flex-col items-start p-3 border rounded-xl text-left hover:border-blue-500 transition ${
                          config.presetId === preset.id
                            ? 'border-blue-600 bg-blue-50/10 shadow-sm ring-1 ring-blue-600'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-900">{preset.name}</span>
                        <span className="text-[10px] text-slate-500 mt-1 leading-normal">{preset.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Style Tab */}
              {activeTab === 'style' && (
                <div className="space-y-4">
                  {/* Style selectors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Flow Path Layout</label>
                      <select
                        value={config.pathStyle}
                        onChange={e => updateConfig({ pathStyle: e.target.value as any })}
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                      >
                        <option value="serpentine">Serpentine S-Curve</option>
                        <option value="zigzag">Zig-Zag Path</option>
                        <option value="linear-h">Horizontal Line</option>
                        <option value="linear-v">Vertical Timeline</option>
                        <option value="circular">Circular Loop</option>
                        <option value="radial">Radial Spokes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Step Node Style</label>
                      <select
                        value={config.nodeStyle}
                        onChange={e => updateConfig({ nodeStyle: e.target.value as any })}
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                      >
                        <option value="image">Circle Image</option>
                        <option value="number">Numbered circle</option>
                        <option value="hexagon">Faceted Hexagon</option>
                        <option value="minimal-dot">Minimalist Dot</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Line Connection</label>
                      <select
                        value={config.connectorStyle}
                        onChange={e => updateConfig({ connectorStyle: e.target.value as any })}
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                      >
                        <option value="curved">Curved Bezier</option>
                        <option value="sharp">Sharp Joint</option>
                        <option value="dashed">Dashed Line</option>
                        <option value="double">Double Rule Line</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Line Thickness</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="0.5"
                          value={config.lineWidth}
                          onChange={e => updateConfig({ lineWidth: parseFloat(e.target.value) })}
                          className="w-full accent-blue-600"
                        />
                        <span className="text-xs font-mono font-bold w-8 text-right">{config.lineWidth}px</span>
                      </div>
                    </div>
                  </div>

                  {/* Colors pickers */}
                  <div className="border-t border-slate-100 pt-4">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Custom Color Specifications</span>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={config.lineColor}
                          onChange={e => updateConfig({ lineColor: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 overflow-hidden"
                        />
                        <div>
                          <span className="block text-[10px] text-slate-500">Connector Line</span>
                          <span className="text-xs font-mono font-semibold">{config.lineColor.toUpperCase()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={config.nodeBorderColor}
                          onChange={e => updateConfig({ nodeBorderColor: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 overflow-hidden"
                        />
                        <div>
                          <span className="block text-[10px] text-slate-500">Node Border</span>
                          <span className="text-xs font-mono font-semibold">{config.nodeBorderColor.toUpperCase()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={config.nodeBgColor}
                          onChange={e => updateConfig({ nodeBgColor: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 overflow-hidden"
                        />
                        <div>
                          <span className="block text-[10px] text-slate-500">Node Background</span>
                          <span className="text-xs font-mono font-semibold">{config.nodeBgColor.toUpperCase()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={config.textColor}
                          onChange={e => updateConfig({ textColor: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 overflow-hidden"
                        />
                        <div>
                          <span className="block text-[10px] text-slate-500">Text Label Color</span>
                          <span className="text-xs font-mono font-semibold">{config.textColor.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Steps Tab */}
              {activeTab === 'steps' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Edit text details, add drawings, or reorder step sequences:</span>
                    <button
                      onClick={handleAddStep}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 transition"
                    >
                      + Add Process Step
                    </button>
                  </div>

                  <div className="space-y-3">
                    {config.steps.map((step, idx) => (
                      <div key={step.id} className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/50 space-y-2.5 relative group">
                        {/* Control buttons */}
                        <div className="absolute right-3 top-3 flex items-center gap-1.5">
                          <button
                            disabled={idx === 0}
                            onClick={() => handleMoveStep(idx, 'up')}
                            className="p-1 rounded hover:bg-white text-xs disabled:opacity-30 focus:outline-none"
                            title="Move Up"
                          >
                            ↑
                          </button>
                          <button
                            disabled={idx === config.steps.length - 1}
                            onClick={() => handleMoveStep(idx, 'down')}
                            className="p-1 rounded hover:bg-white text-xs disabled:opacity-30 focus:outline-none"
                            title="Move Down"
                          >
                            ↓
                          </button>
                          <button
                            disabled={config.steps.length <= 1}
                            onClick={() => handleDeleteStep(step.id)}
                            className="p-1 rounded hover:bg-red-50 text-red-500 text-xs disabled:opacity-30 focus:outline-none"
                            title="Delete Step"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Title input */}
                        <div className="w-[80%]">
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Step Heading</label>
                          <input
                            type="text"
                            value={step.title}
                            onChange={e => handleUpdateStep(step.id, { title: e.target.value })}
                            className="w-full text-xs font-bold border border-slate-200 rounded-md p-1.5 bg-white focus:outline-blue-500"
                          />
                        </div>

                        {/* Description input */}
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Description text</label>
                          <textarea
                            value={step.description}
                            onChange={e => handleUpdateStep(step.id, { description: e.target.value })}
                            className="w-full text-xs border border-slate-200 rounded-md p-1.5 bg-white h-12 focus:outline-blue-500 resize-none"
                          />
                        </div>

                        {/* Step Image selection */}
                        <div className="flex items-center gap-3">
                          {config.nodeStyle === 'image' && (
                            <>
                              <div className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                                {step.imageUrl ? (
                                  <img src={step.imageUrl} className="w-full h-full object-cover" alt="step thumbnail" />
                                ) : (
                                  <span className="text-[10px] text-slate-400">Illust</span>
                                )}
                              </div>
                              <label className="cursor-pointer px-2.5 py-1.5 border border-slate-200 rounded-md text-[10px] font-bold bg-white text-slate-600 hover:bg-slate-50 transition">
                                {uploadingStepId === step.id ? 'Uploading...' : 'Upload Image'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={uploadingStepId !== null}
                                  onChange={e => handleStepImageUpload(step.id, e)}
                                />
                              </label>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
          >
            Apply to Canvas & Close
          </button>
        </div>
      </div>
    </div>
  )
}
