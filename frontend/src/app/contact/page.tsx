'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { getApiUrl } from '@/lib/tracking'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    
    try {
      const res = await fetch(`${getApiUrl()}/api/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(errorData?.detail || 'Submission failed')
      }
      
      setStatus('success')
      setName('')
      setEmail('')
      setMessage('')
      
      // Reset success status after a delay
      setTimeout(() => setStatus('idle'), 5000)
    } catch (err: any) {
      console.error(err)
      setStatus('idle')
      alert(err.message || 'Failed to send message. Please try emailing us directly.')
    }
  }

  return (
    <div className="min-h-screen bg-white text-charcoal font-sans antialiased flex flex-col">
      {/* Navigation */}
      <Navbar />

      <main className="flex-grow py-20 md:py-28 bg-bg-subtle">
        <div className="container-centered max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20">
            {/* Contact Info */}
            <div>
              <span className="text-xs uppercase tracking-widest font-semibold text-accent-primary dark:text-accent-gold px-3 py-1 rounded-full bg-accent-primary/10 dark:bg-accent-gold/10">
                Get in touch
              </span>
              <h1 className="text-4xl font-bold text-text-primary dark:text-dark-text-primary mt-6 mb-6">
                We'd love to hear from you.
              </h1>
              <p className="text-lg text-text-secondary dark:text-dark-text-secondary mb-10">
                Whether you have a question about features, pricing, need a demo, or anything else, our team is ready to answer all your questions.
              </p>

              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 dark:bg-dark-bg-secondary dark:border-white/10">
                    <svg className="w-6 h-6 text-accent-primary dark:text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary dark:text-dark-text-primary mb-1">Email Us</h3>
                    <a href="mailto:thecosmofolio@gmail.com" className="text-text-secondary dark:text-dark-text-secondary hover:text-accent-primary dark:hover:text-accent-gold transition">
                      thecosmofolio@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 dark:bg-dark-bg-secondary dark:border-white/10">
                    <svg className="w-6 h-6 text-accent-primary dark:text-accent-gold" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary dark:text-dark-text-primary mb-1">Instagram</h3>
                    <a href="https://www.instagram.com/cosmoatelier.in" target="_blank" rel="noopener noreferrer" className="text-text-secondary dark:text-dark-text-secondary hover:text-accent-primary dark:hover:text-accent-gold transition">
                      @cosmoatelier.in
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 dark:bg-dark-bg-secondary dark:border-white/10">
                    <svg className="w-6 h-6 text-accent-primary dark:text-accent-gold" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary dark:text-dark-text-primary mb-1">LinkedIn</h3>
                    <a href="https://www.linkedin.com/company/cosmo-atelier" target="_blank" rel="noopener noreferrer" className="text-text-secondary dark:text-dark-text-secondary hover:text-accent-primary dark:hover:text-accent-gold transition">
                      Cosmo Atelier
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="glass-card rounded-3xl p-8 border border-gray-100 dark:border-white/10 shadow-xl bg-white dark:bg-dark-bg-primary">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">Name</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="input-field w-full"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-field w-full"
                    placeholder="jane@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">Message</label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    className="input-field w-full resize-none"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>
                
                {status === 'success' ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm text-center font-medium">
                    Thanks for reaching out! We'll get back to you soon.
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="btn-primary w-full justify-center disabled:opacity-70"
                  >
                    {status === 'submitting' ? 'Sending...' : 'Send Message'}
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
