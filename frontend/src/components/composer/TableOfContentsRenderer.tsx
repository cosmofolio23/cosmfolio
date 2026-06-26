'use client'

import React from 'react'
import type { Block, DesignTokens } from './types'

export interface TocStyleParams {
  variant: 'vertical-stripes' | 'minimal-accent' | 'modern-cutout' | 'handdrawn-timeline' | 'generative'
  // Generative properties (to enable 50+ iterations)
  structure?: 'list' | 'grid' | 'zigzag' | 'masonry' | 'scroll'
  imageShape?: 'pill' | 'square' | 'tall' | 'circle' | 'none'
  numbering?: 'outline' | 'asterisk' | 'serif' | 'minimal' | 'circled'
  lines?: 'dotted' | 'solid' | 'none'
}

interface ProjectIndexItem {
  num: string
  title: string
  year: string
  typology: string
  location: string
  thumbnail: string
  pageNumber: string
}

export function TableOfContentsRenderer({
  block, tokens, pages, onChange, layoutId
}: {
  block: Block
  tokens: DesignTokens
  pages: any[]
  onChange: (patch: Partial<Block>) => void
  layoutId?: string
}) {
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

  // Fallback for fresh templates
  const items = projectItems.length > 0 ? projectItems : [
    { num: '01', title: 'Cultural Center', year: '2025', typology: 'Cultural', location: 'Tokyo, JP', thumbnail: '', pageNumber: '06' },
    { num: '02', title: 'Urban Housing', year: '2026', typology: 'Residential', location: 'London, UK', thumbnail: '', pageNumber: '18' },
    { num: '03', title: 'Computational Pavillion', year: '2026', typology: 'Experimental', location: 'Zurich, CH', thumbnail: '', pageNumber: '24' },
    { num: '04', title: 'Mixed-Use Highrise', year: '2026', typology: 'Commercial', location: 'New York, US', thumbnail: '', pageNumber: '32' },
    { num: '05', title: 'Parametric Bridge', year: '2027', typology: 'Infrastructure', location: 'Dubai, UAE', thumbnail: '', pageNumber: '40' }
  ]

  // Map legacy layoutId to initial style if no tocStyle is provided
  const getDefaultStyle = (lid: string = ''): TocStyleParams => {
    const l = lid.toLowerCase()
    if (l.includes('magazine')) return { variant: 'vertical-stripes' }
    if (l.includes('timeline')) return { variant: 'handdrawn-timeline' }
    if (l.includes('grid') || l.includes('thumb')) return { variant: 'minimal-accent' }
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

  const styleConfig: TocStyleParams = block.tocStyle || getDefaultStyle(layoutId)
  const { variant } = styleConfig

  // Generate a random style
  const handleRandomize = () => {
    const variants = ['vertical-stripes', 'minimal-accent', 'modern-cutout', 'handdrawn-timeline', 'generative'] as const
    const structures = ['list', 'grid', 'zigzag', 'masonry'] as const
    const shapes = ['pill', 'square', 'tall', 'circle', 'none'] as const
    const numberings = ['outline', 'asterisk', 'serif', 'minimal', 'circled'] as const
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
        default: return 'hidden'
      }
    }

    const getNumberingUI = (num: string) => {
      switch (numbering) {
        case 'outline': return <span className="text-4xl font-bold text-transparent" style={{ WebkitTextStroke: `1px ${tokens.text}` }}>{num}</span>
        case 'asterisk': return <span className="text-lg font-bold" style={{ color: tokens.accent }}>*{num}</span>
        case 'serif': return <span className="text-2xl font-serif italic text-gray-400">{num}.</span>
        case 'circled': return <span className="w-8 h-8 rounded-full border border-current flex items-center justify-center text-xs font-bold">{num}</span>
        default: return <span className="text-sm font-bold opacity-60">{num}</span>
      }
    }

    const gridClass = structure === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-8' 
                    : structure === 'masonry' ? 'columns-2 md:columns-3 gap-8'
                    : 'flex flex-col gap-6'

    const itemClass = structure === 'zigzag' ? 'flex items-center gap-8 even:flex-row-reverse' : 'flex flex-col gap-4'

    const lineClass = lines === 'dotted' ? 'border-b border-dashed border-gray-300' 
                    : lines === 'solid' ? 'border-b border-solid border-gray-200' 
                    : ''

    return (
      <div className="w-full relative h-full flex flex-col pt-8 px-8 group">
        <div className="flex justify-between items-end mb-12">
          <h2 className="text-4xl font-bold uppercase tracking-widest" style={{ color: tokens.primary, fontFamily: tokens.headingFont }}>
            {block.label || 'Contents'}
          </h2>
        </div>
        <div className="absolute top-4 right-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleRandomize} className="text-xs bg-black/10 hover:bg-black/20 text-black px-3 py-1.5 rounded-full transition-colors backdrop-blur-md">
            🎲 Randomize Style (50+)
          </button>
        </div>

        <div className={gridClass}>
          {items.map((it, idx) => (
            <div key={idx} className={`${itemClass} ${lineClass} pb-4 mb-4 break-inside-avoid`}>
              {imageShape !== 'none' && (
                <div className={`${getShapeClasses(imageShape || 'square')} overflow-hidden bg-gray-100 flex-shrink-0 w-32 relative`}>
                  {it.thumbnail ? (
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${it.thumbnail})` }} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300 font-bold">{it.num}</div>
                  )}
                </div>
              )}
              <div className="flex-1 flex flex-col justify-center">
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
      <div className="absolute top-4 right-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handleRandomize} className="text-xs bg-black/50 hover:bg-black text-white px-3 py-1.5 rounded-full shadow-lg transition-colors">
          🎲 Change Style
        </button>
      </div>
      {items.map((it, idx) => (
        <div key={idx} className="flex-1 h-full relative overflow-hidden flex flex-col">
          <div className="w-full flex-1 bg-gray-200 relative overflow-hidden">
            {it.thumbnail && <div className="absolute inset-0 bg-cover bg-center grayscale hover:grayscale-0 transition-all duration-500" style={{ backgroundImage: `url(${it.thumbnail})` }} />}
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
      <div className="absolute top-4 right-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handleRandomize} className="text-xs bg-black/10 hover:bg-black/20 text-black px-3 py-1.5 rounded-full transition-colors">
          🎲 Change Style
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-16 gap-y-24 max-w-5xl mx-auto px-8 w-full">
        {items.map((it, idx) => (
          <div key={idx} className="relative">
            <div className="absolute -inset-4 bg-red-600 z-0 transform translate-x-2 -translate-y-2" />
            <div className="relative z-10 w-full aspect-square bg-white shadow-xl overflow-hidden grayscale">
              {it.thumbnail && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${it.thumbnail})` }} />}
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
      <div className="absolute top-4 right-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handleRandomize} className="text-xs bg-black/10 hover:bg-black/20 text-black px-3 py-1.5 rounded-full transition-colors">
          🎲 Change Style
        </button>
      </div>
      <h2 className="text-xl font-bold uppercase tracking-[0.3em] mb-12 text-blue-600 pl-4">Table of Contents</h2>
      <div className="flex-1 flex gap-4 w-full h-full justify-center">
        {items.map((it, idx) => (
          <div key={idx} className="flex-1 relative rounded-t-[100px] rounded-b-[100px] bg-gradient-to-b from-blue-100 to-transparent p-2 border border-blue-200">
            <div className="w-full h-full rounded-t-[100px] rounded-b-[100px] overflow-hidden bg-gray-200 relative mix-blend-multiply grayscale">
               {it.thumbnail && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${it.thumbnail})` }} />}
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
      <div className="absolute top-4 right-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handleRandomize} className="text-xs bg-black/10 hover:bg-black/20 text-black px-3 py-1.5 rounded-full transition-colors">
          🎲 Change Style
        </button>
      </div>
      
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
                    <div className="w-full h-full bg-cover bg-center grayscale contrast-150 opacity-80" style={{ backgroundImage: `url(${it.thumbnail})` }} />
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

  switch (variant) {
    case 'vertical-stripes': return renderVerticalStripes()
    case 'minimal-accent': return renderMinimalAccent()
    case 'modern-cutout': return renderModernCutout()
    case 'handdrawn-timeline': return renderHanddrawnTimeline()
    case 'generative':
    default:
      return renderGenerative()
  }
}
