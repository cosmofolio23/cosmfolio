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
import { SPREAD_TEMPLATES, type SpreadTemplate } from '@/components/composer/spreadTemplates'
import { analyzeTemplate, autoFillTemplate, summaryLine } from '@/components/composer/templateDNA'
import { STYLE_DNA } from '@/components/composer/styleDNA'
import { ProfessionalPublishingSettings } from '@/components/composer/ProfessionalPublishingSettings'
import { TITLE_BLOCKS, TITLE_BLOCK_CATEGORIES } from '@/components/templates/titleBlocks'
import { TitleBlockView } from '@/components/templates/TitleBlockView'
import { BackgroundLayers, MasterElements } from '@/components/composer/PublishingLayers'
import { SpreadManager } from '@/components/composer/SpreadManager'
import { newFreeElement } from '@/components/composer/FreeCanvas'
import type { FreeElement } from '@/components/composer/types'
import { AIDesignAssistant } from '@/components/composer/AIDesignAssistant'
import { PAGE_SIZES, type Portfolio as PublishingPortfolio } from '@/components/composer/publishingTypes'
import LibraryBrowser, { type LibraryView } from '@/components/templates/LibraryBrowser'

type DesignPack = { name: string; tokens: DesignTokens; createdAt: string }
type Asset = { id: string; url: string; name: string; uploadedAt: string; size: number }

const API_URL = process.env.NODE_ENV === 'production' ? 'https://cosmfolio-backend.onrender.com' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')

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

function seedCustomPages(data: any, orientation: string, size: string, purpose: string, targetPages: number, targetProjects: number): Page[] {
  const list: Page[] = []
  
  // 1. Cover Page
  list.push({
    id: uid('p'),
    type: 'cover',
    layoutId: 'cover.fullBleed.center',
    blocks: [
      { id: uid(), type: 'title', text: data.name || 'Architecture Portfolio' },
      { id: uid(), type: 'subtitle', text: `${purpose.toUpperCase()} PORTFOLIO` },
      { id: uid(), type: 'meta', fields: [{ label: 'Name', value: 'Student Name' }, { label: 'Year', value: '2026' }] }
    ]
  })

  // 2. Contents Page
  list.push({
    id: uid('p'),
    type: 'about',
    layoutId: 'index.minimal.default',
    blocks: [
      { id: uid(), type: 'title', text: 'Selected Works' },
      { id: uid(), type: 'contents', label: 'Contents' }
    ]
  })

  // 3. About / Resume Spread (2 pages)
  list.push({
    id: uid('p'),
    type: 'about',
    layoutId: 'about.portraitFull',
    blocks: [
      { id: uid(), type: 'title', text: 'About Me' },
      { id: uid(), type: 'description', text: 'Architect and designer. Passionate about sustainable urban spaces.' }
    ]
  })
  list.push({
    id: uid('p'),
    type: 'resume',
    layoutId: 'about.cardStack',
    blocks: [
      { id: uid(), type: 'title', text: 'Curriculum Vitae' },
      { id: uid(), type: 'legend', label: 'EDUCATION', legendItems: [{ key: '2022-26', label: 'B.Arch Graduate' }] }
    ]
  })

  // 4. Projects
  const remainingPages = Math.max(2, targetPages - 5)
  const pagesPerProject = Math.max(2, Math.floor(remainingPages / targetProjects))
  
  for (let pIdx = 0; pIdx < targetProjects; pIdx++) {
    const pNum = String(pIdx + 1).padStart(2, '0')
    const pTitle = `Project ${pNum}`
    
    list.push({
      id: uid('p'),
      type: 'project',
      layoutId: 'single.titleTopText',
      blocks: [
        { id: uid(), type: 'title', text: pTitle },
        { id: uid(), type: 'subtitle', text: 'Project Description Subtitle' },
        { id: uid(), type: 'meta', fields: [{ label: 'Year', value: '2026' }, { label: 'Location', value: 'Location' }] },
        { id: uid(), type: 'render', imageUrl: '', label: 'Hero Render' }
      ]
    })

    for (let pg = 1; pg < pagesPerProject; pg++) {
      if (list.length >= targetPages - 1) break
      list.push({
        id: uid('p'),
        type: 'project',
        layoutId: pg % 2 === 1 ? 'duoH.bare' : 'heroSideRight.titleLegendSide',
        blocks: [
          { id: uid(), type: 'render', imageUrl: '', label: 'Visual View' },
          { id: uid(), type: 'plan', imageUrl: '', label: 'Ground Floor Plan' }
        ]
      })
    }
    if (list.length >= targetPages - 1) break
  }

  while (list.length < targetPages - 1) {
    list.push({
      id: uid('p'),
      type: 'project',
      layoutId: 'single.bare',
      blocks: [{ id: uid(), type: 'render', imageUrl: '', label: 'Project View' }]
    })
  }

  // Last page: Contact / Back Cover
  list.push({
    id: uid('p'),
    type: 'contact',
    layoutId: 'contact.minimalGrid',
    blocks: [
      { id: uid(), type: 'title', text: 'Thank You' },
      { id: uid(), type: 'description', text: 'For inquiries or collaborations, get in touch.' }
    ]
  })

  return list
}

const reflowLayoutForOrientation = (layoutId: string, toLandscape: boolean): string => {
  const mapping: Record<string, string> = {
    'duoV.titleTopText': 'duoH.titleSideLeft',
    'duoV.titleSideLeft': 'duoH.titleSideLeft',
    'duoV.titleSideRight': 'duoH.titleSideRight',
    'duoV.titleLegendSide': 'duoH.titleLegendSide',
    'duoV.titleMetaInline': 'duoH.titleMetaInline',
    'heroSideRight.titleTop': 'heroStripBottom.titleTop',
    'heroSideRight.titleSideLeft': 'heroStripBottom.titleSideLeft',
    'heroSideRight.titleSideRight': 'heroStripBottom.titleSideRight',
    'heroSideRight.titleLegendSide': 'heroStripBottom.titleLegendSide',
    'heroSideRight.titleMetaInline': 'heroStripBottom.titleMetaInline',
    
    'duoH.titleSideLeft': 'duoV.titleTopText',
    'duoH.titleSideRight': 'duoV.titleSideRight',
    'duoH.titleLegendSide': 'duoV.titleLegendSide',
    'duoH.titleMetaInline': 'duoV.titleMetaInline',
    'heroStripBottom.titleTop': 'heroSideRight.titleTop',
    'heroStripBottom.titleSideLeft': 'heroSideRight.titleSideLeft',
    'heroStripBottom.titleSideRight': 'heroSideRight.titleSideRight',
    'heroStripBottom.titleLegendSide': 'heroSideRight.titleLegendSide',
    'heroStripBottom.titleMetaInline': 'heroSideRight.titleMetaInline',
  }
  
  if (toLandscape && mapping[layoutId]) return mapping[layoutId]
  if (!toLandscape) {
    const revKey = Object.keys(mapping).find(k => mapping[k] === layoutId)
    if (revKey) return revKey
  }
  return layoutId
}

const reflowFreeElements = (els: FreeElement[], toLandscape: boolean): FreeElement[] => {
  return (els || []).map(el => {
    if (toLandscape) {
      return {
        ...el,
        x: Math.max(0, Math.min(95, el.x * 0.9 + 5)),
        y: Math.max(0, Math.min(95, el.y * 1.1 - 5)),
        w: Math.max(5, Math.min(95, el.w * 0.9)),
        h: Math.max(5, Math.min(95, el.h * 1.1))
      }
    } else {
      return {
        ...el,
        x: Math.max(0, Math.min(95, (el.x - 5) / 0.9)),
        y: Math.max(0, Math.min(95, (el.y + 5) / 1.1)),
        w: Math.max(5, Math.min(95, el.w / 0.9)),
        h: Math.max(5, Math.min(95, el.h / 1.1))
      }
    }
  })
}

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
  const [rightTab, setRightTab] = useState<'layout' | 'blocks' | 'style' | 'guide' | 'publishing' | 'canvas'>('guide')
  const [selectedFreeEl, setSelectedFreeEl] = useState<FreeElement | null>(null)
  const [libraryModalView, setLibraryModalView] = useState<LibraryView | null>(null)
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
  const [showSpreadManager, setShowSpreadManager] = useState(false)
  const [generateMode, setGenerateMode] = useState<'mood' | 'color' | 'assets'>('mood')
  const [generateInput, setGenerateInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [draggedPageIdx, setDraggedPageIdx] = useState<number | null>(null)
  const [documentVersion, setDocumentVersion] = useState<number>(0)
  const [uploadMsg, setUploadMsg] = useState<{ kind: 'info' | 'ok' | 'err'; text: string } | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [tbCat, setTbCat] = useState<'All' | (typeof TITLE_BLOCK_CATEGORIES)[number]>('All')
  const [previewSpread, setPreviewSpread] = useState(false)
  const [editSpreadMode, setEditSpreadMode] = useState<boolean>(true)
  const [previewSpreadIdx, setPreviewSpreadIdx] = useState<number>(0)
  const [layoutTabMode, setLayoutTabMode] = useState<'single' | 'spread'>('spread')
  const [spreadCategory, setSpreadCategory] = useState<'all' | 'about' | 'content' | 'project'>('all')
  const [spreadStyle, setSpreadStyle] = useState<'all' | 'minimal' | 'luxury' | 'competition' | 'academic' | 'experimental' | 'parametric'>('all')
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null)

  // 150+ spreads selection preview & page list grouping helper
  const previewSpreads = useMemo(() => {
    const list: Page[][] = []
    if (pages.length === 0) return list
    
    // Cover
    list.push([pages[0]])
    
    // Spreads
    for (let i = 1; i < pages.length - 1; i += 2) {
      const pair = [pages[i]]
      if (i + 1 < pages.length - 1) {
        pair.push(pages[i + 1])
      }
      list.push(pair)
    }

    // Back Cover
    if (pages.length > 1) {
      list.push([pages[pages.length - 1]])
    }

    return list
  }, [pages])

  const handleNextSpread = () => {
    if (previewSpreadIdx < previewSpreads.length - 1) {
      setFlipDirection('next')
      setTimeout(() => {
        setPreviewSpreadIdx(prev => prev + 1)
        setFlipDirection(null)
      }, 300)
    }
  }

  const handlePrevSpread = () => {
    if (previewSpreadIdx > 0) {
      setFlipDirection('prev')
      setTimeout(() => {
        setPreviewSpreadIdx(prev => prev - 1)
        setFlipDirection(null)
      }, 300)
    }
  }

  // Keyboard navigation for view mode
  useEffect(() => {
    if (mode !== 'view') return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNextSpread()
      else if (e.key === 'ArrowLeft') handlePrevSpread()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode, previewSpreadIdx, previewSpreads])

  const toggleOrientation = () => {
    markDirty()
    const currentSize = publishingPortfolio.pageSize
    const isCurrentlyLandscape = currentSize.width > currentSize.height
    
    // Swap width and height for PageSize
    const newWidth = currentSize.height
    const newHeight = currentSize.width
    const newName = currentSize.preset === 'custom' 
      ? `Custom (${newWidth}×${newHeight}mm)`
      : currentSize.name.includes('Portrait')
        ? currentSize.name.replace('Portrait', 'Landscape')
        : currentSize.name.includes('Landscape')
          ? currentSize.name.replace('Landscape', 'Portrait')
          : currentSize.name // for square or other names
    
    let newPreset = currentSize.preset
    if (currentSize.preset === 'a4-portrait') newPreset = 'a4-landscape'
    else if (currentSize.preset === 'a4-landscape') newPreset = 'a4-portrait'
    else if (currentSize.preset === 'a3-portrait') newPreset = 'a3-landscape'
    else if (currentSize.preset === 'a3-landscape') newPreset = 'a3-portrait'

    const newPageSize = {
      ...currentSize,
      preset: newPreset,
      name: newName,
      width: newWidth,
      height: newHeight
    }

    setPublishingPortfolio(prev => ({
      ...prev,
      pageSize: newPageSize
    }))

    // Reflow layoutIds and freeElements for all pages
    const updatedPages = pages.map(page => {
      const newLayoutId = reflowLayoutForOrientation(page.layoutId, !isCurrentlyLandscape)
      const newFreeElements = reflowFreeElements(page.freeElements || [], !isCurrentlyLandscape)
      return {
        ...page,
        layoutId: newLayoutId,
        freeElements: newFreeElements
      }
    })

    setPages(updatedPages)
    pushHistory()
    flashUpload('ok', `Reflowed all pages to ${!isCurrentlyLandscape ? 'Landscape' : 'Portrait'}`)
  }

  const applyElementScopeFromPage = (scope: 'page' | 'spread' | 'all', el: FreeElement) => {
    markDirty()
    if (scope === 'page') return

    let targetPageIndexes: number[] = []
    if (scope === 'spread') {
      if (currentIdx === 0) return
      else if (currentIdx === pages.length - 1) return
      else {
        const pairIdx = currentIdx % 2 === 1 ? currentIdx + 1 : currentIdx - 1
        if (pairIdx >= 0 && pairIdx < pages.length) {
          targetPageIndexes = [pairIdx]
        }
      }
    } else if (scope === 'all') {
      targetPageIndexes = pages
        .map((_, i) => i)
        .filter(i => i !== currentIdx && i !== 0 && i !== pages.length - 1) // exclude cover/back
    }

    if (targetPageIndexes.length === 0) return

    const updatedPages = pages.map((page, idx) => {
      if (targetPageIndexes.includes(idx)) {
        const existingFree = page.freeElements || []
        const duplicate = existingFree.find(fe => fe.kind === el.kind && fe.graphicType === el.graphicType && fe.x === el.x && fe.y === el.y)
        if (!duplicate) {
          const clonedEl: FreeElement = {
            ...el,
            id: `fe-${Date.now().toString(36)}-cloned-${Math.random().toString(36).substr(2, 5)}`
          }
          return {
            ...page,
            freeElements: [...existingFree, clonedEl]
          }
        }
      }
      return page
    })

    setPages(updatedPages)
    pushHistory()
    flashUpload('ok', `Replicated graphic to ${scope === 'spread' ? 'adjacent spread page' : `${targetPageIndexes.length} pages`}`)
  }

  const applySpreadTemplate = (st: SpreadTemplate) => {
    markDirty()
    if (currentIdx === 0 || currentIdx === pages.length - 1) {
      flashUpload('err', 'Spread layouts can only be applied to pages inside the book spreads, not the covers.')
      return
    }

    const leftIdx = currentIdx % 2 === 1 ? currentIdx : currentIdx - 1
    const rightIdx = leftIdx + 1

    if (leftIdx >= 0 && rightIdx < pages.length) {
      const updatedPages = pages.map((page, idx) => {
        if (idx === leftIdx) {
          return { ...page, layoutId: st.leftLayoutId }
        }
        if (idx === rightIdx) {
          return { ...page, layoutId: st.rightLayoutId }
        }
        return page
      })
      setPages(updatedPages)
      pushHistory()
      flashUpload('ok', `Applied spread layout: ${st.name}`)
    }
  }
  const flashUpload = (kind: 'info' | 'ok' | 'err', text: string, ms = 3500) => {
    setUploadMsg({ kind, text })
    if (ms) window.setTimeout(() => setUploadMsg(m => (m && m.text === text ? null : m)), ms)
  }
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
      // "My Template": hydrate a user-saved template from localStorage
      if (templateId.startsWith('my-')) {
        try {
          const saved = JSON.parse(localStorage.getItem('cosmofolio_my_templates') || '[]')
          const mt = saved.find((t: any) => t.id === templateId)
          if (mt?.document) {
            hydrate({ ...mt.document, templateName: mt.name, templateId })
            setIsLoading(false); loadedRef.current = true
            return
          }
        } catch { /* fall through to template fetch */ }
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
    if (doc.publishing) {
      setPublishingPortfolio(prev => ({
        ...prev,
        backgrounds: doc.publishing.backgrounds || [],
        masterPages: doc.publishing.masterPages || [],
        grid: doc.publishing.grid || prev.grid,
      }))
    }
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
    
    // Read custom setup settings from query params
    const orientationParam = searchParams.get('orientation')
    const sizeParam = searchParams.get('size')
    const purposeParam = searchParams.get('purpose')
    const pagesParam = searchParams.get('pages')
    const projectsParam = searchParams.get('projects')

    let pageSize = PAGE_SIZES['a4-landscape']
    if (orientationParam === 'square' || sizeParam === 'square') {
      pageSize = PAGE_SIZES['square']
    } else if (sizeParam === 'a4') {
      pageSize = orientationParam === 'portrait' ? PAGE_SIZES['a4-portrait'] : PAGE_SIZES['a4-landscape']
    } else if (sizeParam === 'a3') {
      pageSize = orientationParam === 'portrait' ? PAGE_SIZES['a3-portrait'] : PAGE_SIZES['a3-landscape']
    } else if (sizeParam === '1920x1080') {
      pageSize = { preset: 'custom', name: 'Digital Full HD (16:9)', width: 320, height: 180 }
    } else if (sizeParam === 'website') {
      pageSize = { preset: 'custom', name: 'Website presentation', width: 320, height: 200 }
    } else if (sizeParam === 'custom') {
      const cw = parseInt(searchParams.get('customWidth') || '297')
      const ch = parseInt(searchParams.get('customHeight') || '210')
      pageSize = { preset: 'custom', name: `Custom (${cw}×${ch}mm)`, width: cw, height: ch }
    }

    setPublishingPortfolio(prev => ({
      ...prev,
      pageSize
    }))

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
      
      let initialPages: Page[] = []
      if (pagesParam && projectsParam) {
        initialPages = seedCustomPages(
          data,
          orientationParam || 'landscape',
          sizeParam || 'a4',
          purposeParam || 'university',
          parseInt(pagesParam) || 24,
          parseInt(projectsParam) || 4
        )
      } else {
        initialPages = seedPagesFromTemplate(data)
      }

      const isLandscape = pageSize.width > pageSize.height
      if (isLandscape) {
        initialPages = initialPages.map(page => ({
          ...page,
          layoutId: reflowLayoutForOrientation(page.layoutId, true),
          freeElements: reflowFreeElements(page.freeElements || [], true)
        }))
      }
      setPages(initialPages)
    } else {
      // Template unavailable (e.g. reopening a project with no saved doc) — start blank
      setTemplate({ id: templateId, name: 'Portfolio', category: '' })
      setPortfolioTitle('Untitled Portfolio')
      
      let initialPages: Page[] = []
      if (pagesParam && projectsParam) {
        initialPages = seedCustomPages(
          { name: 'Portfolio' },
          orientationParam || 'landscape',
          sizeParam || 'a4',
          purposeParam || 'university',
          parseInt(pagesParam) || 24,
          parseInt(projectsParam) || 4
        )
      } else {
        initialPages = seedPagesFromTemplate({ name: 'Portfolio', placeholders: { renders: 2, plans: 1, sections: 1, diagrams: 0 } })
      }

      const isLandscape = pageSize.width > pageSize.height
      if (isLandscape) {
        initialPages = initialPages.map(page => ({
          ...page,
          layoutId: reflowLayoutForOrientation(page.layoutId, true),
          freeElements: reflowFreeElements(page.freeElements || [], true)
        }))
      }
      setPages(initialPages)
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

  const updateMasterElement = (id: string, patch: any) => {
    markDirty()
    const updatedMasterPages = (publishingPortfolio.masterPages || []).map(m => ({
      ...m,
      elements: m.elements.map(el => el.id === id ? { ...el, ...patch } : el)
    }))
    setPublishingPortfolio({
      ...publishingPortfolio,
      masterPages: updatedMasterPages
    })
  }

  const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
  const uploadImage = async (file: File): Promise<string> => {
    // validate type + size up front so the user gets a clear message
    if (file.type && !ACCEPTED.includes(file.type)) {
      flashUpload('err', `Unsupported file type "${file.type || 'unknown'}". Use JPG, PNG, WEBP or PDF.`)
      throw new Error('unsupported type')
    }
    if (file.size > 25 * 1024 * 1024) {
      flashUpload('err', `"${file.name}" is ${(file.size / 1048576).toFixed(1)}MB — please keep uploads under 25MB.`)
      throw new Error('too large')
    }
    flashUpload('info', `Uploading ${file.name}…`, 0)
    try {
      const pid = await ensureProject()
      const fd = new FormData()
      fd.append('file', file)
      fd.append('asset_type', 'render')
      const res = await fetch(`${API_URL}/api/projects/${pid}/assets`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken()}` },
        body: fd,
      })
      if (!res.ok) {
        // Surface the real server error (the backend returns JSON like
        // { error: { message } } or { detail }) instead of a bare status code.
        let detail = `server ${res.status}`
        try {
          const errBody = await res.json()
          detail = errBody?.error?.message || errBody?.detail || detail
        } catch { /* non-JSON body, keep status */ }
        throw new Error(detail)
      }
      const data = await res.json()
      const url = data.url || data.preview_url
      if (!url) throw new Error('no url returned')
      const newAsset: Asset = { id: uid('a'), url, name: file.name, uploadedAt: new Date().toISOString(), size: file.size }
      const updated = [...assets, newAsset]
      setAssets(updated)
      localStorage.setItem('uploadedAssets', JSON.stringify(updated))
      flashUpload('ok', `✓ ${file.name} uploaded`)
      return url
    } catch (e: any) {
      flashUpload('err', `Upload failed: ${e?.message || 'network error'}. Your other images are safe.`)
      throw e
    }
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
      publishing: {
        backgrounds: publishingPortfolio.backgrounds || [],
        masterPages: publishingPortfolio.masterPages || [],
        grid: publishingPortfolio.grid,
        pageSize: publishingPortfolio.pageSize,
      },
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
    if (!assets.length) { flashUpload('info', 'Upload images to the Style tab first — use the + Add free element → Image button or upload via Guide tab.'); return }
    const byType: Record<string, string[]> = {}
    for (const a of assets) { const t = typeFromName(a.name); (byType[t] ||= []).push(a.url) }
    const next = autoFillTemplate(pages, byType)
    markDirty(); setPages(next)
  }

  // Guided upload: drop an image straight into one specific slot.
  const fillSlotUpload = (pageIndex: number, blockId: string) => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp,application/pdf'
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return
      try {
        const url = await uploadImage(file); if (!url) return
        const next = pages.map((p, i) => i === pageIndex
          ? { ...p, blocks: p.blocks.map(b => b.id === blockId ? { ...b, imageUrl: url } : b) }
          : p)
        markDirty(); setPages(next)
      } catch { /* uploadImage already surfaced the error */ }
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
  const setTitleBlock = (id?: string) => { if (currentPage) updatePage({ ...currentPage, titleBlockId: id }) }

  const PRESET_FILTERS = [
    { name: 'None', filter: 'none' },
    { name: 'Grayscale', filter: 'grayscale(100%)' },
    { name: 'Blueprint', filter: 'sepia(100%) hue-rotate(190deg) saturate(300%) contrast(150%) brightness(80%)' },
    { name: 'High Contrast', filter: 'grayscale(100%) contrast(150%)' },
    { name: 'Sepia Sketch', filter: 'sepia(100%) contrast(120%) brightness(90%)' },
    { name: 'Moody Dark', filter: 'grayscale(50%) contrast(130%) brightness(70%)' },
    { name: 'Invert', filter: 'invert(100%) grayscale(100%) contrast(150%)' },
    { name: 'Warm Sun', filter: 'sepia(50%) saturate(150%) brightness(110%)' },
    { name: 'Cool Steel', filter: 'sepia(50%) hue-rotate(180deg) saturate(100%) brightness(95%)' },
    { name: 'Arch-Dark', filter: 'grayscale(100%) invert(100%) contrast(120%)' },
    { name: 'Faded Vintage', filter: 'sepia(40%) contrast(90%) brightness(110%) opacity(90%)' },
    { name: 'Overcast', filter: 'grayscale(30%) brightness(90%) contrast(110%)' },
    { name: 'Neon Blueprint', filter: 'invert(100%) sepia(100%) hue-rotate(180deg) saturate(400%)' },
  ]

  const applyFilterToPage = (filter: string) => {
    if (!currentPage) return
    const newBlocks = currentPage.blocks.map(b => (b.type === 'render' || b.type === 'diagram' || b.type === 'plan' || b.type === 'section') ? { ...b, cssFilter: filter } : b)
    const newFreeElements = (currentPage.freeElements || []).map(el => el.kind === 'image' ? { ...el, cssFilter: filter } : el)
    updatePage({ ...currentPage, blocks: newBlocks, freeElements: newFreeElements })
    flashUpload('ok', `Applied ${filter === 'none' ? 'No Filter' : 'Filter'} to page`)
  }

  const applyFilterToProject = (filter: string) => {
    const newPages = pages.map(p => {
      const newBlocks = p.blocks.map(b => (b.type === 'render' || b.type === 'diagram' || b.type === 'plan' || b.type === 'section') ? { ...b, cssFilter: filter } : b)
      const newFreeElements = (p.freeElements || []).map(el => el.kind === 'image' ? { ...el, cssFilter: filter } : el)
      return { ...p, blocks: newBlocks, freeElements: newFreeElements }
    })
    setPages(newPages)
    markDirty()
    flashUpload('ok', `Applied ${filter === 'none' ? 'No Filter' : 'Filter'} to entire project!`)
  }

  const [filterBrightness, setFilterBrightness] = useState(100)
  const [filterContrast, setFilterContrast] = useState(100)
  const [filterSaturation, setFilterSaturation] = useState(100)
  const [filterSepia, setFilterSepia] = useState(0)

  const applyCustomFilter = (scope: 'page' | 'project') => {
    const filter = `brightness(${filterBrightness}%) contrast(${filterContrast}%) saturate(${filterSaturation}%) sepia(${filterSepia}%)`
    if (scope === 'page') applyFilterToPage(filter)
    else applyFilterToProject(filter)
  }

  const detachLayoutToCanvas = () => {
    if (!currentPage) return
    if (currentPage.layoutId === 'custom' || currentPage.layoutId === 'blank') {
      flashUpload('info', 'Layout is already custom/blank.')
      return
    }
    const { getSpec } = require('@/components/composer/layoutSpecs')
    const spec = getSpec(currentPage.layoutId)
    if (!spec) return

    const newFreeElements: import('@/components/composer/types').FreeElement[] = [...(currentPage.freeElements || [])]
    const blocks = currentPage.blocks || []
    const counts: Record<string, number> = {}

    spec.regions.forEach((region: any) => {
      const role = region.role
      const x = ((region.c0 - 1) / 12) * 100
      const w = (region.cs / 12) * 100
      const y = ((region.r0 - 1) / 12) * 100
      const h = (region.rs / 12) * 100

      let block: any
      if (role === 'image') {
        const images = blocks.filter(b => ['render', 'plan', 'section', 'diagram'].includes(b.type))
        block = images[region.imageIndex ?? 0]
      } else {
        const typeMap: Record<string, string> = {
          title: 'title', subtitle: 'subtitle', text: 'description', legend: 'legend', meta: 'meta', contents: 'contents'
        }
        const t = typeMap[role]
        if (t) {
          counts[t] = counts[t] || 0
          block = blocks.filter(b => b.type === t)[counts[t]++]
        }
      }

      if (block) {
        const el: any = {
          id: `fe-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          kind: role === 'image' ? 'image' : 'text',
          x, y, w, h, z: 5,
        }
        if (role === 'image') {
          if (!block.imageUrl) return // don't detach empty image placeholders
          el.src = block.imageUrl
          el.cssFilter = block.cssFilter
        } else {
          if (block.type === 'meta') {
            el.text = block.fields?.map((f: any) => `${f.label}: ${f.value}`).join('\n') || ''
          } else if (block.type === 'legend') {
            el.text = block.legendItems?.map((l: any) => `${l.key} - ${l.label}`).join('\n') || ''
          } else {
            el.text = block.text || ''
          }
          if (!el.text) return // skip empty text
          el.fontSize = block.fontSize || (role === 'title' ? 36 : role === 'subtitle' ? 18 : 12)
          el.fontFamily = block.fontFamily
          el.color = block.color || (role === 'title' ? tokens.primary : tokens.text)
          el.align = block.align || 'left'
          el.bold = block.bold
        }
        newFreeElements.push(el)
      }
    })

    if (confirm('Detaching the layout will convert all grid items into freely movable canvas elements. You will lose auto-layout features for this page. Continue?')) {
      updatePage({ ...currentPage, layoutId: 'custom', blocks: [], freeElements: newFreeElements })
      markDirty()
      flashUpload('ok', 'Layout detached! You can now move and resize everything freely.')
    }
  }

  const magicShuffleLayout = () => {
    if (!currentPage.freeElements) return
    const images = currentPage.freeElements.filter(el => el.kind === 'image')
    if (images.length === 0) {
      flashUpload('err', 'No free canvas images to shuffle. Add some images first!')
      return
    }

    const margin = 5
    const gap = 2

    const layouts = [
      (imgs: FreeElement[]) => {
        if (imgs.length < 2) return [{ ...imgs[0], x: margin, y: margin, w: 100 - margin * 2, h: 100 - margin * 2 }]
        const wLeft = 60
        const wRight = 100 - margin * 2 - wLeft - gap
        const hRight = (100 - margin * 2 - gap * (imgs.length - 2)) / (imgs.length - 1)
        return imgs.map((img, i) => {
          if (i === 0) return { ...img, x: margin, y: margin, w: wLeft, h: 100 - margin * 2 }
          return { ...img, x: margin + wLeft + gap, y: margin + (i - 1) * (hRight + gap), w: wRight, h: hRight }
        })
      },
      (imgs: FreeElement[]) => {
        if (imgs.length < 2) return [{ ...imgs[0], x: margin, y: margin, w: 100 - margin * 2, h: 100 - margin * 2 }]
        const hTop = 60
        const hBottom = 100 - margin * 2 - hTop - gap
        const wBottom = (100 - margin * 2 - gap * (imgs.length - 2)) / (imgs.length - 1)
        return imgs.map((img, i) => {
          if (i === 0) return { ...img, x: margin, y: margin, w: 100 - margin * 2, h: hTop }
          return { ...img, x: margin + (i - 1) * (wBottom + gap), y: margin + hTop + gap, w: wBottom, h: hBottom }
        })
      },
      (imgs: FreeElement[]) => {
        const cols = Math.ceil(Math.sqrt(imgs.length))
        const rows = Math.ceil(imgs.length / cols)
        const w = (100 - margin * 2 - gap * (cols - 1)) / cols
        const h = (100 - margin * 2 - gap * (rows - 1)) / rows
        return imgs.map((img, i) => {
          const col = i % cols
          const row = Math.floor(i / cols)
          return { ...img, x: margin + col * (w + gap), y: margin + row * (h + gap), w, h }
        })
      }
    ]

    const preset = layouts[Math.floor(Math.random() * layouts.length)]
    const newImages = preset(images)

    const updatedElements = currentPage.freeElements.map(el => {
      if (el.kind === 'image') {
        const updated = newImages.find(n => n.id === el.id)
        if (updated) return updated
      }
      return el
    })

    updatePage({ ...currentPage, freeElements: updatedElements })
    flashUpload('ok', '✨ Layout Shuffled!')
  }
  const addFreeElement = (kind: FreeElement['kind']) => {
    if (!currentPage) return
    if (kind === 'image') {
      const input = document.createElement('input')
      input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp'
      input.onchange = async () => {
        const file = input.files?.[0]; if (!file) return
        try {
          const url = await uploadImage(file)
          const el = newFreeElement('image', tokens, url)
          markDirty(); updatePage({ ...currentPage, freeElements: [...(currentPage.freeElements || []), el] })
        } catch { /* surfaced by uploadImage */ }
      }
      input.click()
      return
    }
    const el = newFreeElement(kind, tokens)
    markDirty(); updatePage({ ...currentPage, freeElements: [...(currentPage.freeElements || []), el] })
  }

  const FONT_PAIRS: Array<[string, string]> = [
    ['Playfair Display', 'Inter'], ['Montserrat', 'Lora'], ['Bebas Neue', 'Roboto'],
    ['Georgia', 'Source Sans Pro'], ['Oswald', 'Open Sans'], ['Poppins', 'Lato'],
  ]
  const AI_PALETTES: Array<[string, string]> = [
    ['#1a1a1a', '#b08d57'], ['#0f2c4c', '#e0533d'], ['#1d1d1f', '#2a9d8f'], ['#222', '#bc6c25'], ['#16161a', '#c9a96a'],
  ]
  const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]

  /** Real handler for the AI Design Assistant — applies tangible changes. */
  const handleAICommand = (cmd: string) => {
    if (!currentPage) return
    const ofType = LAYOUT_CATALOG.filter(s => s.suits.includes(currentPage.type))
    const applyDna = (id: string, label: string) => { const d = STYLE_DNA.find(x => x.id === id); if (d) setTok(d.tokens); flashUpload('ok', label) }
    switch (cmd) {
      case 'minimize': applyDna('minimal-white', 'Applied a minimal, white-space palette'); break
      case 'premium': applyDna('dark-studio', 'Premium dark + gold treatment applied'); break
      case 'competition': applyDna('competition', 'Competition style applied'); break
      case 'thesis': applyDna('thesis', 'Thesis style applied'); break
      case 'colors': { const [pr, ac] = pick(AI_PALETTES); setTok({ primary: pr, accent: ac }); flashUpload('ok', 'New colour pairing applied'); break }
      case 'fonts': { const [h, b] = pick(FONT_PAIRS); setTok({ headingFont: h, bodyFont: b }); flashUpload('ok', `Fonts: ${h} / ${b}`); break }
      case 'white-space': { const opts = ofType.filter(s => s.category === 'Single' || s.imageCount <= 1); if (opts.length) { setLayout(pick(opts).id); flashUpload('ok', 'Opened up the composition') } break }
      case 'hierarchy': { const opts = ofType.filter(s => s.regions.some(r => r.role === 'title')); if (opts.length) { setLayout(pick(opts).id); flashUpload('ok', 'Strengthened the title hierarchy') } break }
      case 'recompose': { const opts = ofType.filter(s => s.id !== currentPage.layoutId); if (opts.length) { const s = pick(opts); setLayout(s.id); flashUpload('ok', `Recomposed → ${s.name}`) } break }
      case 'generate-bg': {
        const bg = { id: `bg-${Date.now()}`, name: 'AI Background', zIndex: 0, opacity: 1, visible: true, appliesTo: 'entire-project' as const, definitions: [{ type: 'pattern' as const, pattern: 'parametric' as const, color: tokens.accent, scale: 1.4, opacity: 0.16 }] }
        markDirty(); setPublishingPortfolio(p => ({ ...p, backgrounds: [...(p.backgrounds || []), bg] }))
        flashUpload('ok', 'Parametric background added (see Publishing tab)'); break
      }
      case 'improve-page': flashUpload('info', 'Lead with one hero image · keep ≤2 type sizes · align everything to the grid.', 6000); break
      case 'improve-text': flashUpload('info', 'Open with a one-line concept, then 2–3 sentences of design intent.', 6000); break
      default: flashUpload('info', `AI: ${cmd}`)
    }
  }

  const saveAsMyTemplate = () => {
    const name = window.prompt('Name this template (it will appear under "My Templates"):', portfolioTitle || template?.name || 'My Template')
    if (!name) return
    try {
      const saved = JSON.parse(localStorage.getItem('cosmofolio_my_templates') || '[]')
      const entry = {
        id: `my-${Date.now().toString(36)}`,
        name,
        savedAt: new Date().toISOString(),
        colors: { primary: tokens.primary, secondary: tokens.muted, accent: tokens.accent, background: tokens.background, text: tokens.text },
        fonts: { heading: tokens.headingFont, body: tokens.bodyFont },
        // a portfolio-shaped hint so the gallery preview picks a sensible cover
        layouts: { cover: { structure: getSpec(pages[0]?.layoutId || '').kind === 'overlay' ? 'full-bleed overlay' : 'split' } },
        placeholders: { renders: 3, plans: 1, sections: 1 },
        document: {
          version: 2, templateId, title: portfolioTitle, tokens, pages,
          publishing: {
            backgrounds: publishingPortfolio.backgrounds || [],
            masterPages: publishingPortfolio.masterPages || [],
            grid: publishingPortfolio.grid,
          },
        },
      }
      localStorage.setItem('cosmofolio_my_templates', JSON.stringify([entry, ...saved].slice(0, 50)))
      flashUpload('ok', `⭐ Saved "${name}" to My Templates`)
    } catch (e: any) {
      flashUpload('err', `Could not save template: ${e?.message || 'storage error'}`)
    }
  }

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
    const layoutId: string = type === 'cover' ? 'cover.minimal' : type === 'about' ? 'text.statement' : type === 'contact' ? 'contact.center' : type === 'resume' ? 'resume.swissGrid' : type === 'contents' ? 'index.magazine' : 'twoThirdsStack.titleMetaInline'
    const blocks: Block[] = [{ ...createBlock('title'), text: type === 'project' ? `Project ${pages.filter(p => p.type === 'project').length + 1}` : type === 'resume' ? 'Curriculum Vitae' : type === 'contents' ? 'Table of Contents' : 'New Page' }]
    if (type === 'project') { 
      blocks.push(createBlock('meta'), createBlock('render'), createBlock('description')) 
    } else if (type === 'resume') {
      blocks.push(
        { ...createBlock('subtitle'), text: 'Architecture Student & 3D Designer' },
        { ...createBlock('meta'), fields: [{ label: 'Email', value: 'hello@example.com' }, { label: 'Phone', value: '+1 234 567 8900' }, { label: 'Website', value: 'portfolio.com' }] },
        { ...createBlock('description'), text: 'EDUCATION\n\nMaster of Architecture\nHarvard GSD | 2024 - 2026\n• Current GPA: 3.9 / 4.0\n• Thesis: Parametric Urbanism\n\nBachelor of Architecture\nUCL Bartlett | 2020 - 2024\n• Graduated with First Class Honours\n• Marks: 92% Average\n\nPROFESSIONAL EXPERIENCE\n\nJunior Architect @ OMA\nSummer 2025\n• Developed concept models in Rhino\n• Produced presentation renders in Lumion\n\nArchitecture Intern @ BIG\nSummer 2024\n• Assisted with drafting plans in AutoCAD\n• Prepared physical study models' },
        { ...createBlock('legend'), label: 'SOFTWARE SKILLS', legendItems: [{ key: 'RNO', label: 'Rhinoceros 3D (Expert)' }, { key: 'RVT', label: 'Autodesk Revit (Advanced)' }, { key: 'ACD', label: 'AutoCAD (Expert)' }, { key: 'LUM', label: 'Lumion (Advanced)' }, { key: 'VRY', label: 'V-Ray (Intermediate)' }, { key: 'PS', label: 'Adobe Photoshop (Expert)' }, { key: 'AI', label: 'Adobe Illustrator (Expert)' }, { key: 'ID', label: 'Adobe InDesign (Expert)' }] }
      )
    } else if (type === 'contents') {
      blocks.push(createBlock('contents'))
    } else { 
      blocks.push(createBlock('description')) 
    }
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
    if (!portfolioTitle.trim()) { flashUpload('err', 'Please enter a portfolio name in the title bar first.'); return }
    setIsSaving(true)
    try {
      await saveDocument()
      router.push('/dashboard/my-portfolios')
    } catch (e: any) {
      flashUpload('err', `Save failed: ${e?.message || 'network error'}. Try again or check your connection.`)
    } finally { setIsSaving(false) }
  }

  const exportToPDF = async () => {
    setIsExporting(true)
    flashUpload('info', 'Saving and preparing PDF…', 0)
    try {
      const pid = await ensureProject()
      // Save first — warn if the save itself fails but continue with last saved version
      try {
        await saveDocument()
      } catch (saveErr: any) {
        flashUpload('info', `Note: Could not save latest changes (${saveErr?.message || 'network error'}). Exporting last saved version.`, 5000)
        await new Promise(r => setTimeout(r, 1200))
      }
      
      const printWin = window.open(`/dashboard/portfolio-book/${pid}?print=1`, '_blank')
      if (!printWin) {
        flashUpload('err', 'Pop-up blocked. Allow popups for this site, then try again.')
      } else {
        flashUpload('ok', '✓ Opened PDF print viewer')
      }
    } catch (e: any) {
      flashUpload('err', 'Save your portfolio first, then export as PDF.')
    } finally {
      setIsExporting(false)
    }
  }

  const savePack = () => {
    if (!packName.trim()) { flashUpload('err', 'Enter a name for this design pack.'); return }
    const newPack: DesignPack = { name: packName, tokens: structuredClone(tokens), createdAt: new Date().toISOString() }
    const updated = [...designPacks.filter(p => p.name !== packName), newPack]
    setDesignPacks(updated)
    localStorage.setItem('designPacks', JSON.stringify(updated))
    setPackName('')
    setShowSavePackModal(false)
    flashUpload('ok', `⭐ Design pack "${packName}" saved!`)
  }

  const loadPack = (pack: DesignPack) => {
    setTok(pack.tokens)
    flashUpload('ok', `✓ Loaded "${pack.name}"`)
  }

  const deletePack = (name: string) => {
    const updated = designPacks.filter(p => p.name !== name)
    setDesignPacks(updated)
    localStorage.setItem('designPacks', JSON.stringify(updated))
  }

  const insertAsset = (assetUrl: string) => {
    if (!currentPage) return
    const imageTypes = ['render', 'plan', 'section', 'diagram'] as const
    // Find first unfilled image slot on the current page
    const emptySlot = currentPage.blocks.find(
      b => imageTypes.includes(b.type as typeof imageTypes[number]) && !b.imageUrl
    )
    if (emptySlot) {
      // Fill the first available empty slot
      const next = { ...currentPage, blocks: currentPage.blocks.map(b => b.id === emptySlot.id ? { ...b, imageUrl: assetUrl } : b) }
      markDirty(); updatePage(next)
      flashUpload('ok', `✓ Image placed into ${emptySlot.type} slot`)
    } else {
      // All slots filled — add as a movable free canvas element instead
      const el = newFreeElement('image', tokens, assetUrl)
      markDirty(); updatePage({ ...currentPage, freeElements: [...(currentPage.freeElements || []), el] })
      flashUpload('ok', '✓ Image added as a free element (drag to position)')
    }
    setTimeout(() => recordHistorySnapshot(), 10)
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
      flashUpload('err', `Please enter a ${generateMode} to generate from.`)
      return
    }
    if (!projectId) {
      flashUpload('info', 'Save your portfolio first (click "Save & Close" or upload an image), then generate a style pack.')
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
              <div className="flex rounded-lg border border-gray-300 overflow-hidden text-xs">
                <button onClick={() => setPreviewSpread(false)} className={`px-3 py-1.5 font-medium ${!previewSpread ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>📄 Single</button>
                <button onClick={() => setPreviewSpread(true)} className={`px-3 py-1.5 font-medium ${previewSpread ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>📖 Spread</button>
              </div>
              <button onClick={exportToPDF} disabled={isExporting} className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-medium hover:bg-gray-900 disabled:opacity-50">{isExporting ? '⏳ Exporting…' : '📄 Export PDF'}</button>
              <button onClick={() => setMode('edit')} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">✏️ Edit</button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-300/40">
          {!previewSpread ? (
            <div className="max-w-[680px] mx-auto space-y-6" style={{ pointerEvents: 'none' }}>
              {pages.map((page) => (
                <div key={page.id}>
                  <PageComposer page={page} tokens={tokens} pageSize={publishingPortfolio.pageSize} onChange={() => {}} />
                  <div className="mt-1 text-center text-[10px] text-gray-400">{page.type} · {getSpec(page.layoutId).name}</div>
                </div>
              ))}
            </div>
          ) : (
            /* Premium interactive 3D Book Spread view: cover alone, then left/right page pairs with sequential flips */
            <div className="flex flex-col items-center justify-center min-h-[75vh] gap-6">
              {/* Perspective container */}
              <div className="w-full flex items-center justify-between px-4 max-w-[1200px]">
                {/* Left Arrow Button */}
                <button
                  onClick={handlePrevSpread}
                  disabled={previewSpreadIdx === 0}
                  className="w-12 h-12 rounded-full border border-gray-300 bg-white shadow-lg hover:bg-gray-50 flex items-center justify-center text-lg disabled:opacity-30 transition-all select-none font-bold"
                >
                  ◀
                </button>

                {/* Spread Canvas */}
                <div 
                  className="flex-1 flex justify-center py-4 overflow-visible"
                  style={{ perspective: 1200 }}
                >
                  <div 
                    className={`flex shadow-2xl relative transition-all duration-300 ${
                      flipDirection === 'next' ? '[transform:rotateY(-12deg)] origin-center' :
                      flipDirection === 'prev' ? '[transform:rotateY(12deg)] origin-center' : ''
                    }`}
                    style={{ 
                      transformStyle: 'preserve-3d', 
                      borderRadius: 4, 
                      overflow: 'visible',
                      maxWidth: (previewSpreads[previewSpreadIdx] || []).length === 2 ? 1040 : 520,
                      width: '100%'
                    }}
                  >
                    {(previewSpreads[previewSpreadIdx] || []).map((page, pi) => {
                      const isLeft = (previewSpreads[previewSpreadIdx] || []).length === 2 && pi === 0
                      const isRight = (previewSpreads[previewSpreadIdx] || []).length === 2 && pi === 1
                      return (
                        <div 
                          key={page.id} 
                          className="relative flex-1 overflow-hidden" 
                          style={{
                            aspectRatio: `${publishingPortfolio.pageSize.width}/${publishingPortfolio.pageSize.height}`,
                            boxShadow: isLeft 
                              ? 'inset -12px 0 20px rgba(0,0,0,0.15), -10px 10px 20px rgba(0,0,0,0.1)' 
                              : isRight 
                                ? 'inset 12px 0 20px rgba(0,0,0,0.15), 10px 10px 20px rgba(0,0,0,0.1)' 
                                : '0 15px 35px rgba(0,0,0,0.2)'
                          }}
                        >
                          <PageComposer 
                            page={page} 
                            tokens={tokens} 
                            onChange={() => {}}
                            backgrounds={publishingPortfolio.backgrounds?.filter(b => b.appliesTo === 'entire-project' || !b.pageId || b.pageId === page.id)}
                            masterElements={publishingPortfolio.masterPages?.flatMap(m => m.elements)}
                            pageContext={{ pageNumber: pages.indexOf(page) + 1, totalPages: pages.length, projectTitle: portfolioTitle, projectNumber: String(pages.indexOf(page) + 1).padStart(2, '0') }}
                            grid={publishingPortfolio.grid}
                            pageSize={publishingPortfolio.pageSize}
                          />
                        </div>
                      )
                    })}
                    {/* Center Spine Line (only when it is a spread of 2 pages) */}
                    {(previewSpreads[previewSpreadIdx] || []).length === 2 && (
                      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-2 bg-slate-900 shadow-[inset_0_0_8px_rgba(0,0,0,0.9)] z-20 pointer-events-none" />
                    )}
                  </div>
                </div>

                {/* Right Arrow Button */}
                <button
                  onClick={handleNextSpread}
                  disabled={previewSpreadIdx === previewSpreads.length - 1}
                  className="w-12 h-12 rounded-full border border-gray-300 bg-white shadow-lg hover:bg-gray-50 flex items-center justify-center text-lg disabled:opacity-30 transition-all select-none font-bold"
                >
                  ▶
                </button>
              </div>

              {/* Dot Pagination & Label Info */}
              <div className="flex flex-col items-center gap-2 mt-4 select-none">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {previewSpreadIdx === 0 ? 'Cover Page (Page 1)' :
                   previewSpreadIdx === previewSpreads.length - 1 ? `Back Cover (Page ${pages.length})` :
                   `Pages ${previewSpreadIdx * 2} - ${previewSpreadIdx * 2 + 1}`}
                </div>
                <div className="flex items-center gap-2.5">
                  {previewSpreads.map((_, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => setPreviewSpreadIdx(sIdx)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        previewSpreadIdx === sIdx ? 'bg-blue-600 scale-125' : 'bg-gray-350 hover:bg-gray-450'
                      }`}
                      title={sIdx === 0 ? 'Cover' : sIdx === previewSpreads.length - 1 ? 'Back Cover' : `Spread ${sIdx}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
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
              <>
                <Link href={`/dashboard/portfolio-book/${projectId}`} className="px-3 py-2 bg-[#D4AF37] text-white rounded-lg text-sm font-medium hover:brightness-95" title="View as book">📖 Book</Link>
                <Link href={`/dashboard/portfolio-web/${projectId}`} className="px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:opacity-90 shadow-sm" title="Interactive Web Experience">🌐 Web</Link>
              </>
            )}
            <button onClick={() => setShowSpreadManager(true)} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700" title="Visual Spread Manager">⏹️ Spreads</button>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden text-xs">
              <button onClick={() => setEditSpreadMode(false)} className={`px-2.5 py-1.5 font-medium ${!editSpreadMode ? 'bg-blue-650 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`} title="Single page canvas edit">📄 Single</button>
              <button onClick={() => setEditSpreadMode(true)} className={`px-2.5 py-1.5 font-medium ${editSpreadMode ? 'bg-blue-650 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`} title="Dual page spread composer">📖 Spread</button>
            </div>
            <button onClick={toggleOrientation} className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50" title="Reflow page orientations (Portrait <-> Landscape)">🔄 Reflow Format</button>
            <button onClick={() => setMode('view')} className="px-3 py-2 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50" title="Preview the finished portfolio">👁 Preview</button>
            <button onClick={saveAsMyTemplate} className="px-3 py-2 border rounded-lg text-sm font-medium text-[#9C7416] hover:bg-[#FBE7A1]/30" title="Save this design as a reusable template">⭐ Save Template</button>
            <button onClick={exportToPDF} disabled={isExporting} className="px-3 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50" title="Download as PDF">{isExporting ? '⏳' : '📄 PDF'}</button>
            <button onClick={savePortfolio} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{isSaving ? 'Saving…' : 'Save & Close'}</button>
          </div>
        </div>
      </header>

      {/* Upload / export toast */}
      {uploadMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2 max-w-md"
          style={{
            background: uploadMsg.kind === 'err' ? '#fef2f2' : uploadMsg.kind === 'ok' ? '#f0fdf4' : '#eff6ff',
            color: uploadMsg.kind === 'err' ? '#b91c1c' : uploadMsg.kind === 'ok' ? '#15803d' : '#1d4ed8',
            border: `1px solid ${uploadMsg.kind === 'err' ? '#fecaca' : uploadMsg.kind === 'ok' ? '#bbf7d0' : '#bfdbfe'}`,
          }}>
          {uploadMsg.kind === 'info' && <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
          <span>{uploadMsg.text}</span>
          <button onClick={() => setUploadMsg(null)} className="ml-1 opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

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
                {(['project', 'about', 'cover', 'contact', 'resume', 'contents'] as const).map(t => (
                  <button key={t} onClick={() => addPage(t)} className="px-2 py-1.5 text-[11px] border border-gray-300 rounded hover:bg-gray-50 capitalize">+ {t}</button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Center: canvas */}
        <main className={`${isMobile ? 'flex-1' : 'flex-1'} overflow-y-auto ${isMobile ? 'p-2' : 'p-8'} bg-gray-300/40 overflow-x-hidden`}>
          <style>{`
            .portfolio-page { font-size: ${16 * (tokens.fontScale || 1)}px; }
            .portfolio-page .text-xs { font-size: 0.75em; line-height: 1rem; }
            .portfolio-page .text-sm { font-size: 0.875em; line-height: 1.25rem; }
            .portfolio-page .text-base { font-size: 1em; line-height: 1.5rem; }
            .portfolio-page .text-lg { font-size: 1.125em; line-height: 1.75rem; }
            .portfolio-page .text-xl { font-size: 1.25em; line-height: 1.75rem; }
            .portfolio-page .text-2xl { font-size: 1.5em; line-height: 2rem; }
            .portfolio-page .text-3xl { font-size: 1.875em; line-height: 2.25rem; }
            .portfolio-page .text-4xl { font-size: 2.25em; line-height: 2.5rem; }
            .portfolio-page .text-5xl { font-size: 3em; line-height: 1; }
            .portfolio-page .text-6xl { font-size: 3.75em; line-height: 1; }
            .portfolio-page .text-7xl { font-size: 4.5em; line-height: 1; }
            .portfolio-page .text-8xl { font-size: 6em; line-height: 1; }
          `}</style>

          {editSpreadMode && currentIdx > 0 && currentIdx < pages.length - 1 ? (
            /* Cosmo Book Design Mode: Left and Right Page side-by-side spread */
            (() => {
              const leftIdx = currentIdx % 2 === 1 ? currentIdx : currentIdx - 1
              const rightIdx = leftIdx + 1
              return (
                <div className="flex gap-0 items-stretch justify-center mx-auto relative overflow-visible max-w-[1520px] select-none py-2">
                  {/* Left Page */}
                  <div className={`w-[760px] relative transition-all duration-200 cursor-pointer ${currentIdx === leftIdx ? 'ring-4 ring-blue-500 shadow-2xl z-10 scale-[1.005]' : 'opacity-85 shadow-lg hover:opacity-95'}`} onClick={() => setCurrentIdx(leftIdx)}>
                    <PageComposer
                      page={pages[leftIdx]}
                      tokens={tokens}
                      onChange={(p) => {
                        markDirty()
                        setPages(pages.map((x, i) => i === leftIdx ? p : x))
                      }}
                      onUploadImage={uploadImage}
                      backgrounds={publishingPortfolio.backgrounds?.filter(b => b.appliesTo === 'entire-project' || !b.pageId || b.pageId === pages[leftIdx].id)}
                      masterElements={publishingPortfolio.masterPages?.flatMap(m => m.elements)}
                      pageContext={{ pageNumber: leftIdx + 1, totalPages: pages.length, projectTitle: portfolioTitle, projectNumber: String(leftIdx + 1).padStart(2, '0') }}
                      grid={publishingPortfolio.grid}
                      editableFree={currentIdx === leftIdx}
                      onFreeChange={els => {
                        markDirty()
                        setPages(pages.map((x, i) => i === leftIdx ? { ...x, freeElements: els } : x))
                      }}
                      onApplyScope={applyElementScopeFromPage}
                      onFreeSelectionChange={el => { if (el) { setSelectedFreeEl(el); setRightTab('canvas') } }}
                      pages={pages}
                      onUpdateGlobalPages={(updater) => {
                        markDirty()
                        setPages(updater(pages))
                      }}
                      overflowVisible
                      onUpdateMasterElement={updateMasterElement}
                      pageSize={publishingPortfolio.pageSize}
                    />
                    <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider select-none pointer-events-none">Left Page · Page {leftIdx + 1}</div>
                  </div>

                  {/* Center Gutter/Spine */}
                  <div className="w-2 bg-slate-950 shadow-[inset_0_0_10px_rgba(0,0,0,0.85)] z-20 pointer-events-none relative flex-shrink-0" />

                  {/* Right Page */}
                  <div className={`w-[760px] relative transition-all duration-200 cursor-pointer ${currentIdx === rightIdx ? 'ring-4 ring-blue-500 shadow-2xl z-10 scale-[1.005]' : 'opacity-85 shadow-lg hover:opacity-95'}`} onClick={() => setCurrentIdx(rightIdx)}>
                    <PageComposer
                      page={pages[rightIdx]}
                      tokens={tokens}
                      onChange={(p) => {
                        markDirty()
                        setPages(pages.map((x, i) => i === rightIdx ? p : x))
                      }}
                      onUploadImage={uploadImage}
                      backgrounds={publishingPortfolio.backgrounds?.filter(b => b.appliesTo === 'entire-project' || !b.pageId || b.pageId === pages[rightIdx].id)}
                      masterElements={publishingPortfolio.masterPages?.flatMap(m => m.elements)}
                      pageContext={{ pageNumber: rightIdx + 1, totalPages: pages.length, projectTitle: portfolioTitle, projectNumber: String(rightIdx + 1).padStart(2, '0') }}
                      grid={publishingPortfolio.grid}
                      editableFree={currentIdx === rightIdx}
                      onFreeChange={els => {
                        markDirty()
                        setPages(pages.map((x, i) => i === rightIdx ? { ...x, freeElements: els } : x))
                      }}
                      onApplyScope={applyElementScopeFromPage}
                      onFreeSelectionChange={el => { if (el) { setSelectedFreeEl(el); setRightTab('canvas') } }}
                      pages={pages}
                      onUpdateGlobalPages={(updater) => {
                        markDirty()
                        setPages(updater(pages))
                      }}
                      overflowVisible
                      onUpdateMasterElement={updateMasterElement}
                      pageSize={publishingPortfolio.pageSize}
                    />
                    <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider select-none pointer-events-none">Right Page · Page {rightIdx + 1}</div>
                  </div>
                </div>
              )
            })()
          ) : (
            /* Single Page Canvas (Covers, or when Spread Mode is disabled) */
            <div className="max-w-[760px] mx-auto relative select-none">
              <PageComposer
                page={currentPage}
                tokens={tokens}
                onChange={updatePage}
                onUploadImage={uploadImage}
                backgrounds={publishingPortfolio.backgrounds?.filter(b => b.appliesTo === 'entire-project' || !b.pageId || b.pageId === currentPage.id)}
                masterElements={publishingPortfolio.masterPages?.flatMap(m => m.elements)}
                pageContext={{ pageNumber: currentIdx + 1, totalPages: pages.length, projectTitle: portfolioTitle, projectNumber: String(currentIdx + 1).padStart(2, '0') }}
                grid={publishingPortfolio.grid}
                editableFree
                onFreeChange={els => updatePage({ ...currentPage, freeElements: els })}
                onApplyScope={applyElementScopeFromPage}
                onFreeSelectionChange={el => { if (el) { setSelectedFreeEl(el); setRightTab('canvas') } }}
                pages={pages}
                onUpdateGlobalPages={(updater) => {
                  markDirty()
                  setPages(updater(pages))
                }}
                onUpdateMasterElement={updateMasterElement}
                pageSize={publishingPortfolio.pageSize}
              />
            </div>
          )}
          <div className={`max-w-[760px] mx-auto ${isMobile ? 'mt-2 text-[9px]' : 'mt-3 text-[11px]'} text-center text-gray-400 font-medium`}>
            {editSpreadMode && currentIdx > 0 && currentIdx < pages.length - 1 
              ? `Spread view: Pages ${currentIdx % 2 === 1 ? currentIdx + 1 : currentIdx} - ${currentIdx % 2 === 1 ? currentIdx + 2 : currentIdx + 1} of ${pages.length}`
              : `Page ${currentIdx + 1} of ${pages.length}`}
            {' · '}
            <span>Active Editing: {currentPage.type.toUpperCase()} layout ({getSpec(currentPage.layoutId).name})</span>
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
            {([
              ['guide',      '📋', 'Guide'],
              ['publishing', '📐', 'Publishing'],
              ['layout',     '▦',  'Layout'],
              ['blocks',     '▤',  'Blocks'],
              ['canvas',     '✦',  'Canvas'],
              ['style',      '🎨', 'Style'],
            ] as const).map(([t, icon, label]) => (
              <button key={t} onClick={() => setRightTab(t)} title={label}
                className={`flex-1 py-3 text-base transition ${rightTab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                {icon}
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
                  onUpdate={p => { markDirty(); setPublishingPortfolio(p) }}
                  drawingMeta={currentPage.drawingMeta}
                  onDrawingMeta={meta => updatePage({ ...currentPage, drawingMeta: meta })}
                  currentPageId={currentPage.id}
                />
                <AIDesignAssistant
                  onCommand={handleAICommand}
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
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2 font-bold">100+ Cosmo Style DNA Variations</p>
                    <div className="grid grid-cols-1 gap-2.5 overflow-y-auto pr-1" style={{ maxHeight: 380 }}>
                      {STYLE_DNA.map(st => {
                        const active = tokens.background === st.tokens.background && tokens.primary === st.tokens.primary && tokens.headingFont === st.tokens.headingFont
                        return (
                          <button
                            key={st.id}
                            onClick={() => { markDirty(); setTokens(st.tokens) }}
                            title={st.description}
                            className={`flex flex-col gap-2 p-2 rounded-xl border text-left transition ${active ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}
                          >
                            <div className="flex items-center justify-between gap-1.5 w-full">
                              <span className="text-[10px] font-bold text-gray-800 truncate">{st.name}</span>
                              <span className="text-[8px] bg-gray-200 text-gray-605 px-1 py-0.2 rounded font-semibold uppercase">{st.id.split('-')[0]}</span>
                            </div>
                            
                            {/* Real miniature visual layout preview showing color & typography tokens */}
                            <div className="grid grid-cols-3 gap-1 p-1 rounded border border-gray-200" style={{ background: st.tokens.background }}>
                              {/* Cover mini */}
                              <div className="rounded flex flex-col justify-between p-1 relative border border-gray-100" style={{ background: st.tokens.background, aspectRatio: `${publishingPortfolio.pageSize.width}/${publishingPortfolio.pageSize.height}` }}>
                                <div className="w-1/2 h-1 rounded-full" style={{ background: st.tokens.accent }} />
                                <div className="space-y-0.5">
                                  <div className="w-4/5 h-2 rounded" style={{ background: st.tokens.primary }} />
                                  <div className="w-2/3 h-1 rounded" style={{ background: st.tokens.accent }} />
                                </div>
                                <div className="text-[4px] font-bold overflow-hidden" style={{ color: st.tokens.primary, fontFamily: st.tokens.headingFont }}>PORTFOLIO</div>
                              </div>
                              {/* About Spread mini */}
                              <div className="col-span-2 rounded flex gap-0.5 border border-gray-100 overflow-hidden relative" style={{ background: st.tokens.background, aspectRatio: `${publishingPortfolio.pageSize.width * 2}/${publishingPortfolio.pageSize.height}` }}>
                                <div className="flex-1 p-1 flex flex-col gap-1 border-r border-gray-200">
                                  <div className="w-1/2 h-1.5 rounded" style={{ background: st.tokens.primary }} />
                                  <div className="space-y-0.5">
                                    <div className="w-full h-0.5 rounded" style={{ background: st.tokens.accent }} />
                                    <div className="w-4/5 h-0.5 rounded" style={{ background: st.tokens.accent }} />
                                    <div className="w-full h-0.5 rounded" style={{ background: st.tokens.accent }} />
                                  </div>
                                </div>
                                <div className="flex-1 p-1 flex flex-col justify-between">
                                  <div className="space-y-0.5">
                                    <div className="w-full h-0.5 rounded" style={{ background: st.tokens.accent }} />
                                    <div className="w-3/4 h-0.5 rounded" style={{ background: st.tokens.accent }} />
                                  </div>
                                  <div className="w-full h-4 rounded" style={{ background: st.tokens.muted }} />
                                </div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-full bg-gray-300" />
                              </div>
                            </div>
                            <span className="text-[9px] text-gray-550 line-clamp-1 leading-normal italic">{st.description}</span>
                          </button>
                        )
                      })}
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
                {/* Layout Mode Toggle */}
                <div className="flex rounded-lg border border-gray-300 overflow-hidden text-xs">
                  <button onClick={() => setLayoutTabMode('single')} className={`flex-1 py-1.5 font-medium ${layoutTabMode === 'single' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Single Grid</button>
                  <button onClick={() => setLayoutTabMode('spread')} className={`flex-1 py-1.5 font-medium ${layoutTabMode === 'spread' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Spread Layout</button>
                </div>

                {layoutTabMode === 'single' ? (
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
                    <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 340px)' }}>
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
                ) : (
                  <div className="space-y-3">
                    <div className="text-[11px] text-gray-500 font-medium">Cosmo Spread Layout Packs (150+ templates)</div>
                    <button
                      onClick={() => setLibraryModalView(spreadCategory === 'about' ? 'about' : 'project')}
                      className="w-full py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 border border-blue-200 transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      ✨ Browse Realistic Spread Library
                    </button>
                    {/* Category Filter */}
                    <div className="flex flex-wrap gap-1">
                      {(['all', 'about', 'content', 'project'] as const).map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSpreadCategory(cat)}
                          className={`px-2 py-1 rounded text-[10px] font-semibold transition capitalize ${spreadCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          {cat === 'all' ? 'All Pages' : cat === 'content' ? 'Contents' : cat}
                        </button>
                      ))}
                    </div>
                    {/* Style Filter */}
                    <div className="flex flex-wrap gap-1">
                      {(['all', 'minimal', 'luxury', 'competition', 'academic', 'experimental', 'parametric'] as const).map(st => (
                        <button
                          key={st}
                          onClick={() => setSpreadStyle(st)}
                          className={`px-2 py-0.5 rounded text-[9px] font-medium transition capitalize ${spreadStyle === st ? 'bg-slate-700 text-white' : 'bg-gray-50 border text-gray-500 hover:bg-gray-100'}`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                    {/* Spread List */}
                    <div className="grid grid-cols-1 gap-2.5 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 365px)' }}>
                      {SPREAD_TEMPLATES.filter(st => {
                        if (spreadCategory !== 'all' && st.category !== spreadCategory) return false
                        if (spreadStyle !== 'all' && st.style !== spreadStyle) return false
                        return true
                      }).map(st => {
                        return (
                          <button
                            key={st.id}
                            onClick={() => applySpreadTemplate(st)}
                            className="group text-left rounded-lg p-2.5 border border-gray-200 hover:border-blue-500 hover:bg-blue-50/20 transition flex flex-col gap-1.5"
                          >
                            <div className="text-[10px] font-bold text-gray-700 leading-tight truncate">{st.name}</div>
                            <div className="text-[8px] text-gray-400 uppercase font-semibold">{st.style} · {st.category}</div>
                            {/* Double mini layout previews side-by-side */}
                            <div className="flex gap-1.5 bg-gray-150 p-1 rounded-md mt-0.5 w-full">
                              <div className="flex-1 scale-[0.9] border border-gray-200 rounded overflow-hidden" style={{ aspectRatio: `${publishingPortfolio.pageSize.width}/${publishingPortfolio.pageSize.height}` }}>
                                <LayoutThumb spec={getSpec(st.leftLayoutId)} tokens={tokens} active={false} />
                              </div>
                              <div className="flex-1 scale-[0.9] border border-gray-200 rounded overflow-hidden" style={{ aspectRatio: `${publishingPortfolio.pageSize.width}/${publishingPortfolio.pageSize.height}` }}>
                                <LayoutThumb spec={getSpec(st.rightLayoutId)} tokens={tokens} active={false} />
                              </div>
                            </div>
                            <div className="text-[9px] text-gray-550 leading-normal mt-0.5 italic">{st.description}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BLOCKS TAB */}
            {rightTab === 'blocks' && (
              <div className="space-y-4">
                {/* Master Title Block */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase">🏷️ Master Title Block</h4>
                    {currentPage.titleBlockId && (
                      <button onClick={() => setTitleBlock(undefined)} className="text-[10px] text-red-500 hover:underline">Remove</button>
                    )}
                  </div>
                  <button
                    onClick={() => setLibraryModalView('titleblocks')}
                    className="w-full py-2 mb-3 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 border border-blue-200 transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    ✨ Browse Master Title Block Library
                  </button>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(['All', ...TITLE_BLOCK_CATEGORIES] as const).map(c => (
                      <button key={c} onClick={() => setTbCat(c)}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-semibold transition ${tbCat === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{c}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1" style={{ maxHeight: 260 }}>
                    {TITLE_BLOCKS.filter(b => tbCat === 'All' || b.category === tbCat).map(b => {
                      const active = currentPage.titleBlockId === b.id
                      return (
                        <button key={b.id} onClick={() => setTitleBlock(b.id)}
                          className={`text-left rounded-lg p-2 border-2 transition overflow-hidden ${active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                          style={{ background: tokens.background, fontSize: 11 }}>
                          <TitleBlockView style={b}
                            p={{ primary: tokens.primary, accent: tokens.accent, bg: tokens.background, text: tokens.text, muted: tokens.muted }}
                            fonts={{ heading: tokens.headingFont, body: tokens.bodyFont }}
                            content={{ number: 'PROJECT 01', title: 'CULTURAL CENTER', subline: '2026' }} />
                          <div className="text-[8px] text-gray-400 mt-1 truncate">{b.name}</div>
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Applies to this page's title. Edit the title/subtitle text below.</p>
                </div>

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

            {/* CANVAS TAB — Free element add + selected element properties */}
            {rightTab === 'canvas' && (
              <div className="space-y-4">
                {/* Add free elements */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Add to Canvas</h4>
                  <p className="text-[10px] text-gray-400 mb-2">drag · corner resize · double-click text to edit</p>
                  <div className="grid grid-cols-3 gap-2">
                    {([['text', 'T', 'Text'], ['image', '🖼', 'Image'], ['rect', '▭', 'Box'], ['ellipse', '◯', 'Ellipse'], ['line', '—', 'Line'], ['graphic', '✦', 'Graphic']] as const).map(([k, icon, label]) => (
                      <button key={k} onClick={() => addFreeElement(k as FreeElement['kind'])}
                        className="flex flex-col items-center gap-1 p-2.5 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition">
                        <span className="text-lg leading-none">{icon}</span>
                        <span className="text-[10px] font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Automations & Layout</h4>
                  
                  <button onClick={detachLayoutToCanvas} className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold transition mb-2">
                    <span className="text-sm">🔓</span> Detach Layout to Canvas
                  </button>

                  <button onClick={magicShuffleLayout} className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border border-purple-200 text-purple-700 rounded-lg text-xs font-semibold transition">
                    <span className="text-sm">✨</span> Magic Layout Shuffle
                  </button>
                  <p className="text-[10px] text-gray-400 mt-1.5 leading-tight">Instantly snap images into perfect architectural grids, or detach the layout to freely edit it.</p>
                </div>

                {/* Selected element properties */}
                {selectedFreeEl ? (() => {
                  const sel = selectedFreeEl
                  const patchFree = (patch: Partial<FreeElement>) => {
                    if (!currentPage) return
                    const updated = (currentPage.freeElements || []).map(e => e.id === sel.id ? { ...e, ...patch } : e)
                    updatePage({ ...currentPage, freeElements: updated })
                    setSelectedFreeEl({ ...sel, ...patch })
                    markDirty()
                  }
                  const layerOp = (op: 'front' | 'back' | 'lock' | 'dup' | 'del') => {
                    if (!currentPage) return
                    const els = currentPage.freeElements || []
                    if (op === 'del') { updatePage({ ...currentPage, freeElements: els.filter(e => e.id !== sel.id) }); setSelectedFreeEl(null); markDirty(); return }
                    if (op === 'lock') { patchFree({ locked: !sel.locked }); return }
                    if (op === 'dup') { const clone = { ...sel, id: `fe-${Date.now().toString(36)}-dup`, x: sel.x + 3, y: sel.y + 3 }; updatePage({ ...currentPage, freeElements: [...els, clone] }); markDirty(); return }
                    const maxZ = Math.max(...els.map(e => e.z || 1))
                    const minZ = Math.min(...els.map(e => e.z || 1))
                    patchFree({ z: op === 'front' ? maxZ + 1 : Math.max(0, minZ - 1) })
                  }
                  return (
                    <div className="border-t pt-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-700 uppercase">{sel.kind} Properties</span>
                        <button onClick={() => setSelectedFreeEl(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                      </div>

                      {/* Object actions */}
                      <div className="flex flex-wrap gap-1.5">
                        <button onClick={() => layerOp('front')} className="px-2 py-1 text-[10px] border border-gray-200 rounded hover:bg-gray-50">⬆ Front</button>
                        <button onClick={() => layerOp('back')} className="px-2 py-1 text-[10px] border border-gray-200 rounded hover:bg-gray-50">⬇ Back</button>
                        <button onClick={() => layerOp('lock')} className="px-2 py-1 text-[10px] border border-gray-200 rounded hover:bg-gray-50">{sel.locked ? '🔒 Unlock' : '🔓 Lock'}</button>
                        <button onClick={() => layerOp('dup')} className="px-2 py-1 text-[10px] border border-gray-200 rounded hover:bg-gray-50">⧉ Dup</button>
                        <button onClick={() => layerOp('del')} className="px-2 py-1 text-[10px] border border-red-100 text-red-500 rounded hover:bg-red-50">🗑 Delete</button>
                      </div>

                      {/* Text properties */}
                      {sel.kind === 'text' && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] text-gray-400 uppercase block mb-0.5">Font</label>
                              <select value={sel.fontFamily || tokens.bodyFont} onChange={e => patchFree({ fontFamily: e.target.value })}
                                className="w-full border border-gray-200 rounded px-1.5 py-1 text-[10px]">
                                <option value={tokens.headingFont}>Heading</option>
                                <option value={tokens.bodyFont}>Body</option>
                                <option value="Inter">Inter</option>
                                <option value="Montserrat">Montserrat</option>
                                <option value="Playfair Display">Playfair</option>
                                <option value="Georgia">Georgia</option>
                                <option value="monospace">Monospace</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[9px] text-gray-400 uppercase block mb-0.5">Size (px)</label>
                              <input type="number" min="6" max="96" value={sel.fontSize || 16} onChange={e => patchFree({ fontSize: parseInt(e.target.value) || 16 })}
                                className="w-full border border-gray-200 rounded px-1.5 py-1 text-[10px]" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => patchFree({ bold: !sel.bold })}
                              className={`px-2 py-1 rounded text-[10px] font-bold border ${sel.bold ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-200 hover:bg-gray-50'}`}>B</button>
                            <div className="flex border border-gray-200 rounded overflow-hidden">
                              {(['left', 'center', 'right'] as const).map(a => (
                                <button key={a} onClick={() => patchFree({ align: a })}
                                  className={`px-2 py-1 text-[9px] ${sel.align === a || (!sel.align && a === 'left') ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}>{a[0].toUpperCase()}</button>
                              ))}
                            </div>
                            <input type="color" value={sel.color || '#000000'} onChange={e => patchFree({ color: e.target.value })} className="w-6 h-6 rounded cursor-pointer border-0" />
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[9px] text-gray-400">Line Height</span>
                              <input type="range" min="0.8" max="2.5" step="0.1" value={sel.lineHeight || 1.25} onChange={e => patchFree({ lineHeight: parseFloat(e.target.value) })} className="flex-1 h-1 accent-blue-500" />
                              <span className="text-[9px] w-7 text-right font-mono">{(sel.lineHeight || 1.25).toFixed(1)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[9px] text-gray-400">Opacity</span>
                              <input type="range" min="0.1" max="1" step="0.05" value={sel.opacity ?? 1} onChange={e => patchFree({ opacity: parseFloat(e.target.value) })} className="flex-1 h-1 accent-blue-500" />
                              <span className="text-[9px] w-7 text-right font-mono">{Math.round((sel.opacity ?? 1) * 100)}%</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Graphic DNA properties */}
                      {sel.kind === 'graphic' && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[9px] text-gray-400 uppercase block mb-1">Graphic Type</label>
                            <div className="grid grid-cols-3 gap-1">
                              {([
                                ['parametric-curve','Parametric'], ['contour','Topography'], ['voronoi','Voronoi'],
                                ['measurement','Dimension'], ['coordinates','Coordinates'], ['section-line','Section Line'],
                                ['zaha-flow','Zaha Flow'], ['wind-flow','Wind Flow'], ['movement-path','Movement'],
                                ['spline','Spline'], ['hexagon','Hexagon'], ['triangle-grid','Triangle'],
                                ['blueprint-grid','Blueprint'], ['cad-background','CAD Bg'], ['site-overlay','Site'],
                                ['section-marker','Sec. Marker'], ['arrow','Arrow'], ['frame-corner','Frame'],
                                ['construction-line','Construction'],
                              ] as const).map(([t, label]) => (
                                <button key={t} onClick={() => patchFree({ graphicType: t })}
                                  className={`py-1 px-1 rounded text-[8px] text-center border transition leading-tight ${sel.graphicType === t ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                                  title={label}>{label}</button>
                              ))}
                            </div>
                            <label className="mt-2 block border border-dashed border-gray-300 rounded text-center py-2 text-[9px] text-gray-500 hover:bg-gray-50 cursor-pointer">
                              + Upload Custom Graphic
                              <input type="file" accept="image/*,.svg" className="hidden" onChange={async e => {
                                if (e.target.files && e.target.files[0]) {
                                  const url = await uploadImage(e.target.files[0])
                                  patchFree({ kind: 'image', src: url, graphicType: 'custom' })
                                }
                              }} />
                            </label>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <label className="text-[9px] text-gray-400 uppercase">Color</label>
                              <input type="color" value={sel.color || tokens.accent} onChange={e => patchFree({ color: e.target.value })} className="w-6 h-6 rounded cursor-pointer border-0" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <label className="text-[9px] text-gray-400 uppercase">Stroke</label>
                              <input type="number" step="0.5" min="0.5" max="10" value={sel.strokeWidth || 1.5} onChange={e => patchFree({ strokeWidth: parseFloat(e.target.value) || 1.5 })}
                                className="w-12 border border-gray-200 rounded px-1 py-0.5 text-[10px]" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Shape / line properties */}
                      {(sel.kind === 'rect' || sel.kind === 'ellipse' || sel.kind === 'line') && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <label className="text-[9px] text-gray-400 uppercase">Fill</label>
                              <input type="color" value={sel.fill || '#eeeeee'} onChange={e => patchFree({ fill: e.target.value })} className="w-6 h-6 rounded cursor-pointer border-0" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <label className="text-[9px] text-gray-400 uppercase">Stroke</label>
                              <input type="color" value={sel.stroke || tokens.accent} onChange={e => patchFree({ stroke: e.target.value })} className="w-6 h-6 rounded cursor-pointer border-0" />
                              <input type="number" step="1" min="0" max="10" value={sel.strokeWidth || 0} onChange={e => patchFree({ strokeWidth: parseInt(e.target.value) || 0 })} className="w-10 border border-gray-200 rounded px-1 py-0.5 text-[10px]" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Universal Properties (Opacity & Replicate) */}
                      <div className="space-y-3 pt-3 border-t mt-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] text-gray-400">Opacity</span>
                          <input type="range" min="0.05" max="1" step="0.05" value={sel.opacity ?? 1} onChange={e => patchFree({ opacity: parseFloat(e.target.value) })} className="flex-1 h-1 accent-blue-500" />
                          <span className="text-[9px] w-7 text-right font-mono">{Math.round((sel.opacity ?? 1) * 100)}%</span>
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-400 uppercase block mb-1">Replicate To</label>
                          <div className="flex gap-1.5">
                            <button onClick={() => applyElementScopeFromPage('page', sel)} className="flex-1 py-1.5 text-[9px] border border-gray-200 rounded hover:bg-gray-50">This Page</button>
                            <button onClick={() => applyElementScopeFromPage('spread', sel)} className="flex-1 py-1.5 text-[9px] bg-blue-50 border border-blue-200 text-blue-700 rounded hover:bg-blue-100">Spread</button>
                            <button onClick={() => applyElementScopeFromPage('all', sel)} className="flex-1 py-1.5 text-[9px] bg-purple-50 border border-purple-200 text-purple-700 rounded hover:bg-purple-100">All Pages</button>
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-400 uppercase block mb-1">Span Full Spread (200% Width)</label>
                          <button onClick={() => patchFree({ w: 200, x: currentIdx % 2 === 0 ? -100 : 0 })} className="w-full py-1.5 text-[9px] bg-slate-800 text-white rounded hover:bg-slate-700 shadow-sm font-bold tracking-wider">
                            MAKE FULL SPREAD
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })() : (
                  <p className="text-[11px] text-gray-400 text-center py-4 border-t mt-2">Click any element on the canvas to edit its properties here.</p>
                )}
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
                  <select value={tokens.bodyFont} onChange={e => setTok({ bodyFont: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-3">
                    {BODY_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <label className="text-[10px] text-gray-400 uppercase block mb-1 flex justify-between">
                    Master Font Scale
                    <span>{Math.round((tokens.fontScale || 1) * 100)}%</span>
                  </label>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="1.5" 
                    step="0.05" 
                    value={tokens.fontScale || 1} 
                    onChange={e => setTok({ fontScale: parseFloat(e.target.value) })} 
                    className="w-full"
                  />
                </div>
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Image Filters</h4>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-2 leading-tight">Unify rendering and diagram styles globally.</p>
                  
                  {/* Filter Presets */}
                  <div className="overflow-x-auto pb-2 mb-2 scrollbar-thin flex gap-1.5">
                    {PRESET_FILTERS.map(pf => (
                      <button
                        key={pf.name}
                        onClick={() => applyFilterToPage(pf.filter)}
                        className="flex-shrink-0 w-16 flex flex-col items-center gap-1 group"
                      >
                        <div className="w-10 h-10 rounded-full border-2 border-gray-200 overflow-hidden group-hover:border-blue-400 transition" style={{ filter: pf.filter, background: 'url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=100&q=80) center/cover' }} />
                        <span className="text-[9px] font-semibold text-gray-600 text-center leading-tight">{pf.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Manual Sliders */}
                  <div className="space-y-2 mb-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase font-bold text-gray-500 w-12 text-right">Bright</span>
                      <input type="range" min="0" max="200" value={filterBrightness} onChange={e => setFilterBrightness(Number(e.target.value))} className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase font-bold text-gray-500 w-12 text-right">Contrast</span>
                      <input type="range" min="0" max="200" value={filterContrast} onChange={e => setFilterContrast(Number(e.target.value))} className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase font-bold text-gray-500 w-12 text-right">Saturate</span>
                      <input type="range" min="0" max="300" value={filterSaturation} onChange={e => setFilterSaturation(Number(e.target.value))} className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase font-bold text-gray-500 w-12 text-right">Sepia</span>
                      <input type="range" min="0" max="100" value={filterSepia} onChange={e => setFilterSepia(Number(e.target.value))} className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                  </div>

                  {/* Apply Actions */}
                  <div className="flex gap-1.5">
                    <button onClick={() => applyCustomFilter('page')} className="flex-1 px-2 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold hover:bg-blue-100">Apply to Page</button>
                    <button onClick={() => applyCustomFilter('project')} className="flex-1 px-2 py-1.5 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-700">Apply to Project</button>
                  </div>
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

      {/* Library Browser Modal */}
      {libraryModalView && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-auto shadow-2xl">
          <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10 shadow-sm">
            <h2 className="text-xl font-bold capitalize text-slate-800 tracking-tight flex items-center gap-2">
              <span className="text-2xl">📚</span>
              {libraryModalView === 'titleblocks' ? 'Master Title Blocks' : `${libraryModalView} Spreads`}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 font-medium hidden sm:inline-block">Select a design to instantly apply it to your current page.</span>
              <button onClick={() => setLibraryModalView(null)} className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-semibold text-sm transition shadow-md">Close Library</button>
            </div>
          </div>
          <div className="p-8 max-w-7xl mx-auto w-full">
            <LibraryBrowser
              view={libraryModalView}
              onUse={(spec: any) => {
                if (libraryModalView === 'titleblocks') {
                  setTitleBlock(spec.id)
                } else {
                  setLayout(spec.id)
                }
                setLibraryModalView(null)
              }}
            />
          </div>
        </div>
      )}

      {showSpreadManager && (
        <SpreadManager
          pages={pages}
          tokens={tokens}
          pageSize={publishingPortfolio.pageSize}
          onClose={() => setShowSpreadManager(false)}
          onReorder={(newPages) => { setPages(newPages); markDirty() }}
          onSelect={(idx) => setCurrentIdx(idx)}
          onDuplicate={(idx) => { const p = pages[idx]; if (p) { const clone = { ...p, id: `p-${Date.now().toString(36)}` }; setPages(prev => { const next = [...prev]; next.splice(idx + 1, 0, clone); return next }); markDirty() } }}
          onDelete={(idx) => deletePage(idx)}
        />
      )}
    </div>
  )
}
