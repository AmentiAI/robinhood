'use client'

import { useState, useMemo } from 'react'
import { estimateImageGenerationCost, buildFullPrompt, formatCost } from '@/lib/cost-estimation'
import { PageHeader } from '@/components/page-header'

export default function PromptEstimatorPage() {
  const [description, setDescription] = useState('')
  const [borderStyle, setBorderStyle] = useState(
    'thin decorative frame with intricate corner ornaments'
  )
  const [artStyle, setArtStyle] = useState(
    'professional digital illustration, cute cartoonish style'
  )
  const [batchCount, setBatchCount] = useState(1)
  const [imageSize, setImageSize] = useState<'1024x1024' | '1024x1792' | '1792x1024'>('1024x1024')
  const [quality, setQuality] = useState<'standard' | 'hd'>('hd')

  const costEstimation = useMemo(() => {
    if (!description.trim()) return null
    const fullPrompt = buildFullPrompt(description, borderStyle, artStyle, 0, batchCount)
    return estimateImageGenerationCost(fullPrompt, batchCount, imageSize, quality)
  }, [description, borderStyle, artStyle, batchCount, imageSize, quality])

  const borderOptions = [
    'thin decorative frame with intricate corner ornaments',
    'ornate gothic frame with intricate skull decorations and bone filigree',
    'spooky frame with detailed spider webs stretching across corners',
    'haunted frame with twisted thorny vines and floral corner ornaments',
    'dark frame with bat silhouettes and gothic arch carvings',
    'eerie frame with dripping wax effects and melting ornamental corners',
    'occult frame with mystical symbols and pentagram corner elements',
    'graveyard frame with tombstone shapes and iron gate corner details',
    'witchy frame with potion bottles and cauldron corner decorations',
    'skeletal frame with ribcage patterns and skull corner ornaments',
  ]

  const inputClass =
    'w-full p-3 rounded-xl border border-white/[0.1] bg-[#0c0c10] text-white placeholder-zinc-600 focus:border-[#2DE2FF] focus:outline-none focus:ring-2 focus:ring-[#2DE2FF]/20 transition-colors'

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <PageHeader
        title="Prompt cost estimator"
        subtitle="Estimate image generation cost with OpenAI gpt-image-2"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="hg-rise rounded-2xl border border-white/[0.1] bg-[#131318] p-5 sm:p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Prompt settings</h2>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Image description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you want to generate…"
                className={`${inputClass} h-32 resize-none`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Art style</label>
              <input
                type="text"
                value={artStyle}
                onChange={(e) => setArtStyle(e.target.value)}
                placeholder="Professional digital illustration style…"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Border style</label>
              <select
                value={borderStyle}
                onChange={(e) => setBorderStyle(e.target.value)}
                className={inputClass}
              >
                {borderOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Generate count (1–100)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={batchCount}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(100, parseInt(e.target.value) || 1))
                  setBatchCount(val)
                }}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Image size</label>
              <select
                value={imageSize}
                onChange={(e) =>
                  setImageSize(e.target.value as '1024x1024' | '1024x1792' | '1792x1024')
                }
                className={inputClass}
              >
                <option value="1024x1024">1024×1024 (Square)</option>
                <option value="1024x1792">1024×1792 (Portrait)</option>
                <option value="1792x1024">1792×1024 (Landscape)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Quality</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as 'standard' | 'hd')}
                className={inputClass}
              >
                <option value="standard">Standard</option>
                <option value="hd">HD</option>
              </select>
            </div>
          </div>

          <div className="hg-rise hg-rise-delay-1 rounded-2xl border border-white/[0.1] bg-[#131318] p-5 sm:p-6 sticky top-4 h-fit">
            <h2 className="text-lg font-semibold text-white mb-4">Cost estimation</h2>

            {!description.trim() ? (
              <div className="text-center py-10 text-zinc-500 text-sm">
                Enter a description to see cost estimation
              </div>
            ) : costEstimation ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/[0.08] bg-[#0c0c10] p-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-zinc-400 text-sm">Per image</span>
                    <span className="text-white font-mono font-bold text-lg">
                      {formatCost(costEstimation.perImage)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600">
                    {costEstimation.size} · {costEstimation.quality.toUpperCase()} quality
                  </p>
                </div>

                <div className="rounded-xl border border-[#2DE2FF]/25 bg-[#2DE2FF]/10 p-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white font-semibold text-sm">Total cost</span>
                    <span className="text-[#2DE2FF] font-mono font-bold text-2xl">
                      {formatCost(costEstimation.total)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    For {batchCount} image{batchCount > 1 ? 's' : ''}
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-[#0c0c10] p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Estimated tokens</span>
                    <span className="text-white font-mono">
                      {costEstimation.estimatedTokens.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Model</span>
                    <span className="text-white">gpt-image-2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Size</span>
                    <span className="text-white">{costEstimation.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Quality</span>
                    <span className="text-white">{costEstimation.quality.toUpperCase()}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-[#0c0c10] p-4">
                  <h3 className="text-sm font-semibold text-white mb-2">Full prompt preview</h3>
                  <div className="bg-[#0a0a0c] rounded-lg p-3 max-h-40 overflow-y-auto">
                    <pre className="text-xs text-zinc-500 whitespace-pre-wrap font-mono">
                      {buildFullPrompt(description, borderStyle, artStyle, 0, batchCount)}
                    </pre>
                  </div>
                  <p className="text-xs text-zinc-600 mt-2">
                    Characters:{' '}
                    {buildFullPrompt(description, borderStyle, artStyle, 0, batchCount).length.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-xl border border-[#FBBF24]/20 bg-[#FBBF24]/5 px-3 py-2.5">
                  <p className="text-xs text-zinc-400">
                    Pricing is based on OpenAI&apos;s current rates. Actual costs may vary.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-5 hg-rise hg-rise-delay-2 rounded-2xl border border-white/[0.1] bg-[#131318] p-5 sm:p-6">
          <h3 className="text-base font-semibold text-white mb-3">About cost estimation</h3>
          <ul className="space-y-1.5 text-sm text-zinc-400 list-disc list-inside">
            <li>Costs are calculated per image generated, not per token.</li>
            <li>Token count is estimated for reference only (~4 characters per token).</li>
            <li>HD quality costs more than Standard quality.</li>
            <li>Different image sizes have different pricing tiers.</li>
            <li>Total cost = per image cost × number of images.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
