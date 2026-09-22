'use client'

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
    <aside className="lg:sticky lg:top-24">
      <Link
        href={`/collections/${collectionId}`}
        className="inline-flex h-9 px-4 items-center rounded-full border border-white/[0.1] text-sm font-semibold text-zinc-300 hover:border-[#2DE2FF]/40 hover:text-[#2DE2FF] transition-colors"
      >
        Back to collection
      </Link>
      {collectionName ? (
        <p className="mt-4 text-sm font-semibold text-white truncate">{collectionName}</p>
      ) : null}
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        Launch steps
      </p>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
        {steps.map((step) => {
          const active = currentStep === step.number
          const done = currentStep > step.number
          return (
            <button
              key={step.number}
              type="button"
              onClick={() => onStepClick?.(step.number as Step)}
              disabled={!onStepClick}
              className={`min-w-[168px] shrink-0 rounded-2xl border px-4 py-3 text-left transition-all lg:min-w-0 lg:w-full ${
                active
                  ? 'border-[#2DE2FF] bg-[#2DE2FF] text-[#0a0a0c] shadow-[0_0_28px_rgba(45,226,255,0.22)]'
                  : done
                    ? 'border-[#2DE2FF]/30 bg-[#131318] text-white hover:border-[#2DE2FF]/55'
                    : 'border-white/[0.06] bg-[#0c0c10] text-zinc-500 hover:border-white/20 hover:text-zinc-300'
              } ${onStepClick ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] font-bold tracking-[0.2em] ${active ? 'text-[#0a0a0c]/60' : 'text-zinc-500'}`}>
                  0{step.number}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wide ${active ? 'text-[#0a0a0c]/70' : done ? 'text-[#2DE2FF]' : 'text-zinc-600'}`}>
                  {active ? 'Current' : done ? 'Done' : 'Later'}
                </span>
              </div>
              <div className={`mt-1 text-base font-bold ${active ? 'text-[#0a0a0c]' : done ? 'text-white' : 'text-zinc-400'}`}>
                {step.title}
              </div>
              <div className={`text-xs ${active ? 'text-[#0a0a0c]/70' : 'text-zinc-500'}`}>
                {step.description}
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
