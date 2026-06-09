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
import { LibraryCompleteness } from '@/components/library/LibraryCompleteness'
import { LibraryOutputs } from '@/components/library/LibraryOutputs'
import { buildSheetSetFromLibrary } from '@/lib/buildSheetSet'
import { SHEET_SET_TEMPLATES } from '@/components/sheetSet/sheetSetTemplates'

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
  const [generating, setGenerating] = useState(false)
  const [generatingSheet, setGeneratingSheet] = useState(false)
  const [showPackPicker, setShowPackPicker] = useState(false)

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

  const generatePortfolio = async () => {
    if (assets.length === 0) return
    setGenerating(true)
    try {
      const res = await libraryApi.generatePortfolio(projectId)
      // open the generated portfolio in its editor
      router.push(`/dashboard/project/${res.project_id}/portfolio/${res.portfolio_id}`)
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Could not generate portfolio. Try again.')
      setGenerating(false)
    }
  }

  const generateSheetSet = async (templateId: string) => {
    const template = SHEET_SET_TEMPLATES.find(t => t.id === templateId)
    if (!template || !project || assets.length === 0) return
    setGeneratingSheet(true)
    setShowPackPicker(false)
    try {
      // build the SheetSet client-side (slot-filled from this project's assets), then persist
      const data = buildSheetSetFromLibrary(template, assets, { name: project.name })
      const res = await libraryApi.generateSheetSet(projectId, { name: project.name, data })
      router.push(`/dashboard/project/${res.project_id}/sheet-set/${res.set_id}/editor`)
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Could not generate sheet set. Try again.')
      setGeneratingSheet(false)
    }
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
            {/* Generate outputs FROM this project's library (the payoff) */}
            <div className="flex gap-2">
              <button
                onClick={generatePortfolio}
                disabled={generating || assets.length === 0}
                title={assets.length === 0 ? 'Upload some assets first' : 'Generate a portfolio from this project'}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                {generating ? 'Generating…' : 'Generate Portfolio'}
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowPackPicker(v => !v)}
                  disabled={generatingSheet || assets.length === 0}
                  title={assets.length === 0 ? 'Upload some assets first' : 'Generate a sheet set from this project'}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
                >
                  {generatingSheet ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                  {generatingSheet ? 'Generating…' : 'Generate Sheets'}
                </button>
                {showPackPicker && (
                  <div className="absolute right-0 mt-1 w-60 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-1">
                    <p className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-gray-400">Choose a pack</p>
                    {SHEET_SET_TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => generateSheetSet(t.id)}
                        className="w-full text-left px-3 py-2 hover:bg-amber-50 rounded text-sm"
                      >
                        <div className="font-medium text-gray-800">{t.name}</div>
                        <div className="text-xs text-gray-500">{t.sheetCount} sheets · {t.submissionType}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
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

        {/* Asset store + completeness side-by-side on wide screens */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <section className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Project assets</h2>
            <LibraryAssetGrid projectId={projectId} assets={assets} onChange={setAssets} />
          </section>

          {/* Project Health + Outputs — sticky on desktop */}
          <aside className="space-y-5 lg:sticky lg:top-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <LibraryCompleteness assets={assets} />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <LibraryOutputs libraryProjectId={projectId} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
