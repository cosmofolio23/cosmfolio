'use client'

export function Step2ProjectCount({ projectCount, onSetCount }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">How many projects?</h3>
        <p className="text-gray-600 mb-6">Featured projects to showcase your best work</p>
      </div>
      <div className="flex items-center gap-6">
        <input type="number" min="1" max="20" value={projectCount} onChange={(e) => onSetCount(parseInt(e.target.value))} className="text-4xl font-bold w-32 px-4 py-2 border-b-2 border-blue-500 focus:outline-none" />
        <span className="text-xl text-gray-600">projects</span>
      </div>
      <div className="text-sm text-gray-500">Recommended: 3-8 projects</div>
    </div>
  )
}
