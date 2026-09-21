'use client'

import React from 'react'
import { Whitelist } from '../types'

interface WhitelistsStepProps {
  whitelists: Whitelist[]
  showNewWhitelistForm: boolean
  setShowNewWhitelistForm: (show: boolean) => void
  editingWhitelistId: string | null
  setEditingWhitelistId: (id: string | null) => void
  newWhitelistName: string
  setNewWhitelistName: (value: string) => void
  newWhitelistDescription: string
  setNewWhitelistDescription: (value: string) => void
  newWhitelistAddresses: string
  setNewWhitelistAddresses: (value: string) => void
  existingWhitelistAddresses: string[]
  onRemoveWhitelistAddress: (address: string) => void
  onCreateWhitelist: () => void
  onEditWhitelist: (whitelistId: string) => void
  onDeleteWhitelist: (whitelistId: string) => void
  onBack: () => void
  onContinue: () => void
  saving: boolean
}

const inputCls =
  'w-full px-4 py-3 border border-white/[0.1] rounded-xl bg-[#0c0c10] text-white placeholder:text-zinc-600 focus:border-[#2DE2FF] focus:outline-none focus:ring-2 focus:ring-[#2DE2FF]/20'

const ghostBtnCls =
  'inline-flex h-10 px-5 items-center rounded-full border border-white/[0.1] text-sm font-semibold text-zinc-300 hover:text-white transition-colors'

export function WhitelistsStep({
  whitelists,
  showNewWhitelistForm,
  setShowNewWhitelistForm,
  editingWhitelistId,
  setEditingWhitelistId,
  newWhitelistName,
  setNewWhitelistName,
  newWhitelistDescription,
  setNewWhitelistDescription,
  newWhitelistAddresses,
  setNewWhitelistAddresses,
  existingWhitelistAddresses,
  onRemoveWhitelistAddress,
  onCreateWhitelist,
  onEditWhitelist,
  onDeleteWhitelist,
  onBack,
  onContinue,
  saving,
}: WhitelistsStepProps) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2DE2FF]/70 mb-1">
          Step 3
        </p>
        <h2 className="text-xl font-bold text-white">Whitelists</h2>
      </div>

      {!showNewWhitelistForm && (
        <button
          onClick={() => setShowNewWhitelistForm(true)}
          className="w-full py-4 border border-dashed border-[#FF2BD6]/30 rounded-2xl text-[#FF2BD6] hover:border-[#FF2BD6]/60 hover:bg-[#FF2BD6]/5 transition-colors text-sm font-semibold"
        >
          + Create whitelist
        </button>
      )}

      {showNewWhitelistForm && (
        <div className="rounded-2xl border border-white/[0.1] bg-[#0c0c10] p-6 space-y-5">
          <h3 className="text-base font-semibold text-white">
            {editingWhitelistId ? 'Edit whitelist' : 'New whitelist'}
          </h3>
          <div className="grid gap-5">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Whitelist name *</label>
              <input
                type="text"
                value={newWhitelistName}
                onChange={(e) => setNewWhitelistName(e.target.value)}
                placeholder="e.g. OG Holders, Early Supporters"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Description</label>
              <textarea
                value={newWhitelistDescription}
                onChange={(e) => setNewWhitelistDescription(e.target.value)}
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </div>
            {editingWhitelistId && existingWhitelistAddresses.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Existing addresses ({existingWhitelistAddresses.length})
                </label>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#131318] p-3">
                  <div className="space-y-2">
                    {existingWhitelistAddresses.map((address, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#0c0c10] border border-white/[0.06]"
                      >
                        <code className="text-xs font-mono text-zinc-400 flex-1 break-all">{address}</code>
                        <button
                          type="button"
                          onClick={() => onRemoveWhitelistAddress(address)}
                          className="shrink-0 inline-flex h-7 px-3 items-center rounded-full text-xs font-semibold text-[#FF2BD6] border border-[#FF2BD6]/30 hover:bg-[#FF2BD6]/10 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                {editingWhitelistId ? 'Add new addresses (one per line)' : 'Addresses (one per line) *'}
              </label>
              <textarea
                value={newWhitelistAddresses}
                onChange={(e) => setNewWhitelistAddresses(e.target.value)}
                rows={6}
                placeholder={editingWhitelistId ? 'Add new addresses (one per line)' : 'bc1q...\n3...'}
                className={`${inputCls} font-mono text-sm resize-none`}
              />
            </div>
            <div className="flex gap-3 pt-2 border-t border-white/[0.06]">
              <button
                onClick={onCreateWhitelist}
                disabled={saving}
                className="hg-btn-glow inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold disabled:opacity-50"
              >
                {saving
                  ? editingWhitelistId
                    ? 'Updating...'
                    : 'Creating...'
                  : editingWhitelistId
                    ? 'Update whitelist'
                    : 'Create whitelist'}
              </button>
              <button
                onClick={() => {
                  setShowNewWhitelistForm(false)
                  setEditingWhitelistId(null)
                }}
                className={ghostBtnCls}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {whitelists.length > 0 && (
        <div className="space-y-3">
          {whitelists.map((whitelist) => (
            <div key={whitelist.id} className="rounded-xl border border-white/[0.1] bg-[#0c0c10] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white">{whitelist.name}</h3>
                  {whitelist.description && (
                    <p className="text-sm text-zinc-400 mt-1">{whitelist.description}</p>
                  )}
                  <p className="text-sm text-zinc-500 mt-1">{whitelist.entries_count} addresses</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => onEditWhitelist(whitelist.id)}
                    className="inline-flex h-9 px-4 items-center rounded-full text-sm font-semibold border border-[#2DE2FF]/30 text-[#2DE2FF] hover:bg-[#2DE2FF]/10 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteWhitelist(whitelist.id)}
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
