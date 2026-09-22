'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConfig, useSwitchChain, useWalletClient } from 'wagmi'
import { getWalletClient } from 'wagmi/actions'
import { encodeFunctionData } from 'viem'
import { collectionFactoryAbi } from '@/lib/robinhood/abis'
import { getRobinhoodChain } from '@/lib/robinhood/config'

interface Props {
  collectionId: string
  collectionName?: string
  symbol?: string
  supply?: number
  onComplete?: (contractAddress?: string) => void
}

export function RobinhoodDeploymentWizard({
  collectionId,
  collectionName: nameProp,
  symbol: symbolProp = 'ORD',
  supply: supplyProp,
  onComplete,
}: Props) {
  const { address, isConnected, chainId } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { switchChainAsync } = useSwitchChain()
  const config = useConfig()
  const targetChain = getRobinhoodChain()
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [contractAddress, setContractAddress] = useState('')
  const [busy, setBusy] = useState(false)
  const [meta, setMeta] = useState({ name: nameProp || 'Collection', symbol: symbolProp, supply: supplyProp || 10000 })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/collections/${collectionId}`)
        if (!res.ok) return
        const data = await res.json()
        const c = data.collection || data
        if (!cancelled && c) {
          setMeta({
            name: nameProp || c.name || 'Collection',
            symbol: symbolProp || c.symbol || 'ORD',
            supply: supplyProp || c.supply || c.total_supply || 10000,
          })
          if (c.contract_address) {
            setContractAddress(c.contract_address)
          }
        }
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [collectionId, nameProp, symbolProp, supplyProp])

  const deploy = async () => {
    if (!isConnected || !address) {
      setError('Connect an EVM wallet first')
      return
    }
    setBusy(true)
    setError('')
    try {
      let client = walletClient
      if (!client || chainId !== targetChain.id) {
        setStatus(`Switch your wallet to ${targetChain.name}…`)
        try {
          await switchChainAsync({ chainId: targetChain.id })
        } catch (switchErr: any) {
          const ethereum = (window as any).ethereum
          if (!ethereum?.request) throw switchErr
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${targetChain.id.toString(16)}`,
                chainName: targetChain.name,
                nativeCurrency: targetChain.nativeCurrency,
                rpcUrls: [...targetChain.rpcUrls.default.http],
                blockExplorerUrls: [targetChain.blockExplorers.default.url],
              },
            ],
          })
          await switchChainAsync({ chainId: targetChain.id })
        }
        client = await getWalletClient(config, { chainId: targetChain.id })
      }
      if (!client) {
        throw new Error(`Approve the switch to ${targetChain.name} in your wallet, then try again.`)
      }

      setStatus('Preparing factory transaction...')
      const prep = await fetch(`/api/collections/${collectionId}/deploy/create-rh-collection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          name: meta.name,
          symbol: meta.symbol,
          max_supply: meta.supply,
          base_uri: '',
        }),
      })
      const prepData = await prep.json()
      if (!prep.ok) throw new Error(prepData.error || 'Failed to prepare deploy')

      const factory = prepData.factoryAddress as `0x${string}`
      if (!factory) throw new Error('Factory address not configured')

      setStatus('Approve createCollection in your wallet...')
      const data =
        (prepData.data as `0x${string}`) ||
        encodeFunctionData({
          abi: collectionFactoryAbi,
          functionName: 'createCollection',
          args: [meta.name, meta.symbol, '', BigInt(meta.supply)],
        })

      const txHash = await client.sendTransaction({
        to: factory,
        data,
        chain: undefined,
      })

      setStatus('Indexing deployment...')
      const indexRes = await fetch(`/api/collections/${collectionId}/deploy/create-rh-collection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: address, tx_hash: txHash }),
      })
      const indexData = await indexRes.json()
      if (!indexRes.ok) throw new Error(indexData.error || 'Failed to index deployment')

      setContractAddress(indexData.contractAddress)
      setStatus(`Deployed: ${indexData.contractAddress}`)
      onComplete?.(indexData.contractAddress)
    } catch (e: any) {
      setError(e?.message || 'Deploy failed')
      setStatus('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4 border border-[#2DE2FF]/30 p-4 bg-[#111]">
      <h3 className="text-white font-bold uppercase tracking-wide">Deploy on Robinhood Chain</h3>
      <p className="text-sm text-white/60">
        Creates an ERC-721 collection via the platform factory. Gas paid in ETH on Robinhood Chain.
      </p>
      <p className="text-xs text-white/40">
        {meta.name} · {meta.symbol} · supply {meta.supply}
      </p>
      {status && <p className="text-sm text-[#2DE2FF]">{status}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {contractAddress && (
        <p className="text-xs text-white/80 break-all">Contract: {contractAddress}</p>
      )}
      <button
        type="button"
        disabled={busy || !isConnected || !!contractAddress}
        onClick={deploy}
        className="px-4 py-2 bg-[#2DE2FF] text-black font-bold uppercase text-sm disabled:opacity-50"
      >
        {contractAddress
          ? 'Already Deployed'
          : busy
            ? 'Deploying...'
            : isConnected && chainId !== targetChain.id
              ? `Switch to ${targetChain.name}`
              : 'Deploy Collection'}
      </button>
    </div>
  )
}

export { RobinhoodDeploymentWizard as SolanaDeploymentWizard }
