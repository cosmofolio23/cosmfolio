'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { apiClient } from '@/lib/api'
import { SheetSetEditor } from '@/components/sheetSet/SheetSetEditor'
import type { SheetSet } from '@/components/sheetSet/sheetSetTypes'

/**
 * Sheet Set Editor Page
 *
 * Professional architectural sheet set composer
 * Handles Thesis, Competition, and Studio submission packages
 */
export default function SheetSetEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
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
    <SheetSetEditor
      initialSheetSet={sheetSet!}
      onSave={handleSave}
      onClose={() => router.push(`/dashboard/project/${projectId}/sheet-set`)}
    />
  )
}
