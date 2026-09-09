import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/database'
import { type Address } from 'viem'
import { getPublicClient, getPlatformFeeWei } from '@/lib/robinhood/client'
import { signMintAuthorization } from '@/lib/robinhood/mint-signer'
import { ordMakerCollectionAbi } from '@/lib/robinhood/abis'
import { getRobinhoodChain } from '@/lib/robinhood/config'
import { PLATFORM_FEES } from '@/lib/robinhood/platform-wallet'

/**
 * POST /api/launchpad/[collectionId]/mint/build
 * Build a Robinhood Chain signed mint payload for the user to submit.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  if (!sql) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 })
  }

  let mintRecordId: string | null = null
  let claimedPhaseId: string | null = null

  try {
    const { collectionId } = await params
    const body = await request.json()
    const { wallet_address, phase_id, quantity = 1, ordinal_id } = body

    if (!wallet_address || !wallet_address.startsWith('0x')) {
      return NextResponse.json({ error: 'Valid EVM wallet_address required' }, { status: 400 })
    }

    if (quantity !== 1) {
      return NextResponse.json({ error: 'Only quantity=1 is supported currently' }, { status: 400 })
    }

    const collections = (await sql`
      SELECT * FROM collections
      WHERE id = ${collectionId}::uuid
      AND collection_status = 'launchpad_live'
      AND contract_address IS NOT NULL
    `) as any[]

    if (!collections.length) {
      return NextResponse.json(
        {
          error: 'Collection not found or not live',
          message: 'Collection must be deployed on Robinhood Chain and live to mint',
        },
        { status: 404 }
      )
    }

    const collection = collections[0]
    const contractAddress = collection.contract_address as Address

    if (!collection.launched_at || new Date(collection.launched_at) > new Date()) {
      return NextResponse.json({ error: 'Minting has not started yet' }, { status: 400 })
    }

    // Stale cleanup
    await sql`
      WITH stale AS (
        UPDATE rh_nft_mints SET mint_status = 'cancelled', updated_at = NOW()
        WHERE collection_id = ${collectionId}::uuid
          AND (
            (mint_status = 'pending' AND created_at < NOW() - INTERVAL '2 minutes')
            OR
            (mint_status = 'awaiting_signature' AND created_at < NOW() - INTERVAL '5 minutes')
          )
        RETURNING phase_id
      )
      UPDATE mint_phases SET phase_minted = GREATEST(0, COALESCE(phase_minted, 0) - sub.cnt)
      FROM (
        SELECT phase_id, COUNT(*) as cnt FROM stale WHERE phase_id IS NOT NULL GROUP BY phase_id
      ) sub
      WHERE mint_phases.id = sub.phase_id
    `

    let mintPriceEth = 0
    let activePhase: any = null

    if (phase_id) {
      const phases = (await sql`
        SELECT id, phase_name, mint_price_sol, mint_price_eth, start_time, end_time,
               phase_allocation, phase_minted, max_per_wallet,
               whitelist_only, whitelist_id, is_completed
        FROM mint_phases
        WHERE id = ${phase_id}::uuid
        AND collection_id = ${collectionId}::uuid
      `) as any[]

      if (!phases.length) {
        return NextResponse.json({ error: 'Phase not found' }, { status: 404 })
      }

      activePhase = phases[0]
      const now = new Date()
      if (activePhase.start_time && new Date(activePhase.start_time) > now) {
        return NextResponse.json({ error: 'Phase has not started' }, { status: 400 })
      }
      if (activePhase.end_time && new Date(activePhase.end_time) < now) {
        return NextResponse.json({ error: 'Phase has ended' }, { status: 400 })
      }
      if (activePhase.is_completed) {
        return NextResponse.json({ error: 'Phase is completed' }, { status: 400 })
      }

      mintPriceEth = Number(activePhase.mint_price_eth ?? activePhase.mint_price_sol ?? 0)

      const claimed = (await sql`
        UPDATE mint_phases
        SET phase_minted = COALESCE(phase_minted, 0) + 1
        WHERE id = ${phase_id}::uuid
          AND (phase_allocation IS NULL OR COALESCE(phase_minted, 0) < phase_allocation)
        RETURNING id
      `) as any[]

      if (!claimed.length) {
        return NextResponse.json({ error: 'Phase sold out' }, { status: 400 })
      }
      claimedPhaseId = phase_id
    }

    // Pick next token / metadata
    let selectedOrdinal: any = null
    if (ordinal_id) {
      const rows = (await sql`
        SELECT id, metadata_uri, image_url, name
        FROM generated_ordinals
        WHERE id = ${ordinal_id}::uuid
        AND collection_id = ${collectionId}::uuid
        AND COALESCE(is_minted, false) = false
      `) as any[]
      selectedOrdinal = rows[0] || null
    }
    if (!selectedOrdinal) {
      const rows = (await sql`
        SELECT id, metadata_uri, image_url, name
        FROM generated_ordinals
        WHERE collection_id = ${collectionId}::uuid
        AND COALESCE(is_minted, false) = false
        ORDER BY created_at ASC
        LIMIT 1
      `) as any[]
      selectedOrdinal = rows[0] || null
    }

    const publicClient = getPublicClient()
    const totalMinted = (await publicClient.readContract({
      address: contractAddress,
      abi: ordMakerCollectionAbi,
      functionName: 'totalMinted',
    })) as bigint
    const tokenId = BigInt(totalMinted.toString()) + BigInt(1)

    const tokenURI =
      selectedOrdinal?.metadata_uri ||
      selectedOrdinal?.image_url ||
      `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/metadata/${collectionId}/${tokenId.toString()}`

    const nonce = (await publicClient.readContract({
      address: contractAddress,
      abi: ordMakerCollectionAbi,
      functionName: 'nonces',
      args: [wallet_address as Address],
    })) as bigint

    const platformFeeWei = getPlatformFeeWei()
    const priceWei = BigInt(Math.round(mintPriceEth * 1e18))
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 15 * 60)

    const inserted = (await sql`
      INSERT INTO rh_nft_mints (
        collection_id, phase_id, ordinal_id, minter_wallet,
        contract_address, token_id, token_uri,
        mint_price_wei, platform_fee_wei, mint_status
      ) VALUES (
        ${collectionId}::uuid,
        ${claimedPhaseId}::uuid,
        ${selectedOrdinal?.id || null}::uuid,
        ${wallet_address},
        ${contractAddress},
        ${tokenId.toString()},
        ${tokenURI},
        ${priceWei.toString()},
        ${platformFeeWei.toString()},
        'building'
      )
      RETURNING id
    `) as any[]

    mintRecordId = inserted[0]?.id

    const signature = await signMintAuthorization({
      collection: contractAddress,
      to: wallet_address as Address,
      tokenId,
      tokenURI,
      price: priceWei,
      nonce,
      deadline,
    })

    await sql`
      UPDATE rh_nft_mints
      SET mint_status = 'awaiting_signature', updated_at = NOW()
      WHERE id = ${mintRecordId}::uuid
    `

    const chain = getRobinhoodChain()
    const valueWei = priceWei + platformFeeWei

    return NextResponse.json({
      success: true,
      mintId: mintRecordId,
      chainId: chain.id,
      contractAddress,
      mint: {
        to: wallet_address,
        tokenId: tokenId.toString(),
        tokenURI,
        price: priceWei.toString(),
        platformFee: platformFeeWei.toString(),
        value: valueWei.toString(),
        deadline: deadline.toString(),
        nonce: nonce.toString(),
        signature,
      },
      platformFeeEth: PLATFORM_FEES.MINT_FEE_ETH,
      mintPriceEth,
    })
  } catch (error: any) {
    console.error('[RH mint/build] Error:', error)

    if (mintRecordId && sql) {
      await sql`
        UPDATE rh_nft_mints
        SET mint_status = 'failed', error_message = ${error?.message || 'build failed'}, updated_at = NOW()
        WHERE id = ${mintRecordId}::uuid
      `
    }
    if (claimedPhaseId && sql) {
      await sql`
        UPDATE mint_phases
        SET phase_minted = GREATEST(0, COALESCE(phase_minted, 0) - 1)
        WHERE id = ${claimedPhaseId}::uuid
      `
    }

    return NextResponse.json(
      { error: error?.message || 'Failed to build mint' },
      { status: 500 }
    )
  }
}
