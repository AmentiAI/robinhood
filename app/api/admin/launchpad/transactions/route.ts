import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/database'
import { checkAuthorizationServer } from '@/lib/auth/access-control'

/**
 * GET /api/admin/launchpad/transactions
 * Robinhood Chain mint transactions from rh_nft_mints
 */
export async function GET(request: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const adminWallet = searchParams.get('wallet_address')
    const collectionId = searchParams.get('collection_id')
    const status = searchParams.get('status')
    const minterWallet = searchParams.get('minter_wallet')
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    if (!adminWallet) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 401 })
    }
    const authResult = await checkAuthorizationServer(adminWallet, sql)
    if (!authResult.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access only.' }, { status: 403 })
    }

    const transactions = (await sql`
      SELECT
        sm.id,
        sm.collection_id,
        sm.contract_address as candy_machine_address,
        sm.session_id,
        sm.phase_id,
        sm.ordinal_id,
        CASE
          WHEN sm.contract_address IS NOT NULL AND sm.token_id IS NOT NULL
          THEN sm.contract_address || ':' || sm.token_id
          ELSE sm.contract_address
        END as nft_mint_address,
        sm.token_uri as metadata_uri,
        NULL as token_account,
        sm.minter_wallet,
        sm.mint_tx_hash as mint_tx_signature,
        COALESCE(NULLIF(sm.mint_price_wei, '')::numeric, 0) as mint_price_lamports,
        COALESCE(NULLIF(sm.platform_fee_wei, '')::numeric, 0) as platform_fee_lamports,
        COALESCE(NULLIF(sm.mint_price_wei, '')::numeric, 0) + COALESCE(NULLIF(sm.platform_fee_wei, '')::numeric, 0) as total_paid_lamports,
        sm.mint_status,
        sm.error_message,
        0 as retry_count,
        sm.created_at,
        sm.confirmed_at,
        sm.updated_at,
        c.name as collection_name,
        mp.phase_name
      FROM rh_nft_mints sm
      JOIN collections c ON sm.collection_id = c.id
      LEFT JOIN mint_phases mp ON sm.phase_id = mp.id
      WHERE (${collectionId}::text IS NULL OR sm.collection_id = ${collectionId}::uuid)
        AND (${status}::text IS NULL OR sm.mint_status = ${status})
        AND (${minterWallet}::text IS NULL OR sm.minter_wallet = ${minterWallet})
      ORDER BY sm.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `) as any[]

    const countResult = (await sql`
      SELECT COUNT(*) as count
      FROM rh_nft_mints sm
      WHERE (${collectionId}::text IS NULL OR sm.collection_id = ${collectionId}::uuid)
        AND (${status}::text IS NULL OR sm.mint_status = ${status})
        AND (${minterWallet}::text IS NULL OR sm.minter_wallet = ${minterWallet})
    `) as any[]

    return NextResponse.json({
      success: true,
      transactions: Array.isArray(transactions) ? transactions : [],
      total: parseInt(countResult?.[0]?.count || '0', 10),
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('Error fetching admin transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions', details: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { wallet_address, transaction_id, updates } = body

    if (!wallet_address) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 401 })
    }
    const authResult = await checkAuthorizationServer(wallet_address, sql)
    if (!authResult.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access only.' }, { status: 403 })
    }
    if (!transaction_id) {
      return NextResponse.json({ error: 'transaction_id required' }, { status: 400 })
    }

    const mintStatus = updates?.mint_status
    const errorMessage = updates?.error_message

    const updated = (await sql`
      UPDATE rh_nft_mints
      SET
        mint_status = COALESCE(${mintStatus}, mint_status),
        error_message = COALESCE(${errorMessage}, error_message),
        updated_at = NOW(),
        confirmed_at = CASE WHEN ${mintStatus} = 'confirmed' THEN NOW() ELSE confirmed_at END
      WHERE id = ${transaction_id}::uuid
      RETURNING *
    `) as any[]

    return NextResponse.json({ success: true, transaction: updated[0] || null })
  } catch (error: any) {
    console.error('Error updating transaction:', error)
    return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { wallet_address, transaction_id } = body

    if (!wallet_address) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 401 })
    }
    const authResult = await checkAuthorizationServer(wallet_address, sql)
    if (!authResult.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access only.' }, { status: 403 })
    }
    if (!transaction_id) {
      return NextResponse.json({ error: 'transaction_id required' }, { status: 400 })
    }

    await sql`DELETE FROM rh_nft_mints WHERE id = ${transaction_id}::uuid`
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete' }, { status: 500 })
  }
}
