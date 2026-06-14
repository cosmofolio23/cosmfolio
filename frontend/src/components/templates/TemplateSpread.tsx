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

import { getSpec, pickCoverSpec, pickProjectSpecForTemplate } from '@/components/composer/layoutSpecs'
import { paletteFrom, DEMO_PROJECTS, ABOUT_DEMO } from './demoArt'
import { DemoPage } from './DemoPage'

interface SpreadTemplate {
  name: string
  colors?: Record<string, string>
  fonts?: Record<string, string>
  layouts?: any
  placeholders?: any
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
