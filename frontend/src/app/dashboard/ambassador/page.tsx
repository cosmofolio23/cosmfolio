'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import Logo from '@/components/Logo'
import Link from 'next/link'
import { trackEvent } from '@/lib/tracking'

export default function AmbassadorPage() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [isAmbassador, setIsAmbassador] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  
  // Join form state
  const [referralCode, setReferralCode] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState('')
  
  // Withdrawal state
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState('UPI')
  const [withdrawDetails, setWithdrawDetails] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [withdrawMessage, setWithdrawMessage] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const API_URL = process.env.NODE_ENV === 'production'
        ? 'https://cosmfolio-backend.onrender.com'
        : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
      const token = localStorage.getItem('auth_token')
      
      const res = await fetch(`${API_URL}/api/ambassadors/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (data.is_ambassador) {
        setIsAmbassador(true)
        setProfile(data.profile)
        setTransactions(data.transactions)
      } else {
        setIsAmbassador(false)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setJoinError('')
    setJoinLoading(true)
    
    if (referralCode.length < 3) {
      setJoinError('Code must be at least 3 characters')
      setJoinLoading(false)
      return
    }
    
    try {
      const API_URL = process.env.NODE_ENV === 'production'
        ? 'https://cosmfolio-backend.onrender.com'
        : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
      const token = localStorage.getItem('auth_token')
      
      const res = await fetch(`${API_URL}/api/ambassadors/join`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          referral_code: referralCode.trim().toUpperCase(),
          invite_code: inviteCode.trim() 
        })
      })
      
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to join')
      }
      
      trackEvent('ambassador_joined', { code: referralCode })
      await fetchProfile()
    } catch (err: any) {
      setJoinError(err.message)
    } finally {
      setJoinLoading(false)
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setWithdrawMessage('')
    setWithdrawLoading(true)
    
    try {
      const API_URL = process.env.NODE_ENV === 'production'
        ? 'https://cosmfolio-backend.onrender.com'
        : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
      const token = localStorage.getItem('auth_token')
      
      const res = await fetch(`${API_URL}/api/ambassadors/withdraw`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          amount: parseFloat(withdrawAmount),
          method: withdrawMethod,
          details: withdrawDetails
        })
      })
      
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to request withdrawal')
      }
      
      setWithdrawMessage('Withdrawal requested successfully! It will be processed within 3-5 business days.')
      setWithdrawAmount('')
      setWithdrawDetails('')
      await fetchProfile()
    } catch (err: any) {
      setWithdrawMessage(err.message)
    } finally {
      setWithdrawLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-gray-400 hover:text-gray-700 text-sm whitespace-nowrap">← Dashboard</Link>
              <div className="h-8 w-px bg-gray-200" />
              <Logo size="md" variant="gold" />
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      <header className="bg-white dark:bg-dark-bg-secondary border-b dark:border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-gray-400 hover:text-gray-700 text-sm whitespace-nowrap">← Dashboard</Link>
              <div className="h-8 w-px bg-gray-200 dark:bg-white/10" />
              <Logo size="md" variant="gold" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white ml-2">Ambassador Program 🚀</h1>
              </div>
            </div>
            <Link href="/leaderboard" className="btn-secondary py-2 px-4 text-sm">
              Leaderboard
            </Link>
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full">

          {!isAmbassador ? (
            <div className="bg-white dark:bg-dark-bg-secondary p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">Earn Money by Sharing CosmoFolio</h2>
              <p className="text-text-secondary dark:text-dark-text-secondary mb-8">
                Create your unique referral code. When your friends or followers use it to upgrade to Pro, they get a 15% discount, and you earn 15% commission! Level up to earn up to 30%.
              </p>
              
              <form onSubmit={handleJoin} className="flex flex-col gap-4 max-w-sm mx-auto">
                <div>
                  <label className="block text-sm font-medium mb-2 text-left">Secret Invite Code</label>
                  <input 
                    type="password" 
                    placeholder="Enter code"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 focus:outline-none focus:border-accent-gold"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-left">Choose your Referral Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. BOSE15"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 focus:outline-none focus:border-accent-gold uppercase"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                    required
                  />
                  <p className="text-xs text-text-tertiary mt-2 text-left">Can only contain letters and numbers.</p>
                </div>
                
                {joinError && <p className="text-red-500 text-sm font-medium">{joinError}</p>}
                
                <button type="submit" disabled={joinLoading} className="btn-primary py-3 w-full">
                  {joinLoading ? 'Joining...' : 'Join Program'}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Top Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-dark-bg-secondary p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10">
                  <p className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-2">Total Earnings</p>
                  <p className="text-3xl font-bold text-accent-gold">₹{profile.total_earnings.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-dark-bg-secondary p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10">
                  <p className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-2">Pending (14-day hold)</p>
                  <p className="text-3xl font-bold text-text-secondary">₹{profile.pending_balance.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-dark-bg-secondary p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10">
                  <p className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-2">Available Balance</p>
                  <p className="text-3xl font-bold text-emerald-500">₹{profile.available_balance.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-dark-bg-secondary p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10">
                  <p className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-2">Successful Sales</p>
                  <p className="text-3xl font-bold text-text-primary dark:text-white">{profile.successful_sales}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Level Progress */}
                <div className="lg:col-span-2 bg-white dark:bg-dark-bg-secondary p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <p className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-1">Current Tier</p>
                      <h2 className="text-2xl font-bold capitalize text-accent-primary dark:text-accent-gold">
                        {profile.tier} Ambassador
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-text-tertiary mb-1">Your Benefits</p>
                      <p className="text-md font-bold text-text-secondary">
                        {profile.discount_percentage}% off for them, {profile.commission_percentage}% for you
                      </p>
                    </div>
                  </div>
                  
                  {profile.tier !== 'creator' && (
                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/10">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium">Progress to next tier</p>
                        <p className="text-sm font-bold">{profile.successful_sales} / {profile.tier === 'starter' ? 21 : 101} Sales</p>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-black/30 rounded-full h-3">
                        <div 
                          className="bg-accent-gold h-3 rounded-full" 
                          style={{ width: `${Math.min(100, (profile.successful_sales / (profile.tier === 'starter' ? 21 : 101)) * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-text-tertiary mt-3">
                        Next tier: {profile.tier === 'starter' ? 'Campus Ambassador (20% for you)' : 'Cosmo Creator (30% for you)'}
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-8 bg-gray-50 dark:bg-black/20 p-6 rounded-xl border border-gray-200 dark:border-white/10">
                    <p className="text-sm font-medium text-text-secondary mb-2">Your Referral Code</p>
                    <div className="flex items-center gap-4">
                      <code className="text-2xl font-bold px-4 py-2 bg-white dark:bg-black/50 rounded-lg text-text-primary dark:text-white border border-gray-200 dark:border-white/10">
                        {profile.referral_code}
                      </code>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`Use my code ${profile.referral_code} for ${profile.discount_percentage}% off CosmoFolio Pro!`)
                          alert("Copied to clipboard!")
                        }}
                        className="btn-secondary py-2 text-sm"
                      >
                        Copy Promo Msg
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Withdraw Form */}
                <div className="bg-white dark:bg-dark-bg-secondary p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10">
                  <h3 className="text-xl font-bold mb-6">Request Withdrawal</h3>
                  <form onSubmit={handleWithdraw} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Amount (₹)</label>
                      <input 
                        type="number" 
                        min="500"
                        max={profile.available_balance}
                        step="1"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 focus:outline-none focus:border-accent-gold"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Payout Method</label>
                      <select 
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 focus:outline-none focus:border-accent-gold"
                        value={withdrawMethod}
                        onChange={(e) => setWithdrawMethod(e.target.value)}
                      >
                        <option value="UPI">UPI (India only)</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="PayPal">PayPal (International)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Account Details</label>
                      <textarea 
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 focus:outline-none focus:border-accent-gold"
                        placeholder="UPI ID, Bank Acct + IFSC, or PayPal Email"
                        rows={3}
                        value={withdrawDetails}
                        onChange={(e) => setWithdrawDetails(e.target.value)}
                        required
                      />
                    </div>
                    
                    {withdrawMessage && (
                      <p className={`text-sm font-medium ${withdrawMessage.includes('success') ? 'text-emerald-500' : 'text-red-500'}`}>
                        {withdrawMessage}
                      </p>
                    )}
                    
                    <button 
                      type="submit" 
                      disabled={withdrawLoading || profile.available_balance < 500} 
                      className="btn-primary py-3 w-full disabled:opacity-50"
                    >
                      {withdrawLoading ? 'Processing...' : 'Withdraw'}
                    </button>
                    <p className="text-xs text-text-tertiary text-center">Minimum withdrawal ₹500</p>
                  </form>
                </div>
              </div>
              
              {/* Transactions list */}
              <div className="bg-white dark:bg-dark-bg-secondary p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 mt-8">
                <h3 className="text-xl font-bold mb-6">Recent Sales</h3>
                {transactions.length === 0 ? (
                  <p className="text-text-secondary text-sm">No sales yet. Start sharing your code!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-text-tertiary uppercase bg-gray-50 dark:bg-black/20">
                        <tr>
                          <th className="px-6 py-3 rounded-tl-lg">Date</th>
                          <th className="px-6 py-3">Sale Amount</th>
                          <th className="px-6 py-3">Commission</th>
                          <th className="px-6 py-3 rounded-tr-lg">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map(tx => (
                          <tr key={tx.id} className="border-b border-gray-100 dark:border-white/5 last:border-0">
                            <td className="px-6 py-4 font-medium">{new Date(tx.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4">₹{tx.sale_amount.toFixed(2)}</td>
                            <td className="px-6 py-4 text-emerald-500 font-bold">+₹{tx.commission_amount.toFixed(2)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 text-xs font-bold uppercase rounded-full ${
                                tx.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 
                                tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
