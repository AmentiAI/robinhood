'use client'

import { Collection } from '../types'

interface LaunchHeaderProps {
  collection: Collection
  serverTime: Date | null
  launchStatus: string
  onLaunchMint?: () => void
  onEndMint?: () => void
  saving?: boolean
  phasesCount?: number
  actualMintedCount?: number
  totalSupply?: number
  launchMode?: 'owner-mint' | 'launchpad' | 'marketplace' | null
  onShowMetadata?: () => void
}

export default function LaunchHeader({
  collection,
  serverTime,
  launchStatus,
  onLaunchMint,
  onEndMint,
  saving = false,
  phasesCount = 0,
  actualMintedCount,
  totalSupply,
  launchMode,
}: LaunchHeaderProps) {
  return (
    <div className="mb-8 space-y-4">
      <div className="rounded-2xl border border-white/[0.08] bg-[#131318]/80 backdrop-blur-sm px-5 sm:px-7 py-5 sm:py-6 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#2DE2FF]/80 mb-2">
              Launchpad
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Launch settings
            </h1>
            <p className="text-sm text-zinc-500 mt-1">{collection.name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {launchStatus === 'draft' && onLaunchMint && (
              <button
                onClick={onLaunchMint}
                disabled={saving || phasesCount === 0}
              className="hg-btn-glow inline-flex h-9 px-4 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Launch mint
              </button>
            )}
            {launchStatus === 'active' && onEndMint && (
              <button
                onClick={onEndMint}
                disabled={saving}
                className="inline-flex h-9 px-4 items-center rounded-full border border-red-500/30 text-red-400 text-sm font-semibold hover:border-red-500/50 transition-colors disabled:opacity-50"
              >
                End mint
              </button>
            )}
          </div>
        </div>

        {serverTime && (
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              {
                label: 'Server UTC',
                value: serverTime.toISOString().slice(0, 19).replace('T', ' '),
              },
              { label: 'Local', value: serverTime.toLocaleString() },
              {
                label: 'Timezone',
                value: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/[0.08] bg-[#0c0c10] px-3 py-2"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  {item.label}
                </p>
                <p className="font-mono text-xs text-zinc-300 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {launchMode === 'owner-mint' ? (
        <div className="rounded-2xl border border-[#2DE2FF]/25 bg-[#2DE2FF]/[0.06] px-5 py-4">
          <p className="text-sm font-bold text-[#2DE2FF]">Owner mint mode</p>
          <p className="text-sm text-zinc-400 mt-1">
            Mint NFTs directly to wallets for reserves, giveaways, or pre-launch distribution.
          </p>
          {totalSupply ? (
            <p className="text-sm text-zinc-500 mt-2">
              Minted:{' '}
              <span className="font-semibold text-white">{actualMintedCount || 0}</span> /{' '}
              {totalSupply}
            </p>
          ) : null}
        </div>
      ) : (
        <div
          className={`rounded-2xl border px-5 py-4 ${
            launchStatus === 'active'
              ? 'border-emerald-500/30 bg-emerald-500/[0.08]'
              : launchStatus === 'completed'
                ? 'border-white/[0.08] bg-[#131318]'
                : 'border-amber-500/25 bg-amber-500/[0.06]'
          }`}
        >
          <p
            className={`text-sm font-bold ${
              launchStatus === 'active'
                ? 'text-emerald-400'
                : launchStatus === 'completed'
                  ? 'text-zinc-300'
                  : 'text-amber-300'
            }`}
          >
            {launchStatus === 'active'
              ? 'Mint is live'
              : launchStatus === 'scheduled'
                ? 'Mint scheduled'
                : launchStatus === 'completed'
                  ? 'Mint completed'
                  : 'Draft — configure mint settings below'}
          </p>
          {totalSupply ? (
            <p className="text-sm text-zinc-500 mt-1.5">
              Progress:{' '}
              <span className="font-semibold text-white">{collection.total_minted || 0}</span> /{' '}
              {totalSupply} minted
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
