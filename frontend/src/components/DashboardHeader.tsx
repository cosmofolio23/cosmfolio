'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { useAuthStore } from '@/store/auth'
import { useEntitlements } from '@/store/entitlements'

export default function DashboardHeader() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { loaded, has } = useEntitlements()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch from store and check Firebase profile
  const [photoURL, setPhotoURL] = useState<string | null>(user?.photoURL || null)

  // Re-sync on mount in case it was updated
  useEffect(() => {
    if (user?.photoURL) {
      setPhotoURL(user.photoURL)
    }
  }, [user?.photoURL])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="glass-nav shadow-elevation-1 sticky top-0 z-40">
      <div className="container-centered py-4 md:py-8 flex flex-row justify-between items-center gap-2 md:gap-4">
        
        {/* Left side: Logo & Title */}
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <Link href="/dashboard" className="flex items-center gap-2 md:gap-4 hover:opacity-90 transition-opacity min-w-0">
            <div className="hidden sm:block shrink-0">
              <Logo size="lg" variant="gold" />
            </div>
            <div className="block sm:hidden shrink-0">
              <Logo size="md" variant="gold" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-4xl font-bold text-text-primary dark:text-dark-text-primary truncate">
                Cosmo<span className="text-gold-gradient">Folio</span>
              </h1>
              <div className="flex items-center gap-2 md:gap-3 mt-1 md:mt-2">
                <p className="hidden md:block text-text-secondary dark:text-dark-text-secondary truncate">
                  Welcome back, <span className="font-semibold text-text-primary dark:text-dark-text-primary">{user?.name || user?.email}</span>
                </p>
                {loaded && (
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] md:text-[10px] font-bold tracking-wider uppercase whitespace-nowrap ${
                      has('is_pro')
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#9C7416] text-white shadow-sm border-transparent'
                        : 'bg-surface-secondary dark:bg-dark-surface-secondary text-text-secondary dark:text-dark-text-secondary border border-divider dark:border-dark-divider'
                    }`}>
                      {has('is_pro') ? 'PRO' : 'FREEMIUM'}
                    </span>
                    {has('is_pro') && (user?.boost_pack_count || 0) > 0 && (
                      <span className="px-2 py-0.5 rounded text-[9px] md:text-[10px] font-bold tracking-wider uppercase whitespace-nowrap bg-indigo-500 text-white shadow-sm border-transparent">
                        🚀 {user?.boost_pack_count} Boost{(user?.boost_pack_count || 0) > 1 ? 's' : ''}
                      </span>
                    )}
                    {!has('is_pro') && (
                      <button
                        onClick={(e) => { e.preventDefault(); router.push('/pricing') }}
                        className="px-2 md:px-3 py-0.5 rounded text-[9px] md:text-[10px] font-bold tracking-wider uppercase bg-accent-gold/20 text-accent-gold hover:bg-accent-gold/30 transition-colors shadow-sm whitespace-nowrap"
                      >
                        <span className="hidden sm:inline">⚡ Upgrade to Pro</span>
                        <span className="sm:hidden">⚡ Upgrade</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Link>
        </div>

        {/* Right side: Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-white/10 border-2 border-accent-gold/50 flex items-center justify-center">
              {photoURL ? (
                <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-gray-500 dark:text-gray-300">
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold leading-none mb-1">{user?.name || 'User'}</p>
              <p className="text-xs text-text-tertiary leading-none">{user?.email}</p>
            </div>
            <svg className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#12121A] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-white/5 md:hidden">
                <p className="text-sm font-semibold truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              
              <Link 
                href="/dashboard/profile"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Profile Settings
              </Link>
              
              <Link 
                href="/dashboard/ambassador"
                className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Earn Money
              </Link>
              
              <div className="my-1 border-t border-gray-100 dark:border-white/5"></div>
              
              <button 
                onClick={() => {
                  setDropdownOpen(false)
                  logout()
                  router.push('/signin')
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
