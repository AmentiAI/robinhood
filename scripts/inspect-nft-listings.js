require('dotenv').config()
const { Pool } = require('pg')
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE,
  ssl: { rejectUnauthorized: false },
})

async function main() {
  const r = await pool.query(`
    SELECT column_name, data_type, character_maximum_length
    FROM information_schema.columns
    WHERE table_name = 'nft_listings'
    ORDER BY ordinal_position
  `)
  console.log(JSON.stringify(r.rows, null, 2))
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
