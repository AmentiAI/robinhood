'use client'

import { useState, useEffect } from 'react'
import { isAdmin } from '@/lib/auth/access-control'

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

const CYAN = '#2DE2FF'
const MAGENTA = '#FF2BD6'

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
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#050507] p-4 sm:p-6">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${CYAN}, ${MAGENTA}, transparent)` }}
      />
      <div className="pointer-events-none absolute -top-24 -right-16 w-64 h-64 rounded-full blur-[90px] bg-[#2DE2FF]/10" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 w-56 h-56 rounded-full blur-[80px] bg-[#FF2BD6]/10" />

      <div className="relative z-10">
        {(queuedJobs > 0 || processingJobs > 0) && (
          <div className="mb-6 border border-[#2DE2FF]/30 bg-[#2DE2FF]/[0.06] rounded-xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-2 border-[#2DE2FF]/25 border-t-[#2DE2FF]" />
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {processingJobs > 0
                      ? `Processing ${processingJobs} Generation${processingJobs !== 1 ? 's' : ''}`
                      : 'Generations Queued'}
                  </h3>
                  <p className="text-sm text-white/60 mt-1">
                    {processingJobs > 0
                      ? 'Your NFTs are being generated. This may take a few minutes...'
                      : queuedJobs > 0
                        ? `${queuedJobs} generation${queuedJobs !== 1 ? 's' : ''} waiting in queue`
                        : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <div className="mb-6 border border-[#FF2BD6]/35 bg-[#FF2BD6]/[0.06] rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2 w-2 rounded-full bg-[#FF2BD6] shadow-[0_0_8px_#FF2BD6]" />
                  <h3 className="text-base sm:text-lg font-bold text-[#FF2BD6]">Trait Filters Active</h3>
                </div>
                <p className="text-sm text-white/60 mb-2">
                  The selected trait filters will be used in generation instead of random selection.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(traitFilters)
                    .filter(([_, value]) => value && value !== '')
                    .map(([layerName, traitName]) => (
                      <span
                        key={layerName}
                        className="inline-flex items-center gap-1 bg-[#FF2BD6]/15 border border-[#FF2BD6]/40 text-[#FF2BD6] px-2.5 py-1 rounded text-xs font-medium"
                      >
                        <span className="font-semibold">{layerName}:</span>
                        <span>{traitName}</span>
                      </span>
                    ))}
                </div>
              </div>
              <button
                onClick={onClearFilters}
                className="bg-[#FF2BD6] hover:bg-[#FF2BD6]/85 text-black px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors whitespace-nowrap"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2DE2FF] mb-1">
                HoodGFX
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Generate NFTs</h2>
              <p className="text-sm text-white/40 mt-1">
                {collection?.collection_status === 'launchpad' && !isUserAdmin
                  ? 'Generation is disabled for launchpad collections'
                  : 'Create NFTs from your layers and traits'}
              </p>
            </div>

            <div className="flex items-center rounded-xl border border-[#2DE2FF]/25 bg-black/40 overflow-hidden">
              <button
                onClick={() => setUseClassicMode(false)}
                disabled={generating || layers.length === 0}
                className={`px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  !useClassicMode
                    ? 'bg-gradient-to-r from-[#2DE2FF] to-[#FF2BD6] text-black'
                    : 'text-white/45 hover:text-white bg-transparent'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Model 1.1
              </button>
              <div className="w-px h-7 bg-[#2DE2FF]/25" />
              <button
                onClick={() => setUseClassicMode(true)}
                disabled={generating || layers.length === 0}
                className={`px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  useClassicMode
                    ? 'bg-gradient-to-r from-[#2DE2FF] to-[#FF2BD6] text-black'
                    : 'text-white/45 hover:text-white bg-transparent'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Model 1.0
              </button>
            </div>
          </div>

          {collection?.collection_status === 'launchpad' && !isUserAdmin ? (
            <div className="border border-[#FF2BD6]/35 bg-[#FF2BD6]/[0.06] rounded-xl p-3.5">
              <p className="text-sm text-[#FF2BD6]">
                Generation is disabled for collections on launchpad.
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <button
                onClick={onGenerate}
                disabled={generating || layers.length === 0}
                className={`text-black px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-[15px] font-bold transition-all duration-200 w-full sm:w-auto ${
                  hasActiveFilters
                    ? 'bg-[#FF2BD6] hover:bg-[#FF2BD6]/85 shadow-[0_0_24px_rgba(255,43,214,0.25)]'
                    : 'bg-gradient-to-r from-[#2DE2FF] to-[#FF2BD6] hover:opacity-90 shadow-[0_0_24px_rgba(45,226,255,0.25)]'
                }`}
              >
                {generating
                  ? 'Queueing...'
                  : hasActiveFilters
                    ? `Generate ${generateQuantity > 1 ? `${generateQuantity} ` : ''}NFT${generateQuantity > 1 ? 's' : ''} (Filtered)`
                    : `Generate ${generateQuantity > 1 ? `${generateQuantity} ` : ''}NFT${generateQuantity > 1 ? 's' : ''}`}
              </button>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-xs sm:text-sm text-white/50 whitespace-nowrap">Quantity:</label>
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
                  className="flex-1 sm:w-24 border border-[#2DE2FF]/30 rounded-xl px-3 py-2.5 bg-black/50 text-white text-center focus:border-[#2DE2FF] focus:outline-none focus:ring-2 focus:ring-[#2DE2FF]/20"
                  disabled={generating || layers.length === 0}
                />
              </div>
            </div>
          )}
        </div>

        {layers.length === 0 && (
          <div className="text-center py-8 text-[#FF2BD6] bg-[#FF2BD6]/[0.06] border border-[#FF2BD6]/30 rounded-xl">
            Please add layers and traits before generating NFTs
          </div>
        )}

        {layers.length > 0 && (
          <div className="bg-black/40 border border-[#2DE2FF]/20 rounded-xl p-4 mb-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
              {layers.map((layer) => (
                <div key={layer.id}>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">{layer.name}</label>
                  <select
                    value={traitFilters[layer.name] || ''}
                    onChange={(e) => onFilterChange(layer.name, e.target.value)}
                    className="w-full border border-[#2DE2FF]/25 rounded-xl px-3 py-2.5 text-sm bg-[#0a0a0c] text-white focus:border-[#2DE2FF] focus:outline-none focus:ring-2 focus:ring-[#2DE2FF]/20"
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
              className="text-sm text-[#2DE2FF] hover:text-[#FF2BD6] transition-colors font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
