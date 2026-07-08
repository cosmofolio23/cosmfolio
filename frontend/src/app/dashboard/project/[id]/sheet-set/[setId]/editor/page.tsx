'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { apiClient } from '@/lib/api'
import { SheetSetEditor } from '@/components/sheetSet/SheetSetEditor'
import type { SheetSet } from '@/components/sheetSet/sheetSetTypes'
import DesktopOnlyLock from '@/components/DesktopOnlyLock'

/**
 * Sheet Set Editor Page
 *
 * Professional architectural sheet set composer
 * Handles Thesis, Competition, and Studio submission packages
 */
export default function SheetSetEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const projectId = params.id as string
  const setId = params.setId as string
  const [sheetSet, setSheetSet] = useState<SheetSet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/signin')
      return
    }

    // Load sheet set from API (apiClient adds the auth token + /api base)
    const loadSheetSet = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get(`/api/projects/${projectId}/sheet-sets/${setId}`)
        setSheetSet(response.data)
      } catch (err: any) {
        setError(err?.response?.status === 404 ? 'Sheet set not found' : 'Failed to load sheet set')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadSheetSet()
  }, [projectId, setId, isAuthenticated])

  const handleSave = async (updatedSet: SheetSet) => {
    try {
      await apiClient.put(`/api/projects/${projectId}/sheet-sets/${setId}`, updatedSet)
      setSheetSet(updatedSet)
    } catch (err) {
      console.error('Save failed:', err)
    }
  }

  const handleExport = async (html: string, currentSet: SheetSet) => {
    try {
      const response = await apiClient.post(
        `/api/projects/${projectId}/sheet-sets/${setId}/export`,
        {
          html,
          page_size: currentSet.sheetSize,
          orientation: currentSet.orientation,
        },
        { responseType: 'blob' }
      )
      
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentSet.projectName}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to export PDF')
    }
  }

  const handleAICommand = async (cmd: string, payload: any) => {
    try {
      if (cmd === 'auto-fill-assets') {
        const response = await apiClient.post(
          `/api/projects/${projectId}/sheet-sets/${setId}/auto-fill`,
          { sheetSet: payload }
        )
        return response.data
      } else {
        const response = await apiClient.post(
          `/api/projects/${projectId}/sheet-sets/${setId}/ai-compose`,
          {
            command: cmd,
            sheet: payload,
          }
        )
        return response.data
      }
    } catch (err) {
      console.error('AI Command failed:', err)
      alert('AI Composition failed')
      return null
    }
  }

  const isComposerAdmin = user?.email?.trim().toLowerCase() === 'boseraj001@gmail.com'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          <p className="mt-4 text-gray-600">Loading sheet set...</p>
        </div>
      </div>
    )
  }

  if (!isComposerAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-6 text-center">
        <div className="bg-gray-800 p-8 rounded-2xl max-w-md border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-in fade-in duration-200">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-300 mb-6 text-sm">
            The Sheet Composer is restricted to authorized administrative users only.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-[#D4AF37] hover:bg-[#b8952d] text-gray-950 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <DesktopOnlyLock />
      <SheetSetEditor
        initialSheetSet={sheetSet!}
        onSave={handleSave}
        onExport={handleExport}
        onAICommand={handleAICommand}
        onClose={() => router.push(`/dashboard/project/${projectId}/sheet-set`)}
      />
    </>
  )
}
