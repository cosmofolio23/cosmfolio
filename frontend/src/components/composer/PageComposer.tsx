'use client'

import { useRef, useState } from 'react'
import type { Block, Page, DesignTokens, BlockType, ResumeEntry, SkillItem } from './types'
import { allImages, createBlock } from './types'
import { getSpec, type LayoutSpec, type Region, type RegionRole } from './layoutSpecs'
import {
  ImageBlock, LegendBlock, MetaBlock, TitleBlock, SubtitleBlock, DescriptionBlock, pickContrast, ContentsBlock,
} from './Blocks'
import { TitleBlockView } from '@/components/templates/TitleBlockView'
import { TITLE_BLOCKS } from '@/components/templates/titleBlocks'
import type { DemoPalette } from '@/components/templates/demoArt'
import { BackgroundLayers, MasterElements, GridOverlay, DrawingInfoBar, type PageContext } from './PublishingLayers'
import type { BackgroundLayer, MasterElement, GridSettings, PageSize } from './publishingTypes'
import { FreeCanvas } from './FreeCanvas'
import type { FreeElement } from './types'
import { apiClient } from '@/lib/api'

const toPalette = (t: DesignTokens): DemoPalette => ({
  primary: t.primary, accent: t.accent, bg: t.background, text: t.text, muted: t.muted,
})

interface Props {
  page: Page
  tokens: DesignTokens
  onChange: (page: Page) => void
  onUploadImage?: (file: File) => Promise<string>
  /** Professional Publishing layers (rendered behind content / as page furniture) */
  backgrounds?: BackgroundLayer[]
  masterElements?: MasterElement[]
  pageContext?: PageContext
  grid?: GridSettings
  /** free-canvas overlay elements + edit handler */
  onFreeChange?: (els: FreeElement[]) => void
  editableFree?: boolean
  onApplyScope?: (scope: 'page' | 'spread' | 'all', el: FreeElement) => void
  onFreeSelectionChange?: (el: FreeElement | null) => void
  pages?: Page[]
  onUpdateGlobalPages?: (updater: (pages: Page[]) => Page[]) => void
  overflowVisible?: boolean
  onUpdateMasterElement?: (id: string, patch: Partial<MasterElement>) => void
  pageSize?: PageSize
  /** Free-tier watermark — shown for free users, hidden for Pro/admin. */
  showWatermark?: boolean
}

const ROLE_TO_TYPE: Record<Exclude<RegionRole, 'image'>, BlockType> = {
  title: 'title', subtitle: 'subtitle', text: 'description', legend: 'legend', meta: 'meta', contents: 'contents',
  headshot: 'headshot', bio: 'bio', education: 'education', skills: 'skills',
  software: 'software', achievement: 'achievement', interest: 'interest',
}

export default function PageComposer({ page, tokens, onChange, onUploadImage, backgrounds, masterElements, pageContext, grid, onFreeChange, editableFree, onApplyScope, onFreeSelectionChange, pages, onUpdateGlobalPages, overflowVisible, onUpdateMasterElement, pageSize, showWatermark = true }: Props) {
  const [activeBlock, setActiveBlock] = useState<{ id: string, x: number, y: number } | null>(null)
  
  const spec = getSpec(page.layoutId)
  const images = allImages(page.blocks)
  const titleBlock = page.titleBlockId ? TITLE_BLOCKS.find(b => b.id === page.titleBlockId) : undefined

  const patchBlock = (id: string, patch: Partial<Block> & { isDeleted?: boolean, zOp?: 'front' | 'back' | 'forward' | 'backward' }) => {
    if (patch.isDeleted) {
      onChange({ ...page, blocks: page.blocks.filter(b => b.id !== id) })
      return
    }
    const newPatch = { ...patch }
    if (newPatch.zOp) {
      const block = page.blocks.find(b => b.id === id)
      if (block && block.freeform) {
        const zs = page.blocks.map(b => b.freeform?.z ?? 50)
        const currentZ = block.freeform.z ?? 50
        const maxZ = Math.max(1, ...zs)
        const minZ = Math.min(1, ...zs)
        let newZ = currentZ
        if (newPatch.zOp === 'front') newZ = maxZ + 1
        if (newPatch.zOp === 'back') newZ = Math.max(0, minZ - 1)
        if (newPatch.zOp === 'forward') newZ = currentZ + 1
        if (newPatch.zOp === 'backward') newZ = Math.max(0, currentZ - 1)
        newPatch.freeform = { ...block.freeform, z: newZ }
      }
      delete newPatch.zOp
    }
    onChange({ ...page, blocks: page.blocks.map(b => b.id === id ? { ...b, ...newPatch } : b) })
  }

  const addBlock = (type: BlockType): Block => {
    const block = createBlock(type)
    onChange({ ...page, blocks: [...page.blocks, block] })
    return block
  }

  const firstOfType = (type: BlockType) => page.blocks.find(b => b.type === type)

  const overlay = spec.kind === 'overlay'

  return (
    <div
      className={`relative w-full mx-auto shadow-2xl ${overflowVisible ? '' : 'overflow-hidden'}`}
      style={{
        background: tokens.background,
        color: tokens.text,
        fontFamily: tokens.bodyFont,
        aspectRatio: pageSize ? `${pageSize.width} / ${pageSize.height}` : '210 / 297',
        width: '100%'
      }}
      onDragOver={e => e.preventDefault()}
      onDrop={async e => {
        e.preventDefault()
        if (!onFreeChange || !onUploadImage) return
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
        if (files.length === 0) return

        const urls = await Promise.all(files.map(f => onUploadImage(f)))
        const validUrls = urls.filter(u => !!u)
        if (validUrls.length === 0) return

        const cols = Math.ceil(Math.sqrt(validUrls.length))
        const rows = Math.ceil(validUrls.length / cols)
        const margin = 5
        const gap = 2
        const availableW = 100 - (margin * 2) - (gap * (cols - 1))
        const availableH = 100 - (margin * 2) - (gap * (rows - 1))
        const w = availableW / cols
        const h = availableH / rows

        const newElements = validUrls.map((url, i) => {
          const col = i % cols
          const row = Math.floor(i / cols)
          return {
            id: `fe-${Date.now()}-${i}`,
            kind: 'image' as const,
            x: margin + col * (w + gap),
            y: margin + row * (h + gap),
            w, h,
            src: url,
            z: 10 + i,
            locked: false
          }
        })
        onFreeChange([...(page.freeElements || []), ...newElements])
      }}
    >
      {/* Publishing background layers (behind content) */}
      <BackgroundLayers backgrounds={backgrounds} />
      <GridOverlay grid={grid} />

      <div
        className="absolute inset-0 grid p-6"
        style={{ gridTemplateColumns: 'repeat(12, 1fr)', gridTemplateRows: 'repeat(12, 1fr)', gridAutoColumns: '1fr', gap: 8 }}
        onPointerDown={() => setActiveBlock(null)}
      >
        {spec.regions.map((region, i) => (
          <RegionView
            key={i}
            region={region}
            spec={spec}
            tokens={tokens}
            overlay={overlay}
            images={images}
            patchBlock={patchBlock}
            addBlock={addBlock}
            firstOfType={firstOfType}
            onUploadImage={onUploadImage}
            titleBlock={titleBlock}
            pages={pages || []}
            pageContext={pageContext}
            onUpdateGlobalPages={onUpdateGlobalPages}
            masterElements={masterElements}
            activeBlock={activeBlock}
            setActiveBlock={setActiveBlock}
            onInsertImage={url => {
              // Exact placeholder slot replacement logic (BUG 1)
              const currentImages = page.blocks.filter(b => ['render', 'plan', 'section', 'diagram'].includes(b.type))
              const idx = region.imageIndex ?? 0
              if (idx < currentImages.length) {
                const targetBlockId = currentImages[idx].id
                const updatedBlocks = page.blocks.map(b =>
                  b.id === targetBlockId ? { ...b, imageUrl: url, zoom: 1, xOffset: 0, yOffset: 0, fit: 'cover' as const } : b
                )
                onChange({ ...page, blocks: updatedBlocks })
              } else {
                const newBlocks = [...page.blocks]
                const needed = idx - currentImages.length + 1
                for (let k = 0; k < needed; k++) {
                  const isLast = k === needed - 1
                  const newImgBlock = {
                    ...createBlock('render'),
                    imageUrl: isLast ? url : undefined,
                    zoom: 1,
                    xOffset: 0,
                    yOffset: 0,
                    fit: 'cover' as const
                  }
                  newBlocks.push(newImgBlock)
                }
                onChange({ ...page, blocks: newBlocks })
              }
            }}
          />
        ))}
      </div>

      {/* gradient scrim for overlay covers */}
      {overlay && (
        <div className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
      )}

      {/* Architectural drawing furniture (scale bar / north / caption) */}
      <DrawingInfoBar meta={page.drawingMeta} tokens={tokens} />

      {/* Publishing master elements (headers / footers / page numbers, above content) */}
      {pageContext && (
        <MasterElements
          elements={masterElements}
          ctx={pageContext}
          tokens={tokens}
          editable={!!editableFree}
          onUpdateElement={onUpdateMasterElement}
        />
      )}

      {/* Free-canvas overlay (movable / resizable / rotatable elements) */}
      {(editableFree || (page.freeElements && page.freeElements.length > 0)) && (
        <FreeCanvas
          elements={page.freeElements || []}
          onChange={els => onFreeChange?.(els)}
          tokens={tokens}
          editable={!!editableFree}
          onApplyScope={onApplyScope}
          onSelectionChange={onFreeSelectionChange}
        />
      )}

      {/* Free-tier watermark — tiled diagonally across the whole page */}
      {showWatermark && (
        <div className="absolute inset-0 pointer-events-none z-[9999] overflow-hidden select-none" aria-hidden="true">
          <div className="absolute inset-[-25%] flex flex-col justify-around -rotate-[30deg]">
            {Array.from({ length: 9 }).map((_, r) => (
              <div
                key={r}
                className="flex justify-around whitespace-nowrap font-black uppercase tracking-[0.35em]"
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: '1.5rem',
                  color: 'rgba(140,140,140,0.32)',
                  textShadow: '0 1px 1px rgba(255,255,255,0.18), 0 -1px 1px rgba(0,0,0,0.18)',
                }}
              >
                {Array.from({ length: 6 }).map((_, c) => (
                  <span key={c}>CREATED WITH COSMOFOLIO&nbsp;&nbsp;&nbsp;&nbsp;</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function gridStyle(r: Region): React.CSSProperties {
  return { gridColumn: `${r.c0} / span ${r.cs}`, gridRow: `${r.r0} / span ${r.rs}`, minHeight: 0, minWidth: 0, position: 'relative' }
}

function ImageUploadPlaceholder({
  style, onUploadImage, onDone, type
}: {
  style: React.CSSProperties
  onUploadImage?: (file: File) => Promise<string>
  onDone: (url: string) => void
  type: BlockType
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleUpload = async (file: File) => {
    const valid = file.type.startsWith('image/') || file.type === 'application/pdf'
    if (!valid) {
      alert(`❌ Unsupported file type: ${file.type || 'unknown'}. Use JPG, PNG, WEBP or PDF.`)
      return
    }
    setUploading(true)
    try {
      let url = ''
      if (onUploadImage) {
        url = await onUploadImage(file)
      } else {
        url = URL.createObjectURL(file)
      }
      onDone(url)
    } catch (e: any) {
      console.error(e)
      alert(`❌ Upload failed: ${e?.message || 'unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      style={style}
      onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={async e => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) await handleUpload(file)
      }}
      onClick={() => fileInputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50/40 transition border-2 border-dashed rounded-sm cursor-pointer ${
        isDragging ? 'border-blue-500 bg-blue-50/10 text-blue-500' : 'border-gray-300'
      }`}
    >
      {uploading ? (
        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
      ) : (
        <>
          <span className="text-2xl leading-none">＋</span>
          <span className="text-[9px] uppercase tracking-widest font-semibold mt-1">{type || 'Image'}</span>
          <span className="text-[8px] opacity-75 mt-0.5">Click or drag & drop</span>
        </>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={async e => {
          const file = e.target.files?.[0]
          if (file) await handleUpload(file)
        }}
        accept="image/*,application/pdf"
        className="hidden"
      />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   RESUME BLOCK RENDERERS
   Each block type is a self-contained inline editor. All edits patch the
   block in place — no separate form/modal needed.
   ══════════════════════════════════════════════════════════════════════════*/

function ResumeBlockStyleSettings({ block, tokens, onChange }: { block: Block, tokens: DesignTokens, onChange: (p: Partial<Block>) => void }) {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false)
    }, 300)
  }

  const styleConfig = block.resumeStyle || {}
  const updateStyle = (patch: any) => onChange({ resumeStyle: { ...styleConfig, ...patch } })

  return (
    <div 
      className="relative flex items-center print:hidden" data-html2canvas-ignore="true" 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button onClick={() => setOpen(!open)} className="text-[12px] p-1 rounded transition-colors opacity-40 hover:opacity-100 hover:bg-black/5" title="Block Style">
        🎨
      </button>
      
      {open && (
        <div className="absolute right-0 top-full pt-1 z-[10000] print:hidden cursor-default" data-html2canvas-ignore="true" >
          <div className="bg-white/95 backdrop-blur-md p-3 rounded-lg shadow-xl border border-black/10 w-64 text-left">
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Block Style</div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase text-gray-500 font-semibold">Layout Variant</span>
                <select 
                  className="bg-black/5 text-[10px] uppercase font-bold p-1 rounded outline-none border border-black/10 w-full"
                  value={styleConfig.variant || 'list'}
                  onChange={e => updateStyle({ variant: e.target.value })}
                >
                  <option value="list">Standard List</option>
                  <option value="timeline">Timeline</option>
                  <option value="bento">Bento Grid</option>
                  <option value="masonry">Masonry</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase text-gray-500 font-semibold">Proficiency Style (Skills)</span>
                <select 
                  className="bg-black/5 text-[10px] uppercase font-bold p-1 rounded outline-none border border-black/10 w-full"
                  value={styleConfig.barStyle || 'dots'}
                  onChange={e => updateStyle({ barStyle: e.target.value })}
                >
                  <option value="dots">Minimal Dots (●●●○○)</option>
                  <option value="bars">Progress Bars</option>
                  <option value="text">Numeric (3/5)</option>
                  <option value="none">Hidden</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase text-gray-500 font-semibold">Divider Line</span>
                <select 
                  className="bg-black/5 text-[10px] uppercase font-bold p-1 rounded outline-none border border-black/10 w-full"
                  value={styleConfig.divider || 'none'}
                  onChange={e => updateStyle({ divider: e.target.value })}
                >
                  <option value="none">None</option>
                  <option value="solid">Solid Line</option>
                  <option value="dashed">Dashed Line</option>
                  <option value="dotted">Dotted Line</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex justify-between"><span className="text-[9px] uppercase text-gray-500 font-semibold">Item Spacing</span><span className="text-[9px] font-mono">{styleConfig.gap ?? 16}px</span></div>
                <input type="range" min="4" max="48" step="4" value={styleConfig.gap ?? 16} onChange={e => updateStyle({ gap: parseInt(e.target.value) })} className="w-full accent-black" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BlockTypographySettings({ block, tokens, onChange }: { block: Block, tokens: DesignTokens, onChange: (p: Partial<Block>) => void }) {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false)
    }, 300)
  }

  return (
    <div 
      className="relative flex items-center print:hidden" data-html2canvas-ignore="true" 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button onClick={() => setOpen(!open)} className="text-[12px] p-1 rounded transition-colors font-bold opacity-40 hover:opacity-100 hover:bg-black/5" style={{ color: tokens.text }} title="Typography">
        A
      </button>
      
      {open && (
        <div className="absolute right-0 top-full pt-1 z-[10000] print:hidden cursor-default" data-html2canvas-ignore="true" >
          <div className="bg-white/95 backdrop-blur-md p-3 rounded-lg shadow-xl border border-black/10 w-56 text-left">
          <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Typography</div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between"><span className="text-[9px] uppercase text-gray-500 font-semibold">Font Size</span><span className="text-[9px] font-mono">{Math.round((block.fontSize || 1)*100)}%</span></div>
              <input type="range" min="0.5" max="2" step="0.1" value={block.fontSize || 1} onChange={e => onChange({ fontSize: parseFloat(e.target.value) })} className="w-full accent-black" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] uppercase text-gray-500 font-semibold">Text Color</span>
              <input type="color" value={block.color || tokens.text} onChange={e => onChange({ color: e.target.value })} className="w-6 h-6 rounded cursor-pointer border border-black/10 p-0" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] uppercase text-gray-500 font-semibold">Title Color</span>
              <input type="color" value={block.tocStyle?.titleColor || tokens.primary} onChange={e => onChange({ tocStyle: { ...(block.tocStyle || {}), titleColor: e.target.value } })} className="w-6 h-6 rounded cursor-pointer border border-black/10 p-0" />
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BlockHoverToolbar({ block, tokens, onChange, showTypography = true, isActive, pos }: { block: Block, tokens: DesignTokens, onChange: (p: Partial<Block> & { isDeleted?: boolean, zOp?: 'front' | 'back' | 'forward' | 'backward' }) => void, showTypography?: boolean, isActive?: boolean, pos?: { x: number, y: number } }) {
  if (!isActive) return null

  const style: React.CSSProperties = pos ? { top: Math.max(0, pos.y - 45), left: pos.x } : {}
  const baseClasses = "absolute flex items-center gap-2 transition-opacity z-50 print:hidden bg-white/90 backdrop-blur-sm shadow-sm rounded border border-gray-200/50 px-1 py-0.5 pointer-events-auto"
  
  return (
    <div className={`${baseClasses} opacity-100`} style={style} onPointerDown={e => e.stopPropagation()} data-html2canvas-ignore="true">
      {showTypography && <BlockTypographySettings block={block} tokens={tokens} onChange={onChange} />}
      {block.freeform && (
        <>
          <button onClick={(e) => { e.stopPropagation(); onChange({ zOp: 'front' }) }} className="text-[9px] font-bold text-gray-500 hover:text-gray-800" title="Bring to Front">⇈</button>
          <button onClick={(e) => { e.stopPropagation(); onChange({ zOp: 'forward' }) }} className="text-[9px] font-bold text-gray-500 hover:text-gray-800" title="Bring Forward">⇧</button>
          <button onClick={(e) => { e.stopPropagation(); onChange({ zOp: 'backward' }) }} className="text-[9px] font-bold text-gray-500 hover:text-gray-800" title="Send Backward">⇩</button>
          <button onClick={(e) => { e.stopPropagation(); onChange({ zOp: 'back' }) }} className="text-[9px] font-bold text-gray-500 hover:text-gray-800" title="Send to Back">⇊</button>
          
          <div className="w-px h-3 bg-gray-300 mx-1"></div>
          
          <button onClick={(e) => { e.stopPropagation(); onChange({ freeform: { ...block.freeform!, pinned: !block.freeform!.pinned } }) }} className={`text-[9px] font-bold uppercase ${block.freeform.pinned ? 'text-green-600' : 'text-gray-400 hover:text-gray-700'}`} title={block.freeform.pinned ? "Unpin block" : "Pin block in place"}>
            {block.freeform.pinned ? '📍 Unpin' : '📌 Pin'}
          </button>
        </>
      )}
      <button onClick={(e) => { e.stopPropagation(); onChange({ freeform: block.freeform ? undefined : { x: 10, y: 10, w: 40, h: 40 } }) }} className="text-[9px] font-bold text-blue-500 hover:text-blue-700 uppercase" title={block.freeform ? "Snap back to layout grid" : "Unlock from Grid"}>
        {block.freeform ? '↩ Grid' : '🔓 Unlock'}
      </button>
      <button onClick={(e) => { e.stopPropagation(); onChange({ isDeleted: true }) }} className="text-[9px] font-bold text-red-500 hover:text-red-700 uppercase ml-1" title="Delete Block">
        ✕
      </button>
    </div>
  )
}

function ResumeHeadshot({ block, tokens, onChange, onUpload }: { block: Block; tokens: DesignTokens; onChange: (p: Partial<Block>) => void; onUpload?: (f: File) => Promise<string> }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const handle = async (file: File) => {
    setUploading(true)
    try { const url = onUpload ? await onUpload(file) : URL.createObjectURL(file); onChange({ imageUrl: url }) }
    finally { setUploading(false) }
  }
  if (block.imageUrl) {
    return (
      <div className="relative w-full h-full group overflow-hidden rounded-lg">
        <div className="absolute inset-0 cursor-pointer" onClick={() => fileRef.current?.click()}>
          <img src={block.imageUrl} alt="headshot" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ objectPosition: `${50 + (block.xOffset || 0)}% ${50 + (block.yOffset || 0)}%` }} />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold backdrop-blur-sm">Change Photo</div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); (onChange as any)({ isDeleted: true }) }} className="absolute top-2 right-2 text-[10px] bg-red-500 hover:bg-red-600 text-white w-5 h-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 print:hidden shadow-sm" title="Remove Block">✕</button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handle(f) }} />
      </div>
    )
  }
  return (
    <div className="relative w-full h-full group">
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 border-[1.5px] border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition" onClick={() => fileRef.current?.click()}>
        {uploading ? <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <>
          <span className="text-3xl opacity-50">👤</span>
          <span className="text-[9px] uppercase tracking-widest font-semibold text-gray-400">Add Photo</span>
        </>}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handle(f) }} />
      </div>
      <button onClick={(e) => { e.stopPropagation(); (onChange as any)({ isDeleted: true }) }} className="absolute top-2 right-2 text-[10px] bg-red-500 hover:bg-red-600 text-white w-5 h-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 print:hidden shadow-sm" title="Remove Block">✕</button>
    </div>
  )
}

function ResumeBio({ block, tokens, onChange }: { block: Block; tokens: DesignTokens; onChange: (p: Partial<Block>) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(block.text || '')
  const save = () => { onChange({ text: draft }); setEditing(false) }
  
  const finalPrimary = block.tocStyle?.titleColor || tokens.primary
  const finalText = block.color || tokens.text
  const finalFontSize = block.fontSize || 1

  const styleConfig = block.resumeStyle || {}
  const variant = styleConfig.variant || 'list'
  const divider = styleConfig.divider || 'none'
  const gap = styleConfig.gap ?? 16

  const isBento = variant === 'bento'
  const wrapperClass = isBento ? 'bg-black/5 p-4 rounded-xl border border-black/5' : ''
  const dividerClass = divider === 'solid' ? 'border-b border-black/10 pb-4' : divider === 'dashed' ? 'border-b border-dashed border-black/15 pb-4' : divider === 'dotted' ? 'border-b border-dotted border-black/20 pb-4' : ''

  return (
    <div className={`w-full h-full flex flex-col overflow-visible relative ${wrapperClass} ${dividerClass}`} style={{ zoom: finalFontSize, gap: gap + 'px' } as React.CSSProperties}>
      <div className="flex items-center justify-between border-b pb-1.5 shrink-0" style={{ borderColor: tokens.muted + '40' }}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-[1px]" style={{ background: tokens.accent }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80" style={{ color: finalPrimary, fontFamily: tokens.headingFont }}>Profile</span>
        </div>
        <div className="flex items-center gap-3 print:hidden" data-html2canvas-ignore="true">
          <ResumeBlockStyleSettings block={block} tokens={tokens} onChange={onChange} />
          <BlockTypographySettings block={block} tokens={tokens} onChange={onChange} />
          {block.freeform && (
            <button onClick={() => onChange({ freeform: { ...block.freeform!, pinned: !block.freeform!.pinned } })} className={`text-[9px] font-bold uppercase ${block.freeform.pinned ? 'text-green-600' : 'text-gray-400 hover:text-gray-700'}`} title={block.freeform.pinned ? "Unpin block" : "Pin block in place"}>
              {block.freeform.pinned ? '📍 Unpin' : '📌 Pin'}
            </button>
          )}
          <button onClick={() => onChange({ freeform: block.freeform ? undefined : { x: 10, y: 10, w: 40, h: 40 } })} className="text-[9px] font-bold text-blue-500 hover:text-blue-700 uppercase" title={block.freeform ? "Snap back to layout grid" : "Unlock from Grid"}>
            {block.freeform ? '↩ Grid' : '🔓 Unlock'}
          </button>
          <div className="w-[1px] h-3 bg-current opacity-10 mx-1" />
          <button onClick={() => (onChange as any)({ isDeleted: true })} className="text-[9px] font-bold text-red-500/40 hover:text-red-500 uppercase transition-colors" title="Remove Block">✕ DEL</button>
        </div>
      </div>
      {editing ? (
        <div className="flex flex-col gap-1 flex-1 pl-6">
          <textarea autoFocus value={draft} onChange={e => setDraft(e.target.value)} className="flex-1 text-[11px] leading-relaxed bg-white/10 border border-current/20 rounded p-2 resize-none w-full outline-none focus:border-blue-400" style={{ color: finalText, fontFamily: tokens.bodyFont }} />
          <button onClick={save} className="text-[9px] font-bold tracking-wider px-3 py-1 rounded self-start mt-1" style={{ background: tokens.accent, color: '#fff' }}>SAVE</button>
        </div>
      ) : (
        <p className="text-[11px] leading-relaxed flex-1 cursor-text hover:opacity-80 pl-6 border-l-[1.5px] border-transparent hover:border-gray-200 transition-colors whitespace-pre-wrap" style={{ color: finalText, fontFamily: tokens.bodyFont }} onClick={() => { setDraft(block.text || ''); setEditing(true) }}>
          {block.text || <span className="opacity-40 italic">Click to write your architectural manifesto or professional summary...</span>}
        </p>
      )}
    </div>
  )
}

function ResumeEducation({ block, tokens, onChange }: { block: Block; tokens: DesignTokens; onChange: (p: Partial<Block>) => void }) {
  const entries: ResumeEntry[] = block.resumeEntries || []
  const patch = (next: ResumeEntry[]) => onChange({ resumeEntries: next })
  const add = () => patch([...entries, { title: 'Degree / School', org: 'Institution', year: '2026', detail: '' }])
  const upd = (i: number, k: keyof ResumeEntry, v: string) => patch(entries.map((e, idx) => idx === i ? { ...e, [k]: v } : e))
  const del = (i: number) => patch(entries.filter((_, idx) => idx !== i))
  
  const finalPrimary = block.tocStyle?.titleColor || tokens.primary
  const finalText = block.color || tokens.text
  const finalFontSize = block.fontSize || 1

  const styleConfig = block.resumeStyle || {}
  const variant = styleConfig.variant || 'timeline'
  const divider = styleConfig.divider || 'none'
  const gap = styleConfig.gap ?? 16

  const gridClass = variant === 'list' ? 'flex flex-col' : variant === 'timeline' ? 'flex flex-col pl-4 border-l border-black/10' : variant === 'masonry' ? 'columns-1 @xs:columns-2 gap-x-6 gap-y-4' : variant === 'bento' ? 'grid grid-cols-1 @xs:grid-cols-2 auto-rows-max gap-4' : 'grid grid-cols-1 @xs:grid-cols-2 gap-6'
  const itemClass = variant === 'bento' ? 'bg-black/5 p-4 rounded-xl border border-black/5' : ''
  const dividerClass = divider === 'solid' ? 'border-b border-black/10 pb-4' : divider === 'dashed' ? 'border-b border-dashed border-black/15 pb-4' : divider === 'dotted' ? 'border-b border-dotted border-black/20 pb-4' : ''

  return (
    <div className="w-full @container h-full flex flex-col gap-3 overflow-visible" style={{ zoom: finalFontSize } as React.CSSProperties}>
      <div className="flex items-center justify-between border-b pb-1.5 shrink-0" style={{ borderColor: tokens.muted + '40' }}>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: finalPrimary, fontFamily: tokens.headingFont }}>Experience / Education</span>
        <div className="flex items-center gap-3 print:hidden" data-html2canvas-ignore="true">
          <ResumeBlockStyleSettings block={block} tokens={tokens} onChange={onChange} />
          <BlockTypographySettings block={block} tokens={tokens} onChange={onChange} />
          <button onClick={add} className="text-[9px] font-bold opacity-40 hover:opacity-100 transition-opacity" style={{ color: tokens.accent }}>+ ADD</button>
          {block.freeform && (
            <button onClick={() => onChange({ freeform: { ...block.freeform!, pinned: !block.freeform!.pinned } })} className={`text-[9px] font-bold uppercase ${block.freeform.pinned ? 'text-green-600' : 'text-gray-400 hover:text-gray-700'}`} title={block.freeform.pinned ? "Unpin block" : "Pin block in place"}>
              {block.freeform.pinned ? '📍 Unpin' : '📌 Pin'}
            </button>
          )}
          <button onClick={() => onChange({ freeform: block.freeform ? undefined : { x: 10, y: 10, w: 40, h: 40 } })} className="text-[9px] font-bold text-blue-500 hover:text-blue-700 uppercase" title={block.freeform ? "Snap back to layout grid" : "Unlock from Grid"}>
            {block.freeform ? '↩ Grid' : '🔓 Unlock'}
          </button>
          <div className="w-[1px] h-3 bg-current opacity-10 mx-1" />
          <button onClick={() => (onChange as any)({ isDeleted: true })} className="text-[9px] font-bold text-red-500/40 hover:text-red-500 uppercase transition-colors" title="Remove Block">✕ DEL</button>
        </div>
      </div>
      <div className={`flex-1 overflow-hidden pb-2 pr-1 content-start mt-1 ${gridClass}`} style={variant === 'bento' || variant === 'masonry' ? {} : { gap: gap + 'px' }}>
        {entries.map((e, i) => (
          <div key={i} className={`group relative flex flex-col @sm:flex-row gap-1 @sm:gap-4 items-start shrink min-h-0 overflow-hidden break-inside-avoid ${itemClass} ${dividerClass} ${variant === 'timeline' ? 'pl-4 @sm:pl-0' : ''}`}>
            {variant === 'timeline' && (
              <div className="hidden @sm:block w-[1.5px] h-[150%] absolute left-0 top-0" style={{ background: tokens.accent, opacity: 0.2 }} />
            )}
            
            <div className="w-16 @sm:w-20 shrink-0">
              <input value={e.year || ''} onChange={ev => upd(i, 'year', ev.target.value)} placeholder="Year" className="w-full text-[10px] font-mono font-bold bg-transparent border-b border-transparent hover:border-current/20 focus:border-current/40 outline-none" style={{ color: tokens.accent }} />
            </div>
            
            <div className="flex-1 min-w-0 flex flex-col gap-[2px] overflow-hidden min-h-0 shrink">
              <input value={e.title} onChange={ev => upd(i, 'title', ev.target.value)} placeholder="Role / Degree" className="block w-full text-[11px] font-bold bg-transparent border-b border-transparent hover:border-current/20 focus:border-current/40 outline-none leading-tight shrink-0" style={{ color: finalPrimary, fontFamily: tokens.headingFont }} />
              <input value={e.org || ''} onChange={ev => upd(i, 'org', ev.target.value)} placeholder="Organisation / Institution" className="block w-full text-[9px] uppercase tracking-wider font-semibold opacity-80 bg-transparent border-b border-transparent hover:border-current/20 focus:border-current/40 outline-none shrink-0" style={{ color: finalText, fontFamily: tokens.bodyFont }} />
              <textarea 
                value={e.detail || ''} 
                onChange={ev => upd(i, 'detail', ev.target.value)} 
                onInput={ev => {
                  ev.currentTarget.style.height = 'auto';
                  ev.currentTarget.style.height = ev.currentTarget.scrollHeight + 'px';
                }}
                placeholder="Description / Details" 
                rows={1} 
                className="w-full mt-1 text-[9.5px] leading-relaxed opacity-70 bg-transparent border border-transparent hover:border-current/20 focus:border-current/40 outline-none resize-none overflow-hidden shrink min-h-0" 
                style={{ color: finalText, fontFamily: tokens.bodyFont, minHeight: '12px' }} 
              />
            </div>
            <button onClick={() => del(i)} type="button" title="Delete Entry" className="absolute right-0 top-0 text-[10px] opacity-40 hover:opacity-100 text-red-500 self-start p-1 transition-opacity z-10 cursor-pointer print:hidden" data-html2canvas-ignore="true">✕</button>
          </div>
        ))}
        {entries.length === 0 && <button onClick={add} className="text-[10px] opacity-40 italic mt-2 text-left print:hidden" data-html2canvas-ignore="true">Click + ADD to create a timeline entry</button>}
      </div>
    </div>
  )
}

function SoftwareIcon({ name, fallbackText }: { name: string, fallbackText?: string }) {
  const [error, setError] = useState(false);
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const aliasMap: Record<string, string> = {
    'rhino': 'rhinoceros', 'rhinoceros3d': 'rhinoceros', 'grasshopper': 'rhinoceros',
    'photoshop': 'adobephotoshop', 'ps': 'adobephotoshop',
    'illustrator': 'adobeillustrator', 'ai': 'adobeillustrator',
    'indesign': 'adobeindesign', 'id': 'adobeindesign',
    'cad': 'autocad', 'autocad': 'autocad',
    'revit': 'revit',
    'sketchup': 'sketchup',
    'vray': 'vray',
    'blender': 'blender',
    'unity': 'unity',
    'unreal': 'unrealengine', 'unrealengine': 'unrealengine',
    'figma': 'figma',
    'enscape': 'enscape',
    'lumion': 'lumion' // Not in simple-icons, will fallback
  }

  const finalSlug = aliasMap[slug] || slug;

  if (error || !name) {
    return (
      <div className="w-[18px] h-[18px] flex items-center justify-center rounded-[4px] bg-black/5 dark:bg-white/10 text-current opacity-60 font-bold text-[8px] uppercase">
        {fallbackText || name.charAt(0)}
      </div>
    );
  }

  return (
    <img 
      src={`https://cdn.simpleicons.org/${finalSlug}`} 
      onError={() => setError(true)}
      alt={name}
      className="w-[18px] h-[18px] object-contain opacity-70 transition-opacity hover:opacity-100 dark:brightness-200 dark:contrast-0"
    />
  );
}

function ResumeSkills({ block, tokens, onChange, label = 'Skills' }: { block: Block; tokens: DesignTokens; onChange: (p: Partial<Block>) => void; label?: string }) {
  const items: SkillItem[] = block.skillItems || []
  const patch = (next: SkillItem[]) => onChange({ skillItems: next })
  const add = () => patch([...items, { name: 'New Skill', level: 3, icon: '' }])
  const upd = (i: number, k: keyof SkillItem, v: string | number) => patch(items.map((s, idx) => idx === i ? { ...s, [k]: v } : s))
  const del = (i: number) => patch(items.filter((_, idx) => idx !== i))
  const isSoftware = label === 'Software'

  const finalPrimary = block.tocStyle?.titleColor || tokens.primary
  const finalText = block.color || tokens.text
  const finalFontSize = block.fontSize || 1

  const styleConfig = block.resumeStyle || {}
  const barStyle = styleConfig.barStyle || 'bars'
  const divider = styleConfig.divider || 'none'
  const gap = styleConfig.gap ?? 16
  const variant = styleConfig.variant || 'list'

  const gridClass = variant === 'list' ? 'flex flex-col' : variant === 'timeline' ? 'flex flex-col pl-4 border-l border-black/10' : variant === 'masonry' ? 'columns-1 @xs:columns-2 gap-x-6' : 'grid grid-cols-1 @xs:grid-cols-2'
  const dividerClass = divider === 'solid' ? 'border-b border-black/10 pb-2' : divider === 'dashed' ? 'border-b border-dashed border-black/15 pb-2' : divider === 'dotted' ? 'border-b border-dotted border-black/20 pb-2' : ''

  return (
    <div className="w-full @container h-full flex flex-col gap-3 overflow-visible" style={{ zoom: finalFontSize } as React.CSSProperties}>
      <div className="flex items-center justify-between border-b pb-1.5 shrink-0" style={{ borderColor: tokens.muted + '40' }}>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: finalPrimary, fontFamily: tokens.headingFont }}>{label}</span>
        <div className="flex items-center gap-3 print:hidden" data-html2canvas-ignore="true">
          <ResumeBlockStyleSettings block={block} tokens={tokens} onChange={onChange} />
          <BlockTypographySettings block={block} tokens={tokens} onChange={onChange} />
          <button onClick={add} className="text-[9px] font-bold opacity-40 hover:opacity-100 transition-opacity" style={{ color: tokens.accent }}>+ ADD</button>
          {block.freeform && (
            <button onClick={() => onChange({ freeform: { ...block.freeform!, pinned: !block.freeform!.pinned } })} className={`text-[9px] font-bold uppercase ${block.freeform.pinned ? 'text-green-600' : 'text-gray-400 hover:text-gray-700'}`} title={block.freeform.pinned ? "Unpin block" : "Pin block in place"}>
              {block.freeform.pinned ? '📍 Unpin' : '📌 Pin'}
            </button>
          )}
          <button onClick={() => onChange({ freeform: block.freeform ? undefined : { x: 10, y: 10, w: 40, h: 40 } })} className="text-[9px] font-bold text-blue-500 hover:text-blue-700 uppercase" title={block.freeform ? "Snap back to layout grid" : "Unlock from Grid"}>
            {block.freeform ? '↩ Grid' : '🔓 Unlock'}
          </button>
          <div className="w-[1px] h-3 bg-current opacity-10 mx-1" />
          <button onClick={() => (onChange as any)({ isDeleted: true })} className="text-[9px] font-bold text-red-500/40 hover:text-red-500 uppercase transition-colors" title="Remove Block">✕ DEL</button>
        </div>
      </div>
      
      <div className={`flex-1 overflow-hidden pr-1 content-start mt-1 ${gridClass}`} style={{ gap: gap + 'px' }}>
        {items.map((s, i) => (
          <div key={i} className={`group flex flex-col gap-1.5 break-inside-avoid ${dividerClass}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {isSoftware && <SoftwareIcon name={s.name} fallbackText={s.icon} />}
                <input value={s.name} onChange={ev => upd(i, 'name', ev.target.value)} placeholder="Skill name" className="flex-1 text-[10px] font-semibold tracking-wide uppercase bg-transparent border-b border-transparent hover:border-current/20 focus:border-current/40 outline-none truncate" style={{ color: finalText, fontFamily: tokens.bodyFont }} />
              </div>
              <button onClick={() => del(i)} type="button" title="Delete Skill" className="text-[10px] opacity-40 hover:opacity-100 text-red-500 leading-none px-1 transition-opacity z-10 cursor-pointer print:hidden" data-html2canvas-ignore="true">✕</button>
            </div>
            
            {barStyle === 'bars' && (
              <div className="flex gap-[2px] h-[3px] w-full mt-0.5">
                {[1,2,3,4,5].map(level => (
                  <button key={level} onClick={() => upd(i, 'level', level)} className="flex-1 rounded-sm transition-all duration-300 ease-out hover:brightness-110 hover:scale-y-150" style={{ background: level <= s.level ? tokens.accent : tokens.muted, opacity: level <= s.level ? 1 : 0.2 }} />
                ))}
              </div>
            )}
            
            {barStyle === 'dots' && (
              <div className="flex gap-1 items-center mt-0.5">
                {[1,2,3,4,5].map(level => (
                  <button key={level} onClick={() => upd(i, 'level', level)} className="w-1.5 h-1.5 rounded-full transition-all hover:scale-150" style={{ background: level <= s.level ? tokens.accent : tokens.muted, opacity: level <= s.level ? 1 : 0.2 }} />
                ))}
              </div>
            )}

            {barStyle === 'text' && (
              <div className="flex items-center gap-2 mt-0.5">
                <input type="range" min="1" max="5" value={s.level} onChange={e => upd(i, 'level', parseInt(e.target.value))} className="w-16 accent-black print:hidden" />
                <span className="text-[9px] font-bold tracking-widest opacity-60" style={{ color: tokens.accent }}>{s.level} / 5</span>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && <button onClick={add} className="text-[10px] opacity-40 italic mt-1 text-left w-full col-span-full print:hidden" data-html2canvas-ignore="true">Click + ADD to create a skill</button>}
      </div>
    </div>
  )
}

function ResumeList({ block, tokens, onChange, label, icon }: { block: Block; tokens: DesignTokens; onChange: (p: Partial<Block>) => void; label: string; icon: string }) {
  const entries: ResumeEntry[] = block.resumeEntries || []
  const patch = (next: ResumeEntry[]) => onChange({ resumeEntries: next })
  const add = () => patch([...entries, { title: 'New Entry', org: '', year: '', detail: '' }])
  const upd = (i: number, k: keyof ResumeEntry, v: string) => patch(entries.map((e, idx) => idx === i ? { ...e, [k]: v } : e))
  const del = (i: number) => patch(entries.filter((_, idx) => idx !== i))
  const isAchievement = label === 'Achievements'
  
  const finalPrimary = block.tocStyle?.titleColor || tokens.primary
  const finalText = block.color || tokens.text
  const finalFontSize = block.fontSize || 1

  const styleConfig = block.resumeStyle || {}
  const variant = styleConfig.variant || 'list'
  const divider = styleConfig.divider || 'none'
  const gap = styleConfig.gap ?? 14

  const gridClass = variant === 'list' ? 'flex flex-col' : variant === 'timeline' ? 'flex flex-col pl-4 border-l border-black/10' : variant === 'masonry' ? 'columns-1 @xs:columns-2 gap-x-6 gap-y-4' : variant === 'bento' ? 'grid grid-cols-1 @xs:grid-cols-2 auto-rows-max gap-4' : 'grid grid-cols-1 @xs:grid-cols-2 gap-6'
  const itemClass = variant === 'bento' ? 'bg-black/5 p-4 rounded-xl border border-black/5' : ''
  const dividerClass = divider === 'solid' ? 'border-b border-black/10 pb-4' : divider === 'dashed' ? 'border-b border-dashed border-black/15 pb-4' : divider === 'dotted' ? 'border-b border-dotted border-black/20 pb-4' : ''

  return (
    <div className="w-full @container h-full flex flex-col gap-3 overflow-visible" style={{ zoom: finalFontSize } as React.CSSProperties}>
      <div className="flex items-center justify-between border-b pb-1.5 shrink-0" style={{ borderColor: tokens.muted + '40' }}>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: finalPrimary, fontFamily: tokens.headingFont }}>{label}</span>
        <div className="flex items-center gap-3 print:hidden" data-html2canvas-ignore="true">
          <ResumeBlockStyleSettings block={block} tokens={tokens} onChange={onChange} />
          <BlockTypographySettings block={block} tokens={tokens} onChange={onChange} />
          <button onClick={add} className="text-[9px] font-bold opacity-40 hover:opacity-100 transition-opacity" style={{ color: tokens.accent }}>+ ADD</button>
          {block.freeform && (
            <button onClick={() => onChange({ freeform: { ...block.freeform!, pinned: !block.freeform!.pinned } })} className={`text-[9px] font-bold uppercase ${block.freeform.pinned ? 'text-green-600' : 'text-gray-400 hover:text-gray-700'}`} title={block.freeform.pinned ? "Unpin block" : "Pin block in place"}>
              {block.freeform.pinned ? '📍 Unpin' : '📌 Pin'}
            </button>
          )}
          <button onClick={() => onChange({ freeform: block.freeform ? undefined : { x: 10, y: 10, w: 40, h: 40 } })} className="text-[9px] font-bold text-blue-500 hover:text-blue-700 uppercase" title={block.freeform ? "Snap back to layout grid" : "Unlock from Grid"}>
            {block.freeform ? '↩ Grid' : '🔓 Unlock'}
          </button>
          <div className="w-[1px] h-3 bg-current opacity-10 mx-1" />
          <button onClick={() => (onChange as any)({ isDeleted: true })} className="text-[9px] font-bold text-red-500/40 hover:text-red-500 uppercase transition-colors" title="Remove Block">✕ DEL</button>
        </div>
      </div>
      <div className={`flex-1 overflow-hidden pr-1 mt-1 ${gridClass}`} style={variant === 'bento' || variant === 'masonry' ? {} : { gap: gap + 'px' }}>
        {entries.map((e, i) => (
          <div key={i} className={`group flex gap-2 items-start relative shrink min-h-0 overflow-hidden break-inside-avoid ${itemClass} ${dividerClass} ${variant === 'timeline' ? 'pl-4 @sm:pl-0' : 'pl-3'}`}>
            {variant === 'timeline' ? (
               <div className="hidden @sm:block w-[1.5px] h-[150%] absolute left-0 top-0" style={{ background: tokens.accent, opacity: 0.2 }} />
            ) : (
               <span className="absolute left-0 top-[2px] text-[10px] font-mono font-bold" style={{ color: tokens.accent }}>{icon}</span>
            )}
            <div className="flex-1 min-w-0 flex flex-col min-h-0 shrink">
              <input value={e.title} onChange={ev => upd(i, 'title', ev.target.value)} placeholder="Title" className="block w-full text-[10px] font-bold bg-transparent border-b border-transparent hover:border-current/20 focus:border-current/40 outline-none leading-tight shrink-0" style={{ color: finalText, fontFamily: tokens.bodyFont }} />
              {isAchievement && (
                <div className="flex gap-2 items-center mt-0.5 shrink-0">
                  <input value={e.org || ''} onChange={ev => upd(i, 'org', ev.target.value)} placeholder="Organisation" className="flex-1 text-[9px] uppercase tracking-wider font-semibold opacity-70 bg-transparent border-b border-transparent hover:border-current/20 focus:border-current/40 outline-none" style={{ color: finalText }} />
                  <input value={e.year || ''} onChange={ev => upd(i, 'year', ev.target.value)} placeholder="Year" className="w-10 text-[9px] font-mono opacity-50 bg-transparent border-b border-transparent hover:border-current/20 focus:border-current/40 outline-none text-right" style={{ color: finalText }} />
                </div>
              )}
              <textarea 
                value={e.detail || ''} 
                onChange={ev => upd(i, 'detail', ev.target.value)} 
                onInput={ev => {
                  ev.currentTarget.style.height = 'auto';
                  ev.currentTarget.style.height = ev.currentTarget.scrollHeight + 'px';
                }}
                placeholder="Detail" 
                rows={1} 
                className="w-full mt-1 text-[9px] leading-relaxed opacity-60 bg-transparent border border-transparent hover:border-current/20 focus:border-current/40 outline-none resize-none overflow-hidden shrink min-h-0" 
                style={{ color: finalText, minHeight: '14px' }} 
              />
            </div>
            <button onClick={() => del(i)} type="button" title="Delete Item" className="absolute right-0 top-0 text-[10px] opacity-40 hover:opacity-100 text-red-500 self-start px-1 transition-opacity z-10 cursor-pointer print:hidden" data-html2canvas-ignore="true">✕</button>
          </div>
        ))}
        {entries.length === 0 && <button onClick={add} className="text-[10px] opacity-40 italic mt-1 text-left w-full print:hidden" data-html2canvas-ignore="true">Click + ADD to create a list item</button>}
      </div>
    </div>
  )
}

function FreeformWrapper({ block, patchBlock, children, zClass, tokens }: { block?: Block, patchBlock: (id: string, patch: Partial<Block>) => void, children: React.ReactNode, zClass?: string, tokens: DesignTokens }) {
  const dragRef = useRef<{ mode: 'move'|'resize', sx: number, sy: number, startFree: any } | null>(null)

  const isFree = !!block?.freeform
  if (!isFree) return <>{children}</>

  const onPointerDown = (e: React.PointerEvent, mode: 'move'|'resize') => {
    e.stopPropagation()
    dragRef.current = { mode, sx: e.clientX, sy: e.clientY, startFree: { ...block.freeform } }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d || !block?.freeform) return
    const container = e.currentTarget.parentElement // The grid container
    const rect = container?.getBoundingClientRect()
    if (!rect) return

    const dxp = ((e.clientX - d.sx) / rect.width) * 100
    const dyp = ((e.clientY - d.sy) / rect.height) * 100

    const patch: any = {}
    if (d.mode === 'move') {
      patch.x = d.startFree.x + dxp
      patch.y = d.startFree.y + dyp
    } else {
      patch.w = Math.max(5, d.startFree.w + dxp)
      patch.h = Math.max(5, d.startFree.h + dyp)
    }
    patchBlock(block.id, { freeform: { ...block.freeform, ...patch } })
  }

  const onPointerUp = (e: React.PointerEvent) => {
    dragRef.current = null
  }

  const isPinned = !!block.freeform!.pinned

  return (
    <div 
      className={`absolute shadow-2xl ${isPinned ? '' : 'ring-1 ring-blue-500/50 hover:ring-blue-500'} group/free rounded transition-all focus-within:z-[110] focus:z-[110] outline-none ${zClass}`}
      tabIndex={-1}
      style={{
        left: `${block.freeform!.x}%`,
        top: `${block.freeform!.y}%`,
        width: `${block.freeform!.w}%`,
        height: `${block.freeform!.h}%`,
        zIndex: block.freeform!.z !== undefined ? block.freeform!.z : 50,
      }}
      onPointerDown={isPinned ? undefined : e => onPointerDown(e, 'move')}
      onPointerMove={isPinned ? undefined : onPointerMove}
      onPointerUp={isPinned ? undefined : onPointerUp}
      onPointerCancel={isPinned ? undefined : onPointerUp}
    >
      <div className={`w-full h-full ${isPinned ? '' : 'cursor-move'} pointer-events-auto`}>
        {children}
      </div>
      
      {/* SE Resize Handle */}
      {!isPinned && (
        <div 
          onPointerDown={e => onPointerDown(e, 'resize')}
          className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm pointer-events-auto opacity-0 group-hover/free:opacity-100 transition-opacity print:hidden" data-html2canvas-ignore="true" 
          style={{ cursor: 'nwse-resize', zIndex: 60 }}
          
        />
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

function RegionView({
  region, spec, tokens, overlay, images, patchBlock, addBlock, firstOfType, onUploadImage, titleBlock, onInsertImage, pages, pageContext, onUpdateGlobalPages, masterElements, activeBlock, setActiveBlock
}: {
  region: Region
  spec: LayoutSpec
  tokens: DesignTokens
  overlay: boolean
  images: Block[]
  patchBlock: (id: string, patch: Partial<Block>) => void
  addBlock: (type: BlockType) => Block
  firstOfType: (type: BlockType) => Block | undefined
  onUploadImage?: (file: File) => Promise<string>
  titleBlock?: (typeof TITLE_BLOCKS)[number]
  onInsertImage?: (url: string) => void
  pages?: Page[]
  pageContext?: PageContext
  onUpdateGlobalPages?: (updater: (pages: Page[]) => Page[]) => void
  masterElements?: MasterElement[]
  activeBlock?: { id: string, x: number, y: number } | null
  setActiveBlock?: (v: { id: string, x: number, y: number } | null) => void
}) {
  const style = { ...gridStyle(region) }

  const handleAiPolish = async (text: string) => {
    try {
      const res = await apiClient.polishText(text)
      return res.polished_text
    } catch (e: any) {
      alert(`AI Polish failed: ${e.message}`)
      throw e
    }
  }

  // Collision detection and safe area guard (BUG 4)
  const hasTopMaster = masterElements?.some(el => !el.hidden && (el.position.startsWith('top') || (el.position === 'custom' && (el.y ?? 0) < 15)))
  const hasBottomMaster = masterElements?.some(el => !el.hidden && (el.position.startsWith('bottom') || (el.position === 'custom' && (el.y ?? 0) > 85)))
  
  const overlapsTop = region.r0 <= 2
  const overlapsBottom = (region.r0 + region.rs - 1) >= 11

  if (overlapsTop && hasTopMaster && region.role !== 'title') {
    style.paddingTop = '28px'
  }
  if (overlapsBottom && hasBottomMaster) {
    style.paddingBottom = '28px'
  }

  /* ---- image region ---- */
  if (region.role === 'image') {
    const idx = region.imageIndex ?? 0
    const block = images[idx]
    if (block) {
      return (
        <div style={style} className={`transition-all duration-200 ${overlay ? 'z-0' : 'z-20 hover:z-[100] focus-within:z-[100]'}`}>
          <ImageBlock block={block} tokens={tokens} onChange={p => patchBlock(block.id, p)} fill showLabel={!overlay} onUpload={onUploadImage} />
        </div>
      )
    }
    return (
      <ImageUploadPlaceholder
        style={style}
        type="render"
        onUploadImage={onUploadImage}
        onDone={url => {
          onInsertImage?.(url)
        }}
      />
    )
  }

  /* ---- text-type regions ---- */
  const type = ROLE_TO_TYPE[region.role]
  const block = firstOfType(type)
  const onColor = overlay ? '#ffffff' : undefined
  const z = overlay ? 'relative z-10' : ''

  if (!block) {
    return (
      <button
        style={style}
        onClick={() => addBlock(type)}
        className={`flex items-center justify-center text-[10px] uppercase tracking-widest font-semibold text-gray-300 hover:text-blue-500 border border-dashed border-transparent hover:border-blue-300 rounded-sm transition-all duration-200 z-20 hover:z-[100] focus-within:z-[100] ${z}`}
      >
        + {region.role}
      </button>
    )
  }

  const tk: DesignTokens = onColor ? { ...tokens, primary: onColor, text: onColor, accent: '#e5e5e5' } : tokens

  const [editingTitleBlock, setEditingTitleBlock] = useState(false)
  const [draftTitle, setDraftTitle] = useState(block?.text || '')
  const [draftNumber, setDraftNumber] = useState(firstOfType('meta')?.fields?.[0]?.value || '01')
  const [draftYear, setDraftYear] = useState(firstOfType('meta')?.fields?.find(f => f.label.toLowerCase() === 'year')?.value || '')
  const [draftLoc, setDraftLoc] = useState(firstOfType('meta')?.fields?.find(f => f.label.toLowerCase() === 'location')?.value || '')
  const [draftTypo, setDraftTypo] = useState(firstOfType('meta')?.fields?.find(f => f.label.toLowerCase() === 'program' || f.label.toLowerCase() === 'typology')?.value || '')
  // Title text formatting overrides
  const [draftColor, setDraftColor] = useState(block?.color || '')
  const [draftFont, setDraftFont] = useState(block?.fontFamily || '')
  const [draftScale, setDraftScale] = useState(block?.fontSize || 1)

  const openEditTitleBlock = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDraftTitle(block?.text || '')
    setDraftNumber(firstOfType('meta')?.fields?.[0]?.value || '01')
    setDraftYear(firstOfType('meta')?.fields?.find(f => f.label.toLowerCase() === 'year')?.value || '2026')
    setDraftLoc(firstOfType('meta')?.fields?.find(f => f.label.toLowerCase() === 'location')?.value || 'Location')
    setDraftTypo(firstOfType('meta')?.fields?.find(f => f.label.toLowerCase() === 'program' || f.label.toLowerCase() === 'typology')?.value || 'Residential')
    setDraftColor(block?.color || '')
    setDraftFont(block?.fontFamily || '')
    setDraftScale(block?.fontSize || 1)
    setEditingTitleBlock(true)
  }

  const handleSaveTitleBlock = (scope: 'page' | 'project' | 'all') => {
    // Title text formatting (colour / font / size) always applies to this block.
    patchBlock(block.id, {
      color: draftColor || undefined,
      fontFamily: draftFont || undefined,
      fontSize: draftScale,
    })
    if (!onUpdateGlobalPages) {
      // fallback to current page only
      patchBlock(block.id, { text: draftTitle })
      const mBlock = firstOfType('meta')
      if (mBlock) {
        const nextFields = (mBlock.fields || []).map(f => {
          const l = f.label.toLowerCase()
          if (l === 'year') return { ...f, value: draftYear }
          if (l === 'location') return { ...f, value: draftLoc }
          if (l === 'program' || l === 'typology') return { ...f, value: draftTypo }
          return f
        })
        if (nextFields[0]) nextFields[0] = { ...nextFields[0], value: draftNumber }
        patchBlock(mBlock.id, { fields: nextFields })
      }
      setEditingTitleBlock(false)
      return
    }

    const currentIdx = (pageContext?.pageNumber ? pageContext.pageNumber - 1 : 0)
    const updater = (pgs: Page[]): Page[] => {
      let targets: number[] = [currentIdx]
      if (scope === 'project') {
        const indices = [currentIdx]
        for (let i = currentIdx - 1; i >= 0; i--) {
          if (pgs[i]?.type === 'project') indices.push(i)
          else break
        }
        for (let i = currentIdx + 1; i < pgs.length; i++) {
          if (pgs[i]?.type === 'project') indices.push(i)
          else break
        }
        targets = indices
      } else if (scope === 'all') {
        targets = pgs.map((_, i) => i)
      }

      return pgs.map((p, idx) => {
        if (targets.includes(idx)) {
          const nextBlocks = p.blocks.map(b => {
            if (b.type === 'title') {
              return { ...b, text: draftTitle }
            }
            if (b.type === 'meta') {
              const nextFields = (b.fields || []).map(f => {
                const label = f.label.toLowerCase()
                if (label === 'year') return { ...f, value: draftYear }
                if (label === 'location') return { ...f, value: draftLoc }
                if (label === 'program' || label === 'typology') return { ...f, value: draftTypo }
                return f
              })
              if (nextFields[0]) {
                nextFields[0] = { ...nextFields[0], value: draftNumber }
              }
              return { ...b, fields: nextFields }
            }
            return b
          })
          return { ...p, blocks: nextBlocks }
        }
        return p
      })
    }

    onUpdateGlobalPages(updater)
    setEditingTitleBlock(false)
  }

  const isFree = !!block?.freeform
  const finalStyle = isFree ? { width: '100%', height: '100%', position: 'relative' as any, minHeight: 0 } : style

  return (
    <FreeformWrapper block={block} patchBlock={patchBlock} zClass={z} tokens={tk}>
    <div 
      style={finalStyle} 
      className={`min-h-0 ${region.role === 'contents' || activeBlock?.id === block.id ? 'overflow-visible' : 'overflow-hidden'} p-3 transition-all duration-200 ${isFree ? '' : `z-20 ${activeBlock?.id === block.id ? 'z-[10000]' : 'hover:z-[100] focus-within:z-[100]'} hover:ring-1 hover:ring-blue-500/30`} group/block-container ${z}`}
      onPointerDown={e => {
        if (!isFree || block.freeform?.pinned) {
          e.stopPropagation()
        }
        const rect = e.currentTarget.getBoundingClientRect()
        // Account for CSS transform scale (e.g. from canvas zoom)
        const scaleX = rect.width / (e.currentTarget.offsetWidth || 1)
        const scaleY = rect.height / (e.currentTarget.offsetHeight || 1)
        setActiveBlock?.({ 
          id: block.id, 
          x: (e.clientX - rect.left) / scaleX, 
          y: (e.clientY - rect.top) / scaleY 
        })
      }}
    >
      {!['headshot', 'bio', 'education', 'skills', 'software', 'achievement', 'interest'].includes(region.role) && (
        <BlockHoverToolbar 
          block={block} tokens={tk} onChange={p => patchBlock(block.id, p)} 
          showTypography={!['render', 'plan', 'section', 'diagram', 'headshot'].includes(block.type)} 
          isActive={activeBlock?.id === block.id}
          pos={activeBlock?.id === block.id ? { x: activeBlock.x, y: activeBlock.y } : undefined}
        />
      )}
      {region.role === 'title' && (
        titleBlock
          ? <div className="group/tb relative cursor-pointer h-full" onClick={openEditTitleBlock}>
              <TitleBlockView
                style={titleBlock}
                p={toPalette(overlay ? { ...tokens, primary: '#fff', text: '#fff' } : tokens)}
                fonts={{ heading: tokens.headingFont, body: tokens.bodyFont }}
                content={{
                  number: firstOfType('meta')?.fields?.[0]?.value || '01',
                  title: block.text || 'Project Title',
                  subline: firstOfType('subtitle')?.text || '',
                }}
                override={{ color: block.color, fontFamily: block.fontFamily, scale: block.fontSize }}
              />
              <div className="absolute inset-0 bg-blue-500/5 hover:bg-blue-500/10 border border-transparent hover:border-blue-400 rounded-sm transition flex items-center justify-center print:hidden" data-html2canvas-ignore="true">
                <span className="bg-blue-600 text-white text-[9px] font-semibold uppercase px-2 py-0.5 rounded shadow opacity-0 group-hover/tb:opacity-100 transition-opacity duration-200">
                  ✏️ Edit Title Block
                </span>
              </div>
              
              {editingTitleBlock && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 text-white z-[10000] p-3 rounded-lg shadow-2xl border border-slate-700/80 text-[11px] space-y-2.5 cursor-default min-w-[240px]" onClick={e => e.stopPropagation()} data-html2canvas-ignore="true">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="font-bold text-blue-400 uppercase tracking-widest text-[9px]">Edit Title Block</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setEditingTitleBlock(false) }} className="text-slate-400 hover:text-white text-xs">✕</button>
                  </div>
                  
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[8px] text-slate-400 uppercase">Project Title</label>
                    <input 
                      type="text" 
                      value={draftTitle} 
                      onChange={e => setDraftTitle(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-white text-[10px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[8px] text-slate-400 uppercase">Number</label>
                      <input 
                        type="text" 
                        value={draftNumber} 
                        onChange={e => setDraftNumber(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-white text-[10px]"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[8px] text-slate-400 uppercase">Year</label>
                      <input 
                        type="text" 
                        value={draftYear} 
                        onChange={e => setDraftYear(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-white text-[10px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[8px] text-slate-400 uppercase">Typology</label>
                      <input 
                        type="text" 
                        value={draftTypo} 
                        onChange={e => setDraftTypo(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-white text-[10px]"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[8px] text-slate-400 uppercase">Location</label>
                      <input 
                        type="text" 
                        value={draftLoc} 
                        onChange={e => setDraftLoc(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-white text-[10px]"
                      />
                    </div>
                  </div>

                  {/* Text formatting: colour / font / size */}
                  <div className="pt-1.5 border-t border-slate-800 space-y-1.5">
                    <span className="text-[8px] text-slate-400 uppercase block">Text Style</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <label className="text-[8px] text-slate-400 uppercase">Colour</label>
                        <input type="color" value={draftColor || '#ffffff'} onChange={e => setDraftColor(e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent" />
                      </div>
                      <select value={draftFont} onChange={e => setDraftFont(e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-white text-[10px]">
                        <option value="">Template font</option>
                        <option value="Playfair Display">Playfair Display</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Oswald">Oswald</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Bebas Neue">Bebas Neue</option>
                        <option value="Inter">Inter</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[8px] text-slate-400 uppercase">Size</label>
                      <input type="range" min="0.5" max="2.5" step="0.1" value={draftScale}
                        onChange={e => setDraftScale(parseFloat(e.target.value))}
                        className="flex-1 h-1 accent-blue-500" />
                      <span className="text-[9px] font-mono w-8 text-right">{Math.round(draftScale * 100)}%</span>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-slate-800">
                    <span className="text-[8px] text-slate-400 uppercase block mb-1">Apply Updates To:</span>
                    <div className="flex gap-1">
                      <button 
                        type="button"
                        onClick={() => handleSaveTitleBlock('page')}
                        className="flex-1 py-1 bg-slate-850 hover:bg-slate-800 rounded text-[9px] text-center border border-slate-700 font-semibold"
                      >
                        This Page
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleSaveTitleBlock('project')}
                        className="flex-1 py-1 bg-blue-900/60 hover:bg-blue-800 rounded text-[9px] text-center border border-blue-800/80 font-semibold"
                      >
                        This Project
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleSaveTitleBlock('all')}
                        className="flex-1 py-1 bg-purple-900/60 hover:bg-purple-800 rounded text-[9px] text-center border border-purple-800/80 font-semibold"
                      >
                        Entire Portfolio
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          : <TitleBlock block={block} tokens={tk} onChange={p => patchBlock(block.id, p)} size={spec.category === 'Cover' ? 'xl' : 'lg'} onAiPolish={handleAiPolish} />
      )}
      {region.role === 'subtitle' && <SubtitleBlock block={block} tokens={tk} onChange={p => patchBlock(block.id, p)} onAiPolish={handleAiPolish} />}
      {region.role === 'text' && <DescriptionBlock block={block} tokens={tk} onChange={p => patchBlock(block.id, p)} onAiPolish={handleAiPolish} />}
      {region.role === 'legend' && <LegendBlock block={block} tokens={tokens} onChange={p => patchBlock(block.id, p)} />}
      {region.role === 'meta' && <MetaBlock block={block} tokens={tokens} onChange={p => patchBlock(block.id, p)} />}
      {region.role === 'headshot' && <ResumeHeadshot block={block} tokens={tokens} onChange={p => patchBlock(block.id, p)} onUpload={onUploadImage} />}
      {region.role === 'bio' && <ResumeBio block={block} tokens={tokens} onChange={p => patchBlock(block.id, p)} />}
      {region.role === 'education' && <ResumeEducation block={block} tokens={tokens} onChange={p => patchBlock(block.id, p)} />}
      {region.role === 'skills' && <ResumeSkills block={block} tokens={tokens} onChange={p => patchBlock(block.id, p)} label="Skills" />}
      {region.role === 'software' && <ResumeSkills block={block} tokens={tokens} onChange={p => patchBlock(block.id, p)} label="Software" />}
      {region.role === 'achievement' && <ResumeList block={block} tokens={tokens} onChange={p => patchBlock(block.id, p)} label="Achievements" icon="🏆" />}
      {region.role === 'interest' && <ResumeList block={block} tokens={tokens} onChange={p => patchBlock(block.id, p)} label="Interests" icon="✦" />}
      {region.role === 'contents' && (
        <div className="w-full h-full flex flex-col justify-between">
          <div className="flex-1 min-h-0">
            <ContentsBlock block={block} tokens={tokens} onChange={p => patchBlock(block.id, p)} pages={pages || []} layoutId={spec.id} onUploadImage={onUploadImage} />
          </div>
          {onUpdateGlobalPages && (
            <button
              onClick={() => {
                onUpdateGlobalPages(currentPages => {
                  const newPage = {
                    id: `p-${Date.now()}`,
                    type: 'project' as const,
                    layoutId: 'twoThirdsStack.titleMetaInline',
                    blocks: [
                      { id: `b-${Date.now()}-1`, type: 'title' as const, text: 'New Project' },
                      { id: `b-${Date.now()}-2`, type: 'meta' as const, fields: [{ label: 'Year', value: '2026' }] }
                    ]
                  }
                  return [...currentPages, newPage]
                })
              }}
              className="mt-2 text-[10px] font-semibold uppercase tracking-wider self-start cursor-pointer transition hover:opacity-80"
              style={{ color: tokens.accent }}
            >
              + Add Content Item
            </button>
          )}
        </div>
      )}
    </div>
    </FreeformWrapper>
  )
}

/* --------------------------- Layout thumbnail ---------------------------- */
/** A tiny visual preview of a layout spec, for the layout picker. */
export function LayoutThumb({ spec, tokens, active }: { spec: LayoutSpec; tokens?: DesignTokens; active?: boolean }) {
  const accent = tokens?.accent || '#3b82f6'
  const bg = tokens?.background || '#ffffff'
  return (
    <div
      className="relative w-full rounded-sm overflow-hidden border"
      style={{ aspectRatio: '210 / 297', background: bg, borderColor: active ? accent : 'rgba(0,0,0,0.12)' }}
    >
      <div className="absolute inset-0 grid p-1" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gridTemplateRows: 'repeat(12, 1fr)', gap: 2 }}>
        {spec.regions.map((r, i) => {
          const st: React.CSSProperties = { ...gridStyle(r) }
          switch (r.role) {
            case 'image': st.background = 'rgba(0,0,0,0.14)'; break
            case 'title': st.background = accent; break
            case 'subtitle': st.background = 'rgba(0,0,0,0.30)'; break
            case 'text': st.background = 'rgba(0,0,0,0.10)'; break
            case 'legend': st.background = 'rgba(0,0,0,0.18)'; break
            case 'meta': st.background = 'rgba(0,0,0,0.12)'; break
            case 'headshot': st.background = 'rgba(0,0,0,0.22)'; st.borderRadius = 2; break
            case 'bio': st.background = 'rgba(0,0,0,0.08)'; break
            case 'education': st.background = `${accent}55`; break
            case 'skills': st.background = `${accent}33`; break
            case 'software': st.background = `${accent}44`; break
            case 'achievement': st.background = 'rgba(234,179,8,0.35)'; break
            case 'interest': st.background = 'rgba(34,197,94,0.25)'; break
          }
          return <div key={i} style={st} className="rounded-[1px]" />
        })}
      </div>
    </div>
  )
}
