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

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')

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
  const [publishingTab, setPublishingTab] = useState<'style' | 'templates' | 'publishing'>('templates')
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


  return (
    <div className="h-screen bg-[#F5F5F3] dark:bg-dark-bg-primary flex flex-col overflow-hidden font-inter">
      {/* Sleek Top Toolbar */}
      <header className="h-14 bg-white dark:bg-[#1A1A1A] border-b border-stone-light/10 flex items-center justify-between px-4 z-40 flex-shrink-0">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-4 flex-1">
          <Link href={`/dashboard/project/${params.id}/generate`} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-stone-light/10 text-text-secondary transition-colors" title="Back to Project">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </Link>
          <div className="h-4 w-px bg-stone-light/20 mx-1"></div>
          <div>
            <h1 className="text-sm font-semibold font-montserrat text-text-primary dark:text-dark-text-primary flex items-center gap-2">
              {portfolio?.name || 'Portfolio'}
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#D4AF37]/10 text-[#D4AF37] uppercase tracking-wider">Pro</span>
            </h1>
          </div>
        </div>

        {/* Center: Mode Switcher (Figma style) */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center p-1 bg-stone-light/10 dark:bg-black/20 rounded-lg">
            <button 
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${mode === 'edit' ? 'bg-white dark:bg-[#2A2A2A] shadow-sm text-text-primary dark:text-dark-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
              onClick={() => setMode('edit')}
            >
              Design
            </button>
            <button 
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${mode === 'view' ? 'bg-white dark:bg-[#2A2A2A] shadow-sm text-text-primary dark:text-dark-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
              onClick={() => setMode('view')}
            >
              Preview
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-3 flex-1">
          <span className="text-[10px] font-medium text-green-600 dark:text-green-400 opacity-80">{savedNote}</span>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-stone-light/10 text-text-secondary transition-colors" title="Settings">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
            <button className="px-4 py-1.5 bg-text-primary dark:bg-white text-white dark:text-black rounded-md text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm" onClick={exportPDF}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 relative">
        {/* Left: Premium Pages List */}
        {mode === 'edit' && (
          <aside className={`${isMobile ? (mobileTab === 'pages' ? 'absolute inset-0 z-20 w-full bg-white pb-16' : 'hidden') : 'w-64 border-r border-stone-light/10'} bg-white dark:bg-[#1A1A1A] overflow-y-auto flex-shrink-0 flex flex-col`}>
            <div className="p-4 border-b border-stone-light/10 flex items-center justify-between">
              <h3 className="text-xs font-bold text-text-primary dark:text-dark-text-primary uppercase tracking-wider font-montserrat">Pages <span className="text-stone-light ml-1 font-normal">({pages.length})</span></h3>
              <div className="flex gap-1">
                <button onClick={addPage} className="w-6 h-6 flex items-center justify-center rounded bg-stone-light/10 hover:bg-stone-light/20 text-text-primary transition-colors" title="Add Page">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              </div>
            </div>
            <div className={`flex-1 p-3 ${isMobile ? 'flex gap-3' : 'space-y-1'}`}>
              {pages.map((page, idx) => (
                <div key={page.id}
                  className={`group rounded-xl border transition-all duration-200 flex flex-col ${currentIdx === idx ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-500/30 shadow-sm' : 'bg-transparent border-transparent hover:bg-stone-light/5'}`}>
                  <div className="flex items-center">
                     <button onClick={() => setCurrentIdx(idx)} className="flex-1 text-left p-3 flex items-center gap-3">
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${currentIdx === idx ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-stone-light/10 text-text-secondary'}`}>
                         {idx + 1}
                       </div>
                       <div className="flex-1 overflow-hidden">
                         <div className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider mb-0.5">{page.type}</div>
                         <div className={`text-xs font-medium truncate ${currentIdx === idx ? 'text-blue-700 dark:text-blue-400' : 'text-text-primary dark:text-dark-text-primary'}`}>
                           {getSpec(page.layoutId).name}
                         </div>
                       </div>
                     </button>
                     <div className={`flex flex-col gap-0.5 pr-2 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                       <button onClick={() => movePage(idx, -1)} disabled={idx === 0} title="Move up" className="text-[9px] w-5 h-5 flex items-center justify-center bg-stone-light/10 rounded hover:bg-stone-light/20 disabled:opacity-30">▲</button>
                       <button onClick={() => movePage(idx, 1)} disabled={idx === pages.length - 1} title="Move down" className="text-[9px] w-5 h-5 flex items-center justify-center bg-stone-light/10 rounded hover:bg-stone-light/20 disabled:opacity-30">▼</button>
                     </div>
                  </div>
                  {/* Delete button inline on hover for cleaner UI */}
                  {currentIdx === idx && (
                     <div className="px-3 pb-2 flex justify-end">
                       <button onClick={() => deletePage(idx)} disabled={pages.length <= 1} className="text-[10px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded transition">Delete Page</button>
                     </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Cosmo Assistant Prompt */}
            <div className="p-4 mt-auto">
               <div className="bg-gradient-to-br from-[#D4AF37]/10 to-[#9C7416]/5 border border-[#D4AF37]/20 rounded-xl p-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#D4AF37]/10 rounded-full blur-xl"></div>
                  <h4 className="text-xs font-bold text-[#D4AF37] mb-1 font-montserrat flex items-center gap-1.5">✨ Cosmo Assistant</h4>
                  <p className="text-[10px] text-text-secondary dark:text-dark-text-secondary mb-3 leading-relaxed">Let AI detect image types and build the perfect layout.</p>
                  <button onClick={aiAnalyze} disabled={!!analyzing} className="w-full py-1.5 bg-gradient-to-r from-[#D4AF37] to-[#9C7416] text-white rounded text-[11px] font-semibold hover:brightness-110 transition disabled:opacity-50">
                    {analyzing ? 'Analyzing...' : 'Auto-Layout Magic'}
                  </button>
               </div>
            </div>
          </aside>
        )}

        {/* Center: Floating parametric canvas */}
        <main className={`${isMobile ? (mobileTab === 'canvas' ? 'block absolute inset-0 z-10 w-full' : 'hidden') : 'flex-1'} overflow-y-auto bg-[#F5F5F3] dark:bg-[#111111] p-6 md:p-16 lg:p-24 flex justify-center items-start`}>
          {mode === 'view' ? (
            <div className="w-full max-w-[680px] space-y-12" style={{ pointerEvents: 'none' }}>
              {pages.map((page, idx) => (
                <div key={page.id} className="relative group">
                  <div className="absolute -left-12 top-0 bottom-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-bold text-stone-300">{idx + 1}</span>
                  </div>
                  <div className="shadow-[0_20px_50px_rgb(0,0,0,0.1)] rounded-sm overflow-hidden bg-white">
                    <PageComposer page={page} tokens={tokens} onChange={() => {}} showWatermark={!isPro} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            currentPage && (
              <div className="w-full max-w-[680px] relative group">
                <div className="absolute -left-12 top-0 bottom-0 flex items-center justify-center opacity-30">
                   <span className="text-xs font-bold text-stone-500">{currentIdx + 1}</span>
                </div>
                {/* Canvas Box */}
                <div className="shadow-[0_20px_50px_rgb(0,0,0,0.1)] rounded-sm overflow-hidden bg-white ring-1 ring-stone-light/20 transition-all">
                  <PageComposer page={currentPage} tokens={tokens} onChange={updatePage} onUploadImage={uploadImage} showWatermark={!isPro} />
                </div>
                <div className="mt-4 flex justify-between items-center text-[11px] text-stone-400 font-medium">
                  <span>{currentPage.type.toUpperCase()}</span>
                  <span>{getSpec(currentPage.layoutId).name}</span>
                </div>
              </div>
            )
          )}
        </main>

        {/* Right: Modern Tabbed Properties */}
        {mode === 'edit' && (
          <aside className={`${isMobile ? (mobileTab === 'design' ? 'absolute inset-0 z-20 w-full bg-white pb-16' : 'hidden') : 'w-80 border-l border-stone-light/10'} bg-white dark:bg-[#1A1A1A] overflow-y-auto flex-shrink-0 flex flex-col`}>
            {/* Tabbed Navigation */}
            <div className="flex border-b border-stone-light/10 bg-stone-light/5 p-2 gap-1 sticky top-0 z-10 backdrop-blur-md">
              <button onClick={() => setPublishingTab('style')} className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all ${publishingTab === 'style' ? 'bg-white dark:bg-[#2A2A2A] text-text-primary dark:text-dark-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
                Style
              </button>
              <button onClick={() => setPublishingTab('templates')} className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all ${publishingTab === 'templates' ? 'bg-white dark:bg-[#2A2A2A] text-text-primary dark:text-dark-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
                Layouts
              </button>
              <button onClick={() => setPublishingTab('publishing')} className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all ${publishingTab === 'publishing' ? 'bg-white dark:bg-[#2A2A2A] text-text-primary dark:text-dark-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
                Publish
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* STYLE TAB */}
              {publishingTab === 'style' && (
                <div className="p-5 space-y-8">
                  {/* Style Presets */}
                  <div>
                    <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-3">Brand Presets</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {STYLE_DNA.map(s => (
                        <button key={s.id} onClick={() => setToken(s.tokens)} title={s.description}
                          className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-light/20 bg-stone-light/5 hover:border-blue-400/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition group">
                          <span className="flex -space-x-1 flex-shrink-0">
                            <span className="w-4 h-4 rounded-full shadow-sm ring-2 ring-white dark:ring-black relative z-30" style={{ background: s.tokens.primary }} />
                            <span className="w-4 h-4 rounded-full shadow-sm ring-2 ring-white dark:ring-black relative z-20" style={{ background: s.tokens.accent }} />
                            <span className="w-4 h-4 rounded-full shadow-sm ring-2 ring-white dark:ring-black relative z-10" style={{ background: s.tokens.background }} />
                          </span>
                          <span className="text-[10px] font-semibold text-text-primary dark:text-dark-text-primary truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">{s.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Colors */}
                  <div>
                    <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-3">Custom Colors</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {([['background', 'Canvas'], ['text', 'Ink'], ['primary', 'Brand'], ['accent', 'Accent']] as const).map(([k, label]) => (
                        <div key={k} className="bg-stone-light/5 border border-stone-light/10 rounded-lg p-2.5 flex items-center justify-between">
                           <span className="text-[11px] font-medium text-text-primary dark:text-dark-text-primary">{label}</span>
                           <label className="cursor-pointer relative overflow-hidden rounded shadow-sm">
                             <input type="color" value={(tokens as any)[k] || '#000000'} onChange={e => setToken({ [k]: e.target.value } as any)}
                               className="w-6 h-6 absolute -top-2 -left-2 w-10 h-10 opacity-0 cursor-pointer" />
                             <div className="w-5 h-5 rounded" style={{ backgroundColor: (tokens as any)[k] || '#000000' }}></div>
                           </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Typography */}
                  <div>
                    <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-3">Typography</h3>
                    <div className="space-y-3">
                      <div>
                         <label className="block text-[10px] font-medium text-text-secondary mb-1">Headings</label>
                         <select value={tokens.headingFont} onChange={e => setToken({ headingFont: e.target.value })}
                           className="w-full px-3 py-2 text-[11px] font-medium border border-stone-light/20 rounded-lg bg-stone-light/5 focus:ring-2 focus:ring-blue-500 outline-none">
                           {HEADING_FONTS.map(f => <option key={f} value={f}>{f.split(',')[0]}</option>)}
                         </select>
                      </div>
                      <div>
                         <label className="block text-[10px] font-medium text-text-secondary mb-1">Body Text</label>
                         <select value={tokens.bodyFont} onChange={e => setToken({ bodyFont: e.target.value })}
                           className="w-full px-3 py-2 text-[11px] font-medium border border-stone-light/20 rounded-lg bg-stone-light/5 focus:ring-2 focus:ring-blue-500 outline-none">
                           {BODY_FONTS.map(f => <option key={f} value={f}>{f.split(',')[0]}</option>)}
                         </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATES TAB */}
              {publishingTab === 'templates' && (
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-stone-light/10 sticky top-0 bg-white dark:bg-[#1A1A1A] z-10">
                    <div className="relative">
                      <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                      <input value={layoutSearch} onChange={e => setLayoutSearch(e.target.value)}
                        placeholder="Find layout..."
                        className="w-full pl-9 pr-3 py-2 text-xs font-medium border border-stone-light/20 rounded-lg bg-stone-light/5 focus:ring-2 focus:ring-blue-500 outline-none transition" />
                    </div>
                    <div className="flex gap-1.5 mt-3 overflow-x-auto hide-scrollbar pb-1">
                      {(['All', ...LAYOUT_CATEGORIES] as const).map(cat => (
                        <button key={cat} onClick={() => setLayoutCat(cat)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${layoutCat === cat ? 'bg-text-primary text-white dark:bg-white dark:text-black' : 'bg-stone-light/10 text-text-secondary hover:bg-stone-light/20'}`}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 flex-1">
                    <div className="grid grid-cols-2 gap-3">
                      {filteredLayouts.map(spec => {
                        const active = currentPage?.layoutId === spec.id
                        return (
                          <button key={spec.id} onClick={() => switchLayout(spec.id)} title={spec.name}
                            className={`group rounded-xl p-1.5 border-2 transition-all duration-200 ${active ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm' : 'border-transparent bg-stone-light/5 hover:border-stone-light/30 hover:bg-stone-light/10'}`}>
                            <div className="bg-white rounded-lg overflow-hidden border border-stone-light/10">
                               <LayoutThumb spec={spec} tokens={tokens} active={active} />
                            </div>
                            <div className={`text-[9px] font-semibold mt-2 truncate text-center ${active ? 'text-blue-700 dark:text-blue-400' : 'text-text-secondary group-hover:text-text-primary'}`}>{spec.name}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* PUBLISHING TAB */}
              {publishingTab === 'publishing' && (
                <div className="p-5">
                  <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-4">Print Settings</h3>
                  <ProfessionalPublishingSettings
                    portfolio={publishingPortfolio}
                    onUpdate={setPublishingPortfolio}
                  />
                </div>
              )}
            </div>
          </aside>
        )}
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
