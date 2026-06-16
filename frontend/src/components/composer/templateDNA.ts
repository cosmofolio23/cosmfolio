/**
 * Template Intelligence Engine — Template DNA.
 *
 * Every template is a set of parametric pages (layout + typed blocks). This
 * engine reads those pages and tells the user EXACTLY what each template needs:
 * smart image slots (what they accept + importance + orientation), text slots
 * (what to write), a per-page purpose, and an aggregate "required assets"
 * summary. It also auto-fills slots from a project's available assets.
 *
 * It's derived (not hand-authored per template) so it scales to any template.
 */

import { type Page, type PageType, type Block } from './types'

const IMAGE_TYPES = ['render', 'plan', 'section', 'diagram'] as const

/* ----------------------------- page purpose ----------------------------- */

export interface PagePurpose { purpose: string; needs: string[] }

const PAGE_PURPOSE: Record<PageType, PagePurpose> = {
  cover: { purpose: 'Cover', needs: ['Hero Render', 'Portfolio Name', 'Author Name', 'Year'] },
  about: { purpose: 'About', needs: ['Profile Image', 'Bio', 'Skills', 'Software'] },
  project: { purpose: 'Project', needs: ['Best Render', 'Project Name', 'Location', 'Typology', 'Description'] },
  contact: { purpose: 'Contact', needs: ['Email', 'Website', 'Social'] },
  resume: { purpose: 'Resume', needs: ['Name', 'Role', 'Contact', 'Experience', 'Skills'] },
  contents: { purpose: 'Contents', needs: ['Page List', 'Project Titles', 'Page Numbers'] },
}

/* ------------------------- image-slot requirements ---------------------- */

export type Importance = 'mandatory' | 'required' | 'recommended'

interface SlotRule { name: string; accepts: string[]; orientation: 'landscape' | 'portrait' | 'square' | 'any'; importance: Importance }

/** What an image of a given block-type / page-type means as a slot. */
function imageRule(blockType: string, pageType: PageType, label?: string): SlotRule {
  const named = (n: string, a: string[], o: SlotRule['orientation'], imp: Importance) =>
    ({ name: label || n, accepts: a, orientation: o, importance: imp })
  switch (blockType) {
    case 'render':
      return pageType === 'cover'
        ? named('Hero Render', ['render', 'exterior_render', 'interior_render'], 'landscape', 'mandatory')
        : named('Project Render', ['render', 'exterior_render', 'interior_render'], 'landscape', 'required')
    case 'plan': return named('Floor Plan', ['plan', 'site_plan'], 'landscape', 'required')
    case 'section': return named('Section', ['section', 'elevation'], 'landscape', 'recommended')
    case 'diagram': return named('Diagram', ['diagram', 'concept_diagram', 'sketch'], 'any', 'recommended')
    default: return named('Image', ['render'], 'any', 'recommended')
  }
}

/* ------------------------- text-slot requirements ----------------------- */

function textRule(blockType: string, pageType: PageType): { name: string; prompt: string } | null {
  if (blockType === 'title') {
    if (pageType === 'cover') return { name: 'Portfolio Title', prompt: 'Your name or portfolio title' }
    if (pageType === 'project') return { name: 'Project Name', prompt: 'Name of this project' }
    if (pageType === 'about') return { name: 'About Heading', prompt: 'e.g. About Me' }
    return { name: 'Title', prompt: 'Page title' }
  }
  if (blockType === 'subtitle') return { name: 'Subtitle', prompt: 'Tagline, role, or year' }
  if (blockType === 'description') {
    if (pageType === 'about') return { name: 'Design Philosophy', prompt: 'Write your design philosophy — AI can help' }
    if (pageType === 'project') return { name: 'Concept Statement', prompt: 'Describe the project concept — AI can help' }
    return { name: 'Text', prompt: 'Write here — AI can help' }
  }
  if (blockType === 'meta') return { name: 'Project Info', prompt: 'Location, Year, Typology' }
  if (blockType === 'legend') return { name: 'Legend', prompt: 'Drawing legend items' }
  return null
}

/* --------------------------------- types -------------------------------- */

export interface ImageSlot {
  pageId: string; pageIndex: number; blockId: string; imageIndex: number
  name: string; accepts: string[]; orientation: string; importance: Importance; filled: boolean
}
export interface TextSlot {
  pageId: string; pageIndex: number; blockId: string; name: string; prompt: string; filled: boolean
}
export interface PageDNA { pageId: string; pageIndex: number; type: PageType; purpose: string; needs: string[]; imageSlots: ImageSlot[]; textSlots: TextSlot[] }
export interface TemplateRequirements {
  pages: PageDNA[]
  imageSlots: ImageSlot[]
  textSlots: TextSlot[]
  /** asset type → how many the template needs (e.g. {render:5, plan:3}) */
  summary: Record<string, number>
  totalSlots: number
  filledSlots: number
}

/* ------------------------------- analysis ------------------------------- */

export function analyzeTemplate(pages: Page[]): TemplateRequirements {
  const pageDNA: PageDNA[] = []
  const allImage: ImageSlot[] = []
  const allText: TextSlot[] = []
  const summary: Record<string, number> = {}

  pages.forEach((page, pageIndex) => {
    const pp = PAGE_PURPOSE[page.type] || { purpose: page.type, needs: [] }
    const imageSlots: ImageSlot[] = []
    const textSlots: TextSlot[] = []
    let imgIdx = 0

    for (const b of page.blocks) {
      if ((IMAGE_TYPES as readonly string[]).includes(b.type)) {
        const rule = imageRule(b.type, page.type, b.label)
        const slot: ImageSlot = {
          pageId: page.id, pageIndex, blockId: b.id, imageIndex: imgIdx++,
          name: rule.name, accepts: rule.accepts, orientation: rule.orientation,
          importance: rule.importance, filled: !!b.imageUrl,
        }
        imageSlots.push(slot); allImage.push(slot)
        const key = b.type
        summary[key] = (summary[key] || 0) + 1
      } else {
        const t = textRule(b.type, page.type)
        if (t) {
          const slot: TextSlot = { pageId: page.id, pageIndex, blockId: b.id, name: t.name, prompt: t.prompt, filled: !!b.text }
          textSlots.push(slot); allText.push(slot)
        }
      }
    }
    pageDNA.push({ pageId: page.id, pageIndex, type: page.type, purpose: pp.purpose, needs: pp.needs, imageSlots, textSlots })
  })

  const filled = allImage.filter(s => s.filled).length
  return { pages: pageDNA, imageSlots: allImage, textSlots: allText, summary, totalSlots: allImage.length, filledSlots: filled }
}

/* ----------------------------- smart auto-fill -------------------------- */

/**
 * Fill the template's image slots from available assets, matching each slot's
 * accepted types. assetsByType is keyed by detected/category type
 * (render/plan/section/diagram/exterior_render/...). Returns NEW pages.
 */
export function autoFillTemplate(pages: Page[], assetsByType: Record<string, string[]>): Page[] {
  // working pools we can shift from
  const pools: Record<string, string[]> = {}
  for (const k of Object.keys(assetsByType || {})) pools[k] = [...(assetsByType[k] || [])]
  const anyPool = Object.values(pools).flat()
  let anyIdx = 0

  const take = (accepts: string[]): string | undefined => {
    for (const a of accepts) {
      if (pools[a]?.length) return pools[a].shift()
    }
    // loose fallback: any leftover image
    while (anyIdx < anyPool.length) {
      const u = anyPool[anyIdx++]
      // skip ones already consumed from typed pools
      if (Object.values(pools).every(p => !p.includes(u))) continue
      return u
    }
    if (anyIdx < anyPool.length) return anyPool[anyIdx++]
    return undefined
  }

  return pages.map(page => ({
    ...page,
    blocks: page.blocks.map((b: Block) => {
      if ((IMAGE_TYPES as readonly string[]).includes(b.type) && !b.imageUrl) {
        const rule = imageRule(b.type, page.type, b.label)
        const url = take(rule.accepts)
        return url ? { ...b, imageUrl: url } : b
      }
      return b
    }),
  }))
}

/** Human-readable summary line, e.g. "5 renders · 3 plans · 2 sections". */
export function summaryLine(req: TemplateRequirements): string {
  const label: Record<string, string> = { render: 'render', plan: 'plan', section: 'section', diagram: 'diagram' }
  return Object.entries(req.summary)
    .map(([k, n]) => `${n} ${label[k] || k}${n > 1 ? 's' : ''}`)
    .join(' · ')
}
