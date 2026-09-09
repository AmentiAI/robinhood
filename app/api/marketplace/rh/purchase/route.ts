import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/database'
import { encodeFunctionData, parseEther, type Address } from 'viem'
import { marketplaceAbi } from '@/lib/robinhood/abis'
import { getMarketplaceAddress } from '@/lib/robinhood/config'

/**
 * POST /api/marketplace/rh/purchase
 * Returns buy calldata for Marketplace.sol
 */
export async function POST(request: NextRequest) {
  if (!sql) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  try {
    const body = await request.json()
    const { wallet_address, contract_address, token_id, price_eth, listing_id, tx_hash } = body
    const marketplace = getMarketplaceAddress()
    if (!marketplace) {
      return NextResponse.json({ error: 'RH_MARKETPLACE_ADDRESS not configured' }, { status: 500 })
    }

    if (tx_hash && listing_id) {
      await sql`
        UPDATE nft_listings
        SET
          status = 'sold',
          is_active = false,
          sold_to_wallet = ${wallet_address},
          sold_tx_signature = ${tx_hash},
          sold_at = NOW(),
          updated_at = NOW()
        WHERE id = ${listing_id}::uuid
      `
      return NextResponse.json({ success: true, confirmed: true, txHash: tx_hash })
    }

    if (!contract_address || token_id == null) {
      return NextResponse.json({ error: 'contract_address and token_id required' }, { status: 400 })
    }

    const priceWei = parseEther(String(price_eth || 0))
    const data = encodeFunctionData({
      abi: marketplaceAbi,
      functionName: 'buy',
      args: [contract_address as Address, BigInt(token_id)],
    })

    return NextResponse.json({
      success: true,
      marketplace,
      buy: { to: marketplace, data, value: priceWei.toString() },
    })
  } catch (error: any) {
    console.error('[marketplace/rh/purchase]', error)
    return NextResponse.json({ error: error?.message || 'Purchase failed' }, { status: 500 })
  }
}
