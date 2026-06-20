'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import Logo from '@/components/Logo'

interface UserRecord {
  id: string
  email: string
  name?: string
  college_name?: string
  state?: string
  year_of_passing?: string
  stream?: string
  export_count: number
  created_at: string
}

export default function AdminDashboard() {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()
  
  const [users, setUsers] = useState<UserRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const isAdmin = user?.email === 'boseraj001@gmail.com'

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/signin')
      return
    }

    if (!isAdmin) {
      router.push('/dashboard')
      return
    }

    fetchUsers()
  }, [isAuthenticated, isAdmin, router])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const API_URL = process.env.NODE_ENV === 'production'
        ? 'https://cosmfolio-backend.onrender.com'
        : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')

      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/api/auth/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      })

      if (!res.ok) {
        throw new Error(await res.text() || 'Failed to fetch user list')
      }

      const data = await res.json()
      setUsers(data)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while loading signups')
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const total = users.length
    const totalExports = users.reduce((acc, curr) => acc + (curr.export_count || 0), 0)
    const activeExporters = users.filter(u => u.export_count > 0).length
    const latestSignup = users[0] ? users[0].email : 'N/A'

    return { total, totalExports, activeExporters, latestSignup }
  }, [users])

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users
    const lower = searchTerm.toLowerCase()
    return users.filter(u => 
      (u.name || '').toLowerCase().includes(lower) ||
      u.email.toLowerCase().includes(lower) ||
      (u.college_name || '').toLowerCase().includes(lower) ||
      (u.stream || '').toLowerCase().includes(lower) ||
      (u.state || '').toLowerCase().includes(lower)
    )
  }, [users, searchTerm])

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#07070A] flex flex-col justify-center items-center text-white">
        <Logo size="lg" variant="gold" />
        <h1 className="text-2xl font-bold mt-4">Access Denied</h1>
        <p className="text-stone-light text-sm mt-2">You do not have administrative privileges.</p>
        <Link href="/dashboard" className="btn-primary mt-6">
          Return to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary dark:bg-dark-bg-primary relative overflow-hidden text-text-primary dark:text-dark-text-primary pb-20">
      {/* Background decorations */}
      <div className="fixed top-20 -left-20 w-96 h-96 bg-accent-primary/10 dark:bg-accent-gold/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="fixed bottom-20 -right-20 w-80 h-80 bg-accent-gold/10 dark:bg-accent-primary/10 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Header */}
      <header className="glass-nav shadow-elevation-1 sticky top-0 z-40">
        <div className="container-centered py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Logo size="md" variant="gold" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Admin <span className="text-gold-gradient">Dashboard</span></h1>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-1">CosmoFolio Platform Analytics</p>
            </div>
          </div>
          <Link href="/dashboard" className="btn-secondary btn-small">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="container-centered py-10 relative z-10">
        
        {/* Stats Cards Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-10">
          {[
            {
              title: "Total Signups",
              val: stats.total,
              desc: "Registered user accounts",
              icon: (
                <svg className="w-6 h-6 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              )
            },
            {
              title: "PDF Exports Triggered",
              val: stats.totalExports,
              desc: "Total generated PDF files",
              icon: (
                <svg className="w-6 h-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              )
            },
            {
              title: "Active Exporters",
              val: stats.activeExporters,
              desc: "Users who downloaded >= 1 PDF",
              icon: (
                <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )
            },
            {
              title: "Latest Registration",
              val: stats.total > 0 ? (users[0]?.name || users[0]?.email || 'N/A').slice(0, 18) : 'N/A',
              desc: users[0] ? new Date(users[0].created_at).toLocaleDateString() : 'No signups yet',
              icon: (
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )
            }
          ].map((card, i) => (
            <div key={i} className="glass-card p-6 rounded-2xl border border-white/20 dark:border-white/5 shadow-md flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 flex-shrink-0">
                {card.icon}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">{card.title}</h3>
                <div className="text-2xl font-bold mt-1 text-text-primary dark:text-dark-text-primary">{card.val}</div>
                <p className="text-xxs text-text-secondary dark:text-dark-text-secondary mt-0.5">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* User Management Section */}
        <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/20 dark:border-white/5 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold">Registered Users ({filteredUsers.length})</h2>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary">View demographic data and platform usage metrics</p>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search by name, email, college, state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary dark:text-dark-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-20 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-accent-gold border-t-transparent animate-spin"></div>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary">Retrieving user roster...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <div className="bg-red-500/10 text-red-500 rounded-xl p-4 inline-block max-w-md border border-red-500/20 text-sm">
                ❌ {error}
              </div>
              <button onClick={fetchUsers} className="btn-secondary btn-small block mx-auto mt-4">
                Retry Fetch
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20 text-text-secondary dark:text-dark-text-secondary">
              No users found matching your search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/10 text-text-secondary dark:text-dark-text-secondary font-semibold">
                    <th className="py-4 px-3">Name / Email</th>
                    <th className="py-4 px-3">College & Stream</th>
                    <th className="py-4 px-3">Location</th>
                    <th className="py-4 px-3 text-center">Grad Year</th>
                    <th className="py-4 px-3 text-center">Exports Used</th>
                    <th className="py-4 px-3">Registration Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {filteredUsers.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/20 transition-colors">
                      <td className="py-4 px-3">
                        <div className="font-bold text-text-primary dark:text-dark-text-primary">{item.name || "Anonymous User"}</div>
                        <div className="text-xs text-text-secondary dark:text-dark-text-secondary">{item.email}</div>
                      </td>
                      <td className="py-4 px-3">
                        <div className="max-w-[240px] truncate font-medium">{item.college_name || "—"}</div>
                        <div className="text-xs text-text-secondary dark:text-dark-text-secondary">{item.stream || "—"}</div>
                      </td>
                      <td className="py-4 px-3">
                        <div>{item.state || "—"}</div>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className="bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-md text-xs font-semibold">
                          {item.year_of_passing || "—"}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          item.export_count >= 3 
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                            : item.export_count > 0
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        }`}>
                          {item.export_count} / 3
                        </span>
                      </td>
                      <td className="py-4 px-3 text-xs text-text-secondary dark:text-dark-text-secondary">
                        {new Date(item.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
