import Link from 'next/link'
import Logo from '@/components/Logo'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us | CosmoFolio',
  description: 'Built by architects, for the next generation of architects. Learn about CosmoFolio.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-charcoal font-sans antialiased">
      {/* Navigation */}
      <Navbar />

      <main className="py-20 md:py-32">
        <div className="container-centered max-w-5xl">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary dark:text-dark-text-primary mb-6">
              About Cosmofolio
            </h1>
            <p className="text-xl md:text-2xl text-accent-primary font-medium mb-8">
              Built by architects, for the next generation of architects.
            </p>
            <div className="max-w-3xl mx-auto space-y-6 text-lg text-text-secondary dark:text-dark-text-secondary leading-relaxed">
              <p>
                Cosmofolio was created with one simple idea — architecture students should spend more time designing great projects, not struggling for days arranging portfolio layouts.
              </p>
              <p>
                Every architecture student knows the final rush: adjusting drawings, aligning images, fixing typography, exporting PDFs again and again. We wanted to change that.
              </p>
              <p>
                Cosmofolio helps students transform their studio projects into professional architecture portfolios faster with carefully designed layouts, smart organization tools, and architecture-focused templates.
              </p>
              <p>
                Whether you are applying for internships, preparing for your first architecture job, submitting for competitions, or showcasing your design journey — Cosmofolio helps you present your work with confidence.
              </p>
            </div>
          </div>

          {/* Mission & Why Us Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-24">
            {/* Mission */}
            <div className="bg-accent-gold/5 border border-accent-gold/20 rounded-3xl p-8 md:p-10 shadow-lg relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-primary via-accent-gold to-accent-primary opacity-50"></div>
              <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-6">Our Mission</h2>
              <p className="text-lg text-text-secondary dark:text-dark-text-secondary mb-6">
                To make professional portfolio creation accessible for every architecture student around the world.
              </p>
              <p className="text-xl italic text-text-primary dark:text-dark-text-primary font-medium leading-relaxed border-l-4 border-accent-gold pl-4">
                "A great opportunity should depend on your ideas and design skills — not on how many hours you spend fighting with layouts."
              </p>
            </div>

            {/* Why Cosmofolio */}
            <div className="bg-white dark:bg-dark-bg-secondary border border-gray-100 dark:border-white/5 rounded-3xl p-8 md:p-10 shadow-lg">
              <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-6">Why Cosmofolio?</h2>
              <ul className="space-y-4">
                {[
                  "Created specifically for architecture portfolios",
                  "Studio-ready layouts",
                  "Internship and job-focused templates",
                  "Clean architectural typography",
                  "Fast PDF generation",
                  "Affordable student pricing"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-text-secondary dark:text-dark-text-secondary">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Made for Architecture Students */}
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h2 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary mb-8">
              Made for Architecture Students Everywhere
            </h2>
            <div className="space-y-6 text-lg text-text-secondary dark:text-dark-text-secondary">
              <p>From late-night studio submissions to internship deadlines, Cosmofolio understands the architecture journey.</p>
              <p className="font-medium text-text-primary dark:text-dark-text-primary">We are building more than a portfolio tool.</p>
              <p>We are building a platform that helps young designers present their ideas, share their stories, and take the next step in their architecture careers.</p>
              <p className="text-xl font-bold text-accent-primary mt-8">Design the project. Let Cosmofolio shape the portfolio.</p>
            </div>
          </div>

          {/* About Founder */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-3xl p-8 md:p-12 border border-gray-100 dark:border-white/10 shadow-xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent-primary/5 rounded-full blur-3xl"></div>
            
            <div className="grid lg:grid-cols-12 gap-12 items-center relative z-10">
              <div className="lg:col-span-4 flex flex-col items-center text-center">
                <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-white shadow-xl mb-6">
                  <Image 
                    src="/Founder.png"
                    alt="Ar. Bose Raj N - Founder"
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-2">Ar. Bose Raj N</h3>
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary font-medium">Founder of Cosmofolio</p>
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary">Architect | Digital Architecture Educator</p>
              </div>
              
              <div className="lg:col-span-8 space-y-5 text-text-secondary dark:text-dark-text-secondary leading-relaxed">
                <p>
                  Cosmofolio was founded by Bose Raj N, an architect and educator passionate about transforming how designers create, present, and experience architecture.
                </p>
                <p>
                  With a background in Architecture and Digital Architecture, Bose has worked across architectural design, computational workflows, real-time visualization, and emerging technologies. His experience with architecture students and studios revealed a common challenge — talented designers often spend countless hours formatting portfolios instead of focusing on their ideas.
                </p>
                <p className="font-medium text-text-primary dark:text-dark-text-primary">
                  This inspired the creation of Cosmofolio.
                </p>
                <p>
                  A platform built specifically for architecture students and young designers to create professional portfolios faster, smarter, and more affordably.
                </p>
                <p>
                  Combining architectural knowledge with technology, Cosmofolio aims to bridge the gap between design talent and presentation quality — helping students showcase their work confidently on a global stage.
                </p>
                
                <blockquote className="mt-8 border-l-4 border-accent-primary pl-6 py-2">
                  <p className="text-xl italic text-text-primary dark:text-dark-text-primary mb-2">
                    “Great ideas deserve great presentation.”
                  </p>
                  <footer className="text-sm">
                    <strong>— Ar. Bose Raj N</strong><br/>
                    Founder, Cosmofolio
                  </footer>
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
