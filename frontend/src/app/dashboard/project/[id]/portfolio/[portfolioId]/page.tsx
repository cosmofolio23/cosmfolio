'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { PRESET_PACKS, StylePack } from '@/components/design-system/StylePackGallery'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Page {
  id: string
  type: string
  name: string
  html: string
  current_layout?: string
  available_layouts?: string[]
}

const LAYOUT_OPTIONS = [
  { id: 'project-hero-image', name: 'Hero Image', icon: '🖼️', desc: 'Big image, text below' },
  { id: 'project-grid-3col', name: '3-Col Grid', icon: '⊞', desc: 'Six images in grid' },
  { id: 'project-plan-section', name: 'Plan + Sections', icon: '📐', desc: 'Floor plan focus' },
  { id: 'project-asymmetric', name: 'Asymmetric', icon: '◱', desc: 'Magazine-style' },
  { id: 'project-masonry', name: 'Masonry', icon: '▦', desc: 'Pinterest-style' },
  { id: 'project-fullbleed', name: 'Full-bleed', icon: '🎬', desc: 'Cinematic with overlay' },
  { id: 'project-two-col-text', name: 'Two Column', icon: '⫾', desc: 'Text + image stack' },
  { id: 'project-gallery-wall', name: 'Gallery Wall', icon: '◧', desc: 'Mosaic varied sizes' },
  { id: 'project-blueprint', name: 'Blueprint', icon: '📋', desc: 'Technical drawings' },
  { id: 'project-story-timeline', name: 'Story', icon: '⟶', desc: 'Process narrative' },
]

export default function PortfolioFlipbookPage() {
  const params = useParams()
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()
  const [portfolio, setPortfolio] = useState<any>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [headHtml, setHeadHtml] = useState<string>('')
  const [spreadIndex, setSpreadIndex] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const touchStartRef = useRef(0)
  const [isRendering, setIsRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPack, setSelectedPack] = useState<StylePack>(PRESET_PACKS[0])
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next')
  const [isFlipping, setIsFlipping] = useState(false)
  const [showPacks, setShowPacks] = useState(false)
  const [showJump, setShowJump] = useState(false)
  const [showLayoutPicker, setShowLayoutPicker] = useState<string | null>(null)  // page ID being edited
  const [pageLayouts, setPageLayouts] = useState<Record<string, string>>({})  // pageId → layoutId
  const [editingPage, setEditingPage] = useState<{ id: string; index: number } | null>(null)  // open content editor for this project
  const [editTab, setEditTab] = useState<'content' | 'images'>('content')
  const [editForm, setEditForm] = useState<{ name: string; location: string; year: string; typology: string; description: string }>({
    name: '', location: '', year: '', typology: '', description: ''
  })
  const [editAssets, setEditAssets] = useState<Record<string, string[]>>({
    renders: [], plans: [], sections: [], elevations: [], concepts: [], diagrams: []
  })
  const [editProjects, setEditProjects] = useState<any[]>([])  // cache of design_projects from wizard config
  const [aiGenerating, setAiGenerating] = useState<string | null>(null)  // mode being generated
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareEnabled, setShareEnabled] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasLoadedInitialRef = useRef(false)

  // Debounced auto-save
  const scheduleSave = useCallback((pack: StylePack, layouts: Record<string, string>) => {
    if (!hasLoadedInitialRef.current) return  // Don't save on initial load
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    setSaveStatus('saving')
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const savedToken = token || localStorage.getItem('auth_token')
        const res = await fetch(`${API_URL}/api/portfolios/${params.portfolioId}/customization`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${savedToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            style_pack_data: pack,
            page_layouts: layouts,
          }),
        })
        if (res.ok) {
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 2000)
        } else {
          setSaveStatus('error')
        }
      } catch {
        setSaveStatus('error')
      }
    }, 1200)
  }, [token, params.portfolioId])

  // Total spreads: cover is single, then pairs, last might be single
  // Spread 0 = [cover, page-1]
  // Spread 1 = [page-2, page-3]
  // etc.
  const totalSpreads = Math.max(1, Math.ceil((pages.length + 1) / 2))

  // Get pages for current spread
  const getSpreadPages = (spread: number): { left: Page | null; right: Page | null } => {
    if (spread === 0) {
      // First spread: only right (cover)
      return { left: null, right: pages[0] || null }
    }
    const leftIdx = spread * 2 - 1
    const rightIdx = spread * 2
    return {
      left: pages[leftIdx] || null,
      right: pages[rightIdx] || null,
    }
  }

  useEffect(() => {
    // Detect mobile/tablet on mount and window resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) { router.push('/signin'); return }
    loadPortfolio()
    // Log view event
    logAnalyticsEvent('view')
  }, [isAuthenticated, token])

  const logAnalyticsEvent = (eventType: 'view' | 'share' | 'download', data?: any) => {
    try {
      const endpoint = `${API_URL}/api/portfolios/${params.portfolioId}/analytics/${eventType}`
      const body = data ? JSON.stringify(data) : '{}'
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      }).catch(() => {}) // Fail silently
    } catch (e) {}
  }

  // Touch swipe handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStartRef.current - touchEnd

    // Swipe left = next, swipe right = prev
    if (Math.abs(diff) > 50) {  // min swipe distance
      if (diff > 0) {
        flipTo(spreadIndex + 1)
      } else {
        flipTo(spreadIndex - 1)
      }
    }
  }

  const loadPortfolio = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const savedToken = token || localStorage.getItem('auth_token')
      if (!savedToken) { setError('Not authenticated'); setIsLoading(false); return }

      // Get portfolio metadata
      const metaRes = await fetch(`${API_URL}/api/portfolios/view/${params.portfolioId}`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      if (metaRes.ok) {
        const meta = await metaRes.json()
        setPortfolio(meta)
        // Restore saved customizations
        const ps = meta.page_structure || {}
        const savedPack = ps.style_pack
        if (savedPack && savedPack.colors) {
          // Use saved pack directly (handles custom + AI-generated)
          setSelectedPack(savedPack as StylePack)
        } else {
          const currentPack = PRESET_PACKS.find(p => p.id === meta.style_pack) || PRESET_PACKS[0]
          setSelectedPack(currentPack)
        }
        // Restore per-page layouts
        const savedLayouts = ps.page_layouts || {}
        if (Object.keys(savedLayouts).length > 0) {
          setPageLayouts(savedLayouts)
        }
        // Restore share state
        const share = ps.share || {}
        if (share.enabled && share.slug) {
          setShareEnabled(true)
          const origin = typeof window !== 'undefined' ? window.location.origin : ''
          setShareUrl(`${origin}/p/${share.slug}`)
        }
      }

      // Get paged data (new endpoint - may not be deployed yet)
      let gotPages = false
      try {
        const pagesRes = await fetch(`${API_URL}/api/portfolios/${params.portfolioId}/pages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${savedToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        })
        if (pagesRes.ok) {
          const data = await pagesRes.json()
          setPages(data.pages || [])
          setHeadHtml(data.head_html || '')
          gotPages = true
        }
      } catch (e) { console.warn('Pages endpoint unavailable, falling back to preview') }

      // FALLBACK: use /preview endpoint and parse pages client-side
      if (!gotPages) {
        const previewRes = await fetch(`${API_URL}/api/portfolios/${params.portfolioId}/preview`, {
          headers: { 'Authorization': `Bearer ${savedToken}` }
        })
        if (previewRes.ok) {
          const data = await previewRes.json()
          const html = data.html || ''
          // Parse pages from full HTML
          const parser = new DOMParser()
          const doc = parser.parseFromString(html, 'text/html')
          const sections = Array.from(doc.querySelectorAll('section.page'))
          const head = doc.head?.innerHTML || ''
          const parsedPages = sections.map((sec, idx) => {
            const heading = sec.querySelector('h1, h2')?.textContent?.trim() || `Page ${idx + 1}`
            const cls = sec.className || ''
            const type = cls.includes('cover') ? 'cover'
              : cls.includes('about') ? 'about'
              : cls.includes('contents') ? 'contents'
              : cls.includes('end') ? 'end'
              : 'project'
            return {
              id: `${type}-${idx}`,
              type,
              name: heading.slice(0, 30),
              html: sec.outerHTML,
            }
          })
          setPages(parsedPages)
          setHeadHtml(`<head>${head}<style>* {margin:0; padding:0; box-sizing:border-box;} body{background:white;} .page{width:100%;min-height:100vh;} img{display:block;max-width:100%;}</style></head>`)
        } else {
          setError(`Failed to render: ${previewRes.status}`)
        }
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setIsLoading(false)
      // Allow auto-save after initial load completes
      setTimeout(() => { hasLoadedInitialRef.current = true }, 500)
    }
  }

  // Toggle public share
  const toggleShare = async (enable: boolean) => {
    setShareLoading(true)
    try {
      const savedToken = token || localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/api/portfolios/${params.portfolioId}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${savedToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: enable }),
      })
      if (res.ok) {
        const data = await res.json()
        setShareEnabled(data.is_public)
        if (data.share_slug) {
          const origin = typeof window !== 'undefined' ? window.location.origin : ''
          setShareUrl(`${origin}/p/${data.share_slug}`)
        } else {
          setShareUrl(null)
        }
      } else {
        alert('Failed to update share settings')
      }
    } catch (e: any) {
      alert(`Share error: ${e.message}`)
    } finally {
      setShareLoading(false)
    }
  }

  const copyShareLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      // Log share event
      logAnalyticsEvent('share', { platform: 'link' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea')
      ta.value = shareUrl
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      logAnalyticsEvent('share', { platform: 'link' })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Open content editor for a project page
  const openEditor = async (pageId: string) => {
    // Extract project index from pageId (e.g. "project-2" → 2)
    const match = pageId.match(/^project-(\d+)$/)
    if (!match) return
    const idx = parseInt(match[1])

    // Fetch current wizard config for this project
    try {
      const savedToken = token || localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/api/portfolios/${params.id}/wizard-config`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      let dpList: any[] = []
      if (res.ok) {
        const data = await res.json()
        const cfg = data.config || data.config_data || data
        dpList = cfg?.design_projects || []
      }
      setEditProjects(dpList)
      const dp = dpList[idx] || {}
      setEditForm({
        name: dp.name || '',
        location: dp.location || '',
        year: dp.year || '',
        typology: dp.typology || '',
        description: dp.description || '',
      })
      setEditAssets({
        renders: dp.assets?.renders || [],
        plans: dp.assets?.plans || [],
        sections: dp.assets?.sections || [],
        elevations: dp.assets?.elevations || [],
        concepts: dp.assets?.concepts || [],
        diagrams: dp.assets?.diagrams || [],
      })
      setEditTab('content')
      setEditingPage({ id: pageId, index: idx })
    } catch (e) {
      console.error('Failed to load project for edit:', e)
      setEditForm({ name: '', location: '', year: '', typology: '', description: '' })
      setEditAssets({ renders: [], plans: [], sections: [], elevations: [], concepts: [], diagrams: [] })
      setEditingPage({ id: pageId, index: idx })
    }
  }

  // Upload a new image to a category
  const uploadAssetToCategory = async (category: string, file: File) => {
    setUploadingCategory(category)
    try {
      const savedToken = token || localStorage.getItem('auth_token')
      const formData = new FormData()
      formData.append('files', file)
      const assetType = category.slice(0, -1)  // "renders" → "render"
      const res = await fetch(
        `${API_URL}/api/projects/${params.id}/assets/bulk?asset_type=${assetType}`,
        { method: 'POST', headers: { 'Authorization': `Bearer ${savedToken}` }, body: formData }
      )
      if (res.ok) {
        const data = await res.json()
        const uploadedUrl = data.assets?.[0]?.file_url
        if (uploadedUrl) {
          setEditAssets(prev => ({
            ...prev,
            [category]: [...(prev[category] || []), uploadedUrl]
          }))
        }
      } else {
        alert(`Upload failed: ${res.status}`)
      }
    } catch (e: any) {
      alert(`Upload error: ${e.message}`)
    } finally {
      setUploadingCategory(null)
    }
  }

  const removeAsset = (category: string, url: string) => {
    setEditAssets(prev => ({
      ...prev,
      [category]: prev[category].filter(u => u !== url)
    }))
  }

  const moveAsset = (category: string, idx: number, direction: 'up' | 'down') => {
    setEditAssets(prev => {
      const arr = [...(prev[category] || [])]
      const newIdx = direction === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= arr.length) return prev
      ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
      return { ...prev, [category]: arr }
    })
  }

  // Save content edits
  const saveEdits = async () => {
    if (!editingPage) return
    setSaveStatus('saving')
    try {
      const savedToken = token || localStorage.getItem('auth_token')
      const res = await fetch(
        `${API_URL}/api/portfolios/${params.id}/wizard-config/project/${editingPage.index}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${savedToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...editForm, assets: editAssets }),
        }
      )
      if (res.ok) {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
        setEditingPage(null)
        // Re-fetch pages with new content
        setIsRendering(true)
        try {
          const pagesRes = await fetch(`${API_URL}/api/portfolios/${params.portfolioId}/pages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${savedToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ style_pack_data: selectedPack, page_layouts: pageLayouts }),
          })
          if (pagesRes.ok) {
            const data = await pagesRes.json()
            setPages(data.pages || [])
          }
        } finally { setIsRendering(false) }
      } else {
        setSaveStatus('error')
        const err = await res.text()
        alert(`Save failed: ${err.slice(0, 200)}`)
      }
    } catch (e: any) {
      setSaveStatus('error')
      alert(`Save error: ${e.message}`)
    }
  }

  // AI generate/improve description
  const aiHelp = async (mode: 'generate' | 'improve' | 'shorten' | 'expand') => {
    setAiGenerating(mode)
    try {
      const savedToken = token || localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/api/portfolios/${params.id}/ai/generate-description`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${savedToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode,
          project_name: editForm.name,
          typology: editForm.typology,
          location: editForm.location,
          year: editForm.year,
          current_description: editForm.description,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setEditForm(prev => ({ ...prev, description: data.description || prev.description }))
      } else {
        alert('AI generation failed. Try again.')
      }
    } catch (e: any) {
      alert(`AI error: ${e.message}`)
    } finally {
      setAiGenerating(null)
    }
  }

  // Swap layout for a single page (preserve current pack + other page layouts)
  const switchPageLayout = async (pageId: string, newLayoutId: string) => {
    const nextLayouts = { ...pageLayouts, [pageId]: newLayoutId }
    setPageLayouts(nextLayouts)
    setShowLayoutPicker(null)
    setIsRendering(true)
    scheduleSave(selectedPack, nextLayouts)
    try {
      const savedToken = token || localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/api/portfolios/${params.portfolioId}/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${savedToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          style_pack_data: selectedPack,
          page_layouts: nextLayouts,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setPages(data.pages || [])
        setHeadHtml(data.head_html || '')
      } else {
        // Fallback: revert if server doesn't support per-page layouts yet
        console.warn('Per-page layout not supported, keeping local state')
      }
    } catch (e) {
      console.error('Layout switch failed:', e)
    } finally {
      setIsRendering(false)
    }
  }

  // Re-fetch pages with a new pack
  const switchPack = async (pack: StylePack) => {
    setSelectedPack(pack)
    setShowPacks(false)
    setIsRendering(true)
    scheduleSave(pack, pageLayouts)
    try {
      const savedToken = token || localStorage.getItem('auth_token')

      // Try new pages endpoint
      let gotPages = false
      try {
        const res = await fetch(`${API_URL}/api/portfolios/${params.portfolioId}/pages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${savedToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ style_pack_data: pack, page_layouts: pageLayouts }),
        })
        if (res.ok) {
          const data = await res.json()
          setPages(data.pages || [])
          setHeadHtml(data.head_html || '')
          gotPages = true
        }
      } catch {}

      // Fallback: render-with-pack returns full HTML, parse pages
      if (!gotPages) {
        const res = await fetch(`${API_URL}/api/portfolios/${params.portfolioId}/render-with-pack`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${savedToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ style_pack_data: pack }),
        })
        if (res.ok) {
          const data = await res.json()
          const html = data.html || ''
          const parser = new DOMParser()
          const doc = parser.parseFromString(html, 'text/html')
          const sections = Array.from(doc.querySelectorAll('section.page'))
          const head = doc.head?.innerHTML || ''
          const parsedPages = sections.map((sec, idx) => {
            const heading = sec.querySelector('h1, h2')?.textContent?.trim() || `Page ${idx + 1}`
            const cls = sec.className || ''
            const type = cls.includes('cover') ? 'cover'
              : cls.includes('about') ? 'about'
              : cls.includes('contents') ? 'contents'
              : cls.includes('end') ? 'end'
              : 'project'
            return {
              id: `${type}-${idx}`,
              type,
              name: heading.slice(0, 30),
              html: sec.outerHTML,
            }
          })
          setPages(parsedPages)
          setHeadHtml(`<head>${head}<style>* {margin:0; padding:0; box-sizing:border-box;} body{background:white;} .page{width:100%;min-height:100vh;} img{display:block;max-width:100%;}</style></head>`)
        }
      }
    } catch (e) {
      console.error('Switch pack failed:', e)
    } finally {
      setIsRendering(false)
    }
  }

  const flipTo = useCallback((targetSpread: number) => {
    if (isFlipping) return
    if (targetSpread < 0 || targetSpread >= totalSpreads) return
    setFlipDirection(targetSpread > spreadIndex ? 'next' : 'prev')
    setIsFlipping(true)
    setTimeout(() => {
      setSpreadIndex(targetSpread)
      setTimeout(() => setIsFlipping(false), 50)
    }, 300)
  }, [spreadIndex, totalSpreads, isFlipping])

  const next = () => flipTo(spreadIndex + 1)
  const prev = () => flipTo(spreadIndex - 1)

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [spreadIndex, totalSpreads])

  const handlePrint = () => {
    const allPagesHtml = pages.map(p => p.html).join('\n')
    const printDoc = `<!DOCTYPE html><html>${headHtml}<body>${allPagesHtml}<style>
      @media print { .page { page-break-after: always; } }
    </style></body></html>`
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(printDoc)
      w.document.close()
      setTimeout(() => w.print(), 500)
    }
  }

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const savedToken = token || localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/api/portfolios/${params.portfolioId}/export/pdf`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      if (!res.ok) {
        alert(`Export failed: ${res.status}`)
        setExporting(false)
        return
      }
      const blob = await res.blob()
      const filename = `portfolio-${new Date().toISOString().slice(0, 10)}.pdf`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      // Log download event
      logAnalyticsEvent('download', { format: 'pdf' })
    } catch (e: any) {
      alert(`Export error: ${e.message}`)
    } finally {
      setExporting(false)
    }
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center text-white">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4 mx-auto"></div>
        <p className="text-white/70">Opening your portfolio book...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-lg">
        <h2 className="text-xl font-bold text-red-700 mb-3">⚠️ Error</h2>
        <pre className="text-sm bg-red-50 p-4 rounded text-red-800 overflow-auto">{error}</pre>
        <button onClick={loadPortfolio} className="btn-primary mt-4">Retry</button>
      </div>
    </div>
  )

  const { left, right } = getSpreadPages(spreadIndex)
  const isFirstSpread = spreadIndex === 0
  const isLastSpread = spreadIndex === totalSpreads - 1

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-800 via-slate-900 to-black overflow-hidden">

      {/* Top Toolbar */}
      <div className="bg-black/40 backdrop-blur-lg border-b border-white/10 flex-shrink-0 z-50 px-4 py-2.5 flex items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/dashboard/project/${params.id}/generate`}
            className="text-white/70 hover:text-white transition-colors text-sm flex items-center gap-1 whitespace-nowrap"
          >
            ← Back
          </Link>
          <div className="h-4 w-px bg-white/20"></div>
          <span className="text-sm font-bold">📖 Portfolio Book</span>
        </div>

        <div className="flex gap-2 items-center">
          {/* Save status */}
          {saveStatus === 'saving' && (
            <span className="text-xs text-yellow-300 flex items-center gap-1">
              <span className="animate-pulse">●</span> Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              ✓ Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs text-red-400 flex items-center gap-1">
              ⚠ Save failed
            </span>
          )}
          {isRendering && saveStatus === 'idle' && (
            <span className="text-xs text-blue-300 flex items-center gap-1">
              <span className="animate-spin">⟳</span> Updating...
            </span>
          )}

          {/* Jump to page */}
          <div className="relative">
            <button
              onClick={() => setShowJump(!showJump)}
              className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition flex items-center gap-1"
            >
              📑 Spread {spreadIndex + 1} / {totalSpreads}
            </button>
            {showJump && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-2xl p-2 w-64 max-h-80 overflow-y-auto z-50">
                {pages.map((p, idx) => {
                  const targetSpread = idx === 0 ? 0 : Math.floor((idx + 1) / 2)
                  return (
                    <button
                      key={p.id}
                      onClick={() => { flipTo(targetSpread); setShowJump(false) }}
                      className="w-full text-left px-3 py-2 rounded text-charcoal text-sm hover:bg-bg-subtle transition flex items-center gap-2"
                    >
                      <span>{
                        p.type === 'cover' ? '🏠' :
                        p.type === 'about' ? '👤' :
                        p.type === 'contents' ? '📋' :
                        p.type === 'end' ? '📞' : '🏗️'
                      }</span>
                      <span className="truncate">{p.name}</span>
                      <span className="ml-auto text-xs text-stone-light">p.{idx + 1}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Style picker */}
          <div className="relative">
            <button
              onClick={() => setShowPacks(!showPacks)}
              className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition flex items-center gap-1"
              title="Change design pack"
            >
              <div className="flex h-3 w-12 rounded overflow-hidden">
                <div style={{ background: selectedPack.colors.primary, width: '30%' }} />
                <div style={{ background: selectedPack.colors.accent, width: '20%' }} />
                <div style={{ background: selectedPack.colors.background, width: '50%' }} />
              </div>
              <span className="ml-1">🎨</span>
            </button>
            {showPacks && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-2xl p-2 w-72 max-h-96 overflow-y-auto z-50">
                <div className="text-xs font-bold text-stone uppercase tracking-wider mb-2 px-2">Design Packs</div>
                {PRESET_PACKS.map(pack => (
                  <button
                    key={pack.id}
                    onClick={() => switchPack(pack)}
                    className={`w-full text-left rounded mb-1 overflow-hidden border ${selectedPack.id === pack.id ? 'border-primary ring-1 ring-primary' : 'border-transparent hover:border-border-light'}`}
                  >
                    <div className="flex h-6">
                      <div style={{ background: pack.colors.primary, width: '30%' }} />
                      <div style={{ background: pack.colors.secondary, width: '20%' }} />
                      <div style={{ background: pack.colors.accent, width: '15%' }} />
                      <div style={{ background: pack.colors.background, width: '35%' }} />
                    </div>
                    <div className="p-2 bg-white">
                      <div className="text-xs font-bold text-charcoal truncate" style={{ fontFamily: pack.typography.heading_font }}>
                        {pack.name}
                      </div>
                      <div className="text-[10px] text-stone-light truncate">{pack.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShareModalOpen(true)}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition flex items-center gap-1 ${
              shareEnabled
                ? 'bg-green-500/30 hover:bg-green-500/40 text-green-200 border border-green-400/30'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={shareEnabled ? 'Public — anyone with link can view' : 'Share publicly'}
          >
            {shareEnabled ? '🌐 Public' : '🔗 Share'}
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="bg-amber-500 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-amber-600 disabled:opacity-50 flex items-center gap-1"
          >
            {exporting ? '⟳' : '📥'} PDF
          </button>

          <button
            onClick={handlePrint}
            className="bg-white text-charcoal px-3 py-1.5 rounded text-xs font-semibold hover:bg-white/90"
          >
            🖨️ Print
          </button>
        </div>
      </div>

      {/* Book Stage */}
      <div className="flex-1 relative flex items-center justify-center px-2 md:px-4 py-4 md:py-6 overflow-hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

        {/* Previous Edge */}
        {!isFirstSpread && (
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full text-white text-2xl flex items-center justify-center transition group"
            title="Previous spread (←)"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">‹</span>
          </button>
        )}

        {/* Next Edge */}
        {!isLastSpread && (
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full text-white text-2xl flex items-center justify-center transition group"
            title="Next spread (→)"
          >
            <span className="group-hover:translate-x-0.5 transition-transform">›</span>
          </button>
        )}

        {/* The Book */}
        <div
          className={`book-container ${isFlipping ? `flipping flip-${flipDirection}` : ''}`}
          style={{
            display: 'flex',
            maxWidth: isMobile ? '100%' : '95%',
            maxHeight: '92%',
            aspectRatio: isMobile ? '0.707/1' : (isFirstSpread || isLastSpread ? '0.707/1' : '1.414/1'),
            background: '#1a1a1a',
            borderRadius: isMobile ? '0px' : '4px',
            boxShadow: isMobile ? 'none' : '0 30px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
            position: 'relative',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Center spine shadow */}
          {!isFirstSpread && !isLastSpread && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                width: '40px',
                marginLeft: '-20px',
                background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.25) 50%, transparent)',
                pointerEvents: 'none',
                zIndex: 5,
              }}
            />
          )}

          {/* LEFT PAGE */}
          {left && (
            <div style={{ width: '50%', height: '100%', background: 'white', overflow: 'hidden', borderRight: '1px solid rgba(0,0,0,0.1)', position: 'relative' }}>
              <iframe
                srcDoc={`<!DOCTYPE html><html>${headHtml}<body>${left.html}</body></html>`}
                sandbox="allow-same-origin"
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={left.name}
              />
              {/* Page action buttons (project pages only) */}
              {left.type === 'project' && (
                <div className="absolute top-2 left-2 flex gap-1">
                  <button
                    onClick={() => setShowLayoutPicker(left.id)}
                    className="bg-black/70 hover:bg-black/90 backdrop-blur text-white text-[11px] px-2.5 py-1.5 rounded-full font-medium flex items-center gap-1 transition"
                    title="Change layout"
                  >
                    📐 Layout
                  </button>
                  <button
                    onClick={() => openEditor(left.id)}
                    className="bg-emerald-600/80 hover:bg-emerald-600 backdrop-blur text-white text-[11px] px-2.5 py-1.5 rounded-full font-medium flex items-center gap-1 transition"
                    title="Edit content"
                  >
                    ✏️ Edit
                  </button>
                </div>
              )}
            </div>
          )}

          {/* RIGHT PAGE (always shows on first spread = cover) */}
          {right && (
            <div style={{
              width: isFirstSpread || isLastSpread ? '100%' : '50%',
              height: '100%',
              background: 'white',
              overflow: 'hidden',
              position: 'relative',
            }}>
              <iframe
                srcDoc={`<!DOCTYPE html><html>${headHtml}<body>${right.html}</body></html>`}
                sandbox="allow-same-origin"
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={right.name}
              />
              {/* Page action buttons (project pages only) */}
              {right.type === 'project' && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => openEditor(right.id)}
                    className="bg-emerald-600/80 hover:bg-emerald-600 backdrop-blur text-white text-[11px] px-2.5 py-1.5 rounded-full font-medium flex items-center gap-1 transition"
                    title="Edit content"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => setShowLayoutPicker(right.id)}
                    className="bg-black/70 hover:bg-black/90 backdrop-blur text-white text-[11px] px-2.5 py-1.5 rounded-full font-medium flex items-center gap-1 transition"
                    title="Change layout"
                  >
                    📐 Layout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Layout Picker Overlay */}
        {showLayoutPicker && (
          <div
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowLayoutPicker(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-charcoal">📐 Choose Layout for This Page</h3>
                  <p className="text-xs text-stone-light mt-1">
                    Each page can have a different layout — design style stays the same
                  </p>
                </div>
                <button
                  onClick={() => setShowLayoutPicker(null)}
                  className="text-stone-light hover:text-charcoal p-2"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {LAYOUT_OPTIONS.map((layout) => {
                  const isActive = (pageLayouts[showLayoutPicker] || pages.find(p => p.id === showLayoutPicker)?.current_layout) === layout.id
                  return (
                    <button
                      key={layout.id}
                      onClick={() => switchPageLayout(showLayoutPicker, layout.id)}
                      className={`text-left p-3 rounded-xl border-2 transition ${
                        isActive
                          ? 'border-primary bg-blue-50 ring-2 ring-primary/30'
                          : 'border-border-light hover:border-stone-light hover:bg-bg-subtle'
                      }`}
                    >
                      <div className="text-3xl mb-2">{layout.icon}</div>
                      <div className="font-bold text-sm text-charcoal">{layout.name}</div>
                      <div className="text-xs text-stone-light mt-1">{layout.desc}</div>
                      {isActive && (
                        <div className="text-xs text-primary font-semibold mt-2">✓ Current</div>
                      )}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-stone-light text-center mt-4">
                💡 Tip: Mix different layouts across projects for visual variety
              </p>
            </div>
          </div>
        )}

        {/* CONTENT EDIT PANEL */}
        {editingPage && (
          <div
            className="absolute inset-0 z-40 flex items-stretch justify-end bg-black/60 backdrop-blur-sm"
            onClick={() => setEditingPage(null)}
          >
            <div
              className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-border-light sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-charcoal">✏️ Edit Page</h3>
                    <p className="text-xs text-stone-light mt-0.5">Project #{editingPage.index + 1}</p>
                  </div>
                  <button
                    onClick={() => setEditingPage(null)}
                    className="text-stone-light hover:text-charcoal p-2"
                  >
                    ✕
                  </button>
                </div>
                {/* Tabs */}
                <div className="flex gap-2 -mb-4">
                  <button
                    onClick={() => setEditTab('content')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
                      editTab === 'content'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-stone-light hover:text-charcoal'
                    }`}
                  >
                    📝 Content
                  </button>
                  <button
                    onClick={() => setEditTab('images')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
                      editTab === 'images'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-stone-light hover:text-charcoal'
                    }`}
                  >
                    🖼️ Images ({Object.values(editAssets).reduce((s, a) => s + a.length, 0)})
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {editTab === 'content' && (
              <div className="flex-1 p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone uppercase tracking-wider mb-1">Project Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-border-light rounded-lg text-sm"
                    placeholder="e.g. Museum Redesign"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone uppercase tracking-wider mb-1">Location</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                      className="w-full px-3 py-2 border border-border-light rounded-lg text-sm"
                      placeholder="Mumbai, India"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone uppercase tracking-wider mb-1">Year</label>
                    <input
                      type="text"
                      value={editForm.year}
                      onChange={e => setEditForm({ ...editForm, year: e.target.value })}
                      className="w-full px-3 py-2 border border-border-light rounded-lg text-sm"
                      placeholder="2025"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone uppercase tracking-wider mb-1">Typology</label>
                  <input
                    type="text"
                    value={editForm.typology}
                    onChange={e => setEditForm({ ...editForm, typology: e.target.value })}
                    className="w-full px-3 py-2 border border-border-light rounded-lg text-sm"
                    placeholder="Cultural / Residential / etc"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone uppercase tracking-wider">Description</label>
                    <span className="text-[10px] text-stone-light">{editForm.description.length} chars</span>
                  </div>
                  <textarea
                    value={editForm.description}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    rows={5}
                    className="w-full px-3 py-2 border border-border-light rounded-lg text-sm resize-none"
                    placeholder="A concise project description..."
                  />

                  {/* AI helper buttons */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      onClick={() => aiHelp('generate')}
                      disabled={!!aiGenerating}
                      className="text-xs px-2.5 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded font-medium transition disabled:opacity-50 flex items-center gap-1"
                    >
                      {aiGenerating === 'generate' ? '⟳' : '✨'} Generate
                    </button>
                    <button
                      onClick={() => aiHelp('improve')}
                      disabled={!!aiGenerating || !editForm.description}
                      className="text-xs px-2.5 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded font-medium transition disabled:opacity-50 flex items-center gap-1"
                    >
                      {aiGenerating === 'improve' ? '⟳' : '🔧'} Improve
                    </button>
                    <button
                      onClick={() => aiHelp('shorten')}
                      disabled={!!aiGenerating || !editForm.description}
                      className="text-xs px-2.5 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded font-medium transition disabled:opacity-50 flex items-center gap-1"
                    >
                      {aiGenerating === 'shorten' ? '⟳' : '✂️'} Shorten
                    </button>
                    <button
                      onClick={() => aiHelp('expand')}
                      disabled={!!aiGenerating || !editForm.description}
                      className="text-xs px-2.5 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded font-medium transition disabled:opacity-50 flex items-center gap-1"
                    >
                      {aiGenerating === 'expand' ? '⟳' : '📝'} Expand
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-light mt-1.5">
                    💡 AI will use the project name, typology and location to generate text
                  </p>
                </div>
              </div>
              )}

              {/* IMAGES TAB */}
              {editTab === 'images' && (
              <div className="flex-1 p-5 space-y-4 overflow-y-auto">
                {[
                  { key: 'renders', label: '🎨 Renders', desc: 'Photorealistic visuals' },
                  { key: 'plans', label: '📐 Plans', desc: 'Floor & site plans' },
                  { key: 'sections', label: '📏 Sections', desc: 'Building sections' },
                  { key: 'elevations', label: '🏢 Elevations', desc: 'Building elevations' },
                  { key: 'concepts', label: '💡 Concepts', desc: 'Concept diagrams' },
                  { key: 'diagrams', label: '📊 Diagrams', desc: 'Technical diagrams' },
                ].map(cat => {
                  const items = editAssets[cat.key] || []
                  return (
                    <div key={cat.key} className="border border-border-light rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-sm font-bold text-charcoal">{cat.label} <span className="text-xs text-stone-light font-normal">({items.length})</span></div>
                          <div className="text-[10px] text-stone-light">{cat.desc}</div>
                        </div>
                        <label className="text-xs px-2.5 py-1.5 bg-primary text-white rounded font-semibold hover:bg-primary-dark cursor-pointer transition disabled:opacity-50">
                          {uploadingCategory === cat.key ? '⟳' : '+ Add'}
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={!!uploadingCategory}
                            className="hidden"
                            onChange={async (e) => {
                              const files = e.target.files
                              if (!files) return
                              for (const f of Array.from(files)) {
                                await uploadAssetToCategory(cat.key, f)
                              }
                              e.target.value = ''
                            }}
                          />
                        </label>
                      </div>

                      {items.length === 0 ? (
                        <div className="text-center py-4 text-xs text-stone-light bg-bg-subtle rounded">
                          No images yet — click "+ Add" to upload
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {items.map((url, idx) => (
                            <div key={`${url}-${idx}`} className="relative group aspect-square bg-bg-subtle rounded overflow-hidden border border-border-light">
                              <img src={url} alt="" className="w-full h-full object-cover" />
                              {/* Overlay buttons */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition">
                                <button
                                  onClick={() => moveAsset(cat.key, idx, 'up')}
                                  disabled={idx === 0}
                                  className="bg-white text-charcoal w-7 h-7 rounded-full text-xs font-bold disabled:opacity-30 hover:bg-bg-subtle"
                                  title="Move earlier"
                                >
                                  ←
                                </button>
                                <button
                                  onClick={() => moveAsset(cat.key, idx, 'down')}
                                  disabled={idx === items.length - 1}
                                  className="bg-white text-charcoal w-7 h-7 rounded-full text-xs font-bold disabled:opacity-30 hover:bg-bg-subtle"
                                  title="Move later"
                                >
                                  →
                                </button>
                                <button
                                  onClick={() => removeAsset(cat.key, url)}
                                  className="bg-red-600 text-white w-7 h-7 rounded-full text-xs font-bold hover:bg-red-700"
                                  title="Remove"
                                >
                                  ✕
                                </button>
                              </div>
                              {/* Order badge */}
                              <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                                {idx + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}

                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-900">
                  💡 <strong>Tip:</strong> The order of images affects how they appear in your layout. Drag to reorder soon, for now use ← → arrows.
                </div>
              </div>
              )}

              {/* Footer */}
              <div className="px-5 py-4 border-t border-border-light flex gap-2 sticky bottom-0 bg-white">
                <button
                  onClick={() => setEditingPage(null)}
                  className="flex-1 px-4 py-2 border border-border-light rounded-lg text-sm font-semibold text-stone hover:bg-bg-subtle"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdits}
                  disabled={saveStatus === 'saving'}
                  className="flex-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-dark disabled:opacity-50"
                >
                  {saveStatus === 'saving' ? '⟳ Saving...' : '💾 Save & Re-render'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom indicator */}
      <div className="bg-black/40 backdrop-blur-lg border-t border-white/10 flex-shrink-0 px-4 py-2 flex items-center justify-center gap-4 text-white/60 text-xs flex-wrap">
        <span><span className="text-white/90">← →</span> Flip pages</span>
        <span className="mx-1">·</span>
        <span><span className="text-white/90">📐 Layout</span> button on each project page</span>
        <span className="mx-1">·</span>
        <span><span className="text-white/90">🎨</span> Top right to change design pack</span>
      </div>

      {/* Backdrop for dropdowns */}
      {(showPacks || showJump) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowPacks(false); setShowJump(false) }}
        />
      )}

      {/* Share Modal */}
      {shareModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShareModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-charcoal">🔗 Share Portfolio</h3>
                <p className="text-xs text-stone-light mt-0.5">Send your portfolio to anyone with a link</p>
              </div>
              <button
                onClick={() => setShareModalOpen(false)}
                className="text-stone-light hover:text-charcoal p-2"
              >
                ✕
              </button>
            </div>

            {/* Toggle */}
            <div className="bg-bg-subtle rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="font-bold text-sm text-charcoal">
                    {shareEnabled ? '✅ Public link active' : '🔒 Private (only you)'}
                  </div>
                  <div className="text-xs text-stone-light mt-1">
                    {shareEnabled
                      ? 'Anyone with the link can view this portfolio'
                      : 'Click below to generate a public link'}
                  </div>
                </div>
                <button
                  onClick={() => toggleShare(!shareEnabled)}
                  disabled={shareLoading}
                  className={`relative w-12 h-7 rounded-full transition disabled:opacity-50 ${
                    shareEnabled ? 'bg-green-500' : 'bg-stone-light'
                  }`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition ${
                    shareEnabled ? 'left-6' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* Link */}
            {shareEnabled && shareUrl && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone uppercase tracking-wider mb-1.5">
                    Shareable Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border border-border-light rounded-lg text-sm font-mono bg-bg-subtle"
                      onFocus={(e) => e.target.select()}
                    />
                    <button
                      onClick={copyShareLink}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                        copied
                          ? 'bg-green-500 text-white'
                          : 'bg-primary text-white hover:bg-primary-dark'
                      }`}
                    >
                      {copied ? '✓ Copied' : '📋 Copy'}
                    </button>
                  </div>
                </div>

                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center px-4 py-2 border border-border-light rounded-lg text-sm font-semibold text-charcoal hover:bg-bg-subtle transition"
                >
                  Open in new tab ↗
                </a>

                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-900">
                  💡 <strong>Anyone with the link can view</strong> your portfolio. They can't edit it. To stop sharing, toggle off above — the link stops working immediately.
                </div>
              </div>
            )}

            {!shareEnabled && (
              <div className="text-center py-2 text-xs text-stone-light">
                Toggle on to generate a unique link you can share
              </div>
            )}
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx>{`
        .book-container {
          transform-style: preserve-3d;
          transform-origin: center center;
        }
        .book-container.flipping.flip-next {
          animation: flipNext 0.5s ease-out;
        }
        .book-container.flipping.flip-prev {
          animation: flipPrev 0.5s ease-out;
        }
        @keyframes flipNext {
          0% { transform: rotateY(0deg) scale(1); opacity: 1; }
          50% { transform: rotateY(-12deg) scale(0.97); opacity: 0.85; }
          100% { transform: rotateY(0deg) scale(1); opacity: 1; }
        }
        @keyframes flipPrev {
          0% { transform: rotateY(0deg) scale(1); opacity: 1; }
          50% { transform: rotateY(12deg) scale(0.97); opacity: 0.85; }
          100% { transform: rotateY(0deg) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
