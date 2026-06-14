'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Eye } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { apiClient } from '@/lib/api'
import { SheetSetWizard } from '@/components/sheetSet/SheetSetWizard'
import { SHEET_SET_TEMPLATES } from '@/components/sheetSet/sheetSetTemplates'
import { buildEmptySheetSet } from '@/lib/buildSheetSet'
import { buildSheetSetFromSelection } from '@/components/sheetSet/sheetTypeLayouts'
import { peekSheetImage, type SheetImageHandoff } from '@/lib/sheetHandoff'
import type { SheetSet } from '@/components/sheetSet/sheetSetTypes'

/**
 * Sheet Set Gallery Page
 *
 * Browse existing sheet sets and create new ones
 */
export default function SheetSetGalleryPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const projectId = params.id as string

  const [sheetSets, setSheetSets] = useState<SheetSet[]>([])
  const [loading, setLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [handoff, setHandoff] = useState<SheetImageHandoff | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/signin')
      return
    }

    setHandoff(peekSheetImage())
    loadSheetSets()
  }, [projectId, isAuthenticated])

  const loadSheetSets = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/api/projects/${projectId}/sheet-sets`)
      setSheetSets(response.data || [])
    } catch (err) {
      console.error('Failed to load sheet sets:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSheetSet = async (config: any) => {
    try {
      let data: SheetSet
      if (config.selections?.length) {
        // new flow: size → sheet types → layout pack → info
        data = buildSheetSetFromSelection(config)
      } else {
        // legacy flow: fixed template pack
        const template = SHEET_SET_TEMPLATES.find(t => t.id === config.selectedTemplate)
        if (!template) return
        data = buildEmptySheetSet(template, { name: config.projectName || template.name })
      }
      const res = await apiClient.post(`/api/projects/${projectId}/sheet-sets`, {
        name: config.projectName || 'Sheet Set',
        data,
      })
      router.push(`/dashboard/project/${projectId}/sheet-set/${res.data.id}/editor`)
    } catch (err) {
      console.error('Failed to create sheet set:', err)
    }
  }

  const handleDelete = async (setId: string) => {
    if (!confirm('Delete this sheet set? This cannot be undone.')) return
    try {
      setDeleting(setId)
      await apiClient.delete(`/api/projects/${projectId}/sheet-sets/${setId}`)
      setSheetSets(prev => prev.filter(s => s.id !== setId))
    } catch (err) {
      console.error('Failed to delete:', err)
    } finally {
      setDeleting(null)
    }
  }

  if (showWizard) {
    return (
      <SheetSetWizard
        onComplete={handleCreateSheetSet}
        onCancel={() => setShowWizard(false)}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-600">Loading sheet sets...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sheet Sets</h1>
              <p className="mt-2 text-gray-600">Professional architectural submission packages</p>
            </div>
            <button
              onClick={() => setShowWizard(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Plus size={20} /> New Sheet Set
            </button>
          </div>
        </div>
      </div>

      {/* Pending handoff image from a studio tool */}
      {handoff && (
        <div className="max-w-7xl mx-auto px-4 pt-6 sm:px-6 lg:px-8">
          <div className="bg-[#FBE7A1]/30 border border-[#D4AF37]/40 rounded-xl px-4 py-3 flex items-center gap-4">
            <img src={handoff.dataUrl} alt={handoff.name} className="w-16 h-16 object-contain rounded border border-[#D4AF37]/30 bg-white" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#9C7416]">Image ready from {handoff.source}</p>
              <p className="text-xs text-[#9C7416]/80 truncate">
                Create or open a sheet set below — then click <b>“＋ Add to this sheet”</b> in the editor to place it.
              </p>
            </div>
            <button
              onClick={() => setShowWizard(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-br from-[#D4AF37] to-[#9C7416] hover:brightness-105 whitespace-nowrap"
            >
              + New Sheet Set
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {sheetSets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sheet Sets Yet</h3>
            <p className="text-gray-600 mb-6">Create your first architectural submission package</p>
            <button
              onClick={() => setShowWizard(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Plus size={20} /> Create Sheet Set
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sheetSets.map(set => (
              <div
                key={set.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden border border-gray-200"
              >
                {/* Card Header */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-[#FBE7A1]/30 to-[#D4AF37]/15">
                  <h3 className="font-semibold text-gray-900 text-lg">{set.projectName}</h3>
                  <p className="text-xs text-gray-600 mt-1 capitalize">{set.submissionType}</p>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-gray-600">Sheets</p>
                      <p className="font-semibold text-gray-900">{set.sheets.length}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-gray-600">Size</p>
                      <p className="font-semibold text-gray-900 font-mono">{set.sheetSize}</p>
                    </div>
                  </div>

                  {/* Elements count */}
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>
                      📋 {set.sheets.reduce((sum, s) => sum + s.elements.length, 0)} total elements
                    </p>
                    <p>📐 {set.sheetSize} {set.orientation}</p>
                    <p>📅 Modified {new Date(set.updatedAt).toLocaleDateString()}</p>
                  </div>

                  {/* Info */}
                  {set.studentName && (
                    <p className="text-xs text-gray-600">
                      👤 {set.studentName}
                      {set.collegeName ? ` • ${set.collegeName}` : ''}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="px-4 py-3 border-t border-gray-200 flex gap-2">
                  <button
                    onClick={() =>
                      router.push(`/dashboard/project/${projectId}/sheet-set/${set.id}/editor`)
                    }
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-sm font-medium"
                  >
                    <Edit2 size={16} /> Edit
                  </button>

                  <button
                    onClick={() => {
                      // Open preview
                      window.open(
                        `/dashboard/project/${projectId}/sheet-set/${set.id}/preview`,
                        '_blank'
                      )
                    }}
                    className="px-3 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition text-sm"
                    title="Preview"
                  >
                    <Eye size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(set.id)}
                    disabled={deleting === set.id}
                    className="px-3 py-2 text-red-600 border border-red-300 rounded hover:bg-red-50 transition text-sm disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Templates Reference */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SHEET_SET_TEMPLATES.map(template => (
            <div key={template.id} className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
              <p className="text-sm text-gray-600 mt-2">{template.description}</p>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium text-gray-900">{template.sheetCount}</span> sheets
                </p>
                <div className="flex gap-4 text-xs">
                  <span>📄 {template.requirements.plans} plans</span>
                  <span>🎨 {template.requirements.renders} renders</span>
                  <span>📊 {template.requirements.diagrams} diagrams</span>
                </div>
              </div>

              <button
                onClick={() => setShowWizard(true)}
                className="mt-4 w-full px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-sm font-medium"
              >
                Create {template.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
