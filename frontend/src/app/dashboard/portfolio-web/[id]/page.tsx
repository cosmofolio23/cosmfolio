'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import type { Page, DesignTokens } from '@/components/composer/types'
import PageComposer from '@/components/composer/PageComposer'
import { motion, useScroll, useTransform } from 'framer-motion'

const API_URL = (typeof window !== 'undefined' && process.env.NODE_ENV === 'production' ? '/backend-proxy' : (process.env.NEXT_PUBLIC_API_URL || 'https://cosmfolio-production.up.railway.app'))

interface PortfolioData {
  document: {
    title: string
    pages: Page[]
    tokens: DesignTokens
  }
  project: {
    id: string
    title: string
    slug?: string
  }
}

export default function PortfolioWebPage() {
  const router = useRouter()
  const params = useParams()
  const { isAuthenticated, token } = useAuthStore()
  const projectId = params.id as string

  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const authToken = () => token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/signin')
      return
    }
    loadPortfolio()
  }, [isAuthenticated])

  const loadPortfolio = async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/document`, {
        headers: { Authorization: `Bearer ${authToken()}` },
      })
      if (!res.ok) throw new Error('Portfolio not found')
      const data = await res.json()
      if (!data.exists || !data.document) throw new Error('No portfolio created yet')

      const projRes = await fetch(`${API_URL}/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${authToken()}` },
      })
      const project = projRes.ok ? await projRes.json() : { title: 'Portfolio' }

      setPortfolio({
        document: data.document,
        project,
      })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) return null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-medium">Loading Interactive Web Experience…</p>
        </div>
      </div>
    )
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Portfolio Not Found</h1>
          <p className="text-gray-400 mb-4">{error || 'Not found'}</p>
          <Link href={`/dashboard/templates/saved/editor?project=${projectId}`} className="text-blue-400 hover:underline">← Back to editor</Link>
        </div>
      </div>
    )
  }

  const { document, project } = portfolio
  const pages = document.pages || []
  const tokens = document.tokens || {}
  const publishing = (document as any).publishing || {}
  const pageSize = publishing.pageSize

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      {/* Floating Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-6 flex items-center justify-between pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="pointer-events-auto"
        >
          <Link href={`/dashboard/templates/saved/editor?project=${projectId}`} className="text-gray-400 hover:text-white transition px-4 py-2 bg-black/40 backdrop-blur rounded-full text-sm font-medium border border-white/10">
            ← Exit Web Mode
          </Link>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-4 pointer-events-auto bg-black/40 backdrop-blur px-5 py-2.5 rounded-full border border-white/10"
        >
          <span className="font-semibold tracking-wide text-sm">{project.title}</span>
          <div className="w-px h-4 bg-white/20" />
          <span className="text-xs text-gray-400 uppercase tracking-widest">Interactive Web Mode</span>
        </motion.div>
      </nav>

      {/* Main Content - Scroll Sections */}
      <main className="w-full flex flex-col items-center">
        {pages.map((page, idx) => {
          return (
            <ParallaxPage 
              key={page.id} 
              page={page} 
              tokens={tokens} 
              pageSize={pageSize} 
              index={idx}
              totalPages={pages.length}
            />
          )
        })}
      </main>
    </div>
  )
}

function ParallaxPage({ page, tokens, pageSize, index, totalPages }: { page: Page; tokens: DesignTokens; pageSize: any; index: number; totalPages: number }) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="w-full min-h-screen flex items-center justify-center py-24 relative"
    >
      <div className="w-full max-w-5xl shadow-2xl relative">
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 text-white/20 font-mono text-xs rotate-180" style={{ writingMode: 'vertical-rl' }}>
          {String(index + 1).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
        </div>
        
        {/* Subtle hover parallax effect on the page container itself */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <PageComposer
            page={page}
            tokens={tokens}
            pageSize={pageSize}
            onChange={() => {}}
            editableFree={false}
            overflowVisible={false}
            grid={undefined}
            readonly={true}
          />
        </motion.div>
      </div>
    </motion.section>
  )
}
