import Link from 'next/link'
import Logo from '@/components/Logo'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-primary dark:bg-dark-bg-primary flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Floating Elements */}
      <div className="absolute top-20 -left-20 w-96 h-96 bg-accent-primary/10 dark:bg-accent-gold/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-20 -right-20 w-80 h-80 bg-accent-gold/10 dark:bg-accent-primary/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="relative z-10 text-center max-w-lg glass-card p-10 rounded-2xl border border-border-light dark:border-border-dark shadow-elevation-2">
        <div className="flex justify-center mb-6">
          <Logo size="xl" variant="gold" />
        </div>
        
        <h1 className="text-6xl font-black text-text-primary dark:text-dark-text-primary mb-2">404</h1>
        <h2 className="text-2xl font-bold text-text-secondary dark:text-dark-text-secondary mb-6">Page Not Found</h2>
        
        <p className="text-text-secondary dark:text-dark-text-secondary mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/dashboard"
            className="btn-primary"
          >
            Go to Dashboard
          </Link>
          <Link 
            href="/"
            className="btn-secondary"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
