/**
 * Library Asset Grid — the project's unified store, grouped by canonical category.
 *
 * Inline corrections: change an asset's type, toggle "featured" (the student's
 * best picks the generators prefer), or delete. Scale/north stay progressive —
 * surfaced only for drawing-category assets.
 */

import React, { useMemo, useState } from 'react'
import { Star, Trash2, FileText } from 'lucide-react'
import {
  ASSET_TAXONOMY,
  categoryOf,
  isScaled,
  type AssetCategory,
  type AssetType,
} from '@/lib/assetTaxonomy'
import { libraryApi, type LibraryAsset } from '@/lib/libraryApi'

const SCALES = ['1:1', '1:5', '1:10', '1:20', '1:50', '1:100', '1:200', '1:500', '1:1000']

interface LibraryAssetGridProps {
  projectId: string
  assets: LibraryAsset[]
  onChange: (assets: LibraryAsset[]) => void
}

export function LibraryAssetGrid({ projectId, assets, onChange }: LibraryAssetGridProps) {
  const [busy, setBusy] = useState<string | null>(null)

  const grouped = useMemo(() => {
    const g: Record<AssetCategory, LibraryAsset[]> = {
      drawing: [], visual: [], process: [], analysis: [], text: [], info: [],
    }
    for (const a of assets) (g[a.category] ?? g.info).push(a)
    return g
  }, [assets])

  const patch = async (asset: LibraryAsset, update: Partial<LibraryAsset>) => {
    setBusy(asset.id)
    const optimistic = assets.map(a => (a.id === asset.id ? { ...a, ...update } : a))
    onChange(optimistic)
    try {
      await libraryApi.updateAsset(projectId, asset.id, update)
    } catch {
      onChange(assets) // revert
    } finally {
      setBusy(null)
    }
  }

  const remove = async (asset: LibraryAsset) => {
    if (!confirm(`Remove "${asset.title || 'asset'}" from the library?`)) return
    setBusy(asset.id)
    onChange(assets.filter(a => a.id !== asset.id))
    try {
      await libraryApi.deleteAsset(projectId, asset.id)
    } catch {
      onChange(assets)
    } finally {
      setBusy(null)
    }
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        No assets yet — drop files above to start building this project.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {(Object.keys(ASSET_TAXONOMY) as AssetCategory[]).map(cat => {
        const items = grouped[cat]
        if (!items?.length) return null
        return (
          <section key={cat}>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span>{ASSET_TAXONOMY[cat].icon}</span>
              {ASSET_TAXONOMY[cat].label}
              <span className="text-xs font-normal text-gray-400">({items.length})</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {items.map(asset => (
                <div
                  key={asset.id}
                  className={`group relative rounded-lg border bg-white overflow-hidden ${
                    busy === asset.id ? 'opacity-60' : ''
                  } ${asset.is_featured ? 'border-amber-400 ring-1 ring-amber-300' : 'border-gray-200'}`}
                >
                  {/* preview */}
                  <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
                    {asset.url ? (
                      <img src={asset.url} alt={asset.title || ''} className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="text-gray-300" size={28} />
                    )}
                    {asset.is_vector && (
                      <span className="absolute top-1 left-1 text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded">VECTOR</span>
                    )}
                  </div>

                  {/* featured + delete (hover) */}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => patch(asset, { is_featured: !asset.is_featured })}
                      title={asset.is_featured ? 'Unfeature' : 'Mark as best'}
                      className={`p-1 rounded ${asset.is_featured ? 'bg-amber-400 text-white' : 'bg-white/90 text-gray-600 hover:text-amber-500'}`}
                    >
                      <Star size={13} fill={asset.is_featured ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => remove(asset)}
                      title="Remove"
                      className="p-1 rounded bg-white/90 text-gray-600 hover:text-red-500"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* meta */}
                  <div className="p-2 space-y-1.5">
                    <div className="truncate text-xs text-gray-700" title={asset.title}>{asset.title || 'Untitled'}</div>

                    {/* type corrector */}
                    <select
                      value={asset.asset_type}
                      onChange={e => {
                        const t = e.target.value as AssetType
                        patch(asset, { asset_type: t, category: categoryOf(t) })
                      }}
                      className="w-full text-[11px] border rounded px-1 py-0.5 bg-white"
                    >
                      {(Object.keys(ASSET_TAXONOMY) as AssetCategory[]).map(c => (
                        <optgroup key={c} label={ASSET_TAXONOMY[c].label}>
                          {ASSET_TAXONOMY[c].types.map(t => (
                            <option key={t.type} value={t.type}>{t.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>

                    {/* progressive metadata: scale only for drawings */}
                    {isScaled(asset.asset_type) && (
                      <select
                        value={asset.scale || ''}
                        onChange={e => patch(asset, { scale: e.target.value })}
                        className="w-full text-[11px] border rounded px-1 py-0.5 bg-white font-mono"
                      >
                        <option value="">Set scale…</option>
                        {SCALES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
