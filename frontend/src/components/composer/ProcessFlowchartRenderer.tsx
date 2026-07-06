'use client'

import React from 'react'
import type { Block, FlowchartStep } from './types'

interface ProcessFlowchartRendererProps {
  block: Block
  onChange?: (p: Partial<Block>) => void
}

export default function ProcessFlowchartRenderer({ block, onChange }: ProcessFlowchartRendererProps) {
  const config = block.flowchartConfig

  // Fallback defaults if config is missing
  const pathStyle = config?.pathStyle || 'serpentine'
  const nodeStyle = config?.nodeStyle || 'image'
  const connectorStyle = config?.connectorStyle || 'curved'
  const lineColor = config?.lineColor || '#D4A574'
  const nodeBorderColor = config?.nodeBorderColor || '#D4A574'
  const nodeBgColor = config?.nodeBgColor || '#F5E6D3'
  const textColor = config?.textColor || '#1A1A1A'
  const lineWidth = config?.lineWidth || 2
  const steps = config?.steps || []

  const N = steps.length
  if (N === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 border border-slate-800 rounded-lg text-slate-400 text-xs">
        No steps defined. Click "Edit Flowchart" to add steps.
      </div>
    )
  }

  const W = 800
  const H = 600
  
  const scale = config?.scale || 1
  const vw = W / scale
  const vh = H / scale
  const vx = (W - vw) / 2
  const vy = (H - vh) / 2
  const viewBoxStr = `${vx} ${vy} ${vw} ${vh}`

  // Calculate Node Coordinates based on pathStyle
  const coords: { x: number; y: number }[] = []

  if (pathStyle === 'linear-h') {
    const startX = 100
    const endX = 700
    const spacing = N > 1 ? (endX - startX) / (N - 1) : 0
    for (let i = 0; i < N; i++) {
      coords.push({
        x: startX + i * spacing,
        y: H / 2
      })
    }
  } else if (pathStyle === 'linear-v') {
    const startY = 100
    const endY = 500
    const spacing = N > 1 ? (endY - startY) / (N - 1) : 0
    for (let i = 0; i < N; i++) {
      coords.push({
        x: W / 2,
        y: startY + i * spacing
      })
    }
  } else if (pathStyle === 'zigzag') {
    const startX = 100
    const endX = 700
    const spacing = N > 1 ? (endX - startX) / (N - 1) : 0
    for (let i = 0; i < N; i++) {
      coords.push({
        x: startX + i * spacing,
        y: i % 2 === 0 ? 180 : 420
      })
    }
  } else if (pathStyle === 'circular') {
    const cx = W / 2
    const cy = H / 2
    const R = 180
    for (let i = 0; i < N; i++) {
      const angle = -Math.PI / 2 + (i * (2 * Math.PI)) / N
      coords.push({
        x: cx + R * Math.cos(angle),
        y: cy + R * Math.sin(angle)
      })
    }
  } else if (pathStyle === 'radial') {
    // Hub and spokes
    // Step 0 is the center hub, others are radial spokes
    coords.push({ x: W / 2, y: H / 2 })
    const outerCount = N - 1
    const cx = W / 2
    const cy = H / 2
    const R = 200
    for (let i = 0; i < outerCount; i++) {
      const angle = -Math.PI / 2 + (i * (2 * Math.PI)) / outerCount
      coords.push({
        x: cx + R * Math.cos(angle),
        y: cy + R * Math.sin(angle)
      })
    }
  } else {
    // DEFAULT: serpentine S-curve (2 rows max, e.g. up to 8 steps)
    // Row 0: steps 0..3 going left-to-right (Y = 180)
    // Row 1: steps 4..7 going right-to-left (Y = 420)
    const row0Y = 180
    const row1Y = 420
    const colWidth = 165
    const startX = 150

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

  // Draw Path Connectors
  let pathD = ''
  if (pathStyle === 'linear-h' || pathStyle === 'linear-v' || pathStyle === 'zigzag') {
    if (N > 1) {
      pathD = `M ${coords[0].x} ${coords[0].y} `
      for (let i = 1; i < N; i++) {
        pathD += `L ${coords[i].x} ${coords[i].y} `
      }
    }
  } else if (pathStyle === 'circular') {
    if (N > 1) {
      // Draw circular loop path
      const cx = W / 2
      const cy = H / 2
      const R = 180
      pathD = `M ${cx + R} ${cy} A ${R} ${R} 0 1 1 ${cx + R - 0.01} ${cy}`
    }
  } else if (pathStyle === 'radial') {
    // Spokes from center (coords[0]) to all outer points
    pathD = ''
    for (let i = 1; i < N; i++) {
      pathD += `M ${coords[0].x} ${coords[0].y} L ${coords[i].x} ${coords[i].y} `
    }
  } else {
    // SERPENTINE S-Curve path
    if (N > 1) {
      const row0Y = 180
      const row1Y = 420
      const startX = 150
      const endX = startX + 3 * 165

      if (N <= 4) {
        // Simple straight horizontal line
        pathD = `M ${coords[0].x} ${row0Y} L ${coords[N - 1].x} ${row0Y}`
      } else {
        // Horizontal line row 0, right loop down, horizontal line row 1
        pathD = `M ${coords[0].x} ${row0Y} L ${endX} ${row0Y} `
        // Bezier loop from row 0 to row 1 on the right side
        pathD += `C ${endX + 110} ${row0Y}, ${endX + 110} ${row1Y}, ${endX} ${row1Y} `
        // Horizontal line row 1 going back left
        pathD += `L ${coords[N - 1].x} ${row1Y}`
      }
    }
  }

  const isDashed = connectorStyle === 'dashed'
  const isDouble = connectorStyle === 'double'

  // Draw miniature architectural vector illustration inside empty image nodes
  const renderMiniIllustration = (idx: number, size = 56) => {
    const strokeC = lineColor
    const fillC = nodeBgColor
    const center = size / 2

    // Alternate vector blueprints so they look like a real process
    if (idx % 3 === 0) {
      // CAD Site Layout grid
      return (
        <g stroke={strokeC} strokeWidth="1" fill="none" opacity="0.6">
          <circle cx={center} cy={center} r={size * 0.38} strokeDasharray="2,2" />
          <line x1="0" y1={center} x2={size} y2={center} />
          <line x1={center} y1="0" x2={center} y2={size} />
          <line x1="10" y1="10" x2={size - 10} y2={size - 10} />
        </g>
      )
    } else if (idx % 3 === 1) {
      // 3D Isometric building box
      return (
        <g stroke={strokeC} strokeWidth="1.2" fill="none" opacity="0.65">
          <polygon points={`${center},${center - 12} ${center + 14},${center - 5} ${center},${center + 2} ${center - 14},${center - 5}`} />
          <line x1={center - 14} y1={center - 5} x2={center - 14} y2={center + 10} />
          <line x1={center + 14} y1={center - 5} x2={center + 14} y2={center + 10} />
          <line x1={center} y1={center + 2} x2={center} y2={center + 17} />
          <polygon points={`${center - 14},${center + 10} ${center},${center + 17} ${center + 14},${center + 10}`} />
        </g>
      )
    } else {
      // Compass / Architectural drafting divider tool
      return (
        <g stroke={strokeC} strokeWidth="1" fill="none" opacity="0.6">
          <line x1={center} y1="8" x2={center - 10} y2={size - 10} strokeWidth="1.5" />
          <line x1={center} y1="8" x2={center + 10} y2={size - 10} strokeWidth="1.5" />
          <circle cx={center} cy="8" r="3" fill={strokeC} />
          <line x1={center - 6} y1={center} x2={center + 6} y2={center} />
        </g>
      )
    }
  }

  const bgStyle: React.CSSProperties = {
    backgroundColor: config?.bgEnabled ? (config.bgColor || '#ffffff') : 'transparent',
    opacity: config?.bgEnabled ? (config.bgOpacity ?? 1) : 1
  }

  return (
    <div className="w-full h-full relative flex items-center justify-center rounded-lg" style={bgStyle}>
      <svg
        viewBox={viewBoxStr}
        className="w-full h-full object-contain"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Draw Path Connection Lines */}
        {pathD && (
          <>
            {isDouble ? (
              <>
                <path
                  d={pathD}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth={lineWidth + 2}
                  strokeDasharray={isDashed ? '6,6' : 'none'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={lineWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            ) : (
              <path
                d={pathD}
                fill="none"
                stroke={lineColor}
                strokeWidth={lineWidth}
                strokeDasharray={isDashed ? '6,6' : 'none'}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </>
        )}

        {/* Draw Nodes & Text labels */}
        {steps.map((step, idx) => {
          const coord = coords[idx]
          if (!coord) return null

          const isLeftRow = idx >= 4 // serpentine wrap direction is reversed
          const textRight = pathStyle === 'linear-v' || (!isLeftRow && idx % 2 === 0) || (isLeftRow && idx % 2 === 1)

          // Alternating labels above/below nodes for horizontal paths
          const textYOffset = pathStyle === 'linear-h' || pathStyle === 'zigzag' || pathStyle === 'serpentine'
            ? (idx % 2 === 0 ? -75 : 75)
            : 0

          const textXOffset = pathStyle === 'linear-v'
            ? 75
            : (textRight ? 75 : -235)

          const labelX = coord.x + (textYOffset === 0 ? textXOffset : 0)
          const labelY = coord.y + textYOffset

          // Node shapes
          const size = 56
          const r = size / 2

          return (
            <g key={step.id} className="select-none">
              {/* Node Geometry */}
              <g transform={`translate(${coord.x - r}, ${coord.y - r})`}>
                {nodeStyle === 'hexagon' ? (
                  <polygon
                    points={`${r},0 ${size},${size * 0.28} ${size},${size * 0.72} ${r},${size} 0,${size * 0.72} 0,${size * 0.28}`}
                    fill={nodeBgColor}
                    stroke={nodeBorderColor}
                    strokeWidth="2"
                  />
                ) : nodeStyle === 'minimal-dot' ? (
                  <circle
                    cx={r}
                    cy={r}
                    r={12}
                    fill={nodeBorderColor}
                  />
                ) : (
                  // Circle
                  <circle
                    cx={r}
                    cy={r}
                    r={r - 1}
                    fill={nodeBgColor}
                    stroke={nodeBorderColor}
                    strokeWidth="2.5"
                  />
                )}

                {/* Node Inner Contents */}
                {nodeStyle === 'image' && (
                  <>
                    {step.imageUrl ? (
                      <>
                        <defs>
                          <clipPath id={`clip-${step.id}`}>
                            <circle cx={r} cy={r} r={r - 2} />
                          </clipPath>
                        </defs>
                        <image
                          href={step.imageUrl}
                          width={size}
                          height={size}
                          clipPath={`url(#clip-${step.id})`}
                          preserveAspectRatio="xMidYMid slice"
                        />
                      </>
                    ) : (
                      renderMiniIllustration(idx, size)
                    )}
                  </>
                )}

                {nodeStyle === 'number' && (
                  <text
                    x={r}
                    y={r + 5}
                    textAnchor="middle"
                    fill={textColor}
                    fontSize="16"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </text>
                )}

                {nodeStyle === 'hexagon' && (
                  <text
                    x={r}
                    y={r + 4}
                    textAnchor="middle"
                    fill={textColor}
                    fontSize="13"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </text>
                )}
              </g>

              {/* Text Label Block */}
              {nodeStyle !== 'minimal-dot' && (
                <g transform={`translate(${labelX}, ${coord.y - 30 + (textYOffset !== 0 ? textYOffset / 3.5 : 0)})`}>
                  <rect
                    x="-5"
                    y="-5"
                    width="170"
                    height="70"
                    fill="white"
                    fillOpacity="0.85"
                    rx="4"
                    style={{ pointerEvents: 'none' }}
                  />
                  <text
                    x="0"
                    y="14"
                    fontSize="13"
                    fontWeight="bold"
                    fill={textColor}
                    fontFamily="Inter, sans-serif"
                  >
                    {step.title}
                  </text>
                  {/* Wrap text using foreignObject or simple SVG tspans */}
                  <text
                    x="0"
                    y="30"
                    fontSize="9.5"
                    fill="#475569"
                    fontFamily="Inter, sans-serif"
                    width="160"
                  >
                    {step.description.length > 32 ? (
                      <>
                        <tspan x="0" dy="0">{step.description.slice(0, 32)}...</tspan>
                        <tspan x="0" dy="12">{step.description.slice(32, 60)}</tspan>
                      </>
                    ) : (
                      step.description
                    )}
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
