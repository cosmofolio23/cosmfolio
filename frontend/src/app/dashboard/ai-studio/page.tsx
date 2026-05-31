'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import Logo from '@/components/Logo'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface Suggestion {
  id: string
  label: string
  prompt: string
  icon: string
}

export default function AIStudio() {
  const router = useRouter()
  const { isAuthenticated, token } = useAuthStore()
  const savedToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'analyze' | 'write' | 'enhance' | 'narrative'>('analyze')

  const suggestions: Record<string, Suggestion[]> = {
    analyze: [
      { id: 'concept', label: 'Analyze Concept', prompt: 'Analyze the core design concept of this architecture project. What are the key ideas? What makes it unique?', icon: '💡' },
      { id: 'materials', label: 'Material Strategy', prompt: 'Describe the material palette and how it supports the design intent. What is the material narrative?', icon: '🧱' },
      { id: 'spatial', label: 'Spatial Quality', prompt: 'Analyze the spatial organization. How do spaces flow? What is the experience?', icon: '🏗️' },
      { id: 'context', label: 'Site Context', prompt: 'How does this project respond to its site and context? What environmental factors influence the design?', icon: '🌍' },
    ],
    write: [
      { id: 'description', label: 'Project Description', prompt: 'Write a compelling 3-sentence description of this architecture project for a portfolio. Focus on the unique aspects, spatial qualities, and design intent.', icon: '✍️' },
      { id: 'abstract', label: 'Design Abstract', prompt: 'Write a 100-word professional abstract for this architecture project. Include the problem, solution, and impact.', icon: '📄' },
      { id: 'biography', label: 'Architect Bio', prompt: 'Write a compelling 2-sentence biography for an architecture student. Mention their design philosophy, technical skills, and aspirations.', icon: '👤' },
      { id: 'statement', label: 'Design Statement', prompt: 'Write a powerful one-sentence design statement or philosophy. It should be memorable, inspiring, and specific to architecture.', icon: '🎯' },
    ],
    enhance: [
      { id: 'storytelling', label: 'Add Storytelling', prompt: 'Take this text and enhance it with better storytelling. Make it more engaging and evocative while staying professional.', icon: '📖' },
      { id: 'simplify', label: 'Simplify Text', prompt: 'Make this text more concise and clear. Remove jargon while keeping technical accuracy. Target: 8th grade reading level.', icon: '🎯' },
      { id: 'strengthen', label: 'Strengthen Language', prompt: 'Enhance this text with stronger, more impactful language. Make it more powerful and professional.', icon: '💪' },
      { id: 'expand', label: 'Expand Details', prompt: 'Expand this text with more specific details and examples. Add depth without losing clarity.', icon: '📚' },
    ],
    narrative: [
      { id: 'case_study', label: 'Case Study Structure', prompt: 'Create an outline for a complete architecture project case study. Include sections for context, concept, design process, technical details, and outcomes.', icon: '📋' },
      { id: 'process', label: 'Design Process', prompt: 'Write about the design process for this project. Include research, iterations, decisions, and lessons learned.', icon: '🔄' },
      { id: 'impact', label: 'Project Impact', prompt: 'Articulate the impact and significance of this architecture project. Who does it serve? What problems does it solve? What legacy does it leave?', icon: '⭐' },
      { id: 'lessons', label: 'Lessons Learned', prompt: 'Describe key lessons learned from this architecture project. What would you do differently? What are the takeaways for future work?', icon: '🎓' },
    ],
  }

  useEffect(() => {
    if (!isAuthenticated) router.push('/signin')
  }, [isAuthenticated])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/ai/generate-text`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${savedToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: messageText,
          tone: 'professional',
          content_type: 'architecture',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.generated_text || data.text || 'No response generated',
          timestamp: Date.now(),
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error generating a response. Please try again.',
          timestamp: Date.now(),
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Network error. Please check your connection and try again.',
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const currentSuggestions = suggestions[activeTab]

  return (
    <div className="min-h-screen bg-bg-primary dark:bg-dark-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface-base dark:bg-dark-surface-base border-b border-border-subtle dark:border-dark-border-subtle shadow-elevation-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors">
              ← Dashboard
            </Link>
            <div className="hidden sm:flex items-center gap-3">
              <Logo size="md" variant="gold" />
              <h1 className="text-h4 font-semibold text-text-primary dark:text-dark-text-primary">AI Studio</h1>
            </div>
          </div>
          <p className="text-body-sm text-text-secondary dark:text-dark-text-secondary">Professional writing assistant for architects</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Chat Area */}
          <div className="lg:col-span-2 flex flex-col h-[calc(100vh-200px)] bg-surface-base dark:bg-dark-surface-base rounded-2xl shadow-elevation-2 border border-border-subtle dark:border-dark-border-subtle overflow-hidden">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="text-6xl mb-4">✨</div>
                  <h2 className="text-h3 text-text-primary dark:text-dark-text-primary mb-3">Welcome to AI Studio</h2>
                  <p className="text-body text-text-secondary dark:text-dark-text-secondary max-w-sm mb-8">
                    Get help writing project descriptions, design statements, biographies, and more. Choose a suggestion or ask anything.
                  </p>
                  <div className="flex gap-2">
                    <button className="btn-primary btn-small">Analyze a Project</button>
                    <button className="btn-secondary btn-small">Write Description</button>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map(message => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs sm:max-w-md px-4 py-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-accent-primary dark:bg-dark-surface-overlay text-white rounded-br-none'
                            : 'bg-surface-elevated dark:bg-dark-surface-elevated text-text-primary dark:text-dark-text-primary rounded-bl-none'
                        }`}>
                        <p className="text-body-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        {message.role === 'assistant' && (
                          <button
                            onClick={() => copyToClipboard(message.content)}
                            className="mt-2 text-xs opacity-60 hover:opacity-100 transition-opacity">
                            Copy
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-surface-elevated dark:bg-dark-surface-elevated px-4 py-3 rounded-lg">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-text-secondary dark:bg-dark-text-secondary animate-pulse"></div>
                          <div className="w-2 h-2 rounded-full bg-text-secondary dark:bg-dark-text-secondary animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 rounded-full bg-text-secondary dark:bg-dark-text-secondary animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-border-subtle dark:border-dark-border-subtle p-4 bg-surface-base dark:bg-dark-surface-base">
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Ask anything... (Shift+Enter for new line)"
                  className="input-field flex-1 resize-none max-h-32"
                  rows={3}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !input.trim()}
                  className="btn-primary btn-small self-end h-fit">
                  {isLoading ? '...' : 'Send'}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar: Suggestions */}
          <div className="lg:col-span-1 space-y-4">
            {/* Tab Selection */}
            <div className="bg-surface-base dark:bg-dark-surface-base rounded-2xl border border-border-subtle dark:border-dark-border-subtle p-4 shadow-elevation-1">
              <h3 className="text-body-sm font-semibold text-text-primary dark:text-dark-text-primary mb-4">Writing Assistant</h3>
              <div className="grid grid-cols-2 gap-2">
                {(['analyze', 'write', 'enhance', 'narrative'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-2 rounded-lg text-caption font-medium transition-all ${
                      activeTab === tab
                        ? 'bg-accent-primary dark:bg-dark-surface-elevated text-white dark:text-dark-text-primary'
                        : 'bg-surface-elevated dark:bg-dark-surface-overlay text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary'
                    }`}>
                    {tab === 'analyze' && 'Analyze'}
                    {tab === 'write' && 'Write'}
                    {tab === 'enhance' && 'Enhance'}
                    {tab === 'narrative' && 'Narrative'}
                  </button>
                ))}
              </div>
            </div>

            {/* Suggestion Cards */}
            <div className="space-y-2">
              {currentSuggestions.map(suggestion => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSendMessage(suggestion.prompt)}
                  disabled={isLoading}
                  className="card p-4 w-full text-left hover:shadow-elevation-3 transition-all duration-200 group disabled:opacity-50">
                  <div className="flex items-start gap-3">
                    <span className="text-h4 flex-shrink-0">{suggestion.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-body-sm font-semibold text-text-primary dark:text-dark-text-primary group-hover:text-accent-primary dark:group-hover:text-accent-gold transition-colors">
                        {suggestion.label}
                      </h4>
                      <p className="text-caption text-text-secondary dark:text-dark-text-secondary line-clamp-2">
                        {suggestion.prompt}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Tips */}
            <div className="bg-surface-elevated dark:bg-dark-surface-elevated rounded-lg p-4 border border-border-subtle dark:border-dark-border-subtle">
              <h4 className="text-caption font-semibold text-text-primary dark:text-dark-text-primary mb-2">💡 Pro Tips</h4>
              <ul className="text-caption text-text-secondary dark:text-dark-text-secondary space-y-1">
                <li>• Be specific about your project</li>
                <li>• Include design intent & goals</li>
                <li>• Ask for multiple versions</li>
                <li>• Use "Copy" to save responses</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
