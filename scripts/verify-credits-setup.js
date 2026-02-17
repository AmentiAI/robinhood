#!/usr/bin/env node

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const DATABASE_URL = process.env.NEON_DATABASE;

if (!DATABASE_URL) {
  console.error('❌ NEON_DATABASE environment variable is not set');
  process.exit(1);
}

async function verifySetup() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to Neon database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Check if tables exist
    console.log('📋 Checking for required tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('credits', 'credit_transactions', 'pending_payments')
      ORDER BY table_name
    `);

    const tableNames = tables.rows.map(r => r.table_name);
    
    if (tableNames.length === 0) {
      console.log('❌ No credit tables found!');
      console.log('\n🔧 Run this command to set up the tables:');
      console.log('   npm run db:credits\n');
      process.exit(1);
    }

    console.log('✅ Found tables:');
    tableNames.forEach(name => console.log(`   - ${name}`));

    // Check pending_payments columns
    console.log('\n📋 Checking pending_payments columns...');
    const columns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pending_payments' 
      AND column_name IN ('payment_type', 'network', 'payment_amount', 'payment_usd')
      ORDER BY column_name
    `);

    const columnNames = columns.rows.map(r => r.column_name);

    if (columnNames.length < 4) {
      console.log('⚠️  Missing Solana payment columns!');
      console.log('   Found:', columnNames.join(', '));
      console.log('\n🔧 Run this command to add Solana support:');
      console.log('   npm run db:solana\n');
    } else {
      console.log('✅ Solana payment columns found:');
      columnNames.forEach(name => console.log(`   - ${name}`));
    }

    // Show all pending_payments columns
    console.log('\n📊 All pending_payments columns:');
    const allColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'pending_payments'
      ORDER BY ordinal_position
    `);

    allColumns.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)';
      console.log(`   - ${col.column_name}: ${col.data_type} ${nullable}`);
    });

    // Check indexes
    console.log('\n🔍 Checking indexes...');
    const indexes = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'pending_payments'
      AND indexname LIKE '%payment_type%' OR indexname LIKE '%network%'
    `);

    if (indexes.rows.length > 0) {
      console.log('✅ Solana indexes found:');
      indexes.rows.forEach(idx => console.log(`   - ${idx.indexname}`));
    } else {
      console.log('⚠️  No Solana-specific indexes found');
    }

    // Count records
    console.log('\n📈 Database statistics:');
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM credits) as users_with_credits,
        (SELECT COUNT(*) FROM credit_transactions) as total_transactions,
        (SELECT COUNT(*) FROM pending_payments) as pending_payments,
        (SELECT COUNT(*) FROM pending_payments WHERE status = 'pending') as active_pending
    `);

    const s = stats.rows[0];
    console.log(`   - Users with credits: ${s.users_with_credits}`);
    console.log(`   - Total transactions: ${s.total_transactions}`);
    console.log(`   - Pending payments: ${s.pending_payments}`);
    console.log(`   - Active pending: ${s.active_pending}`);

    console.log('\n🎉 Credits system verification complete!');
    console.log('✨ Database is ready for Solana credit purchases\n');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  verifySetup().catch(console.error);
}

module.exports = { verifySetup };
