'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function PublicPortfolio() {
  const params = useParams()
  const [portfolio, setPortfolio] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/api/portfolios/${params.id}/view`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json() })
      .then(setPortfolio)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/50 text-sm">Loading portfolio...</p>
      </div>
    </div>
  )

  if (error || !portfolio) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-center px-6">
      <div>
        <div className="text-6xl mb-4">🏗️</div>
        <h1 className="text-2xl font-bold text-white mb-2">Portfolio Not Found</h1>
        <p className="text-gray-500 mb-6">This portfolio may be private or doesn't exist.</p>
        <a href="/" className="text-blue-400 hover:text-blue-300 text-sm">← Go to CosmoFolio</a>
      </div>
    </div>
  )

  // Render portfolio HTML if available
  if (portfolio.html) return (
    <div className="min-h-screen" dangerouslySetInnerHTML={{ __html: portfolio.html }} />
  )

  // Fallback: render portfolio data
  const project = portfolio.project || {}
  const assets: string[] = portfolio.assets || []

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Public header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <span className="text-white font-medium text-sm">{project.title || 'Architecture Portfolio'}</span>
          <a href="https://cosmofolio.com" className="text-xs text-gray-500 hover:text-gray-300">
            Made with CosmoFolio
          </a>
        </div>
      </div>

      <div className="pt-14 max-w-4xl mx-auto py-8 px-4 space-y-4">
        {/* Cover */}
        <div className="rounded-xl overflow-hidden shadow-2xl bg-gray-800 flex items-center justify-center" style={{ aspectRatio: '1.414' }}>
          <div className="text-center p-12">
            <p className="text-blue-400 text-xs uppercase tracking-widest mb-4">Architecture Portfolio</p>
            <h1 className="text-4xl font-light text-white mb-3">{project.title || 'My Portfolio'}</h1>
            <p className="text-gray-500 text-sm">{new Date().getFullYear()}</p>
          </div>
        </div>

        {/* Content */}
        {assets.map((url: string, i: number) => (
          <div key={i} className="rounded-xl overflow-hidden shadow-xl" style={{ aspectRatio: '1.414' }}>
            <img src={url} alt={`page-${i}`} className="w-full h-full object-cover" />
          </div>
        ))}

        <div className="text-center py-8">
          <a href="https://cosmofolio.com" className="text-gray-500 text-xs hover:text-gray-300">
            Create your portfolio at CosmoFolio →
          </a>
        </div>
      </div>
    </div>
  )
}
