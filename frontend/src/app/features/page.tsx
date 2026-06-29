import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Features | Architecture Portfolio Creator',
  description: 'Explore the intelligent features of CosmoFolio that help you build stunning architecture portfolios in minutes.',
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="pt-32 pb-20 bg-bg-subtle relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-primary/10 rounded-full blur-[100px]"></div>
        <div className="container-centered relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-text-primary mb-6">
            Powerful Features for Architects
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Everything you need to create, manage, and export professional architecture portfolios.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container-centered">
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            
            <div className="glass-card p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" /></svg>
              </div>
              <h2 className="text-2xl font-bold mb-4">Intelligent Layout Engine</h2>
              <p className="text-text-secondary mb-6">
                Say goodbye to manually aligning grids. Our engine automatically structures your pages, maintaining perfect alignment, margins, and proportion for A4 exports.
              </p>
            </div>

            <div className="glass-card p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-xl bg-accent-gold/10 text-accent-gold flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
              </div>
              <h2 className="text-2xl font-bold mb-4">Curated Typography & Styles</h2>
              <p className="text-text-secondary mb-6">
                Choose from minimalist, scandinavian, dark studio, and parametric design systems. All typography pairings are professionally curated for architectural presentations.
              </p>
            </div>

            <div className="glass-card p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
              </div>
              <h2 className="text-2xl font-bold mb-4">High-Res Print PDF Export</h2>
              <p className="text-text-secondary mb-6">
                Generate high-quality, print-ready PDF files instantly. We optimize your renders and line weights so your portfolio looks perfect both on screen and on paper.
              </p>
            </div>

            <div className="glass-card p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16V4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4v-2H4V6zm16-4h-3V2h-2v4h-4V2H9v4H5V2H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 16H9v-5h6v5z" /></svg>
              </div>
              <h2 className="text-2xl font-bold mb-4">Project Asset Management</h2>
              <p className="text-text-secondary mb-6">
                Keep your diagrams, sections, plans, and 3D renders perfectly organized. Drop them into your project folders and reuse them across different templates effortlessly.
              </p>
            </div>

          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-primary to-primary-light text-white text-center">
        <div className="container-centered">
          <h2 className="text-4xl font-bold mb-6">Ready to Experience It?</h2>
          <Link href="/signup" className="inline-block px-8 py-4 bg-white text-accent-primary font-semibold rounded-lg hover:shadow-lg transition-all">
            Start Designing Free
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
