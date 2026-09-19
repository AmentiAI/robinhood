require('dotenv').config()
const { Pool } = require('pg')

const wallet = '0x19e135Fc29C7559C08C446d5F702467Cca429DFb'
const amount = Number(process.argv[2] || '2.45')

async function main() {
  const pool = new Pool({
    connectionString: process.env.NEON_DATABASE,
    ssl: { rejectUnauthorized: false },
  })

  await pool.query(
    `UPDATE credits SET credits = credits + $1, updated_at = NOW()
     WHERE LOWER(wallet_address) = LOWER($2)`,
    [amount, wallet]
  )
  await pool.query(
    `INSERT INTO credit_transactions (wallet_address, amount, transaction_type, description)
     VALUES ($1, $2, 'refund', $3)`,
    [wallet, amount, 'Manual refund: failed AI generation (OpenAI billing)']
  )
  const r = await pool.query(
    `SELECT credits FROM credits WHERE LOWER(wallet_address) = LOWER($1)`,
    [wallet]
  )
  console.log('Refunded', amount, '— balance now', r.rows[0]?.credits)
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
