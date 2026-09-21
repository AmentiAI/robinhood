/**
 * Generate 128 ETH wallets and insert addresses into site_whitelist.
 * Private keys are written to scripts/generated-whitelist-wallets.json (gitignored).
 *
 * Usage: node scripts/generate-and-whitelist-wallets.js
 */
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { Wallet } = require('ethers')
const { Pool } = require('pg')

const COUNT = 128
const OUT_FILE = path.join(__dirname, 'generated-whitelist-wallets.json')

async function main() {
  if (!process.env.NEON_DATABASE) {
    throw new Error('NEON_DATABASE is not set')
  }

  console.log(`Generating ${COUNT} ETH wallets...`)
  const wallets = []
  for (let i = 0; i < COUNT; i++) {
    const w = Wallet.createRandom()
    wallets.push({
      index: i + 1,
      address: w.address,
      privateKey: w.privateKey,
    })
  }

  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify(
      {
        created_at: new Date().toISOString(),
        count: wallets.length,
        warning: 'SECRET — do not commit or share. Contains private keys.',
        wallets,
      },
      null,
      2
    ),
    { mode: 0o600 }
  )
  console.log(`Saved keypairs → ${OUT_FILE}`)

  const pool = new Pool({
    connectionString: process.env.NEON_DATABASE,
    ssl: { rejectUnauthorized: false },
  })

  await pool.query(`
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
  `)
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_site_whitelist_wallet
    ON site_whitelist (LOWER(wallet_address))
  `)

  let inserted = 0
  let skipped = 0

  for (const w of wallets) {
    const exists = await pool.query(
      `SELECT 1 FROM site_whitelist WHERE LOWER(wallet_address) = LOWER($1) LIMIT 1`,
      [w.address]
    )
    if (exists.rowCount > 0) {
      skipped++
      continue
    }

    await pool.query(
      `INSERT INTO site_whitelist (wallet_address, note, status)
       VALUES ($1, $2, 'pending')`,
      [w.address, 'auto-generated seed wallet']
    )
    inserted++
  }

  const total = await pool.query(`SELECT COUNT(*)::int AS c FROM site_whitelist`)
  const generated = await pool.query(
    `SELECT COUNT(*)::int AS c FROM site_whitelist WHERE note = 'auto-generated seed wallet'`
  )

  console.log(`Inserted: ${inserted}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Auto-generated on whitelist: ${generated.rows[0].c}`)
  console.log(`Total whitelist entries: ${total.rows[0].c}`)
  console.log('Done.')

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
