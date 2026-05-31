'use client'

export function Step5Resume({ enabled, content, onSetEnabled, onSetContent }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold">Resume / About Page</h3>
      <label className="flex items-center gap-2 text-lg">
        <input type="checkbox" checked={enabled} onChange={(e) => onSetEnabled(e.target.checked)} />
        <span>Include resume/about page</span>
      </label>
      {enabled && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">Name</label>
            <input type="text" value={content.name || ''} onChange={(e) => onSetContent({ name: e.target.value })} className="w-full px-4 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Bio</label>
            <textarea value={content.bio || ''} onChange={(e) => onSetContent({ bio: e.target.value })} rows={4} className="w-full px-4 py-2 border rounded" />
          </div>
        </div>
      )}
    </div>
  )
}
