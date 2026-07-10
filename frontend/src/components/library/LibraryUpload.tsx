/**
 * Library Upload Flow — the "dump 40 files at 2am" experience.
 *
 * Design principles (from the Library plan):
 *  • Drop everything → Cosmo guesses category/type from the filename.
 *  • Student corrects in one click via the category dropdown.
 *  • Progressive metadata: scale/north are NOT asked here — only when an asset
 *    later lands on a technical sheet that needs them.
 *  • Forgiving: unknown files land in "Other" and still upload fine.
 */

import React, { useCallback, useRef, useState } from 'react'
import { Upload, Check, Loader2, X } from 'lucide-react'
import {
  ASSET_TAXONOMY,
  inferFromFilename,
  isVectorFile,
  type AssetCategory,
  type AssetType,
  categoryOf,
} from '@/lib/assetTaxonomy'
import { libraryApi } from '@/lib/libraryApi'

interface StagedFile {
  id: string
  file: File
  category: AssetCategory
  type: AssetType
  scale?: string
  confident: boolean
  status: 'staged' | 'uploading' | 'done' | 'error'
  error?: string
}

interface LibraryUploadProps {
  projectId: string
  onUploaded?: (count: number) => void
}

let _seq = 0

export function LibraryUpload({ projectId, onUploaded }: LibraryUploadProps) {
  const [staged, setStaged] = useState<StagedFile[]>([])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files)
    
    // Compress files first
    const compressedFiles = await Promise.all(
      arr.map(async (file) => {
        // Only compress images, skip SVGs or PDFs
        if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
          return await import('@/utils/imageCompression').then(m => m.compressImageForPrint(file))
        }
        return file
      })
    )

    const next: StagedFile[] = compressedFiles.map(file => {
      const guess = inferFromFilename(file.name)
      return {
        id: `f${_seq++}`,
        file,
        category: guess.category,
        type: guess.type,
        scale: guess.scale,
        confident: guess.confident,
        status: 'staged' as const,
      }
    })
    setStaged(prev => [...prev, ...next])
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
    },
    [addFiles]
  )

  const updateStaged = (id: string, patch: Partial<StagedFile>) =>
    setStaged(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)))

  const removeStaged = (id: string) => setStaged(prev => prev.filter(s => s.id !== id))

  const handleUpload = async () => {
    const toUpload = staged.filter(s => s.status === 'staged')
    if (!toUpload.length) return
    setUploading(true)

    // The backend re-derives category from filename, but we send the user's
    // corrected files; after upload we PUT corrections that differ from the guess.
    try {
      const res = await libraryApi.uploadAssets(projectId, toUpload.map(s => s.file))
      // Mark done + apply any user corrections (category/type the user changed).
      const created = res.created || []
      for (let i = 0; i < toUpload.length; i++) {
        const s = toUpload[i]
        const asset = created[i]
        updateStaged(s.id, { status: 'done' })
        if (asset && (asset.asset_type !== s.type)) {
          try {
            await libraryApi.updateAsset(projectId, asset.id, { category: s.category, asset_type: s.type, scale: s.scale })
          } catch {
            /* non-fatal — correction can be redone in the grid */
          }
        }
      }
      onUploaded?.(created.length)
    } catch (e: any) {
      toUpload.forEach(s => updateStaged(s.id, { status: 'error', error: e?.message || 'Upload failed' }))
    } finally {
      setUploading(false)
    }
  }

  const pending = staged.filter(s => s.status === 'staged').length
  const lowConfidence = staged.filter(s => s.status === 'staged' && !s.confident).length

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition ${
          dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <Upload className="mx-auto mb-3 text-gray-400" size={36} />
        <p className="text-sm font-medium text-gray-700">Drop drawings, renders, diagrams — anything</p>
        <p className="text-xs text-gray-500 mt-1">PDF · SVG · PNG · JPG. Cosmo sorts them for you.</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.svg,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={e => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* Staged list */}
      {staged.length > 0 && (
        <div className="space-y-2">
          {lowConfidence > 0 && (
            <p className="text-xs text-amber-600">
              ⚠ {lowConfidence} file{lowConfidence > 1 ? 's' : ''} need a quick category check (highlighted).
            </p>
          )}

          <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
            {staged.map(s => (
              <div
                key={s.id}
                className={`flex items-center gap-2 p-2 rounded-lg border text-sm ${
                  !s.confident && s.status === 'staged' ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'
                }`}
              >
                {/* status icon */}
                <div className="w-5 flex-shrink-0">
                  {s.status === 'done' && <Check size={16} className="text-green-600" />}
                  {s.status === 'uploading' && <Loader2 size={16} className="text-blue-600 animate-spin" />}
                  {s.status === 'error' && <X size={16} className="text-red-600" />}
                </div>

                {/* filename */}
                <div className="flex-1 min-w-0">
                  <div className="truncate text-gray-800">{s.file.name}</div>
                  {isVectorFile(s.file.name) && (
                    <span className="text-[10px] text-emerald-600">vector — stays crisp</span>
                  )}
                </div>

                {/* category */}
                <select
                  value={s.category}
                  disabled={s.status !== 'staged'}
                  onChange={e => {
                    const cat = e.target.value as AssetCategory
                    const firstType = ASSET_TAXONOMY[cat].types[0].type
                    updateStaged(s.id, { category: cat, type: firstType, confident: true })
                  }}
                  className="text-xs border rounded px-1.5 py-1 bg-white"
                >
                  {(Object.keys(ASSET_TAXONOMY) as AssetCategory[]).map(c => (
                    <option key={c} value={c}>{ASSET_TAXONOMY[c].icon} {ASSET_TAXONOMY[c].label}</option>
                  ))}
                </select>

                {/* type */}
                <select
                  value={s.type}
                  disabled={s.status !== 'staged'}
                  onChange={e => {
                    const t = e.target.value as AssetType
                    updateStaged(s.id, { type: t, category: categoryOf(t), confident: true })
                  }}
                  className="text-xs border rounded px-1.5 py-1 bg-white max-w-[130px]"
                >
                  {ASSET_TAXONOMY[s.category].types.map(t => (
                    <option key={t.type} value={t.type}>{t.label}</option>
                  ))}
                </select>

                {s.status === 'staged' && (
                  <button onClick={() => removeStaged(s.id)} className="text-gray-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* action */}
          <button
            onClick={handleUpload}
            disabled={uploading || pending === 0}
            className="w-full mt-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            {uploading ? 'Uploading…' : `Add ${pending} file${pending === 1 ? '' : 's'} to Library`}
          </button>
        </div>
      )}
    </div>
  )
}
