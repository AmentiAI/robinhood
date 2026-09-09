require('dotenv').config()
const { Pool } = require('pg')

const addr = '0x19e135Fc29C7559C08C446d5F702467Cca429DFb'
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE,
  ssl: { rejectUnauthorized: false },
})

async function main() {
  const existing = await pool.query(
    `SELECT wallet_address, username, is_admin FROM profiles WHERE LOWER(wallet_address) = LOWER($1) LIMIT 1`,
    [addr]
  )

  if (existing.rowCount > 0) {
    const upd = await pool.query(
      `UPDATE profiles SET is_admin = true, updated_at = NOW() WHERE LOWER(wallet_address) = LOWER($1)
       RETURNING wallet_address, username, is_admin`,
      [addr]
    )
    console.log('UPDATED', upd.rows[0])
  } else {
    const ins = await pool.query(
      `INSERT INTO profiles (wallet_address, wallet_type, is_admin, created_at, updated_at)
       VALUES ($1, 'eth', true, NOW(), NOW())
       ON CONFLICT (wallet_address) DO UPDATE SET is_admin = true, updated_at = NOW()
       RETURNING wallet_address, username, is_admin`,
      [addr]
    )
    console.log('INSERTED', ins.rows[0])
  }

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
