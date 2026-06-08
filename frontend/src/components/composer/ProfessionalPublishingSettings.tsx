/**
 * Professional Publishing Settings Panel
 *
 * Integrates Phases 1-4: Page Size, Spreads, Master Pages, Backgrounds, Grid, Scales
 * Minimal integration layer for the Portfolio Generator & Template editors.
 */

import React, { useState } from 'react'
import { PAGE_SIZES, type Portfolio, type PageSize, type MasterPage, type BackgroundLayer, type GridSettings, type ArchScale } from './publishingTypes'
import { MasterPageEditor } from './MasterPageEditor'
import { BackgroundLayerEditor } from './BackgroundLayerEditor'
import { GridEditor } from './GridEditor'
import { ArchitecturalScaleEditor } from './ArchitecturalScaleEditor'
import type { DrawingMetadata } from './publishingTypes'

interface ProfessionalPublishingSettingsProps {
  portfolio?: Portfolio
  onUpdate?: (portfolio: Portfolio) => void
}

export function ProfessionalPublishingSettings({ portfolio, onUpdate }: ProfessionalPublishingSettingsProps) {
  const [activeTab, setActiveTab] = useState<'page-size' | 'masters' | 'backgrounds' | 'grid' | 'scale'>('page-size')

  if (!portfolio || !onUpdate) return null

  const tabs = ['page-size', 'masters', 'backgrounds', 'grid', 'scale'] as const
  const tabLabels: Record<typeof tabs[number], string> = {
    'page-size': '📄 Page Size',
    'masters': '📋 Master Pages',
    'backgrounds': '🎨 Backgrounds',
    'grid': '📐 Grid',
    'scale': '📐 Arch Scale',
  }

  return (
    <div className="space-y-4">
      {/* Tab buttons */}
      <div className="flex gap-1 flex-wrap">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition ${activeTab === t ? 'bg-blue-600 text-white' : 'border bg-white text-gray-600 hover:border-blue-400'}`}
          >
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-3">
        {/* Page Size */}
        {activeTab === 'page-size' && (
          <div className="space-y-2">
            <select
              value={portfolio.pageSize.preset}
              onChange={e => {
                const p = e.target.value as keyof typeof PAGE_SIZES
                const size = PAGE_SIZES[p] || PAGE_SIZES['a4-portrait']
                onUpdate({ ...portfolio, pageSize: size })
              }}
              className="w-full px-3 py-2 border rounded text-sm"
            >
              {Object.entries(PAGE_SIZES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.name}
                </option>
              ))}
            </select>

            {portfolio.pageSize.preset === 'custom' && (
              <div className="space-y-2 p-3 bg-gray-50 rounded border">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase text-gray-500">Width (mm)</label>
                    <input
                      type="number"
                      value={portfolio.pageSize.width}
                      onChange={e => onUpdate({ ...portfolio, pageSize: { ...portfolio.pageSize, width: parseInt(e.target.value) } })}
                      className="w-full px-2 py-1 border rounded text-xs"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] uppercase text-gray-500">Height (mm)</label>
                    <input
                      type="number"
                      value={portfolio.pageSize.height}
                      onChange={e => onUpdate({ ...portfolio, pageSize: { ...portfolio.pageSize, height: parseInt(e.target.value) } })}
                      className="w-full px-2 py-1 border rounded text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="text-[10px] text-gray-500 p-2 bg-blue-50 rounded">
              Current: {portfolio.pageSize.width}×{portfolio.pageSize.height}mm ({portfolio.pageSize.pxWidth || 'auto'}×{portfolio.pageSize.pxHeight || 'auto'}px)
            </div>
          </div>
        )}

        {/* Master Pages */}
        {activeTab === 'masters' && (
          <div className="space-y-2">
            {portfolio.masterPages?.map(m => (
              <MasterPageEditor
                key={m.id}
                master={m}
                onUpdate={m => onUpdate({ ...portfolio, masterPages: portfolio.masterPages?.map(x => (x.id === m.id ? m : x)) })}
                onDelete={() => onUpdate({ ...portfolio, masterPages: portfolio.masterPages?.filter(x => x.id !== m.id) })}
              />
            ))}

            <button
              onClick={() => {
                const newMaster: MasterPage = {
                  id: `master-${Date.now()}`,
                  name: `Master ${(portfolio.masterPages?.length || 0) + 1}`,
                  elements: [],
                  preserveOnLayoutChange: true,
                }
                onUpdate({ ...portfolio, masterPages: [...(portfolio.masterPages || []), newMaster] })
              }}
              className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded text-xs font-medium text-gray-600 hover:border-blue-400"
            >
              + Add Master Page
            </button>
          </div>
        )}

        {/* Backgrounds */}
        {activeTab === 'backgrounds' && (
          <div className="space-y-2">
            {portfolio.backgrounds?.map(b => (
              <BackgroundLayerEditor
                key={b.id}
                layer={b}
                onUpdate={b => onUpdate({ ...portfolio, backgrounds: portfolio.backgrounds?.map(x => (x.id === b.id ? b : x)) })}
                onDelete={() => onUpdate({ ...portfolio, backgrounds: portfolio.backgrounds?.filter(x => x.id !== b.id) })}
              />
            ))}

            <button
              onClick={() => {
                const newBg: BackgroundLayer = {
                  id: `bg-${Date.now()}`,
                  name: `Background ${(portfolio.backgrounds?.length || 0) + 1}`,
                  zIndex: (portfolio.backgrounds?.length || 0),
                  opacity: 1,
                  visible: true,
                  definitions: [{ type: 'solid', color: '#ffffff' }],
                  appliesTo: 'current-page',
                }
                onUpdate({ ...portfolio, backgrounds: [...(portfolio.backgrounds || []), newBg] })
              }}
              className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded text-xs font-medium text-gray-600 hover:border-blue-400"
            >
              + Add Background Layer
            </button>
          </div>
        )}

        {/* Grid */}
        {activeTab === 'grid' && (
          <GridEditor
            grid={portfolio.grid || { type: 'column', enabled: true, snapEnabled: true, snapModes: ['to-grid'], showGrid: true, columns: 12, columnGutter: 20 }}
            onUpdate={g => onUpdate({ ...portfolio, grid: g })}
          />
        )}

        {/* Architectural Scale */}
        {activeTab === 'scale' && (
          <div className="p-3 bg-gray-50 rounded border text-[10px] text-gray-600">
            <p className="mb-2 font-semibold">Architectural Scales</p>
            <p>Available scales: 1:1 through 1:1000</p>
            <p className="mt-1">Apply to individual drawings via the ArchitecturalScaleEditor component in each page/block.</p>
          </div>
        )}
      </div>
    </div>
  )
}
