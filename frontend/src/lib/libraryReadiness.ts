/**
 * Library Readiness — compares what a project HAS (library_assets) against what a
 * submission NEEDS (the sheet packs' `requirements`), so the Library can tell a
 * student "you're missing 3 renders for a Thesis" before they generate anything.
 *
 * This is nearly free: the sheet templates already declare requirements
 * ({plans, sections, elevations, renders, diagrams}); we just bucket the
 * canonical assets the same way and diff.
 */

import type { LibraryAsset } from '@/lib/libraryApi'
import type { AssetType } from '@/lib/assetTaxonomy'
import { SHEET_SET_TEMPLATES } from '@/components/sheetSet/sheetSetTemplates'
import type { SheetSetTemplate } from '@/components/sheetSet/sheetSetTypes'

export type RequirementBucket = 'plans' | 'sections' | 'elevations' | 'renders' | 'diagrams'

const BUCKET_LABEL: Record<RequirementBucket, string> = {
  plans: 'Plans',
  sections: 'Sections',
  elevations: 'Elevations',
  renders: 'Renders',
  diagrams: 'Diagrams',
}

/** Map a canonical asset type to the submission requirement bucket it satisfies. */
function bucketOf(type: AssetType): RequirementBucket | null {
  switch (type) {
    case 'plan':
    case 'site-plan':
    case 'master-plan':
      return 'plans'
    case 'section':
      return 'sections'
    case 'elevation':
      return 'elevations'
    case 'exterior-render':
    case 'interior-render':
    case 'aerial':
    case 'model-photo':
      return 'renders'
    case 'sketch':
    case 'concept-diagram':
    case 'circulation':
    case 'zoning':
    case 'exploded':
    case 'evolution':
    case 'site-analysis':
    case 'climate':
    case 'swot':
    case 'user-study':
    case 'case-study':
      return 'diagrams'
    default:
      return null // details / info / text don't count toward submission requirements
  }
}

export interface BucketReadiness {
  bucket: RequirementBucket
  label: string
  have: number
  need: number
  missing: number
  pct: number // 0..100, capped
}

export interface ProjectReadiness {
  templateId: string
  templateName: string
  overallPct: number
  buckets: BucketReadiness[]
  missingSummary: string[] // e.g. ["3 more renders", "2 more sections"]
  ready: boolean
}

/** Count assets into requirement buckets. */
export function countByBucket(assets: LibraryAsset[]): Record<RequirementBucket, number> {
  const counts: Record<RequirementBucket, number> = {
    plans: 0, sections: 0, elevations: 0, renders: 0, diagrams: 0,
  }
  for (const a of assets) {
    const b = bucketOf(a.asset_type)
    if (b) counts[b]++
  }
  return counts
}

/** Compute readiness of a project's assets against one submission template. */
export function computeReadiness(assets: LibraryAsset[], template: SheetSetTemplate): ProjectReadiness {
  const have = countByBucket(assets)
  const req = template.requirements
  const buckets: BucketReadiness[] = (Object.keys(BUCKET_LABEL) as RequirementBucket[]).map(b => {
    const need = (req as any)[b] ?? 0
    const h = have[b]
    const missing = Math.max(0, need - h)
    const pct = need === 0 ? 100 : Math.min(100, Math.round((h / need) * 100))
    return { bucket: b, label: BUCKET_LABEL[b], have: h, need, missing, pct }
  })

  // overall = average of buckets that actually have a requirement (need > 0)
  const relevant = buckets.filter(b => b.need > 0)
  const overallPct = relevant.length
    ? Math.round(relevant.reduce((s, b) => s + b.pct, 0) / relevant.length)
    : 100

  const missingSummary = buckets
    .filter(b => b.missing > 0)
    .map(b => `${b.missing} more ${b.missing === 1 ? b.label.replace(/s$/, '').toLowerCase() : b.label.toLowerCase()}`)

  return {
    templateId: template.id,
    templateName: template.name,
    overallPct,
    buckets,
    missingSummary,
    ready: overallPct >= 100,
  }
}

/** Readiness across all submission packs — for the target selector. */
export function readinessForAllTemplates(assets: LibraryAsset[]): ProjectReadiness[] {
  return SHEET_SET_TEMPLATES.map(t => computeReadiness(assets, t))
}

export { SHEET_SET_TEMPLATES }
