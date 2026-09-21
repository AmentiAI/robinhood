'use client'

import React from 'react'
import { Phase, Whitelist } from '../types'

interface ReviewStepProps {
  collectionDescription: string
  bannerUrl: string
  creatorRoyaltyWallet: string
  twitterUrl: string
  discordUrl: string
  telegramUrl: string
  websiteUrl: string
  phases: Phase[]
  whitelists: Whitelist[]
  onBack: () => void
  onContinue: () => void
}

export function ReviewStep({
  collectionDescription,
  bannerUrl,
  creatorRoyaltyWallet,
  twitterUrl,
  discordUrl,
  telegramUrl,
  websiteUrl,
  phases,
  whitelists,
  onBack,
  onContinue,
}: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2DE2FF]/70 mb-1">
          Step 4
        </p>
        <h2 className="text-xl font-bold text-white">Review</h2>
      </div>
      
      <div className="space-y-4">
        <div className="hg-card rounded-2xl border border-white/[0.1] bg-[#0c0c10] p-4 space-y-2 text-sm text-zinc-300">
          <h3 className="font-semibold text-white mb-2">Collection settings</h3>
          <p><span className="text-zinc-500">Description:</span> {collectionDescription || 'None'}</p>
          <p><span className="text-zinc-500">Banner:</span> {bannerUrl ? 'Uploaded' : 'Missing'}</p>
          <p><span className="text-zinc-500">Payment wallet:</span> {creatorRoyaltyWallet || 'Not set'}</p>
          {twitterUrl && <p><span className="text-zinc-500">Twitter:</span> {twitterUrl}</p>}
          {discordUrl && <p><span className="text-zinc-500">Discord:</span> {discordUrl}</p>}
          {telegramUrl && <p><span className="text-zinc-500">Telegram:</span> {telegramUrl}</p>}
          {websiteUrl && <p><span className="text-zinc-500">Website:</span> {websiteUrl}</p>}
        </div>

        <div className="hg-card rounded-2xl border border-white/[0.1] bg-[#0c0c10] p-4 space-y-2 text-sm text-zinc-300">
          <h3 className="font-semibold text-white mb-2">Mint phases ({phases.length})</h3>
          {phases.length === 0 ? (
            <p className="text-zinc-500">No phases configured</p>
          ) : (
            phases.map((phase) => (
              <p key={phase.id}>
                <span className="font-medium text-white">{phase.phase_name}:</span>{' '}
                {phase.mint_price_sats ? `${(phase.mint_price_sats / 1000000000).toFixed(4)} SOL` : 'Free'}, starts{' '}
                {new Date(phase.start_time).toLocaleString(undefined, { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric', 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true,
                  timeZoneName: 'short'
                })}
                {phase.end_time && `, ends ${new Date(phase.end_time).toLocaleString(undefined, { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric', 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true,
                  timeZoneName: 'short'
                })}`}
              </p>
            ))
          )}
        </div>

        <div className="hg-card rounded-2xl border border-white/[0.1] bg-[#0c0c10] p-4 space-y-2 text-sm text-zinc-300">
          <h3 className="font-semibold text-white mb-2">Whitelists ({whitelists.length})</h3>
          {whitelists.length === 0 ? (
            <p className="text-zinc-500">No whitelists configured</p>
          ) : (
            whitelists.map((wl) => (
              <p key={wl.id}>
                <span className="font-medium text-white">{wl.name}:</span> {wl.entries_count} addresses
              </p>
            ))
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-white/[0.06]">
        <button
          onClick={onBack}
          className="inline-flex h-10 px-5 items-center rounded-full border border-white/[0.1] text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
        >
          Back
        </button>
        <button
          onClick={onContinue}
          className="hg-btn-glow inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
