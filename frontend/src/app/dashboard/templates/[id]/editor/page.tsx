'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import PageComposer, { LayoutThumb } from '@/components/composer/PageComposer'
import {
  type Page, type Block, type BlockType, type DesignTokens,
  createBlock, blockLabel, uid,
} from '@/components/composer/types'
import {
  seedPagesFromTemplate, getSpec, LAYOUT_CATALOG, LAYOUT_CATEGORIES, LAYOUT_COUNT,
  type LayoutCategory,
} from '@/components/composer/layoutSpecs'
import { analyzeTemplate, autoFillTemplate, summaryLine } from '@/components/composer/templateDNA'
import { STYLE_DNA } from '@/components/composer/styleDNA'
import { ProfessionalPublishingSettings } from '@/components/composer/ProfessionalPublishingSettings'
import { AIDesignAssistant } from '@/components/composer/AIDesignAssistant'
import { PAGE_SIZES, type Portfolio as PublishingPortfolio } from '@/components/composer/publishingTypes'

type DesignPack = { name: string; tokens: DesignTokens; createdAt: string }
type Asset = { id: string; url: string; name: string; uploadedAt: string; size: number }

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Template {
  id: string
  name: string
  description?: string
  category?: string
  colors?: Record<string, string>
  fonts?: Record<string, string>
  layouts?: any
  placeholders?: any
}

const ADD_BLOCKS: { type: BlockType; icon: string }[] = [
  { type: 'title', icon: 'T' }, { type: 'subtitle', icon: 't' }, { type: 'meta', icon: '#' },
  { type: 'description', icon: '¶' }, { type: 'legend', icon: '①' },
  { type: 'render', icon: '🖼️' }, { type: 'plan', icon: '📐' }, { type: 'section', icon: '📏' }, { type: 'diagram', icon: '◑' },
]

const HEADING_FONTS = ['Montserrat', 'Playfair Display', 'Roboto', 'Inter', 'Poppins', 'Georgia', 'Lora', 'Bebas Neue', 'Oswald', 'Arial']
const BODY_FONTS = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Source Sans Pro', 'Raleway', 'Georgia', 'Arial']

export default function TemplateEditor() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { isAuthenticated, token } = useAuthStore()
  const templateId = params.id as string

  const [template, setTemplate] = useState<Template | null>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [portfolioTitle, setPortfolioTitle] = useState('')
  const [rightTab, setRightTab] = useState<'layout' | 'blocks' | 'style' | 'guide' | 'publishing'>('guide')
  const [publishingPortfolio, setPublishingPortfolio] = useState<PublishingPortfolio>({
    id: 'template-' + params.id,
    name: 'Template',
    spreads: [],
    pageSize: PAGE_SIZES['a4-portrait'],
    masterPages: [],
    backgrounds: [],
    designTokens: { background: '#fff', text: '#000', primary: '#000', accent: '#999', muted: '#eee', headingFont: 'Inter', bodyFont: 'Inter' },
  })
  const [mode, setMode] = useState<'view' | 'edit'>('edit')   // spec: Preview ↔ Edit
  const [layoutSearch, setLayoutSearch] = useState('')
  const [layoutCat, setLayoutCat] = useState<'All' | LayoutCategory>('All')
  const [designPacks, setDesignPacks] = useState<DesignPack[]>([])
  const [showSavePackModal, setShowSavePackModal] = useState(false)
  const [packName, setPackName] = useState('')
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)
  const [showGeneratePackModal, setShowGeneratePackModal] = useState(false)
  const [generateMode, setGenerateMode] = useState<'mood' | 'color' | 'assets'>('mood')
  const [generateInput, setGenerateInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [draggedPageIdx, setDraggedPageIdx] = useState<number | null>(null)
  const [documentVersion, setDocumentVersion] = useState<number>(0)
  const [isStale, setIsStale] = useState(false)

  const [projectId, setProjectId] = useState<string | null>(null)
  const [history, setHistory] = useState<{ pages: Page[]; tokens: DesignTokens; title: string }[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const loadedRef = useRef(false)            // becomes true once initial data is ready
  const dirtyRef = useRef(false)             // true after the first real user edit (gates autosave)
  const ensurePromiseRef = useRef<Promise<string> | null>(null)
  const markDirty = () => { dirtyRef.current = true }

  // Push state to history (called after mutations)
  const pushHistory = () => {
    const newHist = history.slice(0, historyIdx + 1)
    newHist.push({ pages: structuredClone(pages), tokens: structuredClone(tokens), title: portfolioTitle || 'Untitled' })
    setHistory(newHist)
    setHistoryIdx(newHist.length - 1)
  }

  const undo = () => {
    if (historyIdx > 0) {
      const prev = history[historyIdx - 1]
      setPages(structuredClone(prev.pages))
      setTokens(structuredClone(prev.tokens))
      setPortfolioTitle(prev.title)
      setHistoryIdx(historyIdx - 1)
      markDirty()
    }
  }

  const redo = () => {
    if (historyIdx < history.length - 1) {
      const next = history[historyIdx + 1]
      setPages(structuredClone(next.pages))
      setTokens(structuredClone(next.tokens))
      setPortfolioTitle(next.title)
      setHistoryIdx(historyIdx + 1)
      markDirty()
    }
  }

  const [tokens, setTokens] = useState<DesignTokens>({
    background: '#FFFFFF', text: '#1a1a1a', primary: '#111111', accent: '#888888', muted: '#dddddd',
    headingFont: 'Montserrat', bodyFont: 'Inter',
  })

  const authToken = () => token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null)

  useEffect(() => {
    if (!isAuthenticated) { router.push('/signin'); return }
    init()
    // Load design packs from localStorage
    const saved = localStorage.getItem('designPacks')
    if (saved) {
      try {
        setDesignPacks(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load design packs:', e)
      }
    }
    // Load assets from localStorage
    const assetsSaved = localStorage.getItem('uploadedAssets')
    if (assetsSaved) {
      try {
        setAssets(JSON.parse(assetsSaved))
      } catch (e) {
        console.error('Failed to load assets:', e)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  const init = async () => {
    const existingProject = searchParams.get('project')
    try {
      if (existingProject) {
        setProjectId(existingProject)
        const res = await fetch(`${API_URL}/api/projects/${existingProject}/document`, {
          headers: { Authorization: `Bearer ${authToken()}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (data.exists && data.document) {
            hydrate(data.document)
            setIsLoading(false)
            loadedRef.current = true
            return
          }
        }
      }
      // Fresh start: seed from the template in the route
      await fetchTemplate()
    } catch (e) {
      console.error('Init error:', e)
      await fetchTemplate()
    } finally {
      setIsLoading(false)
      loadedRef.current = true
    }
  }

  const hydrate = (doc: any) => {
    setTemplate({ id: doc.templateId || templateId, name: doc.templateName || 'Saved Portfolio', category: doc.templateCategory || '' })
    if (doc.tokens) setTokens(doc.tokens)
    if (doc.title) setPortfolioTitle(doc.title)
    if (Array.isArray(doc.pages)) setPages(doc.pages)
    if (doc.documentVersion) setDocumentVersion(doc.documentVersion)
    // Initialize history with the loaded state
    if (doc.pages && doc.tokens && doc.title) {
      setHistory([{ pages: doc.pages, tokens: doc.tokens, title: doc.title }])
      setHistoryIdx(0)
    }
  }

  const fetchTemplate = async () => {
    let data: Template | null = null
    const res = await fetch(`${API_URL}/api/templates/portfolios/${templateId}`)
    if (res.ok) data = await res.json()
    else {
      const sres = await fetch(`${API_URL}/api/templates/sheets/${templateId}`)
      if (sres.ok) data = await sres.json()
    }
    if (data) {
      setTemplate(data)
      setPortfolioTitle(`${data.name} Portfolio`)
      const c = data.colors || {}
      setTokens({
        background: c.background || '#FFFFFF',
        text: c.text || '#1a1a1a',
        primary: c.primary || c.text || '#111111',
        accent: c.accent || '#888888',
        muted: c.muted || '#dddddd',
        headingFont: data.fonts?.heading || 'Montserrat',
        bodyFont: data.fonts?.body || 'Inter',
      })
      setPages(seedPagesFromTemplate(data))
    } else {
      // Template unavailable (e.g. reopening a project with no saved doc) — start blank
      setTemplate({ id: templateId, name: 'Portfolio', category: '' })
      setPortfolioTitle('Untitled Portfolio')
      setPages(seedPagesFromTemplate({ name: 'Portfolio', placeholders: { renders: 2, plans: 1, sections: 1, diagrams: 0 } }))
    }
  }

  /* ---- persistence ---- */

  const ensureProject = (): Promise<string> => {
    if (projectId) return Promise.resolve(projectId)
    if (ensurePromiseRef.current) return ensurePromiseRef.current
    ensurePromiseRef.current = (async () => {
      const res = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: portfolioTitle || 'Untitled Portfolio', project_type: 'portfolio', description: `From template: ${template?.name || ''}` }),
      })
      if (!res.ok) { ensurePromiseRef.current = null; throw new Error('Could not create project') }
      const proj = await res.json()
      setProjectId(proj.id)
      // keep the project id in the URL so a refresh reloads the saved work
      router.replace(`/dashboard/templates/${templateId}/editor?project=${proj.id}`)
      return proj.id as string
    })()
    return ensurePromiseRef.current
  }

  const uploadImage = async (file: File): Promise<string> => {
    const pid = await ensureProject()
    const fd = new FormData()
    fd.append('file', file)
    fd.append('asset_type', 'render')
    const res = await fetch(`${API_URL}/api/projects/${pid}/assets`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken()}` },
      body: fd,
    })
    if (!res.ok) throw new Error('Upload failed')
    const data = await res.json()
    const url = data.url || data.preview_url
    // Save to asset library
    const newAsset: Asset = {
      id: uid('a'),
      url,
      name: file.name,
      uploadedAt: new Date().toISOString(),
      size: file.size,
    }
    const updated = [...assets, newAsset]
    setAssets(updated)
    localStorage.setItem('uploadedAssets', JSON.stringify(updated))
    return url
  }

  const saveDocument = async (): Promise<void> => {
    const pid = await ensureProject()
    setSaveStatus('saving')
    // Include version for collaborative editing conflict detection
    const now = new Date().toISOString()
    const document = {
      version: 2,
      documentVersion: Math.floor(Date.now() / 1000), // Unix timestamp for conflict detection
      templateId,
      templateName: template?.name,
      templateCategory: template?.category,
      title: portfolioTitle,
      tokens,
      pages,
      lastSavedAt: now,
    }
    const res = await fetch(`${API_URL}/api/projects/${pid}/document`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(document),
    })
    if (!res.ok) {
      const err = await res.text()
      setSaveStatus('error')
      throw new Error(`Save failed (${res.status}): ${err.slice(0, 100)}`)
    }
    setSaveStatus('saved')
  }

  // Debounced autosave — only after the first real edit
  useEffect(() => {
    if (!loadedRef.current || !dirtyRef.current) return
    setSaveStatus('saving')
    const t = setTimeout(async () => {
      try {
        await saveDocument()
      } catch (e) {
        console.error('Autosave failed:', e)
        setSaveStatus('error')
      }
    }, 1500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, tokens, portfolioTitle])

  // Warn if user navigates away with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current && saveStatus !== 'saved') {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Leave without saving?'
        return e.returnValue
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saveStatus])

  // Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Shift+Z (redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault()
          undo()
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault()
          redo()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [history, historyIdx])

  // Detect mobile/tablet and adjust layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Periodically check if another tab/browser has modified the document (collaborative editing)
  useEffect(() => {
    if (!projectId || !loadedRef.current) return
    const checkForStaleDoc = async () => {
      try {
        const res = await fetch(`${API_URL}/api/projects/${projectId}/document`, {
          headers: { Authorization: `Bearer ${authToken()}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (data.exists && data.document && data.document.documentVersion) {
            if (data.document.documentVersion > documentVersion) {
              // Another tab/user has updated the document
              setIsStale(true)
            }
          }
        }
      } catch (e) {
        // Silently fail, don't interrupt the editor
      }
    }
    const interval = setInterval(checkForStaleDoc, 10000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, documentVersion])

  const currentPage = pages[currentIdx]

  // NOTE: This hook MUST stay above the early returns (isLoading / !template)
  // below, otherwise it runs a different number of times between renders and
  // triggers React error #310 ("Rendered more hooks than during the previous
  // render"). currentPage may be undefined here, so guard with optional chaining.
  const filteredLayouts = useMemo(() => {
    let list = LAYOUT_CATALOG
    if (layoutCat !== 'All') list = list.filter(s => s.category === layoutCat)
    if (layoutSearch.trim()) {
      const q = layoutSearch.toLowerCase()
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))
    }
    // surface layouts that suit the current page type first
    const pageType = currentPage?.type
    return [...list].sort((a, b) =>
      (pageType && b.suits.includes(pageType) ? 1 : 0) - (pageType && a.suits.includes(pageType) ? 1 : 0))
  }, [layoutCat, layoutSearch, currentPage?.type])

  // ── Template Intelligence: smart auto-fill from the asset library ──
  const typeFromName = (name: string): string => {
    const n = (name || '').toLowerCase()
    if (/site\s*plan|master/.test(n)) return 'site_plan'
    if (/plan|floor/.test(n)) return 'plan'
    if (/section/.test(n)) return 'section'
    if (/elevation/.test(n)) return 'elevation'
    if (/diagram|concept/.test(n)) return 'diagram'
    if (/interior/.test(n)) return 'interior_render'
    if (/exterior|aerial|render|view|visual/.test(n)) return 'render'
    return 'render'
  }
  const autoFillFromLibrary = () => {
    if (!assets.length) { alert('Upload images to the Asset library first (Blocks tab → upload).'); return }
    const byType: Record<string, string[]> = {}
    for (const a of assets) { const t = typeFromName(a.name); (byType[t] ||= []).push(a.url) }
    const next = autoFillTemplate(pages, byType)
    markDirty(); setPages(next)
  }

  // Guided upload: drop an image straight into one specific slot.
  const fillSlotUpload = (pageIndex: number, blockId: string) => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return
      const url = await uploadImage(file); if (!url) return
      const next = pages.map((p, i) => i === pageIndex
        ? { ...p, blocks: p.blocks.map(b => b.id === blockId ? { ...b, imageUrl: url } : b) }
        : p)
      markDirty(); setPages(next)
    }
    input.click()
  }

  // Project multiplication: grow/shrink the project pages to N projects.
  const setProjectCount = (n: number) => {
    n = Math.max(1, Math.min(12, n))
    const projIdx = pages.map((p, i) => ({ t: p.type, i })).filter(x => x.t === 'project').map(x => x.i)
    if (!projIdx.length) return
    const first = projIdx[0], last = projIdx[projIdx.length - 1]
    const tmpl = pages[first]
    const before = pages.slice(0, first)
    const after = pages.slice(last + 1)
    const projects: Page[] = []
    for (let k = 0; k < n; k++) {
      const clone: Page = structuredClone(tmpl)
      clone.id = `project-${Date.now()}-${k}`
      clone.blocks = clone.blocks.map((b, bi) => {
        const nb: Block = { ...b, id: `b-${Date.now()}-${k}-${bi}` }
        if (b.type === 'title') nb.text = `Project ${String(k + 1).padStart(2, '0')}`
        if (['render', 'plan', 'section', 'diagram'].includes(b.type)) nb.imageUrl = undefined
        return nb
      })
      projects.push(clone)
    }
    markDirty(); setPages([...before, ...projects, ...after]); setCurrentIdx(before.length)
  }

  // Content Intelligence: free, deterministic "AI" draft per text slot.
  const fillSlotText = (pageIndex: number, blockId: string, text: string) => {
    const next = pages.map((p, i) => i === pageIndex
      ? { ...p, blocks: p.blocks.map(b => b.id === blockId ? { ...b, text } : b) }
      : p)
    markDirty(); setPages(next)
  }
  const draftText = (slotName: string): string => {
    const proj = portfolioTitle || (template?.name) || 'this project'
    const n = slotName.toLowerCase()
    if (/concept/.test(n)) return `The concept for ${proj} responds to its site through a clear spatial idea — organising light, circulation, and material into a coherent architectural experience.`
    if (/philosophy/.test(n)) return `My work explores the relationship between space, light, and human experience, pursuing clarity and a strong dialogue between form and context.`
    if (/sustainab/.test(n)) return `Passive strategies — orientation, natural ventilation, and daylight — reduce energy demand, while durable, low-impact materials support a sustainable lifecycle.`
    if (/bio|about/.test(n)) return `A designer focused on thoughtful, context-driven architecture across scales, with an interest in materiality, drawing, and spatial narrative.`
    if (/title|name/.test(n)) return proj
    if (/subtitle|tagline|role/.test(n)) return 'Architecture & Design'
    if (/info|location|year/.test(n)) return 'Location · Year · Typology'
    return `A concise, professional statement about ${proj} for an architecture portfolio.`
  }

  // When the selected page changes type, surface the most relevant layout
  // category first (cover pages → the 50+ covers, etc.). Hook stays above the
  // early returns to keep the render hook-count stable (React #310).
  useEffect(() => {
    const t = currentPage?.type
    if (t === 'cover') setLayoutCat('Cover')
    else if (t === 'contact') setLayoutCat('Contact')
    else if (t === 'about') setLayoutCat('Text')
    else setLayoutCat('All')
  }, [currentPage?.type])

  const updatePage = (p: Page) => {
    markDirty()
    const next = pages.map((x, i) => i === currentIdx ? p : x)
    setPages(next)
  }
  const setTok = (patch: Partial<DesignTokens>) => {
    markDirty()
    setTokens(prev => ({ ...prev, ...patch }))
  }

  // Track major changes in history (moves, adds, removes, duplicates)
  const recordHistorySnapshot = () => {
    const newHist = history.slice(0, historyIdx + 1)
    newHist.push({ pages: structuredClone(pages), tokens: structuredClone(tokens), title: portfolioTitle || 'Untitled' })
    setHistory(newHist)
    setHistoryIdx(newHist.length - 1)
  }

  const setLayout = (layoutId: string) => { if (currentPage) updatePage({ ...currentPage, layoutId }) }

  const addBlock = (type: BlockType) => {
    if (!currentPage) return
    const next = { ...currentPage, blocks: [...currentPage.blocks, createBlock(type)] }
    updatePage(next)
    // Record after a tick so state has updated
    setTimeout(() => recordHistorySnapshot(), 10)
  }

  const removeBlock = (blockId: string) => {
    if (!currentPage) return
    const next = { ...currentPage, blocks: currentPage.blocks.filter(b => b.id !== blockId) }
    updatePage(next)
    setTimeout(() => recordHistorySnapshot(), 10)
  }

  const moveBlock = (blockId: string, dir: -1 | 1) => {
    if (!currentPage) return
    const idx = currentPage.blocks.findIndex(b => b.id === blockId)
    const swap = idx + dir
    if (idx < 0 || swap < 0 || swap >= currentPage.blocks.length) return
    const next = [...currentPage.blocks]
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    markDirty(); updatePage({ ...currentPage, blocks: next })
    setTimeout(() => recordHistorySnapshot(), 10)
  }

  const duplicateBlock = (blockId: string) => {
    if (!currentPage) return
    const idx = currentPage.blocks.findIndex(b => b.id === blockId)
    if (idx < 0) return
    const orig = currentPage.blocks[idx]
    const dup = { ...orig, id: uid() }
    const next = [...currentPage.blocks]
    next.splice(idx + 1, 0, dup)
    markDirty(); updatePage({ ...currentPage, blocks: next })
    setTimeout(() => recordHistorySnapshot(), 10)
  }

  const addPage = (type: Page['type']) => {
    const layoutId: string = type === 'cover' ? 'cover.minimal' : type === 'about' ? 'text.statement' : type === 'contact' ? 'contact.center' : 'twoThirdsStack.titleMetaInline'
    const blocks: Block[] = [{ ...createBlock('title'), text: type === 'project' ? `Project ${pages.filter(p => p.type === 'project').length + 1}` : 'New Page' }]
    if (type === 'project') { blocks.push(createBlock('meta'), createBlock('render'), createBlock('description')) }
    else { blocks.push(createBlock('description')) }
    const newPage: Page = { id: uid('p'), type, layoutId, blocks }
    markDirty(); setPages([...pages, newPage]); setCurrentIdx(pages.length)
  }

  const deletePage = (idx: number) => {
    if (pages.length <= 1) return
    markDirty(); setPages(pages.filter((_, i) => i !== idx))
    if (currentIdx >= idx && currentIdx > 0) setCurrentIdx(currentIdx - 1)
  }

  const movePage = (idx: number, dir: -1 | 1) => {
    const swap = idx + dir
    if (swap < 0 || swap >= pages.length) return
    const next = [...pages]
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    markDirty(); setPages(next)
    setCurrentIdx(swap)
    setTimeout(() => recordHistorySnapshot(), 10)
  }

  const handlePageDragStart = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    setDraggedPageIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handlePageDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handlePageDrop = (e: React.DragEvent<HTMLDivElement>, targetIdx: number) => {
    e.preventDefault()
    if (draggedPageIdx === null || draggedPageIdx === targetIdx) {
      setDraggedPageIdx(null)
      return
    }
    const next = [...pages]
    const [page] = next.splice(draggedPageIdx, 1)
    next.splice(targetIdx, 0, page)
    markDirty(); setPages(next)
    setCurrentIdx(targetIdx)
    setDraggedPageIdx(null)
    setTimeout(() => recordHistorySnapshot(), 10)
  }

  const handlePageDragEnd = () => {
    setDraggedPageIdx(null)
  }

  const savePortfolio = async () => {
    if (!portfolioTitle.trim()) { alert('Please enter a portfolio title'); return }
    setIsSaving(true)
    try {
      await saveDocument()
      router.push('/dashboard/my-portfolios')
    } catch (e: any) {
      alert(`Failed to save: ${e.message}`)
    } finally { setIsSaving(false) }
  }

  const exportToPDF = async () => {
    if (!projectId) { alert('Please save your portfolio first'); return }
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/document/export-pdf`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken()}` },
      })
      if (!res.ok) throw new Error(`Export failed: ${res.statusText}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${portfolioTitle || 'portfolio'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert(`PDF export failed: ${e.message}`)
    }
  }

  const savePack = () => {
    if (!packName.trim()) { alert('Enter a pack name'); return }
    const newPack: DesignPack = { name: packName, tokens: structuredClone(tokens), createdAt: new Date().toISOString() }
    const updated = [...designPacks.filter(p => p.name !== packName), newPack]
    setDesignPacks(updated)
    localStorage.setItem('designPacks', JSON.stringify(updated))
    setPackName('')
    setShowSavePackModal(false)
    alert(`✓ Design pack "${packName}" saved!`)
  }

  const loadPack = (pack: DesignPack) => {
    setTok(pack.tokens)
    alert(`✓ Loaded design pack "${pack.name}"`)
  }

  const deletePack = (name: string) => {
    const updated = designPacks.filter(p => p.name !== name)
    setDesignPacks(updated)
    localStorage.setItem('designPacks', JSON.stringify(updated))
  }

  const insertAsset = (assetUrl: string) => {
    if (!currentPage) return
    const block = { ...createBlock('render'), imageUrl: assetUrl }
    updatePage({ ...currentPage, blocks: [...currentPage.blocks, block] })
    setTimeout(() => recordHistorySnapshot(), 10)
    alert('Image inserted!')
  }

  const deleteAsset = (assetId: string) => {
    const updated = assets.filter(a => a.id !== assetId)
    setAssets(updated)
    localStorage.setItem('uploadedAssets', JSON.stringify(updated))
  }

  const clearAllAssets = () => {
    if (confirm('Delete all unused assets? This cannot be undone.')) {
      setAssets([])
      localStorage.removeItem('uploadedAssets')
    }
  }

  const generateStylePack = async () => {
    if (!generateInput.trim()) {
      alert(`Please enter a ${generateMode}`);
      return
    }
    if (!projectId) {
      alert('Please save your portfolio first')
      return
    }
    setIsGenerating(true)
    try {
      const res = await fetch(`${API_URL}/api/portfolios/${projectId}/style-packs/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: generateMode, value: generateInput }),
      })
      if (!res.ok) throw new Error(`Generate failed: ${res.statusText}`)
      const data = await res.json()
      // Apply the generated pack
      const generatedTokens = data.generated_pack
      if (generatedTokens) {
        setTok({
          background: generatedTokens.colors?.background || tokens.background,
          text: generatedTokens.colors?.text || tokens.text,
          primary: generatedTokens.colors?.primary || tokens.primary,
          accent: generatedTokens.colors?.accent || tokens.accent,
          muted: generatedTokens.colors?.muted || tokens.muted,
          headingFont: generatedTokens.typography?.headingFont || tokens.headingFont,
          bodyFont: generatedTokens.typography?.bodyFont || tokens.bodyFont,
        })
        alert(`✓ Style pack generated from ${generateMode}!`)
        setShowGeneratePackModal(false)
        setGenerateInput('')
      }
    } catch (e: any) {
      alert(`Failed to generate pack: ${e.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <header className="bg-white border-b shadow-sm px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </header>
        <div className="flex flex-1 min-h-0">
          <aside className="w-56 bg-white border-r p-4">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </aside>
          <main className="flex-1 p-8 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4 mx-auto" />
              <p className="text-gray-600 text-sm">Loading your portfolio…</p>
            </div>
          </main>
          <aside className="w-80 bg-white border-l p-4">
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </aside>
        </div>
      </div>
    )
  }
  if (!template || !currentPage) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center"><p className="text-gray-600 mb-4">Template not found</p><Link href="/dashboard/templates" className="text-blue-600 hover:underline">← Back to Templates</Link></div></div>
  }

  // ── VIEW / PREVIEW MODE: show the finished portfolio, edit on click ──
  if (mode === 'view') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
          <div className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/my-portfolios" className="text-gray-500 hover:text-gray-900 text-sm">← Back</Link>
              <div>
                <h1 className="text-base font-semibold">{portfolioTitle || template?.name || 'Portfolio'}</h1>
                <p className="text-[11px] text-gray-400">Preview · {pages.length} pages</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exportToPDF} disabled={!projectId || isSaving} className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-medium hover:bg-gray-900 disabled:opacity-50">📄 Export PDF</button>
              <button onClick={() => setMode('edit')} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">✏️ Edit</button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-300/40">
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/my-portfolios" className="text-gray-500 hover:text-gray-900 text-sm">← Back</Link>
            <div>
              <input value={portfolioTitle} onChange={e => { markDirty(); setPortfolioTitle(e.target.value) }} className="text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 py-0.5 rounded" placeholder="Untitled" />
              <p className="text-[11px] text-gray-400 px-2">Template: {template.name} · {template.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-[11px] min-w-[64px] text-right font-medium ${
              saveStatus === 'saving' ? 'text-gray-400' :
              saveStatus === 'saved' ? 'text-green-600' :
              saveStatus === 'error' ? 'text-red-600' :
              'text-transparent'
            }`}>
              {saveStatus === 'saving' ? '⏳ Saving…' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? '✗ Error' : ''}
            </span>
            <button onClick={undo} disabled={historyIdx <= 0} className="px-2 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-30" title="Undo (Ctrl+Z)">↶</button>
            <button onClick={redo} disabled={historyIdx >= history.length - 1} className="px-2 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-30" title="Redo (Ctrl+Shift+Z)">↷</button>
            {projectId && (
              <Link href={`/dashboard/portfolio-book/${projectId}`} className="px-3 py-2 bg-[#D4AF37] text-white rounded-lg text-sm font-medium hover:brightness-95" title="View as book">📖 Book</Link>
            )}
            <button onClick={() => setMode('view')} className="px-3 py-2 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50" title="Preview the finished portfolio">👁 Preview</button>
            <button onClick={exportToPDF} disabled={!projectId || isSaving} className="px-3 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50" title="Download as PDF">📄 PDF</button>
            <button onClick={savePortfolio} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{isSaving ? 'Saving…' : 'Save & Close'}</button>
          </div>
        </div>
      </header>

      {/* Stale document warning (collaborative editing) */}
      {isStale && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-yellow-700 text-sm font-medium">⚠️ Your portfolio was updated in another tab or browser. Your changes may conflict.</span>
          </div>
          <button
            onClick={() => {
              window.location.reload()
            }}
            className="px-3 py-1.5 bg-yellow-600 text-white text-sm font-medium rounded hover:bg-yellow-700 transition"
          >
            Reload
          </button>
        </div>
      )}

      <div className={`flex flex-1 min-h-0 ${isMobile ? 'flex-col' : ''}`}>
        {/* Left: pages */}
        <aside className={`${isMobile ? 'w-full h-24 border-b' : 'w-56 border-r'} bg-white overflow-y-auto flex-shrink-0`}>
          <div className="p-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pages ({pages.length})</h3>
            <div className="space-y-1.5">
              {pages.map((page, idx) => (
                <div
                  key={page.id}
                  draggable
                  onDragStart={(e) => handlePageDragStart(e, idx)}
                  onDragOver={handlePageDragOver}
                  onDrop={(e) => handlePageDrop(e, idx)}
                  onDragEnd={handlePageDragEnd}
                  onClick={() => setCurrentIdx(idx)}
                  className={`group p-2.5 rounded-lg cursor-move border-2 transition ${
                    draggedPageIdx === idx ? 'opacity-50 bg-gray-100 border-gray-300' :
                    currentIdx === idx ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-transparent hover:bg-gray-100'
                  }`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-gray-400 text-lg leading-none select-none cursor-grab active:cursor-grabbing">⋮</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] text-gray-400 uppercase">{idx + 1} · {page.type}</div>
                      <div className="text-xs font-medium truncate">{page.blocks.find(b => b.type === 'title')?.text || 'Untitled'}</div>
                      <div className="text-[10px] text-gray-400 truncate">{getSpec(page.layoutId).name}</div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <button disabled={idx === 0} onClick={e => { e.stopPropagation(); movePage(idx, -1) }} className="text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-[10px] leading-none" title="Move up">▲</button>
                      <button disabled={idx === pages.length - 1} onClick={e => { e.stopPropagation(); movePage(idx, 1) }} className="text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-[10px] leading-none" title="Move down">▼</button>
                      <button onClick={e => { e.stopPropagation(); deletePage(idx) }} className="text-gray-400 hover:text-red-500 text-[10px] leading-none mt-0.5" title="Delete">✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t">
              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Add page</p>
              <div className="grid grid-cols-2 gap-1.5">
                {(['project', 'about', 'cover', 'contact'] as const).map(t => (
                  <button key={t} onClick={() => addPage(t)} className="px-2 py-1.5 text-[11px] border border-gray-300 rounded hover:bg-gray-50 capitalize">+ {t}</button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Center: canvas */}
        <main className={`${isMobile ? 'flex-1' : 'flex-1'} overflow-y-auto ${isMobile ? 'p-2' : 'p-8'} bg-gray-300/40`}>
          <PageComposer page={currentPage} tokens={tokens} onChange={updatePage} onUploadImage={uploadImage} />
          <div className={`max-w-[760px] mx-auto ${isMobile ? 'mt-2 text-[9px]' : 'mt-3 text-[11px]'} text-center text-gray-400`}>
            Page {currentIdx + 1}/{pages.length} · {!isMobile && 'Click any text or image to edit'}
          </div>
        </main>

        {/* Right: inspector - toggle on mobile */}
        {isMobile && (
          <button onClick={() => setInspectorOpen(!inspectorOpen)} className="fixed bottom-4 right-4 z-40 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-lg">
            {inspectorOpen ? '✕ Close' : '⚙️ Settings'}
          </button>
        )}
        <aside className={`${isMobile ? (inspectorOpen ? 'fixed inset-0 z-30 w-full max-w-md ml-auto' : 'hidden') : 'w-80'} bg-white ${isMobile ? '' : 'border-l'} overflow-y-auto flex-shrink-0`}>
          {/* Tabs */}
          <div className="flex border-b sticky top-0 bg-white z-10">
            {(['guide', 'publishing', 'layout', 'blocks', 'style'] as const).map(t => (
              <button key={t} onClick={() => setRightTab(t)}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition ${rightTab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* GUIDE TAB — Template Intelligence: what this template needs */}
            {/* PUBLISHING TAB — Professional publishing settings */}
            {rightTab === 'publishing' && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <ProfessionalPublishingSettings
                  portfolio={publishingPortfolio}
                  onUpdate={setPublishingPortfolio}
                />
                <AIDesignAssistant
                  onCommand={cmd => console.log('AI command:', cmd)}
                />
              </div>
            )}

            {rightTab === 'guide' && (() => {
              const req = analyzeTemplate(pages)
              const pct = req.totalSlots ? Math.round((req.filledSlots / req.totalSlots) * 100) : 0
              return (
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-900">📋 This template needs</p>
                    <p className="text-[11px] text-blue-700 mt-0.5">{summaryLine(req) || 'text content only'}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-blue-700 whitespace-nowrap">{req.filledSlots}/{req.totalSlots} filled</span>
                    </div>
                  </div>
                  <button onClick={autoFillFromLibrary} className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700">
                    ✨ Auto-fill from my assets
                  </button>
                  <p className="text-[10px] text-gray-400">Cosmo guides you: upload the right image into each slot.</p>

                  {/* Template Variations (Style DNA) */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Variations</p>
                    <div className="grid grid-cols-2 gap-1">
                      {STYLE_DNA.map(st => (
                        <button key={st.id} onClick={() => { markDirty(); setTokens(st.tokens) }} title={st.description}
                          className="flex items-center gap-1 px-1.5 py-1 rounded border text-left hover:border-blue-400 transition">
                          <span className="flex gap-0.5 flex-shrink-0">
                            <span className="w-2 h-2 rounded-full" style={{ background: st.tokens.background, border: '1px solid #ddd' }} />
                            <span className="w-2 h-2 rounded-full" style={{ background: st.tokens.primary }} />
                            <span className="w-2 h-2 rounded-full" style={{ background: st.tokens.accent }} />
                          </span>
                          <span className="text-[8px] font-medium text-gray-600 truncate">{st.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Project multiplication */}
                  {req.pages.some(p => p.type === 'project') && (
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-[10px] uppercase tracking-wider text-gray-500">Projects</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setProjectCount(req.pages.filter(p => p.type === 'project').length - 1)} className="w-6 h-6 rounded border bg-white text-sm leading-none hover:bg-gray-100">−</button>
                        <span className="text-xs font-semibold w-4 text-center">{req.pages.filter(p => p.type === 'project').length}</span>
                        <button onClick={() => setProjectCount(req.pages.filter(p => p.type === 'project').length + 1)} className="w-6 h-6 rounded border bg-white text-sm leading-none hover:bg-gray-100">+</button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {req.pages.map((pg, i) => (
                      <div key={pg.pageId} className="border rounded-lg p-2.5">
                        <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{i + 1}. {pg.purpose}</div>
                        {pg.imageSlots.map(s => (
                          <div key={s.blockId} className="flex items-center gap-1.5 text-[11px] mt-1">
                            <span className={s.filled ? 'text-green-600' : 'text-gray-300'}>{s.filled ? '✓' : '○'}</span>
                            <span className="font-medium text-gray-700 truncate">{s.name}</span>
                            {s.filled
                              ? <span className="text-[8px] text-gray-400 ml-auto uppercase whitespace-nowrap">{s.importance}</span>
                              : <button onClick={() => fillSlotUpload(pg.pageIndex, s.blockId)} className="ml-auto text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 whitespace-nowrap">⬆ Upload</button>}
                          </div>
                        ))}
                        {pg.textSlots.map(s => (
                          <div key={s.blockId} className="flex items-center gap-1.5 text-[11px] mt-1" title={s.prompt}>
                            <span className={s.filled ? 'text-green-600' : 'text-gray-300'}>{s.filled ? '✓' : '○'}</span>
                            <span className="text-gray-500 truncate">✎ {s.name}</span>
                            <button onClick={() => fillSlotText(pg.pageIndex, s.blockId, draftText(s.name))} className="ml-auto text-[9px] px-1.5 py-0.5 bg-[#FBE7A1]/40 text-[#9C7416] rounded hover:bg-[#FBE7A1]/60 whitespace-nowrap" title={s.prompt}>✨ AI</button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* LAYOUT TAB */}
            {rightTab === 'layout' && (
              <div className="space-y-3">
                <input
                  value={layoutSearch}
                  onChange={e => setLayoutSearch(e.target.value)}
                  placeholder={`Search ${LAYOUT_COUNT} layouts…`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex flex-wrap gap-1">
                  {(['All', ...LAYOUT_CATEGORIES] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setLayoutCat(cat as any)}
                      className={`px-2 py-1 rounded text-[10px] font-semibold transition ${layoutCat === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-gray-400">{filteredLayouts.length} layouts · click to apply</div>
                <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                  {filteredLayouts.map(spec => {
                    const active = currentPage.layoutId === spec.id
                    const recommended = spec.suits.includes(currentPage.type)
                    return (
                      <button
                        key={spec.id}
                        onClick={() => setLayout(spec.id)}
                        className={`group text-left rounded-lg p-1.5 border-2 transition relative ${active ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-gray-300 hover:bg-gray-50'}`}
                      >
                        {recommended && (
                          <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-yellow-900 text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">⭐</div>
                        )}
                        <LayoutThumb spec={spec} tokens={tokens} active={active} />
                        <div className="mt-1 px-0.5">
                          <div className="text-[10px] font-semibold text-gray-700 truncate leading-tight">{spec.name}</div>
                          <div className="text-[9px] text-gray-400">{spec.category}{spec.imageCount > 0 ? ` · ${spec.imageCount} img` : ''}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* BLOCKS TAB */}
            {rightTab === 'blocks' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Add element</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {ADD_BLOCKS.map(b => (
                      <button key={b.type} onClick={() => addBlock(b.type)}
                        className="flex flex-col items-center gap-1 p-2.5 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition">
                        <span className="text-lg">{b.icon}</span>
                        <span className="text-[10px] font-medium capitalize">{blockLabel(b.type)}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Elements on this page ({currentPage.blocks.length})</h4>
                  <div className="space-y-1.5">
                    {currentPage.blocks.map((b, idx) => (
                      <div key={b.id} className="group flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-100 hover:border-gray-300 transition">
                        <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: tokens.accent, color: '#fff' }}>{blockLabel(b.type)}</span>
                        <span className="flex-1 text-xs text-gray-600 truncate">{b.text || b.label || (b.fields ? 'Metadata' : b.legendItems ? `${b.legendItems.length} items` : '—')}</span>
                        <div className="flex items-center gap-1">
                          <button disabled={idx === 0} onClick={() => moveBlock(b.id, -1)} className="text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs" title="Move up (↑)">▲</button>
                          <button disabled={idx === currentPage.blocks.length - 1} onClick={() => moveBlock(b.id, 1)} className="text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs" title="Move down (↓)">▼</button>
                          <button onClick={() => duplicateBlock(b.id)} className="text-gray-400 hover:text-blue-500 text-xs" title="Duplicate (Ctrl+D)">⎘</button>
                          <button onClick={() => removeBlock(b.id)} className="text-gray-400 hover:text-red-500 text-xs" title="Delete">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STYLE TAB */}
            {rightTab === 'style' && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Colors</h4>
                  <div className="space-y-2">
                    {(['background', 'text', 'primary', 'accent', 'muted'] as const).map(key => (
                      <div key={key} className="flex items-center gap-2">
                        <input type="color" value={tokens[key]} onChange={e => setTok({ [key]: e.target.value })} className="w-9 h-9 rounded border border-gray-300 cursor-pointer" />
                        <div className="flex-1">
                          <label className="text-[10px] text-gray-400 uppercase">{key}</label>
                          <input type="text" value={tokens[key]} onChange={e => setTok({ [key]: e.target.value })} className="w-full px-2 py-1 text-xs border border-gray-200 rounded font-mono" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Typography</h4>
                  <label className="text-[10px] text-gray-400 uppercase block mb-1">Heading</label>
                  <select value={tokens.headingFont} onChange={e => setTok({ headingFont: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-3">
                    {HEADING_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <label className="text-[10px] text-gray-400 uppercase block mb-1">Body</label>
                  <select value={tokens.bodyFont} onChange={e => setTok({ bodyFont: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                    {BODY_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="border-t pt-3">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Design Packs</h4>
                  <div className="flex gap-1.5 mb-2">
                    <button onClick={() => setShowSavePackModal(true)} className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700">💾 Save</button>
                    <button onClick={() => setShowGeneratePackModal(true)} className="flex-1 px-3 py-2 bg-[#D4AF37] text-white rounded text-xs font-medium hover:brightness-95">✨ Generate</button>
                  </div>
                  {designPacks.length > 0 && (
                    <div className="space-y-1">
                      {designPacks.map(pack => (
                        <div key={pack.name} className="flex items-center gap-2 p-2 bg-gray-100 rounded text-xs">
                          <button onClick={() => loadPack(pack)} className="flex-1 text-left hover:text-blue-600 truncate">{pack.name}</button>
                          <button onClick={() => deletePack(pack.name)} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {showSavePackModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg p-4 max-w-sm w-full mx-4">
                      <h3 className="font-semibold mb-3">Save Design Pack</h3>
                      <input type="text" placeholder="Pack name (e.g., 'Dark Minimal')" value={packName} onChange={e => setPackName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-3" />
                      <div className="flex gap-2">
                        <button onClick={() => { setShowSavePackModal(false); setPackName('') }} className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">Cancel</button>
                        <button onClick={savePack} className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700">Save</button>
                      </div>
                    </div>
                  </div>
                )}
                {showGeneratePackModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg p-4 max-w-sm w-full mx-4">
                      <h3 className="font-semibold mb-3">✨ Generate Design Pack with AI</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1.5">Mode</p>
                          <div className="flex gap-1">
                            {(['mood', 'color', 'assets'] as const).map(m => (
                              <button key={m} onClick={() => setGenerateMode(m)} className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition ${generateMode === m ? 'bg-[#D4AF37] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{m}</button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1.5">
                            {generateMode === 'mood' ? 'Mood (e.g., bold, minimal, luxury)' :
                             generateMode === 'color' ? 'Base Color (hex)' :
                             'Description'}
                          </p>
                          <input
                            type="text"
                            placeholder={generateMode === 'mood' ? 'e.g., bold, minimal, luxury' : generateMode === 'color' ? '#000000' : 'Describe your style...'}
                            value={generateInput}
                            onChange={e => setGenerateInput(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <p className="text-[10px] text-gray-400">AI will generate colors, fonts, and spacing based on your input.</p>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => { setShowGeneratePackModal(false); setGenerateInput('') }} className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">Cancel</button>
                        <button onClick={generateStylePack} disabled={isGenerating} className="flex-1 px-3 py-2 bg-[#D4AF37] text-white rounded text-sm hover:brightness-95 disabled:opacity-50">{isGenerating ? 'Generating…' : 'Generate'}</button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Asset Library ({assets.length})</h4>
                    {assets.length > 0 && <button onClick={clearAllAssets} className="text-[9px] text-gray-400 hover:text-red-500">clear</button>}
                  </div>
                  {assets.length === 0 ? (
                    <p className="text-[11px] text-gray-400">Upload images → they appear here</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5">
                      {assets.map(asset => (
                        <div key={asset.id} className="group relative aspect-square bg-gray-100 rounded overflow-hidden">
                          <img src={asset.url} alt={asset.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                          <button onClick={() => insertAsset(asset.url)} className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition text-white text-xs font-semibold">Insert</button>
                          <button onClick={() => deleteAsset(asset.id)} className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] opacity-0 group-hover:opacity-100 transition">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-[11px] text-blue-800">
                  Colors & fonts apply instantly. Save as a pack to reuse later.
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
