/**
 * Library Outputs — portfolios + sheet sets generated from this project.
 * Shows the "feeds both" concept: one project → multiple outputs.
 */

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ImageIcon, FileText, Loader2, ExternalLink } from 'lucide-react'
import { apiClient } from '@/lib/api'

interface Output {
  id: string
  type: 'portfolio' | 'sheet-set'
  name: string
  projectId: string
  pages?: number
  sheets?: number
  createdAt: string
}

interface LibraryOutputsProps {
  libraryProjectId: string
}

export function LibraryOutputs({ libraryProjectId }: LibraryOutputsProps) {
  const [outputs, setOutputs] = useState<Output[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        // fetch portfolios linked to this library project
        const pRes = await apiClient.get(`/api/portfolios?library_project_id=${libraryProjectId}`).catch(() => ({ data: { portfolios: [] } }))
        const portfolios: Output[] = ((pRes.data?.portfolios) || []).map((p: any) => ({
          id: p.id,
          type: 'portfolio',
          name: p.name || 'Untitled Portfolio',
          projectId: p.project_id,
          pages: p.page_count || 0,
          createdAt: p.created_at,
        }))

        // fetch sheet-sets linked to this library project
        const sRes = await apiClient.get(`/api/sheet-sets?library_project_id=${libraryProjectId}`).catch(() => ({ data: [] }))
        const sheets: Output[] = (sRes.data || []).map((s: any) => ({
          id: s.id,
          type: 'sheet-set',
          name: s.name || 'Untitled Sheet Set',
          projectId: s.project_id,
          sheets: s.sheet_count || 0,
          createdAt: s.created_at,
        }))

        setOutputs([...portfolios, ...sheets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      } catch (e) {
        console.error('Failed to load outputs:', e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [libraryProjectId])

  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 size={14} className="animate-spin" /> Loading outputs…</div>
  }

  if (outputs.length === 0) {
    return <div className="text-sm text-gray-500">No outputs yet. Click "Generate Portfolio" or "Generate Sheets" above.</div>
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700">Generated from this project</h3>
      <div className="space-y-1.5">
        {outputs.map(o => (
          <Link
            key={o.id}
            href={
              o.type === 'portfolio'
                ? `/dashboard/project/${o.projectId}/portfolio/${o.id}`
                : `/dashboard/project/${o.projectId}/sheet-set/${o.id}/editor`
            }
            className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition text-sm"
          >
            {o.type === 'portfolio' ? (
              <>
                <ImageIcon size={16} className="text-green-600 flex-shrink-0" />
                <span className="flex-1 font-medium text-gray-800">{o.name}</span>
                <span className="text-xs text-gray-500">{o.pages} pages</span>
              </>
            ) : (
              <>
                <FileText size={16} className="text-amber-600 flex-shrink-0" />
                <span className="flex-1 font-medium text-gray-800">{o.name}</span>
                <span className="text-xs text-gray-500">{o.sheets} sheets</span>
              </>
            )}
            <ExternalLink size={14} className="text-gray-400 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
