import Link from 'next/link'
import Logo from '@/components/Logo'
import Image from 'next/image'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-charcoal font-sans antialiased">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 glass-nav shadow-elevation-1">
        <div className="container-centered py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-[#111111] p-1.5 rounded-lg flex items-center justify-center">
              <Logo size="sm" variant="gold" />
            </div>
            <span className="text-2xl font-bold">Cosmo<span className="text-gold-gradient">Folio</span></span>
          </Link>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-sm font-medium">
              <Link href="/about" className="text-accent-primary dark:text-accent-gold transition">About</Link>
              <Link href="/pricing" className="text-text-primary dark:text-dark-text-primary hover:text-accent-primary dark:hover:text-accent-gold transition">Pricing</Link>
              <Link href="/contact" className="text-text-primary dark:text-dark-text-primary hover:text-accent-primary dark:hover:text-accent-gold transition">Contact</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/signin" className="btn-secondary btn-small">Sign In</Link>
              <Link href="/signup" className="btn-primary btn-small hidden sm:inline-flex">Sign Up</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-20 md:py-32">
        <div className="container-centered max-w-4xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary dark:text-dark-text-primary mb-6">
              About CosmoFolio
            </h1>
            <p className="text-lg text-text-secondary dark:text-dark-text-secondary max-w-2xl mx-auto leading-relaxed">
              CosmoFolio is the ultimate portfolio generation tool built specifically for architecture and design students. 
              We streamline the process of building professional presentations so you can focus on what matters most: your designs.
            </p>
          </div>

          <div className="bg-accent-gold/5 border border-accent-gold/20 rounded-3xl p-8 md:p-12 mb-16 text-center shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-primary via-accent-gold to-accent-primary opacity-50"></div>
            <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-6">Our Mission</h2>
            <p className="text-xl italic text-text-secondary dark:text-dark-text-secondary font-medium leading-relaxed">
              "Architects should spend more time designing ideas, not fighting with presentation layouts."
            </p>
          </div>

          {/* About Founder */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 space-y-6">
              <h2 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">
                About the Founder
              </h2>
              <p className="text-text-secondary dark:text-dark-text-secondary leading-relaxed">
                Hi, I'm <strong className="text-text-primary dark:text-dark-text-primary">Ar. Bose Raj</strong>. 
                During my architecture education and early career, I noticed a consistent pain point: students and young professionals were losing countless hours wrestling with InDesign, Illustrator, and Photoshop just to format their portfolios.
              </p>
              <p className="text-text-secondary dark:text-dark-text-secondary leading-relaxed">
                The content was brilliant, but the presentation process was broken. I built CosmoFolio to bridge this gap. By combining high-quality templates with an intuitive editor, we empower designers to create stunning portfolios in minutes, not days.
              </p>
            </div>
            <div className="order-1 md:order-2 flex justify-center">
              <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-white shadow-xl">
                {/* Fallback image if founder photo is not uploaded */}
                <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
                  <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-charcoal text-white py-16">
        <div className="container-centered">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-[#111111] p-1.5 rounded-lg flex items-center justify-center">
                  <Logo size="sm" variant="gold" />
                </div>
                <span className="text-2xl font-bold">Cosmo<span className="text-gold-gradient">Folio</span></span>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-stone-300">
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-stone-300">
                <li><a href="mailto:cosmoatelier.live@gmail.com" className="hover:text-white transition">cosmoatelier.live@gmail.com</a></li>
                <li><a href="https://www.instagram.com/cosmoatelier.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Instagram</a></li>
                <li><a href="https://www.linkedin.com/company/cosmo-atelier" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">LinkedIn</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-stone-300">
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-stone-400 text-sm">
            <p>&copy; 2026 CosmoFolio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
