'use client'

import React from 'react'

interface PaymentStatusModalProps {
  isOpen: boolean
  status: 'success' | 'error' | null
  message: string
  onClose: () => void
}

export default function PaymentStatusModal({ isOpen, status, message, onClose }: PaymentStatusModalProps) {
  if (!isOpen || !status) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-white dark:bg-dark-bg-secondary rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-8 pt-10 text-center flex flex-col items-center">
          
          {status === 'success' ? (
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}

          <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-3">
            {status === 'success' ? 'Success!' : 'Oops!'}
          </h2>
          <p className="text-text-secondary dark:text-dark-text-secondary mb-8">
            {message}
          </p>

          <button 
            onClick={onClose}
            className={`w-full px-6 py-3 rounded-xl font-semibold text-white transition-colors ${
              status === 'success' 
                ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20' 
                : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20'
            }`}
          >
            {status === 'success' ? 'Continue' : 'Try Again'}
          </button>
        </div>
      </div>
    </div>
  )
}
