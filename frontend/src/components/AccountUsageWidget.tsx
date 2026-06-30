'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AccountUsageWidget() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const API_URL = (typeof window !== 'undefined' && process.env.NODE_ENV === 'production' ? '/backend-proxy' : (process.env.NEXT_PUBLIC_API_URL || 'https://cosmfolio-production.up.railway.app'))
        const token = localStorage.getItem('auth_token')
        if (!token) return

        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        if (data && data.user) {
          setUser(data.user)
        }
      } catch (e) {
        console.error("Failed to fetch user limits", e)
      }
    }
    fetchUser()
  }, [])

  if (!user) return null

  const isPro = user.plan_type === 'pro' || user.is_pro
  const boostCount = user.boost_pack_count || 0
  const maxPages = isPro ? 30 + (boostCount * 20) : 6
  const maxDownloads = isPro ? 2 + (boostCount * 2) : 2
  const usedDownloads = user.export_count || 0

  return (
    <div className="mb-10 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${isPro ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>
          {isPro ? '🚀' : '🌱'}
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900">
            CosmoFolio {isPro ? 'Pro' : 'Free'}
          </h3>
          <p className="text-sm text-gray-500">
            {isPro ? 'Unlimited portfolios unlocked.' : 'Upgrade to Pro for unlimited pages.'}
          </p>
        </div>
      </div>
      
      <div className="flex gap-8">
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Max Pages</div>
          <div className="font-medium text-gray-900">
            {maxPages} per portfolio
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Downloads</div>
          <div className="font-medium text-gray-900">
            {usedDownloads} / {maxDownloads} used
          </div>
        </div>
        {boostCount > 0 && (
          <div>
            <div className="text-xs font-semibold text-yellow-600 uppercase tracking-wider mb-1">Boost Packs</div>
            <div className="font-medium text-gray-900">{boostCount} Active</div>
          </div>
        )}
        <div className="flex items-center justify-center">
          <Link href="/pricing" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
            Upgrade
          </Link>
        </div>
      </div>
    </div>
  )
}
