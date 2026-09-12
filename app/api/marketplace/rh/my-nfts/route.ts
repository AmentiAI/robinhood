import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/database'
import { getPublicClient } from '@/lib/robinhood/client'
import { erc721Abi } from '@/lib/robinhood/abis'
import type { Address } from 'viem'

/**
 * GET /api/marketplace/rh/my-nfts?wallet=0x...
 * NFTs this wallet can list:
 * - confirmed mints they still own
 * - NFTs they bought (sold_to_wallet) that they still own
 */
export async function GET(request: NextRequest) {
  if (!sql) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  try {
    const wallet = request.nextUrl.searchParams.get('wallet')
    if (!wallet || !wallet.startsWith('0x')) {
      return NextResponse.json({ error: 'wallet (0x...) required' }, { status: 400 })
    }

    const minted = (await sql`
      SELECT
        m.id,
        m.collection_id,
        m.contract_address,
        m.token_id,
        m.token_uri,
        m.mint_tx_hash,
        m.confirmed_at,
        c.name AS collection_name,
        c.banner_image_url,
        c.mobile_image_url,
        go.image_url AS ordinal_image_url,
        go.name AS ordinal_name
      FROM rh_nft_mints m
      JOIN collections c ON c.id = m.collection_id
      LEFT JOIN generated_ordinals go ON go.id = m.ordinal_id
      WHERE LOWER(m.minter_wallet) = LOWER(${wallet})
        AND m.mint_status = 'confirmed'
        AND m.contract_address IS NOT NULL
        AND m.token_id IS NOT NULL
      ORDER BY m.confirmed_at DESC NULLS LAST
      LIMIT 200
    `) as any[]

    const purchased = (await sql`
      SELECT
        l.id,
        l.collection_id,
        l.mint_address,
        l.title,
        l.image_url,
        l.metadata,
        c.name AS collection_name,
        c.banner_image_url,
        c.mobile_image_url
      FROM nft_listings l
      LEFT JOIN collections c ON c.id = l.collection_id
      WHERE l.status = 'sold'
        AND LOWER(l.sold_to_wallet) = LOWER(${wallet})
      ORDER BY l.sold_at DESC NULLS LAST
      LIMIT 100
    `) as any[]

    const activeListings = (await sql`
      SELECT mint_address
      FROM nft_listings
      WHERE status IN ('active', 'pending')
    `) as any[]
    const listedKeys = new Set((activeListings || []).map((l) => String(l.mint_address).toLowerCase()))

    const byKey = new Map<string, any>()

    for (const row of minted || []) {
      const contract = row.contract_address as string
      const tokenId = String(row.token_id)
      const mintKey = `${contract}:${tokenId}`
      byKey.set(mintKey.toLowerCase(), {
        id: row.id,
        collectionId: row.collection_id,
        collectionName: row.collection_name,
        contractAddress: contract,
        tokenId,
        mintKey,
        name: row.ordinal_name || `${row.collection_name || 'NFT'} #${tokenId}`,
        imageUrl: row.ordinal_image_url || row.banner_image_url || row.mobile_image_url || null,
        tokenUri: row.token_uri,
        source: 'mint',
      })
    }

    for (const row of purchased || []) {
      const mint = String(row.mint_address || '')
      const meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {}
      const contract = meta.contract_address || mint.split(':')[0]
      const tokenId = meta.token_id || mint.split(':')[1]
      if (!contract || tokenId == null) continue
      const mintKey = `${contract}:${tokenId}`
      if (byKey.has(mintKey.toLowerCase())) continue
      byKey.set(mintKey.toLowerCase(), {
        id: row.id,
        collectionId: row.collection_id,
        collectionName: row.collection_name,
        contractAddress: contract,
        tokenId: String(tokenId),
        mintKey,
        name: row.title || `${row.collection_name || 'NFT'} #${tokenId}`,
        imageUrl: row.image_url || row.banner_image_url || row.mobile_image_url || null,
        tokenUri: null,
        source: 'purchase',
      })
    }

    const client = getPublicClient()
    const nfts: any[] = []

    for (const nft of byKey.values()) {
      if (listedKeys.has(nft.mintKey.toLowerCase())) continue

      try {
        const owner = (await client.readContract({
          address: nft.contractAddress as Address,
          abi: erc721Abi,
          functionName: 'ownerOf',
          args: [BigInt(nft.tokenId)],
        })) as string
        if (owner.toLowerCase() !== wallet.toLowerCase()) continue
      } catch {
        // Keep candidate if RPC fails (testnet flaky) — listing API still verifies when possible
      }

      if (nft.tokenUri && String(nft.tokenUri).startsWith('http') && !nft.imageUrl) {
        try {
          const metaRes = await fetch(nft.tokenUri, { signal: AbortSignal.timeout(4000) }).catch(() => null)
          if (metaRes?.ok) {
            const meta = await metaRes.json()
            if (meta?.image) nft.imageUrl = meta.image
            if (meta?.name) nft.name = meta.name
          }
        } catch {
          /* ignore */
        }
      }

      nfts.push(nft)
    }

    return NextResponse.json({ success: true, nfts, count: nfts.length })
  } catch (error: any) {
    console.error('[marketplace/rh/my-nfts]', error)
    return NextResponse.json({ error: error?.message || 'Failed to load NFTs' }, { status: 500 })
  }
}
