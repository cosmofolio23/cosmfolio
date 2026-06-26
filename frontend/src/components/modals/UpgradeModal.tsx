'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
}

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  title = "Upgrade your portfolio experience", 
  subtitle = "Unlock the full power of CosmoFolio Pro." 
}: UpgradeModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-dark-bg-secondary rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Decor */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-accent-gold/20 via-accent-gold/5 to-transparent dark:from-accent-gold/10" />
        
        <div className="relative p-8 pt-10">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-text-tertiary hover:text-text-primary dark:text-dark-text-tertiary dark:hover:text-dark-text-primary rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-accent-gold/10 text-accent-gold rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary dark:text-dark-text-primary mb-3">
              {title}
            </h2>
            <p className="text-text-secondary dark:text-dark-text-secondary text-base">
              {subtitle}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-black/20 rounded-2xl p-6 mb-8">
            <h3 className="text-sm font-bold text-text-primary dark:text-dark-text-primary uppercase tracking-wider mb-4">
              Unlock with CosmoFolio Pro:
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="mt-0.5 bg-accent-gold text-white rounded-full p-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-text-secondary dark:text-dark-text-secondary text-sm">Create up to <strong>30 pages</strong> per portfolio</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 bg-accent-gold text-white rounded-full p-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-text-secondary dark:text-dark-text-secondary text-sm">3 high-quality PDF exports (no watermark)</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 bg-accent-gold text-white rounded-full p-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-text-secondary dark:text-dark-text-secondary text-sm">Access to all <strong>Premium Templates</strong></span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl font-semibold text-text-primary dark:text-dark-text-primary bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors"
            >
              Maybe Later
            </button>
            <button 
              onClick={() => router.push('/pricing?checkout=pro_upgrade')}
              className="flex-1 px-6 py-3 rounded-xl font-semibold text-charcoal bg-accent-gold hover:bg-accent-gold/90 transition-colors shadow-lg shadow-accent-gold/20 flex items-center justify-center gap-2"
            >
              Upgrade to Pro ✨
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
