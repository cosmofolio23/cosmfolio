/**
 * Composition Engine — the "AI portfolio brain" (Phase 1, rule-based).
 *
 * Turns a project's CATEGORIZED assets into an architecturally-sequenced page
 * plan, choosing layouts by their DNA (category / suits / imageCount) and
 * assigning specific assets to each page. No vision model required — it uses
 * the asset category the user already provides on upload, plus architectural
 * storytelling order:
 *
 *   Cover → Concept → Site/Plans → Sections/Elevations → Experience(Renders) → Contact
 *
 * Output is a Page[] ready for the parametric PageComposer.
 */

import { LAYOUT_CATALOG, type LayoutSpec, type LayoutCategory } from './layoutSpecs'
import { createBlock, uid, type Page, type Block, type PageType } from './types'

export interface ProjectInfo {
  name?: string
  location?: string
  year?: string
  typology?: string
  description?: string
}

export interface ComposeOptions {
  project?: ProjectInfo
  /** category (render/plan/section/diagram/detail/material/cover/elevation/concept/model/process) -> image urls */
  assetsByCategory: Record<string, string[]>
  /** desired number of project content pages (excluding cover/about/contact); auto if omitted */
  targetProjectPages?: number
}

const urls = (a?: any[]): string[] =>
  (a || []).map(x => (typeof x === 'string' ? x : x?.file_url || x?.url)).filter((u): u is string => !!u && u.startsWith('http'))

/** Pick the best layout for a page: prefer category, then closest imageCount. */
function pickLayout(type: PageType, imageCount: number, preferCats: LayoutCategory[]): LayoutSpec {
  const suited = LAYOUT_CATALOG.filter(s => s.suits.includes(type))
  let pool = suited.filter(s => preferCats.includes(s.category))
  if (!pool.length) pool = suited.length ? suited : LAYOUT_CATALOG
  pool = [...pool].sort((a, b) => Math.abs(a.imageCount - imageCount) - Math.abs(b.imageCount - imageCount))
  return pool[0] || LAYOUT_CATALOG[0]
}

function imageBlocks(type: Block['type'], list: string[], label: (i: number) => string): Block[] {
  return list.map((url, i) => ({ ...createBlock(type), imageUrl: url, label: label(i) }))
}

/** Build the architectural storytelling chapters from available assets. */
interface Chapter {
  title: string
  pageType: PageType
  prefer: LayoutCategory[]
  blockType: Block['type']
  images: string[]
  withMeta?: boolean
  withDescription?: boolean
}

export function composePages(opts: ComposeOptions): Page[] {
  const a = opts.assetsByCategory || {}
  const proj = opts.project || {}

  // group raw categories into architectural buckets
  const renders = [...urls(a.render), ...urls(a.cover)]
  const plans = [...urls(a.plan), ...urls(a.site)]
  const sections = [...urls(a.section), ...urls(a.elevation)]
  const diagrams = [...urls(a.diagram), ...urls(a.concept)]
  const process = [...urls(a.process), ...urls(a.model), ...urls(a.material), ...urls(a.detail)]

  const pages: Page[] = []
  const title = proj.name || 'Project'

  // ── COVER — hero render if available, else typographic ──
  const coverImgs = renders.slice(0, 1)
  const coverSpec = pickLayout('cover', coverImgs.length, coverImgs.length ? ['Cover'] : ['Cover', 'Text'])
  pages.push({
    id: 'cover-0', type: 'cover', layoutId: coverSpec.id,
    blocks: [
      { ...createBlock('title'), text: title },
      { ...createBlock('subtitle'), text: [proj.typology, proj.location, proj.year].filter(Boolean).join(' · ') || 'Architecture & Design' },
      ...imageBlocks('render', coverImgs, () => 'Cover Image'),
    ],
  })

  // ── ABOUT / CONCEPT — description + a couple of diagrams ──
  if (proj.description || diagrams.length) {
    const aboutImgs = diagrams.slice(0, 1)
    const aboutSpec = aboutImgs.length ? pickLayout('about', 1, ['Text']) : pickLayout('about', 0, ['Text'])
    pages.push({
      id: 'about-1', type: 'about', layoutId: aboutSpec.id,
      blocks: [
        { ...createBlock('title'), text: 'Concept' },
        { ...createBlock('description'), text: proj.description || 'Design concept and approach.' },
        ...imageBlocks('diagram', aboutImgs, () => 'Concept Diagram'),
      ],
    })
  }

  // ── PROJECT CHAPTERS in architectural hierarchy order ──
  const remainingDiagrams = diagrams.slice(1) // first used in concept
  const allChapters: Chapter[] = [
    { title: 'Concept Development', pageType: 'project', prefer: ['Strip', 'Grid', 'Asymmetric'], blockType: 'diagram', images: remainingDiagrams, withDescription: true },
    { title: 'Process', pageType: 'project', prefer: ['Grid', 'Strip'], blockType: 'diagram', images: process },
    { title: 'Plans', pageType: 'project', prefer: ['Hero', 'Grid', 'Single'], blockType: 'plan', images: plans, withMeta: true },
    { title: 'Sections & Elevations', pageType: 'project', prefer: ['Strip', 'Duo', 'Single'], blockType: 'section', images: sections, withMeta: true },
    { title: 'Experience', pageType: 'project', prefer: ['Hero', 'Grid', 'Single'], blockType: 'render', images: renders.slice(1), withDescription: true },
  ]
  const chapters: Chapter[] = allChapters.filter(c => c.images.length > 0)

  // optionally cap to a target number of project pages by merging the smallest
  const maxPages = opts.targetProjectPages
  let active = chapters
  if (maxPages && chapters.length > maxPages) active = chapters.slice(0, maxPages)

  active.forEach((ch, idx) => {
    const n = Math.min(ch.images.length, 9)
    const spec = pickLayout(ch.pageType, n, ch.prefer)
    const blocks: Block[] = [{ ...createBlock('title'), text: ch.title }]
    if (ch.withMeta) {
      blocks.push({
        ...createBlock('meta'),
        fields: [
          { label: 'Location', value: proj.location || '—' },
          { label: 'Year', value: proj.year || '—' },
          { label: 'Typology', value: proj.typology || '—' },
        ],
      })
    }
    if (ch.withDescription) blocks.push(createBlock('description'))
    blocks.push(...imageBlocks(ch.blockType, ch.images.slice(0, n), i => `${ch.title} ${String(i + 1).padStart(2, '0')}`))
    pages.push({ id: `project-${idx + 2}`, type: 'project', layoutId: spec.id, blocks })
  })

  // ── CONTACT ──
  pages.push({
    id: 'contact-end', type: 'contact', layoutId: pickLayout('contact', 0, ['Contact']).id,
    blocks: [
      { ...createBlock('title'), text: 'Get in Touch' },
      { ...createBlock('description'), text: 'hello@yourstudio.com\nyourstudio.com' },
    ],
  })

  return pages
}

/** A human-readable plan summary, for the structure-preview UI (Phase 2). */
export function describePlan(pages: Page[]): { id: string; type: string; title: string; layout: string }[] {
  return pages.map(p => ({
    id: p.id,
    type: p.type,
    title: (p.blocks.find(b => b.type === 'title')?.text) || p.type,
    layout: p.layoutId,
  }))
}
