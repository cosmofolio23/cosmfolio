'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import Logo from '@/components/Logo'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
]

interface FilterPreset {
  name: string
  categories: Set<string>
  pageCountRange: string | null
  source: string | null
}

export default function TemplateMarketplace() {
  const router = useRouter()
  const { isAuthenticated, token } = useAuthStore()
  const [templates, setTemplates] = useState<Template[]>([])
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

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('template_favorites')
    if (saved) setFavorites(new Set(JSON.parse(saved)))
  }, [])

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('template_favorites', JSON.stringify(Array.from(favorites)))
  }, [favorites])

  // Fetch templates
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/signin')
      return
    }
    fetchTemplates()
    fetchPortfolios()
  }, [isAuthenticated])

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
  }, [searchQuery, selectedCategories, pageCountRange, sourceFilter, templates])

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/templates/portfolios?limit=100`, {
        headers: { 'Authorization': `Bearer ${token || localStorage.getItem('auth_token')}` }
      })
      if (res.ok) {
        const data: TemplateListResponse = await res.json()
        setTemplates(data.templates)
      } else {
        console.error('Failed to fetch templates')
        setTemplates([])
      }
    } catch (e) {
      console.error('Error fetching templates:', e)
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
              <h1 className="text-h4 font-semibold text-text-primary dark:text-dark-text-primary">Template Gallery</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <h2 className="text-h2 text-text-primary dark:text-dark-text-primary mb-4">Professional Design Templates</h2>
          <p className="text-h4 text-text-secondary dark:text-dark-text-secondary font-normal mb-8">
            Browse 100+ curated architecture portfolio templates. Apply to new portfolios or existing projects.
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
              {/* Thumbnail */}
              <div className="h-48 bg-gradient-to-br from-accent-primary to-accent-light dark:from-dark-surface-elevated dark:to-dark-surface-overlay flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                {template.preview_image || '🏗️'}
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-h4 text-text-primary dark:text-dark-text-primary font-semibold flex-1">
                    {template.name}
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
                    onClick={() => { setSelectedTemplate(template); setApplyingTo('new') }}
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
              <div className="h-64 bg-gradient-to-br from-accent-primary to-accent-light rounded-lg flex items-center justify-center text-8xl">
                {selectedTemplate.preview_image || '🏗️'}
              </div>
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
              <div className="flex gap-3 pt-6 border-t border-border-light">
                <button
                  onClick={() => { setShowPreview(false); setApplyingTo('new') }}
                  className="flex-1 bg-primary text-white px-4 py-3 rounded-lg font-semibold hover:bg-primary-dark transition">
                  Use This Template
                </button>
                {portfolios.length > 0 && (
                  <button
                    onClick={() => { setShowPreview(false); setApplyingTo('existing') }}
                    className="flex-1 border border-primary text-primary px-4 py-3 rounded-lg font-semibold hover:bg-primary/10 transition">
                    Apply to Portfolio
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
    </div>
  )
}
