'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import Logo from '@/components/Logo'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import VideoModal from '@/components/VideoModal'

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
  const [isLoadingSplash, setIsLoadingSplash] = useState(true)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/dashboard')
    }
    const timer = setTimeout(() => {
      setIsLoadingSplash(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [isAuthenticated, user, router])

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 glass-nav shadow-elevation-1">
        <div className="container-centered py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Logo size="md" variant="gold" />
            <span className="text-2xl font-bold">Cosmo<span className="text-gold-gradient">Folio</span></span>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-sm font-medium">
              <Link href="/about" className="text-text-primary dark:text-dark-text-primary hover:text-accent-primary dark:hover:text-accent-gold transition">About</Link>
              <Link href="/pricing" className="text-text-primary dark:text-dark-text-primary hover:text-accent-primary dark:hover:text-accent-gold transition">Pricing</Link>
              <Link href="/contact" className="text-text-primary dark:text-dark-text-primary hover:text-accent-primary dark:hover:text-accent-gold transition">Contact</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/signin" className="btn-secondary btn-small">
                Sign In
              </Link>
              <Link href="/signup" className="btn-primary btn-small hidden sm:inline-flex">
                Sign Up
              </Link>
            </div>
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-gold/20 text-accent-gold text-xs font-bold mb-6 uppercase tracking-wider backdrop-blur-sm border border-accent-gold/30 animate-pulse">
              ✨ Architecture Portfolio Tool — Now Live
            </div>
            <h1 className="text-white text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Professional Architecture Portfolios, Generated in Seconds
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              Create professional architecture portfolios with intelligent templates, sophisticated design systems, and custom layouts. Built specifically for architects.
            </p>
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <Link href="/signup" className="btn-primary shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
                Start Designing Your Portfolio
              </Link>
              <button 
                onClick={() => setIsVideoModalOpen(true)}
                className="glass dark:glass-dark px-6 py-3 rounded-lg font-medium text-text-primary dark:text-dark-text-primary hover:bg-white/90 dark:hover:bg-white/20 transition-all duration-300"
              >
                View Demo
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center pt-16 border-t border-white border-opacity-20 mt-16">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">280+</div>
                <div className="text-sm text-blue-100">Layout Variations</div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-white bg-opacity-20"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">100+</div>
                <div className="text-sm text-blue-100">Design Styles</div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-white bg-opacity-20"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">100%</div>
                <div className="text-sm text-blue-100">Customizable</div>
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
                title: '100+ Design Styles',
                description: 'Minimalist, Dark Studio, Scandinavian, Journal, Parametric, and Corporate styles tailored for design presentation.',
              },
              {
                icon: 'ai',
                title: 'Intelligent Curation',
                description: 'Smart layout recommendations to match your project drawings. Arrange sheets effortlessly.',
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

      {/* Built For Section */}
      <section className="py-12 bg-bg-subtle border-t border-b border-gray-100 dark:border-white/5">
        <div className="container-centered">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-md text-left">
              <h3 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">Built Specifically For:</h3>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-1">Presenting architectural ideas at every stage of your design education and career.</p>
            </div>
            <div className="flex flex-wrap gap-3 justify-start md:justify-end max-w-2xl">
              {[
                "Internship Portfolio",
                "Architecture Thesis",
                "University Applications",
                "Studio Work",
                "Competition Submission"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  <span className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 md:py-28 bg-white dark:bg-dark-bg-secondary relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="container-centered relative z-10">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-widest font-semibold text-accent-primary dark:text-accent-gold px-3 py-1 rounded-full bg-accent-primary/10 dark:bg-accent-gold/10">Process</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 text-text-primary dark:text-dark-text-primary">How CosmoFolio Works</h2>
            <p className="text-lg text-text-secondary dark:text-dark-text-secondary mt-2 max-w-xl mx-auto">Create and download your architecture portfolio in three simple steps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-accent-primary/20 via-accent-gold/30 to-accent-primary/20 -translate-y-12 z-0"></div>

            {[
              {
                step: "01",
                title: "Sign Up",
                desc: "Create your profile with your college, stream, and graduation year details to customize your layouts.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                )
              },
              {
                step: "02",
                title: "Pick a Template",
                desc: "Choose from our catalog of architectural templates and edit layouts, colors, and content instantly on the canvas.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
                )
              },
              {
                step: "03",
                title: "Export PDF",
                desc: "Export your portfolio directly to a high-quality, print-ready PDF at perfect A4 proportions for applications.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                )
              }
            ].map((item, idx) => (
              <div key={idx} className="glass-card p-8 rounded-3xl relative z-10 flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-300">
                <div className="absolute -top-6 w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent-primary to-blue-500 dark:from-accent-gold dark:to-yellow-500 text-white flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <span className="text-6xl font-bold text-gray-100 dark:text-white/5 mt-4 select-none">{item.step}</span>
                <h3 className="text-xl font-bold text-text-primary dark:text-dark-text-primary mt-2 mb-3">{item.title}</h3>
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before / After Cosmo Section */}
      <section className="py-20 md:py-28 bg-gray-50 dark:bg-dark-bg-primary relative overflow-hidden">
        <div className="container-centered relative z-10">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-widest font-semibold text-accent-primary dark:text-accent-gold px-3 py-1 rounded-full bg-accent-primary/10 dark:bg-accent-gold/10">Comparison</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 text-text-primary dark:text-dark-text-primary">Ditch the Layout Struggle</h2>
            <p className="text-lg text-text-secondary dark:text-dark-text-secondary mt-2 max-w-xl mx-auto">Why spend late nights fighting with Photoshop or InDesign when you can design with structure?</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            {/* Before Column */}
            <div className="glass-card rounded-3xl p-8 border border-red-500/10 shadow-lg relative overflow-hidden bg-red-500/5">
              <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider">Before Cosmo</div>
              <h3 className="text-xl font-bold text-red-500 mb-6 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                The Traditional Nightmare
              </h3>
              <ul className="space-y-4">
                {[
                  { title: "Photoshop layers chaos", desc: "Manually adjusting 50+ hidden smart objects and layer masks." },
                  { title: "Random Pinterest references", desc: "Copying snippets from multiple portfolios, resulting in messy visual layouts." },
                  { title: "Hours arranging sheets", desc: "Losing sleep over standard grid alignments, margin sizing, and font sizes." },
                  { title: "Huge, heavy files", desc: "Crashing tools, slow export times, and blurry compressed drawings." }
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-text-primary dark:text-dark-text-primary text-sm">{item.title}</h4>
                      <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-0.5">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* After Column */}
            <div className="glass-card rounded-3xl p-8 border border-accent-gold/30 shadow-lg relative overflow-hidden bg-accent-gold/5">
              <div className="absolute top-0 right-0 bg-accent-gold text-charcoal text-xs font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider">With Cosmo</div>
              <h3 className="text-xl font-bold text-accent-gold mb-6 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Sleek Design Curation
              </h3>
              <ul className="space-y-4">
                {[
                  { title: "Choose curated style", desc: "Select pre-aligned minimalist, parametric, or studio design styles instantly." },
                  { title: "Drop & replace drawings", desc: "Drag plans, sections, and renders directly into correct template grids." },
                  { title: "Instant A4 exports", desc: "Perfect PDF proportion margins rendered automatically on export." },
                  { title: "Zero manual alignment", desc: "Built-in spacing, layouts, and typography grids keep pages crisp and clean." }
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-gold mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-text-primary dark:text-dark-text-primary text-sm">{item.title}</h4>
                      <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-0.5">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
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
                  <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg relative">
                    <Image 
                      src="/founder.jpg"
                      alt="Ar. Bose Raj"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-bold text-text-primary dark:text-dark-text-primary">Ar. Bose Raj</div>
                    <div className="text-sm">Founder, Cosmo Folio</div>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex justify-center mt-12 md:mt-0">
                <div className="relative w-64 h-64 md:w-[400px] md:h-[400px] rounded-full md:rounded-[3rem] overflow-hidden border-4 md:border-8 border-white/20 shadow-2xl md:rotate-3 md:hover:rotate-0 transition-transform duration-500">
                  <Image 
                    src="/founder.jpg"
                    alt="Ar. Bose Raj - Founder"
                    fill
                    className="object-cover"
                  />
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
              { q: "Is Cosmo Folio really free?", a: "Yes! You can instantly create a beautiful 5-page portfolio and export 2 high-quality PDFs completely for free. We are preparing a Pro version with unlimited pages, premium master templates, and unlimited exports — stay tuned!" },
              { q: "Can I download a PDF for job applications?", a: "Absolutely. Our engine generates print-ready PDFs at any standard size (A4, A3, Letter, and more) in both portrait and landscape orientation. They are optimized for emailing to architecture firms, applying to grad school, or printing." },
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

      {/* Ecosystem Coming Soon Section */}
      <section className="py-20 bg-bg-subtle relative overflow-hidden">
        <div className="container-centered relative z-10">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-widest font-semibold text-accent-primary dark:text-accent-gold px-3 py-1 rounded-full bg-accent-primary/10 dark:bg-accent-gold/10">Future Suite</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 text-text-primary dark:text-dark-text-primary">Cosmo Design Ecosystem</h2>
            <p className="text-lg text-text-secondary dark:text-dark-text-secondary mt-2 max-w-xl mx-auto">Get early access to our next generation of architectural design tools.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              {
                title: "Cosmo Sheet",
                subtitle: "AI Jury Boards",
                desc: "Export your portfolio sheets directly into modular competition panels and print-ready jury boards automatically.",
                badge: "In Development"
              },
              {
                title: "Cosmo Thesis",
                subtitle: "AI Thesis Companion",
                desc: "Format site analyses, diagrams, zoning flows, and design reports with intelligent layout guidelines.",
                badge: "Planned"
              },
              {
                title: "Cosmo Library",
                subtitle: "Your Architectural Journey",
                desc: "A digital vault to store your CAD files, models, texture packs, and presentation graphics in one place.",
                badge: "Exploring"
              }
            ].map((item, idx) => (
              <div key={idx} className="glass-card p-8 rounded-3xl relative border border-white/20 dark:border-white/5 flex flex-col justify-between shadow-md hover:-translate-y-1 transition-all duration-300 bg-white/40 dark:bg-black/20">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-text-primary dark:text-dark-text-primary">{item.title}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-primary/10 dark:bg-accent-gold/10 text-accent-primary dark:text-accent-gold border border-accent-primary/20 dark:border-accent-gold/20 uppercase tracking-wider">{item.badge}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary uppercase tracking-widest mb-4">{item.subtitle}</h4>
                  <p className="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">{item.desc}</p>
                </div>
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
            <Link href="/signup" className="inline-block px-8 py-4 bg-white text-accent-primary font-semibold rounded-lg hover:shadow-[0_8px_30px_rgba(255,255,255,0.3)] hover:-translate-y-1 transition-all duration-300">
              Create Your Portfolio
            </Link>
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="glass px-8 py-4 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/30">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal text-white py-12 md:py-16">
        <div className="container-centered">
          <div className="grid md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate text-left">
            <div>
              <h4 className="font-bold mb-4">CosmoFolio</h4>
              <p className="text-stone-light text-sm mb-4">Professional architecture portfolio generation.</p>
              <div className="flex gap-4">
                <a href="https://www.instagram.com/cosmoatelier.in" target="_blank" rel="noopener noreferrer" className="text-stone-light hover:text-white transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="https://www.linkedin.com/company/cosmo-atelier" target="_blank" rel="noopener noreferrer" className="text-stone-light hover:text-white transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-stone-300">
                <li><Link href="/about" className="text-stone-300 hover:text-white transition">About Us</Link></li>
                <li><Link href="/pricing" className="text-stone-300 hover:text-white transition">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-stone-300">
                <li><Link href="/contact" className="text-stone-300 hover:text-white transition">Contact Us</Link></li>
                <li><a href="mailto:cosmoatelier.live@gmail.com" className="text-stone-300 hover:text-white transition">cosmoatelier.live@gmail.com</a></li>
                <li><a href="https://www.instagram.com/cosmoatelier.in" target="_blank" rel="noopener noreferrer" className="text-stone-300 hover:text-white transition">Instagram</a></li>
                <li><a href="https://www.linkedin.com/company/cosmo-atelier" target="_blank" rel="noopener noreferrer" className="text-stone-300 hover:text-white transition">LinkedIn</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-stone-300">
                <li><a href="/privacy" className="text-stone-300 hover:text-white transition">Privacy Policy</a></li>
                <li><a href="/terms" className="text-stone-300 hover:text-white transition">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-stone-300">
                <li><Link href="/contact" className="text-stone-300 hover:text-white transition">Need help?</Link></li>
                <li><Link href="/contact" className="text-stone-300 hover:text-white transition underline">Contact Cosmofolio Support</Link></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-stone-light text-sm">
            <p>&copy; 2026 CosmoFolio. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Splash Screen Animation Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-[#07070A] flex flex-col justify-center items-center transition-all duration-700 ease-in-out ${isLoadingSplash ? 'opacity-100' : 'opacity-0 pointer-events-none invisible'}`}
        aria-hidden="true"
        role="presentation"
      >
        <div className="relative flex flex-col items-center">
          {/* Cosmic glow effects */}
          <div className="absolute w-64 h-64 bg-accent-gold/20 rounded-full blur-[60px] animate-pulse"></div>
          <div className="absolute w-48 h-48 bg-accent-primary/20 rounded-full blur-[50px] animate-pulse" style={{ animationDelay: '500ms' }}></div>
          
          {/* Pulsing Logo */}
          <div className="relative z-10 scale-150 mb-8 animate-pulse flex items-center justify-center shadow-2xl" style={{ animationDuration: '1.5s' }}>
            <Logo size="lg" variant="gold" />
          </div>
          
          {/* Animated title */}
          <span className="relative z-10 text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
            Cosmo<span className="text-gold-gradient">Folio</span>
          </span>
          
          {/* Progress message */}
          <span className="relative z-10 text-stone-light text-xs tracking-widest uppercase animate-pulse">
            Designing Presentation...
          </span>
        </div>
      </div>

      <VideoModal 
        isOpen={isVideoModalOpen} 
        onClose={() => setIsVideoModalOpen(false)} 
        videoSrc="/demo.mp4" 
      />
    </div>
  )
}
