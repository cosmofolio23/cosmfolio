'use client'

import { PageFrame } from './PageFrame'
import { ProjectHeader } from '@/components/content-blocks/ProjectHeader'
import { RenderShowcase } from '@/components/content-blocks/RenderShowcase'

export function ProjectPageRenderer({ content, assets, tokens, overlays }: any) {
  return (
    <PageFrame tokens={tokens} overlays={overlays}>
      <ProjectHeader title={content.title} description={content.description} location={content.location} year={content.year} />
      <RenderShowcase renders={assets?.renders || []} />
    </PageFrame>
  )
}
