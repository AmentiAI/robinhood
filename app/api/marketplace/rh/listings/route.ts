import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/database'

/**
 * GET /api/marketplace/rh/listings
 * Active Robinhood Chain marketplace listings
 */
export async function GET(request: NextRequest) {
  if (!sql) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'

    const listings = (await sql`
      SELECT
        id,
        mint_address,
        title,
        price_lamports,
        price_sol,
        seller_wallet,
        image_url,
        status,
        created_at,
        metadata
      FROM nft_listings
      WHERE status = ${status}
      ORDER BY created_at DESC
      LIMIT 200
    `) as any[]

    return NextResponse.json({
      listings: (listings || []).map((l) => ({
        ...l,
        price_eth: Number(l.price_sol || 0),
        contract_token: l.mint_address,
        contract_address: l.metadata?.contract_address || String(l.mint_address || '').split(':')[0],
        token_id: l.metadata?.token_id || String(l.mint_address || '').split(':')[1],
      })),
    })
  } catch (error: any) {
    console.error('[marketplace/rh/listings]', error)
    return NextResponse.json({ error: error?.message || 'Failed to load listings' }, { status: 500 })
  }
}
