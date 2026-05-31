'use client'

export function Step4BackPage({ content, onSetContent }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold">Back page / Contact</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2">Email</label>
          <input type="email" value={content.contactEmail || ''} onChange={(e) => onSetContent({ contactEmail: e.target.value })} className="w-full px-4 py-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">Website</label>
          <input type="url" value={content.website || ''} onChange={(e) => onSetContent({ website: e.target.value })} className="w-full px-4 py-2 border rounded" />
        </div>
        <div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={content.qrCode || false} onChange={(e) => onSetContent({ qrCode: e.target.checked })} />
            <span>Add QR Code</span>
          </label>
        </div>
      </div>
    </div>
  )
}
