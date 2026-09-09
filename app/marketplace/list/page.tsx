'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { useEvmWallet } from '@/lib/wallet/evm-wallet-context'
import { useWalletClient } from 'wagmi'
import { toast } from 'sonner'
import { getExplorerTxUrl } from '@/lib/explorer'

interface RhNft {
  id: string
  collectionId?: string
  collectionName?: string
  contractAddress: string
  tokenId: string
  mintKey: string
  name: string
  imageUrl?: string | null
}

export default function ListNftPage() {
  const router = useRouter()
  const { isConnected, address } = useEvmWallet()
  const { data: walletClient } = useWalletClient()

  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [nfts, setNfts] = useState<RhNft[]>([])
  const [selectedNft, setSelectedNft] = useState<RhNft | null>(null)
  const [price, setPrice] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [listing, setListing] = useState(false)

  useEffect(() => {
    if (!isConnected || !address) {
      toast.error('Connect your wallet to list NFTs')
      router.push('/marketplace')
      return
    }
    loadUserNfts()
  }, [isConnected, address])

  const loadUserNfts = async () => {
    if (!address) return
    setLoading(true)
    try {
      const response = await fetch(`/api/marketplace/rh/my-nfts?wallet=${encodeURIComponent(address)}`)
      const data = await response.json()
      if (response.ok) {
        setNfts(data.nfts || [])
      } else {
        toast.error(data.error || 'Failed to load your NFTs')
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to load NFTs')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectNft = (nft: RhNft) => {
    setSelectedNft(nft)
    setTitle(nft.name)
    setStep(2)
  }

  const handleCreateListing = async () => {
    if (!selectedNft) {
      toast.error('Select an NFT to list')
      return
    }
    if (!address || !walletClient) {
      toast.error('Connect your wallet')
      return
    }

    const priceNum = parseFloat(price)
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      toast.error('Enter a valid ETH price greater than 0')
      return
    }

    setListing(true)
    try {
      const response = await fetch('/api/marketplace/rh/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          contract_address: selectedNft.contractAddress,
          token_id: selectedNft.tokenId,
          price_eth: priceNum,
          title: title || selectedNft.name,
          description,
          image_url: selectedNft.imageUrl,
          collection_id: selectedNft.collectionId,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create listing')

      toast.info('Approve marketplace for this NFT...')
      const approveHash = await walletClient.sendTransaction({
        to: data.approve.to as `0x${string}`,
        data: data.approve.data as `0x${string}`,
        chain: undefined,
      })
      toast.info(
        <span>
          Approved.{' '}
          <a href={getExplorerTxUrl(approveHash)} target="_blank" rel="noreferrer" className="underline">
            View tx
          </a>
        </span>
      )

      toast.info('Confirm listing transaction...')
      const listHash = await walletClient.sendTransaction({
        to: data.list.to as `0x${string}`,
        data: data.list.data as `0x${string}`,
        chain: undefined,
      })

      await fetch('/api/marketplace/rh/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          listing_id: data.listingId,
          tx_hash: listHash,
        }),
      })

      toast.success(
        <div>
          <p>Listed successfully!</p>
          <a href={getExplorerTxUrl(listHash)} target="_blank" rel="noreferrer" className="underline">
            View transaction
          </a>
        </div>,
        { duration: 8000 }
      )
      router.push(`/marketplace/nft/${data.listingId}`)
    } catch (error: any) {
      console.error(error)
      toast.error(error?.shortMessage || error?.message || 'Failed to list NFT')
    } finally {
      setListing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050607]">
      <PageHeader
        title="List NFT"
        subtitle="List your Robinhood Chain NFT for sale in ETH"
        action={
          <Link
            href="/marketplace"
            className="px-4 py-2 rounded-xl border border-white/10 text-sm text-[#a8aab2] hover:text-white hover:border-[#00C805]/40"
          >
            ← Marketplace
          </Link>
        }
      />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white">Select an NFT</h2>
              <button
                type="button"
                onClick={loadUserNfts}
                className="text-xs font-bold uppercase tracking-wider text-[#00C805] hover:text-[#CCFF00]"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="py-20 text-center text-[#a8aab2]">Loading your NFTs...</div>
            ) : nfts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#00C805]/25 bg-[#15181a] py-16 text-center px-6">
                <p className="text-white font-bold mb-2">No listable NFTs found</p>
                <p className="text-sm text-[#a8aab2] mb-6">
                  Mint on the launchpad first, then come back to list.
                </p>
                <Link
                  href="/launchpad"
                  className="inline-flex px-5 py-3 rounded-xl bg-[#00C805] text-black font-black uppercase text-sm"
                >
                  Go to Launchpad
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {nfts.map((nft) => (
                  <button
                    key={nft.mintKey}
                    type="button"
                    onClick={() => handleSelectNft(nft)}
                    className="text-left rounded-2xl overflow-hidden bg-[#15181a] border border-white/10 hover:border-[#00C805]/50 transition-all"
                  >
                    <div className="aspect-square bg-[#0a0c0d]">
                      {nft.imageUrl ? (
                        <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#00C805]/40 text-4xl">
                          ◆
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-bold text-white truncate">{nft.name}</p>
                      <p className="text-xs text-[#71717A] mt-1 truncate">
                        {nft.collectionName || 'Collection'} · #{nft.tokenId}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && selectedNft && (
          <div className="space-y-6 max-w-xl">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-[#a8aab2] hover:text-white"
            >
              ← Change NFT
            </button>

            <div className="rounded-2xl border border-[#00C805]/25 bg-[#15181a] p-4 flex gap-4">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-[#0a0c0d] shrink-0">
                {selectedNft.imageUrl ? (
                  <img src={selectedNft.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#00C805]/40">◆</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-black text-white truncate">{selectedNft.name}</p>
                <p className="text-xs text-[#71717A] mt-1 font-mono truncate">{selectedNft.mintKey}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#a8aab2] mb-2">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0c0d] border border-white/10 text-white outline-none focus:border-[#00C805]"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#a8aab2] mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0c0d] border border-white/10 text-white outline-none focus:border-[#00C805]"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#a8aab2] mb-2">
                  Price (ETH) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.05"
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0c0d] border border-white/10 text-white outline-none focus:border-[#00C805]"
                />
                <p className="text-xs text-[#71717A] mt-2">
                  Platform fee (~2%) is taken from the sale on-chain.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateListing}
              disabled={listing}
              className="w-full px-6 py-4 rounded-xl bg-[#00C805] hover:bg-[#CCFF00] text-black font-black uppercase tracking-wide disabled:opacity-50"
            >
              {listing ? 'Listing... (approve + list)' : 'List for sale'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
