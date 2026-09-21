'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useWallet } from '@/lib/wallet/compatibility'
import { isAuthorized } from '@/lib/auth/access-control'
import { estimateImageGenerationCost, buildFullPrompt, formatCost } from '@/lib/cost-estimation'
import { PageHeader } from '@/components/page-header'
import { BrandLoader } from '@/components/brand-loader'
import { ToolWorkspace, ToolPanel } from '@/components/tool-workspace'

interface SimpleImage {
  id: string
  imageUrl: string
  prompt: string
  description: string
  createdAt: string
}

interface Collection {
  id: string
  name: string
  description?: string
  is_active: boolean
}

export default function SimpleGeneratePage() {
  const { isConnected, currentAddress } = useWallet()
  const [images, setImages] = useState<SimpleImage[]>([])
  const [description, setDescription] = useState('')
  const [borderStyle, setBorderStyle] = useState('thin decorative frame with intricate Christmas corner ornaments')
  const [artStyle, setArtStyle] = useState('professional digital illustration, cute cartoonish style')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [batchCount, setBatchCount] = useState(10)
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 })
  const [christmasCollectionId, setChristmasCollectionId] = useState<string | null>(null)
  const [savingImages, setSavingImages] = useState<Set<string>>(new Set())
  const [saveMessages, setSaveMessages] = useState<Record<string, string>>({})

  const authorized = isAuthorized(currentAddress)

  // Calculate cost estimation
  const costEstimation = useMemo(() => {
    if (!description.trim()) return null
    const fullPrompt = buildFullPrompt(description, borderStyle, artStyle, 0, batchCount)
    return estimateImageGenerationCost(fullPrompt, batchCount, '1024x1024', 'hd')
  }, [description, borderStyle, artStyle, batchCount])

  const borderOptions = [
    'thin decorative frame with intricate Christmas corner ornaments',
    'ornate festive frame with holly leaves, berries, and pine branches',
    'elegant Christmas frame with detailed snowflakes and icicles stretching across corners',
    'cozy holiday frame with twisted pine garlands and red ribbon corner ornaments',
    'classic Christmas frame with candy cane stripes and ornament corner details',
    'warm winter frame with gingerbread cookie decorations and frosting ornamental corners',
    'magical Christmas frame with twinkling stars and snowflake corner elements',
    'traditional holiday frame with Christmas tree shapes and gift box corner details',
    'festive frame with Santa hat decorations and reindeer corner ornaments',
    'merry Christmas frame with wreath patterns and bow corner decorations',
  ]

  // Load collections and find/create "christmas" collection
  useEffect(() => {
    if (!isConnected || !currentAddress) {
      setChristmasCollectionId(null)
      return
    }

    const loadCollections = async () => {
      try {
        const response = await fetch(`/api/collections?wallet_address=${encodeURIComponent(currentAddress)}`)
        if (response.ok) {
          const data = await response.json()
          const collections = data.collections || []
          
          // Find "christmas" collection (case-insensitive)
          const christmas = collections.find((c: Collection) => 
            c.name.toLowerCase() === 'christmas'
          )
          
          if (christmas) {
            setChristmasCollectionId(christmas.id)
          } else {
            // Create "christmas" collection
            try {
              const createResponse = await fetch('/api/collections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: 'christmas',
                  description: 'Christmas collection for simple generator images',
                  traitSelections: {},
                  wallet_address: currentAddress,
                }),
              })
              
              if (createResponse.ok) {
                const newCollection = await createResponse.json()
                setChristmasCollectionId(newCollection.collection.id)
              }
            } catch (err) {
              console.error('Error creating christmas collection:', err)
            }
          }
        }
      } catch (error) {
        console.error('Error loading collections:', error)
      }
    }
    
    loadCollections()
  }, [isConnected, currentAddress])

  const handleSaveToCollection = async (image: SimpleImage) => {
    if (!christmasCollectionId) {
      setError('Christmas collection not available. Please try again.')
      return
    }

    setSavingImages((prev) => new Set(prev).add(image.id))
    setSaveMessages((prev) => ({ ...prev, [image.id]: '' }))

    try {
      const response = await fetch('/api/generate-simple/save-to-collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionId: christmasCollectionId,
          imageUrl: image.imageUrl,
          prompt: image.prompt,
          description: image.description,
          artStyle: artStyle,
          borderStyle: borderStyle,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save image to collection')
      }

      setSaveMessages((prev) => ({
        ...prev,
        [image.id]: '✅ Saved to Christmas collection!',
      }))
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSaveMessages((prev) => {
          const newMessages = { ...prev }
          delete newMessages[image.id]
          return newMessages
        })
      }, 3000)
    } catch (err) {
      console.error('Error saving to collection:', err)
      setSaveMessages((prev) => ({
        ...prev,
        [image.id]: err instanceof Error ? err.message : 'Failed to save',
      }))
    } finally {
      setSavingImages((prev) => {
        const newSet = new Set(prev)
        newSet.delete(image.id)
        return newSet
      })
    }
  }

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please enter a description of what you want to generate')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGenerationProgress({ current: 0, total: batchCount })

    try {
      const response = await fetch('/api/generate-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          borderStyle,
          artStyle,
          batchCount,
          wallet_address: currentAddress,
        }),
      })

      if (!response.ok) {
        let errorData: any = null
        let rawText = ''
        
        try {
          // Try to get the response as text first to see what we're dealing with
          rawText = await response.text()
          
          // Log raw response for debugging
          console.log('[Generate Simple] Raw API response:', {
            status: response.status,
            statusText: response.statusText,
            rawTextLength: rawText?.length || 0,
            rawTextPreview: rawText ? rawText.substring(0, 200) : 'EMPTY',
            rawTextExact: rawText === '{}' ? 'LITERAL_EMPTY_OBJECT_STRING' : rawText
          })
          
          // Check if response body is empty or is literally just "{}"
          const trimmedText = rawText?.trim() || ''
          if (!trimmedText || trimmedText === '{}') {
            errorData = { 
              error: `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`,
              note: trimmedText === '{}' ? 'Response body was empty JSON object' : 'Response body was empty'
            }
          } else {
            // Try to parse as JSON
            if (trimmedText.startsWith('{') || trimmedText.startsWith('[')) {
              try {
                const parsed = JSON.parse(trimmedText)
                // Check if parsed result is empty object or array
                if (parsed && typeof parsed === 'object') {
                  const keys = Object.keys(parsed)
                  if (keys.length === 0) {
                    // Empty object/array - create meaningful error
                    errorData = { 
                      error: `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`,
                      note: 'Response body parsed to empty object/array',
                      originalRawText: trimmedText
                    }
                  } else {
                    errorData = parsed
                  }
                } else {
                  errorData = { error: trimmedText || `HTTP ${response.status}: ${response.statusText || 'Unknown error'}` }
                }
              } catch (parseError) {
                  errorData = { 
                    error: trimmedText || `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`,
                    parseError: parseError instanceof Error ? parseError.message : String(parseError)
                  }
              }
            } else {
              errorData = { error: trimmedText || `HTTP ${response.status}: ${response.statusText || 'Unknown error'}` }
            }
          }
        } catch (e) {
          // If parsing fails, use the raw text or status
          errorData = { 
            error: rawText || `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`,
            parseError: e instanceof Error ? e.message : String(e)
          }
        }
        
        // Final safety check - ensure errorData has at least an error property
        if (!errorData || typeof errorData !== 'object') {
          errorData = { error: `HTTP ${response.status}: ${response.statusText || 'Unknown error'}` }
        } else if (Object.keys(errorData).length === 0) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText || 'Unknown error'}` }
        } else if (!errorData.error && !errorData.message && !errorData.details) {
          // Has keys but no standard error fields - add error message
          errorData = { 
            ...errorData,
            error: `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`,
            originalData: errorData
          }
        }
        
        // Extract error message from various possible formats
        const message =
          (typeof errorData?.error === 'string' && errorData.error.trim()) ||
          (typeof errorData?.details === 'string' && errorData.details.trim()) ||
          (errorData?.details?.error?.message && String(errorData.details.error.message)) ||
          (errorData?.details?.message && String(errorData.details.message)) ||
          (errorData?.message && String(errorData.message)) ||
          (rawText && rawText.trim() && rawText.trim() !== '{}') ||
          `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`
        
        // Log comprehensive error information with stringified version to avoid empty object display
        const errorDataString = JSON.stringify(errorData, null, 2)
        console.error('[Generate Simple] API Error:', { 
          status: response.status, 
          statusText: response.statusText,
          errorData: errorDataString !== '{}' ? errorData : { error: `HTTP ${response.status}: ${response.statusText || 'Unknown error'}` },
          errorDataStringified: errorDataString,
          rawText: rawText ? rawText.substring(0, 500) : 'Empty response body',
          rawTextLength: rawText?.length || 0,
          hasErrorData: !!errorData,
          errorDataKeys: errorData ? Object.keys(errorData) : [],
          errorDataType: typeof errorData
        })
        throw new Error(message)
      }

      const data = await response.json()
      
      // Trigger credit refresh in header after successful generation
      window.dispatchEvent(new CustomEvent('refreshCredits'))
      
      // Handle both single result (backward compatibility) and batch results
      const newImages: SimpleImage[] = []
      
      if (data.images && Array.isArray(data.images)) {
        // Batch response
        data.images.forEach((img: any, index: number) => {
          newImages.push({
            id: `simple-${Date.now()}-${index}`,
            imageUrl: img.imageUrl,
            prompt: img.prompt,
            description: description,
            createdAt: img.createdAt || new Date().toISOString(),
          })
        })
        setCurrentPrompt(data.images[0]?.prompt || '')
      } else {
        // Single result (backward compatibility)
        newImages.push({
          id: `simple-${Date.now()}`,
          imageUrl: data.imageUrl,
          prompt: data.prompt,
          description: description,
          createdAt: data.createdAt || new Date().toISOString(),
        })
        setCurrentPrompt(data.prompt)
      }

      setImages((prev) => [...newImages, ...prev])
      setGenerationProgress({ current: batchCount, total: batchCount })
      setDescription('') // Clear description after successful generation
      
      // Show success message with credit deduction info
      const creditsDeducted = newImages.length
      setSuccessMessage(
        `Successfully generated ${creditsDeducted} image${creditsDeducted > 1 ? 's' : ''}! ${creditsDeducted} credit${creditsDeducted > 1 ? 's' : ''} deducted.`
      )
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err) {
      console.error('Generation error:', err)
      let errorMessage = 'Failed to generate image'
      if (err instanceof Error) {
        errorMessage = err.message || errorMessage
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message)
      }
      setError(errorMessage)
      setSuccessMessage(null) // Clear success message on error
    } finally {
      setIsGenerating(false)
      setGenerationProgress({ current: 0, total: 0 })
    }
  }

  const handleDelete = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  // Access control check
  if (!isConnected || !authorized) {
    return (
      <div className="min-h-screen bg-[#0a0a0c]">
        <PageHeader
          title="Simple image generator"
          subtitle="Create unique images with edge-to-edge borders — no traits needed"
        />
        <ToolWorkspace>
          <ToolPanel title="Access restricted" subtitle="This feature is only available to authorized users">
            {!isConnected && (
              <p className="text-sm text-zinc-500 mb-4">Please connect your wallet to continue.</p>
            )}
            <Link
              href="/"
              className="hg-btn-glow inline-flex h-10 items-center px-5 rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold"
            >
              Go home
            </Link>
          </ToolPanel>
        </ToolWorkspace>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] w-full">
      <PageHeader
        title="Simple image generator"
        subtitle="Create unique images with edge-to-edge borders — no traits needed"
        action={
          <Link
            href="/collections"
            className="hg-btn-glow inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold"
          >
            Back to collections
          </Link>
        }
      />

      <ToolWorkspace>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
          <ToolPanel title="Generate" subtitle="Describe what you want — each image follows the same art style">
            <div className="space-y-5">
                  {/* Image Description */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Image description *
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what you want to generate... (e.g., 'A mystical crystal glowing with blue energy', 'A medieval sword with ornate handle', etc.)"
                      className="w-full h-40 p-4 border border-white/[0.1] rounded-xl bg-[#0c0c10] text-white text-sm placeholder:text-zinc-600 focus:border-[#2DE2FF] focus:outline-none resize-none"
                      disabled={isGenerating}
                    />
                  </div>

                  {/* Batch Count */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Generate count (1-10)
                    </label>
                    <div className="flex gap-2 mb-3">
                      {[1, 5, 10].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setBatchCount(count)}
                          disabled={isGenerating}
                          className={`flex-1 py-2.5 px-4 rounded-full font-semibold text-sm transition-colors ${
                            batchCount === count
                              ? 'bg-[#2DE2FF] text-[#0a0a0c]'
                              : 'bg-[#0c0c10] border border-white/[0.1] text-zinc-400 hover:text-white'
                          }`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={batchCount}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(10, parseInt(e.target.value) || 1))
                        setBatchCount(val)
                      }}
                      className="w-full p-3 border border-white/[0.1] rounded-xl bg-[#0c0c10] text-white text-sm placeholder:text-zinc-600 focus:border-[#2DE2FF] focus:outline-none"
                      disabled={isGenerating}
                    />
                    <p className="text-xs text-zinc-500 mt-2">
                      Each image will be unique but follow the same art style and vibe
                    </p>
                  </div>

                  {/* Cost Estimation */}
                  {costEstimation && (
                    <div className="rounded-xl border border-[#2DE2FF]/25 bg-[#2DE2FF]/[0.06] p-4">
                      <h3 className="text-sm font-semibold text-[#2DE2FF] mb-3">
                        Cost estimation
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500">Per image</span>
                          <span className="text-white font-mono font-semibold">{formatCost(costEstimation.perImage)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500">Total ({batchCount} image{batchCount > 1 ? 's' : ''})</span>
                          <span className="text-emerald-400 font-mono font-bold">{formatCost(costEstimation.total)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-zinc-500 pt-2 border-t border-white/[0.08]">
                          <span>Estimated prompt length</span>
                          <span className="font-mono">{costEstimation.estimatedTokens} tokens</span>
                        </div>
                        <div className="text-xs text-zinc-500 pt-1">
                          <span>Model: gpt-image-2 | Size: {costEstimation.size} | Quality: {costEstimation.quality.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Art Style */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Art style
                    </label>
                    <input
                      type="text"
                      value={artStyle}
                      onChange={(e) => setArtStyle(e.target.value)}
                      placeholder="Professional digital illustration style..."
                      className="w-full p-3 border border-white/[0.1] rounded-xl bg-[#0c0c10] text-white text-sm placeholder:text-zinc-600 focus:border-[#2DE2FF] focus:outline-none"
                      disabled={isGenerating}
                    />
                  </div>

                  {/* Border Style */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Border style
                    </label>
                    <select
                      value={borderStyle}
                      onChange={(e) => setBorderStyle(e.target.value)}
                      className="w-full p-3 border border-white/[0.1] rounded-xl bg-[#0c0c10] text-white text-sm focus:border-[#2DE2FF] focus:outline-none"
                      disabled={isGenerating}
                    >
                      {borderOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !description.trim()}
                    className="hg-btn-glow w-full inline-flex items-center justify-center gap-2 bg-[#2DE2FF] text-[#0a0a0c] font-bold py-3 px-6 rounded-full text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <span className="flex flex-col items-center justify-center gap-2">
                        <BrandLoader variant="inline" label="Generating" />
                        {generationProgress.total > 0 && (
                          <span className="text-xs text-[#0a0a0c]/80">
                            Generating {generationProgress.current}/{generationProgress.total}…
                          </span>
                        )}
                      </span>
                    ) : (
                      `Generate ${batchCount} image${batchCount > 1 ? 's' : ''}`
                    )}
                  </button>

                  {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/[0.08] text-red-300 px-4 py-3 text-sm">
                      {error}
                    </div>
                  )}
                  {successMessage && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-200 px-4 py-3 text-sm">
                      {successMessage}
                    </div>
                  )}
            </div>
          </ToolPanel>

          <ToolPanel
            title="Generation prompt"
            action={
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">
                  {currentPrompt.length.toLocaleString()} chars
                </span>
                {currentPrompt && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentPrompt)
                    }}
                    className="hg-btn-glow px-3.5 py-1.5 bg-[#2DE2FF] text-[#0a0a0c] rounded-full hover:opacity-90 text-xs font-bold"
                  >
                    Copy
                  </button>
                )}
              </div>
            }
          >
            <textarea
              value={currentPrompt}
              onChange={(e) => setCurrentPrompt(e.target.value)}
              className="w-full h-[420px] p-4 border border-white/[0.1] rounded-xl bg-[#0c0c10] text-zinc-100 font-mono text-sm resize-none focus:outline-none focus:border-[#2DE2FF]"
              placeholder="Generation prompt will appear here after creating an image..."
              readOnly
            />
          </ToolPanel>
        </div>

          {/* Generated Images Grid */}
          {images.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Generated images ({images.length})
                </p>
                <button
                  onClick={() => setImages([])}
                  className="text-sm font-semibold text-[#FF2BD6] hover:opacity-80"
                >
                  Clear all
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="hg-card bg-[#131318] border border-white/[0.1] rounded-2xl overflow-hidden"
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={image.imageUrl}
                        alt={image.description}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-white mb-2 line-clamp-2">
                        {image.description}
                      </p>
                      <p className="text-xs text-zinc-500 mb-3">
                        {new Date(image.createdAt).toLocaleString()}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveToCollection(image)}
                          disabled={!christmasCollectionId || savingImages.has(image.id)}
                          className="flex-1 text-xs bg-[#2DE2FF] hover:opacity-90 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-[#0a0a0c] py-2 px-3 rounded-full font-bold transition-colors"
                        >
                          {savingImages.has(image.id) ? (
                            <BrandLoader variant="inline" label="Saving" />
                          ) : (
                            'Save to Christmas'
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(image.id)}
                          className="flex-1 text-xs rounded-full font-semibold bg-[#FF2BD6]/15 text-[#FF2BD6] border border-[#FF2BD6]/25 hover:bg-[#FF2BD6]/25 py-2 px-3 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                      {saveMessages[image.id] && (
                        <p className={`text-xs mt-2 ${
                          saveMessages[image.id].startsWith('✅')
                            ? 'text-[#2DE2FF]'
                            : 'text-[#EF4444]'
                        }`}>
                          {saveMessages[image.id]}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {images.length === 0 && !isGenerating && (
            <ToolPanel title="No images yet" subtitle="Describe what you want and generate your first image">
              <p className="text-sm text-zinc-500">Results will appear here after generation.</p>
            </ToolPanel>
          )}
      </ToolWorkspace>
    </div>
  )
}

