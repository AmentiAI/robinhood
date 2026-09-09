import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/database'
import { getPublicClient } from '@/lib/robinhood/client'
import { type Hex } from 'viem'

/**
 * POST /api/launchpad/[collectionId]/mint/confirm
 * Confirm a Robinhood Chain mint after the user broadcasts the tx.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  if (!sql) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 })
  }

  try {
    const { collectionId } = await params
    const body = await request.json()
    const { tx_hash, signature, mint_id, token_id, wallet_address } = body
    const txHash = (tx_hash || signature) as string | undefined

    if (!txHash || !wallet_address) {
      return NextResponse.json(
        { error: 'tx_hash (or signature) and wallet_address required' },
        { status: 400 }
      )
    }

    let mints: any[]
    if (mint_id) {
      mints = (await sql`
        SELECT * FROM rh_nft_mints
        WHERE id = ${mint_id}::uuid
        AND collection_id = ${collectionId}::uuid
        AND minter_wallet ILIKE ${wallet_address}
        AND mint_status IN ('awaiting_signature', 'confirming', 'broadcasting')
      `) as any[]
    } else {
      mints = (await sql`
        SELECT * FROM rh_nft_mints
        WHERE collection_id = ${collectionId}::uuid
        AND minter_wallet ILIKE ${wallet_address}
        AND (${token_id || null}::text IS NULL OR token_id = ${token_id || null})
        AND mint_status IN ('awaiting_signature', 'confirming', 'broadcasting')
        ORDER BY created_at DESC
        LIMIT 1
      `) as any[]
    }

    if (!mints.length) {
      return NextResponse.json({ error: 'Mint record not found' }, { status: 404 })
    }

    const mint = mints[0]

    await sql`
      UPDATE rh_nft_mints
      SET mint_tx_hash = ${txHash}, mint_status = 'confirming', updated_at = NOW()
      WHERE id = ${mint.id}::uuid
    `

    if (mint.session_id) {
      await sql`
        UPDATE mint_sessions SET status = 'confirming' WHERE id = ${mint.session_id}::uuid
      `
    }

    const publicClient = getPublicClient()
    const MAX_RETRIES = 10
    let receipt: any = null

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        receipt = await publicClient.getTransactionReceipt({ hash: txHash as Hex })
        if (receipt) break
      } catch {
        // not mined yet
      }
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 2000))
      }
    }

    if (!receipt) {
      return NextResponse.json({
        success: true,
        confirmed: false,
        pending: true,
        txHash,
        mintId: mint.id,
        message: 'Transaction submitted; confirmation pending',
      })
    }

    if (receipt.status !== 'success') {
      await sql`
        UPDATE rh_nft_mints
        SET mint_status = 'failed', error_message = 'Transaction reverted', updated_at = NOW()
        WHERE id = ${mint.id}::uuid
      `
      if (mint.phase_id) {
        await sql`
          UPDATE mint_phases
          SET phase_minted = GREATEST(0, COALESCE(phase_minted, 0) - 1)
          WHERE id = ${mint.phase_id}::uuid
        `
      }
      return NextResponse.json(
        { success: false, confirmed: false, error: 'Transaction reverted on-chain' },
        { status: 400 }
      )
    }

    await sql`
      UPDATE rh_nft_mints
      SET mint_status = 'confirmed', confirmed_at = NOW(), updated_at = NOW()
      WHERE id = ${mint.id}::uuid
    `

    if (mint.session_id) {
      await sql`
        UPDATE mint_sessions SET status = 'completed' WHERE id = ${mint.session_id}::uuid
      `
    }

    if (mint.ordinal_id) {
      await sql`
        UPDATE generated_ordinals SET is_minted = true WHERE id = ${mint.ordinal_id}::uuid
      `
    } else {
      await sql`
        UPDATE generated_ordinals
        SET is_minted = true
        WHERE id = (
          SELECT id FROM generated_ordinals
          WHERE collection_id = ${collectionId}::uuid
          AND COALESCE(is_minted, false) = false
          ORDER BY created_at ASC
          LIMIT 1
        )
      `
    }

    return NextResponse.json({
      success: true,
      confirmed: true,
      txHash,
      mintId: mint.id,
      tokenId: mint.token_id,
      contractAddress: mint.contract_address,
    })
  } catch (error: any) {
    console.error('[RH mint/confirm] Error:', error)
    return NextResponse.json({ error: error?.message || 'Confirm failed' }, { status: 500 })
  }
}
