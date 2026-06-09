/**
 * Asset Details Modal — click an asset to view/edit its full metadata.
 * Edit scale, orientation, title, caption, featured flag, and delete.
 */

import React, { useState } from 'react'
import { X, Trash2, Star } from 'lucide-react'
import { libraryApi, type LibraryAsset } from '@/lib/libraryApi'
import { ASSET_TAXONOMY, isScaled, type AssetType, type AssetCategory } from '@/lib/assetTaxonomy'

const SCALES = ['1:1', '1:5', '1:10', '1:20', '1:50', '1:100', '1:200', '1:500', '1:1000']

interface AssetModalProps {
  asset: LibraryAsset | null
  projectId: string
  onClose: () => void
  onUpdated: (asset: LibraryAsset) => void
  onDeleted: (assetId: string) => void
}

export function AssetModal({ asset, projectId, onClose, onUpdated, onDeleted }: AssetModalProps) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<Partial<LibraryAsset>>(asset || {})

  if (!asset) return null

  const handleSave = async () => {
    setEditing(true)
    try {
      const updated = await libraryApi.updateAsset(projectId, asset.id, form)
      onUpdated(updated)
      onClose()
    } catch (e) {
      alert('Failed to update asset')
    } finally {
      setEditing(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this asset? This cannot be undone.')) return
    setDeleting(true)
    try {
      await libraryApi.deleteAsset(projectId, asset.id)
      onDeleted(asset.id)
      onClose()
    } catch (e) {
      alert('Failed to delete asset')
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Asset Details</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Preview */}
          {asset.url && (
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img src={asset.url} alt={asset.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Title</label>
            <input
              type="text"
              value={form.title || ''}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-accent-gold"
            />
          </div>

          {/* Caption */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Caption</label>
            <textarea
              value={form.caption || ''}
              onChange={e => setForm({ ...form, caption: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-accent-gold"
            />
          </div>

          {/* Category & Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Category</label>
              <select
                value={form.category || 'info'}
                onChange={e => {
                  const cat = e.target.value as AssetCategory
                  const firstType = ASSET_TAXONOMY[cat]?.types[0]?.type || 'other'
                  setForm({ ...form, category: cat, asset_type: firstType as AssetType })
                }}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-accent-gold"
              >
                {Object.entries(ASSET_TAXONOMY).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Type</label>
              <select
                value={form.asset_type || 'other'}
                onChange={e => setForm({ ...form, asset_type: e.target.value as AssetType })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-accent-gold"
              >
                {ASSET_TAXONOMY[form.category as AssetCategory]?.types.map(t => (
                  <option key={t.type} value={t.type}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Scale (if applicable) */}
          {isScaled(form.asset_type as AssetType) && (
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Scale</label>
              <select
                value={form.scale || ''}
                onChange={e => setForm({ ...form, scale: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-accent-gold"
              >
                <option value="">Not specified</option>
                {SCALES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {/* Orientation */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Orientation</label>
            <select
              value={form.orientation || 'landscape'}
              onChange={e => setForm({ ...form, orientation: e.target.value as 'portrait' | 'landscape' })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-accent-gold"
            >
              <option value="landscape">Landscape</option>
              <option value="portrait">Portrait</option>
            </select>
          </div>

          {/* Featured + Vector flags */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={form.is_featured || false}
                onChange={e => setForm({ ...form, is_featured: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Featured (best pick)</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={form.is_vector || false}
                onChange={e => setForm({ ...form, is_vector: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Vector (SVG/PDF)</span>
            </label>
          </div>

          {/* File info */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
            <p><strong>Storage:</strong> {asset.storage_path}</p>
            {asset.width_px && <p><strong>Dimensions:</strong> {asset.width_px}×{asset.height_px}px</p>}
            {asset.file_size && <p><strong>Size:</strong> {(asset.file_size / 1024 / 1024).toFixed(1)}MB</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={handleSave}
              disabled={editing}
              className="flex-1 px-4 py-2.5 bg-accent-gold text-[#1A1A1A] rounded-lg font-medium hover:brightness-95 disabled:opacity-50"
            >
              {editing ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
