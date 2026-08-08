import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Video Tutorial | CosmoFolio',
  description: 'Learn how to create a professional architecture portfolio step-by-step with CosmoFolio.',
}

export default function TutorialPage() {
  const youtubeUrl = "https://www.youtube.com/watch?v=MTp7nkFEAqI&t=33s"
  const embedUrl = "https://www.youtube.com/embed/MTp7nkFEAqI?start=33&autoplay=0"

  return (
    <div className="min-h-screen bg-bg-primary text-charcoal font-sans antialiased overflow-hidden">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <header className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden bg-charcoal text-white">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none opacity-40">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent-gold/20 blur-[120px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full mix-blend-screen" />
        </div>

        <div className="container-centered relative z-10 text-center max-w-4xl mx-auto px-4">
          <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-widest uppercase mb-6 text-accent-gold-light">
            Video Guide & Walkthrough
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-tight">
            How to Build Your <br />
            <span className="text-gold-gradient">Architecture Portfolio</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Watch our step-by-step tutorial to master layout design, sheet arrangement, and exporting studio-ready portfolios effortlessly.
          </p>
        </div>
      </header>

      <main>
        {/* Video Embed Section */}
        <section className="py-16 md:py-24 bg-white relative">
          <div className="container-centered max-w-5xl px-4">
            
            {/* Video Card Container */}
            <div className="bg-charcoal rounded-3xl p-4 md:p-8 shadow-2xl border border-white/10 overflow-hidden relative">
              <div className="relative w-full pb-[56.25%] h-0 rounded-2xl overflow-hidden shadow-lg bg-black">
                <iframe
                  className="absolute top-0 left-0 w-full h-full border-0"
                  src={embedUrl}
                  title="CosmoFolio Architecture Portfolio Tutorial"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>

              {/* Video Info & Direct YouTube Button */}
              <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10">
                <div>
                  <h3 className="text-xl font-semibold text-white">Full Video Tutorial</h3>
                  <p className="text-sm text-gray-400">Step-by-step walkthrough for architecture portfolio creation</p>
                </div>
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-xl transition shadow-lg hover:shadow-red-600/30 flex-shrink-0"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.898.502 5.784a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.898 24 12 24 12s0-3.898-.502-5.784zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  Watch on YouTube
                </a>
              </div>
            </div>

            {/* Quick Steps Covered */}
            <div className="mt-16 grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-bg-subtle border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-accent-gold/20 flex items-center justify-center text-accent-gold font-bold text-lg mb-4">
                  1
                </div>
                <h4 className="text-xl font-bold text-charcoal mb-2">Select Template</h4>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Choose from architectural templates tailored for internship applications, studio projects, or professional practice.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-bg-subtle border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-accent-gold/20 flex items-center justify-center text-accent-gold font-bold text-lg mb-4">
                  2
                </div>
                <h4 className="text-xl font-bold text-charcoal mb-2">Organize Content</h4>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Arrange drawings, site plans, renders, and project descriptions seamlessly using our layout grids.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-bg-subtle border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-accent-gold/20 flex items-center justify-center text-accent-gold font-bold text-lg mb-4">
                  3
                </div>
                <h4 className="text-xl font-bold text-charcoal mb-2">Export & Publish</h4>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Export high-resolution print-ready PDFs or share a live digital portfolio link with recruiters.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-charcoal text-center px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-accent-gold/5"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to create your portfolio?</h2>
            <p className="text-lg text-gray-300 mb-10">Get started today with CosmoFolio's guided portfolio builder.</p>
            <div className="flex justify-center gap-4">
              <Link href="/signup" className="btn-primary py-3 px-8 text-lg shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                Start Building Free
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
