import React from 'react'
import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
  variant?: 'light' | 'dark' | 'gold'
  className?: string
  /** Render the "COSMO / FOLIO" wordmark beneath the mark. */
  showWordmark?: boolean
  /** Use the uploaded image logo instead of SVG */
  useImage?: boolean
}

/**
 * COSMO·FOLIO official logo.
 * Uses the custom uploaded logo.png by default; falls back to the original
 * gold gradient ring SVG glyph if needed.
 */
export default function Logo({
  size = 'md',
  animated = false,
  variant = 'gold',
  className = '',
  showWordmark = false,
  useImage = true,
}: LogoProps) {
  const sizeMap = {
    sm: 32, md: 48, lg: 80, xl: 128,
  }
  const px = sizeMap[size]

  // Use the image logo by default
  if (useImage) {
    return (
      <div className={`inline-flex flex-col items-center ${className}`}>
        <Image
          src="/logo.png"
          alt="COSMO FOLIO"
          width={px}
          height={px}
          className={animated ? 'animate-[spin_18s_linear_infinite]' : ''}
          priority
        />
        {showWordmark && (
          <div className="mt-2 text-center leading-none select-none">
            <div className="font-semibold tracking-[0.32em]" style={{ fontSize: px * 0.22, color: '#C99B30' }}>
              COSMO
            </div>
            <div className="tracking-[0.5em] mt-0.5" style={{ fontSize: px * 0.12, color: '#C99B30' }}>
              FOLIO
            </div>
          </div>
        )}
      </div>
    )
  }

  // Unique gradient id so multiple logos on a page don't collide.
  const gid = React.useId().replace(/[:]/g, '')

  // Stroke/fill color. `gold` uses the gradient; others use a flat color.
  const flat = variant === 'light' ? '#111111' : variant === 'dark' ? '#FFFFFF' : '#D4AF37'
  const stroke = variant === 'gold' ? `url(#grad-${gid})` : flat
  // The glyph interior reads against the ring — dark on gold, inverse otherwise.
  const glyphBg = variant === 'gold' ? '#0B0B0B' : 'transparent'

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg
        width={px}
        height={px}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={animated ? 'animate-[spin_18s_linear_infinite]' : ''}
      >
        <defs>
          <linearGradient id={`grad-${gid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FBE7A1" />
            <stop offset="35%" stopColor="#E5C66B" />
            <stop offset="65%" stopColor="#C99B30" />
            <stop offset="100%" stopColor="#9C7416" />
          </linearGradient>
        </defs>

        {/* Orbital axis + nodes (top-left, bottom-right) */}
        <line x1="44" y1="40" x2="78" y2="74" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <circle cx="40" cy="36" r="8" fill={stroke} />
        <line x1="122" y1="126" x2="156" y2="160" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <circle cx="160" cy="164" r="8" fill={stroke} />

        {/* Outer ring */}
        <circle cx="100" cy="100" r="66" stroke={stroke} strokeWidth="5" fill="none" />

        {/* Portfolio "spread / goggles" glyph */}
        <g>
          {/* body */}
          <path
            d="M58 78 H142 a8 8 0 0 1 8 8 V112 a8 8 0 0 1 -8 8 H112 l-12 12 l-12 -12 H58 a8 8 0 0 1 -8 -8 V86 a8 8 0 0 1 8 -8 Z"
            fill={glyphBg}
            stroke={stroke}
            strokeWidth="4"
            strokeLinejoin="round"
          />
          {/* left page: little layout grid */}
          <g stroke={stroke} strokeWidth="2.4" fill="none">
            <rect x="64" y="86" width="30" height="26" rx="2" />
            <line x1="74" y1="86" x2="74" y2="112" />
            <line x1="74" y1="99" x2="94" y2="99" />
          </g>
          {/* right page: text lines */}
          <g stroke={stroke} strokeWidth="2.4" strokeLinecap="round">
            <line x1="108" y1="90" x2="136" y2="90" />
            <line x1="108" y1="97" x2="136" y2="97" />
            <line x1="108" y1="104" x2="128" y2="104" />
          </g>
        </g>

        {animated && (
          <circle cx="100" cy="100" r="72" stroke={stroke} strokeWidth="1.5" fill="none" opacity="0.25" className="animate-pulse" />
        )}
      </svg>

      {showWordmark && (
        <div className="mt-2 text-center leading-none select-none">
          <div
            className="font-semibold tracking-[0.32em]"
            style={{
              fontSize: px * 0.22,
              backgroundImage: variant === 'gold' ? 'linear-gradient(135deg,#FBE7A1,#C99B30,#9C7416)' : undefined,
              WebkitBackgroundClip: variant === 'gold' ? 'text' : undefined,
              WebkitTextFillColor: variant === 'gold' ? 'transparent' : undefined,
              color: variant === 'gold' ? undefined : flat,
            }}
          >
            COSMO
          </div>
          <div
            className="tracking-[0.5em] mt-0.5"
            style={{ fontSize: px * 0.12, color: variant === 'gold' ? '#C99B30' : flat }}
          >
            FOLIO
          </div>
        </div>
      )}
    </div>
  )
}
