'use client'
import { TableOfContentsRenderer } from './TableOfContentsRenderer'

import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Block, DesignTokens, LegendItem, MetaField } from './types'
import ProcessFlowchartRenderer from './ProcessFlowchartRenderer'
import FlowchartModalEditor from './FlowchartModalEditor'
import { PROCESS_PRESETS } from './processPresets'

function hexToRgba(hex: string | undefined, opacity: number): string {
  if (!hex) return `rgba(255, 255, 255, ${opacity})`
  let c = hex.replace('#', '')
  if (c.length === 3) c = c.split('').map(x => x + x).join('')
  if (c.length !== 6) return `rgba(255, 255, 255, ${opacity})`
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

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
        className={`outline-none rounded px-1 -mx-1 pb-[0.1em] transition ${
          isEditing ? 'cursor-text outline outline-1 outline-blue-400' : isSelected ? 'ring-2 ring-blue-500 bg-blue-50/20' : 'group-hover/canvas:outline group-hover/canvas:outline-1 group-hover/canvas:outline-dashed group-hover/canvas:outline-gray-500/70 hover:bg-blue-50/40 hover:outline-blue-400/60'
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
              className="bg-white border border-gray-200 rounded px-1 py-0.5 text-gray-900 text-[9px] focus:outline-none focus:border-blue-500"
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
              className="bg-white border border-gray-200 rounded w-10 px-1 py-0.5 text-gray-900 text-[9px] focus:outline-none focus:border-blue-500"
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
  const [editorOpen, setEditorOpen] = useState(false)

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
    // Store offsets as raw pixel deltas — rendering divides by zoom to keep pan in screen-space
    onChange({
      xOffset: dragStart.ox + dx,
      yOffset: dragStart.oy + dy,
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
      <div className={`relative w-full overflow-hidden tour-image-block ${fill ? 'flex-1 min-h-0' : aspect}`} style={{ background: 'rgba(0,0,0,0.05)' }}>
        {block.imageUrl ? (
          <div
            className="relative w-full h-full overflow-hidden select-none"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            style={{ cursor: panActive ? 'move' : 'default' }}
          >
            <div
              className="w-full h-full pointer-events-none select-none relative overflow-hidden"
            >
              {/* 
                Strategy: To allow panning across the ENTIRE unclipped image, we cannot use transform on a cover image
                (because object-fit: cover clips the image BEFORE transform).
                Instead, we scale the element's layout bounding box (width/height) by the zoom factor.
                This pushes the element's edges OUTSIDE the container.
                Then, we use `object-position` to pan the image *within* that expanded bounding box.
                `calc(50% + panX)` provides an exact 1:1 pixel mapping for mouse drags, perfectly tracking the cursor.
                The container's overflow:hidden ensures the expanded bounding box doesn't leak.
              */}
              <img
                src={block.imageUrl}
                alt={block.label || block.type}
                className="absolute"
                style={{
                  width: `${(block.zoom || 1) * 100}%`,
                  height: `${(block.zoom || 1) * 100}%`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                  top: `${(1 - (block.zoom || 1)) * 50}%`,
                  left: `${(1 - (block.zoom || 1)) * 50}%`,
                  objectFit: block.fit === 'contain' ? 'contain' : 'cover',
                  objectPosition: `calc(50% + ${block.xOffset || 0}px) calc(50% + ${block.yOffset || 0}px)`,
                  transition: dragStart ? 'none' : 'object-position 0.15s ease, width 0.15s ease, height 0.15s ease, top 0.15s ease, left 0.15s ease',
                  filter: block.cssFilter || 'none',
                }}
              />
            </div>
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
                onClick={() => {
                  const defaultPreset = PROCESS_PRESETS[0].config
                  onChange({
                    isFlowchart: true,
                    flowchartConfig: defaultPreset
                  })
                }}
                className="px-1.5 py-0.5 rounded hover:bg-white/20 transition text-green-400 font-bold"
                title="Convert this block into a serpentine flowchart diagram"
              >
                🌿 Flowchart
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
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50/50 transition border-2 border-dashed ${isDragging ? 'border-blue-500 bg-blue-50/40 text-blue-500' : 'border-gray-300'}`}
            style={{ borderColor: isDragging ? undefined : 'rgba(0,0,0,0.15)' }}
          >
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center justify-center w-full h-full pt-4 focus:outline-none"
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <span className="text-3xl mb-1">＋</span>
              <span className="text-[10px] uppercase tracking-widest font-semibold">{typeBadge[block.type] || 'IMAGE'}</span>
              <span className="text-[8px] opacity-75 mt-0.5">Click or drag & drop</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const defaultPreset = PROCESS_PRESETS[0].config
                onChange({
                  isFlowchart: true,
                  flowchartConfig: defaultPreset
                })
              }}
              className="absolute bottom-3 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] tracking-wide uppercase transition shadow-sm z-30"
            >
              🌿 Convert to Flowchart
            </button>
          </div>
        )}
        {/* type badge */}
        <span
          className="absolute top-2 left-2 text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 pb-[0.2em] rounded-sm"
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

      <FlowchartModalEditor
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        block={block}
        onChange={onChange}
        onUploadImage={onUpload}
      />

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
      <div className="flex flex-col flex-1 overflow-hidden mt-1" style={{ gap: Math.max(2, 12 - items.length * 1.5) + 'px' }}>
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
            <button onClick={() => remove(idx)} type="button" title="Delete" className="text-gray-300 hover:text-red-500 opacity-40 hover:!opacity-100 transition text-xs z-10 cursor-pointer">✕</button>
          </div>
        ))}
        <button onClick={add} className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-left" style={{ color: tokens.accent }}>
          {getButtonText()}
        </button>
      </div>
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
    <div className={layout === 'inline' ? 'flex flex-wrap gap-x-8 gap-y-2' : 'flex flex-col'} style={layout !== 'inline' ? { gap: Math.max(2, 12 - fields.length * 1.5) + 'px' } : undefined}>
      <EditableText
        value={label}
        onChange={v => onChange({ label: v })}
        className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2 pb-1 border-b block w-full"
        style={{ color: tokens.primary, borderColor: tokens.accent, fontFamily: tokens.bodyFont }}
      />
      <div className={`flex-1 overflow-hidden ${layout === 'inline' ? 'flex flex-wrap gap-x-8 gap-y-2' : 'flex flex-col'}`} style={layout !== 'inline' ? { gap: Math.max(2, 12 - fields.length * 1.5) + 'px' } : undefined}>
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
              <button onClick={() => remove(idx)} type="button" title="Delete" className="text-gray-300 hover:text-red-500 opacity-40 hover:!opacity-100 text-xs z-10 cursor-pointer">✕</button>
            </div>
          </div>
        ))}
        <button onClick={add} className="text-[10px] font-semibold uppercase tracking-wider block w-full text-left mt-1" style={{ color: tokens.accent }}>{getButtonText()}</button>
      </div>
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
  block, tokens, onChange, pages, layoutId, onUploadImage
}: {
  block: Block
  tokens: DesignTokens
  onChange: (patch: Partial<Block>) => void
  pages: any[]
  layoutId: string
  onUploadImage?: (file: File) => Promise<string>
}) {
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
    <div className={layout === 'inline' ? 'flex flex-wrap gap-x-8 gap-y-2' : 'flex flex-col'} style={layout !== 'inline' ? { gap: Math.max(2, 12 - fields.length * 1.5) + 'px' } : undefined}>
      <EditableText
        value={label}
        onChange={v => onChange({ label: v })}
        className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2 pb-1 border-b block w-full"
        style={{ color: tokens.primary, borderColor: tokens.accent, fontFamily: tokens.bodyFont }}
      />
      <div className={`flex-1 overflow-hidden ${layout === 'inline' ? 'flex flex-wrap gap-x-8 gap-y-2' : 'flex flex-col'}`} style={layout !== 'inline' ? { gap: Math.max(2, 12 - fields.length * 1.5) + 'px' } : undefined}>
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
              <button onClick={() => remove(idx)} type="button" title="Delete" className="text-gray-300 hover:text-red-500 opacity-40 hover:!opacity-100 text-xs z-10 cursor-pointer">✕</button>
            </div>
          </div>
        ))}
        <button onClick={add} className="text-[10px] font-semibold uppercase tracking-wider block w-full text-left mt-1" style={{ color: tokens.accent }}>{getButtonText()}</button>
      </div>
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
  block, tokens, onChange, pages, layoutId, onUploadImage
}: {
  block: Block
  tokens: DesignTokens
  onChange: (patch: Partial<Block>) => void
  pages: any[]
  layoutId: string
  onUploadImage?: (file: File) => Promise<string>
}) {
  return <TableOfContentsRenderer block={block} tokens={tokens} onChange={onChange} pages={pages} layoutId={layoutId} onUploadImage={onUploadImage} />
}

/* ------------------------------- Flowchart Block --------------------------- */

export function FlowchartBlock({
  block, tokens, onChange, readonly, onUploadImage
}: {
  block: Block
  tokens: DesignTokens
  onChange: (patch: Partial<Block>) => void
  readonly?: boolean
  onUploadImage?: (file: File) => Promise<string>
}) {
  const [editorOpen, setEditorOpen] = useState(false)

  return (
    <div className="group/fc relative w-full h-full flex flex-col min-h-0">
      <ProcessFlowchartRenderer block={block} onChange={onChange} />
      
      {!readonly && (
        <div className="absolute top-2 right-2 z-30 flex items-center gap-2 bg-white/95 backdrop-blur-sm shadow-md rounded-md border border-gray-200 px-1.5 py-1 opacity-0 group-hover/fc:opacity-100 transition-opacity pointer-events-auto" data-html2canvas-ignore="true">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setEditorOpen(true) }}
            className="text-[9px] font-bold text-blue-600 hover:text-blue-800 uppercase px-1"
            title="Edit Flowchart Settings"
          >
            ⚙️ Edit Flowchart
          </button>

          <div className="w-px h-3 bg-gray-300 mx-1"></div>
          
          {block.freeform && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onChange({ zOp: 'front' as any }) }} className="text-[9px] font-bold text-gray-500 hover:text-gray-800" title="Bring to Front">⇈</button>
              <button onClick={(e) => { e.stopPropagation(); onChange({ zOp: 'forward' as any }) }} className="text-[9px] font-bold text-gray-500 hover:text-gray-800" title="Bring Forward">⇧</button>
              <button onClick={(e) => { e.stopPropagation(); onChange({ zOp: 'backward' as any }) }} className="text-[9px] font-bold text-gray-500 hover:text-gray-800" title="Send Backward">⇩</button>
              <button onClick={(e) => { e.stopPropagation(); onChange({ zOp: 'back' as any }) }} className="text-[9px] font-bold text-gray-500 hover:text-gray-800" title="Send to Back">⇊</button>
              
              <div className="w-px h-3 bg-gray-300 mx-1"></div>
              
              <button onClick={(e) => { e.stopPropagation(); onChange({ freeform: { ...block.freeform!, pinned: !block.freeform!.pinned } }) }} className={`text-[9px] font-bold uppercase ${block.freeform.pinned ? 'text-green-600' : 'text-gray-400 hover:text-gray-700'}`} title={block.freeform.pinned ? "Unpin block" : "Pin block in place"}>
                {block.freeform.pinned ? '📍 Unpin' : '📌 Pin'}
              </button>
            </>
          )}

          <button onClick={(e) => { e.stopPropagation(); onChange({ freeform: block.freeform ? undefined : { x: 10, y: 10, w: 40, h: 40 } }) }} className="text-[9px] font-bold text-blue-500 hover:text-blue-700 uppercase" title={block.freeform ? "Snap back to layout grid" : "Unlock from Grid"}>
            {block.freeform ? '↩ Grid' : '🔓 Unlock'}
          </button>
          <button onClick={(e) => { e.stopPropagation(); (onChange as any)({ isDeleted: true }) }} className="text-[9px] font-bold text-red-500 hover:text-red-700 uppercase ml-1" title="Delete Block">
            ✕ DEL
          </button>
        </div>
      )}

      <FlowchartModalEditor
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        block={block}
        onChange={onChange}
        onUploadImage={onUploadImage}
      />
    </div>
  )
}
