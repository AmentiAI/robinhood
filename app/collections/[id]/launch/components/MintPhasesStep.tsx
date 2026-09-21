'use client'

import React from 'react'
import { Phase } from '../types'

interface MintPhasesStepProps {
  phases: Phase[]
  whitelists: Array<{ id: string; name: string; entries_count: number }>
  showNewPhaseForm: boolean
  setShowNewPhaseForm: (show: boolean) => void
  editingPhaseId: string | null
  setEditingPhaseId: (id: string | null) => void
  newPhaseName: string
  setNewPhaseName: (value: string) => void
  newPhasePrice: number
  setNewPhasePrice: (value: number) => void
  newPhaseStartTime: string
  setNewPhaseStartTime: (value: string) => void
  newPhaseEndTime: string
  setNewPhaseEndTime: (value: string) => void
  newPhaseWhitelistOnly: boolean
  setNewPhaseWhitelistOnly: (value: boolean) => void
  newPhaseWhitelistId: string | null
  setNewPhaseWhitelistId: (value: string | null) => void
  newPhaseMaxPerWallet: number | null
  setNewPhaseMaxPerWallet: (value: number | null) => void
  newPhaseAllocation: number | null
  setNewPhaseAllocation: (value: number | null) => void
  onCreatePhase: () => void
  onEditPhase: (phaseId: string) => void
  onDeletePhase: (phaseId: string) => void
  onBack: () => void
  onContinue: () => void
  saving: boolean
}

const inputCls =
  'w-full px-4 py-3 border border-white/[0.1] rounded-xl bg-[#0c0c10] text-white placeholder:text-zinc-600 focus:border-[#2DE2FF] focus:outline-none focus:ring-2 focus:ring-[#2DE2FF]/20'

const ghostBtnCls =
  'inline-flex h-10 px-5 items-center rounded-full border border-white/[0.1] text-sm font-semibold text-zinc-300 hover:text-white transition-colors'

export function MintPhasesStep({
  phases,
  whitelists,
  showNewPhaseForm,
  setShowNewPhaseForm,
  editingPhaseId,
  setEditingPhaseId,
  newPhaseName,
  setNewPhaseName,
  newPhasePrice,
  setNewPhasePrice,
  newPhaseStartTime,
  setNewPhaseStartTime,
  newPhaseEndTime,
  setNewPhaseEndTime,
  newPhaseWhitelistOnly,
  setNewPhaseWhitelistOnly,
  newPhaseWhitelistId,
  setNewPhaseWhitelistId,
  newPhaseMaxPerWallet,
  setNewPhaseMaxPerWallet,
  newPhaseAllocation,
  setNewPhaseAllocation,
  onCreatePhase,
  onEditPhase,
  onDeletePhase,
  onBack,
  onContinue,
  saving,
}: MintPhasesStepProps) {
  const endDateTooFar =
    newPhaseEndTime &&
    newPhaseStartTime &&
    (new Date(newPhaseEndTime).getTime() - new Date(newPhaseStartTime).getTime()) / (1000 * 60 * 60 * 24) > 10

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2DE2FF]/70 mb-1">
          Step 2
        </p>
        <h2 className="text-xl font-bold text-white">Mint phases</h2>
      </div>

      {!showNewPhaseForm && (
        <button
          onClick={() => {
            setNewPhaseMaxPerWallet(1)
            setShowNewPhaseForm(true)
          }}
          className="w-full py-4 border border-dashed border-[#FF2BD6]/30 rounded-2xl text-[#FF2BD6] hover:border-[#FF2BD6]/60 hover:bg-[#FF2BD6]/5 transition-colors text-sm font-semibold"
        >
          + Add mint phase
        </button>
      )}

      {showNewPhaseForm && (
        <div className="rounded-2xl border border-white/[0.1] bg-[#0c0c10] p-6 space-y-5">
          <h3 className="text-base font-semibold text-white">
            {editingPhaseId ? 'Edit mint phase' : 'New mint phase'}
          </h3>
          <div className="grid gap-5">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Phase name *</label>
              <input
                type="text"
                value={newPhaseName}
                onChange={(e) => setNewPhaseName(e.target.value)}
                placeholder="e.g. OG Mint, Whitelist, Public Sale"
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Phase start time *</label>
                <input
                  type="datetime-local"
                  value={newPhaseStartTime}
                  onChange={(e) => setNewPhaseStartTime(e.target.value)}
                  className={inputCls}
                />
                <p className="text-xs text-zinc-500 mt-2">
                  Your local time ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Phase end time</label>
                <input
                  type="datetime-local"
                  value={newPhaseEndTime}
                  onChange={(e) => setNewPhaseEndTime(e.target.value)}
                  className={`${inputCls} ${endDateTooFar ? 'border-[#FF2BD6]/50 ring-2 ring-[#FF2BD6]/20' : ''}`}
                />
                <p className="text-xs text-zinc-500 mt-2">
                  Your local time ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                </p>
                {endDateTooFar && (
                  <p className="text-xs text-[#FF2BD6] mt-2 font-medium">
                    End date cannot be more than 10 days from start date.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Mint price (lamports)</label>
                <input
                  type="number"
                  value={newPhasePrice}
                  onChange={(e) => setNewPhasePrice(Math.floor(Number(e.target.value)))}
                  min={0}
                  step={1000000}
                  placeholder="0"
                  className={inputCls}
                />
                {newPhasePrice === 0 && (
                  <p className="text-xs text-zinc-500 mt-2">Free mint (0 ◎)</p>
                )}
                {newPhasePrice > 0 && (
                  <p className="text-xs text-zinc-500 mt-2">{(newPhasePrice / 1000000000).toFixed(4)} SOL</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Max per wallet</label>
                <input
                  type="number"
                  value={newPhaseMaxPerWallet || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      setNewPhaseMaxPerWallet(null)
                    } else {
                      const numValue = Number(value)
                      if (!Number.isNaN(numValue)) {
                        setNewPhaseMaxPerWallet(Math.max(1, Math.floor(numValue)))
                      }
                    }
                  }}
                  min={1}
                  placeholder="Unlimited"
                  className={inputCls}
                />
                <p className="text-xs text-zinc-500 mt-2">Leave blank for unlimited per wallet</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Phase allocation</label>
                <input
                  type="number"
                  value={newPhaseAllocation || ''}
                  onChange={(e) => setNewPhaseAllocation(e.target.value ? Number(e.target.value) : null)}
                  min={1}
                  placeholder="All remaining"
                  className={inputCls}
                />
                <p className="text-xs text-zinc-500 mt-2">Max total mints during phase (blank for all)</p>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-white/[0.08] bg-[#131318] p-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="whitelistOnly"
                  checked={newPhaseWhitelistOnly}
                  onChange={(e) => {
                    setNewPhaseWhitelistOnly(e.target.checked)
                    if (!e.target.checked) {
                      setNewPhaseWhitelistId(null)
                    }
                  }}
                  className="w-4 h-4 text-[#2DE2FF] bg-[#0c0c10] border-white/[0.1] rounded focus:ring-[#2DE2FF]"
                />
                <label htmlFor="whitelistOnly" className="text-sm font-medium text-zinc-300">
                  Whitelist only
                </label>
              </div>

              {newPhaseWhitelistOnly && whitelists.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Assign whitelist</label>
                  <select
                    value={newPhaseWhitelistId || ''}
                    onChange={(e) => setNewPhaseWhitelistId(e.target.value || null)}
                    className={inputCls}
                  >
                    <option value="" className="bg-[#0c0c10]">— No whitelist selected —</option>
                    {whitelists.map((wl) => (
                      <option key={wl.id} value={wl.id} className="bg-[#0c0c10]">
                        {wl.name} ({wl.entries_count} addresses)
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-zinc-500 mt-2">
                    Select a whitelist to restrict this phase to specific addresses
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2 border-t border-white/[0.06]">
              <button
                onClick={onCreatePhase}
                disabled={
                  saving ||
                  !!endDateTooFar ||
                  (newPhasePrice > 0 && newPhasePrice <= 545)
                }
                className="hg-btn-glow inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (editingPhaseId ? 'Updating...' : 'Creating...') : (editingPhaseId ? 'Update phase' : 'Create phase')}
              </button>
              <button
                onClick={() => {
                  setNewPhaseMaxPerWallet(1)
                  setShowNewPhaseForm(false)
                  setEditingPhaseId(null)
                }}
                className={ghostBtnCls}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {phases.length > 0 && (
        <div className="space-y-3">
          {phases.map((phase) => (
            <div key={phase.id} className="rounded-xl border border-white/[0.1] bg-[#0c0c10] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="font-semibold text-white">{phase.phase_name}</h3>
                  <p className="text-sm text-zinc-400">
                    {new Date(phase.start_time).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                      timeZoneName: 'short',
                    })}{' '}
                    –{' '}
                    {phase.end_time
                      ? new Date(phase.end_time).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                          timeZoneName: 'short',
                        })
                      : 'No end'}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {phase.mint_price_sats ? `${(phase.mint_price_sats / 1000000000).toFixed(4)} SOL` : 'Free'}
                  </p>
                  {phase.whitelist_only && (
                    <p className="text-xs text-[#2DE2FF]">
                      Whitelist only
                      {phase.whitelist_name && (
                        <span className="ml-2 text-zinc-500">
                          · {phase.whitelist_name} ({phase.whitelist_entries || 0} addresses)
                        </span>
                      )}
                    </p>
                  )}
                  {!phase.whitelist_only && phase.whitelist_id && (
                    <p className="text-xs text-zinc-500">
                      Whitelist: {phase.whitelist_name || 'Unknown'} ({phase.whitelist_entries || 0} addresses)
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => onEditPhase(phase.id)}
                    className="inline-flex h-9 px-4 items-center rounded-full text-sm font-semibold border border-[#2DE2FF]/30 text-[#2DE2FF] hover:bg-[#2DE2FF]/10 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeletePhase(phase.id)}
                    className="inline-flex h-9 px-4 items-center rounded-full text-sm font-semibold border border-[#FF2BD6]/30 text-[#FF2BD6] hover:bg-[#FF2BD6]/10 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-6 border-t border-white/[0.06]">
        <button onClick={onBack} className={ghostBtnCls}>
          ← Back
        </button>
        <button
          onClick={onContinue}
          className="hg-btn-glow inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold"
        >
          Continue →
        </button>
      </div>
    </div>
  )
}
