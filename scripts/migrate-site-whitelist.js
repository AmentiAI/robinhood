require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE,
  ssl: { rejectUnauthorized: false },
})

async function main() {
  const sql = fs.readFileSync(
    path.join(__dirname, 'migrations', '202_site_whitelist.sql'),
    'utf8'
  )
  await pool.query(sql)

  // Seed known admin wallets as approved
  const admins = [
    '0x19e135Fc29C7559C08C446d5F702467Cca429DFb',
    process.env.RH_PLATFORM_WALLET,
  ].filter(Boolean)

  for (const wallet of admins) {
    await pool.query(
      `INSERT INTO site_whitelist (wallet_address, status, note, approved_at, approved_by)
       VALUES ($1, 'approved', 'seeded admin', NOW(), 'system')
       ON CONFLICT ((LOWER(wallet_address))) DO UPDATE
         SET status = 'approved', approved_at = COALESCE(site_whitelist.approved_at, NOW()), updated_at = NOW()`,
      [wallet]
    )
  }

  console.log('site_whitelist migration OK; seeded', admins.length, 'admins')
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
