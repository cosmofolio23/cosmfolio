'use client'

import Link from 'next/link'
import { useEffect } from 'react'
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border-light shadow-elevation-1">
        <div className="container-centered py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-primary">CosmoFolio</div>
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
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 bg-gradient-to-br from-slate-900 via-primary to-slate-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-10 w-72 h-72 bg-accent rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-primary-light rounded-full mix-blend-multiply filter blur-3xl animation-pulse"></div>
        </div>

        <div className="container-centered relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-white text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Professional Architecture Portfolios, Generated in Seconds
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              Upload your renders, plans, and diagrams. AI arranges them into stunning portfolio variations with 50+ sophisticated layouts and 7 design systems.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/signup" className="btn-primary">
                Get Started Free
              </Link>
              <button className="btn-secondary text-slate hover:bg-gray-100">
                View Demo
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center pt-8 border-t border-white border-opacity-20">
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
              <div key={idx} className="card p-8 hover:shadow-elevation-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 text-primary flex items-center justify-center mb-4">
                  <FeatureIcon type={feature.icon} />
                </div>
                <h3 className="text-xl font-semibold text-slate mb-3">{feature.title}</h3>
                <p className="text-stone-light">{feature.description}</p>
              </div>
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
            <Link
              href="/signup"
              className="bg-white text-primary px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors"
            >
              Start Free Today
            </Link>
            <a
              href="#"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              Learn More
            </a>
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
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
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
