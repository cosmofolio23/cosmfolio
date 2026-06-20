'use client'

import Link from 'next/link'
import Logo from '@/components/Logo'

const FREE_FEATURES = [
  'Unlimited portfolios',
  '5 pages per portfolio',
  '2 PDF export',
  'Standard templates',
  'Full design tools',
]

const PRO_FEATURES = [
  'Unlimited portfolios',
  '30 pages per portfolio',
  '2 PDF exports',
  'Standard + Premium templates',
  'Full design tools',
]

const FAQS = [
  {
    q: 'Is CosmoFolio really free?',
    a: 'Yes! You can instantly create a beautiful 5-page portfolio and export 1 high-quality PDF completely for free. Upgrade to Pro for unlimited pages, premium templates, and additional exports.',
  },
  {
    q: 'Can I download a PDF for job applications?',
    a: 'Absolutely. Our engine generates print-ready PDFs at any standard size (A4, A3, Letter, and more) in both portrait and landscape orientation. They are optimized for emailing to architecture firms, applying to grad school, or printing.',
  },
  {
    q: 'Do I own the rights to my portfolio?',
    a: '100% yes. We do not claim any ownership over your drawings, renders, or portfolio designs. Your work is entirely yours.',
  },
  {
    q: 'Are the templates fully customizable?',
    a: 'Every template is just a starting point. Once applied, you can drag and drop images, change colors, switch typography, and rearrange layouts on the canvas exactly how you want.',
  },
]

function Check() {
  return (
    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation (matches homepage) */}
      <nav className="sticky top-0 z-40 glass-nav shadow-elevation-1">
        <div className="container-centered py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="sm" variant="gold" />
            <span className="text-2xl font-bold">Cosmo<span className="text-gold-gradient">Folio</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="hidden sm:inline-block text-sm font-semibold text-accent-primary dark:text-accent-gold px-2">
              Pricing
            </Link>
            <Link href="/signin" className="btn-secondary btn-small">Sign In</Link>
            <Link href="/signup" className="btn-primary btn-small">Sign Up</Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="bg-bg-subtle border-b border-gray-100 dark:border-white/5">
        <div className="container-centered py-16 md:py-24 text-center">
          <span className="text-xs uppercase tracking-widest font-semibold text-accent-primary dark:text-accent-gold px-3 py-1 rounded-full bg-accent-primary/10 dark:bg-accent-gold/10">
            Pricing
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 text-text-primary dark:text-dark-text-primary">
            Simple pricing, built for students
          </h1>
          <p className="text-lg text-text-secondary dark:text-dark-text-secondary mt-3 max-w-xl mx-auto">
            Start free. Upgrade only when your portfolio needs more.
          </p>
        </div>
      </section>

      {/* Pricing comparison */}
      <section className="py-16 md:py-20 bg-white dark:bg-dark-bg-secondary">
        <div className="container-centered">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            {/* Free tier */}
            <div className="glass-card rounded-3xl p-8 border border-gray-100 dark:border-white/10 shadow-md flex flex-col">
              <h2 className="text-xl font-bold text-text-primary dark:text-dark-text-primary">Free</h2>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-bold text-text-primary dark:text-dark-text-primary">₹0</span>
                <span className="text-sm text-text-secondary dark:text-dark-text-secondary">/ forever</span>
              </div>
              <ul className="mt-8 space-y-3 flex-1">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex gap-3 items-start text-sm text-text-secondary dark:text-dark-text-secondary">
                    <Check />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/10">
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary mb-4">
                  <span className="font-semibold text-text-primary dark:text-dark-text-primary">Best for:</span> Trying CosmoFolio, quick portfolios
                </p>
                <Link href="/signup" className="btn-secondary w-full text-center block">
                  Start Free
                </Link>
              </div>
            </div>

            {/* Pro tier (highlighted) */}
            <div className="glass-card rounded-3xl p-8 border border-accent-gold/40 shadow-xl flex flex-col relative overflow-hidden bg-accent-gold/5">
              <div className="absolute top-0 right-0 bg-accent-gold text-charcoal text-xs font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider">
                Best Value
              </div>
              <h2 className="text-xl font-bold text-text-primary dark:text-dark-text-primary">Pro</h2>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-bold text-text-primary dark:text-dark-text-primary">₹299</span>
                <span className="text-sm text-text-secondary dark:text-dark-text-secondary">one-time</span>
              </div>
              <ul className="mt-8 space-y-3 flex-1">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex gap-3 items-start text-sm text-text-secondary dark:text-dark-text-secondary">
                    <Check />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6 border-t border-accent-gold/20">
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary mb-4">
                  <span className="font-semibold text-text-primary dark:text-dark-text-primary">Best for:</span> Final submissions, applications, thesis
                </p>
                {/* Pro checkout isn't built yet — be honest: coming soon + join the beta. */}
                <div className="w-full flex items-center justify-center gap-2 rounded-lg border border-accent-gold/40 bg-accent-gold/10 text-text-primary dark:text-dark-text-primary font-semibold py-3 px-4 cursor-default select-none">
                  <svg className="w-4 h-4 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  Coming Soon
                </div>
                <p className="text-xs text-center text-text-secondary dark:text-dark-text-secondary mt-3">
                  Pro is launching soon.{' '}
                  <Link href="/signup" className="font-semibold text-accent-primary dark:text-accent-gold hover:underline">
                    Join the beta
                  </Link>{' '}
                  and we&apos;ll notify you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50 dark:bg-dark-bg-primary">
        <div className="container-centered max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary dark:text-dark-text-primary mb-4">Frequently Asked Questions</h2>
            <p className="text-text-secondary dark:text-dark-text-secondary">Everything you need to know about CosmoFolio pricing.</p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <details key={i} className="group bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                <summary className="flex items-center justify-between font-semibold p-6 cursor-pointer text-text-primary dark:text-dark-text-primary list-none">
                  {faq.q}
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-text-secondary dark:text-dark-text-secondary">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer (matches homepage) */}
      <footer className="bg-charcoal text-white py-12 md:py-16">
        <div className="container-centered">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-8 mb-8 border-b border-slate">
            <Link href="/" className="font-bold text-lg">CosmoFolio</Link>
            <div className="flex gap-6 text-sm text-stone-light">
              <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
              <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition">Terms</Link>
            </div>
          </div>
          <div className="text-center text-stone-light text-sm">
            <p>&copy; 2026 CosmoFolio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
