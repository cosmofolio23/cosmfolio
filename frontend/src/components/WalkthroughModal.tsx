'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface WalkthroughModalProps {
  isOpen: boolean
  onClose: () => void
}

const STEPS = [
  {
    title: "1. Select a Template",
    description: "Start by picking from over 100+ professionally designed architectural layouts. Each template is meticulously crafted for different presentation styles.",
    image: "/demo-step-1.png"
  },
  {
    title: "2. Customize Your Design",
    description: "Make it your own. Use our intuitive editor to adjust colors, typography, and structure in real-time. Upload your projects instantly.",
    image: "/demo-step-2.png"
  },
  {
    title: "3. Export & Share",
    description: "Once you're satisfied, generate a stunning, print-ready PDF or share a live link with clients and professors instantly.",
    image: "/demo-step-3.png"
  }
]

export default function WalkthroughModal({ isOpen, onClose }: WalkthroughModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setCurrentStep(0)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!mounted || !isOpen) return null

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      onClose()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-5xl bg-[#0F172A] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col md:flex-row min-h-[500px]">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image Area */}
        <div className="flex-1 relative bg-black/50 aspect-video md:aspect-auto">
          <Image 
            src={STEPS[currentStep].image}
            alt={STEPS[currentStep].title}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Content Area */}
        <div className="w-full md:w-[400px] p-8 md:p-12 flex flex-col bg-[#0F172A] relative z-10">
          <div className="flex-1 flex flex-col justify-center">
            {/* Progress indicators */}
            <div className="flex gap-2 mb-8">
              {STEPS.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${idx === currentStep ? 'bg-[#D4AF37]' : 'bg-white/20'}`}
                />
              ))}
            </div>

            <h3 className="text-2xl font-bold text-white mb-4 transition-all">
              {STEPS[currentStep].title}
            </h3>
            <p className="text-gray-300 leading-relaxed text-lg mb-8">
              {STEPS[currentStep].description}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-auto">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`px-4 py-2 text-sm font-medium transition-colors ${currentStep === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:text-white'}`}
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-[#D4AF37] hover:bg-[#FBE7A1] text-black font-semibold rounded-lg transition-colors"
            >
              {currentStep === STEPS.length - 1 ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
