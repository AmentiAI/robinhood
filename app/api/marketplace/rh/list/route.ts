import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/database'
import { encodeFunctionData, parseEther, type Address } from 'viem'
import { marketplaceAbi, erc721Abi } from '@/lib/robinhood/abis'
import { getMarketplaceAddress } from '@/lib/robinhood/config'
import { getPublicClient } from '@/lib/robinhood/client'

/**
 * POST /api/marketplace/rh/list
 * 1) Build approve + list calldata, insert pending row
 * 2) With tx_hash + listing_id → mark active
 */
export async function POST(request: NextRequest) {
  if (!sql) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  try {
    const body = await request.json()
    const {
      wallet_address,
      contract_address,
      token_id,
      price_eth,
      title,
      description,
      image_url,
      collection_id,
      listing_id,
      tx_hash,
    } = body

    const marketplace = getMarketplaceAddress()
    if (!marketplace) {
      return NextResponse.json(
        { error: 'RH_MARKETPLACE_ADDRESS not configured. Deploy contracts first.' },
        { status: 500 }
      )
    }

    // Confirm after on-chain list tx
    if (tx_hash && listing_id) {
      await sql`
        UPDATE nft_listings
        SET
          status = 'active',
          is_active = true,
          listing_tx_signature = ${tx_hash},
          updated_at = NOW()
        WHERE id = ${listing_id}::uuid
          AND LOWER(seller_wallet) = LOWER(${wallet_address})
          AND status = 'pending'
      `
      return NextResponse.json({ success: true, confirmed: true, txHash: tx_hash, listingId: listing_id })
    }

    if (!wallet_address || !contract_address || token_id == null || price_eth == null) {
      return NextResponse.json(
        { error: 'wallet_address, contract_address, token_id, price_eth required' },
        { status: 400 }
      )
    }

    const priceNum = Number(price_eth)
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      return NextResponse.json({ error: 'price_eth must be > 0' }, { status: 400 })
    }

    // Verify ownership when RPC is available
    try {
      const client = getPublicClient()
      const owner = (await client.readContract({
        address: contract_address as Address,
        abi: erc721Abi,
        functionName: 'ownerOf',
        args: [BigInt(token_id)],
      })) as string
      if (owner.toLowerCase() !== String(wallet_address).toLowerCase()) {
        return NextResponse.json({ error: 'You do not own this NFT' }, { status: 403 })
      }
    } catch (e: any) {
      console.warn('[marketplace/rh/list] ownerOf check skipped/failed:', e?.message)
    }

    const priceWei = parseEther(String(price_eth))
    const mintKey = `${contract_address}:${token_id}`

    // Cancel any stale pending listing for same token by this seller
    await sql`
      UPDATE nft_listings
      SET status = 'cancelled', is_active = false, updated_at = NOW()
      WHERE mint_address = ${mintKey}
        AND LOWER(seller_wallet) = LOWER(${wallet_address})
        AND status = 'pending'
    `

    const existingActive = (await sql`
      SELECT id FROM nft_listings
      WHERE mint_address = ${mintKey} AND status = 'active'
      LIMIT 1
    `) as any[]
    if (existingActive.length > 0) {
      return NextResponse.json({ error: 'This NFT is already listed' }, { status: 409 })
    }

    const approveData = encodeFunctionData({
      abi: erc721Abi,
      functionName: 'approve',
      args: [marketplace as Address, BigInt(token_id)],
    })
    const listData = encodeFunctionData({
      abi: marketplaceAbi,
      functionName: 'list',
      args: [contract_address as Address, BigInt(token_id), priceWei],
    })

    const metadata = {
      chain: 'robinhood',
      contract_address,
      token_id: String(token_id),
      price_wei: priceWei.toString(),
    }

    const collectionUuid =
      collection_id && String(collection_id).length > 10 ? String(collection_id) : null

    const rows = (await sql`
      INSERT INTO nft_listings (
        seller_wallet,
        mint_address,
        collection_id,
        price_lamports,
        price_sol,
        status,
        is_active,
        title,
        description,
        image_url,
        metadata,
        created_at,
        updated_at
      ) VALUES (
        ${wallet_address},
        ${mintKey},
        ${collectionUuid}::uuid,
        ${priceWei.toString()}::numeric,
        ${priceNum},
        'pending',
        false,
        ${title || null},
        ${description || null},
        ${image_url || null},
        ${JSON.stringify(metadata)}::jsonb,
        NOW(),
        NOW()
      )
      RETURNING id
    `) as any[]

    return NextResponse.json({
      success: true,
      listingId: rows[0]?.id,
      marketplace,
      approve: { to: contract_address, data: approveData },
      list: { to: marketplace, data: listData },
      priceWei: priceWei.toString(),
      mintKey,
    })
  } catch (error: any) {
    console.error('[marketplace/rh/list]', error)
    return NextResponse.json({ error: error?.message || 'List failed' }, { status: 500 })
  }
}
