"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { PageHeader } from '@/components/page-header'
import { BrandLoader } from '@/components/brand-loader'
import { ToolWorkspace, ToolPanel, ToolTip } from '@/components/tool-workspace'
import { useWallet } from '@/lib/wallet/compatibility'

interface ProcessResult {
  analysis: string
  chromaticPrompt: string
  chromaticImageUrl: string
  originalUploadUrl?: string
  instructions?: string
  backgroundMode?: "original" | "transparent"
}

export default function StickerMakerPage() {
  const { isConnected, currentAddress } = useWallet()
  
  // Determine active wallet (Bitcoin only)
  const { activeWalletAddress, activeWalletConnected } = useMemo(() => {
    if (currentAddress && isConnected) {
      return { activeWalletAddress: currentAddress, activeWalletConnected: true }
    }
    return { activeWalletAddress: null, activeWalletConnected: false }
  }, [currentAddress, isConnected])
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ProcessResult | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [customInstructions, setCustomInstructions] = useState("")
  const [backgroundMode, setBackgroundMode] = useState<"original" | "transparent">("transparent")
  const [credits, setCredits] = useState<number | null>(null)
  const [loadingCredits, setLoadingCredits] = useState(false)

  const MAX_IMAGES = 4
  const CREDITS_PER_STICKER = 1.5

  // Load credits
  useEffect(() => {
    const loadCredits = async () => {
      if (!activeWalletAddress) {
        setCredits(null)
        return
      }

      setLoadingCredits(true)
      try {
        const response = await fetch(`/api/credits?wallet_address=${encodeURIComponent(activeWalletAddress)}`)
        if (response.ok) {
          const data = await response.json()
          const creditsValue = data.credits
          // Ensure credits is a number
          const numCredits = typeof creditsValue === 'number' 
            ? creditsValue 
            : (typeof creditsValue === 'string' ? parseFloat(creditsValue) || 0 : 0)
          setCredits(numCredits)
        } else {
          setCredits(0)
        }
      } catch (error) {
        console.error('Error loading credits:', error)
        setCredits(0)
      } finally {
        setLoadingCredits(false)
      }
    }

    if (activeWalletConnected && activeWalletAddress) {
      loadCredits()
    } else {
      setCredits(null)
    }
  }, [activeWalletConnected, activeWalletAddress])

  // Listen for credit refresh events
  useEffect(() => {
    const handleRefreshCredits = async () => {
      if (!activeWalletAddress) return
      setLoadingCredits(true)
      try {
        const response = await fetch(`/api/credits?wallet_address=${encodeURIComponent(activeWalletAddress)}`)
        if (response.ok) {
          const data = await response.json()
          const creditsValue = data.credits
          // Ensure credits is a number
          const numCredits = typeof creditsValue === 'number' 
            ? creditsValue 
            : (typeof creditsValue === 'string' ? parseFloat(creditsValue) || 0 : 0)
          setCredits(numCredits)
        }
      } catch (error) {
        console.error('Error refreshing credits:', error)
      } finally {
        setLoadingCredits(false)
      }
    }

    window.addEventListener('refreshCredits', handleRefreshCredits)
    return () => {
      window.removeEventListener('refreshCredits', handleRefreshCredits)
    }
  }, [activeWalletAddress])

  useEffect(() => {
    if (selectedFiles.length === 0) {
      setPreviewUrls([])
      return
    }

    const urls = selectedFiles.map(file => URL.createObjectURL(file))
    setPreviewUrls(urls)

    return () => {
      urls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [selectedFiles])

  const formattedAnalysis = useMemo(() => {
    if (!result?.analysis) return ""

    return result.analysis
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .join("\n\n")
  }, [result?.analysis])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (files.length === 0) {
      setSelectedFiles([])
      return
    }

    // Check maximum image limit
    if (files.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed. You selected ${files.length} images. Please select ${MAX_IMAGES} or fewer.`)
      setSelectedFiles([])
      return
    }

    const validFiles: File[] = []
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError(`"${file.name}" is not a valid image file.`)
        continue
      }

      if (file.size > 12 * 1024 * 1024) {
        setError(`"${file.name}" is too large. Images must be 12MB or smaller.`)
        continue
      }

      validFiles.push(file)
    }

    if (validFiles.length === 0) {
      setSelectedFiles([])
      return
    }

    setError(null)
    setResult(null)
    setSelectedFiles(validFiles)
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setResult(null)
  }

  const handleProcess = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select at least one image to process.")
      return
    }

    if (selectedFiles.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed. You selected ${selectedFiles.length} images.`)
      return
    }

    if (!activeWalletConnected || !activeWalletAddress) {
      setError("Please connect your wallet to use Sticker Creator Beta.")
      return
    }

    // Check if user has enough credits
    if (credits !== null && typeof credits === 'number' && credits < CREDITS_PER_STICKER) {
      const creditsDisplay = typeof credits === 'number' ? credits.toFixed(1) : '0'
      setError(`Insufficient credits. You need ${CREDITS_PER_STICKER} credit${CREDITS_PER_STICKER > 1 ? 's' : ''} to generate a sticker. You have ${creditsDisplay} credit${credits !== 1 ? 's' : ''}. Please purchase credits.`)
      return
    }

    try {
      setIsProcessing(true)
      setError(null)

      const formData = new FormData()
      selectedFiles.forEach((file, index) => {
        formData.append(`image${index}`, file)
      })
      formData.append("imageCount", selectedFiles.length.toString())
      formData.append("instructions", customInstructions)
      formData.append("backgroundMode", backgroundMode)
      formData.append("wallet_address", activeWalletAddress)

      let response: Response
      try {
        response = await fetch("/api/sticker-maker", {
          method: "POST",
          body: formData,
        })
      } catch (fetchError) {
        console.error("[sticker-maker] Network error:", fetchError)
        if (fetchError instanceof TypeError && fetchError.message === "Failed to fetch") {
          throw new Error(
            "Unable to connect to the server. Please check your connection and try again."
          )
        }
        throw new Error(
          `Network error: ${fetchError instanceof Error ? fetchError.message : "Unknown error"}`
        )
      }

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch (parseError) {
          try {
            const text = await response.text()
            errorData = { error: text || `Server error (status ${response.status})` }
          } catch {
            errorData = { error: `Server error (status ${response.status})` }
          }
        }
        
        const errorMessage = errorData?.error || errorData?.details || `Failed to process image (status ${response.status})`
        const errorCode = errorData?.code || ''
        
        if (errorCode === 'moderation_blocked' || errorMessage.includes('safety system')) {
          throw new Error(
            'Content was blocked by safety filters. Please try adjusting your instructions or use a different image.'
          )
        }
        
        throw new Error(errorMessage)
      }

      const data = (await response.json()) as ProcessResult
      setResult(data)
      setLastUpdated(new Date().toLocaleString())
      
      // Trigger credit refresh after successful generation
      window.dispatchEvent(new CustomEvent('refreshCredits'))
    } catch (processError) {
      console.error("[sticker-maker] process error:", processError)
      setError(
        processError instanceof Error
          ? processError.message
          : "Failed to process the image. Please try again.",
      )
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <PageHeader
        title="Sticker Creator"
        subtitle="Transform any image into a sticker with transparent backgrounds"
        action={
          <div className="px-3.5 py-2 rounded-full bg-[#131318] border border-white/[0.08] text-xs sm:text-sm font-semibold whitespace-nowrap">
            <span className="text-[#2DE2FF]">{CREDITS_PER_STICKER} credit{CREDITS_PER_STICKER > 1 ? 's' : ''} / sticker</span>
          </div>
        }
      />

      <ToolWorkspace className="space-y-5">
        {!activeWalletConnected && (
          <ToolTip tone="cyan">
            Please connect your wallet to use Sticker Creator Beta.
          </ToolTip>
        )}

        {activeWalletConnected && credits !== null && typeof credits === 'number' && credits < CREDITS_PER_STICKER && (
          <ToolTip tone="amber">
            Insufficient credits. You need {CREDITS_PER_STICKER} credit{CREDITS_PER_STICKER > 1 ? 's' : ''} to generate a sticker.
            You have {credits.toFixed(1)} credit{credits !== 1 ? 's' : ''}. Please purchase credits.
          </ToolTip>
        )}

        <section className="grid items-start gap-5 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
          <ToolPanel
            title="Setup"
            subtitle="Image, look, and background"
            className="lg:sticky lg:top-28"
          >
            <div className="space-y-5">
              <div className="relative flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-white/[0.12] bg-[#0c0c10] p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  id="sticker-maker-file-input"
                />
                <label
                  htmlFor="sticker-maker-file-input"
                  className="hg-btn-glow relative z-20 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#2DE2FF] hover:opacity-90 px-4 py-2 text-sm font-bold text-[#0a0a0c] transition-all duration-200 pointer-events-none"
                >
                  {selectedFiles.length > 0 ? `Change Image${selectedFiles.length > 1 ? 's' : ''}` : "Select Image(s)"}
                </label>
                <p className="relative z-20 text-xs text-zinc-500 pointer-events-none">
                  Supported formats: PNG, JPG, WEBP. Max size 12MB per image.
                  {selectedFiles.length === 0 && <><br />Upload up to {MAX_IMAGES} images to combine elements in one sticker.</>}
                </p>
              </div>

              {previewUrls.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-zinc-400">
                    Preview{selectedFiles.length > 1 ? 's' : ''}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative space-y-2">
                        <div className="relative overflow-hidden rounded-xl border border-white/[0.08]">
                          <Image
                            src={url}
                            alt={`Selected image ${index + 1} preview`}
                            width={400}
                            height={400}
                            className="h-auto w-full object-contain"
                            unoptimized
                          />
                          <button
                            onClick={() => removeFile(index)}
                            className="absolute top-2 right-2 bg-[#FF2BD6]/90 hover:bg-[#FF2BD6] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition"
                            title="Remove image"
                          >
                            ×
                          </button>
                        </div>
                        <p className="text-xs text-zinc-500">
                          Image {index + 1}: {selectedFiles[index]?.name} · {(((selectedFiles[index]?.size ?? 0) / 1024)).toFixed(1)} KB
                        </p>
                      </div>
                    ))}
                  </div>
                  {selectedFiles.length > 1 && (
                    <ToolTip tone="amber">
                      Combine elements from multiple images into one sticker.
                    </ToolTip>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="sticker-maker-custom-instructions" className="block text-sm font-semibold text-white">
                    Custom instructions (optional)
                  </label>
                  {customInstructions && (
                    <button
                      type="button"
                      onClick={() => setCustomInstructions("")}
                      className="text-xs font-semibold text-zinc-500 hover:text-[#FF2BD6]"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  id="sticker-maker-custom-instructions"
                  placeholder={selectedFiles.length > 1
                    ? "Describe how you want the sticker to look. Use prompts like 'combine all elements from the images' or 'make it more colorful'."
                    : "Describe how you want the sticker to look. Examples: 'make it more colorful', 'add sparkles', 'make it cute', etc."}
                  value={customInstructions}
                  onChange={(event) => setCustomInstructions(event.target.value)}
                  className="h-32 w-full rounded-xl border border-white/[0.1] bg-[#0c0c10] p-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#2DE2FF]/50"
                />
                <p className="text-xs text-zinc-500">
                  Optional: Add custom instructions to modify the sticker style or appearance.
                </p>
              </div>

              <div className="space-y-3">
                <span className="block text-sm font-semibold text-white">Background</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setBackgroundMode("original")}
                    className={`flex-1 min-w-[140px] rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      backgroundMode === "original"
                        ? "border-[#2DE2FF] bg-[#2DE2FF]/15 text-[#2DE2FF]"
                        : "border-white/[0.1] bg-[#0c0c10] text-zinc-400 hover:text-white"
                    }`}
                  >
                    Keep original
                  </button>
                  <button
                    type="button"
                    onClick={() => setBackgroundMode("transparent")}
                    className={`flex-1 min-w-[140px] rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      backgroundMode === "transparent"
                        ? "border-[#2DE2FF] bg-[#2DE2FF]/15 text-[#2DE2FF]"
                        : "border-white/[0.1] bg-[#0c0c10] text-zinc-400 hover:text-white"
                    }`}
                  >
                    Transparent
                  </button>
                </div>
                <p className="text-xs text-zinc-500">
                  Transparent mode creates a sticker with no background. Original mode preserves the full scene.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={handleProcess}
                  disabled={selectedFiles.length === 0 || isProcessing || !activeWalletConnected || (credits !== null && typeof credits === 'number' && credits < CREDITS_PER_STICKER)}
                  className="hg-btn-glow inline-flex items-center gap-2 rounded-full bg-[#2DE2FF] hover:opacity-90 px-5 py-2.5 text-sm font-bold text-[#0a0a0c] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <BrandLoader variant="inline" label="Creating sticker" />
                  ) : (
                    <>Create sticker ({CREDITS_PER_STICKER} credit{CREDITS_PER_STICKER > 1 ? 's' : ''})</>
                  )}
                </button>
                {lastUpdated && (
                  <p className="text-xs text-zinc-500">Last processed: {lastUpdated}</p>
                )}
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/[0.08] p-3 text-sm text-red-300">
                  {error}
                </div>
              )}
            </div>
          </ToolPanel>

          <div className="space-y-5">
            <ToolPanel title="Sticker">
              {result?.chromaticImageUrl ? (
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0c10]">
                    <Image
                      src={result.chromaticImageUrl}
                      alt="Generated sticker"
                      width={1024}
                      height={1024}
                      className="h-auto w-full object-contain"
                      unoptimized
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={result.chromaticImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hg-btn-glow inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold"
                    >
                      Open full size
                    </a>
                  </div>
                  <ToolTip tone="cyan">
                    Right-click the image and select &quot;Save image as…&quot; to download your sticker.
                  </ToolTip>
                </div>
              ) : (
                <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.12] bg-[#0c0c10] px-6 text-center">
                  <p className="text-lg font-semibold text-white">Your sticker shows up here</p>
                  <p className="mt-2 max-w-sm text-sm text-zinc-500">
                    Add an image on the left, pick a background, then create. Analysis and the prompt stay under the result.
                  </p>
                </div>
              )}
            </ToolPanel>

            <details className="rounded-2xl border border-white/[0.1] bg-[#131318] px-5 py-4">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-300">Analysis and prompt</summary>
              <div className="mt-4 space-y-4">
            <ToolPanel
              title="Analysis"
              action={
                result?.analysis ? (
                  <button
                    onClick={() => navigator.clipboard.writeText(result.analysis)}
                    className="text-xs font-semibold text-[#2DE2FF] hover:opacity-80 transition-opacity"
                  >
                    Copy text
                  </button>
                ) : null
              }
            >
              <textarea
                readOnly
                value={formattedAnalysis}
                placeholder="Detailed description of the uploaded image will appear here after processing."
                className="h-48 w-full resize-none rounded-xl border border-white/[0.1] bg-[#0c0c10] p-4 font-mono text-sm leading-relaxed text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#2DE2FF]/50"
              />
            </ToolPanel>

            <ToolPanel
              title="Prompt"
              action={
                result?.chromaticPrompt ? (
                  <button
                    onClick={() => navigator.clipboard.writeText(result.chromaticPrompt)}
                    className="text-xs font-semibold text-[#2DE2FF] hover:opacity-80 transition-opacity"
                  >
                    Copy prompt
                  </button>
                ) : null
              }
            >
              <textarea
                readOnly
                value={result?.chromaticPrompt ?? ""}
                placeholder="The sticker generation prompt will appear here after processing."
                className="h-48 w-full resize-none rounded-xl border border-white/[0.1] bg-[#0c0c10] p-4 font-mono text-sm leading-relaxed text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#2DE2FF]/50"
              />
            </ToolPanel>
              </div>
            </details>
          </div>
        </section>
      </ToolWorkspace>
    </div>
  )
}

