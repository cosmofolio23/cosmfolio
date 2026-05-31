'use client'

import { PageFrame } from './PageFrame'

export function ContentsPageRenderer({ pages, tokens, overlays }: any) {
  return (
    <PageFrame tokens={tokens} overlays={overlays}>
      <h1 style={{ fontSize: tokens.fonts.heading.size, fontFamily: tokens.fonts.heading.family, marginBottom: '40px' }}>Contents</h1>
      <div style={{ fontSize: tokens.fonts.body.size }}>
        {pages?.map((page: any, i: number) => (
          <div key={i} style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
            <span>{page.title}</span>
            <span>{i + 1}</span>
          </div>
        ))}
      </div>
    </PageFrame>
  )
}
