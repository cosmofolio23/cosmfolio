'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import DashboardHeader from '@/components/DashboardHeader'
import { auth } from '@/lib/firebase'
import { updateProfile, updatePassword } from 'firebase/auth'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  
  // Profile Details State
  const [name, setName] = useState('')
  const [collegeName, setCollegeName] = useState('')
  const [state, setState] = useState('')
  const [yearOfPassing, setYearOfPassing] = useState('')
  const [stream, setStream] = useState('')
  
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsSuccess, setDetailsSuccess] = useState('')
  
  // Avatar State
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarSuccess, setAvatarSuccess] = useState('')
  const [photoURL, setPhotoURL] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Password State
  const [newPassword, setNewPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/signin')
      return
    }
    
    // Load existing profile details
    if (user) {
      setName(user.name || '')
      setPhotoURL(user.photoURL || null)
      fetchDetails()
    }
  }, [isAuthenticated, user, router])

  const fetchDetails = async () => {
    try {
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
      const token = localStorage.getItem('auth_token')
      
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setName(data.name || '')
        // We might not be returning all these fields in /me by default,
        // but we can try setting them if they exist
        if (data.college_name) setCollegeName(data.college_name)
        if (data.state) setState(data.state)
        if (data.year_of_passing) setYearOfPassing(data.year_of_passing)
        if (data.stream) setStream(data.stream)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    setDetailsLoading(true)
    setDetailsSuccess('')
    
    try {
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
      const token = localStorage.getItem('auth_token')
      
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          college_name: collegeName,
          state,
          year_of_passing: yearOfPassing,
          stream
        })
      })
      
      if (!res.ok) throw new Error('Failed to update details')
      
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name })
      }
      
      setDetailsSuccess('Profile updated successfully!')
      setTimeout(() => setDetailsSuccess(''), 3000)
    } catch (err) {
      console.error(err)
      alert('Error updating profile.')
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setAvatarLoading(true)
    setAvatarSuccess('')
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
      const token = localStorage.getItem('auth_token')
      
      const res = await fetch(`${API_URL}/api/auth/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Upload failed')
      
      const url = data.url
      setPhotoURL(url)
      
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: url })
        useAuthStore.getState().setUser({ ...auth.currentUser, photoURL: url } as any)
      }
      
      setAvatarSuccess('Avatar updated!')
      setTimeout(() => setAvatarSuccess(''), 3000)
    } catch (err) {
      console.error(err)
      alert('Error uploading avatar. Did you run the SQL migration for the avatars bucket?')
    } finally {
      setAvatarLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    setPasswordLoading(true)
    
    try {
      if (!auth.currentUser) throw new Error('Not logged in')
      await updatePassword(auth.currentUser, newPassword)
      setNewPassword('')
      setPasswordSuccess('Password updated successfully!')
      setTimeout(() => setPasswordSuccess(''), 3000)
    } catch (err: any) {
      console.error(err)
      if (err.code === 'auth/requires-recent-login') {
        setPasswordError('Please log out and log back in before changing your password.')
      } else {
        setPasswordError(err.message || 'Error updating password.')
      }
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary dark:bg-dark-bg-primary relative">
      <DashboardHeader />
      
      <main className="container-centered py-12 md:py-16">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-accent-gold transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
        <h2 className="text-3xl font-bold mb-8 text-text-primary dark:text-dark-text-primary">Profile Settings</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Password */}
          <div className="space-y-8">
            
            {/* Avatar Section */}
            <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/20 dark:border-white/5 shadow-xl">
              <h3 className="text-lg font-bold mb-6">Profile Picture</h3>
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-white/10 border-4 border-accent-gold/50 flex items-center justify-center">
                  {photoURL ? (
                    <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-gray-500 dark:text-gray-300">
                      {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleAvatarUpload}
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarLoading}
                  className="btn-secondary w-full"
                >
                  {avatarLoading ? 'Uploading...' : 'Upload New Picture'}
                </button>
                
                {avatarSuccess && <p className="text-emerald-500 text-sm font-semibold">{avatarSuccess}</p>}
              </div>
            </div>

            {/* Password Section */}
            <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/20 dark:border-white/5 shadow-xl">
              <h3 className="text-lg font-bold mb-6">Security</h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">New Password</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 focus:outline-none focus:border-accent-gold"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                {passwordSuccess && <p className="text-emerald-500 text-sm font-semibold">{passwordSuccess}</p>}
                
                <button 
                  type="submit" 
                  disabled={passwordLoading}
                  className="btn-primary w-full"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

          </div>

          {/* Right Column: Personal Details */}
          <div className="md:col-span-2">
            <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/20 dark:border-white/5 shadow-xl">
              <h3 className="text-lg font-bold mb-6">Personal Details</h3>
              
              <form onSubmit={handleUpdateDetails} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 focus:outline-none focus:border-accent-gold"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Raj Bose"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email (Cannot be changed)</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 text-gray-500 cursor-not-allowed"
                      value={user?.email || ''}
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">College/University Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 focus:outline-none focus:border-accent-gold"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. National Institute of Technology"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">State</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 focus:outline-none focus:border-accent-gold"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. Maharashtra"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Year of Passing</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 focus:outline-none focus:border-accent-gold"
                      value={yearOfPassing}
                      onChange={(e) => setYearOfPassing(e.target.value)}
                      placeholder="e.g. 2026"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Stream</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 focus:outline-none focus:border-accent-gold"
                      value={stream}
                      onChange={(e) => setStream(e.target.value)}
                      placeholder="e.g. Architecture"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  {detailsSuccess ? (
                    <span className="text-emerald-500 font-semibold">{detailsSuccess}</span>
                  ) : <span></span>}
                  
                  <button 
                    type="submit" 
                    disabled={detailsLoading}
                    className="btn-primary w-48"
                  >
                    {detailsLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
