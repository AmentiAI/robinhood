import { NextResponse } from 'next/server'
import { sql } from '@/lib/database'
import { checkAuthorizationServer } from '@/lib/auth/access-control'
import { getPlatformWalletAddress, getPlatformWalletBalance } from '@/lib/solana/platform-wallet'
import {
  getRobinhoodNetwork,
  getFactoryAddress,
  getMarketplaceAddress,
  getRobinhoodChain,
  getRobinhoodRpcUrl,
} from '@/lib/robinhood/config'

export async function GET(request: Request) {
  if (!sql) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet_address')
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 401 })
    }

    const authResult = await checkAuthorizationServer(walletAddress, sql)
    if (!authResult.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const mintStats = (await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE mint_status = 'confirmed')::int AS confirmed,
        COUNT(*) FILTER (WHERE mint_status IN ('pending','building','awaiting_signature','confirming','broadcasting'))::int AS pending,
        COUNT(*) FILTER (WHERE mint_status = 'failed')::int AS failed,
        COUNT(DISTINCT minter_wallet)::int AS unique_minters
      FROM rh_nft_mints
    `) as any[]

    const collectionStats = (await sql`
      SELECT
        COUNT(*) FILTER (WHERE contract_address IS NOT NULL)::int AS deployed,
        COUNT(*) FILTER (WHERE collection_status = 'launchpad_live')::int AS live,
        COUNT(*) FILTER (WHERE COALESCE(collection_status, 'draft') IN ('launchpad', 'launchpad_live'))::int AS launchpad
      FROM collections
    `) as any[]

    const listings = (await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active')::int AS active,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE status = 'sold')::int AS sold
      FROM nft_listings
    `) as any[]

    const recentMints = (await sql`
      SELECT
        m.id,
        m.collection_id,
        c.name AS collection_name,
        m.minter_wallet,
        m.mint_status,
        m.mint_tx_hash,
        m.contract_address,
        m.token_id,
        m.mint_price_wei,
        m.platform_fee_wei,
        m.created_at,
        m.confirmed_at
      FROM rh_nft_mints m
      LEFT JOIN collections c ON c.id = m.collection_id
      ORDER BY m.created_at DESC
      LIMIT 25
    `) as any[]

    const recentListings = (await sql`
      SELECT
        id,
        mint_address,
        title,
        price_sol,
        price_lamports,
        seller_wallet,
        image_url,
        status,
        created_at
      FROM nft_listings
      ORDER BY created_at DESC
      LIMIT 25
    `) as any[]

    const deployedCollections = (await sql`
      SELECT
        id,
        name,
        contract_address,
        collection_status,
        rh_chain_id,
        rh_deploy_tx,
        minted_count,
        total_supply,
        created_at
      FROM collections
      WHERE contract_address IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 50
    `) as any[]

    const address = getPlatformWalletAddress()
    const balance = await getPlatformWalletBalance()
    const chain = getRobinhoodChain()

    return NextResponse.json({
      chain: 'robinhood',
      network: getRobinhoodNetwork(),
      chainId: chain.id,
      rpcUrl: getRobinhoodRpcUrl(),
      explorer: chain.blockExplorers.default.url,
      factory: getFactoryAddress(),
      marketplace: getMarketplaceAddress(),
      platformWallet: { address, balanceEth: balance },
      mints: mintStats[0] || { total: 0, confirmed: 0, pending: 0, failed: 0, unique_minters: 0 },
      collections: collectionStats[0] || { deployed: 0, live: 0, launchpad: 0 },
      marketplaceStats: listings[0] || { active: 0, pending: 0, sold: 0 },
      recentMints: recentMints || [],
      recentListings: recentListings || [],
      deployedCollections: deployedCollections || [],
    })
  } catch (error: any) {
    console.error('[admin/rh/stats]', error)
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 })
  }
}
