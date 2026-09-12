import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/database'

function mapListing(l: any) {
  const meta = typeof l.metadata === 'string' ? JSON.parse(l.metadata) : l.metadata || {}
  const mint = String(l.mint_address || '')
  return {
    ...l,
    price_eth: Number(l.price_sol || 0),
    price_wei: String(l.price_lamports || meta.price_wei || '0'),
    contract_token: mint,
    contract_address: meta.contract_address || mint.split(':')[0] || null,
    token_id: meta.token_id || mint.split(':')[1] || null,
    collection_name: l.collection_name || null,
  }
}

/**
 * GET /api/marketplace/rh/listings
 * Query: status, seller_wallet, id, q, limit, offset
 */
export async function GET(request: NextRequest) {
  if (!sql) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const seller = searchParams.get('seller_wallet')
    const id = searchParams.get('id')
    const q = searchParams.get('q')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 200)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)

    if (id) {
      const rows = (await sql`
        SELECT
          l.id,
          l.mint_address,
          l.title,
          l.description,
          l.price_lamports,
          l.price_sol,
          l.seller_wallet,
          l.image_url,
          l.status,
          l.created_at,
          l.sold_at,
          l.sold_to_wallet,
          l.listing_tx_signature,
          l.sold_tx_signature,
          l.metadata,
          l.collection_id,
          c.name AS collection_name
        FROM nft_listings l
        LEFT JOIN collections c ON c.id = l.collection_id
        WHERE l.id = ${id}::uuid
        LIMIT 1
      `) as any[]

      if (!rows.length) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
      }
      return NextResponse.json({ listing: mapListing(rows[0]), listings: [mapListing(rows[0])] })
    }

    const listings = (await sql`
      SELECT
        l.id,
        l.mint_address,
        l.title,
        l.description,
        l.price_lamports,
        l.price_sol,
        l.seller_wallet,
        l.image_url,
        l.status,
        l.created_at,
        l.sold_at,
        l.sold_to_wallet,
        l.metadata,
        l.collection_id,
        c.name AS collection_name
      FROM nft_listings l
      LEFT JOIN collections c ON c.id = l.collection_id
      WHERE (${status}::text IS NULL OR l.status = ${status})
        AND (${seller}::text IS NULL OR LOWER(l.seller_wallet) = LOWER(${seller}))
        AND (
          ${q}::text IS NULL
          OR l.title ILIKE '%' || ${q} || '%'
          OR l.mint_address ILIKE '%' || ${q} || '%'
          OR c.name ILIKE '%' || ${q} || '%'
        )
      ORDER BY l.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `) as any[]

    const countRows = (await sql`
      SELECT COUNT(*)::int AS count
      FROM nft_listings l
      LEFT JOIN collections c ON c.id = l.collection_id
      WHERE (${status}::text IS NULL OR l.status = ${status})
        AND (${seller}::text IS NULL OR LOWER(l.seller_wallet) = LOWER(${seller}))
        AND (
          ${q}::text IS NULL
          OR l.title ILIKE '%' || ${q} || '%'
          OR l.mint_address ILIKE '%' || ${q} || '%'
          OR c.name ILIKE '%' || ${q} || '%'
        )
    `) as any[]

    return NextResponse.json({
      listings: (listings || []).map(mapListing),
      total: countRows[0]?.count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('[marketplace/rh/listings]', error)
    return NextResponse.json({ error: error?.message || 'Failed to load listings' }, { status: 500 })
  }
}
