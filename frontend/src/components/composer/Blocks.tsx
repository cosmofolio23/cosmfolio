'use client'

import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Block, DesignTokens, LegendItem, MetaField } from './types'

/* ----------------------------- Editable Text ----------------------------- */

export function EditableText({
  value,
  onChange,
  className,
  style,
  multiline = false,
  placeholder,
  fontFamily,
  fontSize,
  color,
  align,
  bold,
  onFormatChange,
  onAiPolish,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
  style?: React.CSSProperties
  multiline?: boolean
  placeholder?: string
  fontFamily?: string
  fontSize?: number
  color?: string
  align?: 'left' | 'center' | 'right'
  bold?: boolean
  onFormatChange?: (patch: any) => void
  onAiPolish?: (text: string) => Promise<string>
}) {
  const ref = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [isSelected, setIsSelected] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isPolishing, setIsPolishing] = useState(false)
  const [tbPos, setTbPos] = useState<{ top: number; left: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Position the floating toolbar above the text in viewport (fixed) coords so it
  // is never clipped by the page's overflow:hidden. getBoundingClientRect already
  // accounts for the canvas CSS zoom.
  const updateTbPos = () => {
    const r = wrapperRef.current?.getBoundingClientRect()
    if (r) setTbPos({ top: r.top, left: r.left + r.width / 2 })
  }
  useEffect(() => {
    if (!isSelected) return
    updateTbPos()
    const h = () => updateTbPos()
    window.addEventListener('scroll', h, true)
    window.addEventListener('resize', h)
    return () => { window.removeEventListener('scroll', h, true); window.removeEventListener('resize', h) }
  }, [isSelected])

  const beginEdit = () => {
    setIsSelected(true)
    setIsEditing(true)
    setTimeout(() => {
      updateTbPos()
      ref.current?.focus()
      if (ref.current) {
        const range = document.createRange()
        const sel = window.getSelection()
        range.selectNodeContents(ref.current)
        range.collapse(false)
        sel?.removeAllRanges()
        sel?.addRange(range)
      }
    }, 10)
  }

  // Sync external value changes (e.g., AI auto-fill) when the element is NOT focused
  const prevValueRef = useRef(value)
  if (prevValueRef.current !== value) {
    prevValueRef.current = value
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.textContent = value
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setIsSelected(true)
    // Focus the contentEditable element
    setTimeout(() => {
      ref.current?.focus()
      // Move cursor to the end
      if (ref.current) {
        const range = document.createRange()
        const sel = window.getSelection()
        range.selectNodeContents(ref.current)
        range.collapse(false)
        sel?.removeAllRanges()
        sel?.addRange(range)
      }
    }, 10)
  }

  const handleBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget && (wrapperRef.current?.contains(relatedTarget) || relatedTarget.closest('.floating-toolbar-portal'))) {
      return
    }
    setIsEditing(false)
    setIsSelected(false)
    onChange(ref.current?.textContent || '')
  }

  useEffect(() => {
    if (!isSelected) return
    const handleDocumentClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        if ((e.target as Element).closest('.floating-toolbar-portal')) return;
        setIsSelected(false)
        setIsEditing(false)
        onChange(ref.current?.textContent || '')
      }
    }
    document.addEventListener('mousedown', handleDocumentClick)
    return () => document.removeEventListener('mousedown', handleDocumentClick)
  }, [isSelected, onChange])

  return (
    <div ref={wrapperRef} className="relative group/edittext inline-block min-w-[30px]" onBlur={handleBlur}>
      <div
        ref={ref}
        contentEditable={isEditing}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onClick={(e) => {
          e.stopPropagation()
          beginEdit()
        }}
        onDoubleClick={handleDoubleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !multiline) {
            e.preventDefault()
            ref.current?.blur()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            if (ref.current) ref.current.textContent = value
            ref.current?.blur()
          }
        }}
        className={`outline-none rounded px-1 -mx-1 transition ${
          isEditing ? 'cursor-text outline outline-1 outline-blue-400' : isSelected ? 'ring-2 ring-blue-500 bg-blue-50/20' : 'hover:bg-yellow-50/30'
        } ${multiline ? 'whitespace-pre-line' : ''} ${className || ''}`}
        style={style}
      >
        {value}
      </div>

      {/* Floating Toolbar — portalled to body so the page's overflow:hidden
          never clips it (Google-Docs-style toolbar above the text). */}
      {isSelected && onFormatChange && mounted && tbPos && createPortal(
        <div
          className="fixed z-[9999] floating-toolbar-portal flex items-center gap-1.5 bg-slate-900 text-white rounded-lg p-2 shadow-2xl border border-slate-700/60 whitespace-nowrap text-[11px]"
          style={{ top: Math.max(8, tbPos.top - 8), left: tbPos.left, transform: 'translate(-50%, -100%)' }}
          onMouseDown={e => { 
            const target = e.target as HTMLElement
            if (target.tagName !== 'INPUT' && target.tagName !== 'SELECT') {
              e.preventDefault() 
            }
            e.stopPropagation() 
          }} // keep editor focus + don't trigger click-outside deselect
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-slate-400 uppercase">Font</span>
            <select
              value={fontFamily || ''}
              onChange={e => onFormatChange({ fontFamily: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-white text-[9px]"
            >
              <option value="">Default</option>
              <option value="Inter">Inter</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Georgia">Georgia</option>
              <option value="monospace">Mono</option>
            </select>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-slate-400 uppercase">Size</span>
            <input
              type="number"
              min="8"
              max="72"
              value={fontSize || 14}
              onChange={e => onFormatChange({ fontSize: parseInt(e.target.value) || 14 })}
              className="bg-slate-800 border border-slate-700 rounded w-10 px-1 py-0.5 text-white text-[9px]"
            />
          </div>
          <span className="text-white/20">|</span>
          <button
            type="button"
            onClick={() => onFormatChange({ bold: !bold })}
            className={`px-1.5 py-0.5 rounded font-bold ${bold ? 'bg-blue-600 text-white' : 'hover:bg-white/20'}`}
          >
            B
          </button>
          <span className="text-white/20">|</span>
          <div className="flex items-center border border-slate-700 rounded overflow-hidden bg-slate-800">
            {(['left', 'center', 'right'] as const).map(a => (
              <button
                key={a}
                type="button"
                onClick={() => onFormatChange({ align: a })}
                className={`px-1 py-0.5 text-[9px] capitalize ${align === a ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'}`}
              >
                {a}
              </button>
            ))}
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-slate-400 uppercase">Color</span>
            <input
              type="color"
              value={color || '#000000'}
              onChange={e => onFormatChange({ color: e.target.value })}
              className="w-4 h-4 rounded-sm border-0 cursor-pointer bg-transparent"
            />
          </div>
          <span className="text-white/20">|</span>
          <button
            type="button"
            onClick={() => {
              setIsSelected(false)
              setIsEditing(false)
            }}
            className="text-[9px] font-bold text-gray-400 hover:text-white px-1"
          >
            ✕
          </button>
          {onAiPolish && (
            <>
              <span className="text-white/20">|</span>
              <button
                type="button"
                disabled={isPolishing}
                onClick={async () => {
                  if (ref.current?.textContent) {
                    setIsPolishing(true)
                    try {
                      const polished = await onAiPolish(ref.current.textContent)
                      ref.current.textContent = polished
                      onChange(polished)
                    } finally {
                      setIsPolishing(false)
                    }
                  }
                }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium transition ${
                  isPolishing ? 'text-purple-300 animate-pulse bg-purple-900/50' : 'text-purple-400 hover:bg-purple-900/50 hover:text-purple-300'
                }`}
              >
                <span>✨</span>
                {isPolishing ? 'Polishing...' : 'AI Polish'}
              </button>
            </>
          )}
        </div>,
        document.body
      )}
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
  const [isDragging, setIsDragging] = useState(false)
  const [panActive, setPanActive] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number; ox: number; oy: number } | null>(null)

  const uploadFile = async (file: File) => {
    const valid = file.type.startsWith('image/') || file.type === 'application/pdf'
    const size = file.size / 1024 / 1024
    if (!valid) {
      alert(`❌ Unsupported file type: ${file.type || 'unknown type'}. Use JPG, PNG, WEBP or PDF.`)
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
        onChange({ imageUrl: url, zoom: 1, xOffset: 0, yOffset: 0, fit: 'cover' })
      } catch (err: any) {
        console.error('Image upload failed:', err)
        alert(`❌ Upload failed: ${err?.message || 'unknown error'}`)
      } finally {
        setUploading(false)
      }
    } else {
      onChange({ imageUrl: URL.createObjectURL(file), zoom: 1, xOffset: 0, yOffset: 0, fit: 'cover' })
    }
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await uploadFile(file)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const onDragLeave = () => {
    setIsDragging(false)
  }
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await uploadFile(file)
  }

  const onMouseDown = (e: React.MouseEvent) => {
    if (!panActive || !block.imageUrl) return
    e.preventDefault()
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      ox: block.xOffset || 0,
      oy: block.yOffset || 0,
    })
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragStart || !panActive) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    onChange({
      xOffset: dragStart.ox + dx / 4,
      yOffset: dragStart.oy + dy / 4,
    })
  }
  const onMouseUp = () => {
    setDragStart(null)
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
          <div
            className="relative w-full h-full overflow-hidden select-none"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            style={{ cursor: panActive ? 'move' : 'default' }}
          >
            <img
              src={block.imageUrl}
              alt={block.label || ''}
              className="w-full h-full pointer-events-none"
              style={{
                objectFit: block.fit || 'cover',
                transform: `scale(${block.zoom || 1}) translate(${block.xOffset || 0}%, ${block.yOffset || 0}%)`,
                transformOrigin: 'center center',
                transition: dragStart ? 'none' : 'transform 0.1s ease',
                filter: block.cssFilter || 'none',
              }}
              draggable={false}
            />
            {panActive && (
              <div className="absolute inset-0 border-2 border-dashed border-blue-500 pointer-events-none flex items-center justify-center bg-blue-500/10">
                <span className="bg-blue-600 text-white text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded shadow">
                  Drag to Reposition
                </span>
              </div>
            )}
            
            {/* Floating Contextual Toolbar */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-black/85 text-white rounded-lg px-2.5 py-1.5 shadow-lg opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 whitespace-nowrap text-[11px]">
              <button
                type="button"
                onClick={() => onChange({ fit: block.fit === 'contain' ? 'cover' : 'contain' })}
                className={`px-1.5 py-0.5 rounded hover:bg-white/20 transition font-medium ${block.fit === 'contain' ? 'text-blue-300' : ''}`}
                title="Toggle Fit/Fill"
              >
                {block.fit === 'contain' ? 'Fill' : 'Fit'}
              </button>
              <span className="text-white/20">|</span>
              <button
                type="button"
                onClick={() => setPanActive(!panActive)}
                className={`px-1.5 py-0.5 rounded hover:bg-white/20 transition font-medium ${panActive ? 'text-blue-300 bg-blue-500/25' : ''}`}
                title="Reposition image inside frame"
              >
                {panActive ? 'Done ✓' : 'Pan ✋'}
              </button>
              <span className="text-white/20">|</span>
              <div className="flex items-center gap-1">
                <span>Zoom:</span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={block.zoom || 1}
                  onChange={e => onChange({ zoom: parseFloat(e.target.value) })}
                  className="w-14 h-1 accent-blue-500 cursor-pointer bg-white/20 rounded-lg appearance-none"
                />
                <span className="w-6 text-right tabular-nums">{(block.zoom || 1).toFixed(1)}x</span>
              </div>
              <span className="text-white/20">|</span>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="px-1.5 py-0.5 rounded hover:bg-white/20 transition text-yellow-400 font-medium"
              >
                Replace
              </button>
              <span className="text-white/20">|</span>
              <button
                type="button"
                onClick={() => onChange({ imageUrl: '' })}
                className="px-1.5 py-0.5 rounded hover:bg-white/20 transition text-red-400 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50/50 transition border-2 border-dashed ${isDragging ? 'border-blue-500 bg-blue-50/40 text-blue-500' : 'border-gray-300'}`}
            style={{ borderColor: isDragging ? undefined : 'rgba(0,0,0,0.15)' }}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <span className="text-3xl mb-1">＋</span>
            <span className="text-[10px] uppercase tracking-widest font-semibold">{typeBadge[block.type] || 'IMAGE'}</span>
            <span className="text-[8px] opacity-75 mt-0.5">Click or drag & drop</span>
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

      <input type="file" ref={inputRef} onChange={handleFile} accept="image/*,application/pdf" className="hidden" />
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
  
  // Detect block subtype (BUG 5)
  const labelLower = (block.label || '').toLowerCase()
  let blockType: 'education' | 'experience' | 'skills' | 'software' | 'competitions' | 'awards' | 'projects' | 'generic' = 'generic'
  if (labelLower.includes('edu')) blockType = 'education'
  else if (labelLower.includes('exp') || labelLower.includes('work')) blockType = 'experience'
  else if (labelLower.includes('soft') || labelLower.includes('tool')) blockType = 'software'
  else if (labelLower.includes('skill')) blockType = 'skills'
  else if (labelLower.includes('award') || labelLower.includes('hon')) blockType = 'awards'
  else if (labelLower.includes('comp')) blockType = 'competitions'
  else if (labelLower.includes('proj')) blockType = 'projects'

  const update = (idx: number, patch: Partial<LegendItem>) => {
    const next = items.map((it, i) => i === idx ? { ...it, ...patch } : it)
    onChange({ legendItems: next })
  }

  const add = () => {
    let newItem = { key: String(items.length + 1).padStart(2, '0'), label: 'New item' }
    if (blockType === 'education') {
      newItem = { key: '2026', label: 'B.Arch — University' }
    } else if (blockType === 'experience') {
      newItem = { key: '2026', label: 'Intern Architect at Studio' }
    } else if (blockType === 'skills') {
      newItem = { key: 'Skill', label: 'Advanced' }
    } else if (blockType === 'software') {
      newItem = { key: 'Revit', label: 'Advanced' }
    } else if (blockType === 'competitions') {
      newItem = { key: '2026', label: 'Competition Name' }
    } else if (blockType === 'awards') {
      newItem = { key: '2026', label: 'Design Award' }
    } else if (blockType === 'projects') {
      newItem = { key: '2026', label: 'Project Name' }
    }
    onChange({ legendItems: [...items, newItem] })
  }

  const remove = (idx: number) => onChange({ legendItems: items.filter((_, i) => i !== idx) })

  const getButtonText = () => {
    switch (blockType) {
      case 'education': return '+ Add Education'
      case 'experience': return '+ Add Experience'
      case 'skills': return '+ Add Skill'
      case 'software': return '+ Add Software'
      case 'competitions': return '+ Add Competition'
      case 'awards': return '+ Add Award'
      case 'projects': return '+ Add Project'
      default: return '+ Add Item'
    }
  }

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
        {getButtonText()}
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
  const label = block.label || 'INFO'

  // Detect block subtype (BUG 5)
  const labelLower = label.toLowerCase()
  let blockType: 'education' | 'experience' | 'skills' | 'software' | 'competitions' | 'awards' | 'projects' | 'generic' = 'generic'
  if (labelLower.includes('edu')) blockType = 'education'
  else if (labelLower.includes('exp') || labelLower.includes('work')) blockType = 'experience'
  else if (labelLower.includes('soft') || labelLower.includes('tool')) blockType = 'software'
  else if (labelLower.includes('skill')) blockType = 'skills'
  else if (labelLower.includes('award') || labelLower.includes('hon')) blockType = 'awards'
  else if (labelLower.includes('comp')) blockType = 'competitions'
  else if (labelLower.includes('proj')) blockType = 'projects'

  const update = (idx: number, patch: Partial<MetaField>) => {
    onChange({ fields: fields.map((f, i) => i === idx ? { ...f, ...patch } : f) })
  }

  const add = () => {
    let newFields: MetaField[] = []
    if (blockType === 'education') {
      newFields = [
        { label: 'Institution', value: 'University Name' },
        { label: 'Degree', value: 'B.Arch' },
        { label: 'Year', value: '2026' }
      ]
    } else if (blockType === 'experience') {
      newFields = [
        { label: 'Firm', value: 'Office Name' },
        { label: 'Role', value: 'Intern' },
        { label: 'Year', value: '2025' }
      ]
    } else if (blockType === 'skills') {
      newFields = [
        { label: 'Skill', value: 'CAD' },
        { label: 'Level', value: 'Advanced' }
      ]
    } else if (blockType === 'software') {
      newFields = [
        { label: 'Software', value: 'Rhino' },
        { label: 'Level', value: 'Advanced' }
      ]
    } else if (blockType === 'competitions') {
      newFields = [
        { label: 'Competition', value: 'Competition Name' },
        { label: 'Rank', value: '1st Place' },
        { label: 'Year', value: '2026' }
      ]
    } else if (blockType === 'awards') {
      newFields = [
        { label: 'Award', value: 'Design Excellence' },
        { label: 'Year', value: '2026' }
      ]
    } else if (blockType === 'projects') {
      newFields = [
        { label: 'Project', value: 'New Project' },
        { label: 'Typology', value: 'Residential' },
        { label: 'Year', value: '2026' }
      ]
    } else {
      newFields = [{ label: 'Label', value: 'Value' }]
    }
    onChange({ fields: [...fields, ...newFields] })
  }

  const remove = (idx: number) => onChange({ fields: fields.filter((_, i) => i !== idx) })

  const getButtonText = () => {
    switch (blockType) {
      case 'education': return '+ Add Education'
      case 'experience': return '+ Add Experience'
      case 'skills': return '+ Add Skill'
      case 'software': return '+ Add Software'
      case 'competitions': return '+ Add Competition'
      case 'awards': return '+ Add Award'
      case 'projects': return '+ Add Project'
      default: return '+ Field'
    }
  }

  return (
    <div className={layout === 'inline' ? 'flex flex-wrap gap-x-8 gap-y-2' : 'space-y-2'}>
      <EditableText
        value={label}
        onChange={v => onChange({ label: v })}
        className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2 pb-1 border-b block w-full"
        style={{ color: tokens.primary, borderColor: tokens.accent, fontFamily: tokens.bodyFont }}
      />
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
      <button onClick={add} className="text-[10px] font-semibold uppercase tracking-wider block w-full text-left" style={{ color: tokens.accent }}>{getButtonText()}</button>
    </div>
  )
}

/* ------------------------------ Text Blocks ------------------------------- */

export function TitleBlock({ block, tokens, onChange, size = 'lg', onAiPolish }: { block: Block; tokens: DesignTokens; onChange: (p: Partial<Block>) => void; size?: 'sm' | 'lg' | 'xl', onAiPolish?: (t: string) => Promise<string> }) {
  const sizes = { sm: 'text-2xl', lg: 'text-4xl', xl: 'text-6xl' }
  return (
    <EditableText
      value={block.text || ''}
      onAiPolish={onAiPolish}
      onChange={v => onChange({ text: v })}
      className={`leading-tight ${sizes[size]}`}
      fontFamily={block.fontFamily || tokens.headingFont}
      fontSize={block.fontSize}
      color={block.color || tokens.primary}
      align={block.align || 'left'}
      bold={block.bold !== undefined ? block.bold : true}
      onFormatChange={patch => onChange(patch)}
      style={{ 
        color: block.color || tokens.primary, 
        fontFamily: block.fontFamily || tokens.headingFont,
        fontSize: block.fontSize ? `${block.fontSize}px` : undefined,
        textAlign: block.align || 'left',
        fontWeight: block.bold !== false ? 'bold' : 'normal'
      }}
    />
  )
}

export function SubtitleBlock({ block, tokens, onChange, onAiPolish }: { block: Block; tokens: DesignTokens; onChange: (p: Partial<Block>) => void; onAiPolish?: (t: string) => Promise<string> }) {
  return (
    <EditableText
      value={block.text || ''}
      onAiPolish={onAiPolish}
      onChange={v => onChange({ text: v })}
      className="text-lg"
      fontFamily={block.fontFamily || tokens.bodyFont}
      fontSize={block.fontSize}
      color={block.color || tokens.accent}
      align={block.align || 'left'}
      bold={block.bold}
      onFormatChange={patch => onChange(patch)}
      style={{ 
        color: block.color || tokens.accent, 
        fontFamily: block.fontFamily || tokens.bodyFont,
        fontSize: block.fontSize ? `${block.fontSize}px` : undefined,
        textAlign: block.align || 'left',
        fontWeight: block.bold ? 'bold' : 'normal'
      }}
    />
  )
}

export function DescriptionBlock({ block, tokens, onChange, onAiPolish }: { block: Block; tokens: DesignTokens; onChange: (p: Partial<Block>) => void; onAiPolish?: (t: string) => Promise<string> }) {
  return (
    <EditableText
      value={block.text || ''}
      onAiPolish={onAiPolish}
      onChange={v => onChange({ text: v })}
      multiline
      className="text-sm leading-relaxed"
      fontFamily={block.fontFamily || tokens.bodyFont}
      fontSize={block.fontSize}
      color={block.color || tokens.text}
      align={block.align || 'left'}
      bold={block.bold}
      onFormatChange={patch => onChange(patch)}
      style={{ 
        color: block.color || tokens.text, 
        fontFamily: block.fontFamily || tokens.bodyFont,
        fontSize: block.fontSize ? `${block.fontSize}px` : undefined,
        textAlign: block.align || 'left',
        fontWeight: block.bold ? 'bold' : 'normal'
      }}
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

/* ------------------------------- Contents Block --------------------------- */

interface ProjectIndexItem {
  num: string
  title: string
  year: string
  typology: string
  location: string
  thumbnail: string
  pageNumber: string
}

export function ContentsBlock({
  block, tokens, onChange, pages, layoutId
}: {
  block: Block
  tokens: DesignTokens
  onChange: (patch: Partial<Block>) => void
  pages: any[]
  layoutId: string
}) {
  // Extract project details from pages list
  const projectItems: ProjectIndexItem[] = []
  let projCount = 0
  
  if (Array.isArray(pages)) {
    pages.forEach((p, idx) => {
      if (p.type === 'project') {
        const titleBlock = p.blocks?.find((b: any) => b.type === 'title')
        if (titleBlock) {
          projCount++
          const metaBlock = p.blocks?.find((b: any) => b.type === 'meta')
          const fields = metaBlock?.fields || []
          
          const year = fields.find((f: any) => f.label.toLowerCase() === 'year')?.value || '2026'
          const location = fields.find((f: any) => f.label.toLowerCase() === 'location')?.value || 'Location'
          const typology = fields.find((f: any) => f.label.toLowerCase() === 'program' || f.label.toLowerCase() === 'typology')?.value || 'Residential'
          
          const imgBlock = p.blocks?.find((b: any) => ['render', 'plan', 'section', 'diagram'].includes(b.type) && b.imageUrl)
          const thumbnail = imgBlock?.imageUrl || ''
          
          projectItems.push({
            num: String(projCount).padStart(2, '0'),
            title: titleBlock.text || 'Project Title',
            year,
            typology,
            location,
            thumbnail,
            pageNumber: String(idx + 1).padStart(2, '0')
          })
        }
      }
    })
  }

  // Use a fallback list if no projects are found (e.g. fresh template init)
  const items = projectItems.length > 0 ? projectItems : [
    { num: '01', title: 'Cultural Center', year: '2025', typology: 'Cultural', location: 'Tokyo, JP', thumbnail: '', pageNumber: '06' },
    { num: '02', title: 'Urban Housing', year: '2026', typology: 'Residential', location: 'London, UK', thumbnail: '', pageNumber: '18' },
    { num: '03', title: 'Computational Pavillion', year: '2026', typology: 'Experimental', location: 'Zurich, CH', thumbnail: '', pageNumber: '24' },
    { num: '04', title: 'Mixed-Use Highrise', year: '2026', typology: 'Commercial', location: 'New York, US', thumbnail: '', pageNumber: '32' }
  ]

  const lid = (layoutId || '').toLowerCase()

  // 1. Magazine Style
  if (lid.includes('magazine')) {
    const featured = items[0]
    return (
      <div className="w-full flex flex-col h-full" style={{ fontFamily: tokens.bodyFont }}>
        <h3 className="text-xl font-bold uppercase tracking-widest mb-4 border-b pb-2" style={{ color: tokens.primary, fontFamily: tokens.headingFont }}>
          {block.label || 'Contents'}
        </h3>
        <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
          <div className="col-span-5 bg-black/5 rounded overflow-hidden relative flex flex-col justify-end p-3 min-h-[160px]">
            {featured.thumbnail ? (
              <img src={featured.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" />
            ) : (
              <div className="absolute inset-0 bg-gray-200" />
            )}
            <div className="relative z-10 bg-black/60 text-white p-2 rounded">
              <span className="text-[9px] uppercase tracking-wider block opacity-75">Featured Project</span>
              <span className="text-xs font-bold block">{featured.title}</span>
              <span className="text-[9px] block">Page {featured.pageNumber}</span>
            </div>
          </div>
          <div className="col-span-7 space-y-2">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between border-b pb-1.5 border-black/5 text-xs">
                <div className="flex gap-2">
                  <span className="font-bold opacity-60">{it.num}</span>
                  <div>
                    <span className="font-semibold" style={{ color: tokens.text }}>{it.title}</span>
                    <span className="text-[9px] text-gray-400 block">{it.typology} · {it.location}</span>
                  </div>
                </div>
                <span className="font-semibold text-gray-500">p. {it.pageNumber}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 2. Timeline Style
  if (lid.includes('timeline')) {
    return (
      <div className="w-full flex flex-col h-full" style={{ fontFamily: tokens.bodyFont }}>
        <h3 className="text-xl font-bold uppercase tracking-widest mb-4 border-b pb-2" style={{ color: tokens.primary, fontFamily: tokens.headingFont }}>
          {block.label || 'Timeline'}
        </h3>
        <div className="relative border-l border-slate-350 pl-4 ml-2 space-y-4 flex-1">
          {items.map((it, idx) => (
            <div key={idx} className="relative text-xs">
              <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 border border-white" />
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="font-mono text-[9px] text-blue-600 font-bold mr-2">{it.year}</span>
                  <span className="font-semibold" style={{ color: tokens.text }}>{it.title}</span>
                </div>
                <span className="font-semibold text-gray-400">Page {it.pageNumber}</span>
              </div>
              <span className="text-[9px] text-gray-400 block mt-0.5">{it.typology} | {it.location}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 3. Image Grid Style
  if (lid.includes('grid') || lid.includes('thumb')) {
    return (
      <div className="w-full flex flex-col h-full" style={{ fontFamily: tokens.bodyFont }}>
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-3" style={{ color: tokens.primary, fontFamily: tokens.headingFont }}>
          {block.label || 'Project Index'}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {items.map((it, idx) => (
            <div key={idx} className="border border-black/5 rounded p-1.5 bg-black/[0.01] flex items-center gap-2">
              <div className="w-12 h-12 bg-black/5 rounded overflow-hidden flex-shrink-0">
                {it.thumbnail ? (
                  <img src={it.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-400">{it.num}</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold opacity-60 mr-1">{it.num}</span>
                  <span className="font-bold text-gray-400">p.{it.pageNumber}</span>
                </div>
                <div className="font-semibold text-[10px] truncate" style={{ color: tokens.text }}>{it.title}</div>
                <div className="text-[8px] text-gray-400 truncate">{it.typology} · {it.location}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 4. Luxury Style
  if (lid.includes('luxury')) {
    return (
      <div className="w-full flex flex-col h-full px-2" style={{ fontFamily: 'Playfair Display, Lora, Georgia, serif' }}>
        <h3 className="text-2xl font-normal tracking-[0.15em] text-center mb-5 italic" style={{ color: tokens.primary }}>
          {block.label || 'Portfolio Index'}
        </h3>
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="flex justify-between items-baseline border-b border-yellow-800/10 pb-1.5 text-xs">
              <div className="flex items-baseline gap-3">
                <span className="text-[10px] tracking-wider text-yellow-700/80 font-serif italic">{it.num}</span>
                <div>
                  <span className="font-medium text-slate-800 tracking-wide text-xs">{it.title}</span>
                  <span className="text-[9px] text-slate-400 block tracking-wider font-sans uppercase mt-0.5">{it.typology} / {it.location} ({it.year})</span>
                </div>
              </div>
              <span className="font-serif italic text-slate-500 text-xs">p. {it.pageNumber}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 5. Research Style
  if (lid.includes('research')) {
    return (
      <div className="w-full flex flex-col h-full font-mono text-[9px] text-slate-600">
        <h3 className="text-xs font-bold uppercase tracking-widest mb-3 border-b border-dashed pb-1.5" style={{ color: tokens.primary }}>
          // INDEX_SPEC_REF_01
        </h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-350 text-left opacity-75">
              <th className="py-1">ID</th>
              <th className="py-1">PROJECT DESCRIPTION</th>
              <th className="py-1">TYPOLOGY</th>
              <th className="py-1">LOC</th>
              <th className="py-1 text-right">PAGE</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                <td className="py-1.5 font-bold text-slate-900">{it.num}</td>
                <td className="py-1.5 font-semibold text-slate-800 uppercase">{it.title} ({it.year})</td>
                <td className="py-1.5">{it.typology}</td>
                <td className="py-1.5">{it.location}</td>
                <td className="py-1.5 text-right font-bold text-slate-900">P.{it.pageNumber}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // 6. Parametric Style
  if (lid.includes('parametric')) {
    return (
      <div className="w-full flex flex-col h-full" style={{ fontFamily: tokens.bodyFont }}>
        <h3 className="text-lg font-black uppercase tracking-tighter mb-4 italic" style={{ color: tokens.primary, fontFamily: tokens.headingFont }}>
          PROJECTS.MATRIX
        </h3>
        <div className="space-y-2.5">
          {items.map((it, idx) => (
            <div key={idx} className="group flex items-stretch border-l-4 border-slate-900 bg-slate-50 p-2 text-xs transition hover:bg-slate-100">
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] bg-slate-900 text-white px-1 font-bold">{it.num}</span>
                  <span className="font-bold uppercase tracking-tight truncate" style={{ color: tokens.text }}>{it.title}</span>
                </div>
                <div className="text-[9px] text-slate-500 mt-1 uppercase truncate">{it.typology} // {it.location}</div>
              </div>
              <div className="flex flex-col justify-center items-end border-l border-slate-200 pl-3">
                <span className="text-[8px] text-slate-400 font-bold uppercase">PAGE</span>
                <span className="text-sm font-black text-slate-800">{it.pageNumber}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 7. Competition Style
  if (lid.includes('competition')) {
    return (
      <div className="w-full flex flex-col h-full" style={{ fontFamily: tokens.bodyFont }}>
        <h3 className="text-xl font-bold uppercase tracking-tight mb-4" style={{ color: tokens.primary, fontFamily: tokens.headingFont }}>
          INDEX / WORK_SAMPLES
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {items.map((it, idx) => (
            <div key={idx} className="border-t-2 border-slate-900 pt-2 flex flex-col justify-between text-xs min-h-[90px]">
              <div>
                <div className="flex justify-between font-bold text-[10px]">
                  <span>{it.num}</span>
                  <span>{it.year}</span>
                </div>
                <h4 className="font-bold uppercase tracking-tight text-sm mt-1 leading-tight" style={{ color: tokens.text }}>{it.title}</h4>
                <p className="text-[9px] text-gray-500 mt-1">{it.typology} · {it.location}</p>
              </div>
              <div className="text-right font-bold text-lg mt-2">p.{it.pageNumber}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 8. Academic Thesis Style
  if (lid.includes('academic') || lid.includes('thesis')) {
    return (
      <div className="w-full flex flex-col h-full" style={{ fontFamily: 'Georgia, serif' }}>
        <h3 className="text-lg font-serif italic mb-4 border-b border-slate-300 pb-2 text-slate-700">
          Table of Contents
        </h3>
        <div className="space-y-3 text-xs">
          {items.map((it, idx) => (
            <div key={idx} className="flex justify-between items-baseline gap-4">
              <div className="flex items-baseline gap-2 flex-1 min-w-0">
                <span className="font-sans font-semibold text-[10px] text-slate-400">{it.num}</span>
                <span className="font-semibold text-slate-800 truncate">{it.title}</span>
                <span className="flex-1 border-b border-dotted border-slate-300 mx-1 min-w-[20px] self-end h-[3px]" />
              </div>
              <span className="font-sans text-[10px] text-slate-500">{it.typology}</span>
              <span className="font-sans font-bold text-slate-700">Page {it.pageNumber}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 9. Minimal Default (Minimal Index)
  return (
    <div className="w-full flex flex-col h-full" style={{ fontFamily: tokens.bodyFont }}>
      <h3 className="text-xs font-bold uppercase tracking-[0.25em] mb-4 pb-2 border-b" style={{ color: tokens.primary, borderColor: tokens.accent, fontFamily: tokens.headingFont }}>
        {block.label || 'CONTENTS'}
      </h3>
      <div className="space-y-2.5">
        {items.map((it, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs pb-1.5 border-b border-black/[0.04]">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-gray-400">{it.num}</span>
              <div>
                <span className="font-medium" style={{ color: tokens.text }}>{it.title}</span>
                <span className="text-[9px] text-gray-400 ml-2">({it.year}) · {it.typology}</span>
              </div>
            </div>
            <span className="font-mono font-bold text-gray-600">{it.pageNumber}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

