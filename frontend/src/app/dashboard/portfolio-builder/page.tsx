'use client'

import React from 'react'
import { usePortfolioBuilder } from '@/store/portfolioBuilder'
import { DesignTokenProvider } from '@/components/design-system/DesignTokenProvider'
import { StylePackSelector } from '@/components/preview/StylePackSelector'
import { Step1PageCount } from '@/components/portfolio-builder/steps/Step1PageCount'
import { Step2ProjectCount } from '@/components/portfolio-builder/steps/Step2ProjectCount'
import { Step3FrontPage } from '@/components/portfolio-builder/steps/Step3FrontPage'
import { getStylePack } from '@/lib/stylePackDefinitions'

export default function PortfolioBuilder() {
  const builder = usePortfolioBuilder()
  const currentStylePack = getStylePack(builder.stylePackId)

  const renderStep = () => {
    switch (builder.currentStep) {
      case 1:
        return <Step1PageCount totalPages={builder.totalPages} onSetTotal={builder.setTotalPages} />
      case 2:
        return <Step2ProjectCount projectCount={builder.projectCount} onSetCount={builder.setProjectCount} />
      case 3:
        return <Step3FrontPage layout={builder.frontPage.selectedLayoutId} content={builder.frontPage.content} onSetLayout={builder.setFrontPageLayout} onSetContent={builder.setFrontPageContent} />
      default:
        return <div>Step {builder.currentStep}</div>
    }
  }

  return (
    <DesignTokenProvider stylePackId={builder.stylePackId}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Portfolio Generator</h1>
            <div className="flex items-center justify-between">
              <div className="text-gray-600">Step <span className="font-bold text-blue-600">{builder.currentStep}</span> of <span className="font-bold">{builder.getTotalSteps()}</span></div>
              <div className="w-64 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all" style={{width: `${(builder.currentStep / builder.getTotalSteps()) * 100}%`}} />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            {renderStep()}
          </div>

          <div className="flex gap-4 mb-8">
            <button onClick={builder.prevStep} disabled={builder.currentStep === 1} className="flex-1 px-6 py-3 bg-gray-300 text-gray-800 rounded-lg font-bold hover:bg-gray-400 disabled:opacity-50">Previous</button>
            <button onClick={builder.nextStep} disabled={builder.currentStep === builder.getTotalSteps()} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">Next</button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <StylePackSelector selectedStyleId={builder.stylePackId} onSelect={builder.setStylePack} />
          </div>
        </div>
      </div>
    </DesignTokenProvider>
  )
}
