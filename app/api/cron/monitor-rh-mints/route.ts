import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/database'
import { getPublicClient } from '@/lib/robinhood/client'
import { type Hex } from 'viem'

/**
 * Cron: confirm pending Robinhood Chain mints and release stale phase slots.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!sql) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  try {
    const publicClient = getPublicClient()

    // Cancel stale awaiting_signature
    await sql`
      WITH stale AS (
        UPDATE rh_nft_mints SET mint_status = 'cancelled', updated_at = NOW()
        WHERE mint_status IN ('pending', 'building', 'awaiting_signature')
          AND created_at < NOW() - INTERVAL '10 minutes'
        RETURNING phase_id
      )
      UPDATE mint_phases SET phase_minted = GREATEST(0, COALESCE(phase_minted, 0) - sub.cnt)
      FROM (
        SELECT phase_id, COUNT(*) as cnt FROM stale WHERE phase_id IS NOT NULL GROUP BY phase_id
      ) sub
      WHERE mint_phases.id = sub.phase_id
    `

    const pending = (await sql`
      SELECT id, mint_tx_hash, phase_id, ordinal_id, collection_id
      FROM rh_nft_mints
      WHERE mint_status IN ('confirming', 'broadcasting')
        AND mint_tx_hash IS NOT NULL
      ORDER BY created_at ASC
      LIMIT 50
    `) as any[]

    let confirmed = 0
    let failed = 0

    for (const mint of pending) {
      try {
        const receipt = await publicClient.getTransactionReceipt({
          hash: mint.mint_tx_hash as Hex,
        })
        if (!receipt) continue

        if (receipt.status === 'success') {
          await sql`
            UPDATE rh_nft_mints
            SET mint_status = 'confirmed', confirmed_at = NOW(), updated_at = NOW()
            WHERE id = ${mint.id}::uuid
          `
          if (mint.ordinal_id) {
            await sql`UPDATE generated_ordinals SET is_minted = true WHERE id = ${mint.ordinal_id}::uuid`
          }
          confirmed++
        } else {
          await sql`
            UPDATE rh_nft_mints
            SET mint_status = 'failed', error_message = 'reverted', updated_at = NOW()
            WHERE id = ${mint.id}::uuid
          `
          if (mint.phase_id) {
            await sql`
              UPDATE mint_phases
              SET phase_minted = GREATEST(0, COALESCE(phase_minted, 0) - 1)
              WHERE id = ${mint.phase_id}::uuid
            `
          }
          failed++
        }
      } catch (e) {
        // receipt not available yet
      }
    }

    return NextResponse.json({ success: true, pending: pending.length, confirmed, failed })
  } catch (error: any) {
    console.error('[monitor-rh-mints]', error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
