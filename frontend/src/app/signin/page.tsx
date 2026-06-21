'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import Logo from '@/components/Logo'
import Navbar from '@/components/Navbar'

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://cosmfolio-backend.onrender.com'
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Google sign-in profile completion step
  const [showProfileStep, setShowProfileStep] = useState(false)
  const [gCollegeName, setGCollegeName] = useState('')
  const [gState, setGState] = useState('')
  const [gYear, setGYear] = useState('')
  const [gStream, setGStream] = useState('B.Arch')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  const { login, loginWithGoogle, token } = useAuthStore()
  const router = useRouter()

  const handleGoogleSignIn = async () => {
    setError('')
    try {
      await loginWithGoogle()
      setShowProfileStep(true)
    } catch (err: any) {
      setError(err.message || 'Google sign in failed')
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    try {
      const t = token || localStorage.getItem('auth_token') || ''
      await fetch(`${API_URL}/api/auth/update-demographics`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({
          college_name: gCollegeName || null,
          state: gState || null,
          year_of_passing: gYear || null,
          stream: gStream || null,
        }),
      })
    } catch { /* non-fatal */ } finally {
      setIsSavingProfile(false)
      router.push('/dashboard')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Google profile-completion step ──────────────────────────────────────
  if (showProfileStep) {
    return (
      <div className="min-h-screen flex flex-col aurora-bg relative overflow-hidden">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="glass-panel p-8 max-w-md w-full relative z-10">
            <div className="flex flex-col items-center mb-5">
              <Logo size="lg" variant="gold" />
            </div>
            <h2 className="text-center text-white font-semibold text-xl mb-1">One last step!</h2>
            <p className="text-center text-stone-400 text-sm mb-6">Tell us a bit about yourself so we can personalise your experience.</p>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">College / University</label>
                  <input type="text" placeholder="e.g. SPA Delhi" value={gCollegeName} onChange={e => setGCollegeName(e.target.value)}
                    className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">State / Region</label>
                  <input type="text" placeholder="e.g. Maharashtra" value={gState} onChange={e => setGState(e.target.value)}
                    className="input-field w-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Graduation Year</label>
                  <input type="text" placeholder="e.g. 2026" value={gYear} onChange={e => setGYear(e.target.value)}
                    className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Stream / Major</label>
                  <select value={gStream} onChange={e => setGStream(e.target.value)} className="input-field w-full">
                    <option>B.Arch</option>
                    <option>M.Arch</option>
                    <option>B.Planning</option>
                    <option>M.Planning</option>
                    <option>Interior Design</option>
                    <option>Landscape Architecture</option>
                    <option>Urban Design</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={isSavingProfile}
                className="btn-primary w-full py-3 mt-2 disabled:opacity-50">
                {isSavingProfile ? 'Saving…' : 'Continue to Dashboard →'}
              </button>
              <button type="button" onClick={() => router.push('/dashboard')}
                className="w-full text-center text-stone-500 text-xs hover:text-stone-300 transition">
                Skip for now
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col aurora-bg relative overflow-hidden">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="glass-panel p-8 max-w-md w-full relative z-10">
        <div className="flex flex-col items-center mb-5">
          <Logo size="lg" variant="gold" />
        </div>
        <p className="text-center text-gray-300 mb-8">Sign in to your account</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <button
                type="button"
                onClick={async () => {
                  if (!email) return alert('Please enter your email first to reset your password.')
                  try {
                    const { sendPasswordResetEmail } = await import('firebase/auth')
                    const { auth } = await import('@/lib/firebase')
                    await sendPasswordResetEmail(auth, email)
                    alert('Password reset email sent! Please check your inbox.')
                  } catch (e: any) {
                    alert('Failed to send reset email: ' + e.message)
                  }
                }}
                className="text-xs text-accent-gold hover:text-white transition"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-white"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-stone-400 text-xs whitespace-nowrap">Or continue with</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-border-subtle dark:border-dark-border-subtle rounded-lg text-text-primary dark:text-dark-text-primary bg-white/50 dark:bg-black/30 hover:bg-white/80 dark:hover:bg-white/10 font-medium transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_15px_rgba(0,0,0,0.2)]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>

        <p className="text-center text-stone-400 mt-4">
          Don't have an account?{' '}
          <Link href="/signup" className="text-accent-gold font-semibold hover:text-white transition">
            Sign up
          </Link>
        </p>
      </div>
      </div>
    </div>
  )
}
