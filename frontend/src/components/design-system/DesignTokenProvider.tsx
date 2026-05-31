'use client'

import React, { createContext, useContext } from 'react'
import { StylePackTokens } from '@/types/portfolio'
import { getStylePack, getStylePackCSS } from '@/lib/stylePackDefinitions'

interface DesignTokenContextType {
  tokens: StylePackTokens
  cssVariables: Record<string, string>
  getColor: (path: string) => string
  getSpacing: (key: keyof StylePackTokens['spacing']) => string
  getFont: (key: keyof StylePackTokens['fonts']) => StylePackTokens['fonts'][typeof key]
}

const DesignTokenContext = createContext<DesignTokenContextType | undefined>(undefined)

export function DesignTokenProvider({
  children,
  stylePackId = 'minimal-white',
}: {
  children: React.ReactNode
  stylePackId?: string
}) {
  const tokens = getStylePack(stylePackId)
  const cssVariables = getStylePackCSS(tokens)

  const getColor = (path: string): string => {
    const parts = path.split('.')
    let value: any = tokens.colors

    for (const part of parts) {
      value = value[part]
      if (value === undefined) return '#000000'
    }

    return typeof value === 'string' ? value : '#000000'
  }

  const getSpacing = (key: keyof StylePackTokens['spacing']) => tokens.spacing[key]

  const getFont = (key: keyof StylePackTokens['fonts']) => tokens.fonts[key]

  const value: DesignTokenContextType = {
    tokens,
    cssVariables,
    getColor,
    getSpacing,
    getFont,
  }

  return (
    <DesignTokenContext.Provider value={value}>
      <div
        style={{
          ...Object.entries(cssVariables).reduce(
            (acc, [key, val]) => ({
              ...acc,
              [key]: val,
            }),
            {} as React.CSSProperties
          ),
        } as React.CSSProperties}
      >
        {children}
      </div>
    </DesignTokenContext.Provider>
  )
}

export function useDesignTokens() {
  const context = useContext(DesignTokenContext)
  if (!context) {
    throw new Error('useDesignTokens must be used within DesignTokenProvider')
  }
  return context
}
