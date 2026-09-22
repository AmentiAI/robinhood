'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAccount, useWalletClient } from 'wagmi'
import { encodeFunctionData } from 'viem'
import { PageHeader } from '@/components/page-header'
import { BrandLoader } from '@/components/brand-loader'
import { ToolWorkspace, ToolTip } from '@/components/tool-workspace'
import { ordMakerCollectionAbi } from '@/lib/robinhood/abis'
import { explorerAddressUrl, explorerTxUrl, getRobinhoodChain } from '@/lib/robinhood/config'

interface CollectionInfo {
  id: string
  name: string
  contract_address?: string | null
  collection_status?: string
  launch_status?: string
}

interface GeneratedNft {
  id: string
  tokenNumber: number
  imageUrl: string | null
  minted: boolean
  txHash: string | null
  attributes: unknown
}

export default function SelfInscribePage() {
  const params = useParams()
  const collectionId = params.id as string
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const chain = getRobinhoodChain()

  const [collection, setCollection] = useState<CollectionInfo | null>(null)
  const [nfts, setNfts] = useState<GeneratedNft[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [recipient, setRecipient] = useState('')
  const [minting, setMinting] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [lastTx, setLastTx] = useState('')

  useEffect(() => {
    if (address && !recipient) setRecipient(address)
  }, [address, recipient])

  const loadNfts = useCallback(async () => {
    const all: GeneratedNft[] = []
    let page = 1
    let hasMore = true
    while (hasMore) {
      const res = await fetch(`/api/collections/${collectionId}/ordinals?page=${page}&limit=100`)
      const data = await res.json()
      const rows = Array.isArray(data.ordinals) ? data.ordinals : []
      for (const row of rows) {
        all.push({
          id: row.id,
          tokenNumber: Number(row.ordinal_number) || all.length + 1,
          imageUrl: row.compressed_image_url || row.thumbnail_url || row.image_url || null,
          minted: Boolean(row.is_minted),
          txHash: row.mint_tx_id || null,
          attributes: row.attributes || row.traits || [],
        })
      }
      hasMore = Boolean(data.pagination && page < data.pagination.totalPages)
      page++
    }
    setNfts(all)
  }, [collectionId])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const collRes = await fetch(`/api/launchpad/${collectionId}`)
      if (collRes.ok) {
        const collData = await collRes.json()
        setCollection(collData.collection)
      }
      await loadNfts()
    } catch (err) {
      console.error(err)
      setError('Could not load this collection.')
    } finally {
      setLoading(false)
    }
  }, [collectionId, loadNfts])

  useEffect(() => {
    if (collectionId) void load()
  }, [collectionId, load])

  const mintedCount = useMemo(() => nfts.filter((n) => n.minted).length, [nfts])
  const unminted = useMemo(() => nfts.filter((n) => !n.minted), [nfts])
  const live = collection?.collection_status === 'launchpad_live' && Boolean(collection?.contract_address)
  const canMint = live && isConnected && Boolean(walletClient) && selected.size > 0 && !minting

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const mintSelected = async () => {
    if (!address || !walletClient) {
      setError('Connect your Robinhood Chain wallet first.')
      return
    }
    const to = (recipient || address).trim()
    if (!/^0x[a-fA-F0-9]{40}$/.test(to)) {
      setError('Enter a valid 0x wallet address.')
      return
    }
    const queue = nfts.filter((n) => selected.has(n.id) && !n.minted)
    if (queue.length === 0) {
      setError('Select at least one unminted NFT.')
      return
    }

    setMinting(true)
    setError('')
    setLastTx('')
    let done = 0
    try {
      for (const nft of queue) {
        setStatus(`Building mint ${done + 1} of ${queue.length}…`)
        const buildRes = await fetch(`/api/launchpad/${collectionId}/mint/build`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet_address: to,
            quantity: 1,
            ordinal_id: nft.id,
          }),
        })
        const buildData = await buildRes.json()
        if (!buildRes.ok || !buildData.mint) {
          throw new Error(buildData.error || buildData.message || 'Could not build the mint')
        }

        const m = buildData.mint
        setStatus(`Approve mint ${done + 1} of ${queue.length} in your wallet…`)
        const data = encodeFunctionData({
          abi: ordMakerCollectionAbi,
          functionName: 'mint',
          args: [
            m.to as `0x${string}`,
            BigInt(m.tokenId),
            m.tokenURI,
            BigInt(m.price),
            BigInt(m.deadline),
            m.signature as `0x${string}`,
          ],
        })
        const txHash = await walletClient.sendTransaction({
          to: buildData.contractAddress as `0x${string}`,
          data,
          value: BigInt(m.value),
          chain: undefined,
        })
        setLastTx(txHash)
        setStatus(`Confirming mint ${done + 1} of ${queue.length}…`)

        await fetch(`/api/launchpad/${collectionId}/mint/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tx_hash: txHash,
            mint_id: buildData.mintId,
            token_id: m.tokenId,
            wallet_address: to,
          }),
        })
        done++
      }
      setStatus(`Minted ${done} NFT${done === 1 ? '' : 's'} on ${chain.name}.`)
      setSelected(new Set())
      await loadNfts()
    } catch (err: any) {
      setError(err?.shortMessage || err?.message || 'Mint failed')
      setStatus(done > 0 ? `Minted ${done} before the error.` : '')
      await loadNfts()
    } finally {
      setMinting(false)
    }
  }

  const exportMetadata = () => {
    const metadata = nfts
      .filter((n) => n.minted)
      .map((n) => ({
        name: `${collection?.name || 'NFT'} #${n.tokenNumber}`,
        token_number: n.tokenNumber,
        image_url: n.imageUrl,
        tx_hash: n.txHash,
        attributes: n.attributes,
      }))
    const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${collection?.name || 'collection'}-metadata.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <BrandLoader label="Loading collection" />
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-white font-semibold">Collection not found</p>
          <Link href="/collections" className="mt-3 inline-flex text-sm font-semibold text-[#2DE2FF]">
            Back to collections
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <PageHeader
        title="Self-inscribe"
        subtitle={`${collection.name} · ${chain.name}`}
        action={
          <Link
            href={`/collections/${collectionId}`}
            className="inline-flex h-10 px-5 items-center rounded-full border border-white/[0.1] text-sm font-semibold text-zinc-200 hover:border-[#2DE2FF]/40 hover:text-[#2DE2FF] transition-colors"
          >
            Back
          </Link>
        }
      />
      <ToolWorkspace className="space-y-6">
        <ToolTip>
          Mint generated NFTs straight to a wallet on {chain.name}. You pay gas in ETH. This is optional and separate from a public launch.
        </ToolTip>

        <div className="rounded-2xl border border-white/[0.1] bg-[#131318] px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-white">
              {mintedCount === nfts.length && nfts.length > 0
                ? 'Every NFT in this collection is minted'
                : mintedCount > 0
                  ? 'Minting in progress'
                  : 'Ready to mint'}
            </p>
            <p className="text-sm text-zinc-400 mt-1">
              <span className="font-semibold text-[#2DE2FF]">{mintedCount}</span> / {nfts.length} minted
            </p>
          </div>
          {mintedCount > 0 && (
            <button
              type="button"
              onClick={exportMetadata}
              className="inline-flex h-9 px-4 items-center rounded-full border border-[#FF2BD6]/35 text-[#FF2BD6] text-sm font-semibold hover:bg-[#FF2BD6]/10"
            >
              Export metadata
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.1] bg-[#131318] p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex h-7 px-3 items-center rounded-full bg-[#2DE2FF]/15 text-[#2DE2FF] font-semibold">
              {chain.name}
            </span>
            <span className="text-zinc-500">Gas in ETH</span>
            {collection.contract_address ? (
              <a
                href={explorerAddressUrl(collection.contract_address)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-zinc-300 hover:text-[#2DE2FF] truncate max-w-[280px]"
              >
                {collection.contract_address}
              </a>
            ) : (
              <span className="text-zinc-500">No contract deployed</span>
            )}
          </div>

          {!live && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Deploy and go live on {chain.name} before minting here.{' '}
              <Link href={`/collections/${collectionId}/launch`} className="font-semibold text-[#2DE2FF] hover:underline">
                Open launch
              </Link>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">Recipient wallet</label>
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x…"
              className="w-full rounded-xl border border-white/[0.1] bg-[#0c0c10] px-4 py-3 font-mono text-sm text-white placeholder:text-zinc-600 focus:border-[#2DE2FF] focus:outline-none"
            />
            <p className="text-xs text-zinc-500 mt-1.5">
              The connected wallet pays gas. The NFT is minted to this address.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setSelected(new Set(unminted.map((n) => n.id)))}
              disabled={unminted.length === 0}
              className="inline-flex h-9 px-4 items-center rounded-full border border-white/[0.12] text-sm font-semibold text-zinc-200 disabled:opacity-40"
            >
              Select unminted
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="inline-flex h-9 px-4 items-center rounded-full border border-white/[0.12] text-sm font-semibold text-zinc-400"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={mintSelected}
              disabled={!canMint}
              className="hg-btn-glow inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold disabled:opacity-40"
            >
              {minting ? 'Minting…' : selected.size > 0 ? `Mint ${selected.size} on ${chain.name}` : `Mint on ${chain.name}`}
            </button>
            {!isConnected && <span className="text-sm text-amber-300">Connect your wallet to mint.</span>}
          </div>

          {status && <p className="text-sm text-[#2DE2FF]">{status}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          {lastTx && (
            <a
              href={explorerTxUrl(lastTx)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-zinc-300 hover:text-[#2DE2FF] break-all"
            >
              View transaction
            </a>
          )}
        </div>

        {nfts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.12] px-6 py-12 text-center">
            <p className="font-semibold text-white">No NFTs generated yet</p>
            <p className="text-sm text-zinc-500 mt-1">Generate images in the collection studio, then come back to mint them.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {nfts.map((nft) => {
              const on = selected.has(nft.id)
              return (
                <button
                  key={nft.id}
                  type="button"
                  disabled={nft.minted}
                  onClick={() => toggle(nft.id)}
                  className={`text-left rounded-2xl border overflow-hidden bg-[#131318] transition-colors ${
                    nft.minted
                      ? 'border-emerald-500/30 opacity-80'
                      : on
                        ? 'border-[#2DE2FF]'
                        : 'border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <div className="aspect-square bg-[#0c0c10]">
                    {nft.imageUrl ? (
                      <img src={nft.imageUrl} alt={`#${nft.tokenNumber}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-zinc-600">No image</div>
                    )}
                  </div>
                  <div className="px-3 py-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white">#{nft.tokenNumber}</span>
                    <span className={`text-[11px] font-semibold ${nft.minted ? 'text-emerald-400' : on ? 'text-[#2DE2FF]' : 'text-zinc-500'}`}>
                      {nft.minted ? 'Minted' : on ? 'Selected' : 'Ready'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </ToolWorkspace>
    </div>
  )
}
