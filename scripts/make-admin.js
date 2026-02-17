#!/usr/bin/env node

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const ADMIN_WALLET = 'D3SNZXJwsMVqJM7qBMUZ8w2rnDhNiLbSs2TT1Ez8GiLJ';

async function makeAdmin() {
  const client = new Client({
    connectionString: process.env.NEON_DATABASE,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected\n');

    // Check if profiles table has is_admin column
    console.log('📋 Checking for is_admin column...');
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'is_admin'
    `);

    if (columnCheck.rows.length === 0) {
      console.log('➕ Adding is_admin column to profiles...');
      await client.query(`
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
      `);
      console.log('   ✅ is_admin column added\n');
    } else {
      console.log('   ✅ is_admin column already exists\n');
    }

    // Check if profile exists
    console.log(`👤 Checking for profile: ${ADMIN_WALLET}...`);
    const profileCheck = await client.query(`
      SELECT wallet_address, is_admin 
      FROM profiles 
      WHERE wallet_address = $1
    `, [ADMIN_WALLET]);

    if (profileCheck.rows.length === 0) {
      console.log('➕ Creating profile...');
      await client.query(`
        INSERT INTO profiles (wallet_address, username, is_admin, wallet_type)
        VALUES ($1, $2, true, 'sol')
      `, [ADMIN_WALLET, `admin_${ADMIN_WALLET.slice(0, 8)}`]);
      console.log('   ✅ Profile created with admin status\n');
    } else {
      const profile = profileCheck.rows[0];
      if (profile.is_admin) {
        console.log('   ✅ Already an admin\n');
      } else {
        console.log('🔧 Setting admin status...');
        await client.query(`
          UPDATE profiles 
          SET is_admin = true 
          WHERE wallet_address = $1
        `, [ADMIN_WALLET]);
        console.log('   ✅ Admin status granted\n');
      }
    }

    // Verify admin status
    console.log('🔍 Verifying admin status...');
    const verify = await client.query(`
      SELECT wallet_address, username, is_admin, wallet_type 
      FROM profiles 
      WHERE wallet_address = $1
    `, [ADMIN_WALLET]);

    if (verify.rows.length > 0) {
      const profile = verify.rows[0];
      console.log('📊 Profile details:');
      console.log(`   - Wallet: ${profile.wallet_address}`);
      console.log(`   - Username: ${profile.username || 'Not set'}`);
      console.log(`   - Wallet Type: ${profile.wallet_type || 'sol'}`);
      console.log(`   - Is Admin: ${profile.is_admin ? '✅ YES' : '❌ NO'}`);
    }

    console.log('\n🎉 Admin setup complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Connection closed');
  }
}

makeAdmin().catch(console.error);
