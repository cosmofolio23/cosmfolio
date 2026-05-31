'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import Logo from '@/components/Logo'

interface Template {
  id: string
  name: string
  description: string
  category: 'student' | 'thesis' | 'competition' | 'studio' | 'interior' | 'landscape' | 'urban'
  rating: number
  reviews: number
  price: 'free' | 'premium'
  thumbnail: string
  preview: string
}

const TEMPLATES: Template[] = [
  {
    id: 'minimal-student',
    name: 'Minimal Student',
    description: 'Clean, minimal design for architecture students. Perfect for portfolios and thesis projects.',
    category: 'student',
    rating: 4.8,
    reviews: 342,
    price: 'free',
    thumbnail: '🎓',
    preview: 'minimal-light-bg-with-typography-focus',
  },
  {
    id: 'competition-board',
    name: 'Competition Board',
    description: 'Professional competition presentation format. Includes rigid grid structure and technical layouts.',
    category: 'competition',
    rating: 4.9,
    reviews: 218,
    price: 'premium',
    thumbnail: '🏆',
    preview: 'dark-background-with-accent-highlights',
  },
  {
    id: 'studio-dark',
    name: 'Studio Dark',
    description: 'Premium dark mode template for professional architecture studios. Sophisticated and modern.',
    category: 'studio',
    rating: 4.7,
    reviews: 156,
    price: 'premium',
    thumbnail: '🏢',
    preview: 'dark-elegant-with-gold-accents',
  },
  {
    id: 'thesis-serif',
    name: 'Thesis Serif',
    description: 'Academic serif typography for thesis projects. Emphasizes content and analysis.',
    category: 'thesis',
    rating: 4.6,
    reviews: 89,
    price: 'free',
    thumbnail: '📚',
    preview: 'cream-background-serif-typography',
  },
  {
    id: 'interior-minimal',
    name: 'Interior Minimal',
    description: 'Specialized template for interior design portfolios. Focused on imagery and space.',
    category: 'interior',
    rating: 4.8,
    reviews: 127,
    price: 'free',
    thumbnail: '🛋️',
    preview: 'white-gallery-style-layout',
  },
  {
    id: 'landscape-editorial',
    name: 'Landscape Editorial',
    description: 'Editorial-style template for landscape architecture. Dynamic grid with large imagery.',
    category: 'landscape',
    rating: 4.7,
    reviews: 95,
    price: 'premium',
    thumbnail: '🌿',
    preview: 'editorial-magazine-style',
  },
  {
    id: 'urban-parametric',
    name: 'Urban Parametric',
    description: 'Technical parametric design showcase. Perfect for computational architecture work.',
    category: 'urban',
    rating: 4.9,
    reviews: 203,
    price: 'premium',
    thumbnail: '🏗️',
    preview: 'dark-with-technical-grid',
  },
  {
    id: 'student-journal',
    name: 'Student Journal',
    description: 'Journal-style portfolio for student work. Narrative-focused with beautiful typography.',
    category: 'student',
    rating: 4.6,
    reviews: 134,
    price: 'free',
    thumbnail: '📖',
    preview: 'warm-cream-journal-layout',
  },
]

const CATEGORIES = [
  { id: 'student', label: 'Student', emoji: '🎓' },
  { id: 'thesis', label: 'Thesis', emoji: '📚' },
  { id: 'competition', label: 'Competition', emoji: '🏆' },
  { id: 'studio', label: 'Studio', emoji: '🏢' },
  { id: 'interior', label: 'Interior', emoji: '🛋️' },
  { id: 'landscape', label: 'Landscape', emoji: '🌿' },
  { id: 'urban', label: 'Urban Design', emoji: '🏗️' },
]

export default function TemplateMarketplace() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [filteredTemplates, setFilteredTemplates] = useState(TEMPLATES)

  useEffect(() => {
    if (!isAuthenticated) router.push('/signin')
  }, [isAuthenticated])

  useEffect(() => {
    let filtered = TEMPLATES

    if (selectedCategory) {
      filtered = filtered.filter(t => t.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      )
    }

    setFilteredTemplates(filtered)
  }, [searchQuery, selectedCategory])

  const useTemplate = (templateId: string) => {
    router.push(`/dashboard?template=${templateId}`)
  }

  return (
    <div className="min-h-screen bg-bg-primary dark:bg-dark-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface-base dark:bg-dark-surface-base border-b border-border-subtle dark:border-dark-border-subtle shadow-elevation-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors">
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
            Choose from our curated collection of premium architecture portfolio templates. All templates are fully customizable and ready to use.
          </p>

          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="input-field w-full max-w-md"
          />
        </div>

        {/* Category Filter */}
        <div className="mb-12">
          <h3 className="text-body-sm font-semibold text-text-primary dark:text-dark-text-primary mb-4">Categories</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-caption font-medium transition-all ${
                selectedCategory === null
                  ? 'bg-accent-primary dark:bg-dark-surface-elevated text-white dark:text-dark-text-primary'
                  : 'bg-surface-elevated dark:bg-dark-surface-overlay text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary'
              }`}>
              All Templates
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-caption font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-accent-primary dark:bg-dark-surface-elevated text-white dark:text-dark-text-primary'
                    : 'bg-surface-elevated dark:bg-dark-surface-overlay text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary'
                }`}>
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <div key={template.id} className="card overflow-hidden hover:shadow-elevation-3 transition-all duration-200 group">
              {/* Thumbnail */}
              <div className="h-48 bg-gradient-to-br from-accent-primary to-accent-light dark:from-dark-surface-elevated dark:to-dark-surface-overlay flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                {template.thumbnail}
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-h4 text-text-primary dark:text-dark-text-primary font-semibold">
                    {template.name}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-caption font-semibold ${
                    template.price === 'free'
                      ? 'bg-green-100 dark:bg-green-950 text-color-success'
                      : 'bg-accent-primary/10 dark:bg-accent-gold/10 text-accent-primary dark:text-accent-gold'
                  }`}>
                    {template.price === 'free' ? 'Free' : 'Premium'}
                  </span>
                </div>

                <p className="text-body-sm text-text-secondary dark:text-dark-text-secondary mb-4">
                  {template.description}
                </p>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex text-accent-gold">
                    {'⭐'.repeat(Math.floor(template.rating))}
                  </div>
                  <span className="text-caption text-text-secondary dark:text-dark-text-secondary">
                    {template.rating} ({template.reviews} reviews)
                  </span>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => useTemplate(template.id)}
                  className="btn-primary w-full">
                  Use Template
                </button>
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
    </div>
  )
}
