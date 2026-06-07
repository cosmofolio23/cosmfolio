'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import SheetEditor from '@/components/SheetEditor/SheetEditor'

/**
 * Advanced canvas sheet editor route. Renders the WYSIWYG SheetEditor with a
 * working client-side export (html2canvas → PNG, or print → PDF), since the
 * sheets backend export is not yet implemented.
 */
export default function SheetEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const projectId = params.id as string
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) { router.push('/signin'); return }
    setReady(true)
  }, [isAuthenticated])

  const handleExport = async (format: 'pdf' | 'png') => {
    const node = document.querySelector('.se-canvas') as HTMLElement | null
    if (!node) { alert('Canvas is not ready yet.'); return }
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(node, { useCORS: true, scale: 2, backgroundColor: '#ffffff', logging: false })
      if (format === 'png') {
        canvas.toBlob(b => {
          if (!b) { alert('Export failed — try again.'); return }
          const u = URL.createObjectURL(b)
          const a = document.createElement('a'); a.href = u; a.download = 'sheet.png'; a.click()
          setTimeout(() => URL.revokeObjectURL(u), 1500)
        }, 'image/png')
      } else {
        const img = canvas.toDataURL('image/png')
        const w = window.open('', '_blank')
        if (!w) { alert('Please allow pop-ups to export as PDF.'); return }
        w.document.write(`<!DOCTYPE html><html><head><title>Sheet</title><style>@page{margin:0}body{margin:0}img{width:100%;display:block}</style></head><body><img src="${img}"/></body></html>`)
        w.document.close()
        w.onload = () => setTimeout(() => { w.focus(); w.print() }, 400)
      }
    } catch (e) {
      console.error('Sheet export failed:', e)
      alert('Export ran into a cross-origin image issue. Remove external images or try PNG.')
    }
  }

  if (!ready) return null

  return (
    <SheetEditor
      sheetId={`sheet_${projectId}`}
      projectId={projectId}
      onExport={handleExport}
      onClose={() => router.push(`/dashboard/project/${projectId}/sheet`)}
    />
  )
}
