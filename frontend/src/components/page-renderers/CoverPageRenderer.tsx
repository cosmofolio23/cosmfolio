'use client'

import { StylePackTokens } from '@/types/portfolio'
import { PageFrame } from './PageFrame'

export function CoverPageRenderer({ content, tokens, overlays }: any) {
  return (
    <PageFrame tokens={tokens} overlays={overlays} pageNumber={1}>
      <div className="h-full flex flex-col items-center justify-center text-center">
        <h1 style={{ fontSize: tokens.fonts.heading.size, fontFamily: tokens.fonts.heading.family, color: tokens.colors.text.primary }}>
          {content.title}
        </h1>
        <p style={{ fontSize: tokens.fonts.subheading.size, fontFamily: tokens.fonts.subheading.family, color: tokens.colors.text.secondary, marginTop: '20px' }}>
          {content.subtitle}
        </p>
      </div>
    </PageFrame>
  )
}
