'use client'

/**
 * LibraryBrowser — browsable, realistic libraries for the preset-template hub:
 *   • Title Blocks  (56 master title-block designs)
 *   • About & Resume spreads
 *   • Project spreads
 * All rendered with the real artwork/typography engine and a palette switcher
 * so students see finished, themed pages — not wireframes.
 */

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { specsForType, type LayoutSpec } from '@/components/composer/layoutSpecs'
import { DemoPage } from './DemoPage'
import { TitleBlockView } from './TitleBlockView'
import { TITLE_BLOCKS, TITLE_BLOCK_CATEGORIES, TITLE_BLOCK_COUNT, type TitleBlockCategory } from './titleBlocks'
import { DEMO_PROJECTS, ABOUT_DEMO, type DemoPalette } from './demoArt'

export type LibraryView = 'about' | 'project' | 'titleblocks'

const PALETTES: Array<{ name: string; p: DemoPalette; fonts: { heading: string; body: string } }> = [
  { name: 'Gold Mono', p: { primary: '#1a1a1a', accent: '#b08d57', bg: '#ffffff', text: '#1a1a1a', muted: '#ece9e4' }, fonts: { heading: 'Georgia, serif', body: 'Inter, sans-serif' } },
  { name: 'Ink', p: { primary: '#16202b', accent: '#e0533d', bg: '#f7f5f0', text: '#16202b', muted: '#dfe4ea' }, fonts: { heading: 'Inter, sans-serif', body: 'Inter, sans-serif' } },
  { name: 'Noir', p: { primary: '#f5f3ef', accent: '#c9a96a', bg: '#16161a', text: '#f5f3ef', muted: '#26262c' }, fonts: { heading: 'Georgia, serif', body: 'Inter, sans-serif' } },
  { name: 'Blueprint', p: { primary: '#0f2c4c', accent: '#3b82f6', bg: '#f4f7fb', text: '#0f2c4c', muted: '#dde6f0' }, fonts: { heading: 'Inter, sans-serif', body: 'Inter, sans-serif' } },
]

export default function LibraryBrowser({ view, onUse }: { view: LibraryView; onUse?: (item: any) => void }) {
  const router = useRouter()
  const [paletteIdx, setPaletteIdx] = useState(0)
  const [tbCat, setTbCat] = useState<'All' | TitleBlockCategory>('All')
  const { p, fonts } = PALETTES[paletteIdx]

  const aboutSpecs = useMemo(() => [...specsForType('about'), ...specsForType('resume')], [])
  const projectSpecs = useMemo(() => specsForType('project').slice(0, 60), [])
  const titleBlocks = useMemo(() => tbCat === 'All' ? TITLE_BLOCKS : TITLE_BLOCKS.filter(b => b.category === tbCat), [tbCat])

  return (
    <div>
      {/* Palette switcher */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary">Preview theme:</span>
        {PALETTES.map((pl, i) => (
          <button key={pl.name} onClick={() => setPaletteIdx(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${paletteIdx === i ? 'bg-primary text-white' : 'bg-surface-elevated dark:bg-dark-surface-overlay text-text-secondary hover:text-text-primary'}`}>
            <span className="w-3 h-3 rounded-full border border-black/10" style={{ background: pl.p.accent }} />
            {pl.name}
          </button>
        ))}
      </div>

      {view === 'titleblocks' && (
        <>
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary">{TITLE_BLOCK_COUNT} blocks ·</span>
            {(['All', ...TITLE_BLOCK_CATEGORIES] as const).map(c => (
              <button key={c} onClick={() => setTbCat(c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${tbCat === c ? 'bg-primary text-white' : 'bg-surface-elevated dark:bg-dark-surface-overlay text-text-secondary hover:text-text-primary'}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {titleBlocks.map((b, i) => {
              const proj = DEMO_PROJECTS[i % DEMO_PROJECTS.length]
              return (
                <div key={b.id} className="card overflow-hidden flex flex-col">
                  <div className="p-6 flex items-center" style={{ background: p.bg, minHeight: 150, fontSize: 22 }}>
                    <TitleBlockView style={b} p={p} fonts={fonts}
                      content={{ number: `PROJECT ${proj.num}`, title: proj.name.toUpperCase(), subline: `${proj.typology} · ${proj.year}` }} />
                  </div>
                  <div className="px-4 py-3 border-t border-border-light flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">{b.name}</div>
                      <div className="text-[11px] text-text-secondary dark:text-dark-text-secondary">{b.category}</div>
                    </div>
                    {onUse ? (
                      <button
                        onClick={() => onUse(b)}
                        className="text-[11px] px-2.5 py-1.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition whitespace-nowrap"
                      >
                        Use →
                      </button>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider text-text-secondary bg-surface-elevated dark:bg-dark-surface-overlay px-2 py-1 rounded">Master block</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {(view === 'about' || view === 'project') && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(view === 'about' ? aboutSpecs : projectSpecs).map((spec: LayoutSpec, i) => {
            const proj = DEMO_PROJECTS[i % DEMO_PROJECTS.length]
            const content = view === 'about'
              ? { title: ABOUT_DEMO.name, subtitle: ABOUT_DEMO.role, body: ABOUT_DEMO.about, firstArt: 'portrait' as const, metaItems: ABOUT_DEMO.education, legendItems: ABOUT_DEMO.skills, seed: 7 + i * 3 }
              : { title: proj.name, subtitle: `${proj.typology} · ${proj.year}`, body: proj.blurb, project: proj, metaItems: [proj.location, proj.year], seed: 11 + i * 5 }
            return (
              <div key={spec.id} className="card overflow-hidden flex flex-col">
                <div style={{ height: 280 }} className="bg-gray-100 dark:bg-dark-surface-overlay flex items-center justify-center p-4">
                  <div style={{ height: '100%', aspectRatio: '210 / 297' }} className="shadow-md ring-1 ring-black/5">
                    <DemoPage spec={spec} p={p} fonts={fonts} content={content} />
                  </div>
                </div>
                <div className="px-4 py-3 border-t border-border-light flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">{spec.name}</div>
                    <div className="text-[10px] text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">{spec.category}</div>
                  </div>
                  <button
                    onClick={() => {
                      if (onUse) {
                        onUse(spec)
                      } else {
                        router.push('/dashboard/templates')
                      }
                    }}
                    className="text-[11px] px-2.5 py-1.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition whitespace-nowrap"
                  >
                    Use →
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
