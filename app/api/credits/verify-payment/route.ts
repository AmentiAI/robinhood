import { NextRequest, NextResponse } from 'next/server'
import { addCredits } from '@/lib/credits/credits'
import { sql } from '@/lib/database'
import { getPublicClient } from '@/lib/robinhood/client'
import { getPlatformWalletAddress } from '@/lib/robinhood/platform-wallet'
import { formatEther, type Hex, type Address } from 'viem'

async function checkRhEthTransaction(txid: string, expectedTo: string): Promise<{
  txid: string
  confirmations: number
  confirmed: boolean
  amount?: number
} | null> {
  try {
    const client = getPublicClient()
    const receipt = await client.getTransactionReceipt({ hash: txid as Hex })
    if (!receipt) return { txid, confirmations: 0, confirmed: false }

    if (receipt.status !== 'success') {
      return { txid, confirmations: 0, confirmed: false }
    }

    const tx = await client.getTransaction({ hash: txid as Hex })
    const to = (tx.to || '').toLowerCase()
    const amount = Number(formatEther(tx.value || 0n))
    const matches = !expectedTo || to === expectedTo.toLowerCase()

    return {
      txid,
      confirmations: 1,
      confirmed: matches,
      amount: matches ? amount : 0,
    }
  } catch (error) {
    console.error('Error checking RH ETH tx:', error)
    return null
  }
}

async function awardCredits(
  walletAddress: string,
  creditsAmount: number,
  txid: string
): Promise<boolean> {
  try {
    await addCredits(
      walletAddress,
      creditsAmount,
      `Credit purchase - ${creditsAmount} credits (ETH/RH)`,
      txid
    )
    return true
  } catch (creditError: any) {
    console.error(`[Payment Verification] Error via addCredits:`, creditError?.message)
    try {
      const { getOrCreateCredits } = await import('@/lib/credits/credits')
      await getOrCreateCredits(walletAddress)
      const existingTx = (await sql`
        SELECT id FROM credit_transactions
        WHERE payment_txid = ${txid} AND wallet_address = ${walletAddress} AND amount > 0
        LIMIT 1
      `) as any[]
      if (existingTx.length > 0) return true
      await sql`
        UPDATE credits SET credits = credits + ${creditsAmount}, updated_at = CURRENT_TIMESTAMP
        WHERE wallet_address = ${walletAddress}
      `
      await sql`
        INSERT INTO credit_transactions (wallet_address, amount, transaction_type, description, payment_txid)
        VALUES (${walletAddress}, ${creditsAmount}, 'purchase', ${`Credit purchase - ${creditsAmount} credits (ETH/RH)`}, ${txid})
      `
      return true
    } catch {
      return false
    }
  }
}

async function verifyAndProcessPayment(payment: any, walletAddress: string) {
  if (!payment.payment_txid) {
    return { status: 'pending', confirmations: 0, message: 'Waiting for payment...' }
  }

  const platform = payment.payment_address || getPlatformWalletAddress() || ''
  const tx = await checkRhEthTransaction(payment.payment_txid, platform)
  if (!tx) {
    return { status: 'pending', confirmations: 0, message: 'Waiting for transaction...' }
  }

  await sql`UPDATE pending_payments SET confirmations = ${tx.confirmations} WHERE id = ${payment.id}::uuid`

  const expectedAmount = parseFloat(payment.payment_amount || payment.bitcoin_amount)
  const receivedAmount = tx.amount || 0
  const amountMatches = receivedAmount >= expectedAmount * 0.99

  if (tx.confirmed && payment.status === 'pending' && (amountMatches || receivedAmount === 0)) {
    if (!payment.payment_txid || payment.payment_txid !== tx.txid) {
      await sql`UPDATE pending_payments SET payment_txid = ${tx.txid} WHERE id = ${payment.id}::uuid`
    }

    await awardCredits(walletAddress, payment.credits_amount, tx.txid)
    await sql`UPDATE pending_payments SET status = 'completed' WHERE id = ${payment.id}::uuid`

    return {
      status: 'completed',
      success: true,
      confirmations: tx.confirmations,
      txid: tx.txid,
      creditsAwarded: payment.credits_amount,
    }
  }

  return {
    status: 'pending',
    confirmations: tx.confirmations,
    txid: tx.txid,
    requiredConfirmations: 1,
    message: 'Transaction detected, waiting for confirmation...',
  }
}

export async function POST(request: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { payment_id, wallet_address, txid, tx_hash } = body
    const hash = tx_hash || txid

    if (!payment_id || !wallet_address) {
      return NextResponse.json({ error: 'Payment ID and wallet address are required' }, { status: 400 })
    }

    const pendingPayments = (await sql`
      SELECT * FROM pending_payments
      WHERE id = ${payment_id}::uuid AND wallet_address = ${wallet_address} AND status = 'pending'
      LIMIT 1
    `) as any[]

    if (!Array.isArray(pendingPayments) || pendingPayments.length === 0) {
      return NextResponse.json({ error: 'Payment not found or already processed' }, { status: 404 })
    }

    const payment = pendingPayments[0]

    if (new Date(payment.expires_at) < new Date()) {
      await sql`UPDATE pending_payments SET status = 'expired' WHERE id = ${payment.id}::uuid`
      return NextResponse.json({ error: 'Payment has expired' }, { status: 400 })
    }

    if (hash && typeof hash === 'string' && !payment.payment_txid) {
      await sql`UPDATE pending_payments SET payment_txid = ${hash} WHERE id = ${payment.id}::uuid`
      payment.payment_txid = hash
    }

    const result = await verifyAndProcessPayment(payment, wallet_address)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error verifying payment:', error)
    return NextResponse.json({ error: error?.message || 'Failed to verify payment' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const payment_id = searchParams.get('payment_id')
    const wallet_address = searchParams.get('wallet_address')

    if (!payment_id || !wallet_address) {
      return NextResponse.json({ error: 'Payment ID and wallet address are required' }, { status: 400 })
    }

    const paymentsResult = (await sql`
      SELECT * FROM pending_payments
      WHERE id = ${payment_id}::uuid AND wallet_address = ${wallet_address}
      LIMIT 1
    `) as any[]

    if (!Array.isArray(paymentsResult) || paymentsResult.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const payment = paymentsResult[0]

    if (payment.status === 'completed') {
      return NextResponse.json({
        status: 'completed',
        success: true,
        confirmations: payment.confirmations || 0,
        txid: payment.payment_txid,
        creditsAwarded: payment.credits_amount,
      })
    }

    if (new Date(payment.expires_at) < new Date()) {
      return NextResponse.json({ status: 'expired', message: 'Payment expired' })
    }

    const result = await verifyAndProcessPayment(payment, wallet_address)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to verify payment' }, { status: 500 })
  }
}
