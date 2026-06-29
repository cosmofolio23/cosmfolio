import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import CookieConsent from '@/components/CookieConsent'
import AuthInit from '@/components/AuthInit'
import ContentProtector from '@/components/ContentProtector'
import MobileWarningBanner from '@/components/MobileWarningBanner'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  metadataBase: new URL('https://thecosmofolio.com'),
  title: 'Architecture Portfolio Creator | CosmoFolio',
  description: 'The best architecture portfolio creator. Build, design, and export professional architecture portfolios in minutes. Free to start.',
  keywords: ['architecture portfolio creator', 'portfolio creator for architects', 'architecture portfolio', 'portfolio generator', 'online portfolio maker', 'architecture students', 'architecture portfolio builder'],
  alternates: {
    canonical: 'https://thecosmofolio.com',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',

  openGraph: {
    title: 'Architecture Portfolio Creator | CosmoFolio',
    description: 'The best architecture portfolio creator. Build, design, and export professional architecture portfolios in minutes. Free to start.',
    url: 'https://thecosmofolio.com',
    siteName: 'CosmoFolio',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'CosmoFolio Social Share Card' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Architecture Portfolio Creator | CosmoFolio',
    description: 'The best architecture portfolio creator. Build, design, and export professional architecture portfolios in minutes.',
    images: ['/og-image.png'],
  },
  verification: {
    google: 'JJ_fe3hMtaz8RQriwpGJ1b5oWPkTDYsBXhIWbhApmus',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@600;700&display=swap" rel="stylesheet" />
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4751453750202709" 
          crossOrigin="anonymous" 
        ></script>
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "CosmoFolio",
              "url": "https://thecosmofolio.com",
              "logo": "https://thecosmofolio.com/logo.png",
              "sameAs": [
                "https://www.instagram.com/thecosmofolio",
                "https://www.linkedin.com/company/cosmofolio"
              ]
            })
          }}
        />
      </head>
      <body className="min-h-screen bg-white text-charcoal font-sans antialiased flex flex-col">
        <ContentProtector />
        <MobileWarningBanner />
        <AuthInit />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <CookieConsent />
      </body>
    </html>
  )
}
