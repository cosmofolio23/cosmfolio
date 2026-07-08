'use client'

import React from 'react'
import type { Block, FlowchartStep, DesignTokens } from './types'

interface ProcessFlowchartRendererProps {
  block: Block
  tokens?: DesignTokens
  onChange?: (p: Partial<Block>) => void
}

export default function ProcessFlowchartRenderer({ block, tokens, onChange }: ProcessFlowchartRendererProps) {
  const config = block.flowchartConfig

  // Fallback defaults if config is missing
  const pathStyle = config?.pathStyle || 'serpentine'
  const nodeStyle = config?.nodeStyle || 'image'
  const connectorStyle = config?.connectorStyle || 'curved'
  const lineColor = config?.lineColor || '#D4A574'
  const lineWidth = config?.lineWidth || 2
  const steps = config?.steps || []

  // Design Tokens integration
  const accentColor = tokens?.accent || config?.nodeBorderColor || '#D4A574'
  const cardBg = config?.nodeBgColor || tokens?.background || '#FFFFFF'
  const cardText = config?.textColor || tokens?.primary || '#1A1A1A'
  
  const N = steps.length
  if (N === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 border border-slate-800 rounded-lg text-slate-400 text-xs">
        No steps defined. Click "Edit Flowchart" to add steps.
      </div>
    )
  }

  // Base canvas dims for initial coordinate generation
  const W = 1100
  const H = 700

  // Card Dimensions
  const isLargeImg = nodeStyle === 'large-image'
  const cardW = isLargeImg ? 300 : 230
  const cardH = isLargeImg ? 320 : 130

  // Calculate Node Coordinates based on pathStyle
  const coords: { x: number; y: number }[] = []

  if (pathStyle === 'linear-h') {
    const startX = cardW / 2 + 50
    const endX = W - (cardW / 2 + 50)
    const spacing = N > 1 ? (endX - startX) / (N - 1) : 0
    for (let i = 0; i < N; i++) {
      coords.push({
        x: startX + i * spacing,
        y: H / 2
      })
    }
  } else if (pathStyle === 'linear-v') {
    const startY = cardH / 2 + 50
    const endY = H - (cardH / 2 + 50)
    const spacing = N > 1 ? (endY - startY) / (N - 1) : 0
    for (let i = 0; i < N; i++) {
      coords.push({
        x: W / 2,
        y: startY + i * spacing
      })
    }
  } else if (pathStyle === 'zigzag') {
    const startX = cardW / 2 + 50
    const endX = W - (cardW / 2 + 50)
    const spacing = N > 1 ? (endX - startX) / (N - 1) : 0
    for (let i = 0; i < N; i++) {
      coords.push({
        x: startX + i * spacing,
        y: i % 2 === 0 ? H / 2 - (cardH / 2 + 60) : H / 2 + (cardH / 2 + 60)
      })
    }
  } else if (pathStyle === 'circular') {
    const cx = W / 2
    const cy = H / 2
    const R = Math.max(230, cardW)
    for (let i = 0; i < N; i++) {
      const angle = -Math.PI / 2 + (i * (2 * Math.PI)) / N
      coords.push({
        x: cx + R * Math.cos(angle),
        y: cy + R * Math.sin(angle)
      })
    }
  } else if (pathStyle === 'radial') {
    coords.push({ x: W / 2, y: H / 2 })
    const outerCount = N - 1
    const cx = W / 2
    const cy = H / 2
    const R = Math.max(260, cardW + 30)
    for (let i = 0; i < outerCount; i++) {
      const angle = -Math.PI / 2 + (i * (2 * Math.PI)) / outerCount
      coords.push({
        x: cx + R * Math.cos(angle),
        y: cy + R * Math.sin(angle)
      })
    }
  } else {
    // DEFAULT: serpentine S-curve (2 rows max, up to 8 steps)
    const row0Y = H / 2 - (cardH / 2 + 60)
    const row1Y = H / 2 + (cardH / 2 + 60)
    const colWidth = cardW + 40
    const startX = 140

    for (let i = 0; i < N; i++) {
      if (i < 4) {
        coords.push({
          x: startX + i * colWidth,
          y: row0Y
        })
      } else {
        const colIdx = 3 - (i - 4) // reverse layout
        coords.push({
          x: startX + colIdx * colWidth,
          y: row1Y
        })
      }
    }
  }

  // Calculate perfect bounding box for viewBox
  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity
  coords.forEach(c => {
    if (c.x < minX) minX = c.x
    if (c.x > maxX) maxX = c.x
    if (c.y < minY) minY = c.y
    if (c.y > maxY) maxY = c.y
  })
  
  // Add card dimensions to bounding box
  minX -= cardW / 2
  maxX += cardW / 2
  minY -= cardH / 2
  maxY += cardH / 2

  // Apply padding so edges aren't clipped
  const pad = 60
  minX -= pad
  minY -= pad
  maxX += pad
  maxY += pad

  const boxW = maxX - minX
  const boxH = maxY - minY
  
  // Scale / Zoom logic
  const scale = config?.scale || 1
  const scaledW = boxW / scale
  const scaledH = boxH / scale
  const scaledX = minX + (boxW - scaledW) / 2
  const scaledY = minY + (boxH - scaledH) / 2
  
  // Auto-fit viewBox string
  const viewBoxStr = `${scaledX} ${scaledY} ${scaledW} ${scaledH}`

  const isDashed = connectorStyle === 'dashed'
  const isDouble = connectorStyle === 'double'

  const bgStyle: React.CSSProperties = {
    backgroundColor: config?.bgEnabled ? (config.bgColor || '#ffffff') : 'transparent',
    opacity: config?.bgEnabled ? (config.bgOpacity ?? 1) : 1
  }

  // Segmented Paths to allow arrows on each connector
  const segments: string[] = []

  if (N > 1) {
    if (pathStyle === 'radial') {
      for (let i = 1; i < N; i++) {
        segments.push(`M ${coords[0].x} ${coords[0].y} L ${coords[i].x} ${coords[i].y}`)
      }
    } else if (pathStyle === 'circular') {
      const cx = W / 2
      const cy = H / 2
      const R = Math.max(230, cardW)
      segments.push(`M ${cx + R} ${cy} A ${R} ${R} 0 1 1 ${cx + R - 0.01} ${cy}`)
    } else {
      for (let i = 1; i < N; i++) {
        const prev = coords[i - 1]
        const curr = coords[i]
        
        let seg = `M ${prev.x} ${prev.y} `

        if (pathStyle === 'linear-h' || pathStyle === 'linear-v') {
          seg += `L ${curr.x} ${curr.y}`
        } else if (pathStyle === 'zigzag') {
          const midX = (prev.x + curr.x) / 2
          if (connectorStyle === 'sharp') {
            seg += `L ${midX} ${prev.y} L ${midX} ${curr.y} L ${curr.x} ${curr.y}`
          } else {
            seg += `C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`
          }
        } else if (pathStyle === 'serpentine') {
          if (i === 4) {
             const endX = prev.x + cardW / 2 + 40
             if (connectorStyle === 'sharp') {
               seg += `L ${endX} ${prev.y} L ${endX} ${curr.y} L ${curr.x} ${curr.y}`
             } else {
               seg += `C ${endX + 60} ${prev.y}, ${endX + 60} ${curr.y}, ${curr.x} ${curr.y}`
             }
          } else {
            seg += `L ${curr.x} ${curr.y}`
          }
        }
        segments.push(seg)
      }
    }
  }

  const getOp = (idx: number) => {
    if (N <= 1) return 1
    return 0.6 + (0.4 * (idx / (N - 1)))
  }

  return (
    <div className="w-full h-full relative flex items-center justify-center rounded-lg" style={bgStyle}>
      <svg
        viewBox={viewBoxStr}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto-start-reverse">
            <polygon points="0 0, 6 2, 0 4" fill={lineColor} />
          </marker>
        </defs>

        {/* Draw Path Connection Lines */}
        {segments.map((d, i) => (
          <g key={`path-${i}`}>
            {isDouble ? (
              <>
                <path
                  d={d}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth={lineWidth + 4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={d}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={lineWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            ) : (
              <path
                d={d}
                fill="none"
                stroke={lineColor}
                strokeWidth={lineWidth}
                strokeDasharray={isDashed ? '6,6' : 'none'}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </g>
        ))}

        {/* Draw foreignObject Cards for Nodes */}
        {steps.map((step, idx) => {
          const coord = coords[idx]
          if (!coord) return null

          const x = coord.x - cardW / 2
          const y = coord.y - cardH / 2

          return (
            <foreignObject
              key={step.id}
              x={x}
              y={y}
              width={cardW}
              height={cardH}
              style={{ overflow: 'visible' }}
            >
              <div
                className={`relative w-full h-full rounded-xl shadow-lg border transition-all flex flex-col bg-white ${isLargeImg ? 'overflow-hidden' : 'p-5'}`}
                style={{
                  backgroundColor: cardBg,
                  borderColor: `${accentColor}30`,
                  boxShadow: `0 10px 25px -5px ${accentColor}20`,
                }}
              >
                
                {/* LARGE IMAGE STYLE */}
                {isLargeImg ? (
                  <>
                    <div className="h-[200px] w-full bg-slate-100 flex-shrink-0 relative border-b border-black/5">
                      {step.imageUrl ? (
                        <img src={step.imageUrl} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-30 text-slate-400">
                          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                          </svg>
                        </div>
                      )}
                      
                      {/* Badge overlay on top left of image */}
                      <div 
                        className="absolute top-4 left-4 w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-md text-xl font-mono border-2 border-white backdrop-blur-sm"
                        style={{ 
                          backgroundColor: accentColor, 
                          opacity: Math.max(0.7, getOp(idx)) 
                        }}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col overflow-hidden">
                      <h3 className="font-bold text-lg mb-1 truncate" style={{ color: cardText }}>
                        {step.title}
                      </h3>
                      <p className="text-[13px] leading-relaxed overflow-hidden text-ellipsis line-clamp-2" style={{ color: `${cardText}99` }}>
                        {step.description}
                      </p>
                    </div>
                  </>
                ) : (
                  /* STANDARD CARD STYLE */
                  <>
                    <div 
                      className="absolute -top-4 -left-4 w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-md text-xl font-mono border-2 border-white"
                      style={{ 
                        backgroundColor: accentColor, 
                        opacity: getOp(idx) 
                      }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </div>

                    {nodeStyle === 'image' && step.imageUrl && (
                      <div className="absolute -top-4 -right-2 w-12 h-12 rounded-full border-2 border-white shadow-sm overflow-hidden bg-white">
                        <img src={step.imageUrl} className="w-full h-full object-cover" alt="" />
                      </div>
                    )}
                    
                    {nodeStyle === 'image' && !step.imageUrl && (
                      <div className="absolute -top-4 -right-2 w-12 h-12 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-50 flex items-center justify-center" style={{ color: accentColor }}>
                        <svg className="w-5 h-5 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2L2 22h20L12 2zm0 4.236l6.882 13.764H5.118L12 6.236z" />
                        </svg>
                      </div>
                    )}

                    <div className="mt-1 flex-1 flex flex-col overflow-hidden">
                      <h3 className="font-bold text-lg mb-1 truncate" style={{ color: cardText }}>
                        {step.title}
                      </h3>
                      <p className="text-[13px] leading-relaxed overflow-hidden text-ellipsis line-clamp-3 text-slate-500" style={{ color: `${cardText}99` }}>
                        {step.description}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </foreignObject>
          )
        })}
      </svg>
    </div>
  )
}
