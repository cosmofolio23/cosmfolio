'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import Logo from '@/components/Logo'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'

function FeatureIcon({ type }: { type: string }) {
  const icons = {
    layouts: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
      </svg>
    ),
    design: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
    ai: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
    organize: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4 6h16V4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4v-2H4V6zm16-4h-3V2h-2v4h-4V2H9v4H5V2H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 16H9v-5h6v5z" />
      </svg>
    ),
    export: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
      </svg>
    ),
    share: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.15c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
      </svg>
    ),
  }
  return icons[type as keyof typeof icons] || null
}

export default function Home() {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, user, router])

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 glass-nav shadow-elevation-1">
        <div className="container-centered py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Logo size="sm" variant="gold" />
            <span className="text-2xl font-bold">Cosmo<span className="text-gold-gradient">Folio</span></span>
          </div>
          <div className="flex gap-3">
            <Link href="/signin" className="btn-secondary btn-small">
              Sign In
            </Link>
            <Link href="/signup" className="btn-primary btn-small">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Cosmic aurora background */}
        <div className="absolute inset-0 aurora-bg"></div>

        {/* Floating Elements for Glassmorphism Background */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-primary/20 dark:bg-accent-gold/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute top-40 -left-20 w-80 h-80 bg-accent-gold/20 dark:bg-accent-primary/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-40 right-20 w-96 h-96 bg-color-info/10 dark:bg-color-info/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }}></div>

        <div className="container-centered relative z-10 pt-32 pb-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-white text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Professional Architecture Portfolios, Generated in Seconds
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              Upload your renders, plans, and diagrams. AI arranges them into stunning portfolio variations with 280+ sophisticated layouts and curated design systems.
            </p>
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <Link href="/signup" className="btn-primary shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
                Start Free Now
              </Link>
              <button className="glass dark:glass-dark px-6 py-3 rounded-lg font-medium text-text-primary dark:text-dark-text-primary hover:bg-white/90 dark:hover:bg-white/20 transition-all duration-300">
                View Demo
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center pt-16 border-t border-white border-opacity-20 mt-16">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">50+</div>
                <div className="text-sm text-blue-100">Layout Variations</div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-white bg-opacity-20"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">7</div>
                <div className="text-sm text-blue-100">Design Systems</div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-white bg-opacity-20"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">100%</div>
                <div className="text-sm text-blue-100">AI-Powered</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28 bg-bg-subtle">
        <div className="container-centered">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate">Why Architects Choose CosmoFolio</h2>
            <p className="text-lg text-stone-light max-w-2xl mx-auto">Everything you need to create stunning architecture portfolios that showcase your best work</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: 'layouts',
                title: '50+ Sophisticated Layouts',
                description: 'From hero renders to technical plans, grids, case studies, and competition boards. Every project type covered.',
              },
              {
                icon: 'design',
                title: '7 Premium Design Systems',
                description: 'Minimal, Dark Studio, Scandinavian, Journal, Competition, Parametric, and Corporate themes.',
              },
              {
                icon: 'ai',
                title: 'AI-Powered Curation',
                description: 'Intelligent layout recommendations based on your assets. Let AI find the perfect arrangement.',
              },
              {
                icon: 'organize',
                title: 'Organized Asset Management',
                description: 'Separate uploads for renders, plans, sections, and diagrams. Clean organization.',
              },
              {
                icon: 'export',
                title: 'Multiple Export Formats',
                description: 'PDF, web view, social media carousels, and competition board formats.',
              },
              {
                icon: 'share',
                title: 'Share & Collaborate',
                description: 'Generate unique links, share with clients, save variants in your account.',
              },
            ].map((feature, idx) => (
              <div key={idx} className="glass-card p-8 rounded-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-accent-primary/10 dark:bg-accent-gold/10 text-accent-primary dark:text-accent-gold flex items-center justify-center mb-4 flex-shrink-0 backdrop-blur-md">
                    <FeatureIcon type={feature.icon} />
                  </div>
                  <h3 className="text-h4 text-text-primary dark:text-dark-text-primary mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-body text-text-secondary dark:text-dark-text-secondary">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About The Founder Section */}
      <section className="py-20 bg-white dark:bg-dark-bg-secondary">
        <div className="container-centered">
          <div className="max-w-4xl mx-auto glass-card rounded-3xl p-8 md:p-12 border border-gray-100 dark:border-white/10 shadow-xl relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent-gold/5 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1 space-y-6 text-text-secondary dark:text-dark-text-secondary">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  About the Founder
                </div>
                <h2 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary leading-tight">
                  Great designs deserve great presentations.
                </h2>
                
                <p>I am Ar. Bose Raj, an architect, educator, and digital design enthusiast exploring the intersection of architecture, technology, and artificial intelligence.</p>
                <p>Throughout my journey as an architecture student and educator, I experienced one common challenge faced by almost every designer — we spend months creating meaningful projects, but countless hours struggling to present them.</p>
                <p>Late nights arranging sheets, searching for portfolio references, adjusting layouts, fixing typography, and trying to make our work look as good as the ideas behind it became a familiar part of architectural education.</p>
                <p className="font-semibold text-text-primary dark:text-dark-text-primary">That experience became the starting point for Cosmo Folio.</p>
                
                <blockquote className="border-l-4 border-accent-primary pl-4 italic my-6 text-lg text-text-primary dark:text-dark-text-primary">
                  "Architects should spend more time designing ideas, not fighting with presentation layouts."
                </blockquote>
                
                <p>Cosmo Folio is created specifically for architects and designers — understanding our drawings, our storytelling process, and the way we communicate design.</p>
                <p>My vision is to build tools that help every designer present their creativity with confidence and make powerful architectural presentations accessible to everyone.</p>
                
                <div className="pt-4 border-t border-gray-100 dark:border-white/10 mt-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent-primary to-blue-400 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    BR
                  </div>
                  <div>
                    <div className="font-bold text-text-primary dark:text-dark-text-primary">Ar. Bose Raj</div>
                    <div className="text-sm">Founder, Cosmo Folio</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50 dark:bg-dark-bg-primary">
        <div className="container-centered max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary dark:text-dark-text-primary mb-4">Frequently Asked Questions</h2>
            <p className="text-text-secondary dark:text-dark-text-secondary">Everything you need to know about Cosmo Folio.</p>
          </div>
          
          <div className="space-y-4">
            {[
              { q: "Is Cosmo Folio really free?", a: "Yes! You can instantly create a beautiful 10-page portfolio and export up to 3 high-quality PDFs completely for free. We are launching a Pro version next week for users who need unlimited pages, premium master templates, and unlimited exports." },
              { q: "Can I download a PDF for job applications?", a: "Absolutely. Our engine generates print-ready PDFs at perfect A4 dimensions. They are optimized for emailing to architecture firms, applying to grad school, or printing." },
              { q: "Do I own the rights to my portfolio?", a: "100% yes. We do not claim any ownership over your drawings, renders, or portfolio designs. Your work is entirely yours." },
              { q: "Are the templates fully customizable?", a: "Every template is just a starting point. Once applied, you can drag and drop images, change colors, switch typography, and rearrange layouts on the canvas exactly how you want." }
            ].map((faq, i) => (
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

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-r from-primary to-primary-light text-white">
        <div className="container-centered text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Showcase Your Work?</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Free to use, free to generate, free to share. No credit card required. Start today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="inline-block px-8 py-4 bg-white text-accent-primary font-semibold rounded-lg hover:shadow-[0_8px_30px_rgba(255,255,255,0.3)] hover:-translate-y-1 transition-all duration-300">
              Start Free Today
            </Link>
            <button className="glass px-8 py-4 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/30">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal text-white py-12 md:py-16">
        <div className="container-centered">
          <div className="grid md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate">
            <div>
              <h4 className="font-bold mb-4">CosmoFolio</h4>
              <p className="text-stone-light text-sm">Professional architecture portfolio generation.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-stone-light">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-stone-light">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-stone-light">
                <li><a href="/privacy" className="hover:text-white transition">Privacy</a></li>
                <li><a href="/terms" className="hover:text-white transition">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-stone-light text-sm">
            <p>&copy; 2025 CosmoFolio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
