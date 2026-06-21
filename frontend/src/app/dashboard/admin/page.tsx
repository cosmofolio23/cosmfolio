'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { auth } from '@/lib/firebase'
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
  is_pro?: boolean
  created_at: string
}

interface CouponRecord {
  id: string
  code: string
  discount_type: string
  max_uses: number
  used_count: number
  expires_at: string | null
  created_at: string
}

export default function AdminDashboard() {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<'users' | 'coupons'>('users')
  
  const [users, setUsers] = useState<UserRecord[]>([])
  const [coupons, setCoupons] = useState<CouponRecord[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [searchTerm, setSearchTerm] = useState('')
  
  // New coupon form state
  const [newCouponCode, setNewCouponCode] = useState('')
  const [newCouponMaxUses, setNewCouponMaxUses] = useState(100)
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false)

  const isAdmin = user?.email === 'boseraj001@gmail.com'
  
  const API_URL = process.env.NODE_ENV === 'production'
    ? 'https://cosmfolio-backend.onrender.com'
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/signin')
      return
    }

    if (!isAdmin) {
      router.push('/dashboard')
      return
    }

    fetchData()
  }, [isAuthenticated, isAdmin, router])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Always force-refresh the Firebase token — localStorage token expires after 1 hour
      let token = localStorage.getItem('auth_token')
      try {
        if (auth.currentUser) {
          token = await auth.currentUser.getIdToken(true)
          localStorage.setItem('auth_token', token)
          useAuthStore.getState().setToken(token)
        }
      } catch { /* use existing token as fallback */ }

      const headers = { 'Authorization': `Bearer ${token || ''}` }

      const [usersRes, couponsRes] = await Promise.all([
        fetch(`${API_URL}/api/auth/admin/users`, { headers }),
        fetch(`${API_URL}/api/admin/coupons`, { headers })
      ])

      if (!usersRes.ok) {
        const body = await usersRes.text()
        throw new Error(`Failed to fetch user list (${usersRes.status}): ${body}`)
      }
      const usersData = await usersRes.json()
      setUsers(usersData)
      
      if (couponsRes.ok) {
        const couponsData = await couponsRes.json()
        setCoupons(couponsData)
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while loading data')
    } finally {
      setIsLoading(false)
    }
  }

  // --- Admin Actions for Users ---
  const handleResetExports = async (userId: string) => {
    if (!confirm("Are you sure you want to reset this user's export count to 0?")) return
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/api/auth/admin/users/${userId}/reset-exports`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token || ''}` }
      })
      if (!res.ok) throw new Error(await res.text())
      // Optimistic update
      setUsers(users.map(u => u.id === userId ? { ...u, export_count: 0 } : u))
    } catch (err: any) {
      alert(err.message || 'Failed to reset exports')
    }
  }

  const handleTogglePro = async (userId: string, currentProStatus: boolean) => {
    const action = currentProStatus ? 'downgrade' : 'upgrade'
    const confirmMsg = currentProStatus 
      ? 'Downgrade user to Free tier?' 
      : 'Upgrade user to Pro tier (unlimited exports)?'
      
    if (!confirm(confirmMsg)) return
    
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/api/auth/admin/users/${userId}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token || ''}` }
      })
      if (!res.ok) throw new Error(await res.text())
      // Optimistic update
      setUsers(users.map(u => u.id === userId ? { ...u, is_pro: !currentProStatus } : u))
    } catch (err: any) {
      alert(err.message || `Failed to ${action} user`)
    }
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`CRITICAL WARNING: Are you sure you want to permanently delete user ${email}? This will delete all their data and cannot be undone.`)) return
    
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/api/auth/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token || ''}` }
      })
      if (!res.ok) throw new Error(await res.text())
      // Optimistic update
      setUsers(users.filter(u => u.id !== userId))
    } catch (err: any) {
      alert(err.message || 'Failed to delete user')
    }
  }

  // --- Admin Actions for Coupons ---
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCouponCode.trim()) return
    setIsCreatingCoupon(true)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/api/admin/coupons`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: newCouponCode,
          max_uses: newCouponMaxUses
        })
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Failed to create coupon')
      }
      const newCoupon = await res.json()
      setCoupons([newCoupon, ...coupons])
      setNewCouponCode('')
      setNewCouponMaxUses(100)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsCreatingCoupon(false)
    }
  }

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/api/admin/coupons/${couponId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token || ''}` }
      })
      if (!res.ok) throw new Error('Failed to delete coupon')
      setCoupons(coupons.filter(c => c.id !== couponId))
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const total = users.length
    const totalExports = users.reduce((acc, curr) => acc + (curr.export_count || 0), 0)
    const activeExporters = users.filter(u => u.export_count > 0).length
    const proUsers = users.filter(u => u.is_pro).length

    return { total, totalExports, activeExporters, proUsers }
  }, [users])

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
        <p className="mt-4 text-gray-400 text-sm animate-pulse">Verifying Access...</p>
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
      <main className="container-centered py-8 relative z-10">
        
        {/* Tabs */}
        <div className="flex items-center gap-6 mb-8 border-b border-gray-200 dark:border-white/10 pb-1">
          <button 
            onClick={() => setActiveTab('users')}
            className={`pb-2 text-sm font-semibold transition-colors relative ${activeTab === 'users' ? 'text-accent-primary dark:text-accent-gold' : 'text-text-secondary dark:text-dark-text-secondary hover:text-text-primary'}`}
          >
            Users Analytics
            {activeTab === 'users' && (
              <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-accent-primary dark:bg-accent-gold rounded-t-full"></span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('coupons')}
            className={`pb-2 text-sm font-semibold transition-colors relative ${activeTab === 'coupons' ? 'text-accent-primary dark:text-accent-gold' : 'text-text-secondary dark:text-dark-text-secondary hover:text-text-primary'}`}
          >
            Coupon Codes
            {activeTab === 'coupons' && (
              <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-accent-primary dark:bg-accent-gold rounded-t-full"></span>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-500 rounded-xl p-4 mb-8 border border-red-500/20 text-sm">
            ❌ {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-accent-gold border-t-transparent animate-spin"></div>
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary">Retrieving platform data...</p>
          </div>
        ) : activeTab === 'users' ? (
          <>
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
                  title: "Pro Users",
                  val: stats.proUsers,
                  desc: "Users on unlimited plan",
                  icon: (
                    <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
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

              {filteredUsers.length === 0 ? (
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
                        <th className="py-4 px-3 text-center">Plan Tier</th>
                        <th className="py-4 px-3 text-center">Exports Used</th>
                        <th className="py-4 px-3">Registration Date</th>
                        <th className="py-4 px-3 text-right">Actions</th>
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
                            <div className="max-w-[200px] truncate font-medium">{item.college_name || "—"}</div>
                            <div className="text-xs text-text-secondary dark:text-dark-text-secondary">{item.stream || "—"}</div>
                          </td>
                          <td className="py-4 px-3 text-center">
                            {item.is_pro ? (
                              <span className="inline-block px-2 py-1 rounded bg-purple-500/10 text-purple-500 border border-purple-500/20 text-xs font-bold">PRO</span>
                            ) : (
                              <span className="inline-block px-2 py-1 rounded bg-gray-500/10 text-gray-500 border border-gray-500/20 text-xs font-semibold">FREE</span>
                            )}
                          </td>
                          <td className="py-4 px-3 text-center">
                            {item.is_pro ? (
                              <span className="text-emerald-500 font-bold text-xs">Unlimited</span>
                            ) : (
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                item.export_count >= 2 
                                  ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                  : item.export_count > 0
                                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              }`}>
                                {item.export_count} / 2
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-3 text-xs text-text-secondary dark:text-dark-text-secondary">
                            {new Date(item.created_at).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-4 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!item.is_pro && (
                                <button 
                                  onClick={() => handleResetExports(item.id)}
                                  className="p-1.5 rounded bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-text-secondary dark:text-dark-text-secondary transition-colors"
                                  title="Reset Exports"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                </button>
                              )}
                                <button 
                                  onClick={() => handleTogglePro(item.id, !!item.is_pro)}
                                  className={`px-2 py-1.5 rounded text-xs font-semibold transition-colors ${item.is_pro ? 'bg-gray-100 dark:bg-white/10 text-gray-500 hover:bg-red-500/10 hover:text-red-500' : 'bg-purple-500/10 text-purple-600 hover:bg-purple-500 hover:text-white'}`}
                                  title={item.is_pro ? "Downgrade to Free" : "Upgrade to Pro"}
                                >
                                  {item.is_pro ? "Downgrade" : "Upgrade"}
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(item.id, item.email)}
                                  className="px-2 py-1.5 rounded text-xs font-semibold bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-colors"
                                  title="Delete User"
                                >
                                  Delete
                                </button>
                              </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Coupons Tab Content */
          <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/20 dark:border-white/5 shadow-xl max-w-4xl mx-auto">
            <h2 className="text-xl font-bold mb-6">Manage Promo Codes</h2>
            
            {/* Create Coupon Form */}
            <form onSubmit={handleCreateCoupon} className="flex flex-col md:flex-row gap-4 mb-10 bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mb-1 uppercase tracking-wider">Coupon Code</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. SUMMER2026"
                  value={newCouponCode}
                  onChange={e => setNewCouponCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg text-sm"
                />
              </div>
              <div className="w-full md:w-32">
                <label className="block text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mb-1 uppercase tracking-wider">Max Uses</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={newCouponMaxUses}
                  onChange={e => setNewCouponMaxUses(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg text-sm"
                />
              </div>
              <div className="flex items-end">
                <button 
                  type="submit" 
                  disabled={isCreatingCoupon}
                  className="btn-primary py-2 px-6 h-[38px] whitespace-nowrap"
                >
                  {isCreatingCoupon ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </form>

            {/* Coupons Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/10 text-text-secondary dark:text-dark-text-secondary font-semibold">
                    <th className="py-4 px-3">Code</th>
                    <th className="py-4 px-3">Benefit</th>
                    <th className="py-4 px-3 text-center">Uses</th>
                    <th className="py-4 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {coupons.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-text-secondary">No coupons created yet.</td>
                    </tr>
                  ) : coupons.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/20 transition-colors">
                      <td className="py-4 px-3">
                        <span className="font-mono font-bold text-accent-primary dark:text-accent-gold text-base tracking-wider bg-accent-primary/10 dark:bg-accent-gold/10 px-2 py-1 rounded">
                          {item.code}
                        </span>
                        <div className="text-xs text-text-secondary dark:text-dark-text-secondary mt-1">
                          Created {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <span className="inline-block bg-purple-500/10 text-purple-500 px-2 py-1 rounded text-xs font-semibold">Free Pro Status</span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-accent-primary dark:bg-accent-gold"
                              style={{ width: `${Math.min(100, (item.used_count / item.max_uses) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-semibold">{item.used_count} / {item.max_uses}</span>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-right">
                        <button 
                          onClick={() => handleDeleteCoupon(item.id)}
                          className="px-3 py-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors text-xs font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
