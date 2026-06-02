'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function PortfolioPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()
  const [portfolio, setPortfolio] = useState<any>(null)
  const [html, setHtml] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) { router.push('/signin'); return }
    loadPortfolio()
  }, [isAuthenticated, token])

  const loadPortfolio = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const savedToken = token || localStorage.getItem('auth_token')
      if (!savedToken) {
        setError('Not authenticated')
        setIsLoading(false)
        return
      }

      // Get portfolio metadata
      const metaRes = await fetch(`${API_URL}/api/portfolios/view/${params.portfolioId}`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      if (metaRes.ok) {
        setPortfolio(await metaRes.json())
      }

      // Get rendered HTML (uses real layout + design pack)
      const previewRes = await fetch(`${API_URL}/api/portfolios/${params.portfolioId}/preview`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      if (previewRes.ok) {
        const data = await previewRes.json()
        setHtml(data.html || '')
      } else {
        const errText = await previewRes.text()
        setError(`Failed to render: ${previewRes.status} ${errText.slice(0, 200)}`)
      }
    } catch (e: any) {
      console.error('Error loading portfolio:', e)
      setError(e.message || 'Failed to load')
    }
    finally { setIsLoading(false) }
  }

  const handlePrint = () => {
    const iframe = document.getElementById('portfolio-frame') as HTMLIFrameElement
    if (iframe?.contentWindow) {
      iframe.contentWindow.print()
    }
  }

  const handleDownloadHtml = () => {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `portfolio-${portfolio?.variant_number || '1'}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg-subtle">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-border-light border-t-primary rounded-full animate-spin mb-4 mx-auto"></div>
        <p className="text-stone-light">Rendering portfolio with your selected design pack...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-bg-subtle p-6">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-lg">
        <h2 className="text-xl font-bold text-red-700 mb-3">⚠️ Error Rendering Portfolio</h2>
        <pre className="text-sm bg-red-50 p-4 rounded text-red-800 overflow-auto">{error}</pre>
        <div className="flex gap-2 mt-4">
          <button onClick={loadPortfolio} className="btn-primary">Retry</button>
          <Link href={`/dashboard/project/${params.id}/generate`} className="px-4 py-2 border border-border-light rounded">
            Back
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Toolbar */}
      <div className="bg-white border-b border-border-light shadow-elevation-2 sticky top-0 z-50 px-4 md:px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/project/${params.id}/generate`}
            className="text-stone-light hover:text-slate transition-colors flex items-center gap-1 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Generate
          </Link>
          <div className="h-4 w-px bg-border-light"></div>
          <span className="text-sm font-medium text-slate">Variant #{portfolio?.variant_number}</span>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <span className="bg-blue-50 text-primary px-2 py-1 rounded text-xs font-medium">
            🎨 {portfolio?.style_pack?.replace(/preset-/g, '').replace(/_/g, ' ').replace(/-/g, ' ')}
          </span>
          <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs font-medium">
            📐 {portfolio?.layout_id?.replace(/_/g, ' ').replace(/-/g, ' ')}
          </span>
          <button
            onClick={handleDownloadHtml}
            className="px-3 py-1.5 border border-border-light rounded text-sm hover:bg-bg-subtle"
            title="Download as HTML"
          >
            📥 HTML
          </button>
          <button
            onClick={handlePrint}
            className="bg-primary text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-primary-dark flex items-center gap-2"
          >
            🖨️ Print / PDF
          </button>
        </div>
      </div>

      {/* Portfolio iframe */}
      <iframe
        id="portfolio-frame"
        srcDoc={html}
        sandbox="allow-same-origin"
        style={{
          width: '100%',
          height: 'calc(100vh - 60px)',
          border: 'none',
          background: '#f5f5f5',
        }}
      />
    </div>
  )
}
