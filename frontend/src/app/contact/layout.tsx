import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | CosmoFolio',
  description: 'Get in touch with the CosmoFolio team. We are here to help you with your architecture portfolio.',
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
