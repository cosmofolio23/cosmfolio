'use client'

/**
 * TemplateSpread — REALISTIC, layout-driven template preview.
 *
 * Renders the template's real cover + about + project pages, but instead of
 * empty grey boxes every slot is filled with believable demo content:
 * architectural artwork (renders/plans/sections/elevations/diagrams via
 * demoArt) and real demo text, all themed by the template's own palette/fonts.
 * Users see "this is how my portfolio will look", not a wireframe.
 */

import { getSpec, pickCoverSpec, pickProjectSpecForTemplate, type LayoutSpec, type Region } from '@/components/composer/layoutSpecs'
import {
  archArt, artKindForIndex, paletteFrom, DEMO_PROJECTS, ABOUT_DEMO,
  type DemoPalette, type DemoProject,
} from './demoArt'

interface SpreadTemplate {
  name: string
  colors?: Record<string, string>
  fonts?: Record<string, string>
  layouts?: any
  placeholders?: any
}

interface PageContent {
  title?: string
  subtitle?: string
  body?: string
  project?: DemoProject
  seed: number
}

/** One filled demo page rendered from a layout spec. */
function DemoPage({ spec, p, fonts, content }: { spec: LayoutSpec; p: DemoPalette; fonts: { heading: string; body: string }; content: PageContent }) {
  const overlay = spec.kind === 'overlay'
  const imgRegions = spec.regions.filter(r => r.role === 'image')

  const gridStyle = (r: Region): React.CSSProperties => ({
    gridColumn: `${r.c0} / span ${r.cs}`, gridRow: `${r.r0} / span ${r.rs}`, minHeight: 0, minWidth: 0,
  })

  const onImg = overlay ? '#ffffff' : p.text
  const titleColor = overlay ? '#ffffff' : p.primary

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
            const kind = content.project ? artKindForIndex(idx, imgRegions.length) : 'render'
            return (
              <div key={i} style={{ ...st, zIndex: overlay ? 0 : 1 }} className="overflow-hidden rounded-[0.5cqmin]"
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
          // legend / meta → small labelled chips
          const items = r.role === 'legend' ? ['Site', 'Program', 'Structure'] : [content.project?.location || 'Location', content.project?.year || '2026']
          return (
            <div key={i} style={{ ...st, zIndex: 10 }} className="flex flex-col justify-center gap-[1cqh] overflow-hidden">
              {items.map((t, k) => (
                <div key={k} className="flex items-center gap-[1cqw]" style={{ fontSize: '2.1cqh', color: onImg, opacity: 0.8 }}>
                  <span style={{ width: '2cqh', height: '2cqh', background: p.accent, display: 'inline-block', borderRadius: 1 }} />
                  {t}
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

export default function TemplateSpread({ template }: { template: SpreadTemplate }) {
  const p = paletteFrom(template.colors)
  const fonts = { heading: template.fonts?.heading || 'Georgia, serif', body: template.fonts?.body || 'Inter, sans-serif' }

  const coverSpec = getSpec(pickCoverSpec(template))
  const aboutSpec = getSpec('text.statement')
  const projectSpec = getSpec(pickProjectSpecForTemplate(template))

  const proj = DEMO_PROJECTS[0]
  const proj2 = DEMO_PROJECTS[2]
  const PAGE_AR = '210 / 297'

  return (
    <div className="w-full h-full flex items-center justify-center gap-[3%] p-[4%]" style={{ background: p.muted }}>
      {/* Prominent cover */}
      <div style={{ height: '100%', aspectRatio: PAGE_AR }} className="shadow-lg ring-1 ring-black/5">
        <DemoPage spec={coverSpec} p={p} fonts={fonts}
          content={{ title: template.name || proj.name, subtitle: 'Architecture Portfolio · 2026', project: proj, seed: 11 }} />
      </div>

      {/* Two inner pages stacked */}
      <div className="flex flex-col gap-[4%]" style={{ height: '100%' }}>
        <div style={{ height: 'calc(50% - 2%)', aspectRatio: PAGE_AR }} className="shadow-md ring-1 ring-black/5">
          <DemoPage spec={aboutSpec} p={p} fonts={fonts}
            content={{ title: ABOUT_DEMO.name, subtitle: ABOUT_DEMO.role, body: ABOUT_DEMO.about, seed: 5 }} />
        </div>
        <div style={{ height: 'calc(50% - 2%)', aspectRatio: PAGE_AR }} className="shadow-md ring-1 ring-black/5">
          <DemoPage spec={projectSpec} p={p} fonts={fonts}
            content={{ title: proj2.name, subtitle: `${proj2.typology} · ${proj2.year}`, body: proj2.blurb, project: proj2, seed: 23 }} />
        </div>
      </div>
    </div>
  )
}
