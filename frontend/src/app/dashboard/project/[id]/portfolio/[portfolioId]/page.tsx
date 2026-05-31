'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const STYLE_CONFIGS: Record<string, { bg: string; text: string; accent: string; font: string }> = {
  minimal_white: { bg: '#FFFFFF', text: '#1A1A1A', accent: '#0D47A1', font: 'Inter, system-ui, sans-serif' },
  dark_studio: { bg: '#1a1a1a', text: '#F5F5F0', accent: '#DAA520', font: 'Inter, sans-serif' },
  scandinavian: { bg: '#F5F0E8', text: '#2C2C2C', accent: '#8B7355', font: 'Georgia, serif' },
  architectural_journal: { bg: '#F8F4EF', text: '#1C1C1C', accent: '#8B0000', font: 'Georgia, serif' },
  competition_board: { bg: '#0A0A2E', text: '#FFFFFF', accent: '#FFD700', font: 'Inter, sans-serif' },
  parametric: { bg: '#F0F4FF', text: '#1A1A3E', accent: '#4169E1', font: 'IBM Plex Mono, monospace' },
  corporate: { bg: '#FAFAFA', text: '#2D2D2D', accent: '#0D47A1', font: 'Inter, sans-serif' },
}

export default function PortfolioPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()
  const [portfolio, setPortfolio] = useState<any>(null)
  const [assets, setAssets] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) { router.push('/signin'); return }
    loadPortfolio()
    loadAssets()
  }, [isAuthenticated, token])

  const loadPortfolio = async () => {
    try {
      const savedToken = token || localStorage.getItem('auth_token')
      if (!savedToken) {
        console.error('No auth token available')
        setIsLoading(false)
        return
      }
      const res = await fetch(`${API_URL}/api/portfolios/view/${params.portfolioId}`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setPortfolio(data)
      } else {
        console.error(`Failed to load portfolio: ${res.status}`, await res.text())
      }
    } catch (e) {
      console.error('Error loading portfolio:', e)
    }
    finally { setIsLoading(false) }
  }

  const loadAssets = async () => {
    try {
      const savedToken = token || localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/api/assets/${params.id}/list`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        const all = [
          ...(data.render || []),
          ...(data.plan || []),
          ...(data.section || []),
          ...(data.diagram || []),
        ]
        setAssets(all)
      }
    } catch (e) { console.error(e) }
  }

  const styleConfig = STYLE_CONFIGS[portfolio?.style_pack] || STYLE_CONFIGS.minimal_white
  const renders = assets.filter(a => a.asset_type === 'render' && a.file_url?.startsWith('http'))
  const plans = assets.filter(a => a.asset_type === 'plan' && a.file_url?.startsWith('http'))
  const sections = assets.filter(a => a.asset_type === 'section' && a.file_url?.startsWith('http'))
  const diagrams = assets.filter(a => a.asset_type === 'diagram' && a.file_url?.startsWith('http'))

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg-subtle">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-border-light border-t-primary rounded-full animate-spin mb-4 mx-auto"></div>
        <p className="text-stone-light">Loading portfolio preview...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-900 print:bg-white">
      {/* Toolbar */}
      <div className="bg-white border-b border-border-light shadow-elevation-2 sticky top-0 z-50 px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
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
          <div className="divider h-4"></div>
          <span className="text-sm font-medium text-slate">Variant #{portfolio?.variant_number}</span>
        </div>
        <div className="flex gap-2 flex-wrap md:flex-nowrap items-center">
          <span className="badge badge-info text-xs">
            {portfolio?.style_pack?.replace(/_/g, ' ').toUpperCase()}
          </span>
          <span className="badge badge-primary text-xs">
            {portfolio?.layout_id?.replace(/_/g, ' ').toUpperCase()}
          </span>
          <button
            onClick={() => window.print()}
            className="btn-primary text-sm flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* A4 Portfolio Pages */}
      <div className="max-w-4xl mx-auto py-6 md:py-8 space-y-4 md:space-y-6 px-4 print:py-0 print:space-y-0">

        {/* Page 1 - Cover / Hero */}
        <div
          className="w-full rounded-lg overflow-hidden shadow-2xl print:rounded-none print:shadow-none"
          style={{
            background: styleConfig.bg,
            color: styleConfig.text,
            fontFamily: styleConfig.font,
            aspectRatio: '1/1.414',
            display: 'flex',
            flexDirection: 'column',
            pageBreakAfter: 'always',
          }}
        >
          {/* Hero Image */}
          {renders[0] && (
            <div className="flex-1 relative overflow-hidden">
              <img
                src={renders[0].file_url}
                alt="Hero render"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute bottom-0 left-0 right-0"
                style={{
                  background: `linear-gradient(to top, ${styleConfig.bg}, transparent)`,
                  padding: '3rem 2rem 2rem 2rem'
                }}
              >
                <h1 className="text-4xl font-bold mb-1" style={{ color: styleConfig.text }}>
                  Project Portfolio
                </h1>
                <p className="text-lg" style={{ color: styleConfig.accent }}>
                  Architecture & Design
                </p>
              </div>
            </div>
          )}
          {!renders[0] && (
            <div className="flex-1 flex items-center justify-center" style={{ background: styleConfig.accent + '15' }}>
              <div className="text-center">
                <div className="text-7xl mb-6 opacity-40">🏗️</div>
                <h1 className="text-5xl font-bold mb-3">Project Portfolio</h1>
                <p className="text-xl" style={{ color: styleConfig.accent }}>
                  Architecture & Design
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Page 2 - Renders Grid */}
        {renders.length > 1 && (
          <div
            className="w-full shadow-2xl rounded-lg overflow-hidden print:rounded-none print:shadow-none p-8"
            style={{
              background: styleConfig.bg,
              color: styleConfig.text,
              fontFamily: styleConfig.font,
              aspectRatio: '1/1.414',
              display: 'flex',
              flexDirection: 'column',
              pageBreakAfter: 'always',
            }}
          >
            <h2 className="text-3xl font-bold mb-3" style={{ color: styleConfig.accent }}>
              Visualizations
            </h2>
            <div className="w-16 h-1 mb-6 rounded-full" style={{ background: styleConfig.accent }}></div>
            <div className="grid grid-cols-2 gap-6 flex-1">
              {renders.slice(1, 5).map((r, i) => (
                <div key={i} className="overflow-hidden rounded">
                  <img src={r.file_url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Page 3 - Plans */}
        {plans.length > 0 && (
          <div
            className="w-full shadow-2xl rounded-lg overflow-hidden print:rounded-none print:shadow-none p-8"
            style={{
              background: styleConfig.bg,
              color: styleConfig.text,
              fontFamily: styleConfig.font,
              aspectRatio: '1/1.414',
              display: 'flex',
              flexDirection: 'column',
              pageBreakAfter: 'always',
            }}
          >
            <h2 className="text-3xl font-bold mb-3" style={{ color: styleConfig.accent }}>
              Floor Plans
            </h2>
            <div className="w-16 h-1 mb-6 rounded-full" style={{ background: styleConfig.accent }}></div>
            <div className="grid grid-cols-1 gap-8 flex-1">
              {plans.slice(0, 2).map((p, i) => (
                <div key={i} className="overflow-hidden rounded flex items-center justify-center">
                  <img src={p.file_url} alt="" className="max-w-full max-h-full object-contain" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Page 4 - Sections & Diagrams */}
        {(sections.length > 0 || diagrams.length > 0) && (
          <div
            className="w-full shadow-2xl rounded-lg overflow-hidden print:rounded-none print:shadow-none p-8"
            style={{
              background: styleConfig.bg,
              color: styleConfig.text,
              fontFamily: styleConfig.font,
              aspectRatio: '1/1.414',
              display: 'flex',
              flexDirection: 'column',
              pageBreakAfter: 'always',
            }}
          >
            <h2 className="text-3xl font-bold mb-3" style={{ color: styleConfig.accent }}>
              {sections.length > 0 ? 'Sections & Elevations' : 'Analysis Diagrams'}
            </h2>
            <div className="w-16 h-1 mb-6 rounded-full" style={{ background: styleConfig.accent }}></div>
            <div className="grid grid-cols-2 gap-6 flex-1">
              {[...sections, ...diagrams].slice(0, 4).map((a, i) => (
                <div key={i} className="overflow-hidden rounded flex items-center justify-center">
                  <img src={a.file_url} alt="" className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* More Renders */}
        {renders.length > 5 && (
          <div
            className="w-full shadow-2xl rounded-lg overflow-hidden print:rounded-none print:shadow-none p-8"
            style={{
              background: styleConfig.bg,
              color: styleConfig.text,
              fontFamily: styleConfig.font,
              aspectRatio: '1/1.414',
              display: 'flex',
              flexDirection: 'column',
              pageBreakAfter: 'always',
            }}
          >
            <h2 className="text-3xl font-bold mb-3" style={{ color: styleConfig.accent }}>
              Additional Views
            </h2>
            <div className="w-16 h-1 mb-6 rounded-full" style={{ background: styleConfig.accent }}></div>
            <div className="grid grid-cols-3 gap-4 flex-1">
              {renders.slice(5, 11).map((r, i) => (
                <div key={i} className="overflow-hidden rounded">
                  <img src={r.file_url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
