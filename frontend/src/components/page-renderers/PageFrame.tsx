'use client'

import React from 'react'
import { StylePackTokens, OverlayConfig } from '@/types/portfolio'
import { useDesignTokens } from '@/components/design-system/DesignTokenProvider'

interface PageFrameProps {
  children: React.ReactNode
  tokens: StylePackTokens
  overlays?: OverlayConfig[]
  pageNumber?: number
  className?: string
}

export function PageFrame({ children, tokens, overlays = [], pageNumber, className = '' }: PageFrameProps) {
  const designTokens = useDesignTokens()

  // Apply overlays on top of page
  const renderOverlays = () => {
    return overlays
      .filter((o) => o.enabled)
      .map((overlay) => (
        <div key={overlay.id} className="absolute inset-0 pointer-events-none">
          {renderOverlay(overlay)}
        </div>
      ))
  }

  const renderOverlay = (overlay: OverlayConfig) => {
    const { type, settings } = overlay

    switch (type) {
      case 'color':
        return (
          <div
            className="w-full h-full"
            style={{
              backgroundColor: settings.color || '#000000',
              opacity: settings.opacity || 0.3,
            }}
          />
        )

      case 'gradient':
        return (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(
                ${settings.gradientAngle || 135}deg,
                ${settings.gradientFrom || '#000000'},
                ${settings.gradientTo || '#FFFFFF'}
              )`,
              opacity: settings.opacity || 0.3,
            }}
          />
        )

      case 'pattern':
        return (
          <svg className="w-full h-full" style={{ opacity: settings.opacity || 0.1 }}>
            <defs>
              <pattern id={`pattern-${overlay.id}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                {settings.patternType === 'dots' && <circle cx="10" cy="10" r="2" fill="currentColor" />}
                {settings.patternType === 'lines' && <line x1="0" y1="0" x2="20" y2="20" stroke="currentColor" strokeWidth="1" />}
                {settings.patternType === 'grid' && (
                  <>
                    <line x1="0" y1="0" x2="20" y2="0" stroke="currentColor" strokeWidth="0.5" />
                    <line x1="0" y1="0" x2="0" y2="20" stroke="currentColor" strokeWidth="0.5" />
                  </>
                )}
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#pattern-${overlay.id})`} />
          </svg>
        )

      case 'text':
        return (
          <div className="w-full h-full flex items-center justify-center" style={{ opacity: settings.opacity || 0.15 }}>
            <div
              style={{
                fontSize: settings.fontSize || '72px',
                fontWeight: 'bold',
                color: settings.textColor || '#000000',
                textAlign: 'center',
                transform: 'rotate(-45deg)',
              }}
            >
              {settings.text || 'TEXT'}
            </div>
          </div>
        )

      case 'vignette':
        return (
          <svg className="w-full h-full" style={{ opacity: settings.opacity || 0.4 }}>
            <defs>
              <radialGradient id={`vignette-${overlay.id}`}>
                <stop offset="0%" stopColor="transparent" />
                <stop offset="70%" stopColor="transparent" />
                <stop offset="100%" stopColor="#000000" />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill={`url(#vignette-${overlay.id})`} />
          </svg>
        )

      case 'blur':
        return (
          <div
            className="w-full h-full"
            style={{
              backgroundColor: settings.color || '#FFFFFF',
              opacity: settings.opacity || 0.2,
              backdropFilter: `blur(${settings.blurAmount || 8}px)`,
            }}
          />
        )

      default:
        return null
    }
  }

  return (
    <div
      className={`relative bg-white overflow-hidden ${className}`}
      style={{
        backgroundColor: tokens.colors.background,
        color: tokens.colors.text.primary,
        fontFamily: tokens.fonts.body.family,
        fontSize: tokens.fonts.body.size,
        lineHeight: tokens.fonts.body.lineHeight,
        padding: tokens.spacing.pageMargin,
      }}
    >
      <div className="relative z-10">{children}</div>

      {pageNumber !== undefined && tokens.pageNumber.position !== 'none' && (
        <div
          className="absolute text-xs"
          style={{
            fontFamily: tokens.fonts.pageNumber.family,
            fontSize: tokens.fonts.pageNumber.size,
            letterSpacing: tokens.fonts.pageNumber.letterSpacing,
            color: tokens.colors.text.tertiary,
          }}
        >
          {formatPageNumber(pageNumber, tokens.pageNumber.format)}
        </div>
      )}

      {renderOverlays()}
    </div>
  )
}

function formatPageNumber(num: number, format: string): string {
  switch (format) {
    case 'roman':
      return toRoman(num)
    case 'dash':
      return `— ${num} —`
    case 'dot':
      return `• ${num} •`
    case 'numeric':
    default:
      return num.toString()
  }
}

function toRoman(num: number): string {
  const romanMap = [
    { value: 1000, numeral: 'M' },
    { value: 900, numeral: 'CM' },
    { value: 500, numeral: 'D' },
    { value: 400, numeral: 'CD' },
    { value: 100, numeral: 'C' },
    { value: 90, numeral: 'XC' },
    { value: 50, numeral: 'L' },
    { value: 40, numeral: 'XL' },
    { value: 10, numeral: 'X' },
    { value: 9, numeral: 'IX' },
    { value: 5, numeral: 'V' },
    { value: 4, numeral: 'IV' },
    { value: 1, numeral: 'I' },
  ]

  let roman = ''
  for (const { value, numeral } of romanMap) {
    while (num >= value) {
      roman += numeral
      num -= value
    }
  }
  return roman
}
