'use client'

import React from 'react'
import type { Block, DesignTokens } from './types'

export function hexToRgba(hex: string, opacity: number) {
  const h = hex.replace('#', '')
  if (h.length !== 6) return hex
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export interface TocStyleParams {
  variant: 'vertical-stripes' | 'minimal-accent' | 'modern-cutout' | 'handdrawn-timeline' | 'generative' | 'magazine' | 'timeline' | 'grid' | 'luxury' | 'research' | 'parametric' | 'competition' | 'academic' | 'minimal' | 'el-croquis' | 'swiss-grid' | 'asymmetric-timeline'
  // Generative properties (to enable 100+ iterations)
  structure?: 'list' | 'grid' | 'zigzag' | 'masonry' | 'scroll' | 'mosaic' | 'bento-box' | 'carousel' | 'filmstrip'
  imageShape?: 'pill' | 'square' | 'tall' | 'circle' | 'none' | 'arch' | 'diamond' | 'hexagon' | 'fluid'
  numbering?: 'outline' | 'asterisk' | 'serif' | 'minimal' | 'circled' | 'roman-numerals' | 'oversized-watermark' | 'minimal-slash' | 'drawing-label'
  lines?: 'dotted' | 'solid' | 'none'
  // Local overlay properties
  overlayEnabled?: boolean
  overlayColor?: string
  overlayOpacity?: number
  overlayPadding?: number
  // Architectural details
  showDraftingGrid?: boolean
  showNorthArrow?: boolean
  showScaleBar?: boolean
  scaleText?: string
  customNumberingFormat?: 'standard' | 'drawing-label'
  // Typography overrides
  textColor?: string
  titleColor?: string
  fontSizeMultiplier?: number
  customThumbnails?: Record<string, string>
}

interface ProjectIndexItem {
  num: string
  title: string
  year: string
  typology: string
  location: string
  thumbnail: string
  pageNumber: string
  pageIndex: number
}

export function TableOfContentsRenderer({
  block, tokens: baseTokens, pages, onChange, layoutId, onUploadImage
}: {
  block: Block
  tokens: DesignTokens
  pages: any[]
  onChange: (patch: Partial<Block>) => void
  layoutId?: string
  onUploadImage?: (file: File) => Promise<string>
}) {
  const [activeTab, setActiveTab] = React.useState<string | null>(null)
  const [isEditorOpen, setIsEditorOpen] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const projectItems: ProjectIndexItem[] = []
  let projCount = 0
  
  if (Array.isArray(pages)) {
    let lastProjectTitle = ''
    pages.forEach((p, idx) => {
      if (p.type === 'project') {
        const titleBlock = p.blocks?.find((b: any) => b.type === 'title')
        if (titleBlock && titleBlock.text) {
          const currentTitle = titleBlock.text.trim()
          // Only add to TOC if it's a new project title
          if (currentTitle !== lastProjectTitle) {
            projCount++
            lastProjectTitle = currentTitle
            const metaBlock = p.blocks?.find((b: any) => b.type === 'meta')
            const fields = metaBlock?.fields || []
            
            const year = fields.find((f: any) => f.label.toLowerCase() === 'year')?.value || '2026'
            const location = fields.find((f: any) => f.label.toLowerCase() === 'location')?.value || 'Location'
            const typology = fields.find((f: any) => f.label.toLowerCase() === 'program' || f.label.toLowerCase() === 'typology')?.value || 'Residential'
            
            const imgBlock = p.blocks?.find((b: any) => ['render', 'plan', 'section', 'diagram'].includes(b.type) && b.imageUrl)
            const thumbnail = block.tocStyle?.customThumbnails?.[String(idx)] || imgBlock?.imageUrl || ''
            
            projectItems.push({
              num: String(projCount).padStart(2, '0'),
              title: currentTitle,
              year,
              typology,
              location,
              thumbnail,
              pageNumber: String(idx + 1).padStart(2, '0'),
              pageIndex: idx
            })
          }
        }
      }
    })
  }

  // Fallback for fresh templates
  


  const items = projectItems.length > 0 ? projectItems : [
    { num: '01', title: 'Cultural Center', year: '2025', typology: 'Cultural', location: 'Tokyo, JP', thumbnail: block.tocStyle?.customThumbnails?.['0'] || '', pageNumber: '06', pageIndex: 0 },
    { num: '02', title: 'Urban Housing', year: '2026', typology: 'Residential', location: 'London, UK', thumbnail: block.tocStyle?.customThumbnails?.['1'] || '', pageNumber: '18', pageIndex: 1 },
    { num: '03', title: 'Computational Pavillion', year: '2026', typology: 'Experimental', location: 'Zurich, CH', thumbnail: block.tocStyle?.customThumbnails?.['2'] || '', pageNumber: '24', pageIndex: 2 },
    { num: '04', title: 'Mixed-Use Highrise', year: '2026', typology: 'Commercial', location: 'New York, US', thumbnail: block.tocStyle?.customThumbnails?.['3'] || '', pageNumber: '32', pageIndex: 3 },
    { num: '05', title: 'Parametric Bridge', year: '2027', typology: 'Infrastructure', location: 'Dubai, UAE', thumbnail: block.tocStyle?.customThumbnails?.['4'] || '', pageNumber: '40', pageIndex: 4 }
  ]

  // Map legacy layoutId to initial style if no tocStyle is provided
  const getDefaultStyle = (lid: string = ''): TocStyleParams => {
    const l = lid.toLowerCase()
    if (l.includes('magazine')) return { variant: 'vertical-stripes' }
    if (l.includes('timeline')) return { variant: 'handdrawn-timeline' }
    if (l.includes('grid') || l.includes('thumb')) 
    if (l.includes('magazine')) return { variant: 'magazine' }
    if (l.includes('timeline')) return { variant: 'timeline' }
    if (l.includes('grid') || l.includes('thumb')) return { variant: 'grid' }
    if (l.includes('luxury') || l.includes('editorial')) return { variant: 'luxury' }
    if (l.includes('research')) return { variant: 'research' }
    if (l.includes('parametric')) return { variant: 'parametric' }
    if (l.includes('competition')) return { variant: 'competition' }
    if (l.includes('academic') || l.includes('thesis')) return { variant: 'academic' }
    if (l.includes('minimal')) return { variant: 'minimal' }
    
    // Auto-match complex layouts to Generative combinations heavily featuring images
    if (l.includes('arch-heavy')) return { variant: 'generative', structure: 'mosaic', imageShape: 'square', numbering: 'oversized-watermark', lines: 'none' }
    if (l.includes('cover')) return { variant: 'generative', structure: 'bento-box', imageShape: 'arch', numbering: 'minimal-slash', lines: 'solid' }
    if (l.includes('about')) return { variant: 'generative', structure: 'filmstrip', imageShape: 'fluid', numbering: 'serif', lines: 'dotted' }
    if (l.includes('project')) return { variant: 'generative', structure: 'masonry', imageShape: 'square', numbering: 'outline', lines: 'none' }
    if (l.includes('spread')) return { variant: 'generative', structure: 'grid', imageShape: 'tall', numbering: 'minimal', lines: 'solid' }
    
    // Default fallback to a rich generative style
    return { variant: 'generative', structure: 'bento-box', imageShape: 'arch', numbering: 'roman-numerals', lines: 'solid' }

    if (l.includes('luxury') || l.includes('editorial')) return { variant: 'modern-cutout' }
    
    // Default generative
    return {
      variant: 'generative',
      structure: 'list',
      imageShape: 'square',
      numbering: 'minimal',
      lines: 'solid'
    }
  }

  const styleConfig = block.tocStyle || getDefaultStyle(layoutId)
  const { variant, structure, imageShape, numbering, lines, showDraftingGrid, showNorthArrow, showScaleBar, scaleText, customNumberingFormat } = styleConfig

  const tokens = {
    ...baseTokens,
    primary: styleConfig.titleColor || baseTokens.primary,
    text: styleConfig.textColor || baseTokens.text
  }

  const updateStyle = (patch: Partial<TocStyleParams>) => {
    onChange({
      tocStyle: {
        ...styleConfig,
        ...patch
      }
    })
  }
  const overlayEnabled = styleConfig.overlayEnabled !== false
  const overlayBg = overlayEnabled ? hexToRgba(styleConfig.overlayColor || '#ffffff', styleConfig.overlayOpacity ?? 0.85) : 'transparent'
  const overlayPad = overlayEnabled ? `${styleConfig.overlayPadding ?? 20}px` : '0px'
  const baseOverlayCls = overlayEnabled ? 'backdrop-blur-md rounded-xl shadow-lg' : ''


  // Generate a random style
  const handleRandomize = () => {
    const variants = ['vertical-stripes', 'minimal-accent', 'modern-cutout', 'handdrawn-timeline', 'generative', 'magazine', 'timeline', 'grid', 'luxury', 'research', 'parametric', 'competition', 'academic', 'minimal'] as const
    const structures = ['list', 'grid', 'zigzag', 'masonry', 'scroll', 'mosaic', 'bento-box', 'carousel', 'filmstrip'] as const
    const shapes = ['pill', 'square', 'tall', 'circle', 'arch', 'diamond', 'hexagon', 'fluid'] as const
    const numberings = ['outline', 'asterisk', 'serif', 'minimal', 'circled', 'roman-numerals', 'oversized-watermark', 'minimal-slash'] as const
    const lineStyles = ['dotted', 'solid', 'none'] as const
    
    const nextVariant = variants[Math.floor(Math.random() * variants.length)]
    
    onChange({
      tocStyle: {
        variant: nextVariant,
        structure: structures[Math.floor(Math.random() * structures.length)],
        imageShape: shapes[Math.floor(Math.random() * shapes.length)],
        numbering: numberings[Math.floor(Math.random() * numberings.length)],
        lines: lineStyles[Math.floor(Math.random() * lineStyles.length)]
      }
    })
  }

  const renderGenerative = () => {
    const { structure, imageShape, numbering, lines } = styleConfig

    const getShapeClasses = (shape: string) => {
      switch (shape) {
        case 'pill': return 'rounded-full aspect-[1/2]'
        case 'circle': return 'rounded-full aspect-square'
        case 'tall': return 'rounded-md aspect-[3/4]'
        case 'square': return 'rounded-md aspect-square'
        case 'arch': return 'rounded-t-full rounded-b-md aspect-[2/3]'
        case 'diamond': return 'rounded-md rotate-45 scale-75 aspect-square'
        case 'hexagon': return 'rounded-xl aspect-square' // simplified hex
        case 'fluid': return 'rounded-[40%_60%_70%_30%/40%_50%_60%_50%] aspect-square'
        case 'none': return 'hidden'
        default: return 'rounded-md aspect-square'
      }
    }

    const getNumberingUI = (num: string) => {
      const displayNum = customNumberingFormat === 'drawing-label' ? `A-${num}` : num
      switch (numbering) {
        case 'outline': return <span className="text-4xl font-bold text-transparent" style={{ WebkitTextStroke: `1px ${tokens.text}` }}>{displayNum}</span>
        case 'asterisk': return <span className="text-lg font-bold" style={{ color: tokens.accent }}>*{displayNum}</span>
        case 'serif': return <span className="text-2xl font-serif italic text-gray-400">{displayNum}.</span>
        case 'circled': return <span className="w-8 h-8 rounded-full border border-current flex items-center justify-center text-xs font-bold">{displayNum}</span>
        case 'roman-numerals': 
          const romanMap: Record<string, string> = { '01': 'I', '02': 'II', '03': 'III', '04': 'IV', '05': 'V', '06': 'VI', '07': 'VII', '08': 'VIII', '09': 'IX', '10': 'X', '11': 'XI', '12': 'XII' }
          return <span className="font-serif italic text-lg opacity-70">{romanMap[num] || displayNum}</span>
        case 'oversized-watermark': return <span className="absolute -left-4 -top-6 text-[80px] font-black opacity-5 pointer-events-none z-0 tracking-tighter">{displayNum}</span>
        case 'minimal-slash': return <span className="text-xs font-mono opacity-50">/{displayNum}</span>
        case 'drawing-label': return <span className="text-xs font-mono font-bold tracking-widest" style={{ color: tokens.accent }}>A-{num}</span>
        default: return <span className="text-sm font-bold opacity-60">{displayNum}</span>
      }
    }

    const dynGap = Math.max(8, 32 - items.length * 1.5)
    const dynGapSmall = Math.max(4, 16 - items.length * 1)

    const gridClass = structure === 'grid' ? 'grid grid-cols-2 md:grid-cols-3' 
                    : structure === 'masonry' ? 'columns-2 md:columns-3'
                    : structure === 'mosaic' ? 'grid grid-cols-4 [&>*:nth-child(3n+1)]:col-span-2 [&>*:nth-child(3n+1)]:row-span-2'
                    : structure === 'bento-box' ? 'grid grid-cols-3 auto-rows-[minmax(0,1fr)] [&>*:nth-child(4n+1)]:col-span-2'
                    : structure === 'filmstrip' ? 'flex flex-row overflow-x-auto pb-4 snap-x w-full max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'
                    : structure === 'carousel' ? 'flex flex-row overflow-x-auto pb-8 snap-x w-full max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'
                    : 'flex flex-col'

    const itemClass = structure === 'zigzag' ? 'flex items-center even:flex-row-reverse min-h-[32px]' 
                    : ['filmstrip', 'carousel'].includes(structure || '') ? 'flex-shrink-0 w-64 md:w-80 flex flex-col snap-start relative min-h-[32px]'
                    : ['bento-box', 'mosaic'].includes(structure || '') ? 'flex flex-col bg-white/40 p-3 rounded-xl border border-white/50 backdrop-blur-sm relative overflow-hidden min-h-[32px]'
                    : 'flex flex-col relative min-h-[32px]'

    const lineClass = lines === 'dotted' ? 'border-b border-dashed border-gray-300' 
                    : lines === 'solid' ? 'border-b border-solid border-gray-200' 
                    : ''

    return (
      <div className={`w-full relative h-full flex flex-col pt-8 px-8 group overflow-hidden ${baseOverlayCls}`} style={{ backgroundColor: overlayBg, padding: overlayPad }}>
        <div className="flex justify-between items-end mb-4 md:mb-8 shrink-0">
          <h2 className="text-2xl md:text-4xl font-bold uppercase tracking-widest" style={{ color: tokens.primary, fontFamily: tokens.headingFont }}>
            {block.label || 'Contents'}
          </h2>
        </div>
        
        <div className={`flex-1 min-h-0 overflow-hidden ${gridClass}`} style={{ gap: dynGap + 'px' }}>
          {items.map((it, idx) => (
            <div key={idx} className={`${itemClass} ${lineClass} pb-2 mb-2 break-inside-avoid`} style={{ gap: dynGapSmall + 'px' }}>
              {imageShape !== 'none' && (
                <div className={`${getShapeClasses(imageShape || 'square')} overflow-hidden bg-gray-100 flex-shrink-0 w-full md:w-32 relative ${['diamond'].includes(imageShape||'') ? 'origin-center' : ''} ${['bento-box', 'mosaic', 'carousel', 'filmstrip'].includes(structure||'') ? '!w-full flex-1 basis-[80px] md:basis-[120px] shrink min-h-[40px]' : ''} group/img`}>
                  <div className={`absolute inset-0 ${['diamond'].includes(imageShape||'') ? '-rotate-45 scale-150' : ''}`}>
                    {it.thumbnail ? (
                      <img src={it.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400 font-mono text-xs opacity-50">IMG_{it.num}</div>
                    )}
                  </div>
                  {onUploadImage && (
                    <div 
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex flex-col items-center justify-center text-white text-[10px] font-semibold backdrop-blur-sm cursor-pointer z-10 print:hidden"
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'image/*'
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (!file) return
                          const url = await onUploadImage(file)
                          if (url) {
                            onChange({
                              tocStyle: {
                                ...styleConfig,
                                customThumbnails: {
                                  ...(styleConfig.customThumbnails || {}),
                                  [String(it.pageIndex)]: url
                                }
                              }
                            })
                          }
                        }
                        input.click()
                      }}
                    >
                      <span className="bg-black/50 px-2 py-1 rounded">📷 Change</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex-1 flex flex-col justify-center relative z-10">
                <div className="flex items-center justify-between w-full mb-2">
                  {getNumberingUI(it.num)}
                  <span className="font-mono text-sm tracking-widest" style={{ color: tokens.accent }}>{it.pageNumber}</span>
                </div>
                <h4 className="text-lg font-semibold uppercase tracking-wide" style={{ color: tokens.text }}>{it.title}</h4>
                <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">{it.typology} // {it.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderVerticalStripes = () => (
    <div className="w-full h-full flex gap-2 pt-4 px-4 pb-12 overflow-hidden relative group">
      
      {items.map((it, idx) => (
        <div key={idx} className="flex-1 h-full relative overflow-hidden flex flex-col">
          <div className="w-full flex-1 bg-gray-200 relative overflow-hidden">
            {it.thumbnail && <img src={it.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[120px] lg:text-[180px] font-bold text-transparent leading-none z-10" 
                 style={{ WebkitTextStroke: `2px ${tokens.background}`, textShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
              {it.num}
            </div>
          </div>
          <div className="mt-6 text-center px-2 h-20">
            <h4 className="font-bold text-sm uppercase tracking-wider" style={{ color: tokens.text }}>{it.title}</h4>
            <p className="text-[9px] uppercase tracking-widest text-gray-500 mt-1">{it.typology}</p>
          </div>
        </div>
      ))}
    </div>
  )

  const renderMinimalAccent = () => (
    <div className="w-full h-full flex justify-center items-center py-20 relative group">
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-16 gap-y-24 max-w-5xl mx-auto px-8 w-full">
        {items.map((it, idx) => (
          <div key={idx} className="relative">
            <div className="absolute -inset-4 bg-red-600 z-0 transform translate-x-2 -translate-y-2" />
            <div className="relative z-10 w-full aspect-square bg-white shadow-xl overflow-hidden grayscale">
              {it.thumbnail && <img src={it.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            </div>
            
            <div className="absolute -left-8 -top-8 z-20 flex gap-1">
              <span className="text-red-600 font-bold text-xl">*</span>
              <span className="text-3xl font-bold" style={{ color: tokens.text }}>{it.num}</span>
            </div>
            
            <div className="mt-8 relative z-20 bg-white/80 backdrop-blur p-2 -mx-2">
              <h4 className="font-mono text-xs font-bold uppercase">{it.title}</h4>
              <p className="text-[10px] text-gray-500 mt-1">{it.typology}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{it.year}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderModernCutout = () => (
    <div className="w-full h-full p-8 relative flex flex-col group overflow-hidden bg-gray-50">
      
      <h2 className="text-xl font-bold uppercase tracking-[0.3em] mb-12 text-blue-600 pl-4">Table of Contents</h2>
      <div className="flex-1 flex gap-4 w-full h-full justify-center">
        {items.map((it, idx) => (
          <div key={idx} className="flex-1 relative rounded-t-[100px] rounded-b-[100px] bg-gradient-to-b from-blue-100 to-transparent p-2 border border-blue-200">
            <div className="w-full h-full rounded-t-[100px] rounded-b-[100px] overflow-hidden bg-gray-200 relative mix-blend-multiply grayscale">
               {it.thumbnail && <img src={it.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            </div>
            <div className="absolute bottom-16 -left-4 flex items-end">
              <span className="text-[80px] font-bold text-blue-600 leading-none" style={{ textShadow: '2px 2px 0px white' }}>{it.num}</span>
              <div className="ml-2 bg-white/90 backdrop-blur px-2 py-1 rounded shadow-sm whitespace-nowrap">
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">{it.title}</span>
                <span className="text-[8px] text-blue-500 block">{it.pageNumber}-{parseInt(it.pageNumber)+5}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderHanddrawnTimeline = () => (
    <div className="w-full h-full flex items-center px-12 relative group bg-[#fdfbf7]">
      
      
      {/* Hand drawn thick black line */}
      <div className="absolute top-1/2 left-12 right-12 h-2 bg-black rounded-[50%] transform -translate-y-1/2" 
           style={{ filter: 'url(#roughpaper)' }} />
           
      <div className="relative z-10 w-full flex justify-around">
        {items.map((it, idx) => {
          const isTop = idx % 2 === 0
          return (
            <div key={idx} className={`flex flex-col items-center ${isTop ? 'mb-40' : 'mt-40'}`}>
              <div className="flex gap-2 items-baseline mb-4">
                <span className="font-mono text-sm">{it.num}.</span>
                <div className="w-16 h-16 border-[3px] border-black rounded-sm flex items-center justify-center p-1 bg-white transform rotate-3 hover:rotate-0 transition-transform shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  {it.thumbnail ? (
                    <img src={it.thumbnail} alt="" className="w-full h-full object-cover grayscale contrast-150 opacity-80" />
                  ) : (
                    <div className="w-full h-full bg-black/5" />
                  )}
                </div>
              </div>
              
              <div className="text-center px-2 py-1 transform -rotate-1">
                <p className="text-[10px] font-bold font-mono uppercase text-gray-600 mb-1">{it.typology}</p>
                <h4 className="text-4xl font-black tracking-tighter" style={{ fontFamily: 'Impact, sans-serif' }}>{it.num}</h4>
              </div>
            </div>
          )
        })}
      </div>
      
      <svg width="0" height="0" className="hidden">
        <filter id="roughpaper">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
    </div>
  )

  const renderMagazine = () => {
    const featured = items[0]
    return (
      <div className={`w-full flex flex-col h-full overflow-hidden min-h-0 ${baseOverlayCls} ${overlayEnabled ? 'border border-black/5' : ''}`} style={{ fontFamily: tokens.bodyFont, backgroundColor: overlayBg, padding: overlayPad }}>
        <h3 className="text-xl font-bold uppercase tracking-widest mb-4 border-b pb-2 shrink-0" style={{ color: tokens.primary, fontFamily: tokens.headingFont }}>
          {block.label || 'Contents'}
        </h3>
        <div className="grid grid-cols-12 gap-4 flex-1 overflow-hidden shrink min-h-0">
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
          <div className="col-span-7 flex flex-col flex-1 overflow-hidden shrink min-h-0" style={{ gap: Math.max(0, 10 - items.length * 0.5) + 'px' }}>
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between border-b pb-1.5 border-black/5 text-xs shrink min-h-0">
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

  const renderTimeline = () => {
    return (
      <div className={`w-full flex flex-col h-full overflow-hidden min-h-0 ${baseOverlayCls} ${overlayEnabled ? 'border border-black/5' : ''}`} style={{ fontFamily: tokens.bodyFont, backgroundColor: overlayBg, padding: overlayPad }}>
        <h3 className="text-xl font-bold uppercase tracking-widest mb-4 border-b pb-2 shrink-0" style={{ color: tokens.primary, fontFamily: tokens.headingFont }}>
          {block.label || 'Timeline'}
        </h3>
        <div className="relative border-l border-slate-350 pl-4 ml-2 flex flex-col flex-1 overflow-hidden shrink min-h-0" style={{ gap: Math.max(0, 16 - items.length * 0.5) + 'px' }}>
          {items.map((it, idx) => (
            <div key={idx} className="relative text-xs shrink min-h-0">
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

  const renderGrid = () => {
    return (
      <div className={`w-full flex flex-col h-full overflow-hidden min-h-0 ${baseOverlayCls} ${overlayEnabled ? 'border border-black/5' : ''}`} style={{ fontFamily: tokens.bodyFont, backgroundColor: overlayBg, padding: overlayPad }}>
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-3" style={{ color: tokens.primary, fontFamily: tokens.headingFont }}>
          {block.label || 'Project Index'}
        </h3>
        <div className="grid grid-cols-2 flex-1 overflow-hidden shrink min-h-0" style={{ gap: Math.max(2, 8 - items.length * 0.5) + 'px' }}>
          {items.map((it, idx) => (
            <div key={idx} className="border border-black/5 rounded p-1.5 bg-black/[0.01] flex items-center gap-2 shrink min-h-0">
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

  const renderLuxury = () => {
    return (
      <div className={`w-full flex flex-col h-full overflow-hidden min-h-0 ${baseOverlayCls} ${overlayEnabled ? 'border border-yellow-900/10' : ''}`} style={{ fontFamily: 'Playfair Display, Lora, Georgia, serif', backgroundColor: overlayBg, padding: overlayPad }}>
        <h3 className="text-2xl font-normal tracking-[0.15em] text-center mb-5 italic" style={{ color: tokens.primary }}>
          {block.label || 'Portfolio Index'}
        </h3>
        <div className="flex flex-col flex-1 overflow-hidden shrink min-h-0" style={{ gap: Math.max(0, 12 - items.length * 0.5) + 'px' }}>
          {items.map((it, idx) => (
            <div key={idx} className="flex justify-between items-baseline border-b border-yellow-800/10 pb-1.5 text-xs shrink min-h-0">
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

  const renderResearch = () => {
    return (
      <div className={`w-full flex flex-col h-full overflow-hidden min-h-0 font-mono text-[9px] text-slate-600 ${baseOverlayCls} ${overlayEnabled ? 'border border-slate-200' : ''}`} style={{ backgroundColor: overlayBg, padding: overlayPad }}>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-3 border-b border-dashed pb-1.5" style={{ color: tokens.primary }}>
          // INDEX_SPEC_REF_01
        </h3>
        <div className="flex-1 overflow-hidden shrink min-h-0 relative"><table className="w-full border-collapse absolute inset-0">
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
        </table></div>
      </div>
    )
  }

  const renderParametric = () => {
    return (
      <div className={`w-full flex flex-col h-full overflow-hidden min-h-0 ${baseOverlayCls} ${overlayEnabled ? 'border border-slate-200' : ''}`} style={{ fontFamily: tokens.bodyFont, backgroundColor: overlayBg, padding: overlayPad }}>
        <h3 className="text-lg font-black uppercase tracking-tighter mb-4 italic" style={{ color: tokens.primary, fontFamily: tokens.headingFont }}>
          PROJECTS.MATRIX
        </h3>
        <div className="flex flex-col flex-1 overflow-hidden shrink min-h-0" style={{ gap: Math.max(0, 10 - items.length * 0.5) + 'px' }}>
          {items.map((it, idx) => (
            <div key={idx} className="group flex items-stretch border-l-4 border-slate-900 bg-slate-50 p-2 text-xs transition hover:bg-slate-100 shrink min-h-0">
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

  const renderCompetition = () => {
    return (
      <div className={`w-full flex flex-col h-full overflow-hidden min-h-0 ${baseOverlayCls} ${overlayEnabled ? 'border border-slate-200' : ''}`} style={{ fontFamily: tokens.bodyFont, backgroundColor: overlayBg, padding: overlayPad }}>
        <h3 className="text-xl font-bold uppercase tracking-tight mb-4" style={{ color: tokens.primary, fontFamily: tokens.headingFont }}>
          INDEX / WORK_SAMPLES
        </h3>
        <div className="grid grid-cols-2 flex-1 overflow-hidden shrink min-h-0" style={{ gap: Math.max(2, 12 - items.length * 0.5) + 'px' }}>
          {items.map((it, idx) => (
            <div key={idx} className="border-t-2 border-slate-900 pt-2 flex flex-col justify-between text-xs shrink min-h-0 min-h-[40px]">
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

  const renderAcademic = () => {
    return (
      <div className={`w-full flex flex-col h-full overflow-hidden min-h-0 ${baseOverlayCls} ${overlayEnabled ? 'border border-slate-200' : ''}`} style={{ fontFamily: 'Georgia, serif', backgroundColor: overlayBg, padding: overlayPad }}>
        <h3 className="text-lg font-serif italic mb-4 border-b border-slate-300 pb-2 text-slate-700 shrink-0">
          Table of Contents
        </h3>
        <div className="flex flex-col flex-1 overflow-hidden shrink min-h-0 text-xs" style={{ gap: Math.max(0, 12 - items.length * 0.5) + 'px' }}>
          {items.map((it, idx) => (
            <div key={idx} className="flex justify-between items-baseline gap-4 shrink min-h-0">
              <div className="flex items-baseline gap-2 flex-1 min-w-0 shrink min-h-0">
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

  const getDisplayNumber = (num: string) => {
    if (customNumberingFormat === 'drawing-label') {
      return `A-${num}`
    }
    return num
  }

  const renderDraftingAccents = () => {
    return (
      <>
        {/* Drafting Grid Overlay */}
        {showDraftingGrid && (
          <div className="absolute inset-0 pointer-events-none opacity-[0.04] z-0">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="drafting-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="black" strokeWidth="1" />
                  <circle cx="0" cy="0" r="1.5" fill="black" />
                  <circle cx="40" cy="0" r="1.5" fill="black" />
                  <circle cx="0" cy="40" r="1.5" fill="black" />
                  <circle cx="40" cy="40" r="1.5" fill="black" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#drafting-grid)" />
            </svg>
          </div>
        )}
        
        {/* North Arrow Stamp */}
        {showNorthArrow && (
          <div className="absolute top-4 right-4 pointer-events-none opacity-20 z-10 w-10 h-10 select-none">
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className="w-full h-full text-black">
              <circle cx="50" cy="50" r="40" strokeWidth="2" strokeDasharray="3 3" />
              <circle cx="50" cy="50" r="30" strokeWidth="1" />
              <path d="M50 15 L50 85 M15 50 L85 50" strokeWidth="1" />
              <path d="M50 15 L58 40 L50 33 L42 40 Z" fill="currentColor" />
              <text x="46" y="10" fontSize="12" fontWeight="bold" fill="currentColor" fontFamily="monospace">N</text>
            </svg>
          </div>
        )}
        
        {/* Scale Bar */}
        {showScaleBar && (
          <div className="absolute bottom-3 right-6 pointer-events-none opacity-30 z-10 flex items-center gap-2 select-none text-[8px] font-mono text-black font-semibold">
            <span className="uppercase tracking-widest">{scaleText || 'SCALE 1 : 500'}</span>
            <svg width="60" height="6" viewBox="0 0 60 6" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="0" y="0" width="60" height="6" fill="none" />
              <rect x="0" y="0" width="15" height="6" fill="currentColor" />
              <rect x="30" y="0" width="15" height="6" fill="currentColor" />
            </svg>
          </div>
        )}
      </>
    )
  }

  const renderElCroquis = () => {
    const featuredItem = items[0]
    return (
      <div className={`w-full h-full flex flex-col md:flex-row relative gap-8 p-8 overflow-hidden ${baseOverlayCls}`} style={{ backgroundColor: overlayBg, padding: overlayPad }}>
        {renderDraftingAccents()}
        {/* Left Column: Big Image Feature */}
        <div className="flex-1 md:flex-[1.2] h-full relative overflow-hidden border border-black/5 rounded-sm bg-gray-50 flex flex-col justify-end p-6">
          {featuredItem && featuredItem.thumbnail ? (
            <img src={featuredItem.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-300 font-mono text-xs">NO FEATURED IMAGE</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="relative z-10 text-white">
            <span className="text-xs font-mono tracking-widest text-white/70 uppercase">FEATURED PROJECT // {getDisplayNumber(featuredItem?.num || '01')}</span>
            <h3 className="text-2xl font-bold uppercase tracking-wider mt-1" style={{ fontFamily: tokens.headingFont }}>{featuredItem?.title || "No Projects"}</h3>
            <p className="text-xs mt-2 text-white/80">{featuredItem?.typology} — {featuredItem?.location}</p>
          </div>
        </div>
        {/* Right Column: Clean Editorial Index List */}
        <div className="flex-1 h-full overflow-y-auto flex flex-col justify-between pr-2 border-l border-black/10 pl-6">
          <div className="flex flex-col gap-1 mb-6">
            <h2 className="text-3xl font-light uppercase tracking-[0.2em]" style={{ color: tokens.primary, fontFamily: tokens.headingFont }}>INDEX</h2>
            <span className="text-[9px] uppercase tracking-widest font-mono text-gray-400">SELECTED WORKS & PROJECTS</span>
          </div>
          <div className="flex-1 flex flex-col justify-center divide-y divide-black/10">
            {items.map((it, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between group hover:bg-black/5 px-2 transition-colors duration-200">
                <div className="flex items-baseline gap-4 min-w-0">
                  <span className="font-mono text-xs opacity-50">{getDisplayNumber(it.num)}</span>
                  <div className="truncate">
                    <h4 className="font-bold text-xs uppercase tracking-wider truncate" style={{ color: tokens.text }}>{it.title}</h4>
                    <span className="text-[9px] uppercase text-gray-500 font-mono tracking-wide">{it.typology}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold font-mono tracking-widest" style={{ color: tokens.accent }}>P. {it.pageNumber}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderSwissGridTOC = () => {
    return (
      <div className={`w-full h-full flex flex-col pt-10 px-10 relative overflow-hidden ${baseOverlayCls}`} style={{ backgroundColor: overlayBg, padding: overlayPad }}>
        {renderDraftingAccents()}
        <div className="border-b-4 border-black pb-4 mb-8 shrink-0 flex items-baseline justify-between">
          <h2 className="text-4xl font-black uppercase tracking-tighter" style={{ color: tokens.primary, fontFamily: tokens.headingFont }}>T.O.C.</h2>
          <span className="text-xs font-mono font-bold tracking-widest opacity-60">EDITION // 2026 // COSMO FOLIO</span>
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-12 overflow-y-auto pb-6">
          {items.map((it, idx) => (
            <div key={idx} className="border-t-2 border-black pt-4 flex flex-col justify-between group relative">
              <div>
                <span className="text-[60px] font-black leading-none block -mt-4 mb-2 tracking-tighter" style={{ color: tokens.accent }}>
                  {getDisplayNumber(it.num)}
                </span>
                <h4 className="text-sm font-black uppercase tracking-wider" style={{ color: tokens.text, fontFamily: tokens.headingFont }}>
                  {it.title}
                </h4>
                <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase tracking-widest">{it.typology}</p>
                <p className="text-[9px] text-gray-400 font-mono uppercase tracking-widest">{it.location}</p>
              </div>
              <div className="mt-8 flex justify-between items-baseline border-t border-black/10 pt-2 font-mono text-[10px] font-bold">
                <span>PROJECT INDEX // {it.num}</span>
                <span className="text-xs text-black tracking-widest">P. {it.pageNumber}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderAsymmetricTimeline = () => {
    return (
      <div className={`w-full h-full flex flex-col pt-10 px-10 relative overflow-hidden ${baseOverlayCls}`} style={{ backgroundColor: overlayBg, padding: overlayPad }}>
        {renderDraftingAccents()}
        <div className="mb-10 shrink-0">
          <h2 className="text-2xl font-bold uppercase tracking-[0.2em]" style={{ color: tokens.primary, fontFamily: tokens.headingFont }}>CHRONOLOGICAL INDEX</h2>
          <span className="text-[9px] font-mono tracking-widest text-gray-400 uppercase">PROJECT TIMELINE</span>
        </div>
        <div className="flex-1 relative overflow-y-auto pl-10 md:pl-0">
          {/* Vertical Timeline Bar */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-4 w-[1px] bg-black/20" />
          
          <div className="flex flex-col gap-12 pb-6">
            {items.map((it, idx) => {
              const isEven = idx % 2 === 0
              return (
                <div key={idx} className={`relative flex flex-col md:flex-row w-full ${isEven ? 'md:flex-row-reverse' : ''}`}>
                  {/* Timeline Node */}
                  <div className="absolute left-[-30px] md:left-1/2 md:-translate-x-1/2 top-1.5 w-3 h-3 rounded-full border border-black bg-white flex items-center justify-center z-10 shadow-sm transition-transform duration-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-black" />
                  </div>
                  
                  {/* Content Container */}
                  <div className={`w-full md:w-[45%] ${isEven ? 'md:text-right md:pr-8' : 'md:pl-8'}`}>
                    <span className="text-xs font-mono font-bold tracking-widest" style={{ color: tokens.accent }}>{it.year} // P.{it.pageNumber}</span>
                    <h4 className="text-base font-bold uppercase tracking-wider mt-1" style={{ color: tokens.text, fontFamily: tokens.headingFont }}>{it.title}</h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">{it.typology} // {it.location}</p>
                    
                    {it.thumbnail && (
                      <img src={it.thumbnail} alt="" className={`mt-3 w-32 h-20 object-cover border border-black/5 rounded-sm grayscale hover:grayscale-0 transition-all duration-300 ${isEven ? 'md:ml-auto' : ''}`} />
                    )}
                  </div>
                  <div className="hidden md:block w-[10%]" />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderBrutalistBlueprint = () => {
    return (
      <div className={`w-full h-full flex flex-col p-8 bg-sky-950 text-cyan-300 font-mono relative overflow-hidden border-4 border-cyan-500/30 ${baseOverlayCls}`} style={{ padding: overlayPad }}>
        {renderDraftingAccents()}
        <div className="border-b-2 border-cyan-400 pb-3 mb-6 shrink-0 flex items-baseline justify-between">
          <h2 className="text-2xl font-bold uppercase tracking-widest text-white">PROJECT SPECIFICATION INDEX</h2>
          <span className="text-[9px] text-cyan-400/70">REF // COSMOFOLIO-2026</span>
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto pb-4">
          {items.map((it, idx) => (
            <div key={idx} className="border border-cyan-500/20 p-4 bg-sky-900/30 flex flex-col justify-between relative group hover:border-cyan-400 transition-colors duration-200">
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-bold text-cyan-400">[{getDisplayNumber(it.num)}]</span>
                  <span className="text-[10px] text-cyan-400/80 bg-sky-800/40 px-2 py-0.5 border border-cyan-500/20 font-bold">SHEET // {it.pageNumber}</span>
                </div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                  {it.title}
                </h4>
                <p className="text-[9px] opacity-75 mt-2">TYPOLOGY: {it.typology}</p>
                <p className="text-[9px] opacity-75">LOCATION: {it.location}</p>
              </div>
              <div className="mt-4 border-t border-cyan-500/10 pt-2 flex justify-between items-center text-[8px] opacity-50">
                <span>SCALE: N.T.S.</span>
                <span>ZONE: {it.location.split(',')[1] || 'GLOBAL'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderEditorialMonograph = () => {
    return (
      <div className={`w-full h-full flex flex-col pt-12 px-12 relative overflow-hidden ${baseOverlayCls}`} style={{ backgroundColor: overlayBg, padding: overlayPad }}>
        {renderDraftingAccents()}
        <div className="flex flex-col mb-10 shrink-0">
          <span className="text-[10px] tracking-[0.3em] font-bold text-gray-400 uppercase">THE ARCHITECTURAL MONOGRAPH</span>
          <h2 className="text-4xl font-serif font-light italic mt-1" style={{ color: tokens.primary, fontFamily: tokens.headingFont }}>Index of Works</h2>
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col divide-y divide-black/10 pr-2 pb-6">
          {items.map((it, idx) => (
            <div key={idx} className="py-6 flex items-center justify-between group relative min-h-[90px]">
              <div className="flex-1 flex gap-6 items-baseline min-w-0 pr-6">
                <span className="font-serif italic text-[14px] text-gray-400">{getDisplayNumber(it.num)}.</span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base uppercase tracking-widest font-light transition-colors group-hover:text-black" style={{ color: tokens.text, fontFamily: tokens.headingFont }}>
                    {it.title}
                  </h4>
                  <div className="flex gap-4 items-center text-[10px] text-gray-400 mt-1 uppercase tracking-wider">
                    <span>{it.typology}</span>
                    <span>·</span>
                    <span>{it.location}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6 shrink-0 font-serif">
                {it.thumbnail && (
                  <img src={it.thumbnail} alt="" className="w-16 h-12 object-cover border border-black/5 opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" />
                )}
                <span className="text-3xl font-light italic text-gray-300 group-hover:text-black transition-colors" style={{ fontFamily: tokens.headingFont }}>{it.pageNumber}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderDeconstructivist = () => {
    return (
      <div className={`w-full h-full flex flex-col p-10 relative overflow-hidden ${baseOverlayCls}`} style={{ backgroundColor: overlayBg, padding: overlayPad }}>
        {renderDraftingAccents()}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <svg className="w-full h-full" viewBox="0 0 800 800">
            <line x1="0" y1="0" x2="800" y2="800" stroke="currentColor" strokeWidth="2" />
            <line x1="800" y1="0" x2="0" y2="800" stroke="currentColor" strokeWidth="2" />
            <line x1="100" y1="0" x2="100" y2="800" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5 5" />
            <line x1="0" y1="300" x2="800" y2="300" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5 5" />
          </svg>
        </div>
        <div className="mb-8 shrink-0 relative">
          <h2 className="text-5xl font-black uppercase tracking-tight skew-x-3 rotate-[-1deg]" style={{ color: tokens.primary, fontFamily: tokens.headingFont }}>DE-CON</h2>
          <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase block mt-1">INDEX STRUCTURE // DECONSTRUCTED</span>
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 overflow-y-auto pb-6 relative z-10">
          {items.map((it, idx) => {
            const rot = (idx % 3 === 0) ? '-rotate-[1deg]' : (idx % 3 === 1) ? 'rotate-[1.5deg]' : 'rotate-[-0.5deg]'
            return (
              <div key={idx} className={`p-5 bg-white border-2 border-black/80 shadow-[4px_4px_0_0_rgba(0,0,0,0.85)] flex flex-col justify-between transition-transform duration-300 hover:rotate-0 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] ${rot}`}>
                <div className="flex justify-between items-start mb-4">
                  <span className="font-mono text-xs font-black uppercase border border-black px-2 py-0.5 bg-black text-white">{getDisplayNumber(it.num)}</span>
                  <span className="font-serif italic text-base font-bold">P.{it.pageNumber}</span>
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight" style={{ color: tokens.text, fontFamily: tokens.headingFont }}>
                    {it.title}
                  </h4>
                  <p className="text-[9px] text-gray-500 mt-2 font-mono uppercase tracking-widest">{it.typology}</p>
                </div>
                <div className="mt-4 border-t-2 border-black/10 pt-2 flex items-center justify-between text-[8px] font-mono text-gray-400">
                  <span>COORD // {it.location.slice(0, 8)}</span>
                  <span>{it.year}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderMinimal = () => {
    return (
    <div className={`w-full flex flex-col h-full overflow-hidden min-h-0 ${baseOverlayCls} ${overlayEnabled ? 'border border-black/5' : ''}`} style={{ fontFamily: tokens.bodyFont, backgroundColor: overlayBg, padding: overlayPad }}>
      <h3 className="text-xs font-bold uppercase tracking-[0.25em] mb-4 pb-2 border-b shrink-0" style={{ color: tokens.primary, borderColor: tokens.accent, fontFamily: tokens.headingFont }}>
        {block.label || 'CONTENTS'}
      </h3>
      <div className="flex flex-col flex-1 overflow-hidden shrink min-h-0" style={{ gap: Math.max(0, 10 - items.length * 0.5) + 'px' }}>
        {items.map((it, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs pb-1.5 border-b border-black/[0.04] shrink min-h-0">
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

  const renderContent = () => {
    switch (variant) {
      case 'vertical-stripes': return renderVerticalStripes()
      case 'minimal-accent': return renderMinimalAccent()
      case 'modern-cutout': return renderModernCutout()
      case 'handdrawn-timeline': return renderHanddrawnTimeline()
      case 'magazine': return renderMagazine()
      case 'timeline': return renderTimeline()
      case 'grid': return renderGrid()
      case 'luxury': return renderLuxury()
      case 'research': return renderResearch()
      case 'parametric': return renderParametric()
      case 'competition': return renderCompetition()
      case 'academic': return renderAcademic()
      case 'minimal': return renderMinimal()
      case 'el-croquis': return renderElCroquis()
      case 'swiss-grid': return renderSwissGridTOC()
      case 'asymmetric-timeline': return renderAsymmetricTimeline()
      case 'brutalist-blueprint': return renderBrutalistBlueprint()
      case 'editorial-monograph': return renderEditorialMonograph()
      case 'deconstructivist': return renderDeconstructivist()
      case 'generative':
      default:
        return renderGenerative()
    }
  }

  return (
    <div className="w-full h-full relative group">
      <div className="w-full h-full" style={{ zoom: styleConfig.fontSizeMultiplier || 1 } as React.CSSProperties}>
        {renderContent()}
      </div>

      {/* Editor Controls Overlay */}
      <div 
        className="absolute top-2 right-2 flex flex-col items-end z-50 print:hidden pointer-events-auto"
        onMouseEnter={() => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          setIsEditorOpen(true)
        }}
        onMouseLeave={() => {
          timeoutRef.current = setTimeout(() => {
            setIsEditorOpen(false)
            setActiveTab(null)
          }, 300)
        }}
      >
        {/* Toolbar */}
        <div className={`flex items-center gap-1 bg-white/95 backdrop-blur-md shadow-lg border border-black/10 rounded-md p-1 transition-opacity duration-200 ${isEditorOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <button onClick={() => setActiveTab(t => t === 'layout' ? null : 'layout')} className={`p-1.5 rounded hover:bg-black/5 transition-colors ${activeTab === 'layout' ? 'bg-black/5' : ''}`} title="Layout Style">📐</button>
          <button onClick={() => setActiveTab(t => t === 'overlay' ? null : 'overlay')} className={`p-1.5 rounded hover:bg-black/5 transition-colors ${activeTab === 'overlay' ? 'bg-black/5' : ''}`} title="Overlay Settings">🎨</button>
          <button onClick={() => setActiveTab(t => t === 'typography' ? null : 'typography')} className={`p-1.5 rounded hover:bg-black/5 transition-colors ${activeTab === 'typography' ? 'bg-black/5' : ''}`} title="Typography">A</button>
          <div className="w-px h-4 bg-black/10 mx-1" />
          {block.freeform && (
            <button 
              onClick={() => onChange({ freeform: { ...block.freeform!, pinned: !block.freeform!.pinned } })}
              className={`p-1.5 rounded transition-colors ${block.freeform.pinned ? 'text-green-600 bg-green-50' : 'hover:bg-black/5'}`}
              title={block.freeform.pinned ? 'Unpin from Screen' : 'Pin to Screen'}
            >
              📍
            </button>
          )}
          <button 
            onClick={() => {
              if (block.freeform) {
                onChange({ freeform: undefined })
              } else {
                onChange({ freeform: { x: 10, y: 10, w: 50, h: 50 } })
              }
            }}
            className={`p-1.5 rounded transition-colors hover:bg-black/5 ${block.freeform ? 'text-blue-600' : ''}`}
            title={block.freeform ? 'Snap to Grid' : 'Unlock from Grid'}
          >
            {block.freeform ? '↩' : '🔓'}
          </button>
          <div className="w-px h-4 bg-black/10 mx-1" />
          <button onClick={() => (onChange as any)({ isDeleted: true })} className="p-1.5 rounded hover:bg-red-50 text-red-500/50 hover:text-red-600 transition-colors" title="Remove Block">✕</button>
        </div>

        {/* Tab Panels */}
        {activeTab === 'layout' && (
          <div className="bg-white/95 backdrop-blur-md p-3 rounded-lg shadow-xl border border-black/10 w-64 text-left">
            <div className="flex justify-between items-center mb-2">
              <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Layout Style</div>
              <button onClick={handleRandomize} className="text-[9px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider">🎲 Random</button>
            </div>
            <select 
              className="bg-black/5 hover:bg-black/10 text-black text-[10px] uppercase font-bold tracking-wider px-3 py-2 rounded-md outline-none w-full border border-black/10 transition"
              value={variant}
              onChange={(e) => updateStyle({ variant: e.target.value as any })}
            >
              <option value="generative">Organic Generative</option>
              <optgroup label="Architectural Editorial (New)">
                <option value="el-croquis">El Croquis Monograph</option>
                <option value="swiss-grid">Swiss International Grid</option>
                <option value="asymmetric-timeline">Asymmetric Chrono Timeline</option>
                <option value="brutalist-blueprint">Brutalist Blueprint</option>
                <option value="editorial-monograph">Editorial Monograph</option>
                <option value="deconstructivist">Deconstructivist Node</option>
              </optgroup>
              <optgroup label="Modern Styles">
                <option value="vertical-stripes">Vertical Stripes</option>
                <option value="minimal-accent">Minimal Accent</option>
                <option value="modern-cutout">Modern Cutout</option>
                <option value="handdrawn-timeline">Hand-drawn Timeline</option>
              </optgroup>
              <optgroup label="Legacy Layouts">
                <option value="magazine">Magazine Style</option>
                <option value="timeline">Timeline Style</option>
                <option value="grid">Image Grid Style</option>
                <option value="luxury">Luxury Style</option>
                <option value="research">Research Style</option>
                <option value="parametric">Parametric Style</option>
                <option value="competition">Competition Style</option>
                <option value="academic">Academic Thesis Style</option>
                <option value="minimal">Minimal Default</option>
              </optgroup>
            </select>
          </div>
        )}

        {activeTab === 'overlay' && (
          <div className="bg-white/95 backdrop-blur-md p-3 rounded-lg shadow-xl border border-black/10 w-64 text-left">
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Overlay Settings</div>
            <label className="flex items-center gap-2 text-[10px] uppercase font-bold cursor-pointer hover:bg-black/5 p-1 -mx-1 rounded">
              <input type="checkbox" checked={overlayEnabled} onChange={e => updateStyle({ overlayEnabled: e.target.checked })} className="rounded" />
              Enable Frosted Card
            </label>
            <div className={`flex flex-col gap-3 mt-3 ${!overlayEnabled ? 'opacity-30 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] uppercase text-gray-500 font-semibold">Color</span>
                <input type="color" value={styleConfig.overlayColor || '#ffffff'} onChange={e => updateStyle({ overlayColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer border border-black/10 p-0" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between"><span className="text-[9px] uppercase text-gray-500 font-semibold">Opacity</span><span className="text-[9px] font-mono">{Math.round((styleConfig.overlayOpacity ?? 0.85)*100)}%</span></div>
                <input type="range" min="0" max="1" step="0.05" value={styleConfig.overlayOpacity ?? 0.85} onChange={e => updateStyle({ overlayOpacity: parseFloat(e.target.value) })} className="w-full accent-black" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between"><span className="text-[9px] uppercase text-gray-500 font-semibold">Padding</span><span className="text-[9px] font-mono">{styleConfig.overlayPadding ?? 20}px</span></div>
                <input type="range" min="0" max="60" step="2" value={styleConfig.overlayPadding ?? 20} onChange={e => updateStyle({ overlayPadding: parseInt(e.target.value) })} className="w-full accent-black" />
              </div>
            </div>
            
            <div className="w-full h-px bg-black/10 my-3" />
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Architectural Details</div>
            
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[10px] uppercase font-bold cursor-pointer hover:bg-black/5 p-1 -mx-1 rounded">
                <input type="checkbox" checked={!!showDraftingGrid} onChange={e => updateStyle({ showDraftingGrid: e.target.checked })} className="rounded" />
                Drafting Grid
              </label>
              
              <label className="flex items-center gap-2 text-[10px] uppercase font-bold cursor-pointer hover:bg-black/5 p-1 -mx-1 rounded">
                <input type="checkbox" checked={!!showNorthArrow} onChange={e => updateStyle({ showNorthArrow: e.target.checked })} className="rounded" />
                North Arrow
              </label>
              
              <label className="flex items-center gap-2 text-[10px] uppercase font-bold cursor-pointer hover:bg-black/5 p-1 -mx-1 rounded">
                <input type="checkbox" checked={!!showScaleBar} onChange={e => updateStyle({ showScaleBar: e.target.checked })} className="rounded" />
                Scale Bar
              </label>
              
              {showScaleBar && (
                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-[8px] uppercase text-gray-500 font-semibold">Scale Text</span>
                  <input type="text" value={scaleText || 'SCALE 1 : 500'} onChange={e => updateStyle({ scaleText: e.target.value })} className="bg-black/5 text-[10px] p-1.5 rounded outline-none border border-black/10 w-full" />
                </div>
              )}

              <div className="flex flex-col gap-1 mt-1">
                <span className="text-[8px] uppercase text-gray-500 font-semibold">Project Numbering</span>
                <select value={customNumberingFormat || 'standard'} onChange={e => updateStyle({ customNumberingFormat: e.target.value as any })} className="bg-black/5 text-[10px] p-1.5 rounded outline-none border border-black/10 w-full font-bold">
                  <option value="standard">Standard (01)</option>
                  <option value="drawing-label">Drawing label (A-01)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'typography' && (
          <div className="bg-white/95 backdrop-blur-md p-3 rounded-lg shadow-xl border border-black/10 w-64 text-left">
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Typography</div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between"><span className="text-[9px] uppercase text-gray-500 font-semibold">Font Size</span><span className="text-[9px] font-mono">{Math.round((styleConfig.fontSizeMultiplier || 1)*100)}%</span></div>
                <input type="range" min="0.5" max="2" step="0.1" value={styleConfig.fontSizeMultiplier || 1} onChange={e => updateStyle({ fontSizeMultiplier: parseFloat(e.target.value) })} className="w-full accent-black" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] uppercase text-gray-500 font-semibold">Text Color</span>
                <input type="color" value={styleConfig.textColor || tokens.text} onChange={e => updateStyle({ textColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer border border-black/10 p-0" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] uppercase text-gray-500 font-semibold">Title Color</span>
                <input type="color" value={styleConfig.titleColor || tokens.primary} onChange={e => updateStyle({ titleColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer border border-black/10 p-0" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
