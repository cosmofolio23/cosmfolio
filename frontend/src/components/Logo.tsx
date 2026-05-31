import React from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  variant?: 'light' | 'dark' | 'gold'
  className?: string
}

/**
 * COSMO FOLIO Official Logo
 * VR Glasses + Cosmic Nodes Design
 * Gold color: #D4AF37
 */
export default function Logo({
  size = 'md',
  animated = false,
  variant = 'gold',
  className = '',
}: LogoProps) {
  const sizeMap = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 80, height: 80 },
  }

  const colorMap = {
    light: '#111111',
    dark: '#FFFFFF',
    gold: '#D4AF37',
  }

  const { width, height } = sizeMap[size]
  const color = colorMap[variant]

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animated ? 'animate-spin' : ''} ${className}`}
    >
      {/* Cosmic Node Top Left */}
      <circle cx="35" cy="30" r="6" fill={color} />
      <line x1="35" y1="36" x2="70" y2="70" stroke={color} strokeWidth="1.5" />

      {/* Main Circle - Outer Ring */}
      <circle cx="100" cy="100" r="70" stroke={color} strokeWidth="4" fill="none" />

      {/* VR Glasses Frame */}
      <g fill="none" stroke={variant === 'gold' ? '#000000' : color} strokeWidth="3">
        {/* Left Lens */}
        <rect x="45" y="80" width="30" height="28" rx="4" ry="4" />
        {/* Right Lens */}
        <rect x="125" y="80" width="30" height="28" rx="4" ry="4" />
        {/* Bridge */}
        <line x1="75" y1="94" x2="125" y2="94" />
      </g>

      {/* Left Lens Details - Grid Pattern */}
      <g
        stroke={variant === 'gold' ? '#000000' : color}
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      >
        <line x1="52" y1="80" x2="52" y2="108" />
        <line x1="60" y1="80" x2="60" y2="100" />
        <line x1="45" y1="88" x2="75" y2="88" />
        <line x1="45" y1="96" x2="70" y2="96" />
      </g>

      {/* Right Lens Details - Lines Pattern */}
      <g
        stroke={variant === 'gold' ? '#000000' : color}
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      >
        <line x1="130" y1="82" x2="150" y2="82" />
        <line x1="130" y1="88" x2="150" y2="88" />
        <line x1="130" y1="94" x2="150" y2="94" />
        <line x1="130" y1="100" x2="150" y2="100" />
        <line x1="130" y1="106" x2="145" y2="106" />
      </g>

      {/* Cosmic Node Bottom Right */}
      <circle cx="165" cy="170" r="6" fill={color} />
      <line x1="165" y1="164" x2="130" y2="130" stroke={color} strokeWidth="1.5" />

      {/* Optional Glow Effect for Animated State */}
      {animated && (
        <circle
          cx="100"
          cy="100"
          r="75"
          stroke={color}
          strokeWidth="2"
          fill="none"
          opacity="0.3"
          className="animate-pulse"
        />
      )}
    </svg>
  )
}
