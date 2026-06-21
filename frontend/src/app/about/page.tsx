import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us | CosmoFolio',
  description: 'Built by architects, for the next generation of architects. Learn about CosmoFolio.',
}

function CheckIcon() {
  return (
    <div className="bg-accent-gold/20 p-1.5 rounded-full mr-4 flex-shrink-0">
      <svg className="w-4 h-4 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  )
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-charcoal font-sans antialiased overflow-hidden">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <header className="relative pt-24 pb-32 md:pt-36 md:pb-40 overflow-hidden bg-charcoal text-white">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none opacity-40">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent-gold/20 blur-[120px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full mix-blend-screen" />
        </div>

        <div className="container-centered relative z-10 text-center max-w-4xl mx-auto px-4">
          <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-widest uppercase mb-6 text-accent-gold-light">
            Our Story
          </span>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight leading-tight">
            Built by architects,<br/>
            <span className="text-gold-gradient">for the next generation.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Cosmofolio was created with one simple idea — architecture students should spend more time designing great projects, not struggling for days arranging portfolio layouts.
          </p>
        </div>
        
        {/* Decorative architectural grid at bottom of hero */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-[url('https://www.transparenttextures.com/patterns/blueprint.png')] opacity-10 border-t border-white/10" style={{ backgroundSize: '100px 100px' }}></div>
      </header>

      <main>
        {/* The Problem Section */}
        <section className="py-24 bg-white relative">
          <div className="container-centered max-w-5xl">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-6">The final rush shouldn't be about margins and bleeds.</h2>
                <p className="text-lg text-text-secondary mb-6 leading-relaxed">
                  Every architecture student knows the final rush: adjusting drawings, aligning images, fixing typography, and exporting PDFs again and again. 
                </p>
                <p className="text-lg text-text-secondary leading-relaxed">
                  We wanted to change that. Cosmofolio helps students transform their studio projects into professional architecture portfolios faster with carefully designed layouts, smart organization tools, and architecture-focused templates.
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-accent-gold/10 transform translate-x-4 translate-y-4 rounded-3xl"></div>
                <div className="bg-charcoal text-white rounded-3xl p-8 md:p-10 relative shadow-2xl">
                  <h3 className="text-2xl font-semibold mb-8 text-accent-gold-light">Why CosmoFolio?</h3>
                  <ul className="space-y-5">
                    {[
                      "Created specifically for architecture portfolios",
                      "Studio-ready, professional layouts",
                      "Internship and job-focused templates",
                      "Clean architectural typography",
                      "Fast, print-ready PDF generation",
                      "Affordable student pricing"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center text-gray-200">
                        <CheckIcon />
                        <span className="text-base">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Statement (Dark) */}
        <section className="py-24 bg-bg-subtle border-y border-gray-100">
          <div className="container-centered max-w-4xl text-center">
            <svg className="w-12 h-12 text-accent-gold mx-auto mb-6 opacity-50" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
            <h2 className="text-3xl md:text-5xl font-bold text-charcoal leading-tight mb-8">
              "A great opportunity should depend on your ideas and design skills — not on how many hours you spend fighting with layouts."
            </h2>
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto">
              Our mission is to make professional portfolio creation accessible for every architecture student around the world.
            </p>
          </div>
        </section>

        {/* Meet the Founder */}
        <section className="py-24 md:py-32 bg-white">
          <div className="container-centered max-w-6xl">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              
              {/* Founder Image */}
              <div className="w-full lg:w-5/12 flex justify-center">
                <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96">
                  {/* Decorative Elements */}
                  <div className="absolute inset-0 border-2 border-accent-gold rounded-full transform -translate-x-4 translate-y-4 opacity-50"></div>
                  <div className="absolute inset-0 border border-gray-200 rounded-full transform translate-x-4 -translate-y-4"></div>
                  
                  <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl border-4 border-white bg-gray-100">
                    <Image 
                      src="/Founder.png"
                      alt="Ar. Bose Raj N - Founder"
                      fill
                      className="object-cover"
                      sizes="(max-w-768px) 100vw, 500px"
                    />
                  </div>
                  
                  {/* Badge */}
                  <div className="absolute bottom-4 right-4 bg-charcoal text-white text-xs font-bold uppercase tracking-wider py-2 px-4 rounded-full shadow-lg border border-white/20 z-10">
                    Founder
                  </div>
                </div>
              </div>
              
              {/* Founder Text */}
              <div className="w-full lg:w-7/12">
                <span className="text-sm uppercase tracking-widest font-semibold text-accent-gold mb-2 block">The Architect Behind Cosmofolio</span>
                <h2 className="text-4xl md:text-5xl font-bold text-charcoal mb-4">Ar. Bose Raj N</h2>
                <p className="text-lg text-text-tertiary mb-8 pb-8 border-b border-gray-100">Architect &amp; Digital Architecture Educator</p>
                
                <div className="space-y-6 text-lg text-text-secondary leading-relaxed">
                  <p>
                    With a background in Architecture and Digital Architecture, Bose has worked across architectural design, computational workflows, real-time visualization, and emerging technologies. 
                  </p>
                  <p>
                    His experience working closely with architecture students and studios revealed a common, frustrating challenge: talented designers often spend countless hours formatting their portfolios instead of focusing on their actual design ideas.
                  </p>
                  <p className="text-charcoal font-medium">
                    This inspired the creation of Cosmofolio.
                  </p>
                  <p>
                    A platform built specifically for architecture students and young designers to create professional portfolios faster, smarter, and more affordably. Combining architectural knowledge with technology, Cosmofolio aims to bridge the gap between design talent and presentation quality — helping students showcase their work confidently on a global stage.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-charcoal text-center px-4 relative overflow-hidden">
           <div className="absolute inset-0 bg-accent-gold/5"></div>
           <div className="relative z-10 max-w-3xl mx-auto">
             <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to build your professional portfolio?</h2>
             <p className="text-lg text-gray-300 mb-10">Design the project. Let Cosmofolio shape the portfolio.</p>
             <div className="flex justify-center gap-4">
               <Link href="/signup" className="btn-primary py-3 px-8 text-lg shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                 Start Free
               </Link>
             </div>
           </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
