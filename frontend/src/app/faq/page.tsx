import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'FAQ & Support — CosmoFolio',
  description: 'Frequently asked questions and support for CosmoFolio.',
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-12 prose prose-gray">
        <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
        <p className="text-sm text-gray-500 mb-8">Need help? You're in the right place.</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">What is CosmoFolio?</h2>
        <p className="mb-6">
          CosmoFolio is a powerful architecture portfolio generator designed to help students and professionals quickly build stunning, professional portfolios without the hassle of traditional layout software.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">How do I get started?</h2>
        <p className="mb-6">
          Simply sign up for a free account, browse our templates, and start uploading your projects. You can export your portfolio to PDF or publish it online instantly.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">Is it free to use?</h2>
        <p className="mb-6">
          Yes! We offer a completely free tier that includes basic templates and features. We also offer premium features for advanced customization and high-resolution exports.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-3">How do I export my portfolio?</h2>
        <p className="mb-6">
          Once you have finished editing, click the "Export" button in the editor. You can choose to download it as a high-quality PDF or share a live web link.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">Still need help?</h2>
        <p className="mb-6">
          If you have any other questions, feel free to reach out to our support team directly. We are always happy to help!
        </p>
        
        <div className="mt-8">
          <Link href="/contact" className="inline-block bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition">
            Contact Support
          </Link>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
