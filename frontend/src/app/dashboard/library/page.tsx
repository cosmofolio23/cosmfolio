'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, FolderOpen, Lock, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useEntitlements } from '@/store/entitlements'
import { libraryApi, type LibraryProject } from '@/lib/libraryApi'

/**
 * Project Library (premium) — the unified project store.
 * Gated behind the `library` entitlement; non-subscribers see an upsell.
 */
export default function LibraryPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { entitlements, loaded, fetch: fetchEntitlements, has } = useEntitlements()

  const [projects, setProjects] = useState<LibraryProject[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (!isAuthenticated) { router.push('/signin'); return }
    fetchEntitlements()
  }, [isAuthenticated])

  useEffect(() => {
    if (!loaded) return
    if (!has('library')) { setLoading(false); return }
    libraryApi.listProjects()
      .then(r => setProjects(r.items || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [loaded])

  const createProject = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const p = await libraryApi.createProject({ name: newName.trim() })
      router.push(`/dashboard/library/${p.id}`)
    } catch {
      setCreating(false)
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    )
  }

  // ── Upsell (no entitlement) ──
  if (!has('library')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="text-indigo-600" size={26} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Unlock the Project Library</h1>
          <p className="text-gray-600 mt-2">
            Upload your drawings, renders, and diagrams <strong>once</strong> — then generate both
            portfolios and sheets from the same project. Everything you create lives here, forever.
          </p>
          <ul className="text-sm text-gray-600 text-left mt-5 space-y-2 max-w-xs mx-auto">
            <li>✓ One upload → Portfolio <em>and</em> Sheets</li>
            <li>✓ Your whole studio journey in one place</li>
            <li>✓ Includes both generators</li>
          </ul>
          <button className="mt-6 w-full px-5 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">
            Upgrade to Library
          </button>
          <Link href="/dashboard" className="block mt-3 text-sm text-gray-500 hover:text-gray-700">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  // ── Project grid ──
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🗂️ Project Library</h1>
            <p className="mt-1 text-gray-600">Your architecture journey — upload once, use everywhere.</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* New project inline */}
        <div className="mb-8 flex gap-2 max-w-md">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createProject()}
            placeholder="New project name (e.g. Museum of Light)"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={createProject}
            disabled={creating || !newName.trim()}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Create
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
            <FolderOpen className="mx-auto text-gray-300 mb-3" size={40} />
            <h3 className="text-lg font-medium text-gray-900">No projects yet</h3>
            <p className="text-gray-500 mt-1">Create your first project to start uploading.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map(p => (
              <Link
                key={p.id}
                href={`/dashboard/library/${p.id}`}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden"
              >
                <div className="h-28 bg-gradient-to-br from-indigo-100 to-violet-200 flex items-center justify-center">
                  <FolderOpen className="text-indigo-500/70" size={32} />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">{p.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {p.typology ? `${p.typology} · ` : ''}{p.asset_count ?? 0} assets
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
