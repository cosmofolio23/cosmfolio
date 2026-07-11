'use client'

export function Step1PageCount({ totalPages, onSetTotal, pageFormat = 'pages', onSetFormat }: any) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold mb-2">How many pages total?</h3>
        <p className="text-gray-600 mb-6">Include cover, contents, projects, about, and any extras</p>
      </div>
      
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-6">
          <input type="number" min="4" max="50" value={totalPages} onChange={(e) => onSetTotal(parseInt(e.target.value))} className="text-4xl font-bold w-32 px-4 py-2 border-b-2 border-blue-500 focus:outline-none" />
          <span className="text-xl text-gray-600">{pageFormat === 'spreads' ? 'spreads' : 'pages'}</span>
        </div>
        <div className="text-sm text-gray-500">Recommended: 8-20 {pageFormat === 'spreads' ? 'spreads' : 'pages'}</div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <h4 className="text-lg font-semibold mb-4">Portfolio Format</h4>
        <div className="flex gap-4">
          <button
            onClick={() => onSetFormat?.('pages')}
            className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${pageFormat === 'pages' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
          >
            <div className="font-bold text-gray-900 mb-1">Single Pages</div>
            <div className="text-sm text-gray-500">Standard view, great for digital screens and PDFs.</div>
          </button>
          <button
            onClick={() => onSetFormat?.('spreads')}
            className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${pageFormat === 'spreads' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
          >
            <div className="font-bold text-gray-900 mb-1">Two-Page Spreads</div>
            <div className="text-sm text-gray-500">Side-by-side view, perfect for physical books and wide screens.</div>
          </button>
        </div>
      </div>
    </div>
  )
}
