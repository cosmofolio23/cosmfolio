'use client'

import { useState } from 'react'

export function PortfolioViewer({ pages, tokens }: any) {
  const [currentPage, setCurrentPage] = useState(0)

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col">
      {/* Page Display */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-3xl aspect-video bg-white shadow-2xl">
          {pages?.[currentPage]}
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-t p-4 flex items-center justify-between">
        <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className="px-6 py-2 bg-gray-300 rounded disabled:opacity-50">
          Previous
        </button>
        <div className="text-sm text-gray-600">
          Page {currentPage + 1} of {pages?.length}
        </div>
        <button onClick={() => setCurrentPage(Math.min(pages?.length - 1, currentPage + 1))} disabled={currentPage === pages?.length - 1} className="px-6 py-2 bg-blue-500 text-white rounded disabled:opacity-50">
          Next
        </button>
      </div>
    </div>
  )
}
