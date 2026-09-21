'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { PageHeader } from '@/components/page-header'
import { BrandLoader } from '@/components/brand-loader'

interface Ordinal {
  id: string
  ordinal_number: number | null
  image_url: string
  compressed_image_url?: string | null
  created_at: string
}

const IMAGES_PER_PANEL = 24
const AUTO_SLIDE_INTERVAL = 5000

export default function BTCCreatorPassesPage() {
  const [ordinals, setOrdinals] = useState<Ordinal[]>([])
  const [loading, setLoading] = useState(true)
  const [collectionName, setCollectionName] = useState<string>('')
  const [collectionId, setCollectionId] = useState<string | null>(null)
  const [currentPanel, setCurrentPanel] = useState(0)
  const [totalOrdinals, setTotalOrdinals] = useState(0)
  const [totalPanels, setTotalPanels] = useState(0)
  const [loadedPanels, setLoadedPanels] = useState<Set<number>>(new Set())
  const autoSlideTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadPassesCollection()
    return () => {
      if (autoSlideTimerRef.current) {
        clearInterval(autoSlideTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (totalPanels > 1 && !loading) {
      autoSlideTimerRef.current = setInterval(() => {
        setCurrentPanel((prev) => (prev + 1) % totalPanels)
      }, AUTO_SLIDE_INTERVAL)

      return () => {
        if (autoSlideTimerRef.current) {
          clearInterval(autoSlideTimerRef.current)
        }
      }
    }
  }, [totalPanels, loading])

  const loadPassesCollection = async () => {
    const BTC_PASSES_COLLECTION_ID = '96541454-e6be-469f-9012-00f778ee8a85'

    try {
      setCollectionId(BTC_PASSES_COLLECTION_ID)

      const collectionResponse = await fetch(`/api/collections/${BTC_PASSES_COLLECTION_ID}`)
      if (collectionResponse.ok) {
        const collectionData = await collectionResponse.json()
        setCollectionName(collectionData.collection?.name || 'BTC Creator Passes')
      } else {
        setCollectionName('BTC Creator Passes')
      }

      const countResponse = await fetch(
        `/api/collections/${BTC_PASSES_COLLECTION_ID}/ordinals?limit=1&page=1`
      )
      if (countResponse.ok) {
        const countData = await countResponse.json()
        const total = countData.pagination?.total || 0
        setTotalOrdinals(total)
        setTotalPanels(Math.ceil(total / IMAGES_PER_PANEL))
      }

      await loadPanel(0, BTC_PASSES_COLLECTION_ID)
    } catch (error) {
      console.error('Error loading passes collection:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPanel = async (panelIndex: number, collectionIdParam?: string) => {
    const cid = collectionIdParam || collectionId
    if (!cid || loadedPanels.has(panelIndex)) return

    try {
      const page = panelIndex + 1
      const response = await fetch(
        `/api/collections/${cid}/ordinals?page=${page}&limit=${IMAGES_PER_PANEL}`
      )
      if (!response.ok) return

      const data = await response.json()
      const panelOrdinals = data.ordinals || []

      setOrdinals((prev) => {
        const newOrdinals = [...prev]
        const startIndex = panelIndex * IMAGES_PER_PANEL
        panelOrdinals.forEach((ordinal: Ordinal, idx: number) => {
          newOrdinals[startIndex + idx] = ordinal
        })
        return newOrdinals
      })

      setLoadedPanels((prev) => new Set([...prev, panelIndex]))
    } catch (error) {
      console.error(`Error loading panel ${panelIndex}:`, error)
    }
  }

  useEffect(() => {
    if (!collectionId || loading) return

    if (!loadedPanels.has(currentPanel)) {
      loadPanel(currentPanel)
    }

    const nextPanel = (currentPanel + 1) % totalPanels
    if (totalPanels > 0 && !loadedPanels.has(nextPanel)) {
      loadPanel(nextPanel)
    }

    const prevPanel = currentPanel === 0 ? totalPanels - 1 : currentPanel - 1
    if (totalPanels > 0 && !loadedPanels.has(prevPanel)) {
      loadPanel(prevPanel)
    }
  }, [currentPanel, collectionId, totalPanels, loadedPanels, loading])

  const goToPanel = (panelIndex: number) => {
    if (autoSlideTimerRef.current) {
      clearInterval(autoSlideTimerRef.current)
    }
    setCurrentPanel(panelIndex)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <PageHeader
        title="Creator passes"
        subtitle="Hold a pass for 50% off HoodGFX credits"
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="hg-rise rounded-2xl border border-[#2DE2FF]/25 bg-gradient-to-r from-[#2DE2FF]/10 to-[#FF2BD6]/10 p-5 sm:p-6">
          <p className="text-white font-semibold text-lg mb-1">
            Pass holders get <span className="text-[#2DE2FF]">50% off</span> credits
          </p>
          <p className="text-sm text-zinc-400">
            {totalOrdinals > 0
              ? `${totalOrdinals} passes in ${collectionName || 'this collection'}`
              : 'More information coming soon'}
          </p>
        </div>

        <div className="hg-rise hg-rise-delay-1 rounded-2xl border border-white/[0.1] bg-[#131318] p-4 sm:p-6">
          {loading ? (
            <BrandLoader variant="card" label="Loading passes" className="min-h-[400px]" />
          ) : ordinals.length === 0 ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="text-center">
                <p className="text-white font-medium mb-1">No passes found</p>
                <p className="text-zinc-500 text-sm">
                  {collectionName
                    ? `Collection "${collectionName}" has no ordinals yet.`
                    : 'Passes collection not found or has no ordinals.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentPanel * 100}%)` }}
                >
                  {Array.from({ length: totalPanels }).map((_, panelIndex) => {
                    const panelOrdinals = ordinals
                      .slice(panelIndex * IMAGES_PER_PANEL, (panelIndex + 1) * IMAGES_PER_PANEL)
                      .filter(Boolean)

                    return (
                      <div key={panelIndex} className="w-full flex-shrink-0">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                          {panelOrdinals.length > 0 ? (
                            panelOrdinals.map((ordinal) => {
                              const imageUrl =
                                ordinal.compressed_image_url &&
                                ordinal.compressed_image_url.trim() !== '' &&
                                ordinal.compressed_image_url !== ordinal.image_url
                                  ? ordinal.compressed_image_url
                                  : ordinal.image_url

                              return (
                                <div
                                  key={ordinal.id}
                                  className="hg-card relative aspect-square rounded-xl overflow-hidden border border-white/[0.1] bg-[#0c0c10] group/item cursor-pointer"
                                >
                                  <Image
                                    src={imageUrl}
                                    alt={`Pass #${ordinal.ordinal_number || ordinal.id}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                    loading={panelIndex === currentPanel ? 'eager' : 'lazy'}
                                  />
                                  {ordinal.ordinal_number !== null && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                      <p className="text-white text-xs font-semibold text-center">
                                        #{ordinal.ordinal_number}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )
                            })
                          ) : (
                            <div className="col-span-full flex items-center justify-center min-h-[300px]">
                              <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#2DE2FF] border-t-transparent mb-2" />
                                <p className="text-zinc-500 text-sm">
                                  Loading panel {panelIndex + 1}…
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {totalPanels > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
                  <button
                    type="button"
                    onClick={() =>
                      goToPanel(currentPanel === 0 ? totalPanels - 1 : currentPanel - 1)
                    }
                    className="hg-btn-glow px-4 py-2 rounded-full border border-white/15 text-zinc-200 text-sm font-semibold hover:border-[#2DE2FF]/40 hover:text-[#2DE2FF] transition-all"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-sm font-medium">
                      Panel {currentPanel + 1} of {totalPanels}
                    </span>
                    <div className="flex gap-1">
                      {Array.from({ length: totalPanels }).map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => goToPanel(idx)}
                          className={`h-2 rounded-full transition-all ${
                            idx === currentPanel
                              ? 'bg-[#2DE2FF] w-6'
                              : 'bg-white/20 w-2 hover:bg-white/40'
                          }`}
                          aria-label={`Go to panel ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToPanel((currentPanel + 1) % totalPanels)}
                    className="hg-btn-glow px-4 py-2 rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {collectionName && (
          <p className="text-center text-sm text-zinc-500">
            Collection: <span className="font-semibold text-zinc-300">{collectionName}</span>
          </p>
        )}
      </div>
    </div>
  )
}
