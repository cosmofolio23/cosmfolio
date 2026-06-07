'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import Logo from '@/components/Logo'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface PortfolioStats {
  portfolio_id: string
  views: number
  shares: number
  downloads: number
}

interface Analytics {
  total_views: number
  total_shares: number
  total_downloads: number
  conversion_rate: number
  download_rate: number
  share_platforms: Record<string, number>
  download_formats: Record<string, number>
  daily_views_30d: Record<string, number>
}

export default function AnalyticsDashboard() {
  const router = useRouter()
  const { isAuthenticated, token } = useAuthStore()
  const [summary, setSummary] = useState<any>(null)
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/signin')
      return
    }
    loadAnalytics()
  }, [isAuthenticated])

  const loadAnalytics = async () => {
    setIsLoading(true)
    try {
      const savedToken = token || localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/api/portfolios/user/analytics/summary`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSummary(data)
        if (data.top_portfolio) {
          setSelectedPortfolio(data.top_portfolio)
          loadPortfolioAnalytics(data.top_portfolio, savedToken)
        }
      }
    } catch (e) {
      console.error('Failed to load analytics:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const loadPortfolioAnalytics = async (portfolioId: string | null, savedToken?: string | null) => {
    if (!portfolioId) return
    try {
      const tkn = savedToken || (token || localStorage.getItem('auth_token'))
      const res = await fetch(`${API_URL}/api/portfolios/${portfolioId}/analytics`, {
        headers: { 'Authorization': `Bearer ${tkn}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch (e) {
      console.error('Failed to load portfolio analytics:', e)
    }
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg-subtle">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-border-light border-t-primary rounded-full animate-spin mb-4 mx-auto"></div>
        <p className="text-stone-light">Loading analytics...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-bg-subtle">
      {/* Header */}
      <header className="bg-white border-b border-border-light shadow-sm sticky top-0 z-40">
        <div className="container-centered py-4 md:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-stone-light hover:text-slate text-sm flex items-center gap-1">
              ← Back
            </Link>
            <div className="h-6 w-px bg-border-light"></div>
            <Logo size="sm" variant="gold" />
            <div>
              <h1 className="text-2xl font-bold text-charcoal">Analytics</h1>
              <p className="text-xs text-stone-light mt-0.5">Track views, shares, and downloads</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container-centered py-8">
        {!summary ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
            <div className="text-6xl mb-6 opacity-20">📈</div>
            <h3 className="text-2xl font-bold text-charcoal mb-3">No data yet</h3>
            <p className="text-stone-light mb-8">Start sharing portfolios to see analytics.</p>
            <Link href="/dashboard/portfolios" className="btn-primary inline-block">
              View Portfolios
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                icon="👀"
                label="Total Views"
                value={summary.total_views}
                color="blue"
              />
              <StatCard
                icon="📤"
                label="Shares"
                value={summary.total_shares}
                color="green"
              />
              <StatCard
                icon="📥"
                label="Downloads"
                value={summary.total_downloads}
                color="amber"
              />
              <StatCard
                icon="📚"
                label="Portfolios"
                value={summary.portfolio_count}
                color="purple"
              />
            </div>

            {/* Portfolio Selector */}
            {summary.portfolios && summary.portfolios.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-charcoal mb-4">Portfolio Breakdown</h2>
                <div className="space-y-2">
                  {summary.portfolios.map((p: PortfolioStats) => (
                    <button
                      key={p.portfolio_id}
                      onClick={() => {
                        setSelectedPortfolio(p.portfolio_id)
                        loadPortfolioAnalytics(p.portfolio_id)
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition ${
                        selectedPortfolio === p.portfolio_id
                          ? 'border-primary bg-blue-50'
                          : 'border-border-light hover:border-stone-light'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-charcoal">Portfolio</span>
                        <span className="text-primary font-bold">{p.views} views</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Analytics */}
            {selectedPortfolio && analytics && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-charcoal mb-6">Portfolio Performance</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <MetricBox
                    label="Conversion Rate"
                    value={`${analytics.conversion_rate}%`}
                    desc="Shares / Views"
                  />
                  <MetricBox
                    label="Download Rate"
                    value={`${analytics.download_rate}%`}
                    desc="Downloads / Views"
                  />
                  <MetricBox
                    label="Avg Views"
                    value={analytics.total_views > 0 ? `${Math.round(analytics.total_views / 30)}` : '0'}
                    desc="Per day (30d avg)"
                  />
                </div>

                {/* Platforms & Formats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider mb-3">Top Share Platforms</h3>
                    {Object.entries(analytics.share_platforms).length === 0 ? (
                      <p className="text-xs text-stone-light">No shares yet</p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(analytics.share_platforms).map(([platform, count]: any) => (
                          <div key={platform} className="flex items-center justify-between text-sm">
                            <span className="text-charcoal capitalize">{platform}</span>
                            <span className="font-bold text-primary">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider mb-3">Downloads by Format</h3>
                    {Object.entries(analytics.download_formats).length === 0 ? (
                      <p className="text-xs text-stone-light">No downloads yet</p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(analytics.download_formats).map(([format, count]: any) => (
                          <div key={format} className="flex items-center justify-between text-sm">
                            <span className="text-charcoal uppercase">{format}</span>
                            <span className="font-bold text-primary">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function StatCard({ icon, label, value, color }: any) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  }
  return (
    <div className={`rounded-xl border-2 p-4 ${colors[color as keyof typeof colors]}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  )
}

function MetricBox({ label, value, desc }: any) {
  return (
    <div className="border border-border-light rounded-lg p-4">
      <div className="text-xs font-bold text-stone-light uppercase tracking-wider mb-1">{label}</div>
      <div className="text-3xl font-bold text-charcoal">{value}</div>
      <div className="text-xs text-stone-light mt-2">{desc}</div>
    </div>
  )
}
