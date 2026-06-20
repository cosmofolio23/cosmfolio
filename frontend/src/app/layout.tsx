import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import CookieConsent from '@/components/CookieConsent'

export const metadata: Metadata = {
  metadataBase: new URL('https://thecosmofolio.com'),
  title: 'CosmoFolio — Architecture Portfolio Generator',
  description: 'Build a professional architecture portfolio in minutes from preset templates. Free to start.',
  keywords: ['architecture portfolio', 'portfolio generator', 'architecture students', 'B.Arch portfolio', 'portfolio templates'],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'CosmoFolio — Architecture Portfolio Generator',
    description: 'Build a professional architecture portfolio in minutes from preset templates. Free to start.',
    url: 'https://thecosmofolio.com',
    siteName: 'CosmoFolio',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'CosmoFolio Social Share Card' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CosmoFolio — Architecture Portfolio Generator',
    description: 'Build a professional architecture portfolio in minutes from preset templates.',
    images: ['/og-image.png'],
  },
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
      </head>
      <body>
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
