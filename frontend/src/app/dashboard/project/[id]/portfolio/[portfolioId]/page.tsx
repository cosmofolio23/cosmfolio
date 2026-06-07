'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import PageComposer, { LayoutThumb } from '@/components/composer/PageComposer'
import {
  seedPagesFromTemplate, LAYOUT_CATALOG, LAYOUT_CATEGORIES, getSpec,
  type LayoutCategory,
} from '@/components/composer/layoutSpecs'
import { allImages, type Page, type DesignTokens } from '@/components/composer/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const DEFAULT_TOKENS: DesignTokens = {
  background: '#ffffff', text: '#1a1a1a', primary: '#1a1a1a',
  accent: '#3b82f6', muted: '#e5e5e5', headingFont: 'Georgia, serif', bodyFont: 'Inter, sans-serif',
}

/** Map a portfolio style-pack record into composer DesignTokens. */
function tokensFromPack(pack: any): DesignTokens {
  if (!pack || typeof pack !== 'object') return DEFAULT_TOKENS
  const c = pack.colors || pack.tokens || {}
  const f = pack.fonts || pack.typography || {}
  return {
    background: c.background || c.bg || DEFAULT_TOKENS.background,
    text: c.text || c.foreground || DEFAULT_TOKENS.text,
    primary: c.primary || c.text || DEFAULT_TOKENS.primary,
    accent: c.accent || c.secondary || DEFAULT_TOKENS.accent,
    muted: c.muted || c.border || DEFAULT_TOKENS.muted,
    headingFont: f.heading || f.heading_font || DEFAULT_TOKENS.headingFont,
    bodyFont: f.body || f.body_font || DEFAULT_TOKENS.bodyFont,
  }
}

const IMAGE_TYPES = ['render', 'plan', 'section', 'diagram']

/** Fill seeded image blocks with the project's real uploaded assets. */
function fillImages(pages: Page[], assetsByCat: Record<string, any[]>): Page[] {
  const pools: Record<string, string[]> = {}
  for (const k of Object.keys(assetsByCat || {})) {
    pools[k] = (assetsByCat[k] || []).map((a: any) => a.file_url || a.url).filter((u: any) => typeof u === 'string' && u.startsWith('http'))
  }
  const anyPool = Object.values(pools).flat()
  let anyIdx = 0
  const take = (type: string): string | undefined => {
    if (pools[type]?.length) return pools[type].shift()
    if (anyIdx < anyPool.length) return anyPool[anyIdx++]
    return undefined
  }
  return pages.map(p => ({
    ...p,
    blocks: p.blocks.map(b => {
      if (IMAGE_TYPES.includes(b.type) && !b.imageUrl) {
        const url = take(b.type)
        return url ? { ...b, imageUrl: url } : b
      }
      return b
    }),
  }))
}

export default function PortfolioEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()

  const [portfolio, setPortfolio] = useState<any>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [tokens, setTokens] = useState<DesignTokens>(DEFAULT_TOKENS)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [layoutCat, setLayoutCat] = useState<'All' | LayoutCategory>('All')
  const [layoutSearch, setLayoutSearch] = useState('')
  const [savedNote, setSavedNote] = useState('')

  const currentPage = pages[currentIdx]

  const authToken = () => token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '')

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) { router.push('/signin'); return }
    loadPortfolio()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token])

  // surface the most relevant layout category for the active page
  useEffect(() => {
    const t = currentPage?.type
    if (t === 'cover') setLayoutCat('Cover')
    else if (t === 'about') setLayoutCat('Text')
    else if (t === 'contact') setLayoutCat('Contact')
    else if (t === 'resume') setLayoutCat('Resume')
    else setLayoutCat('All')
  }, [currentPage?.type])

  const loadPortfolio = async () => {
    setIsLoading(true); setError(null)
    try {
      const t = authToken()
      if (!t) { setError('Not authenticated'); setIsLoading(false); return }

      // 1) portfolio metadata (name, style pack, saved layouts)
      let meta: any = {}
      const metaRes = await fetch(`${API_URL}/api/portfolios/view/${params.portfolioId}`, { headers: { Authorization: `Bearer ${t}` } })
      if (metaRes.ok) { meta = await metaRes.json(); setPortfolio(meta) }

      const ps = meta.page_structure || {}
      const savedLayouts: Record<string, string> = ps.page_layouts || {}
      const pack = ps.style_pack || meta.style_pack
      setTokens(tokensFromPack(pack))

      // 2) project assets to fill images
      let assetsByCat: Record<string, any[]> = {}
      try {
        const aRes = await fetch(`${API_URL}/api/projects/${params.id}/assets`, { headers: { Authorization: `Bearer ${t}` } })
        if (aRes.ok) assetsByCat = await aRes.json()
      } catch { /* assets optional */ }

      const counts = (k: string) => (assetsByCat[k]?.length || 0)
      const seedTemplate = {
        name: meta.name || meta.title || 'Portfolio',
        placeholders: {
          renders: Math.max(2, counts('render') || 2),
          plans: counts('plan') || 1,
          sections: counts('section') || 1,
          diagrams: counts('diagram') || 0,
        },
      }

      // 3) seed parametric pages, give them STABLE ids, fill images, restore layouts
      let seeded = seedPagesFromTemplate(seedTemplate as any)
      seeded = seeded.map((p, i) => ({ ...p, id: `${p.type}-${i}` }))
      seeded = fillImages(seeded, assetsByCat)
      seeded = seeded.map(p => savedLayouts[p.id] ? { ...p, layoutId: savedLayouts[p.id] } : p)

      setPages(seeded)
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setIsLoading(false)
    }
  }

  const persistLayouts = async (next: Page[]) => {
    const map: Record<string, string> = {}
    next.forEach(p => { map[p.id] = p.layoutId })
    try {
      await fetch(`${API_URL}/api/portfolios/${params.portfolioId}/pages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_layouts: map }),
      })
      setSavedNote('✓ Saved'); setTimeout(() => setSavedNote(''), 1500)
    } catch { /* best-effort */ }
  }

  const switchLayout = (layoutId: string) => {
    if (!currentPage) return
    const next = pages.map((p, i) => i === currentIdx ? { ...p, layoutId } : p)
    setPages(next)
    void persistLayouts(next)
  }

  const updatePage = (updated: Page) => {
    setPages(prev => prev.map((p, i) => i === currentIdx ? updated : p))
  }

  // filtered + suitability-sorted layouts for the picker
  const filteredLayouts = useMemo(() => {
    let list = LAYOUT_CATALOG
    if (layoutCat !== 'All') list = list.filter(s => s.category === layoutCat)
    if (layoutSearch.trim()) {
      const q = layoutSearch.toLowerCase()
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))
    }
    const pt = currentPage?.type
    return [...list].sort((a, b) =>
      (pt && b.suits.includes(pt) ? 1 : 0) - (pt && a.suits.includes(pt) ? 1 : 0))
  }, [layoutCat, layoutSearch, currentPage?.type])

  if (isLoading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4 mx-auto" />
        <p className="text-gray-600 text-sm">Loading portfolio…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-lg">
        <h2 className="text-xl font-bold text-red-700 mb-3">⚠️ Error</h2>
        <pre className="text-sm bg-red-50 p-4 rounded text-red-800 overflow-auto">{error}</pre>
        <button onClick={loadPortfolio} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Retry</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/project/${params.id}/generate`} className="text-gray-500 hover:text-gray-900 text-sm">← Back</Link>
            <div>
              <h1 className="text-base font-semibold">{portfolio?.name || 'Portfolio'}</h1>
              <p className="text-[11px] text-gray-400">Parametric editor · {LAYOUT_CATALOG.length} layouts available</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-green-600 min-w-[52px] text-right">{savedNote}</span>
            <span className="text-[11px] text-gray-400">Page {currentIdx + 1}/{pages.length}</span>
          </div>
        </div>
      </header>

      <div className={`flex flex-1 min-h-0 ${isMobile ? 'flex-col' : ''}`}>
        {/* Left: page list */}
        <aside className={`${isMobile ? 'w-full h-24 border-b' : 'w-52 border-r'} bg-white overflow-y-auto flex-shrink-0`}>
          <div className="p-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pages ({pages.length})</h3>
            <div className={`${isMobile ? 'flex gap-2' : 'space-y-1.5'}`}>
              {pages.map((page, idx) => (
                <button key={page.id} onClick={() => setCurrentIdx(idx)}
                  className={`w-full text-left p-2.5 rounded-lg border-2 transition ${currentIdx === idx ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-transparent hover:bg-gray-100'}`}>
                  <div className="text-[10px] text-gray-400 uppercase">{page.type}</div>
                  <div className="text-xs font-medium truncate">{idx + 1}. {getSpec(page.layoutId).name}</div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Center: parametric canvas */}
        <main className={`flex-1 overflow-y-auto ${isMobile ? 'p-3' : 'p-8'} bg-gray-300/40`}>
          {currentPage && (
            <div className="max-w-[680px] mx-auto">
              <PageComposer page={currentPage} tokens={tokens} onChange={updatePage} />
              <div className="mt-3 text-center text-[11px] text-gray-400">
                {currentPage.type} · {getSpec(currentPage.layoutId).name}
              </div>
            </div>
          )}
        </main>

        {/* Right: layout catalog picker */}
        <aside className={`${isMobile ? 'w-full border-t' : 'w-80 border-l'} bg-white overflow-y-auto flex-shrink-0`}>
          <div className="p-3 border-b sticky top-0 bg-white z-10">
            <input value={layoutSearch} onChange={e => setLayoutSearch(e.target.value)}
              placeholder="Search layouts…"
              className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex flex-wrap gap-1 mt-2">
              {(['All', ...LAYOUT_CATEGORIES] as const).map(cat => (
                <button key={cat} onClick={() => setLayoutCat(cat)}
                  className={`px-2 py-1 rounded text-[10px] font-semibold transition ${layoutCat === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="p-3">
            <p className="text-[11px] text-gray-400 mb-2">{filteredLayouts.length} layouts · click to apply</p>
            <div className="grid grid-cols-3 gap-2">
              {filteredLayouts.map(spec => {
                const active = currentPage?.layoutId === spec.id
                return (
                  <button key={spec.id} onClick={() => switchLayout(spec.id)} title={spec.name}
                    className={`rounded-lg p-1 border-2 transition ${active ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-gray-300 hover:bg-gray-50'}`}>
                    <LayoutThumb spec={spec} tokens={tokens} active={active} />
                    <div className="text-[8px] text-gray-500 mt-1 truncate">{spec.name}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
