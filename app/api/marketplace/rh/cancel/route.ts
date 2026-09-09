import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/database'
import { encodeFunctionData, type Address } from 'viem'
import { marketplaceAbi } from '@/lib/robinhood/abis'
import { getMarketplaceAddress } from '@/lib/robinhood/config'

export async function POST(request: NextRequest) {
  if (!sql) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  try {
    const body = await request.json()
    const { wallet_address, contract_address, token_id, listing_id, tx_hash } = body
    const marketplace = getMarketplaceAddress()
    if (!marketplace) {
      return NextResponse.json({ error: 'RH_MARKETPLACE_ADDRESS not configured' }, { status: 500 })
    }

    if (tx_hash && listing_id) {
      await sql`
        UPDATE nft_listings SET status = 'cancelled', is_active = false, updated_at = NOW()
        WHERE id = ${listing_id}::uuid AND seller_wallet ILIKE ${wallet_address}
      `
      return NextResponse.json({ success: true, confirmed: true })
    }

    const data = encodeFunctionData({
      abi: marketplaceAbi,
      functionName: 'cancel',
      args: [contract_address as Address, BigInt(token_id)],
    })

    return NextResponse.json({
      success: true,
      cancel: { to: marketplace, data },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Cancel failed' }, { status: 500 })
  }
}
