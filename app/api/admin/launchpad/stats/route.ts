import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/database'
import { checkAuthorizationServer } from '@/lib/auth/access-control'

/**
 * GET /api/admin/launchpad/stats
 * Robinhood Chain launchpad stats from rh_nft_mints
 */
export async function GET(request: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet_address')
    const collectionId = searchParams.get('collection_id')

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 401 })
    }

    const authResult = await checkAuthorizationServer(request, sql)
    if (!authResult.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access only.' }, { status: 403 })
    }

    const overallStatsResult = (await sql`
      SELECT
        COUNT(*) as total_mints,
        COUNT(CASE WHEN sm.mint_status = 'confirmed' THEN 1 END) as confirmed_mints,
        COUNT(CASE WHEN sm.mint_status = 'failed' THEN 1 END) as failed_mints,
        COUNT(CASE WHEN sm.mint_status IN ('pending', 'building', 'awaiting_signature', 'broadcasting', 'confirming') THEN 1 END) as pending_mints,
        COUNT(CASE WHEN sm.mint_status = 'cancelled' THEN 1 END) as cancelled_mints,
        COUNT(DISTINCT sm.collection_id) as collections_with_mints,
        COUNT(DISTINCT sm.minter_wallet) as unique_minters,
        COALESCE(SUM(CASE WHEN sm.mint_status = 'confirmed' THEN NULLIF(sm.mint_price_wei, '')::numeric ELSE 0 END), 0) as total_revenue_wei,
        COALESCE(SUM(CASE WHEN sm.mint_status = 'confirmed' THEN NULLIF(sm.platform_fee_wei, '')::numeric ELSE 0 END), 0) as total_platform_fees_wei
      FROM rh_nft_mints sm
      INNER JOIN collections c ON sm.collection_id = c.id
      WHERE COALESCE(c.collection_status, 'draft') IN ('launchpad', 'launchpad_live')
         OR c.contract_address IS NOT NULL
    `) as any[]

    const stats = overallStatsResult?.[0] || {}

    const overallStats = {
      total_mints: parseInt(stats.total_mints || '0', 10),
      confirmed_mints: parseInt(stats.confirmed_mints || '0', 10),
      failed_mints: parseInt(stats.failed_mints || '0', 10),
      pending_mints: parseInt(stats.pending_mints || '0', 10),
      cancelled_mints: parseInt(stats.cancelled_mints || '0', 10),
      collections_with_mints: parseInt(stats.collections_with_mints || '0', 10),
      unique_minters: parseInt(stats.unique_minters || '0', 10),
      // Keep legacy key names for UI; values are wei (UI formats as ETH via /1e18)
      total_revenue_lamports: Number(stats.total_revenue_wei || 0),
      total_platform_fees_lamports: Number(stats.total_platform_fees_wei || 0),
      total_revenue_wei: String(stats.total_revenue_wei || '0'),
      total_platform_fees_wei: String(stats.total_platform_fees_wei || '0'),
    }

    let collectionStatsQuery
    if (collectionId) {
      collectionStatsQuery = sql`
        SELECT
          c.id,
          c.name,
          c.contract_address,
          (SELECT COUNT(*) FROM generated_ordinals WHERE collection_id = c.id) as total_supply,
          COUNT(sm.id) as total_mints,
          COUNT(CASE WHEN sm.mint_status = 'confirmed' THEN 1 END) as confirmed_mints,
          COUNT(CASE WHEN sm.mint_status = 'failed' THEN 1 END) as failed_mints,
          COUNT(CASE WHEN sm.mint_status IN ('pending', 'building', 'awaiting_signature', 'broadcasting', 'confirming') THEN 1 END) as pending_mints,
          COUNT(DISTINCT sm.minter_wallet) as unique_minters,
          COALESCE(SUM(CASE WHEN sm.mint_status = 'confirmed' THEN NULLIF(sm.mint_price_wei, '')::numeric ELSE 0 END), 0) as revenue_wei,
          COALESCE(SUM(CASE WHEN sm.mint_status = 'confirmed' THEN NULLIF(sm.platform_fee_wei, '')::numeric ELSE 0 END), 0) as platform_fees_wei,
          MIN(sm.created_at) as first_mint_at,
          MAX(sm.created_at) as last_mint_at,
          MAX(sm.confirmed_at) as last_confirmed_at
        FROM collections c
        LEFT JOIN rh_nft_mints sm ON c.id = sm.collection_id
        WHERE c.id = ${collectionId}
        GROUP BY c.id, c.name, c.contract_address
      `
    } else {
      collectionStatsQuery = sql`
        SELECT
          c.id,
          c.name,
          c.contract_address,
          (SELECT COUNT(*) FROM generated_ordinals WHERE collection_id = c.id) as total_supply,
          COUNT(sm.id) as total_mints,
          COUNT(CASE WHEN sm.mint_status = 'confirmed' THEN 1 END) as confirmed_mints,
          COUNT(CASE WHEN sm.mint_status = 'failed' THEN 1 END) as failed_mints,
          COUNT(CASE WHEN sm.mint_status IN ('pending', 'building', 'awaiting_signature', 'broadcasting', 'confirming') THEN 1 END) as pending_mints,
          COUNT(DISTINCT sm.minter_wallet) as unique_minters,
          COALESCE(SUM(CASE WHEN sm.mint_status = 'confirmed' THEN NULLIF(sm.mint_price_wei, '')::numeric ELSE 0 END), 0) as revenue_wei,
          COALESCE(SUM(CASE WHEN sm.mint_status = 'confirmed' THEN NULLIF(sm.platform_fee_wei, '')::numeric ELSE 0 END), 0) as platform_fees_wei,
          MIN(sm.created_at) as first_mint_at,
          MAX(sm.created_at) as last_mint_at,
          MAX(sm.confirmed_at) as last_confirmed_at
        FROM collections c
        LEFT JOIN rh_nft_mints sm ON c.id = sm.collection_id
        WHERE c.contract_address IS NOT NULL
           OR COALESCE(c.collection_status, 'draft') IN ('launchpad', 'launchpad_live')
           OR c.is_launchpad_collection = TRUE
        GROUP BY c.id, c.name, c.contract_address
        ORDER BY last_mint_at DESC NULLS LAST
      `
    }

    const collectionStats = (await collectionStatsQuery) as any[]

    const collectionStatsWithRevenue = (collectionStats || []).map((stat: any) => ({
      ...stat,
      total_supply: parseInt(stat.total_supply || '0', 10),
      total_mints: parseInt(stat.total_mints || '0', 10),
      confirmed_mints: parseInt(stat.confirmed_mints || '0', 10),
      failed_mints: parseInt(stat.failed_mints || '0', 10),
      pending_mints: parseInt(stat.pending_mints || '0', 10),
      unique_minters: parseInt(stat.unique_minters || '0', 10),
      revenue_lamports: Number(stat.revenue_wei || 0),
      platform_fees_lamports: Number(stat.platform_fees_wei || 0),
      phase_mints: [],
    }))

    const recentMints = (await sql`
      SELECT
        sm.id,
        sm.collection_id,
        c.name as collection_name,
        sm.minter_wallet,
        sm.mint_status,
        sm.mint_tx_hash as mint_tx_signature,
        sm.contract_address,
        sm.token_id,
        CONCAT(COALESCE(sm.contract_address, ''), CASE WHEN sm.token_id IS NOT NULL THEN CONCAT(':', sm.token_id) ELSE '' END) as nft_mint_address,
        COALESCE(NULLIF(sm.mint_price_wei, '')::numeric, 0) as mint_price_lamports,
        COALESCE(NULLIF(sm.platform_fee_wei, '')::numeric, 0) as platform_fee_lamports,
        sm.created_at,
        sm.confirmed_at
      FROM rh_nft_mints sm
      JOIN collections c ON sm.collection_id = c.id
      ORDER BY sm.created_at DESC
      LIMIT 50
    `) as any[]

    return NextResponse.json({
      success: true,
      overall_stats: overallStats,
      collection_stats: collectionStatsWithRevenue,
      recent_mints: recentMints || [],
    })
  } catch (error) {
    console.error('Error fetching launchpad stats:', error)
    return NextResponse.json({ error: 'Failed to fetch launchpad stats' }, { status: 500 })
  }
}
