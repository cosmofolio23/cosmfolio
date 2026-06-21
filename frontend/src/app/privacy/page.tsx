import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Privacy Policy — CosmoFolio',
  description: 'How CosmoFolio collects, uses, and protects your information.',
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Navigation */}
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-12 prose prose-gray">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: 20 June 2026</p>

        <p className="mb-6">
          This Privacy Policy explains how CosmoFolio (&quot;we&quot;, &quot;us&quot;) collects, uses, and
          protects your information when you use our architecture portfolio generator at
          thecosmofolio.com (the &quot;Service&quot;). By using the Service you agree to this policy.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">1. Information we collect</h2>
        <ul className="list-disc pl-6 space-y-1 mb-6">
          <li><strong>Account information</strong> — your name and email address when you sign up (authentication is handled by Firebase).</li>
          <li><strong>Demographic information</strong> — details you optionally provide at signup (such as country, profession, or education stage) to help us improve the product.</li>
          <li><strong>Content you create</strong> — portfolio documents, text, and images you upload, which are stored so you can edit and export them.</li>
          <li><strong>Usage data</strong> — basic analytics about how the Service is used, and cookies set by Google AdSense for advertising.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-3">2. How we use your information</h2>
        <ul className="list-disc pl-6 space-y-1 mb-6">
          <li>To provide, maintain, and improve the Service.</li>
          <li>To store and render the portfolios you create.</li>
          <li>To understand aggregate usage and improve features.</li>
          <li>To communicate important account or service notices.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-3">3. Advertising &amp; cookies</h2>
        <p className="mb-6">
          We use Google AdSense to display ads. Third-party vendors, including Google, use cookies to
          serve ads based on your prior visits to this and other websites. You can opt out of
          personalised advertising by visiting{' '}
          <a className="text-blue-600 underline" href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">4. Storage &amp; third parties</h2>
        <p className="mb-6">
          Your content and account data are stored using Supabase and Firebase. We do not sell your
          personal information. We share data only with the service providers needed to operate the
          Service, or where required by law.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">5. Your rights</h2>
        <p className="mb-6">
          You can request access to, correction of, or deletion of your personal data and portfolios
          at any time by contacting us. Deleting your account removes your stored portfolios.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">6. Children</h2>
        <p className="mb-6">The Service is not directed to children under 13, and we do not knowingly collect their data.</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">7. Changes</h2>
        <p className="mb-6">We may update this policy from time to time. Material changes will be reflected by the &quot;last updated&quot; date above.</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">8. Contact</h2>
        <p className="mb-6">
          Questions about this policy? Email us at{' '}
          <a className="text-blue-600 underline" href="mailto:thecosmofolio@gmail.com">thecosmofolio@gmail.com</a>.
        </p>

        <div className="mt-12 pt-6 border-t border-gray-200 text-sm text-gray-500">
          <Link href="/terms" className="text-blue-600 underline">Terms of Service</Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
