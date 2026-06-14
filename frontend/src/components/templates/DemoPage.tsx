'use client'

/**
 * DemoPage — renders ONE layout spec as a realistic, filled portfolio page.
 * Image slots become architectural artwork (demoArt); text slots become real
 * demo copy; everything themed by the template's palette + fonts. Shared by
 * TemplateSpread (gallery cards) and the browsable spread libraries.
 */

import { type LayoutSpec, type Region } from '@/components/composer/layoutSpecs'
import { archArt, artKindForIndex, type DemoPalette, type DemoProject } from './demoArt'

export interface PageContent {
  title?: string
  subtitle?: string
  body?: string
  /** override the per-index art kind cycling (e.g. force portrait first) */
  firstArt?: Parameters<typeof archArt>[0]
  project?: DemoProject
  legendItems?: string[]
  metaItems?: string[]
  seed: number
}

export function DemoPage({
  spec, p, fonts, content,
}: {
  spec: LayoutSpec
  p: DemoPalette
  fonts: { heading: string; body: string }
  content: PageContent
}) {
  const overlay = spec.kind === 'overlay'
  const imgRegions = spec.regions.filter(r => r.role === 'image')
  const onImg = overlay ? '#ffffff' : p.text
  const titleColor = overlay ? '#ffffff' : p.primary

  const gridStyle = (r: Region): React.CSSProperties => ({
    gridColumn: `${r.c0} / span ${r.cs}`, gridRow: `${r.r0} / span ${r.rs}`, minHeight: 0, minWidth: 0,
  })

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: p.bg, color: p.text, fontFamily: fonts.body, containerType: 'size' as any }}
    >
      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gridTemplateRows: 'repeat(12, 1fr)', gap: '1.2cqmin', padding: '4cqmin' }}>
        {spec.regions.map((r, i) => {
          const st = gridStyle(r)
          if (r.role === 'image') {
            const idx = imgRegions.indexOf(r)
            const kind = idx === 0 && content.firstArt ? content.firstArt
              : content.project ? artKindForIndex(idx, imgRegions.length) : 'render'
            return (
              <div key={i} style={{ ...st, zIndex: overlay ? 0 : 1 }} className="overflow-hidden"
                dangerouslySetInnerHTML={{ __html: archArt(kind, p, content.seed + idx * 7) }} />
            )
          }
          if (r.role === 'title') {
            return (
              <div key={i} style={{ ...st, zIndex: 10 }} className="flex flex-col justify-end overflow-hidden">
                <div style={{ fontFamily: fonts.heading, color: titleColor, fontWeight: 700, fontSize: `${Math.min(7, 2.6 + r.rs * 0.7)}cqh`, lineHeight: 1.02, letterSpacing: '-0.01em' }}>
                  {content.title || 'Portfolio'}
                </div>
              </div>
            )
          }
          if (r.role === 'subtitle') {
            return (
              <div key={i} style={{ ...st, zIndex: 10 }} className="flex items-center overflow-hidden">
                <div style={{ color: overlay ? '#f0f0f0' : p.accent, fontSize: '2.6cqh', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                  {content.subtitle || ''}
                </div>
              </div>
            )
          }
          if (r.role === 'text') {
            return (
              <div key={i} style={{ ...st, zIndex: 10, color: onImg }} className="overflow-hidden">
                <div style={{ fontSize: '2.5cqh', lineHeight: 1.4, opacity: 0.85 }}>{content.body || ''}</div>
              </div>
            )
          }
          const items = r.role === 'legend'
            ? (content.legendItems || ['Site', 'Program', 'Structure'])
            : (content.metaItems || [content.project?.location || 'Location', content.project?.year || '2026'])
          return (
            <div key={i} style={{ ...st, zIndex: 10 }} className="flex flex-col justify-center gap-[1cqh] overflow-hidden">
              {items.map((t, k) => (
                <div key={k} className="flex items-center gap-[1cqw]" style={{ fontSize: '2.1cqh', color: onImg, opacity: 0.82 }}>
                  <span style={{ width: '2cqh', height: '2cqh', background: p.accent, display: 'inline-block', borderRadius: 1, flex: '0 0 auto' }} />
                  <span className="truncate">{t}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
      {overlay && <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: '62%', background: 'linear-gradient(to top, rgba(0,0,0,0.62), transparent)' }} />}
    </div>
  )
}
