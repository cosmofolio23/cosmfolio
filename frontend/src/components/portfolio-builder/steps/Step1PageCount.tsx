'use client'

export function Step1PageCount({ totalPages, onSetTotal }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">How many pages total?</h3>
        <p className="text-gray-600 mb-6">Include cover, contents, projects, about, and any extras</p>
      </div>
      <div className="flex items-center gap-6">
        <input type="number" min="4" max="50" value={totalPages} onChange={(e) => onSetTotal(parseInt(e.target.value))} className="text-4xl font-bold w-32 px-4 py-2 border-b-2 border-blue-500 focus:outline-none" />
        <span className="text-xl text-gray-600">pages</span>
      </div>
      <div className="text-sm text-gray-500">Recommended: 8-20 pages</div>
    </div>
  )
}
