'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import UpgradeModal from '@/components/modals/UpgradeModal'
import Logo from '@/components/Logo'
import PageComposer, { LayoutThumb } from '@/components/composer/PageComposer'
import {
  seedPagesFromTemplate, LAYOUT_CATALOG, LAYOUT_CATEGORIES, getSpec,
  type LayoutCategory,
} from '@/components/composer/layoutSpecs'
import { createBlock, type Page, type DesignTokens } from '@/components/composer/types'
import { composePages } from '@/components/composer/composition'
import { STYLE_DNA } from '@/components/composer/styleDNA'
import { ProfessionalPublishingSettings } from '@/components/composer/ProfessionalPublishingSettings'
import { AIDesignAssistant } from '@/components/composer/AIDesignAssistant'
import { PAGE_SIZES, type Portfolio as PublishingPortfolio } from '@/components/composer/publishingTypes'

const API_URL = process.env.NODE_ENV === 'production' ? 'https://cosmfolio-backend.onrender.com' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')

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
  const { token, isAuthenticated, user } = useAuthStore()
  const isPro = user?.is_pro || user?.plan_type === 'pro'

  const [portfolio, setPortfolio] = useState<any>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [tokens, setTokens] = useState<DesignTokens>(DEFAULT_TOKENS)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [upgradeModal, setUpgradeModal] = useState<{isOpen: boolean, title?: string, subtitle?: string}>({ isOpen: false })
  const [isMobile, setIsMobile] = useState(false)
  const [layoutCat, setLayoutCat] = useState<'All' | LayoutCategory>('All')
  const [layoutSearch, setLayoutSearch] = useState('')
  const [savedNote, setSavedNote] = useState('')
  const [mobileTab, setMobileTab] = useState<'pages' | 'canvas' | 'design'>('canvas')
  const [mode, setMode] = useState<'view' | 'edit'>('view')   // spec: show output first, edit on click
  const [analyzing, setAnalyzing] = useState('')              // on-device AI vision status
  const [publishingTab, setPublishingTab] = useState<'style' | 'publishing'>('style')
  const [publishingPortfolio, setPublishingPortfolio] = useState<PublishingPortfolio>({
    id: 'portfolio-' + params.portfolioId,
    name: portfolio?.name || 'Portfolio',
    spreads: [],
    pageSize: PAGE_SIZES['a4-portrait'],
    masterPages: [],
    backgrounds: [],
    designTokens: tokens,
  })
  const composeInput = useRef<{ assets: Record<string, any[]>; project: any } | null>(null)

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

      // If a full parametric document was saved (text + image edits), restore
      // it directly so edits survive reloads. (finally sets isLoading=false)
      const savedDoc = ps.composer_doc
      if (savedDoc && Array.isArray(savedDoc.pages) && savedDoc.pages.length) {
        setPages(savedDoc.pages)
        if (savedDoc.tokens) setTokens(savedDoc.tokens)
        return
      }

      // 2) project assets to fill images
      let assetsByCat: Record<string, any[]> = {}
      try {
        const aRes = await fetch(`${API_URL}/api/projects/${params.id}/assets`, { headers: { Authorization: `Bearer ${t}` } })
        if (aRes.ok) assetsByCat = await aRes.json()
      } catch { /* assets optional */ }

      // project record (title / description / typology) for composition text
      let projectRec: any = {}
      try {
        const pRes = await fetch(`${API_URL}/api/projects/${params.id}`, { headers: { Authorization: `Bearer ${t}` } })
        if (pRes.ok) projectRec = await pRes.json()
      } catch { /* optional */ }
      composeInput.current = { assets: assetsByCat, project: projectRec }

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

      // 3) COMPOSE pages intelligently from the project's categorized assets
      //    (architectural hierarchy + layout DNA). Falls back to template
      //    seeding when there are no assets yet.
      const hasAssets = Object.values(assetsByCat).some((arr: any) => Array.isArray(arr) && arr.length)
      let composed: Page[]
      if (hasAssets) {
        composed = composePages({
          project: {
            name: meta.name || meta.title || projectRec?.title,
            location: projectRec?.location,
            year: projectRec?.year,
            typology: projectRec?.typology || projectRec?.project_type,
            description: projectRec?.description,
          },
          assetsByCategory: assetsByCat,
        })
      } else {
        composed = seedPagesFromTemplate(seedTemplate as any).map((p, i) => ({ ...p, id: `${p.type}-${i}` }))
        composed = fillImages(composed, assetsByCat)
      }
      // restore any saved per-page layout choices
      composed = composed.map(p => savedLayouts[p.id] ? { ...p, layoutId: savedLayouts[p.id] } : p)

      setPages(composed)
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setIsLoading(false)
    }
  }

  // Persist the FULL parametric document (pages + tokens) so text/image edits
  // survive reloads — not just layout choices.
  const saveDoc = async (nextPages: Page[], nextTokens: DesignTokens) => {
    try {
      await fetch(`${API_URL}/api/portfolios/${params.portfolioId}/customization`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_layouts: Object.fromEntries(nextPages.map(p => [p.id, p.layoutId])),
          // include resolved regions + overlay kind so the backend can render
          // this doc identically (export / public share consistency).
          composer_doc: {
            pages: nextPages.map(p => {
              const s = getSpec(p.layoutId)
              return { ...p, regions: s.regions, kind: s.kind }
            }),
            tokens: nextTokens,
          },
        }),
      })
      setSavedNote('✓ Saved'); setTimeout(() => setSavedNote(''), 1500)
    } catch { /* best-effort */ }
  }

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const queueSave = (nextPages: Page[], nextTokens: DesignTokens) => {
    setSavedNote('Saving…')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => void saveDoc(nextPages, nextTokens), 1200)
  }

  // Phase 4 (free, in-browser): detect each image's real type with on-device
  // CLIP, then recompose from the DETECTED types (not just upload folders).
  const composeFrom = (assets: Record<string, any[]>): Page[] => {
    const ci = composeInput.current
    return composePages({
      project: {
        name: portfolio?.name || ci?.project?.title,
        location: ci?.project?.location, year: ci?.project?.year,
        typology: ci?.project?.typology || ci?.project?.project_type,
        description: ci?.project?.description,
      },
      assetsByCategory: assets,
    })
  }
  const aiAnalyze = async () => {
    const ci = composeInput.current
    if (!ci || !Object.values(ci.assets).some((a: any) => Array.isArray(a) && a.length)) {
      alert('Upload some project assets first.')
      return
    }
    setAnalyzing('Starting on-device AI…')
    try {
      const { analyzeAssets } = await import('@/lib/assetVision')
      const { regrouped } = await analyzeAssets(ci.assets, (_d, _t, status) => setAnalyzing(status))
      const next = composeFrom(regrouped)
      setPages(next); setCurrentIdx(0); queueSave(next, tokens)
    } catch (e) {
      console.error('AI analyze failed:', e)
      alert('On-device AI could not run here — keeping your uploaded categories.')
    } finally {
      setAnalyzing('')
    }
  }

  // Phase 2: regenerate the composition from the project's assets
  const regenerate = () => {
    const ci = composeInput.current
    if (!ci || !Object.values(ci.assets).some((a: any) => Array.isArray(a) && a.length)) {
      alert('Upload some project assets first, then regenerate.')
      return
    }
    if (pages.length && !window.confirm('Regenerate the portfolio from your assets? This replaces the current pages.')) return
    const next = composePages({
      project: {
        name: portfolio?.name || ci.project?.title,
        location: ci.project?.location, year: ci.project?.year,
        typology: ci.project?.typology || ci.project?.project_type,
        description: ci.project?.description,
      },
      assetsByCategory: ci.assets,
    })
    setPages(next); setCurrentIdx(0); queueSave(next, tokens)
  }

  const switchLayout = (layoutId: string) => {
    if (!currentPage) return
    const next = pages.map((p, i) => i === currentIdx ? { ...p, layoutId } : p)
    setPages(next)
    queueSave(next, tokens)
  }

  const updatePage = (updated: Page) => {
    const next = pages.map((p, i) => i === currentIdx ? updated : p)
    setPages(next)
    queueSave(next, tokens)
  }

  // Upload a brand-new image from inside the editor; returns its hosted URL.
  const uploadImage = async (file: File): Promise<string> => {
    const fd = new FormData()
    fd.append('files', file)
    const res = await fetch(`${API_URL}/api/projects/${params.id}/assets/bulk?asset_type=render`, {
      method: 'POST', headers: { Authorization: `Bearer ${authToken()}` }, body: fd,
    })
    if (!res.ok) throw new Error('Upload failed')
    const data = await res.json().catch(() => null)
    const first = Array.isArray(data) ? data[0] : (data?.assets?.[0] || data?.files?.[0] || data)
    return first?.file_url || first?.url || ''
  }

  // ---- page management ----
  const addPage = () => {
    if (!isPro && pages.length >= 6) {
      setUpgradeModal({
        isOpen: true,
        title: "You've built a complete portfolio 🎉",
        subtitle: "Need more space? Upgrade to Pro to create up to 30 pages!"
      })
      return
    }
    const newPage: Page = {
      id: `project-${Date.now()}`, type: 'project', layoutId: 'duoV.titleTopText',
      blocks: [{ ...createBlock('title'), text: 'New Project' }, createBlock('meta'), createBlock('description'), { ...createBlock('render'), label: 'Render' }],
    }
    const next = [...pages, newPage]
    setPages(next); setCurrentIdx(next.length - 1); queueSave(next, tokens)
  }
  const addResumePage = () => {
    if (!isPro && pages.length >= 6) {
      setUpgradeModal({
        isOpen: true,
        title: "You've built a complete portfolio 🎉",
        subtitle: "Need more space? Upgrade to Pro to create up to 30 pages!"
      })
      return
    }
    const newPage: Page = {
      id: `resume-${Date.now()}`, type: 'resume', layoutId: 'resume.classic',
      blocks: [
        { ...createBlock('title'), text: 'Your Name' },
        { ...createBlock('subtitle'), text: 'Architect · Designer' },
        createBlock('meta'),
        { ...createBlock('description'), text: 'Experience, education, and skills…' },
      ],
    }
    const next = [...pages, newPage]
    setPages(next); setCurrentIdx(next.length - 1); queueSave(next, tokens)
  }
  const deletePage = (idx: number) => {
    if (pages.length <= 1) return
    if (!window.confirm('Delete this page?')) return
    const next = pages.filter((_, i) => i !== idx)
    setPages(next); setCurrentIdx(Math.max(0, Math.min(currentIdx, next.length - 1))); queueSave(next, tokens)
  }
  const movePage = (idx: number, dir: -1 | 1) => {
    const j = idx + dir
    if (j < 0 || j >= pages.length) return
    const next = [...pages]
    ;[next[idx], next[j]] = [next[j], next[idx]]
    setPages(next); setCurrentIdx(j); queueSave(next, tokens)
  }
  const setToken = (patch: Partial<DesignTokens>) => {
    const next = { ...tokens, ...patch }
    setTokens(next); queueSave(pages, next)
  }

  // ---- export PDF (backend renders from composer_doc → matches editor) ----
  const exportPDF = async () => {
    setSavedNote('Exporting…')
    try {
      const res = await fetch(`${API_URL}/api/portfolios/${params.portfolioId}/export/pdf`, { headers: { Authorization: `Bearer ${authToken()}` } })
      if (!res.ok) { 
        setSavedNote('')
        try {
          const errData = await res.json()
          if (errData?.detail === 'UPGRADE_REQUIRED_EXPORTS' || res.status === 403) {
            setUpgradeModal({
              isOpen: true,
              title: "Your portfolio is ready 🚀",
              subtitle: "You've used your free exports. Upgrade to Pro for unlimited exports and premium layouts."
            })
            return
          }
        } catch(e){}
        alert('Export failed')
        return 
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `${(portfolio?.name || 'portfolio').replace(/\s+/g, '_')}.pdf`; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1500); setSavedNote('✓ Exported'); setTimeout(() => setSavedNote(''), 1500)
    } catch { setSavedNote(''); alert('Export failed') }
  }

  const HEADING_FONTS = ['Georgia, serif', 'Inter, sans-serif', 'Montserrat, sans-serif', 'Playfair Display, serif', 'Oswald, sans-serif', 'Cormorant Garamond, serif']
  const BODY_FONTS = ['Inter, sans-serif', 'Roboto, sans-serif', 'Georgia, serif', 'Source Sans Pro, sans-serif', 'Lato, sans-serif']

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

  // ── VIEW-ONLY MODE (default): show the finished portfolio first ──
  if (mode === 'view') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
          <div className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/dashboard/project/${params.id}/generate`} className="text-gray-500 hover:text-gray-900 text-sm">← Back</Link>
              <Logo size="sm" variant="gold" />
              <div>
                <h1 className="text-base font-semibold">{portfolio?.name || 'Portfolio'}</h1>
                <p className="text-[11px] text-gray-400">{analyzing || `Your portfolio is ready · ${pages.length} pages`}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-green-600 min-w-[60px] text-right">{savedNote}</span>
              <button onClick={aiAnalyze} disabled={!!analyzing} className="px-3 py-1.5 border rounded-lg text-xs font-medium text-[#9C7416] hover:bg-[#FBE7A1]/30 disabled:opacity-50" title="Detect each image's type with free on-device AI, then recompose">{analyzing ? '🧠 Analyzing…' : '🔍 AI Analyze'}</button>
              <button onClick={regenerate} className="px-3 py-1.5 border rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50" title="Recompose from your assets">🔄 Regenerate</button>
              <button onClick={exportPDF} className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-medium hover:bg-gray-900">📄 Export PDF</button>
              <button onClick={() => setMode('edit')} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">✏️ Edit</button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-300/40">
          <div className="max-w-[680px] mx-auto space-y-6" style={{ pointerEvents: 'none' }}>
            {pages.map((page) => (
              <div key={page.id}>
                <PageComposer page={page} tokens={tokens} onChange={() => {}} />
                <div className="mt-1 text-center text-[10px] text-gray-400">{page.type} · {getSpec(page.layoutId).name}</div>
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col pb-16 md:pb-0">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/project/${params.id}/generate`} className="text-gray-500 hover:text-gray-900 text-sm">← Back</Link>
            <Logo size="sm" variant="gold" />
            <div>
              <h1 className="text-base font-semibold">{portfolio?.name || 'Portfolio'}</h1>
              <p className="text-[11px] text-gray-400">Parametric editor · {LAYOUT_CATALOG.length} layouts available</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-green-600 min-w-[60px] text-right">{savedNote}</span>
            <span className="text-[11px] text-gray-400">Page {currentIdx + 1}/{pages.length}</span>
            <button onClick={() => setMode('view')} className="px-3 py-1.5 border rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">👁 Preview</button>
            <button onClick={exportPDF} className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-medium hover:bg-gray-900">📄 Export PDF</button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 relative">
        {/* Left: page list */}
        <aside className={`${isMobile ? (mobileTab === 'pages' ? 'absolute inset-0 z-20 w-full bg-white pb-16' : 'hidden') : 'w-52 border-r'} bg-white overflow-y-auto flex-shrink-0`}>
          <div className="p-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pages ({pages.length})</h3>
            <div className={`${isMobile ? 'flex gap-2' : 'space-y-1.5'}`}>
              {pages.map((page, idx) => (
                <div key={page.id}
                  className={`group rounded-lg border-2 transition ${currentIdx === idx ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-transparent hover:bg-gray-100'}`}>
                  <button onClick={() => setCurrentIdx(idx)} className="w-full text-left p-2.5">
                    <div className="text-[10px] text-gray-400 uppercase">{page.type}</div>
                    <div className="text-xs font-medium truncate">{idx + 1}. {getSpec(page.layoutId).name}</div>
                  </button>
                  <div className={`flex gap-0.5 px-1.5 pb-1.5 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition`}>
                    <button onClick={() => movePage(idx, -1)} disabled={idx === 0} title="Move up" className="text-[11px] px-1.5 py-0.5 bg-white rounded border disabled:opacity-30 hover:bg-gray-50">▲</button>
                    <button onClick={() => movePage(idx, 1)} disabled={idx === pages.length - 1} title="Move down" className="text-[11px] px-1.5 py-0.5 bg-white rounded border disabled:opacity-30 hover:bg-gray-50">▼</button>
                    <button onClick={() => deletePage(idx)} disabled={pages.length <= 1} title="Delete" className="text-[11px] px-1.5 py-0.5 bg-white rounded border text-red-500 disabled:opacity-30 hover:bg-red-50 ml-auto">✕</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-1.5">
              <button onClick={addPage} className="flex-1 py-2 text-xs font-medium text-blue-600 border-2 border-dashed border-blue-200 rounded-lg hover:bg-blue-50">+ Page</button>
              <button onClick={addResumePage} className="flex-1 py-2 text-xs font-medium text-[#9C7416] border-2 border-dashed border-[#D4AF37]/40 rounded-lg hover:bg-[#FBE7A1]/30">+ Resume</button>
            </div>
          </div>
        </aside>

        {/* Center: parametric canvas */}
        <main className={`${isMobile ? (mobileTab === 'canvas' ? 'block absolute inset-0 z-10 w-full' : 'hidden') : 'flex-1'} overflow-y-auto bg-gray-300/40 p-2 md:p-8 flex justify-center`}>
          {currentPage && (
            <div className="w-full max-w-[680px]">
              <PageComposer page={currentPage} tokens={tokens} onChange={updatePage} onUploadImage={uploadImage} />
              <div className="mt-3 text-center text-[11px] text-gray-400">
                {currentPage.type} · {getSpec(currentPage.layoutId).name}
              </div>
            </div>
          )}
        </main>

        {/* Right: layout catalog picker */}
        <aside className={`${isMobile ? (mobileTab === 'design' ? 'absolute inset-0 z-20 w-full bg-white pb-16' : 'hidden') : 'w-80 border-l'} bg-white overflow-y-auto flex-shrink-0`}>
          {/* Style DNA presets */}
          <div className="p-3 border-b">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Style</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {STYLE_DNA.map(s => (
                <button key={s.id} onClick={() => setToken(s.tokens)} title={s.description}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-left hover:border-blue-400 transition">
                  <span className="flex gap-0.5 flex-shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.tokens.background, border: '1px solid #ddd' }} />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.tokens.primary }} />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.tokens.accent }} />
                  </span>
                  <span className="text-[9px] font-medium text-gray-700 truncate">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Publishing vs Style tabs */}
          <div className="flex border-b bg-gray-50">
            <button onClick={() => setPublishingTab('style')} className={`flex-1 px-3 py-2 text-xs font-semibold transition ${publishingTab === 'style' ? 'bg-white border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
              🎨 Style
            </button>
            <button onClick={() => setPublishingTab('publishing')} className={`flex-1 px-3 py-2 text-xs font-semibold transition ${publishingTab === 'publishing' ? 'bg-white border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
              📄 Publishing
            </button>
          </div>

          {/* Publishing mode */}
          {publishingTab === 'publishing' && (
            <div className="p-3 border-b space-y-3 max-h-96 overflow-y-auto">
              <ProfessionalPublishingSettings
                portfolio={publishingPortfolio}
                onUpdate={setPublishingPortfolio}
              />
              <AIDesignAssistant
                onCommand={cmd => {
                  console.log('AI command:', cmd)
                  // Hook for future AI implementation
                }}
              />
            </div>
          )}

          {/* Design tokens */}
          {publishingTab === 'style' && (
            <div className="p-3 border-b">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Colors &amp; Fonts</h3>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {([['background', 'Background'], ['text', 'Text'], ['primary', 'Primary'], ['accent', 'Accent']] as const).map(([k, label]) => (
                <label key={k} className="flex items-center gap-1.5 text-[10px] text-gray-600">
                  <input type="color" value={(tokens as any)[k] || '#000000'} onChange={e => setToken({ [k]: e.target.value } as any)}
                    className="w-6 h-6 rounded border cursor-pointer p-0" />
                  {label}
                </label>
              ))}
            </div>
            <select value={tokens.headingFont} onChange={e => setToken({ headingFont: e.target.value })}
              className="w-full mb-1.5 px-2 py-1 text-[11px] border rounded">
              {HEADING_FONTS.map(f => <option key={f} value={f}>Heading: {f.split(',')[0]}</option>)}
            </select>
            <select value={tokens.bodyFont} onChange={e => setToken({ bodyFont: e.target.value })}
              className="w-full px-2 py-1 text-[11px] border rounded">
              {BODY_FONTS.map(f => <option key={f} value={f}>Body: {f.split(',')[0]}</option>)}
            </select>
            </div>
          )}

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

      {/* Mobile Bottom Tab Bar */}
      {isMobile && (
        <div className="fixed bottom-0 inset-x-0 h-16 bg-white border-t flex z-50 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
          <button 
            onClick={() => setMobileTab('pages')} 
            className={`flex-1 flex flex-col items-center justify-center gap-1 ${mobileTab === 'pages' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}
          >
            <span className="text-xl leading-none">📄</span>
            <span className="text-[10px]">Pages</span>
          </button>
          <button 
            onClick={() => setMobileTab('canvas')} 
            className={`flex-1 flex flex-col items-center justify-center gap-1 ${mobileTab === 'canvas' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}
          >
            <span className="text-xl leading-none">🏗️</span>
            <span className="text-[10px]">Canvas</span>
          </button>
          <button 
            onClick={() => setMobileTab('design')} 
            className={`flex-1 flex flex-col items-center justify-center gap-1 ${mobileTab === 'design' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}
          >
            <span className="text-xl leading-none">🎨</span>
            <span className="text-[10px]">Design</span>
          </button>
        </div>
      )}

      <UpgradeModal 
        isOpen={upgradeModal.isOpen} 
        onClose={() => setUpgradeModal({ isOpen: false })}
        title={upgradeModal.title}
        subtitle={upgradeModal.subtitle}
      />
    </div>
  )
}
