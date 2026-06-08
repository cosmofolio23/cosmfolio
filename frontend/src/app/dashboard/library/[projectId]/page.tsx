'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, FileText, Image as ImageIcon } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useEntitlements } from '@/store/entitlements'
import { libraryApi, type LibraryProject, type LibraryAsset } from '@/lib/libraryApi'
import { LibraryUpload } from '@/components/library/LibraryUpload'
import { LibraryAssetGrid } from '@/components/library/LibraryAssetGrid'

/**
 * Library Project — the asset store for one project.
 * Upload flow (drop → auto-sort) + category-grouped grid + readiness summary.
 */
export default function LibraryProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const { isAuthenticated } = useAuthStore()
  const { loaded, fetch: fetchEntitlements, has } = useEntitlements()

  const [project, setProject] = useState<LibraryProject | null>(null)
  const [assets, setAssets] = useState<LibraryAsset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) { router.push('/signin'); return }
    fetchEntitlements()
  }, [isAuthenticated])

  useEffect(() => {
    if (!loaded) return
    if (!has('library')) { router.push('/dashboard/library'); return }
    libraryApi.getProject(projectId)
      .then(p => { setProject(p); setAssets(p.assets || []) })
      .catch(() => router.push('/dashboard/library'))
      .finally(() => setLoading(false))
  }, [loaded, projectId])

  const reload = async () => {
    const p = await libraryApi.getProject(projectId)
    setProject(p)
    setAssets(p.assets || [])
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    )
  }

  if (!project) return null

  // readiness summary — how many of each high-level kind exist
  const counts = {
    drawings: assets.filter(a => a.category === 'drawing').length,
    visuals: assets.filter(a => a.category === 'visual').length,
    process: assets.filter(a => a.category === 'process').length,
    analysis: assets.filter(a => a.category === 'analysis').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/dashboard/library" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3">
            <ArrowLeft size={16} /> All projects
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {assets.length} assets · {counts.drawings} drawings · {counts.visuals} visuals · {counts.process} process · {counts.analysis} analysis
              </p>
            </div>
            {/* Outputs this project can produce (next phase wires these to read from library) */}
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
                <ImageIcon size={16} /> Portfolio
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 text-sm font-medium">
                <FileText size={16} /> Sheets
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Upload */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Add to this project</h2>
          <LibraryUpload projectId={projectId} onUploaded={() => reload()} />
        </section>

        {/* Asset store */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Project assets</h2>
          <LibraryAssetGrid projectId={projectId} assets={assets} onChange={setAssets} />
        </section>
      </main>
    </div>
  )
}
