'use client'

import React from 'react'
import Link from 'next/link'

type Step = 1 | 2 | 3 | 4 | 5

interface StepNavigationProps {
  currentStep: Step
  collectionName: string
  collectionId: string
  onStepClick?: (step: Step) => void
}

const steps = [
  { number: 1, title: 'Settings', description: 'Collection details' },
  { number: 2, title: 'Phases', description: 'Mint phases' },
  { number: 3, title: 'Whitelists', description: 'Exclusive access' },
  { number: 4, title: 'Review', description: 'Confirm config' },
  { number: 5, title: 'Launch', description: 'Go live' },
]

export function StepNavigation({ currentStep, collectionName, collectionId, onStepClick }: StepNavigationProps) {
  return (
    <div className="mb-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#2DE2FF] mb-2">
            Launchpad
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            <span className="hg-gradient-text">Launch collection</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1.5">{collectionName}</p>
        </div>
        <Link
          href={`/collections/${collectionId}`}
          className="inline-flex h-9 px-4 items-center rounded-full border border-white/[0.1] text-sm font-semibold text-zinc-300 hover:border-[#2DE2FF]/40 hover:text-[#2DE2FF] transition-colors shrink-0"
        >
          Back to collection
        </Link>
      </div>
      
      <div className="hg-card rounded-2xl border border-white/[0.1] bg-[#131318] p-4 sm:p-5 overflow-x-auto">
        <div className="flex items-center min-w-[640px] sm:min-w-0">
          {steps.map((step, idx) => (
            <React.Fragment key={step.number}>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => onStepClick?.(step.number as Step)}
                  disabled={!onStepClick}
                  className={`flex flex-col items-center transition-all ${
                    currentStep >= step.number ? 'text-[#2DE2FF]' : 'text-zinc-600'
                  } ${onStepClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border transition-all ${
                      currentStep >= step.number
                        ? 'bg-[#2DE2FF] text-[#0a0a0c] border-[#2DE2FF]'
                        : 'bg-[#0c0c10] border-white/[0.12] text-zinc-500'
                    }`}
                  >
                    {currentStep > step.number ? '✓' : step.number}
                  </div>
                  <div className="mt-2 text-center px-1">
                    <div className="text-xs font-semibold text-white">{step.title}</div>
                    <div className="text-[10px] text-zinc-500 hidden sm:block">{step.description}</div>
                  </div>
                </button>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-px mx-2 sm:mx-3 ${
                    currentStep > step.number ? 'bg-[#2DE2FF]/60' : 'bg-white/[0.08]'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
