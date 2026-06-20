'use client'

import { useRef, useState } from 'react'
import type { Block, Page, DesignTokens, BlockType } from './types'
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
}

const ROLE_TO_TYPE: Record<Exclude<RegionRole, 'image'>, BlockType> = {
  title: 'title', subtitle: 'subtitle', text: 'description', legend: 'legend', meta: 'meta', contents: 'contents'
}

export default function PageComposer({ page, tokens, onChange, onUploadImage, backgrounds, masterElements, pageContext, grid, onFreeChange, editableFree, onApplyScope, onFreeSelectionChange, pages, onUpdateGlobalPages, overflowVisible, onUpdateMasterElement, pageSize }: Props) {
  const spec = getSpec(page.layoutId)
  const images = allImages(page.blocks)
  const titleBlock = page.titleBlockId ? TITLE_BLOCKS.find(b => b.id === page.titleBlockId) : undefined

  const patchBlock = (id: string, patch: Partial<Block>) =>
    onChange({ ...page, blocks: page.blocks.map(b => b.id === id ? { ...b, ...patch } : b) })

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
    </div>
  )
}

function gridStyle(r: Region): React.CSSProperties {
  return { gridColumn: `${r.c0} / span ${r.cs}`, gridRow: `${r.r0} / span ${r.rs}`, minHeight: 0, minWidth: 0, position: 'relative', zIndex: 20 }
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

function RegionView({
  region, spec, tokens, overlay, images, patchBlock, addBlock, firstOfType, onUploadImage, titleBlock, onInsertImage, pages, pageContext, onUpdateGlobalPages, masterElements,
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
        <div style={style} className={overlay ? 'z-0' : ''}>
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
        className={`flex items-center justify-center text-[10px] uppercase tracking-widest font-semibold text-gray-300 hover:text-blue-500 border border-dashed border-transparent hover:border-blue-300 rounded-sm transition ${z}`}
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

  return (
    <div style={style} className={`min-h-0 overflow-hidden ${z}`}>
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
              <div className="absolute inset-0 bg-blue-500/5 hover:bg-blue-500/10 border border-transparent hover:border-blue-400 rounded-sm transition flex items-center justify-center">
                <span className="bg-blue-600 text-white text-[9px] font-semibold uppercase px-2 py-0.5 rounded shadow opacity-0 group-hover/tb:opacity-100 transition-opacity duration-200">
                  ✏️ Edit Title Block
                </span>
              </div>
              
              {editingTitleBlock && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 text-white z-50 p-3 rounded-lg shadow-2xl border border-slate-700/80 text-[11px] space-y-2.5 cursor-default min-w-[240px]" onClick={e => e.stopPropagation()}>
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
      {region.role === 'contents' && (
        <div className="w-full h-full flex flex-col justify-between">
          <div className="flex-1 min-h-0">
            <ContentsBlock block={block} tokens={tokens} onChange={p => patchBlock(block.id, p)} pages={pages || []} layoutId={spec.id} />
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

      {/* Editor CSS Watermark */}
      <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden opacity-10">
        <div className="text-[120px] font-black text-black uppercase tracking-[0.5em] -rotate-[35deg] select-none whitespace-nowrap drop-shadow-xl" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          COSMOFOLIO
        </div>
      </div>
    </div>
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
          }
          return <div key={i} style={st} className="rounded-[1px]" />
        })}
      </div>
    </div>
  )
}
