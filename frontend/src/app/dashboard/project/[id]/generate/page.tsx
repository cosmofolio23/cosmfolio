'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const STYLE_PACKS = [
  { id: 'minimal_white', name: 'Minimal White', desc: 'Clean & academic', color: '#FFFFFF', text: '#000000', preview: '⬜' },
  { id: 'dark_studio', name: 'Dark Studio', desc: 'Bold & dramatic', color: '#1a1a1a', text: '#FFFFFF', preview: '⬛' },
  { id: 'scandinavian', name: 'Scandinavian', desc: 'Warm & natural', color: '#F5F0E8', text: '#2C2C2C', preview: '🟤' },
  { id: 'architectural_journal', name: 'Arch Journal', desc: 'Magazine-like', color: '#F8F4EF', text: '#1C1C1C', preview: '📰' },
  { id: 'competition_board', name: 'Competition Board', desc: 'Bold & graphic', color: '#0A0A2E', text: '#FFFFFF', preview: '🏆' },
  { id: 'parametric', name: 'Parametric', desc: 'Geometric & tech', color: '#F0F4FF', text: '#1A1A3E', preview: '🔷' },
  { id: 'corporate', name: 'Corporate', desc: 'Professional', color: '#FAFAFA', text: '#2D2D2D', preview: '🏢' },
]

const LAYOUTS = [
  { id: 'hero_render', name: 'Hero Render', desc: 'Full-page hero image + content', icon: '🖼️', category: 'Hero' },
  { id: 'grid_2col', name: '2-Column Grid', desc: 'Balanced two-column layout', icon: '▦', category: 'Grid' },
  { id: 'grid_3col', name: '3-Column Grid', desc: 'Compact three-column layout', icon: '⊞', category: 'Grid' },
  { id: 'plan_centric', name: 'Plan-Centric', desc: 'Floor plans take center stage', icon: '📐', category: 'Plan' },
  { id: 'section_heavy', name: 'Section-Heavy', desc: 'Sections & elevations focused', icon: '✂️', category: 'Section' },
  { id: 'competition_board', name: 'Competition Board', desc: 'A2 poster-style layout', icon: '🏆', category: 'Competition' },
  { id: 'timeline', name: 'Timeline', desc: 'Process & narrative flow', icon: '📅', category: 'Timeline' },
  { id: 'technical', name: 'Technical', desc: 'Diagrams & callouts focus', icon: '📊', category: 'Technical' },
  { id: 'thesis', name: 'Thesis Layout', desc: 'Academic portfolio format', icon: '🎓', category: 'Thesis' },
  { id: 'asymmetric', name: 'Asymmetric', desc: 'Dynamic unequal layout', icon: '◱', category: 'Grid' },
]

interface Portfolio {
  id: string
  layout_id: string
  style_pack: string
  variant_number: number
  status: string
  created_at: string
}

export default function GeneratePage() {
  const params = useParams()
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()

  const [selectedStyle, setSelectedStyle] = useState('minimal_white')
  const [selectedLayout, setSelectedLayout] = useState('hero_render')
  const [variantCount, setVariantCount] = useState(3)
  const [isGenerating, setIsGenerating] = useState(false)
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [generatingMsg, setGeneratingMsg] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    if (!isAuthenticated) { router.push('/signin'); return }
    loadPortfolios()
  }, [isAuthenticated])

  const loadPortfolios = async () => {
    try {
      const res = await fetch(`${API_URL}/api/portfolios/${params.id}/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setPortfolios(await res.json())
    } catch (e) { console.error(e) }
  }

  const deletePortfolio = async (portfolioId: string) => {
    if (!confirm('Delete this portfolio variant?')) return
    try {
      await fetch(`${API_URL}/api/portfolios/${portfolioId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      await loadPortfolios()
    } catch (e) { console.error(e) }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    const msgs = [
      '🔍 Analyzing your assets...',
      '🎨 Applying design system...',
      '📐 Building layout structure...',
      '✨ Generating portfolio variants...',
      '📄 Finalizing pages...',
    ]
    let i = 0
    const interval = setInterval(() => {
      setGeneratingMsg(msgs[i % msgs.length])
      i++
    }, 1500)

    try {
      for (let v = 1; v <= variantCount; v++) {
        setGeneratingMsg(`✨ Creating variant ${v} of ${variantCount}...`)
        await fetch(`${API_URL}/api/portfolios/${params.id}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            layout_id: selectedLayout,
            style_pack: selectedStyle,
            variant_number: v
          })
        })
      }
      await loadPortfolios()
      setGeneratingMsg('✅ Done! Portfolios generated!')
      setTimeout(() => setGeneratingMsg(''), 3000)
    } catch (e) {
      setGeneratingMsg('❌ Generation failed. Try again.')
    } finally {
      clearInterval(interval)
      setIsGenerating(false)
    }
  }

  const categories = ['All', ...Array.from(new Set(LAYOUTS.map(l => l.category)))]
  const filteredLayouts = activeCategory === 'All' ? LAYOUTS : LAYOUTS.filter(l => l.category === activeCategory)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/project/${params.id}`} className="text-gray-500 hover:text-gray-700">← Back</Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-lg font-bold">Generate Portfolio</h1>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {isGenerating ? (
              <><span className="animate-spin">⟳</span> Generating...</>
            ) : (
              <>✨ Generate {variantCount} Variants</>
            )}
          </button>
        </div>
      </header>

      {generatingMsg && (
        <div className="bg-blue-600 text-white text-center py-3 font-medium animate-pulse">
          {generatingMsg}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Variant Count */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">📦 How many variants?</h2>
          <div className="flex gap-3">
            {[1, 3, 5, 10].map(n => (
              <button
                key={n}
                onClick={() => setVariantCount(n)}
                className={`px-6 py-3 rounded-lg font-semibold transition border-2 ${
                  variantCount === n
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                }`}
              >
                {n} {n === 1 ? 'Variant' : 'Variants'}
              </button>
            ))}
          </div>
        </div>

        {/* Style Picker */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">🎨 Design System</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {STYLE_PACKS.map(style => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`p-3 rounded-xl border-2 transition text-left ${
                  selectedStyle === style.id
                    ? 'border-blue-600 shadow-md'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                style={{ background: style.color, color: style.text }}
              >
                <div className="text-2xl mb-1">{style.preview}</div>
                <div className="text-xs font-bold truncate">{style.name}</div>
                <div className="text-xs opacity-70 truncate">{style.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Layout Picker */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">📐 Layout</h2>
          <div className="flex gap-2 mb-4 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {filteredLayouts.map(layout => (
              <button
                key={layout.id}
                onClick={() => setSelectedLayout(layout.id)}
                className={`p-4 rounded-xl border-2 transition text-left ${
                  selectedLayout === layout.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}
              >
                <div className="text-3xl mb-2">{layout.icon}</div>
                <div className="text-sm font-bold text-gray-900">{layout.name}</div>
                <div className="text-xs text-gray-500 mt-1">{layout.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Generated Portfolios */}
        {portfolios.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">📁 Generated Portfolios ({portfolios.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolios.map(portfolio => (
                <div key={portfolio.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-gray-900">Variant #{portfolio.variant_number}</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      {portfolio.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1 mb-4">
                    <div>🎨 {STYLE_PACKS.find(s => s.id === portfolio.style_pack)?.name || portfolio.style_pack}</div>
                    <div>📐 {LAYOUTS.find(l => l.id === portfolio.layout_id)?.name || portfolio.layout_id}</div>
                    <div>📅 {new Date(portfolio.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/project/${params.id}/portfolio/${portfolio.id}`}
                      className="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                    >
                      👁️ Preview
                    </Link>
                    <a
                      href={`${API_URL}/api/portfolios/${portfolio.id}/export/pdf`}
                      className="flex-1 bg-gray-100 text-gray-700 text-center py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                    >
                      📥 PDF
                    </a>
                    <button
                      onClick={() => deletePortfolio(portfolio.id)}
                      className="flex-1 bg-red-100 text-red-700 text-center py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generate CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Ready to generate?</h2>
          <p className="text-blue-100 mb-6">
            Selected: <strong>{STYLE_PACKS.find(s => s.id === selectedStyle)?.name}</strong> style
            with <strong>{LAYOUTS.find(l => l.id === selectedLayout)?.name}</strong> layout
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-white text-blue-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 disabled:opacity-50 transition"
          >
            {isGenerating ? '⟳ Generating...' : `✨ Generate ${variantCount} Portfolio Variants`}
          </button>
        </div>

      </main>
    </div>
  )
}
