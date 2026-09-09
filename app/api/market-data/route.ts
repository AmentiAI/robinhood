import { NextResponse } from 'next/server'
import { sql } from '@/lib/database'

// Public API to get ETH market data for header display

export async function GET() {
  try {
    if (!sql) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'Database not available',
      })
    }

    const result = (await sql`
      SELECT setting_value, updated_at
      FROM site_settings
      WHERE setting_key = 'eth_market_data' OR setting_key = 'sol_market_data'
      ORDER BY CASE WHEN setting_key = 'eth_market_data' THEN 0 ELSE 1 END
      LIMIT 1
    `) as any[]

    if (Array.isArray(result) && result.length > 0 && result[0].setting_key === 'eth_market_data') {
      const data = result[0].setting_value
      return NextResponse.json({
        success: true,
        data: typeof data === 'string' ? JSON.parse(data) : data,
        cached: true,
        updated_at: result[0].updated_at,
      })
    }

    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true',
        { next: { revalidate: 300 } }
      )
      if (response.ok) {
        const data = await response.json()
        if (data.ethereum) {
          return NextResponse.json({
            success: true,
            data: {
              price_usd: data.ethereum.usd || 0,
              change_24h: data.ethereum.usd_24h_change || 0,
              updated_at: new Date().toISOString(),
              symbol: 'ETH',
            },
            cached: false,
          })
        }
      }
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      data: null,
      message: 'Market data not yet available',
    })
  } catch (error: any) {
    console.error('[Market Data API] Error:', error)
    return NextResponse.json({
      success: true,
      data: null,
      error: error.message,
    })
  }
}
