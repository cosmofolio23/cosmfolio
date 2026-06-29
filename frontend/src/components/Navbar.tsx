'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Logo from '@/components/Logo'

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="sticky top-0 z-40 bg-charcoal border-b border-white/10 shadow-elevation-1 text-white">
      <div className="container-centered py-4 flex justify-between items-center relative">
        <Link href="/" className="flex items-center gap-2 text-white hover:text-white/90">
          <Logo size="md" variant="gold" />
          <span className="text-2xl font-bold">Cosmo<span className="text-gold-gradient">Folio</span></span>
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 text-sm font-medium">
            <Link href="/" className={`transition ${isActive('/') ? 'text-white' : 'text-gray-300 hover:text-white'}`}>Home</Link>
            <Link href="/features" className={`transition ${isActive('/features') ? 'text-white' : 'text-gray-300 hover:text-white'}`}>Features</Link>
            <Link href="/about" className={`transition ${isActive('/about') ? 'text-white' : 'text-gray-300 hover:text-white'}`}>About</Link>
            <Link href="/pricing" className={`transition ${isActive('/pricing') ? 'text-white' : 'text-gray-300 hover:text-white'}`}>Pricing</Link>
            <Link href="/contact" className={`transition ${isActive('/contact') ? 'text-white' : 'text-gray-300 hover:text-white'}`}>Contact</Link>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/signin" className="btn-secondary btn-small">
              Sign In
            </Link>
            <Link href="/signup" className="btn-primary btn-small">
              Sign Up
            </Link>
          </div>
          {/* Mobile menu button */}
          <button 
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        {/* Mobile menu dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-charcoal border-b border-white/10 shadow-elevation-2 p-4 flex flex-col gap-4 md:hidden">
            <Link href="/" className={`transition ${isActive('/') ? 'text-white' : 'text-gray-300 hover:text-white'}`}>Home</Link>
            <Link href="/features" className={`transition ${isActive('/features') ? 'text-white' : 'text-gray-300 hover:text-white'}`}>Features</Link>
            <Link href="/about" className={`transition ${isActive('/about') ? 'text-white' : 'text-gray-300 hover:text-white'}`}>About</Link>
            <Link href="/pricing" className={`transition ${isActive('/pricing') ? 'text-white' : 'text-gray-300 hover:text-white'}`}>Pricing</Link>
            <Link href="/contact" className={`transition ${isActive('/contact') ? 'text-white' : 'text-gray-300 hover:text-white'}`}>Contact</Link>
            <div className="flex flex-col gap-3 mt-2 pt-4 border-t border-white/10">
              <Link href="/signin" className="btn-secondary text-center w-full">Sign In</Link>
              <Link href="/signup" className="btn-primary text-center w-full">Sign Up</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
