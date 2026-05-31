'use client'

/**
 * Portfolio Wizard Entry Point (Batch 1)
 *
 * User flow:
 *   Dashboard → Create Portfolio → Upload assets → "Create Portfolio" button → THIS PAGE
 *
 * Captures the full portfolio config (name, type, pages, sections)
 * On submit: redirects to next step (Batch 2: DNA generation)
 */

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PortfolioWizard } from '@/components/portfolio-wizard/PortfolioWizard'
import { useAuthStore } from '@/store/auth'

export default function PortfolioWizardPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const projectId = params.id as string

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/signin')
    }
  }, [isAuthenticated, router])

  const handleWizardComplete = (configId: string) => {
    // Batch 2 will use this configId to generate the DNA-based portfolio
    // For now, redirect to existing portfolio generation flow
    router.push(`/dashboard/project/${projectId}/generate`)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-subtle">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-light">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-subtle">
      <PortfolioWizard
        projectId={projectId}
        onComplete={handleWizardComplete}
      />
    </div>
  )
}
