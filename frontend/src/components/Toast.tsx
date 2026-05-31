'use client'

import { useState, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastProps {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
}

export function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-6 py-4 rounded-lg shadow-elevation-3 border flex items-center gap-3 animate-slide-up ${
            toast.type === 'success'
              ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900 text-color-success'
              : toast.type === 'error'
              ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900 text-color-error'
              : toast.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900 text-color-warning'
              : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900 text-color-info'
          }`}>
          <span className="text-h4">
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '✕'}
            {toast.type === 'warning' && '⚠'}
            {toast.type === 'info' && 'ℹ'}
          </span>
          <span className="text-body-sm font-medium flex-1">{toast.message}</span>
          <button
            onClick={() => onRemove(toast.id)}
            className="text-text-secondary hover:text-text-primary transition-colors ml-2">
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type, duration }])

    if (duration) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, addToast, removeToast }
}
