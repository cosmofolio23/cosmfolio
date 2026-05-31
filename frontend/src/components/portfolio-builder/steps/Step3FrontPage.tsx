'use client'

export function Step3FrontPage({ layout, content, onSetLayout, onSetContent }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold">Design your front cover</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2">Title</label>
          <input type="text" value={content.title} onChange={(e) => onSetContent({ title: e.target.value })} className="w-full px-4 py-2 border rounded" placeholder="Portfolio Title" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">Subtitle</label>
          <input type="text" value={content.subtitle} onChange={(e) => onSetContent({ subtitle: e.target.value })} className="w-full px-4 py-2 border rounded" placeholder="Your Name / Role" />
        </div>
      </div>
    </div>
  )
}
