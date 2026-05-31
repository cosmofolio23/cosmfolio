'use client'

import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface DesignSystem {
  id: string
  name: string
  colors: {
    primary: string
    secondary: string
    [key: string]: string
  }
}

interface Layout {
  id: string
  name: string
  category: string
  components?: string[]
}

export default function PortfolioPage() {
  const [designSystems, setDesignSystems] = useState<DesignSystem[]>([])
  const [layouts, setLayouts] = useState<Layout[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dsRes, layoutRes] = await Promise.all([
          fetch(`${API_URL}/api/design-systems`),
          fetch(`${API_URL}/api/layouts`)
        ])

        if (dsRes.ok) {
          const ds = await dsRes.json()
          setDesignSystems(ds)
        }

        if (layoutRes.ok) {
          const l = await layoutRes.json()
          setLayouts(l)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading portfolio builder...</p>
        </div>
      </div>
    )
  }

  const categories = ['cover', 'project', 'about']

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 text-gray-900">Select Layouts</h1>
          <p className="text-lg text-gray-600">Step 3 of 6: Choose layout for each page type</p>
        </div>

        {categories.map(category => {
          const categoryLayouts = layouts.filter(l => l.category === category)

          return (
            <div key={category} className="mb-16">
              <h2 className="text-3xl font-bold mb-6 capitalize text-gray-800">
                {category} Layouts
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {categoryLayouts.map((layout, idx) => {
                  const ds = designSystems[idx % designSystems.length] || designSystems[0]
                  const primary = ds?.colors?.primary || '#0066FF'
                  const secondary = ds?.colors?.secondary || '#6B7280'

                  return (
                    <div
                      key={layout.id}
                      className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                    >
                      <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow">
                        {/* Visual Preview with Gradient */}
                        <div
                          className="h-32 flex items-center justify-center text-white font-bold text-center p-4 relative overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`
                          }}
                        >
                          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
                          <div className="relative z-10">
                            <div className="text-xs font-semibold mb-2 opacity-90 uppercase tracking-wider">
                              {category}
                            </div>
                            <div className="text-lg font-bold">{layout.name}</div>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 mb-2 text-sm">{layout.name}</h3>
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {(layout.components || []).join(', ') || 'Layout components'}
                          </p>

                          {/* Design System Indicator */}
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: primary }}
                              ></div>
                              <span className="text-xs text-gray-600">{ds?.name || 'Design System'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Status Box */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8 border-l-4 border-blue-600">
          <h3 className="text-2xl font-bold mb-4 text-gray-900">✅ System Status</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Design Systems</p>
              <p className="text-3xl font-bold text-blue-600">{designSystems.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Layouts</p>
              <p className="text-3xl font-bold text-blue-600">{layouts.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Categories</p>
              <p className="text-3xl font-bold text-blue-600">{categories.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
