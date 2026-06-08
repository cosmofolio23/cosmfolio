/**
 * SpreadCanvas — Professional publishing spread renderer.
 *
 * Renders a two-page spread (like a book opening) with:
 * - Master page elements (headers, footers, page numbers, logos)
 * - Background layers (gradients, images, patterns, grids)
 * - Architectural grid + snapping
 * - Page size scaling (A5 → A0, responsive to container)
 *
 * Props: spread, tokens, onUpdate, editable
 */

import React, { useState } from 'react'
import PageComposer from './PageComposer'
import type { Spread, MasterElement, BackgroundDefinition } from './publishingTypes'
import type { DesignTokens, Page } from './types'

interface SpreadCanvasProps {
  spread: Spread
  tokens?: DesignTokens
  onUpdate?: (spread: Spread) => void
  editable?: boolean
  /** Container width in px; spread scales to fit */
  containerWidth?: number
  showGrid?: boolean
  showMasters?: boolean
}

export const SpreadCanvas = React.forwardRef<HTMLDivElement, SpreadCanvasProps>(
  ({
    spread,
    tokens = { background: '#fff', text: '#000', primary: '#000', accent: '#999', muted: '#eee', headingFont: 'Inter', bodyFont: 'Inter' },
    onUpdate,
    editable = false,
    containerWidth = 1200,
    showGrid = true,
    showMasters = true,
  }, ref) => {
    const [selectedMaster, setSelectedMaster] = useState<string | null>(null)

    // Compute scale: fit both pages into container width with gutter
    const { width: pageWidthPx, height: pageHeightPx } = spread.pageSize.pxWidth
      ? { width: spread.pageSize.pxWidth, height: spread.pageSize.pxHeight || spread.pageSize.height }
      : { width: Math.round((spread.pageSize.width / 25.4) * 96), height: Math.round((spread.pageSize.height / 25.4) * 96) }

    const gutter = 20 // px between pages
    const padding = 40 // px around entire spread
    const availableWidth = containerWidth - 2 * padding - gutter
    const scale = Math.min(1, availableWidth / (2 * pageWidthPx))

    const scaledPageWidth = pageWidthPx * scale
    const scaledPageHeight = pageHeightPx * scale

    // Render a background layer
    const renderBackground = (bg: BackgroundDefinition, index: number): React.ReactNode => {
      switch (bg.type) {
        case 'solid':
          return (
            <div key={index} style={{ position: 'absolute', inset: 0, backgroundColor: bg.color, zIndex: index }} />
          )
        case 'gradient':
          const angle = bg.angle || 135
          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(${angle}deg, ${bg.from}, ${bg.to})`,
                zIndex: index,
                opacity: bg.opacity ?? 1,
              }}
            />
          )
        case 'image':
          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${bg.url})`,
                backgroundSize: bg.fit || 'cover',
                backgroundPosition: 'center',
                zIndex: index,
                opacity: bg.opacity ?? 1,
                filter: bg.blur ? `blur(${bg.blur}px)` : undefined,
              }}
            />
          )
        case 'watermark':
          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: index,
                opacity: bg.opacity ?? 0.1,
                transform: bg.rotation ? `rotate(${bg.rotation}deg)` : undefined,
                pointerEvents: 'none',
              }}
            >
              <span style={{ fontSize: bg.fontSize || 60, color: bg.color || '#ccc', fontWeight: 'bold' }}>
                {bg.text}
              </span>
            </div>
          )
        case 'grid':
          return (
            <svg key={index} style={{ position: 'absolute', inset: 0, zIndex: index, opacity: bg.opacity ?? 0.2 }}>
              <defs>
                <pattern id={`grid-${index}`} width={bg.scale || 20} height={bg.scale || 20} patternUnits="userSpaceOnUse">
                  <path d={`M ${bg.scale || 20} 0 L 0 0 0 ${bg.scale || 20}`} fill="none" stroke={bg.color} strokeWidth={bg.strokeWidth || 0.5} />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#grid-${index})`} />
            </svg>
          )
        default:
          return null
      }
    }

    // Render a master element
    const renderMasterElement = (elem: MasterElement, pageNum: number): React.ReactNode => {
      if (elem.hidden || !showMasters) return null

      const positions: Record<string, { x: string; y: string }> = {
        'top-left': { x: '10px', y: '10px' },
        'top-center': { x: '50%', y: '10px' },
        'top-right': { x: '10px', y: '10px' },
        'bottom-left': { x: '10px', y: '10px' },
        'bottom-center': { x: '50%', y: '10px' },
        'bottom-right': { x: '10px', y: '10px' },
      }

      const pos = elem.position === 'custom' ? { x: `${elem.x}px`, y: `${elem.y}px` } : positions[elem.position]

      if (elem.type === 'text') {
        const text = elem.textTemplate
          ?.replace('${pageNumber}', String(pageNum))
          .replace('${projectTitle}', spread.leftPage.blocks.find(b => b.type === 'title')?.text || '')
          .replace('${projectNumber}', '01') || elem.text || ''

        return (
          <div
            key={elem.id}
            onClick={() => editable && setSelectedMaster(elem.id)}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              fontSize: `${elem.fontSize || 12}px`,
              fontFamily: elem.fontFamily || 'Inter',
              color: elem.color || '#000',
              opacity: elem.opacity ?? 1,
              cursor: editable ? 'pointer' : 'default',
              border: selectedMaster === elem.id ? '1px dashed blue' : 'none',
              padding: '4px',
              zIndex: elem.zIndex || 10,
              userSelect: 'none',
            }}
          >
            {text}
          </div>
        )
      }

      if (elem.type === 'image') {
        return (
          <img
            key={elem.id}
            src={elem.imageUrl}
            alt={elem.text || 'master'}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              width: `${elem.width}px`,
              height: `${elem.height}px`,
              opacity: elem.opacity ?? 1,
              zIndex: elem.zIndex || 10,
            }}
          />
        )
      }

      if (elem.type === 'line') {
        return (
          <div
            key={elem.id}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              width: `${elem.width}px`,
              height: `${elem.height}px`,
              borderTop: `${elem.strokeWidth || 1}px solid ${elem.strokeColor || '#000'}`,
              opacity: elem.opacity ?? 1,
              zIndex: elem.zIndex || 10,
            }}
          />
        )
      }

      return null
    }

    return (
      <div
        ref={ref}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: `${padding}px`,
          background: '#f5f5f5',
          minHeight: '100vh',
        }}
      >
        {/* Left Page */}
        <div
          style={{
            position: 'relative',
            width: `${scaledPageWidth}px`,
            height: `${scaledPageHeight}px`,
            background: tokens.background,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            marginRight: `${gutter / scale}px`,
          }}
        >
          {/* Backgrounds */}
          {spread.background?.definitions && spread.background.definitions.map((bg, i) => renderBackground(bg, i))}

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 5 }}>
            <PageComposer page={spread.leftPage} tokens={tokens} onChange={onUpdate ? (p: Page) => onUpdate({ ...spread, leftPage: p }) : () => {}} />
          </div>

          {/* Master Elements */}
          {spread.background?.definitions && spread.background.definitions.map((_, i) => renderMasterElement(spread.background?.definitions?.[i] as any, 1))}
        </div>

        {/* Right Page (if spread has two pages) */}
        {spread.rightPage && (
          <div
            style={{
              position: 'relative',
              width: `${scaledPageWidth}px`,
              height: `${scaledPageHeight}px`,
              background: tokens.background,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            {/* Backgrounds */}
            {spread.background?.definitions && spread.background.definitions.map((bg, i) => renderBackground(bg, i))}

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 5 }}>
              <PageComposer page={spread.rightPage} tokens={tokens} onChange={onUpdate ? (p: Page) => onUpdate({ ...spread, rightPage: p }) : () => {}} />
            </div>

            {/* Master Elements */}
            {spread.background?.definitions && spread.background.definitions.map((_, i) => renderMasterElement(spread.background?.definitions?.[i] as any, 2))}
          </div>
        )}
      </div>
    )
  }
)

SpreadCanvas.displayName = 'SpreadCanvas'
