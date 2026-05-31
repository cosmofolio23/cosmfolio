'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Command {
  id: string
  label: string
  description: string
  category: string
  icon: string
  action: () => void
}

export default function CommandPalette() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const commands: Command[] = [
    {
      id: 'new-portfolio',
      label: 'New Portfolio',
      description: 'Create a new architecture portfolio',
      category: 'Create',
      icon: '📁',
      action: () => router.push('/dashboard?new=portfolio'),
    },
    {
      id: 'new-sheet',
      label: 'New Sheet',
      description: 'Create a new presentation sheet',
      category: 'Create',
      icon: '📄',
      action: () => router.push('/dashboard?new=sheet'),
    },
    {
      id: 'ai-studio',
      label: 'AI Studio',
      description: 'Open the AI writing assistant',
      category: 'Go To',
      icon: '✨',
      action: () => router.push('/dashboard/ai-studio'),
    },
    {
      id: 'templates',
      label: 'Template Gallery',
      description: 'Browse available templates',
      category: 'Go To',
      icon: '🎨',
      action: () => router.push('/dashboard/templates'),
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Go to main dashboard',
      category: 'Go To',
      icon: '🏠',
      action: () => router.push('/dashboard'),
    },
    {
      id: 'profile',
      label: 'Profile Settings',
      description: 'Edit your profile',
      category: 'Settings',
      icon: '⚙️',
      action: () => router.push('/settings/profile'),
    },
    {
      id: 'theme',
      label: 'Toggle Theme',
      description: 'Switch between light and dark mode',
      category: 'Settings',
      icon: '🌙',
      action: () => document.body.classList.toggle('dark'),
    },
    {
      id: 'shortcuts',
      label: 'Keyboard Shortcuts',
      description: 'View available shortcuts',
      category: 'Help',
      icon: '⌨️',
      action: () => alert('Cmd+K: Open Command Palette\nEsc: Close Palette\nUp/Down: Navigate\nEnter: Select'),
    },
  ]

  const filtered = search
    ? commands.filter(cmd =>
        cmd.label.toLowerCase().includes(search.toLowerCase()) ||
        cmd.description.toLowerCase().includes(search.toLowerCase())
      )
    : commands

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(!isOpen)
        setSearch('')
        setSelectedIndex(0)
      }
      if (isOpen && e.key === 'Escape') {
        setIsOpen(false)
      }
      if (isOpen && e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => (i + 1) % filtered.length)
      }
      if (isOpen && e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => (i - 1 + filtered.length) % filtered.length)
      }
      if (isOpen && e.key === 'Enter') {
        e.preventDefault()
        filtered[selectedIndex]?.action()
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isOpen, search, selectedIndex, filtered])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Palette */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50">
        <div className="bg-surface-base dark:bg-dark-surface-base rounded-2xl shadow-elevation-5 border border-border-subtle dark:border-dark-border-subtle overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-border-subtle dark:border-dark-border-subtle">
            <input
              type="text"
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                setSelectedIndex(0)
              }}
              placeholder="Type a command or search..."
              className="w-full bg-transparent text-h4 text-text-primary dark:text-dark-text-primary placeholder-text-tertiary dark:placeholder-dark-text-tertiary outline-none"
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-text-secondary dark:text-dark-text-secondary text-body-sm">No commands found</p>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle dark:divide-dark-border-subtle">
                {filtered.map((cmd, idx) => (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action()
                      setIsOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      idx === selectedIndex
                        ? 'bg-accent-primary dark:bg-dark-surface-elevated text-white'
                        : 'hover:bg-surface-elevated dark:hover:bg-dark-surface-elevated text-text-primary dark:text-dark-text-primary'
                    }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-h4">{cmd.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-body-sm">{cmd.label}</p>
                        <p className={`text-caption ${
                          idx === selectedIndex
                            ? 'text-white/70'
                            : 'text-text-secondary dark:text-dark-text-secondary'
                        }`}>
                          {cmd.description}
                        </p>
                      </div>
                      <span className="text-caption text-text-tertiary dark:text-dark-text-tertiary">
                        {cmd.category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border-subtle dark:border-dark-border-subtle bg-surface-elevated dark:bg-dark-surface-overlay">
            <div className="flex items-center justify-between text-caption text-text-tertiary dark:text-dark-text-tertiary">
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded bg-surface-base dark:bg-dark-surface-base">↑↓</span>
                <span>Navigate</span>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded bg-surface-base dark:bg-dark-surface-base">⏎</span>
                <span>Select</span>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded bg-surface-base dark:bg-dark-surface-base">Esc</span>
                <span>Close</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
