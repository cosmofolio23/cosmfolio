'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
          
        const res = await fetch(`${API_URL}/api/ambassadors/leaderboard`)
        if (res.ok) {
          const data = await res.json()
          setLeaders(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Ambassador Leaderboard 🏆</h1>
            <p className="text-xl text-gray-600">The top creators sharing CosmoFolio with the world.</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-500">Loading top ambassadors...</div>
            ) : leaders.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No ambassadors have made sales yet. Be the first!</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-sm uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Ambassador</th>
                    <th className="px-6 py-4">Tier</th>
                    <th className="px-6 py-4 text-right">Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaders.map((leader, i) => (
                    <tr key={i} className={i < 3 ? "bg-accent-gold/5" : ""}>
                      <td className="px-6 py-4 font-bold text-gray-400">
                        {i === 0 ? '🥇 1' : i === 1 ? '🥈 2' : i === 2 ? '🥉 3' : i + 1}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">{leader.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${
                          leader.tier === 'creator' ? 'bg-purple-100 text-purple-700' : 
                          leader.tier === 'campus' ? 'bg-blue-100 text-blue-700' : 
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {leader.tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-right text-gray-900">{leader.sales}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="mt-12 text-center">
            <h3 className="text-xl font-bold mb-4">Want to join the leaderboard?</h3>
            <p className="text-gray-600 mb-6">Earn up to 30% commission and give your followers a 25% discount.</p>
            <Link href="/dashboard/ambassador" className="btn-primary py-3 px-8 text-lg">
              Become an Ambassador
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
