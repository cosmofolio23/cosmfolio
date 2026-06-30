'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useAuthStore } from '@/store/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { trackEvent, trackError } from '@/lib/tracking'
import PaymentStatusModal from '@/components/modals/PaymentStatusModal'

/* eslint-disable @typescript-eslint/no-explicit-any */
// react-razorpay requires browser globals — must not run during SSG
const useRazorpay: () => { Razorpay: any } = typeof window !== 'undefined'
  ? (require('react-razorpay').useRazorpay as any)
  : () => ({ Razorpay: null })

const FREE_FEATURES = [
  'Unlimited portfolios',
  '6 pages per portfolio',
  '2 PDF exports (watermarked)',
  'Standard templates',
  'Full design tools',
]

const PRO_FEATURES = [
  'Unlimited portfolios',
  '30 pages per portfolio',
  '3 PDF exports (no watermark)',
  'Standard + Premium templates',
  'Full design tools',
]

const FAQS = [
  {
    q: 'Is CosmoFolio really free?',
    a: 'Yes! You can instantly create a beautiful 6-page portfolio and export 2 high-quality PDFs completely for free. Upgrade to Pro for unlimited pages and premium templates.',
  },
  {
    q: 'Can I download a PDF for job applications?',
    a: 'Absolutely. Our engine generates print-ready PDFs at any standard size (A4, A3, Letter, and more) in both portrait and landscape orientation. They are optimized for emailing to architecture firms, applying to grad school, or printing.',
  },
  {
    q: 'Do I own the rights to my portfolio?',
    a: '100% yes. We do not claim any ownership over your drawings, renders, or portfolio designs. Your work is entirely yours.',
  },
  {
    q: 'Are the templates fully customizable?',
    a: 'Every template is just a starting point. Once applied, you can drag and drop images, change colors, switch typography, and rearrange layouts on the canvas exactly how you want.',
  },
]

function Check() {
  return (
    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function PricingPageInner() {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR')
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { Razorpay } = useRazorpay()
  
  const [promoCode, setPromoCode] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [promoMessage, setPromoMessage] = useState('')
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [userPlan, setUserPlan] = useState('free')
  const [appliedReferralCode, setAppliedReferralCode] = useState('')
  const [discountPercentage, setDiscountPercentage] = useState(0)
  const [paymentStatus, setPaymentStatus] = useState<{isOpen: boolean, status: 'success'|'error'|null, message: string}>({isOpen: false, status: null, message: ''})

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch current plan type
      const fetchPlan = async () => {
        try {
          const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://cosmfolio-production.up.railway.app')
          const token = localStorage.getItem('auth_token')
          const res = await fetch(`${API_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const data = await res.json()
          if (data && data.user) {
            setUserPlan(data.user.plan_type || (data.user.is_pro ? 'pro' : 'free'))
          }
        } catch(e) {}
      }
      fetchPlan()
    }
  }, [isAuthenticated])

  // Auto-trigger checkout after returning from signup
  useEffect(() => {
    const checkout = searchParams.get('checkout') as 'pro_upgrade' | 'boost_pack' | null
    if (checkout && isAuthenticated) {
      handleCheckout(checkout)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, searchParams])

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    setIsApplying(true)
    setPromoMessage('')
    try {
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://cosmfolio-production.up.railway.app')
      const token = localStorage.getItem('auth_token')
      
      // Try as 100% free coupon first
      const res = await fetch(`${API_URL}/api/user/apply-coupon`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: promoCode.trim() })
      })
      
      const data = await res.json()
      if (res.ok) {
        setPromoMessage(data.message || 'Coupon applied successfully! You are now a Pro user.')
        setPromoCode('')
        setUserPlan('pro')
        return
      }
      
      // Try as Referral Code
      const refRes = await fetch(`${API_URL}/api/ambassadors/apply-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referral_code: promoCode.trim() })
      })
      
      if (!refRes.ok) {
         throw new Error('Invalid promo or referral code')
      }
      
      const refData = await refRes.json()
      setAppliedReferralCode(promoCode.trim().toUpperCase())
      setDiscountPercentage(refData.discount_percentage)
      setPromoMessage(`${refData.discount_percentage}% Discount Applied! Checkout now.`)
      
    } catch (err: any) {
      setPromoMessage(err.message || 'Failed to apply promo code')
      setAppliedReferralCode('')
      setDiscountPercentage(0)
    } finally {
      setIsApplying(false)
    }
  }

  const handleRestorePurchase = async () => {
    if (!isAuthenticated) return
    setIsRestoring(true)
    try {
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://cosmfolio-production.up.railway.app')
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/api/payments/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setUserPlan('pro')
        setPaymentStatus({ isOpen: true, status: 'success', message: data.message })
      } else {
        const errMsg = data.error?.message || data.detail || 'Failed to restore purchase'
        setPaymentStatus({ isOpen: true, status: 'error', message: errMsg })
      }
    } catch (err: any) {
      setPaymentStatus({ isOpen: true, status: 'error', message: err.message || 'Network error' })
    } finally {
      setIsRestoring(false)
    }
  }

  const handleCheckout = async (productType: 'pro_upgrade' | 'boost_pack') => {
    trackEvent('upgrade_clicked', { product_type: productType })
    if (!isAuthenticated) {
      router.push(`/signup?redirect=${encodeURIComponent(`/pricing?checkout=${productType}`)}`)
      return
    }

    if (productType === 'boost_pack' && userPlan !== 'pro') {
      alert("Boost Packs are only available for Pro members. Upgrade to Pro first.")
      return
    }

    setIsCheckingOut(true)
    trackEvent('payment_started', { product_type: productType, currency })
    try {
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://cosmfolio-production.up.railway.app')
      const token = localStorage.getItem('auth_token')

      const res = await fetch(`${API_URL}/api/payments/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          product_type: productType, 
          currency,
          referral_code: appliedReferralCode || undefined
        })
      })
      
      if (!res.ok) {
        let errMsg = `Server error ${res.status}`
        try {
          const error = await res.json()
          errMsg = typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail) || errMsg
        } catch {}
        trackError('payment_checkout_error', new Error(errMsg), { product_type: productType })
        throw new Error(errMsg)
      }

      const orderData = await res.json()

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "CosmoFolio",
        description: productType === 'pro_upgrade' ? "Pro Upgrade" : "Boost Pack",
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(`${API_URL}/api/payments/verify-payment`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            })

            if (!verifyRes.ok) {
              const error = await verifyRes.json()
              throw new Error(error.detail || "Payment verification failed")
            }
            
            setPaymentStatus({
              isOpen: true,
              status: 'success',
              message: 'Your account has been upgraded! You now have access to all Pro features.'
            })
            
            if (productType === 'pro_upgrade') {
              setUserPlan('pro')
            }
          } catch(e: any) {
            setPaymentStatus({
              isOpen: true,
              status: 'error',
              message: e.message || "Payment verification failed. Please contact support."
            })
          }
        },
        prefill: {
          email: user?.email || ""
        },
        theme: {
          color: "#c8a97e" // accent-gold
        }
      }

      const rzp = new Razorpay(options)
      rzp.on("payment.failed", function (response: any) {
        setPaymentStatus({
          isOpen: true,
          status: 'error',
          message: 'Payment failed or was cancelled. Please try again.'
        })
      })
      rzp.open()
    } catch (e: any) {
      setPaymentStatus({
        isOpen: true,
        status: 'error',
        message: e.message
      })
    } finally {
      setIsCheckingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-bg-subtle border-b border-gray-100 dark:border-white/5">
        <div className="container-centered py-16 md:py-24 text-center">
          <span className="text-xs uppercase tracking-widest font-semibold text-accent-primary dark:text-accent-gold px-3 py-1 rounded-full bg-accent-primary/10 dark:bg-accent-gold/10">
            Pricing
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 text-text-primary dark:text-dark-text-primary">
            Simple pricing, built for students
          </h1>
          <p className="text-lg text-text-secondary dark:text-dark-text-secondary mt-3 max-w-xl mx-auto">
            Start free. Upgrade only when your portfolio needs more.
          </p>

          <div className="mt-8 flex justify-center items-center gap-3">
            <span className={`text-sm font-medium ${currency === 'INR' ? 'text-text-primary dark:text-dark-text-primary' : 'text-text-tertiary dark:text-dark-text-tertiary'}`}>INR (₹)</span>
            <button 
              onClick={() => setCurrency(currency === 'INR' ? 'USD' : 'INR')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-accent-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-accent-gold transition duration-200 ease-in-out ${currency === 'USD' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${currency === 'USD' ? 'text-text-primary dark:text-dark-text-primary' : 'text-text-tertiary dark:text-dark-text-tertiary'}`}>USD ($)</span>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-white dark:bg-dark-bg-secondary">
        <div className="container-centered">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            {/* Free tier */}
            <div className="glass-card rounded-3xl p-8 border border-gray-100 dark:border-white/10 shadow-md flex flex-col">
              <h2 className="text-xl font-bold text-text-primary dark:text-dark-text-primary">Free</h2>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-bold text-text-primary dark:text-dark-text-primary">
                  {currency === 'INR' ? '₹0' : '$0'}
                </span>
                <span className="text-sm text-text-secondary dark:text-dark-text-secondary">/ forever</span>
              </div>
              <ul className="mt-8 space-y-3 flex-1">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex gap-3 items-start text-sm text-text-secondary dark:text-dark-text-secondary">
                    <Check />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/10">
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary mb-4">
                  <span className="font-semibold text-text-primary dark:text-dark-text-primary">Best for:</span> Trying CosmoFolio, quick portfolios
                </p>
                <Link href="/signup" className="btn-secondary w-full text-center block py-3 md:py-2 text-base md:text-sm">
                  Start Free
                </Link>
              </div>
            </div>

            {/* Pro tier (highlighted) */}
            <div className="glass-card rounded-3xl p-8 border border-accent-gold/40 shadow-xl flex flex-col relative overflow-hidden bg-accent-gold/5">
              <div className="absolute top-0 right-0 bg-accent-gold text-charcoal text-xs font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider">
                Best Value
              </div>
              <h2 className="text-xl font-bold text-text-primary dark:text-dark-text-primary">Founder Access</h2>
              <div className="mt-4 flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="text-5xl font-bold text-text-primary dark:text-dark-text-primary">
                    {discountPercentage > 0 ? (
                      <div className="flex flex-col">
                        <span className="line-through text-2xl text-gray-400">{currency === 'INR' ? '₹299' : '$9.99'}</span>
                        <span>{currency === 'INR' ? `₹${Math.round(299 * (1 - discountPercentage/100))}` : `$${(9.99 * (1 - discountPercentage/100)).toFixed(2)}`}</span>
                      </div>
                    ) : (
                      currency === 'INR' ? '₹299' : '$9.99'
                    )}
                  </span>
                  <span className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-red-200 dark:border-red-500/30">Limited Beta Offer</span>
                </div>
                <span className="text-sm font-bold text-accent-gold mt-3">Lifetime Access • One-time payment</span>
                <span className="text-xs text-text-tertiary dark:text-dark-text-tertiary mt-0.5 italic opacity-80">Pay once, use forever. Price increases soon.</span>
              </div>
              <ul className="mt-8 space-y-3 flex-1">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex gap-3 items-start text-sm text-text-secondary dark:text-dark-text-secondary">
                    <Check />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6 border-t border-accent-gold/20">
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary mb-4">
                  <span className="font-semibold text-text-primary dark:text-dark-text-primary">Best for:</span> Final submissions, applications, thesis
                </p>
                
                <div className="w-full flex flex-col gap-3">
                  {userPlan === 'pro' ? (
                    <div className="w-full text-center py-3 px-4 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 font-semibold text-sm">
                      ✓ You are a Pro Member
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => handleCheckout('pro_upgrade')}
                        disabled={isCheckingOut || isRestoring}
                        className="btn-primary w-full text-center block py-3 md:py-2 text-base md:text-sm shadow-xl shadow-accent-gold/20"
                      >
                        {isCheckingOut ? 'Processing...' : 'Upgrade Now'}
                      </button>
                      {isAuthenticated && (
                        <button
                          onClick={handleRestorePurchase}
                          disabled={isRestoring || isCheckingOut}
                          className="text-xs text-text-secondary hover:text-accent-gold underline decoration-accent-gold/30 underline-offset-4 mt-2 mb-1 transition-colors"
                        >
                          {isRestoring ? 'Restoring...' : 'Paid but not upgraded? Restore Purchase'}
                        </button>
                      )}
                    </div>
                  )}

                  {isAuthenticated && userPlan !== 'pro' && (
                    <div className="mt-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-4">
                      <p className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mb-3">HAVE A PROMO CODE?</p>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Enter code" 
                          value={promoCode}
                          onChange={e => setPromoCode(e.target.value)}
                          className="flex-1 px-3 py-2 text-sm bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-accent-gold"
                        />
                        <button 
                          onClick={handleApplyPromo}
                          disabled={isApplying || !promoCode.trim()}
                          className="btn-primary py-2 px-4 text-sm"
                        >
                          {isApplying ? '...' : 'Apply'}
                        </button>
                      </div>
                      {promoMessage && (
                        <p className={`text-xs mt-3 font-semibold ${promoMessage.includes('success') ? 'text-emerald-500' : 'text-red-500'}`}>
                          {promoMessage}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Boost Pack Add-on */}
          <div className="max-w-2xl mx-auto mt-16">
            <div className={`rounded-3xl p-8 border flex flex-col md:flex-row items-center gap-8 shadow-sm transition-all ${userPlan === 'pro' ? 'border-accent-gold/40 bg-white dark:bg-dark-bg-secondary' : 'border-gray-200 bg-gray-50 opacity-70 cursor-not-allowed'}`}>
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-accent-gold mb-2">
                  <span>🚀</span> CosmoFolio Boost Pack
                </div>
                <h3 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-2">
                  For bigger thesis & professional portfolios
                </h3>
                <p className="text-text-secondary dark:text-dark-text-secondary mb-4 text-sm">
                  Running out of space? Stack Boost Packs on top of your Pro account to permanently increase your portfolio size.
                </p>
                <ul className="space-y-2 mb-0">
                  <li className="flex gap-2 items-center text-sm font-semibold text-text-primary">
                    <Check /> <span>+20 pages for every portfolio</span>
                  </li>
                  <li className="flex gap-2 items-center text-sm font-semibold text-text-primary">
                    <Check /> <span>+2 PDF downloads</span>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col items-center justify-center min-w-[200px] border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 pl-0 md:pl-8">
                <div className="text-3xl font-bold text-text-primary mb-1">
                  {currency === 'INR' ? '₹99' : '$2.99'}
                </div>
                <div className="text-xs text-text-secondary mb-4">per stack</div>
                
                {userPlan === 'pro' ? (
                  <button 
                    disabled
                    className="btn-primary py-3 px-6 w-full text-center shadow-none bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                ) : (
                  <div className="text-center w-full">
                    <button disabled className="btn-secondary py-3 px-6 w-full text-center opacity-50 cursor-not-allowed mb-2">
                      Locked
                    </button>
                    <p className="text-[10px] text-text-tertiary">Requires Pro Membership</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 dark:bg-dark-bg-primary">
        <div className="container-centered max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary dark:text-dark-text-primary mb-4">Frequently Asked Questions</h2>
            <p className="text-text-secondary dark:text-dark-text-secondary">Everything you need to know about CosmoFolio pricing.</p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <details key={i} className="group bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                <summary className="flex items-center justify-between font-semibold p-6 cursor-pointer text-text-primary dark:text-dark-text-primary list-none">
                  {faq.q}
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-text-secondary dark:text-dark-text-secondary">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <PaymentStatusModal 
        isOpen={paymentStatus.isOpen}
        status={paymentStatus.status}
        message={paymentStatus.message}
        onClose={() => {
          setPaymentStatus(prev => ({ ...prev, isOpen: false }))
          if (paymentStatus.status === 'success') {
            window.location.href = "/dashboard/my-portfolios"
          }
        }}
      />

      <Footer />
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingPageInner />
    </Suspense>
  )
}
