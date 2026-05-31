'use client'

import { PageFrame } from './PageFrame'

export function AboutPageRenderer({ content, tokens, overlays }: any) {
  return (
    <PageFrame tokens={tokens} overlays={overlays}>
      <div>
        <h1 style={{ fontSize: tokens.fonts.heading.size, fontFamily: tokens.fonts.heading.family }}>{content.name}</h1>
        <p style={{ marginTop: '20px', lineHeight: '1.8' }}>{content.bio}</p>
      </div>
    </PageFrame>
  )
}
