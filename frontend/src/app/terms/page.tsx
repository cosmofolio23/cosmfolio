import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — CosmoFolio',
  description: 'The terms governing your use of CosmoFolio.',
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-bold text-lg">CosmoFolio</Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">← Back to home</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: 20 June 2026</p>

        <p className="mb-6">
          These Terms of Service (&quot;Terms&quot;) govern your use of CosmoFolio (the &quot;Service&quot;) at
          thecosmofolio.com. By creating an account or using the Service, you agree to these Terms.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">1. The Service</h2>
        <p className="mb-6">
          CosmoFolio lets you generate, edit, and export architecture portfolios from preset
          templates. We may add, change, or remove features at any time. Some features are offered
          on a free tier with usage limits (for example, on the number of pages and exports).
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">2. Your account</h2>
        <p className="mb-6">
          You are responsible for keeping your account credentials secure and for all activity under
          your account. You must provide accurate information when signing up.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">3. Your content</h2>
        <p className="mb-6">
          You retain ownership of the text and images you upload and the portfolios you create. You
          grant us a limited licence to store, process, and display that content solely to operate
          the Service for you. You are responsible for ensuring you have the rights to any content
          you upload and that it does not infringe others&apos; rights or violate any law.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">4. Acceptable use</h2>
        <p className="mb-6">
          You agree not to misuse the Service, including uploading unlawful or infringing content,
          attempting to disrupt or reverse-engineer the Service, or using it to harm others.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">5. Free tier &amp; future paid plans</h2>
        <p className="mb-6">
          The Service is currently offered free with certain limits. We may introduce paid plans in
          the future; any such changes will be communicated before they take effect.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">6. Disclaimer &amp; liability</h2>
        <p className="mb-6">
          The Service is provided &quot;as is&quot; without warranties of any kind. To the maximum extent
          permitted by law, we are not liable for any indirect or consequential damages, or for loss
          of data. We recommend keeping your own copies of important work.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">7. Termination</h2>
        <p className="mb-6">
          You may stop using the Service at any time. We may suspend or terminate accounts that
          violate these Terms.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">8. Changes</h2>
        <p className="mb-6">We may update these Terms; continued use after changes means you accept the updated Terms.</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">9. Contact</h2>
        <p className="mb-6">
          Questions? Email{' '}
          <a className="text-blue-600 underline" href="mailto:boseraj001@gmail.com">boseraj001@gmail.com</a>.
        </p>

        <div className="mt-12 pt-6 border-t border-gray-200 text-sm text-gray-500">
          <Link href="/privacy" className="text-blue-600 underline">Privacy Policy</Link>
        </div>
      </main>
    </div>
  )
}
