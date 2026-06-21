import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing | CosmoFolio',
  description: 'Simple, transparent pricing for architecture portfolio generation. Start free, upgrade when you need to.',
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
