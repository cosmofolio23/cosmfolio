'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, FolderOpen, Lock, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useEntitlements } from '@/store/entitlements'
import { libraryApi, type LibraryProject } from '@/lib/libraryApi'
import { LibraryStats } from '@/components/library/LibraryStats'
import Logo from '@/components/Logo'

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
      <div className="min-h-screen flex items-center justify-center bg-bg-primary dark:bg-dark-bg-primary">
        <Loader2 className="animate-spin text-accent-gold" size={32} />
      </div>
    )
  }

  // ── Upsell (no entitlement) ──
  if (!has('library')) {
    return (
      <div className="min-h-screen flex items-center justify-center aurora-bg p-4">
        <div className="glass-panel max-w-lg w-full p-8 text-center relative z-10">
          <Logo size="lg" variant="gold" className="mx-auto mb-4" />
          <div className="w-14 h-14 rounded-full glass-gold flex items-center justify-center mx-auto mb-4">
            <Lock className="text-accent-gold" size={26} />
          </div>
          <h1 className="text-2xl font-bold text-white">Unlock the <span className="text-gold-gradient">Project Library</span></h1>
          <p className="text-white/70 mt-2">
            Upload your drawings, renders, and diagrams <strong className="text-white">once</strong> — then generate both
            portfolios and sheets from the same project. Everything you create lives here, forever.
          </p>
          <ul className="text-sm text-white/70 text-left mt-5 space-y-2 max-w-xs mx-auto">
            <li>✓ One upload → Portfolio <em>and</em> Sheets</li>
            <li>✓ Your whole studio journey in one place</li>
            <li>✓ Includes both generators</li>
          </ul>
          <button className="mt-6 w-full px-5 py-3 bg-accent-gold text-[#1A1A1A] rounded-lg font-semibold hover:brightness-95 transition">
            Upgrade to Library
          </button>
          <Link href="/dashboard" className="block mt-3 text-sm text-white/50 hover:text-white/80">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  // ── Project grid ──
  return (
    <div className="min-h-screen bg-bg-primary dark:bg-dark-bg-primary relative overflow-hidden">
      {/* Floating brand orbs */}
      <div className="fixed top-20 -left-20 w-96 h-96 bg-accent-gold/10 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
      <div className="fixed bottom-20 -right-20 w-80 h-80 bg-accent-primary/10 dark:bg-accent-gold/10 rounded-full blur-[80px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <header className="glass-nav shadow-elevation-1 sticky top-0 z-40">
        <div className="container-centered py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard"><Logo size="md" variant="gold" /></Link>
            <div>
              <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">Project <span className="text-gold-gradient">Library</span></h1>
              <p className="mt-1 text-text-secondary dark:text-dark-text-secondary">Your architecture journey — upload once, use everywhere.</p>
            </div>
          </div>
          <Link href="/dashboard" className="btn-tertiary text-sm whitespace-nowrap">← Dashboard</Link>
        </div>
      </header>

      <main className="container-centered py-8 space-y-8 relative z-10">
        {/* Stats */}
        <LibraryStats />

        {/* New project inline */}
        <div className="flex gap-2 max-w-md">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createProject()}
            placeholder="New project name (e.g. Museum of Light)"
            className="input-field flex-1"
          />
          <button
            onClick={createProject}
            disabled={creating || !newName.trim()}
            className="px-4 py-2.5 bg-accent-gold text-[#1A1A1A] rounded-lg font-semibold hover:brightness-95 disabled:opacity-50 flex items-center gap-2 transition whitespace-nowrap"
          >
            {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Create
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16 card-flat border-2 border-dashed border-border-default dark:border-dark-border-default">
            <FolderOpen className="mx-auto text-accent-gold/40 mb-3" size={40} />
            <h3 className="text-lg font-medium text-text-primary dark:text-dark-text-primary">No projects yet</h3>
            <p className="text-text-secondary dark:text-dark-text-secondary mt-1">Create your first project to start uploading.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map(p => (
              <Link
                key={p.id}
                href={`/dashboard/library/${p.id}`}
                className="card overflow-hidden group"
              >
                <div className="h-28 bg-gradient-to-br from-[#FBE7A1]/40 to-[#C99B30]/40 flex items-center justify-center">
                  <FolderOpen className="text-accent-gold group-hover:scale-110 transition-transform" size={32} />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-text-primary dark:text-dark-text-primary truncate">{p.name}</h3>
                  <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-1">
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
