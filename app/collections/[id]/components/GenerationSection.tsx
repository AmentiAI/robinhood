'use client'

import { useState, useEffect } from 'react'
import { isAdmin } from '@/lib/auth/access-control'
import { BrandLoader } from '@/components/brand-loader'
import { ToolTip } from '@/components/tool-workspace'

interface Layer {
  id: string
  name: string
  trait_count: number
}

interface GenerationSectionProps {
  collection: { id: string; collection_status?: string }
  layers: Layer[]
  queuedJobs: number
  processingJobs: number
  traitFilters: Record<string, string>
  layerTraits: Record<string, string[]>
  generateQuantity: number
  setGenerateQuantity: (q: number) => void
  useClassicMode: boolean
  setUseClassicMode: (v: boolean) => void
  generating: boolean
  currentAddress: string | null | undefined
  onGenerate: () => void
  onClearFilters: () => void
  onFilterChange: (layerName: string, traitName: string) => void
}

export function GenerationSection({
  collection,
  layers,
  queuedJobs,
  processingJobs,
  traitFilters,
  layerTraits,
  generateQuantity,
  setGenerateQuantity,
  useClassicMode,
  setUseClassicMode,
  generating,
  currentAddress,
  onGenerate,
  onClearFilters,
  onFilterChange,
}: GenerationSectionProps) {
  const isUserAdmin = isAdmin(currentAddress || null)
  const hasActiveFilters = Object.values(traitFilters).some((v) => v && v !== '')
  const [quantityDisplay, setQuantityDisplay] = useState<string>(generateQuantity.toString())

  useEffect(() => {
    setQuantityDisplay(generateQuantity.toString())
  }, [generateQuantity])

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#131318] p-4 sm:p-6 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(45,226,255,0.45), rgba(255,43,214,0.35), transparent)',
        }}
      />

      <div className="relative z-10">
        {(queuedJobs > 0 || processingJobs > 0) && (
          <div className="mb-5 rounded-xl border border-[#2DE2FF]/25 bg-[#2DE2FF]/[0.06] p-4">
            <div className="flex items-center gap-3">
              <BrandLoader variant="inline" label="Processing" />
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {processingJobs > 0
                    ? `Processing ${processingJobs} generation${processingJobs !== 1 ? 's' : ''}`
                    : 'Generations queued'}
                </h3>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {processingJobs > 0
                    ? 'Your NFTs are being generated. This may take a few minutes…'
                    : queuedJobs > 0
                      ? `${queuedJobs} generation${queuedJobs !== 1 ? 's' : ''} waiting in queue`
                      : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <div className="mb-5 rounded-xl border border-[#FF2BD6]/25 bg-[#FF2BD6]/[0.06] p-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[#FF2BD6] mb-1">Trait filters active</h3>
                <p className="text-sm text-zinc-500 mb-2">
                  Selected traits will be used instead of random selection.
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(traitFilters)
                    .filter(([_, value]) => value && value !== '')
                    .map(([layerName, traitName]) => (
                      <span
                        key={layerName}
                        className="inline-flex items-center gap-1 rounded-full border border-[#FF2BD6]/30 bg-[#FF2BD6]/10 text-[#FF2BD6] px-2.5 py-1 text-xs font-medium"
                      >
                        <span className="font-semibold">{layerName}:</span>
                        <span>{traitName}</span>
                      </span>
                    ))}
                </div>
              </div>
              <button
                onClick={onClearFilters}
                className="inline-flex h-9 px-4 items-center rounded-full border border-[#FF2BD6]/35 text-[#FF2BD6] text-sm font-semibold hover:bg-[#FF2BD6]/10 transition-colors whitespace-nowrap"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 mb-5">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2DE2FF]/70 mb-1">
                Studio
              </p>
              <h2 className="text-xl font-bold text-white">Generate NFTs</h2>
              <p className="text-sm text-zinc-500 mt-1">
                {collection?.collection_status === 'launchpad' && !isUserAdmin
                  ? 'Generation is disabled for launchpad collections'
                  : 'Create NFTs from your layers and traits'}
              </p>
            </div>

            <div className="inline-flex gap-1 p-1 rounded-full bg-[#0c0c10] border border-white/[0.08]">
              <button
                onClick={() => setUseClassicMode(false)}
                disabled={generating || layers.length === 0}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 ${
                  !useClassicMode
                    ? 'bg-white text-black'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                Model 1.1
              </button>
              <button
                onClick={() => setUseClassicMode(true)}
                disabled={generating || layers.length === 0}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 ${
                  useClassicMode
                    ? 'bg-white text-black'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                Model 1.0
              </button>
            </div>
          </div>

          {collection?.collection_status === 'launchpad' && !isUserAdmin ? (
            <ToolTip tone="magenta">
              Generation is disabled for collections on launchpad.
            </ToolTip>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <button
                onClick={onGenerate}
                disabled={generating || layers.length === 0}
                className={`hg-btn-glow rounded-full px-6 py-3 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto transition-opacity ${
                  hasActiveFilters
                    ? 'bg-[#FF2BD6] text-white'
                    : 'bg-[#2DE2FF] text-[#0a0a0c]'
                }`}
              >
                {generating ? (
                  <BrandLoader variant="inline" label="Queueing" />
                ) : hasActiveFilters ? (
                  `Generate ${generateQuantity > 1 ? `${generateQuantity} ` : ''}NFT${generateQuantity > 1 ? 's' : ''} (filtered)`
                ) : (
                  `Generate ${generateQuantity > 1 ? `${generateQuantity} ` : ''}NFT${generateQuantity > 1 ? 's' : ''}`
                )}
              </button>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-xs text-zinc-500 whitespace-nowrap">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantityDisplay}
                  onChange={(e) => {
                    const val = e.target.value
                    setQuantityDisplay(val)
                    const num = parseInt(val)
                    if (!isNaN(num) && num >= 1) {
                      setGenerateQuantity(num)
                    }
                  }}
                  onBlur={(e) => {
                    const num = parseInt(e.target.value)
                    if (isNaN(num) || num < 1) {
                      setQuantityDisplay('1')
                      setGenerateQuantity(1)
                    } else {
                      setQuantityDisplay(num.toString())
                      setGenerateQuantity(num)
                    }
                  }}
                  className="flex-1 sm:w-24 rounded-xl border border-white/[0.1] bg-[#0c0c10] px-3 py-2.5 text-white text-center focus:border-[#2DE2FF] focus:outline-none"
                  disabled={generating || layers.length === 0}
                />
              </div>
            </div>
          )}
        </div>

        {layers.length === 0 && (
          <ToolTip tone="amber">
            Add layers and traits before generating NFTs.
          </ToolTip>
        )}

        {layers.length > 0 && (
          <div className="rounded-xl border border-white/[0.08] bg-[#0c0c10] p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              {layers.map((layer) => (
                <div key={layer.id}>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">{layer.name}</label>
                  <select
                    value={traitFilters[layer.name] || ''}
                    onChange={(e) => onFilterChange(layer.name, e.target.value)}
                    className="w-full rounded-xl border border-white/[0.1] bg-[#131318] px-3 py-2.5 text-sm text-white focus:border-[#2DE2FF] focus:outline-none"
                  >
                    <option value="" className="bg-[#0a0a0c] text-white">
                      All {layer.name}
                    </option>
                    {(layerTraits[layer.name] || []).map((traitName) => (
                      <option key={traitName} value={traitName} className="bg-[#0a0a0c] text-white">
                        {traitName}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <button
              onClick={onClearFilters}
              className="text-sm text-[#2DE2FF] hover:text-[#7aefff] transition-colors font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
