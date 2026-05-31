'use client'

export function Step6Contents({ enabled, style, onSetEnabled, onSetStyle }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold">Contents Page</h3>
      <label className="flex items-center gap-2 text-lg">
        <input type="checkbox" checked={enabled} onChange={(e) => onSetEnabled(e.target.checked)} />
        <span>Include contents/index page</span>
      </label>
      {enabled && (
        <div>
          <label className="block text-sm font-bold mb-2">Style</label>
          <select value={style} onChange={(e) => onSetStyle(e.target.value)} className="w-full px-4 py-2 border rounded">
            <option value="minimal">Minimal List</option>
            <option value="numbered">Numbered</option>
            <option value="visual">Visual Grid</option>
          </select>
        </div>
      )}
    </div>
  )
}
