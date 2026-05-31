'use client'

import { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  actions?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'danger'
  }[]
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  actions,
  size = 'md',
}: ModalProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full px-4">
        <div className={`${sizeClasses[size]} mx-auto bg-surface-base dark:bg-dark-surface-base rounded-2xl shadow-elevation-5 border border-border-subtle dark:border-dark-border-subtle overflow-hidden animate-scale-grow`}>
          {/* Header */}
          <div className="px-6 py-6 border-b border-border-subtle dark:border-dark-border-subtle">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-h3 text-text-primary dark:text-dark-text-primary font-semibold">
                  {title}
                </h2>
                {description && (
                  <p className="text-body-sm text-text-secondary dark:text-dark-text-secondary mt-1">
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary text-2xl transition-colors">
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {children}
          </div>

          {/* Actions */}
          {actions && actions.length > 0 && (
            <div className="px-6 py-4 border-t border-border-subtle dark:border-dark-border-subtle bg-surface-elevated dark:bg-dark-surface-elevated flex gap-3 justify-end">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.onClick}
                  className={
                    action.variant === 'danger'
                      ? 'btn-secondary'
                      : action.variant === 'secondary'
                      ? 'btn-secondary'
                      : 'btn-primary'
                  }>
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
