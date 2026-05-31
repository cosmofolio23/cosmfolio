'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function ProjectView() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'portfolio'
  const { token, isAuthenticated } = useAuthStore()
  const [project, setProject] = useState<any>(null)
  const [assets, setAssets] = useState<Record<string, any[]>>({})
  const savedToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '')

  useEffect(() => {
    if (!isAuthenticated) { router.push('/signin'); return }
    fetch(`${API_URL}/api/projects/${params.id}`, { headers: { 'Authorization': `Bearer ${savedToken}` } })
      .then(r => r.json()).then(setProject).catch(console.error)
    fetch(`${API_URL}/api/assets/${params.id}/list`, { headers: { 'Authorization': `Bearer ${savedToken}` } })
      .then(r => r.json()).then(setAssets).catch(console.error)
  }, [isAuthenticated])

  const totalAssets = Object.values(assets).reduce((s: number, a: any) => s + (a?.length || 0), 0)
  const allImages: string[] = Object.values(assets).flat().map((a: any) => a.file_url).filter((u: any) => u?.startsWith('http'))

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Floating header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">← Dashboard</Link>
            <span className="text-gray-600">|</span>
            <span className="text-white font-semibold text-sm">{project?.title || 'Loading...'}</span>
            <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">
              {mode === 'sheet' ? '📄 Sheet' : '🏛️ Portfolio'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/p/${params.id}`).then(() => alert('Link copied!'))}
              className="text-gray-300 hover:text-white text-sm border border-white/20 px-3 py-1.5 rounded-lg"
            >
              🔗 Share
            </button>
            <Link
              href={`/dashboard/project/${params.id}/${mode === 'sheet' ? 'sheet' : 'portfolio'}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
            >
              ✏️ Edit Portfolio
            </Link>
          </div>
        </div>
      </div>

      {/* Portfolio Content */}
      <div className="pt-14">
        {totalAssets === 0 ? (
          /* Empty state - never built portfolio yet */
          <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
            <div className="text-7xl mb-6">🏗️</div>
            <h2 className="text-3xl font-bold text-white mb-3">{project?.title}</h2>
            <p className="text-gray-400 mb-8 max-w-md">
              Your portfolio hasn't been built yet. Click Edit to upload assets and generate your portfolio.
            </p>
            <Link
              href={`/dashboard/project/${params.id}/${mode === 'sheet' ? 'sheet' : 'portfolio'}`}
              className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700"
            >
              🚀 Build Portfolio
            </Link>
          </div>
        ) : (
          /* Rendered portfolio preview */
          <div className="max-w-4xl mx-auto py-8 px-4 space-y-4">
            {/* Cover Page */}
            <div className="rounded-xl overflow-hidden shadow-2xl" style={{ aspectRatio: '1.414' }}>
              <div className="relative w-full h-full bg-gray-900 flex flex-col justify-between p-12">
                {allImages[0] && (
                  <img src={allImages[0]} alt="cover" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                )}
                <div className="relative z-10 border-b border-blue-400 pb-3">
                  <p className="text-blue-400 text-xs tracking-widest uppercase">Architecture Portfolio</p>
                </div>
                <div className="relative z-10">
                  <h1 className="text-5xl font-light text-white mb-2">{project?.title}</h1>
                  <p className="text-blue-400 text-sm tracking-widest uppercase">B.Arch · {new Date().getFullYear()}</p>
                </div>
                <div className="relative z-10 text-xs text-white/30">{new Date().getFullYear()}</div>
              </div>
            </div>

            {/* Project pages for each asset group */}
            {allImages.slice(0, 6).map((url, i) => (
              <div key={i} className="rounded-xl overflow-hidden shadow-xl" style={{ aspectRatio: '1.414' }}>
                {i % 3 === 0 ? (
                  // Split layout
                  <div className="flex h-full bg-gray-100">
                    <div className="flex-1 overflow-hidden" style={{ flex: 3 }}>
                      <img src={url} alt={`page${i}`} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-between p-8 bg-white" style={{ flex: 2 }}>
                      <div>
                        <p className="text-xs text-blue-600 uppercase tracking-widest mb-2">Project {Math.floor(i / 2) + 1}</p>
                        <h2 className="text-2xl font-light text-gray-900 mb-4">{project?.title}</h2>
                        <div className="w-8 h-0.5 bg-blue-600 mb-4" />
                        <p className="text-xs text-gray-500 leading-relaxed">
                          A thoughtful architectural response exploring spatial relationships and material honesty. The design emerges from site analysis and programmatic requirements.
                        </p>
                      </div>
                      <div className="space-y-2">
                        {[['Type', project?.project_type || 'Residential'], ['Year', '2025'], ['Area', '2,400 m²']].map(([k, v]) => (
                          <div key={k} className="flex justify-between text-xs border-t pt-2">
                            <span className="text-gray-400 uppercase tracking-wider">{k}</span>
                            <span className="text-gray-700 font-medium">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : i % 3 === 1 ? (
                  // Full image
                  <div className="relative h-full bg-black">
                    <img src={url} alt={`page${i}`} className="w-full h-full object-cover opacity-90" />
                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80">
                      <p className="text-white/60 text-xs uppercase tracking-widest">{project?.title} · Detail</p>
                    </div>
                  </div>
                ) : (
                  // Grid layout
                  <div className="grid grid-cols-2 h-full bg-gray-900 gap-1">
                    <img src={url} alt={`p${i}`} className="w-full h-full object-cover" />
                    <img src={allImages[(i + 1) % allImages.length]} alt={`p${i+1}`} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            ))}

            {/* Back page */}
            <div className="rounded-xl overflow-hidden shadow-2xl" style={{ aspectRatio: '1.414' }}>
              <div className="h-full bg-gray-900 flex flex-col items-center justify-center text-center p-12">
                <div className="w-8 h-0.5 bg-blue-400 mb-6" />
                <h2 className="text-2xl font-light text-white mb-2">{project?.title}</h2>
                <p className="text-blue-400 text-xs tracking-widest uppercase mb-6">Architect</p>
                <p className="text-gray-500 text-sm">hello@architect.com</p>
                <div className="w-8 h-0.5 bg-blue-400 mt-6" />
              </div>
            </div>

            {/* Edit CTA */}
            <div className="text-center py-8">
              <Link
                href={`/dashboard/project/${params.id}/${mode === 'sheet' ? 'sheet' : 'portfolio'}`}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 inline-block"
              >
                ✏️ Edit & Customize This Portfolio
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
