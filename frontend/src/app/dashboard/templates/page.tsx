'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import Logo from '@/components/Logo'
import TemplateSpread from '@/components/templates/TemplateSpread'
import LibraryBrowser, { type LibraryView } from '@/components/templates/LibraryBrowser'
import MyTemplatesGrid from '@/components/templates/MyTemplatesGrid'
import SetupModal from '@/components/composer/SetupModal'
import { auth } from '@/lib/firebase'
import UpgradeModal from '@/components/modals/UpgradeModal'
import { apiClient } from '@/lib/api'

type LibTab = 'portfolios' | LibraryView | 'mytemplates'
const LIBRARY_TABS: Array<{ id: LibTab; label: string; icon: string }> = [
  { id: 'portfolios', label: 'Full Portfolios', icon: '📘' },
  { id: 'about', label: 'About & Resume Spreads', icon: '🧑‍🎨' },
  { id: 'project', label: 'Project Spreads', icon: '🏛️' },
  { id: 'titleblocks', label: 'Title Blocks', icon: '🏷️' },
  { id: 'mytemplates', label: 'My Templates', icon: '⭐' },
]

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')

const DEMO_TEMPLATES: Template[] = [
  { id: 'demo-minimal-1', name: 'Minimal Studio', description: 'Clean white space with generous margins. Perfect for residential and cultural projects where the work speaks for itself.', category: 'minimalist', colors: { primary: '#1A1A1A', secondary: '#888888', accent: '#9CA3AF', background: '#FFFFFF' }, fonts: { heading: 'Montserrat', body: 'Inter' }, page_count_range: '16-24', style_notes: 'Generous white space, single-weight typography, restrained palette.', source: 'downloaded' },
  { id: 'demo-editorial-1', name: 'Architectural Journal', description: 'Editorial serif layout inspired by architectural publications. Ideal for thesis and research-heavy portfolios.', category: 'editorial', colors: { primary: '#1F2937', secondary: '#6B7280', accent: '#A16207', background: '#FAF8F3' }, fonts: { heading: 'Playfair Display', body: 'Source Sans Pro' }, page_count_range: '24-40', style_notes: 'Editorial serif typography, warm paper background, structured grid.', source: 'downloaded' },
  { id: 'demo-competition-1', name: 'Competition Board', description: 'Bold, high-contrast graphics for competition submissions and urban-scale projects. Maximum visual impact.', category: 'competition', colors: { primary: '#1A1A1A', secondary: '#111111', accent: '#E11D48', background: '#FFFFFF' }, fonts: { heading: 'Oswald', body: 'Roboto' }, page_count_range: '16-24', style_notes: 'High contrast, bold typography, architectural red accent.', source: 'downloaded' },
  { id: 'demo-technical-1', name: 'Technical Drawing Set', description: 'Grid-based precision layout for technical projects, infrastructure, and engineering-focused portfolios.', category: 'technical', colors: { primary: '#1E3A8A', secondary: '#3B82F6', accent: '#2563EB', background: '#FFFFFF' }, fonts: { heading: 'Montserrat', body: 'Roboto' }, page_count_range: '24-40', style_notes: 'Blueprint-inspired palette, clean technical grids, engineering precision.', source: 'downloaded' },
  { id: 'demo-luxury-1', name: 'Dark Studio', description: 'Moody dark background with gold accents. Designed for luxury residential, hospitality, and high-end commercial work.', category: 'luxury', colors: { primary: '#FFFFFF', secondary: '#D4AF37', accent: '#D4AF37', background: '#0E0E10' }, fonts: { heading: 'Oswald', body: 'Inter' }, page_count_range: '20-30', style_notes: 'Premium dark mode with gold accents, sophisticated and moody.', source: 'downloaded', is_premium: true },
  { id: 'demo-student-1', name: 'Graduate Portfolio', description: 'Fresh, dynamic layout for undergraduate and graduate applications. Balanced mix of drawings and photography.', category: 'student', colors: { primary: '#111827', secondary: '#6B7280', accent: '#7C3AED', background: '#FFFFFF' }, fonts: { heading: 'Poppins', body: 'Inter' }, page_count_range: '16-24', style_notes: 'Contemporary purple accent, clear hierarchy, application-ready format.', source: 'downloaded' },
  { id: 'demo-parametric-1', name: 'Parametric Vision', description: 'Tech-forward dark layout for computational, parametric, and digital fabrication portfolios.', category: 'competition', colors: { primary: '#7DD3FC', secondary: '#38BDF8', accent: '#38BDF8', background: '#0B1020' }, fonts: { heading: 'Montserrat', body: 'Inter' }, page_count_range: '20-30', style_notes: 'Dark parametric palette, luminous cyan accents, tech-forward geometry.', source: 'downloaded', is_premium: true },
  { id: 'demo-thesis-1', name: 'Thesis Edition', description: 'Academic, sequential, serif-forward layout for thesis and dissertation portfolios with extended text.', category: 'student', colors: { primary: '#3F3F46', secondary: '#71717A', accent: '#7C2D12', background: '#FCFCFA' }, fonts: { heading: 'Cormorant Garamond', body: 'Georgia' }, page_count_range: '32-48', style_notes: 'Serif typeset, academic red accent, structured for long-form writing.', source: 'downloaded' },
]

interface Template {
  id: string
  name: string
  description: string
  category: string
  colors?: { primary: string; secondary: string; accent: string; background: string }
  fonts?: { heading: string; body: string }
  preview_image?: string
  style_notes?: string
  page_count_range?: string
  source?: string
  layouts?: any
  placeholders?: any
  is_premium?: boolean
}

interface TemplateListResponse {
  total: number
  templates: Template[]
}

interface Portfolio {
  id: string
  project_id: string
  variant_num: number
}

const CATEGORIES = [
  { id: 'minimalist', label: 'Minimalist', emoji: '⊟' },
  { id: 'editorial', label: 'Editorial', emoji: '📄' },
  { id: 'competition', label: 'Competition', emoji: '🏆' },
  { id: 'technical', label: 'Technical', emoji: '📐' },
  { id: 'luxury', label: 'Luxury', emoji: '✨' },
  { id: 'student', label: 'Student', emoji: '🎓' },
  { id: 'Cosmo Special', label: 'Cosmo Special', emoji: '★' },
]

interface FilterPreset {
  name: string
  categories: Set<string>
  pageCountRange: string | null
  source: string | null
}

export default function TemplateMarketplace() {
  const router = useRouter()
  const { isAuthenticated, token, user } = useAuthStore()
  const isAdmin = user?.email?.trim().toLowerCase() === 'boseraj001@gmail.com'
  const [templates, setTemplates] = useState<Template[]>([])
  const [libTab, setLibTab] = useState<LibTab>('portfolios')
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [pageCountRange, setPageCountRange] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState<string | null>(null)
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [applyingTo, setApplyingTo] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filterPresets, setFilterPresets] = useState<Map<string, FilterPreset>>(new Map())
  const [showCustomize, setShowCustomize] = useState(false)
  const [isPro, setIsPro] = useState(false)
  const [customColors, setCustomColors] = useState<Record<string, string>>({})
  const [customFonts, setCustomFonts] = useState<Record<string, string>>({})
  const [customizeName, setCustomizeName] = useState('')
  const [saveAsVariant, setSaveAsVariant] = useState(false)
  
  // Setup Flow wizard states
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(true)
  const [setupSettings, setSetupSettings] = useState<any>(null)
  const [upgradeModal, setUpgradeModal] = useState<{isOpen: boolean, title?: string, subtitle?: string}>({ isOpen: false })

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('template_favorites')
    if (saved) setFavorites(new Set(JSON.parse(saved)))
  }, [])

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('template_favorites', JSON.stringify(Array.from(favorites)))
  }, [favorites])

  // Fetch templates and isPro status
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/signin')
      return
    }
    fetchTemplates()
    fetchPortfolios()
    
    // Fetch is_pro status
    const fetchStatus = async () => {
      try {
        const savedToken = token || localStorage.getItem('auth_token')
        if (!savedToken) return
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${savedToken}` }
        })
        if (res.ok) {
          const data = await res.json()
          setIsPro(isAdmin || !!data.is_pro || !!data.is_bypass || data.plan_type === 'pro')
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchStatus()
  }, [isAuthenticated, isAdmin])

  // Load filter presets on mount
  useEffect(() => {
    const saved = localStorage.getItem('template_filter_presets')
    if (saved) {
      const presets = JSON.parse(saved)
      const restoredMap = new Map(
        Object.entries(presets).map(([key, value]: [string, any]) => [
          key,
          { ...value, categories: new Set(value.categories) }
        ])
      )
      setFilterPresets(restoredMap)
    }
  }, [])

  // Save filter presets to localStorage
  useEffect(() => {
    if (filterPresets.size > 0) {
      const obj = Object.fromEntries(
        Array.from(filterPresets.entries()).map(([key, preset]) => [
          key,
          { ...preset, categories: Array.from(preset.categories) }
        ])
      )
      localStorage.setItem('template_filter_presets', JSON.stringify(obj))
    }
  }, [filterPresets])

  // Filter templates with multiple criteria
  useEffect(() => {
    let filtered = templates

    // Cosmo Special templates are admin-only until they're polished for launch
    if (!isAdmin) {
      filtered = filtered.filter(t => t.category !== 'Cosmo Special')
    }

    // Category filter (multiple selection)
    if (selectedCategories.size > 0) {
      filtered = filtered.filter(t => selectedCategories.has(t.category))
    }

    // Page count range filter
    if (pageCountRange) {
      filtered = filtered.filter(t => {
        if (!t.page_count_range) return false
        if (pageCountRange === '16-24') return t.page_count_range === '16-24'
        if (pageCountRange === '20-30') return t.page_count_range === '20-30'
        if (pageCountRange === '24-40') return t.page_count_range === '24-40'
        if (pageCountRange === '32-48') return t.page_count_range === '32-48'
        if (pageCountRange === '40+') return parseInt(t.page_count_range.split('-')[1]) >= 40
        return true
      })
    }

    // Source filter
    if (sourceFilter) {
      filtered = filtered.filter(t => t.source === sourceFilter)
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      )
    }

    setFilteredTemplates(filtered)
  }, [searchQuery, selectedCategories, pageCountRange, sourceFilter, templates, isAdmin])

  const handleUseTemplate = async (template: Template) => {
    if (template.is_premium && !isPro) {
      setUpgradeModal({
        isOpen: true,
        title: "Premium portfolio style",
        subtitle: "Used by professional designers. Unlock this and more with CosmoFolio Pro."
      })
      return
    }
    
    try {
      // Get a guaranteed-fresh token. On a freshly loaded page the Firebase SDK may
      // not have rehydrated the session yet (auth.currentUser null) while the stored
      // token has already expired — wait briefly for it, then force-refresh.
      let currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null)
      for (let i = 0; i < 12 && !auth.currentUser; i++) {
        await new Promise(r => setTimeout(r, 200))
      }
      if (auth.currentUser) {
        currentToken = await auth.currentUser.getIdToken(true) // force refresh
        useAuthStore.getState().setToken(currentToken)
        apiClient.setToken(currentToken)
      }
      if (!currentToken) {
        alert('Your session has expired. Please sign in again.')
        router.push('/signin')
        return
      }

      const createReq = (tok: string) => fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: template.name,
          description: template.description || '',
          project_type: 'portfolio',
        }),
      })

      let res = await createReq(currentToken)

      // One retry with a forced token refresh if the token was rejected.
      if (res.status === 401 && auth.currentUser) {
        currentToken = await auth.currentUser.getIdToken(true)
        useAuthStore.getState().setToken(currentToken)
        apiClient.setToken(currentToken)
        res = await createReq(currentToken)
      }

      if (res.status === 401) {
        alert('Your session has expired. Please sign in again.')
        router.push('/signin')
        return
      }

      if (!res.ok) throw new Error('Failed to create project')
      const newProject = await res.json()
      
      // Pass setup wizard settings to the editor
      const orientationParam = setupSettings?.orientation || 'landscape'
      const sizeParam = setupSettings?.size || 'a4'
      const purposeParam = setupSettings?.purpose || 'university'
      // Use dynamic limits based on isPro status
      const maxPages = isAdmin ? 100 : isPro ? 30 : 6
      const maxProjects = isAdmin ? 100 : isPro ? 10 : 3
      const pagesParam = Math.min(maxPages, setupSettings?.pages || maxPages)
      const projectsParam = Math.min(maxProjects, setupSettings?.projects || maxProjects)

      // Redirect to editor with the new project and configuration query params
      router.push(`/dashboard/templates/${template.id}/editor?project=${newProject.id}&orientation=${orientationParam}&size=${sizeParam}&purpose=${purposeParam}&pages=${pagesParam}&projects=${projectsParam}`)
    } catch (e) {
      alert('Failed to create portfolio from template')
      console.error(e)
    }
  }

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/templates/portfolios?limit=100`, {
        headers: { 'Authorization': `Bearer ${token || localStorage.getItem('auth_token')}` }
      })
      if (res.ok) {
        const data: TemplateListResponse = await res.json()
        setTemplates(data.templates?.length ? data.templates : DEMO_TEMPLATES)
      } else {
        setTemplates(DEMO_TEMPLATES)
      }
    } catch (e) {
      console.error('Error fetching templates:', e)
      setTemplates(DEMO_TEMPLATES)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPortfolios = async () => {
    try {
      const savedToken = token || localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/api/portfolios`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setPortfolios(data.portfolios || [])
      }
    } catch (e) {
      console.error('Error fetching portfolios:', e)
    }
  }

  const toggleFavorite = (templateId: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(templateId)) {
      newFavorites.delete(templateId)
    } else {
      newFavorites.add(templateId)
    }
    setFavorites(newFavorites)
  }

  const toggleCategory = (categoryId: string) => {
    const newCategories = new Set(selectedCategories)
    if (newCategories.has(categoryId)) {
      newCategories.delete(categoryId)
    } else {
      newCategories.add(categoryId)
    }
    setSelectedCategories(newCategories)
  }

  const clearAllFilters = () => {
    setSelectedCategories(new Set())
    setPageCountRange(null)
    setSourceFilter(null)
    setSearchQuery('')
  }

  const saveFilterPreset = (presetName: string) => {
    const preset: FilterPreset = {
      name: presetName,
      categories: new Set(selectedCategories),
      pageCountRange,
      source: sourceFilter,
    }
    const newPresets = new Map(filterPresets)
    newPresets.set(presetName, preset)
    setFilterPresets(newPresets)
  }

  const loadFilterPreset = (presetName: string) => {
    const preset = filterPresets.get(presetName)
    if (preset) {
      setSelectedCategories(new Set(preset.categories))
      setPageCountRange(preset.pageCountRange)
      setSourceFilter(preset.source)
    }
  }

  const deleteFilterPreset = (presetName: string) => {
    const newPresets = new Map(filterPresets)
    newPresets.delete(presetName)
    setFilterPresets(newPresets)
  }

  const hasActiveFilters = selectedCategories.size > 0 || pageCountRange || sourceFilter || searchQuery.trim() !== ''

  const applyTemplateToPortfolio = async (templateId: string, portfolioId: string) => {
    setApplying(true)
    try {
      const savedToken = token || localStorage.getItem('auth_token')
      const res = await fetch(
        `${API_URL}/api/templates/portfolios/${templateId}/apply/${portfolioId}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${savedToken}` }
        }
      )
      if (res.ok) {
        alert('Template applied successfully!')
        setApplyingTo(null)
        setShowPreview(false)
      } else {
        alert('Failed to apply template')
      }
    } catch (e) {
      console.error('Error applying template:', e)
      alert('Error applying template')
    } finally {
      setApplying(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary dark:bg-dark-bg-primary">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-border-light border-t-primary rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-text-secondary dark:text-dark-text-secondary">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary dark:bg-dark-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface-base dark:bg-dark-surface-base border-b border-border-subtle dark:border-dark-border-subtle shadow-elevation-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors text-sm">
              ← Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <Logo size="md" variant="gold" />
              <h1 className="text-h4 font-semibold text-text-primary dark:text-dark-text-primary">Portfolio Using Preset Templates</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <h2 className="text-h2 text-text-primary dark:text-dark-text-primary mb-4">Portfolio Using Preset Templates</h2>
          <p className="text-h4 text-text-secondary dark:text-dark-text-secondary font-normal mb-8">
            Real, finished architecture portfolios — pick one, swap in your projects, and export. Every preview below shows a complete book, not an empty layout.
          </p>

          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search templates by name or description..."
            className="input-field w-full max-w-md px-4 py-2 border border-border-light rounded-lg"
          />
        </div>

        {/* Library structure nav */}
        <div className="mb-10 flex flex-wrap gap-2 border-b border-border-light pb-4">
          {LIBRARY_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setLibTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                libTab === t.id
                  ? 'bg-primary text-white shadow-elevation-1'
                  : 'bg-surface-elevated dark:bg-dark-surface-overlay text-text-secondary dark:text-dark-text-secondary hover:text-text-primary'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {libTab === 'mytemplates' && <MyTemplatesGrid />}
        {libTab !== 'portfolios' && libTab !== 'mytemplates' && <LibraryBrowser view={libTab} />}

        {libTab === 'portfolios' && (<>
        {/* Filter Controls */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-body-sm font-semibold text-text-primary dark:text-dark-text-primary">Filters</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="text-xs px-3 py-1 bg-surface-elevated dark:bg-dark-surface-overlay rounded hover:bg-border-light transition"
              >
                {showAdvancedFilters ? '▼' : '▶'} Advanced Filters
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs px-3 py-1 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 rounded hover:bg-red-200 transition"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Category Filter (Always Visible) */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-stone-light mb-2">Categories</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategories(new Set())}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCategories.size === 0
                    ? 'bg-primary text-white'
                    : 'bg-surface-elevated dark:bg-dark-surface-overlay text-text-secondary dark:text-dark-text-secondary hover:text-text-primary'
                }`}>
                All ({templates.length})
              </button>
              {CATEGORIES.map(cat => {
                const count = templates.filter(t => t.category === cat.id).length
                const isSelected = selectedCategories.has(cat.id)
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-primary text-white'
                        : 'bg-surface-elevated dark:bg-dark-surface-overlay text-text-secondary dark:text-dark-text-secondary hover:text-text-primary'
                    }`}>
                    {cat.emoji} {cat.label} {count > 0 && `(${count})`}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Advanced Filters (Expandable) */}
          {showAdvancedFilters && (
            <div className="bg-surface-elevated dark:bg-dark-surface-overlay p-4 rounded-lg space-y-4">
              {/* Page Count Range */}
              <div>
                <p className="text-xs font-semibold text-stone-light mb-2">Page Count Range</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'All', value: null },
                    { label: '16-24', value: '16-24' },
                    { label: '20-30', value: '20-30' },
                    { label: '24-40', value: '24-40' },
                    { label: '32-48', value: '32-48' },
                    { label: '40+', value: '40+' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setPageCountRange(opt.value)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        pageCountRange === opt.value
                          ? 'bg-primary text-white'
                          : 'bg-white dark:bg-dark-bg-primary text-text-secondary hover:text-text-primary border border-border-light'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Filter */}
              <div>
                <p className="text-xs font-semibold text-stone-light mb-2">Template Source</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'All', value: null },
                    { label: 'Downloaded', value: 'downloaded' },
                    { label: 'AI-Generated', value: 'ai-generated' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setSourceFilter(opt.value)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        sourceFilter === opt.value
                          ? 'bg-primary text-white'
                          : 'bg-white dark:bg-dark-bg-primary text-text-secondary hover:text-text-primary border border-border-light'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Presets */}
              {filterPresets.size > 0 && (
                <div>
                  <p className="text-xs font-semibold text-stone-light mb-2">Saved Presets</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(filterPresets.keys()).map(name => (
                      <div key={name} className="flex items-center gap-1 bg-white dark:bg-dark-bg-primary border border-border-light rounded px-2 py-1">
                        <button
                          onClick={() => loadFilterPreset(name)}
                          className="text-xs font-medium text-primary hover:text-primary-dark transition"
                        >
                          {name}
                        </button>
                        <button
                          onClick={() => deleteFilterPreset(name)}
                          className="text-xs text-stone-light hover:text-red-500 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <div key={template.id} className="card overflow-hidden hover:shadow-elevation-3 transition-all duration-200 group flex flex-col">
              {/* Visual Mockup Thumbnail */}
              <div className="h-48 overflow-hidden group-hover:scale-[1.02] transition-transform duration-300 border-b border-border-light">
                <TemplateSpread template={template} />
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-h4 text-text-primary dark:text-dark-text-primary font-semibold flex-1 flex items-center gap-2">
                    {template.name}
                    {template.is_premium && (
                      <span className="bg-accent-gold/10 text-accent-gold text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                        ⭐ Pro
                      </span>
                    )}
                  </h3>
                  <button
                    onClick={() => toggleFavorite(template.id)}
                    className="text-xl ml-2 flex-shrink-0 transition-transform hover:scale-125"
                  >
                    {favorites.has(template.id) ? '❤️' : '🤍'}
                  </button>
                </div>

                <p className="text-body-sm text-text-secondary dark:text-dark-text-secondary mb-4 line-clamp-2">
                  {template.description}
                </p>

                {/* Color Preview */}
                {template.colors && (
                  <div className="flex gap-1 mb-4">
                    {[template.colors.primary, template.colors.secondary, template.colors.accent].map((color, idx) => (
                      <div key={idx} className="w-8 h-8 rounded border border-border-light" style={{ background: color }} title={color} />
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => { setSelectedTemplate(template); setShowPreview(true) }}
                    className="flex-1 px-3 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/10 transition">
                    Preview
                  </button>
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1 bg-primary text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition">
                    Use Template
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4 opacity-20">📋</div>
            <h3 className="text-h3 text-text-primary dark:text-dark-text-primary mb-2">No templates found</h3>
            <p className="text-body text-text-secondary dark:text-dark-text-secondary">
              Try adjusting your search or filters
            </p>
          </div>
        )}
        </>)}
      </main>

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white dark:bg-dark-surface-base rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-dark-surface-base border-b border-border-light p-6 flex items-center justify-between">
              <h2 className="text-h3 font-bold text-text-primary dark:text-dark-text-primary">{selectedTemplate.name}</h2>
              <button onClick={() => setShowPreview(false)} className="text-2xl text-text-secondary hover:text-text-primary">✕</button>
            </div>
            <div className="p-6 space-y-6">
              <div className="h-64 rounded-lg overflow-hidden border border-border-light">
                <TemplateSpread template={selectedTemplate} />
              </div>
              {selectedTemplate.preview_image && selectedTemplate.preview_image.startsWith('http') && (
                <img
                  src={selectedTemplate.preview_image}
                  alt={selectedTemplate.name}
                  className="w-full rounded-lg border border-border-light object-cover max-h-48"
                />
              )}
              <p className="text-body text-text-secondary dark:text-dark-text-secondary">{selectedTemplate.description}</p>
              {selectedTemplate.style_notes && (
                <div>
                  <h4 className="font-semibold text-text-primary dark:text-dark-text-primary mb-2">Style Notes</h4>
                  <p className="text-body text-text-secondary dark:text-dark-text-secondary">{selectedTemplate.style_notes}</p>
                </div>
              )}
              {selectedTemplate.colors && (
                <div>
                  <h4 className="font-semibold text-text-primary dark:text-dark-text-primary mb-3">Color Palette</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(selectedTemplate.colors).map(([key, color]) => (
                      <div key={key} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded border border-border-light" style={{ background: color as string }} />
                        <span className="text-sm capitalize text-text-secondary dark:text-dark-text-secondary">{key}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-6 border-t border-border-light flex-wrap">
                <button
                  onClick={() => { setShowPreview(false); handleUseTemplate(selectedTemplate) }}
                  className="flex-1 bg-primary text-white px-4 py-3 rounded-lg font-semibold hover:bg-primary-dark transition">
                  ✏️ Edit This Template
                </button>
                <button
                  onClick={() => { setShowCustomize(true) }}
                  className="flex-1 border-2 border-[#D4AF37] text-[#9C7416] px-4 py-3 rounded-lg font-semibold hover:bg-[#FBE7A1]/30 transition">
                  🎨 Customize
                </button>
                {portfolios.length > 0 && (
                  <button
                    onClick={() => { setShowPreview(false); setApplyingTo('existing') }}
                    className="flex-1 border border-primary text-primary px-4 py-3 rounded-lg font-semibold hover:bg-primary/10 transition">
                    Apply to Existing
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apply to Existing Portfolio Modal */}
      {applyingTo === 'existing' && selectedTemplate && portfolios.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setApplyingTo(null)}>
          <div className="bg-white dark:bg-dark-surface-base rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-border-light">
              <h2 className="text-h3 font-bold text-text-primary dark:text-dark-text-primary">Apply to Portfolio</h2>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-1">Select a portfolio to apply this template to</p>
            </div>
            <div className="p-6 space-y-2 max-h-96 overflow-y-auto">
              {portfolios.map(portfolio => (
                <button
                  key={portfolio.id}
                  onClick={() => applyTemplateToPortfolio(selectedTemplate.id, portfolio.id)}
                  disabled={applying}
                  className="w-full text-left p-4 border border-border-light rounded-lg hover:bg-bg-subtle dark:hover:bg-dark-surface-overlay transition disabled:opacity-50"
                >
                  <div className="font-medium text-text-primary dark:text-dark-text-primary">Portfolio #{portfolio.variant_num}</div>
                  <div className="text-sm text-text-secondary dark:text-dark-text-secondary">Project ID: {portfolio.project_id.slice(0, 8)}...</div>
                </button>
              ))}
            </div>
            <div className="p-6 border-t border-border-light flex gap-3">
              <button onClick={() => setApplyingTo(null)} className="flex-1 px-4 py-2 border border-border-light rounded-lg text-sm font-medium hover:bg-bg-subtle">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Customization Modal */}
      {showCustomize && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowCustomize(false)}>
          <div className="bg-white dark:bg-dark-surface-base rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 p-6 border-b border-border-light bg-white dark:bg-dark-surface-base">
              <h2 className="text-h3 font-bold text-text-primary dark:text-dark-text-primary">Customize Template</h2>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-1">{selectedTemplate.name}</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Color Customization */}
              <div>
                <h3 className="text-h4 font-semibold text-text-primary dark:text-dark-text-primary mb-4">Colors</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedTemplate.colors && Object.entries(selectedTemplate.colors).map(([key, originalColor]) => (
                    <div key={key} className="space-y-2">
                      <label className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary capitalize">
                        {key}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={customColors[key] || originalColor || '#000000'}
                          onChange={(e) => setCustomColors({ ...customColors, [key]: e.target.value })}
                          className="w-12 h-10 rounded cursor-pointer border border-border-light"
                        />
                        <input
                          type="text"
                          value={customColors[key] || originalColor || ''}
                          onChange={(e) => setCustomColors({ ...customColors, [key]: e.target.value })}
                          placeholder="#000000"
                          className="flex-1 px-3 py-2 border border-border-light rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Font Customization */}
              <div>
                <h3 className="text-h4 font-semibold text-text-primary dark:text-dark-text-primary mb-4">Typography</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'heading' as const, label: 'Heading Font', options: ['Montserrat', 'Playfair Display', 'Roboto', 'Inter', 'Poppins', 'Georgia', 'Lora'] },
                    { key: 'body' as const, label: 'Body Font', options: ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Source Sans Pro', 'Dosis', 'Raleway'] },
                  ].map(({ key, label, options }) => (
                    <div key={key} className="space-y-2">
                      <label className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                        {label}
                      </label>
                      <select
                        value={customFonts[key] || selectedTemplate.fonts?.[key] || ''}
                        onChange={(e) => setCustomFonts({ ...customFonts, [key]: e.target.value })}
                        className="w-full px-3 py-2 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-dark-surface-overlay"
                      >
                        <option value="">Select a font</option>
                        {options.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save as Variant */}
              <div className="flex items-center gap-3 p-4 bg-bg-subtle dark:bg-dark-surface-overlay rounded-lg">
                <input
                  type="checkbox"
                  id="saveVariant"
                  checked={saveAsVariant}
                  onChange={(e) => setSaveAsVariant(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <label htmlFor="saveVariant" className="flex-1 cursor-pointer">
                  <div className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Save as Variant</div>
                  <div className="text-xs text-text-secondary dark:text-dark-text-secondary">Save this customization for future use</div>
                </label>
              </div>

              {/* Variant Name */}
              {saveAsVariant && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">Variant Name</label>
                  <input
                    type="text"
                    value={customizeName}
                    onChange={(e) => setCustomizeName(e.target.value)}
                    placeholder="e.g., Modern Blue Variant"
                    className="w-full px-3 py-2 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              {/* Live Preview */}
              <div className="p-4 bg-bg-subtle dark:bg-dark-surface-overlay rounded-lg border border-border-light">
                <h4 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-4">Preview</h4>
                <div className="space-y-3">
                  <div>
                    <h1
                      style={{
                        fontFamily: customFonts.heading || selectedTemplate.fonts?.heading || 'Montserrat',
                        color: customColors.primary || selectedTemplate.colors?.primary || '#000'
                      }}
                      className="text-2xl font-bold"
                    >
                      Preview Heading
                    </h1>
                  </div>
                  <p
                    style={{
                      fontFamily: customFonts.body || selectedTemplate.fonts?.body || 'Inter',
                      color: (customColors as any).text || (selectedTemplate.colors as any)?.text || '#333'
                    }}
                    className="text-sm leading-relaxed"
                  >
                    This is how your portfolio will look with the customized template. Colors and fonts update in real-time.
                  </p>
                  <div className="flex gap-2 pt-2">
                    {Object.entries(customColors).map(([key, color]) => (
                      <div
                        key={key}
                        className="w-12 h-12 rounded border border-border-light"
                        style={{ background: color || (selectedTemplate.colors as any)?.[key] || '#ccc' }}
                        title={key}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 p-6 border-t border-border-light bg-white dark:bg-dark-surface-base flex gap-3">
              <button
                onClick={() => setShowCustomize(false)}
                className="flex-1 px-4 py-2 border border-border-light rounded-lg text-sm font-medium hover:bg-bg-subtle dark:hover:bg-dark-surface-overlay transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    let savedToken = token || localStorage.getItem('auth_token')
                    if (!savedToken) {
                      alert('Please sign in to create a portfolio')
                      router.push('/signin')
                      return
                    }

                    if (auth.currentUser) {
                      savedToken = await auth.currentUser.getIdToken(true)
                      useAuthStore.getState().setToken(savedToken)
                    }

                    // Step 1: Create a new project
                    const projectRes = await fetch(`${API_URL}/api/projects`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${savedToken}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        title: customizeName || `${selectedTemplate.name} Portfolio`,
                        project_type: 'portfolio',
                        description: `Created from template: ${selectedTemplate.name}`
                      }),
                    });

                    if (!projectRes.ok) {
                      const err = await projectRes.json().catch(() => ({}))
                      alert(`Failed to create project: ${err.detail || projectRes.statusText}`)
                      return
                    }

                    const project = await projectRes.json();
                    const projectId = project.id;

                    // Step 2: Save template customization to localStorage for the project
                    localStorage.setItem(`template_${projectId}`, JSON.stringify({
                      template_id: selectedTemplate.id,
                      template_name: selectedTemplate.name,
                      colors: { ...selectedTemplate.colors, ...customColors },
                      fonts: { ...selectedTemplate.fonts, ...customFonts },
                      variant_name: saveAsVariant ? customizeName : null,
                    }));

                    alert(`✅ Portfolio "${customizeName || selectedTemplate.name}" created!`);
                    setShowCustomize(false);
                    // Reset state
                    setCustomColors({});
                    setCustomFonts({});
                    setCustomizeName('');
                    setSaveAsVariant(false);

                    // Step 3: Navigate to the new project
                    router.push(`/dashboard/templates/${selectedTemplate.id}/editor?project=${projectId}`);
                  } catch (error) {
                    console.error('Error creating portfolio:', error);
                    alert('Failed to create portfolio. Please try again.');
                  }
                }}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50"
              >
                Create Portfolio
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Portfolio Setup Modal */}
      <SetupModal
        isOpen={isSetupModalOpen}
        isPro={isPro}
        isAdmin={isAdmin}
        onClose={() => setIsSetupModalOpen(false)}
        onComplete={(settings) => {
          setSetupSettings(settings)
          setIsSetupModalOpen(false)
        }}
      />
      
      <UpgradeModal 
        isOpen={upgradeModal.isOpen} 
        onClose={() => setUpgradeModal({ isOpen: false })}
        title={upgradeModal.title}
        subtitle={upgradeModal.subtitle}
      />
    </div>
  )
}
