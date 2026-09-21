import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/database'
import { isAdmin as isHardcodedAdmin } from '@/lib/auth/access-control'

async function isAdminWallet(wallet: string | null | undefined): Promise<boolean> {
  if (!wallet) return false
  if (isHardcodedAdmin(wallet)) return true
  if (!sql) return false
  try {
    const rows = (await sql`
      SELECT is_admin FROM profiles
      WHERE LOWER(wallet_address) = LOWER(${wallet})
      LIMIT 1
    `) as any[]
    return Boolean(rows[0]?.is_admin)
  } catch {
    return false
  }
}

async function ensureTable() {
  if (!sql) return
  await sql`
    CREATE TABLE IF NOT EXISTS site_whitelist (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      wallet_address TEXT NOT NULL,
      email TEXT,
      twitter TEXT,
      note TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      approved_at TIMESTAMPTZ,
      approved_by TEXT
    )
  `
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_site_whitelist_wallet
    ON site_whitelist (LOWER(wallet_address))
  `
}

async function isSiteLocked(): Promise<boolean> {
  const envLock = process.env.NEXT_PUBLIC_SITE_LOCKED
  if (envLock === 'false' || envLock === '0') return false
  // Default: locked
  if (envLock === 'true' || envLock === '1') return true

  if (!sql) return true
  try {
    const rows = (await sql`
      SELECT setting_value FROM site_settings WHERE setting_key = 'site_locked' LIMIT 1
    `) as any[]
    if (!rows.length) return true
    const v = rows[0].setting_value
    if (typeof v === 'boolean') return v
    if (typeof v === 'string') {
      const cleaned = v.replace(/^"|"$/g, '')
      return cleaned !== 'false' && cleaned !== '0'
    }
    return true
  } catch {
    return true
  }
}

export async function GET(request: NextRequest) {
  if (!sql) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  try {
    await ensureTable()
    const wallet = request.nextUrl.searchParams.get('wallet')
    const wantList = request.nextUrl.searchParams.get('list') === '1'
    const locked = await isSiteLocked()
    const admin = wallet ? await isAdminWallet(wallet) : false
    // While locked: only admins may enter. When unlocked: everyone.
    const allowed = locked ? admin : true

    let entries: { wallet_address: string; status: string; created_at: string }[] = []
    if (wantList || !wallet) {
      const rows = (await sql`
        SELECT wallet_address, status, created_at
        FROM site_whitelist
        WHERE status IN ('pending', 'approved')
        ORDER BY created_at DESC
        LIMIT 2000
      `) as any[]
      entries = (rows || []).map((r) => ({
        wallet_address: r.wallet_address,
        status: r.status,
        created_at: r.created_at,
      }))
    }

    if (!wallet) {
      return NextResponse.json({
        locked,
        allowed,
        status: null,
        entries,
        count: entries.length,
      })
    }

    const rows = (await sql`
      SELECT status, email, twitter, created_at, approved_at
      FROM site_whitelist
      WHERE LOWER(wallet_address) = LOWER(${wallet})
      LIMIT 1
    `) as any[]

    const entry = rows[0] || null
    const status = entry?.status || null

    return NextResponse.json({
      locked,
      allowed,
      status,
      isAdmin: admin,
      entries: wantList ? entries : undefined,
      count: wantList ? entries.length : undefined,
      entry: entry
        ? {
            email: entry.email,
            twitter: entry.twitter,
            created_at: entry.created_at,
            approved_at: entry.approved_at,
          }
        : null,
    })
  } catch (error: any) {
    console.error('[site-whitelist GET]', error)
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!sql) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  try {
    await ensureTable()
    const body = await request.json()
    const { wallet_address, email, twitter, action, admin_wallet } = body

    if (!wallet_address || !String(wallet_address).startsWith('0x')) {
      return NextResponse.json({ error: 'Valid 0x wallet address required' }, { status: 400 })
    }

    if (action === 'approve' || action === 'reject') {
      if (!admin_wallet || !(await isAdminWallet(admin_wallet))) {
        return NextResponse.json({ error: 'Admin only' }, { status: 403 })
      }
      const status = action === 'approve' ? 'approved' : 'rejected'
      const existing = (await sql`
        SELECT id FROM site_whitelist WHERE LOWER(wallet_address) = LOWER(${wallet_address}) LIMIT 1
      `) as any[]

      if (existing.length) {
        await sql`
          UPDATE site_whitelist SET
            status = ${status},
            approved_at = ${status === 'approved' ? new Date().toISOString() : null},
            approved_by = ${admin_wallet},
            updated_at = NOW()
          WHERE LOWER(wallet_address) = LOWER(${wallet_address})
        `
      } else {
        await sql`
          INSERT INTO site_whitelist (wallet_address, status, approved_at, approved_by)
          VALUES (
            ${wallet_address},
            ${status},
            ${status === 'approved' ? new Date().toISOString() : null},
            ${admin_wallet}
          )
        `
      }
      return NextResponse.json({ success: true, status })
    }

    const normalizedWallet = String(wallet_address).trim()
    if (!/^0x[a-fA-F0-9]{40}$/.test(normalizedWallet)) {
      return NextResponse.json({ error: 'Valid 0x wallet address required' }, { status: 400 })
    }

    const existing = (await sql`
      SELECT status FROM site_whitelist
      WHERE LOWER(wallet_address) = LOWER(${normalizedWallet})
      LIMIT 1
    `) as any[]

    // One application per wallet — no resubmits or contact updates
    if (existing.length) {
      const existingStatus = existing[0]?.status || 'pending'
      return NextResponse.json(
        {
          error: 'This wallet has already applied. Only one submission is allowed.',
          status: existingStatus,
          already_applied: true,
        },
        { status: 409 }
      )
    }

    if (!twitter || !String(twitter).trim()) {
      return NextResponse.json({ error: 'X (Twitter) handle required' }, { status: 400 })
    }

    const status = 'pending'
    await sql`
      INSERT INTO site_whitelist (wallet_address, email, twitter, status)
      VALUES (
        ${normalizedWallet},
        ${email || null},
        ${twitter || null},
        ${status}
      )
    `

    return NextResponse.json({
      success: true,
      status,
      message: "You're on the whitelist — free mint coming soon",
    })
  } catch (error: any) {
    console.error('[site-whitelist POST]', error)
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 })
  }
}
