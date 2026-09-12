import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/database'
import { checkAuthorizationServer } from '@/lib/auth/access-control'

export async function GET(request: NextRequest) {
  if (!sql) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  try {
    const wallet = request.nextUrl.searchParams.get('wallet_address')
    const status = request.nextUrl.searchParams.get('status') || 'pending'

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 401 })
    }

    const auth = await checkAuthorizationServer(wallet, sql)
    if (!auth.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const entries =
      status === 'all'
        ? ((await sql`
            SELECT id, wallet_address, email, twitter, status, created_at, approved_at
            FROM site_whitelist
            ORDER BY created_at DESC
            LIMIT 200
          `) as any[])
        : ((await sql`
            SELECT id, wallet_address, email, twitter, status, created_at, approved_at
            FROM site_whitelist
            WHERE status = ${status}
            ORDER BY created_at DESC
            LIMIT 200
          `) as any[])

    return NextResponse.json({ entries: entries || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 })
  }
}
