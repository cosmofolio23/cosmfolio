'use client'

/** "My Templates" — user-saved custom templates (localStorage), shown with the
 *  same realistic TemplateSpread preview and openable in the editor. */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TemplateSpread from './TemplateSpread'

interface MyTemplate {
  id: string
  name: string
  savedAt: string
  colors?: Record<string, string>
  fonts?: Record<string, string>
  layouts?: any
  placeholders?: any
}

const KEY = 'cosmofolio_my_templates'

export default function MyTemplatesGrid() {
  const router = useRouter()
  const [items, setItems] = useState<MyTemplate[]>([])

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) || '[]')) } catch { setItems([]) }
  }, [])

  const remove = (id: string) => {
    const next = items.filter(t => t.id !== id)
    setItems(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }

  if (!items.length) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-border-light rounded-xl">
        <div className="text-5xl mb-3 opacity-30">⭐</div>
        <h3 className="text-h4 text-text-primary dark:text-dark-text-primary mb-1">No saved templates yet</h3>
        <p className="text-body-sm text-text-secondary dark:text-dark-text-secondary">
          Open any template, customize it, then hit <b>⭐ Save Template</b> in the editor — it lands here.
        </p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map(t => (
        <div key={t.id} className="card overflow-hidden flex flex-col">
          <div className="h-48 overflow-hidden border-b border-border-light">
            <TemplateSpread template={t as any} />
          </div>
          <div className="p-5 flex-1 flex flex-col">
            <h3 className="text-h4 text-text-primary dark:text-dark-text-primary font-semibold">{t.name}</h3>
            <p className="text-[11px] text-text-secondary dark:text-dark-text-secondary mb-4">
              Saved {new Date(t.savedAt).toLocaleDateString()}
            </p>
            <div className="flex gap-2 mt-auto">
              <button
                onClick={() => router.push(`/dashboard/templates/${t.id}/editor`)}
                className="flex-1 bg-primary text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition">
                Open
              </button>
              <button
                onClick={() => remove(t.id)}
                className="px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition" title="Delete">
                🗑
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
