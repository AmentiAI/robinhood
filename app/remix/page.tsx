'use client'

import { PageHeader } from '@/components/page-header'
import { BrandLoader } from '@/components/brand-loader'
import { ToolWorkspace, ToolPanel, ToolTip } from '@/components/tool-workspace'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface UploadedImage {
  id: string
  file: File
  preview: string
  name: string
}

interface GeneratedImage {
  id: string
  imageUrl: string
  prompt: string
  createdAt: string
}

export default function RemixPage() {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newImages = files.map((file) => ({
      id: `img-${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }))
    setImages((prev) => [...prev, ...newImages])
  }

  const removeImage = (id: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.id === id)
      if (image) {
        URL.revokeObjectURL(image.preview)
      }
      return prev.filter((img) => img.id !== id)
    })
  }

  const handleGenerate = async () => {
    if (images.length === 0) {
      setError('Please upload at least one image')
      return
    }

    if (!prompt.trim()) {
      setError('Please enter a prompt describing what you want')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Convert images to base64
      const imagePromises = images.map((img) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            resolve(result)
          }
          reader.onerror = reject
          reader.readAsDataURL(img.file)
        })
      })

      const imageDataUrls = await Promise.all(imagePromises)

      const response = await fetch('/api/remix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: imageDataUrls,
          prompt: prompt.trim(),
          imageNames: images.map((img) => img.name),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate' }))
        throw new Error(errorData.error || 'Failed to generate image')
      }

      const data = await response.json()

      const newGeneratedImage: GeneratedImage = {
        id: `gen-${Date.now()}`,
        imageUrl: data.imageUrl,
        prompt: prompt.trim(),
        createdAt: new Date().toISOString(),
      }

      setGeneratedImages((prev) => [newGeneratedImage, ...prev])
      setPrompt('') // Clear prompt after successful generation
    } catch (err) {
      console.error('Generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDelete = (id: string) => {
    setGeneratedImages((prev) => prev.filter((img) => img.id !== id))
  }

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `remix-${index}-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading image:', error)
      setError('Failed to download image')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <PageHeader
        title="Image remix"
        subtitle="Upload references and describe what to change — everything else stays the same"
        action={
          <Link
            href="/collections"
            className="inline-flex h-9 px-4 items-center rounded-full bg-white/[0.06] border border-white/10 text-sm font-semibold text-zinc-200 hover:bg-white/[0.1]"
          >
            Back
          </Link>
        }
      />

      <ToolWorkspace className="space-y-5">
        <ToolPanel title="How to use" subtitle="Keep changes explicit — everything else stays the same">
          <div className="space-y-3 text-sm text-zinc-400">
            <p>1. Upload one or more reference images</p>
            <p>2. Write a prompt describing what you want to change</p>
            <p>3. The AI analyzes your images and creates a new result</p>
            <ToolTip tone="amber">
              Only what you explicitly mention will change. Everything else stays the same.
            </ToolTip>
            <div>
              <p className="text-[#2DE2FF] font-semibold mb-1.5">Example prompts</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-zinc-500">
                <li>Use the art style of image 2 but keep the character from image 1</li>
                <li>Change only the colors to match image 2, keep everything else</li>
                <li>Combine characters from all images using the style of image 1</li>
              </ul>
            </div>
          </div>
        </ToolPanel>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ToolPanel title="Create" subtitle="Upload references and describe the remix">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Select images
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="w-full p-3 border border-white/[0.1] rounded-xl bg-[#0c0c10] text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#2DE2FF] file:text-[#0a0a0c] hover:file:opacity-90"
                />
              </div>

              {images.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-white mb-2">
                    Uploaded images ({images.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {images.map((img, index) => (
                      <div key={img.id} className="relative group">
                        <div className="relative aspect-square rounded-xl overflow-hidden border border-white/[0.08]">
                          <Image
                            src={img.preview}
                            alt={img.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                          Image {index + 1}
                        </div>
                        <button
                          onClick={() => removeImage(img.id)}
                          className="absolute top-2 right-2 bg-[#FF2BD6]/90 hover:bg-[#FF2BD6] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Transformation prompt *
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder='Example: "Use the art style of image 2 but keep the character, background, and all elements from image 1 exactly the same"'
                  className="w-full h-32 p-3 border border-white/[0.1] rounded-xl bg-[#0c0c10] text-white placeholder:text-zinc-600 focus:border-[#2DE2FF] focus:outline-none resize-none"
                  disabled={isGenerating}
                />
                <p className="text-xs text-zinc-500 mt-2">
                  Describe what you want. Reference images by number (e.g., &quot;image 1&quot;, &quot;image 2&quot;)
                </p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || images.length === 0 || !prompt.trim()}
                className="hg-btn-glow w-full inline-flex items-center justify-center gap-2 bg-[#2DE2FF] text-[#0a0a0c] font-bold py-3 px-6 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <BrandLoader variant="inline" label="Generating" />
                ) : (
                  'Generate remix'
                )}
              </button>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/[0.08] text-red-300 px-4 py-3 text-sm">
                  {error}
                </div>
              )}
            </div>
          </ToolPanel>

          <ToolPanel
            title={`Results (${generatedImages.length})`}
            action={
              generatedImages.length > 0 ? (
                <button
                  onClick={() => setGeneratedImages([])}
                  className="text-sm font-semibold text-[#FF2BD6] hover:opacity-80"
                >
                  Clear all
                </button>
              ) : null
            }
          >
            {generatedImages.length > 0 ? (
              <div className="space-y-5">
                {generatedImages.map((image, index) => (
                  <div
                    key={image.id}
                    className="rounded-xl border border-white/[0.08] bg-[#0c0c10] overflow-hidden"
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={image.imageUrl}
                        alt={`Generated ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-zinc-500 mb-2">
                        {new Date(image.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-white mb-4 line-clamp-2">
                        {image.prompt}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleDownload(image.imageUrl, index)}
                          className="hg-btn-glow text-sm bg-[#2DE2FF] text-[#0a0a0c] py-2 px-3 rounded-full font-bold transition-colors"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleDelete(image.id)}
                          className="text-sm rounded-full font-semibold bg-[#FF2BD6]/15 text-[#FF2BD6] border border-[#FF2BD6]/25 hover:bg-[#FF2BD6]/25 py-2 px-3 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-base font-semibold text-white mb-1">No images yet</p>
                <p className="text-sm text-zinc-500">Upload images and write a prompt to get started</p>
              </div>
            )}
          </ToolPanel>
        </div>
      </ToolWorkspace>
    </div>
  )
}
