'use client'

import { useRef, useState } from 'react'
import type { Block, DesignTokens, LegendItem, MetaField } from './types'

/* ----------------------------- Editable Text ----------------------------- */

export function EditableText({
  value, onChange, className, style, multiline = false, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
  style?: React.CSSProperties
  multiline?: boolean
  placeholder?: string
}) {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onBlur={e => onChange(e.currentTarget.textContent || '')}
      className={`outline-none focus:bg-yellow-100/40 hover:bg-yellow-50/30 rounded px-1 -mx-1 transition cursor-text ${multiline ? 'whitespace-pre-line' : ''} ${className || ''}`}
      style={style}
    >
      {value}
    </div>
  )
}

/* ------------------------------- Image Block ------------------------------ */

export function ImageBlock({
  block, tokens, onChange, aspect = 'aspect-[4/3]', showLabel = true, fill = false, onUpload,
}: {
  block: Block
  tokens: DesignTokens
  onChange: (patch: Partial<Block>) => void
  aspect?: string
  showLabel?: boolean
  fill?: boolean
  onUpload?: (file: File) => Promise<string>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file before upload
    const valid = file.type.startsWith('image/')
    const size = file.size / 1024 / 1024
    if (!valid) {
      alert(`❌ Not an image: ${file.type || 'unknown type'}`)
      return
    }
    if (size < 0.1) {
      alert(`❌ File too small (${size.toFixed(2)}MB). Min 100KB.`)
      return
    }
    if (size > 100) {
      alert(`❌ File too large (${size.toFixed(1)}MB). Max 100MB.`)
      return
    }

    if (onUpload) {
      setUploading(true)
      try {
        const url = await onUpload(file)
        onChange({ imageUrl: url })
      } catch (err: any) {
        console.error('Image upload failed:', err)
        const msg = err?.message || 'Unknown error'
        const details = msg.includes('401') ? 'Your session expired. Please refresh.' :
                       msg.includes('413') ? 'File is too large (max 100MB).' :
                       msg.includes('400') ? 'Invalid file format.' :
                       msg.includes('network') ? 'Network error. Check your connection.' :
                       `${msg.slice(0, 80)}`
        alert(`❌ Upload failed: ${details}`)
      } finally {
        setUploading(false)
      }
    } else {
      onChange({ imageUrl: URL.createObjectURL(file) })
    }
  }

  const typeBadge: Record<string, string> = {
    render: 'RENDER', plan: 'PLAN', section: 'SECTION', diagram: 'DIAGRAM',
  }

  return (
    <div className="group/img relative w-full h-full flex flex-col min-h-0">
      {uploading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}
      <div className={`relative w-full overflow-hidden ${fill ? 'flex-1 min-h-0' : aspect}`} style={{ background: 'rgba(0,0,0,0.05)' }}>
        {block.imageUrl ? (
          <>
            <img src={block.imageUrl} alt={block.label || ''} className="w-full h-full object-cover" />
            <button
              onClick={() => onChange({ imageUrl: '' })}
              className="absolute top-2 right-2 bg-black/70 text-white w-7 h-7 rounded-full text-sm opacity-0 group-hover/img:opacity-100 transition"
              title="Remove image"
            >✕</button>
            <button
              onClick={() => inputRef.current?.click()}
              className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs opacity-0 group-hover/img:opacity-100 transition"
            >Replace</button>
          </>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50/50 transition border-2 border-dashed"
            style={{ borderColor: 'rgba(0,0,0,0.15)' }}
          >
            <span className="text-3xl mb-1">＋</span>
            <span className="text-[10px] uppercase tracking-widest font-semibold">{typeBadge[block.type] || 'IMAGE'}</span>
          </button>
        )}
        {/* type badge */}
        <span
          className="absolute top-2 left-2 text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm"
          style={{ background: tokens.accent, color: pickContrast(tokens.accent) }}
        >
          {typeBadge[block.type] || 'IMG'}
        </span>
      </div>

      {/* Drawing label + scale (architecture title block style) */}
      {showLabel && (
        <div className="flex items-center justify-between mt-1.5 pb-1 border-b" style={{ borderColor: tokens.muted }}>
          <EditableText
            value={block.label || ''}
            onChange={v => onChange({ label: v })}
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: tokens.text, fontFamily: tokens.bodyFont }}
          />
          {(block.type === 'plan' || block.type === 'section') && (
            <EditableText
              value={block.scale || ''}
              onChange={v => onChange({ scale: v })}
              className="text-[10px] tabular-nums"
              style={{ color: tokens.muted, fontFamily: tokens.bodyFont }}
            />
          )}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  )
}

/* ------------------------------- Legend Block ----------------------------- */

export function LegendBlock({
  block, tokens, onChange,
}: {
  block: Block
  tokens: DesignTokens
  onChange: (patch: Partial<Block>) => void
}) {
  const items = block.legendItems || []
  const update = (idx: number, patch: Partial<LegendItem>) => {
    const next = items.map((it, i) => i === idx ? { ...it, ...patch } : it)
    onChange({ legendItems: next })
  }
  const add = () => onChange({ legendItems: [...items, { key: String(items.length + 1).padStart(2, '0'), label: 'New space' }] })
  const remove = (idx: number) => onChange({ legendItems: items.filter((_, i) => i !== idx) })

  return (
    <div className="w-full">
      <EditableText
        value={block.label || 'LEGEND'}
        onChange={v => onChange({ label: v })}
        className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2 pb-1 border-b"
        style={{ color: tokens.primary, borderColor: tokens.accent, fontFamily: tokens.bodyFont }}
      />
      <div className="space-y-1">
        {items.map((it, idx) => (
          <div key={idx} className="group/leg flex items-center gap-2 text-[11px]" style={{ fontFamily: tokens.bodyFont }}>
            <span
              className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-sm text-[9px] font-bold"
              style={{ background: tokens.accent, color: pickContrast(tokens.accent) }}
            >
              <EditableText value={it.key} onChange={v => update(idx, { key: v })} />
            </span>
            <EditableText
              value={it.label}
              onChange={v => update(idx, { label: v })}
              className="flex-1"
              style={{ color: tokens.text }}
            />
            <button onClick={() => remove(idx)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover/leg:opacity-100 transition text-xs">✕</button>
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: tokens.accent }}>
        + Add item
      </button>
    </div>
  )
}

/* -------------------------------- Meta Block ------------------------------ */

export function MetaBlock({
  block, tokens, onChange, layout = 'stack',
}: {
  block: Block
  tokens: DesignTokens
  onChange: (patch: Partial<Block>) => void
  layout?: 'stack' | 'inline'
}) {
  const fields = block.fields || []
  const update = (idx: number, patch: Partial<MetaField>) => {
    onChange({ fields: fields.map((f, i) => i === idx ? { ...f, ...patch } : f) })
  }
  const add = () => onChange({ fields: [...fields, { label: 'Label', value: 'Value' }] })
  const remove = (idx: number) => onChange({ fields: fields.filter((_, i) => i !== idx) })

  return (
    <div className={layout === 'inline' ? 'flex flex-wrap gap-x-8 gap-y-2' : 'space-y-2'}>
      {fields.map((f, idx) => (
        <div key={idx} className="group/meta">
          <EditableText
            value={f.label}
            onChange={v => update(idx, { label: v })}
            className="text-[9px] font-bold uppercase tracking-[0.15em]"
            style={{ color: tokens.muted, fontFamily: tokens.bodyFont }}
          />
          <div className="flex items-center gap-1">
            <EditableText
              value={f.value}
              onChange={v => update(idx, { value: v })}
              className="text-[13px] font-medium"
              style={{ color: tokens.text, fontFamily: tokens.bodyFont }}
            />
            <button onClick={() => remove(idx)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover/meta:opacity-100 text-xs">✕</button>
          </div>
        </div>
      ))}
      <button onClick={add} className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: tokens.accent }}>+ Field</button>
    </div>
  )
}

/* ------------------------------ Text Blocks ------------------------------- */

export function TitleBlock({ block, tokens, onChange, size = 'lg' }: { block: Block; tokens: DesignTokens; onChange: (p: Partial<Block>) => void; size?: 'sm' | 'lg' | 'xl' }) {
  const sizes = { sm: 'text-2xl', lg: 'text-4xl', xl: 'text-6xl' }
  return (
    <EditableText
      value={block.text || ''}
      onChange={v => onChange({ text: v })}
      className={`font-bold leading-tight ${sizes[size]}`}
      style={{ color: tokens.primary, fontFamily: tokens.headingFont }}
    />
  )
}

export function SubtitleBlock({ block, tokens, onChange }: { block: Block; tokens: DesignTokens; onChange: (p: Partial<Block>) => void }) {
  return (
    <EditableText
      value={block.text || ''}
      onChange={v => onChange({ text: v })}
      className="text-lg"
      style={{ color: tokens.accent, fontFamily: tokens.bodyFont }}
    />
  )
}

export function DescriptionBlock({ block, tokens, onChange }: { block: Block; tokens: DesignTokens; onChange: (p: Partial<Block>) => void }) {
  return (
    <EditableText
      value={block.text || ''}
      onChange={v => onChange({ text: v })}
      multiline
      className="text-sm leading-relaxed"
      style={{ color: tokens.text, fontFamily: tokens.bodyFont }}
    />
  )
}

/* -------------------------------- helpers --------------------------------- */

export function pickContrast(hex?: string): string {
  if (!hex) return '#fff'
  try {
    const c = hex.replace('#', '')
    const full = c.length === 3 ? c.split('').map(x => x + x).join('') : c
    const r = parseInt(full.slice(0, 2), 16)
    const g = parseInt(full.slice(2, 4), 16)
    const b = parseInt(full.slice(4, 6), 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55 ? '#ffffff' : '#111111'
  } catch { return '#ffffff' }
}
