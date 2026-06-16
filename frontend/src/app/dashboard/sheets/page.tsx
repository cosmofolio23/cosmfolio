'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import Logo from '@/components/Logo'
import TemplateMockup from '@/components/templates/TemplateMockup'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cosmfolio-backend.onrender.com'

interface SheetTemplate {
  id: string
  name: string
  description: string
  category?: string
  sheet_type?: string
  colors?: { primary?: string; accent?: string; background?: string; text?: string }
  fonts?: { heading?: string; body?: string }
  preview_image?: string
  style_notes?: string
  format?: string
  aspect_ratio?: string
  source?: string
}

interface TemplateListResponse {
  total: number
  templates: SheetTemplate[]
}

const CATEGORIES = [
  { id: 'all', label: 'All Sheets', emoji: '📋' },
  { id: 'competition', label: 'Competition', emoji: '🏆' },
  { id: 'pitch', label: 'Pitch', emoji: '🎯' },
  { id: 'presentation', label: 'Presentation', emoji: '🎨' },
  { id: 'concept', label: 'Concept', emoji: '💡' },
  { id: 'technical', label: 'Technical', emoji: '📐' },
  { id: 'analysis', label: 'Analysis', emoji: '🔍' },
  { id: 'masterplan', label: 'Masterplan', emoji: '🗺️' },
]

export default function SheetComposer() {
  const router = useRouter()
  const { isAuthenticated, token } = useAuthStore()
  const [templates, setTemplates] = useState<SheetTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<SheetTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTemplate, setSelectedTemplate] = useState<SheetTemplate | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [creatingSheet, setCreatingSheet] = useState(false)
  const [sheetTitle, setSheetTitle] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/signin')
      return
    }
    fetchTemplates()
  }, [isAuthenticated])

  useEffect(() => {
    let filtered = templates
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t =>
        (t.category && t.category.toLowerCase().includes(selectedCategory.toLowerCase())) ||
        (t.sheet_type && t.sheet_type.toLowerCase().includes(selectedCategory.toLowerCase()))
      )
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      )
    }
    setFilteredTemplates(filtered)
  }, [searchQuery, selectedCategory, templates])

  const fetchTemplates = async () => {
    try {
      const savedToken = token || localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/api/templates/sheets?limit=500`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      if (res.ok) {
        const data: TemplateListResponse = await res.json()
        setTemplates(data.templates || [])
      } else {
        console.error('Failed to fetch sheet templates')
        setTemplates([])
      }
    } catch (e) {
      console.error('Error:', e)
      setTemplates([])
    } finally {
      setIsLoading(false)
    }
  }

  const createSheetFromTemplate = async (template: SheetTemplate) => {
    if (!sheetTitle.trim()) {
      alert('Please enter a sheet title')
      return
    }
    setCreatingSheet(true)
    try {
      const savedToken = token || localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${savedToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: sheetTitle,
          project_type: 'sheet',
          template_id: template.id
        })
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/dashboard/project/${data.id}/sheet`)
      } else {
        alert('Failed to create sheet')
      }
    } catch (e) {
      console.error('Error:', e)
      alert('Error creating sheet')
    } finally {
      setCreatingSheet(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary dark:bg-dark-bg-primary">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-border-light border-t-primary rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-text-secondary dark:text-dark-text-secondary">Loading sheet templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary dark:bg-dark-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-dark-surface-base border-b border-border-light shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-text-secondary dark:text-dark-text-secondary hover:text-text-primary text-sm">
              ← Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <Logo size="md" variant="gold" />
              <h1 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">Sheet Composer</h1>
            </div>
          </div>
          <Link href="/dashboard/templates" className="text-sm text-primary hover:text-primary-dark transition">
            View Portfolio Templates →
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-text-primary dark:text-dark-text-primary mb-3">
            Presentation Sheet Templates
          </h2>
          <p className="text-lg text-text-secondary dark:text-dark-text-secondary mb-6">
            Browse {templates.length}+ professional sheet templates for client pitches, competitions, and presentations.
          </p>

          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search sheet templates..."
            className="w-full max-w-md px-4 py-3 border border-border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
          />
        </div>

        {/* Categories */}
        <div className="mb-12">
          <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-3">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white dark:bg-dark-bg-primary text-text-secondary hover:bg-gray-50 border border-border-light'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-sm text-text-secondary dark:text-dark-text-secondary">
          Showing {filteredTemplates.length} of {templates.length} sheet templates
        </div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="bg-white dark:bg-dark-surface-base rounded-2xl shadow-sm border border-border-light overflow-hidden hover:shadow-xl transition-all duration-200 group"
            >
              {/* Visual Mockup Thumbnail */}
              <div className="h-48 relative overflow-hidden border-b border-border-light group-hover:scale-[1.02] transition-transform duration-300">
                <TemplateMockup
                  colors={template.colors as any}
                  fonts={template.fonts as any}
                  name={template.name}
                  variant="sheet"
                />
                {template.format && (
                  <span className="absolute top-3 right-3 bg-white/90 dark:bg-black/80 text-xs font-semibold px-2 py-1 rounded z-10">
                    {template.format}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary mb-2 line-clamp-1">
                  {template.name}
                </h3>
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-4 line-clamp-2 h-10">
                  {template.description}
                </p>

                {/* Color Preview */}
                {template.colors && (
                  <div className="flex gap-1 mb-4">
                    {[template.colors.primary, template.colors.accent, template.colors.background, template.colors.text]
                      .filter(Boolean)
                      .map((color, idx) => (
                        <div
                          key={idx}
                          className="w-6 h-6 rounded border border-border-light"
                          style={{ background: color }}
                          title={color}
                        />
                      ))}
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center gap-2 mb-4 text-xs text-text-secondary dark:text-dark-text-secondary">
                  {template.category && (
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {template.category}
                    </span>
                  )}
                  {template.aspect_ratio && (
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {template.aspect_ratio}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelectedTemplate(template); setShowPreview(true) }}
                    className="flex-1 px-3 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/10 transition"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard/templates/${template.id}/editor`)}
                    className="flex-1 bg-primary text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition"
                  >
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
            <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary mb-2">No sheet templates found</h3>
            <p className="text-text-secondary dark:text-dark-text-secondary">Try adjusting your search or category filter</p>
          </div>
        )}
      </main>

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white dark:bg-dark-surface-base rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-dark-surface-base border-b border-border-light p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">
                {selectedTemplate.name}
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-2xl text-text-secondary hover:text-text-primary"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="h-64 rounded-lg overflow-hidden border border-border-light">
                <TemplateMockup
                  colors={selectedTemplate.colors as any}
                  fonts={selectedTemplate.fonts as any}
                  name={selectedTemplate.name}
                  variant="sheet"
                />
              </div>
              <p className="text-text-secondary dark:text-dark-text-secondary">{selectedTemplate.description}</p>
              {selectedTemplate.style_notes && (
                <div>
                  <h4 className="font-semibold text-text-primary mb-2">Style Notes</h4>
                  <p className="text-text-secondary">{selectedTemplate.style_notes}</p>
                </div>
              )}
              <div className="flex gap-3 pt-4 border-t border-border-light">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 px-4 py-3 border border-border-light text-text-primary rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => router.push(`/dashboard/templates/${selectedTemplate.id}/editor`)}
                  className="flex-1 bg-primary text-white px-4 py-3 rounded-lg font-medium hover:bg-primary-dark transition"
                >
                  ✏️ Edit This Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Sheet Modal */}
      {selectedTemplate && !showPreview && sheetTitle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-dark-surface-base rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-4">
              Create New Sheet
            </h2>
            <p className="text-text-secondary mb-4">
              Using template: <strong>{selectedTemplate.name}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Sheet Title</label>
                <input
                  type="text"
                  value={sheetTitle}
                  onChange={e => setSheetTitle(e.target.value)}
                  placeholder="e.g., Urban Park Proposal"
                  className="w-full px-4 py-3 border border-border-light rounded-lg focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setSelectedTemplate(null); setSheetTitle('') }}
                  className="flex-1 px-4 py-3 border border-border-light text-text-primary rounded-lg font-medium hover:bg-gray-50 transition"
                  disabled={creatingSheet}
                >
                  Cancel
                </button>
                <button
                  onClick={() => createSheetFromTemplate(selectedTemplate)}
                  disabled={creatingSheet || !sheetTitle.trim()}
                  className="flex-1 bg-primary text-white px-4 py-3 rounded-lg font-medium hover:bg-primary-dark transition disabled:opacity-50"
                >
                  {creatingSheet ? 'Creating...' : 'Create Sheet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
