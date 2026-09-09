import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/database'
import { getPublicClient } from '@/lib/robinhood/client'
import { erc721Abi } from '@/lib/robinhood/abis'
import type { Address } from 'viem'

/**
 * GET /api/marketplace/rh/my-nfts?wallet=0x...
 * NFTs this wallet can list (confirmed RH mints still owned on-chain)
 */
export async function GET(request: NextRequest) {
  if (!sql) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  try {
    const wallet = request.nextUrl.searchParams.get('wallet')
    if (!wallet || !wallet.startsWith('0x')) {
      return NextResponse.json({ error: 'wallet (0x...) required' }, { status: 400 })
    }

    const rows = (await sql`
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
      ORDER BY m.confirmed_at DESC NULLS LAST, m.created_at DESC
      LIMIT 200
    `) as any[]

    const activeListings = (await sql`
      SELECT mint_address
      FROM nft_listings
      WHERE status IN ('active', 'pending')
        AND LOWER(seller_wallet) = LOWER(${wallet})
    `) as any[]
    const listedKeys = new Set((activeListings || []).map((l) => String(l.mint_address).toLowerCase()))

    const client = getPublicClient()
    const nfts: any[] = []

    for (const row of rows || []) {
      const contract = row.contract_address as string
      const tokenId = String(row.token_id)
      const mintKey = `${contract}:${tokenId}`

      if (listedKeys.has(mintKey.toLowerCase())) continue

      try {
        const owner = (await client.readContract({
          address: contract as Address,
          abi: erc721Abi,
          functionName: 'ownerOf',
          args: [BigInt(tokenId)],
        })) as string

        if (owner.toLowerCase() !== wallet.toLowerCase()) continue
      } catch {
        // If RPC/contract unavailable, still show mint record so listing UX works on testnet
      }

      let imageUrl =
        row.ordinal_image_url || row.banner_image_url || row.mobile_image_url || null
      let name = row.ordinal_name || `${row.collection_name || 'NFT'} #${tokenId}`

      if (row.token_uri) {
        try {
          const uri = String(row.token_uri)
          if (uri.startsWith('http')) {
            const metaRes = await fetch(uri, { signal: AbortSignal.timeout(4000) }).catch(() => null)
            if (metaRes?.ok) {
              const meta = await metaRes.json()
              if (meta?.image) imageUrl = meta.image
              if (meta?.name) name = meta.name
            }
          }
        } catch {
          /* ignore metadata fetch */
        }
      }

      nfts.push({
        id: row.id,
        collectionId: row.collection_id,
        collectionName: row.collection_name,
        contractAddress: contract,
        tokenId,
        mintKey,
        name,
        imageUrl,
        tokenUri: row.token_uri,
        mintTxHash: row.mint_tx_hash,
      })
    }

    return NextResponse.json({ success: true, nfts, count: nfts.length })
  } catch (error: any) {
    console.error('[marketplace/rh/my-nfts]', error)
    return NextResponse.json({ error: error?.message || 'Failed to load NFTs' }, { status: 500 })
  }
}
