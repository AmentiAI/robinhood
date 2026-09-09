import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/database'
import { encodeFunctionData, type Address, type Hex } from 'viem'
import { collectionFactoryAbi } from '@/lib/robinhood/abis'
import { getFactoryAddress, getRobinhoodChain } from '@/lib/robinhood/config'
import { getPublicClient } from '@/lib/robinhood/client'

/**
 * POST /api/collections/[id]/deploy/create-rh-collection
 * Returns calldata for the creator to deploy via CollectionFactory on Robinhood Chain.
 * Optional body.tx_hash: if provided, indexes the deployed contract address from the receipt.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!sql) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 })
  }

  try {
    const { id: collectionId } = await params
    const body = await request.json().catch(() => ({}))
    const { wallet_address, name, symbol, max_supply, base_uri, tx_hash } = body

    const factory = getFactoryAddress()
    if (!factory) {
      return NextResponse.json(
        { error: 'RH_FACTORY_ADDRESS not configured. Deploy contracts first.' },
        { status: 500 }
      )
    }

    const collections = (await sql`
      SELECT id, name, symbol, supply, contract_address, owner_wallet
      FROM collections WHERE id = ${collectionId}::uuid
    `) as any[]

    if (!collections.length) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    const collection = collections[0]

    // Index existing deployment from tx
    if (tx_hash) {
      const publicClient = getPublicClient()
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx_hash as Hex })
      if (receipt.status !== 'success') {
        return NextResponse.json({ error: 'Deploy transaction failed' }, { status: 400 })
      }

      let deployedAddress: string | null = null
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === factory.toLowerCase()) {
          // CollectionCreated: topics[1]=collection, topics[2]=creator
          if (log.topics[1]) {
            deployedAddress = `0x${log.topics[1].slice(-40)}`
            break
          }
        }
      }

      // Fallback: first contract creation in receipt
      if (!deployedAddress && receipt.contractAddress) {
        deployedAddress = receipt.contractAddress
      }

      // Parse from internal create logs — CollectionCreated collection indexed
      if (!deployedAddress) {
        for (const log of receipt.logs) {
          const topic1 = log.topics?.[1]
          if (log.topics?.length >= 2 && topic1) {
            const maybe = `0x${topic1.slice(-40)}`
            if (maybe.startsWith('0x') && maybe.length === 42) {
              deployedAddress = maybe
              break
            }
          }
        }
      }

      if (!deployedAddress) {
        return NextResponse.json(
          { error: 'Could not parse collection address from receipt' },
          { status: 400 }
        )
      }

      const chain = getRobinhoodChain()
      await sql`
        UPDATE collections SET
          contract_address = ${deployedAddress},
          rh_chain_id = ${chain.id},
          rh_deploy_tx = ${tx_hash},
          rh_factory_address = ${factory},
          deployment_status = 'deployed',
          deployed_at = NOW(),
          deployed_by = ${wallet_address || collection.owner_wallet}
        WHERE id = ${collectionId}::uuid
      `

      return NextResponse.json({
        success: true,
        contractAddress: deployedAddress,
        txHash: tx_hash,
        chainId: chain.id,
      })
    }

    const collectionName = name || collection.name || 'Collection'
    const collectionSymbol = symbol || collection.symbol || 'ORD'
    const maxSupply = BigInt(max_supply || collection.supply || 10000)
    const baseURI = base_uri || ''

    const data = encodeFunctionData({
      abi: collectionFactoryAbi,
      functionName: 'createCollection',
      args: [collectionName, collectionSymbol, baseURI, maxSupply],
    })

    const chain = getRobinhoodChain()

    return NextResponse.json({
      success: true,
      chainId: chain.id,
      factoryAddress: factory,
      to: factory,
      data,
      args: {
        name: collectionName,
        symbol: collectionSymbol,
        baseURI,
        maxSupply: maxSupply.toString(),
      },
    })
  } catch (error: any) {
    console.error('[create-rh-collection]', error)
    return NextResponse.json({ error: error?.message || 'Deploy failed' }, { status: 500 })
  }
}
