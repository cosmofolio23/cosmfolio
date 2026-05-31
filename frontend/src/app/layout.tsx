import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CosmoFolio - AI Portfolio Generator',
  description: 'Free AI-powered architecture portfolio generator',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
